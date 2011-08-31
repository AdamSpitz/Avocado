avocado.transporter.module.create('core/commands', function(requires) {

}, function(thisModule) {


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

  add.method('initialize', function (label, runFnOrSubcmds, optionalContext) {
    this.setLabel(label);
    if (typeof(runFnOrSubcmds) === 'function') {
      this.setFunction(runFnOrSubcmds);
    } else if (reflect(runFnOrSubcmds).isReflecteeArray()) {
      this.setSubcommands(runFnOrSubcmds);
    } else {
      throw new Error("Trying to make a command, but don't know what this is: " + runFnOrSubcmds);
    }
    if (typeof(optionalContext) !== undefined) { this.setContext(optionalContext); }
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

  add.method('labelString', function () {
    return typeof(this.label) === 'function' ? this.label(target) : this.label;
  }, {category: ['accessing']});

  add.method('setID', function (id) {
    this.id = id;
    return this;
  }, {category: ['accessing']});

  add.method('contextOrDefault', function () {
    if (! this.hasContext()) { return {}; }
    return this._context;
  }, {category: ['accessing']});

  add.method('hasContext', function () {
    return typeof(this._context) !== 'undefined';
  }, {category: ['accessing']});

  add.method('setContext', function (context) {
    this._context = context;
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

  add.method('isApplicable', function () {
    return !this._applicabilityFunction || this._applicabilityFunction.call(this.contextOrDefault());
  }, {category: ['accessing']});

  add.method('argumentSpecs', function () {
    return this._argumentSpecs;
  }, {category: ['arguments']});

  add.method('setArgumentSpecs', function (specs) {
    this._argumentSpecs = specs;
    return this;
  }, {category: ['arguments']});

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
  }, {category: ['arguments']});

  add.method('go', function () {
    var f = this.functionToRun();
    var rcvr = this.contextOrDefault();
    if (f) {
      return f.apply(rcvr, $A(arguments));
    } else {
      var subcmds = this.subcommands();
      if (!subcmds) { throw new Error("What kind of command is this, with no functionToRun and no subcommands?"); }
      var subcmdList = avocado.command.list.create(rcvr, subcmds);
      avocado.ui.showMenu(subcmdList);
    }
  }, {category: ['running']});

  add.method('wrapWithPromptersForArguments', function () {
    var argSpecs = this._argumentSpecs;
    if (! argSpecs || argSpecs.size() === 0) { return this; }
    
    var c = Object.create(this);
    
    if (typeof(this.label) === 'string' && ! this.label.endsWith("...")) { this.setLabel(this.label + "..."); }
    
    c.setArgumentSpecs([]);
    
    var oldFunctionToRun = c.functionToRun();
    c.setFunction(function(evt) {
      var rcvr = c.contextOrDefault();
      var args = [evt];
      var promptForArg = function(i) {
        if (i >= argSpecs.length) { return oldFunctionToRun.apply(rcvr, args); }
        
        var argSpec = argSpecs[i];
        
        argSpec.findArgOrPrompt(rcvr, evt, function(arg) {
          args.push(arg);
          promptForArg(i + 1);
        });
      };
      promptForArg(0);
    });

    return c;
  }, {category: ['prompting for arguments']});

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
  }, {category: ['filtering']});

  add.method('onlyAcceptsType', function (t) {
    this._type = t;
    this.onlyAccepts(function(o) { return t.doesTypeMatch(o); });
    return this;
  }, {category: ['filtering']});

  add.method('setPrompter', function (p) {
    this._prompter = p;
    return this;
  }, {category: ['prompting']});

  add.method('setArgFinder', function (f) {
    this._argFinder = f;
    return this;
  }, {category: ['prompting']});

  add.method('canAccept', function (arg) {
    if (! this._acceptanceFunction) { return true; }
    return this._acceptanceFunction(arg);
  }, {category: ['testing']});

  add.method('prompter', function () {
    var p = this._prompter;
    if (p) { return p; }
    var t = this._type;
    if (t) {
      if (typeof(t.prompter) === 'function') { return t.prompter(); }
      if (typeof(t.prompter) === 'object'  ) { return t.prompter;   }
    }
    return null;
  }, {category: ['prompting']});

  add.method('prompt', function (context, evt, callback) {
    var p = this.prompter();
    if (!p) { throw new Error('Cannot prompt for the "' + this._name + '" argument without a prompter'); }
    return p.prompt(this._name, context, evt, callback);
  }, {category: ['prompting']});
  
  add.method('findArgOrPrompt', function (context, evt, callback) {
    var arg = this.findArg(context, evt, callback);
    if (typeof(arg) !== 'undefined') {
      callback(arg);
    } else {
      this.prompt(context, evt, callback);
    }
  }, {category: ['prompting']});
  
  add.method('findArg', function (context, evt) {
    if (this._argFinder) {
      return this._argFinder(context, evt);
    } else {
      return undefined;
    }
  }, {category: ['prompting']});

});


