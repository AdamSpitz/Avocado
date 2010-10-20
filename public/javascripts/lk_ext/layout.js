transporter.module.create('lk_ext/layout', function(requires) {}, function(thisModule) {


thisModule.addSlots(window, function(add) {

  add.creator('LayoutModes', {}, {category: ['avocado', 'lively kernel extensions']}, {comment: 'Does LK already have a mechanism for this? Look at that LayoutManager thing.'});

});


thisModule.addSlots(LayoutModes, function(add) {

  add.creator('Rigid', {});
  add.creator('SpaceFill', {});
  add.creator('ShrinkWrap', {});
  
});

thisModule.addSlots(LayoutModes.Rigid, function(add) {
  
  add.data('name', 'rigid');
  
});

thisModule.addSlots(LayoutModes.SpaceFill, function(add) {
  
  add.data('name', 'space-fill');
  
});

thisModule.addSlots(LayoutModes.ShrinkWrap, function(add) {
  
  add.data('name', 'shrink-wrap');
  
});


thisModule.addSlots(Morph.prototype, function(add) {

  add.method('minimumExtent', function() {
    // aaa - meh, don't bother caching yet, I'm scared that I haven't done this right
    var e = this.getExtent();
    this._cachedMinimumExtent = e;
    return e;
  }, {category: ['layout']});

  add.method('rejiggerTheLayout', function(availableSpace) {
    var oldExtent = this.getExtent();
    var newExtent = oldExtent;

    /* I think we want to do something sorta like this, in order to make it possible for any morph to be space-filling.
       But when I did this, bad stuff happened. (Try uncommenting this code and then using a mirror morph's "add attribute"
       menu item.)
    */

    // Avoid infinite recursion... blecch.
    if (this._isChangingRightNow) {return newExtent;}
    this._isChangingRightNow = true;

    //console.log("rejiggering the layout of a " + this.constructor.type);
    
    if (this.horizontalLayoutMode === LayoutModes.SpaceFill) { newExtent = newExtent.withX(availableSpace.x); }
    if (this.  verticalLayoutMode === LayoutModes.SpaceFill) { newExtent = newExtent.withY(availableSpace.y); }
    if (! oldExtent.eqPt(newExtent)) { this.setExtent(newExtent); }

    delete this._isChangingRightNow;

    return newExtent;
  }, {category: ['layout']});

  add.method('hasMinimumExtentActuallyChanged', function() {
    var old_cachedMinimumExtent = this._cachedMinimumExtent;
    this._cachedMinimumExtent = null;
    var newMinimumExtent = this.minimumExtent();
    return ! (old_cachedMinimumExtent && old_cachedMinimumExtent.eqPt(newMinimumExtent));
  }, {category: ['layout']});

  add.method('minimumExtentMayHaveChanged', function() {
    if (! this.hasMinimumExtentActuallyChanged()) { return false; }
    this.forceLayoutRejiggering(true);
    return true;
  }, {category: ['layout']});

  add.method('forceLayoutRejiggering', function(isMinimumExtentKnownToHaveChanged) {
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
      this.rejiggerTheLayout(this._spaceUsedLastTime);
    } else {
      o.forceLayoutRejiggering();
    }
  }, {category: ['layout']});

  add.method('beSpaceFilling', function() {
    this.horizontalLayoutMode = LayoutModes.SpaceFill;
    this.  verticalLayoutMode = LayoutModes.SpaceFill;
    return this;
  }, {category: ['layout']});
  
  add.method('setLayoutModes', function(layoutModes) {
    ["horizontalLayoutMode", "verticalLayoutMode"].forEach(function(n) {
      if (layoutModes[n]) { this[n] = layoutModes[n]; }
    }.bind(this));
    return this;
  }, {category: ['layout']});

});


thisModule.addSlots(TextMorph.prototype, function(add) {

  add.method('layoutChanged', function($super) {
    var r = $super();
    this.adjustForNewBounds();          // make the focus halo look right
    this.minimumExtentMayHaveChanged(); // play nicely with my new layout system
    return r;
  });

});


});
