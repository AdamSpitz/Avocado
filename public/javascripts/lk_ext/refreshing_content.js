Morph.addMethods({
  refreshContentOfMeAndSubmorphs: function() {
    this._hasBeenRefreshedAtLeastOnce = true;
    this.refreshContent();
    this.submorphs.each(function(m) { m.refreshContentOfMeAndSubmorphs(); });
    return this;
  },
  
  refreshContentIfOnScreenOfMeAndSubmorphs: function() {
    if (! this.isOnScreen()) { return this; }
    // var s = this.toString() || this.inspect();
    // if (s) { console.log("refreshContentIfOnScreenOfMeAndSubmorphs: refreshing " + s); }

    this._hasBeenRefreshedAtLeastOnce = true;
    this.refreshContent();
    this.submorphs.each(function(m) { m.refreshContentIfOnScreenOfMeAndSubmorphs(); });
    return this;
  },
  
  refreshContent: function() {
    // children can override
    this.updateFill();
  },
  
  refreshContentOfMeAndSubmorphsIfNeverRefreshedBefore: function() {
    if (! this._hasBeenRefreshedAtLeastOnce) {
      this.refreshContentOfMeAndSubmorphs();
    }
  },

  updateFill: function() {
    // children can override
  },

  startPeriodicallyUpdating: function (frequency) {
    this._updater = new PeriodicalExecuter(function(pe) {
      if (window.shouldNotDoAnyPeriodicalMorphUpdating) { pe.stop(); return; }
      this.refreshContentIfOnScreenOfMeAndSubmorphs();
    }.bind(this), frequency || 8);
  },
  
  isPeriodicallyUpdating: function () {
    return this._updater && this._updater.timer;
  }
});

TextMorph.addMethods({
  refreshContent: function() {
    if (this.refreshText) { this.refreshText(); }
  }
});
