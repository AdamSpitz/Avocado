avocado.transporter.module.create('general_ui/layout', function(requires) {

requires('general_ui/basic_morph_mixins');

}, function(thisModule) {


thisModule.addSlots(avocado, function(add) {

  add.creator('LayoutModes', {}, {category: ['avocado', 'user interface']});

});


thisModule.addSlots(avocado.morphMixins.Morph, function(add) {

  add.method('minimumExtent', function () {
    if (this._layout && this._layout.minimumExtent) {
      return this._layout.minimumExtent(this);
    } else {
      // aaa - meh, don't bother caching yet, I'm scared that I haven't done this right
      var e = this.getExtent();
      this._cachedMinimumExtent = e;
      return e.scaleBy(this.getScale());
    }
  }, {category: ['layout']});

  add.method('rejiggerTheLayoutOfMySubmorphs', function () {
    this.eachSubmorph(function(m) {
      m.rejiggerTheLayout(m.getExtent().scaleBy(m.getScale()));
    });
  }, {category: ['layout']});

  add.method('rejiggerJustMyLayout', function (availableSpace) {
    // can be overridden by morphs that want to do special layout stuff, like TableMorph
    
    var availableSpaceToUse = availableSpace.scaleBy(1 / this.getScale());
    
    var oldExtent = this.getExtent();
    var newExtent = oldExtent;

    // Avoid infinite recursion... blecch.
    if (! this._isChangingRightNow) {
      this._isChangingRightNow = true;

      if (this.horizontalLayoutMode === avocado.LayoutModes.SpaceFill) { newExtent = newExtent.withX(availableSpaceToUse.x); }
      if (this.  verticalLayoutMode === avocado.LayoutModes.SpaceFill) { newExtent = newExtent.withY(availableSpaceToUse.y); }
      
      // aaa - not sure this is right, but I want it for HTML morphs
      var minExtent = this._cachedMinimumExtent;
      if (minExtent && this.horizontalLayoutMode === avocado.LayoutModes.ShrinkWrap) { newExtent = newExtent.withX(minExtent.x); }
      if (minExtent && this.  verticalLayoutMode === avocado.LayoutModes.ShrinkWrap) { newExtent = newExtent.withY(minExtent.y); }
      
      if (! oldExtent.eqPt(newExtent)) { this.setExtent(newExtent); }

      delete this._isChangingRightNow;
    }
    return newExtent.scaleBy(this.getScale());
  }, {category: ['layout']});

  add.method('rejiggerTheLayout', function (availableSpace) {
    if (this._layout && this._layout.rejigger) {
      return this._layout.rejigger(this, availableSpace);
    } else {
      this.rejiggerTheLayoutOfMySubmorphs();
      return this.rejiggerJustMyLayout(availableSpace);
    }
  }, {category: ['layout']});

  add.method('hasMinimumExtentActuallyChanged', function () {
    var old_cachedMinimumExtent = this._cachedMinimumExtent;
    this._cachedMinimumExtent = null;
    this.minimumExtent();
    var newMinimumExtent = this._cachedMinimumExtent;
    return ! (old_cachedMinimumExtent && old_cachedMinimumExtent.eqPt(newMinimumExtent));
  }, {category: ['layout']});

  add.method('minimumExtentMayHaveChanged', function () {
    if (! this.hasMinimumExtentActuallyChanged()) { return false; }
    this.forceLayoutRejiggering(true);
    return true;
  }, {category: ['layout']});

  add.method('possiblyDoSomethingBecauseASubmorphMinimumExtentHasChanged', function () {
    // can be overridden by morphs that want to trigger a higher-level rejiggering;
    // return true to tell the caller not to bother with the lower-level rejiggering

    if (this._layout && this._layout.possiblyDoSomethingBecauseASubmorphMinimumExtentHasChanged) {
      return this._layout.possiblyDoSomethingBecauseASubmorphMinimumExtentHasChanged(this);
    }
    
    return false;
  }, {category: ['layout']});

  add.method('layoutRejiggeringBatcherUpper', function () {
    if (! this._layoutRejiggeringBatcherUpper) {
      this._layoutRejiggeringBatcherUpper = avocado.batcherUpper.create(this, function() {
        this._context.forceLayoutRejiggering(this._isMinimumExtentKnownToHaveChangedWhileBatching);
      }, function(isMinimumExtentKnownToHaveChanged) {
        if (isMinimumExtentKnownToHaveChanged) { this._isMinimumExtentKnownToHaveChangedWhileBatching = true; }
      }, function() {
        delete this._isMinimumExtentKnownToHaveChangedWhileBatching;
      });
    }
    return this._layoutRejiggeringBatcherUpper;
  }, {category: ['layout']});

  add.method('forceLayoutRejiggering', function (isMinimumExtentKnownToHaveChanged) {
    if (this._layoutRejiggeringBatcherUpper && this._layoutRejiggeringBatcherUpper.isRunning()) {
      this._layoutRejiggeringBatcherUpper.batchUp(isMinimumExtentKnownToHaveChanged);
      return;
    }

    this._layoutIsStillValid = false;

    var doesMyOwnerNeedToKnow = isMinimumExtentKnownToHaveChanged || this.hasMinimumExtentActuallyChanged();
    var o = this.getOwner();
    if (!o || o.isWorld || o.isHand) {
      this.rejiggerTheLayout(pt(100000, 100000));
      return;
    }
    if (doesMyOwnerNeedToKnow) { 
      var layoutRejiggeringHasBeenTriggeredHigherUp = o.possiblyDoSomethingBecauseASubmorphMinimumExtentHasChanged();
      if (layoutRejiggeringHasBeenTriggeredHigherUp) { return; }
    }
    if (this._spaceUsedLastTime) {
      var scaledSpaceToUse = this._spaceUsedLastTime.scaleBy(this.getScale());
      this.rejiggerTheLayout(scaledSpaceToUse);
    } else {
      o.forceLayoutRejiggering();
    }
  }, {category: ['layout']});

  add.method('forceLayoutRejiggeringIfNecessaryAfter', function (operation, m) {
    if (this._layout) {
      if (this._layout.isAffectedBy(operation, m)) {
        this.forceLayoutRejiggering();
      }
    }
  }, {category: ['layout']});

  add.method('layout', function () {
    return this._layout;
  }, {category: ['layout']});

  add.method('setLayout', function (layout) {
    this._layout = layout;
    if (this._debugMode) { layout._debugMode = true; }
    if (layout.initializeLayoutOf) { layout.initializeLayoutOf(this); }
    return this;
  }, {category: ['layout']});

  add.method('submorphsParticipatingInLayout', function () {
    var layout = this._layout;
    return this.submorphEnumerator().select(function(m) { return !layout || layout.isAffectedBy(null, m); });
  }, {category: ['iterating']});

  add.method('addMorphs', function (morphsToAdd, shouldNotForceLayoutRejiggering) {
    var thisMorph = this;
    morphsToAdd.forEach(function(m) { thisMorph.addMorph(m, true); });
    if (! shouldNotForceLayoutRejiggering) { this.forceLayoutRejiggering(); }
  }, {category: ['adding and removing']});

  add.method('removeMorphs', function (morphsToRemove, shouldNotForceLayoutRejiggering) {
    var thisMorph = this;
    morphsToRemove.toArray().forEach(function(m) { thisMorph.removeMorph(m, true); });
    if (! shouldNotForceLayoutRejiggering) { this.forceLayoutRejiggering(); }
  }, {category: ['adding and removing']});

  add.method('replaceMorphs', function (morphsToRemove, morphsToAdd, shouldNotForceLayoutRejiggering) {
    this.removeMorphs(morphsToRemove, true);
    this.addMorphs(morphsToAdd, true);
    if (! shouldNotForceLayoutRejiggering) { this.forceLayoutRejiggering(); }
  }, {category: ['adding and removing']});

  add.method('beSpaceFilling', function () {
    this.horizontalLayoutMode = avocado.LayoutModes.SpaceFill;
    this.  verticalLayoutMode = avocado.LayoutModes.SpaceFill;
    return this;
  }, {category: ['layout']});

  add.method('beShrinkWrapping', function () {
    this.horizontalLayoutMode = avocado.LayoutModes.ShrinkWrap;
    this.  verticalLayoutMode = avocado.LayoutModes.ShrinkWrap;
    return this;
  }, {category: ['layout']});

  add.method('beRigid', function () {
    this.horizontalLayoutMode = avocado.LayoutModes.Rigid;
    this.  verticalLayoutMode = avocado.LayoutModes.Rigid;
    return this;
  }, {category: ['layout']});

  add.method('layoutModes', function () {
    // aaa make the morph itself store them as a Point?
    return pt(this.horizontalLayoutMode, this.verticalLayoutMode);
  }, {category: ['layout']});

  add.method('setLayoutModes', function (layoutModes) {
    if (layoutModes.horizontalLayoutMode) { this.horizontalLayoutMode = layoutModes.horizontalLayoutMode; }
    if (layoutModes.  verticalLayoutMode) { this.  verticalLayoutMode = layoutModes.  verticalLayoutMode; }
    
    // This just seems cleaner. Maybe get rid of the old big wordy way.
    if (layoutModes.x)                    { this.horizontalLayoutMode = layoutModes.x;                    }
    if (layoutModes.y)                    { this.  verticalLayoutMode = layoutModes.y;                    }
    
    if (this._layout && this._layout.justSetLayoutModes) { this._layout.justSetLayoutModes(this); }
    return this;
  }, {category: ['layout']});

});


thisModule.addSlots(avocado.LayoutModes, function(add) {

  add.creator('Abstract', {});

});


thisModule.addSlots(avocado.LayoutModes.Abstract, function(add) {

  add.method('toString', function () {
    return this.name;
  });

});


thisModule.addSlots(avocado.LayoutModes, function(add) {

  add.creator('Rigid', Object.create(avocado.LayoutModes.Abstract));

});


thisModule.addSlots(avocado.LayoutModes.Rigid, function(add) {

  add.data('name', 'rigid');

});


thisModule.addSlots(avocado.LayoutModes, function(add) {

  add.creator('SpaceFill', Object.create(avocado.LayoutModes.Abstract));

});


thisModule.addSlots(avocado.LayoutModes.SpaceFill, function(add) {

  add.data('name', 'space-fill');

});


thisModule.addSlots(avocado.LayoutModes, function(add) {

  add.creator('ShrinkWrap', Object.create(avocado.LayoutModes.Abstract));

});


thisModule.addSlots(avocado.LayoutModes.ShrinkWrap, function(add) {

  add.data('name', 'shrink-wrap');

});


});
