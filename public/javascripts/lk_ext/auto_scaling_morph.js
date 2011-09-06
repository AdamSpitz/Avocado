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
  
  add.method('recalculateContentMorphs', function () {
    // users should feel free to overwrite this function
    return this.submorphs;
  }, {category: ['content']});

  add.method('setShouldScaleSubmorphsToFit', function (b) {
    this._shouldScaleSubmorphsToFit = b;
    return this;
  }, {category: ['scaling']});

  add.method('setShouldAutoOrganize', function (b) {
    this._shouldAutoOrganize = b;
    return this;
  }, {category: ['organizing']});

  add.method('cleanUp', function (contentMorphsOrNull) {
    var contentMorphs = contentMorphsOrNull || this.recalculateContentMorphs();
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
  
  add.method('refreshContent', function () {
    var contentMorphs = this.recalculateContentMorphs();
    // aaa - find a more efficient way to do this
    this.submorphs.forEach(function(m) {
      if (! contentMorphs.include(m)) {
        this.removeMorph(m);
      }
    }.bind(this));
    
    if (!this._hasAlreadyBeenLaidOutAtLeastOnce) {
      this.cleanUp(contentMorphs);
    } else {
      // Don't redo the pose (because the user may have moved things around, and we don't want to wreck
      // his arrangement), but make sure that if there are any contentMorphs that aren't actually being
      // shown yet (perhaps because they were just added by some model-level code), they're added to the
      // contents panel.
      contentMorphs.forEach(function(m) {
        if (m.owner !== this) {
          // aaa - at least spread them out so that if multiple ones are added at the same time, they
          // don't show up right on top of each other.
          // 
          // Or, ideally, someday, do something cool where the morphs arrange themselves, being smart enough
          // to stay approximately where they're put but they shuffle around a bit to avoid colliding with others.
          // var possibleLocations = this.owner._contentsPanelSize.subPt(m.getExtent().scaleBy(m.getScale()));
          // cp.addMorphAt(m, possibleLocations.random());
          this.addMorphAt(m, pt(0,0));
        }
      }.bind(this));
    }
  });

  add.method('potentialContentsCount', function () {
    // aaa - this is kind of a hack
    return this.recalculateContentModels ? this.recalculateContentModels().size() : this.submorphs.length;
  });

});


});
