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
    morphCommand.setFunction(function() {
      var rcvr = modelCommand.contextOrDefault();
      var args = $A(arguments);
      // first arg is the event
      var result = modelCommand.functionToRun().apply(rcvr, args.map(function(o, i) { return i === 0 ? o : o._model; }));
      args.each(function(arg, i) {
        if (i > 0) {
          if ((arg.owner instanceof HandMorph || arg.owner instanceof avocado.CarryingHandMorph) && arg._placeholderMorphIJustCameFrom && arg._placeholderMorphIJustCameFrom.world()) {
            var hand = arg.owner;
            arg._placeholderMorphIJustCameFrom.putOriginalMorphBack(function() {
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
          var morphAndRelatedMorphs = typeof(morph.relatedMorphs) === 'function' ? [morph].concat(morph.relatedMorphs()) : [morph];
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
    return new menuClass(menuItems, target);
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
