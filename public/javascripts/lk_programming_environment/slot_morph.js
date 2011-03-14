transporter.module.create('lk_programming_environment/slot_morph', function(requires) {

requires('reflection/reflection');
requires('lk_ext/rows_and_columns');

}, function(thisModule) {


thisModule.addSlots(avocado.slots['abstract'], function(add) {

  add.method('Morph', function Morph() { Class.initializer.apply(this, arguments); }, {category: ['user interface']});

  add.method('newMorph', function () {
    return new this.Morph(this);
  }, {category: ['user interface']});

  add.method('morph', function () {
    return WorldMorph.current().morphFor(this);
  }, {category: ['user interface']});

  add.data('isImmutableForMorphIdentity', true, {category: ['user interface']});

  add.method('showInSitu', function (inSituButton) {
    var w = inSituButton.world();
    var m = w.morphFor(this.holder());
    m.ensureIsInWorld(w, inSituButton.worldPoint(pt(150,0)), true, true, true, function() {
      m.expandCategory(this.category());
    }.bind(this));
  }, {category: ['user interface', 'slices']});

  add.method('createMorphsForSearchResults', function () {
    var inSituButton = ButtonMorph.createButton("in situ", function() { this.showInSitu(inSituButton); }.bind(this), 2);
    return [TextMorph.createLabel(this.holder().name()), this.newMorph(), inSituButton];
  }, {category: ['user interface', 'slices']});

});


thisModule.addSlots(avocado.slots['abstract'].Morph, function(add) {

  add.data('superclass', avocado.ColumnMorph);

  add.data('type', 'avocado.slots.abstract.Morph');

  add.creator('pointer', {});

  add.creator('prototype', Object.create(avocado.ColumnMorph.prototype));

});


thisModule.addSlots(avocado.slots['abstract'].Morph.prototype, function(add) {

  add.data('constructor', avocado.slots['abstract'].Morph);

  add.method('initialize', function ($super, slot) {
    $super();
    this._model = slot;

    this.applyStyle(this.appropriateStyle());

    var optionalCommentButtonMorph, buttonChooserMorph;
    if (slot.annotationForReading) {
      if (this.shouldUseZooming()) {
        this._annotationToggler = avocado.scaleBasedOptionalMorph.create(this, this.createRow(function() { return this.annotationMorph(); }.bind(this)), this, 1);
      } else {
        this._commentToggler    = avocado.toggler.create(this, this.createRow(function() {return this.   commentMorph();}.bind(this)));
        this._annotationToggler = avocado.toggler.create(this, this.createRow(function() {return this.annotationMorph();}.bind(this)));

        var commentButton = this._commentToggler.commandForToggling('my comment', "'...'").newMorph();
        optionalCommentButtonMorph = Morph.createOptionalMorph(commentButton, function() { return this._commentToggler.isOn() || (this.slot().comment && this.slot().comment()); }.bind(this));
      }
    }

    var signatureRowContent;
    if (this.shouldUseZooming()) {
      /* aaa why does this produce weird shrinking behaviour?   avocado.scaleBasedOptionalMorph.create(this, function() { */
      buttonChooserMorph = Morph.wrapToTakeUpConstantHeight(10, 
        this.slot().isSimpleMethod() ? this.sourcePane() : Morph.createEitherOrMorph(function() { return slot.contents().morph(); }, this.contentsPointer.bind(this), function() {
          return this.slot().equals(this.slot().contents().probableCreatorSlot());
        }.bind(this))
      );
      //}.bind(this), this, 1.5);
      signatureRowContent = [this.descriptionMorph(), Morph.createSpacer(), this._annotationToggler, Morph.createSpacer(), buttonChooserMorph].compact();
    } else {
      this._sourceToggler = avocado.toggler.create(this, this.createRow(function() {return this.sourcePane();}.bind(this)));
      buttonChooserMorph = Morph.createEitherOrMorph(this.sourceButton(), this.contentsPointer(), function() { return this.slot().isSimpleMethod(); }.bind(this));
      signatureRowContent = [this.descriptionMorph(), optionalCommentButtonMorph, Morph.createSpacer(), buttonChooserMorph].compact();
    }

    this.signatureRow = avocado.RowMorph.createSpaceFilling(function () { return signatureRowContent; }, this.signatureRowStyle.padding);
  }, {category: ['creating']});

  add.method('slot', function () { return this._model; }, {category: ['accessing']});

  add.method('shouldUseZooming', function () {
    return avocado.shouldMirrorsUseZooming;
  }, {category: ['zooming']});

  add.creator('defaultStyle', {}, {category: ['styles']});

  add.creator('copyDownStyle', Object.create(avocado.slots['abstract'].Morph.prototype.defaultStyle), {category: ['styles']});

  add.creator('grabbedStyle', Object.create(avocado.slots['abstract'].Morph.prototype.defaultStyle), {category: ['styles']});

  add.creator('annotationStyle', {}, {category: ['styles']});

  add.creator('commentStyle', {}, {category: ['styles']});

  add.creator('sourceMorphStyle', {}, {category: ['styles']});

  add.creator('signatureRowStyle', {}, {category: ['styles']});

  add.method('mirrorMorph', function () {
    return WorldMorph.current().existingMorphFor(this.slot().mirror());
  }, {category: ['accessing']});

  add.method('showContentsArrow', function (callWhenDone) {
    this._contentsPointer.arrow.showMe(callWhenDone);
  }, {category: ['contents']});

  add.method('contentsPointer', function () {
    return this._contentsPointer || (this._contentsPointer = this.constructor.pointer.create(this).newMorph());
  }, {category: ['contents']});

  add.method('sourceButton', function () {
    return this._sourceButton || (this._sourceButton = this._sourceToggler.commandForToggling("code").newMorph(this.createIconForButton("images/icon-method-slot.gif")));
  }, {category: ['source']});

  add.method('createIconForButton', function (path) {
    return new ImageMorph(pt(10,10).extentAsRectangle(), (transporter.avocadoBaseURL || "") + path).beLabel();
  }, {category: ['creating']});

  add.method('createRow', function (getOrCreateContent) {
    // Blecch, functions everywhere. But creating the row is expensive. Find a cleaner way to cache them.
    // Or even get rid of them, use the contents directly; the problem with that is that we can't make
    // TextMorphs SpaceFill yet.
    var p = this.defaultStyle.internalPadding;
    var row = null;
    return function() {
      if (row) { return row; }
      var spacer = Morph.createSpacer();
      row = avocado.RowMorph.createSpaceFilling(function() {return [getOrCreateContent(), spacer];}, p);
      row.wasJustShown = function(evt) { getOrCreateContent().requestKeyboardFocus(evt.hand); };
      return row;
    }.bind(this);
  }, {category: ['creating']});

  add.method('nameMorph', function () {
    // ignoreEvents so that the menu request passes through, though this breaks double-clicking-to-edit
    return this._nameMorph || (this._nameMorph = new avocado.TwoModeTextMorph(avocado.accessors.forMethods(this, 'slotName')).setNameOfEditCommand("rename").ignoreEvents());
  }, {category: ['signature']});

  add.method('descriptionMorph', function () {
    // override for children that have more to describe (like process contexts)
    return this.nameMorph();
  }, {category: ['signature']});

  add.method('sourcePane', function () {
    var sp = this._sourcePane;
    if (sp) { return sp; }
    sp = this._sourcePane = ScrollPane.ifNecessaryToContain(this.sourceMorph(), pt(400,300));
    //if (this.shouldUseZooming()) { this.sourcePane().setScale(this.slot().isSimpleMethod() ? 0.9 : 0.3); }
    return sp;
  }, {category: ['source']});

  add.method('sourceMorph', function () {
    var sm = this._sourceMorph;
    if (sm) { return sm; }
    sm = this._sourceMorph = new avocado.TextMorphRequiringExplicitAcceptance(avocado.accessors.forMethods(this, 'sourceCode')).applyStyle(this.sourceMorphStyle);
    if (this.shouldUseZooming()) { sm._maxSpace = pt(200,200); }
    return sm;
  }, {category: ['source']});

  add.method('annotationMorph', function () {
    var m = this._annotationMorph;
    if (m) { return m; }
    
    m = this._annotationMorph = new avocado.TableMorph().beInvisible().applyStyle(this.annotationStyle);
    var rows = [
      [TextMorph.createLabel("Module:"       ), new avocado.TextMorphRequiringExplicitAcceptance(avocado.accessors.forMethods(this.slot(), 'moduleName')) ],
      [TextMorph.createLabel("Initialize to:"), new avocado.TextMorphRequiringExplicitAcceptance(avocado.accessors.forMethods(this.slot(), 'initializationExpression'))]
    ];
    
    if (this.shouldUseZooming()) {
      rows.unshift([TextMorph.createLabel("Comment:"), this.commentMorph()]);
      m.setScale(0.25);
    }
    
    m.replaceContentWith(avocado.tableContents.createWithRows(rows));
    return m;
  }, {category: ['annotation']});

  add.method('commentMorph', function () {
    return this._commentMorph || (this._commentMorph = new avocado.TextMorphRequiringExplicitAcceptance(avocado.accessors.forMethods(this.slot(), 'comment')).applyStyle(this.commentStyle));
  }, {category: ['comment']});

  add.method('wasJustShown', function (evt) {
    if (this.shouldUseZooming()) {
      // I don't like this; let's make it auto-zoom in instead.
      // this.sourcePane().setScale(0.9);
    } else {
      this._sourceToggler.beOn(evt);
    }
    this._nameMorph.wasJustShown(evt);
  }, {category: ['events']});

  add.method('sourceCode', function () {
    return this.slot().sourceCode();
  }, {category: ['accessing']});

  add.method('setSourceCode', function (s) {
    this.setContents(this.slot().newContentsForSourceCode(s));
  }, {category: ['accessing']});

  add.method('showContents', function (callWhenContentsAreVisible) {
    var w = this.world();
    var mir = this.slot().contents();
    var mirMorph = w.morphFor(mir);
    mirMorph.ensureIsInWorld(w, this._contentsPointer.worldPoint(pt(150,0)), false, true, true, callWhenContentsAreVisible);
  }, {category: ['contents']});

  add.method('updateScaleOfSourcePane', function (evt) {
    // Not sure this is really what I want, but I think I don't like it when the
    // source keeps taking up space after I edit it, at least if it's data rather
    // than a method. (The method I'm likely to be editing again. But editing the
    // source of a data slot is usually just done when initially creating the
    // slot.)
    
    if (this.shouldUseZooming()) {
      this.sourcePane().setScale(this.slot().isSimpleMethod() ? 0.9 : 0.3);

      // aaa - I need a better understanding of what exactly needs to happen
      // when I change the scale of a morph. -- Adam
      this.sourcePane()._cachedMinimumExtent = false;
      this.sourcePane().forceLayoutRejiggering(true);
    } else {
      if (! this.slot().isSimpleMethod()) { this._sourceToggler.beOff(evt); }
    }
  }, {category: ['contents']});

  add.method('setContents', function (c, evt) {
    this.slot().setContents(c);

    // Just to help make it easier and more intuitive to set creator slots.
    this.slot().bePossibleCreatorSlotIfNoneAlreadySpecified();
    
    // Sometimes the text doesn't come out quite identical; this makes sure the
    // source editor doesn't stay red.
    if (this._sourceMorph) { this._sourceMorph.cancelChanges(); }

    this.updateScaleOfSourcePane(evt);

    avocado.ui.justChanged(this.slot());
  }, {category: ['accessing']});

  add.method('slotName', function () { return this.slot().name(); }, {category: ['accessing']});

  add.method('setSlotName', function (newName, evt) {
    evt = evt || Event.createFake();
    avocado.ui.showMessageIfErrorDuring(function() {
      var newSlot = this.slot().rename(newName);
      var mirMorph = this.mirrorMorph();
      if (mirMorph) {
        mirMorph.updateAppearance();

        // it's actually a whole nother slot and slotMorph but we want it to feel like the same one
        var newSlotMorph = mirMorph.slotMorphFor(newSlot);
        this.transferUIStateTo(newSlotMorph);
        newSlotMorph.sourceMorph().beWritableAndSelectAll();
        this.justBecameObsolete();
      }
    }.bind(this), evt);
  }, {category: ['accessing']});

  add.method('justBecameObsolete', function () {
    WorldMorph.current().forgetAboutExistingMorphFor(this.slot(), this);
  }, {category: ['renaming']});

  add.method('partsOfUIState', function () {
    return {
      isSourceOpen:     this._sourceToggler,
      isCommentOpen:    this._commentToggler,
      isAnnotationOpen: this._annotationToggler,
      isArrowVisible:   this.contentsPointer().arrow
    };
  }, {category: ['UI state']});

  add.method('updateFill', function () {
    this.applyStyle(this.appropriateStyle());
  }, {category: ['updating']});

  add.method('appropriateStyle', function () {
    return this._explicitStyle || (this.slot().isFromACopyDownParent() ? this.copyDownStyle : this.defaultStyle);
  }, {category: ['updating']});

  add.method('potentialContent', function () {
    if (this.shouldUseZooming()) {
      return avocado.tableContents.createWithColumns([[this.signatureRow]]);
    } else {
      return avocado.tableContents.createWithColumns([[this.signatureRow, this._annotationToggler, this._commentToggler, this._sourceToggler].compact()]);
    }
  }, {category: ['updating']});

  add.method('wasJustDroppedOnWorld', function (world) {
    if (! this._shouldOnlyBeDroppedOnThisParticularMorph || this._shouldOnlyBeDroppedOnThisParticularMorph === world) {
      var mir = reflect({});
      var newSlot = this.slot().copyTo(mir.rootCategory());
      var mirMorph = world.morphFor(mir);
      world.addMorphAt(mirMorph, this.position());
      mirMorph.expandCategory(newSlot.category());
      if (this._shouldDisappearAfterCommandIsFinished) { this.remove(); }
    }
  }, {category: ['drag and drop']});

  add.method('grabCopy', function (evt) {
    var newMirror = reflect({});
    var newSlot = this.slot().copyTo(newMirror.rootCategory());
    var newSlotMorph = newSlot.newMorph();
    newSlotMorph._explicitStyle = this.grabbedStyle;
    newSlotMorph.refreshContent();
    newSlotMorph.forceLayoutRejiggering();
    newSlotMorph._shouldDisappearAfterCommandIsFinished = true;
    if (this.mirrorMorph() && ! this.mirrorMorph().shouldAllowModification()) { newSlotMorph._shouldOnlyBeDroppedOnThisParticularMorph = this.mirrorMorph(); }
    evt.hand.grabMorphWithoutAskingPermission(newSlotMorph, evt);
    return newSlotMorph;
  }, {category: ['drag and drop']});

  add.method('grabCopyAndRemoveMe', function (evt) {
    this.grabCopy(evt);
    this.slot().remove();
    avocado.ui.justChanged(this.slot().mirror());
  }, {category: ['drag and drop']});

  add.method('commands', function () {
    var cmdList = avocado.command.list.create(this);
    
    if (! this.slot().copyDownParentThatIAmFrom()) {
      var isModifiable = !window.isInCodeOrganizingMode;
      
      if (isModifiable && this.slot().rename) { cmdList.addAllCommands(this._nameMorph.editingCommands()); }
      cmdList.addItem({label: isModifiable ? "copy" : "move", go: function(evt) { this.grabCopy(evt); }, isApplicable: function() { return this.slot().copyTo; }.bind(this)});
      cmdList.addItem({label: "move", go: function(evt) { this.grabCopyAndRemoveMe(evt); }, isApplicable: function() { return isModifiable && this.slot().remove; }.bind(this)});
      if (! this.shouldUseZooming()) {
        if (this._sourceToggler) { cmdList.addItem(this._sourceToggler.commandForToggling("contents")); }
        if (this._commentToggler) { cmdList.addItem(this._commentToggler.commandForToggling("comment").onlyApplicableIf(function() {return this.slot().comment; }.bind(this))); }
        if (this._annotationToggler) { cmdList.addItem(this._annotationToggler.commandForToggling("annotation").onlyApplicableIf(function() {return this.slot().annotationForReading; }.bind(this))); }
      }
    }
    
    cmdList.addAllCommands(this.slot().commands().wrapWithPromptersForArguments().wrapForMorph(this));
    
    return cmdList;
  }, {category: ['menu']});

});


thisModule.addSlots(avocado.slots['abstract'].Morph.prototype.defaultStyle, function(add) {

  add.data('borderColor', new Color(0.6, 0.6, 0.6));

  add.data('borderWidth', 1);

  add.data('fill', null);

  add.data('padding', 0);

  add.data('suppressGrabbing', true);

  add.data('grabsShouldFallThrough', true);

  add.data('openForDragAndDrop', false);

  add.data('internalPadding', {left: 15, right: 2, top: 2, bottom: 2, between: {x: 0, y: 0}}, {initializeTo: '{left: 15, right: 2, top: 2, bottom: 2, between: {x: 0, y: 0}}'});

});


thisModule.addSlots(avocado.slots['abstract'].Morph.prototype.copyDownStyle, function(add) {

  add.data('fill', new Color(0.95, 0.75, 0.75));

});


thisModule.addSlots(avocado.slots['abstract'].Morph.prototype.grabbedStyle, function(add) {

  add.data('fill', new lively.paint.LinearGradient([new lively.paint.Stop(0, new Color(0.9019607843137255, 0.9019607843137255, 0.9019607843137255)), new lively.paint.Stop(1, new Color(0.8, 0.8, 0.8))], lively.paint.LinearGradient.NorthSouth));

  add.data('horizontalLayoutMode', avocado.LayoutModes.ShrinkWrap);

});


thisModule.addSlots(avocado.slots['abstract'].Morph.prototype.annotationStyle, function(add) {

  add.data('horizontalLayoutMode', avocado.LayoutModes.SpaceFill);

  add.data('padding', {left: 0, right: 0, top: 0, bottom: 0, between: {x: 2, y: 2}}, {initializeTo: '{left: 0, right: 0, top: 0, bottom: 0, between: {x: 2, y: 2}}'});

});


thisModule.addSlots(avocado.slots['abstract'].Morph.prototype.sourceMorphStyle, function(add) {

  add.data('fontFamily', 'monospace');

  add.data('suppressHandles', true);

});


thisModule.addSlots(avocado.slots['abstract'].Morph.prototype.signatureRowStyle, function(add) {

  add.data('padding', {left: 0, right: 2, top: 0, bottom: 0, between: {x: 0, y: 0}}, {initializeTo: '{left: 0, right: 2, top: 0, bottom: 0, between: {x: 0, y: 0}}'});

});


thisModule.addSlots(avocado.slots['abstract'].Morph.pointer, function(add) {

  add.method('create', function (slotMorph) {
    return Object.newChildOf(this, slotMorph);
  }, {category: ['creating']});

  add.method('initialize', function (slotMorph) {
    this._associationMorph = slotMorph;
  }, {category: ['creating']});

  add.method('association', function () { return this._associationMorph.slot(); }, {category: ['accessing']});

  add.method('setTarget', function (targetMorph) { this._associationMorph.setContents(targetMorph.mirror()); }, {category: ['setting']});

  add.method('labelMorph', function () { return this._associationMorph.createIconForButton("images/icon-data-slot.gif"); }, {category: ['creating a morph']});

  add.method('inspect', function () { return this.association().name() + " contents"; }, {category: ['printing']});

  add.method('helpTextForShowing', function () { return "Show my contents"; }, {category: ['help text']});

  add.method('helpTextForHiding', function () { return "Hide arrow"; }, {category: ['help text']});

  add.method('prepareToBeShown', function (callWhenDone) { this._associationMorph.showContents(callWhenDone); }, {category: ['showing']});

  add.method('notifiersToUpdateOn', function () { var mirMorph = this._associationMorph.mirrorMorph(); return mirMorph ? [mirMorph.changeNotifier()] : []; }, {category: ['updating']});

  add.method('addExtraCommandsTo', function (cmdList) {
    var assoc = this.association();
    var c = assoc.contents();
    if (c.isReflecteeBoolean()) {
      cmdList.addItem({label: "set to " + (c.oppositeBoolean().reflecteeToString()), go: function(evt) { assoc.setContents(c.oppositeBoolean()); } });
    }
  }, {category: ['commands']});

  add.method('newMorph', function () {
    var m = avocado.ArrowMorph.createButtonForToggling(this);
    m.arrow.endpoint2.wasJustDroppedOnMirror = function(mirMorph) { this.setTarget(mirMorph); }.bind(this);
    return m;
  }, {category: ['creating a morph']});

});


});
