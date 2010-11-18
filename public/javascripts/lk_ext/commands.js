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


thisModule.addSlots(Morph.prototype, function(add) {
  
  add.method('eachAssociatedObject', function (f) {
    // Children can override.
    if (typeof(this._model) !== 'undefined') { f(this._model); }
  }, {category: ['associated objects']});
  
  add.method('associatedObjectSatisfying', function (criterion) {
    return exitValueOf(function(exit) {
      this.eachAssociatedObject(function(o) {
        if (!criterion || criterion(o)) { exit(o); }
      });
      return null;
    }.bind(this));
  }, {category: ['associated objects']});
  
});


});
