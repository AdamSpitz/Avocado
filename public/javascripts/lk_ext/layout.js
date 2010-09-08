// aaa - does LK already have a mechanism for this?
// aaa - Hey, look at that LayoutManager thing.

LayoutModes = {
 Rigid: {name: "rigid"},
 SpaceFill: {name: "space-fill"},
 ShrinkWrap: {name: "shrink-wrap"}
};


// aaa rename some of these methods
Morph.addMethods({
  minimumExtent: function() {
    // aaa - meh, don't bother caching yet, I'm scared that I haven't done this right
    var e = this.getExtent();
    this._cachedMinimumExtent = e;
    return e;
  },

  rejiggerTheLayout: function(availableSpace) {
    var oldExtent = this.getExtent();
    var newExtent = oldExtent;

    /* I think we want to do something sorta like this, in order to make it possible for any morph to be space-filling.
       But when I did this, bad stuff happened. (Try uncommenting this code and then using a mirror morph's "add attribute"
       menu item.)
    */

    // Avoid infinite recursion... blecch.
    /*
    if (this._isChangingRightNow) {return;}
    this._isChangingRightNow = true;

    console.log("rejiggering the layout of a " + this.constructor.type);
    
    if (this.horizontalLayoutMode === LayoutModes.SpaceFill) { newExtent = newExtent.withX(availableSpace.x); }
    if (this.  verticalLayoutMode === LayoutModes.SpaceFill) { newExtent = newExtent.withY(availableSpace.y); }
    if (! oldExtent.eqPt(newExtent)) { this.setExtent(newExtent); }

    delete this._isChangingRightNow;
    */

    return newExtent;
  },

  hasMinimumExtentActuallyChanged: function() {
    var old_cachedMinimumExtent = this._cachedMinimumExtent;
    this._cachedMinimumExtent = null;
    var newMinimumExtent = this.minimumExtent();
    return ! (old_cachedMinimumExtent && old_cachedMinimumExtent.eqPt(newMinimumExtent));
  },

  minimumExtentMayHaveChanged: function() {
    if (! this.hasMinimumExtentActuallyChanged()) { return false; }
    this.forceLayoutRejiggering(true);
    return true;
  },

  forceLayoutRejiggering: function(isMinimumExtentKnownToHaveChanged) {
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
  },

  beSpaceFilling: function() {
    this.horizontalLayoutMode = LayoutModes.SpaceFill;
    this.  verticalLayoutMode = LayoutModes.SpaceFill;
    return this;
  }
});

TextMorph.addMethods({
  layoutChanged: function($super) {
    var r = $super();
    this.adjustForNewBounds();          // make the focus halo look right
    this.minimumExtentMayHaveChanged(); // play nicely with my new layout system
    return r;
  }
});
