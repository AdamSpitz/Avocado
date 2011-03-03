transporter.module.create('lk_ext/optional_morph', function(requires) {

}, function(thisModule) {


thisModule.addSlots(avocado, function(add) {

  add.creator('optionalMorph', {}, {category: ['ui']});

});


thisModule.addSlots(avocado.optionalMorph, function(add) {

  add.method('create', function (updateFunction, morphToShowOrHide, criterionForShowing) {
    return Object.newChildOf(this, updateFunction, morphToShowOrHide, criterionForShowing);
  });

  add.method('initialize', function (morphToUpdate, morphToShowOrHide, criterionForShowing) {
    this._morphToUpdate = morphToUpdate;
    this._morphToShowOrHide = morphToShowOrHide;
    if (criterionForShowing) { this.shouldBeShown = criterionForShowing; }
  });

  add.method('shouldNotBeShown', function () { return ! this.shouldBeShown(); });

  add.method('update', function (evt) {
    if (this._morphToUpdate) { this._morphToUpdate.updateAppearance(); }
  });

  add.method('actualMorphToShow', function () {
    var m = this._morphToShowOrHide;
    return typeof(m) === 'function' ? m() : m;
  });

  add.method('constructUIStateMemento', function () {
    return undefined;
  }, {category: ['UI state']});

  add.method('assumeUIState', function (uiState, evt) {
    // no UI state
  }, {category: ['UI state']});

});


thisModule.addSlots(Morph.prototype, function(add) {

  add.method('wasJustShown', function (evt) { });

});


thisModule.addSlots(TextMorph.prototype, function(add) {

  add.method('wasJustShown', function (evt) { this.requestKeyboardFocus(evt.hand); });

});


});
