transporter.module.create('lk_ext/tree_morph', function(requires) {

requires('lk_ext/rows_and_columns');
requires('lk_ext/expander');

}, function(thisModule) {


thisModule.addSlots(avocado, function(add) {

  add.method('AbstractTreeNodeMorph', function AbstractTreeNodeMorph() { Class.initializer.apply(this, arguments); }, {category: ['user interface']});

  add.method('TreeNodeMorph', function TreeNodeMorph() { Class.initializer.apply(this, arguments); }, {category: ['user interface']});

  add.method('ZoomableTreeNodeMorph', function ZoomableTreeNodeMorph() { Class.initializer.apply(this, arguments); }, {category: ['user interface']});

});


thisModule.addSlots(avocado.AbstractTreeNodeMorph, function(add) {

  add.data('superclass', avocado.TableMorph);

  add.creator('prototype', Object.create(avocado.TableMorph.prototype));

  add.data('type', 'avocado.AbstractTreeNodeMorph');

});


thisModule.addSlots(avocado.TreeNodeMorph, function(add) {

  add.data('superclass', avocado.AbstractTreeNodeMorph);

  add.creator('prototype', Object.create(avocado.AbstractTreeNodeMorph.prototype));

  add.data('type', 'avocado.TreeNodeMorph');

});


thisModule.addSlots(avocado.ZoomableTreeNodeMorph, function(add) {

  add.data('superclass', avocado.AbstractTreeNodeMorph);

  add.creator('prototype', Object.create(avocado.AbstractTreeNodeMorph.prototype));

  add.data('type', 'avocado.ZoomableTreeNodeMorph');

});


thisModule.addSlots(avocado.AbstractTreeNodeMorph.prototype, function(add) {

  add.data('constructor', avocado.AbstractTreeNodeMorph);

  add.method('initialize', function ($super, treeNode) {
    $super();
    this._model = treeNode;
    this.applyStyle(this.nodeStyle);

    this._subnodeMorphs = [];
    this._nonNodeContentMorphs = [];

    this._contentsSummaryMorph = this.createContentsSummaryMorph();
  }, {category: ['initializing']});

  add.method('treeNode', function () { return this._model; }, {category: ['accessing']});

  add.method('partsOfUIState', function () {
    return {
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

  add.method('contentsPanel', function () {
    var cp = this._contentsPanel;
    if (cp) { return cp; }
    cp = this._contentsPanel = new avocado.TableMorph().beInvisible().applyStyle(this.contentsPanelStyle);
    cp.potentialContent = this.potentialContentsOfContentsPanel.bind(this);
    cp.refreshContent();
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

});


thisModule.addSlots(avocado.TreeNodeMorph.prototype, function(add) {

  add.data('constructor', avocado.TreeNodeMorph);

  add.method('initialize', function ($super, treeNode) {
    $super(treeNode);
    this._expander = new ExpanderMorph(this);
  }, {category: ['initializing']});

  add.method('expander', function () { return this._expander; }, {category: ['expanding and collapsing']});
  
  add.method('expandMeAndAncestors', function () {
    if (! this.treeNode().isRoot()) { this.supernodeMorph().expandMeAndAncestors(); }
    this.expander().expand();
  }, {category: ['contents panel']});

  add.method('updateExpandedness', function () {
    this.updateAppearance();
  }, {category: ['updating']});

  add.method('partsOfUIState', function ($super) {
    var parts = $super();
    parts.isExpanded = this.expander();
    return parts;
  }, {category: ['UI state']});

  add.creator('nodeStyle', {}, {category: ['styles']});

  add.creator('contentsPanelStyle', {}, {category: ['styles']});

  add.method('potentialContent', function () {
    var rows = [];
    if (! this._shouldOmitHeaderRow)   { rows.push(this.headerRow()); }
    if (this.expander().isExpanded()) { rows.push(this.contentsPanel()); }
    return avocado.tableContents.createWithColumns([rows]);
  }, {category: ['updating']});

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

});


thisModule.addSlots(avocado.ZoomableTreeNodeMorph.prototype, function(add) {

  add.data('constructor', avocado.ZoomableTreeNodeMorph);

  add.method('initialize', function ($super, treeNode) {
    $super(treeNode);
  }, {category: ['initializing']});

  add.creator('fakeExpander', {}, {category: ['compatibility with TreeNodeMorph']})
  
  add.method('expander', function () { return null; }, {category: ['compatibility with TreeNodeMorph']});
  
  add.method('expandMeAndAncestors', function () {
    // nothing to do
  }, {category: ['compatibility with TreeNodeMorph']});

  add.creator('nodeStyle', {}, {category: ['styles']});
  
  add.creator('contentsPanelStyle', {}, {category: ['styles']});

  add.method('potentialContent', function () {
    var rows = [];
    if (! this._shouldOmitHeaderRow)   { rows.push(this.headerRow()); }
    if (this.treeNode().requiresContentsSummary()) { rows.push(this._contentsSummaryMorph); }
    rows.push(avocado.optionalMorph.create(this, this.contentsPanel(), function() { return this.shouldShowContentsPanel(); }.bind(this)));
    return avocado.tableContents.createWithColumns([rows]);
  }, {category: ['updating']});
  
  add.method('shouldShowContentsPanel', function () {
    // The problem with scaleBasedOptionalMorph is that it's the individual slot morphs that'll
    // be really tiny - their immediate owner, the contents panel of the category they're in,
    // will be way bigger than they are. And also, I don't wanna have to repeat the calculation
    // 100 times. So let's do this custom optionalMorph thing (rather than using the standard
    // scaleBasedOptionalMorph) to avoid showing the contents panel until the predicted scale
    // of its content morphs is big enough. -- Adam, Dec. 2010
    
    var numContentMorphs = this.contentsCount();
    if (numContentMorphs === 0) { return true; }
    var morphsPerRow = Math.ceil(Math.sqrt(numContentMorphs));
    var scaleToKeepTheWholeThingFromGettingTooBig = 1 / Math.sqrt(morphsPerRow);
    var predictedOverallScaleOfContents = this.overallScale() * scaleToKeepTheWholeThingFromGettingTooBig;
    return predictedOverallScaleOfContents >= 0.4;
  }, {category: ['updating']});

  add.method('potentialContentsOfContentsPanel', function () {
    var contentMorphs = this.allContentMorphs();
    var numContentMorphs = contentMorphs.size();
    var morphsPerRow = Math.ceil(Math.sqrt(numContentMorphs));
    var rows = [];
    if (numContentMorphs > 0) {
      var scaleToKeepTheWholeThingFromGettingTooBig = 1 / Math.sqrt(morphsPerRow);
      contentMorphs.each(function(m) {
        m.horizontalLayoutMode = avocado.LayoutModes.SpaceFill;
        m.verticalLayoutMode   = avocado.LayoutModes.SpaceFill;
        m.setScale(scaleToKeepTheWholeThingFromGettingTooBig);
      });
      var lastRow;
      for (var i = 0; i < numContentMorphs; i += morphsPerRow) {
        lastRow = contentMorphs.slice(i, i + morphsPerRow);
        rows.push(lastRow);
      }
      if (lastRow) { while (lastRow.length < morphsPerRow) { lastRow.push(Morph.createSpacer()); } }
    }
    return avocado.tableContents.createWithRows(rows);
  }, {category: ['contents panel']});
  
  add.method('addToContentsPanel', function (m) {
    this.contentsPanel().addCell(m);
  }, {category: ['contents panel']});

});


thisModule.addSlots(avocado.TreeNodeMorph.prototype.nodeStyle, function(add) {

  add.data('padding', {top: 0, bottom: 0, left: 2, right: 2, between: {x: 2, y: 2}}, {initializeTo: '{top: 0, bottom: 0, left: 2, right: 2, between: {x: 2, y: 2}}'});

});


thisModule.addSlots(avocado.TreeNodeMorph.prototype.contentsPanelStyle, function(add) {

  add.data('padding', {top: 0, bottom: 0, left: 10, right: 0, between: {x: 0, y: 0}}, {initializeTo: '{top: 0, bottom: 0, left: 10, right: 0, between: {x: 0, y: 0}}'});

  add.data('horizontalLayoutMode', avocado.LayoutModes.SpaceFill);

});


thisModule.addSlots(avocado.ZoomableTreeNodeMorph.prototype.nodeStyle, function(add) {

  add.data('padding', {top: 3, bottom: 3, left: 3, right: 3, between: {x: 1, y: 1}}, {initializeTo: '{top: 3, bottom: 3, left: 3, right: 3, between: {x: 1, y: 1}}'});

  add.data('horizontalLayoutMode', avocado.LayoutModes.SpaceFill);

  add.data('verticalLayoutMode', avocado.LayoutModes.SpaceFill);

});


thisModule.addSlots(avocado.ZoomableTreeNodeMorph.prototype.contentsPanelStyle, function(add) {

  add.data('padding', {top: 0, bottom: 0, left: 0, right: 0, between: {x: 3, y: 3}}, {initializeTo: '{top: 0, bottom: 0, left: 0, right: 0, between: {x: 2, y: 2}}'});

  add.data('horizontalLayoutMode', avocado.LayoutModes.SpaceFill);

  add.data('verticalLayoutMode', avocado.LayoutModes.SpaceFill);

});


});
