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
    var contentMorphs = contentMorphsOrNull || this.recalculateActualContent() || this.submorphs;
    this._hasAlreadyBeenLaidOutAtLeastOnce = true;
    var pose = this.poseManager().cleaningUpPose(contentMorphs).beUnobtrusive().beSquarish().whenDoneScaleToFitWithinCurrentSpace();
    this.poseManager().assumePose(pose);
  }, {category: ['organizing']});
  
  add.method('acceptsDropping', function ($super, m) {
    // aaa - I'm confused, why was this method always returning null? (The call to $super was not here before.)
    return $super(m);
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

  add.method('doIWantToLeaveAPlaceholderWhenRemoving', function (m) {
    // aaa - probably need to actually determine whether the submorph is part of
    // this morph's potential content (rather than just some transient thing)
    return true;
  }, {category: ['placeholders']});
  
  add.method('recalculateActualContent', function ($super) {
    return $super() || this.submorphs;
  });

  add.method('replaceContentWith', function (newContentMorphs) {
    this.removeMorphsNotIncludedIn(newContentMorphs);
    this.invalidateLayoutIfIDoNotContainMorphsIncludedIn(newContentMorphs);
    this.refreshLayoutIfNecessary(newContentMorphs);
  });
  
  add.method('removeMorphsNotIncludedIn', function (contentMorphs) {
    // aaa - find a more efficient way to do this
    this.eachSubmorph(function(m) {
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

});


});
