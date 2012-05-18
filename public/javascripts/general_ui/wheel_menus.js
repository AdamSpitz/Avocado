avocado.transporter.module.create('general_ui/wheel_menus', function(requires) {

requires('general_ui/basic_morph_mixins');
requires('general_ui/wheel_layout');

}, function(thisModule) {


thisModule.addSlots(avocado, function(add) {

  add.creator('wheelMenu', {}, {category: ['user interface']});

});


thisModule.addSlots(avocado.wheelMenu, function(add) {

  add.data('maximumNumberOfCommands', 9);

  add.creator('eventHandlerForMenu', {}, {category: ['user interface', 'events']});

  add.creator('eventHandlerForHighlighting', {}, {category: ['user interface', 'events']});

  add.creator('eventHandlerForShowingPartialCommandMorph', {}, {category: ['user interface', 'events']});

  add.creator('eventHandlerForRunningTheCommand', {}, {category: ['user interface', 'events']});

  add.creator('stylistToMatchTextColorWithMenuColor', {}, {category: ['user interface', 'events']});

  add.creator('defaultCommandStyle', {}, {category: ['user interface', 'styles']});

  add.data('keyboardShortcuts', 'swedcxzaq', {category: ['user interface', 'events']});

  add.creator('defaultStyle', {}, {category: ['styles']});

  add.creator('contextCommandStyle', {}, {category: ['styles']});

  add.creator('morphCommandStyle', {}, {category: ['styles']});

  add.creator('modes', {}, {category: ['user interface', 'modes']});

  add.method('createMenuMorph', function (commands, targetMorph) {
		var menuMorph = avocado.ui.newMorph(avocado.ui.shapeFactory.newCircle(pt(0,0), avocado.wheelLayout.outerRadius()));
		menuMorph._commands = commands;
		menuMorph._targetMorph = targetMorph;
		menuMorph._mode = avocado.wheelMenu.modes.transientInactive;
		menuMorph.useWheelLayout();
		menuMorph.applyStyle(this.defaultStyle);
		var targetMorphFill = targetMorph && targetMorph.getFill();
		if (targetMorphFill && targetMorphFill.isVeryLight()) { menuMorph.setFill(this.defaultStyle.fillToUseWhenTargetIsVeryLight); }
		menuMorph.setEventHandler(avocado.wheelMenu.eventHandlerForMenu);
		menuMorph.openIn = function(parentMorph, loc, remainOnScreen, captionIfAny) { avocado.wheelMenu.openMenu(menuMorph, parentMorph, loc, remainOnScreen, captionIfAny); };
    menuMorph.focusHaloBorderWidth = 0;
    menuMorph.morphCommandStyle   = this.morphCommandStyle;
    menuMorph.contextCommandStyle = this.contextCommandStyle;
    menuMorph.commandStyle        = this.contextCommandStyle;
    menuMorph.handlesMouseDown   = function (evt) { return true; };
    menuMorph.takesKeyboardFocus = function (evt) { return true; };
    if (avocado.wheelMenu.morphMixin) { Object.extend(menuMorph, avocado.wheelMenu.morphMixin); }
    return menuMorph;
  }, {category: ['creating']});

  add.method('itemsForCommands', function (commands) {
    return commands.compact();
  }, {category: ['converting']});

  add.method('waitForABitAndThenBecomeActive', function (menuMorph) {
    setTimeout(function() {
      if (menuMorph._mode === this.modes.transientInactive) {
        menuMorph._mode = this.modes.transientActive;
        menuMorph.onMouseMove(Event.createFake());
      }
    }.bind(this), 250);
  }, {category: ['user interface', 'modes']});

  add.method('areCommandsEnabled', function (menuMorph) {
    return ! menuMorph._mode.areCommandsDisabled;
  }, {category: ['user interface', 'running commands']});

  add.method('commandMorphForIndex', function (menuMorph, commandIndex) {
    for (var i = 0, n = menuMorph.submorphs.length; i < n; ++i) {
      var cm = menuMorph.submorphs[i];
      if (cm._commandIndex === commandIndex) { return cm; }
    }
    return null;
  }, {category: ['user interface', 'events']});

  add.method('highlightAppropriateCommandMorphs', function (menuMorph, evt) {
    menuMorph.eachSubmorph(function(cm) {
      if (avocado.wheelMenu.keyboardShortcuts[cm._commandIndex] === menuMorph._mostRecentKeyCharDown || (!menuMorph._mostRecentKeyCharDown && cm.handIsOverMe(evt.hand))) {
        cm.onMouseOver(evt);
      } else {
        cm.onMouseOut(evt);
      }
    });
  }, {category: ['user interface', 'highlighting']});

  add.method('openMenu', function (menuMorph, parentMorph, loc, remainOnScreen, captionIfAny) {
		this.createCommandMorphsIfNecessary(menuMorph);
    menuMorph.rotateToFaceTheCamera();
    menuMorph.setCenterPosition(loc);
    parentMorph.addMorph(menuMorph);
    var hand = parentMorph.world().firstHand();
    menuMorph.takeInputFocus(hand);
    hand.setMouseFocus(menuMorph);
    this.waitForABitAndThenBecomeActive(menuMorph);
    this.startOpeningAnimation(menuMorph);
  }, {category: ['user interface', 'opening']});

  add.method('startOpeningAnimation', function (menuMorph, callWhenDone) {
    var desiredScale = (window.Config && Config.fatFingers ? 1.5 : 1) * (this._normalScale || 1) / menuMorph.world().getScale();
    menuMorph.startTinyAndSmoothlyGrowTo(desiredScale, function() {
      // aaa - Make sure the text is visible. Not sure why this is necessary - why isn't it already visible?
      menuMorph.eachSubmorph(function(cm) { cm.beHighlighted(); cm.beUnhighlighted(); });
      if (callWhenDone) { callWhenDone(); }
    });
  }, {category: ['user interface', 'opening']});

  add.method('startClosingAnimation', function (menuMorph, callback) {
    menuMorph.smoothlyShrinkDownToNothing(function() {
      menuMorph.remove();
      if (callback) { callback(); }
    });
  }, {category: ['user interface', 'closing']});

  add.method('close', function (menuMorph, evt, callback) {
    menuMorph.releaseInputFocus(evt.hand);
    this.startClosingAnimation(menuMorph, callback);
  }, {category: ['user interface', 'closing']});

  add.method('createCommandMorphsIfNecessary', function (menuMorph) {
    if (menuMorph._hasCreatedCommandMorphs) { return; }
    menuMorph._hasCreatedCommandMorphs = true;
    menuMorph.layout().eachPosition(function(p, i) {
		  var c = menuMorph._commands[i];
		  if (c) { menuMorph.addMorphCenteredAt(this.createCommandMorph(menuMorph, c, i), p); }
    }.bind(this));
  }, {category: ['user interface', 'creating']});

  add.method('createCommandMorph', function (menuMorph, command, commandIndex) {
    var commandMorph = avocado.ui.newMorph(menuMorph.layout().createPieceShape(commandIndex));
    commandMorph.setModel(command);
		commandMorph._commandIndex = commandIndex;
		commandMorph._menuMorph = menuMorph;

		commandMorph.setEventHandler(avocado.eventHandlers.composite.create([
		  avocado.wheelMenu.eventHandlerForHighlighting,
		  avocado.wheelMenu.eventHandlerForRunningTheCommand,
		  avocado.wheelMenu.eventHandlerForShowingPartialCommandMorph
		]));
    commandMorph.handlesMouseDown = function (evt) { return true; };

		commandMorph.setStylist(avocado.wheelMenu.stylistToMatchTextColorWithMenuColor);
		commandMorph._labelMorph = avocado.label.create(command.labelString().attemptToInsertALineBreak()).newMorph().fitText();
		var p = menuMorph.layout().centerOfPiece(commandIndex);
		commandMorph.addMorphCenteredAt(commandMorph._labelMorph, p);
		commandMorph.applyStyle(avocado.wheelMenu.defaultCommandStyle);
		commandMorph.applyStyle(menuMorph.commandStyle);
		var targetMorphFill = menuMorph._targetMorph && menuMorph._targetMorph.getFill();
		if (targetMorphFill && targetMorphFill.isVeryLight()) { commandMorph.setFill(avocado.wheelMenu.defaultCommandStyle.fillToUseWhenTargetIsVeryLight); }
		
		return commandMorph;
  }, {category: ['user interface', 'constructing the morph']});

  add.method('runCommand', function (menuMorph, command, evt) {
	  this.close(menuMorph, evt, function() {
  	  command.go(evt);
	  });
  }, {category: ['user interface', 'running commands']});

  add.creator('morphMixin', {}, {category: ['user interface']});

});


thisModule.addSlots(avocado.wheelMenu.eventHandlerForMenu, function(add) {

  add.method('onMouseDown', function (morph, evt) {
    if (morph.handIsOverMe(evt.hand)) {
      var selectedCommandMorph = morph.submorphThatHandIsOver(evt.hand);
      if (selectedCommandMorph) { selectedCommandMorph.onMouseDown(evt); }
    } else {
      avocado.wheelMenu.close(morph, evt);
    }
    return true;
  });

  add.method('onMouseUp', function (morph, evt) {
    var selectedCommandMorph = morph.submorphThatHandIsOver(evt.hand);
    if (selectedCommandMorph) { selectedCommandMorph.onMouseUp(evt); }
    return true;
  });

  add.method('onMouseMove', function (morph, evt) {
    var hand = evt.hand || avocado.ui.currentWorld().firstHand();
    morph.takeInputFocus(hand);
    hand.setMouseFocus(morph);
    avocado.wheelMenu.highlightAppropriateCommandMorphs(morph, evt);
  });

  add.method('onTouchStart', function (morph, evt) {
    return this.onMouseDown(morph, evt);
  });

  add.method('onTouchEnd', function (morph, evt) {
    return this.onMouseUp(morph, evt);
  });

  add.method('onTouchMove', function (morph, evt) {
    return this.onMouseMove(morph, evt);
  });

  add.method('onKeyDown', function (morph, evt) {
    switch (evt.getKeyCode()) {
    	case Event.KEY_ESC: {
        avocado.wheelMenu.close(morph, evt);
        avocado.ui.worldFor(evt).removeAllPartialCommandMorphs();
  			evt.stop();
  			return true;
      }
  	}
  	
  	morph._mostRecentKeyCharDown = evt.getKeyChar().toLowerCase();
    avocado.wheelMenu.highlightAppropriateCommandMorphs(morph, evt);
  	return true;
  });

  add.method('onKeyUp', function (morph, evt) {
  	var keyChar = evt.getKeyChar().toLowerCase();
  	if (keyChar === morph._mostRecentKeyCharDown) {
    	morph._mostRecentKeyCharDown = undefined;
    	var i = avocado.wheelMenu.keyboardShortcuts.indexOf(keyChar);
    	if (i >= 0) {
    	  var cmdMorph = avocado.wheelMenu.commandMorphForIndex(morph, i);
    	  if (cmdMorph) {
          avocado.wheelMenu.runCommand(morph, cmdMorph._model, evt);
          avocado.ui.worldFor(evt).removeAllPartialCommandMorphs();
          evt.stop();
          return true;
    	  }
    	}
  	}
  	
  	return false;
  });

});


thisModule.addSlots(avocado.wheelMenu.eventHandlerForHighlighting, function(add) {

  add.method('isEnabled', function (morph, evt) {
    return avocado.wheelMenu.areCommandsEnabled(morph._menuMorph);
  });

  add.method('onMouseOver', function (morph, evt) {
    morph.beHighlighted();
  });

  add.method('onMouseOut', function (morph, evt) {
    morph.beUnhighlighted();
  });

  add.method('onTouchOver', function (morph, evt) {
    morph.beHighlighted();
  });

  add.method('onTouchOut', function (morph, evt) {
    morph.beUnhighlighted();
  });

  add.method('onTouchEnd', function (morph, evt) {
    morph.beUnhighlighted();
  });

});


thisModule.addSlots(avocado.wheelMenu.eventHandlerForShowingPartialCommandMorph, function(add) {

  add.method('onMouseDown', function (morph, evt) {
    var world = avocado.ui.worldFor(evt);
    var pcm = world._partialCommandMorph;
    if (pcm) {
      if (pcm._model.command() === morph._model) {
        var menuMorph = morph._menuMorph;
        setTimeout(function() {
          pcm.smoothlyFadeTo(1);
          world.grabPartialCommandMorphIfItIsStillThisOne(pcm);
          avocado.wheelMenu.close(menuMorph, evt);
        }, 750);
        return true;
      } else {
        throw new Error("Why is the world's _partialCommandMorph not the one we expected?");
      }
    }
  }, {category: ['events']});

  add.method('onMouseUp', function (morph, evt) {
    var world = avocado.ui.worldFor(evt);
    world.hideWhatWillHappenIfThisCommandRuns(evt, morph);
  }, {category: ['events']});

  add.method('onMouseOver', function (morph, evt) {
    var world = avocado.ui.worldFor(evt);
    world.showWhatWillHappenIfThisCommandRuns(evt, morph);
  }, {category: ['events']});

  add.method('onMouseOut', function (morph, evt) {
    var world = avocado.ui.worldFor(evt);
    world.hideWhatWillHappenIfThisCommandRuns(evt, morph);
  }, {category: ['events']});

});


thisModule.addSlots(avocado.wheelMenu.eventHandlerForRunningTheCommand, function(add) {

  add.method('isEnabled', function (morph, evt) {
    return avocado.wheelMenu.areCommandsEnabled(morph._menuMorph);
  });

  add.method('onMouseUp', function (morph, evt) {
    avocado.wheelMenu.runCommand(morph._menuMorph, morph._model, evt);
  });

  add.method('onTouchEnd', function (morph, evt) {
    return this.onMouseUp(morph, evt);
  });

});


thisModule.addSlots(avocado.wheelMenu.stylistToMatchTextColorWithMenuColor, function(add) {

  add.method('applyStyle', function (morph, spec) {
		if (spec.textColor !== undefined) {
			morph._labelMorph.setTextColor(spec.textColor);
		}
  });

  add.method('adjustStyleSpec', function (morph, spec) {
    spec.textColor = morph._labelMorph.getTextColor();
  });

  add.method('styleWhenHighlighted', function (morph) {
    return {
      fillBase: Color.blue,
      borderWidth: 0,
      borderRadius: 1,
      textColor: Color.white
    };
  }, {category: ['styles']});

});


thisModule.addSlots(avocado.wheelMenu.defaultCommandStyle, function(add) {

  add.data('borderWidth', 0);

  add.data('fill', new Color(1, 1, 1));

  add.data('fillToUseWhenTargetIsVeryLight', new Color(0.75, 0.75, 0.75));

  add.data('fillOpacity', 0.6);

  add.data('openForDragAndDrop', false);

  add.data('suppressHandles', true);

  add.data('textColor', new Color(0, 0, 0));

});


thisModule.addSlots(avocado.wheelMenu.defaultStyle, function(add) {

  add.data('borderWidth', 0);

  add.data('fill', new Color(1, 1, 1));

  add.data('fillToUseWhenTargetIsVeryLight', new Color(0.75, 0.75, 0.75));

  add.data('fillOpacity', 0.4);

  add.data('openForDragAndDrop', false);

  add.data('suppressHandles', true);

});


thisModule.addSlots(avocado.wheelMenu.contextCommandStyle, function(add) {

  add.data('textColor', new Color(0, 0, 0));

});


thisModule.addSlots(avocado.wheelMenu.morphCommandStyle, function(add) {

  add.data('textColor', new Color(0, 0, 0.8));

});


thisModule.addSlots(avocado.wheelMenu.modes, function(add) {

  add.creator('transientInactive', {});

  add.creator('transientActive', {});

  add.creator('semiTransient', {});

  add.creator('nonTransient', {});

});


thisModule.addSlots(avocado.wheelMenu.modes.transientInactive, function(add) {

  add.data('areCommandsDisabled', true);

});


thisModule.addSlots(avocado.wheelMenu.morphMixin, function(add) {

  add.method('keepOnlyItemsNamed', function (nameList) {
    for (var i = 0; i < this._commands.length; ++i) {
      var c = this._commands[i];
      if (c) {
        var n = c.labelString();
        if (nameList.indexOf(n) < 0) {
          this._commands[i] = null;
        }
      }
    }
    return this;
  }, {category: ['compatibility']});

  add.method('removeItemNamed', function (name) {
    for (var i = 0; i < this._commands.length; ++i) {
      var c = this._commands[i];
      if (c) {
        var n = c.labelString();
        if (name === n) {
          this._commands[i] = null;
        }
      }
    }
    return this;
  }, {category: ['compatibility']});

  add.method('addLine', function () {
    // No such thing, just here for compatibility with normal MenuMorphs.;
  }, {category: ['compatibility']});

  add.method('addItem', function (item) {
    if (!item[0] || !item[1]) { return this; }
    var newCmd = avocado.command.create(item[0], item[1]);
    for (var i = 0; i < this._commands.length; ++i) {
      var c = this._commands[i];
      if (! c) {
        this._commands[i] = newCmd;
        return this;
      }
    }
    throw new Error("Cannot add " + item[0] + " to wheel menu; no more room.");
  }, {category: ['compatibility']});

});


thisModule.addSlots(avocado.morphMixins.WorldMorph, function(add) {

  add.method('showPartialCommandMorph', function (pcm) {
    this._partialCommandMorph = pcm;
    pcm.showWithoutAnimationInTopRightCornerOfUsersFieldOfVision(this);
  }, {category: ['commands']});

  add.method('removeAllPartialCommandMorphsExceptFor', function (command) {
    var pcm = this._partialCommandMorph;
    if (pcm && pcm._model.command() === command) {
      pcm.remove();
      delete this._partialCommandMorph;
    }
  }, {category: ['commands']});

  add.method('removeAllPartialCommandMorphs', function () {
    var pcm = this._partialCommandMorph;
    if (pcm) {
      pcm.remove();
      delete this._partialCommandMorph;
    }
  }, {category: ['commands']});

  add.method('grabPartialCommandMorphIfItIsStillThisOne', function (pcm, evt) {
    if (this._partialCommandMorph === pcm && pcm.getOwner() === this) {
      delete this._partialCommandMorph;
      pcm.grabMe(evt);
    }
  }, {category: ['commands']});

  add.method('argumentMorphLabelsFor', function (commandMorph) {
    if (! commandMorph._cachedArgumentMorphLabels) {
      commandMorph._cachedArgumentMorphLabels = (commandMorph._model._argumentSpecsThatWillBeFoundOrPromptedFor || []).map(function(argSpec, i) {
        var tm = avocado.label.create(argSpec.name() || i.toString()).newMorph().ignoreEvents();
        tm._argSpec = argSpec;
        return tm;
      });
    }
    return commandMorph._cachedArgumentMorphLabels;
  }, {category: ['commands', 'feedback']});

  add.method('findArgumentMorphsAndShowLabels', function (argMorphLabels, partialCommand) {
    var context = partialCommand.command().contextOrDefault();
    argMorphLabels.each(function(m, i) {
      var argHolder = partialCommand.argumentHolders()[i];
      var arg = m._argSpec.findArg(context, evt);
      if (arg !== null && typeof(arg) !== 'undefined') {
        if (arg.isMorph) {
          argHolder.setValue(arg);
          var world = arg.world();
          if (world) { m.showAsLabelOnTopOf(arg, world); }
        }
      }
    });
  }, {category: ['commands', 'feedback']});

  add.method('showWhatWillHappenIfThisCommandRuns', function (evt, commandMorph) {
    var pc = commandMorph._model.createPartialCommand();
    this.findArgumentMorphsAndShowLabels(this.argumentMorphLabelsFor(commandMorph), pc);
    var world = avocado.ui.worldFor(evt);
    world.removeAllPartialCommandMorphs();
    world.showPartialCommandMorph(world.morphFor(pc).setFillOpacity(0.5));
  }, {category: ['commands', 'feedback']});

  add.method('hideWhatWillHappenIfThisCommandRuns', function (evt, commandMorph) {
    this.argumentMorphLabelsFor(commandMorph).each(function(m) { m.remove(); });
    avocado.ui.worldFor(evt).removeAllPartialCommandMorphsExceptFor(commandMorph._model);
  }, {category: ['commands', 'feedback']});

});


});
