transporter.module.create('lk_programming_environment/category_morph', function(requires) {

requires('reflection/reflection');
requires('lk_ext/tree_morph');

}, function(thisModule) {


thisModule.addSlots(category, function(add) {

  add.method('Morph', function Morph() { Class.initializer.apply(this, arguments); }, {category: ['user interface']});

});


thisModule.addSlots(category.ofAParticularMirror, function(add) {
  
  add.method('morph', function () {
    return this.mirror().morph().categoryMorphFor(this);
  }, {category: ['user interface']});
  
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

    this.setPadding({top: 0, bottom: 0, left: 2, right: 2, between: {x: 2, y: 2}});
    this.setLayoutModes({horizontalLayoutMode: LayoutModes.SpaceFill});
    this.closeDnD();
    this.beUngrabbable();
    this.setFill(null);

    this._highlighter = avocado.booleanHolder.containing(true).addObserver(function() {this.updateHighlighting();}.bind(this));
    this._highlighter.setChecked(false);

    this.updateExpandedness();
  }, {category: ['creating']});

  add.method('categoryOfMirror', function () { return this._model; }, {category: ['accessing']});

  add.method('mirror', function () { return this.categoryOfMirror().mirror(); }, {category: ['accessing']});

  add.method('mirrorMorph', function () { return this.mirror().morph(); }, {category: ['accessing']});

  add.method('category', function () { return this.categoryOfMirror().category(); }, {category: ['accessing']});

  add.data('grabsShouldFallThrough', true, {category: ['grabbing']});

  add.method('createTitleLabel', function () {
    var lbl = new TwoModeTextMorph(function( ) { return this.category().lastPart(); }.bind(this),
                                   function(n) { this.rename(n, Event.createFake()); }.bind(this));
    lbl.setEmphasis({style: 'italic'});
    lbl.nameOfEditCommand = "rename";
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
    
    return avocado.RowMorph.createSpaceFilling([summaryLabel], {left: 0, right: 0, top: 0, bottom: 2, between: {x: 0, y: 0}});
  }, {category: ['creating']});
  
  add.method('headerRow', function () {
    var hr = this._headerRow;
    if (hr) { return hr; }
    this.titleLabel = this.createTitleLabel();
    hr = avocado.RowMorph.createSpaceFilling([this._expander, this.titleLabel], {top: 0, bottom: 0, left: 0, right: 0, between: {x: 3, y: 3}});
    this._headerRow = hr;
    return hr;
  }, {category: ['creating']});
  
  add.method('nonNodeContentMorphsInOrder', function () {
    return this.treeNode().nonNodeContents().map(function(s) { return this.nonNodeMorphFor(s); }.bind(this));
  }, {category: ['contents panel']});
  
  add.method('subnodeMorphsInOrder', function () {
    var subnodeMorphs = this.immediateSubnodeMorphs();
    subnodeMorphs = subnodeMorphs.concat(this._contentsPanel.submorphs.select(function(m) {
      return m.isNewCategory && ! this.mirrorMorph().existingCategoryMorphFor(m.category());
    }.bind(this)));
    return subnodeMorphs.sortBy(function(scm) { return scm.treeNode().sortOrder(); });
  }, {category: ['contents panel']});
  
  add.method('nodeMorphFor', function (cat) {
    return this.mirrorMorph().categoryMorphFor(cat);
  }, {category: ['contents panel']});
  
  add.method('nonNodeMorphFor', function (slot) {
    return this.mirrorMorph().slotMorphFor(slot);
  }, {category: ['contents panel']});
  
  add.method('expandMeAndAncestors', function () {
    if (! this.categoryOfMirror().isRoot()) { this.supernodeMorph().expandMeAndAncestors(); }
    this.expander().expand();
  }, {category: ['contents panel']});
  
  add.method('commands', function () {
    var cmdList = avocado.command.list.create();
    var isModifiable = this.mirrorMorph().shouldAllowModification();
    
    if (this.mirror().canHaveSlots()) {
      if (this.mirrorMorph().shouldAllowModification()) {
        cmdList.addSection([{ label: "add attribute", go: function(evt) { this.addSlot    (null,          evt); }.bind(this) },
                            { label: "add function",  go: function(evt) { this.addSlot    (function() {}, evt); }.bind(this) }]);
      }
      
      cmdList.addSection([{ label: "add category",  go: function(evt) { this.addCategory(               evt); }.bind(this) }]);

      if (!this.category().isRoot()) {
        cmdList.addLine();

        if (this.titleLabel) {
          this.titleLabel.addEditingMenuItemsTo(cmdList, Event.createFake());
        }
        
        cmdList.addItem({label: isModifiable ? "copy" : "move", go: function(evt) { this.grabCopy(evt); }.bind(this)});

        if (isModifiable) {
          cmdList.addItem({label: "move", go: function(evt) {
            this.grabCopy(evt);
            this.category().removeSlots(this.mirror());
            var mirMorph = this.mirrorMorph();
            if (mirMorph) { mirMorph.updateAppearance(); }
          }.bind(this)});
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
  
  add.method('updateAppearance', function () {
    if (! this.world() || ! this.expander().isExpanded()) {return;}
    this.populateContentsPanel();
    this.contentsPanel().submorphs.each(function(m) { m.updateAppearance(); }); // aaa is this gonna cause us to redo a lot of work?;
  }, {category: ['updating']});

  add.method('updateHighlighting', function () {
    this.setHighlighting(this._highlighter.isChecked());
  }, {category: ['highlighting']});
  
  add.method('wasJustAdded', function (evt) {
    this.isNewCategory = true;
    this.horizontalLayoutMode = LayoutModes.SpaceFill;
    if (this.titleLabel) { this.titleLabel.beWritableAndSelectAll(); }
  }, {category: ['events']});

  add.method('rename', function (newName, evt) {
    // aaa - eww
    var result = this.categoryOfMirror().rename(newName);
    this.mirrorMorph().justRenamedCategoryMorphFor(result.oldCat, result.newCat, result.numberOfRenamedSlots === 0);
  }, {category: ['renaming']});

  add.method('addSlot', function (initialContents, evt) {
    var s = this.categoryOfMirror().automaticallyChooseDefaultNameAndAddNewSlot(reflect(initialContents));
    var sm = this.mirrorMorph().slotMorphFor(s);
    this.mirrorMorph().expandCategoryMorph(this);
    sm.wasJustAdded(evt);
  }, {category: ['adding']});

  add.method('addCategory', function (evt) {
    this.mirrorMorph().expandCategoryMorph(this);
    var cm = new category.Morph(this.categoryOfMirror().subcategory(""));
    this.contentsPanel().addRow(cm);
    cm.wasJustAdded(evt);
  }, {category: ['adding']});
    
  add.method('grabCopy', function (evt) {
    var newMirror = reflect({});
    var newCategoryOfMir = this.categoryOfMirror().copyInto(category.root().ofMirror(newMirror));
    var newCategoryMorph = new category.Morph(newCategoryOfMir);
    newCategoryMorph.setFill(lively.paint.defaultFillWithColor(Color.gray));
    newCategoryMorph.horizontalLayoutMode = LayoutModes.ShrinkWrap;
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


});
