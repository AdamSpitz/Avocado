transporter.module.create('lk_ext/poses', function(requires) {}, function(thisModule) {


thisModule.addSlots(avocado, function(add) {

  add.creator('poses', {}, {category: ['ui', 'poses']});

});


thisModule.addSlots(avocado.poses, function(add) {

  add.creator('abstract', {});

  add.creator('tree', Object.create(avocado.poses['abstract']));

  add.creator('list', Object.create(avocado.poses['abstract']));

  add.creator('snapshot', Object.create(avocado.poses['abstract']));

  add.method('addGlobalCommandsTo', function (menu) {
    menu.addLine();
    
    menu.addItem(["clean up", function(evt) {
      evt.hand.world().cleanUp(evt);
    }]);

    menu.addItem(["remember this pose", function(evt) {
      var world = evt.hand.world();
      world.rememberThisPose();
    }]);

    // aaa - need a way to get the right world

    if (WorldMorph.current().explicitlyRememberedPoses().size() > 0) {
      menu.addItem(["assume a pose...", function(evt) {
        var world = evt.hand.world();
        var rememberedPosesMenu = new MenuMorph([], world);
        world.explicitlyRememberedPoses().eachValue(function(pose) {
          rememberedPosesMenu.addItem([pose.name(), function(evt) { world.assumePose(pose); }]);
        });
        rememberedPosesMenu.openIn(world, evt.point());
      }]);
    }

    if (WorldMorph.current().canGoBackToPreviousPose()) {
      menu.addItem(["back to previous pose", function(evt) {
        var world = evt.hand.world();
        world.goBackToPreviousPose();
      }]);
    }

    if (WorldMorph.current().canGoForwardToNextPose()) {
      menu.addItem(["forward to next pose", function(evt) {
        var world = evt.hand.world();
        world.goForwardToNextPose();
      }]);
    }
  }, {category: ['menu']});

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
      e.morph.isPartOfCurrentPose = true;
      e.morph.ensureIsInWorld(w, e.position, true, true, true, function() {
        if (e.uiState) {
          e.morph.assumeUIState(e.uiState);
        } else {
          if (typeof(e.morph.collapse) === 'function') { e.morph.collapse(); }
        }
      });
    });
    
    $A(w.submorphs).each(function(m) {
      if (m.isPartOfCurrentPose) {
        delete m.isPartOfCurrentPose;
      } else if (! m.shouldIgnorePoses()) {
        // I am undecided on whether this is a good idea or not. It's annoying if
        // stuff I want zooms away, but it's also annoying if stuff zooms onto
        // other stuff and the screen gets all cluttered.
        var shouldUninvolvedMorphsZoomAway = false;
        if (shouldUninvolvedMorphsZoomAway) {
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
      f({morph: m, position: pos});
      pos = pos.addXY(this.indentation, m.getExtent().y + this.padding);
    }.bind(this));
    
    this.eachChildElement(this._focus, pos, f);
  });

  add.method('eachChildElement', function (m, pos, f) {
    this.childrenOf(m).each(function(child) {
      f({morph: child, position: pos});
      var newY = this.eachChildElement(child, pos.addXY(this.indentation, m.getExtent().y + this.padding), f);
      pos = pos.withY(newY);
    }.bind(this));
    return pos.y;
  });

});


thisModule.addSlots(avocado.poses.list, function(add) {

  add.method('initialize', function ($super, name, world, morphs) {
    $super(name);
    this._world = world;
    this._morphs = morphs;
  });

  add.method('eachElement', function (f) {
    var sortedMorphsToMove = this._morphs.sort(function(m1, m2) {
      var n1 = m1.inspect();
      var n2 = m2.inspect();
      return n1 < n2 ? -1 : n1 === n2 ? 0 : 1;
    });

    var pos = pt(20,20);
    var widest = 0;
    for (var i = 0; i < sortedMorphsToMove.length; ++i) {
      var morph = sortedMorphsToMove[i];
      f({morph: morph, position: pos});
      var extent = morph.getExtent().scaleBy(morph.getScale());
      pos = pos.withY(pos.y + extent.y);
      widest = Math.max(widest, extent.x);
      if (pos.y >= this._world.getExtent().y - 30) { pos = pt(pos.x + widest + 20, 20); }
    }
  }, {category: ['poses', 'cleaning up']});

});


