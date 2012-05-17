avocado.transporter.module.create('programming_environment/mirror_morph', function(requires) {

requires('reflection/reflection');
requires('programming_environment/category_morph');
requires('programming_environment/slot_morph');

}, function(thisModule) {


thisModule.addSlots(avocado.mirror, function(add) {

  add.creator('morphMixin_aaa_becauseIDoNotFeelLikeGeneralizingTheseMethodsRightNow', {}, {category: ['user interface']});

  add.method('newMorph', function () {
    var mirMorph = avocado.ui.newMorph().setModel(this).useTableLayout(avocado.table.contents.columnPrototype);
    Object.extend(mirMorph, this.morphMixin_aaa_becauseIDoNotFeelLikeGeneralizingTheseMethodsRightNow);

    var shouldUseZooming = mirMorph._shouldUseZooming = !!avocado.ui.shouldMirrorsUseZooming;

    mirMorph.applyStyle(avocado.mirror.defaultStyle);

    mirMorph._nameMorph = mirMorph.createNameLabel();
    mirMorph._nameMorph.setEmphasis(avocado.label.emphasiseses.bold);
    
    var descLabel = avocado.label.newMorphFor('');
    descLabel.setScale(0.9);
    mirMorph._descMorph = avocado.morphHider.create(mirMorph, [descLabel], function() {
      var s = this.shortDescription();
      descLabel.setText(s);
      return s === '' ? null : 0;
    }.bind(this));

    if (this.canHaveAnnotation() || this.hasAccessibleParent()) {
      var getOrCreateAnnotationRow = function() { return avocado.mirror.morphBuilder.annotationRowFor(this); }.bind(mirMorph);
      
      if (shouldUseZooming) {
        mirMorph._annotationToggler = avocado.scaleBasedMorphHider.create(mirMorph, getOrCreateAnnotationRow, mirMorph, 1, pt(50,10)); // aaa made-up space-holder-size number
      } else {
        mirMorph._annotationToggler = avocado.morphToggler.create(mirMorph, getOrCreateAnnotationRow);
        if (this.canHaveAnnotation()) {
          mirMorph._commentToggler  = avocado.morphToggler.create(mirMorph, function() { return avocado.mirror.morphBuilder.commentRowFor(this); }.bind(mirMorph));
        }
      }
    }

    // mirMorph.refreshContent();   // this used to be here, but I took it out as an optimization; still not quite sure that it isn't needed -- Adam, Apr. 2011

    mirMorph.startPeriodicallyUpdating();
    
    return mirMorph;
  }, {category: ['user interface']});

  add.data('isImmutableForMorphIdentity', true, {category: ['user interface']});

  add.creator('defaultStyle', {}, {category: ['styles']});

  add.creator('annotationStyle', {}, {category: ['styles']});

  add.creator('commentStyle', {}, {category: ['styles']});

  add.creator('copyDownParentsStyle', {}, {category: ['styles']});

  add.method('justRenamedCategory', function (oldCat, newCat, isEmpty) {
    // aaa - I don't think this code could ever have really worked right. When we
    // rename a category, it's going to break all the subcategories - they *all*
    // have different names now. What can we do about this?
    var world = avocado.ui.currentWorld();
    var oldCatMorph = world.existingMorphFor(oldCat);
    if (oldCatMorph) {
      world.forgetAboutExistingMorphFor(oldCat, oldCatMorph);
    }
    avocado.ui.justChanged(this, function() {
      if (!isEmpty) {
        var newCatMorph = world.morphFor(newCat);
        if (oldCatMorph) { oldCatMorph.transferUIStateTo(newCatMorph, Event.createFake()); }
      }
    });
  }, {category: ['categories']});

  add.creator('morphBuilder', {}, {category: ['user interface']});

  add.method('copyDownParentsString', function () {
    return reflect(this.copyDownParents()).expressionEvaluatingToMe();
  }, {category: ['annotation']});

  add.method('setCopyDownParentsString', function (str) {
    avocado.ui.showMessageIfErrorDuring(function() {
      this.setCopyDownParents(eval(str));
    }.bind(this));
    avocado.ui.justChanged(this); // to make the copied-down slots appear;
  }, {category: ['annotation']});

});


thisModule.addSlots(avocado.mirror.morphMixin_aaa_becauseIDoNotFeelLikeGeneralizingTheseMethodsRightNow, function(add) {

  add.method('mirror', function () { return this._model; }, {category: ['accessing']});

  add.data('isMirrorMorph', true, {category: ['testing']});

  add.method('refreshContent', function () {
    this.mirror().updateCategoryCacheIfOlderThan(8000);
    return avocado.morphMixins.Morph.refreshContent.call(this);
  }, {category: ['updating']});

  add.method('potentialContentMorphs', function () {
    if (! this._potentialContentMorphs) {
      var potentialRows = [
        avocado.mirror.morphBuilder.createHeaderRowFor(this),
        this._shouldUseZooming ? this._descMorph : null,
        this._annotationToggler,
        this._commentToggler,
        this.rootCategoryMorph(),
        this.evaluatorsPanel()
      ].compact();
      this._potentialContentMorphs = avocado.table.contents.createWithColumns([potentialRows]);
    }
    return this._potentialContentMorphs;
  }, {category: ['updating']});

  add.method('rootCategoryMorph', function () {
    if (! this._rootCategoryMorph) {
      this._rootCategoryMorph = avocado.ui.currentWorld().morphFor(this._model.rootCategory());
    }
    return this._rootCategoryMorph;
  }, {category: ['root category']});

  add.method('storeString', function () {
    // aaa - This is not the right long-term solution for saving mirror morphs.
    //       The transporter should be able to handle them. But for now it's
    //       choking for some reason, so let's do this for now. -- Adam, Mar. 2011
    return [
      "avocado.ui.currentWorld().morphFor(",
      this.mirror().storeString(),
      ").setBasicMorphProperties(",
      this.basicMorphPropertiesStoreString(),
      ")"
      /* aaa - not working because the UI state contains references to the actual reflectee of the mirror,
               which means it needs to respect object identity
      "m.assumeUIState(",
      reflect(this.constructUIStateMemento()).expressionEvaluatingToMe(),
      ");"
      */
    ].join("");
  }, {category: ['transporting']});

  add.method('shouldNotBeTransported', function () {
    // aaa - Actually, for now, let's just not have mirrors get saved at all, because they
    // don't really come back right (what with the object identity problems).
    return true;
  }, {category: ['transporting']});

  add.method('expander', function () {
    if (this._shouldUseZooming) { return null; }
    if (! this._expander) {
      this._expander = this.rootCategoryMorph().expander();
    }
    return this._expander;
  }, {category: ['expanding']});

  add.method('evaluatorsPanel', function () {
    if (! this._evaluatorsPanel) {
      this._evaluatorsPanel = avocado.table.newColumnMorph().beInvisible().applyStyle({horizontalLayoutMode: avocado.LayoutModes.SpaceFill});
    }
    return this._evaluatorsPanel;
  }, {category: ['creating']});

  add.method('openEvaluator', function (evt) {
    evt = evt || Event.createFake();
    
    // Experimenting with using vocabulary morphs for evaluators, instead of putting the evaluators
    // directly inside the mirror.
    var enableNewVocabularyMorphExperiment = false;
    if (enableNewVocabularyMorphExperiment) {
      var m = avocad.ui.worldFor(evt).morphFor(avocado.vocabulary.create(this.mirror()));
      m.openEvaluator(evt);
      if (! this.ownerSatisfying(function(o) { return o === m; })) {
        m.assumeUIState({isExpanded: true}, function() {
          m.grabMeWithoutZoomingAroundFirst(evt);
        }, evt);
      }
      m.getAllMirrors();
      return ;
    }
    
    
    var e = avocado.ui.currentWorld().morphFor(avocado.evaluator.create(this.mirror()));
    this.evaluatorsPanel().layout().addCell(e);
    e.wasJustAdded(evt);
    return e;
  }, {category: ['evaluators']});

  add.method('closeEvaluator', function (evaluatorMorph) {
    this.evaluatorsPanel().layout().removeCell(evaluatorMorph);
  }, {category: ['evaluators']});

  add.method('grabResult', function (resultMirMorph, evt) {
    if (resultMirMorph === this) {
      this.wiggle();
    } else {
      resultMirMorph.grabMe(evt);
    }
  }, {category: ['evaluators']});

  add.method('scriptMe', function (evt) {
    /*
    Meh, vocabulary morphs aren't quite feeling right yet. For now, go back to regular evaluators.
    
    var m = avocado.ui.worldFor(evt).morphFor(avocado.vocabulary.create(this.mirror()));
    m.assumeUIState({isExpanded: true}, null, evt);
    m.grabMeWithoutZoomingAroundFirst(evt);
    m.getAllMirrors();
    return m;
    */
    
    return this.openEvaluator(evt);
  }, {category: ['evaluators']});

  add.method('shouldAllowModification', function () {
    return !window.isInCodeOrganizingMode;
  });

  add.method('commands', function () {
    var cmdList = avocado.command.list.create(this);
    cmdList.addAllCommands(this.rootCategoryMorph().commands());
    cmdList.addLine();
    cmdList.addAllCommands(this.mirror().commands().wrapForMorph(this));
    cmdList.addLine();

    cmdList.addItem(avocado.command.create("script me", this.scriptMe));
    cmdList.addLine();
    
    if (!this._shouldUseZooming && this.mirror().canHaveAnnotation()) {
      cmdList.addLine();

      var annotationCommands = [];
      
      if (this.mirror().comment) {
        annotationCommands.push(this._commentToggler.commandForToggling("comment"));
      }

      annotationCommands.push(this._annotationToggler.commandForToggling("annotation"));
      
      cmdList.addItem(avocado.command.create("annotation", annotationCommands));
    }
    
    return cmdList;
  }, {category: ['menu']});

  add.method('dragAndDropCommands', function () {
    var cmdList = avocado.morphMixins.Morph.dragAndDropCommands.call(this);
    
    var rootCatCmdList = this.rootCategoryMorph().dragAndDropCommands();
    if (rootCatCmdList) { cmdList.addAllCommands(rootCatCmdList); }
    
    return cmdList;
  }, {category: ['drag and drop']});

  add.method('partsOfUIState', function () {
    return {
      isExpanded:       this.expander(),  // the root category already has this, but we want it at the top level so "clean up" can set it
      isCommentOpen:    this._commentToggler,
      isAnnotationOpen: this._annotationToggler,
      rootCategory:     this.rootCategoryMorph()
    };
  }, {category: ['UI state']});

});


thisModule.addSlots(avocado.mirror.defaultStyle, function(add) {

  add.data('borderColor', new Color(0.6, 0.6, 0.6));

  add.data('borderWidth', 1);

  add.data('borderRadius', 10);

  add.data('openForDragAndDrop', false);

  add.data('fillBase', new Color(0.8, 0.8, 0.8));

  add.data('padding', {top: 2, bottom: 2, left: 4, right: 4, between: {x: 2, y: 2}}, {initializeTo: '{top: 2, bottom: 2, left: 4, right: 4, between: {x: 2, y: 2}}'});

  add.data('internalPadding', {left: 15, right: 2, top: 2, bottom: 2, between: {x: 0, y: 0}}, {initializeTo: '{left: 15, right: 2, top: 2, bottom: 2, between: {x: 0, y: 0}}'});

  add.data('headerRowPadding', {top: 0, bottom: 0, left: 0, right: 0, between: {x: 3, y: 3}}, {initializeTo: '{top: 0, bottom: 0, left: 0, right: 0, between: {x: 3, y: 3}}'});

});


thisModule.addSlots(avocado.mirror.annotationStyle, function(add) {

  add.data('horizontalLayoutMode', avocado.LayoutModes.SpaceFill);

});


thisModule.addSlots(avocado.mirror.commentStyle, function(add) {

  add.data('suppressHandles', true);

});


thisModule.addSlots(avocado.mirror.copyDownParentsStyle, function(add) {

  add.data('suppressHandles', true);

});


thisModule.addSlots(avocado.mirror.morphBuilder, function(add) {

  add.method('createHeaderRowFor', function (mirMorph) {
    if (mirMorph._commentToggler) {
      var optionalCommentButtonMorph = avocado.morphHider.create(mirMorph, [function() {
        return mirMorph._commentToggler.commandForToggling('my comment', "'...'").newMorph();
      }.memoize()], function() {
        return (mirMorph._commentToggler.isOn() || (mirMorph.mirror().comment && mirMorph.mirror().comment())) ? 0 : null;
      });
    }
    
    if (! mirMorph._shouldUseZooming) {
      // With zooming, these buttons clutter up the object. Plus the parent button isn't really necessary and doesn't make sense
      // now that the __proto__ slot is always visible (rather than hidden because the object isn't expanded). And the E button
      // is less interesting now that we have the "script me" command, plus it's kinda weird because evaluators belong to vocab
      // morphs instead of mirror morphs.

      if (mirMorph.mirror().hasAccessibleParent()) {
        var parentButton = avocado.command.create("^", function(evt) { mirMorph.mirror().getParent(evt); }).setHelpText('Get my parent').newMorph();
      }

      if (window.avocado && avocado.evaluator) {
        var evaluatorButton = avocado.command.create("E", function(evt) { mirMorph.openEvaluator(evt); }).setHelpText('Show an evaluator box').newMorph();
      }
    }

    var optionalDismissButtonMorph = mirMorph._shouldUseZooming ? null : mirMorph.createDismissButtonThatOnlyAppearsIfTopLevel();
    
    var optionalAKAButtonMorph = avocado.morphHider.create(mirMorph, [function() {
      return avocado.command.create("AKA", function(evt) { mirMorph.mirror().chooseAmongPossibleCreatorSlotChains(function() {}, evt); }).newMorph();
    }.memoize()], function() {
      return mirMorph.mirror().hasMultiplePossibleNames() ? 0 : null;
    });

    var descInHeader = mirMorph._shouldUseZooming ? null : mirMorph._descMorph;
    
    var headerRowContents = [mirMorph._shouldUseZooming ? avocado.ui.createSpacer() : null, mirMorph.expander(), mirMorph._nameMorph, descInHeader, optionalAKAButtonMorph, optionalCommentButtonMorph, avocado.ui.createSpacer(), parentButton, evaluatorButton, optionalDismissButtonMorph].compact();
    var headerRow = avocado.table.createSpaceFillingRowMorph(function() { return headerRowContents; }, avocado.mirror.defaultStyle.headerRowPadding);
    headerRow.refreshContentOfMeAndSubmorphs();
    return headerRow;
  }, {category: ['header row']});

  add.method('commentRowFor', function (mirMorph) {
    var m = mirMorph._commentRow;
    if (m) { return m; }
    m = mirMorph._commentRow = avocado.mirror.morphBuilder.createRow(this.commentMorphFor(mirMorph), mirMorph._shouldUseZooming);
    return m;
  }, {category: ['comment']});

  add.method('commentMorphFor', function (mirMorph) {
    return mirMorph._commentMorph || (mirMorph._commentMorph = avocado.frequentlyEditedText.newMorphFor(avocado.accessors.forMethods(mirMorph.mirror(), 'comment')).applyStyle(avocado.mirror.commentStyle));
  }, {category: ['comment']});

  add.method('createRow', function (m, shouldCenter) {
    var content = shouldCenter ? [avocado.ui.createSpacer(), m, avocado.ui.createSpacer()] : [m, avocado.ui.createSpacer()];
    var r = avocado.table.createSpaceFillingRowMorph(content, avocado.mirror.defaultStyle.internalPadding);
    r.wasJustAdded = function(evt) { m.wasJustAdded(evt); };
    return r;
  }, {category: ['layout']});

  add.method('annotationRowFor', function (mirMorph) {
    var m = mirMorph._annotationRow;
    if (m) { return m; }

    var annoMorph = mirMorph.mirror().canHaveAnnotation() ? avocado.mirror.morphBuilder.annotationMorphFor(mirMorph) : null;
    var parentSlotMorph = mirMorph.mirror().hasAccessibleParent() ? avocado.ui.currentWorld().morphFor(mirMorph.mirror().parentSlot()) : null;
    if (parentSlotMorph) { parentSlotMorph.setScale(mirMorph._shouldUseZooming ? 0.5 : 1.0); }
    var content = mirMorph._shouldUseZooming ? [parentSlotMorph, avocado.ui.createSpacer(), annoMorph].compact() : [parentSlotMorph, annoMorph, avocado.ui.createSpacer()].compact();
    m = mirMorph._annotationRow = avocado.table.createSpaceFillingRowMorph(content, avocado.mirror.defaultStyle.internalPadding);
    m.wasJustAdded = function(evt) { annoMorph.wasJustAdded(evt); };
    
    return m;
  }, {category: ['annotation']});

  add.method('annotationMorphFor', function (mirMorph) {
    var m = mirMorph._annotationMorph;
    if (m) { return m; }
    m = mirMorph._annotationMorph = avocado.table.newColumnMorph().beInvisible().applyStyle(avocado.mirror.annotationStyle);
    if (mirMorph._shouldUseZooming) { m.setScale(0.25); }

    // aaa - shouldn't really be a string; do something nicer, some way of specifying a list
    mirMorph._copyDownParentsLabel = avocado.frequentlyEditedText.newMorphFor(avocado.accessors.forMethods(mirMorph._model, 'copyDownParentsString'));
    mirMorph._copyDownParentsLabel.applyStyle(avocado.mirror.copyDownParentsStyle);
    mirMorph._copyDownParentsLabel.rememberThatSavedTextMightNotBeIdenticalToWhatWasTyped();

    var rows = [];
    if (mirMorph._shouldUseZooming) { rows.push(avocado.table.createSpaceFillingRowMorph([avocado.label.newMorphFor("Comment:"), this.commentMorphFor(mirMorph)])); }
    rows.push(avocado.table.createSpaceFillingRowMorph([avocado.label.newMorphFor("Copy-down parents:"), mirMorph._copyDownParentsLabel]).setScale(mirMorph._shouldUseZooming ? 0.5 : 1.0));
    m.layout().setCells(rows);
    return m;
  }, {category: ['annotation']});

});


});
