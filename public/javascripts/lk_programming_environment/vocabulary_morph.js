transporter.module.create('lk_programming_environment/vocabulary_morph', function(requires) {

requires('reflection/vocabulary');

}, function(thisModule) {


thisModule.addSlots(avocado.vocabulary, function(add) {

  add.method('Morph', function Morph() { Class.initializer.apply(this, arguments); }, {category: ['user interface']});

  add.method('newMorph', function () {
    return new this.Morph(this);
  }, {category: ['user interface']});

  add.method('morph', function () {
    return WorldMorph.current().morphFor(this);
  }, {category: ['user interface']});

  add.data('isImmutableForMorphIdentity', true, {category: ['user interface']});

});


thisModule.addSlots(avocado.vocabulary.Morph, function(add) {

  add.data('superclass', avocado.ColumnMorph);

  add.data('type', 'avocado.vocabulary.Morph');

  add.creator('prototype', Object.create(avocado.ColumnMorph.prototype));

});


thisModule.addSlots(avocado.vocabulary.Morph.prototype, function(add) {

  add.data('constructor', avocado.vocabulary.Morph);

  add.method('initialize', function ($super, v) {
    $super();
    this._model = v;
    this.applyStyle(this.defaultStyle);

    this._evaluatorsPanel = new avocado.ColumnMorph().beInvisible().applyStyle({horizontalLayoutMode: avocado.LayoutModes.SpaceFill});
    this._mirrorsPanel    = new avocado.ColumnMorph().beInvisible().applyStyle({horizontalLayoutMode: avocado.LayoutModes.SpaceFill});
    
    var mirs = this.mirror().meAndAncestors().toArray();
    this._mirrorsPanel.setRows(mirs.map(function(mir) { return new avocado.PlaceholderMorph(mir.morph()); }));
    
    this._expander = new ExpanderMorph(this);
    this._titleLabel = TextMorph.createLabel(function() {return v.inspect();});
    
    if (window.avocado && avocado.EvaluatorMorph) {
      this._evaluatorButton = avocado.command.create("E", function(evt) { this.openEvaluator(evt); }.bind(this)).setHelpText('Show an evaluator box').newMorph();
    }

    this.dismissButton = this.createDismissButton();
    
    this._headerRow = avocado.RowMorph.createSpaceFilling([this._expander, this._titleLabel, Morph.createSpacer(), this._evaluatorButton, this.dismissButton].compact(), this.defaultStyle.headerRowPadding);
    this._headerRow.refreshContentOfMeAndSubmorphs();
    
    this.refreshContent();
  }, {category: ['creating']});

  add.creator('defaultStyle', {}, {category: ['styles']});

  add.method('mirror', function () { return this._model.mirror(); }, {category: ['accessing']});

  add.method('expand', function () {
    this._expander.expand();
  }, {category: ['updating']});

  add.method('updateExpandedness', function () {
    this.refreshContentOfMeAndSubmorphs();
  }, {category: ['updating']});

  add.method('potentialContent', function () {
    var rows = [this._headerRow];
    if (this._expander.isExpanded()) { rows.push(this._mirrorsPanel); }
    rows.push(this._evaluatorsPanel);
    return avocado.tableContents.createWithColumns([rows]);
  }, {category: ['updating']});

  add.method('getAllMirrors', function () {
    this._mirrorsPanel.eachCell(function(m) {
      if (m.putOriginalMorphBack) {
        m.putOriginalMorphBack();
      }
    });
  }, {category: ['evaluators']});

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
    if (resultMirMorph === this.mirror().morph()) {
      this.wiggle();
    } else {
      resultMirMorph.grabMe(evt);
    }
  }, {category: ['evaluators']});

  add.method('doIWantToLeaveAPlaceholderWhenRemoving', function (m) {
    return m.owner === this._mirrorsPanel && m instanceof avocado.mirror.Morph;
  }, {category: ['placeholders']});

  add.method('placeholderForMirror', function (mir) {
    return this.placeholderMorphs().find(function(placeholderMorph) { return mir.equals(placeholderMorph.originalMorph().mirror()); });
  }, {category: ['placeholders']});

  add.method('placeholderMorphs', function () {
    return this._mirrorsPanel.cells().select(function(m) { return m instanceof avocado.PlaceholderMorph; });
  }, {category: ['placeholders']});

});


thisModule.addSlots(avocado.vocabulary.Morph.prototype.defaultStyle, function(add) {

  add.data('borderColor', new Color(0.6, 0.6, 0.6));

  add.data('borderWidth', 1);

  add.data('borderRadius', 10);

  add.data('openForDragAndDrop', false);

  add.data('fill', new lively.paint.LinearGradient([new lively.paint.Stop(0, new Color(0.9019607843137255, 0.9019607843137255, 0.6)), new lively.paint.Stop(1, new Color(0.8, 0.8, 0.4980392156862745))], lively.paint.LinearGradient.NorthSouth));

  add.data('padding', {top: 2, bottom: 2, left: 4, right: 4, between: {x: 2, y: 2}}, {initializeTo: '{top: 2, bottom: 2, left: 4, right: 4, between: {x: 2, y: 2}}'});

  add.data('internalPadding', {left: 15, right: 2, top: 2, bottom: 2, between: {x: 0, y: 0}}, {initializeTo: '{left: 15, right: 2, top: 2, bottom: 2, between: {x: 0, y: 0}}'});

  add.data('headerRowPadding', {top: 0, bottom: 0, left: 0, right: 0, between: {x: 3, y: 3}}, {initializeTo: '{top: 0, bottom: 0, left: 0, right: 0, between: {x: 3, y: 3}}'});

});


});
