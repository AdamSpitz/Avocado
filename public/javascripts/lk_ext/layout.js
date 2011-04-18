transporter.module.create('lk_ext/layout', function(requires) {

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


thisModule.addSlots(Morph.prototype, function(add) {

  add.method('minimumExtent', function () {
    // aaa - meh, don't bother caching yet, I'm scared that I haven't done this right
    var e = this.getExtent();
    this._cachedMinimumExtent = e;
    return e.scaleBy(this.getScale());
  }, {category: ['layout']});

  add.method('rejiggerTheLayout', function (availableSpace) {
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

  add.method('forceLayoutRejiggering', function (isMinimumExtentKnownToHaveChanged) {
    this._layoutIsStillValid = false;

    var doesMyOwnerNeedToKnow = isMinimumExtentKnownToHaveChanged || this.hasMinimumExtentActuallyChanged();
    var o = this.owner;
    if (!o || o instanceof WorldMorph || o instanceof HandMorph) {
      this.rejiggerTheLayout(pt(100000, 100000));
      return;
    }
    if (doesMyOwnerNeedToKnow) { 
      var layoutRejiggeringHasBeenTriggeredHigherUp = o.minimumExtentMayHaveChanged();
      if (layoutRejiggeringHasBeenTriggeredHigherUp) { return; }
    }
    if (this._spaceUsedLastTime) {
      var scaledSpaceToUse = this._spaceUsedLastTime.scaleBy(this.getScale());
      this.rejiggerTheLayout(scaledSpaceToUse);
    } else {
      o.forceLayoutRejiggering();
    }
  }, {category: ['layout']});

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


thisModule.addSlots(TextMorph.prototype, function(add) {

  add.method('layoutChanged', function ($super) {
    var r = $super();
    this.adjustForNewBounds();          // make the focus halo look right
    this.minimumExtentMayHaveChanged(); // play nicely with my new layout system
    return r;
  });

});


});
