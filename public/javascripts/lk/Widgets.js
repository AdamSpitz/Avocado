/*
 * Copyright (c) 2006-2009 Sun Microsystems, Inc.
 *
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.

 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

/**
 * Widgets.js.  This file defines the various graphical widgets
 * (morphs) that will be included in the system when it starts.
 */

//  Basic theory of widgets...
//  A widget is a view/controller morph, and it views some aspect of a model
//  Viewing is by way of "plugs" which use MVC-style viewing, and select some
//  aspect or aspects of the model to be viewed.

//  See the comments in Model, and the Model protocol in Morph (getModelValue(), etc)
//  The Inspector and Browser are fairly simple examples of this architecture in use.

// ===========================================================================
// Simple widgets
// ===========================================================================


module('lively.Widgets').requires('lively.Text').toRun(function(thisModule, text) {


BoxMorph.subclass('ButtonMorph', {
    
    documentation: "Simple button. Provides three connections: value, isActive, fire",
    focusHaloBorderWidth: 3, // override the default
    label: null,
    toggle: false, //if true each push toggles the model state 
    styleClass: ['button'],
    
    formals: ["Value", "IsActive"],
	connections: ['value', 'isActive', 'fire'],

	openForDragAndDrop: false,

    // A ButtonMorph is the simplest widget
    // It read and writes the boolean variable, this.model[this.propertyName]
	initialize: function($super, initialBounds) {
		this.baseFill = null;
		$super(initialBounds);
		this.value = false; // for connect()
		this.isActive = true;
		if (Config.selfConnect) {
			var model = Record.newNodeInstance({Value: this.value, IsActive: this.isActive});
			// this default self connection may get overwritten by, eg, connectModel()...
			this.relayToModel(model, {Value: "Value", IsActive: "IsActive"});
		}
		// Styling
		this.applyLinkedStyles();
		this.changeAppearanceFor(this.value);
		return this;
	},

    onDeserialize: function() {
        this.baseFill = this.shape.getFill();
        this.changeAppearanceFor(this.value);
    },

	setFill: function($super, fill) {
		$super(fill);
		this.baseFill = fill;
		this.initColor(); // be careful to not call setFill again...!
	},
	
	// FIXME interference with old model on connectModel/relayToModel???
	getIsActive: function() { return this.isActive },
	
	getValue: function() { return this.value },
	
	setIsActive: function(bool) {
		ModelMigration.set(this, 'IsActive', bool);
		this.isActive = bool;
	},
	
	setValue: function(bool) {
		ModelMigration.set(this, 'Value', bool);
		if (bool) updateAttributeConnection(this, 'fire');
		this.value = bool;
	},
	
	handlesMouseDown: function(evt) {
		return !evt.isCommandKey() && evt.isLeftMouseButtonDown();
	},
    
    onMouseDown: function(evt) {
      // factored out the wasJustPressedDown method because I want to call it for touch events too -- Adam
      return this.wasJustPressedDown(evt);
    },
    
    wasJustPressedDown: function(evt) {
		if (!this.getIsActive() && this.getIsActive() !== undefined) return;
        // this.requestKeyboardFocus(evt.hand); // commented out by Adam, because I don't like it
        if (!this.toggle) {
            this.setValue(true); 
            this.changeAppearanceFor(true); 
        } 
    },
    
	onMouseMove: Functions.Empty,
    
  onMouseUp: function(evt) {
    // factored out the wasJustReleasedUp method because I want to call it for touch events too -- Adam
    return this.wasJustReleasedUp(evt);
  },

	wasJustReleasedUp: function(evt) {
		if (!this.getIsActive() && this.getIsActive() !== undefined) return;
		var newValue = this.toggle ? !this.getValue() : false;
		this.setValue(newValue); 
		// the following should happen in response
		this.changeAppearanceFor(newValue); 
	},
	
	// added by Adam
	_eventHandler: {
	  onTouchStart: function (morph, evt) {
	    morph.wasJustPressedDown(evt);
	  },

	  onTouchEnd: function (morph, evt) {
	    morph.wasJustReleasedUp(evt);
	  },
	},
    
	changeAppearanceFor: function(value) {
		if(!this.lighterFill || !this.normalFill){
			this.initColor();
		}
		var fill = value ?  this.lighterFill : this.normalFill;
		this.shape.setFill(fill);
	},

  	initColor: function() {
    	var gfx = lively.paint;
    	
    	/* This code confuses me. -- Adam
        if (this.baseFill instanceof gfx.LinearGradient) {
            var base = this.baseFill.stops[0].color().lighter(0);
	    	this.normalFill =
				new gfx.LinearGradient([new gfx.Stop(0, base), new gfx.Stop(1, base.lighter())],
				gfx.LinearGradient.SouthNorth);       

            var base = this.baseFill.stops[0].color().lighter(1);
	    	this.lighterFill = 
				new gfx.LinearGradient([new gfx.Stop(0, base), new gfx.Stop(1, base.lighter())],
				gfx.LinearGradient.SouthNorth);

        } else if (this.baseFill instanceof gfx.RadialGradient) {
            var base = this.baseFill.stops[0].color().lighter(0);
            this.normalFill= new gfx.RadialGradient([new gfx.Stop(0, base.lighter()), new gfx.Stop(1, base)]);

             var base = this.baseFill.stops[0].color().lighter(1);
             this.lighterFill= new gfx.RadialGradient([new gfx.Stop(0, base.lighter()), new gfx.Stop(1, base)]);
        } else if (this.baseFill instanceof Color) {
        	this.normalFill = this.baseFill.lighter(0);
            this.lighterFill = this.baseFill.lighter(1);
        } else if (this.baseFill == null || this.baseFill == undefined) {
			this.lighterFill = null;
			this.normalFill = null;
		} else {
			throw new Error('unsupported fill type ' + this.baseFill);
		}
		*/

        if (this.baseFill) {
            this.normalFill  = this.baseFill;
            this.lighterFill = this.baseFill.lighter();
		}
	},

	applyStyle: function($super, spec) {
		$super(spec);
		this.baseFill = this.shape.getFill(); // we may change appearance depending on the value
		if (this.getActualModel()) {
			// otherwise getValue() will fail. Note that this can happen in deserialization
			// when themes are applied before the widget is hooked up to the model
			this.changeAppearanceFor(this.getValue());
		}
		return this; // added by Adam
	},

	updateView: function(aspect, controller) {
		var p = this.modelPlug;
		if (!p) return;
		if (aspect == p.getValue || aspect == 'all') 
			this.onValueUpdate(this.getValue());
	},

	onValueUpdate: function(value) {
		if (this.toggle) console.log("got updated with value " + value);
		this.changeAppearanceFor(value);
	},
	
	onIsActiveUpdate: function(isActive) {
		if (!this.label) return;
		this.label.applyStyle({ textColor: (isActive ? Color.black : Color.gray.darker()) });
	},


    takesKeyboardFocus: Functions.True,          // unlike, eg, cheapMenus
    
    setHasKeyboardFocus: Functions.K, 

    onKeyDown: function(evt) {
		if (!this.getIsActive() && this.getIsActive() !== undefined) return;
        switch (evt.getKeyCode()) {
        case Event.KEY_RETURN:
        case Event.KEY_SPACEBAR:
            this.setValue(true); 
            this.changeAppearanceFor(true);
            evt.stop();
            return true;
        }
        return false;
    },

    onKeyUp: function(evt) {
		if (!this.getIsActive() && this.getIsActive() !== undefined) return;
        var newValue = this.toggle ? !this.getValue() : false;
        switch (evt.getKeyCode()) {
        case Event.KEY_RETURN:
        case Event.KEY_SPACEBAR:
            this.changeAppearanceFor(newValue);
            this.setValue(newValue);
            evt.stop();
            return true;
        }
        return false;
    },

	setLabel: function(txt) {
		this.label && this.label.remove();
		this.label = TextMorph.makeLabel(txt).centerAt(this.innerBounds().center());
		this.addMorph(this.label);
		return this;
	},

	getLabel: function() {
		if (!this.label) 
			return '';
		return this.label.textString
	},

	buttonAction: function(funcOrSelector, target) {
		this.connectModel({
			setValue: 'action',
			model: {action: function(btnVal) {
				if (btnVal) return;
				Object.isString(funcOrSelector) ?
					target[funcOrSelector]() :
					funcOrSelector.apply(target);
			}}
		});
	}
});

Morph.subclass('ButtonBehaviorMorph', {
    
    documentation: "***under construction***",
    focusHaloBorderWidth: 3, // override the default
    normalBorderFill: null,
    mouseOverFill: Color.blue,
    mousePressedFill: Color.orange,
    mouseDownAction: function (evt) {},
    mouseUpAction: function (evt) {}, 

	initialize: function($super, targetMorph) {
		// A ButtonBehaviorMorph can be put over any morph or part of a morph
		// It can show a halo on rollover, and can act on mouseDown and mouseUp
		// At some point we'll unify this with ButtonMorph as a simplification
		// It should be possible to say
		//	<anyMorph>.addButtonBehavior({onMouseDown: function...})
		//	<anyMorph>.addButtonBehavior({onMouseUp: function...})
		// And it should be possible to say to either the morph or its behaviorMorph
		//	<eitherOne>.disableButtonBehavior()
		//	<eitherOne>.ebableButtonBehavior()

		console.log("new ButtonBehaviorMorph 1 " + Object.inspect(this.shape));
		$super(targetMorph.shape.copy());
		console.log("new ButtonBehaviorMorph 2 " + Object.inspect(this.shape));
		//this.setBounds(targetMorph.innerBounds());
		console.log("new ButtonBehaviorMorph 3 " + Object.inspect(this.shape));

		// Styling
		// this.linkToStyles(['buttonBehavior']);
		return this;
	},

    last: function () {}
});

ButtonMorph.subclass('ScriptableButtonMorph', {
	
	documentation: 'Takes a customizable script',

	initialize: function($super, initialBounds) {
		$super(initialBounds);
		this.scriptSource = '';
		return this;
	},

	setValue: function($super, value) {
		$super(value);
		if (value) this.doAction();
	},

	getSourceForEval: function() {
		return '(function() { ' + this.scriptSource + '\n})';
	},

	doAction: function() {
		try {
			var func = eval(this.getSourceForEval());
			func.apply(this, [] /*arg array*/);
		} catch(e) {
			var self = this;
			this.world().setStatusMessage(
				"ScriptButton: " + e + "\non line: " + e.line + "\nscript: \n" + this.scriptSource,  
				Color.red, 4,
				function() {
					var prompt = self.editScript();
					
					
					}
			)
			
			//throw e;
		}
	},

	morphMenu: function($super, evt) {
		var menu = $super(evt);
		menu.addLine();
		menu.addItem(["Edit script...", this.editScript]);
		menu.addItem(["Edit label...", this.editLabel]);
		return menu;  
	},

	editScript: function() {
		// var dialog = new PromptDialogMorph();
		// dialog.title = 'Edit script';
		// dialog.setText(this.scriptSource);
		// dialog.callback = function(input) { this.scriptSource = input }.bind(this);
		// dialog.openIn(this, WorldMorph.current().positionForNewMorph(dialog));
		// return dialog;
		this.world().editPrompt(
			'Edit script',
			function(input) { this.scriptSource = input }.bind(this),
			this.scriptSource)
	},
	
	editLabel: function() {
		this.world().prompt(
			'Edit label',
			function(input) { this.setLabel(input) }.bind(this),
			this.getLabel());
	},

});

BoxMorph.subclass("ImageMorph", {

	documentation: "Image container",
	style:{ borderWidth: 0, fill:Color.blue.lighter() },
	formals: ["-URL"],

	initialize: function($super, viewPort, url, disableScaling) {
		$super(viewPort);
		this.disableScaling = disableScaling; // for compatiblity with depricated usages of image morph
		this.image = new lively.scene.Image(url, viewPort.width, viewPort.height);
		// console.log("making an image from: " + url); // Tired of seeing this. -- Adam
		if (url) {
			this.addWrapper(this.image); // otherwise we didn't make a rawNode
			this.setURL(url) 
		}
		//this.setExtent(this.getExtent())
	},

	// FIXME:
	restoreFromSubnode: function($super, importer, node) /*:Boolean*/ {
		if ($super(importer, node)) return true;

		switch (node.localName) {
			case "image":
			case "use":
			this.image = new lively.scene.Image(importer, node);
			return true;
			default:
			console.log("got unhandled node " + node.localName + ", " + node.namespaceURI + " node " + node);
			return false;
		}
	},

	loadGraphics: function(localURL) {
		this.setFill(null);
		var node = this.image.loadUse(localURL);
		node && this.addNonMorph(node);
	},

	loadFromURL: function(url) {
		//this.setFill(this.background);
		var node = this.image.loadImage(url.toString());
		node && this.addNonMorph(node);
	},

	reload: function() {
		this.image.reload();
	},

	onURLUpdate: function(url) {
		this.loadFromURL(url);
	},

	updateView: function(aspect, controller) {
		var p = this.modelPlug;
		if (!p) return;
		if (aspect == p.getURL) {
			this.onURLUpdate(this.getURL());
		}
	},

	moveOriginBy: function($super, delta) {
		$super(delta);
		if (!this.image) return;
		this.image.setLengthTrait("x", (this.image.getLengthTrait("x") || 0) - delta.x);
		this.image.setLengthTrait("y", (this.image.getLengthTrait("y") || 0) - delta.y);
	},

	setOpacity: function(op) { this.image.setOpacity(op); },

	getOpacity: function(op) { return this.image.getOpacity(op); },

	originalImageSize: function(imgSrc) {
		var newImg = new Image();
		newImg.src = imgSrc;
		return pt(newImg.width, newImg.height)
	},
	
	
	setExtent: function($super, extent) {
		if (this.image && !this.disableScaling) {
			this.image.setWidth(extent.x)
			this.image.setHeight(extent.y)
		}
		return $super(extent); // "return" added by Adam
	},

	reshape: function($super, partName, newPoint, lastCall){
		if (partName)
			$super(partName, newPoint, lastCall);
		if (!this.disableScaling) {
			var extent = this.getExtent();
			if (this.originalExtent) {
				var ratio = this.originalExtent.y / this.originalExtent.x
				extent.y = extent.x * ratio
			};
			var oldPosition = this.getPosition(); // added "var" so it won't be global. -- Adam
			this.setExtent(extent);
			this.setPosition(oldPosition)
		}
 	},

	morphMenu: function($super, evt) {
		var menu = $super(evt);
		menu.addLine();
		menu.addItem(["Edit image src", this.editImageSrc]);
		return menu;  
	},

	getURL: function() {
		return this.image.getURL()
	},

	setURL: function(url) {
		var extent = this.originalImageSize(url);
		if (extent.eqPt(pt(0,0))) {
			extent = pt(10,10); // fall back // aaa - hack for now, to make the demo look OK -- Adam
		};
		this.originalExtent = extent;
		this.image.loadImage(url);
		this.setExtent(extent);
		this.reshape()
	},
	
	editImageSrc: function() {
		this.world().prompt(
			'Edit Image SRC',
			function(input) { this.setURL(input) }.bind(this),
			this.getURL());
	},
});

ButtonMorph.subclass("ImageButtonMorph", {

    documentation: "Button with an image",
    focusHaloBorderWidth: 0,

    initialize: function($super, initialBounds, normalImageHref, activatedImageHref) {
        this.image = new ImageMorph(new Rectangle(0, 0, initialBounds.width, initialBounds.height), normalImageHref, true);
        this.normalImageHref = normalImageHref;
        this.activatedImageHref = activatedImageHref;
        $super(initialBounds);
        this.addMorph(this.image);
        this.image.handlesMouseDown = Functions.True,
        this.image.relayMouseEvents(this);
    },
    
    changeAppearanceFor: function(value) {
        //console.log('changing on %s from %s to %s', value, this.activatedImageHref, this.normalImageHref);
        this.image.loadFromURL(value ? this.activatedImageHref : this.normalImageHref);
    }
    
});

BoxMorph.subclass("ClipMorph", {

    documentation: "A clipping window/view",
    // A clipMorph is like a window through which its submorphs are seen
    // Its bounds are strictly limited by its shape
    // Display of its submorphs are strictly clipped to its shape, and
    // (optionally) reports of damage from submorphs are also clipped so that,
    // eg, scrolling can be more efficient
    
    style: { fill: null, borderWidth: 0},
    
    initialize: function($super, initialBounds) {
		$super(initialBounds);
		this.setupClipNode();
		this.isClipMorph = true;
    },

	setupClipNode: function() {
		var defs = this.rawNode.appendChild(NodeFactory.create('defs'));
		this.clip = new lively.scene.Clip(this.shape);
		defs.appendChild(this.clip.rawNode);
		this.clip.applyTo(this);		
	},
	
	
	restoreFromDefsNode: function($super, importer, node) {
		$super(importer, node);
	    var clips = node.getElementsByTagName('clipPath');
	    if (clips.length > 0) {
			this.clip = new lively.scene.Clip(importer, clips.item(0));
 			this.clip.applyTo(this);
			importer.addMapping(this.clip.id(), this.clip);
	    }
    },

	setBounds: function($super, bnds) { // this reshapes
		$super(bnds);
		this.clip.setClipShape(this.shape);
	},

	bounds: function(ignoreTransients) {
		// intersection  of its shape and its children's shapes
		if (!this.fullBounds) {
			var tfm = this.getTransform();
			var bounds = this.shape.bounds();
			// ClipMorph bounds are independent of subMorphs
			this.fullBounds = tfm.transformRectToRect(bounds);
		}
		return this.fullBounds;
	},

	innerMorph: function() {
		this.submorphs.length != 1 && console.log("not a single inner morph");
		return this.submorphs.first();
	},

	layoutOnSubmorphLayout: function() {
		return false;
	},

	copyFrom: function($super, copier, other) {
		$super(copier, other);
		this.setupClipNode();
	}
});

   
// ===========================================================================
// Handles and selection widgets
// ===========================================================================

Morph.subclass('HandleMorph', {
    
    style: {fill: null, borderColor: Color.blue, borderWidth: 1},

    controlHelpText: "Drag to resize this object\n" + 
        "Alt+drag to rotate the object \n" +
        "Alt+shift+drag to scale the object \n" + 
        "Shift+drag to change border width ", 
    circleHelpText: "Drag to reshape the line\n" + 
        "Cmd+drag to rotate the object \n" +
        "Cmd+shift+drag to scale the object \n" + 
        "Shift+drag to change width ",
    maxHelpCount: 20,
    helpCount: 0,
    isEpimorph: true,
    
	initialize: function($super, location, shapeType, hand, targetMorph, partName) {
		$super(new shapeType(location.asRectangle().expandBy(5)));
		this.location = location;
		this.targetMorph = targetMorph;
		this.partName = partName; // may be a name like "topRight" or a vertex index
		this.initialScale = null;
		this.initialRotation = null; 
		this.mode = 'reshape';
		this.rollover = true;  // pops up near hangle locs, goes away if mouse rolls out
		this.showingAllHandles = false;  // all handles are shown, eg, on touch screens
		this.normalize();
		return this;
	},
    
	getHelpText: function() {
		return (this.shape instanceof lively.scene.Rectangle) ? this.controlHelpText : this.circleHelpText;
	},

	showHelp: function($super, evt) {
		if (this.helpCount > this.maxHelpCount) return false;
		var wasShown = $super(evt);
		if (wasShown) {
			HandleMorph.prototype.helpCount++;
		}
		return wasShown;
	},

	okToDuplicate: Functions.False,

	handlesMouseDown: function(evt) { return true },
onMouseDown: function(evt) {
		//console.log("handle down");
		evt.hand.setMouseFocus(this);
		this.hideHelp();
		if (this.showingAllHandles) this.targetMorph.removeAllHandlesExcept(this);  // remove other handles during reshape
		if (evt.isCommandKey()) this.mode = evt.isShiftDown() ? 'scale' : 'rotate';
		else if (evt.isShiftDown()) this.mode = 'borderWidth';
	},


	onMouseMove: function(evt) {
		if (!evt.mouseButtonPressed) {
			if (this.showingAllHandles) return;  // Showing all handles; just let mouse roll over
			if (this.rollover) {  // Mouse up: Remove handle if mouse drifts away
				if (this.owner && !this.bounds().expandBy(5).containsPoint(this.ownerLocalize(evt.mousePoint))) {
					evt.hand.setMouseFocus(null);
					this.hideHelp();
					this.remove();
				}
				return;
			}
		}
		if (!this.owner) { console.warn("Handle " + this + " has no owner in onMouseMove!" ); return; }
		//console.log("handle move");
		// When dragged, I drag the designated control point of my target
		this.align(this.bounds().center(), this.ownerLocalize(evt.mousePoint));
		var p0 = evt.hand.lastMouseDownPoint; // in world coords
		var p1 = evt.mousePoint;
		if (!this.initialScale) this.initialScale = this.targetMorph.getScale();
		if (!this.initialRotation) this.initialRotation = this.targetMorph.getRotation();
		var ctr = this.targetMorph.owner.worldPoint(this.targetMorph.origin);  //origin for rotation and scaling
		var v1 = p1.subPt(ctr); //vector from origin now
		var v0 = p0.subPt(ctr); //vector from origin at mousedown
		var d = p1.dist(p0); //dist from mousedown

		switch (this.mode) {  // Note mode is set in mouseDown
			case 'scale' :
				var ratio = v1.r() / v0.r();
				ratio = Math.max(0.1,Math.min(10,ratio));
				this.targetMorph.setScale(this.initialScale*ratio);
				break; 
			case 'rotate' :
				this.targetMorph.setRotation(this.initialRotation + v1.theta() - v0.theta());
				break; 
			case 'borderWidth' :
				this.targetMorph.setBorderWidth(Math.max(0, Math.floor(d/3)/2), true);
				break;
			case 'reshape' :
				this.handleReshape(this.targetMorph.reshape(this.partName, this.targetMorph.localize(evt.point()), false));
				break;
		}
	},
    
	onMouseUp: function(evt) {
		//console.log("handle up");
		if (!evt.isShiftDown() && !evt.isCommandKey() && !evt.isMetaDown()) {
			// last call for, eg, vertex deletion
			if (this.partName) this.targetMorph.reshape(this.partName, this.targetMorph.localize(evt.mousePoint), true); 
		}
		this.remove();
		if (this.showingAllHandles) this.targetMorph.addAllHandles(evt);
	},
    
	handleReshape: function(result) {
		if (typeof result == "boolean") {
			// polygon reshape returns a bool = true if close to another vertex (for merge) else false
			this.setBorderColor(result ? Color.red : Color.blue);
		} else {
			// insert-vertex handle has negative index; convert to normal handle after the insertion
			if (this.partName  < 0) this.partName = -this.partName;
			this.type = "rect"; // become a regular handle
		}
	},

	inspect: function($super) {
		return $super() + " on " + Object.inspect(this.targetMorph);
	},
    
	scaleFor: function(scaleFactor) {
		this.applyFunctionToShape(function(s) {
			this.setBounds(this.bounds().center().asRectangle().expandBy(5/s));
			this.setStrokeWidth(1/s); 
		}, scaleFactor);
	},
	
	normalize: function() {
		// if targetMorph is scaled, I'm scaled, too. This function will undo it so that
		// I appear not scaled
		// FIXME: Only handled scale of direct targetMorph/owner!!!
		// if (!this.targetMorph.owner) return
		var invertScale = this.getScale() / this.targetMorph.getScale()
		this.setScale(invertScale);
		var p = this.getCenter();
		this.align(p, this.location);
	}
    
});

BoxMorph.subclass("SelectionMorph", {
	documentation: 'selection "tray" object that allows multiple objects to be moved and otherwise ' + 
		'manipulated simultaneously',

	style: {borderWidth: 1, borderColor: Color.blue, fill: Color.secondary.blue, fillOpacity: 0.1 },

	removeWhenEmpty: true,

	openForDragAndDrop: false,

	takesKeyboardFocus: Functions.True, 
	
	initialize: function($super, viewPort, defaultworldOrNull) {
		$super(viewPort);
		this.originalPoint = viewPort.topLeft();
		this.reshapeName = "bottomRight";
		this.myWorld = defaultworldOrNull ? defaultworldOrNull : this.world();
		// this.shape.setStrokeDashArray([3,2]);
		return this;
	},

	initializeTransientState: function($super) {
		$super();
		this.selectedMorphs = [];
		this.initialSelection = true;
	},

	reshape: function($super, partName, newPoint, lastCall) {

		// rk: With Mac OS 10.6 it's not sufficient to set the selection of the textarea
		// when doing tryClipboardAction. Hack of the hack for now: always set selection 
		// FIXME, other place Text, TextMorph>>onKeyDown
		// ClipboardHack.selectPasteBuffer();
		
		// Initial selection might actually move in another direction than toward bottomRight
		// This code watches that and changes the control point if so
		var result;
		if (this.initialSelection) {
			var selRect = new Rectangle.fromAny(pt(0,0), newPoint);
			if (selRect.width*selRect.height > 30) {
				this.reshapeName = selRect.partNameNearest(Rectangle.corners, newPoint);
			}
			this.setExtent(pt(0, 0)) // dont extend until we know what direction to grow
			result = $super(this.reshapeName, newPoint, lastCall);
		} else {
			result = $super(partName, newPoint, lastCall);
		}
		this.selectedMorphs = [];
		this.owner.submorphs.forEach(function(m) {
			if (m !== this && this.bounds().containsRect(m.bounds())) this.selectedMorphs.push(m);
		}, this);
		this.selectedMorphs.reverse();
			
		if (lastCall) this.initialSelection = false;
		if (lastCall && this.selectedMorphs.length == 0 && this.removeWhenEmpty) {
			this.remove();
		};
		var world = this.world();
		if (world) {
			world.firstHand().setKeyboardFocus(this);
  		this.setScale(1 / world.getScale()); // added by Adam to make it look right when zoomed in or out
		};	
		return result;
	},

	morphMenu: function($super, evt) { 
		var menu = $super(evt);
		menu.keepOnlyItemsNamed(['duplicate', 'remove', 'reset rotation', 'reset scaling', 'inspect', 'edit style']);
		menu.removeItemNamed('---');
		menu.addLine();
		menu.addItem(["align vertically", this.alignVertically]);
		menu.addItem(["space vertically", this.spaceVertically]);
		menu.addItem(["align horizontally", this.alignHorizontally]);
		menu.addItem(["space horizontally", this.spaceHorizontally]);
		menu.addItem(["align to grid...", this.alignToGrid]);
		return menu;
	},
	
	remove: function() { 
		this.selectedMorphs.invoke('remove');
		this.removeOnlyIt();
	},
	
	removeOnlyIt: function() {
		if ( this.myWorld == null ) {
			this.myWorld = this.world();
		} 
		this.myWorld.currentSelection = null;
		// Class.getSuperPrototype(this).remove.call(this);
		Morph.prototype.remove.call(this);
	},
	
	// Note: the next four methods should be removed after we have gridding, i think (DI)
	alignVertically: function() { 
		// Align all morphs to same left x as the top one.
		var morphs = this.selectedMorphs.slice(0).sort(function(m,n) {return m.position().y - n.position().y});
		var minX = morphs[0].position().x;	// align to left x of top morph
		morphs.forEach(function(m) { m.setPosition(pt(minX,m.position().y)) });
	},

	alignHorizontally: function() { 
		var minY = 9999;
		this.selectedMorphs.forEach(function(m) { minY = Math.min(minY, m.position().y); });
		this.selectedMorphs.forEach(function(m) { m.setPosition(pt(m.position().x, minY)) });
	},
	
	spaceVertically: function() { 
		// Sort the morphs vertically
		var morphs = this.selectedMorphs.clone().sort(function(m,n) {return m.position().y - n.position().y});
		// Align all morphs to same left x as the top one.
		var minX = morphs[0].position().x;
		var minY = morphs[0].position().y;
		// Compute maxY and sumOfHeights
		var maxY = minY;
		var sumOfHeights = 0;
		morphs.forEach(function(m) {
			var ht = m.innerBounds().height;
			sumOfHeights += ht;
			maxY = Math.max(maxY, m.position().y + ht);
		});
		// Now spread them out to fit old top and bottom with even spacing between
		var separation = (maxY - minY - sumOfHeights)/Math.max(this.selectedMorphs.length - 1, 1);
		var y = minY;
		morphs.forEach(function(m) {
			m.setPosition(pt(minX, y));
			y += m.innerBounds().height + separation;
		});
	},

	spaceHorizontally: function() { 
		// Sort the morphs vertically
		var morphs = this.selectedMorphs.clone().sort(function(m, n) { 
			return m.position().x - n.position().x;
		});
		// Align all morphs to same left x as the top one.
		var minX = morphs[0].position().x;
		var minY = morphs[0].position().y;
		// Compute maxX and sumOfWidths
		var maxX = minY;
		var sumOfWidths = 0;
		morphs.forEach(function(m) {
			var wid = m.innerBounds().width;
			sumOfWidths += wid;
			maxX = Math.max(maxX, m.position().x + wid);
		}); // Now spread them out to fit old top and bottom with even spacing between
		var separation = (maxX - minX - sumOfWidths)/Math.max(this.selectedMorphs.length - 1, 1);
		var x = minX;
		morphs.forEach(function(m) {
			m.setPosition(pt(x, minY));
			x += m.innerBounds().width + separation;
		});
	},
 
	copyToHand: function(hand) { 
		this.selectedMorphs.invoke('copyToHand', hand);
	},
	
	setBorderWidth: function($super, width) { 
		if (!this.selectedMorphs)  $super(width);
		else this.selectedMorphs.invoke('withAllSubmorphsDo', function() { this.setBorderWidth(width)});
	},
	
	setFill: function($super, color) { 
		if (!this.selectedMorphs)  $super(color);
		else this.selectedMorphs.invoke('withAllSubmorphsDo', function() { this.setFill(color)});
	},
	
	setBorderColor: function($super, color) { 
		if (!this.selectedMorphs)  $super(color);
		else this.selectedMorphs.invoke('withAllSubmorphsDo', function() { this.setBorderColor(color)});
	},

	shapeRoundEdgesBy: function($super, r) { 
		if (!this.selectedMorphs) $super(r);
		else this.selectedMorphs.forEach( function(m) { if (m.shape.roundEdgesBy) m.shapeRoundEdgesBy(r); });
	},
	
	setFillOpacity: function($super, op) { 
		if (!this.selectedMorphs)  $super(op);
		else this.selectedMorphs.invoke('withAllSubmorphsDo', function() { this.setFillOpacity(op)});
	},
	
	setStrokeOpacity: function($super, op) { 
		if (!this.selectedMorphs) $super(op);
		else this.selectedMorphs.invoke('callOnAllSubmorphs', function() { this.setStrokeOpacity(op)});
	},

	setTextColor: function(c) { 
		if (!this.selectedMorphs) return;
		this.selectedMorphs.forEach( function(m) { if (m.setTextColor) m.setTextColor(c); });
	},

	setFontSize: function(c) { 
		if (!this.selectedMorphs) return;
		this.selectedMorphs.forEach( function(m) { if (m.setFontSize) m.setFontSize(c); });
	},

	setFontFamily: function(c) { 
		if (!this.selectedMorphs) return;
		this.selectedMorphs.forEach( function(m) { if (m.setFontFamily) m.setFontFamily(c); });
	},

	setRotation: function($super, theta) {
		for ( var i = 0; i < this.selectedMorphs.length; i++ ) {
			this.addMorph(this.selectedMorphs[i]);
		}
		$super(theta);
		for ( var i = 0; i < this.selectedMorphs.length; i++ ) {
			this.world().addMorph(this.selectedMorphs[i]);
		}
	},
	
	setScale: function($super, scale) {
		for (var i = 0; i < this.selectedMorphs.length; i++ ) {
			this.addMorph(this.selectedMorphs[i]);
		}
		$super(scale);
		for (var i = 0; i < this.selectedMorphs.length; i++ ) {
			this.world().addMorph(this.selectedMorphs[i]);
		}
	},
	
	shadowCopy: function(hand) {
		var copy = Morph.makeRectangle(this.bounds())  // Don't show selection's shadow in the hand
		copy.setFill(null);
		copy.setBorderWidth(0);
		return copy;
	},

	canRespondTo: function(methodName) {
		if (!this.selectedMorphs) return false;
		if (methodName == 'shapeRoundEdgesBy') return this.selectedMorphs.any( function(m) { return m.shape.roundEdgesBy instanceof Function; });
		return this.selectedMorphs.any( function(m) { return m[methodName] instanceof Function; });
	},

	okToBeGrabbedBy: function(evt) {
		this.selectedMorphs.forEach( function(m) { evt.hand.addMorphAsGrabbed(m); });
		return this;
	},	
});

// ===========================================================================
// Panels, lists, menus, sliders, panes, etc.
// ===========================================================================

BoxMorph.subclass('PanelMorph', {

    documentation: "a panel",

    initialize: function($super, extent/*:Point*/) {
        $super(extent.extentAsRectangle());
        this.lastNavigable = null;
    },

    initializeTransientState: function($super) {
        $super();
        this.priorExtent = this.innerBounds().extent();
    },

    takesKeyboardFocus: Functions.True, 

    onMouseDown: function(evt) {
        this.requestKeyboardFocus(evt.hand);
        return true;
    },    
    
	onKeyPress: function(evt) {
		switch (evt.getKeyCode()) {
			case Event.KEY_TAB: { 
				this.focusOnNext(evt);
				evt.stop();
				return true;
			}
		}
	},
    
    handlesMouseDown: Functions.False,

    focusOnNext: function(evt) {
        var current = evt.hand.keyboardFocus;
        if (current && current.nextNavigableSibling) {
            current.relinquishKeyboardFocus(evt.hand);
            current.nextNavigableSibling.requestKeyboardFocus(evt.hand);
        } 
    },

    addMorphFrontOrBack: function($super, m, front) {
        if (m.takesKeyboardFocus()) {
            if (this.lastNavigable) this.lastNavigable.nextNavigableSibling = m;
            this.lastNavigable = m;
        }
        return $super(m, front);
    },

	adjustForNewBounds: function ($super) {
		// Compute scales of old submorph extents in priorExtent, then scale up to new extent
		$super();
		var newExtent = this.innerBounds().extent();
		var scalePt = newExtent.scaleByPt(this.priorExtent.invertedSafely());
		this.submorphs.forEach(function(sub) {
			sub.setPosition(sub.getPosition().scaleByPt(scalePt));
			sub.setExtent(sub.getExtent().scaleByPt(scalePt));
		});
		this.priorExtent = newExtent;
	},
    
    onVisibleUpdate: function(state) {
		if (state == false) this.remove();
    },

	updateView: function(aspect, controller) {
		var plug = this.modelPlug;
		if (!plug) return;

		if (aspect == plug.getVisible || aspect == 'all') {
			this.onVisibleUpdate(this.getModelValue('getVisible', true));
		}
	}

});

Object.extend(PanelMorph, {

    makePanedPanel: function(extent, paneSpecs, optPanel) {
        // Generalized constructor for paned window panels
        // paneSpec is an array of arrays of the form...
        //     ['leftPane', newTextListPane, new Rectangle(0, 0, 0.5, 0.6)],
        // See example calls in, eg, SimpleBrowser.buildView() for how to use this
        var panel = optPanel || new PanelMorph(extent);
        panel.linkToStyles(['panel']);

        paneSpecs.forEach(function(spec) {
            var paneName = spec[0];
            var paneConstructor = spec[1];
            var paneRect = extent.extentAsRectangle().scaleByRect(spec[2]);
            // fix for mixed class vs. function initialization bug
            var pane = Class.isClass(paneConstructor) ? new paneConstructor(paneRect) : paneConstructor(paneRect);
            panel[paneName] = panel.addMorph(pane)
        });
        panel.suppressHandles = true;
        return panel;
    }

});

TextMorph.subclass("CheapListMorph", {
	doNotSerialize: ['itemList'],
    
    style: { borderColor: Color.black, borderWidth: 1 },

    maxSafeSize: 4e4,  // override max for subsequent updates
    formals: ["List", "Selection", "-DeletionConfirmation", "+DeletionRequest"],
    padding: Rectangle.inset(0, 0),
    
	initialize: function($super, initialBounds, itemList) {
		// itemList is an array of strings
		// Note:  A proper ListMorph is a list of independent submorphs
		// CheapListMorphs simply leverage Textmorph's ability to display
		// multiline paragraphs, though some effort is made to use a similar interface.
		// Bug: currently selection doesn't work right if items have leading spaces
		itemList = this.sanitizedList(itemList);
		var listText = itemList ? itemList.join("\n") : "";
		$super(initialBounds, listText);

		this.setWrapStyle(text.WrapStyle.None);
		this.itemList = itemList;
		// this default self connection may get overwritten by, eg, connectModel()...
		var model = new SyntheticModel(this.formals);
		this.modelPlug = new ModelPlug(model.makePlugSpec());
		this.setModelValue('setList', itemList);
		this.layoutChanged();
		return this;
	},

    sanitizedList: function(list) { // make sure entries with new lines don't confuse the list
        return list && list.invoke('replace', /\n/g, " ");
    },

//    setExtent: function(ignored) {
        // Defeat recomposition when reframing windows
        // May have deleterious side-effects
//    },

    onDeserialize: function() {
        this.layoutChanged();
    },

    restorePersistentState: function($super, importer) {
        $super(importer);
        this.itemList = this.textString.split('\n');
        this.setModelValue('setList', this.itemList);
    },
    
    takesKeyboardFocus: Functions.True,

    onKeyPress: Functions.Empty,

    onKeyDown: function(evt) {
        switch (evt.getKeyCode()) {
        case Event.KEY_UP: {
            var lineNo = this.selectedLineNo();
            if (lineNo > 0) {
                this.selectLineAt(this.selectionRange[0] - 2); 
                this.setSelection(this.itemList[lineNo - 1]); 
            } 
            evt.stop();
            break;
        }
        case Event.KEY_BACKSPACE: {
            // request deletion by setting a deletion request in the model
            // if model is subsequently updated with a "setDeletionConfirmation"
            // the selected item will be removed from the view.
            this.setModelValue("setDeletionRequest", this.itemList[this.selectedLineNo()]);
            evt.stop();
            break;
        }
        case Event.KEY_DOWN: {
            var lineNo = this.selectedLineNo();
            if (lineNo < this.itemList.length - 1) {
                this.selectLineAt(this.selectionRange[1] + 2); // skip the '\n' ?
                this.setSelection(this.itemList[lineNo + 1]); 
            } 
            evt.stop();
            break;
        }
        case Event.KEY_ESC: {
            this.relinquishKeyboardFocus(this.world().firstHand());
            evt.stop();
            break;
        }    
        case Event.KEY_SPACEBAR: { // FIXME this should be more general
            // avoid paging down
            evt.stop();
            return true;
        }
        }

    },

    onMouseDown: function(evt) {
        this.onMouseMove(evt); 
        this.requestKeyboardFocus(evt.hand);
    },

    onMouseMove: function(evt) {  
        if (!evt.mouseButtonPressed) return;

        var mp = this.localize(evt.mousePoint);

        if (!this.shape.bounds().containsPoint(mp)) this.selectLineAt(-1);
        else this.selectLineAt(this.charOfY(mp)); 
    },

    onMouseUp: function(evt) {
        this.emitSelection(); 
    },

    emitSelection: function() {
        if (this.hasNullSelection()) return this.setSelection(null);
        this.setSelection(this.itemList[this.selectedLineNo()]); 
    },

    charOfY: function(p) { // Like charOfPoint, for the leftmost character in the line
        return this.charOfPoint(pt(this.padding.left() + 1, p.y)); 
    },
    
    selectedLineNo: function() { // Return the item index for the current selection
        return this.lineNo(this.getCharBounds(this.selectionRange[0]));
    },
    
    showsSelectionWithoutFocus: Functions.True,

    drawSelection: function($super) {
        if (this.hasNullSelection()) { // Null sel in a list is blank
            this.getTextSelection().undraw();
        } else $super();
    },

    selectLineAt: function(charIx) {  
        this.selectionRange = (charIx == -1) ? [0,-1] : this.lineRange(this.textString, charIx);
        this.drawSelection(); 
    },
    
    lineRange: function(str, charIx) { // like selectWord, but looks for matching newLines 
        var i1 = charIx;
        while (i1>0 && str[i1-1] != '\n') i1--; // scan back to prior newline
        var i2 = i1;
        while (i2<str.length-1 && str[i2+1] != '\n') i2++; // and forward to next newline
        return [i1, i2];
    },
    
    lineRect: function($super, r) { //Menu selection displays full width
        var bounds = this.shape.bounds();
        return $super(new Rectangle(bounds.x + 2, r.y, bounds.width - 4, r.height)); 
    },
    
    updateList: function(newList) {
        newList = this.sanitizedList(newList);
        var priorItem = this.getSelection();
        this.itemList = newList;
        var listText = (newList == null) ? "" : newList.join("\n");
        this.updateTextString(listText);
        this.setSelectionToMatch(priorItem);
        this.emitSelection(); 
    },

    setSelectionToMatch: function(item) {
        var lineStart = -1; 
        var firstChar = 0;
        for (var i = 0; i < this.itemList.length; i++) {
            if (this.itemList[i] == item) {
                lineStart = firstChar; 
               break; 
            }
            firstChar += this.itemList[i].length + 1; 
        }
        this.selectLineAt(lineStart); 
    },

    updateView: function(aspect, controller) {
        var c = this.modelPlug;

        if (c) { // New style connect
            switch (aspect) {
            case this.modelPlug.getList:
            case 'all':
                this.updateList(this.getList(["----"]));
                return this.itemList; // debugging
            case this.modelPlug.getSelection:
                var selection = this.getSelection();
                if (this !== controller) this.setSelectionToMatch(selection);
                return selection; //debugging
            case this.modelPlug.getDeletionConfirmation: //someone broadcast a deletion
                if (this.getModelValue("getDeletionConfirmation") == true) {
                    // update self to reflect that model changed
                    var index = this.selectedLineNo();
                    var list = this.getList(["----"]);
                    list.splice(index, 1);
                    this.updateList(list);
                } 
                return null;
            }
        }
    },

    getSelection: function() {
        if (this.modelPlug) return this.getModelValue('getSelection', null);
    },

    setSelection: function(item) {
        if (this.modelPlug) this.setModelValue('setSelection', item); 
    }

});

BoxMorph.subclass("TextListMorph", {

	documentation: "A list that uses TextMorphs to display individual items",
	style: { borderColor: Color.black, borderWidth: 1, fill: Color.white},
	formals: ["List", "Selection", "-Capacity", "-ListDelta", "-DeletionConfirmation", "+DeletionRequest"],
	defaultCapacity: 50,
	highlightItemsOnMove: false,

	layoutManager: new VerticalLayout(), // singleton is OK
	
	initialize: function($super, initialBounds, itemList, optPadding, optTextStyle) {
		// itemList is an array of strings
		this.baseWidth = initialBounds.width;
		var height = Math.max(initialBounds.height, itemList.length * TextMorph.prototype.fontSize);
		initialBounds = initialBounds.withHeight(height);
		if (optPadding) this.padding = optPadding;
		$super(initialBounds);
		this.itemList = itemList;
		this.selectedLineNo = -1;
		this.selection = null; // for connect
		this.textStyle = optTextStyle;
		this.generateSubmorphs(itemList);
	
		if (Config.selfConnect) { // self connect logic, not really needed 
			var model = Record.newNodeInstance({List: [], Selection: null, Capacity: this.defaultCapacity, 
				ListDelta: [], DeletionConfirmation: null, DeletionRequest: null});
			this.relayToModel(model, {List: "List", Selection: "Selection", Capacity: "-Capacity", 
				ListDelta: "-ListDelta",
				DeletionConfirmation: "-DeletionConfirmation", DeletionRequest: "+DeletionRequest"});
		}
		this.setList(itemList);
		this.savedFill = null; // for selecting items
		return this;
	},
	
	onDeserialize: function() {
		if (!this.itemList) this.itemList = [];
		for (var i = 0; i < this.submorphs.length; i++ ) {
			var m = this.submorphs[i];
			m.beListItem();
			m.relayMouseEvents(this);
			// this.itemList.push(m.textString);
		}
		// FIXME sometimes there are deserialization problems. replace completely!
		try { this.setList(this.itemList) } catch(e) {
			console.warn('Cannot correctly deserialize ' + this + ' because ' + e);
		}
		this.layoutChanged();
	},

	handlesMouseDown: Functions.True,

	generateSubmorphs: function(itemList) {
		var rect = pt(this.baseWidth, TextMorph.prototype.fontSize).extentAsRectangle();
		for (var i = 0; i < itemList.length; i++)  {
		  
			// Hacked to allow horizontal lines in menus. -- Adam
			var m = itemList[i];
			if (! (m instanceof Morph)) {
				m = new TextMorph(rect, m).beListItem();
			} else if (m.isMenuLine) {
			  m.setVertices([pt(0, 0), pt(this.baseWidth, 0)])
			}
			
			if (this.textStyle) m.applyStyle(this.textStyle);
			this.addMorph(m);
			m.relayMouseEvents(this);
		}
		// FIXME: border doesn't belong here, doesn't take into account padding.
		var borderBounds = this.bounds();//.expandBy(this.getBorderWidth()/2);
		var delta = 2; // FIXME FIXME
		var newBounds = new Rectangle(delta, 0, borderBounds.width - delta, borderBounds.height + this.padding.bottom());
		this.shape.setBounds(newBounds);
	},

	adjustForNewBounds: function($super) {
		$super();
		// FIXME: go through all the submorphs adjust?
		// Really, just fold into the layout logic, when in place
		this.baseWidth = this.bounds().width;
	},

	takesKeyboardFocus: Functions.True,

	setHasKeyboardFocus: function(newSetting) { 
		this.hasKeyboardFocus = newSetting;
		return newSetting;
	},
	
	onMouseDown: function(evt) {
		var target = this.morphToReceiveEvent(evt);
		var index = this.submorphs.indexOf(target);
		this.highlightItem(evt, index, true);
		evt.hand.setMouseFocus(this); // to get moves
	},

	onMouseMove: function(evt) {
		 // console.log("%s got evt %s", this.getType(),  evt);
		 if (!this.highlightItemsOnMove) return;
		 var target = this.morphToReceiveEvent(evt);
		 var index = this.submorphs.indexOf(target);
		 this.highlightItem(evt, index, false);
	},
	
	onMouseWheel: function(evt) {
		console.log("wheel event " + evt + "," + evt.wheelDelta() + " on " + this); // no break
	},

	highlightItem: function(evt, index, updateModel) {
		if (index >= 0) {
			this.selectLineAt(index, updateModel);
			this.requestKeyboardFocus(evt.hand);
			return true;
		}
		if (!updateModel) this.selectLineAt(-1, updateModel);
		return false;
	},

    onKeyPress: Functions.Empty,

    onKeyDown: function(evt) {
        switch (evt.getKeyCode()) {
        case Event.KEY_UP: {
            var lineNo = this.selectedLineNo;
            if (lineNo > 0) {
                this.selectLineAt(lineNo - 1, true); 
            } 
            evt.stop();
            break;
        }
        case Event.KEY_BACKSPACE: {
            // request deletion by setting a deletion request in the model
            // if model is subsequently updated with a "setDeletionConfirmation"
            // the selected item will be removed from the view.
            this.setDeletionRequest(this.itemList[this.selectedLineNo]);
            evt.stop();
            break;
        }
        case Event.KEY_DOWN: {
            var lineNo = this.selectedLineNo;
            if (lineNo < this.itemList.length - 1) {
                this.selectLineAt(lineNo + 1, true); 
            } 
            evt.stop();
            break;
        }
        case Event.KEY_ESC: {
            this.relinquishKeyboardFocus(evt.hand);
            this.selectLineAt(-1, true);
            evt.stop();
            break;
        }    
        case Event.KEY_SPACEBAR: { // FIXME this should be more generally
            // avoid paging down
            evt.stop();
            return true;
        }
        }
    },

    selectLineAt: function(lineNo, shouldUpdateModel) {  
        if (this.selectedLineNo in this.submorphs) {
          if (this.submorphs[this.selectedLineNo] instanceof TextMorph) { // added by Adam to allow horizontal lines in menus
            this.submorphs[this.selectedLineNo].setFill(this.savedFill);
            this.submorphs[this.selectedLineNo].setTextColor(this.savedTextColor); // added by Adam
          }
        }

        this.selectedLineNo = lineNo;

        var selectionContent = null;
        if (lineNo in this.submorphs) {
            var item = this.submorphs[lineNo];
            this.savedFill = item.getFill(); 
            if (item.getTextColor) { this.savedTextColor = item.getTextColor(); } // added by Adam
            item.setFill(TextSelectionMorph.prototype.style.fill);
            if (item.setTextColor) { item.setTextColor(TextSelectionMorph.prototype.style.textColor); } // added by Adam
            selectionContent = item.textString;
            this.scrollItemIntoView(item);
        }
        shouldUpdateModel && this.setSelection(selectionContent, true);
    },

    appendList: function(newItems) {
        var capacity = this.getCapacity();
        var priorItem = this.getSelection();
        var removed = this.itemList.length + newItems.length - capacity;
        if (removed > 0) {
			var oldPosition = this.submorphs[0].getPosition();
            for (var i = 0; i < removed; i++) {
                this.submorphs[0].remove();
            }
            this.itemList = this.itemList.slice(removed);
			
			// update position of of old morphs in list, 
			// normally this would be the job of the VerticalLayout behavior
			// -> TODO: implement layoutChanged() in VerticalLayout
			var delta = oldPosition.subPt(this.submorphs[0].getPosition());
			for (var i = 0; i < this.submorphs.length; i++) {
                this.submorphs[i].moveBy(delta);
            }
        }
        this.itemList = this.itemList.concat(newItems);
        this.generateSubmorphs(newItems);
        if (this.selectedLineNo + removed >= this.itemList.length - 1) {
            this.selectedLineNo = -1;
        }
        this.resetScrollPane(true);
    },

  	prependItem: function(item) {
    	if(!item){
			console.log("no item to prepend");
    		return;
    	}
    	var priorItem = this.getSelection();
    	this.itemList.unshift(item);
    	this.generateSubmorphs([item]);

    	//no the last submorph has to become the first one:
    	var oldPosition = this.submorphs[0].getPosition();
    	var p2 = this.submorphs[1].getPosition();
    	var delta = pt(0, p2.y-oldPosition.y);
		for (var i = 0; i < this.submorphs.length-1; i++) {
            this.submorphs[i].moveBy(delta);
        }
    	var last = this.submorphs.last();
    	last.remove();
    	this.insertMorph(last,false);
    	/*this.rawNode.insertBefore(last.rawNode, this.submorphs.last().rawNode.nextSibling);

    	this.submorphs.unshift(last);*/
    	last.setPosition(oldPosition);

    	this.setSelectionToMatch(priorItem);
    	this.resetScrollPane();
    	//this.enclosingScrollPane();
    },

    
    updateList: function(newList) {
	if(!newList || newList.length == 0) newList = ["-----"]; // jl 2008-08-02 workaround... :-(
        var priorItem = this.getSelection();
        this.itemList = newList;
        this.removeAllMorphs();
        this.generateSubmorphs(newList);
        this.setSelectionToMatch(priorItem)
        this.resetScrollPane();
        // this.emitSelection(); 
    },

    setSelectionToMatch: function(item) {
        for (var i = 0; i < this.submorphs.length; i++) {
            if (this.submorphs[i].textString === item) {
                this.selectLineAt(i, false);
                return true;
            }
        }
        return false;
    },

	onListUpdate: function(list) {
		this.updateList(list);
	},

    // FIXME containing ScrollPane has a Menu formal var  but update callbacks will be directed the List
    onMenuUpdate: Functions.Empty, 

	onListDeltaUpdate: function(delta) {
		this.appendList(delta);
	},

	onSelectionUpdate: function(selection) {
		console.log("got selection " + selection);
		this.setSelectionToMatch(selection);
		this.selection = selection; // for connect
	},

    onDeletionConfirmationUpdate: function(conf) {
        if (conf == true) {
            // update self to reflect that model changed
            var index = this.selectedLineNo;
            var list = this.getList();
            list.splice(index, 1);
            this.updateList(list);
        } 
    },
    
	updateView: function(aspect, controller) {
		var c = this.modelPlug;
		if (!c) return;
		switch (aspect) {
			case this.modelPlug.getList:
			case 'all':
			this.onListUpdate(this.getList());
			return this.itemList; // debugging

			case this.modelPlug.getListDelta:
			this.onListDeltaUpdate(this.getListDelta());
			return this.itemList;

			case this.modelPlug.getSelection:
			var selection = this.getSelection();
			this.onSelectionUpdate(selection);
			return selection; //debugging

			case this.modelPlug.getDeletionConfirmation: //someone broadcast a deletion
			this.onDeletionConfirmationUpdate(this.getDeletionConfirmation());
			return null;
		}
	},

	enclosingScrollPane: function() { 
		// Need a cleaner way to do this
		if (! (this.owner instanceof ClipMorph)) return null;
		var sp = this.owner.owner;
		if (! (sp instanceof ScrollPane)) return null;
		return sp;
	},
    
    scrollItemIntoView: function(item) { 
        var sp = this.enclosingScrollPane();
        if (!sp) return;
        sp.scrollRectIntoView(item.bounds()); 
    },
    
	resetScrollPane: function(toBottom) { 
		// Need a cleaner way to do this ;-)
		var sp = this.enclosingScrollPane();
		if (!sp) return false;
		if (toBottom) sp.scrollToBottom();
		else sp.scrollToTop();
		return true;
	},

});

// it should be the other way round...
TextListMorph.subclass("ListMorph", {

    documentation: 'Can handle list items, not only strings. {isListItem: true, string: string, value: object}',
    
    initialize: function($super, initialBounds, itemList, optPadding, optTextStyle, suppressSelectionOnUpdate) {
        $super(initialBounds, itemList, optPadding, optTextStyle)
        this.suppressSelectionOnUpdate = suppressSelectionOnUpdate;
    },
    
    generateListItem: function(value, rect) {
        if (this.itemPrinter)
            value = this.itemPrinter(value);
        return new TextMorph(rect, value.string /*fix for Fabrik XMLStringArray, use itemPrinter*/ || value.toString()).beListItem();
    },

    generateSubmorphs: function(itemList) {
        var rect = pt(this.baseWidth, TextMorph.prototype.fontSize).extentAsRectangle();
        for (var i = 0; i < itemList.length; i++)  {
            var m = this.generateListItem(itemList[i], rect);
            if (this.textStyle) m.applyStyle(this.textStyle);
            this.addMorph(m);
            m.closeDnD();
            m.relayMouseEvents(this);
        }
    },
    
    selectLineAt: function(lineNo, shouldUpdateModel) {  
        if (this.selectedLineNo in this.submorphs) { 
            this.submorphs[this.selectedLineNo].setFill(this.savedFill);
        }

        this.selectedLineNo = lineNo;

        var selectionContent = null; 
        if (lineNo in this.submorphs) {
            var item = this.submorphs[lineNo];
            this.savedFill = item.getFill();
            item.setFill(TextSelectionMorph.prototype.style.fill);
            selectionContent = this.itemList[lineNo].isListItem ?
				this.itemList[lineNo].value :
				this.itemList[lineNo];
            this.scrollItemIntoView(item);
        }
        shouldUpdateModel && this.setSelection(selectionContent, true);
    },
    
	onSelectionUpdate: function($super, selection) {
		if (!selection) {
			this.selectLineAt(-1);
			this.selection = null; // for connect
			return;
		}
		if (!Object.isString(selection)) {
			var item = this.itemList.detect(function(ea) { return ea.value === selection });
			if (item) {
				this.selectLineAt(this.itemList.indexOf(item));
				this.selection = item; // for connect
			}
			return
		}
		$super(selection);
	},
    
    setSelectionToMatch: function($super, item) {
        if (!item) return false;
        return $super(item.isListItem ? item.string : item);
    },
    
    
    updateList: function($super, newList) {
        $super(newList);
        this.suppressSelectionOnUpdate || this.selectLineAt(this.selectedLineNo);
    }
});

Morph.subclass('DragWrapper', {

	initialize: function($super, draggedObject, source, index, evt) {
		$super(new lively.scene.Rectangle(new Rectangle(0,0,100,100)));
		this.applyStyle({borderWidth: 0, fill: null});
		this.draggedObject = draggedObject;
		this.source = source;
		this.index=index;
		this.labelMe();
		this.startObservingMouseMoves(evt);
	},

	labelMe: function() {
		var label = new TextMorph(new Rectangle(0,0,100,100));
		if (Object.isString(this.draggedObject))
			label.textString = this.draggedObject;
		else if (this.draggedObject.string)
		label.textString = this.draggedObject.string;
		else
		label.textString = 'unknown';
		label.beLabel();
		label.setFill(Color.white);
		this.addMorph(label);
		label.centerAt(this.getPosition());
	},

	dropMeOnMorph: function(morph) {    
		var pos = this.owner.getPosition();
		var evt = newFakeMouseEvent(pos);
		morph = this.lookForBestReceiver(evt) || morph;

		this.remove();
		this.stopObservingMouseMoves();
		if (this.highlighted) this.highlighted.becomeNormal();

		this.source.isDragging = false;
		console.log('Asking ' + morph + ' if it wants ' + this.draggedObject + '(' + pos + ')');
		if (morph.acceptsDropOf && morph.acceptsDropOf(this.draggedObject)) {
			console.log('Yes :-)');
			morph.acceptDrop(this.draggedObject, evt);
		} else {
			console.log('No :-(')
			this.returnDraggedToSource();
		}
	},
	
	returnDraggedToSource: function() {
		this.source.draggedComesHome(this.draggedObject, this.index);
	},
	
	lookForBestReceiver: function(evt) {
		return evt.hand.world().morphToGrabOrReceive(evt);
	},
	
	startObservingMouseMoves: function(evt) {
		this.startEvent = evt;
		var wrapper=this;
		wrapper.highlighted = null;
		evt.hand.handleMouseEvent = evt.hand.handleMouseEvent.wrap(function(proceed, evt) {
			wrapper.highlighted && wrapper.highlighted.becomeNormal();
			var m = wrapper.lookForBestReceiver(evt);
			var oldColor = m.getBorderColor();
			var oldWidth = m.getBorderWidth();
			wrapper.highlighted = {
				becomeNormal: function() {			
					var x=m;
					x.setBorderColor(oldColor);
					x.setBorderWidth(oldWidth); //wrapper.highlighted=null;
				}
			}
			m.setBorderColor(Color.red);
			m.setBorderWidth(3);
			return proceed(evt);
		})
	},

	stopObservingMouseMoves: function() {
		if (!this.startEvent) return;
		this.startEvent.hand.handleMouseEvent = this.startEvent.hand.constructor.prototype.handleMouseEvent;
	},
});

ListMorph.subclass('DragnDropListMorph', {
    
    dragEnabled: true,

    onMouseDown: function($super, evt) {
        $super(evt);
		var target = this.morphToReceiveEvent(evt);
		var index = this.submorphs.indexOf(target);
        if (this.dragEnabled)
    		this.dragItem = this.itemList[index];    
    },

    onMouseUp: function(evt) {
    	if (this.dragEnabled)
    		this.dragItem = null;
    },

    onMouseMove: function($super, evt) {
    	if (this.dragEnabled && !this.isDragging && this.dragItem && evt.point().dist(evt.priorPoint) > 8) {
    		this.dragSelection(evt);
    		return;
    	}
    	$super(evt);
	},
    
    dragSelection: function(evt) {
    	console.log('start dragging');
		var item = this.dragItem;
		this.dragItem = null;
    	if (!item) {
    		console.log('got no item to drag!');
    		return;
    	}
    	this.isDragging = true;
		var index = this.itemList.indexOf(item);
    	var newList = this.itemList.without(item);
    	this.setList(newList, true); //this.updateList(newList); //?
		if (item.onDrag) item.onDrag();
		evt.hand.grabMorph(new DragWrapper(item, this, index, evt), evt);
	},

	draggedComesHome: function(item, index) {
		this.setList(this.listWith(item, index), true);
	},

	listWith: function(item, index) {
		var list = this.itemList;
		if (index in list)
			return list.slice(0,index).concat([item]).concat(list.slice(index, list.length));
		return list.concat([item]);
	},

	acceptsDropOf: function(item) {
		return Object.isString(item) || item.isListItem
	},

	acceptDrop: function(item, evt) {
		var target = this.morphToReceiveEvent(evt);
		var index = this.submorphs.indexOf(target);
		console.log(index);
		var otherItem = this.itemList[index];
		this.setList(this.listWith(item, index), true);
		if (item.onDrop) item.onDrop(otherItem);
		console.log('Drop accepted!')
	},    
});

Morph.addMethods({
    acceptsDropOf: function(item) {
        var h = this.mouseHandler;
        if (h && h.target)
    		return h.target.acceptsDropOf(item);
    	return false;
    },
    
    acceptDrop: function(item, evt) {
		console.log('relaying drop to: ' + this.mouseHandler.target);
        this.mouseHandler.target.acceptDrop(item,evt);
    },
    
});

DragnDropListMorph.subclass('FilterableListMorph', {
	defaultFilter: /.*/i,
	filter: /.*/i,
	initialize: function($super, initialBounds, itemList, optPadding, optTextStyle, suppressSelectionOnUpdate) {
        $super(initialBounds, itemList, optPadding, optTextStyle, suppressSelectionOnUpdate);
		this.clearFilter();
    },
	getFilter: function() { return this.filter },
	setFilter: function(regexp) {
		this.filter = regexp;
		this.updateList(this.itemList);
	},
	clearFilter: function() {
		this.setFilter(this.defaultFilter)
	},
	applyFilter: function(items) {
		return items.select(function(item) {
			return this.filter.test(item.string);
		}, this);
	},
	filteredItemList: function() {
		return this.applyFilter(this.itemList);
	},
	generateSubmorphs: function($super, itemList) {
		$super(this.applyFilter(this.itemList))
	},
	onKeyDown: function($super, evt) {
		if ($super(evt)) return true;
		if (evt.isAltDown() && evt.getKeyChar() == 'F') {
			this.showFilterDialog(evt);
			evt.stop();
			return true;
		};
		return false
	},
	showFilterDialog: function(evt) {
		var w = this.world();
		var regexString = this.filter.toString();
		regexString = regexString.substring(1, regexString.length-2);
		var acceptRegex = function(input) {
			if (!input) input = '.*';
			var evalString = '/' + input + '/i';
			try {
				var result = eval(evalString);
				if (result.constructor != RegExp) return;
				this.setFilter(result);
			} catch(e) { console.log(e) }
		}.bind(this);

		w.prompt('Edit Filter', acceptRegex, regexString);
	},
	morphToGrabOrReceive: function($super, evt, droppingMorph, checkForDnD) {
		// force to get the menu
		if (evt.isRightMouseButtonDown()) return this;
		return $super(evt, droppingMorph, checkForDnD);
	},
	morphMenu: function($super, evt) {
		var menu = $super(evt);
		menu.addItem(['set filter...', this.showFilterDialog], 0);
		return menu;
	},
	// FIXME cleanup the two methods below
	selectLineAt: function(lineNo, shouldUpdateModel) {  
        if (this.selectedLineNo in this.submorphs) { 
            this.submorphs[this.selectedLineNo].setFill(this.savedFill);
        }

        this.selectedLineNo = lineNo;

        var selectionContent = null; 
        if (lineNo in this.submorphs) {
            var item = this.submorphs[lineNo];
            this.savedFill = item.getFill();
            item.setFill(TextSelectionMorph.prototype.style.fill);
            selectionContent = /*****/this.filteredItemList()/*changed for filter*/[lineNo];
            if (selectionContent.isListItem) {
				selectionContent = selectionContent.value;
			}
            this.scrollItemIntoView(item);
        }
        shouldUpdateModel && this.setSelection(selectionContent, true);
    },
	onSelectionUpdate: function($super, selection) {
		if (!selection) {
			this.selectLineAt(-1);
			this.selection = null; // for connect
			return;
		}
		if (!Object.isString(selection)) {
			var item = this.itemList.detect(function(ea) { return ea.value === selection });
			if (item) {
				this.selectLineAt(/*****/this.filteredItemList()/*changed for filter*/.indexOf(item));
				this.selection = selection; // for connect
			}
			return
		}
		$super(selection);
	},
	
});

PseudoMorph.subclass('MenuItem', {
    
    initialize: function($super, name, closureOrMorph, selectorOrClosureArg, selectorArg) {
		$super();
		this.name = name;
		this.action = closureOrMorph;
		this.para1 = selectorOrClosureArg;
		this.para2 = selectorArg;
    },

    asArrayItem: function() { // for extrinsic menu manipulations
		return [this.name, this.action, this.para1, this.para2];
    },

    invoke: function(evt, targetMorph) {
		// Commented out the log messages because they're annoying. And added "var" in front of item so it won't be global. -- Adam
		//console.log("-------------------------------------------")
		var item = this;
		//console.log("invoke "+ targetMorph)
        if (! this.action) { return; } // added by Adam to make menu lines work
        if (this.action instanceof Function) { // alternative style, items ['menu entry', function] pairs
            this.action.call(targetMorph || this, evt);
        } else if (Object.isString(this.action.valueOf())) {
            // another alternative style, send a message to the targetMorph's menu target (presumably a view).
            var responder = (targetMorph || this).getModelValue("getMenuTarget");
            if (responder)  {
                var func = responder[this.action];
                if (!func) console.log(this.action + " not found in menu target " + responder);
                else func.call(responder, this.para1, evt, this);
            } else {
                console.log("no menu target " + targetMorph);
            }
        } else {
	    	var functionName = this.para1;
            var func = this.action[functionName];  // target[functionName]
            if (func == null) { 
				console.log('Could not find function ' + functionName + " on " + this.action);
            	// call as target.function(parameterOrNull,event,menuItem)
            } else { 	    
				var arg = this.para2;
				//console.log("menu.invoke: " + Object.inspect(this.action) + " action=" + functionName + " arg =" + Object.inspect(arg));
				func.call(this.action, arg, evt, this); 
	    	}
        }
    }

});

MenuItem.subclass("SubMenuItem", {
        
    isSubMenuItem: true,
    
    initialize: function($super, name, closureOrArray) {
        var closure = Object.isArray(closureOrArray) ? function() { return closureOrArray } : closureOrArray;
        $super(name + '...', closure);    
    },
    
    getList: function(evt, targetMorph) {
        if (!this.action) return [];
        return this.action.call(targetMorph || this, evt);
    },
    
    showMenu: function(evt, originalMenu) {
        var target = originalMenu.targetMorph;
        var menu = this.menu || new MenuMorph(this.getList(evt, target), target, originalMenu);
        var ownIndex = originalMenu.items.indexOf(this);
        var pos = pt(originalMenu.getPosition().x + originalMenu.listMorph.getExtent().x,
                     originalMenu.getPosition().y + originalMenu.listMorph.submorphs[ownIndex].getPosition().y);
        menu.openIn(originalMenu.owner, pos, false); 
        this.menu = menu;
    },
    
    closeMenu: function(evt, originalMenu) {
        if (!this.menu) return;
        this.menu.remove();
        this.menu = null;
    }
});

Morph.subclass("MenuMorph", {

    listStyle: { 
        borderColor: Color.blue,
        borderWidth: 0.5,
        fill: Color.blue.lighter(5),
        borderRadius: 4, 
        fillOpacity: 0.75,
        wrapStyle: text.WrapStyle.Shrink
    },

    textStyle: {
        textColor: Color.blue,
        padding: Rectangle.inset(4, 1), // added by Adam
        fontSize: 14  // added by Adam
    },

    labelStyle: {
        padding: Rectangle.inset(3),
		borderWidth: 1, 
        borderRadius: 4, 
        fillOpacity: 0.75, 
        wrapStyle: text.WrapStyle.Shrink
    },

    suppressHandles: true,
    focusHaloBorderWidth: 0,
    
    initialize: function($super, items, targetMorph, ownerMenu) {
        // items is an array of menuItems, each of which is an array of the form
        // 	[itemName, target, functionName, parameterIfAny]
        // At mouseUp, the item will be executed as follows:
        // 	target.function(parameterOrNull,event,menuItem)
        // The last item is seldom used, but it allows the caller to put
        // additional data at the end of the menuItem, where the receiver can find it.

		// Note that an alternative form of item is supported, as:
		// 	[itemName, itemFunction]
		// which will be executed as follows:
		//	itemFunction.call(targetMorph || this, evt)
		// See MenuItem for yet another form of invocation for targets matching
		//	var responder = (targetMorph || this).getModelValue("getMenuTarget");

		// Finally, note that if the itemName is followed by an array
		//	then that array is the specification for a subMenu,
		//	and, the itemName will appear followed by '...'

        // The optional parameter lineList is an array of indices into items.
        // It will cause a line to be displayed below each item so indexed
    
        // It is intended that a menu can also be created incrementally
        // with calls of the form...
        //     var menu = MenuMorph([]);
        //     menu.addItem(nextItem);  // May be several of these
        //     menu.addLine();          // interspersed with these
        //     menu.openIn(world,location,stayUp,captionIfAny);
	
        $super(new lively.scene.Rectangle(pt(0, 0).extentAsRectangle()));
        this.items = items.map(function(item) { return this.addPseudoMorph(this.checkItem(item)) }, this);
        this.targetMorph = targetMorph || this;
        this.listMorph = null;
        this.applyStyle({fill: null, borderWidth: 0, fillOpacity: 0});
        this.ownerMenu = ownerMenu;
    },

    onDeserialize: function() {
		this.listMorph.relayMouseEvents(this);
    },

    addItem: function(item, index) {
        var item = this.addPseudoMorph(this.checkItem(item));
        if (!index && (index != 0)) { this.items.push(item); return }
        if (index > this.items.length || index < 0) throw dbgOn(new Error('Strange index'));
        var parts = this.items.partition(function(ea, i) { return i < index });
        parts[0].push(item);
        this.items = parts[0].concat(parts[1]);
    },

    checkItem: function(item) {
      if (!item) { return new MenuItem(this.makeLine()); } // added by Adam
		if (Object.isString(item)) throw dbgOn(new Error(
			'Menu item specification should be an array, not just a string'));
		return Object.isArray(item[1]) ?
        	new SubMenuItem(item[0], item[1], item[2], item[3]) :
			new MenuItem(item[0], item[1], item[2], item[3]); 
    },

    addItems: function(items) {
		items.forEach( function(item) { this.addItem(item); }.bind(this));
    },

    getRawItems: function() {
		return this.items  // Private protocol for pie-menu access
    },

    addRawItem: function(item) {
		this.items.push(this.addPseudoMorph(item));  // Private protocol for pie-menu access
    },

    addLine: function(item) { // Not yet supported
        this.items.push(new MenuItem(this.makeLine())); // extracted the makeLine method -- Adam
    },

    // makeLine method extracted by Adam
    makeLine: function() { // Not yet supported
        // The idea is for this to add a real line on top of the text
        
        // Hacked to make the lines look like real lines, not just -----. -- Adam
        // return new MenuItem('-----');
        var line = Morph.makeLine([pt(0,5), pt(100,5)], 1, Color.gray);
        line.isMenuLine = true;
        return line;
    },

    addSubmenuItem: function(item) {
		// FIXME: Isn't this now just equivalent to addItem?
        var item = new SubMenuItem(item[0], item[1], item[2], item[3]);
        this.items.push(this.addPseudoMorph(item));
    },
    
    removeItemNamed: function(itemName) {
        // May not remove all if some have same name
        // Does not yet fix up the lines array
        for (var i = 0; i < this.items.length; i++)
            if (this.items[i].name == itemName) {
		this.items[i].remove();
                this.items.splice(i,1);
	    }
    },

    replaceItemNamed: function(itemName, newItem) {
        for (var i = 0; i < this.items.length; i++)
            if (this.items[i].name == itemName)
                this.items[i] = this.addPseudoMorph(new MenuItem(newItem[0], newItem[1], newItem[2], newItem[3]));
    },

    removeItemsNamed: function(nameList) {
        nameList.forEach(function(n) { this.removeItemNamed(n); }, this);
    },

    keepOnlyItemsNamed: function(nameList) {
        var rejects = [];
        this.items.forEach(function(item) { if (nameList.indexOf(item.name) < 0) rejects.push(item.name)});
        this.removeItemsNamed(rejects);
    },

    estimateListWidth: function(proto) {
		// estimate with based on some prototypical TextMorph object
		// lame but let's wait to do the right thing until the layout business is complete
		var maxWidth = 0;
		for (var i = 0; i < this.items.length; i++)
		    if (this.items[i].name.length > maxWidth) maxWidth = this.items[i].name.length;
		var protoPadding = Rectangle.inset(6, 4);
		return maxWidth *   (this.textStyle.fontSize || /* added by Adam */ proto.fontSize)/2 + protoPadding.left() + protoPadding.right();
    },

    openIn: function(parentMorph, loc, remainOnScreen, captionIfAny) { 
        if (this.items.length == 0) return;

        // Note: on a mouseDown invocation (as from a menu button),
        // mouseFocus should be set immediately before or after this call
        this.stayUp = remainOnScreen; // set true to keep on screen

        parentMorph.addMorphAt(this, loc);
	
		var textList = this.items.pluck('name');
        this.listMorph = new TextListMorph(pt(this.estimateListWidth(TextMorph.prototype), 0).extentAsRectangle(), 
					   textList, Rectangle.inset(0, this.listStyle.borderRadius/2), this.textStyle);
	
		var menu = this;
		this.listMorph.onKeyDown = function(evt) {
	    	var result = Class.getPrototype(this).onKeyDown.call(this, evt);
		    switch (evt.getKeyCode()) {
		    	case Event.KEY_ESC: {
					if (!menu.stayUp) menu.removeOnEvent(evt);
						evt.stop();
					return true;
				}
		    	case Event.KEY_RETURN: {
					if (menu.invokeItemAtIndex(evt, this.selectedLineNo)) 
			    		evt.stop();
					return true;
	    		}
	    	}
		};

        this.listMorph.applyStyle(this.listStyle);
        this.listMorph.suppressHandles = true;
        this.listMorph.focusHaloBorderWidth = 0;
        this.listMorph.highlightItemsOnMove = true;
        this.addMorph(this.listMorph);

        this.label = null;
        if (captionIfAny) { // Still under construction
            var label = TextMorph.makeLabel(captionIfAny, this.labelStyle);
            label.align(label.bounds().bottomCenter(), this.listMorph.shape.bounds().topCenter());
            this.label = this.addMorph(label);
	    	this.label.setFill(new lively.paint.LinearGradient([new lively.paint.Stop(0, Color.white),
								new lively.paint.Stop(1, Color.gray)]));
        }

        // If menu and/or caption is off screen, move it back so it is visible
       var menuRect = this.bounds();  //includes caption if any
       menuRect = menuRect.topLeft().extent(menuRect.extent().scaleBy(1 / this.overallScale())); // adjust for the menu's scale -- Adam
       var world = this.world() || WorldMorph.current();
       var bounds = world.visibleBounds();
       //console.log("Visible Bounds for World Morph: " + bounds);  // commented out, annoying -- Adam
       var visibleRect = menuRect.intersection(bounds);
        var delta = visibleRect.topLeft().subPt(menuRect.topLeft());  // delta to fix topLeft off screen
        delta = delta.addPt(visibleRect.bottomRight().subPt(menuRect.bottomRight()));  // same for bottomRight
        if (delta.dist(pt(0, 0)) > 1) this.moveBy(delta);  // move if significant

        this.startOpeningAnimation(); // Added by Adam; must be down here so that the bounds calculations use the full size

        this.listMorph.relayMouseEvents(this);
        // Note menu gets mouse focus by default if pop-up.  If you don't want it, you'll have to null it
        if (!remainOnScreen) {
	    var hand = parentMorph.world().firstHand();
	    hand.setMouseFocus(this);
            hand.setKeyboardFocus(this.listMorph);
        }
    },

    // Added by Adam
    startOpeningAnimation: function() {
      var world = this.world();
      var desiredScale = Config.fatFingers ? 1.5 : 1;
      if (world) {
        desiredScale = desiredScale / world.getScale();
        this.setScale(desiredScale * 0.01);
        this.smoothlyScaleTo(desiredScale);
      } else {
        this.setScale(desiredScale);
      }
    },
    
    selectedItemIndex: function(evt) {
        var target = this.listMorph.morphToReceiveEvent(evt);
        var index = this.listMorph.submorphs.indexOf(target);
        if (index === -1) return null;
        return index;
    },
    
    submenuItems: function() {
        return this.items.select(function(ea) { return ea.isSubMenuItem });
    },
    
    handOverMenu: function(hand) {
        return this.listMorph.bounds().containsPoint(this.localize(hand.getPosition()));
    },
    
    setMouseFocus: function(evt) {
        evt.hand.setMouseFocus(this);
        evt.hand.setKeyboardFocus(this.listMorph);    
    },

    setMouseFocusOverSubmenu: function(evt) {
		// Return true iff the mouse is in a submenu
        var submenuItem = this.submenuItems().detect(function(ea) { return ea.menu && ea.menu.handOverMenu(evt.hand) }) ;
        if (!submenuItem) return false;
        submenuItem.menu.setMouseFocus(evt);
		return true;
    },
    
    setMouseFocusOverOwnerMenu: function(evt) {
        if (this.ownerMenu && this.ownerMenu.handOverMenu(evt.hand))
            this.ownerMenu.setMouseFocus(evt);
    },
    
    setMouseFocusOverOwnerMenuOrSubMenu: function(evt) {
        this.setMouseFocusOverOwnerMenu(evt);
        this.setMouseFocusOverSubmenu(evt);
    },
        
    removeOnEvent: function(evt) {
        this.submenuItems().invoke('closeMenu');
        this.remove();
        this.ownerMenu && this.ownerMenu.removeOnEvent(evt);
        if (evt.hand.mouseFocus === this) evt.hand.setMouseFocus(null);
    },

    onMouseUp: function(evt) {
		if (evt.hand.checkMouseUpIsInClickTimeSpan(evt))
			return true; // do nothing on a click...
	
		if (!this.invokeItemAtIndex(evt, this.selectedItemIndex(evt)) && !this.stayUp)
	    	this.setMouseFocus(evt); // moved away, don't lose the focus
    },

    onMouseDown: function(evt) {
        this.onMouseMove(evt); // Added by Adam to make highlighting work on touch devices even when no movement
        if (this.selectedItemIndex(evt) === null && !this.stayUp) {
          this.removeOnEvent(evt);
        }
    },

    onMouseMove: function(evt) {
        this.setMouseFocus(evt);
		if (!this.handOverMenu(evt.hand)) {
			if (this.stayUp) evt.hand.setMouseFocus(null);
			if (this.setMouseFocusOverSubmenu(evt)) return;
			this.listMorph.highlightItem(evt, -1, false);
			this.setMouseFocusOverOwnerMenu(evt);
			return;    
			}

        var index = this.selectedItemIndex(evt);
        if (index === null) return;
        this.listMorph.highlightItem(evt, index, false);
        
        var item = this.items[index];
		this.submenuItems().without(item).invoke('closeMenu');
        if (! item.isSubMenuItem) return;
		if (! item.menu) item.showMenu(evt, this);
			else if (item.menu.handOverMenu(evt.hand)) item.menu.setMouseFocus(evt);
        
    },
    
    // is not called
    onMouseOut: function(evt) {
        console.log("mouse moved away ....");
        this.setMouseFocusOverSubmenu(evt);
        if (this.stayUp) return;
        this.removeOnEvent(evt);
    },
    
    invokeItemAtIndex: function(evt, index) {
		if (index === null) return false;
	        try {
		    this.invokeItem(evt, this.items[index]);
	        } finally {
		    if (!this.stayUp) this.removeOnEvent(evt);
	        }
		return true;
    },
    
    invokeItem: function invokeItem(evt, item) {
        if (!item) return;
		item.invoke(evt, this.targetMorph);
    }

});

BoxMorph.subclass("SliderMorph", {

	documentation: "Slider/scroll control",

	mss: 12,  // minimum slider size
	formals: { 
		Value:		  {byDefault: 0}, // from: function(value) { alert('from!' + value); return value;}}, 
		SliderExtent: {mode: "-", byDefault: 0} 
	},
	style: {borderWidth: 1, borderColor: Color.black},
	selfModelClass: PlainRecord.prototype.create({Value: { byDefault: 0 }, SliderExtent: { byDefault: 0}}),
	
	connections: ['value'],

	initialize: function($super, initialBounds, scaleIfAny) {
		$super(initialBounds);
		// this default self connection may get overwritten by, eg, connectModel()...
		var modelClass = this.selfModelClass;
		var model = new modelClass({}, {});
		this.connectModel(model.newRelay({Value: "Value", SliderExtent: "SliderExtent"}));
		this.valueScale = (scaleIfAny === undefined) ? 1.0 : scaleIfAny;
		var slider = Morph.makeRectangle(0, 0, this.mss, this.mss);
		slider.relayMouseEvents(this, {onMouseDown: "sliderPressed", onMouseMove: "sliderMoved", onMouseUp: "sliderReleased"});
		this.slider = this.addMorph(slider);
		this.slider.linkToStyles(['slider']);
		this.adjustForNewBounds();
		this.adjustFill();
		return this;
	},

 	onDeserialize: function() {
		if (!this.slider) {
			console.warn('no slider in %s, %s', this, this.textContent);
		   return;
		}
		this.slider.relayMouseEvents(this, {onMouseDown: "sliderPressed", onMouseMove: "sliderMoved", onMouseUp: "sliderReleased"});
		// TODO: remove this workarounds by serializing observer relationsships
		if (this.formalModel && this.formalModel.addObserver) {
			this.formalModel.addObserver(this)
		}	
	},
	
	vertical: function() {
		var bnds = this.shape.bounds();
		return bnds.height > bnds.width; 
	},
	
	applyStyle: function($super, spec) {
		$super(spec);
		// need to call adjust to update graphics, but only after slider exists
		if (this.slider) {
			this.adjustForNewBounds(); 
			this.adjustFill();
		}
		return this; // added by Adam
	},
	
	adjustForNewBounds: function($super) {
		$super();
		this.adjustSliderParts();
	},
	
	adjustSliderParts: function($super) {
		// This method adjusts the slider for changes in value as well as geometry
		var val = this.getScaledValue();
		var bnds = this.shape.bounds();
		var ext = this.getSliderExtent(); 

    // added by Adam
		if (ext === 1) {
		  if (this.owner) {
		    this._desiredOwner = this.owner;
		    this.remove();
		  }
    } else if (!this.owner && this._desiredOwner) {
      console.log()
      this._desiredOwner.addMorph(this);
    }
	
		if (this.vertical()) { // more vertical...
			var elevPix = Math.max(ext*bnds.height, this.mss); // thickness of elevator in pixels
			var topLeft = pt(0, (bnds.height - elevPix)*val);
			var sliderExt = pt(bnds.width, elevPix);
		} else { // more horizontal...
			var elevPix = Math.max(ext*bnds.width, this.mss); // thickness of elevator in pixels
			var topLeft = pt((bnds.width - elevPix)*val, 0);
			var sliderExt = pt(elevPix, bnds.height); 
		}
		this.slider.setBounds(bnds.topLeft().addPt(topLeft).extent(sliderExt));

		//this.slider.shapeRoundEdgesBy((this.vertical() ? sliderExt.x : sliderExt.y)/2);
		this.slider.shapeRoundEdgesBy(Math.min(sliderExt.x, sliderExt.y)/2);
		
	},

	adjustFill: function() {
	  
	  // added by Adam
	  var shouldMakeScrollBarsLookSortaLikeMacOS = true;
	  if (shouldMakeScrollBarsLookSortaLikeMacOS) {
	    var sliderColor = new Color(0.5, 0.5, 0.5);
	    this.slider.setFill(sliderColor);
	    this.slider.setBorderColor(sliderColor);
	    this.setFill(Color.black);
	    this.setFillOpacity(0.1);
	    this.setBorderWidth(0);
	    this.setBorderColor(null);
	    return;
	  }
	  
		var fill = this.slider.getFill();
		var gfx = lively.paint;
		if (fill instanceof lively.paint.LinearGradient) {
			var direction = this.vertical() ? gfx.LinearGradient.EastWest : gfx.LinearGradient.NorthSouth;
			var baseColor = fill.stops[0].color();
			this.setFill(new gfx.LinearGradient([new gfx.Stop(0, baseColor, 1), 
							 new gfx.Stop(0.5, baseColor.lighter(2)),
							 new gfx.Stop(1, baseColor)], direction));
			// FIXME: just flip the gradient
			this.slider.setFill(
				new gfx.LinearGradient([ new gfx.Stop(0, baseColor),
				new gfx.Stop(1, fill.stops[1].color())], direction));
			this.setBorderWidth(this.slider.getBorderWidth());
		} else if (fill) {
			this.setFill(fill.lighter());
		}		
	},
	
	sliderPressed: function(evt, slider) {
		//	  Note: want setMouseFocus to also cache the transform and record the hitPoint.
		//	  Ideally thereafter only have to say, eg, morph.setPosition(evt.hand.adjustedMousePoint)
		this.hitPoint = this.localize(evt.mousePoint).subPt(this.slider.bounds().topLeft());
	},
	
	sliderMoved: function(evt, slider) {
		if (!evt.mouseButtonPressed) return;

		// Compute the value from a new mouse point, and emit it
		var p = this.localize(evt.mousePoint).subPt(this.hitPoint || evt.mousePoint);//Sometimes this.hitPoint is undefined
		var bnds = this.shape.bounds();
		var ext = this.getSliderExtent(); 
	
  	 // Yield 0 if the elevator takes up the full slider - otherwise we get infinities and weird jerky behaviour. -- Adam
		if (this.vertical()) { // more vertical...
			var elevPix = Math.max(ext*bnds.height,this.mss); // thickness of elevator in pixels
			var newValue = bnds.height === elevPix ? 0 : p.y / (bnds.height-elevPix);
		} else { // more horizontal...
			var elevPix = Math.max(ext*bnds.width,this.mss); // thickness of elevator in pixels
			var newValue = bnds.width === elevPix ? 0 : p.x / (bnds.width-elevPix); 
		}
		
		if (isNaN(newValue)) newValue = 0;
		this.setScaledValue(this.clipValue(newValue));
		this.adjustForNewBounds(); 
	},

	sliderReleased: Functions.Empty,
	
	handlesMouseDown: function(evt) { return !evt.isCommandKey(); },

	onMouseDown: function(evt) {
		this.requestKeyboardFocus(evt.hand);
		var inc = this.getSliderExtent();
		var newValue = this.getValue();

		var delta = this.localize(evt.mousePoint).subPt(this.slider.bounds().center());
		if (this.vertical() ? delta.y > 0 : delta.x > 0) newValue += inc;
		else newValue -= inc;
	
		if (isNaN(newValue)) newValue = 0;
		this.setScaledValue(this.clipValue(newValue));
		this.adjustForNewBounds(); 
	},
	
	onMouseMove: function($super, evt) {
		// Overriden so won't drag me if mouse pressed
		if (evt.mouseButtonPressed) return;
		return $super(evt);
	},
	
	clipValue: function(val) { 
		return Math.min(1.0,Math.max(0,0,val.roundTo(0.0001))); 
	},

	updateView: function(aspect, controller) { // obsolete soon ?
		var p = this.modelPlug;
		if (!p) return;
		if (aspect == p.getValue || aspect == 'all') {
			this.onValueUpdate(this.getValue());
		} else if (aspect == p.getSliderExtent || aspect == 'all')	{
			this.onSliderExtentUpdate(this.getSliderExtent()); 
		}
	},

	onSliderExtentUpdate: function(extent) {
		this.adjustForNewBounds();
	},

	onValueUpdate: function(value) {
		this.adjustForNewBounds();
		this.value = value // for connect
	},

	getScaledValue: function() {
		return (this.getValue() || 0) / this.valueScale; // FIXME remove 0
	},

	setScaledValue: function(value) {
		return this.setValue(value * this.valueScale);
	},
	
	takesKeyboardFocus: Functions.True,
	
	setHasKeyboardFocus: function(newSetting) { 
		return newSetting; // no need to remember
	},

	onKeyPress: Functions.Empty,

	onKeyDown: function(evt) {
		var delta = 0;
		if (this.vertical()) {
			switch (evt.getKeyCode()) {
			case Event.KEY_DOWN: delta = 1; break;
			case Event.KEY_UP:	delta = -1; break;
			default: return false;
			} 
		} else {
			switch (evt.getKeyCode()) {
			case Event.KEY_RIGHT: delta = 1;  break;	
			case Event.KEY_LEFT:  delta = -1; break;
			default: return false;
			}	 
		}
		this.setScaledValue(this.clipValue(this.getScaledValue() + delta * (this.getSliderExtent())));
		this.adjustForNewBounds();
		evt.stop();
		return true;
	}

});

BoxMorph.subclass("ScrollPane", {

    description: "A scrolling container",
    style: { borderWidth: 2, fill: null},
    scrollBarWidth: 6, // used to say 14 -- Adam
    ScrollBarFormalRelay: Relay.create({Value: "ScrollPosition", SliderExtent: "-VisibleExtent"}), // a class for relays

    initialize: function($super, morphToClip, initialBounds) {
        $super(initialBounds);
        
		var clipR = this.calcClipR();
        // I don't understand why this next line of code was in there, with
        // a comment next to it explaining exactly why it's broken.
        // Commenting it out. -- Adam
        //morphToClip.shape.setBounds(clipR); // FIXME what if the targetmorph should be bigger than the clipmorph?
        
        // Make a clipMorph with the content (morphToClip) embedded in it
        this.clipMorph = this.addMorph(new ClipMorph(clipR));    
        //this.clipMorph.shape.setFill(morphToClip.shape.getFill());
	this.clipMorph.setFill(morphToClip.getFill());
        morphToClip.setBorderWidth(0);
        morphToClip.setPosition(clipR.topLeft());
        this.clipMorph.addMorph(morphToClip);
	
	
		this.showScrollBar = true;
       	this.initializeScrollBar();
	
        // suppress handles throughout
        [this, this.clipMorph, morphToClip, this.scrollBar].forEach(function(m) {m.suppressHandles = true});
        // alert('inner morph is ' + this.innerMorph());
	
        return this;
    },

	calcClipR: function() {
		var bnds = this.innerBounds();
		return bnds.withWidth(bnds.width - this.scrollBarWidth+1).insetBy(1);
	},

	initializeScrollBar: function() {
		if (this.showScrollBar) {
			var morph = new SliderMorph(this.innerBounds().withTopLeft(this.calcClipR().topRight()))
        	this.scrollBar = this.addMorph(morph);
			this.scrollBar.connectModel(new (this.ScrollBarFormalRelay)(this));
		}
	},

	getScrollBar: function() {
		if (!this.scrollBar) {
			this.initializeScrollBar();
		};
		return this.scrollBar
	},
	
	disableScrollBar: function() {
		if (this.scrollBar) {
			this.scrollBar.remove();
			this.showScrollBar = false;
			delete this.scrollBar;
			this.adjustForNewBounds();
		}
	},

	enableScrollBar: function() {
		this.showScrollBar = true;
		this.initializeScrollBar();
	},

    onDeserialize: function() { // FIXME duplication between here and initialize
        if (this.scrollBar && this.ScrollBarFormalRelay) 
	    	this.scrollBar.formalModel = new (this.ScrollBarFormalRelay)(this);
        if (this.menuButton)
            this.menuButton.relayMouseEvents(this, {onMouseDown: "menuButtonPressed"});
		this.adjustForNewBounds();
    },

    submorphBounds: function() {
		// a little optimization 
		// FIXME: epimorphs should be included
		if (this.clipMorph)
			return this.clipMorph.bounds();
    },

    innerMorph: function() {
        return this.clipMorph.innerMorph();
    },

    connectModel: function(plugSpec, optFlag) { // connection is mapped to innerMorph
        this.innerMorph().connectModel(plugSpec, optFlag);
        if (plugSpec.getMenu) this.addMenuButton();
    },
    
    disconnectModel: function() {
        this.innerMorph().disconnectModel();
    },
    
    getModel: function() {
        return this.innerMorph().getModel();
    },

    getModelPlug: function() {
        return this.innerMorph().getModelPlug();
    },

    updateView: function(aspect, source) {
        return this.innerMorph().updateView(aspect, source);
    },
    
    addMenuButton: function() {
        if (this.menuButton) return;

        var w = this.scrollBarWidth;
        this.menuButton = this.addMorph(Morph.makeRectangle(0, 0, w, w));
        this.menuButton.setFill(Color.white);
        // Make it look like 4 tiny lines of text (doesn't work yet...)
        var p0 = this.menuButton.innerBounds().topLeft().addXY(2, 2);
        for (var i = 1; i <= 4; i++) {
	    var line = new lively.scene.Polyline([p0.addXY(0, i*2), p0.addXY([6, 2, 4, 6][i-1], i*2)]);
	    line.setStroke(Color.black);
	    line.setStrokeWidth(1);
            this.menuButton.addMorph(new Morph(line)).ignoreEvents();
        }
	
        if (this.scrollBar) {
            this.menuButton.setPosition(this.getScrollBar().getPosition());
            this.menuButton.setFill(this.getScrollBar().getFill());
            this.getScrollBar().setBounds(this.getScrollBar().bounds().withTopLeft(
            	this.getScrollBar().bounds().topLeft().addXY(0, w)));
        }
        this.menuButton.relayMouseEvents(this, {onMouseDown: "menuButtonPressed"});
    },

    menuButtonPressed: function(evt, button) {
		//console.log("menuButtonPressed")
        evt.hand.setMouseFocus(null);
        var editItems = this.innerMorph().editMenuItems();
		var items = this.innerMorph().getModelValue("getMenu") || [];
        if (editItems.length == 0 && items.length == 0) return;
        var menu;
		if (editItems.length > 0 && items.length > 0) {
            var menu = new MenuMorph(editItems, this);
	    	menu.addLine();
	    	items.forEach(function(item) {menu.addItem(item); });
		} else {
	    	var menu = new MenuMorph(editItems.concat(items), this);
		}
        menu.openIn(this.world(), evt.mousePoint, false); 
    },

	slideRoom: function() {
		// 10 is a offset that works with the default font size... I think this may be font size related
		return this.innerMorph().bounds().height - this.bounds().height + 10;
	},

    getScrollPosition: function() {         
        var slideRoom = this.slideRoom();
		// note that inner morph may have exactly the same size as outer morph so slideRoom may be zero
        return slideRoom && -this.innerMorph().position().y/slideRoom; 
    },
    
    setScrollPosition: function(scrollPos) { 
		// this.adjustForNewBounds();
        this.innerMorph().setPosition(pt(this.innerMorph().position().x, -this.slideRoom()*scrollPos )); 
		if (this.scrollBar)
        	this.getScrollBar().adjustForNewBounds();

    },

    getVisibleExtent: function(scrollPos) {
        return Math.min(1, this.bounds().height / Math.max(10, this.innerMorph().bounds().height)); 
    },
    
    scrollToTop: function() {
        this.setScrollPosition(0);
		if (this.scrollBar)
        	this.getScrollBar().adjustForNewBounds(); 
    },

    scrollToBottom: function() {
        this.setScrollPosition(1);
		if (this.scrollBar)
        	this.getScrollBar().adjustForNewBounds(); 
    },

    scrollRectIntoView: function(r) {
        var im = this.innerMorph();
        if (!r || !im) return;
        var bnds = this.innerBounds();
		var yToView = r.y + im.getPosition().y;  // scroll down if above top
        if (yToView < bnds.y) {
            im.moveBy(pt(0, bnds.y - yToView));
			if (this.scrollBar)
            	this.getScrollBar().adjustForNewBounds();
            return;
        }
        var yToView = r.y + r.height + im.getPosition().y;  // scroll up if below bottom
        var tweak = 5;  // otherwise it doesnt scroll up enough to look good
        if (yToView > bnds.maxY() - tweak) {
            im.moveBy(pt(0, bnds.maxY() - tweak - yToView))
            if (this.scrollBar)
				this.getScrollBar().adjustForNewBounds();
        }
    },
    
    adjustForNewBounds: function ($super) {
        // Compute new bounds for clipMorph and scrollBar
        $super();
        if (!this.clipMorph) return;
        var bnds = this.innerBounds();    	
  		var clipR = bnds.insetBy(1);
		if (this.scrollBar) {
			clipR = this.calcClipR();
		};
        this.clipMorph.setExtent(clipR.extent());
        
		// Yeah, I'm completely baffled. There's a broken line of code, commented out, with
		// a comment saying *why* it's broken, and then an uncommented exact copy of that
		// line of code. Commenting out the second version. -- Adam
		//this.innerMorph().setExtent(clipR.extent());
		// WebCards commented this out: //this destroyes the content. i don't like that (Julius)
		//this.innerMorph().setExtent(clipR.extent()); 
		
        var barBnds = bnds.withTopLeft(clipR.topRight());
        if (this.menuButton) {
            var w = this.scrollBarWidth;
            this.menuButton.setPosition(barBnds.topLeft());
            //this.menuButton.setBounds(barBnds.topLeft().extent(pt(w, w)));
            barBnds = barBnds.withTopLeft(barBnds.topLeft().addXY(0, w));
        }
		if (this.scrollBar)
        	this.getScrollBar().setBounds(barBnds);
    },

});

// added by Adam
ScrollPane.prototype._layout = {
  possiblyDoSomethingBecauseASubmorphMinimumExtentHasChanged: function (scrollPane) {
    scrollPane.forceLayoutRejiggering();
    return true;
  },

  rejigger: function (scrollPane, availableSpace) {
    var r = scrollPane.rejiggerJustMyLayout(availableSpace);
    scrollPane.adjustForNewBounds();
    return r;
  },
  
  isAffectedBy: function (operation, morph) {
    return false;
  },
};

Global.newListPane = function(initialBounds) {
    return new ScrollPane(new CheapListMorph(initialBounds,["-----"]), initialBounds); 
};

Global.newTextListPane = function(initialBounds) {
    return new ScrollPane(new TextListMorph(initialBounds, ["-----"]), initialBounds); 
};

Global.newRealListPane = function(initialBounds, suppressSelectionOnUpdate) {
    return new ScrollPane(new ListMorph(initialBounds, ["-----"], null, null, suppressSelectionOnUpdate), initialBounds); 
};

Global.newDragnDropListPane = function(initialBounds, suppressSelectionOnUpdate) {
    return new ScrollPane(new FilterableListMorph(initialBounds, ["-----"], null, null, suppressSelectionOnUpdate), initialBounds); 
};

Global.newTextPane = function(initialBounds, defaultText) {
	var useChangeClue = true;
    return new ScrollPane(new TextMorph(initialBounds, defaultText, useChangeClue), initialBounds); 
};

Global.newPrintPane = function(initialBounds, defaultText) {
    return new ScrollPane(new PrintMorph(initialBounds, defaultText), initialBounds); 
};

Global.newXenoPane = function(initialBounds) {
    return new ScrollPane(new XenoMorph(initialBounds.withHeight(1000)), initialBounds);
}

// ===========================================================================
// Utility widgets
// ===========================================================================

/**
 * @class ColorPickerMorph
 */ 
BoxMorph.subclass("ColorPickerMorph", {


    style: { borderWidth: 1, fill: null, borderColor: Color.black},
    formals: ["+Color"],

    initialize: function($super, initialBounds, targetMorph, setFillName, popup) {
        $super(initialBounds);
        this.targetMorph = targetMorph;
        this.setFillFunctionName = setFillName; // name like "setBorderColor"
        if (targetMorph != null) this.connectModel({model: targetMorph, setColor: setFillName});
        this.colorWheelCache = null;
        this.isPopup = popup; 
        this.buildView();
        return this;
    },

    buildView: function() {
        // Slow -- should be cached as a bitmap and invalidated by layoutChanged
        // Try caching wheel as an interim measure
        var r = this.shape.bounds().insetBy(this.getBorderWidth());
        var rh2 = r.height/2;
        var dd = 2; // grain for less resolution in output (input is still full resolution)
	var content = this.addMorph(Morph.makeRectangle(this.shape.bounds()));
	content.ignoreEvents();
	content.setShape(new lively.scene.Group()); // Group isn't really a shape

        //DI: This could be done with width*2 gradients, instead of width*height simple fills
        //    For now it seems to perform OK at 2x granularity, and actual color choices 
        //    are still full resolution
        for (var x = 0; x < r.width; x += dd) {
            for (var y = 0; y < r.height; y += dd) { // lightest down to neutral
                var element = new lively.scene.Rectangle(new Rectangle(x + r.x, y + r.y, dd, dd));
		element.setFill(this.colorMap(x, y, rh2, this.colorWheel(r.width + 1)));
		element.setStrokeWidth(0);
                // element.setAttributeNS("fill", this.colorMap(x, rh2, rh2, this.colorWheel(r.width + 1)).toString());
		content.shape.add(element);
            }
        }
    },

    colorMap: function(x,y,rh2,wheel) {
        var columnHue = wheel[Math.round(x)];
        if (y <= rh2) return columnHue.mixedWith(Color.white, y/rh2); // lightest down to neutral
        else return Color.black.mixedWith(columnHue, (y - rh2)/rh2);  // neutral down to darkest
    },

    colorWheel: function(n) { 
        if (this.colorWheelCache && this.colorWheelCache.length == n) return this.colorWheelCache;
        console.log("computing wheel for " + n);
        return this.colorWheelCache = Color.wheelHsb(n,338,1,1);
    },

    handlesMouseDown: function(evt) { return !evt.isCommandKey() && evt.isLeftMouseButtonDown() },

    onMouseDown: function(evt) {
        return this.onMouseMove(evt);
    },

    onMouseUp: function(evt) {
        if (!this.isPopup) return;
        this.remove();
    },

    onMouseMove: function(evt) {
        if (evt.mouseButtonPressed) { 
            var r = this.bounds().insetBy(this.getBorderWidth());
            r = pt(0,0).extent(r.extent());
            var rh2 = r.height/2;
            var wheel = this.colorWheel(r.width+1);
            var relp = r.constrainPt(this.localize(evt.mousePoint).addXY(-2,-2));
            // console.log('mp = ' + Object.inspect(this.localize(evt.mousePoint)) + ' / relp = ' + Object.inspect(relp));
            var selectedColor = this.colorMap(relp.x,relp.y,rh2,wheel);
            this.setColor(selectedColor);
        } 
    }
    
});

BoxMorph.subclass('XenoMorph', {

    documentation: "Contains a foreign object, most likely XHTML",
    style: { borderWidth: 0, fill: Color.gray.lighter() },

    initialize: function($super, bounds) { 
        $super(bounds);
        this.foRawNode = NodeFactory.createNS(Namespace.SVG, "foreignObject", 
                             {x: bounds.x, y: bounds.y, 
                              width: bounds.width,
                              height: bounds.height });

        //this.foRawNode.appendChild(document.createTextNode("no content, load an URL"));
		//this.foRawNode.appendChild(NodeFactory.createNS(null, 'input', {type: 'text', name: '?', size: 20})); // commented out by Adam
        this.addNonMorph(this.foRawNode);
	      this.adjustForNewBounds(); // added by Adam
    },

    onURLUpdate: function(url) {
	if (!url) return;
	var xeno = this;
	function clearChildren(node) {
	    while(node.firstChild) node.removeChild(node.firstChild);
	}
	var callback = Object.extend(new NetRequestReporter(), {
	    setContent: function(doc) {
		clearChildren(xeno.foRawNode);
		xeno.foRawNode.appendChild(document.adoptNode(doc.documentElement));
	    },
	    setContentText: function(txt) {
		clearChildren(xeno.foRawNode);
		xeno.foRawNode.appendChild(document.createTextNode(txt));
	    }
	});
        var req = new NetRequest({model: callback, setResponseXML: "setContent", setResponseText: "setContentText"});
        req.setContentType("text/xml");
        req.get(url);
    },

    adjustForNewBounds: function($super) {
        $super();
        var bounds = this.shape.bounds();
		// console.log("bounds " + bounds + " vs " + bounds.width + "," + bounds.height);
		
		// following lines uncommented out or added by Adam
        this.foRawNode.setAttributeNS(null, "x", bounds.x);
        this.foRawNode.setAttributeNS(null, "y", bounds.y);
		this.foRawNode.x = bounds.x;
		this.foRawNode.y = bounds.y;
        this.foRawNode.setAttributeNS(null, "width", bounds.width);
        this.foRawNode.setAttributeNS(null, "height", bounds.height);
		this.foRawNode.width = bounds.width;
		this.foRawNode.height = bounds.height;
    }

});

XenoMorph.subclass('VideoMorph', {
	
	useExperimentalRotation: false,

	onDeserialize: function() {
		var foreign = $A(this.rawNode.childNodes).select(function(ea) {
			return ea.tagName == 'foreignObject' && ea !== this.foRawNode}, this);
		foreign.forEach(function(ea) { this.rawNode.removeChild(ea) }, this);
	},

	initialize: function($super, bounds) { 
	$super(bounds || new Rectangle(0,0,100,100));
	this.applyStyle({fillOpacity: 0.6, borderColor: Color.black, borderWidth: 1});
    },

openExample: function(worldOrNil) {
	var thisMorph = this;
	//require('lively.Helper').toRun(function() {  // for stringToXML
	thisMorph.embedVideo('<object width="425" height="344"><param name="movie" value="http://www.youtube.com/v/gGw09RZjQf8&hl=en&fs=1"></param><param name="allowFullScreen" value="true"></param><param name="allowscriptaccess" value="always"></param><embed src="http://www.youtube.com/v/gGw09RZjQf8&hl=en&fs=1" type="application/x-shockwave-flash" allowscriptaccess="always" allowfullscreen="true" width="425" height="344"></embed></object>');
	//});
	this.translateBy(pt(85, 85));
	this.updateCSS();
	(worldOrNil || WorldMorph.current()).addMorph(this);
},


	interactivelyEmbedVideo: function() {
		var w = WorldMorph.current();
		w.prompt('Paste HTML or URL below.', this.embedVideoOrStream.bind(this));
	},
	
	embedVideoOrStream: function(input) {
		if (input.startsWith('http'))
			this.embedStream(input);
		else
			this.embedVideo(input);
	},
	
	embedVideo: function(stringifiedHTML) {
		if (!stringifiedHTML) return;
		console.log('Embedding video...');
		this.foRawNode.removeChild(this.foRawNode.firstChild);
		stringifiedHTML = stringifiedHTML.replace(/[\n\r]/, ' ');
		var url = this.extractURL(stringifiedHTML);
		var extent = this.extractExtent(stringifiedHTML);
		var node = this.objectNodeFromTemplate(url, extent);
		this.foRawNode.appendChild(node);
		this.setExtent(extent);
	},
	
	embedMov: function(name) {
      console.log('Embedding mov...');
      this.foRawNode.removeChild(this.foRawNode.firstChild);
      var extent = this.getExtent();
      var node = this.objectNodeForMovFromTemplate(name, extent);
      this.foRawNode.appendChild(node);
      this.setExtent(extent);
    },

	embedStream: function(name) {
      console.log('Embedding Stream...');
      this.foRawNode.removeChild(this.foRawNode.firstChild);
      var extent = this.getExtent();
      var node = this.objectNodeForStreamFromTemplate(name, extent);
      this.foRawNode.appendChild(node);
      this.setExtent(extent);
    },

	objectNodeForStreamFromTemplate: function(url, extent) {
		// get filename: rtsp://localhost:554/mystream.sdp --> mystream
		var movieName = /.*\/([a-zA-Z0-9]+)(\.sdp)?/.exec(url)[1];
		var name = movieName + '.mov';
		var string = Strings.format('<body xmlns="http://www.w3.org/1999/xhtml"><embed src="%s" qtsrc="%s" type="video/quicktime" width="%s" height="%s" autoplay="false" controller="true"/></body>', name, url, extent.x, extent.y);
		var node = document.adoptNode(stringToXML(string));
		return node;		
	},
			
	objectNodeForMovFromTemplate: function(name, extent) {
	var string = Strings.format('<body xmlns="http://www.w3.org/1999/xhtml"><embed src="%s" type="video/quicktime" width="%s" height="%s" autoplay="false" controller="true"/></body>', name, extent.x, extent.y);
	var node = document.adoptNode(stringToXML(string));
	return node;
      },
	
objectNodeFromTemplate: function(url, extent) {
	url = url.toString().replace(/&/g, "&amp;");
	var string = '<body xmlns="http://www.w3.org/1999/xhtml">' + 
		'<object type="application/x-shockwave-flash" data="' + url + '">' +
		/*'<object type="application/x-shockwave-flash" style="width:'
			+ extent.x + 'px; height:' + extent.y + 'px;" data="' + url + '">' +*/
		'<param name="movie" value="' + url + '" />' +
		'</object>' + '</body>';
	var node = document.adoptNode(stringToXML(string));
	return node;
},
objectNode: function() {
	return  this.foRawNode.firstChild.firstChild;
},

extractURL: function(htmlString) {
	var regex = /[a-zA-Z]+:\/\/(?:[a-zA-Z0-9\.=&\?\;\_]+\/?)+/;
	var result = htmlString.match(regex);
	return result && result[0];
},
extractExtent: function(htmlString) {
	var regex = /.*width[=:]"([0-9]+)".*height[=:]"([0-9]+)".*/;
	var result = htmlString.match(regex);
	var extent = result && pt(Number(result[1]), Number(result[2]));
	return extent;
},



	
	handlesMouseDown: Functions.True, // Flash takes care
	
	adjustForNewBounds: function ($super) {
        // Compute scales of old submorph extents in priorExtent, then scale up to new extent
        $super();
		this.updateCSS();
    },
onMouseMove: function($super, evt, hasFocus) {
	if (this.getVideoBounds().containsPoint(evt.point())) return;
	$super(evt, hasFocus);
	this.updateCSS();
},

updateCSS: function() {
	var videoBnds = this.getVideoBounds();	
	if (this.useExperimentalRotation) {
	this.objectNode().setAttributeNS(null, 'style',
		Strings.format("position:absolute; left:%spx; top:%spx; width: %spx; height: %spx; -webkit-transform-origin: %spx %spx; -webkit-transform: rotate(%sdeg)",
			videoBnds.x,
			videoBnds.y,
			videoBnds.width,
			videoBnds.height,
			videoBnds.x,
			videoBnds.y,
			this.getRotation()*180/Math.PI
	));
	} else {
	this.objectNode().setAttributeNS(null, 'style',
		Strings.format("position:absolute; left:%spx; top:%spx; width: %spx; height: %spx;",
			videoBnds.x,
			videoBnds.y,
			videoBnds.width,
			videoBnds.height
	));
	}
},

getVideoBounds: function() {
	var margin = 20;
	var gt = this.getGlobalTransform();
	return gt.transformRectToRect(this.innerBounds().insetBy(margin));
},

});

Object.extend(VideoMorph, {
	openAndInteractivelyEmbed: function(pos) {
		require('lively.Helper').toRun(function() { // for stringToXML
			var v = new VideoMorph();
			v.setPosition(pos);
			v.openInWorld();
			v.interactivelyEmbedVideo();
		});
	},
	openStream: function(url) {
		require('lively.Helper').toRun(function() { // for stringToXML
			var m = new VideoMorph(new Rectangle(0,0,360,300));
			m.openInWorld();
			m.embedStream(url);
		});
	}
});

// most likely deprecated, should use Widget, which is a view.
Model.subclass('WidgetModel', {

    viewTitle: "Widget",
    initialViewExtent: pt(400, 300),

    openTriggerVariable: 'all',
    documentation: "Convenience base class for widget models",
    
    getViewTitle: function() { // a string or a TextMorph
        return this.viewTitle;
    },

    buildView: function(extent) {
        throw new Error("override me");
    },

    getInitialViewExtent: function(world, hint) {
        return hint || this.initialViewExtent;
    },
    
    openIn: function(world, loc) {
        var win = 
	    world.addFramedMorph(this.buildView(this.getInitialViewExtent(world)), 
				 this.getViewTitle(), loc);
        if (this.openTriggerVariable) {
            this.changed(this.openTriggerVariable);
        }
        return win;
    },

    open: function() { // call interactively
        return this.openIn(WorldMorph.current());
    }

});

lively.data.Wrapper.subclass('Widget', ViewTrait, { // FIXME remove code duplication

    viewTitle: "Widget",
    initialViewExtent: pt(400, 300),
    initialViewPosition: pt(50, 50),
    documentation: "Nonvisual component of a widget",
    useLightFrame: false,
    
       noShallowCopyProperties: ['id', 'rawNode',  'formalModel', 'actualModel', '__annotation__'], // __annotation__ added by Adam


    getViewTitle: function() { // a string or a TextMorph
        return this.viewTitle;
    },

    buildView: function(extent, model) {
        throw new Error("override me");
    },

    getInitialViewExtent: function(world, hint) {
        return hint || this.initialViewExtent;
    },
    
    viewMenu: function(items) {
	// Default function passes through all view items if not overridden by a given application
        return items;
    },
    
    openIn: function(world, optLoc) {
	var view = this.buildView(this.getInitialViewExtent(world), this.getModel());
	view.ownerWidget = this; // for remembering the widget during serialization...
	return world.addFramedMorph(view, this.getViewTitle(), optLoc, this.useLightFrame);
    },
    
	ownModel: function(model) {
		this.actualModel = model;
		// get rid of old model rawNodes
		$A(this.rawNode.childNodes).each(function(ea){
			if(ea.tagName == "record") {
				this.rawNode.removeChild(ea);
			}
		}, this)
		if (model.rawNode instanceof Node) {
			this.rawNode.appendChild(model.rawNode);
		}
    },

    open: function() { // call interactively
        return this.openIn(WorldMorph.current());
    },

    initialize: function($super, plug) {
	$super();
	this.rawNode = NodeFactory.create("widget");
	this.setId(this.newId());
        if (plug) this.connectModel(plug);
    },

    parentWindow: function(view) {
	var parent = view.owner;
	while (parent && !(parent instanceof WindowMorph)) {
	    parent = parent.owner;
	}
	return parent;
    },
      
    restoreFromSubnodes: function(importer) {
        
        // Todo: move common parts to super class wrapper
        var children = [];
        var helperNodes = [];
        
        children = this.rawNode.childNodes;
        
        for (var i = 0; i < children.length; i++) {
            var node = children[i];
            switch (node.localName) {
                // nodes from the Lively namespace
                case "field": {
                    helperNodes.push(node);
                    this.deserializeFieldFromNode(importer, node);      
                    break;
                }
                case "widget": {
                    this.deserializeWidgetFromNode(importer, node);
                    break;
                }
                case "array": {
                    helperNodes.push(node);
                    this.deserializeArrayFromNode(importer, node);
                    break;
                }
                case "relay": {
                    this.deserializeRelayFromNode(importer, node);
                    break;
                }
                case "record": {
                    this.deserializeRecordFromNode(importer, node);
                    break;
                }
                default: {
                    if (node.nodeType === Node.TEXT_NODE) {
                        console.log('text tag name %s', node.tagName);
                        // whitespace, ignore
                    } else if (!this.restoreFromSubnode(importer, node)) {
                        console.warn('not handling %s, %s', node.tagName || node.nodeType, node.textContent);
                    }
                }
            }
        } // end for

        for (var i = 0; i < helperNodes.length; i++) {
            var n = helperNodes[i];
            n.parentNode.removeChild(n);
        }
    },

	copyFrom: function($super, copier, other) {
		$super(copier, other);
		LivelyNS.setType(this.rawNode, this.getType());
    	this.setId(this.newId());
		copier.addMapping(other.id(), this); 
		
		copier.smartCopyProperty("formalModel", this, other);
		copier.smartCopyProperty("actualModel", this, other);
		if (this.actualModel)
			this.ownModel(this.actualModel);
	
		copier.shallowCopyProperties(this, other);

		
		return this;
	}
});

Widget.subclass('Dialog', {
    inset: 10,
    style: { borderColor: Color.blue, borderWidth: 4, borderRadius: 16,
             fill: Color.blue.lighter(), opacity: 0.9},
    useLightFrame: true,
    viewTitle: "",
    removeTopLevel: function() {
        (this.parentWindow(this.panel) || this.panel).remove();
    },

    openIn: function($super, world, position) {
	var view = $super(world, position);
	if (position)  // slight usability improvement
	    view.align(view.bounds().center(), position);
	if (this.label) {
		var newWidth = Math.max(view.getExtent().x, this.label.getExtent().x + 20);
		view.setExtent(pt(newWidth, view.getExtent().y));
	}
	return view;

    },
    
});

Dialog.subclass('ConfirmDialog', {

	formals: [	"+Result",  // yes or no, listen for updates
				"-Message"], // what to display
	initialViewExtent: pt(300, 90),
    
	openIn: function($super, world, position) {
		var view = $super(world, position);
		world.firstHand().setKeyboardFocus(view.targetMorph.submorphs[1]);
		return view;

	},

	cancelled: function(value, source) {
		this.removeTopLevel();
		if (value == false) this.setResult(false);
	},

	confirmed: function(value, source) {
		this.removeTopLevel();
		if (value == true) this.setResult(true);
	},

	buildView: function(extent, model) {
		var panel = new PanelMorph(extent);
		this.panel = panel;
		panel.linkToStyles(["panel"]);

		var r = new Rectangle(this.inset, this.inset, extent.x - 2*this.inset, 30);
		this.label = panel.addMorph(new TextMorph(r, this.getMessage()).beLabel());

		var indent = extent.x - 2*70 - 3*this.inset;

		r = new Rectangle(r.x + indent, r.maxY() + this.inset, 70, 30);
		var yesButton = panel.addMorph(new ButtonMorph(r)).setLabel("Yes");
		yesButton.connectModel({model: this, setValue: "confirmed"});

		r = new Rectangle(r.maxX() + this.inset, r.y, 70, 30);
		var noButton = panel.addMorph(new ButtonMorph(r)).setLabel("No");
		noButton.connectModel({model: this, setValue: "cancelled"});
		return panel;
	}
});

Dialog.subclass('PromptDialog', {

    formals: ["-Message", "Input", "+Result"],
    initialViewExtent: pt(300, 130),

    openIn: function($super, world, loc) {
        var view = $super(world, loc);
        view.targetMorph.inputLine.requestKeyboardFocus(world.firstHand());
        return view;
    },

    onInputUpdate: function(input) { this.confirmed(true) },

    cancelled: function(value) {
        if (value == false) return;
        this.removeTopLevel();
		this.setResult(false);
    },
    
    confirmed: function(value) {
        if (value == false) return;
		if (this.getInput() != this.panel.inputLine.textString)
			this.panel.inputLine.doSave();
        this.removeTopLevel();
		this.setResult(true);
    },

	buildView: function(extent, model) {
		var panel = new PanelMorph(extent);
		this.panel = panel;
		panel.linkToStyles(["panel"]);


		var r = new Rectangle(this.inset, this.inset, extent.x - 2*this.inset, 30);
		this.label = panel.addMorph(new TextMorph(r, this.getMessage()).beLabel());

		r = new Rectangle(r.x, r.maxY() + this.inset, r.width, r.height);

		panel.inputLine = panel.addMorph(new TextMorph(r, "").beInputLine());

		panel.inputLine.connectModel({model: this, getText: "getInput", setText: "setInput"});
		// FIXME is this necessary
		if (this.getInput()) panel.inputLine.updateTextString(this.getInput());

		var indent = extent.x - 2*70 - 3*this.inset;
		r = new Rectangle(r.x + indent, r.maxY() + this.inset, 70, 30);
		var okButton = panel.addMorph(new ButtonMorph(r)).setLabel("OK");

		okButton.connectModel({model: this, setValue: "confirmed"});
		r = new Rectangle(r.maxX() + this.inset, r.y, 70, 30);
		var cancelButton = panel.addMorph(new ButtonMorph(r)).setLabel("Cancel");
		cancelButton.connectModel({model: this, setValue: "cancelled"});
		return panel;
	},

});

PromptDialog.test = function() {
    return WorldMorph.current().prompt("what", function(value) { alert('got input ' + value) });
}

Widget.subclass('ConsoleWidget', {

	viewTitle: "Console",
	formals: ["LogMessages", "RecentLogMessages", "Commands", "CommandCursor", "LastCommand", "Menu", "Capacity"],
	ctx: {},
	
	initialize: function($super, capacity) {
		$super(null);

		
		// BEWARE don't use newNodeInstance, because it causes problems with serializing Menu
		// but I do it anyway.... lets fix this!
		var model = Record.newNodeInstance({LogMessages: [], RecentLogMessages: [], Commands: [], 
			CommandCursor: 0,  LastCommand: "", Capacity: capacity,
			Menu: [
				["command history", this, "addCommandHistoryInspector"],
				["clear", this, "clearList"]
			]});
		
		this.relayToModel(model, {LogMessages: "LogMessages",
				  RecentLogMessages: "+RecentLogMessages",
				  Commands: "Commands",
				  LastCommand: "LastCommand",
				  Menu: "Menu",
				  Capacity: "-Capacity"});
		
		this.ownModel(model);


		Global.console.consumers.push(this); 
		this.ans = undefined; // last computed value
		return this;
	},

	onDeserialize: function() {
		this.clearList();
		Global.console.consumers.push(this);
	},

	clearList: function() {
		this.setLogMessages([]);
		// hack to find the real solution...
		if (this.panel) {
			this.panel.messagePane.adjustForNewBounds();
		}
	},

	addCommandHistoryInspector: function() {
		WorldMorph.current().addTextListWindow({
			extent:pt(500, 40),
			content: this.getCommands([]),
			title: "Command history"
		});
	},

	getInitialViewExtent: function(world, hint) {
		return hint || pt(world.viewport().width - 200, 160); 
	},
	
	buildView: function(extent) {
		var panel = PanelMorph.makePanedPanel(extent, [
			['messagePane', newTextListPane, new Rectangle(0, 0, 1, 0.8)],
			['commandLine', TextMorph, new Rectangle(0, 0.8, 1, 0.2)]
		]);
		panel.ownerWidget = this; // to serialize the widget
		this.panel = panel;

		panel.commandLine.suppressHandles = true;

		var model = this.getModel();
		var m = panel.messagePane;
	
		m.relayToModel(model, {List: "-LogMessages", ListDelta: "RecentLogMessages", 
				   Capacity: "-Capacity", Menu: "-Menu"});
	
		m.innerMorph().focusHaloBorderWidth = 0;
	
		var self = this;
		panel.shutdown = function() {
			Class.getPrototype(this).shutdown.call(this);
			var index = window.console.consumers.indexOf(self);
			if (index >= 0) {
				window.console.consumers.splice(index);
			}
		};

		m = panel.commandLine.beInputLine(100);
		m.relayToModel(model, { History: "-Commands", HistoryCursor: "CommandCursor", Text: "LastCommand"});
		return panel;
	},

	evaluate: function(string){
		var result = this.panel.commandLine.tryBoundEval(string)
		return result
	},
	
	onLogMessagesUpdate: function() {
		// do nothing... onDeserialize seem to need it
	},

	onLastCommandUpdate: function(text) {
		if (!text) return;
		try {
			var ans = this.evaluate(text);
			if (ans !== undefined) this.ans = ans;
		var command = Object.inspect(ans);
		this.setRecentLogMessages([command]);
		} catch (er) {
		dbgOn(true);
			alert("Whoa Evaluation error: "	 + er);
		}
	},
	
	log: function(message) {
		this.setRecentLogMessages([message]);
	}
	
});


Widget.subclass('XenoBrowserWidget', {
    
    initialViewExtent: pt(800, 300),

    initialize: function($super, filename) {
	var url = filename ? URL.source.withFilename(filename) : null;
	this.actualModel = Record.newPlainInstance({URL: url});
	$super();
    },
    
    buildView: function(extent) {
	var panel = PanelMorph.makePanedPanel(extent, [
	    ['urlInput', TextMorph, new Rectangle(0, 0, 1, 0.1)],
	    ['contentPane', newXenoPane, new Rectangle(0, 0.1, 1, 0.9)]
	]);
	var model = this.actualModel;
	
	panel.urlInput.beInputLine();
	panel.urlInput.connectModel(model.newRelay({Text: { name: "URL", to: URL.create, from: String }}), true);
	panel.contentPane.connectModel(model.newRelay({URL: "-URL"}), true);
	
	return panel;
    }
});
    

// ===========================================================================
// Window widgets
// ===========================================================================


BoxMorph.subclass("TitleBarMorph", {

    documentation: "Title bar for WindowMorphs",

    controlSpacing: 3,
    barHeight: 22,
    shortBarHeight: 15,
    style: {borderWidth: 0, fill: null},
    labelStyle: { borderRadius: 8, padding: Rectangle.inset(6, 2), 
		  fill: lively.paint.LinearGradient([new lively.paint.Stop(0, Color.white),
						     new lively.paint.Stop(1, Color.gray)])
		},
    
    initialize: function($super, headline, windowWidth, windowMorph, optSuppressControls) {
	if (optSuppressControls)  {  // for dialog boxes
	  this.suppressControls = true;
	  this.barHeight = this.shortBarHeight;
  }
	var bounds = new Rectangle(0, 0, windowWidth, this.barHeight);
	
        $super(bounds);
	
	// contentMorph is bigger than the titleBar, so that the lower rounded part of it can be clipped off
	// arbitrary paths could be used, but FF doesn't implement the geometry methods :(
	// bounds will be adjusted in adjustForNewBounds()
	var contentMorph = Morph.makeRectangle(bounds);
	this.addMorph(new ClipMorph(bounds)).addMorph(contentMorph);
	contentMorph.linkToStyles(["titleBar"]);
	this.ignoreEvents();
	contentMorph.ignoreEvents();
	contentMorph.owner.ignoreEvents();
	this.contentMorph = contentMorph;
	
        this.windowMorph = windowMorph;

	    
        // Note: Layout of submorphs happens in adjustForNewBounds (q.v.)
        var label;
        if (headline instanceof TextMorph) {
	    label = headline;
        } else if (headline != null) { // String
	    // wild guess headlineString.length * 2 *  font.getCharWidth(' ') + 2;
	    var width = headline.length * 8; 
	    label = new TextMorph(new Rectangle(0, 0, width, this.barHeight), headline).beLabel();
        }
        label.applyStyle(this.labelStyle);
        this.label = this.addMorph(label);
	if (!this.suppressControls) {
            var cell = new Rectangle(0, 0, this.barHeight, this.barHeight);
            this.closeButton =  this.addMorph(new WindowControlMorph(cell, this.controlSpacing, Color.primary.orange));
	    this.menuButton = this.addMorph(new WindowControlMorph(cell, this.controlSpacing, Color.primary.blue));
            this.collapseButton = this.addMorph(new WindowControlMorph(cell, this.controlSpacing, Color.primary.yellow));
	    this.connectButtons(windowMorph);
	} 
        this.adjustForNewBounds();  // This will align the buttons and label properly
        return this;
    },
    
    connectButtons: function(w) {
      if (this.suppressControls) return;
	this.closeButton.relayToModel(w, {HelpText: "-CloseHelp", Trigger: "=initiateShutdown"});
	this.menuButton.relayToModel(w, {HelpText: "-MenuHelp", Trigger: "=showTargetMorphMenu"});
	this.collapseButton.relayToModel(w, {HelpText: "-CollapseHelp", Trigger: "=toggleCollapse"});
    },

    
    onDeserialize: function() {
        this.connectButtons(this.windowMorph);
    },

    acceptsDropping: function(morph) {
        //console.log('accept drop from %s of %s, %s', this, morph, morph instanceof WindowControlMorph);
        return morph instanceof WindowControlMorph; // not used yet... how about text...
    },

    highlight: function(trueForLight) {
	var gfx = lively.paint;
	this.label.setFill(trueForLight ? new gfx.LinearGradient([new gfx.Stop(0, Color.white), 
								  new gfx.Stop(1, Color.lightGray)]) : null);
    },

    okToBeGrabbedBy: function(evt) {
        var oldTop = this.world().topSubmorph();
	if (oldTop instanceof WindowMorph) oldTop.titleBar.highlight(false);
        return this.windowMorph;
    },

    adjustForNewBounds: function($super) {
	var innerBounds = this.innerBounds();
	var sp = this.controlSpacing;
        $super();
        var loc = this.innerBounds().topLeft().addXY(sp, sp);
        var l0 = loc;
        var dx = pt(this.barHeight - sp, 0);
        if (this.menuButton) { 
	    this.menuButton.setPosition(loc);  
	    loc = loc.addPt(dx); 
	}
        if (this.label) {
            this.label.align(this.label.bounds().topCenter(), this.innerBounds().topCenter());
            if (this.label.bounds().topLeft().x < loc.x) {
                this.label.align(this.label.bounds().topLeft(), loc.addXY(0,-3));
            }
        }
	if (this.closeButton) { 
	    loc = this.innerBounds().topRight().addXY(-sp - this.closeButton.shape.bounds().width, sp);
	    this.closeButton.setPosition(loc);  
	    loc = loc.subPt(dx); 
	}
        if (this.collapseButton) { 
	    this.collapseButton.setPosition(loc);  
	    //loc = loc.subPt(dx); 
	}
	
	
	var style = this.styleNamed("titleBar");
	var w = style.borderWidth;
	var r = style.borderRadius;
	this.contentMorph.setBounds(new Rectangle(w/2, w/2, innerBounds.width, this.barHeight + r));
	var clip = this.contentMorph.owner;
	clip.setBounds(innerBounds.insetByRect(Rectangle.inset(-w/2, -w/2, -w/2, 0)));
    },
	
	setTitle: function(string) {
		this.label.setTextString(string);
		this.adjustForNewBounds();  // This will align the buttons and label properly
	},

    okToDuplicate: Functions.False

});

BoxMorph.subclass("TitleTabMorph", {

    documentation: "Title bar for tabbed window morphs",

    barHeight: 0,
    controlSpacing: 0,
    suppressHandles: true,
    
    styleClass: ['titleBar'],
    
    initialize: function($super, headline, windowWidth, windowMorph) {
        $super(Rectangle(0, 0, windowWidth, this.barHeight));
        this.windowMorph = windowMorph;
        this.applyLinkedStyles();
        this.ignoreEvents();

        var label;
        if (headline instanceof TextMorph) {
            label = headline;
        } else { // String
            var width = headline.length * 8;
            // wild guess headlineString.length * 2 *  font.getCharWidth(' ') + 2; 
            label = new TextMorph(new Rectangle(0, 0, width, this.barHeight), headline).beLabel();
        }
        var topY = this.shape.bounds().y;
        label.align(label.bounds().topLeft(), pt(0,0));
        this.label = this.addMorph(label);
        this.shape.setBounds(this.shape.bounds().withTopRight(pt(label.bounds().maxX(), topY)));
        return this;
    },

    okToBeGrabbedBy: function(evt) {
        return this;
    },

    handlesMouseDown: Functions.True,

    onMouseDown: Functions.Empty,

    onMouseUp: function(evt) {
        this.windowMorph.toggleCollapse();
    },

    highlight: TitleBarMorph.prototype.highlight

});

Morph.subclass("WindowControlMorph", {

    documentation: "Event handling for Window morphs",

    style: {borderWidth: 0},
    
    focus: pt(0.4, 0.2),
    formals: ["-HelpText", "-Trigger"],
    
    initialize: function($super, rect, inset, color) {
        $super(new lively.scene.Ellipse(rect.insetBy(inset)));
	var gfx = lively.paint;
        this.setFill(new gfx.RadialGradient([new gfx.Stop(0, color.lighter(2)),
					     new gfx.Stop(0.5, color),
					     new gfx.Stop(1, color.darker())], this.focus));
        return this;
    },

    handlesMouseDown: Functions.True,

    onMouseDown: function($super, evt) {
        $super(evt);
	// interesting case for the MVC architecture
        return this.formalModel.onTriggerUpdate(evt);
    },

    onMouseOver: function($super, evt) {
        var prevColor = this.getFill().stops[1].color();
	var gfx = lively.paint;
        this.setFill(new gfx.RadialGradient([new gfx.Stop(0, Color.white), 
					     new gfx.Stop(0.5, prevColor),
					     new gfx.Stop(1, prevColor.darker())], this.focus));
        $super(evt);
    },
    
    onMouseOut: function($super, evt) {
        var prevColor = this.getFill().stops[1].color();
	var gfx = lively.paint;
        this.setFill(new gfx.RadialGradient([new gfx.Stop(0, prevColor.lighter(2)),
					     new gfx.Stop(0.5, prevColor),
					     new gfx.Stop(1, prevColor.darker())], this.focus));
        $super(evt);
    },
    
    checkForControlPointNear: Functions.False,
    
    okToBeGrabbedBy: Functions.Null

 
});

BoxMorph.subclass('StatusBarMorph', {

    style: { borderWidth: 0, fill: null},

    initialize: function($super, titleBar) {
	var bounds = titleBar.getExtent().extentAsRectangle().withHeight(8);
        $super(bounds);
	
	// contentMorph is bigger than the titleBar, so that the lower rounded part of it can be clipped off
	// arbitrary paths could be used, but FF doesn't implement the geometry methods :(
	// bounds will be adjusted in adjustForNewBounds()
	var contentMorph = Morph.makeRectangle(bounds.withHeight(bounds.height*2).withY(-bounds.height));
	this.addMorph(new ClipMorph(bounds.withHeight(bounds.height + 2).withWidth(bounds.width + 2))).addMorph(contentMorph);
	contentMorph.linkToStyles(["titleBar"]);
	
	this.ignoreEvents();
	contentMorph.ignoreEvents();
	contentMorph.owner.ignoreEvents();
	this.contentMorph = contentMorph;
        return this;
    },
    adjustForNewBounds: function ($super) {
        $super();
	var cm = this.contentMorph;
	if (cm) cm.setExtent(pt(this.bounds().width, cm.bounds().height))
    }
});


Morph.subclass('WindowMorph', {

    documentation: "Full-fledged windows with title bar, menus, etc.",
    state: 'expanded',
    titleBar: null,
    statusBar: null,
    targetMorph: null,
    style: {borderWidth: 0, fill: null, borderRadius: 0},
    
    initialize: function($super, targetMorph, headline, optSuppressControls) {
        var bounds = targetMorph.bounds();
        $super(new lively.scene.Rectangle(bounds));
        var titleBar = this.makeTitleBar(headline, bounds.width, optSuppressControls);
        var titleHeight = titleBar.bounds().height;
	this.setBounds(bounds.withHeight(bounds.height + titleHeight));
        this.targetMorph = this.addMorph(targetMorph);
        this.titleBar = this.addMorph(titleBar);
        this.contentOffset = pt(0, titleHeight - titleBar.getBorderWidth()/2); // FIXME: hack
        targetMorph.setPosition(this.contentOffset);
        this.closeAllToDnD();
	this.collapsedTransform = null;
	this.collapsedExtent = null;
        this.expandedTransform = null;
	this.expandedExtent = null;
	this.ignoreEventsOnExpand = false;
	if (Config.useStatusBar) this.statusBar = this.addMorph(new StatusBarMorph(this.titleBar));
        // this.adjustForNewBounds();
        return this;
    },

    shadowCopy: function(hand) {
	// For now just make a rectangle, later add top rounding
	var copy = Morph.makeRectangle(this.getPosition().extent(this.getExtent()));
	copy.applyStyle({fill: Color.black, fillOpacity: 0.3, strokeOpacity: 0.3, borderRadius: 8});
	copy.pvtSetTransform(this.getTransform());
	return copy;
    },

    toString: function($super) {
        var label = this.titleBar && this.titleBar.label;
        return $super() + (label ? ": " + label.textString : ""); 
    },

    restorePersistentState: function($super, importer) {
        $super(importer);
	// remove the following:
        //this.contentOffset = pt(0, this.titleBar.bounds().height);
    },
    
    makeTitleBar: function(headline, width, optSuppressControls) {
        // Overridden in TabbedPanelMorph
        return new TitleBarMorph(headline, width, this, optSuppressControls);
    },

    windowContent: function() { return this.targetMorph; },
    
    immediateContainer: function() { return this;  },

    toggleCollapse: function() {
        return this.isCollapsed() ? this.expand() : this.collapse();
    },
    
    collapse: function() { 
        if (this.isCollapsed()) return;
        this.expandedTransform = this.getTransform();
	this.expandedExtent = this.getExtent();
	this.expandedPosition = this.position();
	this.ignoreEventsOnExpand = this.targetMorph.areEventsIgnored();
	this.targetMorph.ignoreEvents(); // unconditionally
	this.targetMorph.setVisible(false);
	var finCollapse = function () {
		this.setTransform(this.collapsedTransform  || this.expandedTransform);
        	this.state = 'collapsed';  // Set it now so setExtent works right
        	if (this.collapsedExtent) this.setExtent(this.collapsedExtent);
		this.shape.setBounds(this.titleBar.bounds());
		this.layoutChanged();
        	this.titleBar.highlight(false);
	}.bind(this);
	if(this.collapsedPosition && this.collapsedPosition.dist(this.position()) > 100)
			this.animatedInterpolateTo(this.collapsedPosition, 5, 50, finCollapse);
		else finCollapse();
    },
    
    expand: function() {
        if (!this.isCollapsed()) return;
        this.collapsedTransform = this.getTransform();
        this.collapsedExtent = this.innerBounds().extent();
	this.collapsedPosition = this.position();
        var finExpand = function () {	
		this.setTransform(this.expandedTransform); 
		this.targetMorph.setVisible(true);
		// enable events if they weren't disabled in expanded form
		if (!this.ignoreEventsOnExpand) this.targetMorph.enableEvents();
        	this.state = 'expanded';  // Set it now so setExtent works right
		if (this.expandedExtent) {
			this.setExtent(this.expandedExtent);
			this.shape.setBounds(this.expandedExtent.extentAsRectangle());
		}
		this.world().addMorphFront(this);  // Bring this window forward if it wasn't already
		this.layoutChanged();
        	this.takeHighlight();
	}.bind(this);
	if(this.expandedPosition && this.expandedPosition.dist(this.position()) > 100)
			this.animatedInterpolateTo(this.expandedPosition, 5, 50, finExpand);
		else finExpand();
    },

    isCollapsed: function() { return this.state === 'collapsed'; },

    getCloseHelp: function() { return "Close"; },

    getMenuHelp: function() { return "Menu"; },
    
    getCollapseHelp: function() { return this.isCollapsed() ? "Expand" : "Collapse"; },

    contentIsVisible: function() { return !this.isCollapsed(); },

    // Following methods promote windows on first click----------------
    morphToGrabOrReceive: function($super, evt, droppingMorph, checkForDnD) {
        // If this window is doesn't need to come forward, then respond normally
        if (!this.needsToComeForward(evt) || droppingMorph != null) {
            return $super(evt, droppingMorph, checkForDnD)
        }
        // Otherwise, hold mouse focus until mouseUp brings it to the top
        return this;
    },

    needsToComeForward: function(evt) {
        if (this.owner !== this.world()) return true; // weird case -- not directly in world
        if (!this.fullContainsWorldPoint(evt.point())) return false;  // not clicked in me
        if (this === this.world().topSubmorph()) return false;  // already on top
        if (this.isCollapsed()) return false;  // collapsed labels OK from below
        if (this.titleBar.fullContainsWorldPoint(evt.point())) return false;  // labels OK from below
        return true;  // it's in my content area
    },

    // Next four methods hold onto control until mouseUp brings the window forward.
    handlesMouseDown: function(evt) { return this.needsToComeForward(evt); },

    onMouseDown: Functions.Empty,

    onMouseMove: function($super, evt) {
        if (!evt.mouseButtonPressed) $super(evt);
    },    

    onMouseUp: function(evt) {
        // I've been clicked on when not on top.  Bring me to the top now
        this.takeHighlight()
        var oldTop = this.world().topSubmorph();
        this.world().addMorphFront(this);
        evt.hand.setMouseFocus(null);
	if(this.targetMorph.takesKeyboardFocus()) evt.hand.setKeyboardFocus(this.targetMorph);
        return true;
    },

    captureMouseEvent: function($super, evt, hasFocus) {
        if (!this.needsToComeForward(evt) && evt.mouseButtonPressed) {
            return $super(evt, hasFocus);
        }
        return this.mouseHandler.handleMouseEvent(evt, this); 
    },

    okToBeGrabbedBy: function(evt) {
        this.takeHighlight();
        return this; 
    },

    takeHighlight: function() {
        // I've been clicked on.  unhighlight old top, and highlight me
        var oldTop = this.world().topWindow();
	if (!oldTop.titleBar) return; // may be too early when in deserialization
        if (oldTop instanceof WindowMorph) oldTop.titleBar.highlight(false);
        this.titleBar.highlight(true);
    },
    // End of window promotion methods----------------

    isShutdown: function() { return this.state === 'shutdown'; },
    
    initiateShutdown: function() {
        if (this.isShutdown()) return;
        this.targetMorph.shutdown(); // shutdown may be prevented ...
        this.ensureIsNotInWorld(); // used to say this.remove(), changed by Adam so that it does the cool whooshing-off-the-screen thing
        this.state = 'shutdown'; // no one will ever know...
        return true;
    },
    
    showTargetMorphMenu: function(evt) { 
        var tm = this.targetMorph.morphMenu(evt);
        tm.replaceItemNamed("remove", ["remove", this, 'initiateShutdown']);
        tm.replaceItemNamed("reset rotation", ["reset rotation", this, 'setRotation', 0]);
        tm.replaceItemNamed("reset scaling", ["reset scaling", this, 'setScale', 1]);
        tm.removeItemNamed("duplicate");
        tm.removeItemNamed("turn fisheye on");
        tm.openIn(this.world(), evt.mousePoint, false, this.targetMorph.inspect().truncate()); 
    },

    reshape: function($super, partName, newPoint, lastCall) {
	// Minimum size for reshap should probably be a protoype var
	var r = this.innerBounds().withPartNamed(partName, newPoint);
	var maxPoint = r.withExtent(r.extent().maxPt(pt(100,120))).partNamed(partName);
	return $super(partName, maxPoint, lastCall);
    },

    adjustForNewBounds: function ($super) {
        $super();
        if (!this.titleBar || !this.targetMorph) return;
        var titleHeight = this.titleBar.innerBounds().height;
        var bnds = this.innerBounds();
        var newWidth = bnds.width;
        var newHeight = bnds.height;
        this.titleBar.setExtent(pt(newWidth, titleHeight));
        this.titleBar.setPosition(bnds.topLeft());
	if (this.statusBar) {  // DI: this doesn't track reframing...
	    this.statusBar.setPosition(pt(0, this.isCollapsed() ? titleHeight : bnds.height));
	    this.statusBar.setExtent(pt(newWidth, this.statusBar.innerBounds().height));
	}
        if (this.isCollapsed()) return;
        this.targetMorph.setExtent(pt(newWidth, newHeight - titleHeight));
        this.targetMorph.setPosition(bnds.topLeft().addXY(0, titleHeight));
    },

	setTitle: function(string) {
		this.titleBar.setTitle(string);
	}

});
   
// every morph should be able to get his window
// e.g. helper texts are created in the window, not in the world
Morph.addMethods({
    // KP: shouldn't this be replaced by Morph.immediateContainer?
    window: function(morph) {
        if(!this.owner) return this;
        return this.owner.window();
    },
});
   
   
WindowMorph.subclass("TabbedPanelMorph", {

    documentation: "Alternative to windows for off-screen content",

    initialize: function($super, targetMorph, headline, location, sideName) {
        // A TabbedPanelMorph is pretty much like a WindowMorph, in that it is intended to 
        // be a container for applications that may frequently want to be put out of the way.
        // With windows, you collapse them to their title bars, with tabbed panels, you
        // click their tab and they retreat to the edge of the screen like a file folder.
        this.sideName = sideName ? sideName : "south";
        $super(targetMorph, headline, location);
        this.applyStyle({fill: null, borderColor: null});
        this.newToTheWorld = true;
        this.setPositions();
        this.moveBy(this.expandedPosition.subPt(this.position()));
        return this;
    },

    setPositions: function() {
        // Compute the nearest collapsed and expanded positions for side tabs
        var wBounds = WorldMorph.current().shape.bounds();
        if (this.sideName == "south") {
            var edgePt = this.position().nearestPointOnLineBetween(wBounds.bottomLeft(), wBounds.bottomRight());
            this.collapsedPosition = edgePt.subPt(this.contentOffset);  // tabPosition
            this.expandedPosition = edgePt.addXY(0,-this.shape.bounds().height);
        }
    },

    makeTitleBar: function(headline, width) {
        return new TitleTabMorph(headline, width, this);
    }

});


Morph.subclass("PieMenuMorph", {

	documentation: "Fabrik-style gesture menus for fast one-button UI",

	initialize: function($super, items, targetMorph, offset, clickFn) {
		// items is an array of menuItems, each of which is an array of the form
		// [itemName, closure], and
		// itemName has the form 'menu text (pie text)'
		// If offset is zero, the first item extends CW from 12 o'clock
		// If offset is, eg, 0.5, then the first item begins 1/2 a slice-size CCW from there.
		this.items = items;
		// clickFn, if supplied, will be called instead of bringing up a textMenu in the case
		//	of a quick click -- less than 300ms; ie before the help disk has been drawn
		this.targetMorph = targetMorph;
		this.r1 = 15;  // inner radius
		this.r2 = 50;  // outer radius
		this.offset = offset || 0; // default to 0 -- Adam
		this.clickFn = clickFn;
		$super(new lively.scene.Ellipse(pt(100 + this.r2, 100 + this.r2), this.r2));
		this.setBorderColor(Color.black);  this.setBorderWidth(1);
		this.hasCommitted = false;  // Gesture not yet outside commitment radius
		return this;
	},
	helpString: function() {
		var help = "Pie menus let you choose mouse-down actions";
		help += "\nbased on the direction of your stroke.";
		help += "\nIf you hold the button down without moving,";
		help += "\nyou will see a map of the directions and actions.";
		help += "\nThis menu has the same items with words to";
		help += "\nexplain the abbreviated captions in the map.";
		help += "\nYou can disable pie menus in world-menu/preferences.";
		return help;
	},
	open: function(evt) {
		// Note current mouse position and start a timer
		this.mouseDownPoint = evt.mousePoint;
		this.originalEvent = evt;
		this.setPosition(this.mouseDownPoint.subPt(this.bounds().extent().scaleBy(0.5)));
		var opacity = 0.1;  this.setFillOpacity(opacity);  this.setStrokeOpacity(opacity);
		WorldMorph.current().addMorph(this);
		evt.hand.setMouseFocus(this);
		this.world().scheduleForLater(new SchedulableAction(this, "makeVisible", evt, 0), 300, false);
	},
	onMouseMove: function(evt) {
		// Test for whether we have reached the commitment radius.
		var delta = evt.mousePoint.subPt(this.mouseDownPoint)
		if (delta.dist(pt(0, 0)) < this.r1) return
		// If so dispatch to appropriate action
		this.hasCommitted = true;
		this.remove();
		evt.hand.setMouseFocus(null);
		var n = this.items.length;
		var index = this.itemIndexForAngle(delta.theta()); // refactored to use itemIndexForAngle -- Adam
		index = (index+n).toFixed(0)%n;  // 0..n-1
		var item = this.items[index];
		if (item[1] instanceof Function) item[1](this.originalEvent)
			//	else what?
	},
	onMouseUp: function(evt) {
		// This should only happen inside the commitment radius.
		if (this.hasCommitted) return;  // shouldn't happen
		var world = this.world();
		this.remove();

		// if this was a quick click, call clickFn if supplied and return
		if (!this.hasSubmorphs() && this.clickFn) {
			console.log('Calling PieMenu clickFn');
			return this.clickFn(evt);
		}

		// Display a normal menu with this.items and a help item at the top.
		var normalMenu = new MenuMorph([
			["pie menu help", function(helpEvt) {
				var helpMenu = new MenuMorph(this.items, this.targetMorph);
				helpMenu.openIn(world, evt.mousePoint, false, this.helpString());
			}.bind(this)]], this.targetMorph);
		normalMenu.addLine();
		this.targetMorph.morphMenu(evt).getRawItems().forEach( function (item) { normalMenu.addRawItem(item); });
		normalMenu.openIn(world, evt.mousePoint, false, Object.inspect(this.targetMorph).truncate());
		evt.hand.setMouseFocus(normalMenu);
	},
	
	// refactored by Adam because there was a bug in it and it was easier to see this way
	itemIndexForAngle: function(theta) { return ((theta/(Math.PI*2) + (1/4)) * this.items.length) + this.offset; },
	angleForItemIndex: function(index) { return (( (index-this.offset) / this.items.length) - (1/4)) * Math.PI*2; },
	
	makeVisible: function(openEvent) {
		if (this.hasCommitted) return;
		var opacity = 0.5;
		this.setFillOpacity(opacity);
		this.setStrokeOpacity(opacity);
		// Make an inner circle with 'menu'
		var nItems = this.items.length;
		if(nItems == 0) return;
		for (var i=0; i<nItems; i++) {
			var theta = this.angleForItemIndex(i); // refactored to use angleForItemIndex -- Adam
			var line = Morph.makeLine([Point.polar(this.r1, theta), Point.polar(this.r2, theta)], 1, Color.black);
			line.setStrokeOpacity(opacity);
			this.addMorph(line);
			var labelString = this.items[i][0];
			var x = labelString.indexOf('(');
			
			// aaa - Huh??? Why was this thing requiring the parens? -- Adam
			//if (x < 0) continue
			//labelString = labelString.slice(x+1, labelString.length-1);  // drop parens
			if (x >= 0) { labelString = labelString.slice(x+1, labelString.length-1); }  // just use the thing in the parens if it's there
			
			var labelPt = Point.polar(this.r2*0.7, theta+(0.5/nItems*Math.PI*2))
			this.addMorph(TextMorph.makeLabel(labelString).centerAt(labelPt));
		}
		this.addMorph(TextMorph.makeLabel("menu").centerAt(pt(0, 0)));
	},
	addHandleTo: function(morph, evt, mode) {
		var handle = new HandleMorph(evt.point(), lively.scene.Rectangle, evt.hand, morph, null);
		handle.mode = mode;
		handle.rollover = false;
		morph.addMorph(handle);
		evt.hand.setMouseFocus(handle);
	},
});
Object.extend(PieMenuMorph, {
    setUndo: function(undoFunction) {
    	PieMenuMorph.undoer = undoFunction;
    },
    doUndo: function() {
    	if(PieMenuMorph.undoer) PieMenuMorph.undoer();
	PieMenuMorph.undoer = null;
    }
});

(function setUpNodeStyle() {
    var mainFill = Color.white;
    var mainBorderColor = Color.gray.darker();
    var mainConnectorColor = mainBorderColor;
    Global.NodeStyle = {
        connector: {fill: mainConnectorColor, borderWidth: 1, borderColor: mainConnectorColor},
        node: {fontSize: 9, fill: mainFill, borderRadius: 10, borderWidth: 1, borderColor: mainBorderColor}
    }
})()

Morph.subclass('ArrowHeadMorph', {
     
    initialize: function($super, lineWidth, lineColor, fill, length, width) {
        $super(new lively.scene.Group());
        
        /* FIXME
         * Morph abuse!
		 * rk: Morph rape!! ;-)
         */
        this.setFillOpacity(0);
        this.setStrokeOpacity(0);

        lineWidth = lineWidth || 1;
        lineColor = lineColor || Color.black;
        fill = fill || Color.black;
        length = length || 16;
        width = width || 12;

		var offset = 0.2;
        var verts = [pt(offset* length, 0), pt((-1.0 + offset)* length , 0.5* width), pt((-1 + offset) * length, -0.5 * width)];
        var poly = new lively.scene.Polygon(verts);
        // FIXME: positioning hack, remove the following
        this.head = this.addMorph(new Morph(poly));
        
		this.head.applyStyle(NodeStyle.connector);
		this.head.setFill(lineColor); // JL: style vs. explict color?        
        this.head.setBorderColor(lineColor);

        this.setPosition(this.head.getPosition());
        this.setExtent(this.head.getExtent());
        this.ignoreEvents();
        this.head.ignoreEvents();
        
        // this.head.setFillOpacity(0.7);
        // this.head.setStrokeOpacity(0.7);
        
        return this;
    },
    
    pointFromTo: function(from, to) {
        var dir = (to.subPt(from)).theta()
        this.setRotation(dir)
        this.setPosition(to);
    }

});

Morph.subclass('ConnectorMorph', {

	suppressHandles: true,

	style: NodeStyle.connector,//{borderColor: Color.rgb(230,230,230), borderWidth: 1},
	
	initialize: function($super, morph1, morph2) {
		var startPoint  = pt(0,0);
		var endPoint = pt(10,10);
		if (morph1) startPoint =  morph1.getCenter();
		if (morph2) endPoint = morph2.getCenter();
		
		var vertices = [startPoint, endPoint];
		vertices.invoke('subPt', vertices[0]);
		$super(new lively.scene.Polyline(vertices));

		// ArrowHeadMorph needs cleanup
		this.arrow = this.addMorph(new ArrowHeadMorph(null,null, null, 30, 8));
		this.arrow.head.applyStyle(NodeStyle.connector);

        this.closeAllToDnD();    

		this.setStartMorph(morph1);
		this.setEndMorph(morph2);
	},
	
    
	onDeserialize: function() {
		this.setStartMorph(this.startMorph);
		this.setEndMorph(this.endMorph);
	},
	
	// I don't know who sends this, but by intercepting here I can stop him.... drag me
    // logStack shows no meaningfull results here
    translateBy: function($super, delta) {
		//logStack();
		//$super(delta)
    },
	
	handlesMouseDown: Functions.True,
	
	getStartMorph: function() { return this.startMorph },
	
	getEndMorph: function() { return this.endMorph },
	
	setStartMorph: function(morph) {
		this.startMorph = morph;
		if (morph) this.register(morph, 'Start');
	},	
	
	setEndMorph: function(morph) {	
		this.endMorph = morph;
		if (morph) this.register(morph, 'End');
	},
	
	getStartPos: function() { 
		return this.shape.vertices().first() 
	},
	
	getEndPos: function() { 
		return this.shape.vertices().last() 
	},
	
	setStartPos: function(p) {
		var v = this.shape.vertices(); v[0] = p; this.setVertices(v);
	},
	
	setEndPos: function(p) {
		var v = this.shape.vertices(); v[v.length-1] = p; this.setVertices(v);
	},

	setCustomColor: function(color) {
		this.applyStyle({borderColor: color});
		this.arrow.head.applyStyle({fill: color});
	},

	register: function(morph, startOrEnd) {
		var con = this;
		morph.changed = morph.changed.wrap(function (proceed) {
			proceed();
			con.updatePos(startOrEnd);
		});
		con.updatePos(startOrEnd); // kickstart
	},
	
	unregister: function(startOrEnd) {
		var getMorphSelector = 'get' + startOrEnd + 'Morph';
		var morph = this[getMorphSelector]();
		if (!morph)
			return;
		if (morph.rebuildChangeMethod)
			morph.rebuildChangeMethod();
		else
			morph.changed = morph.constructor.prototype.changed;
		console.log('unregistered ' + startOrEnd);
	},

	updatePos: function(startOrEnd) {

		/*if (!this.getStartMorph() || !this.getEndMorph())
			return;
		var center = this.getStartMorph().getCenter();
		if (startOrEnd == 'Start')
			this.setStartPos(center);
		this.setEndPos(this.getEndMorph().bounds().closestPointToPt(center));
		this.arrow && this.arrow.pointFromTo(this.getStartPos(), this.getEndPos());*/

		var getMorphSelector = 'get' + startOrEnd + 'Morph';
		var setPosSelector = 'set' + startOrEnd + 'Pos';
		var morph = this[getMorphSelector]();
		if (morph.owner) {
			var newPos = morph.owner.worldPoint(morph.getCenter())
			this[setPosSelector](newPos);
			this.arrow && this.arrow.pointFromTo(this.getStartPos(), this.getEndPos());
		}
	},
	
	toString: function() {
		return Strings.format("#<ConnectorMorph:%s->%s>", this.getStartMorph(), this.getEndMorph());
	},
	
	remove: function($super) {
		$super();
		this.unregister('Start');
		this.unregister('End');
	},

});

Morph.subclass('NodeMorph', {

	maxDist: 200 ,
	minDist: 155 ,
	step: 15,
	minStepLength: 0,
	findOtherMorphsDelay: 10,
	
	suppressHandles: true,

	initialize: function($super, bounds) {
		$super(new lively.scene.Rectangle(bounds));
		//$super(new lively.scene.Ellipse(bounds.center(), (bounds.width+bounds.height)/2));
		//var gradient = new lively.paint.LinearGradient([
		//		new lively.paint.Stop(0.2, Color.lightGray), 
		//		new lively.paint.Stop(1, Color.darkGray)]);
		//this.applyStyle({fill: gradient});
		//this.applyStyle({fill: Color.white});
		this.applyStyle({fill: null});
		this.connections = [];
		this.connectionsPointingToMe = [];
		this.energy=1;
	},
	onDeserialize: function($super) {
		this.activeBoundsOfWorld = null;
	},
	configure: function(spec) {
		for (name in spec) this[name] = spec[name];
	},
	forceOfMorphs: function(morphs) {
		var avg = pt(0,0);
		this.cachedNodes=[];
		for (var i=0; i<morphs.length; i++) {
			var ea = morphs[i];
			var d = this.getCenter().subPt(ea.getCenter());
			var dist = d.fastR();
			var isConnected = this.isConnectedTo(ea) || ea.isConnectedTo(this);
			if (!isConnected && dist > this.maxDist + 150*this.energy)
				continue;
			this.cachedNodes.push(ea);
			avg = avg.addPt(this.forceOfMorph(ea, d, dist, isConnected));
		}
		if (avg.eqPt(pt(0,0))) return avg;
		return Point.polar(this.energy*this.step, avg.theta());
	},
	forceOfMorph: function(morph, vector /*between centers of me and morph*/, dist /*of vector*/, isConnected) {
		// effect positive --> push away, negative -> attract
		if (dist == 0) return pt(0,0); var effect;
		if (dist < this.minDist) {
			//effect = this.minDist/dist;
			effect = 1;
		} else if (isConnected) {
			if (dist <= this.maxDist) return pt(0,0);
			effect = -1;
		} else {
			if (dist >= this.maxDist) return pt(0,0);
			effect = 1;
		}
		return vector.fastNormalized().scaleBy(effect);
	},
	makeStep: function() {
		if (this.energy == 0) return;
		var nodes = this.cachedNodes;
		if (!this.calls || this.calls % this.findOtherMorphsDelay == 0) {
		 	this.cachedNodes = this.findNodeMorphs();
			this.calls = 1;

			if (this.connectedNodes().length == 0) {
				this.minDist = 20;
				this.maxDist = 50;
			} else {
				this.minDist = this.constructor.prototype.minDist;
				this.maxDist = this.constructor.prototype.maxDist;
			}
		}
		this.calls++;
		var v = this.forceOfMorphs(this.cachedNodes);
		if (!v.x || !v.y /*|| v.fastR() <= this.minStepLength*/) return; // what about v.x/y === 0 ???
		this.moveBy(v);
		this.ensureToStayInWorldBounds();
	},
	findNodeMorphs: function() {
		return NodeMorph.all().without(this);
	},
	ensureToStayInWorldBounds: function() {
		if (!this.activeBoundsOfWorld) {
			// World bounds are sometimes wrong??? Use canvas ...
			var canvas = Global.document.getElementById('canvas');
			this.activeBoundsOfWorld = pt(canvas.clientWidth, canvas.clientHeight).subPt(this.getExtent()).extentAsRectangle();
		//this.activeBoundsOfWorld =  pt(1051.9,584.5).extentAsRectangle();
		}
		if (!this.activeBoundsOfWorld.containsPoint(this.getPosition()))
			this.setPosition(this.activeBoundsOfWorld.closestPointToPt(this.getPosition()));
	},
	startSteppingScripts: function(ms, random) {
		var timing = 10 //ms || 1000;
		if (random) {
			var getRandomNumber = function(max) { return Math.floor(Math.random()*max+1)-1};
			timing = timing + getRandomNumber(200);
		}
        this.startStepping(timing, "makeStep");
    },
	connectTo: function(otherNode) {
		this.connectedNodesCache = null;
		var con = new ConnectorMorph(this, otherNode);
		this.ensureConnectionIsVisible(con);
		this.connections.push(con);
		otherNode.connectionsPointingToMe.push(con);
		return con;
	},
	ensureConnectionToNodeIsVisible: function(node) {
		this.ensureConnectionIsVisible(this.getConnectionToNode(node));
	},
	ensureConnectionIsVisible: function(connection) {
		var w = WorldMorph.current();
		if (this.ownerChain().include(w))
			w.addMorphBack(connection);
	},
	disconnect: function(node) {
		this.connectedNodesCache = null;
		var c = this.getConnectionToNode(node);
		if (!c) {
			console.warn('Trying to disconnect nodes but couldn\'t find connection!');
			return;
		}
		c.remove();
		this.connections = this.connections.without(c);
	},
	getConnectionToNode: function(node) {
		return this.connections.detect(function(ea) { return ea.getEndMorph() == node });
	},
	connectedNodes: function() {
		if (!this.connectedNodesCache)
			this.connectedNodesCache = this.connections.collect(function(ea) { return ea.getEndMorph() });
		return this.connectedNodesCache
	},
allConnectedNodes: function() {
		return this.connectedNodes().concat(this.connectedNodesPointingToMe());
	},
connectedNodesPointingToMe: function() {
		return this.connectionsPointingToMe.collect(function(ea) { return ea.getStartMorph() });
	},
	isConnectedTo: function(otherNode) {
		return this.connectedNodes().indexOf(otherNode) != -1;
	},
	remove: function($super) {
		$super();
		this.connectionsPointingToMe.forEach(function(ea) { ea.getStartMorph().disconnect(this) }, this);
		this.connections.invoke('remove');
	},
	rebuildChangeMethod: function() {
		this.changed = this.constructor.prototype.changed;
		this.connections.forEach(function(ea) {ea.register(this, 'Start')}, this);
		this.connectionsPointingToMe.forEach(function(ea) {ea.register(this, 'End')}, this);
	},
	addLabel: function(text) {
		if (!this.label)
			this.label = this.addMorph(new TextMorph(new Rectangle(0,0,this.getExtent().x,10)));
		this.label.textString = text;
		this.label.beLabel();
//		this.label.setFontSize(9); this.label.applyStyle({fill: Color.white, borderRadius: 10, borderWidth: 1, borderColor: Color.gray.darker()});
        this.label.applyStyle(NodeStyle.node);
		this.setExtent(this.label.getExtent().addXY(0,5));
		this.label.centerAt(this.innerBounds().center());
	},
placeNearConnectedNode: function() {
	if (this.allConnectedNodes().length == 0) return;
	var other = this.allConnectedNodes().first();
	var newPos = other.bounds().expandBy(other.maxDist).randomPoint();
	this.centerAt(newPos);
},
continouslyTryToPlaceNearConnectedNodes: function() {
	var tries = 5;
	var self = this;
	var tryPlace = function() {
		if (self.allConnectedNodes().length > 0) {
			self.placeNearConnectedNode();
			return;
		}
		if (tries > 0) {
			tries--;
			tryPlace.delay(1);
		}
	};
	tryPlace();
},


});

Object.extend(NodeMorph, {
	all: function() {
		return WorldMorph.current().submorphs.select(function(ea) { return ea instanceof NodeMorph });
	},
	buildEnergySlider: function() {
		var slider = new NodeEnergySlider(); // FIXME somehow a addObserver does not deserialize so have to subclass
		slider.openInWorld();
	}
});

SliderMorph.subclass('NodeEnergySlider', {
	initialize: function($super, optB) {
		$super(optB || new Rectangle(0,0,200,30));
	},
	onValueUpdate: function($super, value) {
		$super(value);
		var energy = value*2;
		console.log('Node Energy: ' + energy);
		NodeMorph.all().forEach(function(ea) { ea.energy = energy });
	},
	onDeserialize: function($super) {
		$super();
		// slider deserialization seems to be broken...
		var b = this.bounds();
		this.owner.addMorph(new NodeEnergySlider(b));
		this.remove();
	},
});

/**
 * A Morph for marking regions 
 * - that does not accept the dropping of other morphs 
 * - and does only react on mouse clicks on the border
 */

MouseHandlerForDragging.subclass('MarkerMorphMouseHandler', {
	handleMouseEvent: function($super, evt, targetMorph) {
		// console.log("handle event " + evt + ", " + targetMorph)
		if (targetMorph && (!targetMorph.containsWorldPoint(evt.mousePoint)))
			return false;
		return $super(evt, targetMorph); 
	},
});

Morph.subclass("MarkerMorph", {

	openForDragAndDrop: false,

	mouseHandler: MarkerMorphMouseHandler.prototype,

	initialize: function($super, rectangle) {
		$super(new lively.scene.Rectangle(rectangle))

		this.applyStyle({borderWidth: 2, borderColor: Color.tangerine , fill: null});
		this.shape.setStrokeDashArray("9,7");
	},
	
	containsPoint: function($super, point) {
		var result = $super(point)
		if (result) {
			var innerRect = this.shape.bounds().insetBy(5);
			return ! innerRect.containsPoint(this.localize(point));
		} else {
			return false;
		}
	}

});

Morph.subclass("ProgressBarMorph", {

	initialize: function($super, bounds) {
		this.bar = Morph.makeRectangle(0,0,0,0)
		$super(new lively.scene.Rectangle(bounds));
		this.bar.applyStyle({fill: Color.darkGray, borderWidth: pt(0,0), borderColor: null})
		this.bar.ignoreEvents();
		
		this.addMorph(this.bar);
		this.applyStyle({fill: Color.gray})
		this.setValue(0.3);

		this.label = new TextMorph(new Rectangle(0,0, 100, 20), '');
		this.label.applyStyle({textColor: Color.white, fill: null, borderWidth: 0})
		this.addMorph(this.label);
		this.label.ignoreEvents()
	},

	setValue: function(number){
		this.value = number;
		this.updateBar(number);
	},

	getValue: function(){
		return this.value;
	},
	
	setLabel: function(str) {
		if (!this.label) return
		this.label.setExtent(this.getExtent());
		this.label.textString = str;
		this.label.emphasizeAll({style: 'bold', align: 'center'});
		this.label.align(this.label.bounds().center(), this.shape.bounds().center());
	},


	updateBar: function(number){
		var bounds = this.shape.bounds()
		this.bar.setPosition(pt(0,0));
		this.bar.setExtent(pt(Math.floor(number * bounds.width), bounds.height)) 	
	},

	adjustForNewBounds: function($super) {
        $super();
		this.updateBar(this.getValue())
    },

})

// Usable Setup of a Widget - Record - Slider
// this demonstrates some issues to be resolved 
Widget.makeSlider = function(bounds, range) {
	
	bounds = bounds || new Rectangle(0, 0, 100, 20)
	range = range || 10.0;
	
	// Why are simple morphs not funcitonal without any model underneath?
	
	// Why should widgets not be graphical? 
	// and when they are not where should we put them
	var widget = new Widget();
	// why could widgets and other morphs not act as a model?
	var model = Record.newNodeInstance({Value: null,  SliderExtent: null});
	widget.ownModel(model);

	slider = new SliderMorph(bounds, range)
	slider.connectModel(model);
	slider.ownerWidget = widget 

	// TODO 
	model.addObserver(slider)
	return slider
}
	
/* 
 * Replacement for PromptDialog Widget
 *
 */ 
// TODO: get rid of the magic and repetitive layout numbers....
BoxMorph.subclass("PromptDialogMorph", {

    suppressHandles: true,

	padding: new Rectangle(10,10,10,10),

	connections: ['accepted', 'canceled', 'title'], // for documentation only
	
	initialize: function($super, bounds) {
		bounds = bounds || new Rectangle(0,0,500,400);
		$super(bounds);

		this.callback = null;
		this.layoutManager = new VerticalLayout();
		this.addTitle("Prompt Dialog");
		this.addTextPane();
		this.addButtons();
		this.linkToStyles(["panel"]);
		this.adjustForNewBounds();
	},

	addTitle: function(str) {
		this.label =  new TextMorph(new Rectangle(0,0,20,10)).beLabel();
		connect(this, "title", this.label, 'setTextString');
		this.label.padding = new Rectangle(0,10,0,0);
		this.addMorph(this.label);
		this.title = str;
		
	},
	
	addTextPane: function() {
		this.textPane = newTextPane(new Rectangle(0,0,300,100), "");
		this.textPane.applyStyle({fill: Color.white});
		this.textPane.innerMorph().applyStyle({fill: null});
		this.textPane.innerMorph().owner.applyStyle({fill: null}); // clip
		this.addMorph(this.textPane);
	},
	
	addButtons: function() {
		this.okButton = new ButtonMorph(new Rectangle(0,0,70,20));
		this.okButton.setLabel("OK");
		connect(this.okButton, "fire", this, 'removeWithWindow');
		connect(this.okButton, "fire", this, 'onAcceptButtonFire');
		
        this.cancelButton = new ButtonMorph(new Rectangle(0,0,70,20));
		this.cancelButton.setLabel("Cancel");
		connect(this.cancelButton, "fire", this, 'removeWithWindow');
		connect(this.cancelButton, "fire", this, 'canceled');

		var pane = new BoxMorph();
		pane.layoutManager = new HorizontalLayout();
		pane.padding = new Rectangle(5,5,5,5);
  		pane.addMorph(this.cancelButton);
		pane.addMorph(this.okButton);
		pane.setBounds(pane.submorphBounds(true));
		pane.setFill(null);
		this.addMorph(pane);
		this.buttonPane = pane;    
	},
	
	setText: function(aString) {
		this.textPane.innerMorph().setTextString(aString);
	},

	getText: function() {
		return this.textPane.innerMorph().textString
	},

	onAcceptButtonFire: function() {
		this.callback && this.callback(this.getText());
		updateAttributeConnection(this, 'accepted', this.getText())
	},

	adjustForNewBounds: function ($super) {
		var newExtent = this.innerBounds().extent();
	
		var offset = pt(0,0);
		offset = offset.addPt(pt(0, this.buttonPane.getExtent().y));		
		offset = offset.addPt(pt(0, this.label.getExtent().y));

		this.textPane.setExtent(newExtent.subPt(offset))
		this.relayout();

		// move Buttons 
		var offset = this.shape.bounds().bottomRight().subPt(this.buttonPane.bounds().bottomRight())
		this.buttonPane.moveBy(offset.subPt(pt(5,5)))

	},
	
	openIn: function(world, loc) {
		var useLightFrame = true;
        var win = world.addFramedMorph(this, '', loc, useLightFrame);
        this.textPane.innerMorph().requestKeyboardFocus(world.firstHand());
		win.adjustForNewBounds()
        return win;
    },

	removeWithWindow: function() {
		if (this.owner && (this.owner instanceof WindowMorph)) {
			this.owner.remove()
		} else {
			this.remove()
		}
	},

})

// should these go to the tests?
Morph.subclass("PromptDialogMorphExampleClientMorph", {

	oncancel: function() {
		console.log("oncancel")
	},

	onaccept: function(input ) {
		console.log("onaccept " + input);
	}
})

Object.extend(PromptDialogMorph, {
	openExample: function() {
		if($morph('testPromptDialog'))
			$morph('testPromptDialog').remove();
		var morph = new PromptDialogMorph();

		//morph.openInWorld();
		var win = morph.openIn(WorldMorph.current(), pt(550,50));
		win.setExtent(pt(300,300))
		win.name = 'testPromptDialog';

		// we need objects that are persistent and implement the behavior
		var client = new PromptDialogMorphExampleClientMorph(new lively.scene.Rectangle(0,0,1,1));
		morph.addMorph(client); // store it somewhere		

		connect(morph, 'canceled', client, 'oncancel');
		connect(morph, 'accepted', client, 'onaccept');
	}
})


BoxMorph.subclass('HorizontalDivider', {

	suppressGrabbing: true,

	suppressHandles: true,

	style: {fill: Color.gray},

	handlesMouseDown: function(evt) { return true },

	initialize: function($super, bounds) {
		$super(bounds);
		this.fixed = [];
		this.scalingBelow = [];
		this.scalingAbove = [];
		this.minHeight = 20;
		this.pointerConnection = null;
	},

	onMouseDown: function(evt) {
		this.oldPoint = evt.point();
		this.pointerConnection = connect(evt.hand, 'origin', this, 'movedVerticallyBy', function(pos) {
			var resizer = this.getTargetObj();
			var p1 = resizer.oldPoint;
			var p2 = pos;
			var deltaY = p2.y - p1.y;
			resizer.oldPoint = pos;
			return deltaY
		});
	},

	onMouseUp: function(evt) {
		evt.hand.lookNormal() // needed when hand is not over morph anymore
		this.pointerConnection.disconnect();
		this.pointerConnection = null;
	},

	movedVerticallyBy: function(deltaY) {
		if (!this.resizeIsSave(deltaY)) return;

		var morphsForPosChange = this.fixed.concat(this.scalingBelow);
		morphsForPosChange.forEach(function(m) {
			var pos = m.getPosition();
			m.setPosition(pt(pos.x, pos.y + deltaY));
		})
		this.scalingAbove.forEach(function(m) {
			var ext = m.getExtent();
			m.setExtent(pt(ext.x, ext.y + deltaY));
		})
		this.scalingBelow.forEach(function(m) {
			var ext = m.getExtent();
			m.setExtent(pt(ext.x, ext.y - deltaY));
		})
		this.setPosition(this.getPosition().addPt(pt(0, deltaY)));
	},

	resizeIsSave: function(deltaY) {
		return this.scalingAbove.all(function(m) { return (m.getExtent().y + deltaY) > this.minHeight }, this) &&
			this.scalingBelow.all(function(m) { return (m.getExtent().y - deltaY) > this.minHeight}, this)
	},

	onMouseMove: function(evt) {
		evt.hand.lookLikeAnUpDownArrow()
		// also overwritten to prevent super behavior
	},

	onMouseOut: function(evt) {	evt.hand.lookNormal() },

	addFixed: function(m) { if (!this.fixed.include(m)) this.fixed.push(m) },

	addScalingAbove: function(m) { this.scalingAbove.push(m) },

	addScalingBelow: function(m) {  this.scalingBelow.push(m) },

});


BoxMorph.subclass("StatusMessageContainer", {
 	defaultExtent: pt(400,30),

	suppressGrabbing: true,
	suppressHandles: true,
	openForDragAndDrop: false,
	
	layoutManager: new VerticalLayout(),

	initialize: function($super) {
		$super(this.defaultExtent.extentAsRectangle());
		this.setFill(null);
		this.setupDismissAllButton();
	},

	setupDismissAllButton: function(){
		this.dismissAllButton = new ButtonMorph(new Rectangle(0,0,400,15)).setLabel("dismiss all");
		this.dismissAllButton.applyStyle({fill: Color.lightGray, borderWidth: 0})
		connect(this.dismissAllButton, "fire", this, "dismissAll");
	},

	dismissAll: function() {
		this.submorphs.clone().each(function(ea) {
			ea.remove()
		})
	},

	startUpdate: function() {
		// don't use the script morphs
		this.world().startSteppingFor(new SchedulableAction(this, 'updateMessages', undefined, 1000))
	},

	showDismissAllButton: function() {
		if (!this.dismissAllButton) {
			this.setupDismissAllButton();
		}
		if (!this.dismissAllButton.owner) {
			this.addMorphBack(this.dismissAllButton);
			this.relayout()
		}
	},

	onDeserialize: function() {
		this.dismissAll();
		this.stopStepping(); // ensure that  it works even for old potentially broken pages...		
		this.startUpdate();
	},

	updateMessages: function() {
		var time = new Date().getTime();
		var messagesToBeDeleted = this.submorphs.select( function(ea) {return ea.removeAtTime && ea.removeAtTime < time})
		
		if (messagesToBeDeleted.length > 0) {
			messagesToBeDeleted.each(function(ea) {ea.remove()});
			this.relayout();
		}
		// get rid of the dismiss button
		var visibleMorphs = this.visibleSubmorphs();
		if (visibleMorphs.length == 1) {
			visibleMorphs[0].remove();
		}
	},

	addStatusMessage: function(msg, color, delay, callback, optStyle, kind) {	
		console.log((kind ? kind : "status msg: ") + msg)
		this.showDismissAllButton();

		var statusMorph = new TextMorph(pt(400,30).extentAsRectangle())
	
		var closeButton = new ButtonMorph(pt(20,20).extentAsRectangle())
		closeButton.setLabel("X");
		closeButton.applyStyle({fill: Color.white})
		closeButton.align(closeButton.bounds().rightCenter(), statusMorph.shape.bounds().rightCenter().subPt(pt(5,0)));
		connect(closeButton, "fire", statusMorph, "remove")
		statusMorph.addMorph(closeButton);


		if (callback) {
			var moreButton = new ButtonMorph(pt(40,20).extentAsRectangle())
			moreButton.setLabel("more");
			moreButton.applyStyle({fill: Color.white})
			moreButton.align(moreButton.bounds().topRight(), closeButton.bounds().topLeft().subPt(pt(5,0)));
			var pressed = false;
			var callbackObject = {callback: function() {
				// hack prevent weird chrome behavior...
				if (!pressed) {
					pressed = true;
					callback();
				}
			}};
			connect(moreButton, "fire", this, "relinquishKeyboardFocus", function(){ return WorldMorph.current().firstHand()})
			connect(moreButton, "fire", callbackObject, "callback")
			statusMorph.addMorph(moreButton);
		}

		statusMorph.applyStyle({borderWidth: 0, fill: Color.gray, fontSize: 16, fillOpacity: 0.7, borderRadius: 10});
		if (optStyle)
			statusMorph.applyStyle(optStyle);
		statusMorph.textString = msg;
		statusMorph.setTextColor(color || Color.black);

		statusMorph.ignoreEvents();
		
		this.addMorph(statusMorph);
		if (delay) {
			statusMorph.removeAtTime = new Date().getTime() + (delay * 1000);
		};
		
		this.startUpdate() // actually not needed but to be sure....
		
	}
})

/*
 * A Slider with Text field that acts as an interface to the scale of other Morphs
 * 
 */
BoxMorph.subclass('ScaleMorph', {
	
	defaultExtent: pt(40,200),
	layoutManager: new VerticalLayout(),
	padding: new Rectangle(5,5,0,0),
	style: {fill: Color.gray},

	initialize: function($super, bounds) {
		bounds = bounds || pt(0,0).extent(this.defaultExtent	);

		$super(bounds)		

		this.scaleValue = 1;

		this.scaleSlider =  Widget.makeSlider(new Rectangle(0,0,40,200));
		this.scaleText = new  TextMorph(new Rectangle(0,0,40,20));

		this.addMorph(this.scaleSlider);
		this.addMorph(this.scaleText);

		var m = this.scaleText;
		m.setTextString("-");
		m.beInputLine();
		m.suppressHandles = true;
		m.suppressGrabbing = true;

		var m = this.scaleSlider;
		m.suppressHandles = true;
		m.suppressGrabbing = true;

		// ok, fix layout for the moment
		this.shape.setBounds(this.submorphBounds(true).outsetByRect(this.padding));
		this.suppressHandles = true;

		this.setupConnections();

		return this.panel
	},

	setupConnections: function() {
		connect(this, 'scaleValue', this.scaleText, 'setTextString', {
			converter: function(value){return String(value.toFixed(2))}})

		connect( this.scaleText, 'savedTextString', this, 'scaleValue', {converter: function(value) {return Number(value)}})

		connect(this.scaleSlider, 'value', this, 'scaleValue', {converter: function(value){
			var threshold = 5
			if (value < threshold)
				return  (value / threshold)
			else 
				return  value - threshold + 1
		}})

		// ATTENTION: bidirectional dataflow, may be dangerous...
		connect(this, 'scaleValue', this.scaleSlider, 'setValue', {converter: function(value){
			var threshold = 5
			value = Number(value)
			if (value < 1)
				var result = value * threshold
			else 
				var result = value + threshold - 1
			if (result < 0)
				return 0;
			if (result > 10)
				return 10
		}})
	},

	setTarget: function(target) {
		// there should only be one target...
		if (this.target) {
			disconnect(this, 'scaleValue', this.target, 'setScale');
		};
		if (target) {
			connect(this, 'scaleValue', target, 'setScale')
		};
		this.target = target;
	},
})

if (window.shouldShowLoadingMessages) { console.log('loaded Widgets.js'); }


}); // end of module
