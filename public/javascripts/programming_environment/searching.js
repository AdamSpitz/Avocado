avocado.transporter.module.create('programming_environment/searching', function(requires) {

requires('general_ui/search_results_morph');

}, function(thisModule) {


thisModule.addSlots(avocado, function(add) {

  add.creator('searchResultsPresenter', {}, {category: ['searching']});

});


thisModule.addSlots(avocado.searchResultsPresenter, function(add) {

  add.method('create', function (searcher) {
    return Object.newChildOf(this, searcher);
  }, {category: ['creating']});

  add.method('createForSlots', function (slots, description) {
    return this.create({
      inspect: function() { return description; },
      go: function() { return slots; },
      results: function() { return slots; },
      resultsAreSlots: function() { return true; }
    });
  }, {category: ['creating']});

  add.method('initialize', function (searcher) {
    this._searcher = searcher;
  }, {category: ['creating']});

  add.method('inspect', function () {
    return this._searcher.inspect();
  }, {category: ['printing']});

  add.method('go', function () {
    return this._searcher.go();
  }, {category: ['searching']});

  add.method('results', function () {
    return this._searcher.results();
  }, {category: ['accessing']});

  add.method('goAndReturnSortedResults', function () {
    var results = this.go();
    var sortCrit = this.sortingCriteriaForSearchResults();
    return sortCrit ? results.sortBy(sortCrit) : results;
  }, {category: ['accessing']});

  add.method('sortingCriteriaForSearchResults', function () {
    if (this._searcher.resultsAreSlots()) { // aaa hack
      return function(s) { return s.holder().name().toUpperCase(); };
    } else {
      console.log("Trying to sort " + this.inspect() + " but don't know how.");
      return null;
    }
  }, {category: ['sorting']});

  add.method('newMorph', function () {
    var shouldEnableTheTreeNodeSliceExperiment = false;
    if (shouldEnableTheTreeNodeSliceExperiment) {
      var m = avocado.treeNode.newMorphFor(this, avocado.searchResults.defaultStyle);
      m.redo = function() { this.redo(); }.bind(this); // just because the old-style slice morphs expect that method to be there
      return m;
    } else {
      // The new tree-node way isn't good enough yet for me to be willing to completely throw away the old way. -- Adam
      if (this._searcher.resultsAreSlots()) {
        return avocado.searchResults.newMorph(this);
      } else {
        throw new Error("What kind of morph should we make for " + this.inspect() + "?");
      }
    }
  }, {category: ['user interface']});

  add.method('immediateContents', function () {
    if (! this._immediateContents) {
      this._immediateContents = this.goAndReturnSortedResults();
    }
    return this._immediateContents;
  }, {category: ['user interface']});

  add.method('redo', function (evt) {
    this._immediateContents = this.goAndReturnSortedResults();
    avocado.ui.justChanged(this, null, evt);
  }, {category: ['user interface']});

  add.method('commands', function () {
    var cmdList = avocado.command.list.create(this);
    cmdList.addItem(avocado.command.create("redo", function(evt) { this.redo(evt); }));
    return cmdList;
  }, {category: ['user interface']});

});


});
