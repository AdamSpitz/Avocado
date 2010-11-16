transporter.module.create('core/commands', function(requires) {}, function(thisModule) {


thisModule.addSlots(avocado, function(add) {

  add.creator('command', {}, {category: ['ui']});

});


thisModule.addSlots(avocado.command, function(add) {

  add.creator('list', {});

  add.method('create', function () {
    var c = Object.create(this);
    c.initialize.apply(c, arguments);
    return c;
  }, {category: ['creating']});

  add.method('initialize', function (label, runFn) {
    this.setLabel(label);
    this.setFunction(runFn);
  }, {category: ['creating']});

  add.method('label', function () {
    return this._label;
  }, {category: ['accessing']});

  add.method('helpText', function () {
    return this._helpText;
  }, {category: ['accessing']});

  add.method('functionToRun', function () {
    return this._functionToRun;
  }, {category: ['accessing']});

  add.method('applicabilityFunction', function () {
    return this._applicabilityFunction;
  }, {category: ['accessing']});

  add.method('setLabel', function (label) {
    this._label = label;
    return this;
  }, {category: ['accessing']});

  add.method('setHelpText', function (t) {
    this._helpText = t;
    return this;
  }, {category: ['accessing']});

  add.method('setFunction', function (f) {
    this._functionToRun = f;
    return this;
  }, {category: ['accessing']});

  add.method('onlyApplicableIf', function (f) {
    this._applicabilityFunction = f;
    return this;
  }, {category: ['accessing']});

});


thisModule.addSlots(avocado.command.list, function(add) {

  add.method('create', function (cs) {
    return Object.newChildOf(this, cs);
  }, {category: ['creating']});

  add.method('initialize', function (cs) {
    this._commands = cs || [];
  }, {category: ['creating']});

  add.method('size', function () {
    return this._commands.size();
  }, {category: ['accessing']});

  add.method('eachCommand', function (f) {
    this._commands.each(function(c) { if (c) { f(c); } });
  }, {category: ['iterating']});

  add.method('addItem', function (c) {
    // for compatibility with MenuMorph
    if (reflect(c).isReflecteeArray()) {
      c = {label: c[0], go: c[1]};
    }

    this._commands.push(c);
  }, {category: ['adding']});

  add.method('addItems', function (items) {
    items.forEach(function(item) { this.addItem(item); }.bind(this));
  }, {category: ['adding']});

  add.method('addLine', function (c) {
    if (this._commands.length === 0 || this._commands[this._commands.length - 1] === null) { return; }
    this._commands.push(null);
  }, {category: ['adding']});

  add.method('addSection', function (cs) {
    if (cs.size() > 0) {
      this.addLine();
      cs.each(this.addItem.bind(this));
    }
  }, {category: ['adding']});

  add.method('addItemsToMenu', function (menu, target) {
    for (var i = 0, n = this._commands.length; i < n; ++i) {
      var c = this._commands[i];
      if (c) {
        var label = typeof(c.label) === 'function' ? c.label(target) : c.label;
        menu.addItem([label, c.go]);
      } else {
        if (i !== n - 1) { // no point if it's the last one
          menu.addLine();
        }
      }
    }
  }, {category: ['converting']});

  add.method('itemWith', function (attrName, attrValue) {
    return this.itemSuchThat(function(c) { return c[attrName] === attrValue; });
  }, {category: ['accessing']});

  add.method('itemSuchThat', function (criterion) {
    for (var i = 0, n = this._commands.length; i < n; ++i) {
      var c = this._commands[i];
      if (c && criterion(c)) { return c; }
    }
    return null;
  }, {category: ['accessing']});

  add.method('descriptionOfGroup', function (commandBearers) {
    if (!commandBearers || commandBearers.length === 0) { return "nothing here"; }
    
    var byClass = avocado.dictionary.copyRemoveAll();
    commandBearers.each(function(m) {
      byClass.getOrIfAbsentPut(m.constructor, function() {return [];}).push(m);
    });

    var buf = avocado.stringBuffer.create();
    var sep = "";
    byClass.eachKeyAndValue(function(c, ms) {
      buf.append(sep).append(ms.length.toString()).append(" ").append(reflect ? reflect(c).name() : c.type).append(ms.length === 1 ? "" : "s");
      sep = ", ";
    });
    return buf.toString();
  }, {category: ['groups of objects']});

  add.method('addItemsFromGroup', function (commandBearers) {
    if (! commandBearers) { return; }

    var byCommandType = avocado.dictionary.copyRemoveAll();
    commandBearers.each(function(m) {
      var cmdList = m.commands();
      if (cmdList) {
        cmdList.eachCommand(function(c) {
          if (c.pluralLabel) {
            byCommandType.getOrIfAbsentPut(c.pluralLabel, function() {return [];}).push({morph: m, command: c});
          }
        });
      }
    });

    byCommandType.keys().sort().each(function(pluralLabel) {
      var specs = byCommandType.get(pluralLabel);
      this.addItem({label: pluralLabel, go: function(evt) {
        var pluralGo = specs[0].command.pluralGo;
        if (pluralGo) {
          pluralGo(specs, evt);
        } else {
          // By default, just do each one in sequence.
          specs.each(function(spec) {
            spec.command.go(evt);
          });
        }
      }});
    }.bind(this));
  }, {category: ['adding']});

});


});
