avocado.transporter.module.create('lk_ext/string_buffer_morph', function(requires) {

requires('core/string_buffer');

}, function(thisModule) {


thisModule.addSlots(avocado.stringBuffer, function(add) {
  
  add.method('newMorph', function () {
    this.startNotifyingUIWheneverChanged();
    var tm = new avocado.TextMorphRequiringExplicitAcceptance(avocado.accessors.forMethods(this, 'toString'));
    tm.setScale(0.3);
    tm.setFill(Color.white);
    return ScrollPane.containing(tm, pt(100,150));
  }, {category: ['user interface']});
  
});


});
