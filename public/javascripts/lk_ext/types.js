avocado.transporter.module.create('lk_ext/types', function(requires) {

requires('core/types');

}, function(thisModule) {


thisModule.addSlots(avocado.types, function(add) {
  
  add.creator('morph', {}, {category: ['morphs']});

});


thisModule.addSlots(avocado.types.general, function(add) {

  add.method('canCreateInputMorph', function () {
    return typeof(this.createInputMorph) === 'function';
  }, {category: ['input']});
  
});


thisModule.addSlots(avocado.types.boolean, function(add) {

  add.method('createInputMorph', function (slot) {
    return new avocado.CheckBoxMorph(slot);
  }, {category: ['input']});
  
});


thisModule.addSlots(avocado.types.shortString, function(add) {

  add.method('createInputMorph', function (slot) {
    return new avocado.TwoModeTextMorph(avocado.accessors.forMethods(slot, 'contents')).ignoreEvents();
  }, {category: ['input']});
  
});


thisModule.addSlots(avocado.types.longString, function(add) {

  add.method('createInputMorph', function (slot) {
    var tm = new avocado.TextMorphRequiringExplicitAcceptance(avocado.accessors.forMethods(slot, 'contents'));
    tm.setScale(0.3);
    tm.setFill(null);
    return ScrollPane.containing(tm, pt(100,150));
  }, {category: ['input']});
  
});


thisModule.addSlots(avocado.types.morph, function(add) {

  add.method('onModelOfType', function (modelType) {
    return Object.newChildOf(this, modelType);
  }, {category: ['creating']});

  add.method('initialize', function (modelType) {
    this._modelType = modelType;
  }, {category: ['creating']});

  add.method('doesTypeMatch', function (o) {
    if (!o) { return false; }
    if (typeof(o._model) === 'undefined') { return false; }
    return this._modelType.doesTypeMatch(o._model);
  }, {category: ['testing']});

});


thisModule.addSlots(avocado.types.enumeration.prompterProto, function(add) {
  
  add.method('prompt', function (caption, context, evt, callback) {
    avocado.ComboBoxMorph.prompt("Which?", "Choose", "Cancel", this._possibilities, this._possibilities.first(), callback);
  });
  
});


});
