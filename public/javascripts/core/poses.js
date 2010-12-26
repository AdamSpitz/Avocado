transporter.module.create('core/poses', function(requires) {}, function(thisModule) {


thisModule.addSlots(avocado, function(add) {

  add.creator('poses', {}, {category: ['ui', 'poses']});

});


thisModule.addSlots(avocado.poses, function(add) {

  add.creator('abstract', {});

  add.creator('tree', Object.create(avocado.poses['abstract']));

  add.creator('list', Object.create(avocado.poses['abstract']));

  add.creator('clean', Object.create(avocado.poses.list));

  add.creator('snapshot', Object.create(avocado.poses['abstract']));

  add.creator('manager', {});

});


thisModule.addSlots(avocado.poses['abstract'], function(add) {

  add.method('initialize', function (name) {
    this._name = name;
  });

  add.method('name', function () {
    return this._name;
  });

  add.method('toString', function () {
    return this.name();
  });

  add.method('recreateInWorld', function (w) {
    this.eachElement(function(e) {
      e.poser.isPartOfCurrentPose = true;
      if (e.uiState) { e.poser.assumeUIState(e.uiState); }
      e.poser.ensureIsInWorld(w, e.position, true, true, true, function() {
        // do bad things happen if I make the uiState thing happen before moving the poser?
      });
    });
    
    w.allPotentialPosers().each(function(m) {
      if (m.isPartOfCurrentPose) {
        delete m.isPartOfCurrentPose;
      } else if (! m.shouldIgnorePoses()) {
        // I am undecided on whether this is a good idea or not. It's annoying if
        // stuff I want zooms away, but it's also annoying if stuff zooms onto
        // other stuff and the screen gets all cluttered.
        var shouldUninvolvedPosersZoomAway = false;
        if (shouldUninvolvedPosersZoomAway) {
          m.startZoomingOuttaHere();
        }
      }
    });
  });

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

  add.method('eachElement', function (f) {
    var pos = pt(20,20);
    this.ancestors().each(function(m) {
      f({poser: m, position: pos});
      pos = pos.addXY(this.indentation, m.getExtent().y + this.padding);
    }.bind(this));
    
    this.eachChildElement(this._focus, pos, f);
  });

  add.method('eachChildElement', function (m, pos, f) {
    this.childrenOf(m).each(function(child) {
      f({poser: child, position: pos});
      var newY = this.eachChildElement(child, pos.addXY(this.indentation, m.getExtent().y + this.padding), f);
      pos = pos.withY(newY);
    }.bind(this));
    return pos.y;
  });

});


thisModule.addSlots(avocado.poses.list, function(add) {

  add.method('initialize', function ($super, name, world, posers) {
    $super(name);
    this._world = world;
    this._posers = posers;
  });

  add.method('eachElement', function (f) {
    var sortedPosersToMove = this._posers.sort(function(m1, m2) {
      var n1 = m1.inspect();
      var n2 = m2.inspect();
      return n1 < n2 ? -1 : n1 === n2 ? 0 : 1;
    });

    var pos = pt(20,20);
    var widest = 0;
    for (var i = 0; i < sortedPosersToMove.length; ++i) {
      var poser = sortedPosersToMove[i];
      var uiState = this.destinationUIStateFor(poser);
      if (uiState) { poser.assumeUIState(uiState); }
      f({poser: poser, position: pos, uiState: uiState});
      var extent = poser.getExtent().scaleBy(poser.getScale());
      pos = pos.withY(pos.y + extent.y);
      widest = Math.max(widest, extent.x);
      if (pos.y >= this._world.getExtent().y - 30) { pos = pt(pos.x + widest + 20, 20); }
    }
  });

  add.method('destinationUIStateFor', function (poser) {
    // just use whatever state it's in now
    return null;
  });

});


thisModule.addSlots(avocado.poses.clean, function(add) {

  add.method('destinationUIStateFor', function (poser) {
    var uiState = poser.constructUIStateMemento();
    if (uiState) { uiState.isExpanded = false; }
    return uiState;
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

  add.method('eachElement', function (f) {
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
    pose.recreateInWorld(this.world());
  });

  add.method('goForwardToNextPose', function () {
    if (! this.canGoForwardToNextPose()) { throw "there is nothing to go forward to"; }
    var pose = this.undoPoseStack()[this._undoPoseStackIndex += 1];
    pose.recreateInWorld(this.world());
  });

  add.method('assumePose', function (pose) {
    this.addToUndoPoseStack(this.createSnapshotOfCurrentPose(avocado.organization.current.findUnusedPoseName()));
    pose.recreateInWorld(this.world());
  }, {category: ['poses']});

  add.method('createSnapshotOfCurrentPose', function (poseName) {
    return Object.newChildOf(avocado.poses.snapshot, poseName, this.world().posers());
  }, {category: ['taking snapshots']});

  add.method('rememberThisPose', function () {
    avocado.organization.current.promptForPoseName(function(n) {
      avocado.organization.current.rememberPose(this.createSnapshotOfCurrentPose(n));
    }.bind(this));
  }, {category: ['taking snapshots']});

  add.method('cleanUp', function (evt) {
    this.assumePose(Object.newChildOf(avocado.poses.clean, "clean up", this.world(), this.world().posers()));
  }, {category: ['cleaning up']});

  add.method('listPoseOfMorphsFor', function (objects, name) {
    // aaa LK-dependent
    var posersToMove = objects.map(function(m) { return this.world().morphFor(m); }.bind(this));
    return Object.newChildOf(avocado.poses.list, name, this.world(), posersToMove);
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
      this.cleanUp(evt);
    }.bind(this)]);

    var poseCommands = [];
    
    poseCommands.push(["remember this pose", function(evt) {
      this.rememberThisPose();
    }.bind(this)]);

    if (this.explicitlyRememberedPoses().size() > 0) {
      poseCommands.push(["assume a pose...", function(evt) {
        avocado.ui.showMenu(this.poseChooser(), this.world(), null, evt);
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
