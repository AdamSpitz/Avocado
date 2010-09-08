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
 * Tools.js.  This file defines various tools such as the class browser,
 * object inspector, style editor, and profiling and debugging capabilities.  
 */

module('lively.Tools').requires('lively.Text', 'lively.bindings').toRun(function(module, text) {

// ===========================================================================
// Class Browser -- A simple browser for Lively Kernel code
// ===========================================================================

Widget.subclass('SimpleBrowser', {

    viewTitle: "Javascript Code Browser",
    pins: ["+ClassList", "-ClassName", "+MethodList", "-MethodName", "MethodString", "+ClassPaneMenu"],

    initialize: function($super) { 
        var model = new SyntheticModel(this.pins);
        var plug = model.makePlugSpecFromPins(this.pins);
        $super(plug); 
        this.scopeSearchPath = [Global];
        model.setClassList(this.listClasses());
        // override the synthetic model logic to recompute new values
        var browser = this;
        model.getClassPaneMenu = function() {
           return browser.getClassPaneMenu();
        }
    },

    updateView: function(aspect, source) {
        var p = this.modelPlug;
        if (!p) return;

        switch (aspect) {
        case p.getClassName:
            var className = this.getModelValue('getClassName');
        this.setModelValue("setMethodList", this.listMethodsFor(className));
        break;
        case p.getMethodName:
            var methodName = this.getModelValue("getMethodName");
            var className = this.getModelValue("getClassName");
            var source = this.getMethodStringFor(className, methodName);    
            this.setModelValue("setMethodString", source);
            break;
        case p.getMethodString:
            var className = this.getModelValue("getClassName");
            var methodName = this.getModelValue("getMethodName");
            var methodString = this.getModelValue("getMethodString");
            var methodDef = className + ".prototype." + methodName + " = " + methodString;
	    try {
                eval(methodDef);
            } catch (er) {
                WorldMorph.current().alert("error evaluating method " + methodDef);
            }
            ChangeSet.current().logChange({type: 'method', className: className, methodName: methodName, methodString: methodString});
            break;
        }
    },

    listClasses: function() { 
        return Global.classes(true)
		.collect(function(ea) {return Class.className(ea)})
		.select(function(ea) {return !ea.startsWith("anonymous")})
		.concat(["Global"])
		.sort();  
    },


    listMethodsFor: function(className) {
        if (className == null) return [];
        var sorted = (className == 'Global')
            ? this.functionNames(Global).sort()
            : Class.forName(className).localFunctionNames().sort();
        var defStr = "*definition";
        var defRef = module.SourceControl && module.SourceControl.getSourceInClassForMethod(className, defStr);
        return defRef ? [defStr].concat(sorted) : sorted;
    },
    
    functionNames: function(namespace) {
	// This logic should probably be in, eg, Namespace.functionNames()
	return Object.keys(namespace)
		.select(function(ea) {
			var func = namespace[ea];
			return func && !Class.isClass(func) && Object.isFunction(func) && !func.declaredClass})
		.collect(function(ea) { return namespace[ea].name || ea})
    },
    
    getMethodStringFor: function(className, methodName) { 
        if (!className || !methodName) return "no code"; 
	if (module.SourceControl) 
	    var source = module.SourceControl.getSourceInClassForMethod(className, methodName);
	    if(source) return source;
	var func = (className == "Global") ? Global[methodName] : Class.forName(className).prototype[methodName];
	if (!func) return "-- no code --";
	if (module.SourceControl) return "// **Decompiled code** //\n" + func.getOriginal().toString();
	return func.getOriginal().toString();
    },
    
    buildView: function(extent) {
        var panel = PanelMorph.makePanedPanel(extent, [
            ['leftPane', newTextListPane, new Rectangle(0, 0, 0.5, 0.5)],
            ['rightPane', newTextListPane, new Rectangle(0.5, 0, 0.5, 0.5)],
            ['bottomPane', newTextPane, new Rectangle(0, 0.5, 1, 0.5)]
        ]);
        var model = this.getModel();
        var m = panel.leftPane;
        m.connectModel({model: model, getList: "getClassList", setSelection: "setClassName", getSelection: "getClassName", getMenu: "getClassPaneMenu"});
        m.updateView("getClassList");
        m = panel.rightPane;
        m.connectModel({model: model, getList: "getMethodList", setSelection: "setMethodName"});
        m = panel.bottomPane;
        m.innerMorph().getTextSelection().borderRadius = 0;
        m.connectModel({model: model, getText: "getMethodString", setText: "setMethodString", getMenu: "default"});
        return panel;
    },

    getClassPaneMenu: function() {
        var items = [];
        var className = this.getModelValue("getClassName");
dbgOn(true);
        if (className != null) {
            var theClass = Class.forName(className);
            items.push(['make a new subclass', 
                    function() { WorldMorph.current().prompt("name of subclass", this.makeSubclass.bind(this));}.bind(this)]);
            if (theClass.prototype != null) {
                items.push(['profile selected class', 
                    function() { showStatsViewer(theClass.prototype, className + "..."); }]);
            }
        }
        if (!URL.source.protocol.startsWith("file")) {
            items.push(['import source files', function() {
                if (! module.SourceControl) module.SourceControl = new SourceDatabase();
                // Note: the list isn't used anymore in importKernelFiles!
                module.SourceControl.importKernelFiles(["JSON.js", "miniprototype.js", "defaultconfig.js", "localconfig.js", "Base.js", "scene.js", "Core.js", "Text.js", "Widgets.js", "Network.js", "Data.js", "Storage.js", "Tools.js", "Examples.js", "Main.js"]);
                WorldMorph.current().setFill(new lively.paint.RadialGradient([Color.rgb(36,188,255), 1, Color.rgb(127,15,0)]));
            }]);
        }
        if (!Config.debugExtras) {
            items.push(['enable call tracing', function() {
                Config.debugExtras = true;
		lively.lang.Execution.installStackTracers();  
            }]);
        }
	items.push(["test showStack (in console)", lively.lang.Execution.showStack.curry(false)]);
	items.push(["test showStack (in viewer)", lively.lang.Execution.showStack.curry(true)]);
        if (Config.debugExtras) {
	    items.push(["test profiling (in console)", lively.lang.Execution.testTrace]);
	    items.push(["test tracing (in console)", this.testTracing]);
            items.push(['disable call tracing', function() {
                Config.debugExtras = false;
		lively.lang.Execution.installStackTracers("uninstall"); 
            }]);
        }
        return items; 
    },
    makeSubclass: function(subName) {
        var className = this.getModelValue("getClassName");
        var theClass = Class.forName(className);
	theClass.subclass(subName, {});
	// Need to regenerate the class list and select the new sub
        this.getModel().setClassList(this.listClasses());
        this.getModel().setClassName(subName);
	var doitString = className + '.subclass("' + subName + '", {})';
	ChangeSet.current().logChange({type: 'subclass', className: className, subName: subName});

    },
    testTracing: function() {
	console.log("Function.prototype.logAllCalls = true; tracing begins...");
	Function.prototype.logAllCalls = true;
	this.toString();
	Function.prototype.logAllCalls = false;
    }
});
   
// ===========================================================================
// Object Hierarchy Browser
// ===========================================================================

WidgetModel.subclass('ObjectBrowser', {

    viewTitle: "Object Hierarchy Browser",
    openTriggerVariable: 'getObjectList',

    initialize: function($super, objectToView) {
        $super();
        this.fullPath     = ""; // The full pathname of the object (string)
        this.nameToView   = ""; // Current name ("node") that we are viewing
        this.objectToView = objectToView || Global; // Start by viewing the Global namespace if no argument
        return this;
    },

    getObjectList: function() {
        var list = [];
        for (var name in this.objectToView) list = list.concat(name);
        list.sort();

        // The topmost row in the object list serves as the "up" operation.
        list.unshift("..");

        if (this.panel) {
            var nameMorph = this.panel.namePane;
            var path = (this.fullPath != "") ? this.fullPath : "Global";
            nameMorph.setTextString(path);
        }

        return list;
    },

    setObjectName: function(n) {
        if (!n) return;

        // Check if we are moving up in the object hierarchy
        if (n.substring(0, 2) == "..") {
            var index = this.fullPath.lastIndexOf(".");
            if (index != -1) {
                this.fullPath     = this.fullPath.substring(0, index);
                this.objectToView = eval(this.fullPath);
            } else {
                this.fullPath     = "";
                this.objectToView = Global;
            }
            this.nameToView = "";
            this.changed("getObjectList");
            return;
        }

        // Check if we are "double-clicking" or choosing another item
        if (n != this.nameToView) {
            // Choosing another item: Get the value of the selected item
            this.nameToView = n;
            this.changed("getObjectValue");
        } else {
            // Double-clicking: Browse child
            if (this.fullPath != "") this.fullPath += ".";

            if ((this.objectToView instanceof Array) && !isNaN(parseInt(n))) {
                this.fullPath += "[" + n + "]";
            } else {
                this.fullPath += this.nameToView;
            }
            this.objectToView = eval(this.fullPath);
            // if (!this.objectToView) this.objectToView = Global;
            this.nameToView = "";
            this.changed("getObjectList");
        }
    },

    getObjectValue: function() {
        if (!this.objectToView || !this.nameToView || this.nameToView == "") return "(no data)";
        return Object.inspect(this.objectToView[this.nameToView]);
    },

    setObjectValue: function(newDef) { eval(newDef); },

    buildView: function(extent) {
        var panel = PanelMorph.makePanedPanel(extent, [
            ['namePane', TextMorph, new Rectangle(0, 0, 1, 0.07)],
            ['topPane', newTextListPane, new Rectangle(0, 0.07, 1, 0.5)],
            ['bottomPane', newTextPane, new Rectangle(0, 0.5, 1, 0.5)]
        ]);

        this.panel = panel;

        var m = panel.topPane;
        m.connectModel({model: this, getList: "getObjectList", setSelection: "setObjectName"});
        m = panel.bottomPane;
        m.connectModel({model: this, getText: "getObjectValue", setText: "setObjectValue"});

        return panel;
    }

});

// ===========================================================================
// Object Inspector
// ===========================================================================

Widget.subclass('SimpleInspector', {

    description: "A simple JavaScript object (instance) inspector",

    initialViewExtent: pt(400,250),

    formals: ["+PropList", "PropName", "+PropText", "-Inspectee"],
    
    initialize: function($super, targetMorph) {
        $super();
        this.relayToModel(Record.newPlainInstance({PropList: [], PropName: null, Inspectee: targetMorph, PropText: "",
						   PropMenu: [['inspect selection', function() { 
						       var name = this.getPropName();
						       if (!name) return;
						       new SimpleInspector(this.propValue(name)).open()}.bind(this)]]}));
    },
   
    onPropTextUpdate: function(input, source) {
		if (source === this) return;
        var propName = this.getPropName();
        if (propName) {
			var target = this.getInspectee();
			try {
				var result = (interactiveEval.bind(this.target))(input);
			} catch (er) {
				throw dbgOn(er);
			};
			// and what if the value is false?
			if (!result) { console.log('no changes in inspector'); return; }
			console.log("inspector set " + propName + " from " + target[propName] + " to " + result)
			target[propName] = result;
        }
    },

    onInspecteeUpdate: function(inspectee) {
	this.setPropList(Properties.all(inspectee));
    },

    onPropNameUpdate: function(propName) {
        var prop = this.propValue(propName);
		if (prop == null) {
            this.setPropText("----");
        } else {
            this.setPropText(Strings.withDecimalPrecision(Object.inspect(prop), 2));
        }
    },

    
    propValue: function(propName) {
        var target = this.getInspectee();
        return target ? target[propName] : undefined;
    },

    getViewTitle: function() {
        return Strings.format('Inspector (%s)', this.getInspectee()).truncate(50);
    },

    /*
    openIn: function(world, location) {
        // DI: experimental continuous update feature.  It works, but not removed upon close
        // var rightPane = window.targetMorph.rightPane.innerMorph();
        // rightPane.startStepping(1000, 'updateView', 'getPropText');
    },
   */

    buildView: function(extent, model) {
        var panel = PanelMorph.makePanedPanel(extent, [
            ['leftPane', newTextListPane, new Rectangle(0, 0, 0.5, 0.6)],
            ['rightPane', newTextPane, new Rectangle(0.5, 0, 0.5, 0.6)],
            ['bottomPane', newTextPane, new Rectangle(0, 0.6, 1, 0.4)]
        ]);
	
	var model = this.getModel();
	
	panel.leftPane.relayToModel(model, {List: "-PropList", Selection: "+PropName", Menu: "-PropMenu"});
	
	panel.rightPane.relayToModel(model, {Text: "PropText", DoitContext: "-Inspectee"});

	
	var m = panel.bottomPane;
	m.relayToModel(model, {DoitContext: "-Inspectee"});
        m.innerMorph().setTextString("doits here have this === inspectee");

        var widget = this;
        panel.morphMenu = function(evt) { // offer to inspect the current selection
            var menu = Class.getPrototype(this).morphMenu.call(this, evt);
            if (!widget.propValue(widget.getPropName())) return menu;
            menu.addLine();
            menu.addItem(['inspect selection', function() { 
                new SimpleInspector(widget.propValue(widget.getPropName())).open()}])
            return menu; 
        }
	// FIXME: note that we already relay to a model
	this.relayToModel(model, {PropList: "+PropList", PropName: "PropName", 
				  PropText: "PropText", Inspectee: "-Inspectee"}, true);

        return panel;
    }

});
Object.extend(SimpleInspector, {
	inspectObj: function(object) {
    	new SimpleInspector(object).openIn(WorldMorph.current(), pt(200,10))
	}
});

// ===========================================================================
// Style Editor Panel
// ===========================================================================
Widget.subclass('StylePanel', {

	documentation: "Interactive style editor for morphs",
	initialViewExtent: pt(340,100),
	viewTitle: "Style Panel",

	initialize: function($super, targetMorph) {
		$super();
		this.targetMorph = targetMorph;
		this.sendLayoutChanged = true;	// force propagation of changes
		var spec = targetMorph.makeStyleSpec();
		this.actualModel = Record.newPlainInstance({
			BorderWidth: spec.borderWidth,
			BorderColor: spec.textColor,
			BorderRadius: spec.borderRadius,
			FillOpacity: spec.fillOpacity,
			StrokeOpacity: spec.strokeOpacity,
			FontSize: String(spec.fontSize || TextMorph.prototype.fontSize),
			FontFamily: spec.fontFamily || TextMorph.prototype.fontFamily, 
			FillType: "simple", 
			FillDir: null, 
			Color1: null, 
			Color2: null,
			TextColor: null
		}); 
		this.actualModel.addObserver(this);
		this.color1 = null;
		this.color2 = null;
		this.fillDir = null;
		this.fillType = this.actualModel.getFillType();
		var base = targetMorph.getFill();
		this.baseColor = (base instanceof lively.paint.Gradient) ? base.stops[0].color() : base;
	},

	onBorderWidthUpdate: function(w) {
		this.targetMorph.setBorderWidth(w.roundTo(0.1));
		if (this.sendLayoutChanged) this.targetMorph.layoutChanged();
	},

	onBorderColorUpdate: function(c) { // Maybe add a little color swatch in the view
		this.targetMorph.setBorderColor(c);
		if (this.sendLayoutChanged) this.targetMorph.layoutChanged();
	},
	
	onBorderRadiusUpdate: function(r) {
		this.targetMorph.shapeRoundEdgesBy(r.roundTo(1));
		if (this.sendLayoutChanged) this.targetMorph.layoutChanged();
	},

	onFillTypeUpdate: function(type) { this.fillType = type; this.setFill(); },
	onFillDirUpdate: function(dir) { this.fillDir = dir;  this.setFill(); },

	onColor1Update: function(color) { this.color1 = color; this.setFill(); },
	onColor2Update: function(color) { this.color2 = color; this.setFill(); },
	
	setFill: function() {
		if (this.fillType == null) this.fillType = 'simple';
		if (this.color1 == null) this.color1 = this.baseColor;
		if (this.color2 == null) this.color2 = this.baseColor;

		if (this.fillType == 'simple')	this.targetMorph.setFill(this.color1);

		var gfx = lively.paint;
		if (this.fillType == 'linear gradient') {
			if (this.fillDir == null) this.fillDir = 'NorthSouth';
			this.targetMorph.setFill(new gfx.LinearGradient([new gfx.Stop(0, this.color1), new gfx.Stop(1, this.color2)], 
			gfx.LinearGradient[this.fillDir]));
		}

		if (this.fillType == 'radial gradient')
			this.targetMorph.setFill(new gfx.RadialGradient([new gfx.Stop(0, this.color1), new gfx.Stop(1, this.color2)]));
		if (this.sendLayoutChanged) this.targetMorph.layoutChanged();
	},
	
	
	onFillOpacityUpdate: function(op) {
		var value = op.roundTo(0.01);
		this.targetMorph.setFillOpacity(value);
		this.actualModel.setStrokeOpacity(value); // Stroke opacity is linked to fill
		if (this.sendLayoutChanged) this.targetMorph.layoutChanged();
	},

	onStrokeOpacityUpdate: function(op) {
		var value = op.roundTo(0.01);
		this.targetMorph.setStrokeOpacity(value);
		if (this.sendLayoutChanged) this.targetMorph.layoutChanged();
	},

	onTextColorUpdate: function(c) { // Maybe add a little color swatch in the view
		this.targetMorph.setTextColor(c);
		if (this.sendLayoutChanged) this.targetMorph.layoutChanged();
	},

	onFontFamilyUpdate: function(familyName) {
		this.targetMorph.setFontFamily(familyName);
		if (this.sendLayoutChanged) this.targetMorph.layoutChanged();
	},
	
	onFontSizeUpdate: function(fontSize) {
		this.targetMorph.setFontSize(Number(fontSize));
		if (this.sendLayoutChanged) this.targetMorph.layoutChanged();
	},

	needsControlFor: function(methodName) {
		if (this.targetMorph.canRespondTo) return this.targetMorph.canRespondTo(methodName);
		if (methodName == 'shapeRoundEdgesBy') return this.targetMorph.shape.roundEdgesBy instanceof Function;
		return this.targetMorph[methodName] instanceof Function;
	},

	buildView: function(extent) {
		var panel = new PanelMorph(extent);
		panel.linkToStyles(["panel"]);
		var m;

		var y = 10;
		var model = this.actualModel;

		panel.addMorph(new TextMorph(new Rectangle(50, y, 100, 20), "Border Width").beLabel());

		m = panel.addMorph(new PrintMorph(new Rectangle(150, y, 40, 20)));
		m.connectModel(model.newRelay({Value: "BorderWidth"}), true);

		m = panel.addMorph(new SliderMorph(new Rectangle(200, y, 100, 20), 10.0));
		m.connectModel(model.newRelay({Value: "BorderWidth"}), true);

		y += 30;

		panel.addMorph(new TextMorph(new Rectangle(50, y, 100, 20), 'Border Color').beLabel());
		m = panel.addMorph(new ColorPickerMorph(new Rectangle(250, y, 50, 30)));
		m.connectModel(model.newRelay({Color: "+BorderColor"}), true);

		y += 40;

		if (this.needsControlFor('shapeRoundEdgesBy')) {
			panel.addMorph(new TextMorph(new Rectangle(50, y, 100, 20), 'Round Corners').beLabel());
			m = panel.addMorph(new PrintMorph(new Rectangle(150, y, 40, 20)));
			m.precision = 1;
			m.connectModel(model.newRelay({Value: "BorderRadius"}), true);
			m = panel.addMorph(new SliderMorph(new Rectangle(200, y, 100, 20), 50.0));
			m.connectModel(model.newRelay({Value: "BorderRadius"}), true);

			y += 30;
		}

		m = panel.addMorph(new TextListMorph(new Rectangle(50, y, 100, 50), 
		["simple", "linear gradient", "radial gradient", "stipple"]));
		m.connectModel(model.newRelay({Selection: "FillType"}), true);
		m = panel.addMorph(new TextListMorph(new Rectangle(160, y, 75, 60),
		["NorthSouth", "SouthNorth", "EastWest", "WestEast"]));
		m.connectModel(model.newRelay({Selection: "FillDir"}));
		m = panel.addMorph(new ColorPickerMorph(new Rectangle(250, y, 50, 30)));
		m.connectModel(model.newRelay({Color: "+Color1"}));
		m = panel.addMorph(new ColorPickerMorph(new Rectangle(250, y + 40, 50, 30)));
		m.connectModel(model.newRelay({Color: "+Color2"}));
		y += 80;

		panel.addMorph(new TextMorph(new Rectangle(50, y, 90, 20), "Fill Opacity").beLabel());
		panel.addMorph(m = new PrintMorph(new Rectangle(150, y, 40, 20)));
		m.connectModel(model.newRelay({Value: "FillOpacity"}), true);
		m = panel.addMorph(new SliderMorph(new Rectangle(200, y, 100, 20), 1.0));
		m.connectModel(model.newRelay({Value: "FillOpacity"}), true);

		y += 30;

		panel.addMorph(new TextMorph(new Rectangle(50, y, 90, 20), "Stroke Opacity").beLabel());
		m = panel.addMorph(new PrintMorph(new Rectangle(150, y, 40, 20)));
		m.connectModel(model.newRelay({Value: "StrokeOpacity"}), true);

		panel.addMorph(m = new SliderMorph(new Rectangle(200, y, 100, 20), 1.0));
		m.connectModel(model.newRelay({Value: "StrokeOpacity"}), true);

		y += 30;


		if (this.needsControlFor('setTextColor')) {
			panel.addMorph(new TextMorph(new Rectangle(50, y, 100, 20), "Text Color").beLabel());
			m = panel.addMorph(new ColorPickerMorph(new Rectangle(250, y, 50, 30)));
			m.connectModel(model.newRelay({Color: "+TextColor"}));
			y += 40;

			panel.addMorph(new TextMorph(new Rectangle(50, y, 100, 20), 'Font Family').beLabel());
			m = panel.addMorph(new TextMorph(new Rectangle(150, y, 150, 20)));
			m.connectModel(model.newRelay({Text: "FontFamily"}), true);
			y += 30;

			panel.addMorph(new TextMorph(new Rectangle(50, y, 100, 20), 'Font Size').beLabel());
			m = panel.addMorph(new TextMorph(new Rectangle(150, y, 50, 20)));
			m.connectModel(model.newRelay({Text: "FontSize"}), true);
			y += 30;
		}


		var oldBounds = panel.shape.bounds();
		panel.shape.setBounds(oldBounds.withHeight(y + 5 - oldBounds.y));

		panel.morphMenu = function(evt) { 
			var menu = Class.getPrototype(this).morphMenu.call(this, evt);
			menu.addLine();
			menu.addItem(['inspect model', new SimpleInspector(panel.getModel()), "openIn", this.world()]);
			return menu;
		}
		panel.priorExtent = panel.innerBounds().extent();


		panel.submorphs.each(function(ea){
				ea.suppressHandles = true;
		})

		return panel;
	}
	
});


// ===========================================================================
// Profiler & Statistics Viewer
// ===========================================================================
Object.profiler = function (object, service) {
    // The wondrous Ingalls profiler...
    // Invoke as, eg, Object.profiler(Color, "start"), or Object.profiler(Color.prototype, "start")
    var stats = {};
    var fnames = object.constructor.localFunctionNames();

    for (var i = 0; i < fnames.length; i++) { 
        var fname = fnames[i];

        if (fname == "constructor") {} // leave the constructor alone
        else if (service == "stop") 
            object[fname] = object[fname].originalFunction;  // restore original functions
        else if (service == "tallies") 
            stats[fname] = object[fname].tally;  // collect the tallies
        else if (service == "ticks") 
            stats[fname] = object[fname].ticks;  // collect the real-time ticks
        else if (service == "reset") { 
            object[fname].tally = 0; object[fname].ticks = 0; // reset the stats
        } else if (service == "start") { // Make a proxy function object that just calls the original
            var tallyFunc = function () {
                var tallyFunc = arguments.callee;
                tallyFunc.tally++;
                msTime = new Date().getTime();
                var result = tallyFunc.originalFunction.apply(this, arguments); 
                tallyFunc.ticks += (new Date().getTime() - msTime);
                return result;
            }
            
            // Attach tallies, and the original function, then replace the original
            if (object[fname].tally == null) 
                tallyFunc.originalFunction = object[fname];
            else 
                tallyFunc = object[fname]; // So repeated "start" will work as "reset"

            tallyFunc.tally = 0;  
            tallyFunc.ticks = 0;
            object[fname] = tallyFunc; 
        } 
    }
    
    return stats; 
};

function showStatsViewer(profilee,title) {
    Object.profiler(profilee, "start");
    var m = new ButtonMorph(WorldMorph.current().bounds().topCenter().addXY(0,20).extent(pt(150, 20)));
    m.getThisValue = function() { return this.onState; };
    m.setThisValue = function(newValue) {
        this.onState = newValue;
	if(this.removed) return;
	if (this.world().firstHand().lastMouseEvent.isShiftDown()) {
		// shift-click means remove profiling
    		Object.profiler(profilee, "stop");
            	if (this.statsMorph != null) this.statsMorph.remove();
		this.remove();
		this.removed = true;
		return;
	}	
        if (newValue == false) { // on mouseup...
            if (this.statsMorph == null) {
                this.statsMorph = new TextMorph(this.bounds().bottomLeft().extent(pt(250,20)), "no text");
                WorldMorph.current().addMorph(this.statsMorph); 
            }
            var tallies = Object.profiler(profilee, "tallies");
            var ticks = Object.profiler(profilee, "ticks");
            var statsArray = [];
            
            for (var field in tallies) {
                if (tallies[field] instanceof Function) continue;
                if (tallies[field] == 0) continue;
                
                statsArray.push([tallies[field], ticks[field], field]);
            }

            statsArray.sort(function(a,b) {return b[1]-a[1];});
            var statsText = "";
            if (title) statsText += title + "\n";
            statsText += "tallies : ticks : methodName\n";
            statsText += statsArray.invoke('join', ' : ').join('\n');
            this.statsMorph.setTextString(statsText);
            Object.profiler(profilee, "reset"); 
        } 
    }
    m.connectModel({model: m, getValue: "getThisValue", setValue: "setThisValue"});
    WorldMorph.current().addMorph(m);
    var t = new TextMorph(m.bounds().extent().extentAsRectangle(), 'Display and reset stats').beLabel();
    m.addMorph(t);
};


// ===========================================================================
// The even-better Execution Tracer
// ===========================================================================
using().run(function() { // begin scoping function
	// The Execution Tracer is enabled by setting Config.debugExtras = true in localconfig.js.
	// When this is done, every method of every user class is wrapped by tracingWrapper (q.v.),
	// And the entire system is running with a shadow stack being maintained in this way.

	// This execution tracer maintains a separate stack or tree of called methods.
	// The variable 'currentContext' points to a TracerNode for the currently executing
	// method.  The caller chain of that node represents the JavaScript call stack, and
	// each node gives its method (which has been tagged with its qualifiedMethodName() ),
	// and also the receiving object, 'itsThis', and the arguments to the call, 'args'.
	// The end result can be seen in, eg, lively.lang.Execution.showStack(), which displays a stack trace
	// either in the console or in the StackViewer.  You can test this by invoking
	// "test showStack" in the menu of any morph.

	// At key points in the Morphic environment (like at the beginning of event dispatch and
	// ticking behavior), the stack environment gets reinitialized by a call to 
	// lively.lang.Execution.resetDebuggingStack().  This prevents excessively long chains from being
	// held around wasting storage.

	// The tracingWrapper function is the key to how this works.  It calls traceCall()
	// before each method execution, and traceReturn() afterwards.  The important thing
	// is that these messages are sent to the currentContext object.  Therefore the same
	// wrapper works to maintain a simple call stack as well as a full tally and time
	// execution profile.  In the latter case, currentContext and other nodes of the tracing
	// structure are instances of TracerTreeNode, rather than TracerStackNode
	// 

	// This mechanism can perform much more amazing feats with the use of TracerTreeNode.
	// Here the nodes stay in place, accumulating call tallies and ticks of the millisecond
	// clock.  You start it by calling lively.lang.Execution.trace() with a function to run (see the example
	// in lively.lang.Execution.testTrace()).  As in normal stack tracing, the value of currentContext is
	// the node associated with the currently running method.

var rootContext;
var currentContext;

Global.getCurrentContext = function() {
	return currentContext;
};

Object.subclass('TracerStackNode', {
	
	initialize: function(caller, method) {
		this.caller = caller;
		this.method = method;
		this.itsThis = null;  // These two get nulled after return
		this.args = null;  //  .. only used for stack trace on error
		this.callee = null;
	},
	
	copyMe: function() {
		var result = new TracerStackNode(this.caller, this.method);
		result.itsThis = this.itsThis;
		result.args = this.args;
		result.callee = this.callee;
		return result;
	},
	
	traceCall: function(method , itsThis, args) {
		// this is the currentContext (top of stack)
		// method has been called with itsThis as receiver, and args as arguments
		// --> Check here for exceptions
		var newNode = this.callee;  // recycle an old callee node
		if (!newNode) {             // ... or make a new one
			newNode = new TracerStackNode(this, method);
			this.callee = newNode;
		} else {
			newNode.method = method;
		}
		newNode.itsThis = itsThis;		
		newNode.args = args;
		if (Function.prototype.logAllCalls) console.log(this.dashes(this.stackSize()) + this);
		currentContext = newNode;
	},
	
	traceReturn: function(method) {
		// this is the currentContext (top of stack)
		// method is returning
		this.args = null;  // release storage from unused stack
		this.itsThis = null;  //   ..
		currentContext = this.caller;
	},
	
	each: function(funcToCall) {
		// Stack walk (leaf to root) applying function
		for (var c = this; c; c=c.caller) funcToCall(this, c);
	},
	
	stackSize: function() {
		var size = 0;
		for (var c = this; c; c=c.caller) size++;
		return size;
	},
	
	dashes: function(n) {
		var lo = n% 5;
		return '----|'.times((n-lo)/5) + '----|'.substring(0,lo);
	},
	
	toString: function() {
		return "<" + this.method.qualifiedMethodName() + ">";
	},
	
});
    
TracerStackNode.subclass('TracerTreeNode', {
	
	initialize: function($super, caller, method) {
		$super(caller, method);
		this.callees = {};
		this.tally = 0;
		this.ticks = 0;
		this.calltime = null;
		//console.log("adding node for " + method.qualifiedMethodName());
	},
	
	traceCall: function(method , itsThis, args) {
		// this is the currentContext (top of stack)
		// method has been called with itsThis as receiver, and args as arguments
		// --> Check here for exceptions
		var newNode = this.callees[method];
		if (!newNode) {
			// First hit -- need to make a new node
			newNode = new TracerTreeNode(this, method);
			this.callees[method] = newNode;
		}
		newNode.itsThis = itsThis;
		newNode.args = args;
		newNode.tally++;
		newNode.callTime = new Date().getTime();
		currentContext = newNode;
	},
	
	traceReturn: function(method) {
		// this is the currentContext (top of stack)
		// method is returning
		//if(stackNodeCount < 20) console.log("returning from " + method.qualifiedMethodName());
		this.args = null;  // release storage from unused stack info
		this.itsThis = null;  //   ..
		this.ticks += (new Date().getTime() - this.callTime);
		currentContext = this.caller;
	},
	
	each: function(funcToCall, level, sortFunc) { 
		// Recursive tree visit with callees order parameter (eg, tallies, ticks, alpha)
		if (level == null) level = 0;
		funcToCall(this, level);
		var sortedCallees = [];
		Properties.forEachOwn(this.callees, function(meth, node) { sortedCallees.push(node); })
		if(sortedCallees.length == 0) return;
		sortedCallees.sort(sortFunc);
		sortedCallees.forEach(function(node) { node.each(funcToCall, level+1, sortFunc); });
	},
	
	fullString: function(options) {  
		var totalTicks = 0;
		Properties.forEachOwn(this.callees, function(meth, node) { totalTicks += node.ticks; })
		var major = (options.sortBy == "tally") ? "tally" : "ticks";
		var minor = (major == "tally") ? "ticks" : "tally";
		var threshold = options.threshold;
		if (!threshold && threshold !== 0)  threshold = major == "ticks" ? (totalTicks/100).roundTo(1) : 0;

		var sortFunction = function(a, b) {
			if(a[major] == b[major]) return (a[minor] > b[minor]) ? -1 : (a[minor] < b[minor]) ? 1 : 0; 
			return (a[major] > b[major]) ? -1 : 1;
		}
		var str = "Execution profile (" + major + " / " + minor + "):\n";
		str += "    options specified = {" ;
		str += " repeat: "  + (options.repeat || 1);
		str += ", sortBy: " + '"' + major + '"' ;
		str += ", threshold: " + threshold + " }\n" ;
		var leafCounts = {};

		// Print the call tree, and build the dictionary of leaf counts...
		this.each(function(node, level, sortFunc) {
			if (node.ticks >= threshold) str += (this.dashes(level) + node.toString(major, minor) + "\n");
			if (leafCounts[node.method] == null) leafCounts[node.method] =
			{methodName: node.method.qualifiedMethodName(), tallies: 0, ticks: 0};
			var leafCount = leafCounts[node.method];
			leafCount.tallies += node.tally;
			leafCount.ticks += node.ticksInMethod();
		}.bind(this), 0, sortFunction);

		str += "\nLeaf nodes sorted by ticks within that method (ticks / tallies):\n" ;
		var sortedLeaves = [];
		Properties.forEachOwn(leafCounts, function(meth, count) { sortedLeaves.push(count); })
		if (sortedLeaves.length == 0) return;
		sortedLeaves.sort(function (a, b) { return (a.ticks > b.ticks) ? -1 : (a.ticks < b.ticks) ? 1 : 0 } );
		sortedLeaves.forEach( function (count) {
			if (count.ticks >= threshold*0.4)  str += "(" + count.ticks + " / " + count.tallies + ") " + count.methodName + "\n"; 
		});

		return str;
	},
	
	toString: function(major, minor) {
		if(!major) {major = "ticks";  minor = "tally"};
		return '(' + this[major].toString() + ' / ' + this[minor].toString() + ') ' + this.method.qualifiedMethodName();
	},
	
	ticksInMethod: function() {
		var localTicks = this.ticks;
		// subtract ticks of callees to get net ticks in this method
		Properties.forEachOwn(this.callees, function(meth, node) { localTicks -= node.ticks; })
		return localTicks;
	},
});
    
Object.extend(lively.lang.Execution, {

	resetDebuggingStack: function resetDebuggingStack() {
		var rootMethod = arguments.callee.caller;
		rootContext = new TracerStackNode(null, rootMethod);
		currentContext = rootContext;
		Function.prototype.logAllCalls = false;
	},

	showStack: function(useViewer, c) {
		var currentContext = c;
		if (useViewer) { new StackViewer(this, currentContext).open(); return; }

		if (Config.debugExtras) {
			for (var c = currentContext, i = 0; c != null; c = c.caller, i++) {
				var args = c.args;
				if (!args) {
					console.log("no frame at " + i);
					continue;
				}
				var header = Object.inspect(args.callee.originalFunction);
				var frame = i.toString() + ": " + header + "\n";
				frame += "this: " + c.itsThis + "\n";
				var k = header.indexOf('(');
				header = header.substring(k + 1, 999);  // ')' or 'zort)' or 'zort,baz)', etc
				for (var j = 0; j <args.length; j++) {
					k = header.indexOf(')');
					var k2 = header.indexOf(',');
					if (k2 >= 0) k = Math.min(k,k2);
					var argName = header.substring(0, k);
					header = header.substring(k + 2);
					if (argName.length > 0) frame += argName + ": " + Object.inspect(args[j]) + "\n";
				}
				console.log(frame);
				if (i >= 500) {
					console.log("stack overflow?");
					break;
				}
			}
		} else {
			var visited = [];
			for (var c = arguments.callee.caller, i = 0; c != null; c = c.caller, i++) {
				console.log("%s: %s", i, Object.inspect(c));
				if (visited.indexOf(c) >= 0) {
					console.log("possible recursion");
					break;
					} else visited.push(c);
					if (i > 500) {
						console.log("stack overflow?");
						break;
					}
				}
			}
		},

		testTrace: function(options) { // lively.lang.Execution.testTrace( {repeat: 10} )  
		this.trace( RunArray.test.curry([3, 1, 4, 1, 5, 9]), options);
	},

	trace: function(method, options) {  
		// options = { printToConsole: false, repeat: 1, threshold: 0 }
		if (!options) options = {};
		var traceRoot = new TracerTreeNode(currentContext, method);
		currentContext = traceRoot;
		for (var i=1; i <= (options.repeat || 1); i++)  result = method.call(this);
		currentContext = traceRoot.caller;
		traceRoot.caller = null;
		if (options.printToConsole) console.log(traceRoot.fullString(options));
		else WorldMorph.current().addTextWindow(traceRoot.fullString(options));
		return result;
	},

	installStackTracers: function(remove) {
		console.log("Wrapping all methods with tracingWrapper... " + (remove || ""));
		remove = (remove == "uninstall");  // call with this string to uninstall
		Class.withAllClassNames(Global, function(cName) { 
			if (cName.startsWith('SVG') || cName.startsWith('Tracer')) return;
			if (cName == 'Global' || cName == 'Object') return;
			var theClass = Class.forName(cName);
			var methodNames = theClass.localFunctionNames();

			// Replace all methods of this class with a wrapped version
			for (var mi = 0; mi < methodNames.length; mi++) {
				var mName = methodNames[mi];
				var originalMethod = theClass.prototype[mName];
				// Put names on the original methods 
				originalMethod.declaredClass = cName;
				originalMethod.methodName = mName;
				// Now replace each method with a wrapper function (or remove it)
				if (!Class.isClass(originalMethod)) {  // leave the constructor alone and other classes alone
					if(!remove) theClass.prototype[mName] = originalMethod.tracingWrapper();
					else if(originalMethod.originalFunction) theClass.prototype[mName] = originalMethod.originalFunction;
				}
			}
			// Do the same for class methods (need to clean this up)
			var classFns = []; 
			for (var p in theClass) {
				if (theClass.hasOwnProperty(p) && theClass[p] instanceof Function && p != "superclass")
					classFns.push(p);
			}
			for (var mi = 0; mi < classFns.length; mi++) {
				var mName = classFns[mi];
				var originalMethod = theClass[mName];
				// Put names on the original methods 
				originalMethod.declaredClass = cName;
				originalMethod.methodName = mName;
				// Now replace each method with a wrapper function (or remove it)
				if (!Class.isClass(originalMethod)) { // leave the constructor alone and other classes alone
					if(!remove) theClass[mName] = originalMethod.tracingWrapper();
					else if(originalMethod.originalFunction) theClass[mName] = originalMethod.originalFunction;
				}
			}
		});
	},
	
	tallyLOC: function() {
		console.log("Tallying lines of code by decompilation");
		var classNames = [];
		Class.withAllClassNames(Global, function(n) { n.startsWith('SVG') || classNames.push(n)});
		classNames.sort();
		var tallies = "";
		for (var ci= 0; ci < classNames.length; ci++) {
			var cName = classNames[ci];
			if (cName != 'Global' && cName != 'Object') {
				var theClass = Class.forName(cName);
				var methodNames = theClass.localFunctionNames();
				var loc = 0;
				for (var mi = 0; mi < methodNames.length; mi++) {
					var mName = methodNames[mi];
					var originalMethod = theClass.prototype[mName];
					// decompile and count lines with more than one non-blank character
					var lines = originalMethod.toString().split("\n");
					lines.forEach( function(line) { if(line.replace(/\s/g, "").length>1) loc++ ; } );
				}
			}
			console.log(cName + " " + loc);
			// tallies += cName + " " + loc.toString() + "\n";
		}
	},
	
});
    
Object.subclass('InspectHelper', {
	
	inspect: function(obj,selector){
		if (!Morph.prototype.initialize.originalFunction) // poor test
		return; // no tracers installed
		var openTracer = function(contextNode){
			var dbgObj = {classname: this.constructor.type, selector: 'inspect', err:{stack:contextNode}};
			new ErrorStackViewer(dbgObj).open();
		}.bind(this);
		return {inspectMe: true, message: 'opening StackInspector', openTracer: openTracer}
	},
	
});

Global.halt = function() {
	new InspectHelper().inspect();
}

Object.extend(Function.prototype, {

	tracingWrapper: function () {
		// Make a proxy method (traceFunc) that calls the tracing routines before and after this method
		var traceFunc = function () {
			var originalFunction = arguments.callee.originalFunction; 
			if (!currentContext) return originalFunction.apply(this, arguments);  // not started yet
			try {
				currentContext.traceCall(originalFunction, this, arguments);
				var result = originalFunction.apply(this, arguments); 
				if (result && result.inspectMe === true)
					result.openTracer(currentContext);
				currentContext.traceReturn(originalFunction);
				return result;
			} catch(e) {
				console.log('got error:' + e.message);
				if (!e.stack) console.log('caller ' + currentContext.caller);
				if (!e.stack) e.stack = currentContext.copyMe();
				throw e;
			};
		};
		traceFunc.originalFunction = this;  // Attach this (the original function) to the tracing proxy
		return traceFunc;
	}
});
    
}); // end scoping function


// ===========================================================================
// Call Stack Viewer
// ===========================================================================
WidgetModel.subclass('StackViewer', {

    viewTitle: "Call Stack Viewer",
    openTriggerVariable: 'getFunctionList',

    initialize: function($super, param, currentCtxt) {
        $super();
        this.selected = null;
        if (Config.debugExtras) {
            this.stack = [];
            this.thises = [];
            this.argses = [];
            for (var c = currentCtxt; c != null; c = c.caller) {
                this.thises.push (c.itsThis);
                this.argses.push (c.args);
                this.stack.push (c.method);
            }
        } else {
            // if no debugStack, at least build an array of methods
	    // KP: what about recursion?
            this.stack = [];
            for (var c = arguments.callee.caller; c != null; c = c.caller) {
                this.stack.push (c);
            }
        }
    },
    
    getFunctionList: function() {
        var list = [];

        for (var i = 0; i < this.stack.length; i++) {
            list.push(i + ": " + Object.inspect(this.stack[i]));
        }

        return list;
    },

    setFunctionName: function(n) {
        this.selected = null;
        if (n) {
            var itemNumber = parseInt(n);
            if (!isNaN(itemNumber)) {
                this.stackIndex = itemNumber;
                this.selected = this.stack[itemNumber].toString();
            }
        }
       this.changed("getCodeValue");
       this.changed("getVariableList");
    },

    getCodeValue: function() {
        if (this.selected) return this.selected;
        else return "no value";
    },

    setCodeValue: function() { return; },

    getVariableList: function () {
        if (this.selected) {
            var ip = this.selected.indexOf(")");
            if (ip<0) return ["this"];
            varString = this.selected.substring(0,ip);
            ip = varString.indexOf("(");
            varString = varString.substring(ip+1);
            this.variableNames = (varString.length == 0)
                ? ["this"]
                : ["this"].concat(varString.split(", "));
            return this.variableNames
        }
        else return ["----"];
    },

    setVariableName: function(n) {
        this.variableValue = null;
        if (this.variableNames) {
            for (var i = 0; i < this.variableNames.length; i++) {
                if (n == this.variableNames[i]) {
                    this.variableValue = (n == "this")
                        ? this.thises[this.stackIndex]
                        : this.argses[this.stackIndex][i-1];
                    break;
                }
            }
        }
        this.changed("getVariableValue");
    },

    getVariableValue: function(n) {
        return Object.inspect(this.variableValue);
    },

    buildView: function(extent) { 
        var panel;
        if (! this.argses) {
            panel = PanelMorph.makePanedPanel(extent, [
                            ['stackPane', newListPane, new Rectangle(0, 0, 0.5, 1)],
                            ['codePane', newTextPane, new Rectangle(0.5, 0, 0.5, 1)]
                        ]);
                        panel.stackPane.connectModel({model: this, getList: "getFunctionList", setSelection: "setFunctionName"});
                        panel.codePane.connectModel({model: this, getText: "getCodeValue", setText: "setCodeValue"});
        } else {
            panel = PanelMorph.makePanedPanel(extent, [
                ['stackPane', newListPane, new Rectangle(0, 0, 0.5, 0.6)],
                ['codePane', newTextPane, new Rectangle(0.5, 0, 0.5, 0.6)],
                ['variablePane', newListPane, new Rectangle(0, 0.6, 0.5, 0.4)],
                ['valuePane', newTextPane, new Rectangle(0.5, 0.6, 0.5, 0.4)]
            ]);
            panel.stackPane.connectModel({model: this, getList: "getFunctionList", setSelection: "setFunctionName"});
            panel.codePane.connectModel({model: this, getText: "getCodeValue", setText: "setCodeValue"});
            panel.variablePane.connectModel({model: this, getList: "getVariableList", setSelection: "setVariableName"});
            panel.valuePane.connectModel({model: this, getText: "getVariableValue", setText: "setVariableValue"});
        }
        return panel;
    }
});


// ===========================================================================
// FrameRateMorph
// ===========================================================================
TextMorph.subclass('FrameRateMorph', {

    initialize: function($super, rect, textString) {
	// Steps at maximum speed, and gathers stats on ticks per sec and max latency
        $super(rect, textString);
        this.reset(new Date());
    },

    reset: function(date) {
        this.lastTick = date.getSeconds();
        this.lastMS = date.getTime();
        this.stepsSinceTick = 0;
        this.maxLatency = 0;
    },

    nextStep: function() {
        var date = new Date();
        this.stepsSinceTick ++;
        var nowMS = date.getTime();
        this.maxLatency = Math.max(this.maxLatency, nowMS - this.lastMS);
        this.lastMS = nowMS;
        var nowTick = date.getSeconds();
        if (nowTick != this.lastTick) {
            this.lastTick = nowTick;
            var ms = (1000 / Math.max(this. stepsSinceTick,1)).roundTo(1);
            this.setTextString(this.stepsSinceTick + " frames/sec (" + ms + "ms avg),\nmax latency " + this.maxLatency + " ms.");
            this.reset(date);
        }
    },

    startSteppingScripts: function() { this.startStepping(1,'nextStep'); }

});


// ===========================================================================
// ClickTimeMorph
// ===========================================================================
TextMorph.subclass('ClickTimeMorph', {
	// Displays a list of the number of milliseconds that the mouse was recently down or up

    initialize: function($super, zort) {
        $super(new Rectangle(100, 100, 120, 100), "---");
        var ms = new Date().getTime();
        this.nEvents = 4;
	this.ts = [];
	for (var i=0; i<this.nEvents; i++) this.ts.push(ms);
    },

    handlesMouseDown: function() { return true; },

    onMouseDown: function() {
	this.ts.unshift(new Date().getTime());
    },

    onMouseUp: function() {
	this.ts.unshift(new Date().getTime());
	if (this.ts.length > this.nEvents+2) { this.ts.pop(); this.ts.pop(); };
	this.showStats(this.ts);
    },

    showStats: function(ts) {
	var str = "";
	for (var i=0; i<this.nEvents; i++)  {
		str += (i>0 ? "\n" : "");
		str += ((i%2 == 0) ? "down for " : "up for ") + (ts[i] - ts[i+1]);
	}
        this.setTextString(str);
    }

});


// ===========================================================================
// EllipseMaker
// ===========================================================================
ButtonMorph.subclass('EllipseMakerMorph', {

	documentation: 'A button that emits bouncing ellipses to test graphical performance in conjunction with FrameRateMorph',
	
	initialize: function($super, loc) {
		$super(loc.extent(pt(200, 50)));
		this.ellipses = [];
		this.report();
		connect(this, 'value', this, 'makeNewEllipse');		
	},

	makeNewEllipse: function(btnVal) {
		if (!btnVal) return; // just make one, btn click would trigger it 2x
		var ext = this.owner.innerBounds().extent();
		var s = Math.min(ext.x/40, ext.y/40, 20);
		var e = new Morph(new lively.scene.Ellipse(pt(0,0), s));
		e.ignoreEvents();
		e.setExtent(pt(2*s, 4*s));
		e.applyStyle({ fill: Color.random(), fillOpacity: Math.random(), borderWidth: 1, borderColor: Color.random()});
		e.velocity = pt(s, s).random();
		e.angularVelocity = 0.3  * Math.random();
		this.owner.addMorph(e);
		e.moveOriginBy(e.innerBounds().center());  // Rotate about center
		this.ellipses.push(e);
		this.report()
	},

    report: function() { this.setLabel("Make more ellipses (" + this.ellipses.length + ")") },

	stepEllipses: function() { this.ellipses.forEach(function(e) { e.stepAndBounce() }) },

    startSteppingScripts: function() { this.startStepping(30, 'stepEllipses') },

});


// ===========================================================================
// File Parser
// ===========================================================================
Object.subclass('FileParser', {
    // The bad news is: this is not a real parser ;-)
    // It simply looks for class headers, and method headers,
    // and everything in between gets put with the preceding header
    // The good news is:  it can deal with any file,
    // and it does something useful 99 percent of the time ;-)
    // ParseFile() produces an array of SourceCodeDescriptors
    // If mode == "scan", that's all it does
    // If mode == "search", it only collects descriptors for code that matches the searchString
    // If mode == "import", it builds a source code index in SourceControl for use in the browser

    parseFile: function(fname, version, fstr, db, mode, str) {
        // Scans the file and returns changeList -- a list of informal divisions of the file
        // It should be the case that these, in order, exactly contain all the text of the file
        // Note that if db, a SourceDatabase, is supplied, it will be loaded during the scan
        var ms = new Date().getTime();
        this.fileName = fname;
        this.versionNo = version;
        this.sourceDB = db;
        this.mode = mode;  // one of ["scan", "search", "import"]
        if (mode == "search") this.searchString = str;

        this.verbose = this.verbose || false;
        // this.verbose = (fname == "Examples.js");
        this.ptr = 0;
        this.lineNo = 0;
        this.changeList = [];
        if (this.verbose) console.log("Parsing " + this.fileName + ", length = " + fstr.length);
        this.currentDef = {type: "preamble", startPos: 0, lineNo: 1};
        this.lines = fstr.split(/[\n\r]/);

        while (this.lineNo < this.lines.length) {
            var line = this.nextLine();
            if (this.verbose) console.log("lineNo=" + this.lineNo + " ptr=" + this.ptr + line); 
            if (this.lineNo > 100) this.verbose = false;

            if (this.scanComment(line)) {
            } else if (this.scanModuleDef(line)) {
            } else if (this.scanFunctionDef(line)) {
            } else if (this.scanClassDef(line)) {
            } else if (this.scanMethodDef(line)) {
            } else if (this.scanMainConfigBlock(line)) {
            } else if (this.scanBlankLine(line)) {
            } else this.scanOtherLine(line);
        }
        this.ptr = fstr.length;
        this.processCurrentDef();
        ms = new Date().getTime() - ms;
        console.log(this.fileName + " scanned; " + this.changeList.length + " patches identified in " + ms + " ms.");
        return this.changeList;
    },

    scanComment: function(line) {
        if (line.match(/^[\s]*\/\//) ) {
            if (this.verbose) console.log("// comment: "+ line);
            return true;
        }

        if (line.match(/^[\s]*\/\*/) ) {
            // Attempt to recognize match on one line...
            if (line.match(/^[\s]*\/\*[^\*]*\*\//) ) {
                if (this.verbose) console.log("short /* comment: "+ line);
                return true; 
            }

            // Note that /* and matching */ must be first non-blank chars on a line
            var saveLineNo = this.lineNo;
            var saveLine = line;
            var savePtr = this.ptr;
            if (this.verbose) console.log("long /* comment: "+ line + "...");
            do {
                if (this.lineNo >= this.lines.length) {
                    console.log("Unfound end of long comment beginning at line " + (saveLineNo +1));
                    this.lineNo = saveLineNo;
                    this.currentLine = saveLine;
                    this.ptr = savePtr;
                    return true;
                }
                more = this.nextLine()
            } while ( ! more.match(/^[\s]*\*\//) );

            if (this.verbose) console.log("..." + more);
            return true;
        }

        return false;
    },

    scanModuleDef: function(line) {
        // FIXME module defs ending on the same line
        var match = line.match(/\s*module\([\'\"]([a-zA-Z\.]*)[\'\"]\).*\(\{\s*/);
        if (match == null)  return false;
        this.processCurrentDef();
        if (this.verbose) console.log("Module def: " + match[1]);
        this.currentDef = {type: "moduleDef", name: match[1], startPos: this.ptr, lineNo: this.lineNo};
        return true;
    },
    
    scanFunctionDef: function(line) {
        var match = line.match(/^[\s]*function[\s]+([\w]+)[\s]*\(.*\)[\s]*\{.*/);
        if (!match)
            match = line.match(/^[\s]*var[\s]+([\w]+)[\s]*\=[\s]*function\(.*\)[\s]*\{.*/);
        if (match == null) return false;
        this.processCurrentDef();
        if (this.verbose) console.log("Function def: " + match[1]);
        this.currentDef = {type: "functionDef", name: match[1], startPos: this.ptr, lineNo: this.lineNo};
        return true;
    },
    
    scanClassDef: function(line) {
        // *** Need to catch Object.extend both Foo and Foo.prototype ***
        var match = line.match(/^[\s]*([\w\.]+)\.subclass\([\'\"]([\w\.]+)[\'\"]/);
        if (match == null) {
            var match = line.match(/^[\s]*([\w\.]+)\.subclass\(Global\,[\s]*[\'\"]([\w\.]+)[\'\"]/);
        }
        if (match == null)  return false;
        this.processCurrentDef();
        if (this.verbose) console.log("Class def: " + match[1] + "." + match[2]);
        this.currentDef = {type: "classDef", name: match[2], startPos: this.ptr, lineNo: this.lineNo};
        return true;
    },

    scanMethodDef: function(line) {
        var match = line.match(/^[\s]*([\w]+)\:/);
        if (match == null) return false;
        this.processCurrentDef();
        if (this.verbose) console.log("Method def: " + this.currentClassName + "." + match[1]);
        this.currentDef = {type: "methodDef", name: match[1], startPos: this.ptr, lineNo: this.lineNo};
        return true;
    },

    scanMainConfigBlock: function(line) {    // Special match for Config blocks in Main.js
        var match = line.match(/^[\s]*(if\s\(Config.show[\w]+\))/);
        if (match == null) return false;
        this.processCurrentDef();
        if (this.verbose) console.log("Main Config: " + this.currentClassName + "." + match[1]);
        this.currentDef = {type: "mainConfig", name: match[1], startPos: this.ptr, lineNo: this.lineNo};
        return true;
    },

    processCurrentDef: function() {
        // this.ptr now points at a new code section.
        // Terminate the currently open definition and process accordingly
        // We will want to do a better job of finding where it ends
        var def = this.currentDef;
        if (this.ptr == 0) return;  // we're being called at new def; if ptr == 0, there's no preamble
        def.endPos = this.ptr-1;  // don't include the newLine
        var descriptor = new SourceCodeDescriptor (this.sourceDB, this.fileName, this.versionNo, def.startPos, def.endPos, def.lineNo, def.type, def.name);

        if (this.mode == "scan") {
            this.changeList.push(descriptor);
        } else if (this.mode == "search") {
            if (this.matchStringInDef(this.searchString)) this.changeList.push(descriptor);
        } else if (this.mode == "import") {
            if (def.type == "classDef") {
                this.currentClassName = def.name;
                this.sourceDB.methodDictFor(this.currentClassName)["*definition"] = descriptor;
            } else if (def.type == "methodDef") {
                this.sourceDB.methodDictFor(this.currentClassName)[def.name] = descriptor;
            } else if (def.type == "functionDef") {
                this.sourceDB.addFunctionDef(descriptor);
            }
            this.changeList.push(descriptor);
        }
        this.currentDef = null;
    },
    
    scanBlankLine: function(line) {
        if (line.match(/^[\s]*$/) == null) return false;
        if (this.verbose) console.log("blank line");
        return true;
    },
    
    scanOtherLine: function(line) {
        // Should mostly be code body lines
        if (this.verbose) console.log("other: "+ line); 
        return true;
    },
    
    matchStringInDef: function(str) {
        for (var i=this.currentDef.lineNo-1; i<this.lineNo-1; i++) {
            if (this.lines[i].indexOf(str) >=0) return true;
        }
        return false;
    },
    
    nextLine: function() {
        if (this.lineNo > 0) this.ptr += (this.currentLine.length+1);
        if (this.lineNo < this.lines.length) this.currentLine = this.lines[this.lineNo];
        else this.currentLine = '';
        if (!this.currentLine) this.currentLine = '';  // Split puts nulls instead of zero-length strings!
        this.lineNo++;
        return this.currentLine;
    }

});


// ===========================================================================
// ChangeList
// ===========================================================================
WidgetModel.subclass('ChangeList', {
    // The ChangeListBrowser views a list of patches in a JavaScript (or other) file.
    // The patches taken together entirely capture all the text in the file
    // The quality of the fileParser determines how well the file patches correspond
    // to meaningful JavaScript entities.  A changeList accumulated from method defs
    // during a development session should (;-) be completely well-formed in this regard.
    // Saving a change in a ChangeList browser will only edit the file;  no evaluation is implied
    
    initialViewExtent: pt(420,450),
    openTriggerVariable: 'getChangeBanners',

    initialize: function($super, title, ignored, changes, searchString) {
        $super();
        this.title = title;
        this.changeList = changes;
		this.searchString = searchString;
    },
    
    getChangeBanners: function() {
        this.changeBanner = null;
        return this.changeList.map(function(each) { return this.bannerOfItem(each); }, this);
    },

    setChangeSelection: function(n, v) {
        this.changeBanner = n;
        this.changed("getChangeSelection", v);
        this.changed("getChangeItemText", v);
        if (this.searchString) this.changed("getSearchString", v);
    },

    getChangeSelection: function() {
        return this.changeBanner;
    },

    selectedItem: function() {
        if (this.changeBanner == null) return null;
        var i1 = this.changeBanner.indexOf(":");
        var i2 = this.changeBanner.indexOf(":", i1+1);
        var lineNo = this.changeBanner.substring(i1+1, i2);
        lineNo = new Number(lineNo);
        for (var i=0; i < this.changeList.length; i++) {
            var item = this.changeList[i];
            // Note: should confirm fileName here as well for search lists
            // where lineNo might match, but its a different file
            if (this.lineNoOfItem(item) == lineNo) return item;
        }
        return null;
    },

    bannerOfItem: function(item) {
		var lineStr = this.lineNoOfItem(item).toString();
        var firstLine = item.getSourceCode().truncate(40);  // a bit wastefull
        if (firstLine.indexOf("\r") >= 0) firstLine = firstLine.replace(/\r/g, "");
        var end = firstLine.indexOf(":");
        if (end >= 0) firstLine = firstLine.substring(0,end+1);
        var type = item.type ? item.type + ':' : '';
        var klass = item.className ? item.className + '>>' : '';
		if (!item.fileName)
			return lineStr.concat(": ", type, klass, firstLine);
		return item.fileName.concat(":", lineStr, ": ", type, klass, firstLine);
    },

    getChangeItemText: function() {
        var item = this.selectedItem();
        if (item == null) return "-----";
        return item.getSourceCode();
    },

    setChangeItemText: function(newString, view) {
        var item = this.selectedItem();
        if (item == null) return;

        var originalString = view.textBeforeChanges;
        var fileString = item.getSourceCode();
        if (originalString == fileString) {
            this.checkBracketsAndSave(item, newString, view);
            return;
        }

        WorldMorph.current().notify("Sadly it is not possible to save this text because\n"
            + "the original text appears to have been changed elsewhere.\n"
            + "Perhaps you could copy what you need to the clipboard, browse anew\n"
            + "to this code, repeat your edits with the help of the clipboard,\n"
            + "and finally try to save again in that new context.  Good luck.");
        },

    checkBracketsAndSave: function(item, newString, view) {
        var errorIfAny = this.checkBracketError(newString);
        if (! errorIfAny) {this.reallySaveItemText(item, newString, view); return; }

        var msg = "This text contains an unmatched " + errorIfAny + ";\n" +
                  "do you wish to save it regardless?";
        WorldMorph.current().confirm(msg, function (answer) {
            if (answer) this.reallySaveItemText(item, newString, view); }.bind(this));
    },

    reallySaveItemText: function(item, newString, editView) {
        item.putSourceCode(newString);
        editView.acceptChanges();
		this.changed('getChangeBanners');

        // Now recreate (slow but sure) list from new contents, as things may have changed
        if (this.searchString) return;  // Recreating list is not good for searches
        var oldSelection = this.changeBanner;
        this.changeList = item.newChangeList();
        this.changed('getChangeBanners');
        this.setChangeSelection(oldSelection);  // reselect same item in new list (hopefully)
    },

    checkBracketError: function (str) {
        // Return name of unmatched bracket, or null
        var cnts = {};
        cnts.nn = function(c) { return this[c] || 0; };  // count or zero
        for (var i=0; i<str.length; i++)  // tally all characters
            { cnts[ str[i] ] = cnts.nn(str[i]) +1 };
        if (cnts.nn("{") > cnts.nn("}")) return "open brace";
        if (cnts.nn("{") < cnts.nn("}")) return "close brace";
        if (cnts.nn("[") > cnts.nn("]")) return "open bracket";
        if (cnts.nn("[") < cnts.nn("]")) return "close bracket";
        if (cnts.nn("(") > cnts.nn(")")) return "open paren";
        if (cnts.nn("(") < cnts.nn(")")) return "close paren";
        if (cnts.nn('"')%2 != 0) return "double quote";  // "
        if (cnts.nn("'")%2 != 0) return "string quote";  // '
        return null; 
    },

    getSearchString: function() {
        return this.searchString;
    },

    getViewTitle: function() {
        return "Change list for " + this.title;
    },

	keyActions: function(evt) {
		// --> alt +b
		console.log('Key pressed....');
		if (!evt.isAltDown()) return false;
		if (evt.getKeyChar().toLowerCase() !== 'b') return false;
		if (!this.selectedItem().browseIt) return false;
		this.selectedItem().browseIt();
	},

    buildView: function(extent) {
        var panel = PanelMorph.makePanedPanel(extent, [
            ['topPane', newListPane, new Rectangle(0, 0, 1, 0.4)],
            ['bottomPane', newTextPane, new Rectangle(0, 0.4, 1, 0.6)]
        ]);
        var m = panel.topPane;
        m.connectModel({model: this, getList: "getChangeBanners", setSelection: "setChangeSelection", getSelection: "getChangeSelection", getMenu: "getListPaneMenu"});

		// adding keyPress actions fot the list
		// FIXME should be done in another way
		m.innerMorph().onKeyDown = m.innerMorph().onKeyDown.wrap(function(proceed, evt) {
			this.keyActions(evt);
			proceed(evt);
		}.bind(this));

        m = panel.bottomPane;
        m.innerMorph().getTextSelection().borderRadius = 0;
        m.connectModel({model: this, getText: "getChangeItemText", setText: "setChangeItemText", getSelection: "getSearchString", getMenu: "default"});
        return panel;
    },

	lineNoOfItem: function(item) {
		// helper for handling SourceCodeDescriptors as well as FileFragments... FIXME
		if (item.startLine) return item.startLine();
		if (item.lineNo) return item.lineNo;
		return -1;
	},

});  // balance


// ===========================================================================
// Source Database
// ===========================================================================
ChangeList.subclass('SourceDatabase', {
    // SourceDatabase is an interface to the Lively Kernel source code as stored
    // in a CVS-style repository, ie, as a bunch of text files.

    // First of all, it is capable of scanning all the source files, and breaking
    // them up into reasonable-sized pieces, hopefully very much like the
    // actual class defs and method defs in the files.  The partitioning is done
    // by FileParser and it, in turn, calls setDescriptorInClassForMethod to
    // store the source code descriptors for these variously recognized pieces.

    // In the process, it caches the full text of some number of these files for
    // fast access in subsequent queries, notably alt-w or "where", that finds
    // all occurrences of the current selection.  The result of such searches
    // is presented as a changeList.

    // The other major service provided by SourceDatabase is the ability to 
    // retrieve and alter pieces of the source code files without invalidating
    // previously scanned changeList-style records.

    // A sourceCodeDescriptor (q.v.) has a file name and version number, as well as 
    // start and stop character indices.  When a piece of source code is changed,
    // it will likely invalidate all the other sourceCodePieces that point later
    // in the file.  However, the SourceDatabase is smart (woo-hoo); it knows
    // where previous edits have been made, and what effect they would have had
    // on character ranges of older pieces.  To this end, it maintains an internal
    // version number for each file, and an edit history for each version.

    // With this minor bit of bookkeeping, the SourceDataBase is able to keep
    // producing source code pieces from old references to a file without the need
    // to reread it.  Moreover, to the extent its cache can keep all the
    // file contents, it can do ripping-fast scans for cross reference queries.
    //
    // cachedFullText is a cache of file contents.  Its keys are file names, and
    // its values are the current contents of the named file.

    // editHistory is a parallel dictionary of arrays of edit specifiers.

    // A SourceDatabase is created in response to the 'import sources' command
    // in the browser's classPane menu.  The World color changes to contrast that
    // (developer's) world with any other window that might be testing a new system
    // under develpment.

    // For now, we include all the LK sources, or at least all that you would usually
    // want in a typical development session.  We may soon want more control
    // over this and a reasonable UI for such control.

	codeBaseURL: URL.codeBase,
	
    initialize: function($super) {
        this.methodDicts = {};
        this.functionDefs = {};
        this.cachedFullText = {};
        this.editHistory = {};
    },

    addFunctionDef: function(def) {
        if (def.type !== 'functionDef') throw dbgOn(new Error('Wrong def'));
        this.functionDefs[def.name] = def;
    },
    
    functionDefFor: function(functionName) {
        return this.functionDefs[functionName];
    },
    
    methodDictFor: function(className) {
        if (!this.methodDicts[className]) this.methodDicts[className] = {}; 
        return this.methodDicts[className];
    },

    getSourceInClassForMethod: function(className, methodName) {
        var methodDict = this.methodDictFor(className);
        var descriptor = methodDict[methodName];
        if (!descriptor) return null;
        // *** Needs version edit tweaks...
        var fullText = this.getCachedText(descriptor.fileName);
        if (!fullText) return null;
        return fullText.substring(descriptor.startIndex, descriptor.stopIndex);
    },

    setDescriptorInClassForMethod: function(className, methodName, descriptor) {
        var methodDict = this.methodDictFor(className);
        methodDict[methodName] = descriptor;
    },

    browseReferencesTo: function(str) {
        var fullList = this.searchFor(str);
        if (fullList.length > 300) {
            WorldMorph.current().notify(fullList.length.toString() + " references abbreviated to 300.");
            fullList = fullList.slice(0,299);
        }
        var refs = new ChangeList("References to " + str, null, fullList);
        refs.searchString = str;
        refs.openIn(WorldMorph.current()); 
    },

    searchFor: function(str) {
        var fullList = [];
        Properties.forEachOwn(this.cachedFullText, function(fileName, fileString) {
            var refs = new FileParser().parseFile(fileName, this.currentVersion(fileName), fileString, this, "search", str);
            fullList = fullList.concat(refs);
        }, this);
        return fullList;
    },

    importKernelFiles: function(list) {
        // rk: list is not used anymore, can we get rid of that method?
        //     I also assume that the scanning should be syncronous, adding flag for that
        this.scanLKFiles(true);
	this.testImportFiles();
    },
    
    getSourceCodeRange: function(fileName, versionNo, startIndex, stopIndex) {
        // Remember the JS convention that str[stopindex] is not included!!
        var fileString = this.getCachedText(fileName);
        var mapped = this.mapIndices(fileName, versionNo, startIndex, stopIndex);
        return fileString.substring(mapped.startIndex, mapped.stopIndex);
    },

    putSourceCodeRange: function(fileName, versionNo, startIndex, stopIndex, newString) {
        var fileString = this.getCachedText(fileName);
        var mapped = this.mapIndices(fileName, versionNo, startIndex, stopIndex);
        var beforeString = fileString.substring(0, mapped.startIndex);
        var afterString = fileString.substring(mapped.stopIndex);
        var newFileString = beforeString.concat(newString, afterString);
        newFileString = newFileString.replace(/\r/gi, '\n');  // change all CRs to LFs
        var editSpec = {repStart: startIndex, repStop: stopIndex, repLength: newString.length};
        console.log("Saving " + fileName + "...");
        new NetRequest({model: new NetRequestReporter(), setStatus: "setRequestStatus"}
                ).put(this.codeBaseURL.withFilename(fileName), newFileString);
        // Update cache contents and edit history
        this.cachedFullText[fileName] = newFileString;
        this.editHistory[fileName].push(editSpec);
        console.log("... " + newFileString.length + " bytes saved.");
    },

    mapIndices: function(fileName, versionNo, startIndex, stopIndex) {
        // Figure how substring indices must be adjusted to find the same characters in the fileString
        // given its editHistory.
        // Note: This assumes only three cases: range above replacement, == replacement, below replacement
        // It should check for range>replacement or range<replacement and either indicate error or
        // possibly deal with it (our partitioning may be tractable)
        var edits = this.editHistory[fileName].slice(versionNo);
        var start = startIndex;  var stop = stopIndex;
        for (var i=0; i<edits.length; i++) {  // above replacement
            var edit = edits[i];
            var delta = edit.repLength - (edit.repStop - edit.repStart);  // patch size delta
            if (start >= edit.repStop) {  // above replacement
                start += delta;
                stop += delta;
            } else if (start == edit.repStart && stop == edit.repStop) {  // identical to replacement
                stop += delta;
            }  // else below the replacement so no change
        }  
        return {startIndex: start, stopIndex: stop};
    },

    changeListForFileNamed: function(fileName) {
        var fileString = this.getCachedText(fileName);
        return new FileParser().parseFile(fileName, this.currentVersion(fileName), fileString, this, "scan");
    },

    currentVersion: function(fileName) {
        // Expects to be called only when fileName will be found in cache!
        return this.editHistory[fileName].length;
    },

    getViewTitle: function() {
        return "Source Control for " + this.fileName;
    },

    testImportFiles: function() {
        // Enumerate all classes and methods, and report cases where we have no source descriptors
    },
    
    testMethodDefs: function() {
        // test if methods were parsed correctly
        // go to the source of all methods and use #checkBracketError for counting brackets
        var methodDefs = Object.values(this.methodDicts).inject([], function(methodDefs, classDef) {
            return methodDefs.concat(Object.values(classDef));
        });
        var defsWithError = methodDefs.select(function(ea) {
            if (Object.isFunction(ea) || !ea.getSourceCode) {
                console.log('No MethodDescriptor ' + ea);
                ea.error = 'Problem with descriptor, it is itself a function!';
                return true;
            };
            var error = this.checkBracketError(ea.getSourceCode());
            if (!error) return false;
            console.log('MethodDescriptor ' + ea.name + ' has an error.');
            ea.error = error;
            return true;
        }, this);
        return defsWithError;
    },
    
    // ------ reading files --------
    getCachedText: function(fileName) {
        // Return full text of the named file
        var fileString;
        var action = function(fileStringArg) { fileString = fileStringArg };
        this.getCachedTextAsync(fileName, action, true);
        return fileString || '';
    },
    
    getCachedTextAsync: function(fileName, action, beSync) {
        // Calls action with full text of the named file, installing it in cache if necessary
        var fileString = this.cachedFullText[fileName];
        if (fileString) {
            action.call(this, fileString);
            return;
        }
        
        var prepareDB = function(fileString) {
            this.cachedFullText[fileName] = fileString;
            this.editHistory[fileName] = [];
            action.call(this, fileString);
        }.bind(this);
        this.getFileContentsAsync(fileName, prepareDB, beSync);
    },
    
    getFileContentsAsync: function(fileName, action, beSync) {
	// DI:  This should be simplified - I removed timing (meaningless here for async)
	// rk: made async optional
	// convenient helper method
	var actionWrapper = function(fileString) {
		if (request.getStatus() >= 400)
			throw dbgOn(new Error('Cannot read ' + fileName));
	    action.call(this, fileString);
	}.bind(this);
	
	var request = new NetRequest({model: {callback: actionWrapper}, setResponseText: 'callback'});
	if (beSync) request.beSync();
        request.get(this.codeBaseURL.withFilename(fileName));
    },
    
    scanLKFiles: function(beSync) {
        this.interestingLKFileNames(URL.codeBase.withFilename('lively/')).each(function(fileName) {
            var action = function(fileString) {
                new FileParser().parseFile(fileName, this.currentVersion(fileName), fileString, this, "import");
            }.bind(this);
            this.getCachedTextAsync(fileName, action, beSync);
        }, this);
    },
    
    interestingLKFileNames: function(url) {
		var fileURLs = new WebResource(url).getSubElements().subDocuments.collect(function(ea) { return ea.getURL() })
		var fileNames = fileURLs.collect(function(ea) { return ea.relativePathFrom(URL.codeBase) })
        var acceptedFileNames = /.*\.(st|js|lkml|txt|ometa|st)/
		fileNames = fileNames.select(function(ea) { return acceptedFileNames.test(ea) });
        fileNames = fileNames.uniq();
        var rejects = ['JSON.js'];
		fileNames = fileNames.reject(function(ea) { return rejects.include(ea) });
		return fileNames;
    },

});

module.SourceControl = null;

module.startSourceControl = function() {
    if (module.SourceControl) return;
    module.SourceControl = new SourceDatabase();
    module.SourceControl.scanLKFiles(true);
};

// ===========================================================================
// Source Code Descriptor
// ===========================================================================
Object.subclass('SourceCodeDescriptor', {

    initialize: function(sourceControl, fileName, versionNo, startIndex, stopIndex, lineNo, type, name) {
	// This state represents a given range of a given version of a given file in the SourceControl
	// The lineNo, type and name are further info arrived at during file parsing
        this.sourceControl = sourceControl;
        this.fileName = fileName;
        this.versionNo = versionNo;
        this.startIndex = startIndex;
        this.stopIndex = stopIndex;
        this.lineNo = lineNo;
        this.type = type;  // Do these need to be retained?
        this.name = name;
    },

    getSourceCode: function() {
        return this.sourceControl.getSourceCodeRange(this.fileName, this.versionNo, this.startIndex, this.stopIndex);
    },

    putSourceCode: function(newString) {
        this.sourceControl.putSourceCodeRange(this.fileName, this.versionNo, this.startIndex, this.stopIndex, newString);
    },

    newChangeList: function() {
        return this.sourceControl.changeListForFileNamed(this.fileName);
    }

});

Object.subclass('BasicCodeMarkupParser', {
    documentation: "Evaluates code in the lkml code format",
    // this is the first attempt, format subject to change
    classQuery: new Query("/code/class"),
    protoQuery: new Query("proto"),
    staticQuery: new Query("static"),

    nameOf: function(element) {
	var name = element.getAttributeNS(null, "name");
	if (!name) throw new Error("no class name");
	return name;
    },

    parseDocumentElement: function(element, isHack) {
		var classes;
		if (isHack) {
	    	var xpe = new XPathEvaluator();
	    	function resolver(arg) {
				//return "http://www.w3.org/2000/svg";
				return Namespace.SVG;
			}
			var result = xpe.evaluate("/lively:code/lively:class", element, resolver, XPathResult.ANY_TYPE, null);
	    	var res = null;
	    	classes = [];
	    	while (res = result.iterateNext()) classes.push(res);
		}  else {
	    	classes = this.classQuery.findAll(element);
		}

		for (var i = 0; i < classes.length; i++) 
	  	  this.parseClass(classes[i], isHack);
		return classes;
    },

    parseClass: function(element, isHack) {
	// note eval oreder first parse proto methods, then static methods.
	var className = this.nameOf(element);
	var klass = null;
	var superName = element.getAttributeNS(null, "super");
	
	if (superName) { // super is present so we are subclassing (too hackerish?)
	    var superClass = Class.forName(superName);
	    if (!Class.isClass(superClass)) throw new Error('no superclass');
	    klass = superClass.subclass(className);
	} else {
	    klass = Class.forName(className);
	}
	
	var protos;

	if (isHack) {
	    var xpe = new XPathEvaluator();
	    function resolver(arg) {
		return Namespace.SVG;
	    }
	    var result = xpe.evaluate("hack:proto", element, resolver, XPathResult.ANY_TYPE, null);
	    protos = [];
	    var res = null;
	    while (res = result.iterateNext()) protos.push(res);
	}  else {
	    protos = this.protoQuery.findAll(element);
	}

	for (var i = 0; i < protos.length; i++)
	    this.parseProto(protos[i], klass);

	var statics = this.staticQuery.findAll(element);
	for (var i = 0; i < statics.length; i++)
	    this.parseStatic(statics[i], klass);
    },

    evaluateElement: function(element) {
	try {
	    // use intermediate value because eval doesn't seem to return function
	    // values.
	    // this would be a great place to insert a Cajita evaluator.
	    return eval("BasicCodeMarkupParser._=" + element.textContent);
	} catch (er) { 
	    console.log("error " + er + " parsing " + element.textContent);
	    return undefined;
	}
    },

    parseProto: function(protoElement, cls) {
	var name = this.nameOf(protoElement);
	var mixin = {};
	mixin[name] = this.evaluateElement(protoElement);
	cls.addMethods(mixin);
    },

    parseStatic: function(staticElement, cls) {
	var name = this.nameOf(staticElement);
	cls[name] = this.evaluateElement(staticElement);
    }

});



BasicCodeMarkupParser.subclass('CodeMarkupParser', ViewTrait, {
    formals: ["CodeDocument", "CodeText", "URL"],

    initialize: function(url) {
	var model = Record.newPlainInstance({ CodeDocument: null, CodeText: null, URL: url});
	this.resource = new Resource(model.newRelay({ ContentDocument: "+CodeDocument", ContentText: "+CodeText", URL: "-URL"}), 
				     "application/xml");
	this.connectModel(model.newRelay({ CodeDocument: "CodeDocument", CodeText: "CodeText"}));
    },

    parse: function() {
	this.resource.fetch();
    },
    
    onCodeTextUpdate: function(txt) {
	if (!txt) return;
	// in case the document is served as text anyway, try forcing xml
	var parser = new DOMParser();
	var xml = parser.parseFromString(txt, "text/xml");
	this.onCodeDocumentUpdate(xml);
    },

    onCodeDocumentUpdate: function(doc) {
	if (!doc) return;
	this.parseDocumentElement(doc.documentElement);
	this.onComplete();
    },

    onComplete: function() {
	// override to supply an action 
    }, 

});

Object.extend(CodeMarkupParser, {
    load: function(filename, callback) {
	var parser = new CodeMarkupParser(SourceDatabase.prototype.codeBaseURL.withFilename(filename));
	if (callback) parser.onComplete = callback;
	parser.parse();
    }
});

}.logCompletion("Tools.js"));

