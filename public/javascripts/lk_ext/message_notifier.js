avocado.transporter.module.create('lk_ext/message_notifier', function(requires) {

requires('lk_ext/rows_and_columns');

}, function(thisModule) {


thisModule.addSlots(avocado, function(add) {
  
  add.creator('messageNotifier', {}, {category: ['ui']});

  add.method('MessageNotifierMorph', function MessageNotifierMorph() { Class.initializer.apply(this, arguments); }, {category: ['ui']});

});


thisModule.addSlots(avocado.messageNotifier, function(add) {
  
  add.method('create', function (msg, color, heading) {
    return Object.newChildOf(this, msg, color, heading);
  }, {category: ['creating']});
  
  add.method('initialize', function (msg, color, heading) {
    this._message = msg;
    this._color = color;
    this._heading = heading;
  }, {category: ['creating']});
  
  add.method('newMorph', function () {
    return new avocado.MessageNotifierMorph(this._message, this._color, this._heading).setModel(this);
  }, {category: ['user interface']});
  
});


thisModule.addSlots(avocado.MessageNotifierMorph, function(add) {

  add.data('superclass', avocado.ColumnMorph);

  add.data('type', 'avocado.MessageNotifierMorph');

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
    var morph = new this(err, color || Color.red);
    var world = avocado.ui.worldFor(evt);
    morph.setScale(1 / world.getScale());
    morph.showTemporarilyInCenterOfWorld(world);
  });

  add.creator('prototype', Object.create(avocado.ColumnMorph.prototype));

});


thisModule.addSlots(avocado.MessageNotifierMorph.prototype, function(add) {

  add.data('constructor', avocado.MessageNotifierMorph);

  add.method('initialize', function ($super, err, color, heading) {
    $super();
    this.shape.roundEdgesBy(10);
    this._originalError = err;
    this._message = this._originalError.toString();
    this.setFill(lively.paint.defaultFillWithColor(color || Color.red));
    var rows = [TextMorph.createLabel(this._message)];
    if (heading) {
      var headingMorph = TextMorph.createLabel(heading).setEmphasis({style: 'bold'});
      rows.unshift(headingMorph);
    }
    this.setRows(rows);
    this.closeDnD();
  });

});


thisModule.addSlots(WorldMorph.prototype, function(add) {

  add.method('showMessage', function (msg, color, heading) {
    // By default, zoom away after a short while, unless the user touches it.
    var morph = new avocado.MessageNotifierMorph(msg, color || Color.green, heading);
    morph.setScale(1 / this.getScale());
    morph.showTemporarilyInCenterOfWorld(this);
  }, {category: ['showing messages']});

});


thisModule.addSlots(Error, function(add) {

  add.method('create', function (err) {
    if (err instanceof Error) { return err; }
    return new Error(err);
  }, {category: ['creating']});

});


thisModule.addSlots(Error.prototype, function(add) {

  add.method('newMorph', function () {
    return avocado.TreeNodeMorph.create(this).refreshContentOfMeAndSubmorphs().applyStyle(this.defaultMorphStyle);
  }, {category: ['user interface']});
  
  add.method('immediateContents', function () {
    var cs = this._immediateContents;
    if (! cs) {
      cs = this._immediateContents = [];
      if (typeof(this.sourceURL) !== 'undefined') { cs.push(avocado.messageNotifier.create(this.sourceURL, Color.red, "source URL")); }
      if (typeof(this.line     ) !== 'undefined') { cs.push(avocado.messageNotifier.create(this.line     , Color.red, "line"      )); }
    }
    return cs;
  }, {category: ['user interface']});
  
  add.method('setImmediateContents', function (cs) {
    this._immediateContents = cs;
    return this;
  }, {category: ['user interface']});

  add.creator('defaultMorphStyle', Object.create(avocado.TableMorph.boxStyle), {category: ['user interface']});

});


thisModule.addSlots(Error.prototype.defaultMorphStyle, function(add) {
  
  add.data('fill', new lively.paint.LinearGradient([new lively.paint.Stop(0, new Color(1, 0, 0)), new lively.paint.Stop(1, new Color(1, 0.2, 0.2))], lively.paint.LinearGradient.SouthNorth));
  
});


});
