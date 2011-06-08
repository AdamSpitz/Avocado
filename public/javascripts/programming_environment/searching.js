avocado.transporter.module.create('programming_environment/searching', function(requires) {

}, function(thisModule) {


thisModule.addSlots(avocado, function(add) {

  add.creator('searchResultsPresenter', {}, {category: ['searching']});

});


thisModule.addSlots(avocado.searchResultsPresenter, function(add) {

  add.method('create', function (searcher) {
    return Object.newChildOf(this, searcher);
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

  add.method('sortingCriteriaForSearchResults', function () {
    if (this._searcher.resultsAreSlots) { // aaa hack
      return function(s) { return s.holder().name().toUpperCase(); };
    } else {
      console.log("Trying to sort " + this.inspect() + " but don't know how.");
      return null;
    }
  }, {category: ['sorting']});

});


});
