transporter.module.create('programming_environment/slot_morph', function(requires) {

requires('reflection/reflection');
requires('lk_ext/rows_and_columns');

}, function(thisModule) {


thisModule.addSlots(slots['abstract'], function(add) {

  add.method('Morph', function Morph() { Class.initializer.apply(this, arguments); }, {category: ['user interface']});

  add.method('newMorph', function () {
    return new this.Morph(this);
  }, {category: ['user interface']});

});


thisModule.addSlots(slots['abstract'].Morph, function(add) {

  add.data('superclass', avocado.ColumnMorph);

  add.creator('prototype', Object.create(avocado.ColumnMorph.prototype));

  add.data('type', 'slots.abstract.Morph');

});


thisModule.addSlots(slots['abstract'].Morph.prototype, function(add) {

  add.data('constructor', slots['abstract'].Morph);

  add.method('initialize', function ($super, slot) {
    $super();
    this._slot = slot;

    this.setPadding(0);
    this.updateFill();
    this.setBorderWidth(1);
    this.setBorderColor(Color.black);
    this.beUngrabbable();
    this.closeDnD();

    this._sourceToggler     = Object.newChildOf(avocado.toggler, this.updateAppearance.bind(this),                   this.createRow(function() {return this.sourcePane();}.bind(this))       );
    this._commentToggler    = Object.newChildOf(avocado.toggler, this.updateAppearance.bind(this), slot.comment    ? this.createRow(function() {return this.   commentMorph();}.bind(this)) : null);
    this._annotationToggler = Object.newChildOf(avocado.toggler, this.updateAppearance.bind(this), slot.annotation ? this.createRow(function() {return this.annotationMorph();}.bind(this)) : null);

    var slotMorph = this;
    var nameMorph = this._nameMorph = new TwoModeTextMorph(function() { return slotMorph.slotName(); },
                                                           function(newName) { slotMorph.setSlotName(newName, Event.createFake()); });
    nameMorph.nameOfEditCommand = "rename";
    nameMorph.ignoreEvents(); // so that the menu request passes through, though this breaks double-clicking-to-edit

    var commentButton = ButtonMorph.createButton("'...'", function(evt) { this._commentToggler.toggle(evt); }.bind(this), 1);
    commentButton.getHelpText = function() { return (this._commentToggler.isOn() ? 'Hide' : 'Show') + ' my comment'; }.bind(this);

    var buttonChooserMorph = Morph.createEitherOrMorph(this.sourceButton(), this.contentsPointer(), function() { return this.slot().isSimpleMethod(); }.bind(this));

    var optionalCommentButtonMorph = Morph.createOptionalMorph(commentButton, function() { return this._commentToggler.isOn() || (this.slot().comment && this.slot().comment()); }.bind(this));

    var signatureRowContent = [nameMorph, optionalCommentButtonMorph, Morph.createSpacer(), buttonChooserMorph];
    this.signatureRow = avocado.RowMorph.createSpaceFilling(function () { return signatureRowContent; },
                                                    {left: 0, right: 2, top: 0, bottom: 0, between: 0});

    this.updateAppearance();
  }, {category: ['creating']});

  add.data('grabsShouldFallThrough', true, {category: ['grabbing']});

  add.method('showContents', function (callWhenContentsAreVisible) {
    var w = this.world();
    var mir = this.slot().contents();
    var mirMorph = w.morphFor(mir);
    mirMorph.ensureIsInWorld(w, this._contentsPointer.worldPoint(pt(150,0)), false, true, true, callWhenContentsAreVisible);
  }, {category: ['contents']});

  add.method('showContentsArrow', function (callWhenDone) {
    this._contentsPointer.arrow.showMe(callWhenDone);
  }, {category: ['contents']});

  add.method('contentsPointer', function () {
    var m = this._contentsPointer;
    if (m) { return m; }

    var slotMorph = this;
    var slot = this.slot();
    var icon = this.createIconForButton("images/icon-data-slot.gif");

    m = this._contentsPointer = ButtonMorph.createButton(icon, function() { this._contentsPointer.arrow.toggleVisibility(); }.bind(this), 1);
    m.beArrowEndpoint();

    // aaa - This is still a bit of a mess.

    var arrow = m.arrow = new avocado.ArrowMorph(slot, m, null);
    arrow.noLongerNeedsToBeUpdated = true;
    arrow.prepareToBeShown = this.showContents.bind(this);

    var mirMorph = this.mirrorMorph();
    if (mirMorph) { mirMorph.changeNotifier().addObserver(arrow.notificationFunction); }

    arrow.endpoint2.wasJustDroppedOnMirror = function(mirMorph) {
      this.wasJustDroppedOn(mirMorph);
      slotMorph.setContents(mirMorph.mirror());
    };

    m.addCommandsTo = function(cmdList) {
      // aaa - To do "grab pointer" properly I think I need to do a more general drag-and-drop thing. Right
      // now nothing will get called if I drop the endpoint on something invalid (like the world or some
      // other morph), so the visibility will need to be toggled an extra time to get it back to normal.
      cmdList.addItem({label: "grab pointer", go: function(evt) {
        arrow.needsToBeVisible();
        arrow.endpoint2.grabMeWithoutZoomingAroundFirst(evt);
      }});

      var c = slot.contents().reflectee();
      if (typeof(c) === 'boolean') {
        cmdList.addItem({label: "set to " + (!c), go: function(evt) { slot.setContents(reflect(!c)); } });
      }
    };

    m.inspect = function() { return slot.name() + " contents"; };
    m.getHelpText = function() { return arrow.noLongerNeedsToBeUpdated ? "Show my contents" : "Hide arrow"; };

    return m;
  }, {category: ['contents']});

  add.method('sourceButton', function () {
    var m = this._sourceButton;
    if (m) { return m; }
    var icon = this.createIconForButton("images/icon-method-slot.gif");
    m = this._sourceButton = ButtonMorph.createButton(icon, function(evt) {this._sourceToggler.toggle(evt);}.bind(this), 1);
    m.getHelpText = function() { return (this._sourceToggler.isOn() ? 'Hide' : 'Show') + ' code'; }.bind(this);
    return m;
  }, {category: ['source']});

  add.method('createIconForButton', function (path) {
    return new ImageMorph(pt(10,10).extentAsRectangle(), (window.livelyBaseURL || "") + path).beLabel();
  }, {category: ['creating']});

  add.method('createRow', function (getOrCreateContent) {
    var spacer = Morph.createSpacer();
    var r = avocado.RowMorph.createSpaceFilling(function() {return [getOrCreateContent(), spacer];}, {left: 15, right: 2, top: 2, bottom: 2, between: 0});
    r.wasJustShown = function(evt) { getOrCreateContent().requestKeyboardFocus(evt.hand); };
    return r;
  }, {category: ['creating']});

  add.method('sourcePane', function () {
    var m = this._sourcePane;
    if (m) { return m; }
    this._sourcePane = m = ScrollPane.ifNecessaryToContain(this.sourceMorph(), pt(400,300));
    m.setLayoutModes({horizontalLayoutMode: LayoutModes.SpaceFill});
    return m;
  }, {category: ['source']});

  add.method('sourceMorph', function () {
    var m = this._sourceMorph;
    if (m) { return m; }
    var thisSlotMorph = this;
    var getter = function()  { return thisSlotMorph.slot().sourceCode(); };
    var setter = function(s) { thisSlotMorph.setContents(thisSlotMorph.slot().newContentsForSourceCode(s)); };
    m = new TextMorphRequiringExplicitAcceptance(getter, setter);
    m.setFontFamily('monospace');
    m.horizontalLayoutMode = LayoutModes.SpaceFill;
    m.suppressHandles = true;
    this._sourceMorph = m;
    return m;
  }, {category: ['source']});

  add.method('annotationMorph', function () {
    var m = this._annotationMorph;
    if (m) { return m; }
    m = this._annotationMorph = new avocado.ColumnMorph(this).beInvisible();
    m.setPadding({left: 0, right: 0, top: 0, bottom: 0, between: 2});
    this._moduleNameMorph  = new TextMorphRequiringExplicitAcceptance(this.moduleName.bind(this), this.setModuleName.bind(this));
    this._initializerMorph = new TextMorphRequiringExplicitAcceptance(this.initializationExpression.bind(this), this.setInitializationExpression.bind(this));
    m.setRows([avocado.RowMorph.createSpaceFilling([TextMorph.createLabel("Module:"       ), this._moduleNameMorph   ]),
               avocado.RowMorph.createSpaceFilling([TextMorph.createLabel("Initialize to:"), this._initializerMorph])]);
    return m;
  }, {category: ['annotation']});

  add.method('commentMorph', function () {
    var m = this._commentMorph;
    if (m) { return m; }
    var thisSlotMorph = this;
    m = new TextMorphRequiringExplicitAcceptance(function( ) { return thisSlotMorph.slot().   comment( ); },
                                                 function(c) {        thisSlotMorph.slot().setComment(c); });
    this._commentMorph = m;
    return m;
  }, {category: ['comment']});

  add.method('wasJustAdded', function (evt) {
    this._sourceToggler.beOn(evt);
    this._nameMorph.beWritableAndSelectAll();
  }, {category: ['events']});

  add.method('slotName', function () { return this.slot().name(); }, {category: ['accessing']});

  add.method('setSlotName', function (newName, evt) {
    avocado.ui.showMessageIfErrorDuring(function() {
      var newSlot = this.slot().rename(newName);
      var mirMorph = this.mirrorMorph();
      if (mirMorph) {
        mirMorph.updateAppearance();

        // it's actually a whole nother slot and slotMorph but we want it to feel like the same one
        var newSlotMorph = mirMorph.slotMorphFor(newSlot);
        this.transferUIStateTo(newSlotMorph);
        newSlotMorph.sourceMorph().requestKeyboardFocus(evt.hand);
        newSlotMorph.sourceMorph().doSelectAll();
      }
    }.bind(this), evt);
  }, {category: ['accessing']});

  add.method('constructUIStateMemento', function () {
    return {
      isSourceOpen: this._sourceToggler.isOn(),
      isCommentOpen: this._commentToggler.isOn(),
      isAnnotationOpen: this._annotationToggler.isOn(),
      isArrowVisible: ! this.contentsPointer().arrow.noLongerNeedsToBeUpdated
    };
  }, {category: ['UI state']});

  add.method('assumeUIState', function (uiState, evt) {
    if (!uiState) { return; }
    evt = evt || Event.createFake();
    this._sourceToggler    .setValue( uiState.isSourceOpen,     evt );
    this._commentToggler   .setValue( uiState.isCommentOpen,    evt );
    this._annotationToggler.setValue( uiState.isAnnotationOpen, evt );
    
    var arrow = this.contentsPointer().arrow;
    if (uiState.isArrowVisible) {arrow.needsToBeVisible();} else {arrow.noLongerNeedsToBeVisible();}
  }, {category: ['UI state']});

  add.method('slot', function () { return this._slot; }, {category: ['accessing']});

  add.method('inspect', function () { return this.slot().name(); }, {category: ['printing']});

  add.method('mirrorMorph', function () {
    return WorldMorph.current().existingMorphFor(this.slot().mirror());
  }, {category: ['accessing']});

  add.method('moduleName', function () {
    var module = this.slot().module();
    return module ? module.name() : "";
  }, {category: ['annotation', 'module']});

  add.method('setModuleName', function (n) {
    var module = transporter.module.existingOneNamed(n);
    if (module) { return this.slot().setModule(module); }
    avocado.ui.confirm("The '" + n + "' module does not exist. Create it?", function(b) {
      if (b) {
        this.setModule(transporter.module.named(n));
      }
    }.bind(this));
  }, {category: ['annotation', 'module']});

  add.method('initializationExpression', function () {
    return this.slot().initializationExpression();
  }, {category: ['annotation', 'initialization expression']});

  add.method('setInitializationExpression', function (e) {
    this.slot().setInitializationExpression(e);
  }, {category: ['annotation', 'initialization expression']});

  add.method('updateAppearance', function () { // aaa get rid of me once I'm being done through refreshContentOfMeAndSubmorphs from the mirror morph
    this.refreshContentOfMeAndSubmorphs();
    this.updateFill();
  }, {category: ['updating']});

  add.method('updateFill', function () {
    if (this.slot().isFromACopyDownParent()) {
      this.setFill(Color.red.lighter().lighter());
      this.setFillOpacity(0.5); 
    } else {
      this.setFill(null);
    }
  }, {category: ['updating']});

  add.method('potentialContent', function () {
    return [this.signatureRow, this._annotationToggler, this._commentToggler, this._sourceToggler];
  }, {category: ['updating']});

  add.method('canBeDroppedOnCategory', function (categoryMorph) {
    if (this._shouldOnlyBeDroppedOnThisParticularMirror) { return categoryMorph.mirror() === this._shouldOnlyBeDroppedOnThisParticularMirror; }
    return true;
  }, {category: ['drag and drop']});

  add.method('canBeDroppedOnMirror', function (mirMorph) {
    if (this._shouldOnlyBeDroppedOnThisParticularMirror) { return mirMorph.mirror() === this._shouldOnlyBeDroppedOnThisParticularMirror; }
    return true;
  }, {category: ['drag and drop']});

  add.method('wasJustDroppedOnMirror', function (mirMorph) {
    this.slot().copyTo(mirMorph.mirror());
    mirMorph.expander().expand();
    this.remove();
    mirMorph.updateAppearance();
  }, {category: ['drag and drop']});

  add.method('wasJustDroppedOnCategory', function (categoryMorph) {
    var newSlot = this.slot().copyTo(categoryMorph.mirrorMorph().mirror(), categoryMorph.category());
    categoryMorph.expander().expand();
    this.remove();
    categoryMorph.mirrorMorph().updateAppearance();
  }, {category: ['drag and drop']});

  add.method('wasJustDroppedOnWorld', function (world) {
    if (! this._shouldOnlyBeDroppedOnThisParticularMirror) {
      var mirMorph = world.morphFor(this.slot().mirror());
      world.addMorphAt(mirMorph, this.position());
      mirMorph.expander().expand();
      this.remove();
    }
  }, {category: ['drag and drop']});

  add.method('setModule', function (m, evt) {
    this.slot().setModule(m);
    this.updateAppearance();
  }, {category: ['annotation', 'module']});

  add.method('setModuleRecursively', function (m, evt) {
    this.slot().setModuleRecursively(m);
    this.updateAppearance();
  }, {category: ['annotation', 'module']});

  add.method('setContents', function (c, evt) {
    this.slot().setContents(c);

    // Just to help make it easier and more intuitive to set creator slots.
    this.slot().bePossibleCreatorSlotIfNoneAlreadySpecified();
    
    // Sometimes the text doesn't come out quite identical; this makes sure the
    // source editor doesn't stay red.
    if (this._sourceMorph) { this._sourceMorph.cancelChanges(); }

    // Not sure this is really what I want, but I think I don't like it when
    // the source stays open after I edit it, at least if it's data rather than
    // a method. (The method I'm likely to be editing again. But editing the
    // source of a data slot is usually just done when initially creating the
    // slot.)
    if (! this.slot().isSimpleMethod()) { this._sourceToggler.beOff(evt); }

    this.updateAppearance();
  }, {category: ['contents']});

  add.method('beCreator', function () {
    this.slot().beCreator();
    var contentsMirMorph = this.world().existingMorphFor(this.slot().contents());
    if (contentsMirMorph) { contentsMirMorph.updateAppearance(); }
    this.updateAppearance();
  }, {category: ['creator slots']});

  add.method('grabCopy', function (evt) {
    var newMirror = reflect({});
    var newSlot = this.slot().copyTo(newMirror);
    var newSlotMorph = newSlot.newMorph();
    newSlotMorph.setFill(lively.paint.defaultFillWithColor(Color.gray));
    newSlotMorph.horizontalLayoutMode = LayoutModes.ShrinkWrap;
    newSlotMorph.forceLayoutRejiggering();
    if (! this.mirrorMorph().shouldAllowModification()) { newSlotMorph._shouldOnlyBeDroppedOnThisParticularMirror = this.mirrorMorph().mirror(); }
    evt.hand.grabMorphWithoutAskingPermission(newSlotMorph, evt);
    return newSlotMorph;
  }, {category: ['drag and drop']});

  add.method('addCommandsTo', function (cmdList) {
    var copyDown = this.slot().copyDownParentThatIAmFrom();
    var isModifiable = this.mirrorMorph().shouldAllowModification();

    if (copyDown) {
      var copyDownParentMir = reflect(copyDown.parent);
      cmdList.addItem({label: "copied down from " + copyDownParentMir.name(), go: function(evt) {
        avocado.ui.grab(copyDownParentMir, evt);
      }.bind(this)});
    } else {
      if (isModifiable && this.slot().rename) {
        this._nameMorph.addEditingMenuItemsTo(cmdList);
      }

      cmdList.addItem({label: this._sourceToggler.isOn() ? "hide contents" : "show contents", go: function(evt) {
        this._sourceToggler.toggle(evt);
      }.bind(this)});

      if (this.slot().copyTo) {
        cmdList.addItem({label: isModifiable ? "copy" : "move", go: function(evt) { this.grabCopy(evt); }.bind(this)});
      }
      
      if (isModifiable && this.slot().remove) {
        cmdList.addItem({label: "move", go: function(evt) {
          this.grabCopy(evt);
          this.slot().remove();
          var mirMorph = this.mirrorMorph();
          if (mirMorph) { mirMorph.updateAppearance(); }
        }.bind(this)});
      }

      if (this.slot().comment) {
        cmdList.addItem({label: this._commentToggler.isOn() ? "hide comment" : "show comment", go: function(evt) {
          this._commentToggler.toggle(evt);
        }.bind(this)});
      }

      if (isModifiable && this.slot().beCreator && this.slot().contents().canHaveCreatorSlot()) {
        var cs = this.slot().contents().explicitlySpecifiedCreatorSlot();
        if (!cs || ! cs.equals(this.slot())) {
          cmdList.addItem({label: "be creator", go: function(evt) { this.beCreator(); }.bind(this)});
        }
      }

      if (isModifiable && this.slot().setModule) {
        cmdList.addItem({label: "set module...", go: function(evt) {
          transporter.chooseOrCreateAModule(evt, this.mirrorMorph().modules(), this, "To which module?", function(m, evt) {this.setModule(m, evt);}.bind(this));
        }.bind(this)});
      }

      if (isModifiable && this.slot().setModuleRecursively) {
        cmdList.addItem({label: "set module recursively...", go: function(evt) {
          transporter.chooseOrCreateAModule(evt, this.mirrorMorph().modules(), this, "To which module?", function(m, evt) {this.setModuleRecursively(m, evt);}.bind(this));
        }.bind(this)});
      }

      if (this.slot().annotation) {
        cmdList.addItem({label: this._annotationToggler.isOn() ? "hide annotation" : "show annotation", go: function(evt) {
          this._annotationToggler.toggle(evt);
        }.bind(this)});
      }
    }

    cmdList.addLine();
    
    if (this.slot().wellKnownImplementors) {
      cmdList.addItem({label: "implementors", go: function(evt) {
        avocado.ui.grab(avocado.implementorsFinder.create(this.slot().name()), evt).redo();
      }.bind(this)});
    }

    if (this.slot().wellKnownSenders) {
      cmdList.addItem({label: "senders", go: function(evt) {
        avocado.ui.grab(avocado.senders.finder.create(this.slot().name()), evt).redo();
      }.bind(this)});
    }
    
    if (isModifiable && this.slot().contents().prettyPrint) {
      cmdList.addSection([{label: "pretty-print", go: function(evt) {
        avocado.ui.grab(reflect(this.slot().contents().prettyPrint()), evt);
      }.bind(this)}]);
    }
  }, {category: ['menu']});

});


});
