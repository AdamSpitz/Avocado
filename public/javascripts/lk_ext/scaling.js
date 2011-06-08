avocado.transporter.module.create('lk_ext/scaling', function(requires) {

requires('lk_ext/morph_hider');

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
      var h = new Morph(new lively.scene.Rectangle(pt(0,0).extent(this._sizeOfSpaceHolder)));
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
    var b = false;
    var onScreen = this._owner.isOnScreen();
    if (onScreen) {
      var s = this._owner.overallScale();
      var t = this.currentThreshold();
      b = s >= t;
    }
    // console.log("shouldMorph1BeShown is " + b + " for " + this._owner + ", scale is " + s + ", threshold is " + t + ", onScreen is " + onScreen);
    return b;
  });

});


thisModule.addSlots(Morph.prototype, function(add) {

  add.method('overallScale', function (optionalAncestorToStopAt) {
    var s = 1.0;
    var m = this;
    while (m && m !== optionalAncestorToStopAt) {
      s = s * m.getScale();
      m = m.owner;
    }
    return s;
  }, {category: ['zooming interface']});

});


});
