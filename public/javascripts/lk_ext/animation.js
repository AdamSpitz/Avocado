transporter.module.create('lk_ext/animation', function(requires) {

requires('core/animation_math');

}, function(thisModule) {


  thisModule.addSlots(Morph.prototype, function(add) {

    add.method('isOnScreen', function () {
      var w = this.world();
      return w && (w === this || w.bounds().containsPoint(this.owner.worldPoint(this.getPosition())));
    }, {category: ['testing']});

    add.method('startZoomingOuttaHere', function () {
      var w = this.world();
      if (w) {
        return this.startZoomingTo(pt(w.getExtent().x + 300, -300), true, false, function() {this.remove();}.bind(this));
      } else {
        return null;
      }
    }, {category: ['zooming around']});

    add.method('startZoomingTo', function (loc, shouldAnticipateAtStart, shouldWiggleAtEnd, functionToCallWhenDone) {
      return this.startAnimating(avocado.animation.newMovement(this, avocado.animation.arcPath, loc, 3, shouldAnticipateAtStart, shouldWiggleAtEnd, !shouldWiggleAtEnd), functionToCallWhenDone);
    }, {category: ['zooming around']});

    add.method('startZoomingInAStraightLineTo', function (loc, shouldAnticipateAtStart, shouldWiggleAtEnd, shouldDecelerateAtEnd, functionToCallWhenDone) {
      return this.startAnimating(avocado.animation.newMovement(this, avocado.animation.straightPath, loc, 2, shouldAnticipateAtStart, shouldWiggleAtEnd, shouldDecelerateAtEnd), functionToCallWhenDone);
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
      return m.getExtent().scaleBy(0.5).subPt(this.getExtent().scaleBy(0.5));
    });

    add.method('showTemporarilyInCenterOfWorld', function (w) {
      this.showInWorldAt(w, this.positionToCenterIn(w), function() {this.zoomAwayAfter(5000);}.bind(this));
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
        var extent = this.getExtent();
        var oldPos = this.getPosition();
        var difference = newPos.subPt(oldPos);
        var ratio = Math.max(Math.abs(difference.x) / extent.x, Math.abs(difference.y) / extent.y);
        if (ratio > 0.5) {
          var bounds = this.bounds();
          var allVertices = bounds.vertices().concat(bounds.translatedBy(difference).vertices());
          var convexVertices = avocado.quickhull.getConvexHull(allVertices).map(function(a) {return a.pointA;});
          var motionBlurMorph = Morph.makePolygon(convexVertices, 0, Color.black, this.getFill());
          motionBlurMorph.aaa_doesNotNeedACreatorSlot = true; // aaa HACK to fix performance bug
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
      var owner = this.owner;
      if (owner !== w) {
        var initialLoc = (!owner || this.world() !== w) ? this.getExtent().negated() : owner.worldPoint(this.getPosition());
        w.addMorphAt(this, initialLoc);
        this.startZoomingTo(desiredLoc, shouldAnticipateAtStart, shouldWiggleAtEnd, functionToCallWhenDone);
      } else {
        if (shouldMoveToDesiredLocEvenIfAlreadyInWorld) {
          this.startZoomingTo(desiredLoc, shouldAnticipateAtStart, shouldWiggleAtEnd, functionToCallWhenDone);
        } else {
          if (functionToCallWhenDone) { functionToCallWhenDone(); }
        }
      }
    }, {category: ['adding and removing']});

    add.method('ensureIsNotInWorld', function () {
      if (this.world()) {this.startZoomingOuttaHere();}
    }, {category: ['adding and removing']});

    add.method('animatedAddMorphAt', function (m, p, callWhenDone) {
      var w = this.world();
      if (w) {
        w.addMorphFront(m); // make sure it's in front
        m.ensureIsInWorld(w, this.worldPoint(p), true, true, false, function() {
          this.addMorphAt(m, p);
          if (callWhenDone) { callWhenDone(); }
        }.bind(this));
      } else {
        this.addMorphAt(m, p);
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

    add.method('smoothlyFadeTo', function (desiredAlpha, functionToCallWhenDone) {
      this.startAnimating(avocado.animation.newFader(this, desiredAlpha), functionToCallWhenDone);
    }, {category: ['resizing']});

    add.method('smoothlyResizeTo', function (desiredSize, functionToCallWhenDone) {
      this.startAnimating(avocado.animation.newResizer(this, desiredSize), functionToCallWhenDone);
    }, {category: ['resizing']});

    add.method('smoothlyScaleTo', function (desiredScale, functionToCallWhenDone) {
      this.startAnimating(avocado.animation.newScaler(this, desiredScale), functionToCallWhenDone);
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

    add.method('staySameSizeAndSmoothlyScaleTo', function (desiredScale, functionToCallWhenDone) {
      var desiredSize = this.getExtent().scaleBy(this.getScale());
      var originalBounds = this.innerBounds();
      var desiredPos = originalBounds.topLeft();
      //console.log("Before scaling, originalBounds is " + originalBounds);
      var accessor = {
        getValue: function(m) {return m.getScale();},
        setValue: function(m, v) {
          m.setScale(v);
          var newBounds = desiredPos.extent(desiredSize.scaleBy(1 / v));
          //console.log("Setting new bounds to " + newBounds);
          m.setBounds(newBounds);
          m.translateBy(desiredPos.negated());
        }
      };
      var animator = avocado.animation.newSpeedStepper(this, desiredScale, accessor, 200, 80);
      this.startAnimating(animator, functionToCallWhenDone);
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

    add.method('startZoomingOuttaHere', function ($super) {
      // Alternate way that I don't think looks quite as good: this.selectedMorphs.invoke('startZoomingOuttaHere');

      this.selectedMorphs.each(function(m) {
        this.addMorphAt(m, this.relativize(m.owner.worldPoint(m.getPosition())));
      }.bind(this));
      $super();
    }, {category: ['zooming around']});

  });


});
