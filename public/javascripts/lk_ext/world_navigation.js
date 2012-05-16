avocado.transporter.module.create('lk_ext/world_navigation', function(requires) {

}, function(thisModule) {


thisModule.addSlots(WorldMorph.prototype, function(add) {

  add.method('onMouseWheel', function (evt) {
	  if (evt.isCtrlDown() || evt.isMetaDown() || evt.isAltDown()) {
      var factor = Math.pow(1.2, (evt.rawEvent.wheelDeltaY / -600));
      this.zoomBy(factor, evt.point());
      // this.staySameSizeAndSmoothlyScaleTo(this.getScale() * factor, evt.point(), 200, this.refreshContentIfOnScreenOfMeAndSubmorphs.bind(this));
      return true;
    }
  }, {category: ['navigation']});

  add.creator('navigationAccessor', {}, {category: ['navigation']}, {comment: 'Needed because we can\'t yet translate the world, we have to translate all the morphs in it.'});

  add.method('slideIfClickedAtEdge', function (evt) {
    var b = this.fullBounds;
    var p = evt.point();
    var amountToSlide = 50;
    var v;
    if (           p.x <= 50) { v = pt(-amountToSlide, 0); }
    if (           p.y <= 50) { v = pt(0, -amountToSlide); }
    if (b.maxX() - p.x <= 50) { v = pt( amountToSlide, 0); }
    if (b.maxY() - p.y <= 50) { v = pt(0,  amountToSlide); }
    
    if (v) { this.slideBy(v.scaleBy(1 / this.getScale())); }
  }, {category: ['navigation']});

  add.method('slideBy', function (p) {
    var delta = p;
    //this.origin = this.origin.addPt(p);
    //this.shape.translateBy(delta.negated());
    // Blecch. I would have preferred to leave the morphs at the same world-coordinates and just
    // make the top-left corner be (-X,-Y) instead of (0,0). But that was turning out to be complicated.
    // So for now, just move all the morphs by (X,Y).
    this.eachSubmorph(function(m) {
      if (m.shouldStickToScreen) {
      } else {
        // The animated version is a bit weird for now, I think. -- Adam
        // m.startWhooshingInAStraightLineTo(m.position().addPt(delta), false, false, true);
        
        if (! (m.shouldNotMoveWhenSlidingTheWorld)) { // aaa I have no idea why this is necessary, but try taking it out and then zooming in while an arrow is visible
          m.moveBy(delta);
        }
      }
    });
    
    this.hands.forEach(function(m) {
      // The animated version is a bit weird for now, I think. -- Adam
      // m.startWhooshingInAStraightLineTo(m.position().addPt(delta), false, false, true);
      m.moveBy(delta);
    });
  }, {category: ['navigation']});

  add.method('smoothlySlideBy', function (p, functionToCallWhenDone) {
    var worldNavigator = Object.newChildOf(WorldMorph.prototype.navigationAccessor, this);
    var a = avocado.animation.newMovement(worldNavigator, avocado.animation.straightPath, p, p.r() / (400 * this.getScale()), false, false, true);
    worldNavigator.startZoomAnimation(a, functionToCallWhenDone);
  }, {category: ['navigation']});

  add.method('zoomBy', function (factor, pointerPosition) {
    this.zoomTo(this.getScale() * factor, pointerPosition);
  }, {category: ['navigation']});

  add.method('zoomTo', function (scale, pointerPosition) {
    var worldNavigator = Object.newChildOf(WorldMorph.prototype.navigationAccessor, this);
    
    worldNavigator.staySameSizeAndScaleTo(scale, pointerPosition);
  }, {category: ['navigation']});

  add.method('stickyMorphs', function (f) {
    return this.submorphs.select(function(m) { return m.shouldStickToScreen; });
  });

  add.method('startZoomAnimation', function (animation, functionToCallWhenDone) {
    if (this._zoomAnimation) { this._zoomAnimation.stopAnimating(); }
    this._zoomAnimation = animation;
    this.startAnimating(this._zoomAnimation, function() {
      delete this._zoomAnimation;
      if (functionToCallWhenDone) { functionToCallWhenDone(); }
    }.bind(this));
  }, {category: ['scaling']});

  add.method('staySameSizeAndSmoothlyScaleTo', function (desiredScale, currentPointerPosFn, mainDuration, functionToCallWhenDone) {
    var worldNavigator = Object.newChildOf(WorldMorph.prototype.navigationAccessor, this);
    this.startZoomAnimation(avocado.animation.newSpeedStepper(worldNavigator, desiredScale, {
      getValue: function(m   ) { return worldNavigator.getScale();                                       },
      setValue: function(m, v) {        worldNavigator.staySameSizeAndScaleTo(v, currentPointerPosFn()); }
    }, mainDuration), functionToCallWhenDone);
  }, {category: ['scaling']});

  add.method('staySameSizeAndSmoothlySlideAndScaleTo', function (desiredCenterPosition, desiredScale, targetMorph, functionToCallWhenDone) {
    var worldNavigator = Object.newChildOf(WorldMorph.prototype.navigationAccessor, this);
    
    var extent = worldNavigator.getExtent();
    var currentScale = worldNavigator.getScale();
    var currentCenterPosition = worldNavigator.getPosition().addPt(extent.scaleBy(currentScale * 0.5));
    var totalDistance = currentCenterPosition.subPt(desiredCenterPosition).r();
    
    var cruisingScale = currentScale / ((0.001 * totalDistance * currentScale) + 1);
    // Trying to improve on the above way, but so far I don't like this better.
    // var cruisingScale = 800 / totalDistance;
    
    
    var needToLand = true;
    var needToCruise = true;
    var needToTakeOff = true;
    if (totalDistance * currentScale < 0.0001) {
      needToCruise = false;
    }
    if (Math.abs(1 - (currentScale / cruisingScale)) < 0.1) {
      cruisingScale = currentScale;
      needToTakeOff = false;
    }
    if (Math.abs(1 - (desiredScale / cruisingScale)) < 0.1) {
      cruisingScale = desiredScale;
      needToLand = false;
    }
    if (desiredScale > cruisingScale && cruisingScale > currentScale) {
      cruisingScale = currentScale; // no sense doing a zoom-out + slide + zoom-in; just slide and zoom-in
      needToTakeOff = false;
    } else if (desiredScale < cruisingScale) {
      cruisingScale = desiredScale; // no sense doing a zoom-out + slide + zoom-in; just zoom-out and slide
      needToLand = false;
    }
    
    
    //console.log("desiredCenterPosition is " + desiredCenterPosition + ", currentCenterPosition is " + currentCenterPosition + ", totalDistance is " + totalDistance + ", currentScale is " + currentScale + ", using cruisingScale " + cruisingScale + ", desiredScale is " + desiredScale);
    
    var land = function() {
      if (needToLand) {
        //console.log("desiredScale: " + desiredScale);
        this.staySameSizeAndSmoothlyScaleTo(desiredScale, function() { return worldNavigator.getExtent().scaleBy(0.5); }, 1000, functionToCallWhenDone);
      } else {
        // done!
      }
    }.bind(this);
    
    var cruise = function() {
      if (needToCruise) {
        var targetMorphCenterPos = targetMorph.owner.worldPoint(targetMorph.getPosition().addPt(targetMorph.getExtent().scaleBy(targetMorph.getScale() * 0.5)));
        var cruisingEndPosition = targetMorphCenterPos.subPt(this.getExtent().scaleBy(0.5));

        //console.log("cruisingEndPosition: " + cruisingEndPosition);
        this.smoothlySlideBy(cruisingEndPosition.negated(), needToLand ? land : null);
      } else {
        land();
      }
    }.bind(this);
    
    var takeOff = function() {
      if (needToTakeOff) {
        this.staySameSizeAndSmoothlyScaleTo(cruisingScale, function() { return worldNavigator.getExtent().scaleBy(0.5); }, 1000, cruise);
      } else {
        cruise();
      }
    }.bind(this);
    
    takeOff();
  }, {category: ['navigation']});

  add.method('fixFonts', function () {
    // OK, this is kinda ridiculous, but removing and re-adding the rawNode seems to fix that
    // font-scaling problem where the text would look very strange. Of course, this means
    // that the fonts are constantly adjusting themselves as you zoom in and out, which
    // is a bit distracting, but... well, it's better than the fonts *not* adjusting.
    var worldNode = this.rawNode;
    var parentNode = worldNode.parentNode;
    parentNode.removeChild(worldNode);
    parentNode.appendChild(worldNode);
  }, {category: ['refreshing']});

  add.method('scheduleRefresh', function () {
    // Need to refresh, but don't want to do it too often - it's unnecessary and noticeably slows things down.
    // So unschedule the previously-scheduled refresh, since we're about to schedule a new one.
    var world = this;
    if (typeof(world._scheduledZoomRefresh) !== 'undefined') { clearTimeout(world._scheduledZoomRefresh); }
    world._scheduledZoomRefresh = setTimeout(function() {
      world._scheduledZoomRefresh = undefined;
      world.refreshContentIfOnScreenOfMeAndSubmorphs();
      world.fixFonts();
    }, 50);
  }, {category: ['refreshing']});

});


thisModule.addSlots(WorldMorph.prototype.navigationAccessor, function(add) {

  add.method('initialize', function (w) {
    this._world = w;
    this._position = pt(0,0);
  });

  add.method('getPosition', function () {
    return this._position;
  });

  add.method('setPositionAndDoMotionBlurIfNecessary', function (newPos) {
    var delta = newPos.subPt(this.getPosition());
    this._world.slideBy(delta);
    this._position = newPos;
  });

  add.method('getScale', function () {
    return this._world.getScale();
  });

  add.method('setScale', function (s) {
    return this._world.setScale(s);
  });

  add.method('getExtent', function () {
    return this._world.getExtent();
  });

  add.method('setExtent', function (r) {
    return this._world.setExtent(r);
  });

  add.method('staySameSizeAndScaleTo', function (s, currentPointerPos) {
    var world = this._world;
    var oldScale = this.getScale();
    var scalingFactor = s / oldScale;
    var desiredSize = this.getExtent().scaleBy(oldScale);
    this.setScale(s);
    this.setExtent(desiredSize.scaleBy(1 / s));
    var delta = (currentPointerPos || pt(0,0)).translationNeededToStayInSameScreenPositionWhenScalingTheWorldBy(scalingFactor);
    world.slideBy(delta);
    world.hands.each(function(m) { m.setScale(1 / s); });
    world.stickyMorphs().each(function(m) { m.setScale(1 / s); m.moveBy(m.origin.translationNeededToStayInSameScreenPositionWhenScalingTheWorldBy(scalingFactor)); });
    world.eachSubmorph(function(m) {
      if (m) { m.justScaledWorld(s); }
    });
    world.scheduleRefresh();
  });

  add.method('isOnScreen', function () {
    return true;
  });

  add.method('hands', function () {
    return this._world.hands;
  });

  add.method('startAnimating', function (animator, functionToCallWhenDone) {
    animator.stopAnimating();
    animator.whenDoneCall(functionToCallWhenDone);
    animator.startAnimating(this);
    return animator;
  });

  add.method('startZoomAnimation', function (animation, functionToCallWhenDone) {
    if (this._world._zoomAnimation) { this._world._zoomAnimation.stopAnimating(); }
    this._world._zoomAnimation = animation;
    this.startAnimating(this._world._zoomAnimation, function() {
      delete this._world._zoomAnimation;
      if (functionToCallWhenDone) { functionToCallWhenDone(); }
    }.bind(this));
  });

});


thisModule.addSlots(Point.prototype, function(add) {

  add.method('translationNeededToStayInSameScreenPositionWhenScalingTheWorldBy', function (scalingFactor) {
    var desiredNewPosition = this.scaleBy(1 / scalingFactor);
    var delta = desiredNewPosition.subPt(this);
    return delta;
  }, {category: ['scaling']});

});


thisModule.addSlots(Morph.prototype, function(add) {

  add.method('navigateToMe', function (evt, functionToCallWhenDone) {
    var world = this.world();
    var myBounds = this.bounds();
    var myWidth = myBounds.width;
    var myHeight = myBounds.height;
    var worldSize = world.getExtent();
    var scalingFactor = Math.min(worldSize.x / myWidth, worldSize.y / myHeight).scaleBy(1 / this.owner.overallScale(world));
    var desiredCenterPosition = this.owner.worldPoint(myBounds.center()).scaleBy(world.getScale());
    
    world.staySameSizeAndSmoothlySlideAndScaleTo(desiredCenterPosition, scalingFactor * world.getScale(), this, functionToCallWhenDone);
  }, {category: ['navigating']});

  add.method('navigateToMeImmediately', function (evt, functionToCallWhenDone) {
    var world = this.world();
    var myBounds = this.bounds();
    var myWidth = myBounds.width;
    var myHeight = myBounds.height;
    var worldSize = world.getExtent();
    var scalingFactor = Math.min(worldSize.x / myWidth, worldSize.y / myHeight);
    var desiredPosition = this.owner.worldPoint(myBounds.topLeft());
    
    world.slideBy(desiredPosition.negated());
    world.zoomBy(scalingFactor, pt(0,0));
    
    if (functionToCallWhenDone) { functionToCallWhenDone(); }
  }, {category: ['navigating']});

  add.method('justScaledWorld', function (worldScale) {
    if (this._layout && typeof(this._layout.justScaledWorld) === 'function') {
      this._layout.justScaledWorld(worldScale);
    }
  }, {category: ['scaling']});

});


});
