avocado.transporter.module.create('lk_ext/search_results_morph', function(requires) {

requires('general_ui/table_layout');

}, function(thisModule) {


thisModule.addSlots(avocado, function(add) {

  add.creator('searchResults', {}, {category: ['searching']});

});


thisModule.addSlots(avocado.searchResults, function(add) {

  add.method('Morph', function Morph() { Class.initializer.apply(this, arguments); }, {comment: 'Actually, I think this whole specialized morph should be replaced by a standard tree-node morph, once the placeholder-morph system works well enough - just let the content morphs whoosh back and forth between the search-results and their real home. -- Adam'});

  add.creator('defaultStyle', {}, {category: ['styles']});

  add.creator('headerRowStyle', {}, {category: ['styles']});

  add.creator('resultsPanelStyle', {}, {category: ['styles']});

});


thisModule.addSlots(avocado.searchResults.Morph, function(add) {

  add.data('superclass', Morph);

  add.data('type', 'avocado.searchResults.Morph');

  add.creator('prototype', Object.create(Morph.prototype));

});


thisModule.addSlots(avocado.searchResults.Morph.prototype, function(add) {

  add.data('constructor', avocado.searchResults.Morph);

  add.method('initialize', function ($super, searcher) {
    $super(lively.scene.Rectangle.createWithIrrelevantExtent());
    this.useTableLayout(avocado.table.contents.columnPrototype);
    this._model = searcher;
    
    this.applyStyle(avocado.searchResults.defaultStyle);

    this._resultsPanel = avocado.table.newTableMorph().beInvisible().applyStyle(avocado.searchResults.resultsPanelStyle);

    this._expander = new avocado.ExpanderMorph(this);
    this._titleLabel = this.createNameLabel();
    var redoButton = ButtonMorph.createButton("Redo", function(evt) { this.redo(evt); }.bind(this), 1);
    var dismissButton = this.createDismissButton();

    this._headerRow = avocado.table.createSpaceFillingRowMorph([this._expander, this._titleLabel, avocado.ui.createSpacer(), redoButton, dismissButton], avocado.searchResults.headerRowStyle.padding);

    this.layout().setPotentialCells([this._headerRow, Morph.createOptionalMorph(this._resultsPanel, function() {return this.expander().isExpanded();}.bind(this))]);
    this.refreshContent();
  });
  
  add.method('searcher', function () { return this._model; });

  add.method('expander', function () { return this._expander; }, {category: ['expanding and collapsing']});

  add.method('redo', function () {
    this._resultsPanel.replaceContentWith(avocado.table.contents.createWithRows([[]]));
    var results = this.searcher().goAndReturnSortedResults();
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


thisModule.addSlots(avocado.searchResults.defaultStyle, function(add) {
  
  add.data('openForDragAndDrop', false);

  add.data('padding', 5);

  add.data('borderRadius', 10);

  add.data('fillBase', Color.blue.lighter());
  
});


thisModule.addSlots(avocado.searchResults.headerRowStyle, function(add) {

  add.data('padding', {top: 0, bottom: 0, left: 3, right: 3, between: {x: 3, y: 3}}, {initializeTo: '{top: 0, bottom: 0, left: 3, right: 3, between: {x: 3, y: 3}}'});

});


thisModule.addSlots(avocado.searchResults.resultsPanelStyle, function(add) {

  add.data('padding', {top: 3, bottom: 3, left: 3, right: 3, between: {x: 3, y: 3}}, {initializeTo: '{top: 3, bottom: 3, left: 3, right: 3, between: {x: 3, y: 3}}'});

});


});
