transporter.module.create('lk_programming_environment/category_morph', function(requires) {

requires('reflection/reflection');
requires('lk_ext/rows_and_columns');
requires('lk_ext/expander');

}, function(thisModule) {


thisModule.addSlots(category, function(add) {

  add.method('Morph', function Morph() { Class.initializer.apply(this, arguments); }, {category: ['user interface']});

  add.creator('MorphMixin', {}, {category: ['user interface']});

  add.creator('Presenter', {}, {category: ['user interface']});

});


thisModule.addSlots(category.Presenter, function(add) {

  add.method('create', function (mir, cat) {
    return Object.newChildOf(this, mir, cat);
  }, {category: ['creating']});

  add.method('initialize', function (mir, cat) {
    this._mirror = mir;
    this._category = cat;
  }, {category: ['creating']});

  add.method('mirror', function () { return this._mirror; }, {category: ['accessing']});

  add.method('mirrorMorph', function () { return this._mirror.morph(); }, {category: ['accessing']});

  add.method('category', function () { return this._category; }, {category: ['accessing']});

  add.method('subcategory', function (name) {
    return category.Presenter.create(this._mirror, this._category.subcategory(name));
  });

  add.method('createModulesLabelRow', function () {
    var modulesLabel = TextMorph.createLabel(function() {return this.modulesSummaryString();}.bind(this));
    // modulesLabel.setFontSize(modulesLabel.getFontSize() - 1); // aaa - why does this create a little space at the beginning of the label?
    this._modulesLabelRow = avocado.RowMorph.createSpaceFilling([modulesLabel], {left: 0, right: 0, top: 0, bottom: 2, between: 0});
    this._modulesLabelRow.updateAppearance = function() { modulesLabel.refreshText(); };
    return this._modulesLabelRow;
  }, {category: ['creating']});

  add.method('slotsPanel', function () {
    var sp = this._slotsPanel;
    if (sp) { return sp; }
    sp = this._slotsPanel = new avocado.ColumnMorph().beInvisible();
    sp.setPadding({top: 0, bottom: 0, left: 10, right: 0, between: 0});
    sp.horizontalLayoutMode = LayoutModes.SpaceFill;
    this.populateSlotsPanel();
    return sp;
  }, {category: ['slots panel']});

  add.method('populateSlotsPanel', function () {
    if (! this._slotsPanel) { return this.slotsPanel(); } // that'll end up calling back here
    
    var mirMorph = this.mirrorMorph();

    var sms = [];
    this.eachSlot(function(s) { sms.push(mirMorph.slotMorphFor(s)); });
    sms.sort(function(sm1, sm2) {
      var n1 = sm1.slot().name();
      if (n1 === '__proto__') return -1;
      var n2 = sm2.slot().name();
      if (n2 === '__proto__') return  1;
      n1 = n1.toUpperCase();
      n2 = n2.toUpperCase();
      return n1 < n2 ? -1 : n1 === n2 ? 0 : 1;
    });

    var scms = this.immediateSubnodeMorphs();
    scms = scms.concat(this._slotsPanel.submorphs.select(function(m) {return m.isNewCategory && ! this.mirrorMorph().existingCategoryMorphFor(m.category());}.bind(this)));
    scms.sort(function(scm1, scm2) { return scm1.category().lastPart().toUpperCase() < scm2.category().lastPart().toUpperCase() ? -1 : 1; });

    var supercatMorph = this.supernodeMorph();
    
    var allSubmorphs = [];
    if (mirMorph.shouldAllowModification() && (!supercatMorph || this.modulesSummaryString() !== supercatMorph._categoryPresenter.modulesSummaryString())) { allSubmorphs.push(this._modulesLabelRow); }
    sms .each(function(sm ) {allSubmorphs.push(sm );});
    scms.each(function(scm) {allSubmorphs.push(scm);});
    allSubmorphs.each(function(m) { m.horizontalLayoutMode = LayoutModes.SpaceFill; });
    this._slotsPanel.setRows(allSubmorphs);
  }, {category: ['slots panel']});

  add.method('eachSlot', function (f) {
    if (this.category().isRoot()) {
      this.mirror().eachFakeSlot(f);
    }
    this.mirror().eachSlotInCategory(this.category(), f);
  }, {category: ['iterating']});

  add.method('eachNormalSlotInMeAndSubcategories', function (f) {
    this.mirror().eachSlotNestedSomewhereUnderCategory(this.category(), f);
  }, {category: ['iterating']});

  add.method('rename', function (newName) {
    var c = this.category();
    var oldCat = c.copy();
    var oldCatPrefixParts = oldCat.parts().map(function(p) {return p;});
    var slotCount = 0;
    this.eachNormalSlotInMeAndSubcategories(function(s) {
      slotCount += 1;
      var newCatParts = s.category().parts().map(function(p) {return p;});
      
      // Just for the sake of sanity, let's check to make sure this slot really is in this category.
      for (var i = 0; i < oldCatPrefixParts.length; ++i) {
        if (newCatParts[i] !== oldCatPrefixParts[i]) {
          throw new Error("Assertion failure: renaming a category, but trying to recategorize a slot that's not in that category. ('" + newCatParts[i] + "' !== '" + oldCatPrefixParts[i] + "')");
        }
      }

      newCatParts[oldCatPrefixParts.length - 1] = newName;
      var newCat = category.create(newCatParts);
      //console.log("Changing the category of " + s.name() + " from " + oldCat + " to " + newCat);
      s.setCategory(newCat);
    });
    c.setLastPart(newName);
    return {oldCat: oldCat, newCat: c, numberOfRenamedSlots: slotCount};
  }, {category: ['renaming']});

  add.method('modules', function () {
    var modules = [];
    this.eachNormalSlotInMeAndSubcategories(function(s) {
      if (! s.isFromACopyDownParent()) {
        var m = s.module();
        if (! modules.include(m)) { modules.push(m); }
      }
    });
    return modules.sort();
  }, {category: ['modules']});

  add.method('modulesSummaryString', function () {
    var modules = this.modules();
    var n = modules.length;
    if (n === 0) { return ""; }
    if (n >=  5) { return n + " modules"; }
    var s = avocado.stringBuffer.create(n === 1 ? "Module:  " : "Modules:  ");
    var sep = "";
    modules.map(function(m) { return m ? m.lastPartOfName() : '-'; }).sort().each(function(name) {
      s.append(sep).append(name);
      sep = ", ";
    });
    return s.toString();
  }, {category: ['modules']});

  add.method('supernodeMorph', function (f) {
    var myCat = this.category();
    if (myCat.isRoot()) { return null; }
    return this.mirrorMorph().categoryMorphFor(myCat.supercategory());
  }, {category: ['slots panel']});

  add.method('immediateSubnodeMorphs', function () {
    var scms = [];
    this.eachImmediateSubnodeMorph(function(scm) { scms.push(scm); });
    return scms;
  }, {category: ['slots panel']});

  add.method('eachImmediateSubnodeMorph', function (f) {
    this.mirror().eachImmediateSubcategoryOf(this.category(), function(sc) { f(this.mirrorMorph().categoryMorphFor(sc)); }.bind(this));
  }, {category: ['slots panel']});

});


thisModule.addSlots(category.MorphMixin, function(add) {

  add.method('initializeCategoryUI', function () {
    this._highlighter = avocado.booleanHolder.containing(true).addObserver(function() {this.updateHighlighting();}.bind(this));
    this._highlighter.setChecked(false);

    this._expander = new ExpanderMorph(this);

    this._categoryPresenter.createModulesLabelRow();
  }, {category: ['initializing']});

  add.method('expander', function () { return this._expander; }, {category: ['expanding and collapsing']});

  add.method('expand', function () {
    this.expander().expand();
  }, {category: ['expanding and collapsing']});

  add.method('collapse', function () {
    this.expander().collapse();
  }, {category: ['expanding and collapsing']});

  add.method('eachSlot', function (f) {
    this._categoryPresenter.eachSlot(f);
  }, {category: ['iterating']});

  add.method('populateSlotsPanelInMeAndExistingSubcategoryMorphs', function () {
    if (! this.expander().isExpanded()) { return; }
    this._categoryPresenter.populateSlotsPanel();
    this._categoryPresenter.slotsPanel().submorphs.each(function(m) { if (m.constructor === category.Morph) { m.populateSlotsPanelInMeAndExistingSubcategoryMorphs(); } });
  }, {category: ['updating']});

  add.method('addSlot', function (initialContents, evt) {
    var name = this.mirror().findUnusedSlotName(typeof initialContents === 'function' ? "function" : "attribute");
    this.mirror().reflectee()[name] = initialContents;
    var s = this.mirror().slotAt(name);
    s.setCategory(this.category());
    if (s.contents().isReflecteeFunction()) { s.beCreator(); }
    var mirMorph = this.mirrorMorph();
    mirMorph.updateAppearance();
    mirMorph.expandCategory(this.category());
    mirMorph.slotMorphFor(s).wasJustAdded(evt);
  }, {category: ['adding']});

  add.method('addCategory', function (evt) {
    this.updateAppearance();
    this.expander().expand();
    var cm = new category.Morph(this._categoryPresenter.subcategory(""));
    cm.isNewCategory = true;
    cm.horizontalLayoutMode = LayoutModes.SpaceFill;
    this._categoryPresenter.slotsPanel().addRow(cm);
    cm.titleLabel.beWritableAndSelectAll();
  }, {category: ['adding']});

  add.method('modules', function () {
    return this._categoryPresenter.modules();
  }, {category: ['modules']});

  add.method('updateHighlighting', function () {
    if (this.highlighter().isChecked()) {
      this.beHighlighted();
    } else {
      this.beUnhighlighted();
    }
  }, {category: ['highlighting']});

  add.method('highlighter', function () { return this._highlighter; }, {category: ['highlighting']});

  add.method('addCategoryCommandsTo', function (cmdList) {
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
  }, {category: ['menu']});

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

    this.setPadding({top: 0, bottom: 0, left: 2, right: 2, between: 2});
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
                                                  {top: 0, bottom: 0, left: 0, right: 0, between: 3});
    this.replaceThingiesWith([this._headerRow]);
  }, {category: ['creating']});

  add.method('mirrorMorph', function () { return this._categoryPresenter.mirrorMorph(); }, {category: ['accessing']});

  add.method('mirror', function () { return this._categoryPresenter.mirror(); }, {category: ['accessing']});

  add.method('category', function () { return this._categoryPresenter.category(); }, {category: ['accessing']});

  add.data('grabsShouldFallThrough', true, {category: ['grabbing']});

  add.method('updateAppearance', function () {
    if (! this.world() || ! this.expander().isExpanded()) {return;}
    this._categoryPresenter.populateSlotsPanel();
    this._categoryPresenter.slotsPanel().submorphs.each(function(m) { m.updateAppearance(); }); // aaa is this gonna cause us to redo a lot of work?;
  }, {category: ['updating']});

  add.method('inspect', function () {return this.category().toString();}, {category: ['printing']});

  add.method('updateExpandedness', function () {
    if (! this.world()) {return;}
    var thingies = [this._headerRow];
    if (this.expander().isExpanded()) { thingies.push(this._categoryPresenter.slotsPanel()); }
    this.replaceThingiesWith(thingies);
  }, {category: ['updating']});

  add.method('rename', function (newName, evt) {
    // aaa - eww
    var result = this._categoryPresenter.rename(newName);
    this.mirrorMorph().justRenamedCategoryMorphFor(result.oldCat, result.newCat, result.numberOfRenamedSlots === 0);
  }, {category: ['renaming']});

  add.method('acceptsDropping', function (m) { // aaa - could this be generalized?
    if (typeof(m.canBeDroppedOnCategory) === 'function') { return m.canBeDroppedOnCategory(this); }
    return typeof(m.wasJustDroppedOnCategory) === 'function';
  }, {category: ['drag and drop']});

  add.method('justReceivedDrop', function (m) {
    if (this.acceptsDropping(m)) { 
      m.wasJustDroppedOnCategory(this);
    }
  }, {category: ['drag and drop']});

  add.method('constructUIStateMemento', function () {
    return { isExpanded: this.expander().constructUIStateMemento() };
  }, {category: ['UI state']});

  add.method('assumeUIState', function (uiState, evt) {
    if (!uiState) { return; }
    this.expander().assumeUIState(uiState.isExpanded, evt);
  }, {category: ['UI state']});

  add.method('addCommandsTo', function (cmdList) {
    this.addCategoryCommandsTo(cmdList);
  }, {category: ['menu']});

  add.method('grabCopy', function (evt) {
    var newMirror = reflect({});
    var newCategory = this.category().copyInto(this.mirror(), newMirror);
    var newCategoryPresenter = Object.newChildOf(category.Presenter, newMirror, newCategory);
    var newCategoryMorph = new category.Morph(newCategoryPresenter);
    newCategoryMorph.setFill(lively.paint.defaultFillWithColor(Color.gray));
    newCategoryMorph.horizontalLayoutMode = LayoutModes.ShrinkWrap;
    newCategoryMorph.forceLayoutRejiggering();
    if (! this.mirrorMorph().shouldAllowModification()) { newCategoryMorph._shouldOnlyBeDroppedOnThisParticularMirror = this.mirrorMorph().mirror(); }
    evt.hand.grabMorphWithoutAskingPermission(newCategoryMorph, evt);
    return newCategoryMorph;
  }, {category: ['drag and drop']});

  add.method('canBeDroppedOnCategory', function (categoryMorph) {
    if (this._shouldOnlyBeDroppedOnThisParticularMirror) { return categoryMorph.mirror() === this._shouldOnlyBeDroppedOnThisParticularMirror; }
    return true;
  }, {category: ['drag and drop']});

  add.method('canBeDroppedOnMirror', function (mirMorph) {
    if (this._shouldOnlyBeDroppedOnThisParticularMirror) { return mirMorph.mirror() === this._shouldOnlyBeDroppedOnThisParticularMirror; }
    return true;
  }, {category: ['drag and drop']});

  add.method('wasJustDroppedOnMirror', function (mirMorph) {
    this.copyToMirrorMorph(mirMorph, category.root());
  }, {category: ['drag and drop']});

  add.method('wasJustDroppedOnCategory', function (categoryMorph) {
    this.copyToMirrorMorph(categoryMorph.mirrorMorph(), categoryMorph.category());
  }, {category: ['drag and drop']});

  add.method('wasJustDroppedOnWorld', function (world) {
    if (! this._shouldOnlyBeDroppedOnThisParticularMirror) {
      var mirMorph = world.morphFor(reflect({}));
      world.addMorphAt(mirMorph, this.position());
      this.copyToMirrorMorph(mirMorph, category.root());
    }
  }, {category: ['drag and drop']});
  
  add.method('copyToMirrorMorph', function (mirMorph, cat) {
    var newCategory = this.category().copyInto(this.mirror(), mirMorph.mirror(), cat);
    mirMorph.expandCategory(newCategory);
    this.remove();
  }, {category: ['drag and drop']});

});


});
