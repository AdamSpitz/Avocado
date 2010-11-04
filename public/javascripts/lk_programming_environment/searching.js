transporter.module.create('lk_programming_environment/searching', function(requires) {

requires('lk_ext/search_results_morph');
requires('programming_environment/searching');

}, function(thisModule) {


thisModule.addSlots(avocado.searchResultsPresenter, function(add) {

  add.method('newMorph', function () {
    if (this._searcher.resultsAreSlots) {
      return new avocado.SearchResultsMorph(this);
    } else {
      throw new Error("What kind of morph should we make for " + this.inspect() + "?");
    }
  });

});


});
