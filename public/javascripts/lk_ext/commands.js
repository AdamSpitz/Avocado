transporter.module.create('lk_ext/commands', function(requires) {
  
requires('core/commands');
  
}, function(thisModule) {


thisModule.addSlots(avocado.command, function(add) {

  add.method('newMorph', function () {
    var m = ButtonMorph.createButton(this.label(), this.functionToRun(), 2);
    if (this.applicabilityFunction()) {
      m = Morph.createOptionalMorph(m, this.applicabilityFunction());
      m.refreshContent();
    }
    return m;
  }, {category: ['user interface']});

});


});
