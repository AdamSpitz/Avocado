transporter.module.create('programming_environment/mirror_morph', function(requires) {

requires('reflection/reflection');
requires('programming_environment/category_morph');

}, function(thisModule) {


thisModule.addSlots(mirror, function(add) {

  add.method('Morph', function Morph() { Class.initializer.apply(this, arguments); }, {category: ['user interface']});

  add.method('newMorph', function () {
    return new this.Morph(this);
  }, {category: ['user interface']});

  add.method('morph', function () {
    return WorldMorph.current().morphFor(this);
  }, {category: ['user interface']});

  add.data('isImmutableForMorphIdentity', true, {category: ['user interface']});

});


thisModule.addSlots(mirror.Morph, function(add) {

  add.data('superclass', ColumnMorph);

  add.creator('prototype', Object.create(ColumnMorph.prototype), {}, {copyDownParents: [{parent: category.MorphMixin}]});

  add.data('type', 'mirror.Morph');

});


thisModule.addSlots(mirror.Morph.prototype, function(add) {

  add.data('constructor', mirror.Morph);

  add.method('initialize', function ($super, m) {
    $super();
    this._mirror = m;

    this.setPadding({top: 2, bottom: 2, left: 4, right: 4, between: 2});
    this.shape.roundEdgesBy(10);

    this._slotMorphs     = dictionary.copyRemoveAll();
    this._categoryMorphs = dictionary.copyRemoveAll();

    this.setFill(lively.paint.defaultFillWithColor(Color.neutral.gray.lighter()));

    this._categoryPresenter = category.Presenter.create(this._mirror, category.root());
    this.initializeCategoryUI(); // aaa - can be a bit slow
    
    this._evaluatorsPanel = new ColumnMorph().beInvisible();
    this._evaluatorsPanel.horizontalLayoutMode = LayoutModes.SpaceFill;

    this.titleLabel = TextMorph.createLabel(function() {return m.inspect();});
    // this.titleLabel.setFontFamily('serif'); // not sure I like it
    // this.titleLabel.setEmphasis({style: 'bold'}); // I like it, except that the layout gets messed up

    this._commentToggler    = Object.newChildOf(toggler, this.updateExpandedness.bind(this), this.mirror().canHaveAnnotation() ? this.createRow(this.   commentMorph()) : null);
    this._annotationToggler = Object.newChildOf(toggler, this.updateExpandedness.bind(this), this.mirror().canHaveAnnotation() ?                this.annotationMorph()  : null);

    this.commentButton     = ButtonMorph.createButton("'...'", function(evt) { this._commentToggler.toggle(evt); }.bind(this), 1);
    this.parentButton      = ButtonMorph.createButton("^",     function(evt) { this.getParent(evt);              }.bind(this), 1).setHelpText('Get my parent');
    if (Global.EvaluatorMorph) {
      this.evaluatorButton = ButtonMorph.createButton("E",     function(evt) { this.openEvaluator(evt);          }.bind(this), 1).setHelpText('Show an evaluator box');
    }
    this.dismissButton   = this.createDismissButton();

    this.commentButton.getHelpText = function() { return (this._commentToggler.isOn() ? 'Hide' : 'Show') + ' my comment'; }.bind(this);

    var optionalParentButtonMorph  = Morph.createOptionalMorph(this.parentButton,  function() { return this.mirror().hasAccessibleParent(); }.bind(this));
    var optionalCommentButtonMorph = Morph.createOptionalMorph(this.commentButton, function() { return this._commentToggler.isOn() || (this.mirror().comment && this.mirror().comment()); }.bind(this));
    
    this._headerRow = RowMorph.createSpaceFilling([this._expander, this.titleLabel, optionalCommentButtonMorph, Morph.createSpacer(), optionalParentButtonMorph, this.evaluatorButton, this.dismissButton],
                                            {top: 0, bottom: 0, left: 0, right: 0, between: 3});
    this._headerRow.refreshContentOfMeAndSubmorphs();

    this.optionalSlotsPanel = Morph.createOptionalMorph(function() {return this._categoryPresenter.slotsPanel();}.bind(this),
                                                  function() {return this.expander().isExpanded();}.bind(this),
                                                  {horizontalLayoutMode: LayoutModes.SpaceFill, verticalLayoutMode: LayoutModes.ShrinkWrap});

    this.setPotentialContent([this._headerRow, this._annotationToggler, this._commentToggler, this.optionalSlotsPanel, this._evaluatorsPanel]);

    this.refreshContent();

    this.startPeriodicallyUpdating();
  }, {category: ['creating']});

  add.method('mirror', function () { return this._mirror; }, {category: ['accessing']});

  add.method('mirrorMorph', function () { return this; }, {comment: 'For compatibility with category.Morph.', category: ['accessing']});

  add.method('category', function () { return this._categoryPresenter.category(); }, {category: ['accessing']});

  add.method('createRow', function (m) {
    var r = RowMorph.createSpaceFilling([m], {left: 15, right: 2, top: 2, bottom: 2, between: 0});
    r.wasJustShown = function(evt) { m.requestKeyboardFocus(evt.hand); };
    return r;
  }, {category: ['creating']});

  add.method('annotationMorph', function () {
    var m = this._annotationMorph;
    if (m) { return m; }
    m = this._annotationMorph = new ColumnMorph(this).beInvisible();
    m.horizontalLayoutMode = LayoutModes.SpaceFill;

    // aaa - shouldn't really be a string; do something nicer, some way of specifying a list
    this._copyDownParentsLabel = new TextMorphRequiringExplicitAcceptance(this.copyDownParentsString.bind(this), this.setCopyDownParentsString.bind(this));
    m.setRows([RowMorph.createSpaceFilling([TextMorph.createLabel("Copy-down parents:"), this._copyDownParentsLabel])]);
    return m;
  }, {category: ['annotation']});

  add.method('copyDownParentsString', function () {
    return reflect(this.mirror().copyDownParents()).expressionEvaluatingToMe();
  }, {category: ['annotation']});

  add.method('setCopyDownParentsString', function (str) {
    MessageNotifierMorph.showIfErrorDuring(function() {
      this.mirror().setCopyDownParents(eval(str));
    }.bind(this), Event.createFake());
    this.updateAppearance(); // to make the copied-down slots appear;
  }, {category: ['annotation']});

  add.method('updateAppearance', function () {
    if (! this.world()) { return; }
    this.populateSlotsPanelInMeAndExistingSubcategoryMorphs();
    this.refreshContentOfMeAndSubmorphs();
  }, {category: ['updating']});

  add.method('inspect', function () {return this.mirror().inspect();}, {category: ['printing']});

  add.method('updateExpandedness', function () {
    if (! this.world()) {return;}
    this.optionalSlotsPanel.refreshContent();
    this.refreshContent();
  }, {category: ['updating']});

  add.method('expandCategory', function (c) {
    if (! c.isRoot()) { this.expandCategory(c.supercategory()); }
    var m = c.isRoot() ? this : this.categoryMorphFor(c);
    m.expander().expand();
    m._categoryPresenter.populateSlotsPanel();
  }, {category: ['categories']});

  add.method('slotMorphFor', function (s) {
    return this._slotMorphs.getOrIfAbsentPut(s.name(), function() { return s.newMorph(); });
  }, {category: ['slots panel']});

  add.method('existingCategoryMorphFor', function (c) {
    return this._categoryMorphs.get(c.fullName());
  }, {category: ['categories']});

  add.method('categoryMorphFor', function (c) {
    return this._categoryMorphs.getOrIfAbsentPut(c.fullName(), function() { return new category.Morph(Object.newChildOf(category.Presenter, this.mirror(), c)); }.bind(this));
  }, {category: ['categories']});

  add.method('commentMorph', function () {
    var m = this._commentMorph;
    if (m) { return m; }
    var thisMirMorph = this;
    m = new TextMorphRequiringExplicitAcceptance(function( ) { return thisMirMorph.mirror().comment(); },
                                                 function(c) { thisMirMorph.mirror().setComment(c); });
    this._commentMorph = m;
    return m;
  }, {category: ['comment']});

  add.method('openEvaluator', function (evt) {
    var e = new EvaluatorMorph(this);
    this._evaluatorsPanel.addRow(e);
    e.wasJustShown(evt);
    return e;
  }, {category: ['evaluators']});

  add.method('getParent', function (evt) {
    evt.hand.world().morphFor(this.mirror().parent()).grabMe(evt);
  }, {category: ['menu']});

  add.method('interposeNewParent', function (evt) {
    var world = this.world();
    var oldParent = this.mirror().parent();
    var newParent = oldParent.createChild();
    var oldParentMorph = world.morphFor(oldParent);
    var newParentMorph = world.morphFor(newParent);
    
    oldParentMorph.ensureIsInWorld(world, this.getPosition().addXY(0, -150), false, false, false, function() {
      evt.hand.world().addMorphAt(newParentMorph, pt(-1000, -1000));
                this.expander().expand();
      newParentMorph.expander().expand();
      newParentMorph.growFromNothingAt(this.getPosition().midPt(oldParentMorph.getPosition()).addPt(newParentMorph.getExtent().scaleBy(0.5)), function() {
        this.mirror().setParent(newParent);
        this.mirror().parentSlot().beCreator();
        newParentMorph.updateAppearance(); // just so that the proper name shows up immediately
        newParentMorph.slotMorphFor(    newParent.parentSlot()).showContentsArrow();
                  this.slotMorphFor(this.mirror().parentSlot()).showContentsArrow();
      }.bind(this));
    }.bind(this));
  }, {category: ['menu']});

  add.method('addCommandsTo', function (cmdList) {
    this.addCategoryCommandsTo(cmdList);

    cmdList.addLine();
    if (this.mirror().canHaveChildren()) {
      cmdList.addItem({label: "create child", go: function(evt) { this.createChild(evt); }.bind(this)});
    }

    if (this.mirror().isReflecteeProbablyAClass()) {
      cmdList.addItem({label: "create subclass", go: function(evt) { this.createSubclass(evt); }.bind(this)});
    }

    if (this.mirror().hasAccessibleParent()) {
      cmdList.addItem({label: "get my parent", go: function(evt) { this.getParent(evt); }.bind(this)});
      cmdList.addItem({label: "interpose new parent", go: function(evt) { this.interposeNewParent(evt); }.bind(this)});
    }
    
    if (this.mirror().canHaveAnnotation()) {
      cmdList.addLine();

      if (this.mirror().comment) {
        cmdList.addItem({label: this._commentToggler.isOn() ? "hide comment" : "show comment", go: function(evt) { this._commentToggler.toggle(evt); }.bind(this)});
      }

      cmdList.addItem({label: this._annotationToggler.isOn() ? "hide annotation" : "show annotation", go: function(evt) { this._annotationToggler.toggle(evt); }.bind(this)});

      cmdList.addItem({label: "set module...", go: function(evt) {
        var all = {};
        var chooseTargetModule = function(sourceModuleName, evt) {
          transporter.chooseOrCreateAModule(evt, this.modules(), this, "To which module?", function(targetModule, evt) {
            this.mirror().eachNormalSlot(function(slot) {
              if (! slot.isFromACopyDownParent()) {
                if (sourceModuleName === all || (!slot.module() && sourceModuleName === '-') || (slot.module() && slot.module().name() === sourceModuleName)) {
                  slot.setModule(targetModule);
                }
              }
            }.bind(this)); 
          }.bind(this));
        }.bind(this);
            
        var whichSlotsMenu = new MenuMorph([], this);
        whichSlotsMenu.addItem(["All", function(evt) {chooseTargetModule(all, evt);}.bind(this)]);
        whichSlotsMenu.addLine();
        this.modules().map(function(m) { return m ? m.name() : '-'; }).sort().each(function(moduleName) {
          whichSlotsMenu.addItem([moduleName, function(evt) {chooseTargetModule(moduleName, evt);}.bind(this)]);
        }.bind(this));
        whichSlotsMenu.openIn(this.world(), evt.point(), false, "Of which slots?");
      }.bind(this)});
    }

    cmdList.addLine();

    cmdList.addItem({label: "well-known references", go: function(evt) {
      var slice = new SliceMorph(referenceFinder.create(this.mirror().reflectee()));
      slice.grabMe(evt);
      slice.redo();
    }.bind(this)});
    
    cmdList.addItem({label: "well-known children", go: function(evt) {
      evt.hand.world().morphFor(reflect(this.mirror().wellKnownChildren())).grabMe(evt);
    }.bind(this)});

    cmdList.addLine();
    
    cmdList.addItem({label: "show inheritance hierarchy", go: function(evt) {
      var w = evt.hand.world();
      var parentFunction = function(o) { return o.mirror().hasParent() ? w.morphFor(o.mirror().parent()) : null; };
      var childrenFunction = function(o) { return o.mirror().wellKnownChildren().map(function(child) { return w.morphFor(reflect(child)); }); };
      w.assumePose(Object.newChildOf(poses.tree, this.mirror().inspect() + " inheritance tree", this, parentFunction, childrenFunction));
    }.bind(this)});
  }, {category: ['menu']});

  add.method('createChild', function (evt) {
    var child = this.mirror().createChild();
    var childMirMorph = this.world().morphFor(child);
    
    // might as well show the arrow from the child to the parent

    evt.hand.world().addMorphAt(childMirMorph, pt(-1000, -1000));
    childMirMorph.expander().expand();

    childMirMorph.growFromNothing(evt, function() {
      var parentSlotMorph = childMirMorph.slotMorphFor(child.parentSlot());
      parentSlotMorph.contentsPointer().pushMe();
    });
  }, {category: ['creating children']});

  add.method('createSubclass', function (evt) {
    var subclass = reflect(this.mirror().reflectee().subclass());
    var prototypeSlot = subclass.slotAt('prototype');
    prototypeSlot.beCreator();
    var subclassMirMorph = this.world().morphFor(subclass);
    subclassMirMorph.grabMe(evt);

    // might as well show the arrow from the subclass to the superclass
    subclassMirMorph.expander().expand();
    var superclassSlotMorph = subclassMirMorph.slotMorphFor(subclass.slotAt('superclass'));
    superclassSlotMorph.contentsPointer().pushMe();
  }, {category: ['creating children']});

  add.method('showCreatorPath', function (evt, callWhenDone) {
    var myMirror = this.mirror();
    if (myMirror.reflectee() === Global) {
      this.ensureIsInWorld(evt.hand.world(), pt(50,50), true, false, true, callWhenDone);
    } else {
      var creatorSlot = myMirror.probableCreatorSlot();
      var mirMorphForCreator = evt.hand.world().morphFor(creatorSlot.holder());
      mirMorphForCreator.showCreatorPath(evt, function() {
        mirMorphForCreator.expandCategory(creatorSlot.category());
        mirMorphForCreator.slotMorphFor(creatorSlot).showContentsArrow(function() {
          if (callWhenDone) { callWhenDone(); }
        }.bind(this));
      }.bind(this));
    }
  }, {category: ['creator slots']});

  add.method('acceptsDropping', function (m) { // aaa - could this be generalized?
    return typeof(m.wasJustDroppedOnMirror) === 'function';
  }, {category: ['drag and drop']});

  add.method('justReceivedDrop', function (m) {
    if (this.acceptsDropping(m)) { 
      m.wasJustDroppedOnMirror(this);
    }
  }, {category: ['drag and drop']});

  add.method('remove', function ($super) {
    this.detachArrowEndpoints();
    $super();
  }, {category: ['removing']});

  add.method('constructUIStateMemento', function () {
    var mem = {
      isExpanded: this.expander().isExpanded(),
      isCommentOpen: this._commentToggler.isOn(),
      isAnnotationOpen: this._annotationToggler.isOn(),
      categories: [],
      slots: []
    };
    
    this._categoryMorphs.eachValue(function(cm) { mem.categories.push([cm.category().parts(), cm.constructUIStateMemento()]); });
    this.    _slotMorphs.eachValue(function(sm) { mem.slots     .push([sm.slot().name(),      sm.constructUIStateMemento()]); });

    return mem;
  }, {category: ['UI state']});

  add.method('assumeUIState', function (uiState, evt) {
    evt = evt || Event.createFake();
    this._commentToggler   .setValue( uiState.isCommentOpen,    evt );
    this._annotationToggler.setValue( uiState.isAnnotationOpen, evt );
    this.expander().setExpanded(uiState.isExpanded);
    uiState.categories.each(function(a) { this.categoryMorphFor(     category.create(a[0])).assumeUIState(a[1]); }.bind(this));
    uiState.slots     .each(function(a) { this.    slotMorphFor(this.mirror().slotAt(a[0])).assumeUIState(a[1]); }.bind(this));
  }, {category: ['UI state']});

});


});
