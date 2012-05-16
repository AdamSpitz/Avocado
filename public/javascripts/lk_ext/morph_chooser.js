avocado.transporter.module.create('lk_ext/morph_chooser', function(requires) {

}, function(thisModule) {


thisModule.addSlots(avocado, function(add) {

  add.method('MorphChooser', function MorphChooser() { Class.initializer.apply(this, arguments); }, {category: ['ui']});

});


thisModule.addSlots(avocado.MorphChooser, function(add) {

  add.data('displayName', 'MorphChooser');

  add.data('superclass', Morph);

  add.data('type', 'avocado.MorphChooser');

  add.creator('prototype', Object.create(Morph.prototype));

});


thisModule.addSlots(avocado.MorphChooser.prototype, function(add) {

  add.data('constructor', avocado.MorphChooser);

  add.method('initialize', function ($super, targetType, callOnSuccess) {
    $super(new lively.scene.Ellipse(pt(0, 0), 5));
    this._targetType = targetType;
    this._callOnSuccess = callOnSuccess;
  }, {category: ['creating']});

  add.creator('style', {}, {category: ['styles']});

  add.method('particularlyWantsToBeDroppedOn', function (m) {
    return this._targetType.doesTypeMatch(m);
  }, {category: ['drag and drop']});

  add.method('aboutToBeDroppedOn', function ($super, m) {
    if (this.particularlyWantsToBeDroppedOn(m)) {
      this.remove();
      this._callOnSuccess(m);
      return false;
    } else {
      return $super(m);
    }
  }, {category: ['drag and drop']});

});


thisModule.addSlots(avocado.MorphChooser.prototype.style, function(add) {

  add.data('suppressHandles', true);

});


});
