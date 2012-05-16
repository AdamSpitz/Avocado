avocado.transporter.module.create('general_ui/search_results_morph', function(requires) {

requires('general_ui/table_layout');

}, function(thisModule) {


thisModule.addSlots(avocado, function(add) {

  add.creator('searchResults', {}, {category: ['searching']});

});


thisModule.addSlots(avocado.searchResults, function(add) {

  add.creator('defaultStyle', {}, {category: ['styles']});

  add.creator('headerRowStyle', {}, {category: ['styles']});

  add.creator('resultsPanelStyle', {}, {category: ['styles']});

  add.method('newMorph', function (searcher) {
    var m = avocado.ui.newMorph().setModel(searcher);
    m.useTableLayout(avocado.table.contents.columnPrototype);
    
    m.applyStyle(avocado.searchResults.defaultStyle);

    m._resultsPanel = avocado.table.newTableMorph().beInvisible().applyStyle(avocado.searchResults.resultsPanelStyle);

    m._expander = new avocado.ExpanderMorph(m);
    m._titleLabel = m.createNameLabel();
    var redoButton = avocado.command.create("Redo", function(evt) { this.redo(); }.bind(m)).newMorph();
    var dismissButton = m.createDismissButton();

    m._headerRow = avocado.table.createSpaceFillingRowMorph([m._expander, m._titleLabel, avocado.ui.createSpacer(), redoButton, dismissButton], avocado.searchResults.headerRowStyle.padding);
    
    m.redo = function(callback) {
      this._resultsPanel.replaceContentWith(avocado.table.contents.createWithRows([[]])); // clear it first
      this._resultsPanel.replaceContentWith(avocado.searchResults.tableContainingMorphsForResultsFrom(this._model));
      this.assumeUIState({isExpanded: true}, callback);
      return this;
    };
    
    m.partsOfUIState = function() {
      return {
        isExpanded: this._expander
      };
    };

    m.layout().setPotentialCells([m._headerRow, avocado.table.createOptionalMorph(m._resultsPanel, function() {return this._expander.isExpanded();}.bind(m))]);
    m.refreshContent();
    
    return m;
  }, {category: ['user interface']});

  add.method('tableContainingMorphsForResultsFrom', function (searcher) {
    var results = searcher.goAndReturnSortedResults();
    var resultRows = results.map(function(o) { return o.createMorphsForSearchResults(); });
    return avocado.table.contents.createWithRows(resultRows);
  }, {category: ['user interface']});

});


thisModule.addSlots(avocado.searchResults.defaultStyle, function(add) {

  add.data('openForDragAndDrop', false);

  add.data('padding', 5);

  add.data('borderRadius', 10);

  add.data('fillBase', new Color(0.5, 0.5, 0.9));

});


thisModule.addSlots(avocado.searchResults.headerRowStyle, function(add) {

  add.data('padding', {top: 0, bottom: 0, left: 3, right: 3, between: {x: 3, y: 3}}, {initializeTo: '{top: 0, bottom: 0, left: 3, right: 3, between: {x: 3, y: 3}}'});

});


thisModule.addSlots(avocado.searchResults.resultsPanelStyle, function(add) {

  add.data('padding', {top: 3, bottom: 3, left: 3, right: 3, between: {x: 3, y: 3}}, {initializeTo: '{top: 3, bottom: 3, left: 3, right: 3, between: {x: 3, y: 3}}'});

});


});
