transporter.module.create('lk_ext/message_notifier', function(requires) {

requires('lk_ext/rows_and_columns');

}, function(thisModule) {


thisModule.addSlots(lobby, function(add) {

  add.method('MessageNotifierMorph', function MessageNotifierMorph() { Class.initializer.apply(this, arguments); }, {category: ['ui']});

});


thisModule.addSlots(MessageNotifierMorph, function(add) {

  add.data('superclass', ColumnMorph);

  add.creator('prototype', Object.create(ColumnMorph.prototype));

  add.data('type', 'MessageNotifierMorph');

  add.method('showIfErrorDuring', function (f, evt, color) {
    try {
      return f();
    } catch (ex) {
      this.showError(ex, evt);
      return undefined;
    }
  });

  add.method('showError', function (err, evt, color) {
    var msg = "Error: " + err;
    if (err.line !== undefined) { msg += "[" + err.sourceURL + ":" + err.line + "]"; }
    console.log(msg);
    new this(err, color || Color.red).showTemporarilyInCenterOfWorld((evt || Event.createFake()).hand.world());
  });

});


thisModule.addSlots(MessageNotifierMorph.prototype, function(add) {

  add.data('constructor', MessageNotifierMorph);

  add.method('initialize', function ($super, err, color) {
    $super();
    this.shape.roundEdgesBy(10);
    this._originalError = err;
    this._message = this._originalError.toString();
    this.setFill(lively.paint.defaultFillWithColor(color || Color.red));
    this.setRows([TextMorph.createLabel(this._message)]);
    this.closeDnD();
  });

  add.method('wasJustDroppedOnWorld', function (world) {
    // By default, zoom away after a short while, unless the user touches it.
    if (this.zoomOuttaHereTimer) {
      // cancel the zooming-away
      window.clearTimeout(this.zoomOuttaHereTimer);
    }
  });

});


thisModule.addSlots(WorldMorph.prototype, function(add) {

  add.method('showMessage', function (msg, color) {
    // By default, zoom away after a short while, unless the user touches it.
    new MessageNotifierMorph(msg, color || Color.green).showTemporarilyInCenterOfWorld(this);
  }, {category: ['showing messages']});

});


});
