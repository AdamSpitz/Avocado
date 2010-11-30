transporter.module.create('lk_programming_environment/category_morph', function(requires) {

requires('reflection/reflection');
requires('lk_ext/rows_and_columns');
requires('lk_ext/expander');

}, function(thisModule) {


thisModule.addSlots(category, function(add) {

  add.method('Morph', function Morph() { Class.initializer.apply(this, arguments); }, {category: ['user interface']});

  add.creator('MorphMixin', {}, {category: ['user interface']});

});


thisModule.addSlots(category.ofAParticularMirror, function(add) {
  
  add.method('morph', function () {
    return this.mirror().morph().categoryMorphFor(this);
  }, {category: ['user interface']});
  
});


thisModule.addSlots(category.MorphMixin, function(add) {

  add.method('initializeCategoryUI', function () {
    this._highlighter = avocado.booleanHolder.containing(true).addObserver(function() {this.updateHighlighting();}.bind(this));
    this._highlighter.setChecked(false);

    this._expander = new ExpanderMorph(this);

    this._modulesLabelRow = this.createModulesLabelRow();
  }, {category: ['initializing']});

  add.method('categoryOfMirror', function () { return this._categoryPresenter; }, {category: ['accessing']});

  add.method('category', function () { return this._categoryPresenter.category(); }, {category: ['accessing']});

  add.method('expander', function () { return this._expander; }, {category: ['expanding and collapsing']});

  add.method('createModulesLabelRow', function () {
    var modulesLabel = TextMorph.createLabel(function() {return this._categoryPresenter.modulesSummaryString();}.bind(this));
    // modulesLabel.setFontSize(modulesLabel.getFontSize() - 1); // aaa - why does this create a little space at the beginning of the label?
    return avocado.RowMorph.createSpaceFilling([modulesLabel], {left: 0, right: 0, top: 0, bottom: 2, between: {x: 0, y: 0}});
  }, {category: ['creating']});

  add.method('slotsPanel', function () {
    var sp = this._slotsPanel;
    if (sp) { return sp; }
    sp = this._slotsPanel = new avocado.ColumnMorph().beInvisible();
    sp.setPadding({top: 0, bottom: 0, left: 10, right: 0, between: {x: 0, y: 0}});
    sp.horizontalLayoutMode = LayoutModes.SpaceFill;
    this.populateSlotsPanel();
    return sp;
  }, {category: ['slots panel']});

  add.method('populateSlotsPanel', function () {
    if (! this._slotsPanel) { return this.slotsPanel(); } // that'll end up calling back here
    
    var mirMorph = this.mirrorMorph();

    var slotMorphs = avocado.enumerator.create(this._categoryPresenter, 'eachSlot').sortBy(function(s) { return s.sortOrder(); }).map(function(s) { return mirMorph.slotMorphFor(s); });

    var subnodeMorphs = this.immediateSubnodeMorphs();
    subnodeMorphs = subnodeMorphs.concat(this._slotsPanel.submorphs.select(function(m) {return m.isNewCategory && ! this.mirrorMorph().existingCategoryMorphFor(m.category());}.bind(this)));
    subnodeMorphs = subnodeMorphs.sortBy(function(scm) { return scm.category().sortOrder(); });

    var supercatMorph = this.supernodeMorph();
    
    var allSubmorphs = [];
    if (mirMorph.shouldAllowModification() && (!supercatMorph || this._categoryPresenter.modulesSummaryString() !== supercatMorph._categoryPresenter.modulesSummaryString())) { allSubmorphs.push(this._modulesLabelRow); }
    slotMorphs   .each(function(sm ) {allSubmorphs.push(sm );});
    subnodeMorphs.each(function(scm) {allSubmorphs.push(scm);});
    allSubmorphs.each(function(m) { m.horizontalLayoutMode = LayoutModes.SpaceFill; });
    this._slotsPanel.setRows(allSubmorphs);
  }, {category: ['slots panel']});

  add.method('populateSlotsPanelInMeAndExistingSubcategoryMorphs', function () {
    if (! this.expander().isExpanded()) { return; }
    this.populateSlotsPanel();
    this.slotsPanel().submorphs.each(function(m) { if (m.constructor === category.Morph) { m.populateSlotsPanelInMeAndExistingSubcategoryMorphs(); } });
  }, {category: ['updating']});

  add.method('supernodeMorph', function (f) {
    var myCat = this.category();
    if (myCat.isRoot()) { return null; }
    return this.nodeMorphFor(myCat.supercategory());
  }, {category: ['slots panel']});

  add.method('immediateSubnodeMorphs', function () {
    return avocado.enumerator.create(this, 'eachImmediateSubnodeMorph').toArray();
  }, {category: ['slots panel']});

  add.method('eachImmediateSubnodeMorph', function (f) {
    this._categoryPresenter.eachImmediateSubcategory(function(sc) { f(this.nodeMorphFor(sc)); }.bind(this));
  }, {category: ['slots panel']});
  
  add.method('nodeMorphFor', function (cat) {
    return this.mirrorMorph().categoryMorphFor(cat);
  }, {category: ['slots panel']});
  
  add.method('expandThisCategory', function () {
    this.mirrorMorph().expandCategory(this._categoryPresenter);
  }, {category: ['slots panel']});

  add.method('addSlot', function (initialContents, evt) {
    var s = this.mirror().automaticallyChooseDefaultNameAndAddNewSlot(reflect(initialContents), this.category());
    var mirMorph = this.mirrorMorph();
    mirMorph.updateAppearance();
    this.expandThisCategory();
    mirMorph.slotMorphFor(s).wasJustAdded(evt);
  }, {category: ['adding']});

  add.method('addCategory', function (evt) {
    this.updateAppearance();
    this.expander().expand();
    var cm = new category.Morph(this._categoryPresenter.subcategory(""));
    cm.isNewCategory = true;
    cm.horizontalLayoutMode = LayoutModes.SpaceFill;
    this.slotsPanel().addRow(cm);
    cm.titleLabel.beWritableAndSelectAll();
  }, {category: ['adding']});

  add.method('updateHighlighting', function () {
    this.setHighlighting(this._highlighter.isChecked());
  }, {category: ['highlighting']});

  add.method('categoryCommands', function () {
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

        this.titleLabel.addEditingMenuItemsTo(cmdList, Event.createFake());
        
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
  
  add.method('categoryDragAndDropCommands', function () {
    var cmdList = this._categoryPresenter.dragAndDropCommands().wrapForMorph(this);
    var mirMorph = this.mirrorMorph();
    
    cmdList.itemWith("label", "add slot or category").wrapFunction(function(oldFunctionToRun, evt, slotOrCatMorph) {
      var result = oldFunctionToRun(evt, slotOrCatMorph);
      mirMorph.expandCategory(result.category());
    });
    
    return cmdList;
  }, {category: ['drag and drop']});

});


thisModule.addSlots(category.Morph, function(add) {

  add.data('superclass', avocado.ColumnMorph);

  add.creator('prototype', Object.create(avocado.ColumnMorph.prototype), {}, {copyDownParents: [{parent: category.MorphMixin}]});

  add.data('type', 'category.Morph');

});


thisModule.addSlots(category.Morph.prototype, function(add) {

  add.data('constructor', category.Morph);

  add.method('initialize', function ($super, categoryPresenter) {
    $super();
    this._categoryPresenter = categoryPresenter;
    this._model = categoryPresenter;

    this.setPadding({top: 0, bottom: 0, left: 2, right: 2, between: {x: 2, y: 2}});
    this.closeDnD();
    this.beUngrabbable();
    this.setFill(null);

    this.initializeCategoryUI();

    var categoryMorph = this;
    this.titleLabel = new TwoModeTextMorph(function( ) { return categoryMorph.category().lastPart(); },
                                           function(n) { categoryMorph.rename(n, Event.createFake()); });
    this.titleLabel.setEmphasis({style: 'italic'});
    this.titleLabel.nameOfEditCommand = "rename";
    this.titleLabel.backgroundColorWhenWritable = null;
    this.titleLabel.ignoreEvents();

    this._headerRow = avocado.RowMorph.createSpaceFilling([this._expander, this.titleLabel],
                                                  {top: 0, bottom: 0, left: 0, right: 0, between: {x: 3, y: 3}});
    this.setRows([this._headerRow]);
  }, {category: ['creating']});

  add.method('mirror', function () { return this._categoryPresenter.mirror(); }, {category: ['accessing']});

  add.method('mirrorMorph', function () { return this.mirror().morph(); }, {category: ['accessing']});

  add.data('grabsShouldFallThrough', true, {category: ['grabbing']});
  
  add.method('updateAppearance', function () {
    if (! this.world() || ! this.expander().isExpanded()) {return;}
    this.populateSlotsPanel();
    this.slotsPanel().submorphs.each(function(m) { m.updateAppearance(); }); // aaa is this gonna cause us to redo a lot of work?;
  }, {category: ['updating']});

  add.method('updateExpandedness', function () {
    if (! this.world()) {return;}
    var rows = [this._headerRow];
    if (this.expander().isExpanded()) { rows.push(this.slotsPanel()); }
    this.setRows(rows);
  }, {category: ['updating']});

  add.method('rename', function (newName, evt) {
    // aaa - eww
    var result = this._categoryPresenter.rename(newName);
    this.mirrorMorph().justRenamedCategoryMorphFor(result.oldCat, result.newCat, result.numberOfRenamedSlots === 0);
  }, {category: ['renaming']});

  add.method('partsOfUIState', function () {
    return { isExpanded: this.expander() };
  }, {category: ['UI state']});

  add.method('commands', function () {
    return this.categoryCommands();
  }, {category: ['menu']});

  add.method('dragAndDropCommands', function () {
    return this.categoryDragAndDropCommands();
  }, {category: ['drag and drop']});
    
  add.method('grabCopy', function (evt) {
    var newMirror = reflect({});
    var newCategoryPresenter = this._categoryPresenter.copyInto(category.root().ofMirror(newMirror));
    var newCategoryMorph = new category.Morph(newCategoryPresenter);
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
      var newCategoryPresenter = this._categoryPresenter.copyInto(category.root().ofMirror(mir));
      var mirMorph = world.morphFor(mir);
      world.addMorphAt(mirMorph, this.position());
      mirMorph.expandCategory(newCategoryPresenter);
      if (this._shouldDisappearAfterCommandIsFinished) { this.remove(); }
    }
  }, {category: ['drag and drop']});

});


});
