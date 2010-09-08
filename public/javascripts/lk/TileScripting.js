/*
 * Copyright (c) 2006-2009 Sun Microsystems, Inc.
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


module('lively.TileScripting').requires('lively.Helper').toRun(function(thisModule) {

Morph.addMethods({
   layout: function(notResizeSelf) {
       if (this.layoutSpec && this.layoutSpec.layouterClass)
			new this.layoutSpec.layouterClass(this, this.layoutSpec).layout();
		if (this.owner)
			this.owner.layout();
   },
   asTile: function() {
       return new thisModule.ObjectTile(null,this);
   }
});
Morph.prototype.morphMenu = Morph.prototype.morphMenu.wrap(function(proceed, evt) {
    var menu = proceed(evt);
    menu.addItem(["make tile", function(evt) { evt.hand.addMorph(this.asTile()) }.bind(this)], 3);
    return menu;
});


PanelMorph.subclass('lively.TileScripting.TileBoxPanel', {

	documentation: 'Panel Morph of TileBox. Currently needed for deserializing TileBox (which is a Widget)',

    onDeserialize: function() {
        // FIXME complete new morph is build, is this really necessary?
        this.owner.targetMorph = this.owner.addMorph(new lively.TileScripting.TileBox().buildView(this.getExtent()));
        this.owner.targetMorph.setPosition(this.getPosition());
        this.remove();
    }

})
Widget.subclass('lively.TileScripting.TileBox', {

	documentation: 'Widget with which Tiles can be created',

    viewTitle: "Tile Box",
    viewExtent: pt(600,300),
        
    add: function(createFunc, demoMorph, caption, panel) {
        
        var m = demoMorph || createFunc();

        var textHeight = 30;
        var wrapper = new ClipMorph(m.getExtent().addPt(pt(0,textHeight)).extentAsRectangle());
        wrapper.applyStyle({borderWidth:1, borderColor: Color.black});
        m.applyStyle({borderWidth: 2, borderColor: Color.black});
        wrapper.addMorph(m);
        var text = new TextMorph(pt(0,m.getExtent().y).extent(m.getExtent().x, wrapper.getExtent().y), caption || m.constructor.type);
        text.beLabel();
        wrapper.addMorph(text);
        panel.addMorph(wrapper);
        
        wrapper.withAllSubmorphsDo(function() {
            this.handlesMouseDown = Functions.True;
            this.okToBeGrabbedBy = function() {
                return createFunc();
            };
            this.onMouseDown = function(evt) {
                    var compMorph = createFunc();
                    evt.hand.addMorph(compMorph);
                    compMorph.setPosition(pt(0,0));
            };
        });
    },
    
    // new TileBox().openIn(WorldMorph.current())
    buildView: function(extent) {
        var panel = new thisModule.TileBoxPanel(this.viewExtent);
        panel.adjustForNewBounds = Morph.prototype.adjustForNewBounds.bind(this); // so submorphs don't scale
        panel.applyStyle({fill: Color.white, borderWidth: 1, borderColor: Color.black});
        panel.suppressHandles = true;
        
        var defaultCreateFunc = function(theClass, optExtent) {
            return new theClass(optExtent && optExtent.extentAsRectangle());
        };
        [thisModule.IfTile, thisModule.DebugTile, thisModule.NumberTile].each(function(ea) {
            this.add(defaultCreateFunc.curry(ea), null, null, panel);
        }, this);
        
        var buildScriptBox = function() {
            var world = WorldMorph.current();
            var window = new thisModule.ScriptEnvironment().openIn(world);
            // window.remove();
            world.removeMorph(window);
            return window;
        }
        this.add(buildScriptBox, new TitleBarMorph('ScriptBox', 150), 'ScriptBox', panel);
        
        // dbgOn(true);
        new VLayout(panel, {}).layout();
        // panel.openDnD();
        
        return panel;
    }
    
});

Object.extend(thisModule.TileBox, {
    open: function() {
        var tileBox = new thisModule.TileBox();
        tileBox.openIn(WorldMorph.current());
        return tileBox;
    }
});

Widget.subclass('lively.TileScripting.ScriptEnvironment', {
    
	documentation: 'Widget for assembling scripts via tiles and running them',

    viewTitle: "ScriptBox",
    viewExtent: pt(200,300),
    
buildView: function (extent) {
        var panel = PanelMorph.makePanedPanel(this.viewExtent, [
            ['runButton', function(initialBounds) { return new ButtonMorph(initialBounds) }, new Rectangle(0, 0, 0.3, 0.1)],
            ['delayText', function(initialBounds) { return new TextMorph(initialBounds) }, new Rectangle(0.5, 0, 0.2, 0.1)],
            ['repeatButton', function(initialBounds) { return new ButtonMorph(initialBounds) }, new Rectangle(0.7, 0, 0.3, 0.1)],
            ['tileHolder', function(initialBounds) { return new thisModule.TileHolder(initialBounds) }, new Rectangle(0, 0.1, 1, 0.9)]
        ]);
        
        // var panel = new Morph(extent.extentAsRectangle());
        // panel.runButton = panel.addMorph(new ButtonMorph(panel.bounds().scaleByRect(new Rectangle(0, 0, 0.3, 0.1))));
        // panel.tileHolder = panel.addMorph(new TileHolder(panel.bounds().scaleByRect(new Rectangle(0, 0.1, 1, 0.9))));
        panel.setFill(Color.gray.lighter());
        
        var tileHolder = panel.tileHolder;
        
        var runButton = panel.runButton;
		runButton.setLabel("Run Script");
		runButton.connectModel({model: tileHolder, setValue: "runScript"});
		
		var delayText = panel.delayText;
		delayText.autoAccept = true;
		
		var repeatButton = panel.repeatButton;
		repeatButton.setLabel("Repeat");
		repeatButton.connectModel({model: tileHolder, setValue: "repeatScript"});
		
		
		
		panel.openAllToDnD();
		tileHolder.openDnD();
		panel.openDnD();
		
		this.panel = panel;
        return panel;
    },
    openIn: function($super, world, optLoc) {
        var window = $super(world, optLoc);
        window.openAllToDnD();
        window.suppressHandles = true;
        window.needsToComeForward = Functions.False;
        // window.captureMouseEvent = Morph.prototype.captureMouseEvent.bind(window).wrap(function(proceed, evt, hasFocus) {
        //             var result = proceed(evt,hasFocus);
        //             dbgOn(Global.x && result);
        //             this.mouseHandler.handleMouseEvent(evt, this); 
        //             return result;
        //         });
        return window;
    }
     
});
   
Object.extend(thisModule.ScriptEnvironment, {
    open: function() {
        var scrEnv = new thisModule.ScriptEnvironment();
        scrEnv.openIn(WorldMorph.current());
        return scrEnv;
    }
});

BoxMorph.subclass('lively.TileScripting.TileHolder', {
    
	documentation: 'Morph for listing tiles in ScriptEnvironment',

    layoutSpec: {layouterClass: VLayout},
    dropAreaExtent: pt(80,20),
    formals: ["Value"],
    
    initialize: function($super, bounds) {
        $super(bounds);
        this.setFill(Color.gray.lighter());
        this.layout = this.layout.curry(true); // no resizing on layout --> FIXME
        this.closeDnD();
        this.suppressHandles = true;
        this.addDropArea();
        
    },
    
    onDeserialize: function() {
        // FIXME just a hack...
        console.log('------------------------------------------------>>>>>>>>>> connecting tilescripting buttons...')
        
        var runButton = this.owner.runButton;
		runButton.connectModel({model: this, setValue: "runScript"});
				
		var repeatButton = this.owner.repeatButton;
		repeatButton.connectModel({model: this, setValue: "repeatScript"});
    },
    
    addMorph: function($super, morph) {
        if (morph instanceof SchedulableAction) return $super(morph);
        if (!morph.isDropArea) this.addDropArea().addMorph(morph);
        else $super(morph);
        this.layout();
        return morph;
    },
    
    ensureEmptyDropAreaExists: function() {
        if (this.submorphs.last().isDropArea && !this.submorphs.last().tile())
            return;
        this.addDropArea();
    },
    
    addDropArea: function() {
        
        var cleanUp = function actionWhenDropped() {
            var emptyDrops = this.submorphs.select(function(ea) { return ea.isDropArea && !ea.tile() });
            emptyDrops.invoke('remove');
            this.ensureEmptyDropAreaExists();
        }.bind(this);
        
        var dropArea = new thisModule.DropArea(this.dropAreaExtent.extentAsRectangle(), cleanUp);
        dropArea.setExtent(pt(this.getExtent().x, dropArea.getExtent().y));

        return this.addMorph(dropArea);
    },
    
    tilesAsJs: function() {
        var lines = this.submorphs.select(function(ea) { return ea.tile && ea.tile() }).collect(function(ea) { return ea.tile().asJs() });
        return lines.join(';\n');
    },
    
    runScript: function(btnVal) {
        if (btnVal) return;
        // debugger;
        if (!this.calls) this.calls = 0;
        this.calls++;
        var code = this.tilesAsJs();
        var result;
        try {
            result = eval(code);
        } catch(e) {
            console.log('Script: Error ' + e + ' occured when evaluating:');
            console.log(code);
        }
        return result;
    },
    
    repeatScript: function(btnVal) {
        if (btnVal) return
        if (this.activeScripts) {
            this.owner.repeatButton.setLabel("Repeat");
            
            console.log('stopping tile script');
            this.stopStepping();
            return;
        }
        
        
        var delay = Number(this.owner.delayText.textString);
        if (!delay) return;
        this.owner.repeatButton.setLabel("Stop");
        console.log('starting tile script');
        this.startStepping(delay, 'runScript');
    },
    
    okToBeGrabbedBy: Functions.Null,
     
     layoutChanged: function($super) {
         $super();
         var maxExtent = this.submorphs.select(function(ea){ return ea.isDropArea }).inject(pt(0,0), function(maxExt, ea) {
             return maxExt.maxPt(ea.getPosition().addPt(ea.getExtent()));
         });
         if (this.getExtent().x < maxExtent.x) {
             // FIXME
             // this.owner && this.owner.owner && this.owner.owner.setExtent(pt(maxExtent.x, this.owner.owner.getExtent().y));
             // this.owner && this.owner.setExtent(pt(maxExtent.x, this.owner.getExtent().y));
             // this.setExtent(pt(maxExtent.x, this.getExtent().y));
         }
     }
});

Object.subclass('Test', {

    a: function($super) { 1 },
        
    b: function($super) { 2 }

});

BoxMorph.subclass('lively.TileScripting.Tile', {

	documentation: 'Abstract Tile',

    isTile: true,
    defaultExtent: pt(100,20),
    layoutSpec: {layouterClass: HLayout, center: true},
    style: { fill: new Color(0.6, 0.7, 0.8), borderWidth: 0},
    
    initialize: function($super, bounds) {
        $super(bounds || this.defaultExtent.extentAsRectangle());
        this.suppressHandles = true;
    },
    
    addMorph: function($super, morph) {
        $super(morph);
        this.layout();
        return morph;
    },
    
    // layoutChanged: function($super) {
    //     $super();
    //     // this.layouterClass && new this.layouterClass(this, true).layout();
    // },
    
    asJs: function() {
        return '';
    }
});

thisModule.Tile.subclass('lively.TileScripting.DebugTile', {
    
	documentation: 'Allows to insert JavaScript',

    defaultExtent: pt(100,35),
    layoutSpec: {layouterClass: null},
    
    initialize: function($super, bounds, sourceString) {
        $super(bounds);
        
        this.text = this.addMorph(new TextMorph(this.shape.bounds().insetBy(5)));
        this.text.autoAccept // KP: what does this do?
        this.text.setTextString(sourceString);
        
        this.closeAllToDnD();
    },
    
    asJs: function() {
        return this.text.textString;
    }
});

thisModule.Tile.subclass('lively.TileScripting.ObjectTile', {
    
	documentation: 'Alias to another morph for scripting it',

    initialize: function($super, bounds, targetMorphOrObject) {
        $super(bounds);
        
        this.targetMorph = null;
        this.opTile = null;
        this.menuTrigger = null;
        
        this.label = this.addMorph(new TextMorph(this.shape.bounds()));
        this.label.beLabel();
        
        if (targetMorphOrObject) this.createAlias(targetMorphOrObject);
        
    },
    
    onDeserialize: function() {
        if (this.menuTrigger) this.menuTrigger.remove();
        this.addMenuButton();
    },
    
    createAlias: function(morph) {
        this.targetMorph = morph;
        this.label.setTextString(this.objectId());
        this.addMenuButton();
        this.layout();
    },
    
    objectId: function() {
        return this.targetMorph.id();
    },
        
    addMenuButton: function() {
        var extent = pt(10,10);
        this.menuTrigger = this.addMorph(new ButtonMorph(extent.extentAsRectangle()));
        this.menuTrigger.moveBy(pt(0,this.getExtent().y/2 - extent.x/2));
        this.menuTrigger.setFill(this.getFill().darker());
        this.menuTrigger.connectModel({model: this, setValue: "openMenu"});
    },
    
    addFunctionTile: function(methodName) {
        this.menuTrigger && this.menuTrigger.remove();
        this.opTile = new thisModule.FunctionTile(null, methodName);
        this.addMorph(this.opTile);
    },
    
    openMenu: function(btnVal) {
        if (btnVal) return;
        var menu = new thisModule.TileMenuCreator(this.targetMorph, this).createMenu();
        var pos = this.getGlobalTransform().transformPoint(this.menuTrigger.getPosition());
    	menu.openIn(this.world(), pos, false, this.targetMorph.toString());
    },
    
    asJs: function() {
        var result = 'lively.TileScripting.ObjectTile.findMorph(\'' +  this.objectId() + '\')';
        if (this.opTile)
            result += this.opTile.asJs();
        return result
    }
        
});

thisModule.ObjectTile.findMorph = function(id) {
    // FIXME arrgh, what about morphs in subworlds?
    var result;
    WorldMorph.current().withAllSubmorphsDo(function() { if (this.id() === id) result = this });
    return result;
};

Object.subclass('lively.TileScripting.TileMenuCreator', {
    
	documentation: 'Generates a menu of methods of an object referenced by an ObjectTile',

    initialize: function(target, tile) {
        this.target = target;
        this.tile = tile;
    },
    
    classes: function() {
        var classes = this.target.constructor.superclasses().concat(this.target.constructor);
        classes.shift(); // remove Object
        return classes;
    },
    
    classNames: function() {
        return this.classes().pluck('type');
    },
    
    methodNamesFor: function(className) {
        var allMethods = Class.forName(className).localFunctionNames();
        return allMethods.without.apply(allMethods, this.ignoredMethods);
    },
    
    createMenu: function() {
        var menu = new MenuMorph([], this.target);
        this.classNames().each(function(ea) { this.addClassMenuItem(menu, ea)}, this);
        return menu;
    },
    
    addClassMenuItem: function(menu, className) {
        var self = this;
        menu.addSubmenuItem([className, function(evt) {
            return self.methodNamesFor(className).collect(function(ea) { return [ea, function() { self.tile.addFunctionTile(ea) }] });
        }]);
    },
    
    ignoredMethods: [ // from Morph
                    "constructor", "internalInitialize", "initialize", "initializePersistentState",
                    "initializeTransientState", "copyFrom", "deserialize", "prepareForSerialization", "restorePersistentState", "restoreDefs",
                    "restoreFromSubnode", "restoreFromSubnodes", "setLineJoin", "setLineCap", "applyStyle", "makeStyleSpec", "applyStyleNamed", "styleNamed",
                    "applyLinkedStyles", "applyFunctionToShape", "internalSetShape", "setShape", "reshape", "setVertices",, "setBounds",
                    "addNonMorph", "addWrapper", "addPseudoMorph", "addMorphAt", "addMorphFront", "addMorphBack", "addMorphFrontOrBack",
                    "insertMorph", "removeAllMorphs", "hasSubmorphs", "withAllSubmorphsDo", "invokeOnAllSubmorphs", "topSubmorph", "shutdown",
                    "okToDuplicate", "getTransform", "pvtSetTransform", "setTransform", "transformToMorph", "getGlobalTransform", "translateBy",
                    "align", "centerAt", "toggleFisheye", "setFisheyeScale", "getHelpText", "showHelp", "hideHelp",
                    "captureMouseEvent", "ignoreEvents", "enableEvents", "relayMouseEvents", "handlesMouseDown", "onMouseDown", "onMouseMove", "onMouseUp",
                    "considerShowHelp", "delayShowHelp", "onMouseOver", "onMouseOut", "onMouseWheel", "takesKeyboardFocus", "setHasKeyboardFocus",
                    "requestKeyboardFocus", "relinquishKeyboardFocus", "onFocus", "onBlur", "removeFocusHalo", "adjustFocusHalo", "addFocusHalo",
                    "checkForControlPointNear", "okToBeGrabbedBy", "editMenuItems", "showMorphMenu", "morphMenu", "showPieMenu", "putMeInAWindow",
                    "putMeInATab", "putMeInTheWorld", "immediateContainer", "windowContent", "windowTitle", "toggleDnD", "openDnD", "closeDnD",
                    "closeAllToDnD", "openAllToDnD", "dropMeOnMorph", "pickMeUp", "notify", "showOwnerChain", "copyToHand",
                    "morphToGrabOrReceiveDroppingMorph", "morphToGrabOrReceive", "morphToReceiveEvent", "ownerChain", "acceptsDropping",
                    "startSteppingScripts", "suspendAllActiveScripts", "suspendActiveScripts", "resumeAllSuspendedScripts", "bounds", "submorphBounds",
                    "innerBounds", "localBorderBounds", "worldPoint", "relativize", "relativizeRect", "localize", "localizePointFrom",
                    "transformForNewOwner", "changed", "layoutOnSubmorphLayout", "layoutChanged", "adjustForNewBounds", "position", 
                    "addSvgInspector", "addModelInspector", "connectModel", "relayToModel", "reconnectModel", "checkModel", "disconnectModel",
                    "getModel", "getActualModel", "getModelPlug", "getModelValue", "setModelValue", "updateView", "exportLinkedFile", "isContainedIn",
                    "leftAlignSubmorphs", "window", "layout","setBorderWidth", "getBorderWidth", "shapeRoundEdgesBy", "setStrokeOpacity", "linkToStyles",
                    "fullContainsPoint", "fullContainsWorldPoint", "removeMorph", "world", "inspect", "stopStepping", "startStepping", "addActiveScript",
                    "getStrokeOpacity", "setStrokeWidth", "getStrokeWidth", "setStroke", "getStroke", "getLineJoin", "getLineCap", "setStrokeDashArray",
                    "getStrokeDashArray", "setStyleClass", "getStyleClass", "getRecordField", "setRecordField", "removeRecordField", "newRelay",
                    "create", "addField", "areEventsIgnored", "addObserver", "removeObserver", "addObserversFromSetters",
                    "nativeWorldBounds", "canvas", "setVisible", "isVisible",
                    "applyFilter", "copy", "getType", "newId", "id", "setId", "setDerivedId", "removeRawNode",
                    "replaceRawNodeChildren", "toMarkupString", "uri", "getLivelyTrait", "setLivelyTrait", "removeLivelyTrait", "getLengthTrait",
                    "setLengthTrait", "getTrait", "setTrait", "removeTrait", "preparePropertyForSerialization"]
});

thisModule.Tile.subclass('lively.TileScripting.FunctionTile', {
    
	documentation: 'Wraps a method of an Object',

    initialize: function($super, bounds, methodName) {
        $super(bounds);

        this.text1 = this.addMorph(new TextMorph(new Rectangle(0,0,20,15), '.' + methodName + '('));
        this.text1.beLabel();
        
        this.text2 = this.addMorph(new TextMorph(new Rectangle(0,0,20,15), ')'));
        this.text2.beLabel();
        
        this.argumentDropAreas = [];
        this.addDropArea();
    },
    
    addDropArea: function() {
        this.removeMorph(this.text2.remove());
        
        var dropArea = new thisModule.DropArea(new Rectangle(0,0,20,15), this.addDropArea.bind(this));
        this.argumentDropAreas.push(this.addMorph(dropArea));
        
        this.addMorph(this.text2);
    },
    
    asJs: function() {
        var result = this.text1.textString;
        var args = this.argumentDropAreas.select(function(ea) { return ea.tile() }).collect(function(ea) { return ea.tile().asJs() });
        result += args.join(',');
        result += ')'
        return  result;
    }

});

thisModule.Tile.subclass('lively.TileScripting.IfTile', {
    
	documentation: 'Conditional Tile',

    initialize: function($super, bounds) {
        $super(bounds);
        this.addMorph(new TextMorph(new Rectangle(0,0,20,this.bounds().height), 'if').beLabel());
        this.testExprDropArea = this.addMorph(new thisModule.DropArea(new Rectangle(0,0,50,this.getExtent().y)));
        this.exprDropArea = this.addMorph(new thisModule.DropArea(new Rectangle(0,0,50,this.getExtent().y)));
    },
    
    asJs: function() {
        return 'if (' + this.testExprDropArea.tile().asJs() + ') {' + this.exprDropArea.tile().asJs() + '}';
    }
});

thisModule.Tile.subclass('lively.TileScripting.NumberTile', {
    
	documentation: 'Represents a number',

    layoutSpec: {layouterClass: null, center: true},
    eps: 0.001,
    
    initialize: function($super, bounds) {
        $super(pt(50, 20).extentAsRectangle());
        this.numberText = this.addMorph(new TextMorph(pt(30,20).extentAsRectangle(), '1').beLabel());
        this.addUpDownButtons();
        this.layout();
    },
    
    onDeserialize: function() {
        this.upButton.remove();
        this.downButton.remove();
        this.addUpDownButtons();
    },

    addUpDownButtons: function() {
        var extent = pt(10,10);
        this.upButton = this.addMorph(new ButtonMorph(pt(25,5).extent(extent)));
        this.upButton.setLabel('+');
        this.upButton.connectModel({model: this, setValue: "countUp"});
        this.downButton = this.addMorph(new ButtonMorph(pt(38,5).extent(extent)));
        this.downButton.setLabel('-');
        this.downButton.connectModel({model: this, setValue: "countDown"});
    },
    
    countUp: function(btnVal) {
        if (btnVal) return;
        var number = Number(this.numberText.textString);
        number *= 10;
        number += Math.abs(number) < 10 ? 1 : 10;
        number /= 10;
        this.numberText.setTextString(number.toString());
        this.layout();
    },
    
    countDown: function(btnVal) {
        if (btnVal) return;
        var number = Number(this.numberText.textString);
        number *= 10;
        number -= Math.abs(number) > 10 ? 10 : 1;
        number /= 10;
        this.numberText.setTextString(number.toString());
        this.layout();
    },
    
    asJs: function() {
        return this.numberText.textString;
    }
    
});

BoxMorph.subclass('lively.TileScripting.DropArea', {

	documentation: 'Only on DropAreas Tiles can be dropped',

    isDropArea: true,
    layoutSpec: {layouterClass: VLayout},
    style: {borderWidth: 0.5, borderColor: Color.black},
    
    initialize: function($super, bounds, actionWhenDropped) {
        $super(bounds);
        this.suppressHandles = true;
        this.styleNormal();
        this.actionWhenDropped = actionWhenDropped;
    },
    
    styleNormal: function() {
        this.setFill(Color.gray);
    },
    
    styleCanReceiveTile: function() {
        this.setFill(Color.green.lighter());
    },
    
    tile: function() {
        return this.submorphs.detect(function(ea) { return ea.isTile });
    },
        
    addMorph: function($super, morph) {
        if (this.tile() || !morph.isTile) return morph; // FIXME think that morph was accepted... overwrite acceptmorph for that or closeDnD
        this.setExtent(morph.getExtent());
        $super(morph);
        this.layout();
        this.owner && this.owner.layout();
        this.actionWhenDropped && this.actionWhenDropped(morph);
        // this.layoutChanged();
        // this.closeDnD();
        return morph;
    },
    
    onMouseOver: function(evt) {
        if (this.tile()) return;
        var tile = evt.hand.submorphs.detect(function(ea) { return ea.isTile });
        if (!tile) return;
        this.styleCanReceiveTile();
    },
    
    onMouseOut: function(evt) {
        this.styleNormal();
    },
    
    okToBeGrabbedBy: function() {
        if (this.tile())
            return this.tile();
        return null;
    }
});

});