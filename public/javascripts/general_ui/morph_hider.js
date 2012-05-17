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

  add.method('initialize', function (morphToUpdate, possibleMorphsToShow, criterionForShowing) {
    this._morphToUpdate = morphToUpdate;
    this._possibleMorphsToShow = possibleMorphsToShow;
    if (criterionForShowing) { this.whichMorphShouldBeShown = criterionForShowing; }
  });

  add.method('update', function (evt) {
    if (this._morphToUpdate) { this._morphToUpdate.refreshContentIfOnScreenOfMeAndSubmorphs(); }
  });

  add.method('morphOrFunctionToShow', function () {
    var i = this.whichMorphShouldBeShown();
    if (i === null || typeof(i) === 'undefined') { return null; }
    return this._possibleMorphsToShow[i];
  });

  add.method('actualMorphToShow', function (context) {
    var m = this.morphOrFunctionToShow();
    if (typeof(m) === 'function') { m = m(); }
    return m && m.actualMorphToShow(context);
  });

  add.method('constructUIStateMemento', function () {
    return undefined;
  }, {category: ['UI state']});

  add.method('assumeUIState', function (uiState, callWhenDone, evt) {
    // no UI state
    if (callWhenDone) { callWhenDone(); }
  }, {category: ['UI state']});

});


thisModule.addSlots(avocado.morphMixins.TextMorph, function(add) {

  add.method('wasJustAdded', function (evt) { this.requestKeyboardFocus(evt.hand); });

});


});
