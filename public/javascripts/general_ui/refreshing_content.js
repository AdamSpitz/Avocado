avocado.transporter.module.create('general_ui/refreshing_content', function(requires) {

requires('general_ui/basic_morph_mixins');

}, function(thisModule) {


thisModule.addSlots(avocado.morphMixins.Morph, function(add) {

  add.method('refreshContentOfMeAndSubmorphs', function () {
    this._hasBeenRefreshedAtLeastOnce = true;
    this.refreshContent();
    this.eachSubmorph(function(m) { m.refreshContentOfMeAndSubmorphs(); });
    return this;
  });

  add.method('refreshContentIfOnScreenOfMeAndSubmorphs', function () {
    if (! this.isOnScreen()) { return this; }
    // var s = this.toString() || this.inspect();
    // if (s) { console.log("refreshContentIfOnScreenOfMeAndSubmorphs: refreshing " + s); }

    this._hasBeenRefreshedAtLeastOnce = true;
    this.refreshContent();
    this.eachSubmorph(function(m) { m.refreshContentIfOnScreenOfMeAndSubmorphs(); });
    return this;
  });

  add.method('refreshContent', function () {
    // children can override
    this.updateStyle();
    
    if (this._layout && typeof(this._layout.refreshContent) === 'function') {
      this._layout.refreshContent(this);
    }
    
    var recalculatedActualContent = this.recalculateActualContent();
    if (recalculatedActualContent) {
      this.replaceContentWith(recalculatedActualContent);
    }
  });

  add.method('refreshContentOfMeAndSubmorphsIfNeverRefreshedBefore', function () {
    if (! this._hasBeenRefreshedAtLeastOnce) {
      this.refreshContentOfMeAndSubmorphs();
    }
  });

  add.method('recalculateActualContent', function () {
    var potentialContentMorphs = this.potentialContentMorphs();
    if (potentialContentMorphs) {
      var context = this;
      var layoutModesForContentMorphs = this._layoutModesForContentMorphs;
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

  add.method('potentialContentMorphs', function () {
    // children can override, or specify a _potentialContentCreator, or call setPotentialContentMorphs or setPotentialContentMorphsFunction
    
    if (this._potentialContentMorphs) { return this._potentialContentMorphs; }
    
    if (this._potentialContentCreator) { return this._potentialContentCreator.potentialContentMorphsForMorph(this); }
    
    return null;
  }, {category: ['potential content']});

  add.method('setPotentialContentMorphs', function (content) {
    this._potentialContentMorphs = content;
  }, {category: ['potential content']});

  add.method('setPotentialContentMorphsFunction', function (contentFunction) {
    this.potentialContentMorphs = contentFunction;
  }, {category: ['potential content']});

  add.method('updateStyle', function () {
    // children can override
    if (this._model && typeof(this._model.updateStyleOfMorph) === 'function') {
      this._model.updateStyleOfMorph(this);
    }
  });

  add.method('startPeriodicallyUpdating', function (frequency) {
    this._updater = new PeriodicalExecuter(function(pe) {
      if (window.shouldNotDoAnyPeriodicalMorphUpdating) { pe.stop(); return; }
      this.refreshContentIfOnScreenOfMeAndSubmorphs();
    }.bind(this), frequency || 8);
    return this;
  });

  add.method('isPeriodicallyUpdating', function () {
    return this._updater && this._updater.timer;
  });

  add.method('justChangedContent', function () {
    // children can override
    if (this._layout && typeof(this._layout.justChangedContent) === 'function') {
      this._layout.justChangedContent(this);
    }
  }, {category: ['updating']});

  add.method('ensureVisible', function () {
    this.morphsThatNeedToBeVisibleBeforeICanBeVisible().forEach(function(morph) { morph.ensureVisibleForJustMe(); });
    this.ensureVisibleForJustMe();
    this.topmostOwnerBesidesTheWorldAndTheHand().refreshContentIfOnScreenOfMeAndSubmorphs();
  }, {category: ['updating']});

  add.method('morphsThatNeedToBeVisibleBeforeICanBeVisible', function () {
    // children can override
    return [];
  }, {category: ['updating']});

  add.method('ensureVisibleForJustMe', function () {
    // children can override;
  }, {category: ['updating']});

  add.method('wasJustAdded', function (evt) {
    // aaa - not sure this really belongs here, used to be on TreeNodeMorph
    this.ensureVisible();

    var uiState = this.desiredUIStateAfterBeingAdded;
    if (typeof(uiState) === 'function') { uiState = uiState.call(this); }
    this.assumeUIState(uiState, null, evt);
    
    var titleLabel = this.findTitleLabel();
    if (titleLabel) { titleLabel.wasJustAdded(evt); }
  }, {category: ['events']});

});


thisModule.addSlots(avocado.morphMixins.TextMorph, function(add) {

  add.method('refreshContent', function () {
    avocado.morphMixins.Morph.refreshContent.call(this);
    if (this.refreshText) { this.refreshText(); }
  });

});


});
