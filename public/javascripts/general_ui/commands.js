avocado.transporter.module.create('general_ui/commands', function(requires) {

requires('core/commands');
requires('general_ui/basic_morph_mixins');

}, function(thisModule) {


thisModule.addSlots(avocado.command, function(add) {

  add.method('wrapForMorph', function (morph) {
    var modelCommand = this;
    
    var morphCommand = Object.create(modelCommand);
    morphCommand.setContext(morph); // aaa - not sure this won't break stuff
    
    if (modelCommand._argumentSpecs) {
      morphCommand.setArgumentSpecs(modelCommand._argumentSpecs.map(function(spec) { return spec.wrapForMorph(morph); }))
    }
    
    var oldFunctionToRun = modelCommand.functionToRun();
    if (oldFunctionToRun) {
      morphCommand.setFunction(function() {
        var rcvr = modelCommand.contextOrDefault();
        var args = $A(arguments);
        // first arg is the event
        var result = modelCommand.functionToRun().apply(rcvr, args.map(function(o, i) { return i === 0 ? o : o._model; }));
        args.each(function(arg, i) {
          if (i > 0) {
            if ((arg.getOwner() instanceof HandMorph || arg.getOwner() instanceof avocado.CarryingHandMorph) && arg._placeholderMorphIJustCameFrom && arg._placeholderMorphIJustCameFrom.world()) {
              var hand = arg.getOwner();
              arg._placeholderMorphIJustCameFrom.layout().putOriginalMorphBack(function() {
                if (typeof(hand.hideIfEmpty) === 'function') { hand.hideIfEmpty(); }
              });
            } else if (arg._shouldDisappearAfterCommandIsFinished) {
              arg.remove();
            } else {
              // I guess just leave it there.
            }
          }
        });
        return result;
      });
    }

    return morphCommand;
  }, {category: ['user interface']});

  add.method('immediateContents', function () {
    return this.argumentSpecs();
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
    
    var modelPrompter = argSpecForModelCommand.prompter();
    if (modelPrompter) {
      argSpecForMorphCommand.setPrompter({
        prompt: function(caption, context, evt, callback) {
          modelPrompter.prompt(caption, context._model, evt, function(arg) { callback({ _model: arg }); });
        }
      });
    }
    
    argSpecForMorphCommand.useMorphicContextualArgFinder();
    
    return argSpecForMorphCommand;
  }, {category: ['user interface']});

  add.method('useMorphicContextualArgFinder', function () {
    var thisArgSpec = this;
    return this.setArgFinder(function(context, evt) {
      var tryMorphs = function(availableMorphs) {
        var possibleArgMorphs = [];
        availableMorphs.forEach(function(morph) {
          var morphAndRelatedMorphs = [morph];
          if (morph.layout() && typeof(morph.layout().relatedMorphs) === 'function') {
            morphAndRelatedMorphs = morphAndRelatedMorphs.concat(morph.layout().relatedMorphs());
          }
          morphAndRelatedMorphs.forEach(function(morphOrRelatedMorph) {
            if (thisArgSpec.canAccept(morphOrRelatedMorph)) {
              // console.log("Found an argument: " + morphOrRelatedMorph);
              possibleArgMorphs.push(morphOrRelatedMorph);
            } else {
              // console.log("Can't use as argument: " + morphOrRelatedMorph);
            }
          });
        });
        return possibleArgMorphs;
      };
      
      var world = evt.hand.world();
      var contextsInOrderFromMostToLeastRelevant = [
        evt.hand.submorphs,
        avocado.CarryingHandMorph.forWorld(world).submorphs,
        avocado.compositeCollection.create([context.ownersRecursively(), context.submorphsRecursively()]),
        avocado.compositeCollection.create([world.submorphsRecursively()])   // I hope this isn't too slow. Or too unintuitive.
      ];
      
      for (var i = 0; i < contextsInOrderFromMostToLeastRelevant.length; ++i) {
        var possibleArgMorphs = tryMorphs(contextsInOrderFromMostToLeastRelevant[i]);
        if (possibleArgMorphs.length === 1) {
          return possibleArgMorphs[0];
        } else if (possibleArgMorphs.length > 1) {
          return undefined;
        }
      }
      
      return undefined;
    });
  }, {category: ['user interface']});

});


thisModule.addSlots(avocado.command.list, function(add) {

  add.method('wrapForMorph', function (morph) {
    return avocado.command.list.create(morph, this._commands.map(function(c) { return c ? c.wrapForMorph(morph) : null; }));
  }, {category: ['user interface']});

  add.method('createMenu', function (target, menuClass) {
    menuClass = menuClass || this.defaultMenuClass();
    var commands = this.commandsForMenu(target);
    var menuItems = menuClass.itemsForCommands(commands);
    if (typeof(menuClass.maximumNumberOfCommands) === 'number' && menuItems.length > menuClass.maximumNumberOfCommands) {
      // Can't have a wheel menu with more than 9 commands.
      return this.createMenu(target, this.menuClassThatCanHandleAnUnlimitedNumberOfItems());
    }
    return menuClass.createMenuMorph(menuItems, target);
  }, {category: ['converting']});

  add.method('commandsForMenu', function (target) {
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


thisModule.addSlots(avocado.morphMixins.Morph, function(add) {

  add.method('eachAssociatedObject', function (f) {
    // Children can override.
    var model = this._model;
    if (typeof(model) !== 'undefined') {
      f(model);
      if (model !== null && typeof(model.eachAssociatedObject) === 'function') {
        model.eachAssociatedObject(f);
      }
    }
  }, {category: ['associated objects']});

  add.method('associatedObjectSatisfying', function (criterion) {
    return exitValueOf(function(exit) {
      this.eachAssociatedObject(function(o) {
        if (!criterion || criterion(o)) { exit(o); }
      });
      return null;
    }.bind(this));
  }, {category: ['associated objects']});

  add.method('addModelSpecificUICommandsTo', function (cmdList) {
    if (this._model && typeof(this._model.addUICommandsTo) === 'function') {
      this._model.addUICommandsTo(cmdList);
    }
  }, {category: ['commands']});

  add.method('dragAndDropCommands', function () {
    if (this._model) {
      var cmdList = avocado.command.list.create(this);

      if (typeof(this._model.dragAndDropCommands) === 'function') {
        var modelCmdList = this._model.dragAndDropCommands();
        if (modelCmdList) { cmdList.addAllCommands(modelCmdList.wrapForMorph(this)); }
      }
      
      this.addArrowDroppingCommandTo(cmdList);
      
      return cmdList;
    } else {
      return null;
    }
  }, {category: ['commands']});

  add.method('addArrowDroppingCommandTo', function (cmdList) {
    cmdList.addItem(avocado.command.create("make arrow point to me", function(evt, arrowEndpoint) {
      arrowEndpoint.wasJustDroppedOn(this);
    }, this).setArgumentSpecs([avocado.command.argumentSpec.create('arrowEndpoint').onlyAccepts(function(m) {
      if (!m.isArrowEndpoint) { return false; }
      return avocado.types.checkToSeeIfTypeMatches(m._layout._association.arrowTargetType(), this._model);
    }.bind(this))]));
  }, {category: ['commands']});

});


thisModule.addSlots(avocado.morphMixins.MorphOrWorld, function(add) {

  add.method('isMorphMenuEnabled', function () {
    var b = false;
    avocado.ui.currentWorld().applicationList().applications().each(function(app) { if (app.isMorphMenuEnabled) { b = true; }; });
    return b;
  }, {category: ['menus']});

  add.method('showMorphMenu', function (evt) {
    // Disable the reflective stuff in deployed apps. -- Adam
    if (!this.isMorphMenuEnabled()) { return false; }

    var menu = this.morphMenu(evt);
    var world = this.world();
    menu.openIn(world, world.worldPointCorrespondingToScreenPoint(evt.point(), 100), false, (Object.inspect(this) || "").truncate()); // added || "" -- Adam
    return true;
  }, {category: ['menus']});

  add.method('showContextMenu', function (evt) {
    var menu = this.contextMenu(evt);
    if (!menu) { return false; }
    
    // should be a clear difference between a morph menu and a context menu
    var baseColor = Color.black;
    if (menu.listStyle) {
      menu.listStyle = Object.create(menu.listStyle);
      menu.listStyle.borderColor = baseColor;
      menu.listStyle.fill        = baseColor.lighter(5);
    }
    if (menu.textStyle) {
      menu.textStyle = Object.create(menu.textStyle);
      menu.textStyle.textColor   = baseColor;
    }
    
    var world = this.world();
    menu.openIn(world, world.worldPointCorrespondingToScreenPoint(evt.point(), 100), false, (Object.inspect(this) || "").truncate()); // added || "" -- Adam
    return true;
  }, {category: ['menus']});

  add.method('contextMenu', function (evt) {
    var cs = this.commands();
    if (!cs || cs.size() === 0) { return null; }
    return cs.createMenu(this);
  }, {category: ['menus']});

  add.method('commands', function () {
    var cmdList;
    if (this._model && typeof(this._model.commands) === 'function') {
      var modelCommands = this._model.commands();
      if (modelCommands) { cmdList = modelCommands.wrapForMorph(this); }
    }
    if (!cmdList) { cmdList = avocado.command.list.create(); }
    
    this.addTitleEditingCommandsTo(cmdList);
    this.addModelSpecificUICommandsTo(cmdList);
    return cmdList;
  }, {category: ['menus']});

  add.method('addExtraMorphMenuItemsTo', function (cmdList) {
    // children can override
    
    if (this.layout() && typeof(this.layout().addExtraMorphMenuItemsTo) === 'function') {
      this.layout().addExtraMorphMenuItemsTo(cmdList);
    }
  }, {category: ['menus']});

  add.method('morphMenu', function (evt) {
    var cmdList = avocado.command.list.create(this);
    
    if (this._placeholderMorphIJustCameFrom) {
      cmdList.addItem(avocado.command.create("put back", function() { this._placeholderMorphIJustCameFrom.layout().putOriginalMorphBack(); }));
    } else if (this.shouldBeEasilyGrabbable()) {
      cmdList.addItem(avocado.command.create("grab and pull", function() { this.grabAndPullMe(evt); }));
    } else {
      cmdList.addItem(avocado.command.create("", function() {}));
    }
    
    cmdList.addItem(avocado.command.create("remove", function() { this.startWhooshingOuttaHere(); }));
    
    var disablePickUpAndDropExperiment = true;
    if (disablePickUpAndDropExperiment) {
      cmdList.addItem(avocado.command.create("grab", function() { this.pickMeUpLeavingPlaceholderIfNecessary(evt); }));
    } else {
      var carryingHand = avocado.CarryingHandMorph.forWorld(this.world());
      var dropCmd = carryingHand.applicableCommandForDroppingOn(this);
      var handEmpty = !carryingHand.carriedMorph();
      if (dropCmd) {
        cmdList.addItem(avocado.command.create("drop", function() { carryingHand.dropOn(this, evt); }));
      } else if (handEmpty) {
        cmdList.addItem(avocado.command.create("pick up", function() { carryingHand.pickUp(this, evt); }));
      } else {
        cmdList.addItem(null);
      }
    }
    
    cmdList.addItem(avocado.command.create("zoom to me", function(evt) { this.navigateToMe(evt); }));
    
    // aaa not really usable yet -- Adam: cmdList.addItem(["tagging...", this.taggingCommands()]);
    
    this.addExtraMorphMenuItemsTo(cmdList);
    
    // aaa - Not really sure what to do with this stuff, but if we leave it in the UI, users end up thinking
    // that the morph menu is for scary stuff that they shouldn't touch.
    if (avocado.isReflectionEnabled) {
      cmdList.addItem(this.okToDuplicate() ? avocado.command.create("duplicate", function(evt) { this.copyToHand(evt.hand); }) : null);
    
      cmdList.addItem(this.isInEditMode() ? avocado.command.create("turn off edit mode", function() { this.switchEditModeOff(); })
                                          : avocado.command.create("turn on edit mode" , function() { this.switchEditModeOn (); }));
      cmdList.addItem(avocado.command.create("inspect...", [
         this._model ? ["object", function(evt) { this.world().morphFor(reflect(this._model)).grabMe(evt); }] : ["", function() {}],
                       ["morph",  function(evt) { this.world().morphFor(reflect(this       )).grabMe(evt); }],
      ]));
      cmdList.addItem(avocado.command.create("script me", function(evt) {
        var mir = reflect(avocado.morphScripter.create(this));
        var mirMorph = this.world().morphFor(mir);
        mirMorph.openEvaluator(evt);
        mirMorph.grabMe(evt);
      })); // simple scripting interface -- Adam

      cmdList.addLine();
      cmdList.addItems(this.subMenuItems(evt));
    }
    
    cmdList.addItem(avocado.command.create("edit style", function() { new StylePanel(this).open(); }));
    
    var menu = cmdList.createMenu(this);
		menu.commandStyle = menu.morphCommandStyle;
    return menu;
  }, {category: ['menus']});

});


});