thisModule.addSlots(avocado.poses.snapshot, function(add) {

  add.method('initialize', function ($super, name, morphs) {
    $super(name);
    this._elements = [];
    morphs.each(function(m) {
      if (! m.shouldIgnorePoses()) {
        this.addElement({morph: m, position: m.getPosition(), uiState: m.constructUIStateMemento()});
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
      // aaa - handle other kinds of morphs, not just mirror morphs
      params["morph"   + i] = elem.morph instanceof mirror.Morph ? "mirror(" + org.nameOfReflecteeOf(elem.morph.mirror()) + ")" : "unknown";
      params["pos"     + i] = elem.position.toString();
      params["uiState" + i] = Object.toJSON(elem.uiState);
    }
  });

});


thisModule.addSlots(Morph.prototype, function(add) {

  add.method('shouldIgnorePoses', function (uiState) {
    return false;
  }, {category: ['poses']});

  add.method('constructUIStateMemento', function () {
    // override this and assumeUIState in children if you want them to be recalled in a particular state
    return null;
  }, {category: ['poses']});

  add.method('assumeUIState', function (uiState) {
    // override this and constructUIStateMemento in children if you want them to be recalled in a particular state;
  }, {category: ['poses']});

  add.method('transferUIStateTo', function (otherMorph, evt) {
    otherMorph.assumeUIState(this.constructUIStateMemento());
  }, {category: ['poses']});

});


thisModule.addSlots(WorldMorph.prototype, function(add) {

  add.method('nextPoseID', function () {
    this._nextPoseID = (this._nextPoseID || 0) + 1;
    return this._nextPoseID;
  }, {category: ['poses', 'taking snapshots']});

  add.method('explicitlyRememberedPoses', function () {
    return organization.current.poses();
  }, {category: ['poses', 'explicitly remembering']});

  add.method('undoPoseStack', function () {
    return this._undoPoseStack || (this._undoPoseStack = []);
  }, {category: ['poses', 'undo']});

  add.method('undoPoseStackIndex', function () {
    if (this._undoPoseStackIndex === undefined) { this._undoPoseStackIndex = this.undoPoseStack().size(); }
    return this._undoPoseStackIndex;
  }, {category: ['poses', 'undo']});

  add.method('addToUndoPoseStack', function (pose) {
    var i = this.undoPoseStackIndex();
    var stack = this.undoPoseStack();
    stack.splice(i, stack.size() - i, pose);
    this._undoPoseStackIndex += 1;
  }, {category: ['poses', 'undo']});

  add.method('canGoBackToPreviousPose', function () {
    return this.undoPoseStackIndex() > 0;
  });

  add.method('canGoForwardToNextPose', function () {
    return this.undoPoseStackIndex() < this.undoPoseStack().size() - 1;
  });

  add.method('goBackToPreviousPose', function () {
    if (! this.canGoBackToPreviousPose()) { throw "there is nothing to go back to"; }

    if (this.undoPoseStackIndex() === this.undoPoseStack().size()) {
      this.addToUndoPoseStack(this.createSnapshotOfCurrentPose(organization.current.findUnusedPoseName())); // so that we can go forward to it
      this._undoPoseStackIndex -= 1; // reset the index
    }

    var pose = this.undoPoseStack()[this._undoPoseStackIndex -= 1];
    pose.recreateInWorld(this);
  });

  add.method('goForwardToNextPose', function () {
    if (! this.canGoForwardToNextPose()) { throw "there is nothing to go forward to"; }
    var pose = this.undoPoseStack()[this._undoPoseStackIndex += 1];
    pose.recreateInWorld(this);
  });

  add.method('assumePose', function (pose) {
    this.addToUndoPoseStack(this.createSnapshotOfCurrentPose(organization.current.findUnusedPoseName()));
    pose.recreateInWorld(this);
  }, {category: ['poses']});

  add.method('createSnapshotOfCurrentPose', function (poseName) {
    return Object.newChildOf(avocado.poses.snapshot, poseName, this.submorphs);
  }, {category: ['poses', 'taking snapshots']});

  add.method('rememberThisPose', function () {
    organization.current.promptForPoseName(function(n) {
      organization.current.rememberPose(this.createSnapshotOfCurrentPose(n));
    }.bind(this));
  }, {category: ['poses', 'taking snapshots']});

  add.method('cleanUp', function (evt) {
    var morphsToMove = this.submorphs.reject(function(m) { return m.shouldIgnorePoses(); });
    this.assumePose(Object.newChildOf(avocado.poses.list, "clean up", this, morphsToMove));
  }, {category: ['poses', 'cleaning up']});

  add.method('listPoseOfMorphsFor', function (objects, name) {
    var morphsToMove = objects.map(function(m) { return this.morphFor(m); }.bind(this));
    return Object.newChildOf(avocado.poses.list, name, this, morphsToMove);
  }, {category: ['poses', 'cleaning up']});

});


thisModule.addSlots(MenuMorph.prototype, function(add) {

  add.method('shouldIgnorePoses', function (uiState) {
    return ! this.stayUp;
  }, {category: ['poses']});

});


});
