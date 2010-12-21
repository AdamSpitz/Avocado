transporter.module.create('lk_programming_environment/mirror_morph', function(requires) {

requires('reflection/reflection');
requires('lk_programming_environment/category_morph');
requires('lk_programming_environment/slot_morph');

}, function(thisModule) {


thisModule.addSlots(avocado.mirror, function(add) {

  add.method('Morph', function Morph() { Class.initializer.apply(this, arguments); }, {category: ['user interface']});

  add.method('newMorph', function () {
    return new this.Morph(this);
  }, {category: ['user interface']});

  add.method('morph', function () {
    return WorldMorph.current().morphFor(this);
  }, {category: ['user interface']});

  add.data('isImmutableForMorphIdentity', true, {category: ['user interface']});

});


thisModule.addSlots(avocado.mirror.Morph, function(add) {

  add.data('superclass', avocado.ColumnMorph);

  add.creator('prototype', Object.create(avocado.ColumnMorph.prototype));

  add.data('type', 'avocado.mirror.Morph');

});


thisModule.addSlots(avocado.mirror.Morph.prototype, function(add) {

  add.data('constructor', avocado.mirror.Morph);

  add.method('initialize', function ($super, m) {
    $super();
    this._mirror = m;
    this._model = m;

    this.applyStyle(this.defaultStyle);

    this._rootCategoryMorph = this.categoryMorphFor(avocado.category.root().ofMirror(this._mirror));
    this._expander = this._rootCategoryMorph.expander();
    
    this._evaluatorsPanel = new avocado.ColumnMorph().beInvisible().applyStyle({horizontalLayoutMode: avocado.LayoutModes.SpaceFill});

    this.titleLabel = TextMorph.createLabel(function() {return m.inspect();});

    this._commentToggler    = avocado.toggler.create(this, this.mirror().canHaveAnnotation() ? this.createRow(this.   commentMorph()) : null);
    this._annotationToggler = avocado.toggler.create(this, this.mirror().canHaveAnnotation() ? this.createRow(this.annotationMorph()): null);

    this.commentButton     = this._commentToggler.commandForToggling('my comment', "'...'").newMorph();
    this.akaButton         = avocado.command.create("AKA",   function(evt) { this.mirror().chooseAmongPossibleCreatorSlotChains(function() {}, evt); }.bind(this)).newMorph();
    this.parentButton      = avocado.command.create("^",     function(evt) { this.mirror().getParent(evt);     }.bind(this)).setHelpText('Get my parent').newMorph();
    if (window.avocado && avocado.EvaluatorMorph) {
      this.evaluatorButton = avocado.command.create("E",     function(evt) { this.openEvaluator(evt);          }.bind(this)).setHelpText('Show an evaluator box').newMorph();
    }
    this.dismissButton   = this.createDismissButton();

    var optionalAKAButtonMorph     = Morph.createOptionalMorph(this.    akaButton, function() { return this.mirror().hasMultiplePossibleNames(); }.bind(this));
    var optionalParentButtonMorph  = Morph.createOptionalMorph(this. parentButton, function() { return this.mirror().hasAccessibleParent(); }.bind(this));
    var optionalCommentButtonMorph = Morph.createOptionalMorph(this.commentButton, function() { return this._commentToggler.isOn() || (this.mirror().comment && this.mirror().comment()); }.bind(this));
    
    this._headerRow = avocado.RowMorph.createSpaceFilling([this._expander, this.titleLabel, optionalAKAButtonMorph, optionalCommentButtonMorph, Morph.createSpacer(), optionalParentButtonMorph, this.evaluatorButton, this.dismissButton].compact(), this.defaultStyle.headerRowPadding);
    this._headerRow.refreshContentOfMeAndSubmorphs();

    this.setPotentialRows([this._headerRow, this._annotationToggler, this._commentToggler, this._rootCategoryMorph, this._evaluatorsPanel]);

    this.refreshContent();

    this.startPeriodicallyUpdating();
  }, {category: ['creating']});

  add.method('mirror', function () { return this._mirror; }, {category: ['accessing']});

  add.method('eachAssociatedObject', function (f) {
    f(this.mirror().reflectee());
    f(this.mirror());
  }, {category: ['associated objects']});

  add.creator('defaultStyle', {}, {category: ['styles']});

  add.method('createRow', function (m) {
    var r = avocado.RowMorph.createSpaceFilling([m], this.defaultStyle.internalPadding);
    r.wasJustShown = function(evt) { m.wasJustShown(evt); };
    return r;
  }, {category: ['creating']});

  add.method('annotationMorph', function () {
    var m = this._annotationMorph;
    if (m) { return m; }
    m = this._annotationMorph = new avocado.ColumnMorph(this).beInvisible();
    m.horizontalLayoutMode = avocado.LayoutModes.SpaceFill;

    // aaa - shouldn't really be a string; do something nicer, some way of specifying a list
    this._copyDownParentsLabel = new TextMorphRequiringExplicitAcceptance(avocado.accessors.forMethods(this, 'copyDownParentsString'));
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
    avocado.ui.justChanged(this.mirror()); // to make the copied-down slots appear;
    
    // Sometimes the text doesn't come out quite identical; this makes sure the
    // editor doesn't stay red.
    if (this._copyDownParentsLabel) { this._copyDownParentsLabel.cancelChanges(); }
  }, {category: ['annotation']});

  add.method('updateExpandedness', function () {
    this.updateAppearance();
  }, {category: ['updating']});

  add.method('expandCategory', function (c) {
    this.expandCategoryMorph(this.categoryMorphFor(c));
  }, {category: ['categories']});

  add.method('expandCategoryMorph', function (cm) {
    cm.expandMeAndAncestors();
    this.updateAppearance(); /// aaa maybe this isn't necessary?;
  }, {category: ['categories']});

  add.method('slotMorphFor', function (s) {
    return s.morph();
  }, {category: ['contents panel']});

  add.method('existingCategoryMorphFor', function (c) {
    return c.ofMirror(this.mirror()).existingMorph();
  }, {category: ['categories']});

  add.method('categoryMorphFor', function (c) {
    return c.ofMirror(this.mirror()).morph();
  }, {category: ['categories']});

  add.method('justRenamedCategoryMorphFor', function (oldCat, newCat, isEmpty) {
    // aaa - Um, I don't think this code could ever have really worked right. When we
    // rename a category, it's going to screw with all the subcategories - they *all*
    // have different names now. What can we do about this?
    var oldCatMorph = this.existingCategoryMorphFor(oldCat);
    if (oldCatMorph) {
      WorldMorph.current().forgetAboutExistingMorphFor(oldCat, oldCatMorph);
      if (!isEmpty) {
        var newCatMorph = this.categoryMorphFor(newCat);
        this.updateAppearance();
        oldCatMorph.transferUIStateTo(newCatMorph, Event.createFake());
      }
    }
  }, {category: ['categories']});

  add.method('commentMorph', function () {
    return this._commentMorph || (this._commentMorph = new TextMorphRequiringExplicitAcceptance(avocado.accessors.forMethods(this.mirror(), 'comment')));
  }, {category: ['comment']});

  add.method('openEvaluator', function (evt) {
    var e = new avocado.EvaluatorMorph(this);
    this._evaluatorsPanel.addRow(e);
    e.wasJustShown(evt);
    return e;
  }, {category: ['evaluators']});

  add.method('closeEvaluator', function (evaluatorMorph) {
    this._evaluatorsPanel.removeRow(evaluatorMorph);
  }, {category: ['evaluators']});

  add.method('grabResult', function (resultMirMorph, evt) {
    if (resultMirMorph === this) {
      this.wiggle();
    } else {
      resultMirMorph.grabMe(evt);
    }
  }, {category: ['evaluators']});

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
    var cmdList = avocado.command.list.create(this);
    cmdList.addAllCommands(this._rootCategoryMorph.commands());
    cmdList.addLine();
    cmdList.addAllCommands(this.mirror().commands().wrapForMorph(this));
    cmdList.addLine();
    
    if (this.mirror().canHaveChildren()) {
      if (this.shouldAllowModification()) {
        cmdList.addItem({label: "create child", go: function(evt) { this.createChild(evt); }});
      }
    }

    if (this.mirror().isReflecteeProbablyAClass()) {
      if (this.shouldAllowModification()) {
        cmdList.addItem({label: "create subclass", go: function(evt) { this.createSubclass(evt); }});
      }
    }

    if (this.mirror().hasAccessibleParent()) {
      if (this.shouldAllowModification()) {
        cmdList.addItem({label: "interpose new parent", go: function(evt) { this.interposeNewParent(evt); }});
      }
    }
    
    if (this.mirror().canHaveAnnotation()) {
      cmdList.addLine();

      if (this.mirror().comment) {
        cmdList.addItem(this._commentToggler.commandForToggling("comment"));
      }

      cmdList.addItem(this._annotationToggler.commandForToggling("annotation"));
    }

    cmdList.addLine();
    
    cmdList.addItem({label: "show inheritance hierarchy", go: function(evt) {
      var w = evt.hand.world();
      var parentFunction = function(o) { return o.mirror().hasParent() ? w.morphFor(o.mirror().parent()) : null; };
      var childrenFunction = function(o) { return o.mirror().wellKnownChildren().map(function(child) { return w.morphFor(reflect(child)); }); };
      avocado.ui.poseManager(evt).assumePose(Object.newChildOf(avocado.poses.tree, this.mirror().inspect() + " inheritance tree", this, parentFunction, childrenFunction));
    }});
    
    return cmdList;
  }, {category: ['menu']});

  add.method('dragAndDropCommands', function () {
    var cmdList = avocado.command.list.create(this);
    
    cmdList.addAllCommands(this._rootCategoryMorph.dragAndDropCommands());
    
    cmdList.addItem(avocado.command.create("make attribute point to me", function(evt, arrowEndpoint) {
      arrowEndpoint.wasJustDroppedOnMirror(this);
    }).setArgumentSpecs([avocado.command.argumentSpec.create('arrowEndpoint').onlyAccepts(function(m) {
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
    if (myMirror.equals(reflect(window))) {
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

  add.method('remove', function ($super) {
    this.detachArrowEndpoints();
    $super();
  }, {category: ['removing']});

  add.method('partsOfUIState', function () {
    return Object.extend({
      isExpanded:       this._expander,  // the root category already has this, but we want it at the top level so "clean up" can set it
      isCommentOpen:    this._commentToggler,
      isAnnotationOpen: this._annotationToggler,
      rootCategory:     this._rootCategoryMorph
    });
  }, {category: ['UI state']});

});


thisModule.addSlots(avocado.mirror.Morph.prototype.defaultStyle, function(add) {

  add.data('borderColor', new Color(0.6, 0.6, 0.6));

  add.data('borderWidth', 1);

  add.data('borderRadius', 10);

  add.data('openForDragAndDrop', false);

  add.data('fill', new lively.paint.LinearGradient([new lively.paint.Stop(0, new Color(0.9019607843137255, 0.9019607843137255, 0.9019607843137255)), new lively.paint.Stop(1, new Color(0.8, 0.8, 0.8))], lively.paint.LinearGradient.NorthSouth));

  add.data('padding', {top: 2, bottom: 2, left: 4, right: 4, between: {x: 2, y: 2}}, {initializeTo: '{top: 2, bottom: 2, left: 4, right: 4, between: {x: 2, y: 2}}'});

  add.data('internalPadding', {left: 15, right: 2, top: 2, bottom: 2, between: {x: 0, y: 0}}, {initializeTo: '{left: 15, right: 2, top: 2, bottom: 2, between: {x: 0, y: 0}}'});

  add.data('headerRowPadding', {top: 0, bottom: 0, left: 0, right: 0, between: {x: 3, y: 3}}, {initializeTo: '{top: 0, bottom: 0, left: 0, right: 0, between: {x: 3, y: 3}}'});

});


});
