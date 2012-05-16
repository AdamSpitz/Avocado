avocado.transporter.module.create('lk_programming_environment/vocabulary_morph', function(requires) {

requires('general_ui/table_layout');
requires('reflection/vocabulary');

}, function(thisModule) {


thisModule.addSlots(avocado.vocabulary, function(add) {

  add.method('Morph', function Morph() { Class.initializer.apply(this, arguments); }, {category: ['user interface']});

  add.method('newMorph', function () {
    return new this.Morph(this);
  }, {category: ['user interface']});

  add.data('isImmutableForMorphIdentity', true, {category: ['user interface']});

});


thisModule.addSlots(avocado.vocabulary.Morph, function(add) {

  add.data('displayName', 'Morph');

  add.data('superclass', Morph);

  add.data('type', 'avocado.vocabulary.Morph');

  add.creator('prototype', Object.create(Morph.prototype));

});


thisModule.addSlots(avocado.vocabulary.Morph.prototype, function(add) {

  add.data('constructor', avocado.vocabulary.Morph);

  add.method('initialize', function ($super, v) {
    $super(lively.scene.Rectangle.createWithIrrelevantExtent());
    this.useTableLayout(avocado.table.contents.columnPrototype);
    this._model = v;
    this.applyStyle(this.defaultStyle);

    this._evaluatorsPanel = avocado.table.newColumnMorph().beInvisible().applyStyle({horizontalLayoutMode: avocado.LayoutModes.SpaceFill});
    this._mirrorsPanel    = avocado.table.newColumnMorph().beInvisible().applyStyle({horizontalLayoutMode: avocado.LayoutModes.SpaceFill});
    
    
    var mirs = this.mirror().meAndAncestors().toArray();
    var mirrorsPanel = this._mirrorsPanel;
    var world = avocado.ui.currentWorld();
    this._mirrorsPanel.layout().setCells(mirs.map(function(mir) { return mirrorsPanel.placeholderForMorph(world.morphFor(mir)); }));
    
    this._expander = new avocado.ExpanderMorph(this);
    this._titleLabel = this.createNameLabel();
    
    if (window.avocado && avocado.evaluator) {
      this._evaluatorButton = avocado.command.create("E", function(evt) { this.openEvaluator(evt); }.bind(this)).setHelpText('Show an evaluator box').newMorph();
    }

    this.dismissButton = this.createDismissButton();
    
    this._headerRow = avocado.table.createSpaceFillingRowMorph([this._expander, this._titleLabel, avocado.ui.createSpacer(), this._evaluatorButton, this.dismissButton].compact(), this.defaultStyle.headerRowPadding);
    this._headerRow.refreshContentOfMeAndSubmorphs();
    
    this.refreshContent();
  }, {category: ['creating']});

  add.creator('defaultStyle', {}, {category: ['styles']});

  add.method('mirror', function () { return this._model.mirror(); }, {category: ['accessing']});

  add.method('potentialContentMorphs', function () {
    var rows = [this._headerRow];
    if (this._expander.isExpanded()) { rows.push(this._mirrorsPanel); }
    rows.push(this._evaluatorsPanel);
    return avocado.table.contents.createWithColumns([rows]);
  }, {category: ['updating']});

  add.method('getAllMirrors', function () {
    this._mirrorsPanel.submorphsParticipatingInLayout().forEach(function(m) {
      if (m.layout() && m.layout().putOriginalMorphBack) {
        m.layout().putOriginalMorphBack();
      }
    });
  }, {category: ['evaluators']});

  add.method('openEvaluator', function (evt) {
    evt = evt || Event.createFake();
    var e = avocado.ui.currentWorld().morphFor(avocado.evaluator.create(this._model));
    this._evaluatorsPanel.layout().addCell(e);
    e.wasJustAdded(evt);
    return e;
  }, {category: ['evaluators']});

  add.method('closeEvaluator', function (evaluatorMorph) {
    this._evaluatorsPanel.layout().removeCell(evaluatorMorph);
  }, {category: ['evaluators']});

  add.method('grabResult', function (resultMirMorph, evt) {
    if (resultMirMorph === avocado.ui.worldFor(evt).morphFor(this.mirror())) {
      this.wiggle();
    } else {
      resultMirMorph.grabMe(evt);
    }
  }, {category: ['evaluators']});

  add.method('doIWantToLeaveAPlaceholderWhenRemoving', function (m) {
    return m.owner === this._mirrorsPanel && m.isMirrorMorph;
  }, {category: ['placeholders']});

  add.method('placeholderForMirror', function (mir) {
    return this.placeholderMorphs().find(function(placeholderMorph) { return mir.equals(placeholderMorph.layout().originalMorph().mirror()); });
  }, {category: ['placeholders']});

  add.method('placeholderMorphs', function () {
    return this._mirrorsPanel.submorphsParticipatingInLayout().select(function(m) { return m.layout() && m.layout().isPlaceholder; });
  }, {category: ['placeholders']});

});


thisModule.addSlots(avocado.vocabulary.Morph.prototype.defaultStyle, function(add) {

  add.data('borderColor', new Color(0.6, 0.6, 0.6));

  add.data('borderWidth', 1);

  add.data('borderRadius', 10);

  add.data('openForDragAndDrop', false);

  add.data('fillBase', new Color(0.8, 0.8, 0.5));

  add.data('padding', {top: 2, bottom: 2, left: 4, right: 4, between: {x: 2, y: 2}}, {initializeTo: '{top: 2, bottom: 2, left: 4, right: 4, between: {x: 2, y: 2}}'});

  add.data('internalPadding', {left: 15, right: 2, top: 2, bottom: 2, between: {x: 0, y: 0}}, {initializeTo: '{left: 15, right: 2, top: 2, bottom: 2, between: {x: 0, y: 0}}'});

  add.data('headerRowPadding', {top: 0, bottom: 0, left: 0, right: 0, between: {x: 3, y: 3}}, {initializeTo: '{top: 0, bottom: 0, left: 0, right: 0, between: {x: 3, y: 3}}'});

});


});
