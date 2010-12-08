transporter.module.create('lk_programming_environment/evaluator_morph', function(requires) {

requires('lk_ext/rows_and_columns');

}, function(thisModule) {


thisModule.addSlots(avocado, function(add) {

  add.method('EvaluatorMorph', function EvaluatorMorph() { Class.initializer.apply(this, arguments); }, {category: ['ui']});

});


thisModule.addSlots(avocado.EvaluatorMorph, function(add) {

  add.data('superclass', avocado.ColumnMorph);

  add.creator('prototype', Object.create(avocado.ColumnMorph.prototype));

  add.data('type', 'avocado.EvaluatorMorph');

});


thisModule.addSlots(avocado.EvaluatorMorph.prototype, function(add) {

  add.data('constructor', avocado.EvaluatorMorph);

  add.method('initialize', function ($super, mirrorMorph) {
    $super();
    this._mirrorMorph = mirrorMorph;
    
    this.beInvisible();
    this.setPadding(10);

    var tm = this._textMorph = TextMorph.createInputBox("", pt(150, 60));
    tm.setFill(Color.white);
    tm.setFontFamily('monospace');
    tm.setLayoutModes({horizontalLayoutMode: LayoutModes.SpaceFill});
    
    var thisEvaluator = this;
    tm.onKeyDown = function(evt) {
      if (evt.getKeyCode() == Event.KEY_RETURN && (evt.isMetaDown() || evt.isAltDown() || evt.isCtrlDown())) {
        thisEvaluator.getIt(evt);
        evt.stop();
        return;
      }
      return TextMorph.prototype.onKeyDown.call(this, evt);
    };
    
    var buttons = this.buttonCommands().map(function(c) { return c.newMorph(); });

    this.setRows([tm, avocado.RowMorph.createSpaceFilling(buttons)]);
  }, {category: ['creating']});

  add.method('mirrorMorph', function () { return this._mirrorMorph;  }, {category: ['accessing']});

  add.method('wasJustShown', function (evt) { this._textMorph.wasJustShown(evt); }, {category: ['events']});

  add.method('buttonCommands', function () {
    return [avocado.command.create("Do it",  function(evt) {this. doIt(evt);}.bind(this)).setHelpText('Run the code in the box'),
            avocado.command.create("Get it", function(evt) {this.getIt(evt);}.bind(this)).setHelpText('Run the code in the box and get the result'),
            avocado.command.create("Close",  function(evt) {this.mirrorMorph().closeEvaluator(this);}.bind(this))];
  }, {category: ['creating']});

  add.method('runTheCode', function () {
    return this.mirrorMorph().mirror().evalCodeString(this._textMorph.getText());
  }, {category: ['running the code']});

  add.method('doIt', function (evt) {
    avocado.ui.showMessageIfErrorDuring(function() { this.runTheCode(); }.bind(this), evt);
  }, {category: ['running the code']});

  add.method('getIt', function (evt) {
    //avocado.ui.showMessageIfErrorDuring(function() {
      var resultMirMorph = evt.hand.world().morphFor(reflect(this.runTheCode()));
      this.mirrorMorph().grabResult(resultMirMorph, evt);
    //}.bind(this), evt);
  }, {category: ['running the code']});

});


});
