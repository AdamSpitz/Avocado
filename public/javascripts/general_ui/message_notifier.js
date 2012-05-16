avocado.transporter.module.create('general_ui/message_notifier', function(requires) {

requires('general_ui/basic_morph_mixins');
requires('general_ui/one_morph_per_object');
requires('general_ui/table_layout');

}, function(thisModule) {


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

  add.creator('defaultMorphStyle', Object.create(avocado.table.boxStyle), {category: ['user interface']});

});


thisModule.addSlots(Error.prototype.defaultMorphStyle, function(add) {

  add.data('fillBase', new Color(1, 0, 0));

});


thisModule.addSlots(avocado, function(add) {

  add.creator('messageNotifier', {}, {category: ['ui']});

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
    var m = world.morphFor(this);
    m.showTemporarilyInCenterOfUsersFieldOfVision(world);
  }, {category: ['showing']});

  add.method('updateStyleOfMorph', function (m) {
    m.setFillBase(this._color || Color.red);
  }, {category: ['user interface']});

  add.method('newMorph', function () {
    var rows = [avocado.label.create(this._message.toString())];
    if (this._heading) { rows.unshift(avocado.label.create(this._heading).setEmphasis(avocado.label.emphasiseses.bold)); }
    var m = avocado.table.contents.createWithColumns([rows]).newMorph().setModel(this);
    this.updateStyleOfMorph(m);
    return m;
  }, {category: ['user interface']});

});


thisModule.addSlots(avocado, function(add) {

  add.creator('label', {}, {category: ['ui']});

});


thisModule.addSlots(avocado.label, function(add) {

  add.method('create', function (str) {
    return Object.newChildOf(this, str);
  }, {category: ['creating']});

  add.method('initialize', function (str) {
    this._stringSpecifier = str;
  }, {category: ['creating']});

  add.method('setEmphasis', function (e) {
    this._emphasis = e;
    return this;
  }, {category: ['accessing']});

  add.method('setDesiredScale', function (s) {
    // aaa - this is a hack, not sure what to do
    this._desiredScale = s;
    return this;
  }, {category: ['accessing']});

  add.method('newMorph', function () {
    var m = avocado.label.newMorphFor(this._stringSpecifier);
    if (this._emphasis) { m.setEmphasis(this._emphasis); }
    return m;
  }, {category: ['user interface']});

  add.method('newMorphFor', function (textOrFunctionOrObject, extent) {
    var initialText = "";
    var calculateNewText = null;
    if (textOrFunctionOrObject) {
      if (typeof textOrFunctionOrObject === 'string') {
        initialText = textOrFunctionOrObject;
      } else if (typeof textOrFunctionOrObject === 'function') {
        calculateNewText = textOrFunctionOrObject;
      } else if (typeof textOrFunctionOrObject === 'object') {
        if (typeof(textOrFunctionOrObject.get) === 'function') {
          initialText = textOrFunctionOrObject.get() || "";
          calculateNewText = textOrFunctionOrObject.get.bind(textOrFunctionOrObject);
        } else {
          initialText = textOrFunctionOrObject.initialText || "";
          calculateNewText = textOrFunctionOrObject.calculateNewText;
        }
      }
    }
    
    var m = this.newMorphWithInitialText(initialText, extent);
    
    if (calculateNewText) {
      m.calculateNewText = calculateNewText;
      m.refreshText = function() { this.setText(this.calculateNewText()); };
    }
    
    if (this._desiredScale) {
      m.setFontSize(this._desiredScale);
    }
    
    return m;
  });

  add.creator('emphasiseses', {}, {category: ['user interface']});

});


thisModule.addSlots(avocado.label.emphasiseses, function(add) {

  add.creator('bold', {});

  add.creator('italic', {});

});


thisModule.addSlots(avocado.label.emphasiseses.bold, function(add) {

  add.data('style', 'bold');

});


thisModule.addSlots(avocado.label.emphasiseses.italic, function(add) {

  add.data('style', 'italic');

});


thisModule.addSlots(avocado, function(add) {

  add.creator('editableText', Object.create(avocado.label), {category: ['ui']});

});


thisModule.addSlots(avocado.editableText, function(add) {

  add.method('setNameOfEditCommand', function (n) {
    this._nameOfEditCommand = n;
    return this;
  }, {category: ['accessing']});

  add.method('newMorph', function () {
    return this.newMorphFor(this._stringSpecifier, this._nameOfEditCommand, this._emphasis);
  }, {category: ['user interface']});

});


thisModule.addSlots(avocado, function(add) {

  add.creator('frequentlyEditedText', Object.create(avocado.editableText), {category: ['ui']});

  add.creator('infrequentlyEditedText', Object.create(avocado.editableText), {category: ['ui']});

});


});
