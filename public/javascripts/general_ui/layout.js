avocado.transporter.module.create('general_ui/layout', function(requires) {

requires('general_ui/basic_morph_mixins');

}, function(thisModule) {

thisModule.addSlots(avocado, function(add) {

  add.creator('LayoutModes', {}, {category: ['avocado', 'lively kernel extensions']}, {comment: 'Does LK already have a mechanism for this? Look at that LayoutManager thing.'});

});


thisModule.addSlots(avocado.LayoutModes, function(add) {

  add.creator('Rigid', {});

  add.creator('SpaceFill', {});

  add.creator('ShrinkWrap', {});

});


thisModule.addSlots(avocado.LayoutModes.Rigid, function(add) {

  add.data('name', 'rigid');

});


thisModule.addSlots(avocado.LayoutModes.SpaceFill, function(add) {

  add.data('name', 'space-fill');

});


thisModule.addSlots(avocado.LayoutModes.ShrinkWrap, function(add) {

  add.data('name', 'shrink-wrap');

});


thisModule.addSlots(avocado.morphMixins.Morph, function(add) {

  add.method('minimumExtent', function () {
    if (this._layout && this._layout.minimumExtent) {
      return this._layout.minimumExtent();      
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
      if (! oldExtent.eqPt(newExtent)) { this.setExtent(newExtent); }

      delete this._isChangingRightNow;
    }
    return newExtent.scaleBy(this.getScale());
  }, {category: ['layout']});
  
  add.method('rejiggerTheLayout', function (availableSpace) {
    if (this._layout && this._layout.rejigger) {
      return this._layout.rejigger(availableSpace);
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

    if (this._layout && this._layout.isMinimumExtentDependentOnMinimumExtentOfSubmorphs()) {
      return this.minimumExtentMayHaveChanged();
    }
    
    return false;
  }, {category: ['layout']});

  add.method('forceLayoutRejiggering', function (isMinimumExtentKnownToHaveChanged) {
    this._layoutIsStillValid = false;

    var doesMyOwnerNeedToKnow = isMinimumExtentKnownToHaveChanged || this.hasMinimumExtentActuallyChanged();
    var o = this.owner;
    if (!o || o instanceof WorldMorph || o instanceof HandMorph) {
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

  add.method('setLayoutModes', function (layoutModes) {
    ["horizontalLayoutMode", "verticalLayoutMode"].forEach(function(n) {
      if (layoutModes[n]) { this[n] = layoutModes[n]; }
    }.bind(this));
    return this;
  }, {category: ['layout']});

});


});
