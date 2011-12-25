avocado.transporter.module.create('general_ui/animation', function(requires) {

requires('general_ui/animation_math');
requires('general_ui/basic_morph_mixins');

}, function(thisModule) {


thisModule.addSlots(avocado.morphMixins.Morph, function(add) {

  add.method('startWhooshingTo', function (loc, shouldAnticipateAtStart, shouldWiggleAtEnd, functionToCallWhenDone) {
    return this.startAnimating(avocado.animation.newMovement(this, avocado.animation.arcPath, loc, 3 / WorldMorph.current().getScale(), shouldAnticipateAtStart, shouldWiggleAtEnd, !shouldWiggleAtEnd), functionToCallWhenDone);
  }, {category: ['whooshing around']});

  add.method('startWhooshingInAStraightLineTo', function (loc, shouldAnticipateAtStart, shouldWiggleAtEnd, shouldDecelerateAtEnd, functionToCallWhenDone) {
    return this.startAnimating(avocado.animation.newMovement(this, avocado.animation.straightPath, loc, 2 / WorldMorph.current().getScale(), shouldAnticipateAtStart, shouldWiggleAtEnd, shouldDecelerateAtEnd), functionToCallWhenDone);
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

  add.method('startAnimating', function (animator, functionToCallWhenDone) {
    animator.stopAnimating();
    animator.whenDoneCall(functionToCallWhenDone);
    animator.startAnimating(this);
    return animator;
  }, {category: ['whooshing around']});

  add.method('wiggle', function (duration) {
    return this.startAnimating(avocado.animation.newWiggler(this, null, duration));
  }, {category: ['wiggling']});

  add.method('ensureIsNotInWorld', function () {
    if (this.world()) {this.startWhooshingOuttaHere();}
  }, {category: ['adding and removing']});

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

});


});
