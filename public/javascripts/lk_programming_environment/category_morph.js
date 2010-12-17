transporter.module.create('lk_programming_environment/category_morph', function(requires) {

requires('reflection/reflection');
requires('lk_ext/tree_morph');

}, function(thisModule) {


thisModule.addSlots(category, function(add) {

  add.method('Morph', function Morph() { Class.initializer.apply(this, arguments); }, {category: ['user interface']});

});


thisModule.addSlots(category.ofAParticularMirror, function(add) {

  add.method('newMorph', function () {
    return new category.Morph(this, this.isRoot());
  }, {category: ['user interface']});

  add.method('morph', function () {
    return WorldMorph.current().morphFor(this);
  }, {category: ['user interface']});

  add.method('existingMorph', function () {
    return WorldMorph.current().existingMorphFor(this);
  }, {category: ['user interface']});

  add.data('isImmutableForMorphIdentity', true, {category: ['user interface']});

});


thisModule.addSlots(category.Morph, function(add) {

  add.data('superclass', avocado.TreeNodeMorph);

  add.creator('prototype', Object.create(avocado.TreeNodeMorph.prototype));

  add.data('type', 'category.Morph');

});


thisModule.addSlots(category.Morph.prototype, function(add) {

  add.data('constructor', category.Morph);

  add.method('initialize', function ($super, catOfMir, shouldOmitHeaderRow) {
    $super(catOfMir);
    this._shouldOmitHeaderRow = shouldOmitHeaderRow;

    this.applyStyle(this.defaultStyle);

    this._highlighter = avocado.booleanHolder.containing(true).addObserver(function() {this.updateHighlighting();}.bind(this));
    this._highlighter.setChecked(false);

    this.refreshContentOfMeAndSubmorphs();
  }, {category: ['creating']});

  add.method('categoryOfMirror', function () { return this._model; }, {category: ['accessing']});

  add.method('mirror', function () { return this.categoryOfMirror().mirror(); }, {category: ['accessing']});

  add.method('mirrorMorph', function () { return this.mirror().morph(); }, {category: ['accessing']});

  add.method('category', function () { return this.categoryOfMirror().category(); }, {category: ['accessing']});

  add.creator('defaultStyle', {}, {category: ['styles']});

  add.creator('grabbedStyle', Object.create(category.Morph.prototype.defaultStyle), {category: ['styles']});

  add.method('createTitleLabel', function () {
    var lbl = new TwoModeTextMorph(avocado.accessors.create(function( ) { return this.category().lastPart(); }.bind(this),
                                                            function(n) { this.rename(n); }.bind(this)));
    lbl.setEmphasis({style: 'italic'});
    lbl.setNameOfEditCommand("rename");
    lbl.backgroundColorWhenWritable = null;
    lbl.ignoreEvents();
    return lbl;
  }, {category: ['creating']});

  add.method('createContentsSummaryMorph', function () {
    var summaryLabel = TextMorph.createLabel(function() {return this.treeNode().contentsSummaryString();}.bind(this));
    // summaryLabel.setFontSize(summaryLabel.getFontSize() - 1); // aaa - why does this create a little space at the beginning of the label?
    
    // aaa - I get weird 100000-wide behaviour when I try to use just the label instead of wrapping it with a row. I'd like to know why.
    // summaryLabel.setLayoutModes({horizontalLayoutMode: LayoutModes.SpaceFill});
    // return summaryLabel;
    
    return avocado.RowMorph.createSpaceFilling([summaryLabel], this.defaultStyle.contentsSummaryPadding);
  }, {category: ['creating']});

  add.method('headerRow', function () {
    var hr = this._headerRow;
    if (hr) { return hr; }
    this.titleLabel = this.createTitleLabel();
    hr = avocado.RowMorph.createSpaceFilling([this._expander, this.titleLabel], this.defaultStyle.headerRowPadding);
    this._headerRow = hr;
    return hr;
  }, {category: ['creating']});

  add.method('partsOfUIState', function ($super) {
    var parts = $super();
    if (this._shouldOmitHeaderRow) { delete parts['isExpanded']; } // the mirror will handle it
    return parts;
  }, {category: ['UI state']});

  add.method('nonNodeContentMorphsInOrder', function () {
    return this.treeNode().nonNodeContents().map(function(s) { return this.nonNodeMorphFor(s); }.bind(this));
  }, {category: ['contents panel']});

  add.method('subnodeMorphsInOrder', function () {
    var subnodeMorphs = this.immediateSubnodeMorphs();
    // aaa - Blecch, I hate this whole thing where the categories don't really exist until they've got a slot in them.
    // Maybe make categories a bit more real, part of the object annotation or something, instead of just having them
    // live inside the slot annotations?
    subnodeMorphs = subnodeMorphs.concat(this._contentsPanel.submorphs.select(function(m) {
      if (m.isNewCategory) {
        var realCatMorph = this.mirrorMorph().existingCategoryMorphFor(m.category());
        if (realCatMorph) {
          m.transferUIStateTo(realCatMorph);
          return false;
        } else {
          return true;
        }
      } else {
        return false;
      }
    }.bind(this)));
    return subnodeMorphs.sortBy(function(scm) { return scm.treeNode().sortOrder(); });
  }, {category: ['contents panel']});

  add.method('nodeMorphFor', function (cat) {
    return this.mirrorMorph().categoryMorphFor(cat);
  }, {category: ['contents panel']});

  add.method('nonNodeMorphFor', function (slot) {
    return this.mirrorMorph().slotMorphFor(slot);
  }, {category: ['contents panel']});

  add.method('commands', function () {
    var cmdList = avocado.command.list.create(this);
    var isModifiable = this.mirrorMorph().shouldAllowModification();
    
    if (this.mirror().canHaveSlots()) {
      if (this.mirrorMorph().shouldAllowModification()) {
        cmdList.addSection([{ label: "add attribute", go: function(evt) { this.addSlot    (null,          evt); } },
                            { label: "add function",  go: function(evt) { this.addSlot    (function() {}, evt); } }]);
      }
      
      cmdList.addSection([{ label: "add category",  go: function(evt) { this.addCategory(               evt); } }]);

      if (!this.category().isRoot()) {
        cmdList.addLine();

        if (this.titleLabel) {
          cmdList.addAllCommands(this.titleLabel.editingCommands());
        }
        
        cmdList.addItem({label: isModifiable ? "copy" : "move", go: function(evt) { this.grabCopy(evt); }});

        if (isModifiable) {
          cmdList.addItem({label: "move", go: function(evt) {
            this.grabCopy(evt);
            this.category().removeSlots(this.mirror());
            avocado.ui.justChanged(this.mirror());
          }});
        }
      }
    }
    return cmdList;
  }, {category: ['menu']});

  add.method('dragAndDropCommands', function () {
    var cmdList = this.categoryOfMirror().dragAndDropCommands().wrapForMorph(this);
    var mirMorph = this.mirrorMorph();
    
    cmdList.itemWith("label", "add slot or category").wrapFunction(function(oldFunctionToRun, evt, slotOrCatMorph) {
      var result = oldFunctionToRun(evt, slotOrCatMorph);
      mirMorph.expandCategory(result.category());
    });
    
    return cmdList;
  }, {category: ['drag and drop']});

  add.method('updateHighlighting', function () {
    this.setHighlighting(this._highlighter.isChecked());
  }, {category: ['highlighting']});

  add.method('wasJustShown', function (evt) {
    this.isNewCategory = true;
    if (this.titleLabel) { this.titleLabel.wasJustShown(evt); }
  }, {category: ['events']});

  add.method('rename', function (newName, evt) {
    // aaa - eww
    var result = this.categoryOfMirror().rename(newName);
    this.mirrorMorph().justRenamedCategoryMorphFor(result.oldCat, result.newCat, result.numberOfRenamedSlots === 0);
  }, {category: ['renaming']});

  add.method('addSlot', function (initialContents, evt) {
    this.mirrorMorph().expandCategoryMorph(this);
    var s = this.categoryOfMirror().automaticallyChooseDefaultNameAndAddNewSlot(reflect(initialContents));
    var sm = this.mirrorMorph().slotMorphFor(s);
    sm.wasJustShown(evt);
    this.updateAppearance(); // aaa blecch, can't do avocado.ui.justChanged because this might be one of those not-quite-existing ones (because it might have no contents yet);
  }, {category: ['adding']});

  add.method('addCategory', function (evt) {
    this.mirrorMorph().expandCategoryMorph(this);
    var cm = this.categoryOfMirror().subcategory("").newMorph();
    this.contentsPanel().addRow(cm);
    cm.wasJustShown(evt);
    // aaa blecch, I feel like this line should be here, but bad things happen: avocado.ui.justChanged(this.categoryOfMirror());
  }, {category: ['adding']});

  add.method('grabCopy', function (evt) {
    var newMirror = reflect({});
    var newCategoryOfMir = this.categoryOfMirror().copyInto(category.root().ofMirror(newMirror));
    var newCategoryMorph = newCategoryOfMir.morph();
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
      var newCategoryOfMir = this.categoryOfMirror().copyInto(category.root().ofMirror(mir));
      var mirMorph = world.morphFor(mir);
      world.addMorphAt(mirMorph, this.position());
      mirMorph.expandCategory(newCategoryOfMir);
      if (this._shouldDisappearAfterCommandIsFinished) { this.remove(); }
    }
  }, {category: ['drag and drop']});

});


thisModule.addSlots(category.Morph.prototype.defaultStyle, function(add) {

  add.data('padding', {top: 0, bottom: 0, left: 2, right: 2, between: {x: 2, y: 2}}, {initializeTo: '{top: 0, bottom: 0, left: 2, right: 2, between: {x: 2, y: 2}}'});

  add.data('horizontalLayoutMode', LayoutModes.SpaceFill);

  add.data('openForDragAndDrop', false);

  add.data('suppressGrabbing', false);

  add.data('grabsShouldFallThrough', true);

  add.data('fill', null);

  add.data('contentsSummaryPadding', {left: 0, right: 0, top: 0, bottom: 2, between: {x: 0, y: 0}}, {initializeTo: '{left: 0, right: 0, top: 0, bottom: 2, between: {x: 0, y: 0}}'});

  add.data('headerRowPadding', {top: 0, bottom: 0, left: 0, right: 0, between: {x: 3, y: 3}}, {initializeTo: '{top: 0, bottom: 0, left: 0, right: 0, between: {x: 3, y: 3}}'});

});


thisModule.addSlots(category.Morph.prototype.grabbedStyle, function(add) {

  add.data('fill', lively.paint.defaultFillWithColor(Color.gray));

  add.data('horizontalLayoutMode', LayoutModes.ShrinkWrap);

});


});
