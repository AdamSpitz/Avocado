avocado.transporter.module.create('lk_ext/tree_morph', function(requires) {

requires('lk_ext/auto_scaling_morph');
requires('general_ui/table_layout');
requires('lk_ext/expander');

}, function(thisModule) {


thisModule.addSlots(avocado.treeNode, function(add) {
  
  add.method('newMorph', function () {
    return avocado.TreeNodeMorph.create(this).refreshContentOfMeAndSubmorphs().applyStyle({borderRadius: 10});
  }, {category: ['user interface']});
  
});


thisModule.addSlots(avocado, function(add) {

  add.method('TreeNodeMorph', function TreeNodeMorph() { Class.initializer.apply(this, arguments); }, {category: ['user interface']});

});


thisModule.addSlots(avocado.TreeNodeMorph, function(add) {

  add.data('superclass', Morph);

  add.data('type', 'avocado.TreeNodeMorph');

  add.creator('prototype', Object.create(Morph.prototype));
  
  add.method('create', function (model) {
    // aaa get rid of this method, just call the constructor directly
    return new this(model);
  }, {category: ['creating']});

  add.method('createTreeContentsPanel', function (treeNode, shouldAutoOrganize, contentsPanelSize, shouldUseZooming) {
    // aaa - This whole thing is a bit of a hack, and too function-y. There's an object missing here or something.
    contentsPanelSize = contentsPanelSize || pt(150,100);
    if (typeof(shouldUseZooming) === 'undefined') { shouldUseZooming = avocado.TreeNodeMorph.prototype.shouldUseZooming(); }

    var cp;
    if (shouldUseZooming) {
      cp = new avocado.AutoScalingMorph(new lively.scene.Rectangle(pt(0,0).extent(contentsPanelSize))).applyStyle(avocado.TreeNodeMorph.prototype.zoomingContentsPanelStyle);
      cp.typeName = 'tree node contents panel'; // just for debugging purposes
      cp.setShouldScaleSubmorphsToFit(true);
      if (shouldAutoOrganize) { cp.setShouldAutoOrganize(true); }

      // aaa - eventually should only need one of these, probably recalculateContentModels, and it shouldn't have anything to do with TreeNodeMorph
      cp.setPotentialContentMorphsFunction(function() { return this.recalculateAndRememberContentMorphsInOrder(); });

      cp.dragAndDropCommands = function() {
        return this.owner.dragAndDropCommandsForTreeContents();
      };
    } else {
      cp = avocado.table.newTableMorph().beInvisible().applyStyle(avocado.TreeNodeMorph.prototype.nonZoomingContentsPanelStyle);
      cp.makeContentMorphsHaveLayoutModes({horizontalLayoutMode: avocado.LayoutModes.SpaceFill});
      cp.setPotentialContentMorphsFunction(function () {
        return avocado.table.contents.createWithColumns([this.recalculateAndRememberContentMorphsInOrder()]);
      });
      // cp.refreshContent(); // aaa - leaving this line in breaks the "don't show if the scale is too small" functionality, but does taking it out break something else?
    }

    cp.recalculateContentModels = function() { return treeNode.immediateContents(); };
    cp.recalculateAndRememberContentMorphsInOrder = function () {
      // aaa - Do I want the old contents-summary thing? If so, how should it be included?
      // if (treeNode.requiresContentsSummary && treeNode.requiresContentsSummary()) { allSubmorphs.push(this.contentsSummaryMorph()); }
      var world = WorldMorph.current();
      var models = this.recalculateContentModels();
      var morphs = models.map(function(c) { return world.morphFor(c); });
      this._contentMorphs = morphs.toArray().sortBy(function(m) { return m._model && m._model.sortOrder ? m._model.sortOrder() : ''; });
      return this._contentMorphs;
    };

    cp.partsOfUIState = function () {
      return {
        treeNodeContents: {
          collection: this._contentMorphs || [],
          keyOf: function(cm) { return cm._model; },
          getPartWithKey: function(morph, c) { return WorldMorph.current().morphFor(c); }
        }
      };
    };

    return cp;
  }, {category: ['creating']});

});


thisModule.addSlots(avocado.TreeNodeMorph.prototype, function(add) {

  add.data('constructor', avocado.TreeNodeMorph);

	add.data('noShallowCopyProperties', Morph.prototype.noShallowCopyProperties.concat(["_potentialContentMorphs", "_headerRow", "_headerRowContents", "_titleAccessors"]), {initializeTo: 'Morph.prototype.noShallowCopyProperties.concat(["_potentialContentMorphs", "_headerRow", "_headerRowContents", "_titleAccessors"])'});
	
  add.method('initialize', function ($super, treeNode) {
    $super(lively.scene.Rectangle.createWithIrrelevantExtent());
    this.useTableLayout(avocado.table.contents.columnPrototype);
    this._model = treeNode;
    this.applyStyle(this.nodeStyle());
    if (! this.shouldUseZooming()) { this._expander = new avocado.ExpanderMorph(this); }
  }, {category: ['initializing']});

  add.method('treeNode', function () { return this._model; }, {category: ['accessing']});
  
  add.method('createContentsPanelOrHider', function () {
    var treeNode = this._model;
    if ( !this.shouldUseZooming() || this._shouldNotHideContentsEvenIfTooSmall) {
      return this.actualContentsPanel();
    } else {
      var contentsThreshold = this._contentsThreshold || 0.25;
      var thresholdMultiplierForHeader = this._shouldOmitHeaderRow ? 0.25 : 0.7;
      return avocado.scaleBasedMorphHider.create(this, this.actualContentsPanel.bind(this), this, function() {
        return contentsThreshold * thresholdMultiplierForHeader * this.thresholdMultiplierForModel();
      }.bind(this), pt(150,100)); 
    }
  }, {category: ['contents panel']});
  
  add.method('thresholdMultiplierForModel', function () {
    if (this._model.thresholdMultiplier) { return this._model.thresholdMultiplier; }
    if (typeof(this._model.immediateContents) === 'function') {
      var contents = this._model.immediateContents();
      if (typeof(contents.size) === 'function') {
        return Math.sqrt(contents.size());
      }
    }
    return 1;
  }, {category: ['contents panel']});

  add.method('toString', function () {
    if (this._headerRow) {
      var t = this.findTitleLabel();
      if (t) { return t.getText(); }
    }
    if (this._model) { return this._model.toString(); }
    return "a tree node";
  }, {category: ['printing']});
  
  add.method('inspect', function () {
    return this.toString();
  }, {category: ['printing']});

  add.method('headerRow', function () {
    if (! this._headerRow) {
      this._headerRow = avocado.table.createSpaceFillingRowMorph(this.headerRowContents.bind(this), this.nodeStyle().headerRowPadding);
    }
    return this._headerRow;
  }, {category: ['header row']});
  
  add.method('headerRowContents', function () {
    if (! this._headerRowContents) {
      var titleLabel = this.createTitleLabel();
      if (! titleLabel) { titleLabel = this.createNameLabel(); }
      if (this.shouldUseZooming()) {
        this._headerRowContents = [titleLabel];
      } else {
        this._headerRowContents = [this._expander, titleLabel, this._headerRowSpacer || (this._headerRowSpacer = Morph.createSpacer())];
      }
    }
    return this._headerRowContents;
  }, {category: ['header row']});

  add.method('createTitleLabel', function () {
    var titleAccessors = this.titleAccessors();
    if (titleAccessors) {
      var lbl = new avocado.TwoModeTextMorph(titleAccessors);
      lbl.setNameOfEditCommand("rename");
      lbl.backgroundColorWhenWritable = null;
      lbl.ignoreEvents();
      lbl.isTitleLabel = true;
      return lbl;
    }
    return null;
  }, {category: ['header row', 'title']});
  
  add.method('titleAccessors', function () {
    if (this._titleAccessors) { return this._titleAccessors; }
    if (typeof(this._model.titleAccessors) === 'function') { return this._model.titleAccessors(); }
    return null;
  }, {category: ['header row', 'title']});
  
  add.method('findTitleLabel', function () {
    // Not sure what would be a good way to find it, or whether we should just keep a pointer
    // to it; for now let's do this isTitleLabel thing. -- Adam
    return this.headerRow().submorphsRecursively().find(function(m) { return m.isTitleLabel; });
  }, {category: ['header row', 'title']});

  add.method('shouldUseZooming', function () {
    return avocado.isZoomingEnabled;
  }, {category: ['zooming']});

  add.method('expander', function () { return this._expander; }, {category: ['expanding and collapsing']});

  add.method('expandMeAndAncestors', function () {
    if (this.expander()) {
      if (! this.treeNode().isRoot()) { this.supernodeMorph().expandMeAndAncestors(); }
      this.expander().expand();
    }
  }, {category: ['contents panel']});

  add.method('updateExpandedness', function () {
    this.refreshContentOfMeAndSubmorphs();
  }, {category: ['updating']});

  add.method('hasActualContentsPanelAlreadyBeenCreated', function () {
    return this._contentsPanel;
  }, {category: ['contents panel']});

  add.method('actualContentsPanel', function () {
    if (! this._contentsPanel) {
      var contents = this.treeNode().immediateContents(); // aaa - is this an unnecessary calculation of immediateContents? Is it gonna be slow?
      if (Object.isArray(contents) || Object.inheritsFrom(avocado.compositeCollection, contents)) { // aaa - hack, I'm just not quite sure yet that I want an array's newMorph to return one of these AutoScalingMorphs or whatever
        var shouldUseZooming = typeof(this._model.shouldContentsPanelUseZooming) === 'function' ? this._model.shouldContentsPanelUseZooming() : this._model.shouldContentsPanelUseZooming;
        this._contentsPanel = avocado.TreeNodeMorph.createTreeContentsPanel(this._model, this._model.shouldContentsPanelAutoOrganize, pt(150,100), shouldUseZooming);
      } else {
        this._contentsPanel = (this.world() || WorldMorph.current()).morphFor(contents);
      }
    }
    return this._contentsPanel;
  }, {category: ['contents panel']});
  
  add.method('partsOfUIState', function () {
    var s = { isExpanded: this.expander() };
    if (this.hasActualContentsPanelAlreadyBeenCreated()) { s.contents = this.actualContentsPanel(); }
    return s;
  }, {category: ['UI state']});

  add.method('setContentsThreshold', function (t) {
    this._contentsThreshold = t;
    return this;
  }, {category: ['contents panel']});

  add.method('potentialContentMorphs', function () {
    if (this.shouldUseZooming()) {
      if (! this._potentialContentMorphs) {
        var rows = [];
        if (! this._shouldOmitHeaderRow)  { rows.push(this.headerRow()); }
        if (this._shouldShowTagsWithinBox) { rows.push(this.tagHolderMorph()); }
        rows.push(this.createContentsPanelOrHider());
        this._potentialContentMorphs = avocado.table.contents.createWithColumns([rows]);
      }
      return this._potentialContentMorphs;
    } else {
      var rows = [];
      if (! this._shouldOmitHeaderRow)  { rows.push(this.headerRow()); }
      if (this._shouldShowTagsWithinBox) { rows.push(this.tagHolderMorph()); }
      if (this.expander().isExpanded()) { rows.push(this.createContentsPanelOrHider()); }
      return avocado.table.contents.createWithColumns([rows]);
    }
  }, {category: ['updating']});

  add.method('contentsSummaryMorph', function () {
    if (! this._contentsSummaryMorph) {
      this._contentsSummaryMorph = this.createContentsSummaryMorph();
    }
    return this._contentsSummaryMorph;
  }, {category: ['contents panel']});

  add.method('supernodeMorph', function () {
    if (this.treeNode().isRoot()) { return null; }
    var sn = this.treeNode().supernode();
    return this.ownerSatisfying(function(o) { return o.constructor === this.constructor && o.treeNode().equals(sn); }.bind(this)) || WorldMorph.current().morphFor(sn);
  }, {category: ['contents panel']});

  add.method('nodeStyle', function () { return this.shouldUseZooming() ? this.zoomingNodeStyle : this.nonZoomingNodeStyle; }, {category: ['styles']});

  add.creator('nonZoomingNodeStyle', {}, {category: ['styles']});

  add.creator('nonZoomingContentsPanelStyle', {}, {category: ['styles']});

  add.creator('zoomingNodeStyle', {}, {category: ['styles']});

  add.creator('zoomingContentsPanelStyle', {}, {category: ['styles']});
  
  add.method('commands', function ($super) {
    var cmdList = $super();
    this.addTitleEditingCommandsTo(cmdList);
    return cmdList;
  }, {category: ['commands']});
  
  add.method('addTitleEditingCommandsTo', function (cmdList) {
    var titleLabel = this.findTitleLabel();
    if (titleLabel) {
      cmdList.addAllCommands(titleLabel.editingCommands());
    }
  }, {category: ['commands']});

  add.method('dragAndDropCommands', function () {
    if (this.shouldUseZooming()) { return null; } // let the content panel be the drop target
    
    return this.dragAndDropCommandsForTreeContents();
  }, {category: ['drag and drop']});
  
  add.method('dragAndDropCommandsForTreeContents', function () {
    if (typeof(this.treeNode().dragAndDropCommands) === 'function') {
      return this.treeNode().dragAndDropCommands().wrapForMorph(this);
    } else {
      return null;
    }
  }, {category: ['drag and drop']});
  
  add.method('showTagsWithinBox', function () {
    // aaa this is a hack, need to create a general-purpose way to put tags on any morph
    this._shouldShowTagsWithinBox = true;
    return this;
  }, {category: ['tagging']})

});


thisModule.addSlots(avocado.TreeNodeMorph.prototype.nonZoomingNodeStyle, function(add) {

  add.data('fill', new lively.paint.LinearGradient([new lively.paint.Stop(0, new Color(1, 0.8, 0.5)), new lively.paint.Stop(1, new Color(1, 0.9, 0.75))], lively.paint.LinearGradient.SouthNorth));

  add.data('padding', {top: 0, bottom: 0, left: 2, right: 2, between: {x: 2, y: 2}}, {initializeTo: '{top: 0, bottom: 0, left: 2, right: 2, between: {x: 2, y: 2}}'});

  add.data('headerRowPadding', {top: 0, bottom: 0, left: 0, right: 0, between: {x: 3, y: 3}}, {initializeTo: '{top: 0, bottom: 0, left: 0, right: 0, between: {x: 3, y: 3}}'});
  
  add.data('openForDragAndDrop', false);

});


thisModule.addSlots(avocado.TreeNodeMorph.prototype.nonZoomingContentsPanelStyle, function(add) {

  add.data('padding', {top: 0, bottom: 0, left: 10, right: 0, between: {x: 0, y: 0}}, {initializeTo: '{top: 0, bottom: 0, left: 10, right: 0, between: {x: 0, y: 0}}'});

  add.data('horizontalLayoutMode', avocado.LayoutModes.SpaceFill);

});


thisModule.addSlots(avocado.TreeNodeMorph.prototype.zoomingNodeStyle, function(add) {

  add.data('fill', new lively.paint.LinearGradient([new lively.paint.Stop(0, new Color(1, 0.8, 0.5)), new lively.paint.Stop(1, new Color(1, 0.9, 0.75))], lively.paint.LinearGradient.SouthNorth));

  add.data('padding', {top: 3, bottom: 3, left: 3, right: 3, between: {x: 1, y: 1}}, {initializeTo: '{top: 3, bottom: 3, left: 3, right: 3, between: {x: 1, y: 1}}'});

  add.data('headerRowPadding', {top: 0, bottom: 0, left: 0, right: 0, between: {x: 3, y: 3}}, {initializeTo: '{top: 0, bottom: 0, left: 0, right: 0, between: {x: 3, y: 3}}'});
  
  add.data('horizontalLayoutMode', avocado.LayoutModes.ShrinkWrap);

  add.data('verticalLayoutMode', avocado.LayoutModes.ShrinkWrap);
  
  add.data('openForDragAndDrop', false);

});


thisModule.addSlots(avocado.TreeNodeMorph.prototype.zoomingContentsPanelStyle, function(add) {

  add.data('padding', 0);
  
  add.data('fill', Color.white);
  
  add.data('fillOpacity', 0.65);

  add.data('borderRadius', 10);

  add.data('horizontalLayoutMode', avocado.LayoutModes.SpaceFill);

  add.data('verticalLayoutMode', avocado.LayoutModes.SpaceFill);

  add.data('shouldIgnoreEvents', true, {comment: 'Otherwise it\'s just too easy to accidentally mess up an object. Also we want menus to work.'});

  add.data('openForDragAndDrop', false);

});


});
