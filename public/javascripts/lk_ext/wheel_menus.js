avocado.transporter.module.create('lk_ext/wheel_menus', function(requires) {

}, function(thisModule) {


thisModule.addSlots(avocado, function(add) {

  add.method('WheelMenuMorph', function WheelMenuMorph() { Class.initializer.apply(this, arguments); }, {category: ['user interface']});

});


thisModule.addSlots(avocado.WheelMenuMorph, function(add) {

  add.data('superclass', Morph);

  add.data('type', 'avocado.WheelMenuMorph');

  add.creator('prototype', Object.create(Morph.prototype));

});


thisModule.addSlots(avocado.WheelMenuMorph.prototype, function(add) {

  add.data('constructor', avocado.WheelMenuMorph);

  add.method('initialize', function ($super, commands, targetMorph) {
		this._commands = commands;
		this._targetMorph = targetMorph;
		this._innerRadius = 30;
		this._outerRadius = 100;
		this._mode = this.modes.transientInactive;
		$super(new lively.scene.Ellipse(pt(0,0), this._outerRadius));
		this.applyStyle(this.defaultStyle);
  }, {category: ['creating']});

  add.method('commandArray', function () {
    return this._commands;
  }, {category: ['accessing']});

  add.method('createCommandMorphsIfNecessary', function () {
    if (this._hasCreatedCommandMorphs) { return; }
    this._hasCreatedCommandMorphs = true;
		var r = (this._innerRadius + this._outerRadius) * 0.575;
		for (var i = 0; i <= 8; ++i) {
		  var c = this._commands[i];
		  if (c) {
		    var p = this.centerPoint();
		    if (i !== 0) {
  		    var theta = ((i - 3) / 8) * (2 * Math.PI);
		      p = p.addPt(Point.polar(r * ((i % 2 === 0) ? 1 : 0.84), theta));
		    }
        this.addCommandMorphFor(i, p);
      }
		}
  }, {category: ['creating']});

  add.creator('defaultStyle', {}, {category: ['styles']});

  add.creator('contextCommandStyle', {}, {category: ['styles']});

  add.creator('morphCommandStyle', {}, {category: ['styles']});

  add.data('commandStyle', avocado.WheelMenuMorph.prototype.contextCommandStyle, {category: ['styles']});

  add.data('focusHaloBorderWidth', 0, {category: ['styles']});

  add.creator('modes', {}, {category: ['modes']});

  add.method('CommandMorph', function CommandMorph() { Class.initializer.apply(this, arguments); }, {category: ['commands']});

  add.method('waitForABitAndThenBecomeActive', function () {
    setTimeout(function() {
      if (this._mode === this.modes.transientInactive) {
        this._mode = this.modes.transientActive;
        this.onMouseMove(Event.createFake());
      }
    }.bind(this), 250);
  }, {category: ['modes']});

  add.method('areCommandsEnabled', function () {
    return ! this._mode.areCommandsDisabled;
  }, {category: ['running commands']});

  add.method('commandMorphThatHandIsOver', function (hand) {
    for (var i = 0, n = this.submorphs.length; i < n; ++i) {
      var cm = this.submorphs[i];
      if (cm.handIsOverMe(hand)) { return cm; }
    }
    return null;
  }, {category: ['events']});

  add.method('commandMorphForIndex', function (commandIndex) {
    for (var i = 0, n = this.submorphs.length; i < n; ++i) {
      var cm = this.submorphs[i];
      if (cm.commandIndex() === commandIndex) { return cm; }
    }
    return null;
  }, {category: ['events']});

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
  }, {category: ['filtering']});

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
  }, {category: ['filtering']});
  
  add.method('addLine', function () {
    // No such thing, just here for compatibility with normal MenuMorphs.
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

  add.method('handlesMouseDown', function (evt) {
    return true;
  }, {category: ['events']});

  add.method('takesKeyboardFocus', function (evt) {
    return true;
  }, {category: ['events']});

  add.method('onMouseDown', function (evt) {
    if (! this.handIsOverMe(evt.hand)) {
      this.close(evt);
    }
  }, {category: ['events']});

  add.method('onMouseUp', function (evt) {
    var selectedCommandMorph = this.commandMorphThatHandIsOver(evt.hand);
    if (selectedCommandMorph) { selectedCommandMorph.onMouseUp(evt); }
  }, {category: ['events']});

  add.method('onMouseMove', function (evt) {
    this.takeMouseAndKeyboardFocus(evt.hand);
    this.highlightAppropriateCommandMorphs(evt);
  }, {category: ['events']});

  add.method('highlightAppropriateCommandMorphs', function (evt) {
    this.submorphs.each(function(cm) {
      if (cm.keyboardShortcut() === this._mostRecentKeyCharDown || (!this._mostRecentKeyCharDown && cm.handIsOverMe(evt.hand))) {
        cm.onMouseOver(evt);
      } else {
        cm.onMouseOut(evt);
      }
    }.bind(this));
  });

  add.data('keyboardShortcuts', 'swedcxzaq', {category: ['events']});

  add.method('onKeyDown', function (evt) {
    switch (evt.getKeyCode()) {
    	case Event.KEY_ESC: {
  			this.close(evt);
  			evt.stop();
  			return true;
      }
  	}
  	
  	this._mostRecentKeyCharDown = evt.getKeyChar().toLowerCase();
  	this.highlightAppropriateCommandMorphs(evt);
  	return true;
  }, {category: ['events']});

  add.method('onKeyUp', function (evt) {
  	var keyChar = evt.getKeyChar().toLowerCase();
  	if (keyChar === this._mostRecentKeyCharDown) {
    	this._mostRecentKeyCharDown = undefined;
    	var i = this.keyboardShortcuts.indexOf(keyChar);
    	if (i >= 0) {
    	  var cmdMorph = this.commandMorphForIndex(i);
    	  if (cmdMorph) {
          this.runCommand(cmdMorph.command(), evt);
          evt.stop();
          return true;
    	  }
    	}
  	}
  	
  	return false;
  }, {category: ['events']});

  add.method('takeMouseAndKeyboardFocus', function (hand) {
    hand.setMouseFocus(this);
    hand.setKeyboardFocus(this);
  }, {category: ['events']});

  add.method('releaseMouseAndKeyboardFocus', function (hand) {
    hand.setMouseFocus(null);
    hand.setKeyboardFocus(null);
  }, {category: ['events']});

  add.method('openIn', function (parentMorph, loc, remainOnScreen, captionIfAny) {
		this.createCommandMorphsIfNecessary();
    parentMorph.addMorphAt(this, loc.addXY(- this._outerRadius, - this._outerRadius));
    this.takeMouseAndKeyboardFocus(parentMorph.world().firstHand());
    this.waitForABitAndThenBecomeActive();
    this.startOpeningAnimation();
  }, {category: ['opening']});

  add.method('startOpeningAnimation', function (callWhenDone) {
    var desiredScale = (Config.fatFingers ? 1.5 : 1) / this.world().getScale();
    this.setScale(desiredScale * 0.01);
    this.smoothlyScaleTo(desiredScale, function() {
      // aaa - Make sure the text is visible. Not sure why this is necessary - why isn't it already visible?
      this.submorphs.forEach(function(cm) { cm.beHighlighted(); cm.beUnhighlighted(); });
      if (callWhenDone) { callWhenDone(); }
    }.bind(this));
  }, {category: ['opening']});

  add.method('startClosingAnimation', function (callback) {
    this.smoothlyScaleTo(0.01, function() {
      this.remove();
      if (callback) { callback(); }
    }.bind(this));
  }, {category: ['closing']});

  add.method('close', function (evt, callback) {
    this.releaseMouseAndKeyboardFocus(evt.hand);
    this.startClosingAnimation(callback);
  }, {category: ['closing']});

  add.method('centerPoint', function () {
    return pt(0,0); // pt(this._outerRadius, this._outerRadius);
  }, {category: ['constructing the morph']});

  add.method('addCommandMorphFor', function (i, p) {
    var m = new this.CommandMorph(this, i);
    this.addMorphAt(m, p.subPt(m.getExtent().scaleBy(0.5)));
  }, {category: ['constructing the morph']});

  add.method('runCommand', function (c, evt) {
	  this.close(evt, function() {
  	  c.go(evt);
	  });
  }, {category: ['running commands']});

});


