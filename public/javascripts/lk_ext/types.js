avocado.transporter.module.create('lk_ext/types', function(requires) {

requires('core/types');

}, function(thisModule) {


thisModule.addSlots(avocado.types.general, function(add) {

  add.method('canCreateInputMorph', function () {
    return typeof(this.createInputMorph) === 'function';
  }, {category: ['input']});
  
});


thisModule.addSlots(avocado.types.boolean, function(add) {

  add.method('createInputMorph', function (slot) {
    return new CheckBoxMorph(slot);
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


});
