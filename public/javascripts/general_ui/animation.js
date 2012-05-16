avocado.transporter.module.create('general_ui/animation', function(requires) {

requires('general_ui/animation_math');
requires('general_ui/basic_morph_mixins');

}, function(thisModule) {


thisModule.addSlots(avocado.morphMixins.Morph, function(add) {

  add.method('startWhooshingTo', function (loc, shouldAnticipateAtStart, shouldWiggleAtEnd, callback) {
    return this.startAnimating(avocado.animation.newMovement(this, avocado.ui.aaa_isArcPathBroken ? avocado.animation.straightPath : avocado.animation.arcPath, loc, 3 / avocado.ui.currentWorld().getScale(), shouldAnticipateAtStart, shouldWiggleAtEnd, !shouldWiggleAtEnd), callback);
  }, {category: ['whooshing around']});

  add.method('startWhooshingInAStraightLineTo', function (loc, shouldAnticipateAtStart, shouldWiggleAtEnd, shouldDecelerateAtEnd, callback) {
    return this.startAnimating(avocado.animation.newMovement(this, avocado.animation.straightPath, loc, 2 / avocado.ui.currentWorld().getScale(), shouldAnticipateAtStart, shouldWiggleAtEnd, shouldDecelerateAtEnd), callback);
  }, {category: ['whooshing around']});

  add.method('whooshAwayAfter', function (ms) {
    this.whooshOuttaHereTimer = window.setTimeout(function() {
      this.startWhooshingOuttaHere();
    }.bind(this), ms || 5000);
  }, {category: ['whooshing around']});

  add.method('showTemporarilyInCenterOfUsersFieldOfVision', function (w) {
    this.showInCenterOfUsersFieldOfVision(w, function() {this.whooshAwayAfter(5000);}.bind(this));
  }, {category: ['whooshing around']});

  add.method('showInWorldAt', function (w, p, callWhenDone) {
    this.ensureIsInWorld(w, p, true, false, true, callWhenDone);
  }, {category: ['whooshing around']});

  add.method('ensureIsInWorld', function (w, desiredLoc, shouldMoveToDesiredLocEvenIfAlreadyInWorld, shouldAnticipateAtStart, shouldWiggleAtEnd, callback) {
    var originalOwner = this.getOwner();
    this.becomeDirectSubmorphOfWorld(w);
    
    avocado.callbackWaiter.on(function(generateIntermediateCallback) {
      if (typeof(desiredLoc.desiredScale) !== 'undefined') { // aaa hack
        var scalingCallback = generateIntermediateCallback();
        this.smoothlyScaleTo(desiredLoc.desiredScale, function() { this.refreshContentOfMeAndSubmorphs(); scalingCallback(); }.bind(this));
      }
      
      if (originalOwner !== w || shouldMoveToDesiredLocEvenIfAlreadyInWorld) {
        this.startWhooshingTo(desiredLoc, shouldAnticipateAtStart, shouldWiggleAtEnd, generateIntermediateCallback());
      }
    }.bind(this), callback, "whooshing animation");
  }, {category: ['adding and removing']});

  add.method('becomeDirectSubmorphOfWorld', function (w) {
    var owner = this.getOwner();
    if (w) {
      if (owner !== w) {
        var initialLoc = (!owner || this.world() !== w.world()) ? this.getExtent().scaleBy(-1.1).addXY(-200,-200) : this.getPosition().matrixTransform(owner.transformToMorph(w));
        var initialScale = this.overallScale(w);
        
        if (owner && this.doIOrMyOwnersWantToLeaveAPlaceholderWhenRemovingMe()) { owner.placeholderForMorph(this).setScale(this.getScale()).layout().putInPlaceOfOriginalMorph(); }
        
        this.refreshContentOfMeAndSubmorphsIfNeverRefreshedBefore(); // aaa - not sure this is a good idea, but maybe; it makes sure that a mirror will be updated as soon as it's visible, for one thing.
        
        if (this._previousLayoutModes) {
          this.remove();
          this.setLayoutModes(this._previousLayoutModes);
          this.forceLayoutRejiggering();
        }
        
        w.addMorphAt(this, initialLoc);
        this.setScale(initialScale);
        
      }
    } else {
      if (owner && this.doIOrMyOwnersWantToLeaveAPlaceholderWhenRemovingMe()) { owner.placeholderForMorph(this).layout().putInPlaceOfOriginalMorph(); }
    }
  }, {category: ['adding and removing']});

  add.method('putBackOrDismiss', function (callWhenDone) {
    var placeholder = this._placeholderMorphIJustCameFrom;
    if (placeholder) {
      placeholder.layout().putOriginalMorphBack(callWhenDone);
    } else {
      this.startWhooshingOuttaHere(callWhenDone);
    }
  }, {category: ['adding and removing']});

  add.method('startAnimating', function (animator, callback) {
    animator.stopAnimating();
    animator.whenDoneCall(callback);
    animator.startAnimating(this);
    return animator;
  }, {category: ['whooshing around']});

  add.method('wiggle', function (duration) {
    return this.startAnimating(avocado.animation.newWiggler(this, null, duration));
  }, {category: ['wiggling']});

  add.method('ensureIsNotInWorld', function () {
    if (this.world()) {this.startWhooshingOuttaHere();}
  }, {category: ['adding and removing']});

  add.method('smoothlyAnimate', function (accessor, desiredValue, callback) {
    this.startAnimating(avocado.animation.newSpeedStepper(this, desiredValue, accessor, accessor.defaultDuration || 200), callback);
  }, {category: ['animating']});

  add.method('smoothlyFadeTo', function (desiredAlpha, callback) {
    this.smoothlyAnimate(avocado.animation.accessors.fillOpacity, desiredAlpha, callback);
  }, {category: ['animating']});

  add.method('smoothlyResizeTo', function (desiredSize, callback) {
    this.smoothlyAnimate(avocado.animation.accessors.extent, desiredSize, callback);
  }, {category: ['animating']});

  add.method('smoothlyScaleTo', function (desiredScale, callback) {
    this.smoothlyAnimate(avocado.animation.accessors.scale, desiredScale, callback);
  }, {category: ['animating']});

  add.method('smoothlyScaleHorizontallyTo', function (desiredScale, callback) {
    this.smoothlyAnimate(avocado.animation.accessors.horizontalScale, desiredScale, callback);
  }, {category: ['animating']});

  add.method('smoothlyScaleVerticallyTo', function (desiredScale, callback) {
    this.smoothlyAnimate(avocado.animation.accessors.verticalScale, desiredScale, callback);
  }, {category: ['animating']});

  add.method('startTinyAndSmoothlyGrowTo', function (desiredScale, callback) {
    this.setScale(desiredScale * 0.01);
    this.smoothlyScaleTo(desiredScale, callback);
  }, {category: ['animating']});

  add.method('smoothlyShrinkDownToNothing', function (callback) {
    this.smoothlyScaleTo(0.01, callback);
  }, {category: ['animating']});

});


thisModule.addSlots(avocado.animation, function(add) {

  add.creator('accessors', {});

});


thisModule.addSlots(avocado.animation.accessors, function(add) {

  add.creator('general', {});

  add.creator('fillOpacity', Object.create(avocado.animation.accessors.general));

});


thisModule.addSlots(avocado.animation.accessors.fillOpacity, function(add) {

  add.data('defaultDuration', 1000);

  add.method('getValue', function (m) { return m.getFillOpacity(); });

  add.method('setValue', function (m, a) { m.setFillOpacity(a); });

});


thisModule.addSlots(avocado.animation.accessors, function(add) {

  add.creator('extent', Object.create(avocado.animation.accessors.general));

});


thisModule.addSlots(avocado.animation.accessors.extent, function(add) {

  add.data('defaultDuration', 100);

  add.method('getValue', function (m) { return m.getExtent(); });

  add.method('setValue', function (m, e) { m.setExtent(e); });

});


thisModule.addSlots(avocado.animation.accessors, function(add) {

  add.creator('scale', Object.create(avocado.animation.accessors.general));

});


thisModule.addSlots(avocado.animation.accessors.scale, function(add) {

  add.data('defaultDuration', 200);

  add.method('getValue', function (m) { return m.getScale(); });

  add.method('setValue', function (m, s) { m.setScale(s); });

});


thisModule.addSlots(avocado.animation.accessors, function(add) {

  add.creator('horizontalScale', Object.create(avocado.animation.accessors.general));

});


thisModule.addSlots(avocado.animation.accessors.horizontalScale, function(add) {

  add.data('defaultDuration', 200);

  add.method('getValue', function (m) { return m.getHorizontalScale(); });

  add.method('setValue', function (m, v) { m.setHorizontalScale(v); });

});


thisModule.addSlots(avocado.animation.accessors, function(add) {

  add.creator('verticalScale', Object.create(avocado.animation.accessors.general));

});


thisModule.addSlots(avocado.animation.accessors.verticalScale, function(add) {

  add.data('defaultDuration', 200);

  add.method('getValue', function (m) { return m.getVerticalScale(); });

  add.method('setValue', function (m, v) { m.setVerticalScale(v); });

});


});
