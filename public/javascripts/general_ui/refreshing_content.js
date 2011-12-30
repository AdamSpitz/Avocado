avocado.transporter.module.create('general_ui/refreshing_content', function(requires) {

requires('general_ui/basic_morph_mixins');

}, function(thisModule) {


thisModule.addSlots(avocado.morphMixins.Morph, function(add) {

  add.method('refreshContentOfMeAndSubmorphs', function() {
    this._hasBeenRefreshedAtLeastOnce = true;
    this.refreshContent();
    this.eachSubmorph(function(m) { m.refreshContentOfMeAndSubmorphs(); });
    return this;
  });
  
  add.method('refreshContentIfOnScreenOfMeAndSubmorphs', function() {
    if (! this.isOnScreen()) { return this; }
    // var s = this.toString() || this.inspect();
    // if (s) { console.log("refreshContentIfOnScreenOfMeAndSubmorphs: refreshing " + s); }

    this._hasBeenRefreshedAtLeastOnce = true;
    this.refreshContent();
    this.eachSubmorph(function(m) { m.refreshContentIfOnScreenOfMeAndSubmorphs(); });
    return this;
  });
  
  add.method('refreshContent', function() {
    // children can override
    this.updateFill();
    
    var recalculatedActualContent = this.recalculateActualContent();
    if (recalculatedActualContent) {
      this.replaceContentWith(recalculatedActualContent);
    }
  });
  
  add.method('refreshContentOfMeAndSubmorphsIfNeverRefreshedBefore', function() {
    if (! this._hasBeenRefreshedAtLeastOnce) {
      this.refreshContentOfMeAndSubmorphs();
    }
  });

  add.method('recalculateActualContent', function () {
    if (typeof(this.potentialContentMorphs) === 'function') {
      var context = this;
      var layoutModesForContentMorphs = this._layoutModesForContentMorphs;
      var potentialContentMorphs = this.potentialContentMorphs();
      var actualContentMorphs = potentialContentMorphs.selectThenMap(function(morphOrToggler) {
        return !!morphOrToggler.actualMorphToShow(context);
      }, function(morphOrToggler) {
        var actualMorph = morphOrToggler.actualMorphToShow(context);
        if (layoutModesForContentMorphs) { actualMorph.setLayoutModes(layoutModesForContentMorphs); }
        return actualMorph;
      });
      return actualContentMorphs;
    } else {
      return null;
    }
  }, {category: ['potential content']});

  add.method('replaceContentWith', function (newContent) {
    if (this._layout && this._layout.replaceContentWith) {
      this.layout().replaceContentWith(newContent);
      return this;
    }
    
    throw new Error("To use the potentialContentMorphs mechanism, the morph or the layout must override replaceContentWith.");
  }, {category: ['potential content']});

  add.method('makeContentMorphsHaveLayoutModes', function (layoutModes) {
    // aaa - kind of a hack, but better than having it directly in the TreeNodeMorph code
    this._layoutModesForContentMorphs = layoutModes;
    return this;
  }, {category: ['layout']});

  add.method('setPotentialContentMorphs', function (content) {
    this.setPotentialContentMorphsFunction(function() { return content; });
  }, {category: ['potential content']});

  add.method('setPotentialContentMorphsFunction', function (contentFunction) {
    this.potentialContentMorphs = contentFunction;
  }, {category: ['potential content']});

  add.method('updateFill', function() {
    // children can override
    if (this._model && typeof(this._model.updateFillOfMorph) === 'function') {
      this._model.updateFillOfMorph(this);
    }
  });

  add.method('startPeriodicallyUpdating', function (frequency) {
    this._updater = new PeriodicalExecuter(function(pe) {
      if (window.shouldNotDoAnyPeriodicalMorphUpdating) { pe.stop(); return; }
      this.refreshContentIfOnScreenOfMeAndSubmorphs();
    }.bind(this), frequency || 8);
  });
  
  add.method('isPeriodicallyUpdating', function () {
    return this._updater && this._updater.timer;
  });
  
});


thisModule.addSlots(avocado.morphMixins.TextMorph, function(add) {

  add.method('refreshContent', function() {
    if (this.refreshText) { this.refreshText(); }
  });

});


});
