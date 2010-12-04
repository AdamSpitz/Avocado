transporter.module.create('core/commands', function(requires) {}, function(thisModule) {


thisModule.addSlots(avocado, function(add) {

  add.creator('command', {}, {category: ['ui']});

});


thisModule.addSlots(avocado.command, function(add) {

  add.creator('list', {});

  add.creator('argumentSpec', {});

  add.method('create', function () {
    var c = Object.create(this);
    c.initialize.apply(c, arguments);
    return c;
  }, {category: ['creating']});

  add.method('initialize', function (label, runFnOrSubcmds) {
    this.setLabel(label);
    if (typeof(runFnOrSubcmds) === 'function') {
      this.setFunction(runFnOrSubcmds);
    } else if (reflect(runFnOrSubcmds).isReflecteeArray()) {
      this.setSubcommands(runFnOrSubcmds);
    } else {
      throw new Error("Trying to make a command, but don't know what this is: " + runFnOrSubcmds);
    }
  }, {category: ['creating']});

  add.data('isCommand', true, {category: ['testing']});
  
  add.method('helpText', function () {
    return this._helpText;
  }, {category: ['accessing']});

  add.method('functionToRun', function () {
    return this._functionToRun;
  }, {category: ['accessing']});

  add.method('subcommands', function () {
    return this._subcommands;
  }, {category: ['accessing']});

  add.method('applicabilityFunction', function () {
    return this._applicabilityFunction;
  }, {category: ['accessing']});

  add.method('setLabel', function (label) {
    this.label = label;
    return this;
  }, {category: ['accessing']});

  add.method('setHelpText', function (textOrFn) {
    this._helpText = textOrFn;
    return this;
  }, {category: ['accessing']});

  add.method('setFunction', function (f) {
    this._functionToRun = f;
    return this;
  }, {category: ['accessing']});

  add.method('setSubcommands', function (subcmds) {
    this._subcommands = subcmds;
    return this;
  }, {category: ['accessing']});
  
  add.method('toString', function () {
    return this.label;
  }, {category: ['printing']});
  
  add.method('wrapFunction', function (newFn) {
    var oldFunctionToRun = this._functionToRun;
    return this.setFunction(function() {
      return newFn.apply(this, [oldFunctionToRun].concat($A(arguments)));
    });
  }, {category: ['accessing']});

  add.method('onlyApplicableIf', function (f) {
    this._applicabilityFunction = f;
    return this;
  }, {category: ['accessing']});

  add.method('argumentSpecs', function () {
    return this._argumentSpecs;
  }, {category: ['accessing']});

  add.method('setArgumentSpecs', function (specs) {
    this._argumentSpecs = specs;
    return this;
  }, {category: ['accessing']});

  add.method('canAcceptArguments', function (args) {
    if (!this._argumentSpecs) { return args.length === 0; }
    var n = this._argumentSpecs.length;
    if (n !== args.length) { return false; }
    for (var i = 0; i < n; ++i) {
      var spec = this._argumentSpecs[i];
      var arg = args[i];
      if (! spec.canAccept(arg)) { return false; }
    }
    return true;
  }, {category: ['accessing']});

  add.method('go', function () {
    var f = this.functionToRun();
    var rcvr = this; // aaa - shouldn't be this, we should have a way of actually specifying the receiver
    if (!f.apply) { reflect(f).morph().grabMe(); }
    return f.apply(rcvr, $A(arguments));
  }, {category: ['accessing']});

});


thisModule.addSlots(avocado.command.argumentSpec, function(add) {
  
  add.method('create', function () {
    var c = Object.create(this);
    c.initialize.apply(c, arguments);
    return c;
  }, {category: ['creating']});

  add.method('initialize', function (name) {
    this._name = name;
  }, {category: ['creating']});
  
  add.method('onlyAccepts', function (f) {
    this._acceptanceFunction = f;
    return this;
  }, {category: ['accessing']});
  
  add.method('canAccept', function (arg) {
    if (! this._acceptanceFunction) { return true; }
    return this._acceptanceFunction(arg);
  }, {category: ['testing']});

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

  add.method('commands', function () {
    return this._commands;
  }, {category: ['iterating']});

  add.method('eachCommand', function (f) {
    this._commands.each(function(c) { if (c) { f(c); } });
  }, {category: ['iterating']});

  add.method('addItem', function (c) {
    // for compatibility with MenuMorph
    if (reflect(c).isReflecteeArray()) {
      c = avocado.command.create(c[0], c[1]);
    } else if (c && !c.isCommand) {
      // aaa - maybe just create the commands in the caller, don't do this stupid translation thing
      var newC = avocado.command.create(c.label, c.go);
      if (c.hasOwnProperty("isApplicable")) { newC.onlyApplicableIf(c.isApplicable); }
      if (c.hasOwnProperty("pluralGo")) { newC.pluralGo = c.pluralGo; }
      if (c.hasOwnProperty("pluralLabel")) { newC.pluralLabel = c.pluralLabel; }
      c = newC;
    }

    this._commands.push(c);
  }, {category: ['adding']});

  add.method('addItems', function (items) {
    items.forEach(function(item) { this.addItem(item); }.bind(this));
  }, {category: ['adding']});

  add.method('addAllCommands', function (cmdList) {
    this.addItems(cmdList.commands());
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
