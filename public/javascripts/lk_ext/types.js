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
    return new avocado.TextMorphRequiringExplicitAcceptance(avocado.accessors.forMethods(slot, 'contents'));
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


});