thisModule.addSlots(avocado.command.list, function(add) {

  add.method('create', function (optionalDefaultContext, optionalCommands) {
    return Object.newChildOf(this, optionalDefaultContext, optionalCommands);
  }, {category: ['creating']});

  add.method('initialize', function (optionalDefaultContext, optionalCommands) {
    this._defaultContext = optionalDefaultContext;
    this._commands = [];
    if (optionalCommands) { this.addItems(optionalCommands); }
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

  add.method('hasDefaultContext', function () {
    return typeof(this._defaultContext) !== 'undefined';
  });

  add.method('addItem', function (c) {
    // for compatibility with MenuMorph
    if (reflect(c).isReflecteeArray()) {
      c = avocado.command.create(c[0], c[1]);
    } else if (c && !c.isCommand) {
      // aaa - maybe just create the commands in the caller, don't do this translation thing
      var newC = avocado.command.create(c.label, c.go);
      if (c.hasOwnProperty("id")) { newC.setID(c.id); }
      if (c.hasOwnProperty("isApplicable")) { newC.onlyApplicableIf(c.isApplicable); }
      if (c.hasOwnProperty("pluralGo")) { newC.pluralGo = c.pluralGo; }
      if (c.hasOwnProperty("pluralLabel")) { newC.pluralLabel = c.pluralLabel; }
      c = newC;
    }

    this.ifNecessaryPassOnDefaultContextTo(c);
    
    this._commands.push(c);
  }, {category: ['adding']});

  add.method('ifNecessaryPassOnDefaultContextTo', function (c) {
    if (c && !c.hasContext() && this.hasDefaultContext()) {
      c.setContext(this._defaultContext);
    }
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

  add.method('typeNameOfMorph', function (m) {
    if (typeof(m.typeName) === 'string') { return m.typeName; }
    if (typeof(m.typeName) === 'function') { return m.typeName(); }
    var type = m['__proto__'];
    if (window.reflect) { return reflect(type).name(); }
    return 'morph';
  }, {category: ['groups of objects']});

  add.method('descriptionOfGroup', function (commandBearers) {
    if (!commandBearers || commandBearers.length === 0) { return "nothing here"; }
    
    var byTypeName = avocado.dictionary.copyRemoveAll();
    commandBearers.each(function(m) {
      byTypeName.getOrIfAbsentPut(this.typeNameOfMorph(m), function() {return [];}).push(m);
    }.bind(this));

    var buf = avocado.stringBuffer.create();
    var sep = "";
    byTypeName.eachKeyAndValue(function(typeName, ms) {
      buf.append(sep).append(ms.length.toString()).append(" ").append(typeName).append(ms.length === 1 ? "" : "s");
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
          if (c.pluralLabel && c.isApplicable()) {
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

  add.method('wrapWithPromptersForArguments', function () {
    return avocado.command.list.create(this._defaultContext, this._commands.map(function(c) { return c ? c.wrapWithPromptersForArguments() : null; }));
  }, {category: ['prompting for arguments']});

});


thisModule.addSlots(String, function(add) {
  
  add.creator('prompter', {}, {category: ['prompting']});
  
});


thisModule.addSlots(String.prompter, function(add) {

  add.method('prompt', function (caption, context, evt, callback) {
    WorldMorph.current().prompt(caption, function(s) {
      if (s) {
        callback(s);
      }
    }, '');
  }, {category: ['prompting']});

});


});
