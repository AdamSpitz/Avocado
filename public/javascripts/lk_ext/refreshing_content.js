Morph.addMethods({
  refreshContentOfMeAndSubmorphs: function() {
    this.refreshContent();
    this.submorphs.each(function(m) { m.refreshContentOfMeAndSubmorphs(); });
  },
  
  refreshContent: function() {
    // children can override
    this.updateFill();
  },

  updateFill: function() {
    // children can override
  },

  updateAppearance: function () {
    if (! this.world()) { return; }
    this.refreshContentOfMeAndSubmorphs();
  },

  startPeriodicallyUpdating: function (frequency) {
    this._updater = new PeriodicalExecuter(function(pe) {
      if (window.shouldNotDoAnyPeriodicalMorphUpdating) { pe.stop(); return; }
      this.updateAppearance();
    }.bind(this), frequency || 8);
  }
});

TextMorph.addMethods({
  refreshContent: function() {
    if (this.refreshText) { this.refreshText(); }
  }
});
