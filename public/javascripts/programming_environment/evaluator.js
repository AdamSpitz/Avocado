transporter.module.create('programming_environment/evaluator', function(requires) {

requires('lk_ext/rows_and_columns');

}, function(thisModule) {


thisModule.addSlots(lobby, function(add) {

  add.method('EvaluatorMorph', function EvaluatorMorph() { Class.initializer.apply(this, arguments); }, {category: ['ui']});

});


thisModule.addSlots(EvaluatorMorph, function(add) {

  add.data('superclass', ColumnMorph);

  add.creator('prototype', Object.create(ColumnMorph.prototype));

  add.data('type', 'EvaluatorMorph');

});


thisModule.addSlots(EvaluatorMorph.prototype, function(add) {

  add.data('constructor', EvaluatorMorph);

  add.method('initialize', function ($super, mirrorMorph) {
    $super();
    this._mirrorMorph = mirrorMorph;
    
    this.setFill(null);
    this.closeDnD();
    this.horizontalLayoutMode = LayoutModes.SpaceFill;
    this.ignoreEvents(); // so we can drag through it, since it doesn't need a menu

    var tm = this._textMorph = new TextMorph(pt(5, 10).extent(pt(150, 60)), "");
    tm.closeDnD();
    tm.setBorderWidth(0);
    tm.setFill(Color.white);
    // tm.horizontalLayoutMode = LayoutModes.SpaceFill; // doesn't work yet
    tm.setFontFamily('monospace');
    var thisEvaluator = this;
    tm.onKeyDown = function(evt) {
      if (evt.getKeyCode() == Event.KEY_RETURN && (evt.isMetaDown() || evt.isAltDown() || evt.isCtrlDown())) {
        thisEvaluator.getIt(evt);
        evt.stop();
        return;
      }
      return TextMorph.prototype.onKeyDown.call(this, evt);
    };
    
    var buttons = [ButtonMorph.createButton("Do it",  function(evt) {this. doIt(evt);}.bind(this)).setHelpText('Run the code in the box'),
                   ButtonMorph.createButton("Get it", function(evt) {this.getIt(evt);}.bind(this)).setHelpText('Run the code in the box and get the result'),
                   ButtonMorph.createButton("Close",  function(evt) {this.remove(  );}.bind(this))];

    this.setRows([RowMorph.createSpaceFilling([tm]), RowMorph.createSpaceFilling(buttons)]);
  }, {category: ['creating']});

  add.method('mirrorMorph', function () { return this._mirrorMorph;  }, {category: ['accessing']});

  add.method('textMorph', function () { return this._textMorph;  }, {category: ['accessing']});

  add.method('wasJustShown', function (evt) { this._textMorph.wasJustShown(evt); }, {category: ['events']});

  add.method('runTheCode', function () {
    var __codeToRun__ = this._textMorph.getText();
    // run the code with "this" set to the mirror's object
    return (function() { return eval("//@ sourceURL=evaluator\n(" + __codeToRun__ + ")"); }).call(this.mirrorMorph().mirror().reflectee());
  }, {category: ['running the code']});

  add.method('doIt', function (evt) {
    MessageNotifierMorph.showIfErrorDuring(function() { this.runTheCode(); }.bind(this), evt);
  }, {category: ['running the code']});

  add.method('getIt', function (evt) {
    MessageNotifierMorph.showIfErrorDuring(function() {
      var resultMirMorph = evt.hand.world().morphFor(reflect(this.runTheCode()));
      if (resultMirMorph === this.mirrorMorph()) {
        resultMirMorph.wiggle();
      } else {
        resultMirMorph.grabMe(evt);
      }
    }.bind(this), evt);
  }, {category: ['running the code']});

});


});
