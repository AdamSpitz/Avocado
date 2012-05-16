avocado.transporter.module.create('lk_ext/text_morph_variations', function(requires) {

}, function(thisModule) {


thisModule.addSlots(avocado, function(add) {

  add.method('TextMorphRequiringExplicitAcceptance', function TextMorphRequiringExplicitAcceptance() { Class.initializer.apply(this, arguments); }, {category: ['ui']});

  add.method('TwoModeTextMorph', function TwoModeTextMorph() { Class.initializer.apply(this, arguments); }, {category: ['ui']});

});


thisModule.addSlots(avocado.TextMorphRequiringExplicitAcceptance, function(add) {

  add.data('displayName', 'TextMorphRequiringExplicitAcceptance');

  add.data('superclass', TextMorph);

  add.data('type', 'avocado.TextMorphRequiringExplicitAcceptance');

  add.creator('prototype', Object.create(TextMorph.prototype));

});


thisModule.addSlots(avocado.TextMorphRequiringExplicitAcceptance.prototype, function(add) {

  add.data('constructor', avocado.TextMorphRequiringExplicitAcceptance);

  add.method('initialize', function ($super, accessors) {
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
  });

  add.data('defaultBounds', new Rectangle(5, 10, 140, 20));

  add.data('openForDragAndDrop', false);

  add.data('suppressGrabbing', true);

  add.data('wrap', 'Shrink');

  add.method('getSavedText', function () {
    if (this._accessors) {
      return this._accessors.get();
    } else {
      return this.savedTextString;
    }
  });

  add.method('setSavedText', function (t) {
    if (this._accessors) {
      this._accessors.set(t);

      if (this._savedTextMightNotBeIdenticalToWhatWasTyped) {
        this.cancelChanges(); // to make sure the editor doesn't stay red
      }
    } else {
      this.savedTextString = t;
      if (this._notifier) {this._notifier.notifyAllObservers();} // aaa is this even used?
    }
  });

  add.method('setTextString', function ($super, replacement, delayComposition, justMoreTyping) {
    var x = $super(replacement, delayComposition, justMoreTyping);
    this.updateLayoutIfNecessary();
    return x;
  });

  add.method('rememberThatSavedTextMightNotBeIdenticalToWhatWasTyped', function () {
    this._savedTextMightNotBeIdenticalToWhatWasTyped = true;
    return this;
  });

  add.method('updateLayoutIfNecessary', function () {
    this.adjustForNewBounds(); // makes the focus halo look right   // aaa should probably be outside the conditional, or even in the Core code
    this.minimumExtentMayHaveChanged();
  });

  add.method('checkForAcceptOrCancel', function (evt) {
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
  });

  add.method('onKeyDown', function ($super, evt) {
    if (this.checkForAcceptOrCancel(evt)) { return true; }
    return $super(evt);
  });

  add.method('onKeyPress', function ($super, evt) {
    if (this.checkForAcceptOrCancel(evt)) { return true; }
    return $super(evt);
  });

  add.method('beWritableAndSelectAll', function (evt) {
    this.beWritable();
    this.requestKeyboardFocus(evt ? evt.hand : WorldMorph.current().firstHand());
    this.doSelectAll();
  });

  add.method('wasJustAdded', function (evt) {
    this.prepareForUserInput(evt);
  });

  add.method('prepareForUserInput', function (evt) {
    this.beWritableAndSelectAll(evt);
  });

  add.method('beWritable', function () {
    // nothing to do here, but children can override;
  });

  add.method('hasChangedFromSavedText', function () {
    return this._hasChangedFromSavedText;
  });

  add.data('normalStyle', TextMorph.prototype.style);

  add.creator('modifiedStyle', {});

  add.method('changed', function ($super) {
    // Avoid infinite recursion when setting the border stuff.
    if (this._isChangingRightNow) {return;}
    this._isChangingRightNow = true;

    var currentText = this.getText();
    var savedText = this.getSavedText();
    var hasChanged = this._hasChangedFromSavedText = (currentText !== savedText);
    this.applyStyle(hasChanged ? this.modifiedStyle : this.normalStyle);
    
    this.adjustScale(); // aaa - this doesn't really belong here, just trying it as an experiment
    
    this.minimumExtentMayHaveChanged();
    delete this._isChangingRightNow;
    $super();
  });

  add.method('refreshText', function () {
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
  });

  add.method('justAcceptedOrCancelled', function () {
    this.changed();
    this.updateLayoutIfNecessary();
  });

  add.method('acceptChanges', function () {
    var newText = this.getText();
    if (newText !== this.getSavedText()) {
      this.setSavedText(newText);
      
      if (avocado.ui.currentWorld().firstHand().keyboardFocus === this) { // setSavedText might have changed it, in which case we don't want to muck with it
        this.passOnInputFocus();
      }
    }
    this.justAcceptedOrCancelled();
  });

  add.method('cancelChanges', function () {
    this.setText(this.getSavedText());
    this.justAcceptedOrCancelled();
  });

  add.method('handlesMouseDown', function (evt) { return true; });

  add.method('returnKeyShouldAccept', function () { return false; });

  add.method('morphMenu', function (evt) {
    return this.editingCommands().createMenu(this);
  });

  add.method('editingCommands', function () {
    var cmdList = avocado.command.list.create(this);
    if (this.hasChangedFromSavedText()) {
      cmdList.addItem(["accept    [alt+enter]", this.acceptChanges]);
      cmdList.addItem(["cancel    [escape]"   , this.cancelChanges]);
    }
    return cmdList;
  });

});


thisModule.addSlots(avocado.TextMorphRequiringExplicitAcceptance.prototype.modifiedStyle, function(add) {

  add.data('borderWidth', 2);

  add.data('borderColor', new Color(0.8, 0, 0));

});


thisModule.addSlots(TextMorph.prototype.style, function(add) {

  add.data('borderColor', new Color(0.6, 0.6, 0.6));

});


thisModule.addSlots(avocado.TwoModeTextMorph, function(add) {

  add.data('displayName', 'TwoModeTextMorph');

  add.data('superclass', avocado.TextMorphRequiringExplicitAcceptance);

  add.data('type', 'avocado.TwoModeTextMorph');

  add.creator('prototype', Object.create(avocado.TextMorphRequiringExplicitAcceptance.prototype));

});


thisModule.addSlots(avocado.TwoModeTextMorph.prototype, function(add) {

  add.data('constructor', avocado.TwoModeTextMorph);

  add.method('hasChangedFromSavedText', function () {
    return this.isInWritableMode;
  });

  add.method('beUnwritable', function () {
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
  });

  add.method('beWritable', function () {
    this.acceptInput = true;
    this.setFill(this.backgroundColorWhenWritable || null);
    this.changed();
    this.oldMouseHandler = this.mouseHandler;
    this.enableEvents();
    this.isInWritableMode = true;
    return this;
  });

  add.method('switchEditModeOn', function () { this.beWritable(); });

  add.method('switchEditModeOff', function () { this.beUnwritable(); });

  add.creator('normalStyle', Object.create(TextMorph.prototype.style));

  add.method('justAcceptedOrCancelled', function () {
    this.beUnwritable();
    this.updateLayoutIfNecessary();
  });

  add.method('onMouseDown', function ($super, evt) {
    if (! this.isInWritableMode) {
      return this.checkForDoubleClick(evt);
    }
    return $super(evt);
  });

  add.method('canBecomeWritable', function () { return ! this.isReadOnly; });

  add.method('returnKeyShouldAccept', function () { return true; });

  add.method('onDoubleClick', function (evt) {
    if (this.canBecomeWritable()) {
      this.beWritable();
      this.onMouseDown(evt);
      return true;
    }
    return false;
  });

  add.data('nameOfEditCommand', 'edit');

  add.method('setNameOfEditCommand', function (n) {
    this.nameOfEditCommand = n;
    return this;
  });

  add.method('editingCommands', function ($super) {
    var cmdList = $super();
    if (!this.isInWritableMode && this.canBecomeWritable()) {
      cmdList.addItem(avocado.command.create(this.nameOfEditCommand, function(evt) {this.beWritableAndSelectAll(evt);}, this));
    }
    return cmdList;
  });

});


thisModule.addSlots(avocado.TwoModeTextMorph.prototype.normalStyle, function(add) {

  add.data('borderWidth', 0);

});


});
