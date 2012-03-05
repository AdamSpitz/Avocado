avocado.transporter.module.create('general_ui/scaling', function(requires) {

requires('general_ui/basic_morph_mixins');
requires('general_ui/morph_hider');

}, function(thisModule) {


thisModule.addSlots(avocado, function(add) {

  add.creator('scaleBasedMorphHider', Object.create(avocado.morphHider), {category: ['ui']});

});


thisModule.addSlots(avocado.scaleBasedMorphHider, function(add) {

  add.method('initialize', function ($super, morphToUpdate, morph1, owner, thresholdNumberOrFunction, sizeOfSpaceHolder) {
    $super(morphToUpdate, morph1, this.spaceHolder.bind(this));
    this._owner = owner;
    if (typeof(thresholdNumberOrFunction) === 'function') {
      this.currentThreshold = thresholdNumberOrFunction;
    } else {
      this._thresholdNumber = thresholdNumberOrFunction;
    }
    this._sizeOfSpaceHolder = sizeOfSpaceHolder;
  });
  
  add.method('spaceHolder', function () {
    var h = this._spaceHolder;
    if (!h) {
      if (!this._sizeOfSpaceHolder) { return null; }
      var h = avocado.ui.newMorph(avocado.ui.shapeFactory.newRectangle(pt(0,0).extent(this._sizeOfSpaceHolder)));
      h.setFill(null);
      h.ignoreEvents();
      this._spaceHolder = h;
    }
    return h;
  });
  
  add.method('currentThreshold', function () {
    return this._thresholdNumber;
  });

  add.method('shouldMorph1BeShown', function () {
    if (avocado.shouldAlwaysShowVerySmallMorphs) { return true; }
    var b = false;
    var onScreen = this._owner.isOnScreen();
    if (onScreen) {
      var s = this._owner.overallScaleTakingUsersPositionIntoAccount();
      var t = this.currentThreshold();
      b = s >= t;
    }
    // console.log("shouldMorph1BeShown is " + b + " for " + this._owner + ", scale is " + s + ", threshold is " + t + ", onScreen is " + onScreen);
    return b;
  });

});


thisModule.addSlots(avocado.morphMixins.Morph, function(add) {

  add.method('overallScale', function (optionalAncestorToStopAt) {
    var s = 1.0;
    var m = this;
    while (m && m !== optionalAncestorToStopAt) {
      s = s * m.getScale();
      m = m.getOwner();
    }
    return s;
  }, {category: ['zooming interface']});

  add.method('setOverallScale', function (desiredOverallScale, optionalAncestorToStopAt) {
    var ownerOverallScale = this.getOwner() ? this.getOwner().overallScale(optionalAncestorToStopAt) : 1;
    this.setScale(desiredOverallScale / ownerOverallScale);
    return this;
  }, {category: ['zooming interface']});

});


});
