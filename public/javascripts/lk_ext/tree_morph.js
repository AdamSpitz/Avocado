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

  add.method('initialize', function ($super, treeNode) {
    $super();
    this._model = treeNode;
    this.applyStyle(this.nodeStyle());

    this._subnodeMorphs = [];
    this._nonNodeContentMorphs = [];

    this._contentsSummaryMorph = this.createContentsSummaryMorph();
    
    if (! this.shouldUseZooming()) {
      this._expander = new ExpanderMorph(this);
    }
  }, {category: ['initializing']});

  add.method('treeNode', function () { return this._model; }, {category: ['accessing']});

  add.method('toString', function () {
    if (this._titleLabel) { return this._titleLabel.getText(); }
    return "a tree node";
  }, {category: ['printing']});

  add.method('headerRow', function () {
    var hr = this._headerRow;
    if (hr) { return hr; }
    this._titleLabel = this.createTitleLabel();
    hr = avocado.RowMorph.createSpaceFilling(this.headerRowContents.bind(this), this.nodeStyle().headerRowPadding);
    this._headerRow = hr;
    return hr;
  }, {category: ['creating']});

  add.method('expander', function () { return this._expander; }, {category: ['expanding and collapsing']});

  add.method('expandMeAndAncestors', function () {
    if (this.expander()) {
      if (! this.treeNode().isRoot()) { this.supernodeMorph().expandMeAndAncestors(); }
      this.expander().expand();
    }
  }, {category: ['contents panel']});

  add.method('updateExpandedness', function () {
    this.updateAppearance();
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
    if (this.shouldUseZooming()) {
      return [this._titleLabel, avocado.scaleBasedMorphHider.create(this, this.contentsPanel(), this, 2.0, this._contentsPanelSize)];
    } else {
      
      return [this._expander, this._titleLabel, this._headerRowSpacer || (this._headerRowSpacer = Morph.createSpacer())];
    }
  }, {category: ['header row']});

  add.method('potentialContent', function () {
    if (this.shouldUseZooming()) {
      var rows = this._shouldOmitHeaderRow ? [avocado.scaleBasedMorphHider.create(this, this.contentsPanel(), this, 0.75, this._contentsPanelSize)] : [this.headerRow()];
      return avocado.tableContents.createWithColumns([rows]);
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

  add.data('_contentsPanelSize', pt(100,100), {category: ['free-form contents experiment']});

  add.method('contentsPanel', function () {
    var cp = this._contentsPanel;
    if (cp) { return cp; }
    
    if (this.shouldUseZooming() && this._shouldContentsBeFreeForm) {
      cp = this._contentsPanel = new Morph(new lively.scene.Rectangle(pt(0,0).extent(this._contentsPanelSize))).applyStyle(this.contentsPanelStyle());
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
          cp._hasAlreadyBeenLaidOutAtLeastOnce = true;
          cp.poseManager().assumePose(cp.poseManager().cleaningUpPose(contentMorphs).beUnobtrusive().beSquarish().whenDoneScaleToFitWithinCurrentSpace());
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

  add.method('allContentMorphs', function () {
    var contentMorphs = [];
    this._nonNodeContentMorphs = this.nonNodeContentMorphsInOrder();
    this._subnodeMorphs = this.subnodeMorphsInOrder();
    this._nonNodeContentMorphs.each(function(sm) {contentMorphs.push(sm);});
    this._subnodeMorphs.each(function(scm) {contentMorphs.push(scm);});
    return contentMorphs;
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
    return this.treeNode().immediateSubnodes().size() + this.treeNode().nonNodeContents().size();
  }, {category: ['contents panel']});

  add.method('potentialContentsOfContentsPanel', function () {
    var allSubmorphs = [];
    if (this.treeNode().requiresContentsSummary()) { allSubmorphs.push(this._contentsSummaryMorph); }
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

});


});
