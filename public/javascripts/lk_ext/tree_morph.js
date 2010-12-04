transporter.module.create('lk_ext/tree_morph', function(requires) {

requires('lk_ext/rows_and_columns');
requires('lk_ext/expander');

}, function(thisModule) {


thisModule.addSlots(avocado, function(add) {

  add.method('TreeNodeMorph', function TreeNodeMorph() { Class.initializer.apply(this, arguments); }, {category: ['user interface']});

});


thisModule.addSlots(avocado.TreeNodeMorph, function(add) {

  add.data('superclass', avocado.ColumnMorph);

  add.creator('prototype', Object.create(avocado.ColumnMorph.prototype));

  add.data('type', 'avocado.TreeNodeMorph');

});


thisModule.addSlots(avocado.TreeNodeMorph.prototype, function(add) {

  add.data('constructor', avocado.TreeNodeMorph);

  add.method('initialize', function ($super, treeNode) {
    $super();
    this._model = treeNode;
    this._expander = new ExpanderMorph(this);

    this._contentsSummaryMorph = this.createContentsSummaryMorph();
  }, {category: ['initializing']});

  add.method('treeNode', function () { return this._model; }, {category: ['accessing']});

  add.method('expander', function () { return this._expander; }, {category: ['expanding and collapsing']});

  add.method('partsOfUIState', function () {
    return { isExpanded: this.expander() };
  }, {category: ['UI state']});
  
  add.method('contentsPanel', function () {
    var sp = this._contentsPanel;
    if (sp) { return sp; }
    sp = this._contentsPanel = new avocado.ColumnMorph().beInvisible();
    sp.setPadding({top: 0, bottom: 0, left: 10, right: 0, between: {x: 0, y: 0}});
    sp.horizontalLayoutMode = LayoutModes.SpaceFill;
    sp.potentialContent = this.potentialContentsOfContentsPanel.bind(this);
    sp.refreshContent();
    return sp;
  }, {category: ['contents panel']});

  add.method('potentialContentsOfContentsPanel', function () {
    var allSubmorphs = [];
    if (this.treeNode().requiresContentsSummary()) { allSubmorphs.push(this._contentsSummaryMorph); }
    this.nonNodeContentMorphsInOrder().each(function(sm ) {allSubmorphs.push(sm );});
    this.       subnodeMorphsInOrder().each(function(scm) {allSubmorphs.push(scm);});
    allSubmorphs.each(function(m) { m.horizontalLayoutMode = LayoutModes.SpaceFill; });
    return avocado.tableContents.createWithColumns([allSubmorphs]);
  }, {category: ['contents panel']});
  
  add.method('expandMeAndAncestors', function () {
    if (! this.treeNode().isRoot()) { this.supernodeMorph().expandMeAndAncestors(); }
    this.expander().expand();
  }, {category: ['contents panel']});

  add.method('updateExpandedness', function () {
    this.updateAppearance();
  }, {category: ['updating']});

  add.method('potentialContent', function () {
    var rows = [];
    if (! this._shouldOmitHeaderRow)   { rows.push(this.headerRow()); }
    if (this.expander().isExpanded()) { rows.push(this.contentsPanel()); }
    return avocado.tableContents.createWithColumns([rows]);
  }, {category: ['updating']});

  add.method('supernodeMorph', function () {
    if (this.treeNode().isRoot()) { return null; }
    var sn = this.treeNode().supernode();
    return this.ownerSatisfying(function(o) { return o.constructor === this.constructor && o.treeNode().equals(sn); }.bind(this)) || this.nodeMorphFor(sn);
  }, {category: ['contents panel']});

  add.method('immediateSubnodeMorphs', function () {
    return avocado.enumerator.create(this, 'eachImmediateSubnodeMorph').toArray();
  }, {category: ['contents panel']});

  add.method('eachImmediateSubnodeMorph', function (f) {
    this.treeNode().eachImmediateSubnode(function(sn) { f(this.nodeMorphFor(sn)); }.bind(this));
  }, {category: ['contents panel']});

});


});
