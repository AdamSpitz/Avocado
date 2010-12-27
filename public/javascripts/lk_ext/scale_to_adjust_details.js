transporter.module.create('lk_ext/scale_to_adjust_details', function(requires) {

requires('lk_ext/optional_morph');

}, function(thisModule) {


thisModule.addSlots(avocado, function(add) {

  add.creator('scaleBasedOptionalMorph', Object.create(avocado.optionalMorph), {category: ['ui']});

});


thisModule.addSlots(avocado.scaleBasedOptionalMorph, function(add) {

  add.method('create', function (updateFunction, morphToShowOrHide, owner, threshold) {
    return Object.newChildOf(this, updateFunction, morphToShowOrHide, owner, threshold);
  });

  add.method('initialize', function ($super, morphToUpdate, morphToShowOrHide, owner, threshold) {
    $super(morphToUpdate, morphToShowOrHide);
    this._owner = owner;
    this._threshold = threshold;
  });

  add.method('shouldBeShown', function () {
    return this._owner.overallScale() >= this._threshold;
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
