avocado.transporter.module.create('lk_programming_environment/category_morph', function(requires) {

requires('reflection/reflection');
requires('lk_ext/tree_morph');

}, function(thisModule) {


thisModule.addSlots(avocado.category, function(add) {

  add.method('Morph', function Morph() { Class.initializer.apply(this, arguments); }, {category: ['user interface']});

});


thisModule.addSlots(avocado.category.ofAParticularMirror, function(add) {

  add.method('newMorph', function () {
    return new avocado.category.Morph(this, this.isRoot());
  }, {category: ['user interface']});

  add.method('existingMorph', function () {
    return WorldMorph.current().existingMorphFor(this);
  }, {category: ['user interface']});

  add.data('isImmutableForMorphIdentity', true, {category: ['user interface']});
  
  add.method('shouldContentsPanelUseZooming', function () { return !!avocado.shouldMirrorsUseZooming; });

});


thisModule.addSlots(avocado.category.Morph, function(add) {

  add.data('superclass', avocado.TreeNodeMorph);

  add.data('type', 'avocado.category.Morph');

  add.creator('prototype', Object.create(avocado.TreeNodeMorph.prototype));

});


thisModule.addSlots(avocado.category.Morph.prototype, function(add) {

  add.data('constructor', avocado.category.Morph);
  
  add.method('initialize', function ($super, catOfMir, shouldOmitHeaderRow) {
    $super(catOfMir);
    this._shouldOmitHeaderRow = shouldOmitHeaderRow;

    this.applyStyle(this.desiredCurrentStyle());

    this._highlighter = avocado.booleanHolder.containing(true).addObserver(function() {this.updateHighlighting();}.bind(this));
    this._highlighter.setChecked(false);

    this.refreshContentOfMeAndSubmorphs();
  }, {category: ['creating']});

  add.method('category', function () { return this._model; }, {category: ['accessing']});

  add.method('mirror', function () { return this.category().mirror(); }, {category: ['accessing']});

  add.method('mirrorMorph', function () { return WorldMorph.current().morphFor(this.mirror()); }, {category: ['accessing']});

  add.method('shouldUseZooming', function () {
    return avocado.shouldMirrorsUseZooming;
  }, {category: ['zooming']});

  add.creator('nonZoomingStyle', {}, {category: ['styles']});

  add.creator('zoomingStyle', {}, {category: ['styles']});

  add.creator('grabbedStyle', Object.create(avocado.category.Morph.prototype.nonZoomingStyle), {category: ['styles']});

  add.method('desiredCurrentStyle', function () {
    return this.shouldUseZooming() ? this.zoomingStyle : this.nonZoomingStyle;
  }, {category: ['styles']});
  
  add.data('_contentsThreshold', 1, {category: ['zooming']});

  add.method('createTitleLabel', function () {
    var lbl = new avocado.TwoModeTextMorph(avocado.accessors.create(function( ) { return this.category().lastPart(); }.bind(this),
                                                            function(n) { this.rename(n); }.bind(this)));
    lbl.setEmphasis({style: 'italic'});
    lbl.setNameOfEditCommand("rename");
    lbl.backgroundColorWhenWritable = null;
    lbl.ignoreEvents();
    this._titleLabel = lbl;
    return lbl;
  }, {category: ['creating']});

  add.method('findTitleLabel', function () {
    return this._titleLabel;
  }, {category: ['creating']});

  add.method('createContentsSummaryMorph', function () {
    var summaryLabel = TextMorph.createLabel(function() {return this.ownerWithAModel().treeNode().contentsSummaryString();});
    // summaryLabel.setFontSize(summaryLabel.getFontSize() - 1); // aaa - why does this create a little space at the beginning of the label?
    
    // aaa - I get weird 100000-wide behaviour when I try to use just the label instead of wrapping it with a row. I'd like to know why.
    // summaryLabel.setLayoutModes({horizontalLayoutMode: avocado.LayoutModes.SpaceFill});
    // return summaryLabel;
    
    return avocado.RowMorph.createSpaceFilling([summaryLabel], this.desiredCurrentStyle().contentsSummaryPadding).setScale(this.shouldUseZooming() ? 0.5 : 1.0);
  }, {category: ['creating']});

  add.method('partsOfUIState', function ($super) {
    var parts = $super();
    if (this._shouldOmitHeaderRow) { delete parts['isExpanded']; } // the mirror will handle it
    return parts;
  }, {category: ['UI state']});

  add.method('commands', function () {
    var cmdList = avocado.command.list.create(this);
    var isModifiable = this.mirrorMorph().shouldAllowModification();
    
    if (this.mirror().canHaveSlots()) {
      var addCommands = [];
      if (this.mirrorMorph().shouldAllowModification()) {
        addCommands.push(avocado.command.create("function",  function(evt) { this.addSlot    (function() {}, evt); }, this));
        addCommands.push(avocado.command.create("attribute", function(evt) { this.addSlot    (null,          evt); }, this));
      }
      addCommands.push(avocado.command.create("category", function(evt) { this.addCategory(evt); }, this));
      
      if (avocado.debugMode) {
        addCommands.push(avocado.command.create("50 functions", function(evt) { for (var i = 0; i < 50; ++i) { this.addSlot    (function() {}, evt); } }, this));
      }
      cmdList.addItem(["add...", addCommands]);
      
      if (this.shouldUseZooming()) {
        cmdList.addSection([{ label: "clean up",  go: this.cleanUp }]);
      }

      if (!this.category().isRoot()) {
        cmdList.addLine();

        if (this._titleLabel) {
          cmdList.addAllCommands(this._titleLabel.editingCommands());
        }
        
        cmdList.addItem({label: isModifiable ? "copy" : "move", go: function(evt) { this.grabCopy(evt); }});

        if (isModifiable) {
          cmdList.addItem({label: "move", go: function(evt) {
            this.grabCopy(evt);
            this.category().removeSlots();
            avocado.ui.justChanged(this.mirror());
          }});
        }
      }
    }
    return cmdList;
  }, {category: ['menu']});
  
  add.method('dragAndDropCommandsForTreeContents', function ($super) {
    var cmdList = $super();
    var mirMorph = this.mirrorMorph();
    
    cmdList.itemWith("label", "add slot or category").wrapFunction(function(oldFunctionToRun, evt, slotOrCatMorph) {
      var resultCatOrSlot = oldFunctionToRun(evt, slotOrCatMorph);
      mirMorph.expandCategory(resultCatOrSlot.category());
    });
    
    return cmdList;
  }, {category: ['drag and drop']});
  
  add.method('cleanUp', function (evt, shouldBeUnobtrusive) {
    var cp = this.actualContentsPanel();
    var pose = cp.poseManager().cleaningUpPose().beSquarish().whenDoneScaleToFitWithinCurrentSpace();
    if (true || shouldBeUnobtrusive) { pose.beUnobtrusive(); } // aaa - doing it with animation doesn't work right yet - try making a new object, adding a few slots, and hitting "clean up"
    cp.poseManager().assumePose(pose);
  }, {category: ['cleaning up']});

  add.method('updateHighlighting', function () {
    this.setHighlighting(this._highlighter.isChecked());
  }, {category: ['highlighting']});

  add.method('wasJustShown', function (evt) {
    this.isNewCategory = true;
    if (this._titleLabel) { this._titleLabel.wasJustShown(evt); }
  }, {category: ['events']});

  add.method('rename', function (newName, evt) {
    // aaa - eww
    var result = this.category().rename(newName);
    this.mirror().annotationForWriting().getCategoryCache(result.newCat.parts()); // this should make sure the new category "exists"
    this.mirror().annotationForWriting().getCategoryCache(result.oldCat.parts()).removeMe();
    this.mirrorMorph().justRenamedCategoryMorphFor(result.oldCat, result.newCat, result.numberOfRenamedSlots === 0);
  }, {category: ['renaming']});

  add.method('addSlot', function (initialContents, evt) {
    this.mirrorMorph().expandCategoryMorph(this);
    var s = this.category().automaticallyChooseDefaultNameAndAddNewSlot(reflect(initialContents));
    var sm = avocado.ui.worldFor(evt).morphFor(s);
    sm.wasJustShown(evt);
    this.refreshContentOfMeAndSubmorphs(); // aaa blecch, can't do avocado.ui.justChanged because this might be one of those not-quite-existing ones (because it might have no contents yet);
    if (this.shouldUseZooming()) {
      this.cleanUp(evt, true); // aaa - Not sure this is what we want in the long run - it'd probably be better to just add the slot in an empty area of the content panel
    }
  }, {category: ['adding']});

  add.method('addCategory', function (evt) {
    var c = this.category().subcategory("");
    var catCache = this.mirror().annotationForWriting().getCategoryCache(c.parts()); // this should make sure the category "exists"
    this.mirrorMorph().expandCategoryMorph(this);
    var cm = avocado.ui.worldFor(evt).morphFor(c);
    cm.wasJustShown(evt);
    // aaa blecch, I feel like this line should be here, but bad things happen: avocado.ui.justChanged(this.category());
  }, {category: ['adding']});

  add.method('grabCopy', function (evt) {
    var newMirror = reflect({});
    var newCategoryOfMir = this.category().copyInto(newMirror.rootCategory());
    var newCategoryMorph = avocado.ui.worldFor(evt).morphFor(newCategoryOfMir);
    newCategoryMorph.applyStyle(this.grabbedStyle);
    newCategoryMorph.refreshContent();
    newCategoryMorph.forceLayoutRejiggering();
    newCategoryMorph._shouldDisappearAfterCommandIsFinished = true;
    if (! this.mirrorMorph().shouldAllowModification()) { newCategoryMorph._shouldOnlyBeDroppedOnThisParticularMorph = this.mirrorMorph(); }
    evt.hand.grabMorphWithoutAskingPermission(newCategoryMorph, evt);
    return newCategoryMorph;
  }, {category: ['drag and drop']});

  add.method('wasJustDroppedOnWorld', function (world) {
    if (! this._shouldOnlyBeDroppedOnThisParticularMorph || this._shouldOnlyBeDroppedOnThisParticularMorph === world) {
      var mir = reflect({});
      var newCategoryOfMir = this.category().copyInto(mir.rootCategory());
      var mirMorph = world.morphFor(mir);
      world.addMorphAt(mirMorph, this.position());
      mirMorph.expandCategory(newCategoryOfMir);
      if (this._shouldDisappearAfterCommandIsFinished) { this.remove(); }
    }
  }, {category: ['drag and drop']});

});


thisModule.addSlots(avocado.category.Morph.prototype.nonZoomingStyle, function(add) {

  add.data('horizontalLayoutMode', avocado.LayoutModes.SpaceFill);

  add.data('openForDragAndDrop', false);

  add.data('suppressGrabbing', false);

  add.data('grabsShouldFallThrough', true);

  add.data('fill', null);

  add.data('contentsSummaryPadding', {left: 0, right: 0, top: 0, bottom: 2, between: {x: 0, y: 0}}, {initializeTo: '{left: 0, right: 0, top: 0, bottom: 2, between: {x: 0, y: 0}}'});

});


thisModule.addSlots(avocado.category.Morph.prototype.zoomingStyle, function(add) {

  add.data('openForDragAndDrop', false);

  add.data('suppressGrabbing', false);

  add.data('grabsShouldFallThrough', true, {comment: 'Otherwise it\'s just too easy to accidentally mess up an object.'});

  add.data('fill', new lively.paint.LinearGradient([new lively.paint.Stop(0, new Color(0.9019607843137255, 0.9019607843137255, 0.9019607843137255)), new lively.paint.Stop(1, new Color(0.8, 0.8, 0.8))], lively.paint.LinearGradient.NorthSouth));

  add.data('borderWidth', 1);

  add.data('borderColor', new Color(0.6, 0.6, 0.6));

  add.data('contentsSummaryPadding', {left: 0, right: 0, top: 0, bottom: 2, between: {x: 0, y: 0}}, {initializeTo: '{left: 0, right: 0, top: 0, bottom: 2, between: {x: 0, y: 0}}'});

});


thisModule.addSlots(avocado.category.Morph.prototype.grabbedStyle, function(add) {

  add.data('fill', new lively.paint.LinearGradient([new lively.paint.Stop(0, new Color(0.8, 0.8, 0.8)), new lively.paint.Stop(1, new Color(0.9019607843137255, 0.9019607843137255, 0.9019607843137255))], lively.paint.LinearGradient.SouthNorth));

  add.data('horizontalLayoutMode', avocado.LayoutModes.ShrinkWrap);

});


});
