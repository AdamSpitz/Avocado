avocado.transporter.module.create('general_ui/message_notifier', function(requires) {

requires('general_ui/basic_morph_mixins');
requires('general_ui/one_morph_per_object');
requires('general_ui/table_layout');

}, function(thisModule) {


thisModule.addSlots(avocado, function(add) {
  
  add.creator('messageNotifier', {}, {category: ['ui']});
  
  add.creator('label', {}, {category: ['ui']});

});


thisModule.addSlots(avocado.messageNotifier, function(add) {

  add.method('showError', function (err, evt, color) {
    var msg = "Error: " + err;
    if (err.line !== undefined) { msg += "[" + err.sourceURL + ":" + err.line + "]"; }
    console.log(msg);
    var world = avocado.ui.worldFor(evt);
    world.showMessage(err, color || Color.red);
  });

  add.method('showIfErrorDuring', function (f, evt, color) {
    try {
      return f();
    } catch (ex) {
      this.showError(ex, evt);
      return undefined;
    }
  });
  
  add.method('create', function (msg, color, heading) {
    return Object.newChildOf(this, msg, color, heading);
  }, {category: ['creating']});
  
  add.method('initialize', function (msg, color, heading) {
    this._message = msg;
    this._color = color;
    this._heading = heading;
  }, {category: ['creating']});

  add.method('showInWorld', function (world) {
    // By default, zoom away after a short while, unless the user touches it.
    world.morphFor(this).showTemporarilyInCenterOfUsersFieldOfVision(world);
  }, {category: ['showing']});
  
  add.method('updateFillOfMorph', function (m) {
    m.setFill(avocado.ui.defaultFillWithColor(this._color || Color.red));
  }, {category: ['user interface']});
  
  add.method('newMorph', function () {
    var rows = [avocado.label.create(this._message.toString())];
    if (this._heading) { rows.unshift(avocado.label.create(this._heading).setEmphasis({style: 'bold'})); }
    var m = avocado.tableContents.createWithColumns([rows]).newMorph().setModel(this);
    this.updateFillOfMorph(m);
    return m;
  }, {category: ['user interface']});
  
});


thisModule.addSlots(avocado.label, function(add) {
  
  add.method('create', function (str) {
    return Object.newChildOf(this, str);
  }, {category: ['creating']});
  
  add.method('initialize', function (str) {
    this._string = str;
  }, {category: ['creating']});
  
  add.method('setEmphasis', function (e) {
    this._emphasis = e;
    return this;
  }, {category: ['accessing']});
  
});


thisModule.addSlots(avocado.morphMixins.WorldMorph, function(add) {

  add.method('showMessage', function (msg, color, heading) {
    avocado.messageNotifier.create(msg, color || Color.green, heading).showInWorld(this);
  }, {category: ['showing messages']});

});


thisModule.addSlots(Error, function(add) {

  add.method('create', function (err) {
    if (err instanceof Error) { return err; }
    return new Error(err);
  }, {category: ['creating']});

});


thisModule.addSlots(Error.prototype, function(add) {
  
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

});


});
