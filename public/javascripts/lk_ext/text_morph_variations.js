TextMorph.subclass("TextMorphRequiringExplicitAcceptance", {
  initialize: function($super, getFunction, setFunction) {
    $super();
    this.dontNotifyUntilTheActualModelChanges = true;
    this.connectModel({model: this, getText: "getSavedText", setText: "setSavedText"});
    this.acceptInput = true;
    this.setFill(this.backgroundColorWhenWritable || null);
    this.closeDnD();
    this.setWrapStyle(lively.Text.WrapStyle.Shrink);
    this.changed();
    this.beUngrabbable();
    this.setSavedText(this.textString); // aaa - what is this for?
    this.justAcceptedOrCancelled();
    if (getFunction) { this.getSavedText = getFunction; }
    if (setFunction) { this.setSavedText = setFunction; }
    this.refreshText();
  },

  defaultBounds: pt(5, 10).extent(pt(140, 20)),

  getSavedText: function( )  {
    return this.savedTextString;
  },

  setSavedText: function(t)  {
    this.savedTextString = t;
    if (this.notifier) {this.notifier.notifyAllObservers();}
  },

  setTextString: function($super, replacement, delayComposition, justMoreTyping) {
    var x = $super(replacement, delayComposition, justMoreTyping);
    this.updateLayoutIfNecessary();
    return x;
  },

  updateLayoutIfNecessary: function() {
    this.adjustForNewBounds(); // makes the focus halo look right   // aaa should probably be outside the conditional, or even in the Core code
    this.minimumExtentMayHaveChanged();
  },

  checkForAcceptOrCancel: function(evt) {
    if (this.hasChangedFromSavedText() && evt.getKeyCode() == Event.KEY_ESC) {
      this.cancelChanges();
      evt.stop();
      return true;
    }

    if (this.hasChangedFromSavedText() && evt.getKeyCode() == Event.KEY_RETURN && (this.returnKeyShouldAccept() || evt.isMetaDown() || evt.isAltDown() || evt.isCtrlDown())) {
      this.acceptChanges();
      evt.stop();
      return true;
    }
    
    return false;
  },

  onKeyDown: function($super, evt) {
    if (this.checkForAcceptOrCancel(evt)) { return true; }
    return $super(evt);
  },

  onKeyPress: function($super, evt) {
    if (this.checkForAcceptOrCancel(evt)) { return true; }
    return $super(evt);
  },

  hasChangedFromSavedText: function() {
    return this._hasChangedFromSavedText;
  },

  normalBorderWidth:       1,
  borderWidthWhenModified: 2,

  changed: function($super) {
    // Avoid infinite recursion when setting the border stuff.
    if (this._isChangingRightNow) {return;}
    this._isChangingRightNow = true;

    var hasChanged = this._hasChangedFromSavedText = this.getText() !== this.getSavedText();
    if (! hasChanged) {
      this.setBorderColor(Color.black);
      this.setBorderWidth(this.normalBorderWidth);
    } else {
      this.setBorderColor(Color.red);
      this.setBorderWidth(this.borderWidthWhenModified);
    }
    this.minimumExtentMayHaveChanged();
    delete this._isChangingRightNow;
    $super();
  },

  refreshText: function() {
    if (this.hasChangedFromSavedText()) {
      // Don't wanna lose the stuff that we've typed.
      this.changed();
    } else {
      var newText = this.getSavedText();
      if (newText !== this.getText()) {
        this.setText(newText);
        this.changed();
      }
    }
  },

  justAcceptedOrCancelled: function() {
    this.changed();
    this.updateLayoutIfNecessary();
  },

  acceptChanges: function() {
    var newText = this.getText();
    if (newText !== this.getSavedText()) {
      this.setSavedText(newText);
    }
    this.justAcceptedOrCancelled();
  },

  cancelChanges: function() {
    this.setText(this.getSavedText());
    this.justAcceptedOrCancelled();
  },

  handlesMouseDown: function(evt) { return true; },

  returnKeyShouldAccept: function() { return false; },

  morphMenu: function(evt) {
    var menu = new MenuMorph([], this);
    this.addMenuItemsTo(menu, evt);
    return menu;
  },

  addMenuItemsTo: function(menu, evt) {
    this.addEditingMenuItemsTo(menu, evt);
    this.addOtherMenuItemsTo(menu, evt);
  },

  addEditingMenuItemsTo: function(menu, evt) {
    if (this.hasChangedFromSavedText()) {
      menu.addSection([["accept    [alt+enter]", this.acceptChanges.bind(this)],
                       ["cancel    [escape]"   , this.cancelChanges.bind(this)]]);
    }
  },

  addOtherMenuItemsTo: function(menu, evt) {
    // override in children
  }
});

TextMorphRequiringExplicitAcceptance.subclass("TwoModeTextMorph", {
  hasChangedFromSavedText: function() {
    return this.isInWritableMode;
  },

  beUnwritable: function() {
    this.acceptInput = false;
    this.setFill(this.backgroundColorWhenUnwritable || null);
    this.setWrapStyle(lively.Text.WrapStyle.Shrink);
    this.setNullSelectionAt(0);
    var w = this.world();
    if (w) {this.relinquishKeyboardFocus(w.firstHand());}
    this.changed();
    this.beUngrabbable();
    this.mouseHandler = this.oldMouseHandler;
    delete this.oldMouseHandler;
    this.isInWritableMode = false;
    return this;
  },

  beWritable: function() {
    this.acceptInput = true;
    this.setFill(this.backgroundColorWhenWritable || null);
    this.setWrapStyle(lively.Text.WrapStyle.Shrink);
    this.changed();
    this.beUngrabbable();
    this.oldMouseHandler = this.mouseHandler;
    this.enableEvents();
    this.isInWritableMode = true;
    return this;
  },

  switchEditModeOn:  function() { this.beWritable(); },
  switchEditModeOff: function() { this.beUnwritable(); },

  normalBorderWidth: 0,

  justAcceptedOrCancelled: function() {
    this.beUnwritable();
    this.updateLayoutIfNecessary();
  },

  beWritableAndSelectAll: function(evt) {
    this.beWritable();
    this.requestKeyboardFocus(evt ? evt.hand : WorldMorph.current().firstHand());
    this.doSelectAll();
  },

  onMouseDown: function($super, evt) {
    if (! this.isInWritableMode) {
      return this.checkForDoubleClick(evt);
    }
    return $super(evt);
  },

  canBecomeWritable: function() { return ! this.isReadOnly; },

  returnKeyShouldAccept: function() { return true; },

  onDoubleClick: function(evt) {
    if (this.canBecomeWritable()) {
      this.beWritable();
      this.onMouseDown(evt);
    }
  },
  
  nameOfEditCommand: 'edit',

  addEditingMenuItemsTo: function($super, menu, evt) {
    if (!this.isInWritableMode && this.canBecomeWritable()) {
      menu.addSection([[this.nameOfEditCommand, function() {this.beWritableAndSelectAll(evt);}.bind(this)]]);
    }
    $super(menu, evt);
  }
});
