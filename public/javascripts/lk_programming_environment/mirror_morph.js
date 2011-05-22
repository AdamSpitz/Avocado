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

  add.data('type', 'avocado.mirror.Morph');

  add.creator('prototype', Object.create(avocado.ColumnMorph.prototype));

});


thisModule.addSlots(avocado.mirror.Morph.prototype, function(add) {

  add.data('constructor', avocado.mirror.Morph);

  add.method('initialize', function ($super, m) {
    $super();
    this._mirror = m;
    this._model = m;

    this.applyStyle(this.defaultStyle);

    this._nameMorph = TextMorph.createLabel(function() {return m.name();});
    this._nameMorph.setEmphasis({style: 'bold'});
    
    var descLabel = TextMorph.createLabel('');
    descLabel.setScale(0.9);
    this._descMorph = avocado.morphHider.create(this, descLabel, null, function() {
      var s = m.shortDescription();
      descLabel.setText(s);
      return s !== '';
    });

    if (this.mirror().canHaveAnnotation() || this.mirror().hasAccessibleParent()) {
      if (this.shouldUseZooming()) {
        this._annotationToggler = avocado.scaleBasedMorphHider.create(this, this.annotationRow.bind(this), this, 1, pt(50,10)); // aaa made-up space-holder-size number
      } else {
        this._annotationToggler = avocado.morphToggler.create(this, this.annotationRow.bind(this));
        if (this.mirror().canHaveAnnotation()) {
          this._commentToggler  = avocado.morphToggler.create(this, this.commentRow.bind(this));
        }
      }
    }

    // this.refreshContent();   // this used to be here, but I took it out as an optimization; still not quite sure that it isn't needed -- Adam, Apr. 2011

    this.startPeriodicallyUpdating();
  }, {category: ['creating']});

  add.method('mirror', function () { return this._mirror; }, {category: ['accessing']});

  add.method('toString', function () {
    return this.mirror().inspect();
  }, {category: ['printing']});

  add.method('shouldUseZooming', function () {
    return avocado.shouldMirrorsUseZooming;
  }, {category: ['zooming']});
  
  add.method('headerRow', function () {
    if (! this._headerRow) {
      if (this._commentToggler) {
        var optionalCommentButtonMorph = avocado.morphHider.create(this, function() {
          return this._commentToggler.commandForToggling('my comment', "'...'").newMorph();
        }.bind(this).memoize(), null, function() {
          return this._commentToggler.isOn() || (this.mirror().comment && this.mirror().comment());
        }.bind(this));
      }
      
      if (! this.shouldUseZooming()) {
        // With zooming, these buttons clutter up the object. Plus the parent button isn't really necessary and doesn't make sense
        // now that the __proto__ slot is always visible (rather than hidden because the object isn't expanded). And the E button
        // is less interesting now that we have the "script me" command, plus it's kinda weird because evaluators belong to vocab
        // morphs instead of mirror morphs.

        if (this.mirror().hasAccessibleParent()) {
          var parentButton = avocado.command.create("^", function(evt) { this.mirror().getParent(evt); }.bind(this)).setHelpText('Get my parent').newMorph();
        }

        if (window.avocado && avocado.EvaluatorMorph) {
          var evaluatorButton = avocado.command.create("E", function(evt) { this.openEvaluator(evt); }.bind(this)).setHelpText('Show an evaluator box').newMorph();
        }
      }

      var optionalDismissButtonMorph = this.shouldUseZooming() ? null : this.createDismissButtonThatOnlyAppearsIfTopLevel();
      
      var optionalAKAButtonMorph = avocado.morphHider.create(this, function() {
        return avocado.command.create("AKA", function(evt) { this.mirror().chooseAmongPossibleCreatorSlotChains(function() {}, evt); }.bind(this)).newMorph();
      }.bind(this).memoize(), null, function() {
        return this.mirror().hasMultiplePossibleNames();
      }.bind(this));

      var descInHeader = this.shouldUseZooming() ? null : this._descMorph;
      
      var headerRowContents = [this.shouldUseZooming() ? Morph.createSpacer() : null, this.expander(), this._nameMorph, descInHeader, optionalAKAButtonMorph, optionalCommentButtonMorph, Morph.createSpacer(), parentButton, evaluatorButton, optionalDismissButtonMorph].compact();
      this._headerRow = avocado.RowMorph.createSpaceFilling(function() { return headerRowContents; }, this.defaultStyle.headerRowPadding);
      this._headerRow.refreshContentOfMeAndSubmorphs();
    }
    return this._headerRow;
  }, {category: ['header row']});
  
  add.method('potentialContent', function () {
    if (! this._potentialRows) {
      this._potentialRows = [this.headerRow(), this.shouldUseZooming() ? this._descMorph : null, this._annotationToggler, this._commentToggler, this.mirror().canHaveSlots() ? this.rootCategoryMorph() : null, this.evaluatorsPanel()].compact();
    }
    
    if (! this._potentialContent) {
      this._potentialContent = avocado.tableContents.createWithColumns([this._potentialRows]);
    }
    
    return this._potentialContent;
  }, {category: ['updating']});
  
  add.method('rootCategoryMorph', function () {
    if (! this._rootCategoryMorph) {
      this._rootCategoryMorph = this.categoryMorphFor(this._mirror.rootCategory());
    }
    return this._rootCategoryMorph;
  }, {category: ['root category']});
  
  add.method('expand', function () {
    var e = this.expander();
    if (e) { e.expand(); }
  }, {category: ['expanding']});

  add.method('eachAssociatedObject', function (f) {
    f(this.mirror().reflectee());
    f(this.mirror());
  }, {category: ['associated objects']});

  add.method('storeString', function () {
    // aaa - This is not the right long-term solution for saving mirror morphs.
    //       The transporter should be able to handle them. But for now it's
    //       choking for some reason, so let's do this for now. -- Adam, Mar. 2011
    return [
      "(function() {var m = (",
      this.mirror().storeString(),
      ").morph(); m.setPosition(",
      this.getPosition().storeString(),
      /* aaa - not working because the UI state contains references to the actual reflectee of the mirror,
               which means it needs to respect object identity
      "); m.assumeUIState(",
      reflect(this.constructUIStateMemento()).expressionEvaluatingToMe(),
      */
      "); return m; })()"
    ].join("");
  }, {category: ['transporting']});

  add.method('storeStringNeeds', function () {
    return avocado.mirror;
  }, {category: ['transporting']});

  add.method('shouldNotBeTransported', function () {
    // aaa - Actually, for now, let's just not have mirrors get saved at all, because they
    // don't really come back right (what with the object identity problems).
    return true;
  }, {category: ['poses']});

  add.creator('defaultStyle', {}, {category: ['styles']});

  add.creator('annotationStyle', {}, {category: ['styles']});

  add.creator('commentStyle', {}, {category: ['styles']});

  add.creator('copyDownParentsStyle', {}, {category: ['styles']});

  add.method('createRow', function (m) {
    var content = this.shouldUseZooming() ? [Morph.createSpacer(), m, Morph.createSpacer()] : [m, Morph.createSpacer()];
    var r = avocado.RowMorph.createSpaceFilling(content, this.defaultStyle.internalPadding);
    r.wasJustShown = function(evt) { m.wasJustShown(evt); };
    return r;
  }, {category: ['creating']});

  add.method('annotationMorph', function () {
    var m = this._annotationMorph;
    if (m) { return m; }
    m = this._annotationMorph = avocado.TableMorph.newColumn().beInvisible().applyStyle(this.annotationStyle);
    if (this.shouldUseZooming()) { m.setScale(0.25); }

    // aaa - shouldn't really be a string; do something nicer, some way of specifying a list
    this._copyDownParentsLabel = new avocado.TextMorphRequiringExplicitAcceptance(avocado.accessors.forMethods(this, 'copyDownParentsString')).applyStyle(this.copyDownParentsStyle);

    var rows = [];
    if (this.shouldUseZooming()) { rows.push(avocado.RowMorph.createSpaceFilling([TextMorph.createLabel("Comment:"), this.commentMorph()])); }
    rows.push(avocado.RowMorph.createSpaceFilling([TextMorph.createLabel("Copy-down parents:"), this._copyDownParentsLabel]).setScale(this.shouldUseZooming() ? 0.5 : 1.0));
    m.setRows(rows);
    return m;
  }, {category: ['annotation']});

  add.method('annotationRow', function () {
    var m = this._annotationRow;
    if (m) { return m; }

    var annoMorph = this.mirror().canHaveAnnotation() ? this.annotationMorph() : null;
    var parentSlotMorph = this.mirror().hasAccessibleParent() ? this.slotMorphFor(this.mirror().parentSlot()) : null;
    if (parentSlotMorph) { parentSlotMorph.setScale(this.shouldUseZooming() ? 0.5 : 1.0); }
    var content = this.shouldUseZooming() ? [parentSlotMorph, Morph.createSpacer(), annoMorph].compact() : [parentSlotMorph, annoMorph, Morph.createSpacer()].compact();
    var r = this._annotationRow = avocado.RowMorph.createSpaceFilling(content, this.defaultStyle.internalPadding);
    r.wasJustShown = function(evt) { annoMorph.wasJustShown(evt); };

    return r;
  }, {category: ['annotation']});

  add.method('commentRow', function () {
    var m = this._commentRow;
    if (m) { return m; }
    m = this._commentRow = this.createRow(this.commentMorph());
    return m;
  }, {category: ['comment']});
  
  add.method('commentMorph', function () {
    return this._commentMorph || (this._commentMorph = new avocado.TextMorphRequiringExplicitAcceptance(avocado.accessors.forMethods(this.mirror(), 'comment')).applyStyle(this.commentStyle));
  }, {category: ['comment']});

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

  add.method('expander', function () {
    if (this.shouldUseZooming()) { return null; }
    if (! this._expander) {
      this._expander = this.rootCategoryMorph().expander();
    }
    return this._expander;
  }, {category: ['expanding']});

  add.method('updateExpandedness', function () {
    this.refreshContentIfOnScreenOfMeAndSubmorphs();
  }, {category: ['updating']});

  add.method('expandCategory', function (c) {
    this.expandCategoryMorph(this.categoryMorphFor(c));
  }, {category: ['categories']});

  add.method('expandCategoryMorph', function (cm) {
    cm.expandMeAndAncestors();
    this.refreshContentIfOnScreenOfMeAndSubmorphs(); /// aaa maybe this isn't necessary?;
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
    // aaa - I don't think this code could ever have really worked right. When we
    // rename a category, it's going to break all the subcategories - they *all*
    // have different names now. What can we do about this?
    var oldCatMorph = this.existingCategoryMorphFor(oldCat);
    if (oldCatMorph) {
      WorldMorph.current().forgetAboutExistingMorphFor(oldCat, oldCatMorph);
      if (!isEmpty) {
        var newCatMorph = this.categoryMorphFor(newCat);
        this.refreshContentOfMeAndSubmorphs();
        oldCatMorph.transferUIStateTo(newCatMorph, Event.createFake());
      }
    }
  }, {category: ['categories']});
  
  add.method('evaluatorsPanel', function () {
    if (! this._evaluatorsPanel) {
      this._evaluatorsPanel = avocado.TableMorph.newColumn().beInvisible().applyStyle({horizontalLayoutMode: avocado.LayoutModes.SpaceFill});
    }
    return this._evaluatorsPanel;
  }, {category: ['creating']});

  add.method('openEvaluator', function (evt) {
    evt = evt || Event.createFake();
    
    // Experimenting with using vocabulary morphs for evaluators, instead of putting the evaluators
    // directly inside the mirror.
    var enableNewVocabularyMorphExperiment = false;
    if (enableNewVocabularyMorphExperiment) {
      var m = avocado.vocabulary.create(this.mirror()).morph();
      m.openEvaluator(evt);
      if (! this.ownerSatisfying(function(o) { return o === m; })) {
        m.expand();
        m.grabMeWithoutZoomingAroundFirst(evt);
      }
      m.getAllMirrors();
      return ;
    }
    
    
    var e = new avocado.EvaluatorMorph(this);
    this.evaluatorsPanel().addRow(e);
    e.wasJustShown(evt);
    return e;
  }, {category: ['evaluators']});

  add.method('closeEvaluator', function (evaluatorMorph) {
    this.evaluatorsPanel().removeRow(evaluatorMorph);
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
    
    var m = avocado.vocabulary.create(this.mirror()).morph();
    m.expand();
    m.grabMeWithoutZoomingAroundFirst(evt);
    m.getAllMirrors();
    return m;
    */
    
    return this.openEvaluator(evt);
  }, {category: ['evaluators']});

  add.method('interposeNewParent', function (evt) {
    var world = this.world();
    var oldParent = this.mirror().parent();
    var newParent = oldParent.createChild();
    var oldParentMorph = world.morphFor(oldParent);
    var newParentMorph = world.morphFor(newParent);
    
    oldParentMorph.ensureIsInWorld(world, this.getPosition().addXY(0, -150), false, false, false, function() {
      evt.hand.world().addMorphAt(newParentMorph, pt(-1000, -1000));
                this.expand();
      newParentMorph.expand();
      newParentMorph.growFromNothingAt(this.getPosition().midPt(oldParentMorph.getPosition()).addPt(newParentMorph.getExtent().scaleBy(0.5)), function() {
        this.mirror().setParent(newParent);
        this.mirror().parentSlot().beCreator();
        newParentMorph.refreshContentOfMeAndSubmorphs(); // just so that the proper name shows up immediately
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
    cmdList.addAllCommands(this.rootCategoryMorph().commands());
    cmdList.addLine();
    cmdList.addAllCommands(this.mirror().commands().wrapForMorph(this));
    cmdList.addLine();

    cmdList.addItem(avocado.command.create("script me", this.scriptMe));
    cmdList.addLine();
    
    if (this.shouldAllowModification()) {
      var creationCommands = [];
      if (this.mirror().canHaveChildren()) {
        creationCommands.push(avocado.command.create("create child", function(evt) { this.createChild(evt); }, this));
      }

      if (this.mirror().isReflecteeProbablyAClass()) {
        creationCommands.push(avocado.command.create("create subclass", function(evt) { this.createSubclass(evt); }, this));
      }

      if (this.mirror().hasAccessibleParent()) {
        creationCommands.push(avocado.command.create("interpose new parent", function(evt) { this.interposeNewParent(evt); }, this));
      }

      if (creationCommands.length > 0) {
        cmdList.addItem(avocado.command.create("create", creationCommands));
      }
    }
    
    if (!this.shouldUseZooming() && this.mirror().canHaveAnnotation()) {
      cmdList.addLine();

      var annotationCommands = [];
      
      if (this.mirror().comment) {
        annotationCommands.push(this._commentToggler.commandForToggling("comment"));
      }

      annotationCommands.push(this._annotationToggler.commandForToggling("annotation"));
      
      cmdList.addItem(avocado.command.create("annotation", annotationCommands));
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
    
    var rootCatCmdList = this.rootCategoryMorph().dragAndDropCommands();
    if (rootCatCmdList) { cmdList.addAllCommands(rootCatCmdList); }
    
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
    childMirMorph.expand();

    childMirMorph.growFromNothing(evt, function() {
      var parentSlotMorph = childMirMorph.slotMorphFor(child.parentSlot());
      parentSlotMorph.contentsPointer().pushMe();
    });
  }, {category: ['creating children']});

  add.method('createSubclass', function (evt) {
    var subclass = this.mirror().createSubclass();
    var subclassMirMorph = avocado.ui.grab(subclass, evt);

    // might as well show the arrow from the subclass to the superclass
    subclassMirMorph.expand();
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
    return {
      isExpanded:       this.expander(),  // the root category already has this, but we want it at the top level so "clean up" can set it
      isCommentOpen:    this._commentToggler,
      isAnnotationOpen: this._annotationToggler,
      rootCategory:     this.rootCategoryMorph()
    };
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


thisModule.addSlots(avocado.mirror.Morph.prototype.annotationStyle, function(add) {

  add.data('horizontalLayoutMode', avocado.LayoutModes.SpaceFill);

});


thisModule.addSlots(avocado.mirror.Morph.prototype.commentStyle, function(add) {

  add.data('suppressHandles', true);

});


thisModule.addSlots(avocado.mirror.Morph.prototype.copyDownParentsStyle, function(add) {

  add.data('suppressHandles', true);

});


});
