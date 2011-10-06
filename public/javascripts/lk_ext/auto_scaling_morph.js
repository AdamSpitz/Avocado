avocado.transporter.module.create('lk_ext/auto_scaling_morph', function(requires) {

}, function(thisModule) {


thisModule.addSlots(avocado, function(add) {

  add.method('AutoScalingMorph', function AutoScalingMorph() { Class.initializer.apply(this, arguments); }, {category: ['ui']});

});


thisModule.addSlots(avocado.AutoScalingMorph, function(add) {

  add.data('superclass', Morph);

  add.data('type', 'avocado.AutoScalingMorph');

  add.creator('prototype', Object.create(Morph.prototype));

});


thisModule.addSlots(avocado.AutoScalingMorph.prototype, function(add) {

  add.data('constructor', avocado.AutoScalingMorph);
  
  add.method('setShouldScaleSubmorphsToFit', function (b) {
    this._shouldScaleSubmorphsToFit = b;
    return this;
  }, {category: ['scaling']});

  add.method('setShouldAutoOrganize', function (b) {
    this._shouldAutoOrganize = b;
    return this;
  }, {category: ['organizing']});

  add.method('cleanUp', function (contentMorphsOrNull) {
    var contentMorphs = contentMorphsOrNull || this.recalculateActualContentMorphs();
    this._hasAlreadyBeenLaidOutAtLeastOnce = true;
    var pose = this.poseManager().cleaningUpPose(contentMorphs).beUnobtrusive().beSquarish().whenDoneScaleToFitWithinCurrentSpace();
    this.poseManager().assumePose(pose);
  }, {category: ['organizing']});
  
  add.method('acceptsDropping', function ($super, m) {
  }, {category: ['drag and drop']});
  
  add.method('aboutToReceiveDrop', function ($super, m) {
    if (this._shouldScaleSubmorphsToFit) {
      var tfm = m.transformForNewOwner(this);
  		m.scaleBy(1 / tfm.getScale());
    }
  }, {category: ['drag and drop']});
  
  add.method('justReceivedDrop', function ($super, m) {
    if (this._shouldAutoOrganize) {
      this.cleanUp();
    }
  }, {category: ['drag and drop']});

  add.method('recalculateActualContentMorphs', function () {
    // aaa - duplicated from TableMorph
    var context = this;
    if (typeof(this.potentialContentMorphs) === 'function') {
      var potentialContentMorphs = this.potentialContentMorphs();
      var actualContentMorphs = potentialContentMorphs.selectThenMap(function(morphOrToggler) {
        return !!morphOrToggler.actualMorphToShow(context);
      }, function(morphOrToggler) {
        return morphOrToggler.actualMorphToShow(context);
      });
      return actualContentMorphs;
    } else {
      return this.submorphs;
    }
  }, {category: ['updating']});

  add.method('setPotentialContentMorphs', function (content) {
    // aaa - duplicated from TableMorph
    this.setPotentialContentMorphsFunction(function() { return content; });
  }, {category: ['updating']});

  add.method('setPotentialContentMorphsFunction', function (contentFunction) {
    // aaa - duplicated from TableMorph
    this.potentialContentMorphs = contentFunction;
  }, {category: ['updating']});

  add.method('doIWantToLeaveAPlaceholderWhenRemoving', function (m) {
    // aaa - probably need to actually determine whether the submorph is part of
    // this morph's potential content (rather than just some transient thing)
    return true;
  }, {category: ['placeholders']});
  
  add.method('refreshContent', function () {
    var contentMorphs = this.recalculateActualContentMorphs();
    this.removeMorphsNotIncludedIn(contentMorphs);
    this.invalidateLayoutIfIDoNotContainMorphsIncludedIn(contentMorphs);
    this.refreshLayoutIfNecessary(contentMorphs);
  });

  add.method('removeMorphsNotIncludedIn', function (contentMorphs) {
    // aaa - find a more efficient way to do this
    this.submorphs.forEach(function(m) {
      if (! contentMorphs.include(m)) {
        this.removeMorph(m);
        this.invalidateLayout();
      }
    }.bind(this));
  });

  add.method('invalidateLayoutIfIDoNotContainMorphsIncludedIn', function (contentMorphs) {
    if (! this._hasAlreadyBeenLaidOutAtLeastOnce) { return; } // already invalidated, no point in checking
    
    // aaa - find a more efficient way to do this
    contentMorphs.forEach(function(m) {
      if (m.owner !== this) {
        this.invalidateLayout();
      }
    }.bind(this));
  });
  
  add.method('invalidateLayout', function () {
    this._hasAlreadyBeenLaidOutAtLeastOnce = false;
  });
  
  add.method('refreshLayoutIfNecessary', function (contentMorphs) {
    if (!this._hasAlreadyBeenLaidOutAtLeastOnce) {
      this.cleanUp(contentMorphs);
    }
  });
  
  add.method('possiblyDoSomethingBecauseASubmorphMinimumExtentHasChanged', function () {
    this.invalidateLayout();
    // aaa Can't just do the refreshLayoutIfNecessary() right now because the submorph's *actual* size
    // hasn't changed yet. But ideally I guess we would have the cleanUp pose account for minimum size
    // rather than actual size.
    setTimeout(this.refreshLayoutIfNecessary.bind(this), 0);
    return false;
  }, {category: ['layout']});

  add.method('potentialContentsCount', function () {
    // aaa - this is kind of a hack
    return this.recalculateContentModels ? this.recalculateContentModels().size() : this.submorphs.length;
  });

});


});
