avocado.transporter.module.create('lk_ext/animation', function(requires) {

requires('core/animation_math');

}, function(thisModule) {


thisModule.addSlots(Morph.prototype, function(add) {

  add.method('isOnScreen', function () {
    var w = this.world();
    if (!w) { /* console.log(this + " is not on screen because it's not in the world"); */ return false; }
    if (w === this) { return true; }
    // var wTransform = w.getTransform();
    var wBounds = w.visibleBoundsCachingIfPossible();
    var thisBounds = this.shape.bounds();
    var transformedBounds = thisBounds.matrixTransform(this.transformToMorph(w));
    var intersects = wBounds.intersects(transformedBounds);
    // console.log("For " + this + ", intersects is " + intersects + "; wBounds is " + wBounds + ", transformedBounds is " + transformedBounds);
    return intersects;
  }, {category: ['testing']});

  add.method('visibleBoundsCachingIfPossible', function () {
    // Calling world.visibleBounds() from isOnScreen turned out to be a performance problem, so let's
    // try a simple cache. -- Adam
    
    if (!this._cachedVisibleBounds) {
      this._cachedVisibleBounds = this.visibleBounds();
    }
    return this._cachedVisibleBounds;
  }, {category: ['accessing']});

  add.method('startZoomingOuttaHere', function (functionToCallWhenDone) {
      var w = this.world();
      if (w) {
        this.becomeDirectSubmorphOfWorld(w);
        var howFarOutside = 300 / w.getScale();
        this.startZoomingTo(pt(w.getExtent().x + howFarOutside, -howFarOutside), true, false, function() {
          this.remove();
          if (functionToCallWhenDone) { functionToCallWhenDone(); }
        }.bind(this));
      } else {
        if (functionToCallWhenDone) { functionToCallWhenDone(); }
      }
    }, {category: ['zooming around']});

  add.method('startZoomingTo', function (loc, shouldAnticipateAtStart, shouldWiggleAtEnd, functionToCallWhenDone) {
      return this.startAnimating(avocado.animation.newMovement(this, avocado.animation.arcPath, loc, 3 / WorldMorph.current().getScale(), shouldAnticipateAtStart, shouldWiggleAtEnd, !shouldWiggleAtEnd), functionToCallWhenDone);
    }, {category: ['zooming around']});

  add.method('startZoomingInAStraightLineTo', function (loc, shouldAnticipateAtStart, shouldWiggleAtEnd, shouldDecelerateAtEnd, functionToCallWhenDone) {
      return this.startAnimating(avocado.animation.newMovement(this, avocado.animation.straightPath, loc, 2 / WorldMorph.current().getScale(), shouldAnticipateAtStart, shouldWiggleAtEnd, shouldDecelerateAtEnd), functionToCallWhenDone);
    }, {category: ['zooming around']});

  add.method('zoomAwayAfter', function (ms) {
      var originalOwner    = this.owner;
      var originalPosition = this.getPosition();
      this.zoomOuttaHereTimer = window.setTimeout(function() {
        if (this.owner === originalOwner && originalPosition.equals(this.getPosition())) {
          this.startZoomingOuttaHere();
        }
      }.bind(this), ms || 5000);
    });

  add.method('positionToCenterIn', function (m) {
      return m.getExtent().scaleBy(0.5).subPt(this.getExtent().scaleBy(this.getScale() * 0.5));
    });

  add.method('showTemporarilyInCenterOfWorld', function (w) {
      this.showInCenterOfWorld(w, function() {this.zoomAwayAfter(5000);}.bind(this));
    });

  add.method('showInCenterOfWorld', function (w, callback) {
      this.showInWorldAt(w, this.positionToCenterIn(w), callback);
    });

  add.method('showInWorldAt', function (w, p, callWhenDone) {
      this.ensureIsInWorld(w, p, true, false, true, callWhenDone);
    });

  add.method('startAnimating', function (animator, functionToCallWhenDone) {
      animator.stopAnimating();
      animator.whenDoneCall(functionToCallWhenDone);
      animator.startAnimating(this);
      return animator;
    }, {category: ['zooming around']});

  add.method('wiggle', function (duration) {
      return this.startAnimating(avocado.animation.newWiggler(this, null, duration));
    }, {category: ['wiggling']});

  add.method('setPositionAndDoMotionBlurIfNecessary', function (newPos, blurTime) {
      var world = this.world();
      if (world) {
  			var scaledExtent = this.getExtent().scaleBy(this.overallScale(world));
        var oldPos = this.getPosition();
        var difference = newPos.subPt(oldPos);
        var ratio = Math.max(Math.abs(difference.x) / scaledExtent.x, Math.abs(difference.y) / scaledExtent.y);
        // console.log("Do we want motion blur? difference is " + difference + ", scaledExtent is " + scaledExtent + ", so ratio is " + ratio);
        if (ratio > 0.5) {
          // aaa - I am sure that there's a more elegant way to get the globalBounds.
          // aaa - And I don't even think this works right.
    			var topLeft = this.owner.worldPoint(this.getPosition());
    			var globalBounds = topLeft.extent(scaledExtent);
    			
          var allVertices = globalBounds.vertices().concat(globalBounds.translatedBy(difference).vertices());
          var convexVertices = avocado.quickhull.getConvexHull(allVertices).map(function(a) {return a.pointA;});
          var motionBlurMorph = Morph.makePolygon(convexVertices, 0, Color.black, this.getFill());
          motionBlurMorph.doesNotNeedACreatorSlot = true; // aaa HACK to fix performance bug
          // could try adjusting the opacity based on the distance, but I tried that and
          // couldn't figure out how to make it look non-weird
          motionBlurMorph.setFillOpacity(0.3);
          motionBlurMorph.closeDnD();
          motionBlurMorph.ignoreEvents();
          world.addMorphBack(motionBlurMorph);
          setTimeout(function() {motionBlurMorph.remove();}, blurTime);
        }
      }
      this.setPosition(newPos);
      if (this.justDidAnimatedPositionChange) { this.justDidAnimatedPositionChange(); }
    }, {category: ['motion blur']});

  add.method('ensureIsInWorld', function (w, desiredLoc, shouldMoveToDesiredLocEvenIfAlreadyInWorld, shouldAnticipateAtStart, shouldWiggleAtEnd, functionToCallWhenDone) {
    var originalOwner = this.owner;
    this.becomeDirectSubmorphOfWorld(w);
    if (originalOwner !== w || shouldMoveToDesiredLocEvenIfAlreadyInWorld) {
      if (typeof(desiredLoc.desiredScale) !== 'undefined') { this.smoothlyScaleTo(desiredLoc.desiredScale); } // aaa hack
      this.startZoomingTo(desiredLoc, shouldAnticipateAtStart, shouldWiggleAtEnd, functionToCallWhenDone);
    } else {
      if (functionToCallWhenDone) { functionToCallWhenDone(); }
    }
  }, {category: ['adding and removing']});

  add.method('becomeDirectSubmorphOfWorld', function (w) {
    var owner = this.owner;
    if (w) {
      if (owner !== w) {
        var initialLoc = (!owner || this.world() !== w) ? this.getExtent().scaleBy(-1.1).addXY(-200,-200) : owner.worldPoint(this.getPosition());
        if (owner && this.doIOrMyOwnersWantToLeaveAPlaceholderWhenRemovingMe()) { new avocado.PlaceholderMorph(this).putInPlaceOfOriginalMorph(); }
        this.refreshContentOfMeAndSubmorphsIfNeverRefreshedBefore(); // aaa - not sure this is a good idea, but maybe; it makes sure that a mirror will be updated as soon as it's visible, for one thing.
        w.addMorphAt(this, initialLoc);
      }
    } else {
      if (owner && this.doIOrMyOwnersWantToLeaveAPlaceholderWhenRemovingMe()) { new avocado.PlaceholderMorph(this).putInPlaceOfOriginalMorph(); }
    }
  }, {category: ['adding and removing']});

  add.method('ensureIsNotInWorld', function () {
    if (this.world()) {this.startZoomingOuttaHere();}
  }, {category: ['adding and removing']});

  add.method('animatedAddMorphAt', function (m, p, callWhenDone) {
    this.summonMorphToPosition(m, p, m.getScale(), function() {
      this.addMorphAt(m, p);
    }.bind(this));
  }, {category: ['adding and removing']});

  add.method('animatedReplaceMorph', function (currentSubmorph, newSubmorph, callWhenDone) {
    this.summonMorphToPosition(newSubmorph, currentSubmorph.getPosition(), currentSubmorph.overallScale(currentSubmorph.world()), function() {
      this.replaceMorph(currentSubmorph, newSubmorph);
      if (callWhenDone) { callWhenDone(); }
    }.bind(this));
  }, {category: ['adding and removing']});

  add.method('summonMorphToPosition', function (m, pos, scale, callWhenDone) {
    var w = this.world();
    m.becomeDirectSubmorphOfWorld(w);
    if (w) {
      var desiredWorldPos = this.worldPoint(pos);
      desiredWorldPos.desiredScale = scale;
      m.ensureIsInWorld(w, desiredWorldPos, true, true, false, function() {
        if (callWhenDone) { callWhenDone(); }
      }.bind(this));
    } else {
      if (callWhenDone) { callWhenDone(); }
    }
  }, {category: ['adding and removing']});

  add.method('createDismissButton', function () {
    var size = 22 * (Config.fatFingers ? 2 : 1);
    var b = new WindowControlMorph(new Rectangle(0, 0, size, size), 3, Color.primary.orange);
    b.relayToModel(this, {Trigger: "=ensureIsNotInWorld"});
    b.setHelpText('Dismiss me');
    return b;
  }, {category: ['adding and removing']});

  add.method('createDismissButtonThatOnlyAppearsIfTopLevel', function () {
    return Morph.createOptionalMorph(this.createDismissButton.bind(this).memoize(), function() {
      return (! this.owner) || (this.owner instanceof WorldMorph) || (this.owner instanceof HandMorph) || (this.owner instanceof avocado.CarryingHandMorph);
    }.bind(this));
  }, {category: ['adding and removing']});
  
  add.method('setFillOpacityRecursively', function (a) {
    // console.log("setFillOpacityRecursively: " + a);
    this.setFillOpacity(a);
    for (var i = 0, n = this.submorphs.length; i < n; ++i) {
      this.submorphs[i].setFillOpacityRecursively(a);
    }
  }, {category: ['fading']});

  add.method('smoothlyFadeTo', function (desiredAlpha, functionToCallWhenDone) {
    this.startAnimating(avocado.animation.newFader(this, desiredAlpha), functionToCallWhenDone);
  }, {category: ['fading']});

  add.method('smoothlyResizeTo', function (desiredSize, functionToCallWhenDone) {
      this.startAnimating(avocado.animation.newResizer(this, desiredSize), functionToCallWhenDone);
    }, {category: ['resizing']});

  add.method('smoothlyScaleTo', function (desiredScale, functionToCallWhenDone) {
      this.startAnimating(avocado.animation.newScaler(this, desiredScale), functionToCallWhenDone);
    }, {category: ['scaling']});

  add.method('smoothlyScaleHorizontallyTo', function (desiredScale, functionToCallWhenDone) {
      this.startAnimating(avocado.animation.newHorizontalScaler(this, desiredScale), functionToCallWhenDone);
    }, {category: ['scaling']});

  add.method('smoothlyScaleVerticallyTo', function (desiredScale, functionToCallWhenDone) {
      this.startAnimating(avocado.animation.newVerticalScaler(this, desiredScale), functionToCallWhenDone);
    }, {category: ['scaling']});

  add.method('stayCenteredAndSmoothlyScaleTo', function (desiredScale, centerPos, functionToCallWhenDone) {
      var center = this.innerBounds().center();
      this.moveOriginBy(center);
      this.translateBy(center.negated());

      this.smoothlyScaleTo(desiredScale, function() {
        this.moveOriginBy(center.negated());
        if (functionToCallWhenDone) { functionToCallWhenDone(); }
      }.bind(this));
    }, {category: ['scaling']});

});


thisModule.addSlots(WindowMorph.prototype, function(add) {

  add.method('initiateShutdown', function () {
      if (this.isShutdown()) { return; }
      this.targetMorph.shutdown(); // shutdown may be prevented ...
      this.ensureIsNotInWorld(); // used to say this.remove(), changed by Adam so that it does the cool zooming-off-the-screen thing
      this.state = 'shutdown'; // no one will ever know...
      return true;
    }, {category: ['closing']});

});


thisModule.addSlots(SelectionMorph.prototype, function(add) {

  add.method('startZoomingOuttaHere', function ($super, callWhenDone) {
      // Alternate way that I don't think looks quite as good: this.selectedMorphs.invoke('startZoomingOuttaHere');

      this.selectedMorphs.each(function(m) {
        this.addMorphAt(m, this.relativize(m.owner.worldPoint(m.getPosition())));
      }.bind(this));
      $super(callWhenDone);
    }, {category: ['zooming around']});

});


});
