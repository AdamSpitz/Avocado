transporter.module.create('lk_ext/commands', function(requires) {

requires('core/commands');
requires('lk_ext/wheel_menus');

}, function(thisModule) {


thisModule.addSlots(avocado.command, function(add) {

  add.method('newMorph', function (optionalLabelMorph) {
    var m = ButtonMorph.createButton(optionalLabelMorph || this.label, this.go.bind(this), 2);
    
    var ht = this.helpText();
    if (typeof(ht) === 'function') {
      m.getHelpText = ht;
    } else if (typeof(ht) === 'string') {
      m.setHelpText(ht);
    }
    
    var af = this.applicabilityFunction();
    if (af) {
      m = Morph.createOptionalMorph(m, af);
      m.refreshContent();
    }
    
    return m;
  }, {category: ['user interface']});

  add.method('wrapForMorph', function (morph) {
    var c = Object.create(this);
    
    if (this._argumentSpecs) {
      c.setArgumentSpecs(this._argumentSpecs.map(function(spec) { return spec.wrapForMorph(morph); }))
    }
    
    var oldFunctionToRun = c.functionToRun();
    c.setFunction(function() {
      var rcvr = c.contextOrDefault();
      var args = $A(arguments);
      // first arg is the event
      var result = oldFunctionToRun.apply(rcvr, args.map(function(o, i) { return i === 0 ? o : o._model; }));
      args.each(function(arg) { if (arg._shouldDisappearAfterCommandIsFinished) { arg.remove(); }});
      return result;
    });

    return c;
  }, {category: ['user interface']});

});


thisModule.addSlots(avocado.command.argumentSpec, function(add) {

  add.method('wrapForMorph', function (morph) {
    var argSpecForModelCommand = this;
    var argSpecForMorphCommand = avocado.command.argumentSpec.create(this._name);
    
    argSpecForMorphCommand.onlyAccepts(function(arg) {
      return (typeof(arg) === 'object') &&
             (! arg._shouldOnlyBeDroppedOnThisParticularMorph ||
                arg._shouldOnlyBeDroppedOnThisParticularMorph === morph) &&
             argSpecForModelCommand.canAccept(arg._model);
    });
    
    argSpecForMorphCommand.setPrompter({
      prompt: function(caption, context, evt, callback) {
        argSpecForModelCommand.prompter().prompt(caption, context, evt, function(arg) { callback({ _model: arg }); });
      }
    });
    
    return argSpecForMorphCommand;
  }, {category: ['user interface']});

});


thisModule.addSlots(avocado.command.list, function(add) {

  add.method('wrapForMorph', function (morph) {
    return avocado.command.list.create(this._defaultContext, this._commands.map(function(c) { return c ? c.wrapForMorph(morph) : null; }));
  }, {category: ['user interface']});

  add.data('shouldUseWheelMenus', false);

  add.method('createMenu', function (target, menuClass) {
    menuClass = menuClass || (this.shouldUseWheelMenus ? avocado.WheelMenuMorph : MenuMorph);
    var commands = this.commandsForMenu(menu, target);
    var menuItems = menuClass.itemsForCommands(commands);
    if (menuClass === avocado.WheelMenuMorph && menuItems.length > 9) {
      // Can't have a wheel menu with more than 9 commands.
      return this.createMenu(target, MenuMorph);
    }
    var menu = new menuClass(menuItems, target);
    return menu;
  }, {category: ['converting']});

  add.method('itemsFor', function (menu, target) {
  }, {category: ['converting']});

  add.method('commandsForMenu', function (menu, target, f) {
    var commands = [];
    var i = 0;
    var n = this._commands.length;
    this._commands.each(function(c) {
      if (c) {
        c = c.wrapWithPromptersForArguments();
        
        if (typeof(c.isApplicable) !== 'function' || c.isApplicable()) {
          commands.push(c);
        }
      } else {
        if (i !== n - 1) { // no point if it's the last one
          commands.push(c);
        }
      }
      i += 1;
    }.bind(this));
    return commands;
  }, {category: ['converting']});

});


thisModule.addSlots(MenuMorph, function(add) {

  add.method('itemsForCommands', function (commands) {
    return commands.map(function(c) {
      if (!c) {
        return null;
      } else if (c instanceof Array) {
        return c;
      } else if (c.subcommands()) {
        return [c.labelString(), MenuMorph.itemsForCommands(c.subcommands())];
      } else {
        return [c.labelString(), function() { c.go.apply(c, arguments); }];
      }
    });
  }, {category: ['converting']});

});


thisModule.addSlots(avocado.WheelMenuMorph, function(add) {

  add.method('itemsForCommands', function (commands) {
    return commands.compact();
  }, {category: ['converting']});

});


thisModule.addSlots(Morph.prototype, function(add) {

  add.method('eachAssociatedObject', function (f) {
    // Children can override.
    if (typeof(this._model) !== 'undefined') { f(this._model); }
  }, {category: ['associated objects']});

  add.method('associatedObjectSatisfying', function (criterion) {
    return exitValueOf(function(exit) {
      this.eachAssociatedObject(function(o) {
        if (!criterion || criterion(o)) { exit(o); }
      });
      return null;
    }.bind(this));
  }, {category: ['associated objects']});

});


});
