avocado.transporter.module.create('general_ui/morph_hider', function(requires) {

requires('general_ui/basic_morph_mixins');

}, function(thisModule) {


thisModule.addSlots(avocado, function(add) {

  add.creator('morphHider', {}, {category: ['ui']});

});


thisModule.addSlots(avocado.morphHider, function(add) {

  add.method('create', function () {
    var c = Object.create(this);
    c.initialize.apply(c, arguments);
    return c;
  }, {category: ['creating']});

  add.method('initialize', function (morphToUpdate, morph1, morph2, criterionForShowing) {
    this._morphToUpdate = morphToUpdate;
    this._morph1 = morph1;
    this._morph2 = morph2;
    if (criterionForShowing) { this.shouldMorph1BeShown = criterionForShowing; }
  });

  add.method('update', function (evt) {
    if (this._morphToUpdate) { this._morphToUpdate.refreshContentIfOnScreenOfMeAndSubmorphs(); }
  });

  add.method('morphOrFunctionToShow', function () {
    return this.shouldMorph1BeShown() ? this._morph1 : this._morph2;
  });

  add.method('actualMorphToShow', function (context) {
    var m = this.morphOrFunctionToShow();
    if (typeof(m) === 'function') { m = m(); }
    return m && m.actualMorphToShow(context);
  });

  add.method('constructUIStateMemento', function () {
    return undefined;
  }, {category: ['UI state']});

  add.method('assumeUIState', function (uiState, evt) {
    // no UI state
  }, {category: ['UI state']});

});


thisModule.addSlots(avocado.morphMixins.Morph, function(add) {

  add.method('wasJustShown', function (evt) { });

});


thisModule.addSlots(avocado.morphMixins.TextMorph, function(add) {

  add.method('wasJustShown', function (evt) { this.requestKeyboardFocus(evt.hand); });

});


});
