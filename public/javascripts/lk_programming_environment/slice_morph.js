transporter.module.create('lk_programming_environment/slice_morph', function(requires) {

requires('lk_ext/rows_and_columns');

}, function(thisModule) {


thisModule.addSlots(avocado, function(add) {

  add.method('SliceMorph', function SliceMorph() { Class.initializer.apply(this, arguments); }, {category: ['slices']});

});


thisModule.addSlots(avocado.senders.finder, function(add) {

  add.method('newMorph', function () {
    return new avocado.SliceMorph(this);
  });

});


thisModule.addSlots(avocado.implementorsFinder, function(add) {

  add.method('newMorph', function () {
    return new avocado.SliceMorph(this);
  });

});


thisModule.addSlots(avocado.referenceFinder, function(add) {

  add.method('newMorph', function () {
    return new avocado.SliceMorph(this);
  });

});


thisModule.addSlots(avocado.SliceMorph, function(add) {

  add.data('superclass', avocado.ColumnMorph);

  add.creator('prototype', Object.create(avocado.ColumnMorph.prototype));

  add.data('type', 'avocado.SliceMorph');

});


thisModule.addSlots(avocado.SliceMorph.prototype, function(add) {

  add.data('constructor', avocado.SliceMorph);

  add.method('initialize', function ($super, searcher) {
    $super();
    this._searcher = searcher;

    this.setFill(lively.paint.defaultFillWithColor(Color.blue.lighter()));
    this.setPadding(5);
    this.shape.roundEdgesBy(10);
    this.closeDnD();

    this._slotsPanel = new avocado.ColumnMorph().beInvisible();
    this._slotsPanel.horizontalLayoutMode = LayoutModes.SpaceFill;

    this._expander = new ExpanderMorph(this);
    this.titleLabel = TextMorph.createLabel(function() {return searcher.inspect();});
    this.redoButton = ButtonMorph.createButton("Redo", function(evt) { this.redo(evt); }.bind(this), 1);
    this.dismissButton = this.createDismissButton();

    this._headerRow = avocado.RowMorph.createSpaceFilling([this._expander, this.titleLabel, Morph.createSpacer(), this.redoButton, this.dismissButton],
                                                          {top: 0, bottom: 0, left: 3, right: 3, between: 3});

    this.setPotentialContent([this._headerRow, Morph.createOptionalMorph(this._slotsPanel, function() {return this.expander().isExpanded();}.bind(this))]);
    this.refreshContent();
  });

  add.method('searcher', function () { return this._searcher; });

  add.method('updateAppearance', function () {
    if (! this.world()) {return;}
    this.titleLabel.refreshText();
    this.minimumExtentMayHaveChanged();
  });

  add.method('inspect', function () {return this.searcher().inspect();});

  add.method('expander', function () { return this._expander; }, {category: ['expanding and collapsing']});

  add.method('updateExpandedness', function () {
    if (! this.world()) {return;}
    this.refreshContentOfMeAndSubmorphs();
  });

  add.method('redo', function () {
    this._slotsPanel.setRows([]);
    var ss = this.searcher().go().sortBy(function(sp) { return sp.holder().name().toUpperCase(); });
    var sms = ss.map(function(s) { return this.createRowForSlot(s); }.bind(this));
    this._slotsPanel.setRows(sms);
    this.expander().expand();
  });

  add.method('createRowForSlot', function (s) {
    var inSituButton = ButtonMorph.createButton("in situ", function() { this.showInSitu(s, inSituButton); }.bind(this), 2);
    return avocado.RowMorph.createSpaceFilling([TextMorph.createLabel(s.holder().name()), Morph.createSpacer(), s.newMorph(), inSituButton],
                                               {top: 0, bottom: 0, left: 3, right: 3, between: 3});
  });

  add.method('showInSitu', function (s, inSituButton) {
    var w = this.world();
    w.morphFor(s.holder()).ensureIsInWorld(w, inSituButton.worldPoint(pt(150,0)), true, true, true);
  });

  add.method('constructUIStateMemento', function () {
    return {
      isExpanded: this.expander().isExpanded(),
    };
  }, {category: ['UI state']});

  add.method('assumeUIState', function (uiState, evt) {
    if (!uiState) { return; }
    evt = evt || Event.createFake();
    this.expander().setExpanded(uiState.isExpanded);
  }, {category: ['UI state']});

});


});
