transporter.module.create('lk_ext/scale_to_adjust_details', function(requires) {

requires('lk_ext/optional_morph');

}, function(thisModule) {


thisModule.addSlots(avocado, function(add) {

  add.creator('scaleBasedOptionalMorph', Object.create(avocado.optionalMorph), {category: ['ui']});

});


thisModule.addSlots(avocado.scaleBasedOptionalMorph, function(add) {

  add.method('create', function (morphToUpdate, morphToShowOrHide, owner, threshold) {
    return Object.newChildOf(this, morphToUpdate, morphToShowOrHide, owner, threshold);
  });

  add.method('initialize', function ($super, morphToUpdate, morphToShowOrHide, owner, threshold) {
    $super(morphToUpdate, morphToShowOrHide);
    this._owner = owner;
    this._threshold = threshold;
  });

  add.method('shouldBeShown', function () {
    var b = false;
    var onScreen = this._owner.isOnScreen();
    if (onScreen) {
      var s = this._owner.overallScale();
      b = s >= this._threshold;
    }
    // console.log("shouldBeShown is " + b + " for " + this._owner + ", scale is " + s + ", threshold is " + this._threshold + ", onScreen is " + onScreen);
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
  }, {category: 'zooming interface'});
  
  add.method('adjustDetailBasedOnOverallScale', function () {
    // children can override
  }, {category: 'zooming interface'});

});


});
