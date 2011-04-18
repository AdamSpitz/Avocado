transporter.module.create('lk_ext/search_results_morph', function(requires) {

requires('lk_ext/rows_and_columns');

}, function(thisModule) {


thisModule.addSlots(avocado, function(add) {

  add.method('SearchResultsMorph', function SearchResultsMorph() { Class.initializer.apply(this, arguments); }, {category: ['searching']});

});


thisModule.addSlots(avocado.SearchResultsMorph, function(add) {

  add.data('superclass', avocado.ColumnMorph);

  add.data('type', 'avocado.SearchResultsMorph');

  add.creator('prototype', Object.create(avocado.ColumnMorph.prototype));

});


thisModule.addSlots(avocado.SearchResultsMorph.prototype, function(add) {

  add.data('constructor', avocado.SearchResultsMorph);

  add.method('initialize', function ($super, searcher) {
    $super();
    this._searcher = searcher;

    this.setFill(lively.paint.defaultFillWithColor(Color.blue.lighter()));
    this.setPadding(5);
    this.shape.roundEdgesBy(10);
    this.closeDnD();

    this._resultsPanel = new avocado.TableMorph().beInvisible().applyStyle(this.resultsPanelStyle);

    this._expander = new ExpanderMorph(this);
    this._titleLabel = TextMorph.createLabel(function() {return this.inspect();}.bind(this));
    this.redoButton = ButtonMorph.createButton("Redo", function(evt) { this.redo(evt); }.bind(this), 1);
    this.dismissButton = this.createDismissButton();

    this._headerRow = avocado.RowMorph.createSpaceFilling([this._expander, this._titleLabel, Morph.createSpacer(), this.redoButton, this.dismissButton], this.headerRowStyle.padding);

    this.setPotentialRows([this._headerRow, Morph.createOptionalMorph(this._resultsPanel, function() {return this.expander().isExpanded();}.bind(this))]);
    this.refreshContent();
  });

  add.method('searcher', function () { return this._searcher; });

  add.creator('headerRowStyle', {}, {category: ['styles']});

  add.creator('resultsPanelStyle', {}, {category: ['styles']});

  add.method('inspect', function () {return this.searcher().inspect();});

  add.method('expander', function () { return this._expander; }, {category: ['expanding and collapsing']});

  add.method('updateExpandedness', function () {
    if (! this.world()) { return; }
    this.refreshContentOfMeAndSubmorphs();
  });

  add.method('redo', function () {
    this._resultsPanel.replaceContentWith(avocado.tableContents.createWithRows([[]]));
    var results = this.searcher().go();
    var sortCrit = this.searcher().sortingCriteriaForSearchResults();
    if (sortCrit) { results = results.sortBy(sortCrit); }
    var resultRows = results.map(function(o) { return o.createMorphsForSearchResults(); });
    this._resultsPanel.replaceContentWith(avocado.tableContents.createWithRows(resultRows));
    this.expander().expand();
  });

  add.method('partsOfUIState', function () {
    return {
      isExpanded: this.expander()
    };
  }, {category: ['UI state']});

});


thisModule.addSlots(avocado.SearchResultsMorph.prototype.headerRowStyle, function(add) {

  add.data('padding', {top: 0, bottom: 0, left: 3, right: 3, between: {x: 3, y: 3}}, {initializeTo: '{top: 0, bottom: 0, left: 3, right: 3, between: {x: 3, y: 3}}'});

});


thisModule.addSlots(avocado.SearchResultsMorph.prototype.resultsPanelStyle, function(add) {

  add.data('padding', {top: 3, bottom: 3, left: 3, right: 3, between: {x: 3, y: 3}}, {initializeTo: '{top: 3, bottom: 3, left: 3, right: 3, between: {x: 3, y: 3}}'});

});


});
