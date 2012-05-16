avocado.transporter.module.create('lk_ext/check_box', function(requires) {

}, function(thisModule) {


thisModule.addSlots(avocado, function(add) {

  add.method('CheckBoxMorph', function CheckBoxMorph() { Class.initializer.apply(this, arguments); }, {category: ['ui']});

});


thisModule.addSlots(avocado.CheckBoxMorph, function(add) {

  add.data('displayName', 'CheckBoxMorph');

  add.data('superclass', ButtonMorph);

  add.data('type', 'avocado.CheckBoxMorph');

  add.method('createWithImage', function (imageURL, size) {
    var image = new ImageMorph(size.extentAsRectangle(), imageURL);
    image.setFill(null);
    var button = new this(size, image);
    button.setFill(null);
    return button;
  }, {category: ['creating']});

  add.creator('prototype', Object.create(ButtonMorph.prototype));

});


thisModule.addSlots(avocado.CheckBoxMorph.prototype, function(add) {

  add.data('constructor', avocado.CheckBoxMorph);

  add.method('initialize', function ($super, booleanHolder, extent, m) {
    this._model = booleanHolder || avocado.booleanHolder.containing(false);
    if (!extent) {extent = pt(15,15);}
    this.checkedMorph = m || this.createXShapedMorph(extent);
    this.checkedMorph.handlesMouseDown = function() { return true; };
    this.checkedMorph.relayMouseEvents(this, {onMouseDown: "onMouseDown", onMouseMove: "onMouseMove", onMouseUp: "onMouseUp"});
    $super(pt(0,0).extent(extent));
    this.setFill(Color.white);
    this.setFillOpacity(0.2);
    this.connectModel({model: this._model, getValue: "isChecked", setValue: "setChecked"});

    this.refreshContentOfMeAndSubmorphs();
    return this;
  }, {category: ['creating']});

  add.method('createXShapedMorph', function (extent) {
    return avocado.label.newMorphFor("X", extent);
  }, {category: ['creating']});

  add.data('toggle', true, {category: ['toggling']});

  add.method('getValue', function () {return this.getModel().getValue( );}, {category: ['accessing']});

  add.method('setValue', function (b) {return this.getModel().setValue(b);}, {category: ['accessing']});

  add.method('isChecked', function () {return this.getModel().getValue( );}, {category: ['accessing']});

  add.method('setChecked', function (b) {return this.getModel().setValue(b);}, {category: ['accessing']});

  add.method('notifier', function () {
    return this._model.notifier();
  }, {category: ['observing']});

  add.method('changeAppearanceFor', function (v) {
    if (v) {
      if (this.checkedMorph.owner !== this) {
        this.addMorphCentered(this.checkedMorph);
      }
    } else {
      if (this.checkedMorph.owner === this) {
        this.removeMorph(this.checkedMorph);
      }
    }
  }, {category: ['updating']});

  add.method('refreshContent', function () {
    this.changeAppearanceFor(this.isChecked());
  }, {category: ['updating']});

});


});
