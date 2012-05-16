avocado.transporter.module.create('programming_environment/slot_morph', function(requires) {

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

  add.creator('morphMixin_aaa_becauseIDoNotFeelLikeGeneralizingTheseMethodsRightNow', {}, {category: ['constructing morphs']});

  add.method('newMorphFor', function (slot) {
    var slotMorph = avocado.ui.newMorph();
    
    Object.extend(slotMorph, this.morphMixin_aaa_becauseIDoNotFeelLikeGeneralizingTheseMethodsRightNow);
    
    var shouldUseZooming = !!avocado.ui.shouldMirrorsUseZooming;
    slotMorph._shouldUseZooming = shouldUseZooming;
    slotMorph.useTableLayout(avocado.table.contents.columnPrototype);
    slotMorph.setModel(slot);

    slotMorph.applyStyle(avocado.slots.userInterface.defaultStyle);
    slotMorph.applyStyle(shouldUseZooming ? avocado.slots.userInterface.zoomingStyle : avocado.slots.userInterface.nonZoomingStyle);
    slotMorph.updateStyle();

    var optionalCommentButtonMorph;
    if (slot.annotationIfAny) {
      var annotationRow = avocado.slots.userInterface.createRow(function() { return avocado.slots.userInterface.createAnnotationMorphFor(slotMorph); }.memoize());
      if (shouldUseZooming) {
        slotMorph._annotationToggler = avocado.scaleBasedMorphHider.create(slotMorph, annotationRow, slotMorph, 4, pt(50,25)); // aaa made-up space-holder-size number
      } else {
        slotMorph._annotationToggler = avocado.morphToggler.create(slotMorph, annotationRow);

        var commentButton = slotMorph._annotationToggler.commandForToggling('my comment', "'...'").newMorph();
        optionalCommentButtonMorph = avocado.table.createOptionalMorph(commentButton, function() { return slotMorph._annotationToggler.isOn() || (slot.comment && slot.comment()); });
      }
    }
    
    var getOrCreateSourcePane = function() { return avocado.slots.userInterface.createSourceMorphFor(slotMorph); }.memoize();
    
    var descriptionMorph = slot.createDescriptionMorphFor(slotMorph);

    var signatureRowContent, contentsChooserMorph;
    if (shouldUseZooming) {
      /* aaa why does this produce weird shrinking behaviour?   avocado.scaleBasedMorphHider.create(slotMorph, function() { */
      contentsChooserMorph = avocado.table.createEitherOrMorph([
        function() { return avocado.slots.userInterface.createTypeSpecificInputMorphForSlot(slot); }.memoize(),
        function() { return avocado.table.wrapToTakeUpConstantSpace(pt(100, 50), getOrCreateSourcePane()); }.memoize(),
        function() {
          var contentsMorph = avocado.ui.currentWorld().morphFor(slot.contents());
          contentsMorph.setScale(0.65);
          contentsMorph.refreshContentOfMeAndSubmorphsIfNeverRefreshedBefore();
          return contentsMorph;
        },
        function() { return avocado.slots.userInterface.createContentsPointerPaneFor(slotMorph, getOrCreateSourcePane()); }.memoize()
      ], function() {
        return (slot.type() && slot.type().canCreateInputMorph && slot.type().canCreateInputMorph()) ? 0 : (slot.shouldBeShownAsJustSourceCode() ? 1 : (slot.shouldBeShownAsContainingItsContents() ? 2 : 3));
      }).applyStyle({horizontalLayoutMode: avocado.LayoutModes.SpaceFill});
      //}, slotMorph, 1.5, pt(10,10));
      signatureRowContent = [descriptionMorph, avocado.ui.createSpacer(), slotMorph._annotationToggler].compact();
    } else {
      slotMorph._sourceToggler = avocado.morphToggler.create(slotMorph, avocado.slots.userInterface.createRow(getOrCreateSourcePane));
      var buttonChooserMorph = avocado.table.createEitherOrMorph([
        slotMorph._sourceToggler.commandForToggling("code").newMorph(avocado.slots.userInterface.createSourceButtonIcon(), 1, pt(3,3)),
        slotMorph.contentsPointerButton()
      ], function() {
        return slotMorph._model.shouldBeShownAsJustSourceCode() ? 0 : 1;
      });
      signatureRowContent = [descriptionMorph, optionalCommentButtonMorph, avocado.ui.createSpacer(), buttonChooserMorph].compact();
    }

    var signatureRow = avocado.table.createSpaceFillingRowMorph(function () { return signatureRowContent; }, avocado.slots.userInterface.signatureRowStyle.padding);

    if (shouldUseZooming) {
      slotMorph.setPotentialContentMorphs(avocado.table.contents.createWithColumns([[signatureRow, contentsChooserMorph]]));
    } else {
      slotMorph.setPotentialContentMorphs(avocado.table.contents.createWithColumns([[signatureRow, slotMorph._annotationToggler, slotMorph._sourceToggler].compact()]));
    }
    
    slotMorph.refreshContentOfMeAndSubmorphs(); // wasn't needed back when slot morphs were always part of a table morph, but now that we have free-form layout we need it
    return slotMorph;
  }, {category: ['constructing morphs']});

  add.method('createSourceButtonIcon', function () {
    return Morph.makePolygon([pt(0,0), pt(8,0), pt(8,8), pt(0,8), pt(0,0), pt(0,2), pt(8,2), pt(0,2)], 1, Color.black, null).ignoreEvents();
  }, {category: ['constructing morphs']});

  add.method('createContentsPointerPaneFor', function (slotMorph, sourcePane) {
    var m = avocado.table.newRowMorph().beInvisible().applyStyle({horizontalLayoutMode: avocado.LayoutModes.SpaceFill});
    /* aaa delete this after the new placeholder way works
    m.layout().setCells([avocado.table.wrapToTakeUpConstantHeight(10, sourcePane), avocado.ui.createSpacer(), slotMorph.contentsPointerButton()]);
    */
    // aaa - why do I need to wrap it in this row morph? if I don't, the actualMorphToShow placeholder mechanism messes up, but maybe I can fix that.
    m.layout().setCells([avocado.ui.createSpacer(), slotMorph.contentsPointerButton(), avocado.ui.createSpacer()]);
    return m;
  }, {category: ['constructing morphs']});

  add.method('createSourceMorphFor', function (slotMorph) {
    var sm = avocado.frequentlyEditedText.newMorphFor(avocado.accessors.forMethods(slotMorph._model, 'sourceCode'));
    sm.applyStyle(avocado.slots.userInterface.sourceMorphStyle);
    sm.rememberThatSavedTextMightNotBeIdenticalToWhatWasTyped();
    slotMorph.findOrCreateTitleLabel()._nextMorphToReceiveInputFocusForwards = sm;
    if (slotMorph._shouldUseZooming) { sm._maxSpace = pt(200,200); }
    return sm.wrappedInScrollPaneIfNecessaryToFitWithin(pt(400,300));
  }, {category: ['constructing morphs']});

  add.method('createAnnotationMorphFor', function (slotMorph) {
    var m = slotMorph._model.newAnnotationMorph();
    if (slotMorph._shouldUseZooming) { m.setScale(0.2); }
    return m;
  }, {category: ['constructing morphs']});

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
    };
  }, {category: ['constructing morphs']});

  add.method('createTypeSpecificInputMorphForSlot', function (slot) {
    var t = slot.type();
    return t ? t.createInputMorph(slot) : null;
  }, {category: ['constructing morphs']});

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


