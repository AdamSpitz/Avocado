avocado.transporter.module.create('lk_ext/world_navigation', function(requires) {

}, function(thisModule) {


thisModule.addSlots(WorldMorph.prototype, function(add) {

  add.method('onMouseWheel', function (evt) {
	  if (evt.isCtrlDown() || evt.isMetaDown() || evt.isAltDown()) {
      var factor = Math.pow(1.2, (evt.rawEvent.wheelDeltaY / -600));
      this.zoomBy(factor, evt.point());
      this.refreshContentIfOnScreenOfMeAndSubmorphs(); // I hope this isn't too slow
      // this.staySameSizeAndSmoothlyScaleTo(this.getScale() * factor, evt.point(), 200, 80, this.refreshContentIfOnScreenOfMeAndSubmorphs.bind(this));
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
    this.submorphs.each(function(m) {
      if (m.shouldStickToScreen) {
      } else {
        // The animated version is a bit weird for now, I think. -- Adam
        // m.startZoomingInAStraightLineTo(m.position().addPt(delta), false, false, true);
        
        if (! (m instanceof avocado.ArrowMorph)) { // aaa I have no idea why this is necessary, but try taking it out and then zooming in while an arrow is visible
          m.moveBy(delta);
        }
      }
    });
    
    this.hands.each(function(m) {
      // The animated version is a bit weird for now, I think. -- Adam
      // m.startZoomingInAStraightLineTo(m.position().addPt(delta), false, false, true);
      m.moveBy(delta);
    });
  }, {category: ['navigation']});
  
  add.method('smoothlySlideBy', function (p, functionToCallWhenDone) {
    var worldNavigator = Object.newChildOf(WorldMorph.prototype.navigationAccessor, this);
    var a = avocado.animation.newMovement(worldNavigator, avocado.animation.straightPath, p, p.r() * this.getScale() / 400, false, false, true);
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

  add.method('staySameSizeAndSmoothlyScaleTo', function (desiredScale, currentPointerPosFn, mainDuration, accelOrDecelDuration, functionToCallWhenDone) {
    var worldNavigator = Object.newChildOf(WorldMorph.prototype.navigationAccessor, this);
    this.startZoomAnimation(avocado.animation.newSpeedStepper(worldNavigator, desiredScale, {
      getValue: function(m   ) { return worldNavigator.getScale();                                       },
      setValue: function(m, v) {        worldNavigator.staySameSizeAndScaleTo(v, currentPointerPosFn()); }
    }, mainDuration, accelOrDecelDuration), functionToCallWhenDone);
  }, {category: ['scaling']});

  add.method('staySameSizeAndSmoothlySlideAndScaleTo', function (desiredPosition, desiredScale, targetMorph, functionToCallWhenDone) {
    var worldNavigator = Object.newChildOf(WorldMorph.prototype.navigationAccessor, this);
    
    var currentScale = worldNavigator.getScale();
    var totalDistance = worldNavigator.getPosition().subPt(desiredPosition).r();
    var cruisingScale = currentScale / ((0.001 * totalDistance) + 1);
    
    //console.log("totalDistance is " + totalDistance + ", using cruisingScale " + cruisingScale);

    this.staySameSizeAndSmoothlyScaleTo(cruisingScale, function() { return worldNavigator.getExtent().scaleBy(0.5); }, 1000, 400, function() {
      var targetMorphCenterPos = targetMorph.owner.worldPoint(targetMorph.getPosition().addPt(targetMorph.getExtent().scaleBy(targetMorph.getScale() * 0.5)));
      var cruisingEndPosition = targetMorphCenterPos.subPt(this.getExtent().scaleBy(0.5));
      
      //console.log("cruisingEndPosition: " + cruisingEndPosition);
      this.smoothlySlideBy(cruisingEndPosition.negated(), function() {
        //console.log("desiredScale: " + desiredScale);
        this.staySameSizeAndSmoothlyScaleTo(desiredScale, function() { return worldNavigator.getExtent().scaleBy(0.5); }, 1000, 400, functionToCallWhenDone);
      }.bind(this));
    }.bind(this));
  }, {category: ['navigation']});

});


thisModule.addSlots(Point.prototype, function(add) {

  add.method('translationNeededToStayInSameScreenPositionWhenScalingTheWorldBy', function (scalingFactor) {
    var desiredNewPosition = this.scaleBy(1 / scalingFactor);
    var delta = desiredNewPosition.subPt(this);
    return delta;
  }, {category: ['scaling']});

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
    var oldScale = this.getScale();
    var scalingFactor = s / oldScale;
    var desiredSize = this.getExtent().scaleBy(oldScale);
    this.setScale(s);
    this.setExtent(desiredSize.scaleBy(1 / s));
    var delta = (currentPointerPos || pt(0,0)).translationNeededToStayInSameScreenPositionWhenScalingTheWorldBy(scalingFactor);
    this._world.slideBy(delta);
    this._world.hands.each(function(m) { m.setScale(1 / s); });
    this._world.stickyMorphs().each(function(m) { m.setScale(1 / s); m.moveBy(m.origin.translationNeededToStayInSameScreenPositionWhenScalingTheWorldBy(scalingFactor)); });
    this._world.submorphs.forEach(function(m) {
      if (typeof(m.justScaledWorld) === 'function') {
        m.justScaledWorld(s);
      }
    });
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

  
thisModule.addSlots(Morph.prototype, function(add) {

  add.method('navigateToMe', function (evt) {
    var world = this.world();
    var myBounds = this.bounds();
    var myWidth = myBounds.width;
    var myHeight = myBounds.height;
    var worldSize = world.getExtent();
    var scalingFactor = Math.min(worldSize.x / myWidth, worldSize.y / myHeight);
    var desiredPosition = this.owner.worldPoint(myBounds.topLeft());
    
    world.staySameSizeAndSmoothlySlideAndScaleTo(desiredPosition, scalingFactor * world.getScale(), this);
  }, {category: ['navigating']});

  add.method('navigateToMeImmediately', function (evt) {
    var world = this.world();
    var myBounds = this.bounds();
    var myWidth = myBounds.width;
    var myHeight = myBounds.height;
    var worldSize = world.getExtent();
    var scalingFactor = Math.min(worldSize.x / myWidth, worldSize.y / myHeight);
    var desiredPosition = myBounds.topLeft().subPt(worldSize.subPt(this.owner.worldPoint(pt(myWidth, myHeight))).scaleBy(0.5));
    
    world.slideBy(desiredPosition.negated());
    world.zoomBy(scalingFactor, pt(0,0));
  }, {category: ['navigating']});

});


});
