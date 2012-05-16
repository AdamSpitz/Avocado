avocado.transporter.module.create('lk_ext/animation', function(requires) {

requires('general_ui/animation');

}, function(thisModule) {


thisModule.addSlots(Morph.prototype, function(add) {

  add.method('isOnScreen', function () {
    var w = this.world();
    if (!w) { return false; }
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

  add.method('startWhooshingOuttaHere', function (functionToCallWhenDone) {
      var w = this.world();
      if (w) {
        this.becomeDirectSubmorphOfWorld(w);
        var howFarOutside = 300 / w.getScale();
        this.startWhooshingTo(pt(w.getExtent().x + howFarOutside, -howFarOutside), true, false, function() {
          this.remove();
          if (functionToCallWhenDone) { functionToCallWhenDone(); }
        }.bind(this));
      } else {
        if (functionToCallWhenDone) { functionToCallWhenDone(); }
      }
    }, {category: ['whooshing around']});

  add.method('positionToCenterIn', function (m) {
      return m.getExtent().scaleBy(m.getScale() * 0.5).subPt(this.getExtent().scaleBy(this.getScale() * 0.5));
    });

  add.method('setCenterPosition', function (p) {
    return this.setPosition(p.addPt(this.getExtent().scaleBy(this.getScale() * -0.5)));
  });

  add.method('showInCenterOfUsersFieldOfVision', function (w, callback) {
      this.scaleBy(1 / w.getScale());
      // Can't use positionToCenterIn because that finds the actual center of the morph, whereas we
      // want the center of the *visible* part of the world.
      var p = w.getExtent().scaleBy(0.5).subPt(this.getExtent().scaleBy(this.getScale() * 0.5));
      this.showInWorldAt(w, p, callback);
    });

  add.method('showWithoutAnimationInTopRightCornerOfUsersFieldOfVision', function (w) {
    var wScale = w.getScale();
    this.setScale(1 / wScale);
    var padding = 10 / wScale;
    w.addMorphAt(this, pt(w.getExtent().x - this.getExtent().scaleBy(this.getScale()).x - padding, padding));
  });

  add.method('showAsLabelOnTopOf', function (morphToBeLabelled, world) {
    this.setScale(2.0 / world.getScale());
    var p = morphToBeLabelled.worldPoint(this.positionToCenterIn(morphToBeLabelled));
    this.setPosition(p);
    world.addMorphFront(this);
  });

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
    			var topLeft = this.getOwner().worldPoint(this.getPosition());
    			var globalBounds = topLeft.extent(scaledExtent);
    			
          var allVertices = globalBounds.vertices().concat(globalBounds.translatedBy(difference).vertices());
          var convexVertices = avocado.geometry.quickhull.getConvexHull(allVertices).map(function(a) {return a.pointA;});
          var motionBlurMorph = Morph.makePolygon(convexVertices, 0, Color.black, this.getFill());
          motionBlurMorph.doesNotNeedACreatorSlot = true; // aaa HACK to fix performance bug
          // could try adjusting the opacity based on the distance, but I tried that and
          // couldn't figure out how to make it look non-weird
          motionBlurMorph.setFillOpacity(0.3);
          motionBlurMorph.setBorderColor(null);
          motionBlurMorph.closeDnD();
          motionBlurMorph.ignoreEvents();
          world.addMorphBack(motionBlurMorph);
          setTimeout(function() {motionBlurMorph.remove();}, blurTime);
        }
      }
      this.setPosition(newPos);
      if (this._layout && this._layout.justDidAnimatedPositionChange) { this._layout.justDidAnimatedPositionChange(); }
    }, {category: ['motion blur']});

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
    return avocado.table.createOptionalMorph(this.createDismissButton.bind(this).memoize(), function() {
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


thisModule.addSlots(SelectionMorph.prototype, function(add) {

  add.method('startWhooshingOuttaHere', function ($super, callWhenDone) {
      // Alternate way that I don't think looks quite as good: this.selectedMorphs.invoke('startWhooshingOuttaHere');

      this.selectedMorphs.each(function(m) {
        this.addMorphAt(m, this.relativize(m.owner.worldPoint(m.getPosition())));
      }.bind(this));
      $super(callWhenDone);
    }, {category: ['whooshing around']});

});


});
