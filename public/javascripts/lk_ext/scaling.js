transporter.module.create('lk_ext/scaling', function(requires) {

requires('lk_ext/morph_hider');

}, function(thisModule) {


thisModule.addSlots(avocado, function(add) {

  add.creator('scaleBasedMorphHider', Object.create(avocado.morphHider), {category: ['ui']});

});


thisModule.addSlots(avocado.scaleBasedMorphHider, function(add) {

  add.method('initialize', function ($super, morphToUpdate, morph1, owner, threshold) {
    $super(morphToUpdate, morph1 /* , this.spaceHolder.bind(this) */ ); // aaa spaceHolder not working properly yet
    this._owner = owner;
    this._threshold = threshold;
  });
  
  add.method('spaceHolder', function () {
    if (! this._spaceHolder) {
      var m = this._morph1;
      if (typeof m === 'function') { m = m(); }
      if (!m) { return null; }
      console.log("Creating spaceHolder for " + m);
      this._spaceHolder = new Morph(m.shape.copy());
      this._spaceHolder.setFill(null);
      this._spaceHolder.ignoreEvents();
    }
    return this._spaceHolder;
  });

  add.method('shouldMorph1BeShown', function () {
    var b = false;
    var onScreen = this._owner.isOnScreen();
    if (onScreen) {
      var s = this._owner.overallScale();
      b = s >= this._threshold;
    }
    // console.log("shouldMorph1BeShown is " + b + " for " + this._owner + ", scale is " + s + ", threshold is " + this._threshold + ", onScreen is " + onScreen);
    return b;
  });

});


thisModule.addSlots(Morph.prototype, function(add) {

  add.method('overallScale', function () {
    var s = 1.0;
    var m = this;
    while (m) {
      s = s * m.getScale();
      m = m.owner;
    }
    return s;
  }, {category: ['zooming interface']});

  add.method('adjustDetailBasedOnOverallScale', function () {
    // children can override
  }, {category: ['zooming interface']});

});


});
