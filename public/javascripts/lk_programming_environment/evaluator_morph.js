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
    
    this.applyStyle(this.defaultStyle);

    var tm = this._textMorph = TextMorph.createInputBox("", pt(150, 60)).applyStyle(this.textStyle);
    
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

  add.method('commands', function () {
    var cmdList = avocado.command.list.create(this);
    cmdList.addItem(avocado.command.create("Get it", function(evt) {this.getIt(evt);}.bind(this)).setHelpText('Run the code in the box and get the result'));
    cmdList.addItem(avocado.command.create("Do it",  function(evt) {this. doIt(evt);}.bind(this)).setHelpText('Run the code in the box'));
    if (this.isTicking()) {
      cmdList.addItem(avocado.command.create("Stop ticking", function(evt) {this.stopTicking(evt);}.bind(this)));
    } else {
      cmdList.addItem(avocado.command.create("Start ticking", function(evt) {this.startTicking(evt);}.bind(this)));
    }
    return cmdList;
  }, {category: ['creating']});

  add.method('runTheCode', function () {
    return this.mirrorMorph().mirror().evalCodeString(this._textMorph.getText());
  }, {category: ['running the code']});

  add.method('doIt', function (evt) {
    avocado.ui.showMessageIfErrorDuring(function() { this.runTheCode(); }.bind(this), evt);
  }, {category: ['running the code']});

  add.method('getIt', function (evt) {
    avocado.ui.showMessageIfErrorDuring(function() {
      var resultMirMorph = evt.hand.world().morphFor(reflect(this.runTheCode()));
      this.mirrorMorph().grabResult(resultMirMorph, evt);
    }.bind(this), evt);
  }, {category: ['running the code']});

  add.method('startTicking', function (evt) {
    var mir = this.mirrorMorph().mirror();
    var f = mir.functionFromCodeString(this._textMorph.getText());
    this._ticker = new PeriodicalExecuter(function(pe) {
      avocado.ui.showMessageIfErrorDuring(function() {
        try {
          mir.callFunction(f);
        } catch (ex) {
          this.stopTicking();
          throw ex;
        }
      }.bind(this), evt);
    }.bind(this), 0.1);
  }, {category: ['running the code']});

  add.method('stopTicking', function (evt) {
    if (! this._ticker) { return; }
    this._ticker.stop();
    this._ticker = null;
  }, {category: ['running the code']});

  add.method('isTicking', function (evt) {
    return !!this._ticker;
  }, {category: ['running the code']});
  
  add.creator('defaultStyle', {}, {category: ['styles']});
  
  add.creator('textStyle', {}, {category: ['styles']});

});


thisModule.addSlots(avocado.EvaluatorMorph.prototype.defaultStyle, function(add) {

  add.data('padding', 10);

  add.data('borderWidth', 0);

  add.data('fill', null);

  add.data('suppressGrabbing', true);

  add.data('suppressHandles', true);

  add.data('grabsShouldFallThrough', true);

  add.data('openForDragAndDrop', false);

});


thisModule.addSlots(avocado.EvaluatorMorph.prototype.textStyle, function(add) {

  add.data('fill', Color.white);

  add.data('fontFamily', 'monospace');

});


});