thisModule.addSlots(avocado.slots.userInterface.morphMixin_aaa_becauseIDoNotFeelLikeGeneralizingTheseMethodsRightNow, function(add) {

  add.method('contentsPointerButton', function () {
    return this._contentsPointerButton || (this._contentsPointerButton = avocado.arrow.createButtonForToggling(this._model));
  }, {category: ['contents']});

  add.data('desiredUIStateAfterBeingAdded', {isSourceOpen: true}, {category: ['events'], initializeTo: '{isSourceOpen: true}'});

  add.method('partsOfUIState', function () {
    return {
      isSourceOpen:     this._sourceToggler,
      isAnnotationOpen: this._annotationToggler,
      isArrowVisible:   this._contentsPointerButton ? this._contentsPointerButton._arrow : null
    };
  }, {category: ['UI state']});

  add.method('updateStyle', function () {
    if (! this._model.isReallyPartOfHolder()) { this.applyStyle(avocado.slots.userInterface.copyDownStyle); }
  }, {category: ['updating']});

  add.method('morphsThatNeedToBeVisibleBeforeICanBeVisible', function () {
    var catMorph = avocado.ui.currentWorld().morphFor(this._model.category());
    return avocado.compositeCollection.create([catMorph.morphsThatNeedToBeVisibleBeforeICanBeVisible(), [catMorph]]);
  }, {category: ['updating']});

  add.method('grabCopyAndRemoveMe', function (evt) {
    this.grabCopy(evt);
    this._model.remove();
    var holder = this._model.holder();
    if (holder) { avocado.ui.justChanged(holder); }
  }, {category: ['drag and drop']});

  add.method('commands', function () {
    var cmdList = avocado.command.list.create(this);
    
    if (this._model.isReallyPartOfHolder()) {
      this.addTitleEditingCommandsTo(cmdList);
      
      var isModifiable = !window.isInCodeOrganizingMode;
      cmdList.addItem(avocado.command.create(isModifiable ? "copy" : "move", function(evt) { this.grabCopy(evt); }).onlyApplicableIf(function() { return this._model.copyTo; }.bind(this)));
      cmdList.addItem(avocado.command.create("move", function(evt) { this.grabCopyAndRemoveMe(evt); }).onlyApplicableIf(function() { return isModifiable && this._model.remove; }.bind(this)));
      if (! this._shouldUseZooming) {
        if (this._sourceToggler) { cmdList.addItem(this._sourceToggler.commandForToggling("contents")); }
        if (this._annotationToggler) { cmdList.addItem(this._annotationToggler.commandForToggling("annotation").onlyApplicableIf(function() {return this._model.annotationIfAny; }.bind(this))); }
      }
    }
    
    cmdList.addAllCommands(this._model.commands().wrapWithPromptersForArguments().wrapForMorph(this));
    
    return cmdList;
  }, {category: ['menu']});

});