thisModule.addSlots(avocado.WheelMenuMorph.prototype.modes, function(add) {

  add.creator('transientInactive', {});

  add.creator('transientActive', {});

  add.creator('semiTransient', {});

  add.creator('nonTransient', {});

});


thisModule.addSlots(avocado.WheelMenuMorph.prototype.modes.transientInactive, function(add) {

  add.data('areCommandsDisabled', true);

});


thisModule.addSlots(avocado.WheelMenuMorph.prototype.CommandMorph, function(add) {

  add.data('superclass', Morph);

  add.data('type', 'avocado.WheelMenuMorph.prototype.CommandMorph');

  add.creator('prototype', Object.create(Morph.prototype));

});


thisModule.addSlots(avocado.WheelMenuMorph.prototype.CommandMorph.prototype, function(add) {

  add.data('constructor', avocado.WheelMenuMorph.prototype.CommandMorph);

  add.method('initialize', function ($super, menuMorph, commandIndex) {
    if (commandIndex === 0) {
  		$super(new lively.scene.Ellipse(pt(0, 0), menuMorph._innerRadius));
    } else {
  		$super(this.createWedgeShape(commandIndex, menuMorph._innerRadius, menuMorph._outerRadius * 0.95));
    }
		this._commandIndex = commandIndex;
		this._menuMorph = menuMorph;
		this._labelMorph = TextMorph.createLabel(this.command().labelString().attemptToInsertALineBreak()).fitText();
		var labelCenter = commandIndex === 0 ? pt(0, 0) : Point.polar((menuMorph._innerRadius + menuMorph._outerRadius) / 2, ((commandIndex - 3) / 8) * (2 * Math.PI));
		this.addMorphAt(this._labelMorph, labelCenter.addPt(this._labelMorph.getExtent().scaleBy(-0.5)));
		this.applyStyle(this.defaultStyle);
		this.applyStyle(this._menuMorph.commandStyle);
  }, {category: ['creating']});
  
  add.method('createWedgeShape', function (commandIndex, innerRadius, outerRadius) {
    var thetaA = ((commandIndex - 3.5) / 8) * (2 * Math.PI);
    var thetaB = ((commandIndex - 3  ) / 8) * (2 * Math.PI);
    var thetaC = ((commandIndex - 2.5) / 8) * (2 * Math.PI);
    var p0    = Point.polar(innerRadius, thetaA);
    var p1    = Point.polar(innerRadius, thetaC);
    var ctrl1 = Point.polar(innerRadius * 1.05, thetaB);
    var p2    = Point.polar(outerRadius, thetaA);
    var p3    = Point.polar(outerRadius, thetaC);
    var ctrl2 = Point.polar(outerRadius * 1.05, thetaB);
		var g = lively.scene;
		var cmds = [];
		cmds.push(new g.MoveTo(true, p0.x,  p0.y));
		cmds.push(new g.QuadCurveTo(true, p1.x, p1.y, ctrl1.x, ctrl1.y));
		cmds.push(new g.LineTo(true, p3.x,  p3.y));
		cmds.push(new g.QuadCurveTo(true, p2.x, p2.y, ctrl2.x, ctrl2.y));
		cmds.push(new g.LineTo(true, p0.x,  p0.y));
		return new g.Path(cmds);
  }, {category: ['accessing']});

  add.method('commandIndex', function () {
    return this._commandIndex;
  }, {category: ['accessing']});

  add.method('command', function () {
    return this._menuMorph.commandArray()[this.commandIndex()];
  }, {category: ['accessing']});

  add.method('keyboardShortcut', function () {
    return this._menuMorph.keyboardShortcuts[this.commandIndex()];
  }, {category: ['accessing']});

  add.method('areCommandsEnabled', function () {
    return this._menuMorph.areCommandsEnabled();
  }, {category: ['running commands']});

  add.method('handlesMouseDown', function (evt) {
    return true;
  }, {category: ['events']});

  add.method('onMouseUp', function (evt) {
    if (this.areCommandsEnabled()) {
      this._menuMorph.runCommand(this.command(), evt);
    }
  }, {category: ['events']});

  add.method('onMouseOver', function (evt) {
    if (this.areCommandsEnabled()) {
      this.beHighlighted();
    }
  }, {category: ['events']});

  add.creator('defaultStyle', {}, {category: ['styles']});

  add.method('applyStyle', function ($super, spec) {
		if (spec.textColor !== undefined) {
			this._labelMorph.setTextColor(spec.textColor);
		}
		return $super(spec);
  }, {category: ['styles']});

  add.method('makeStyleSpec', function ($super) {
    var spec = $super();
    spec.textColor = this._labelMorph.getTextColor();
    return spec;
  }, {category: ['styles']});

  add.method('styleWhenHighlighted', function () {
    return TextSelectionMorph.prototype.style;
  }, {category: ['styles']});

});


thisModule.addSlots(avocado.WheelMenuMorph.prototype.defaultStyle, function(add) {

  add.data('borderWidth', 0);

  add.data('fill', new Color(1, 1, 1));

  add.data('fillOpacity', 0.4);

  add.data('openForDragAndDrop', false);

  add.data('suppressHandles', true);

});


thisModule.addSlots(avocado.WheelMenuMorph.prototype.contextCommandStyle, function(add) {

  add.data('textColor', new Color(0, 0, 0));

});


thisModule.addSlots(avocado.WheelMenuMorph.prototype.morphCommandStyle, function(add) {

  add.data('textColor', new Color(0, 0, 0.8));

});


thisModule.addSlots(avocado.WheelMenuMorph.prototype.CommandMorph.prototype.defaultStyle, function(add) {

  add.data('borderWidth', 0);

  add.data('fill', new Color(1, 1, 1));

  add.data('fillOpacity', 0.6);

  add.data('openForDragAndDrop', false);

  add.data('suppressHandles', true);

  add.data('textColor', new Color(0, 0, 0));

});


});
