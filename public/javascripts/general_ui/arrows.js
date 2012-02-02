avocado.transporter.module.create('general_ui/arrows', function(requires) {

requires('core/commands');
requires('general_ui/basic_morph_mixins');

}, function(thisModule) {


thisModule.addSlots(avocado, function(add) {
  
  add.creator('arrow', {}, {category: ['ui']});

});


thisModule.addSlots(avocado.arrow, function(add) {

  add.creator('layout', {});

  add.creator('endpointLayout', {});

  add.creator('defaultStyle', {}, {category: ['styles']});

  add.method('createButtonForToggling', function (pointer) {
    // aaa - This is still a bit of a mess.

    var arrow;
    var shouldUsePlaceholdersAsArrowTogglingButtons = false; // aaa get rid of the old way after the new placeholder way is working.
    if (shouldUsePlaceholdersAsArrowTogglingButtons && pointer._slotMorph._shouldUseZooming) {
      var m = new avocado.PlaceholderMorph(function() { return avocado.ui.currentWorld().morphFor(pointer.slot().contents()); });
      m.setScale(0.25);
    } else {
      var m = avocado.command.create("Toggle arrow", function() { arrow._layout.toggleVisibility(); }).newMorph(pointer.labelMorph(), 0, pt(2,2));
    }

    arrow = m.arrow = avocado.ui.newMorph(avocado.ui.shapeFactory.newPolyLine([pt(0,0), pt(0,0)]));
    arrow.applyStyle(avocado.arrow.defaultStyle);
    arrow.setLayout(Object.newChildOf(avocado.arrow.layout, arrow, pointer.slot(), m, null));

    arrow._layout.noLongerNeedsToBeUpdated = true;
    arrow._layout.prepareToBeShown = pointer.prepareToBeShown.bind(pointer);

    pointer.notifiersToUpdateOn().each(function(notifier) { notifier.addObserver(arrow._layout.notificationFunction); });

    m.commands = function() {
      var cmdList = avocado.command.list.create();

      // aaa - To do "grab pointer" properly I think I need to do a more general drag-and-drop thing. Right
      // now nothing will get called if I drop the endpoint on something invalid (like the world or some
      // other morph), so the visibility will need to be toggled an extra time to get it back to normal.
      cmdList.addItem({label: "grab pointer", go: function(evt) {
        arrow._layout.needsToBeVisible();
        arrow._layout.endpoint2.grabMeWithoutZoomingAroundFirst(evt);
      }});

      pointer.addExtraCommandsTo(cmdList);

      return cmdList;
    };

    m.inspect = function() { return pointer.inspect(); };
    m.getHelpText = function() { return arrow._layout.noLongerNeedsToBeUpdated ? pointer.helpTextForShowing() : pointer.helpTextForHiding(); };

    return m;
  }, {category: ['toggling buttons']});

});


thisModule.addSlots(avocado.arrow.layout, function(add) {
  
  add.method('initialize', function (arrowMorph, assoc, ep1, ep2) {
    this._arrowMorph = arrowMorph;
    
    this._arrowMorph.shouldNotMoveWhenSlidingTheWorld = true; // Hack, not sure what exactly is going on.
    
    // Optimization: create this notificationFunction once, rather than needing to bind a new function every time it's called.
    this.notificationFunction = function() {setTimeout(this.putVerticesInTheRightPlace.bind(this), 0);}.bind(this);
    
    this.endpoint1 = ep1 || this.createArrowEndpoint(assoc, this._arrowMorph);
    this.endpoint2 = ep2 || this.createArrowEndpoint(assoc, this._arrowMorph);
    if (!ep1) { this.endpoint1._layout._otherEndpoint = this.endpoint2; }
    if (!ep2) { this.endpoint2._layout._otherEndpoint = this.endpoint1; }
    this.needsToBeVisible();
  }, {category: ['creating']});

  add.method('createArrowEndpoint', function (assoc, arrowMorph) {
    var m = avocado.ui.newMorph();
    m.setLayout(Object.newChildOf(avocado.arrow.endpointLayout, m, assoc, arrowMorph));
    m.isArrowEndpoint = true;
    m.shouldNotBePartOfRowOrColumn = true;
    m.suppressHandles = true;
    m.setFill(Color.black);

    m.okToDuplicate = function () { return false; };
    m.okToBeGrabbedBy = function (evt) { return this; };
    
    return m;
  }, {category: ['creating']});

  add.method('shouldIgnorePoses', function () { return true; }, {category: ['poses']});

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
  
  add.method('toggleVisibility', function () {
    this.setVisibility(this.noLongerNeedsToBeUpdated);
  }, {category: ['showing and hiding']});

  add.method('setVisibility', function (b, callWhenDone) {
    if (b) {
      this.showMe(callWhenDone);
    } else {
      this.noLongerNeedsToBeVisible(callWhenDone);
    }
  }, {category: ['showing and hiding']});

  add.method('prepareToBeShown', function (callWhenDone) {
    callWhenDone();
  }, {category: ['showing and hiding'], comment: 'Feel free to override me.'});

  add.method('showMe', function (callWhenDone) {
    if (this.noLongerNeedsToBeUpdated) {
      this.prepareToBeShown(function() {
        this.needsToBeVisible();
        if (callWhenDone) { callWhenDone(); }
      }.bind(this));
    }
  }, {category: ['showing and hiding']});

  add.method('noLongerNeedsToBeVisible', function (callWhenDone) {
    this.noLongerNeedsToBeUpdated = true;
    this.disappear(function() {
      this.stopUpdating();
      if (callWhenDone) { callWhenDone(); }
    }.bind(this));
  }, {category: ['showing and hiding']});

  add.method('needsToBeVisible', function () {
    this.noLongerNeedsToBeUpdated = false;
    this.tickQuickly();
  }, {category: ['showing and hiding']});

  add.method('putVerticesInTheRightPlace', function () {
    if (this.shouldBeShown()) {
      if (this.endpoint1._layout && this.endpoint1._layout.attachToTheRightPlace) { this.endpoint1._layout.attachToTheRightPlace(); }
      if (this.endpoint2._layout && this.endpoint2._layout.attachToTheRightPlace) { this.endpoint2._layout.attachToTheRightPlace(); }
      if (! this._arrowMorph.owner) {
        var w = avocado.ui.currentWorld();
        this.adjustScaleBasedOnWorldScale(w.getScale());
        w.addMorph(this._arrowMorph);
      }
      this.changeVerticesIfNecessary();
    } else {
      if (this._arrowMorph.owner) {
        this.disappear();
      }
    }
  }, {category: ['vertices']});

  add.method('changeVerticesIfNecessary', function () {
    var oldVertices = this._arrowMorph.shape.vertices();
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
    this._arrowMorph.setVertices(newVertices);

    if (! newVertices[0].eqPt(newVertices[1])) {
      var arrowDirection = newVertices[1].subPt(newVertices[0]);
      if (arrowDirection.rSquared() >= 225) {
        //console.log("endpoint1: " + newVertices[0] + ", endpoint2: " + newVertices[1] + ", arrowDirection: " + arrowDirection + ", arrowDirection.theta(): " + arrowDirection.theta());
        if (this.endpoint1._layout && this.endpoint1._layout.setShapeToLookLikeACircle) { this.endpoint1._layout.setShapeToLookLikeACircle(arrowDirection          .theta()); }
        if (this.endpoint2._layout && this.endpoint2._layout.setShapeToLookLikeAnArrow) { this.endpoint2._layout.setShapeToLookLikeAnArrow(arrowDirection.negated().theta()); }
      } else {
        // Workaround: the endpoint keeps being in weird places when it's very near the source,
        // and so the arrow head kept pointing in weird directions. Until I figure out the cause,
        // let's just not show the arrow head until it gets a bit further away.
        this.endpoint2._layout.setShapeToLookLikeNothing();
      }
    }
  }, {category: ['vertices']});
  
  add.method('adjustScaleBasedOnWorldScale', function (worldScale) {
    var inverse = 1 / worldScale;
    this._arrowMorph.setBorderWidth(inverse);
    if (this.endpoint1.isArrowEndpoint) { this.endpoint1.setScale(inverse); }
    if (this.endpoint2.isArrowEndpoint) { this.endpoint2.setScale(inverse); }
  }, {category: ['scaling']});
    
  add.method('justScaledWorld', function (worldScale) {
    this.adjustScaleBasedOnWorldScale(worldScale);
    this.putVerticesInTheRightPlace();
  }, {category: ['scaling']});

  add.method('disappear', function (callWhenDone) {
    avocado.callbackWaiter.on(function(finalCallback) {
      if (this.endpoint1._layout && this.endpoint1._layout.noLongerNeedsToBeVisibleAsArrowEndpoint) { this.endpoint1._layout.noLongerNeedsToBeVisibleAsArrowEndpoint(finalCallback()); }
      if (this.endpoint2._layout && this.endpoint2._layout.noLongerNeedsToBeVisibleAsArrowEndpoint) { this.endpoint2._layout.noLongerNeedsToBeVisibleAsArrowEndpoint(finalCallback()); }
    }.bind(this), function() {
      this.noLongerNeedsToBeUpdated = true;
      if (this._arrowMorph.owner) {
        this._arrowMorph.remove();
        this.tickSlowly();
      }
      if (callWhenDone) { callWhenDone(); }
    }.bind(this), "making the arrow disappear");
  }, {category: ['showing and hiding']});

  add.method('shouldBeShown', function () {
    if (this.noLongerNeedsToBeUpdated) { return false; }
    var m1 = this.endpoint1._layout && this.endpoint1._layout.determineWhichMorphToAttachTo ? this.endpoint1._layout.determineWhichMorphToAttachTo() : !!this.endpoint1.world();
    var m2 = this.endpoint2._layout && this.endpoint2._layout.determineWhichMorphToAttachTo ? this.endpoint2._layout.determineWhichMorphToAttachTo() : !!this.endpoint2.world();
    var w  = avocado.ui.currentWorld();
    return m1 && m2 && (m1 !== w || m2 !== w);
  }, {category: ['showing and hiding']});

  add.method('constructUIStateMemento', function (morph) {
    return ! this.noLongerNeedsToBeUpdated;
  }, {category: ['UI state']});

  add.method('assumeUIState', function (morph, uiState, callWhenDone, evt) {
    this.setVisibility(uiState, callWhenDone);
  }, {category: ['UI state']});

});


thisModule.addSlots(avocado.arrow.defaultStyle, function(add) {

  add.data('borderColor', new Color(0, 0, 0));

  add.data('borderWidth', 1);

  add.data('fill', null);

  add.data('suppressGrabbing', true);

  add.data('openForDragAndDrop', false);

  add.data('shouldIgnoreEvents', true);

});


thisModule.addSlots(avocado.arrow.endpointLayout, function(add) {
  
  add.method('initialize', function (arrowEndpointMorph, assoc, arrowMorph) {
    this._arrowEndpointMorph = arrowEndpointMorph;
    this._association = assoc;
    this._arrowMorph = arrowMorph;
  }, {category: ['creating']});

  add.method('determineWhichMorphToAttachTo', function () {
    var m = this._arrowEndpointMorph.owner instanceof HandMorph ? this._arrowEndpointMorph.owner : this.whichMorphToAttachTo();
    this._morphToAttachTo = m;
    return m;
  }, {category: ['attaching']});

  add.method('whichMorphToAttachTo', function () {
    var slotContents = this._association.contents();
    var morph = avocado.ui.currentWorld().existingMorphFor(slotContents);
    return morph ? (morph.world() ? morph : null) : null;
  }, {category: ['attaching']});

  add.method('stopCurrentAnimationIfAny', function () {
    if (this._animator) { this._animator.stopAnimating(); }
  }, {category: ['animating']});

  add.method('isZoomingTo', function () {
    return this._animator ? this._animator.isZoomingTo : undefined;
  }, {category: ['animating']});

  add.method('attachToTheRightPlace', function () {
    var morphToAttachTo = this._morphToAttachTo;
    var isZoomingTo = this.isZoomingTo();
    if (isZoomingTo === morphToAttachTo) {return;}
    this.stopCurrentAnimationIfAny();
    var oldOwner = this._arrowEndpointMorph.owner;
    if (! (morphToAttachTo instanceof HandMorph)) {
      if (morphToAttachTo === oldOwner && this.doesNotNeedToBeRepositionedIfItStaysWithTheSameOwner) {return;}
      
      if (morphToAttachTo !== WorldMorph.current()) {
        var otherEndpointLoc = this._otherEndpoint.worldPoint(this._otherEndpoint.relativeLineEndpoint());
        var localCenterOfMorphToAttachTo = morphToAttachTo.relativeCenterpoint();
        var globalCenterOfMorphToAttachTo = morphToAttachTo.worldPoint(localCenterOfMorphToAttachTo);
        var vectorFromCenterToOtherEndpoint = otherEndpointLoc.subPt(globalCenterOfMorphToAttachTo);
        var localPositionOfOtherEndpoint = localCenterOfMorphToAttachTo.addPt(vectorFromCenterToOtherEndpoint);
        var localNewLoc = this.localPositionClosestTo(localPositionOfOtherEndpoint, localCenterOfMorphToAttachTo).round();
        var globalNewLoc = morphToAttachTo.worldPoint(localNewLoc);
        
        var world = this._arrowEndpointMorph.world();
        var globalCurLoc;
        if (world) {
          globalCurLoc = this._arrowEndpointMorph.owner.worldPoint(this._arrowEndpointMorph.getPosition());
        } else {
          globalCurLoc = otherEndpointLoc;
          world = this._otherEndpoint.world();
        }
        world.addMorphAt(this._arrowEndpointMorph, globalCurLoc);
        this.stopCurrentAnimationIfAny();
        // aaa console.log("Now zooming from " + globalCurLoc + " to " + globalNewLoc + "; morphToAttachTo is " + Object.inspect(morphToAttachTo) + "; noLongerNeedsToBeUpdated is " + this._arrowMorph._layout.noLongerNeedsToBeUpdated);
        this._animator = this._arrowEndpointMorph.startWhooshingInAStraightLineTo(globalNewLoc, false, false, false, function() {
          var wasAlreadyAttachedToThisMorph = morphToAttachTo === this._arrowEndpointMorph.owner;
          morphToAttachTo.addMorphAt(this._arrowEndpointMorph, localNewLoc);
          if (!wasAlreadyAttachedToThisMorph) {
            morphToAttachTo.bringToFront();
            morphToAttachTo.wiggle(100);
          }
          delete this._animator;
        }.bind(this));
        this._animator.isZoomingTo = morphToAttachTo;
        
        this.doesNotNeedToBeRepositionedIfItStaysWithTheSameOwner = true;
      } else {
        if (! this._vectorFromOtherEndpoint) {this._vectorFromOtherEndpoint = this.calculateDefaultVectorFromOtherEndpoint();}
        var newLoc = this._otherEndpoint.world() ? this._otherEndpoint.worldPoint(pt(0,0)).addPt(this._vectorFromOtherEndpoint) : pt(0,0);
        morphToAttachTo.addMorphAt(this._arrowEndpointMorph, newLoc);
      }
    }

    this.registerForChangeNotification(oldOwner, morphToAttachTo);
  }, {category: ['attaching']});

  add.method('registerForChangeNotification', function (oldOwner, newOwner) {
    // Not really necessary because we have the update process, but it makes the UI look smoother
    // if we register to be notified whenever the owner changes position.
    if (newOwner !== oldOwner) {
      this.unregisterFromChangeNotification(oldOwner);
      newOwner.topmostOwnerBesidesTheWorldAndTheHand().changeNotifier().addObserver(this._arrowMorph._layout.notificationFunction);
    }
  }, {category: ['updating']});

  add.method('unregisterFromChangeNotification', function (oldOwner) {
    if (oldOwner) { oldOwner.topmostOwnerBesidesTheWorldAndTheHand().changeNotifier().removeObserver(this._arrowMorph._layout.notificationFunction); }
  }, {category: ['updating']});

  add.method('noLongerNeedsToBeVisibleAsArrowEndpoint', function (callWhenDone) {
    var isZoomingTo = this.isZoomingTo();
    if (isZoomingTo === null) {return;}
    this.unregisterFromChangeNotification(this.owner);
    this.stopCurrentAnimationIfAny();
    var world = this._arrowEndpointMorph.world();
    if (world && this._otherEndpoint.world()) {
      var globalCurLoc = this._arrowEndpointMorph.owner.worldPoint(this._arrowEndpointMorph.getPosition());
      var globalNewLoc = this._otherEndpoint.worldPoint(this._otherEndpoint.relativeLineEndpoint());
      // aaa console.log("OK, zooming from " + globalCurLoc + " to " + globalNewLoc + "; noLongerNeedsToBeUpdated is " + this._arrowMorph._layout.noLongerNeedsToBeUpdated);
      world.addMorphAt(this._arrowEndpointMorph, globalCurLoc);
      this._animator = this._arrowEndpointMorph.startWhooshingInAStraightLineTo(globalNewLoc, false, false, false, function() {
        delete this._animator;
        this._arrowEndpointMorph.remove();
        callWhenDone();
      }.bind(this));
      this._animator.isZoomingTo = null;
    } else {
      this._arrowEndpointMorph.remove();
      callWhenDone();
    }
  }, {category: ['showing and hiding']});

  add.method('justDidAnimatedPositionChange', function () {
    this._arrowMorph._layout.changeVerticesIfNecessary();
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
      this._arrowEndpointMorph.setShape(new lively.scene.Ellipse(pt(0,0).extent(pt(10,10))));
      this.wasAlreadySetToLookLikeACircle = true;
      this.wasAlreadySetToLookLikeAnArrow = false;
    }
    this._arrowEndpointMorph.setRotation(arrowTheta);
  }, {category: ['shape']});

  add.method('setShapeToLookLikeNothing', function (arrowTheta) {
    this._arrowEndpointMorph.setShape(new lively.scene.Rectangle(pt(0,0).extent(pt(0,0))));
    this.wasAlreadySetToLookLikeACircle = false;
    this.wasAlreadySetToLookLikeAnArrow = false;
  }, {category: ['shape']});

  add.method('setShapeToLookLikeAnArrow', function (arrowTheta) {
    if (! this.wasAlreadySetToLookLikeAnArrow) {
      var parallelVector = pt(1,0);
      var pointOnTipOfArrow = this._arrowEndpointMorph.relativeLineEndpoint();
      var middleOfBaseOfArrow = pointOnTipOfArrow.addPt(parallelVector.scaleBy(15.0));
      var vectorToPointOnBaseOfArrow = parallelVector.perpendicularVector().scaleBy(6.0);
      var verticesOfArrow = [pointOnTipOfArrow, middleOfBaseOfArrow.addPt(vectorToPointOnBaseOfArrow), middleOfBaseOfArrow.subPt(vectorToPointOnBaseOfArrow)];
      this._arrowEndpointMorph.setShape(new lively.scene.Polygon(verticesOfArrow, Color.black, 1, Color.black));
      this.wasAlreadySetToLookLikeAnArrow = true;
      this.wasAlreadySetToLookLikeACircle = false;
    }
    this._arrowEndpointMorph.setRotation(arrowTheta);
  }, {category: ['shape']});

  add.method('calculateDefaultVectorFromOtherEndpoint', function () {
    var e = this._otherEndpoint.lineEndpoint();
    var c = this._otherEndpoint.ownerCenterpoint();
    var d = e.subPt(c);
    var s = d.scaleToLength(50);
    return s;
  }, {category: ['attaching']});
  
});


thisModule.addSlots(avocado.morphMixins.Morph, function(add) {

  add.method('detachArrowEndpoints', function () {
    var world = this.world();
    if (world) {
      this.eachSubmorph(function(m) {
        if (m.isArrowEndpoint) {
          world.addMorphAt(m, this.worldPoint(m.getPosition()));
        }
      }.bind(this));
    }
  }, {category: ['arrows']});

  add.method('relativeLineEndpoint', function () {
    return this._cachedRelativeLineEndpoint || (this._cachedRelativeLineEndpoint = this.getExtent().scaleBy(0.5));
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
    return this.worldPoint(this.relativeLineEndpoint());
  }, {category: ['arrows']});

});


});
