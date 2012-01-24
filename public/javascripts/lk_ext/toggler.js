avocado.transporter.module.create('lk_ext/toggler', function(requires) {

requires('general_ui/morph_hider');

}, function(thisModule) {


thisModule.addSlots(avocado, function(add) {

  add.creator('morphToggler', Object.create(avocado.morphHider), {category: ['ui']});

});


thisModule.addSlots(avocado.morphToggler, function(add) {

  add.method('initialize', function ($super, morphToUpdate, morph1, morph2) {
    $super(morphToUpdate, morph1, morph2);
    this._valueHolder = avocado.booleanHolder.containing(false);
    this._valueHolder.addObserver(this.valueChanged.bind(this));
  });

  add.method('shouldMorph1BeShown', function () { return this.isOn(); });

  add.method('isOn', function () { return this._valueHolder.getValue(); });

  add.method('toggle', function (evt) { this._valueHolder.toggle(evt); });

  add.method('setValue', function (b, evt) { this._valueHolder.setValue(b, evt); });

  add.method('beOn', function (evt) { this.setValue(true, evt); });

  add.method('beOff', function (evt) { this.setValue(false, evt); });

  add.method('valueChanged', function (valueHolder, evt) {
    this.update(evt);
  });

  add.method('update', function ($super, evt) {
    $super(evt);
    var m = this.actualMorphToShow();
    if (m) { m.wasJustAdded(evt); } // aaa this seems wrong, it wasn't just added
  });

  add.method('constructUIStateMemento', function () {
    return this.isOn();
  }, {category: ['UI state']});

  add.method('assumeUIState', function (uiState, evt) {
    this.setValue(uiState, evt || Event.createFake());
  }, {category: ['UI state']});

  add.method('commandForToggling', function (name, label) {
    var c = avocado.command.create(label || (this.isOn() ? "hide " : "show ") + name, function(evt) { this.toggle(evt); }.bind(this));
    c.setHelpText(function() { return (this.isOn() ? 'Hide ' : 'Show ') + name; }.bind(this));
    return c;
  }, {category: ['commands']});

});


});
