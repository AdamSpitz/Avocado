TextMorph.subclass("TextMorphRequiringExplicitAcceptance", {
  initialize: function($super, accessors) {
    $super();
    this.dontNotifyUntilTheActualModelChanges = true;
    this.connectModel({model: this, getText: "getSavedText", setText: "setSavedText"});
    this.acceptInput = true;
    this.setFill(this.backgroundColorWhenWritable || null),
    this.changed();
    this.setSavedText(this.textString); // aaa - what is this for?
    this.justAcceptedOrCancelled();
    if (accessors) { this._accessors = accessors; }
    this.refreshText();
  },

  defaultBounds: pt(5, 10).extent(pt(140, 20)),
  
  openForDragAndDrop: false,
  
  suppressGrabbing: true,
  
  wrap: lively.Text.WrapStyle.Shrink,

  getSavedText: function( )  {
    if (this._accessors) {
      return this._accessors.get();
    } else {
      return this.savedTextString;
    }
  },

  setSavedText: function(t)  {
    if (this._accessors) {
      this._accessors.set(t);
    } else {
      this.savedTextString = t;
      if (this.notifier) {this.notifier.notifyAllObservers();}
    }
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

  beWritableAndSelectAll: function(evt) {
    this.beWritable();
    this.requestKeyboardFocus(evt ? evt.hand : WorldMorph.current().firstHand());
    this.doSelectAll();
  },
  
  wasJustShown: function(evt) {
    this.beWritableAndSelectAll(evt);
  },
  
  beWritable: function() {
    // nothing to do here, but children can override
  },

  hasChangedFromSavedText: function() {
    return this._hasChangedFromSavedText;
  },

  normalStyle: TextMorph.prototype.style,
  
  modifiedStyle: {
    borderWidth: 2,
    borderColor: Color.red
  },

  changed: function($super) {
    // Avoid infinite recursion when setting the border stuff.
    if (this._isChangingRightNow) {return;}
    this._isChangingRightNow = true;

    var currentText = this.getText();
    var savedText = this.getSavedText();
    var hasChanged = this._hasChangedFromSavedText = (currentText !== savedText);
    this.applyStyle(hasChanged ? this.modifiedStyle : this.normalStyle);
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
        //this.setWrapStyle(lively.Text.WrapStyle.Shrink); /// aaa experimenting with word-wrapping
        
        this.setText(newText);
        this.changed();
        
        // aaa experiment with word-wrapping
        /*
        var extent = this.getExtent();
        if (extent.x > 600) {
          this.setExtent(extent.withX(600));
          this.setWrapStyle(lively.Text.WrapStyle.Normal);
        } 
        */
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
    this.editingCommands().addItemsToMenu(menu, this);
    return menu;
  },

  editingCommands: function() {
    var cmdList = avocado.command.list.create(this);
    if (this.hasChangedFromSavedText()) {
      cmdList.addItem(["accept    [alt+enter]", this.acceptChanges]);
      cmdList.addItem(["cancel    [escape]"   , this.cancelChanges]);
    }
    return cmdList;
  }
});

TextMorphRequiringExplicitAcceptance.subclass("TwoModeTextMorph", {
  hasChangedFromSavedText: function() {
    return this.isInWritableMode;
  },

  beUnwritable: function() {
    this.acceptInput = false;
    this.setFill(this.backgroundColorWhenUnwritable || null);
    this.setNullSelectionAt(0);
    var w = this.world();
    if (w) {this.relinquishKeyboardFocus(w.firstHand());}
    this.changed();
    this.mouseHandler = this.oldMouseHandler;
    delete this.oldMouseHandler;
    this.isInWritableMode = false;
    return this;
  },

  beWritable: function() {
    this.acceptInput = true;
    this.setFill(this.backgroundColorWhenWritable || null);
    this.changed();
    this.oldMouseHandler = this.mouseHandler;
    this.enableEvents();
    this.isInWritableMode = true;
    return this;
  },

  switchEditModeOn:  function() { this.beWritable(); },
  switchEditModeOff: function() { this.beUnwritable(); },

  normalStyle: Object.extend(Object.create(TextMorph.prototype.style), {borderWidth: 0}),

  justAcceptedOrCancelled: function() {
    this.beUnwritable();
    this.updateLayoutIfNecessary();
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
  
  setNameOfEditCommand: function(n) {
    this.nameOfEditCommand = n;
    return this;
  },

  editingCommands: function($super) {
    var cmdList = $super();
    if (!this.isInWritableMode && this.canBecomeWritable()) {
      cmdList.addItem(avocado.command.create(this.nameOfEditCommand, function(evt) {this.beWritableAndSelectAll(evt);}, this));
    }
    return cmdList;
  }
});

TextMorph.prototype.style. borderColor = new Color(0.6, 0.6, 0.6);
