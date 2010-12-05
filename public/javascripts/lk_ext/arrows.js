transporter.module.create('lk_ext/arrows', function(requires) {

requires('core/commands');

}, function(thisModule) {


thisModule.addSlots(avocado, function(add) {

  add.method('ArrowMorph', function ArrowMorph() { Class.initializer.apply(this, arguments); }, {category: ['ui']});

  add.method('ArrowEndpoint', function ArrowEndpoint() { Class.initializer.apply(this, arguments); }, {category: ['ui']});

});


thisModule.addSlots(avocado.ArrowMorph, function(add) {

  add.data('superclass', Morph);

  add.creator('prototype', Object.create(Morph.prototype));

  add.data('type', 'avocado.ArrowMorph');

  add.method('createButtonForToggling', function (pointer) {
    // aaa - This is still a bit of a mess.

    var arrow;
    var m = avocado.command.create("Toggle arrow", function() { arrow.toggleVisibility(); }).newMorph(pointer.labelMorph());
    m.beArrowEndpoint();

    arrow = m.arrow = new avocado.ArrowMorph(pointer.association(), m, null);
    arrow.noLongerNeedsToBeUpdated = true;
    arrow.prepareToBeShown = pointer.prepareToBeShown.bind(pointer);

    pointer.notifiersToUpdateOn().each(function(notifier) { notifier.addObserver(arrow.notificationFunction); });

    m.commands = function() {
      var cmdList = avocado.command.list.create();

      // aaa - To do "grab pointer" properly I think I need to do a more general drag-and-drop thing. Right
      // now nothing will get called if I drop the endpoint on something invalid (like the world or some
      // other morph), so the visibility will need to be toggled an extra time to get it back to normal.
      cmdList.addItem({label: "grab pointer", go: function(evt) {
        arrow.needsToBeVisible();
        arrow.endpoint2.grabMeWithoutZoomingAroundFirst(evt);
      }});

      pointer.addExtraCommandsTo(cmdList);

      return cmdList;
    };

    m.inspect = function() { return pointer.inspect(); };
    m.getHelpText = function() { return arrow.noLongerNeedsToBeUpdated ? pointer.helpTextForShowing() : pointer.helpTextForHiding(); };

    return m;
  }, {category: ['toggling buttons']});

});


thisModule.addSlots(avocado.ArrowMorph.prototype, function(add) {

  add.data('constructor', avocado.ArrowMorph);

  add.method('initialize', function ($super, assoc, ep1, ep2) {
    $super(new lively.scene.Polyline([pt(0,0), pt(0,0)]));
    this.applyStyle(this.defaultStyle);
    this.notificationFunction = function() {setTimeout(this.putVerticesInTheRightPlace.bind(this), 0);}.bind(this);
    this.endpoint1 = ep1 || new avocado.ArrowEndpoint(assoc, this);
    this.endpoint2 = ep2 || new avocado.ArrowEndpoint(assoc, this);
    this.endpoint1.otherEndpoint = this.endpoint2;
    this.endpoint2.otherEndpoint = this.endpoint1;
    this.needsToBeVisible();
  }, {category: ['creating']});

  add.data('shouldGrowSmoothly', true);

  add.creator('defaultStyle', {}, {category: ['styles']});

  add.method('stopUpdating', function () {
    if (this._updateProcess) {
      this._updateProcess.stop();
      delete this._updateProcess;
    }
  }, {category: ['updating']});

  add.method('changeUpdateFrequency', function (newFrequency) {
    if (this._updateProcess && this._updateProcess.frequency === newFrequency) { return; }
    // Optimization suggested by Dan Ingalls: slow down ticking when things are pretty quiet.
    this.stopUpdating();
    this._updateProcess = new PeriodicalExecuter(function(pe) {
      this.putVerticesInTheRightPlace();
    }.bind(this), newFrequency);
  }, {category: ['updating']});

  add.method('tickQuickly', function () { this.changeUpdateFrequency(0.05); }, {category: ['updating']});

  add.method('tickSlowly', function () { this.changeUpdateFrequency(0.5); }, {category: ['updating']});

  add.method('constructUIStateMemento', function () {
    return ! this.noLongerNeedsToBeUpdated;
  }, {category: ['UI state']});

  add.method('assumeUIState', function (uiState, evt) {
    if (uiState) {
      // aaa - Why isn't this using showMe() like toggleVisibility does?
      this.needsToBeVisible();
    } else {
      this.noLongerNeedsToBeVisible();
    }
  }, {category: ['UI state']});

  add.method('toggleVisibility', function () {
    if (this.noLongerNeedsToBeUpdated) {
      this.showMe();
    } else {
      this.noLongerNeedsToBeVisible();
    }
  }, {category: ['showing and hiding']});

  add.method('prepareToBeShown', function (callWhenDone) {
    callWhenDone();
  }, {comment: 'Feel free to override me.', category: ['showing and hiding']});

  add.method('showMe', function (callWhenDone) {
    if (this.noLongerNeedsToBeUpdated) {
      this.prepareToBeShown(function() {
        this.needsToBeVisible();
        if (callWhenDone) { callWhenDone(); }
      }.bind(this));
    }
  }, {category: ['showing and hiding']});

  add.method('noLongerNeedsToBeVisible', function () {
    this.noLongerNeedsToBeUpdated = true;
    this.disappear(function() {
      this.stopUpdating();
    }.bind(this));
  }, {category: ['showing and hiding']});

  add.method('needsToBeVisible', function () {
    this.noLongerNeedsToBeUpdated = false;
    this.tickQuickly();
  }, {category: ['showing and hiding']});

  add.method('putVerticesInTheRightPlace', function () {
    if (this.shouldBeShown()) {
      this.endpoint1.attachToTheRightPlace();
      this.endpoint2.attachToTheRightPlace();
      if (! this.owner) {
        WorldMorph.current().addMorph(this);
      }
      this.changeVerticesIfNecessary();
    } else {
      this.disappear();
    }
  }, {category: ['vertices']});

  add.method('disappear', function (callWhenDone) {
    avocado.callbackWaiter.on(function(finalCallback) {
      this.endpoint1.noLongerNeedsToBeVisibleAsArrowEndpoint(finalCallback());
      this.endpoint2.noLongerNeedsToBeVisibleAsArrowEndpoint(finalCallback());
    }.bind(this), function() {
      this.noLongerNeedsToBeUpdated = true;
      if (this.owner) {
        this.remove();
        this.tickSlowly();
      }
      if (callWhenDone) { callWhenDone(); }
    }.bind(this), "making the arrow disappear");
  }, {category: ['showing and hiding']});

  add.method('shouldBeShown', function () {
    if (this.noLongerNeedsToBeUpdated) { return false; }
    var m1 = this.endpoint1.determineWhichMorphToAttachTo();
    var m2 = this.endpoint2.determineWhichMorphToAttachTo();
    var w  = WorldMorph.current();
    return m1 && m2 && (m1 !== w || m2 !== w);
  }, {category: ['showing and hiding']});

  add.method('changeVerticesIfNecessary', function () {
    var oldVertices = this.shape.vertices();
    // Rounding seems to be necessary to make sure the floats are precisely equal.
    var newVertices = [this.endpoint1.lineEndpoint().round(), this.endpoint2.lineEndpoint().round()];
    if (oldVertices[0].round().eqPt(newVertices[0]) && oldVertices[1].round().eqPt(newVertices[1])) {
      this.tickSlowly();
    } else {
      this.changeVertices(newVertices);
      this.tickQuickly();
    }
  }, {category: ['vertices']});

  add.method('changeVertices', function (newVertices) {
    this.setVertices(newVertices);

    if (! newVertices[0].eqPt(newVertices[1])) {
      var arrowDirection = newVertices[1].subPt(newVertices[0]);
      if (arrowDirection.rSquared() >= 225) {
        //console.log("endpoint1: " + newVertices[0] + ", endpoint2: " + newVertices[1] + ", arrowDirection: " + arrowDirection + ", arrowDirection.theta(): " + arrowDirection.theta());
        this.endpoint1.setShapeToLookLikeACircle(arrowDirection          .theta());
        this.endpoint2.setShapeToLookLikeAnArrow(arrowDirection.negated().theta());
      } else {
        // Workaround: the endpoint keeps being in weird places when it's very near the source,
        // and so the arrow head kept pointing in weird directions. Until I figure out the cause,
        // let's just not show the arrow head until it gets a bit further away.
        this.endpoint2.setShapeToLookLikeNothing();
      }
    }
  }, {category: ['vertices']});

  add.method('grabEndpoint', function (evt, endpoint) {endpoint.grabMe(evt);}, {category: ['vertices']});

  add.method('grabEndpoint1', function (evt) {this.grabEndpoint(evt, this.endpoint1);}, {category: ['vertices']});

  add.method('grabEndpoint2', function (evt) {this.grabEndpoint(evt, this.endpoint2);}, {category: ['vertices']});

  add.method('shouldIgnorePoses', function (uiState) { return true; }, {category: ['poses']});

});


thisModule.addSlots(avocado.ArrowMorph.prototype.defaultStyle, function(add) {

  add.data('borderColor', new Color(0, 0, 0));

  add.data('borderWidth', 1);

  add.data('fill', null);

  add.data('suppressGrabbing', true);

  add.data('openForDragAndDrop', false);

  add.data('shouldIgnoreEvents', true);

});


thisModule.addSlots(avocado.ArrowEndpoint, function(add) {

  add.data('superclass', Morph);

  add.creator('prototype', Object.create(Morph.prototype));

  add.data('type', 'avocado.ArrowEndpoint');

  add.method('createForSetting', function (evt, tr, fep) {
    var arrow = tr.setterArrow;
    if (! arrow) {
      arrow = tr.setterArrow = new avocado.ArrowMorph(tr, fep || tr.morph());
      evt.hand.world().addMorph(arrow);
    } else {
      arrow.endpoint2.setPosition(evt.hand.position());
    }
    evt.hand.grabMorph(arrow.endpoint2, evt);
  }, {category: ['creating']});

});


thisModule.addSlots(avocado.ArrowEndpoint.prototype, function(add) {

  add.data('constructor', avocado.ArrowEndpoint);

  add.method('initialize', function ($super, assoc, arrow) {
    $super(new lively.scene.Rectangle(pt(0, 0).extent(pt(10, 10))));
    this.relativeLineEndpoint = pt(5, 5);
    this.isArrowEndpoint = true;
    this.shouldNotBePartOfRowOrColumn = true;
    this.association = assoc;
    this.arrow = arrow;
    this.setFill(Color.black);
  }, {category: ['creating']});

  add.data('suppressHandles', true);

  add.method('okToDuplicate', function () { return false; });

  add.data('relativeLineEndpoint', new Point(0, 0));

  add.method('determineWhichMorphToAttachTo', function () {
    var m = this.owner instanceof HandMorph ? this.owner : this.whichMorphToAttachTo();
    this.morphToAttachTo = m;
    return m;
  }, {category: ['attaching']});

  add.method('whichMorphToAttachTo', function () {
    var slotContents = this.association.contents();
    var morph = WorldMorph.current().existingMorphFor(slotContents);
    return morph ? (morph.world() ? morph : null) : null;
  }, {category: ['attaching']});

  add.method('stopCurrentAnimationIfAny', function () {
    if (this._animator) { this._animator.stopAnimating(); }
  }, {category: ['animating']});

  add.method('isZoomingTo', function () {
    return this._animator ? this._animator.isZoomingTo : undefined;
  }, {category: ['animating']});

  add.method('attachToTheRightPlace', function () {
    var morphToAttachTo = this.morphToAttachTo;
    var isZoomingTo = this.isZoomingTo();
    if (isZoomingTo === morphToAttachTo) {return;}
    this.stopCurrentAnimationIfAny();
    var oldOwner = this.owner;
    if (! (morphToAttachTo instanceof HandMorph)) {
      if (morphToAttachTo === oldOwner && this.doesNotNeedToBeRepositionedIfItStaysWithTheSameOwner) {return;}
      
      if (morphToAttachTo !== WorldMorph.current()) {
        var otherEndpointLoc = this.otherEndpoint.worldPoint(this.otherEndpoint.relativeLineEndpoint);
        var localCenterOfMorphToAttachTo = morphToAttachTo.relativeCenterpoint();
        var globalCenterOfMorphToAttachTo = morphToAttachTo.worldPoint(localCenterOfMorphToAttachTo);
        var vectorFromCenterToOtherEndpoint = otherEndpointLoc.subPt(globalCenterOfMorphToAttachTo);
        var localPositionOfOtherEndpoint = localCenterOfMorphToAttachTo.addPt(vectorFromCenterToOtherEndpoint);
        var localNewLoc = this.localPositionClosestTo(localPositionOfOtherEndpoint, localCenterOfMorphToAttachTo).round();
        var globalNewLoc = morphToAttachTo.worldPoint(localNewLoc);
        
        if (this.arrow.shouldGrowSmoothly) {
          var world = this.world();
          var globalCurLoc;
          if (world) {
            globalCurLoc = this.owner.worldPoint(this.getPosition());
          } else {
            globalCurLoc = otherEndpointLoc;
            world = this.otherEndpoint.world();
          }
          world.addMorphAt(this, globalCurLoc);
          this.stopCurrentAnimationIfAny();
          // aaa console.log("Now zooming from " + globalCurLoc + " to " + globalNewLoc + "; morphToAttachTo is " + Object.inspect(morphToAttachTo) + "; noLongerNeedsToBeUpdated is " + this.arrow.noLongerNeedsToBeUpdated);
          this._animator = this.startZoomingInAStraightLineTo(globalNewLoc, false, false, false, function() {
            var wasAlreadyAttachedToThisMorph = morphToAttachTo === this.owner;
            morphToAttachTo.addMorphAt(this, localNewLoc);
            if (!wasAlreadyAttachedToThisMorph) {
              morphToAttachTo.bringToFront();
              morphToAttachTo.wiggle(100);
            }
            delete this._animator;
          }.bind(this));
          this._animator.isZoomingTo = morphToAttachTo;
        } else {
          morphToAttachTo.addMorphAt(this, localNewLoc);
          morphToAttachTo.bringToFront();
        }
        
        this.doesNotNeedToBeRepositionedIfItStaysWithTheSameOwner = true;
      } else {
        if (! this.vectorFromOtherEndpoint) {this.vectorFromOtherEndpoint = this.calculateDefaultVectorFromOtherEndpoint();}
        var newLoc = this.otherEndpoint.world() ? this.otherEndpoint.worldPoint(pt(0,0)).addPt(this.vectorFromOtherEndpoint) : pt(0,0);
        morphToAttachTo.addMorphAt(this, newLoc);
      }
    }

    this.registerForChangeNotification(oldOwner, morphToAttachTo);
  }, {category: ['attaching']});

  add.method('registerForChangeNotification', function (oldOwner, newOwner) {
    // Not really necessary because we have the update process, but it makes the UI look smoother
    // if we register to be notified whenever the owner changes position.
    if (newOwner !== oldOwner) {
      this.unregisterFromChangeNotification(oldOwner);
      newOwner.topmostOwnerBesidesTheWorldAndTheHand().changeNotifier().addObserver(this.arrow.notificationFunction);
    }
  }, {category: ['updating']});

  add.method('unregisterFromChangeNotification', function (oldOwner) {
    if (oldOwner) { oldOwner.topmostOwnerBesidesTheWorldAndTheHand().changeNotifier().removeObserver(this.arrow.notificationFunction); }
  }, {category: ['updating']});

  add.method('noLongerNeedsToBeVisibleAsArrowEndpoint', function (callWhenDone) {
    var isZoomingTo = this.isZoomingTo();
    if (isZoomingTo === null) {return;}
    this.unregisterFromChangeNotification(this.owner);
    this.stopCurrentAnimationIfAny();
    var world = this.world();
    if (this.arrow.shouldGrowSmoothly && world && this.otherEndpoint.world()) {
      var globalCurLoc = this.owner.worldPoint(this.getPosition());
      var globalNewLoc = this.otherEndpoint.worldPoint(this.otherEndpoint.relativeLineEndpoint);
      // aaa console.log("OK, zooming from " + globalCurLoc + " to " + globalNewLoc + "; noLongerNeedsToBeUpdated is " + this.arrow.noLongerNeedsToBeUpdated);
      world.addMorphAt(this, globalCurLoc);
      this._animator = this.startZoomingInAStraightLineTo(globalNewLoc, false, false, false, function() {
        delete this._animator;
        this.remove();
        callWhenDone();
      }.bind(this));
      this._animator.isZoomingTo = null;
    } else {
      this.remove();
      callWhenDone();
    }
  }, {category: ['showing and hiding']});

  add.method('justDidAnimatedPositionChange', function () {
    this.arrow.changeVerticesIfNecessary();
  }, {category: ['animating']});

  add.method('localPositionClosestTo', function (localPositionToBeClosestTo, localCenter) {
    var vectorFromCenterToPositionToBeClosestTo = localPositionToBeClosestTo.subPt(localCenter);
    var s1 = vectorFromCenterToPositionToBeClosestTo.x !== 0 ? Math.abs(localCenter.x / vectorFromCenterToPositionToBeClosestTo.x) : null;
    var s2 = vectorFromCenterToPositionToBeClosestTo.y !== 0 ? Math.abs(localCenter.y / vectorFromCenterToPositionToBeClosestTo.y) : null;
    var positonToBeClosestToIsAlongAVerticalEdge = s2 === null || s1 < s2;
    var s = positonToBeClosestToIsAlongAVerticalEdge ? s1 : s2;
    return localCenter.addPt(vectorFromCenterToPositionToBeClosestTo.scaleBy(s));
  }, {category: ['attaching']});

  add.method('setShapeToLookLikeACircle', function (arrowTheta) {
    if (! this.wasAlreadySetToLookLikeACircle) {
      this.setShape(new lively.scene.Ellipse(pt(0,0).extent(pt(10,10))));
      this.wasAlreadySetToLookLikeACircle = true;
      this.wasAlreadySetToLookLikeAnArrow = false;
    }
    this.setRotation(arrowTheta);
  }, {category: ['shape']});

  add.method('setShapeToLookLikeNothing', function (arrowTheta) {
    this.setShape(new lively.scene.Rectangle(pt(0,0).extent(pt(0,0))));
    this.wasAlreadySetToLookLikeACircle = false;
    this.wasAlreadySetToLookLikeAnArrow = false;
  }, {category: ['shape']});

  add.method('setShapeToLookLikeAnArrow', function (arrowTheta) {
    if (! this.wasAlreadySetToLookLikeAnArrow) {
      var parallelVector = pt(1,0);
      var pointOnTipOfArrow = this.relativeLineEndpoint;
      var middleOfBaseOfArrow = pointOnTipOfArrow.addPt(parallelVector.scaleBy(15.0));
      var vectorToPointOnBaseOfArrow = parallelVector.perpendicularVector().scaleBy(6.0);
      var verticesOfArrow = [pointOnTipOfArrow, middleOfBaseOfArrow.addPt(vectorToPointOnBaseOfArrow), middleOfBaseOfArrow.subPt(vectorToPointOnBaseOfArrow)];
      this.setShape(new lively.scene.Polygon(verticesOfArrow, Color.black, 1, Color.black));
      this.wasAlreadySetToLookLikeAnArrow = true;
      this.wasAlreadySetToLookLikeACircle = false;
    }
    this.setRotation(arrowTheta);
  }, {category: ['shape']});

  add.method('calculateDefaultVectorFromOtherEndpoint', function () {
    var e = this.otherEndpoint.lineEndpoint();
    var c = this.otherEndpoint.ownerCenterpoint();
    var d = e.subPt(c);
    var s = d.scaleToLength(50);
    return s;
  }, {category: ['attaching']});

  add.method('okToBeGrabbedBy', function (evt) { return this.arrow.isReadOnly ? null : this; }, {category: ['grabbing']});

  add.method('wasJustDroppedOn', function (m) {
    this.doesNotNeedToBeRepositionedIfItStaysWithTheSameOwner = false;
    this.vectorFromOtherEndpoint = null;
  }, {category: ['dropping']});

});


thisModule.addSlots(Morph.prototype, function(add) {

  add.method('topmostOwnerBesidesTheWorldAndTheHand', function () {
    var m = this;
    while (m.owner && ! (m.owner instanceof WorldMorph) && ! (m.owner instanceof HandMorph)) {
      m = m.owner;
    }
    return m;
  }, {category: ['accessing owner']});

  add.method('detachArrowEndpoints', function () {
    var world = this.world();
    if (world) {
      this.submorphs.each(function(m) {
        if (m instanceof avocado.ArrowEndpoint) {
          world.addMorphAt(m, this.worldPoint(m.getPosition()));
        }
      }.bind(this));
    }
  }, {category: ['arrows']});

  add.method('beArrowEndpoint', function () {
    this.determineWhichMorphToAttachTo = function() { return !!this.world(); };
    this.attachToTheRightPlace = function() {};
    this.noLongerNeedsToBeVisibleAsArrowEndpoint = function(callWhenDone) {callWhenDone();};
    this.relativeLineEndpoint = this.getExtent().scaleBy(0.5);
    this.setShapeToLookLikeACircle = function() {};
  }, {category: ['arrows']});

  add.method('ownerCenterpoint', function () {
    var o = this.owner;
    if (!o || !o.world()) {return pt(0, 0);}
    return o.worldPoint(o.shape.bounds().center());
  }, {category: ['geometry']});

  add.method('relativeCenterpoint', function () {
    return this.shape.bounds().extent().scaleBy(0.5);
  }, {category: ['geometry']});

  add.method('lineEndpoint', function () {
    if (! this.world()) {return pt(0,0);}
    return this.worldPoint(this.relativeLineEndpoint);
  }, {category: ['arrows']});

});


});
