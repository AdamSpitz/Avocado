avocado.transporter.module.create('lk_programming_environment/slot_morph', function(requires) {

requires('reflection/reflection');
requires('lk_ext/rows_and_columns');

}, function(thisModule) {


thisModule.addSlots(avocado.slots['abstract'], function(add) {

  add.method('Morph', function Morph() { Class.initializer.apply(this, arguments); }, {category: ['user interface']});

  add.method('newMorph', function () {
    return new this.Morph(this);
  }, {category: ['user interface']});

  add.method('newAnnotationMorph', function () {
    // aaa - It'd be nice if we could just as the annotation for its own morph, but for now we
    // still have to ask the slot for its annotation-related info (because, for one thing, there's
    // that organization object in between).
    var m = new avocado.TableMorph().beInvisible().applyStyle(this.Morph.prototype.annotationStyle);
    m.replaceContentWith(avocado.tableContents.createWithRows([
      [TextMorph.createLabel("Comment:"      ), new avocado.TextMorphRequiringExplicitAcceptance(avocado.accessors.forMethods(this, 'comment'))],
      [TextMorph.createLabel("Module:"       ), new avocado.TextMorphRequiringExplicitAcceptance(avocado.accessors.forMethods(this, 'moduleName'))],
      [TextMorph.createLabel("Initialize to:"), new avocado.TextMorphRequiringExplicitAcceptance(avocado.accessors.forMethods(this, 'initializationExpression'))]
    ]));
    return m;
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

    this.applyAppropriateStyles();

    var optionalCommentButtonMorph;
    if (slot.annotationIfAny) {
      var annotationRow = this.createRow(function() { return this.annotationMorph(); }.bind(this));
      if (this.shouldUseZooming()) {
        this._annotationToggler = avocado.scaleBasedMorphHider.create(this, annotationRow, this, 4, pt(50,25)); // aaa made-up space-holder-size number
      } else {
        this._annotationToggler = avocado.morphToggler.create(this, annotationRow);

        var commentButton = this._annotationToggler.commandForToggling('my comment', "'...'").newMorph();
        optionalCommentButtonMorph = Morph.createOptionalMorph(commentButton, function() { return this._annotationToggler.isOn() || (this.slot().comment && this.slot().comment()); }.bind(this));
      }
    }

    var signatureRowContent;
    if (this.shouldUseZooming()) {
      /* aaa why does this produce weird shrinking behaviour?   avocado.scaleBasedMorphHider.create(this, function() { */
      this._contentsChooserMorph = Morph.createEitherOrMorph([
        this.typeSpecificInputMorph.bind(this),
        function() { return Morph.wrapToTakeUpConstantSpace(pt(100, 50), this.sourcePane()); }.bind(this).memoize(),
        function() {
          var contentsMorph = WorldMorph.current().morphFor(slot.contents());
          contentsMorph.setScale(0.65);
          contentsMorph.refreshContentOfMeAndSubmorphsIfNeverRefreshedBefore();
          return contentsMorph;
        },
        this.contentsPointerPane.bind(this)
      ], function() {
        return (this.slot().type() && this.slot().type().canCreateInputMorph()) ? 0 : (this.slot().shouldBeShownAsJustSourceCode() ? 1 : (this.slot().shouldBeShownAsContainingItsContents() ? 2 : 3));
      }.bind(this)).applyStyle({horizontalLayoutMode: avocado.LayoutModes.SpaceFill});
      //}.bind(this), this, 1.5, pt(10,10));
      signatureRowContent = [this.descriptionMorph(), Morph.createSpacer(), this._annotationToggler].compact();
    } else {
      this._sourceToggler = avocado.morphToggler.create(this, this.createRow(function() {return this.sourcePane();}.bind(this)));
      var buttonChooserMorph = Morph.createEitherOrMorph([
        this.sourceButton(),
        this.contentsPointerButton()
      ], function() {
        return this.slot().shouldBeShownAsJustSourceCode() ? 0 : 1;
      }.bind(this));
      signatureRowContent = [this.descriptionMorph(), optionalCommentButtonMorph, Morph.createSpacer(), buttonChooserMorph].compact();
    }

    this._signatureRow = avocado.RowMorph.createSpaceFilling(function () { return signatureRowContent; }, this.signatureRowStyle.padding);
    
    this.refreshContentOfMeAndSubmorphs(); // wasn't needed back when slot morphs were always part of a table morph, but now that we have free-form layout we need it
  }, {category: ['creating']});

  add.method('slot', function () { return this._model; }, {category: ['accessing']});

  add.method('toString', function () { return this.slot().toString(); }, {category: ['accessing']});

  add.method('shouldUseZooming', function () {
    return avocado.shouldMirrorsUseZooming;
  }, {category: ['zooming']});

  add.creator('defaultStyle', {}, {category: ['styles']});

  add.creator('nonZoomingStyle', {}, {category: ['styles']});

  add.creator('zoomingStyle', {}, {category: ['styles']});

  add.creator('copyDownStyle', {}, {category: ['styles']});

  add.creator('grabbedStyle', {}, {category: ['styles']});

  add.creator('annotationStyle', {}, {category: ['styles']});

  add.creator('sourceMorphStyle', {}, {category: ['styles']});

  add.creator('signatureRowStyle', {}, {category: ['styles']});

  add.method('showContentsArrow', function (callWhenDone) {
    if (this._contentsPointerButton) {
      this._contentsPointerButton.arrow.showMe(callWhenDone);
    }
  }, {category: ['contents']});

  add.method('pushContentsPointerButton', function () {
    // aaa - why do we have both this and showContentsArrow?
    if (this._contentsPointerButton) {
      this._contentsPointerButton.pushMe();
    }
  }, {category: ['contents']});

  add.method('contentsPointerButton', function () {
    return this._contentsPointerButton || (this._contentsPointerButton = this.constructor.pointer.create(this).newMorph());
  }, {category: ['contents']});

  add.method('contentsPointerPane', function () {
    if (! this._contentsPointerPane) {
      this._contentsPointerPane = avocado.TableMorph.newRow().beInvisible().applyStyle({horizontalLayoutMode: avocado.LayoutModes.SpaceFill});
      this._contentsPointerPane.setColumns([Morph.wrapToTakeUpConstantHeight(10, this.sourcePane()), Morph.createSpacer(), this.contentsPointerButton()]);
      this._contentsPointerPane.typeName = 'slot contents pointer pane';
    }
    return this._contentsPointerPane;
  }, {category: ['contents']});

  add.method('sourceButton', function () {
    // Let's try making the icon as a polygon morph rather than using the old GIF image.
    // var sourceIcon = this.createIconForButton("images/icon-method-slot.gif");
    var sourceIcon = Morph.makePolygon([pt(0,0), pt(8,0), pt(8,8), pt(0,8), pt(0,0), pt(0,2), pt(8,2), pt(0,2)], 1, Color.black, null).ignoreEvents();
    
    return this._sourceButton || (this._sourceButton = this._sourceToggler.commandForToggling("code").newMorph(sourceIcon, 1, pt(3,3)));
  }, {category: ['source']});

  add.method('createIconForButton', function (path) {
    return new ImageMorph(pt(10,10).extentAsRectangle(), (avocado.transporter.avocadoBaseURL || "") + path).beLabel();
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
  
  add.method('typeSpecificInputMorph', function () {
    var t = this.slot().type();
    if (!t) {
      this._typeSpecificInputMorph = null;
    } else {
      if (! this._typeSpecificInputMorph) {
        this._typeSpecificInputMorph = t.createInputMorph(this.slot());
      }
    }
    return this._typeSpecificInputMorph;
  }, {category: ['type-specific input']});

  add.method('sourcePane', function () {
    var sp = this._sourcePane;
    if (sp) { return sp; }
    sp = this._sourcePane = ScrollPane.ifNecessaryToContain(this.sourceMorph(), pt(400,300));
    //if (this.shouldUseZooming()) { this.sourcePane().setScale(this.slot().shouldBeShownAsJustSourceCode() ? 0.9 : 0.3); }
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
    m = this._annotationMorph = this.slot().newAnnotationMorph();
    if (this.shouldUseZooming()) { m.setScale(0.2); }
    return m;
  }, {category: ['annotation']});

  add.method('wasJustShown', function (evt) {
    if (this.shouldUseZooming()) {
      // I don't like this; let's make it auto-zoom in instead.
      // this.sourcePane().setScale(0.9);
    } else {
      if (this._sourceToggler) {
        this._sourceToggler.beOn(evt);
      }
    }
    this._nameMorph.wasJustShown(evt);
  }, {category: ['events']});

  add.method('sourceCode', function () {
    return this.slot().sourceCode();
  }, {category: ['accessing']});

  add.method('setSourceCode', function (s) {
    this.setContents(this.slot().newContentsForSourceCode(s));

    // Sometimes the text doesn't come out quite identical; this makes sure the
    // source editor doesn't stay red.
    this._sourceMorph.cancelChanges();
  }, {category: ['accessing']});

  add.method('showContents', function (callWhenContentsAreVisible) {
    var w = this.world() || WorldMorph.current();
    var mir = this.slot().contents();
    var mirMorph = w.morphFor(mir);
    mirMorph.smoothlyScaleTo(1 / w.getScale()); // aaa - not sure this is a good idea, but maybe
    mirMorph.ensureIsInWorld(w, this.worldPoint(pt(this.getExtent().x + 125, 0)), false, true, true, callWhenContentsAreVisible);
  }, {category: ['contents']});

  add.method('makeSourcePaneLessObtrusiveIfUnlikelyToBeNeeded', function (evt) {
    // Not sure this is really what I want, but I think I don't like it when the
    // source keeps taking up space after I edit it, at least if it's data rather
    // than a method. (The method I'm likely to be editing again. But editing the
    // source of a data slot is usually just done when initially creating the
    // slot.)
    
    if (! this.shouldUseZooming()) {
      if (this._sourceToggler) {
        if (! this.slot().shouldBeShownAsJustSourceCode()) { this._sourceToggler.beOff(evt); }
      }
    }
  }, {category: ['contents']});

  add.method('setContents', function (c, evt) {
    this.slot().setContents(c);
    this.slot().justExplicitlySetContents(evt);
    
    this.makeSourcePaneLessObtrusiveIfUnlikelyToBeNeeded(evt);

    avocado.ui.justChanged(this.slot());
  }, {category: ['accessing']});

  add.method('slotName', function () { return this.slot().readableName(); }, {category: ['accessing']});

  add.method('setSlotName', function (newName, evt) {
    evt = evt || Event.createFake();
    var world = avocado.ui.worldFor(evt);
    avocado.ui.showMessageIfErrorDuring(function() {
      var newSlot = this.slot().rename(newName);
      var holder = this.slot().holder();
      if (holder) {
        var holderMorph = world.existingMorphFor(holder);
        if (holderMorph) {
          holderMorph.refreshContentOfMeAndSubmorphs();

          // it's actually a whole nother slot and slotMorph but we want it to feel like the same one
          var newSlotMorph = world.morphFor(newSlot);
          this.transferUIStateTo(newSlotMorph);
          newSlotMorph.justChangedSlotName(evt);
          this.justBecameObsolete();
          if (holderMorph.shouldUseZooming()) {
            // aaa - this shouldn't stay here in the long run, I think, but for now I just want everything to stay lined up nicely
            world.morphFor(newSlot.category()).cleanUp(evt, true);
          }
        }
      }
    }.bind(this), evt);
  }, {category: ['accessing']});

  add.method('justChangedSlotName', function (evt) {
    var nextThingTheUserProbablyWantsToDo = this._sourceMorph;
    if (nextThingTheUserProbablyWantsToDo) {
      nextThingTheUserProbablyWantsToDo.prepareForUserInput(evt);
    }
  }, {category: ['accessing']});

  add.method('justBecameObsolete', function () {
    WorldMorph.current().forgetAboutExistingMorphFor(this.slot(), this);
  }, {category: ['renaming']});

  add.method('partsOfUIState', function () {
    return {
      isSourceOpen:     this._sourceToggler,
      isAnnotationOpen: this._annotationToggler,
      isArrowVisible:   this._contentsPointerButton ? this._contentsPointerButton.arrow : null
    };
  }, {category: ['UI state']});

  add.method('updateFill', function () {
    this.applyAppropriateStyles();
  }, {category: ['updating']});

  add.method('applyAppropriateStyles', function () {
    this.applyStyle(this.defaultStyle);
    this.applyStyle(this.shouldUseZooming() ? this.zoomingStyle : this.nonZoomingStyle);
    if (this._explicitStyle) { this.applyStyle(this._explicitStyle); }
    if (! this.slot().isReallyPartOfHolder()) { this.applyStyle(this.copyDownStyle); }
  }, {category: ['updating']});

  add.method('potentialContentMorphs', function () {
    if (! this._potentialContentMorphs) {
      if (this.shouldUseZooming()) {
        this._potentialContentMorphs = avocado.tableContents.createWithColumns([[this._signatureRow, this._contentsChooserMorph]]);
      } else {
        this._potentialContentMorphs = avocado.tableContents.createWithColumns([[this._signatureRow, this._annotationToggler, this._sourceToggler].compact()]);
      }
    }
    return this._potentialContentMorphs;
  }, {category: ['updating']});

  add.method('wasJustDroppedOnWorld', function (world) {
    if (! this._shouldOnlyBeDroppedOnThisParticularMorph || this._shouldOnlyBeDroppedOnThisParticularMorph === world) {
      var newSlot = this.slot().copyToNewHolder();
      var newHolder = newSlot.holder();
      if (newHolder) {
        var newHolderMorph = world.morphFor(newHolder);
        world.addMorphAt(newHolderMorph, this.position());
        newHolderMorph.expandCategory(newSlot.category());
      } else {
        var newSlotMorph = world.morphFor(newSlot);
        world.addMorphAt(newSlotMorph, this.position());
      }
      if (this._shouldDisappearAfterCommandIsFinished) { this.remove(); }
    }
  }, {category: ['drag and drop']});

  add.method('grabCopy', function (evt) {
    var newSlot = this.slot().copyToNewHolder();
    var newSlotMorph = newSlot.newMorph();
    newSlotMorph._explicitStyle = this.grabbedStyle;
    newSlotMorph.refreshContent();
    newSlotMorph.forceLayoutRejiggering();
    newSlotMorph._shouldDisappearAfterCommandIsFinished = true;
    var holder = this.slot().holder();
    if (holder) {
      var holderMorph = avocado.ui.worldFor(evt).existingMorphFor(holder);
      if (holderMorph && ! holderMorph.shouldAllowModification()) { newSlotMorph._shouldOnlyBeDroppedOnThisParticularMorph = holderMorph; }
    }
    evt.hand.grabMorphWithoutAskingPermission(newSlotMorph, evt);
    return newSlotMorph;
  }, {category: ['drag and drop']});

  add.method('grabCopyAndRemoveMe', function (evt) {
    this.grabCopy(evt);
    this.slot().remove();
    var holder = this.slot().holder();
    if (holder) { avocado.ui.justChanged(holder); }
  }, {category: ['drag and drop']});

  add.method('commands', function () {
    var cmdList = avocado.command.list.create(this);
    
    if (this.slot().isReallyPartOfHolder()) {
      var isModifiable = !window.isInCodeOrganizingMode;
      
      if (isModifiable && this.slot().rename) { cmdList.addAllCommands(this._nameMorph.editingCommands()); }
      cmdList.addItem({label: isModifiable ? "copy" : "move", go: function(evt) { this.grabCopy(evt); }, isApplicable: function() { return this.slot().copyTo; }.bind(this)});
      cmdList.addItem({label: "move", go: function(evt) { this.grabCopyAndRemoveMe(evt); }, isApplicable: function() { return isModifiable && this.slot().remove; }.bind(this)});
      if (! this.shouldUseZooming()) {
        if (this._sourceToggler) { cmdList.addItem(this._sourceToggler.commandForToggling("contents")); }
        if (this._annotationToggler) { cmdList.addItem(this._annotationToggler.commandForToggling("annotation").onlyApplicableIf(function() {return this.slot().annotationIfAny; }.bind(this))); }
      }
    }
    
    cmdList.addAllCommands(this.slot().commands().wrapWithPromptersForArguments().wrapForMorph(this));
    
    return cmdList;
  }, {category: ['menu']});

});


thisModule.addSlots(avocado.slots['abstract'].Morph.prototype.defaultStyle, function(add) {

  add.data('borderColor', new Color(0.6, 0.6, 0.6));

  add.data('borderWidth', 1);

  add.data('padding', 0);

  add.data('openForDragAndDrop', false);

  add.data('internalPadding', {left: 15, right: 2, top: 2, bottom: 2, between: {x: 0, y: 0}}, {initializeTo: '{left: 15, right: 2, top: 2, bottom: 2, between: {x: 0, y: 0}}'});

});


thisModule.addSlots(avocado.slots['abstract'].Morph.prototype.nonZoomingStyle, function(add) {

  add.data('fill', null);

  add.data('suppressGrabbing', true);

  add.data('grabsShouldFallThrough', true);

});


thisModule.addSlots(avocado.slots['abstract'].Morph.prototype.zoomingStyle, function(add) {

  add.data('fill', new lively.paint.LinearGradient([new lively.paint.Stop(0, new Color(0.9019607843137255, 0.9019607843137255, 0.9019607843137255)), new lively.paint.Stop(1, new Color(0.8, 0.8, 0.8))], lively.paint.LinearGradient.NorthSouth));

  add.data('suppressGrabbing', false);

  add.data('grabsShouldFallThrough', false);

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

  add.method('labelMorph', function () {
    // Make an "arrow" icon (rather than the old two-dots thing, which was a Self-ism). -- Adam
    // return this._associationMorph.createIconForButton("images/icon-data-slot.gif");
    return Morph.makePolygon([pt(0,5), pt(10,5), pt(5,0), pt(10,5), pt(5,10), pt(10,5)], 1, Color.black, Color.black).ignoreEvents();
  }, {category: ['creating a morph']});

  add.method('inspect', function () { return this.association().name() + " contents"; }, {category: ['printing']});

  add.method('helpTextForShowing', function () { return "Show my contents"; }, {category: ['help text']});

  add.method('helpTextForHiding', function () { return "Hide arrow"; }, {category: ['help text']});

  add.method('prepareToBeShown', function (callWhenDone) { this._associationMorph.showContents(callWhenDone); }, {category: ['showing']});

  add.method('notifiersToUpdateOn', function () {
    var holder = this.association().holder();
    if (! holder) { return []; }
    var holderMorph = WorldMorph.current().existingMorphFor(holder);
    return holderMorph ? [holderMorph.changeNotifier()] : [];
  }, {category: ['updating']});

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


thisModule.addSlots(avocado.valueHolder, function(add) {

  add.method('newMorph', function () {
    // Let's try this. A valueHolder is like a slot.
    return new avocado.slots['abstract'].Morph(this);
  }, {category: ['user interface']});

  add.method('holder', function () {
    return null;
  }, {category: ['pretending to be a slot']});

  add.method('isReallyPartOfHolder', function () {
    return true;
  }, {category: ['pretending to be a slot']});

  add.method('shouldBeShownAsJustSourceCode', function () {
    return false;
  }, {category: ['pretending to be a slot']});

  add.method('contents', function () {
    return this.getValue();
  }, {category: ['pretending to be a slot']});

  add.method('setContents', function (c) {
    this.setValue(c);
  }, {category: ['pretending to be a slot']});

  add.method('shouldBeShownAsContainingItsContents', function () {
    return false;
  }, {category: ['pretending to be a slot']});

  add.method('sourceCode', function () {
    return '' + this.contents();
  }, {category: ['pretending to be a slot']});
  
});


});
