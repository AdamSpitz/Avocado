avocado.transporter.module.create('programming_environment/evaluator_morph', function(requires) {

requires('general_ui/table_layout');

}, function(thisModule) {


thisModule.addSlots(avocado, function(add) {

  add.creator('evaluator', {}, {category: ['ui']});

});


thisModule.addSlots(avocado.evaluator, function(add) {

  add.method('create', function (context) {
    return Object.newChildOf(this, context);
  }, {category: ['creating']});

  add.method('initialize', function (context) {
    this._context = context;
  }, {category: ['creating']});

  add.method('mirror', function () {
    if (typeof(this._context.mirror) === 'function') { return this._context.mirror(); }
    return this._context;
  }, {category: ['accessing']});

  add.method('mirrorMorph', function () {
    // aaa - HACK
    return avocado.ui.currentWorld().morphFor(this.mirror());
  }, {category: ['user interface']});

  add.method('textMorph', function () {
    // aaa - HACK
    return avocado.ui.currentWorld().morphFor(this)._textMorph;
  }, {category: ['user interface']});

  add.creator('defaultStyle', {}, {category: ['styles']});

  add.creator('textStyle', {}, {category: ['styles']});

  add.method('newMorph', function () {
    var m = avocado.ui.newMorph().setModel(this).useTableLayout(avocado.table.contents.columnPrototype);
    
    m.applyStyle(avocado.evaluator.defaultStyle);

    var tm = m._textMorph = TextMorph.createInputBox("", pt(150, 60)).applyStyle(avocado.evaluator.textStyle);
    
    var thisEvaluator = this;
    tm.onKeyDown = function(evt) {
      if (evt.getKeyCode() == Event.KEY_RETURN && (evt.isMetaDown() || evt.isAltDown() || evt.isCtrlDown())) {
        thisEvaluator.getIt(evt);
        evt.stop();
        return;
      }
      return TextMorph.prototype.onKeyDown.call(tm, evt);
    };
    
    var buttons = this.buttonCommands().map(function(c) { return c.newMorph(); });

    m.layout().setCells([tm, avocado.table.createSpaceFillingRowMorph(buttons)]);
    
    m.wasJustAdded = function (evt) { m._textMorph.wasJustAdded(evt); };
    
    return m;
  }, {category: ['user interface']});

  add.method('buttonCommands', function () {
    return [avocado.command.create("Do it",  function(evt) {this. doIt(evt);}.bind(this)).setHelpText('Run the code in the box'),
            avocado.command.create("Get it", function(evt) {this.getIt(evt);}.bind(this)).setHelpText('Run the code in the box and get the result'),
            avocado.command.create("Close",  function(evt) {this.mirrorMorph().closeEvaluator(this);}.bind(this))];
  }, {category: ['user interface']});

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
    return this.mirror().evalCodeString(this.textMorph().getText());
  }, {category: ['running the code']});

  add.method('doIt', function (evt) {
    avocado.ui.showMessageIfErrorDuring(function() { this.runTheCode(); }.bind(this), evt);
  }, {category: ['running the code']});

  add.method('getIt', function (evt) {
    avocado.ui.showMessageIfErrorDuring(function() {
      var resultMirMorph = avocado.ui.worldFor(evt).morphFor(reflect(this.runTheCode()));
      this.mirrorMorph().grabResult(resultMirMorph, evt);
    }.bind(this), evt);
  }, {category: ['running the code']});

  add.method('startTicking', function (evt) {
    var mir = this.mirror();
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

});


thisModule.addSlots(avocado.evaluator.defaultStyle, function(add) {

  add.data('padding', 10);

  add.data('borderWidth', 0);

  add.data('fill', null);

  add.data('suppressGrabbing', true);

  add.data('suppressHandles', true);

  add.data('grabsShouldFallThrough', true);

  add.data('openForDragAndDrop', false);

});


thisModule.addSlots(avocado.evaluator.textStyle, function(add) {

  add.data('fill', new Color(1, 1, 1));

  add.data('fontFamily', 'monospace');

});


});
