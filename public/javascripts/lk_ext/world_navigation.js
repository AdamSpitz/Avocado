transporter.module.create('lk_ext/world_navigation', function(requires) {

}, function(thisModule) {


thisModule.addSlots(WorldMorph.prototype, function(add) {

  add.method('onMouseWheel', function (evt) {
	  if (evt.isCtrlDown() || evt.isMetaDown() || evt.isAltDown()) {
      var factor = Math.pow(1.2, (evt.rawEvent.wheelDeltaY / -600));
      this.zoomBy(factor, evt.point());
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
      if (! m.shouldStickToScreen) {
        // The animated version is a bit weird for now, I think. -- Adam
        // m.startZoomingInAStraightLineTo(m.position().addPt(delta), false, false, true);
        
        m.moveBy(delta);
      }
    });
    
    this.hands.each(function(m) {
      // The animated version is a bit weird for now, I think. -- Adam
      // m.startZoomingInAStraightLineTo(m.position().addPt(delta), false, false, true);
      m.moveBy(delta);
    });
    
  }, {category: ['navigation']});

  add.method('zoomBy', function (factor, pointerPosition) {
    var worldNavigator = Object.newChildOf(WorldMorph.prototype.navigationAccessor, this);
    
    worldNavigator.staySameSizeAndScaleTo(this.getScale() * factor, pointerPosition, function() {
    }.bind(this));
  }, {category: ['navigation']});

  add.method('stickyMorphs', function (f) {
    return this.submorphs.select(function(m) { return m.shouldStickToScreen; });
  });

  add.method('staySameSizeAndSmoothlyScaleTo', function (desiredScale, currentPointerPos, functionToCallWhenDone) {
    
    throw new Error("This code is just broken, replace it with something that repeatedly calls staySameSizeAndScaleTo instead.");
    
    var originalViewableArea = this.getExtent();
    var originalScale = this.getScale();
    var scalingFactor = desiredScale / originalScale;
    var newViewableArea = originalViewableArea.scaleBy(1 / scalingFactor);
    
    var newPointerPos = currentPointerPos.scaleBy(scalingFactor);
    var pointerDelta = currentPointerPos.subPt(newPointerPos);
    
    var newPos = pointerDelta;
    
    /*
    var currentCenterPos = this.getExtent().scaleBy(0.5);
    var desiredDelta = desiredCenterPos.subPt(currentCenterPos);
    var maxDelta = originalViewableArea.subPt(originalViewableArea.scaleBy(1 / scalingFactor)).abs();
    var delta = desiredDelta.minMaxPt(maxDelta, maxDelta.negated());
    //console.log("Scaling by " + scalingFactor + ", translating by " + delta + ", max was " + maxDelta);
    var newCenterPos = currentCenterPos.addPt(delta);
    var newTopLeft = newCenterPos.subPt(newViewableArea.scaleBy(0.5));
    var newPos = newTopLeft.negated();
    */
    
    var desiredSize = this.getExtent().scaleBy(this.getScale());
    var accessor = {
      getValue: function(m) {return m.getScale();},
      setValue: function(m, v) {
        var os = m.getScale();
        var sf = v / os;
        
        m.setScale(v);
        m.setExtent(desiredSize.scaleBy(1 / v));
        m.hands().forEach(function(h) {
          h.setScale(1 / v);
          
          var hnp = h.getPosition();
          var hop = hnp.scaleBy(sf);
          var d = hop.subPt(hnp);
          h.moveBy(d);
        });
      }
    };
    
    var worldNavigator = Object.newChildOf(WorldMorph.prototype.navigationAccessor, this);
    var scaler   = avocado.animation.newSpeedStepper(worldNavigator, desiredScale, accessor, 200, 80);
    var mover    = avocado.animation.newMovement(worldNavigator, avocado.animation.straightPath, newPos, 2, false, false, true);
    var animator = avocado.animation.simultaneous.create("scaler and mover", [scaler, mover]);
    animator.whenDoneCall(functionToCallWhenDone);
    animator.startAnimating(worldNavigator);
  }, {category: ['scaling']});

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

  add.method('setPositionAndDoMotionBlurIfNecessary', function (newPos, blurTime) {
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
    var delta = currentPointerPos.translationNeededToStayInSameScreenPositionWhenScalingTheWorldBy(scalingFactor);
    this._world.slideBy(delta);
    this._world.hands.each(function(m) { m.setScale(1 / s); });
    this._world.stickyMorphs().each(function(m) { m.setScale(1 / s); m.moveBy(m.origin.translationNeededToStayInSameScreenPositionWhenScalingTheWorldBy(scalingFactor)); });
  });

  add.method('isOnScreen', function () {
    return true;
  });

  add.method('hands', function () {
    return this._world.hands;
  });

});


});
