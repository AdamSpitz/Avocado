Morph.addMethods({
  refreshContentOfMeAndSubmorphs: function() {
    this.refreshContent();
    this.submorphs.each(function(m) { m.refreshContentOfMeAndSubmorphs(); });
  },
  
  refreshContentIfOnScreenOfMeAndSubmorphs: function() {
    if (! this.isOnScreen()) { return; }
    this.refreshContent();
    this.submorphs.each(function(m) { m.refreshContentIfOnScreenOfMeAndSubmorphs(); });
  },
  
  refreshContent: function() {
    // children can override
    this.updateFill();
  },

  updateFill: function() {
    // children can override
  },

  startPeriodicallyUpdating: function (frequency) {
    this._updater = new PeriodicalExecuter(function(pe) {
      if (window.shouldNotDoAnyPeriodicalMorphUpdating) { pe.stop(); return; }
      this.refreshContentIfOnScreenOfMeAndSubmorphs();
    }.bind(this), frequency || 8);
  }
});

TextMorph.addMethods({
  refreshContent: function() {
    if (this.refreshText) { this.refreshText(); }
  }
});
