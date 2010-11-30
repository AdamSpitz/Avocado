transporter.module.create('lk_programming_environment/mirror_morph', function(requires) {

requires('reflection/reflection');
requires('lk_programming_environment/category_morph');

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

  add.data('superclass', avocado.ColumnMorph);

  add.creator('prototype', Object.create(avocado.ColumnMorph.prototype), {}, {copyDownParents: [{parent: category.MorphMixin}]});

  add.data('type', 'mirror.Morph');

});


thisModule.addSlots(mirror.Morph.prototype, function(add) {

  add.data('constructor', mirror.Morph);

  add.method('initialize', function ($super, m) {
    $super();
    this._mirror = m;

    this.setPadding({top: 2, bottom: 2, left: 4, right: 4, between: {x: 2, y: 2}});
    this.shape.roundEdgesBy(10);

    this._slotMorphs     = avocado.dictionary.copyRemoveAll();
    this._categoryMorphs = avocado.dictionary.copyRemoveAll();

    this.setFill(lively.paint.defaultFillWithColor(Color.neutral.gray.lighter()));

    this._categoryPresenter = category.root().ofMirror(this._mirror);
    this.initializeCategoryUI(); // aaa - can be a bit slow
    
    this._evaluatorsPanel = new avocado.ColumnMorph().beInvisible();
    this._evaluatorsPanel.horizontalLayoutMode = LayoutModes.SpaceFill;

    this.titleLabel = TextMorph.createLabel(function() {return m.inspect();});

    this._commentToggler    = Object.newChildOf(avocado.toggler, this.updateExpandedness.bind(this), this.mirror().canHaveAnnotation() ? this.createRow(this.   commentMorph()) : null);
    this._annotationToggler = Object.newChildOf(avocado.toggler, this.updateExpandedness.bind(this), this.mirror().canHaveAnnotation() ?                this.annotationMorph()  : null);

    this.akaButton         = ButtonMorph.createButton("AKA", function(evt) { this.showAKAMenu(evt);            }.bind(this), 1);
    this.commentButton     = ButtonMorph.createButton("'...'", function(evt) { this._commentToggler.toggle(evt); }.bind(this), 1);
    this.parentButton      = ButtonMorph.createButton("^",     function(evt) { this.getParent(evt);              }.bind(this), 1).setHelpText('Get my parent');
    if (window.avocado && avocado.EvaluatorMorph) {
      this.evaluatorButton = ButtonMorph.createButton("E",     function(evt) { this.openEvaluator(evt);          }.bind(this), 1).setHelpText('Show an evaluator box');
    }
    this.dismissButton   = this.createDismissButton();

    this.commentButton.getHelpText = function() { return (this._commentToggler.isOn() ? 'Hide' : 'Show') + ' my comment'; }.bind(this);

    var optionalAKAButtonMorph     = Morph.createOptionalMorph(this.    akaButton, function() { return this.mirror().hasMultiplePossibleNames(); }.bind(this));
    var optionalParentButtonMorph  = Morph.createOptionalMorph(this. parentButton, function() { return this.mirror().hasAccessibleParent(); }.bind(this));
    var optionalCommentButtonMorph = Morph.createOptionalMorph(this.commentButton, function() { return this._commentToggler.isOn() || (this.mirror().comment && this.mirror().comment()); }.bind(this));
    
    this._headerRow = avocado.RowMorph.createSpaceFilling([this._expander, this.titleLabel, optionalAKAButtonMorph, optionalCommentButtonMorph, Morph.createSpacer(), optionalParentButtonMorph, this.evaluatorButton, this.dismissButton].compact(),
                                                  {top: 0, bottom: 0, left: 0, right: 0, between: {x: 3, y: 3}});
    this._headerRow.refreshContentOfMeAndSubmorphs();

    this.optionalSlotsPanel = Morph.createOptionalMorph(function() {return this.slotsPanel();}.bind(this),
                                                  function() {return this.expander().isExpanded();}.bind(this),
                                                  {horizontalLayoutMode: LayoutModes.SpaceFill, verticalLayoutMode: LayoutModes.ShrinkWrap});

    this.setPotentialRows([this._headerRow, this._annotationToggler, this._commentToggler, this.optionalSlotsPanel, this._evaluatorsPanel]);

    this.refreshContent();

    this.startPeriodicallyUpdating();
  }, {category: ['creating']});

  add.method('mirror', function () { return this._mirror; }, {category: ['accessing']});

  add.method('mirrorMorph', function () { return this; }, {comment: 'For compatibility with category.Morph.', category: ['accessing']});
  
  add.method('eachAssociatedObject', function (f) {
    f(this.mirror().reflectee());
    f(this.mirror());
  }, {category: ['associated objects']});

  add.method('createRow', function (m) {
    var r = avocado.RowMorph.createSpaceFilling([m], {left: 15, right: 2, top: 2, bottom: 2, between: {x: 0, y: 0}});
    r.wasJustShown = function(evt) { m.requestKeyboardFocus(evt.hand); };
    return r;
  }, {category: ['creating']});

  add.method('annotationMorph', function () {
    var m = this._annotationMorph;
    if (m) { return m; }
    m = this._annotationMorph = new avocado.ColumnMorph(this).beInvisible();
    m.horizontalLayoutMode = LayoutModes.SpaceFill;

    // aaa - shouldn't really be a string; do something nicer, some way of specifying a list
    this._copyDownParentsLabel = new TextMorphRequiringExplicitAcceptance(this.copyDownParentsString.bind(this), this.setCopyDownParentsString.bind(this));
    this._copyDownParentsLabel.suppressHandles = true;
    m.setRows([avocado.RowMorph.createSpaceFilling([TextMorph.createLabel("Copy-down parents:"), this._copyDownParentsLabel])]);
    return m;
  }, {category: ['annotation']});

  add.method('copyDownParentsString', function () {
    return reflect(this.mirror().copyDownParents()).expressionEvaluatingToMe();
  }, {category: ['annotation']});

  add.method('setCopyDownParentsString', function (str) {
    avocado.ui.showMessageIfErrorDuring(function() {
      this.mirror().setCopyDownParents(eval(str));
    }.bind(this));
    this.updateAppearance(); // to make the copied-down slots appear;
    
    // Sometimes the text doesn't come out quite identical; this makes sure the
    // editor doesn't stay red.
    if (this._copyDownParentsLabel) { this._copyDownParentsLabel.cancelChanges(); }
  }, {category: ['annotation']});

  add.method('updateAppearance', function () {
    if (! this.world()) { return; }
    this.populateSlotsPanelInMeAndExistingSubcategoryMorphs();
    this.refreshContentOfMeAndSubmorphs();
  }, {category: ['updating']});

  add.method('refreshContent', function ($super) {
    $super();
    this.updateTitleLabelFont();
  }, {category: ['updating']});

  add.method('updateTitleLabelFont', function () {
    if (this.mirror().reflectee() === window || this.mirror().theCreatorSlot()) {
      // this.titleLabel.setFontFamily('serif'); // not sure I like it

      // aaa - This causes weird freezes when changing the name of an object. Fix it sometime. -- Adam
      // this.titleLabel.setEmphasis({style: 'bold'});
    } else {
      // this.titleLabel.setEmphasis({style: 'unbold'});
    }
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
    this.updateAppearance();
  }, {category: ['categories']});

  add.method('slotMorphFor', function (s) {
    return this._slotMorphs.getOrIfAbsentPut(s.name(), function() { return s.newMorph(); });
  }, {category: ['slots panel']});

  add.method('existingCategoryMorphFor', function (c) {
    return this._categoryMorphs.get(c.fullName());
  }, {category: ['categories']});

  add.method('categoryMorphFor', function (c) {
    return this._categoryMorphs.getOrIfAbsentPut(c.fullName(), function() {
      return new category.Morph(c.ofMirror(this.mirror()));
    }.bind(this));
  }, {category: ['categories']});

  add.method('justRenamedCategoryMorphFor', function (oldCat, newCat, isEmpty) {
    if (! this._categoryMorphs) { return; } // nothing to do, since we haven't expanded this mirror yet
    var oldCatMorph = this._categoryMorphs.removeKey(oldCat.fullName());
    if (oldCatMorph && !isEmpty) {
      var newCatMorph = this.categoryMorphFor(newCat);
      this.updateAppearance();
      oldCatMorph.transferUIStateTo(newCatMorph, Event.createFake());
    }
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
    var e = new avocado.EvaluatorMorph(this);
    this._evaluatorsPanel.addRow(e);
    e.wasJustShown(evt);
    return e;
  }, {category: ['evaluators']});
  
  add.method('closeEvaluator', function(evaluatorMorph) {
    this._evaluatorsPanel.removeRow(evaluatorMorph);
  }, {category: ['evaluators']});

  add.method('getParent', function (evt) {
    avocado.ui.grab(this.mirror().parent(), evt);
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

  add.method('shouldAllowModification', function () {
    return !window.isInCodeOrganizingMode;
  });

  add.method('commands', function () {
    var cmdList = avocado.command.list.create();
    cmdList.addAllCommands(this.categoryCommands());

    cmdList.addLine();
    
    if (this.mirror().canHaveChildren()) {
      if (this.shouldAllowModification()) {
        cmdList.addItem({label: "create child", go: function(evt) { this.createChild(evt); }.bind(this)});
      }
    }

    if (this.mirror().isReflecteeProbablyAClass()) {
      if (this.shouldAllowModification()) {
        cmdList.addItem({label: "create subclass", go: function(evt) { this.createSubclass(evt); }.bind(this)});
      }
    }

    if (this.mirror().hasAccessibleParent()) {
      cmdList.addItem({label: "get my parent", go: function(evt) { this.getParent(evt); }.bind(this)});
      if (this.shouldAllowModification()) {
        cmdList.addItem({label: "interpose new parent", go: function(evt) { this.interposeNewParent(evt); }.bind(this)});
      }
    }
    
    if (this.mirror().canHaveAnnotation()) {
      cmdList.addLine();

      if (this.mirror().comment) {
        cmdList.addItem({label: this._commentToggler.isOn() ? "hide comment" : "show comment", go: function(evt) {
          this._commentToggler.toggle(evt);
        }.bind(this)});
      }

      cmdList.addItem({label: this._annotationToggler.isOn() ? "hide annotation" : "show annotation", go: function(evt) {
        this._annotationToggler.toggle(evt);
      }.bind(this)});

      if (this.shouldAllowModification()) {
        cmdList.addItem({label: "set module...", go: function(evt) {
          this.mirror().interactivelySetModuleOfManySlots(evt);
        }.bind(this)});
      }
    }

    cmdList.addLine();

    cmdList.addItem({label: "well-known references", go: function(evt) {
      avocado.ui.grab(avocado.searchResultsPresenter.create(avocado.referenceFinder.create(this.mirror().reflectee()), evt)).redo();
    }.bind(this)});
    
    cmdList.addItem({label: "well-known children", go: function(evt) {
      avocado.ui.showObjects(this.mirror().wellKnownChildren().map(reflect), "well-known children of " + this.mirror().name(), evt);
    }.bind(this)});

    cmdList.addLine();
    
    cmdList.addItem({label: "show inheritance hierarchy", go: function(evt) {
      var w = evt.hand.world();
      var parentFunction = function(o) { return o.mirror().hasParent() ? w.morphFor(o.mirror().parent()) : null; };
      var childrenFunction = function(o) { return o.mirror().wellKnownChildren().map(function(child) { return w.morphFor(reflect(child)); }); };
      avocado.ui.poseManager(evt).assumePose(Object.newChildOf(avocado.poses.tree, this.mirror().inspect() + " inheritance tree", this, parentFunction, childrenFunction));
    }.bind(this)});
    
    return cmdList;
  }, {category: ['menu']});

  add.method('dragAndDropCommands', function () {
    var cmdList = avocado.command.list.create();
    
    cmdList.addAllCommands(this.categoryDragAndDropCommands());
    
    cmdList.addItem(avocado.command.create("make attribute point to me", function(evt, arrowEndpoint) {
      arrowEndpoint.wasJustDroppedOnMirror(this);
    }.bind(this)).setArgumentSpecs([avocado.command.argumentSpec.create('arrowEndpoint').onlyAccepts(function(m) {
      return typeof(m.wasJustDroppedOnMirror) === 'function';
    })]));
    
    return cmdList;
  }, {category: ['drag and drop']});

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
    var subclass = this.mirror().createSubclass();
    var subclassMirMorph = avocado.ui.grab(subclass, evt);

    // might as well show the arrow from the subclass to the superclass
    subclassMirMorph.expander().expand();
    var superclassSlotMorph = subclassMirMorph.slotMorphFor(subclass.slotAt('superclass'));
    superclassSlotMorph.contentsPointer().pushMe();
  }, {category: ['creating children']});

  add.method('showCreatorPath', function (evt, callWhenDone) {
    var myMirror = this.mirror();
    if (myMirror.reflectee() === window) {
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

  add.method('showAKAMenu', function (evt) {
    this.mirror().chooseAmongPossibleCreatorSlotChains(function() {this.updateAppearance();}.bind(this), evt);
  }, {category: ['creator slots']});

  add.method('remove', function ($super) {
    this.detachArrowEndpoints();
    $super();
  }, {category: ['removing']});

  add.method('partsOfUIState', function () {
    return {
      isExpanded:       this.expander(),
      isCommentOpen:    this._commentToggler,
      isAnnotationOpen: this._annotationToggler,
      categories: {
        collection: this._categoryMorphs.values(),
        keyOf: function(cm) { return cm.category().parts(); },
        getPartWithKey: function(morph, catParts) { return morph.categoryMorphFor(category.create(catParts)); }
      },
      slots: {
        collection: this._slotMorphs.values(),
        keyOf: function(sm) { return sm.slot().name(); },
        getPartWithKey: function(morph, name) { return morph.slotMorphFor(morph.mirror().slotAt(name)); }
      }
    };
  }, {category: ['UI state']});

});


});
