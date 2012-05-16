avocado.transporter.module.create('general_ui/types', function(requires) {

requires('core/types');

}, function(thisModule) {


thisModule.addSlots(avocado.types, function(add) {

  add.creator('morph', {}, {category: ['morphs']});

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


thisModule.addSlots(avocado.types.general, function(add) {

  add.method('canCreateInputMorph', function () {
    return typeof(this.createInputMorph) === 'function';
  }, {category: ['input']});

});


thisModule.addSlots(avocado.types.number, function(add) {

  add.method('createInputMorph', function (slot) {
    return avocado.frequentlyEditedText.newMorphFor(slot);
  }, {category: ['input']});

});


thisModule.addSlots(avocado.types.shortString, function(add) {

  add.method('createInputMorph', function (slot) {
    return avocado.frequentlyEditedText.newMorphFor(slot);
  }, {category: ['input']});

});


});
