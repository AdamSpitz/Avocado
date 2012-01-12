avocado.transporter.module.create('general_ui/auto_scaling_morph', function(requires) {

requires('general_ui/basic_morph_mixins');

}, function(thisModule) {


thisModule.addSlots(avocado, function(add) {
  
  add.creator('autoScaling', {}, {category: ['ui']});
  
});


thisModule.addSlots(avocado.autoScaling, function(add) {

  add.creator('layout', {});
  
  add.method('newAutoScalingMorph', function (shape, shouldAutoOrganize) {
    return avocado.ui.newMorph(shape).useAutoScalingLayout(shouldAutoOrganize);
  });

});


thisModule.addSlots(avocado.autoScaling.layout, function(add) {
  
  add.method('initialize', function (morph, shouldAutoOrganize) {
    this._morph = morph;
    this._shouldAutoOrganize = shouldAutoOrganize;
  });
  
  add.method('applyStyle', function (spec) {
  });
  
  add.method('isAffectedBy', function (operation, morph) {
    return false;
  });

  add.method('justChangedContent', function (evt) {
    if (this._shouldAutoOrganize) {
      // aaa - Not sure this is what we want in the long run - it might be better to just add the new content in an empty area
      this.cleanUp();
    }
  }, {category: ['updating']});

  add.method('replaceContentWith', function (newContentMorphs) {
    this.removeMorphsNotIncludedIn(newContentMorphs);
    this.invalidateLayoutIfIDoNotContainMorphsIncludedIn(newContentMorphs);
    this.refreshLayoutIfNecessary(newContentMorphs);
  });
  
  add.method('removeMorphsNotIncludedIn', function (contentMorphs) {
    // aaa - find a more efficient way to do this
    this._morph.eachSubmorph(function(m) {
      if (! contentMorphs.include(m)) {
        this._morph.removeMorph(m);
        this.invalidateLayout();
      }
    }.bind(this));
  });

  add.method('invalidateLayoutIfIDoNotContainMorphsIncludedIn', function (contentMorphs) {
    if (! this._hasAlreadyBeenLaidOutAtLeastOnce) { return; } // already invalidated, no point in checking
    
    // aaa - find a more efficient way to do this
    contentMorphs.forEach(function(m) {
      if (m.getOwner() !== this._morph) {
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
  
  add.method('cleanUp', function (contentMorphsOrNull) {
    var contentMorphs = contentMorphsOrNull || this._morph.recalculateActualContent() || this._morph.submorphs;
    this._hasAlreadyBeenLaidOutAtLeastOnce = true;
    var pose = this._morph.poseManager().cleaningUpPose(contentMorphs).beUnobtrusive().beSquarish().whenDoneScaleToFitWithinCurrentSpace();
    if (avocado.ui.is3D) { pose._extraZHack = 1000; } // aaa HACK, what's the right way to make the contents pop out?
    this._morph.poseManager().assumePose(pose);
  }, {category: ['organizing']});
  
  add.method('aboutToReceiveDrop', function (m) {
    var tfm = m.transformForNewOwner(this._morph);
		m.scaleBy(1 / tfm.getScale());
  }, {category: ['drag and drop']});
  
  add.method('justReceivedDrop', function (m) {
    if (this._shouldAutoOrganize) {
      this.cleanUp();
    }
  }, {category: ['drag and drop']});
  
  add.method('possiblyDoSomethingBecauseASubmorphMinimumExtentHasChanged', function () {
    this.invalidateLayout();
    // aaa Can't just do the refreshLayoutIfNecessary() right now because the submorph's *actual* size
    // hasn't changed yet. But ideally I guess we would have the cleanUp pose account for minimum size
    // rather than actual size.
    setTimeout(this.refreshLayoutIfNecessary.bind(this), 0);
    return false;
  }, {category: ['layout']});
  
});


thisModule.addSlots(avocado.morphMixins.Morph, function(add) {
  
  add.method('useAutoScalingLayout', function (shouldAutoOrganize) {
    this.doIWantToLeaveAPlaceholderWhenRemoving = function (m) {
      // aaa - probably need to actually determine whether the submorph is part of
      // this morph's potential content (rather than just some transient thing)
      return true;
    };
    
    this.setLayout(Object.newChildOf(avocado.autoScaling.layout, this, shouldAutoOrganize));
    return this;
  }, {category: ['layout']});
  
});


});
