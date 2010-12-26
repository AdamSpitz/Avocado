transporter.module.create('lk_ext/toggler', function(requires) {

requires('lk_ext/optional_morph');

}, function(thisModule) {


thisModule.addSlots(avocado, function(add) {

  add.creator('toggler', Object.create(avocado.optionalMorph), {category: ['ui']});

});


thisModule.addSlots(avocado.toggler, function(add) {

  add.method('create', function (updateFunction, morphToShowOrHide) {
    return Object.newChildOf(this, updateFunction, morphToShowOrHide);
  });

  add.method('initialize', function ($super, morphToUpdate, morphToShowOrHide) {
    $super(morphToUpdate, morphToShowOrHide);
    this._valueHolder = avocado.booleanHolder.containing(false);
    this._valueHolder.addObserver(this.valueChanged.bind(this));
  });

  add.method('shouldBeShown', function () { return this.isOn(); });

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
    if (this.shouldBeShown()) { this.actualMorphToShow().wasJustShown(evt); }
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
