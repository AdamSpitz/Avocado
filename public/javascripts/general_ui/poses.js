avocado.transporter.module.create('general_ui/poses', function(requires) {

requires('general_ui/basic_morph_mixins');
requires('core/directions');

}, function(thisModule) {


thisModule.addSlots(avocado, function(add) {

  add.creator('poses', {}, {category: ['ui', 'poses']});

});


thisModule.addSlots(avocado.morphMixins.Morph, function(add) {

  add.method('poseManager', function () {
    if (! this._poseManager) {
      this._poseManager = Object.newChildOf(avocado.poses.manager, this);
      reflect(this).slotAt('_poseManager').setInitializationExpression('null');
    }
    return this._poseManager;
  }, {category: ['poses']});

  add.method('posers', function () {
    return this.allPotentialPosers().reject(function(m) { return m.shouldIgnorePoses(); }).toArray();
  }, {category: ['poses']});

  add.method('allPotentialPosers', function () {
    return this.submorphEnumerator();
  });

  add.method('shouldIgnorePoses', function () {
    if (this._layout && typeof(this._layout.shouldIgnorePoses) === 'function') {
      return this._layout.shouldIgnorePoses();
    } else {
      return false;
    }
  }, {category: ['poses']});

  add.method('constructUIStateMemento', function () {
    // override constructUIStateMemento and assumeUIState, or uiStateParts, in children if you want them to be recalled in a particular state
    
    if (this.partsOfUIState) {
      var parts = typeof(this.partsOfUIState) === 'function' ? this.partsOfUIState() : this.partsOfUIState;
      var uiState = {};
      reflect(parts).normalSlots().each(function(slot) {
        var partName = slot.name();
        var part = slot.contents().reflectee();
        if (part) {
          if (!(part.isMorph) && part.collection && part.keyOf && part.getPartWithKey) {
            uiState[partName] = part.collection.map(function(elem) {
              return { key: part.keyOf(elem), uiState: elem.constructUIStateMemento() };
            });
          } else {
            uiState[partName] = part.constructUIStateMemento();
          }
        }
      });
      return uiState;
    }
    
    if (this._layout && typeof(this._layout.constructUIStateMemento) === 'function') {
      return this._layout.constructUIStateMemento(this);
    }
    
    return null;
  }, {category: ['poses']});

  add.method('assumeUIState', function (uiState, callWhenDone, evt) {
    // override constructUIStateMemento and assumeUIState, or uiStateParts, in children if you want them to be recalled in a particular state

    if (this.partsOfUIState) {
      if (!uiState) { return; }
      evt = evt || Event.createFake();
      var parts = typeof(this.partsOfUIState) === 'function' ? this.partsOfUIState() : this.partsOfUIState;
      
      avocado.callbackWaiter.on(function(generateIntermediateCallback) {
        reflect(parts).normalSlots().each(function(slot) {
          var partName = slot.name();
          var part = slot.contents().reflectee();
          if (part) {
            var uiStateForThisPart = uiState[partName];
            if (typeof(uiStateForThisPart) !== 'undefined') {
              if (!(part.isMorph) && part.collection && part.keyOf && part.getPartWithKey) {
                uiStateForThisPart.each(function(elemKeyAndUIState) {
                  part.getPartWithKey(this, elemKeyAndUIState.key).assumeUIState(elemKeyAndUIState.uiState, generateIntermediateCallback());
                }.bind(this));
              } else {
                part.assumeUIState(uiStateForThisPart, generateIntermediateCallback(), evt);
              }
            }
          }
        }.bind(this));
      }, callWhenDone, "assuming UI state");
    } else if (this._layout && typeof(this._layout.assumeUIState) === 'function') {
      this._layout.assumeUIState(this, uiState, callWhenDone, evt);
    }
  }, {category: ['poses']});

  add.method('transferUIStateTo', function (otherMorph, evt) {
    otherMorph.assumeUIState(this.constructUIStateMemento());
  }, {category: ['poses']});

});


thisModule.addSlots(avocado.poses, function(add) {

  add.creator('abstract', {});

});


thisModule.addSlots(avocado.poses['abstract'], function(add) {

  add.method('create', function () {
    var c = Object.create(this);
    c.initialize.apply(c, arguments);
    return c;
  }, {category: ['creating']});

  add.method('initialize', function (name) {
    this._name = name;
  }, {category: ['creating']});

  add.method('name', function () {
    return this._name;
  }, {category: ['accessing']});

  add.method('setName', function (n) {
    this._name = n;
    return this;
  }, {category: ['accessing']});

  add.method('toString', function () {
    return this.name();
  }, {category: ['printing']});

  add.method('inspect', function () {
    return this.toString();
  }, {category: ['printing']});

  add.method('copy', function () {
    return Object.deepCopyRecursingIntoCreatorSlots(this);
  }, {category: ['printing']});

  add.method('beInDebugMode', function () {
    this._debugMode = true;
    return this;
  }, {category: ['debugging']});

  add.method('doNotAnticipateAtStart', function () {
    this._shouldNotAnticipateAtStart = true;
    return this;
  }, {category: ['animating']});

  add.method('doNotWiggleAtEnd', function () {
    this._shouldNotWiggleAtEnd = true;
    return this;
  }, {category: ['animating']});

  add.method('putInPosition', function (container, element, origin, callback) {
    if (this._shouldBeUnobtrusive) {
      var poserOrPlaceholder = element.poser;
      if (element.poser.getOwner() !== container && element.poser.world()) { // aaa what's going on here?
        poserOrPlaceholder = container.placeholderForMorph(element.poser);
      }
      var positionFromOrigin = origin.moveDownAndRightBy(element.position.x, element.position.y);
      poserOrPlaceholder.setTopLeftPosition(positionFromOrigin);
      container.addMorph(poserOrPlaceholder);
      if (callback) { callback(); }
    } else {
      if (! element.poser.world()) {
        // aaa - Not sure at all that this is a good idea. But it might be.
        element.poser.setScale(1 / container.world().getScale());
      }
      
      if (element.scale) { element.position.desiredScale = element.scale; } // aaa hack
      element.poser.ensureIsInWorld(container, element.position, true, !this._shouldNotAnticipateAtStart, !this._shouldNotWiggleAtEnd, callback);
    }
  }, {category: ['posing']});

  add.method('recreateInContainer', function (container, startingPos, callback) {
    var originalScale = container.getScale();
    var originalSpace = container.getExtent().scaleBy(originalScale);
    //var originalSpace = container.bounds().extent(); // aaa if I use this line instead of the previous line I get that annoying grows-slightly-each-time problem
    
    this._bounds = (startingPos || pt(0, 0)).extent(pt(0, 0));
    
    var elements = [];
    this.eachElement(function(e) {
      elements.push(e);
      
      e.poser.isPartOfCurrentPose = true;
      // do bad things happen if I make the uiState thing happen before moving the poser?
      if (e.uiState) { e.poser.assumeUIState(e.uiState); }
      
      // Keep track of how much space the pose is taking up, so that the pose can answer getExtent(). -- Adam, June 2011
      var poserPosition = e.position || e.poser.getPosition();
      var poserExtent   = e.extent   || e.poser.getExtent(); // aaa: haven't implemented this one yet, setting e.extent won't actually do anything
      var poserScale    = e.scale    || e.poser.getScale();
      var poserBounds   = poserPosition.extent(poserExtent.scaleBy(poserScale));
      this._bounds      = this._bounds.union(poserBounds);
      if (this._debugMode) { console.log("Adding poser with bounds: " + poserBounds + " and scale " + poserScale); }
    }.bind(this), startingPos);
    
    if (this._shouldScaleToFitWithinCurrentSpace) {
      // aaa - Shoot, this isn't going to work right if this pose is doing the animation (i.e. if _shouldBeUnobtrusive is false), because
      // the container won't know how much space its submorphs will take up until the animation is done.
      
      var currentScale = container.getScale();
      var currentBounds = this._bounds;
      var currentExternalExtent = currentBounds.extent();
      if (currentExternalExtent.isZero()) { currentExternalExtent = container.getExtent(); }
      var hs = originalSpace.x / currentExternalExtent.x;
      var vs = originalSpace.y / currentExternalExtent.y;
      
      var newExtent, newScale;
      if (hs < vs) {
        newScale = hs;
        newExtent = currentExternalExtent.withY(currentExternalExtent.x * (originalSpace.y / originalSpace.x));
      } else {
        newScale = vs;
        newExtent = currentExternalExtent.withX(currentExternalExtent.y * (originalSpace.x / originalSpace.y));
      }
      
      container.setScale(newScale);
      container.setExtent(newExtent); // needed because calling .bounds() returns a rectangle that encompasses the stickouts, but they're still stickouts

      if (this._debugMode) {
        console.log("Scaling " + container + " to fit within originalSpace: " + originalSpace + ", currentExternalExtent: " + currentExternalExtent + ", newExtent: " + newExtent + ", this._bounds.extent(): " + this._bounds.extent() + ", hs: " + hs + ", vs: " + vs + ", originalScale: " + originalScale + ", currentScale: " + currentScale);
      }
    }
    
    if (this._shouldSetExtentToEncompassWholePose) {
      container.setExtent(this._bounds.extent());
      container.minimumExtentMayHaveChanged();
    }
    
    var origin = container.getOriginAAAHack(); // necessary because in 3D-land the origin is in the centre, but I don't understand why it's not working in LK-land
    if (this._extraZHack) { origin = origin.withZ((origin.z || 0) + this._extraZHack); }
    
    avocado.callbackWaiter.on(function(createCallbackForThisOne) {
      elements.forEach(function(e) {
        var callbackForThisOne = createCallbackForThisOne();
        setTimeout(function() { // not sure this is necessary or worthwhile, but let's try it to see if it makes some animations feel smoother
          this.putInPosition(container, e, origin, callbackForThisOne);
        }.bind(this), 0);
      }.bind(this));
    }.bind(this), callback, "putting the posers in position");
  }, {category: ['posing']});

  add.method('whenDoneScaleToFitWithinCurrentSpace', function () {
    this._shouldScaleToFitWithinCurrentSpace = true;
    return this;
  }, {category: ['scaling']});

  add.method('whenDoneSetExtentToEncompassWholePose', function () {
    this._shouldSetExtentToEncompassWholePose = true;
    return this;
  }, {category: ['scaling']});

  add.method('beUnobtrusive', function () {
    this._shouldBeUnobtrusive = true;
    return this;
  });

  add.method('setDesiredPoserScale', function (s) {
    this._desiredPoserScale = s;
    return this;
  }, {category: ['accessing']});

  add.method('setPadding', function (padding) {
    this._padding = padding;
    return this;
  }, {category: ['accessing']});

  add.method('aaa_addExtraZHack', function (extraZ) {
    if (avocado.ui.is3D) { this._extraZHack = extraZ; } // aaa HACK, what's the right way to make the contents pop out?
    return this;
  });

  add.method('constructUIStateMemento', function () {
    // for compatibility with morphs - want to be able to make a pose of poses
    return null;
  }, {category: ['acting like a morph']});

  add.method('getExtent', function () {
    // for compatibility with morphs - want to be able to make a pose of poses
    return this._bounds.extent();
  }, {category: ['acting like a morph']});

  add.method('getScale', function () {
    return 1;
  }, {category: ['acting like a morph']});

  add.method('ensureIsInWorld', function (w, desiredLoc, shouldMoveToDesiredLocEvenIfAlreadyInWorld, shouldAnticipateAtStart, shouldWiggleAtEnd, functionToCallWhenDone) {
    w.poseManager().assumePose(this, desiredLoc, functionToCallWhenDone);
  }, {category: ['acting like a morph']});

});


thisModule.addSlots(avocado.poses, function(add) {

  add.creator('tree', Object.create(avocado.poses['abstract']));

});


thisModule.addSlots(avocado.poses.tree, function(add) {

  add.method('initialize', function ($super, name, foci, parentFunction, childrenFunction) {
    $super(name);
    this._foci = foci;
    this.parentOf = parentFunction;
    this.childrenOf = childrenFunction;
  });

  add.data('_indentation', 20);

  add.data('_padding', pt(5, 5), {initializeTo: 'pt(5, 5)'});

  add.method('setPosers', function (posers) {
    this._foci = posers;
    return this;
  }, {category: ['accessing']});

  add.method('ancestorsOf', function (focus) { 
    var ancestors = [];
    var ancestor = focus;
    do {
      ancestors.push(ancestor);
      ancestor = this.parentOf(ancestor);
    } while (ancestor);
    ancestors.reverse();
    return ancestors;
  });

  add.method('eachElement', function (f, startingPos) {
    var worldScale  = avocado.ui.currentWorld().getScale();
    var indentation = this._indentation / worldScale;
    var padding     = this._padding.scaleBy(1 / worldScale);
    if (!startingPos) { startingPos = padding; }
    var pos = startingPos;
    
    this._foci.forEach(function(focus) {
      this.ancestorsOf(focus).each(function(poser) {
        var poserScale = this._desiredPoserScale || poser.getScale();
        var e = {poser: poser, position: pos};
        if (this._desiredPoserScale) { e.scale = this._desiredPoserScale; }
        f(e);
        var poserSpace = poser.getExtent().scaleBy(poserScale);
        pos = pos.addXY(indentation, poserSpace.y + padding.y);
      }.bind(this));

      var newY = this.eachChildElement(focus, pos, f);
      pos = startingPos.withY(newY);
    }.bind(this));
  });

  add.method('eachChildElement', function (parentPoser, pos, f) {
    var worldScale = avocado.ui.currentWorld().getScale();
    var indentation = this._indentation / worldScale;
    var padding     = this._padding.scaleBy(1 / worldScale);
    this.childrenOf(parentPoser).each(function(child) {
      var childScale = this._desiredPoserScale || child.getScale();
      var e = {poser: child, position: pos};
      if (this._desiredPoserScale) { e.scale = this._desiredPoserScale; }
      f(e);
      var childSpace = child.getExtent().scaleBy(childScale);
      var newY = this.eachChildElement(child, pos.addXY(indentation, childSpace.y + padding.y), f);
      pos = pos.withY(newY);
    }.bind(this));
    return pos.y;
  });

});


thisModule.addSlots(avocado.poses, function(add) {

  add.creator('list', Object.create(avocado.poses['abstract']));

});


thisModule.addSlots(avocado.poses.list, function(add) {

  add.method('initialize', function ($super, name, maxExtentPtOrFn, posers) {
    $super(name);
    this._maxExtentPtOrFn = maxExtentPtOrFn;
    this._posers = posers || [];
  });

  add.method('setPosers', function (posers) {
    this._posers = posers;
    return this;
  }, {category: ['accessing']});

  add.method('setPoserModels', function (poserModels) {
    var world = avocado.ui.currentWorld();
    return this.setPosers(poserModels.map(function(m) { return world.morphFor(m); }));
  }, {category: ['accessing']});

  add.method('maxExtent', function () {
    if (typeof(this._maxExtentPtOrFn) === 'function') { return this._maxExtentPtOrFn(); }
    return this._maxExtentPtOrFn;
  });

  add.method('setMaxExtent', function (maxExtentPtOrFn) {
    this._maxExtentPtOrFn = maxExtentPtOrFn;
    return this;
  }, {category: ['accessing']});

  add.data('_direction', avocado.directions.vertical);

  add.method('setDirection', function (d) {
    this._direction = d;
    return this;
  }, {category: ['accessing']});

  add.method('eachElement', function (f, startingPos) {
    var sortedPosersToMove = this._posers.sort(function(m1, m2) {
      var n1 = m1.inspect();
      var n2 = m2.inspect();
      return n1 < n2 ? -1 : n1 === n2 ? 0 : 1;
    });

    startingPos = startingPos || pt(0,0);
    var padding = this._padding || pt(20,20);
    var pos = startingPos.addPt(padding);
    var biggestSideways = 0;
    var maxExtent = this.maxExtent();
    var maxForwards;
    var forwards = this._direction;
    var sideways = this._direction.sideways;
    if (maxExtent && !this._shouldBeSquarish) { maxForwards = forwards.coord(maxExtent) - forwards.coord(padding); }
    for (var i = 0, n = sortedPosersToMove.length; i < n; ++i) {
      var poser = sortedPosersToMove[i];
      var uiState = this.destinationUIStateFor(poser);
      if (uiState) { poser.assumeUIState(uiState); }
      var poserScale = this._desiredPoserScale || poser.getScale();
      
      var e = {poser: poser, position: pos, uiState: uiState};
      if (this._desiredPoserScale) { e.scale = this._desiredPoserScale; }
      f(e);
      
      var poserSpace = poser.getExtent().scaleBy(poserScale);
      pos = forwards.copyAndSetCoord(pos, forwards.coord(pos) + forwards.coord(poserSpace) + forwards.coord(padding));
      biggestSideways = Math.max(biggestSideways, sideways.coord(poserSpace));
      
      if (this._shouldBeSquarish && !maxForwards) {
        // If it seems like the current coord is far down enough to make the whole
        // thing come out squarish (assuming that all columns will be about as
        // wide as this one), then set this as the maxForwards.
        var desiredAspectRatio = forwards.coord(maxExtent) == 0 ? 1 : sideways.coord(maxExtent) / forwards.coord(maxExtent);
        
        var estimatedNumberOfLines = Math.ceil(n / (i + 1));
        var estimatedTotalExtentSideways = estimatedNumberOfLines * (biggestSideways + sideways.coord(padding));
        // aaa - not sure why it keeps coming out too tall; quick hack for now: compensate by multiplying by 1.2
        if (forwards.coord(pos) * desiredAspectRatio * 1.2 >= estimatedTotalExtentSideways) { maxForwards = forwards.coord(pos); }
      }
      
      if (maxForwards && forwards.coord(pos) >= maxForwards) {
        pos = forwards.point(forwards.coord(startingPos) + forwards.coord(padding), sideways.coord(pos) + biggestSideways + sideways.coord(padding));
      }
    }
  });

  add.method('beCollapsing', function () {
    this._shouldBeCollapsing = true;
    return this;
  });

  add.method('beSquarish', function () {
    this._shouldBeSquarish = true;
    return this;
  });

  add.method('destinationUIStateFor', function (poser) {
    if (this._shouldBeCollapsing) {
      var uiState = poser.constructUIStateMemento();
      if (uiState) { uiState.isExpanded = false; }
      return uiState;
    } else {
      // just use whatever state it's in now
      return null;
    }
  });

});


thisModule.addSlots(avocado.poses, function(add) {

  add.creator('row', Object.create(avocado.poses['abstract']));

});


thisModule.addSlots(avocado.poses.row, function(add) {

  add.method('initialize', function ($super, name, posers) {
    $super(name);
    this._posers = posers;
  });

  add.method('eachElement', function (f, startingPos) {
    var sortedPosersToMove = this._posers.sort(function(m1, m2) {
      var n1 = m1.inspect();
      var n2 = m2.inspect();
      return n1 < n2 ? -1 : n1 === n2 ? 0 : 1;
    });

    var padding = pt(0,0);
    var pos = startingPos || pt(0,0);
    
    for (var i = 0, n = sortedPosersToMove.length; i < n; ++i) {
      var poser = sortedPosersToMove[i];
      f({poser: poser, position: pos});
      var poserSpace = poser.getExtent().scaleBy(poser.getScale());
      pos = pos.withX(pos.x + poserSpace.x + padding.x);
    }
  });

});


thisModule.addSlots(avocado.poses, function(add) {

  add.creator('snapshot', Object.create(avocado.poses['abstract']));

  add.creator('manager', {});

  add.creator('layout', {});

  add.method('addGlobalCommandsTo', function (menu) {
    avocado.ui.currentWorld().poseManager().addGlobalCommandsTo(menu);
  }, {category: ['menu']});

  add.method('makeMorphsBecomeDirectSubmorphOfWorld', function (world, morphs) {
    var owners = [];
    morphs.forEach(function(m) { var o = m.getOwner(); if (!owners.include(o)) { owners.push(o); }});
    
    var layoutBatcherUppers = [];
    owners.forEach(function(o) {
      layoutBatcherUppers.push(o.layoutRejiggeringBatcherUpper());
      if (o._layout && o._layout.submorphReplacementBatcherUpper) { layoutBatcherUppers.push(o._layout.submorphReplacementBatcherUpper()); }
    });
    
    try {
      layoutBatcherUppers.forEach(function(bu) { bu.start(); });

      morphs.forEach(function(m) {
        // necessary so that the pose can know the correct final extent of the morphToShow when calculating positions
        m.becomeDirectSubmorphOfWorld(world);

        // aaa - hack to make the really-small-text disappear as desired
        var p = m._placeholderMorphIJustCameFrom;
        if (p) { p.refreshContentOfMeAndSubmorphs(); }
      });
    } finally {
      layoutBatcherUppers.forEach(function(bu) { bu.stop(); });
    }
  });

});


thisModule.addSlots(avocado.poses.snapshot, function(add) {

  add.method('initialize', function ($super, name, posers) {
    $super(name);
    this._elements = [];
    posers.each(function(m) {
      if (! m.shouldIgnorePoses()) {
        this.addElement({poser: m, position: m.getPosition(), uiState: m.constructUIStateMemento()});
      }
    }.bind(this));
  });

  add.method('addElement', function (elem) {
    this._elements.push(elem);
  });

  add.method('eachElement', function (f, startingPos) {
    this._elements.each(f);
  });

  add.method('addParamsForServerMessageTo', function (params, org) {
    for (var i = 0, n = this._elements.length; i < n; ++i) {
      var elem = this._elements[i];
      // aaa - handle other kinds of posers, not just mirrors
      params["poser"   + i] = elem.poser.isMirrorMorph ? "mirror(" + org.nameOfReflecteeOf(elem.poser.mirror()) + ")" : "unknown";
      params["pos"     + i] = elem.position.toString();
      params["uiState" + i] = Object.toJSON(elem.uiState);
    }
  });

});


thisModule.addSlots(avocado.poses.manager, function(add) {

  add.method('initialize', function (container) {
    this._container = container;
  }, {category: ['creating']});

  add.method('container', function () {
    return this._container;
  }, {category: ['accessing']});

  add.method('explicitlyRememberedPoses', function () {
    return avocado.organization.current.poses();
  }, {category: ['explicitly remembering']});

  add.method('undoPoseStack', function () {
    return this._undoPoseStack || (this._undoPoseStack = []);
  }, {category: ['undo']});

  add.method('undoPoseStackIndex', function () {
    if (this._undoPoseStackIndex === undefined) { this._undoPoseStackIndex = this.undoPoseStack().size(); }
    return this._undoPoseStackIndex;
  }, {category: ['undo']});

  add.method('addToUndoPoseStack', function (pose) {
    var i = this.undoPoseStackIndex();
    var stack = this.undoPoseStack();
    stack.splice(i, stack.size() - i, pose);
    this._undoPoseStackIndex += 1;
  }, {category: ['undo']});

  add.method('canGoBackToPreviousPose', function () {
    return this.undoPoseStackIndex() > 0;
  });

  add.method('canGoForwardToNextPose', function () {
    return this.undoPoseStackIndex() < this.undoPoseStack().size() - 1;
  });

  add.method('goBackToPreviousPose', function (callWhenDone) {
    if (! this.canGoBackToPreviousPose()) { throw "there is nothing to go back to"; }

    if (this.undoPoseStackIndex() === this.undoPoseStack().size()) {
      this.addToUndoPoseStack(this.createSnapshotOfCurrentPose(avocado.organization.current.findUnusedPoseName())); // so that we can go forward to it
      this._undoPoseStackIndex -= 1; // reset the index
    }

    var pose = this.undoPoseStack()[this._undoPoseStackIndex -= 1];
    pose.recreateInContainer(this.container(), undefined, callWhenDone);
  });

  add.method('goForwardToNextPose', function (callWhenDone) {
    if (! this.canGoForwardToNextPose()) { throw "there is nothing to go forward to"; }
    var pose = this.undoPoseStack()[this._undoPoseStackIndex += 1];
    pose.recreateInContainer(this.container(), undefined, callWhenDone);
  });

  add.method('assumePose', function (pose, startingPos, callWhenDone) {
    this.addToUndoPoseStack(this.createSnapshotOfCurrentPose(avocado.organization.current.findUnusedPoseName()));
    pose.recreateInContainer(this.container(), startingPos, callWhenDone);
  }, {category: ['poses']});

  add.method('createSnapshotOfCurrentPose', function (poseName) {
    return avocado.poses.snapshot.create(poseName, this.container().posers());
  }, {category: ['taking snapshots']});

  add.method('rememberThisPose', function () {
    avocado.organization.current.promptForPoseName(function(n) {
      avocado.organization.current.rememberPose(this.createSnapshotOfCurrentPose(n));
    }.bind(this));
  }, {category: ['taking snapshots']});

  add.method('cleaningUpPose', function (posers, name) {
    return avocado.poses.list.create(name || "clean up", function() { return this.container().getExtent(); }.bind(this), posers || this.container().posers()).beCollapsing();
  }, {category: ['cleaning up']});

  add.method('rowPose', function (posers, name) {
    return avocado.poses.row.create(name || "row", posers || this.container().posers());
  }, {category: ['cleaning up']});

  add.method('listPoseOfMorphsFor', function (objects, name) {
    return avocado.poses.list.create(name).setMaxExtent(function() { return this.container().getExtent(); }.bind(this)).setPoserModels(objects);
  }, {category: ['cleaning up']});

  add.method('poseChooser', function () {
    var c = avocado.command.list.create(this);
    this.explicitlyRememberedPoses().eachValue(function(pose) {
      c.addItem([pose.name(), function(evt) { this.assumePose(pose); }]);
    }.bind(this));
    return c;
  }, {category: ['menus']});

  add.method('addGlobalCommandsTo', function (cmdList) {
    cmdList.addLine();
    
    cmdList.addItem(["clean up", function(evt) {
      this.assumePose(this.cleaningUpPose());
    }.bind(this)]);

    var poseCommands = [];
    
    poseCommands.push(["remember this pose", function(evt) {
      this.rememberThisPose();
    }.bind(this)]);

    if (this.explicitlyRememberedPoses().size() > 0) {
      poseCommands.push(["assume a pose...", function(evt) {
        avocado.ui.showMenu(this.poseChooser(), this.container(), null, evt);
      }.bind(this)]);
    }

    if (this.canGoBackToPreviousPose()) {
      poseCommands.push(["back to previous pose", function(evt) {
        this.goBackToPreviousPose();
      }.bind(this)]);
    }

    if (this.canGoForwardToNextPose()) {
      poseCommands.push(["forward to next pose", function(evt) {
        this.goForwardToNextPose();
      }.bind(this)]);
    }
    
    cmdList.addItem(["poses...", poseCommands]);
  }, {category: ['menus']});

});


thisModule.addSlots(avocado.poses.layout, function(add) {

  add.method('initialize', function (pose) {
    this._pose = pose;
  }, {category: ['creating']});

  add.method('pose', function () {
    return this._pose;
  }, {category: ['accessing']});

  add.method('isAffectedBy', function (operation, morph) {
    return ! morph.shouldIgnorePoses();
  }, {category: ['layout']});

  add.method('dismissMorphs', function (morphsToDismiss, callWhenDone) {
    avocado.callbackWaiter.on(function(createCallbackForDismissingThisOne) {
      morphsToDismiss.forEach(function(morphToDismiss) {
        var callbackForDismissingThisOne = createCallbackForDismissingThisOne();
        setTimeout(function() { morphToDismiss.putBackOrDismiss(callbackForDismissingThisOne); }, 0);
      });
    }, callWhenDone, "dismissing the old morphs");
  }, {category: ['setting morphs']});

  add.method('setTitleContent', function (containerMorph, titleContent) {
    if (titleContent) {
      var titleLabel = containerMorph.findTitleLabel();
      if (titleLabel) {
        titleLabel._model.setContent(titleContent);
        titleLabel.refreshContent();
      }
    }
  }, {category: ['setting morphs']});

  add.method('addMorphs', function (containerMorph, morphsToShow, callWhenDone) {
    var world = containerMorph.world() || avocado.ui.currentWorld();
    avocado.poses.makeMorphsBecomeDirectSubmorphOfWorld(world, morphsToShow);
    var pose = this.pose().copy().setPosers(morphsToShow);
    pose.recreateInContainer(containerMorph, pt(0, 0), function() {
      world.fixFonts();
      if (callWhenDone) { callWhenDone(); }
    });
  }, {category: ['setting morphs']});

  add.method('showMorphs', function (containerMorph, morphsToShow, titleContent, callWhenOldMorphsHaveBeenDismissed, callWhenNewMorphsAreInPlace) {
    var morphsToDismiss = containerMorph.submorphEnumerator().toArray().select(function(m) { return ! morphsToShow.include(m); });
    this.dismissMorphs(morphsToDismiss, function() {
      if (callWhenOldMorphsHaveBeenDismissed) { callWhenOldMorphsHaveBeenDismissed(); }
      this.addMorphs(containerMorph, morphsToShow, callWhenNewMorphsAreInPlace);
      this.setTitleContent(containerMorph, titleContent); // no need to wait until the new morphs are in place
    }.bind(this));
  }, {category: ['setting morphs']});

});


});
