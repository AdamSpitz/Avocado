avocado.transporter.module.create('general_ui/tree_node', function(requires) {

requires('core/tree_node');
requires('general_ui/layout');
requires('general_ui/table_layout');
requires('general_ui/auto_scaling_morph');

}, function(thisModule) {


thisModule.addSlots(avocado.treeNode, function(add) {

  add.method('newMorph', function () {
    return this.newMorphFor(this);
  }, {category: ['user interface']});

  add.method('newMorphFor', function (treeNode, style, contentsThreshold, shouldOmitHeaderRow, shouldPutHeaderOnLeftInsteadOfTop) {
    var morph = avocado.ui.newMorph(avocado.ui.shapeFactory.newRectangle());

    if (typeof(treeNode.shouldPutHeaderOnLeftInsteadOfTop) === 'function') { shouldPutHeaderOnLeftInsteadOfTop = treeNode.shouldPutHeaderOnLeftInsteadOfTop(); }
    morph.useTableLayout(shouldPutHeaderOnLeftInsteadOfTop ? avocado.table.contents.rowPrototype : avocado.table.contents.columnPrototype);
    morph._model = treeNode;
    morph._potentialContentCreator = avocado.treeNode;
    morph._contentsThreshold = contentsThreshold;
    morph._shouldOmitHeaderRow = shouldOmitHeaderRow;
    var shouldUseZooming = avocado.ui.isZoomingEnabled && (typeof(treeNode.shouldUseZooming) !== 'function' || treeNode.shouldUseZooming());
    morph._morphFactory = shouldUseZooming ? avocado.treeNode.morphFactories.scalingBased : avocado.treeNode.morphFactories.expanderBased;
    morph.applyStyle(morph._morphFactory.styleForTreeNode(treeNode));
    morph._morphFactory.initializeMorph(morph);
    
    Object.extend(morph, avocado.treeNode.morphMixin_aaa_becauseIDoNotFeelLikeGeneralizingTheseMethodsRightNow);

    morph.refreshContentOfMeAndSubmorphs();
    morph.applyStyle(style || {borderRadius: 10});
    return morph;
  }, {category: ['user interface']});

  add.method('defaultExtent', function () {
    return pt(150, 100);
  }, {category: ['user interface']});

  add.method('createContentsPanelMorphFor', function (model) {
    var contents = model.immediateContents(); // aaa - is this an unnecessary calculation of immediateContents? Is it gonna be slow?
    if (Object.isArray(contents) || Object.inheritsFrom(avocado.compositeCollection, contents) || Object.inheritsFrom(avocado.typedCollection, contents)) { // aaa - hack, I'm just not quite sure yet that I want an array's newMorph to return one of these autoScaling.Morphs or whatever
      var m = avocado.treeNode.createTreeContentsPanelMorph(model)
      m.setModel(contents);
      avocado.ui.currentWorld().rememberMorphFor(contents, m);
      return m;
    } else {
      return avocado.ui.currentWorld().morphFor(contents);
    }
  }, {category: ['user interface', 'contents panel']});

  add.method('createTreeContentsPanelMorph', function (treeNode) {
    // aaa - This whole thing is a bit of a hack, and too function-y. There's an object missing here or something.
    
    var shouldUseZooming = typeof(treeNode.shouldContentsPanelUseZooming) === 'function' ? treeNode.shouldContentsPanelUseZooming() : treeNode.shouldContentsPanelUseZooming;
    if (typeof(shouldUseZooming) === 'undefined') { shouldUseZooming = avocado.ui.isZoomingEnabled; }
    var contentsPanelSize = typeof(treeNode.contentsPanelExtent) === 'function' ? treeNode.contentsPanelExtent() : this.defaultExtent();
    var shouldAutoOrganize = treeNode.shouldContentsPanelAutoOrganize;

    var cp;
    if (shouldUseZooming) {
      cp = avocado.autoScaling.newAutoScalingMorph(avocado.ui.shapeFactory.newRectangle(pt(0,0).extent(contentsPanelSize)), shouldAutoOrganize).applyStyle(avocado.treeNode.zoomingContentsPanelStyle);
      cp.typeName = 'tree node contents panel'; // just for debugging purposes

      // aaa - eventually should only need one of these, probably recalculateContentModels, and it shouldn't have anything to do with TreeNodeMorph
      cp.setPotentialContentMorphsFunction(function() { return this.recalculateAndRememberContentMorphsInOrder(); });

      cp.dragAndDropCommands = function() {
        return this.getOwner().dragAndDropCommandsForTreeContents();
      };
    } else {
      cp = avocado.table.newTableMorph().beInvisible().applyStyle(avocado.treeNode.nonZoomingContentsPanelStyle);
      cp.makeContentMorphsHaveLayoutModes({horizontalLayoutMode: avocado.LayoutModes.SpaceFill});
      cp.setPotentialContentMorphsFunction(function () {
        return avocado.table.contents.createWithColumns([this.recalculateAndRememberContentMorphsInOrder()]);
      });
      // cp.refreshContent(); // aaa - leaving this line in breaks the "don't show if the scale is too small" functionality, but does taking it out break something else?
    }

    cp.recalculateContentModels = function() { return treeNode.immediateContents(); };
    cp.recalculateAndRememberContentMorphsInOrder = function () {
      var world = avocado.ui.currentWorld();
      var models = this.recalculateContentModels();
      var morphs;
      if (models.mapElementsAndType) {
        morphs = models.mapElementsAndType(function(c) { return world.morphFor(c); }, function(t) { return avocado.types.morph.onModelOfType(t); });
      } else {
        morphs = models.map(function(c) { return world.morphFor(c); });
      }
      this._contentMorphs = morphs.toArray().sortBy(function(m) { return m._model && m._model.sortOrder ? m._model.sortOrder() : ''; });
      return this._contentMorphs;
    };

    cp.partsOfUIState = function () {
      return {
        treeNodeContents: {
          collection: this._contentMorphs || [],
          keyOf: function(cm) { return cm._model; },
          getPartWithKey: function(morph, c) { return avocado.ui.currentWorld().morphFor(c); }
        }
      };
    };

    return cp;
  }, {category: ['user interface', 'creating']});

  add.method('thresholdMultiplierFor', function (treeNode) {
    if (treeNode.thresholdMultiplier) { return treeNode.thresholdMultiplier; }
    if (typeof(treeNode.immediateContents) === 'function') {
      var contents = treeNode.immediateContents();
      if (typeof(contents.size) === 'function') {
        return Math.sqrt(contents.size());
      }
    }
    return 1;
  }, {category: ['user interface', 'contents panel']});

  add.method('actualContentsPanelForMorph', function (morph) {
    return morph._contentsPanel || (morph._contentsPanel = avocado.treeNode.createContentsPanelMorphFor(morph._model));
  }, {category: ['user interface', 'contents panel']});

  add.method('potentialContentMorphsForMorph', function (morph) {
    if (! morph._potentialContentMorphs) {
      var rows = [];
      if (! morph._shouldOmitHeaderRow)  { rows.push(avocado.treeNode.headerRowForMorph(morph)); }
      rows.push(morph._morphFactory.createContentsPanelOrHider(morph, function() { return avocado.treeNode.actualContentsPanelForMorph(morph); }));
      morph._potentialContentMorphs = avocado.table.contents.create([rows], morph.layout().tableContent()._direction1);
    }
    return morph._potentialContentMorphs;
  }, {category: ['user interface', 'creating']});

  add.method('headerRowForMorph', function (morph) {
    if (avocado.ui.is3D) { avocado.treeNode.headerRowPadding.bottom = 25; } // aaa HACK, just wanna see what it looks like
    return avocado.table.createSpaceFillingRowMorph(morph._morphFactory.headerRowContentsForMorph(morph), avocado.treeNode.headerRowPadding);
  }, {category: ['user interface', 'creating']});

  add.method('ownerObjectChainStartingFromRoot', function (leaf) {
    var treeNodeChain = [];
    var treeNode = leaf;
    while (true) {
      treeNode = treeNode.ownerObject && treeNode.ownerObject();
      if (! treeNode) { break; }
      treeNodeChain.unshift(treeNode);
    }
    return treeNodeChain;
  }, {category: ['updating']});

  add.creator('nonZoomingStyle', {}, {category: ['user interface', 'styles']});

  add.creator('nonZoomingContentsPanelStyle', {}, {category: ['user interface', 'styles']});

  add.creator('zoomingStyle', {}, {category: ['user interface', 'styles']});

  add.creator('zoomingContentsPanelStyle', {}, {category: ['user interface', 'styles']});

  add.data('headerRowPadding', {top: 0, bottom: 0, left: 0, right: 0, between: {x: 3, y: 3}}, {category: ['user interface', 'styles'], initializeTo: '{top: 0, bottom: 0, left: 0, right: 0, between: {x: 3, y: 3}}'});

  add.creator('morphFactories', {}, {category: ['user interface', 'creating']});

  add.creator('morphMixin_aaa_becauseIDoNotFeelLikeGeneralizingTheseMethodsRightNow', {}, {category: ['user interface', 'creating']});

});


thisModule.addSlots(avocado.treeNode.nonZoomingStyle, function(add) {

  add.data('fillBase', new Color(1, 0.8, 0.5));

  add.data('padding', {top: 0, bottom: 0, left: 2, right: 2, between: {x: 2, y: 2}}, {initializeTo: '{top: 0, bottom: 0, left: 2, right: 2, between: {x: 2, y: 2}}'});

  add.data('openForDragAndDrop', false);

});


thisModule.addSlots(avocado.treeNode.nonZoomingContentsPanelStyle, function(add) {

  add.data('padding', {top: 0, bottom: 0, left: 10, right: 0, between: {x: 0, y: 0}}, {initializeTo: '{top: 0, bottom: 0, left: 10, right: 0, between: {x: 0, y: 0}}'});

  add.data('horizontalLayoutMode', avocado.LayoutModes.SpaceFill);

});


thisModule.addSlots(avocado.treeNode.zoomingStyle, function(add) {

  add.data('fillBase', new Color(0.8, 0.8, 0.8));

  add.data('padding', {top: 3, bottom: 3, left: 3, right: 3, between: {x: 1, y: 1}}, {initializeTo: '{top: 3, bottom: 3, left: 3, right: 3, between: {x: 1, y: 1}}'});

  add.data('horizontalLayoutMode', avocado.LayoutModes.ShrinkWrap);

  add.data('verticalLayoutMode', avocado.LayoutModes.ShrinkWrap);

  add.data('openForDragAndDrop', false);

});


thisModule.addSlots(avocado.treeNode.zoomingContentsPanelStyle, function(add) {

  add.data('padding', 0);

  add.data('fill', new Color(1, 1, 1));

  add.data('fillOpacity', 0.65);

  add.data('borderRadius', 10);

  add.data('horizontalLayoutMode', avocado.LayoutModes.SpaceFill);

  add.data('verticalLayoutMode', avocado.LayoutModes.SpaceFill);

  add.data('shouldIgnoreEvents', true, {comment: 'Otherwise it\'s just too easy to accidentally mess up an object. Also we want menus to work.'});

  add.data('openForDragAndDrop', false);

});


thisModule.addSlots(avocado.treeNode.morphFactories, function(add) {

  add.creator('expanderBased', {});

  add.creator('scalingBased', {});

});


thisModule.addSlots(avocado.treeNode.morphFactories.expanderBased, function(add) {

  add.method('initializeMorph', function (morph) {
    morph._expander = new avocado.ExpanderMorph(morph);
  });

  add.method('styleForTreeNode', function (n) {
    return n.nonZoomingStyle || avocado.treeNode.nonZoomingStyle;
  });

  add.method('createContentsPanelOrHider', function (ownerMorph, getOrCreateActualMorph) {
    return avocado.morphHider.create(ownerMorph, [getOrCreateActualMorph], function() {
      return ownerMorph._expander.isExpanded() ? 0 : null;
    });
  });

  add.method('headerRowContentsForMorph', function (morph) {
    return [morph._expander, morph.createTitleLabel(), avocado.ui.createSpacer()];
  });

  add.method('dragAndDropCommandsForMorph', function (morph) {
    return morph.dragAndDropCommandsForTreeContents();
  });

});


thisModule.addSlots(avocado.treeNode.morphFactories.scalingBased, function(add) {

  add.method('initializeMorph', function (morph) {
  });

  add.method('styleForTreeNode', function (n) {
    return n.zoomingStyle || avocado.treeNode.zoomingStyle;
  });

  add.method('createContentsPanelOrHider', function (ownerMorph, getOrCreateActualMorph) {
    var contentsThreshold = ownerMorph._contentsThreshold || 0.25;
    var thresholdMultiplierForHeader = ownerMorph._shouldOmitHeaderRow ? 0.25 : 0.7;
    
    var treeNode = ownerMorph._model;
    var contentsPanelSize = typeof(treeNode.contentsPanelExtent) === 'function' ? treeNode.contentsPanelExtent() : avocado.treeNode.defaultExtent();
    
    return avocado.scaleBasedMorphHider.create(ownerMorph, getOrCreateActualMorph, ownerMorph, function() {
      return contentsThreshold * thresholdMultiplierForHeader * avocado.treeNode.thresholdMultiplierFor(ownerMorph._model);
    }, contentsPanelSize, avocado.treeNode.zoomingContentsPanelStyle);
  });

  add.method('headerRowContentsForMorph', function (morph) {
    return [morph.createTitleLabel()];
  });

  add.method('dragAndDropCommandsForMorph', function (morph) {
    // Let the content panel be the drop target. Except for making arrows point at me.
    // aaa - Seriously, is this complication really necessary? Why not just let stuff be dropped on the whole tree-node morph? I forget the motivation for this.
    var cmdList = avocado.command.list.create(morph);
    morph.addArrowDroppingCommandTo(cmdList);
    return cmdList;
  });

});


thisModule.addSlots(avocado.treeNode.morphMixin_aaa_becauseIDoNotFeelLikeGeneralizingTheseMethodsRightNow, function(add) {

  add.method('expander', function () { return this._expander; }, {category: ['expanding and collapsing']});

  add.method('ensureVisibleForJustMe', function () {
    if (this._expander) {
      this.assumeUIState({isExpanded: true});
    } else {
      this.refreshContent(); // aaa - is this the right thing do? is it a performance bug?
    }
  }, {category: ['contents panel']});

  add.method('justChangedContent', function () {
    if (this._contentsPanel) { this._contentsPanel.justChangedContent(); }
  }, {category: ['updating']});

  add.method('morphsThatNeedToBeVisibleBeforeICanBeVisible', function () {
    return avocado.treeNode.ownerObjectChainStartingFromRoot(this._model).map(function(n) { return avocado.ui.currentWorld().morphFor(n); });
  }, {category: ['updating']});

  add.method('partsOfUIState', function () {
    var s = this._expander ? { isExpanded: this._expander } : {};
    if (this._contentsPanel) { s.contents = this._contentsPanel; }
    return s;
  }, {category: ['UI state']});

  add.method('dragAndDropCommands', function () {
    return this._morphFactory.dragAndDropCommandsForMorph(this);
  }, {category: ['drag and drop']});

  add.method('dragAndDropCommandsForTreeContents', function () {
    return avocado.morphMixins.Morph.dragAndDropCommands.call(this);
  }, {category: ['drag and drop']});

});


});
