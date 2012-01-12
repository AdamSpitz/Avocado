avocado.transporter.module.create('lk_ext/search_results_morph', function(requires) {

requires('general_ui/table_layout');

}, function(thisModule) {


thisModule.addSlots(avocado, function(add) {

  add.method('SearchResultsMorph', function SearchResultsMorph() { Class.initializer.apply(this, arguments); }, {category: ['searching']});

});


thisModule.addSlots(avocado.SearchResultsMorph, function(add) {

  add.data('superclass', Morph);

  add.data('type', 'avocado.SearchResultsMorph');

  add.creator('prototype', Object.create(Morph.prototype));

});


thisModule.addSlots(avocado.SearchResultsMorph.prototype, function(add) {

  add.data('constructor', avocado.SearchResultsMorph);

  add.method('initialize', function ($super, searcher) {
    $super(lively.scene.Rectangle.createWithIrrelevantExtent());
    this.useTableLayout(avocado.table.contents.columnPrototype);
    this._model = searcher;
    
    this.applyStyle(this.defaultStyle);

    this._resultsPanel = avocado.table.newTableMorph().beInvisible().applyStyle(this.resultsPanelStyle);

    this._expander = new avocado.ExpanderMorph(this);
    this._titleLabel = this.createNameLabel();
    this.redoButton = ButtonMorph.createButton("Redo", function(evt) { this.redo(evt); }.bind(this), 1);
    this.dismissButton = this.createDismissButton();

    this._headerRow = avocado.table.createSpaceFillingRowMorph([this._expander, this._titleLabel, avocado.ui.createSpacer(), this.redoButton, this.dismissButton], this.headerRowStyle.padding);

    this.layout().setPotentialCells([this._headerRow, Morph.createOptionalMorph(this._resultsPanel, function() {return this.expander().isExpanded();}.bind(this))]);
    this.refreshContent();
  });
  
  add.method('searcher', function () { return this._model; });

  add.creator('defaultStyle', {}, {category: ['styles']});

  add.creator('headerRowStyle', {}, {category: ['styles']});

  add.creator('resultsPanelStyle', {}, {category: ['styles']});

  add.method('inspect', function () {return this.searcher().inspect();});

  add.method('expander', function () { return this._expander; }, {category: ['expanding and collapsing']});

  add.method('redo', function () {
    this._resultsPanel.replaceContentWith(avocado.table.contents.createWithRows([[]]));
    var results = this.searcher().go();
    var sortCrit = this.searcher().sortingCriteriaForSearchResults();
    if (sortCrit) { results = results.sortBy(sortCrit); }
    var resultRows = results.map(function(o) { return o.createMorphsForSearchResults(); });
    this._resultsPanel.replaceContentWith(avocado.table.contents.createWithRows(resultRows));
    this.expander().expand();
    return this;
  });

  add.method('partsOfUIState', function () {
    return {
      isExpanded: this.expander()
    };
  }, {category: ['UI state']});

});


thisModule.addSlots(avocado.SearchResultsMorph.prototype.defaultStyle, function(add) {
  
  add.data('openForDragAndDrop', false);

  add.data('padding', 5);

  add.data('borderRadius', 10);

  add.data('fill', lively.paint.defaultFillWithColor(Color.blue.lighter()));
  
});


thisModule.addSlots(avocado.SearchResultsMorph.prototype.headerRowStyle, function(add) {

  add.data('padding', {top: 0, bottom: 0, left: 3, right: 3, between: {x: 3, y: 3}}, {initializeTo: '{top: 0, bottom: 0, left: 3, right: 3, between: {x: 3, y: 3}}'});

});


thisModule.addSlots(avocado.SearchResultsMorph.prototype.resultsPanelStyle, function(add) {

  add.data('padding', {top: 3, bottom: 3, left: 3, right: 3, between: {x: 3, y: 3}}, {initializeTo: '{top: 3, bottom: 3, left: 3, right: 3, between: {x: 3, y: 3}}'});

});


});
