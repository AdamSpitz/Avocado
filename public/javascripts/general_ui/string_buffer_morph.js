avocado.transporter.module.create('general_ui/string_buffer_morph', function(requires) {

requires('core/string_buffer');

}, function(thisModule) {


thisModule.addSlots(avocado.stringBuffer, function(add) {

  add.method('newMorph', function () {
    this.startNotifyingUIWheneverChanged();
    return avocado.types.longString.createInputMorph(avocado.accessors.forMethods(this, 'toString'));
  }, {category: ['user interface']});

});


});