thisModule.addSlots(avocado.slots['abstract'], function(add) {

  add.method('newMorph', function () {
    return avocado.slots.userInterface.newMorphFor(this);
  }, {category: ['user interface']});

  add.method('newAnnotationMorph', function () {
    // aaa - It'd be nice if we could just as the annotation for its own morph, but for now we
    // still have to ask the slot for its annotation-related info (because, for one thing, there's
    // that organization object in between).
    var m = avocado.table.newTableMorph().beInvisible().applyStyle(avocado.slots.userInterface.annotationStyle);
    m.replaceContentWith(avocado.table.contents.createWithRows([
      [avocado.label.newMorphFor("Comment:"      ), avocado.frequentlyEditedText.newMorphFor(avocado.accessors.forMethods(this, 'comment'))],
      [avocado.label.newMorphFor("Module:"       ), avocado.frequentlyEditedText.newMorphFor(avocado.accessors.forMethods(this, 'moduleName'))],
      [avocado.label.newMorphFor("Initialize to:"), avocado.frequentlyEditedText.newMorphFor(avocado.accessors.forMethods(this, 'initializationExpression'))]
    ]));
    return m;
  }, {category: ['user interface']});

  add.method('createDescriptionMorphFor', function (slotMorph) {
    // override for kinds of slots that have more to describe (like process contexts)
    return slotMorph.findOrCreateTitleLabel();
  }, {category: ['user interface']});

  add.data('isImmutableForMorphIdentity', true, {category: ['user interface']});

  add.method('arrowTargetType', function () {
    return avocado.types.mirror;
  }, {category: ['user interface']});

  add.method('titleAccessors', function () {
    if (!window.isInCodeOrganizingMode) {
      return avocado.accessors.forMethods(this, 'title');
    } else {
      return null;
    }
  }, {category: ['signature']});

  add.method('title', function () { return this.readableName(); }, {category: ['signature']});

  add.method('setTitle', function (newName, evt) {
    evt = evt || Event.createFake();
    avocado.ui.showMessageIfErrorDuring(function() {
      var newSlot = this.rename(newName);
      var holder = this.holder();
      if (holder) {
        var world = avocado.ui.worldFor(evt);
        var holderMorph = world.existingMorphFor(holder);
        if (holderMorph) {
          holderMorph.refreshContentOfMeAndSubmorphs();

          // it's actually a whole nother slot and slotMorph but we want it to feel like the same one
          var newSlotMorph = avocado.ui.transferUIState(this, newSlot, evt);
          
          newSlotMorph._titleLabelMorph.passOnInputFocus(evt.hand); // aaa shouldn't reference _titleLabelMorph

          avocado.ui.justChangedContent(newSlot.category(), evt);
        }
      }
    }.bind(this), evt);
  }, {category: ['signature']});

  add.method('explicitlySetContents', function (c, evt) {
    this.setContents(c);
    this.justExplicitlySetContents(evt);
    
    // Not sure this is really what I want, but I think I don't like it when the
    // source keeps taking up space after I edit it, at least if it's data rather
    // than a method. (The method I'm likely to be editing again. But editing the
    // source of a data slot is usually just done when initially creating the
    // slot.)
    if (! this.shouldBeShownAsJustSourceCode()) {
      var m = avocado.ui.worldFor(evt).existingMorphFor(this);
      if (m) { m.assumeUIState({isSourceOpen: false}, null, evt); }
    }

    avocado.ui.justChanged(this);
  }, {category: ['user interface']});

  add.method('setSourceCode', function (s) {
    this.explicitlySetContents(this.newContentsForSourceCode(s));
  }, {category: ['accessing']});

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


thisModule.addSlots(avocado.valueHolder, function(add) {

  add.method('newMorph', function () {
    // Let's try this. A valueHolder is like a slot.
    return avocado.slots.userInterface.newMorphFor(this);
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

  add.method('explicitlySetContents', function (c, evt) {
    // aaa - blecch, maybe I should just make valueHolders have a common parent with slots.
    avocado.slots['abstract'].explicitlySetContents.call(this, c, evt);
  }, {category: ['pretending to be a slot']});

  add.method('justExplicitlySetContents', function (evt) {
    // nothing necessary here;
  }, {category: ['pretending to be a slot']});

  add.method('shouldBeShownAsContainingItsContents', function () {
    return false;
  }, {category: ['pretending to be a slot']});

  add.method('sourceCode', function () {
    return '' + this.contents();
  }, {category: ['pretending to be a slot']});

  add.method('setSourceCode', function (s) {
    this.explicitlySetContents(this.newContentsForSourceCode(s));
  }, {category: ['pretending to be a slot']});

  add.method('canSetContentsFromSourceCode', function () {
    var type = this.type();
    return type && typeof(type.objectForString) === 'function';
  }, {category: ['pretending to be a slot']});

  add.method('newContentsForSourceCode', function (s) {
    if (this.canSetContentsFromSourceCode()) {
      return this.type().objectForString(s);
    }
    throw new Error("Don't know how to set the contents of " + this + " from a string.");
  }, {category: ['pretending to be a slot']});

  add.method('createDescriptionMorphFor', function (slotMorph) {
    return slotMorph.findOrCreateTitleLabel();
  }, {category: ['pretending to be a slot']});

  add.method('titleAccessors', function () {
    return avocado.accessors.forMethods(this, 'title');
  }, {category: ['pretending to be a slot']});

  add.method('arrowTargetType', function () {
    return this.type();
  }, {category: ['pretending to be a slot']});

});


});
