avocado.transporter.module.create('lk_programming_environment/slot_morph', function(requires) {

requires('reflection/reflection');
requires('general_ui/table_layout');

}, function(thisModule) {


thisModule.addSlots(avocado.slots, function(add) {
  
  add.creator('userInterface', {}, {category: ['user interface'], comment: 'This object seems like a hack, just using it as a place to store UI-related code for slots.'});
  
});


thisModule.addSlots(avocado.slots.userInterface, function(add) {

  add.creator('defaultStyle', {}, {category: ['styles']});

  add.creator('nonZoomingStyle', {}, {category: ['styles']});

  add.creator('zoomingStyle', {}, {category: ['styles']});

  add.creator('copyDownStyle', {}, {category: ['styles']});

  add.creator('annotationStyle', {}, {category: ['styles']});

  add.creator('sourceMorphStyle', {}, {category: ['styles']});

  add.creator('signatureRowStyle', {}, {category: ['styles']});
  
});


thisModule.addSlots(avocado.slots['abstract'], function(add) {

  add.method('Morph', function Morph() { Class.initializer.apply(this, arguments); }, {category: ['user interface']});

  add.method('newMorph', function () {
    return new this.Morph(this);
  }, {category: ['user interface']});

  add.method('newAnnotationMorph', function () {
    // aaa - It'd be nice if we could just as the annotation for its own morph, but for now we
    // still have to ask the slot for its annotation-related info (because, for one thing, there's
    // that organization object in between).
    var m = avocado.table.newTableMorph().beInvisible().applyStyle(avocado.slots.userInterface.annotationStyle);
    m.replaceContentWith(avocado.table.contents.createWithRows([
      [avocado.label.newMorphFor("Comment:"      ), new avocado.TextMorphRequiringExplicitAcceptance(avocado.accessors.forMethods(this, 'comment'))],
      [avocado.label.newMorphFor("Module:"       ), new avocado.TextMorphRequiringExplicitAcceptance(avocado.accessors.forMethods(this, 'moduleName'))],
      [avocado.label.newMorphFor("Initialize to:"), new avocado.TextMorphRequiringExplicitAcceptance(avocado.accessors.forMethods(this, 'initializationExpression'))]
    ]));
    return m;
  }, {category: ['user interface']});

  add.data('isImmutableForMorphIdentity', true, {category: ['user interface']});

  add.method('showInSitu', function (inSituCommand) {
    avocado.ui.showNextTo(inSituCommand, this.holder(), function() {
      avocado.ui.ensureVisible(this);
    }.bind(this));
  }, {category: ['user interface', 'slices']});

  add.method('createMorphsForSearchResults', function () {
    var inSituCommand = avocado.command.create("in situ", function() { this.showInSitu(inSituCommand); }.bind(this));
    return [avocado.label.newMorphFor(this.holder().name()), this.newMorph(), avocado.ui.currentWorld().morphFor(inSituCommand)];
  }, {category: ['user interface', 'slices']});
  
  add.method('copyForGrabbing', function () {
    return this.copyToNewHolder();
  }, {category: ['user interface']});

  add.data('shouldCopyToNewHolderWhenDroppedOnWorld', true, {category: ['user interface']});

});


thisModule.addSlots(avocado.slots['abstract'].Morph, function(add) {

  add.data('superclass', Morph);

  add.data('type', 'avocado.slots.abstract.Morph');

  add.creator('pointer', {});

  add.creator('prototype', Object.create(Morph.prototype));

});


thisModule.addSlots(avocado.slots['abstract'].Morph.prototype, function(add) {

  add.data('constructor', avocado.slots['abstract'].Morph);
  
  add.method('initialize', function ($super, slot) {
    $super(lively.scene.Rectangle.createWithIrrelevantExtent());
    this.useTableLayout(avocado.table.contents.columnPrototype);
    this._model = slot;

    this.applyStyle(avocado.slots.userInterface.defaultStyle);
    this.applyStyle(this.shouldUseZooming() ? avocado.slots.userInterface.zoomingStyle : avocado.slots.userInterface.nonZoomingStyle);
    this.applyAppropriateStyles();

    add.data('fill', null);

    add.data('fillBase', new Color(0.8, 0.8, 0.8));

    var optionalCommentButtonMorph;
    if (slot.annotationIfAny) {
      var annotationRow = this.createRow(function() { return this.createAnnotationMorph(); }.bind(this).memoize());
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
        this.createContentsPointerPane.bind(this).memoize()
      ], function() {
        return (this.slot().type() && this.slot().type().canCreateInputMorph()) ? 0 : (this.slot().shouldBeShownAsJustSourceCode() ? 1 : (this.slot().shouldBeShownAsContainingItsContents() ? 2 : 3));
      }.bind(this)).applyStyle({horizontalLayoutMode: avocado.LayoutModes.SpaceFill});
      //}.bind(this), this, 1.5, pt(10,10));
      signatureRowContent = [this.descriptionMorph(), avocado.ui.createSpacer(), this._annotationToggler].compact();
    } else {
      this._sourceToggler = avocado.morphToggler.create(this, this.createRow(function() {return this.sourcePane();}.bind(this)));
      var buttonChooserMorph = Morph.createEitherOrMorph([
        this.sourceButton(),
        this.contentsPointerButton()
      ], function() {
        return this.slot().shouldBeShownAsJustSourceCode() ? 0 : 1;
      }.bind(this));
      signatureRowContent = [this.descriptionMorph(), optionalCommentButtonMorph, avocado.ui.createSpacer(), buttonChooserMorph].compact();
    }

    this._signatureRow = avocado.table.createSpaceFillingRowMorph(function () { return signatureRowContent; }, avocado.slots.userInterface.signatureRowStyle.padding);
    
    this.refreshContentOfMeAndSubmorphs(); // wasn't needed back when slot morphs were always part of a table morph, but now that we have free-form layout we need it
  }, {category: ['creating']});
  
  add.method('slot', function () { return this._model; }, {category: ['accessing']});

  add.method('shouldUseZooming', function () {
    return avocado.shouldMirrorsUseZooming;
  }, {category: ['zooming']});

  add.method('showContentsArrow', function (callWhenDone) {
    if (this._contentsPointerButton) {
      this._contentsPointerButton.arrow.showMe(callWhenDone);
    }
  }, {category: ['contents']});

  add.method('contentsPointerButton', function () {
    return this._contentsPointerButton || (this._contentsPointerButton = this.constructor.pointer.create(this).newMorph());
  }, {category: ['contents']});

  add.method('createContentsPointerPane', function () {
    var m = avocado.table.newRowMorph().beInvisible().applyStyle({horizontalLayoutMode: avocado.LayoutModes.SpaceFill});
    m.layout().setCells([Morph.wrapToTakeUpConstantHeight(10, this.sourcePane()), avocado.ui.createSpacer(), this.contentsPointerButton()]);
    m.typeName = 'slot contents pointer pane';
    return m;
  }, {category: ['contents']});

  add.method('sourceButton', function () {
    var sourceIcon = Morph.makePolygon([pt(0,0), pt(8,0), pt(8,8), pt(0,8), pt(0,0), pt(0,2), pt(8,2), pt(0,2)], 1, Color.black, null).ignoreEvents();
    
    return this._sourceButton || (this._sourceButton = this._sourceToggler.commandForToggling("code").newMorph(sourceIcon, 1, pt(3,3)));
  }, {category: ['source']});

  add.method('createRow', function (getOrCreateContent) {
    // Blecch, functions everywhere. But creating the row is expensive. Find a cleaner way to cache them.
    // Or even get rid of them, use the contents directly; the problem with that is that we can't make
    // TextMorphs SpaceFill yet.
    var p = avocado.slots.userInterface.defaultStyle.internalPadding;
    var row = null;
    return function() {
      if (row) { return row; }
      var spacer = avocado.ui.createSpacer();
      row = avocado.table.createSpaceFillingRowMorph(function() {return [getOrCreateContent(), spacer];}, p);
      row.wasJustAdded = function(evt) { getOrCreateContent().requestKeyboardFocus(evt.hand); };
      return row;
    }.bind(this);
  }, {category: ['creating']});
  
  add.method('titleAccessors', function () {
    // aaa - This could go on the model if setSlotName could.
    if (!window.isInCodeOrganizingMode && typeof(this._model.rename) === 'function') {
      return avocado.accessors.forMethods(this, 'slotName');
    } else {
      return null;
    }
  }, {category: ['signature']});

  add.method('nameMorph', function () {
    var m = this._titleLabelMorph;
    if (!m) {
      this._titleLabelMorph = m = this.createTitleLabel() || avocado.label.newMorphFor(this.slotName());
    }
    return m;
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
    sm = this._sourceMorph = new avocado.TextMorphRequiringExplicitAcceptance(avocado.accessors.forMethods(this, 'sourceCode')).applyStyle(avocado.slots.userInterface.sourceMorphStyle);
    if (this.shouldUseZooming()) { sm._maxSpace = pt(200,200); }
    return sm;
  }, {category: ['source']});

  add.method('createAnnotationMorph', function () {
    var m = this.slot().newAnnotationMorph();
    if (this.shouldUseZooming()) { m.setScale(0.2); }
    return m;
  }, {category: ['annotation']});

  add.method('wasJustAdded', function (evt) {
    this.ensureVisible();
    
    // aaa - this middle part of the method is what's different from the general Morph version.
    if (this.shouldUseZooming()) {
      // Make it auto-zoom in?
    } else {
      if (this._sourceToggler) {
        this._sourceToggler.beOn(evt);
      }
    }
    
    this._titleLabelMorph.wasJustAdded(evt);
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
          world.forgetAboutExistingMorphFor(this.slot(), this);
          
          newSlotMorph.justChangedSlotName(evt);
          if (holderMorph.shouldUseZooming()) {
            // aaa - this shouldn't stay here in the long run, I think, but for now I just want everything to stay lined up nicely
            avocado.ui.justChangedContent(newSlot.category(), evt);
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
    if (! this.slot().isReallyPartOfHolder()) { this.applyStyle(avocado.slots.userInterface.copyDownStyle); }
  }, {category: ['updating']});

  add.method('potentialContentMorphs', function () {
    if (! this._potentialContentMorphs) {
      if (this.shouldUseZooming()) {
        this._potentialContentMorphs = avocado.table.contents.createWithColumns([[this._signatureRow, this._contentsChooserMorph]]);
      } else {
        this._potentialContentMorphs = avocado.table.contents.createWithColumns([[this._signatureRow, this._annotationToggler, this._sourceToggler].compact()]);
      }
    }
    return this._potentialContentMorphs;
  }, {category: ['updating']});

  add.method('morphsThatNeedToBeVisibleBeforeICanBeVisible', function () {
    var catMorph = avocado.ui.currentWorld().morphFor(this.slot().category());
    return avocado.compositeCollection.create([catMorph.morphsThatNeedToBeVisibleBeforeICanBeVisible(), [catMorph]]);
  }, {category: ['updating']});

  add.method('grabCopyAndRemoveMe', function (evt) {
    this.grabCopy(evt);
    this.slot().remove();
    var holder = this.slot().holder();
    if (holder) { avocado.ui.justChanged(holder); }
  }, {category: ['drag and drop']});
  
  add.method('commands', function () {
    var cmdList = avocado.command.list.create(this);
    
    if (this.slot().isReallyPartOfHolder()) {
      this.addTitleEditingCommandsTo(cmdList);
      
      var isModifiable = !window.isInCodeOrganizingMode;
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


thisModule.addSlots(avocado.slots.userInterface.defaultStyle, function(add) {

  add.data('borderColor', new Color(0.6, 0.6, 0.6));

  add.data('borderWidth', 1);

  add.data('padding', 0);

  add.data('openForDragAndDrop', false);

  add.data('internalPadding', {left: 15, right: 2, top: 2, bottom: 2, between: {x: 0, y: 0}}, {initializeTo: '{left: 15, right: 2, top: 2, bottom: 2, between: {x: 0, y: 0}}'});

});


thisModule.addSlots(avocado.slots.userInterface.nonZoomingStyle, function(add) {

  add.data('fill', null);
  
  add.data('suppressGrabbing', true);

  add.data('grabsShouldFallThrough', true);

});


thisModule.addSlots(avocado.slots.userInterface.zoomingStyle, function(add) {

  add.data('fillBase', new Color(0.8, 0.8, 0.8));
  
  add.data('suppressGrabbing', false);

  add.data('grabsShouldFallThrough', false);

});


thisModule.addSlots(avocado.slots.userInterface.copyDownStyle, function(add) {

  add.data('fillBase', new Color(0.95, 0.75, 0.75));

});


thisModule.addSlots(avocado.slots.userInterface.annotationStyle, function(add) {

  add.data('horizontalLayoutMode', avocado.LayoutModes.SpaceFill);

  add.data('padding', {left: 0, right: 0, top: 0, bottom: 0, between: {x: 2, y: 2}}, {initializeTo: '{left: 0, right: 0, top: 0, bottom: 0, between: {x: 2, y: 2}}'});

});


thisModule.addSlots(avocado.slots.userInterface.sourceMorphStyle, function(add) {

  add.data('fontFamily', 'monospace');

  add.data('suppressHandles', true);

});


thisModule.addSlots(avocado.slots.userInterface.signatureRowStyle, function(add) {

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
