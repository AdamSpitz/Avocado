transporter.module.create('lk_ext/tree_morph', function(requires) {

requires('lk_ext/rows_and_columns');
requires('lk_ext/expander');

}, function(thisModule) {


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

	add.data('noShallowCopyProperties', Morph.prototype.noShallowCopyProperties.concat(["_potentialContent", "_headerRow", "_headerRowContents", "_containerName"]), {initializeTo: 'Morph.prototype.noShallowCopyProperties.concat(["_potentialContent", "_headerRow", "_headerRowContents", "_containerName"])'});
	
  add.method('initialize', function ($super, treeNode) {
    $super();
    this._model = treeNode;
    this.applyStyle(this.nodeStyle());

    this._subnodeMorphs = [];
    this._nonNodeContentMorphs = [];
    reflect(this).slotAt('_subnodeMorphs').beCreator();
    reflect(this).slotAt('_nonNodeContentMorphs').beCreator();
    
    if (! this.shouldUseZooming()) {
      this._expander = new ExpanderMorph(this);
    }
  }, {category: ['initializing']});

  add.method('treeNode', function () { return this._model; }, {category: ['accessing']});

  add.method('toString', function () {
    var t = this.findTitleLabel && this.findTitleLabel();
    if (t) { return t.getText(); }
    return "a tree node";
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
      nodes: {
        collection: this._subnodeMorphs.toArray(),
        keyOf: function(cm) { return cm._model; },
        getPartWithKey: function(morph, node) { return WorldMorph.current().morphFor(node); }
      },
      nonNodes: {
        collection: this._nonNodeContentMorphs,
        keyOf: function(cm) { return cm._model; },
        getPartWithKey: function(morph, nonNode) { return WorldMorph.current().morphFor(nonNode); }
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

  add.method('potentialContent', function () {
    if (this.shouldUseZooming()) {
      if (! this._potentialContent) {
        var thresholdMultiplier = this._shouldOmitHeaderRow ? 0.25 : 0.7;
        var contentsPanelHider = this._shouldNotHideContentsEvenIfTooSmall ? this.contentsPanel() : avocado.scaleBasedMorphHider.create(this, this.contentsPanel.bind(this), this, function() { return thresholdMultiplier * Math.sqrt(this.contentsCount()); }.bind(this), this._contentsPanelSize);
        var rows = this._shouldOmitHeaderRow ? [contentsPanelHider] : [this.headerRow(), contentsPanelHider];
        this._potentialContent = avocado.tableContents.createWithColumns([rows]);
      }
      return this._potentialContent;
    } else {
      var rows = [];
      if (! this._shouldOmitHeaderRow)  { rows.push(this.headerRow()); }
      if (this.expander().isExpanded()) { rows.push(this.contentsPanel()); }
      return avocado.tableContents.createWithColumns([rows]);
    }
  }, {category: ['updating']});

  add.method('adjustScaleOfContentsPanel', function () {
    // aaa - not necessary now that the pose does it.
    // Take this code out once I'm sure the pose way is working.
    if (false && this.shouldUseZooming()) { 
      var numContentMorphs = this.contentsCount() + 1; // + 1 for the summary, though I guess it shouldn't matter much
      this._contentsPanel.setScale(1 / numContentMorphs);
    }
  }, {category: ['updating']});
  
  add.data('_shouldContentsBeFreeForm', true, {category: ['free-form contents experiment']});

  add.data('_contentsPanelSize', pt(150,100), {category: ['free-form contents experiment']});

  add.method('contentsPanel', function () {
    var cp = this._contentsPanel;
    if (cp) { return cp; }
    
    if (this.shouldUseZooming() && this._shouldContentsBeFreeForm) {
      cp = this._contentsPanel = new Morph(new lively.scene.Rectangle(pt(0,0).extent(this._contentsPanelSize))).applyStyle(this.contentsPanelStyle());
      cp.typeName = 'tree node contents panel'; // just for debugging purposes
      // var thisToString = this.toString(); cp.toString = function() { return thisToString + " contents panel"; } // aaa just for debugging
      this.adjustScaleOfContentsPanel();
      // aaa - do this more cleanly; for now, just wanna see if this can work
      cp.refreshContent = function () {
        var contentMorphs = this.allContentMorphs();
        // aaa - find a more efficient way to do this
        cp.submorphs.forEach(function(m) {
          if (! contentMorphs.include(m)) {
            cp.removeMorph(m);
          }
        });
        
        if (!cp._hasAlreadyBeenLaidOutAtLeastOnce) {
          this.cleanUpContentsPanel(contentMorphs);
        } else {
          // Don't redo the pose (because the user may have moved things around, and we don't want to wreck
          // his arrangement), but make sure that if there are any contentMorphs that aren't actually being
          // shown yet (perhaps because they were just added by some model-level code), they're added to the
          // contents panel.
          contentMorphs.forEach(function(m) {
            if (m.owner !== cp) {
              // aaa - at least spread them out so that if multiple ones are added at the same time, they
              // don't show up right on top of each other.
              // 
              // Or, ideally, someday, do something cool where the morphs arrange themselves, being smart enough
              // to stay approximately where they're put but they shuffle around a bit to avoid colliding with others.
              cp.addMorphAt(m, pt(0,0));
            }
          });
        }
      }.bind(this);
      
      cp.dragAndDropCommands = function() {
        return this.dragAndDropCommandsForTreeContents();
      }.bind(this);
    } else {
      cp = this._contentsPanel = new avocado.TableMorph().beInvisible().applyStyle(this.contentsPanelStyle());
      this.adjustScaleOfContentsPanel();
      cp.potentialContent = this.potentialContentsOfContentsPanel.bind(this);
      // cp.refreshContent(); // aaa - leaving this line in breaks the "don't show if the scale is too small" functionality, but does taking it out break something else?
    }
    return cp;
  }, {category: ['contents panel']});
  
  add.method('cleanUpContentsPanel', function (contentMorphsOrNull) {
    var contentMorphs = contentMorphsOrNull || this.allContentMorphs();
    var cp = this.contentsPanel();
    cp._hasAlreadyBeenLaidOutAtLeastOnce = true;
    var pose = cp.poseManager().cleaningUpPose(contentMorphs).beUnobtrusive().beSquarish().whenDoneScaleToFitWithinCurrentSpace();
    cp.poseManager().assumePose(pose);
  }, {category: ['contents panel']});

  add.method('contentsSummaryMorph', function () {
    if (! this._contentsSummaryMorph) {
      this._contentsSummaryMorph = this.createContentsSummaryMorph();
    }
    return this._contentsSummaryMorph;
  }, {category: ['contents panel']});

  add.method('nonNodeContentMorphsInOrder', function () {
    // can be overridden in children, if desired
    return this.treeNode().nonNodeContents().map(function(s) { return this.nonNodeMorphFor(s); }.bind(this));
  }, {category: ['contents panel']});

  add.method('subnodeMorphsInOrder', function () {
    var subnodeMorphs = this.immediateSubnodeMorphs().toArray();
    return subnodeMorphs.sortBy(function(m) { return m.treeNode().sortOrder(); });
  }, {category: ['contents panel']});
    
  add.method('nodeMorphFor', function (subnode) {
    // can be overridden in children, if desired
    return subnode.morph ? subnode.morph() : WorldMorph.current().morphFor(subnode);
  }, {category: ['contents panel']});

  add.method('nonNodeMorphFor', function (content) {
    // can be overridden in children, if desired
    return content.morph ? content.morph() : WorldMorph.current().morphFor(content);
  }, {category: ['contents panel']});
  
  add.method('allContentMorphs', function () {
    this._nonNodeContentMorphs = this.nonNodeContentMorphsInOrder();
    this._subnodeMorphs = this.subnodeMorphsInOrder();
    return avocado.compositeCollection.create([this._nonNodeContentMorphs, this._subnodeMorphs]);
  }, {category: ['contents panel']});

  add.method('supernodeMorph', function () {
    if (this.treeNode().isRoot()) { return null; }
    var sn = this.treeNode().supernode();
    return this.ownerSatisfying(function(o) { return o.constructor === this.constructor && o.treeNode().equals(sn); }.bind(this)) || this.nodeMorphFor(sn);
  }, {category: ['contents panel']});

  add.method('immediateSubnodeMorphs', function () {
    return this.treeNode().immediateSubnodes().map(function(sn) { return this.nodeMorphFor(sn); }.bind(this));
  }, {category: ['contents panel']});

  add.method('contentsCount', function () {
    var tn = this.treeNode();
    var subnodeCount = typeof(tn.immediateSubnodeCount) === 'function' ? tn.immediateSubnodeCount() : tn.immediateSubnodes().size();
    var nonNodeCount = typeof(tn. nonNodeContentsCount) === 'function' ? tn. nonNodeContentsCount() : tn.  nonNodeContents().size();
    return subnodeCount + nonNodeCount;
  }, {category: ['contents panel']});

  add.method('potentialContentsOfContentsPanel', function () {
    var allSubmorphs = [];
    if (this.treeNode().requiresContentsSummary()) { allSubmorphs.push(this.contentsSummaryMorph()); }
    var contentMorphs = this.allContentMorphs();
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
    return this.treeNode().dragAndDropCommands().wrapForMorph(this);
  }, {category: ['drag and drop']});

});


thisModule.addSlots(avocado.TreeNodeMorph.prototype.nonZoomingNodeStyle, function(add) {

  add.data('padding', {top: 0, bottom: 0, left: 2, right: 2, between: {x: 2, y: 2}}, {initializeTo: '{top: 0, bottom: 0, left: 2, right: 2, between: {x: 2, y: 2}}'});

  add.data('headerRowPadding', {top: 0, bottom: 0, left: 0, right: 0, between: {x: 3, y: 3}}, {initializeTo: '{top: 0, bottom: 0, left: 0, right: 0, between: {x: 3, y: 3}}'});

});


thisModule.addSlots(avocado.TreeNodeMorph.prototype.nonZoomingContentsPanelStyle, function(add) {

  add.data('padding', {top: 0, bottom: 0, left: 10, right: 0, between: {x: 0, y: 0}}, {initializeTo: '{top: 0, bottom: 0, left: 10, right: 0, between: {x: 0, y: 0}}'});

  add.data('horizontalLayoutMode', avocado.LayoutModes.SpaceFill);

});


thisModule.addSlots(avocado.TreeNodeMorph.prototype.zoomingNodeStyle, function(add) {

  add.data('padding', {top: 3, bottom: 3, left: 3, right: 3, between: {x: 1, y: 1}}, {initializeTo: '{top: 3, bottom: 3, left: 3, right: 3, between: {x: 1, y: 1}}'});

  add.data('headerRowPadding', {top: 0, bottom: 0, left: 0, right: 0, between: {x: 3, y: 3}}, {initializeTo: '{top: 0, bottom: 0, left: 0, right: 0, between: {x: 3, y: 3}}'});
  
  add.data('horizontalLayoutMode', avocado.LayoutModes.ShrinkWrap);

  add.data('verticalLayoutMode', avocado.LayoutModes.ShrinkWrap);

});


thisModule.addSlots(avocado.TreeNodeMorph.prototype.zoomingContentsPanelStyle, function(add) {

  add.data('padding', 0);
  
  add.data('fill', null);

  add.data('horizontalLayoutMode', avocado.LayoutModes.SpaceFill);

  add.data('verticalLayoutMode', avocado.LayoutModes.SpaceFill);

  add.data('grabsShouldFallThrough', true, {comment: 'Otherwise it\'s just too easy to accidentally mess up an object.'});

});


});
