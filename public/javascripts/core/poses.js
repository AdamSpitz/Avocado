avocado.transporter.module.create('core/poses', function(requires) {

}, function(thisModule) {


thisModule.addSlots(avocado, function(add) {

  add.creator('poses', {}, {category: ['ui', 'poses']});

});


thisModule.addSlots(avocado.poses, function(add) {

  add.creator('abstract', {});

  add.creator('tree', Object.create(avocado.poses['abstract']));

  add.creator('list', Object.create(avocado.poses['abstract']));

  add.creator('snapshot', Object.create(avocado.poses['abstract']));

  add.creator('manager', {});

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

  add.method('toString', function () {
    return this.name();
  }, {category: ['printing']});

  add.method('inspect', function () {
    return this.toString();
  }, {category: ['printing']});

  add.method('recreateInContainer', function (container, startingPos) {
    var originalScale = container.getScale();
    var originalSpace = container.getExtent().scaleBy(originalScale);
    
    this._bounds = (startingPos || pt(0, 0)).extent(pt(0, 0));
    
    this.eachElement(function(e) {
      e.poser.isPartOfCurrentPose = true;
      // do bad things happen if I make the uiState thing happen before moving the poser?
      if (e.uiState) { e.poser.assumeUIState(e.uiState); }
      
      if (this._shouldBeUnobtrusive) {
        var poserOrPlaceholder = e.poser;
        if (e.poser.owner !== container && e.poser.world()) { // aaa what's going on here?
          poserOrPlaceholder = container.placeholderForMorph(e.poser);
        }
        container.addMorphAt(poserOrPlaceholder, e.position);
      } else {
        
        if (! e.poser.world()) {
          // aaa - Not sure at all that this is a good idea. But it might be.
          e.poser.setScale(1 / container.world().getScale());
        }
        
        e.poser.ensureIsInWorld(container, e.position, true, true, true);
      }
      
      // Keep track of how much space the pose is taking up, so that the pose can answer getExtent(). -- Adam, June 2011
      var poserExtent = e.poser.getExtent().scaleBy(e.poser.getScale());
      var poserBounds = e.position.extent(poserExtent);
      this._bounds = this._bounds.union(poserBounds);
    }.bind(this), startingPos);
  
    
    if (this._shouldScaleToFitWithinCurrentSpace) {
      // aaa - Shoot, this isn't going to work right if this pose is doing the animation (i.e. if _shouldBeUnobtrusive is false), because
      // the container won't know how much space its submorphs will take up until the animation is done.
      
      // AAAAAAA - I took out this one line and suddenly everything got way faster.
      // container.refreshContentOfMeAndSubmorphs(); // to make sure the submorphs are laid out right - though, aaa, shouldn't this be done before even calculating the pose positions?
      var currentScale = container.getScale();
      var currentExternalExtent = container.bounds().extent();
      var hs = originalSpace.x / currentExternalExtent.x;
      var vs = originalSpace.y / currentExternalExtent.y;
      
      var newExtent;
      if (hs < vs) {
        container.scaleBy(hs);
        newExtent = currentExternalExtent.withY(currentExternalExtent.x * (originalSpace.y / originalSpace.x)).scaleBy(1 / currentScale);
      } else {
        container.scaleBy(vs);
        newExtent = currentExternalExtent.withX(currentExternalExtent.y * (originalSpace.x / originalSpace.y)).scaleBy(1 / currentScale);
      }
      
      container.setExtent(newExtent); // needed because calling .bounds() returns a rectangle that encompasses the stickouts, but they're still stickouts
      // console.log("Scaling " + container + " to fit within originalSpace: " + originalSpace + ", currentExternalExtent: " + currentExternalExtent + ", newExtent: " + newExtent + ", hs: " + hs + ", vs: " + vs + ", originalScale: " + originalScale);
    }
  }, {category: ['posing']});
  
  add.method('whenDoneScaleToFitWithinCurrentSpace', function () {
    this._shouldScaleToFitWithinCurrentSpace = true;
    return this;
  }, {category: ['scaling']});

  add.method('beUnobtrusive', function () {
    this._shouldBeUnobtrusive = true;
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
    w.poseManager().assumePose(this, desiredLoc);
    if (functionToCallWhenDone) { functionToCallWhenDone(); }
  }, {category: ['acting like a morph']});

});


thisModule.addSlots(avocado.poses.tree, function(add) {

  add.method('initialize', function ($super, name, focus, parentFunction, childrenFunction) {
    $super(name);
    this._focus = focus;
    this.parentOf = parentFunction;
    this.childrenOf = childrenFunction;
  });

  add.data('indentation', 20);

  add.data('padding', 5);

  add.method('ancestors', function () { 
    var ancestors = [];
    var ancestor = this._focus;
    do {
      ancestors.push(ancestor);
      ancestor = this.parentOf(ancestor);
    } while (ancestor);
    ancestors.reverse();
    return ancestors;
  });

  add.method('eachElement', function (f, startingPos) {
    var worldScale = WorldMorph.current().getScale();
    var indentation = this.indentation / worldScale;
    var padding     = this.padding     / worldScale;
    var pos = (startingPos || pt(0,0)).addXY(indentation, indentation);
    this.ancestors().each(function(m) {
      f({poser: m, position: pos});
      var mSpace = m.getExtent().scaleBy(m.getScale());
      pos = pos.addXY(indentation, mSpace.y + padding);
    });
    
    this.eachChildElement(this._focus, pos, f);
  });

  add.method('eachChildElement', function (m, pos, f) {
    var worldScale = WorldMorph.current().getScale();
    var indentation = this.indentation / worldScale;
    var padding     = this.padding     / worldScale;
    this.childrenOf(m).each(function(child) {
      f({poser: child, position: pos});
      var childSpace = child.getExtent().scaleBy(m.getScale());
      var newY = this.eachChildElement(child, pos.addXY(indentation, childSpace.y + padding), f);
      pos = pos.withY(newY);
    }.bind(this));
    return pos.y;
  });

});


thisModule.addSlots(avocado.poses.list, function(add) {

  add.method('initialize', function ($super, name, container, posers) {
    $super(name);
    this._container = container;
    this._posers = posers;
  });

  add.method('eachElement', function (f, startingPos) {
    var sortedPosersToMove = this._posers.sort(function(m1, m2) {
      var n1 = m1.inspect();
      var n2 = m2.inspect();
      return n1 < n2 ? -1 : n1 === n2 ? 0 : 1;
    });

    var padding = (startingPos || pt(0,0)).addXY(20,20);
    var pos = padding;
    var widest = 0;
    var maxY = this._shouldBeSquarish ? null : this._container.getExtent().y - 30;
    for (var i = 0, n = sortedPosersToMove.length; i < n; ++i) {
      var poser = sortedPosersToMove[i];
      var uiState = this.destinationUIStateFor(poser);
      if (uiState) { poser.assumeUIState(uiState); }
      f({poser: poser, position: pos, uiState: uiState});
      var poserSpace = poser.getExtent().scaleBy(poser.getScale());
      pos = pos.withY(pos.y + poserSpace.y + padding.y);
      widest = Math.max(widest, poserSpace.x);
      
      if (this._shouldBeSquarish && !maxY) {
        // If it seems like the current y is far down enough to make the whole
        // thing come out squarish (assuming that all columns will be about as
        // wide as this one), then set this as the maxY.
        var containerExtent = this._container.getExtent();
        var desiredAspectRatio = containerExtent.y == 0 ? 1 : containerExtent.x / containerExtent.y;
        
        var estimatedNumberOfColumns = Math.ceil(n / (i + 1));
        var estimatedTotalWidth = estimatedNumberOfColumns * (widest + padding.x);
        // aaa - not sure why it keeps coming out too tall; quick hack for now: compensate by multiplying by 1.2
        if (pos.y * desiredAspectRatio * 1.2 >= estimatedTotalWidth) { maxY = pos.y; }
      }
      
      if (maxY && pos.y >= maxY) { pos = pt(pos.x + widest + padding.x, padding.y); }
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
      params["poser"   + i] = elem.poser instanceof avocado.mirror.Morph ? "mirror(" + org.nameOfReflecteeOf(elem.poser.mirror()) + ")" : "unknown";
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

  add.method('goBackToPreviousPose', function () {
    if (! this.canGoBackToPreviousPose()) { throw "there is nothing to go back to"; }

    if (this.undoPoseStackIndex() === this.undoPoseStack().size()) {
      this.addToUndoPoseStack(this.createSnapshotOfCurrentPose(avocado.organization.current.findUnusedPoseName())); // so that we can go forward to it
      this._undoPoseStackIndex -= 1; // reset the index
    }

    var pose = this.undoPoseStack()[this._undoPoseStackIndex -= 1];
    pose.recreateInContainer(this.container());
  });

  add.method('goForwardToNextPose', function () {
    if (! this.canGoForwardToNextPose()) { throw "there is nothing to go forward to"; }
    var pose = this.undoPoseStack()[this._undoPoseStackIndex += 1];
    pose.recreateInContainer(this.container());
  });

  add.method('assumePose', function (pose, startingPos) {
    this.addToUndoPoseStack(this.createSnapshotOfCurrentPose(avocado.organization.current.findUnusedPoseName()));
    pose.recreateInContainer(this.container(), startingPos);
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
    return avocado.poses.list.create(name || "clean up", this.container(), posers || this.container().posers()).beCollapsing();
  }, {category: ['cleaning up']});

  add.method('listPoseOfMorphsFor', function (objects, name) {
    // aaa LK-dependent
    var posersToMove = objects.map(function(m) { return this.container().morphFor(m); }.bind(this));
    return avocado.poses.list.create(name, this.container(), posersToMove);
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


});
