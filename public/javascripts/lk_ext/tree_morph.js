avocado.transporter.module.create('lk_ext/tree_morph', function(requires) {

requires('lk_ext/auto_scaling_morph');
requires('lk_ext/rows_and_columns');
requires('lk_ext/expander');

}, function(thisModule) {


thisModule.addSlots(avocado.treeNode, function(add) {
  
  add.method('newMorph', function () {
    return new avocado.TreeNodeMorph(this).setShouldScaleContentsToFit(true).refreshContentOfMeAndSubmorphs().applyStyle({borderRadius: 10});
  }, {category: ['user interface']});
  
});


thisModule.addSlots(avocado, function(add) {

  add.method('TreeNodeMorph', function TreeNodeMorph() { Class.initializer.apply(this, arguments); }, {category: ['user interface']});

});


thisModule.addSlots(avocado.TreeNodeMorph, function(add) {

  add.data('superclass', avocado.TableMorph);

  add.data('type', 'avocado.TreeNodeMorph');

  add.creator('prototype', Object.create(avocado.TableMorph.prototype));

});


thisModule.addSlots(avocado.TreeNodeMorph.prototype, function(add) {

  add.data('constructor', avocado.TreeNodeMorph);

	add.data('noShallowCopyProperties', Morph.prototype.noShallowCopyProperties.concat(["_potentialContentMorphs", "_headerRow", "_headerRowContents", "_containerName"]), {initializeTo: 'Morph.prototype.noShallowCopyProperties.concat(["_potentialContentMorphs", "_headerRow", "_headerRowContents", "_containerName"])'});
	
  add.method('initialize', function ($super, treeNode) {
    $super();
    this._model = treeNode;
    this.applyStyle(this.nodeStyle());

    this._contentMorphs = [];
    reflect(this).slotAt('_contentMorphs').beCreator();
    
    if (! this.shouldUseZooming()) {
      this._expander = new ExpanderMorph(this);
    }
  }, {category: ['initializing']});

  add.method('treeNode', function () { return this._model; }, {category: ['accessing']});

  add.method('toString', function () {
    var t = this.findTitleLabel && this.findTitleLabel();
    if (t) { return t.getText(); }
    if (this._model) { return this._model.toString(); }
    return "a tree node";
  }, {category: ['printing']});
  
  add.method('inspect', function () {
    return this.toString();
  }, {category: ['printing']});

  add.method('headerRow', function () {
    var hr = this._headerRow;
    if (hr) { return hr; }
    hr = avocado.RowMorph.createSpaceFilling(this.headerRowContents.bind(this), this.nodeStyle().headerRowPadding);
    this._headerRow = hr;
    return hr;
  }, {category: ['creating']});

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

  add.method('partsOfUIState', function () {
    return {
      isExpanded: this.expander(),
      contents: {
        collection: this._contentMorphs,
        keyOf: function(cm) { return cm._model; },
        getPartWithKey: function(morph, c) { return WorldMorph.current().morphFor(c); }
      }
    };
  }, {category: ['UI state']});
  
  add.method('headerRowContents', function () {
    if (! this._headerRowContents) {
      var titleLabel = this.createTitleLabel ? this.createTitleLabel() : this.createNameLabel();
      if (this.shouldUseZooming()) {
        this._headerRowContents = [titleLabel];
      } else {
        this._headerRowContents = [this._expander, titleLabel, this._headerRowSpacer || (this._headerRowSpacer = Morph.createSpacer())];
      }
    }
    return this._headerRowContents;
  }, {category: ['header row']});

  add.method('setContentsThreshold', function (t) {
    this._contentsThreshold = t;
    return this;
  }, {category: ['contents panel']});

  add.method('potentialContentMorphs', function () {
    if (this.shouldUseZooming()) {
      if (! this._potentialContentMorphs) {
        var contentsThreshold = this._contentsThreshold || 0.25;
        var thresholdMultiplier = this._shouldOmitHeaderRow ? 0.25 : 0.7;
        var contentsPanelHider;
        if (this._shouldNotHideContentsEvenIfTooSmall) {
          contentsPanelHider = this.contentsPanel();
        } else {
          contentsPanelHider = avocado.scaleBasedMorphHider.create(this, this.contentsPanel.bind(this), this, function() {
            return contentsThreshold * thresholdMultiplier * Math.sqrt(this.contentsCount());
          }.bind(this), this._contentsPanelSize); 
        }
        var rows = this._shouldOmitHeaderRow ? [] : [this.headerRow()];
        if (this._shouldShowTagsWithinBox) { rows.push(this.tagHolderMorph()); }
        rows.push(contentsPanelHider);
        this._potentialContentMorphs = avocado.tableContents.createWithColumns([rows]);
      }
      return this._potentialContentMorphs;
    } else {
      var rows = [];
      if (! this._shouldOmitHeaderRow)  { rows.push(this.headerRow()); }
      if (this._shouldShowTagsWithinBox) { rows.push(this.tagHolderMorph()); }
      if (this.expander().isExpanded()) { rows.push(this.contentsPanel()); }
      return avocado.tableContents.createWithColumns([rows]);
    }
  }, {category: ['updating']});

  add.data('_contentsPanelSize', pt(150,100), {category: ['free-form contents experiment']});
  
  add.method('setShouldScaleContentsToFit', function (b) {
    if (this._contentsPanel) { this._contentsPanel._shouldScaleSubmorphsToFit = b; }
    this._shouldScaleContentsPanelSubmorphsToFit = b;
    return this;
  }, {category: ['scaling submorphs']});

  add.method('contentsPanel', function () {
    var cp = this._contentsPanel;
    if (cp) { return cp; }
    
    if (this.shouldUseZooming()) {
      cp = this._contentsPanel = new avocado.AutoScalingMorph(new lively.scene.Rectangle(pt(0,0).extent(this._contentsPanelSize))).applyStyle(this.contentsPanelStyle());
      cp.typeName = 'tree node contents panel'; // just for debugging purposes
      if (this._shouldScaleContentsPanelSubmorphsToFit) { cp.setShouldScaleSubmorphsToFit(true); }
      
      // aaa - eventually should only need one of these, probably recalculateContentModels, and it shouldn't have anything to do with TreeNodeMorph
      cp.setPotentialContentMorphsFunction(function() { return this.owner.recalculateAndRememberContentMorphsInOrder(); });
      
      // var thisToString = this.toString(); cp.toString = function() { return thisToString + " contents panel"; } // aaa just for debugging
      // aaa - do this more cleanly; for now, just wanna see if this can work
      
      cp.dragAndDropCommands = function() {
        return this.owner.dragAndDropCommandsForTreeContents();
      };
    } else {
      cp = this._contentsPanel = new avocado.TableMorph().beInvisible().applyStyle(this.contentsPanelStyle());
      cp.setPotentialContentMorphsFunction(this.potentialContentMorphsOfContentsPanel.bind(this));
      // cp.refreshContent(); // aaa - leaving this line in breaks the "don't show if the scale is too small" functionality, but does taking it out break something else?
    }
    cp.recalculateContentModels = function() { return this.owner.treeNode && this.owner.treeNode().immediateContents(); };
    return cp;
  }, {category: ['contents panel']});
  
  add.method('contentsSummaryMorph', function () {
    if (! this._contentsSummaryMorph) {
      this._contentsSummaryMorph = this.createContentsSummaryMorph();
    }
    return this._contentsSummaryMorph;
  }, {category: ['contents panel']});

  add.method('contentMorphFor', function (content) {
    // can be overridden in children, if desired
    return content.morph ? content.morph() : WorldMorph.current().morphFor(content);
  }, {category: ['contents panel']});

  add.method('immediateContentMorphs', function () {
    // can be overridden in children, if desired
    return this.treeNode().immediateContents().map(function(sn) { return this.contentMorphFor(sn); }.bind(this));
  }, {category: ['contents panel']});
  
  add.method('recalculateAndRememberContentMorphsInOrder', function () {
    this._contentMorphs = this.immediateContentMorphs().toArray().sortBy(function(m) { return m._model && m._model.sortOrder ? m._model.sortOrder() : ''; });
    return this._contentMorphs;
  }, {category: ['contents panel']});

  add.method('supernodeMorph', function () {
    if (this.treeNode().isRoot()) { return null; }
    var sn = this.treeNode().supernode();
    return this.ownerSatisfying(function(o) { return o.constructor === this.constructor && o.treeNode().equals(sn); }.bind(this)) || this.contentMorphFor(sn);
  }, {category: ['contents panel']});

  add.method('contentsCount', function () {
    return this.treeNode().immediateContents().size();
  }, {category: ['contents panel']});

  add.method('potentialContentMorphsOfContentsPanel', function () {
    var allSubmorphs = [];
    if (this.treeNode().requiresContentsSummary()) { allSubmorphs.push(this.contentsSummaryMorph()); }
    var contentMorphs = this.recalculateAndRememberContentMorphsInOrder();
    contentMorphs.each(function(m) {
      m.horizontalLayoutMode = avocado.LayoutModes.SpaceFill;
      allSubmorphs.push(m);
    });
    return avocado.tableContents.createWithColumns([allSubmorphs]);
  }, {category: ['contents panel']});

  add.method('addToContentsPanel', function (m) {
    this.contentsPanel().addRow(m);
  }, {category: ['contents panel']});

  add.method('nodeStyle', function () { return this.shouldUseZooming() ? this.zoomingNodeStyle : this.nonZoomingNodeStyle; }, {category: ['styles']});

  add.method('contentsPanelStyle', function () { return this.shouldUseZooming() ? this.zoomingContentsPanelStyle : this.nonZoomingContentsPanelStyle; }, {category: ['styles']});

  add.creator('nonZoomingNodeStyle', {}, {category: ['styles']});

  add.creator('nonZoomingContentsPanelStyle', {}, {category: ['styles']});

  add.creator('zoomingNodeStyle', {}, {category: ['styles']});

  add.creator('zoomingContentsPanelStyle', {}, {category: ['styles']});

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
  
  add.method('useContentsPanelToDisplayTags', function () {
    this._shouldUseContentsPanelToDisplayTags = true;
    return this;
  }, {category: ['tagging']})
  
  add.method('showTagsWithinBox', function () {
    // aaa this is a hack, need to create a general-purpose way to put tags on any morph
    this._shouldShowTagsWithinBox = true;
    return this;
  }, {category: ['tagging']})
  
  add.method('addTagMorph', function ($super, tagMorph) {
    // aaa - not sure this is a good idea
    if (this._shouldUseContentsPanelToDisplayTags) {
      this.contentsPanel().addMorphAt(tagMorph, pt(5,5));
    } else {
      $super(tagMorph);
    }
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
  
  add.data('fill', null);

  add.data('horizontalLayoutMode', avocado.LayoutModes.SpaceFill);

  add.data('verticalLayoutMode', avocado.LayoutModes.SpaceFill);

  add.data('grabsShouldFallThrough', true, {comment: 'Otherwise it\'s just too easy to accidentally mess up an object.'});

});


});
