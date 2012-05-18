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


/* Code loader. Appends file to DOM. */
Object.subclass('ScriptLoader', {
	
	getScripts: function() { return $A(document.getElementsByTagName('script')) },

	loadJs: function(url, onLoadCb, embedSerializable/*currently not used*/) {
		if (this.scriptInDOM(url)) {
			console.log('script ' + url + ' already loaded');
			return
		};
		if (window.shouldShowLoadingMessages) { console.log('loading script ' + url); }
		// FIXME Assumption that first def node has scripts
		var node = document.getElementsByTagName("defs")[0] || this.getScripts()[0].parentElement;
		if (!node) throw(dbgOn(new Error('Cannot load script ' + url + ' dont know where to append it')));
		var exactUrl = Config.disableScriptCaching ? url + '?' + new Date().getTime() : url;
		var xmlNamespace = node.namespaceURI;

		var script = document.createElementNS(xmlNamespace, 'script');
		script.setAttributeNS(null, 'id', url);
		script.setAttributeNS(null, 'type', 'text/ecmascript');

		if (xmlNamespace == Namespace.SVG)
			script.setAttributeNS(Namespace.XLINK, 'href', exactUrl);
		else
		script.setAttributeNS(null, 'src', exactUrl);

		script.setAttributeNS(null, 'onload', onLoadCb);

		node.appendChild(script);
	},

	scriptInDOM2: function(url) {
		return this.getScripts().some(function(e) {
			return (e.getAttribute('xlink:href') && e.getAttribute('xlink:href') == url) ||
				(e.getAttribute('src') && e.getAttribute('src') == url)
		});
	},

	scriptInDOM: function(url) {
		if (document.getElementById(url)) return true;
		var scriptElements = this.getScripts();
		for (var i = 0; i < scriptElements.length; i++)
			if (this.scriptElementLinksTo(scriptElements[i], url)) return true;
		return false;
	},

	scriptElementLinksTo: function(el, url) {
		if (!el.getAttribute) return false;
		// FIXME use namespace consistently
		if (el.getAttribute('id') == url) return true;
		var link = el.getAttribute('xlink:href') || el.getAttribute('src');
		if (!link) return false;
		if (url == link) return true;
		// Hack
		// FIXME just using the file name does not really work for namespaces
		// http://bla/test.xhtml?01234 -> test.xhtml?01234 -> test.xhtml
		var linkName = link.split('/').last().split('?').first();
		var urlName = url.split('/').last().split('?').first();
		return linkName == urlName;
	},
	
}); 

Object.extend(Global, {
	Loader: new ScriptLoader(),
});

// test which checks if all modules are loaded
(function testModuleLoad() {
    var modules = Global.subNamespaces(true).select(function(ea) { return ea.wasDefined });
    modules
        .select(function(ea) { return ea.hasPendingRequirements() })
        .forEach(function(ea) { console.warn(ea.uri() + ' has unloaded requirements: ' + ea.pendingRequirementNames()) });
    if (window.shouldShowLoadingMessages) { console.log('Module load check done. ' + modules.length + ' modules loaded.'); }
}).delay(5);

// ===========================================================================
// Error/warning console (browser dependent)
// ===========================================================================

// console handling
(function() { 
    
    // from firebug lite
    function escapeHTML(value) {
		return value;
	
		function replaceChars(ch) {
			switch (ch) {
				case "<": return "&lt;";
				case ">": return "&gt;";
				case "&": return "&amp;";
				case "'": return "&#39;";
				case '"': return "&quot;";
			}
			return "?";
		}
	
		return String(value).replace(/[<>&"']/g, replaceChars); //KP: this comment to workaround a bug in my Emacs's javascript mode " ])
    }
    
	function LogWindow() {
		this.win = (function() { 
			var win = Global.window.open("", "log", "scrollbars,width=900,height=300"); 
			win.title = "Lively Kernel Log";
			win.document.write("<pre>"); 
			return win; 
		})();

		this.log = function(msg) {
			if (!this.win) return;
			this.win.document.writeln(escapeHTML(msg));
		}
	};
    
    var platformConsole = Global.window.console || ( Global.window.parent && Global.window.parent.console); 
    if (!platformConsole) {
		if (!Config.disableNoConsoleWarning) {
			window.alert && window.alert('no console! console output disabled');
		};
		platformConsole = { log: function(msg) { } } // do nothing as a last resort
    }
    
	if (Global.console && Global.console.firebug !== undefined) return; // Firebug doesn't like to be overwritten
	
 	// rebind to something that has all the calls, and forwards ti consumers...
	Global.console = {
	    
		platformConsole: platformConsole,
		
		// forwarding Fierbug functions...
		// from: http://getfirebug.com/logging
		// http://michaelsync.net/2007/09/09/firebug-tutorial-logging-profiling-and-commandline-part-i
		profile:  function profile() {
			if (platformConsole.profile)
				platformConsole.profile.apply(platformConsole, arguments)
		},

		profileEnd: function profileEnd() {
			if (platformConsole.profileEnd)
				platformConsole.profileEnd.apply(platformConsole, arguments)
		},

		time: function time() {
			if (platformConsole.time)
				platformConsole.time.apply(platformConsole, arguments)
		},

		timeEnd: function timeEnd() {
			if (platformConsole.timeEnd)
				platformConsole.timeEnd.apply(platformConsole, arguments)
		},
		
		trace: function trace() {
			if (platformConsole.trace)
				platformConsole.trace.apply(platformConsole, arguments)
		},
		
		
		// Nested grouping
		group: function group() {
			if (platformConsole.group)
				platformConsole.group.apply(platformConsole, arguments)
		},

		groupEnd: function groupEnd() {
			if (platformConsole.groupEnd)
				platformConsole.groupEnd.apply(platformConsole, arguments)
		},
		
		// Object inspection
		dir: function dir() {
			if (platformConsole.dir)
				platformConsole.dir.apply(platformConsole, arguments)
		},
		// end forwarding Fierbug functions
		
	    consumers: [ platformConsole], // new LogWindow() ],
	    
		warn: function warn() {
			var args = $A(arguments);
			this.consumers.forEach(function(c) { 
				if (c.warn) c.warn.apply(c, args); 
				else c.log("Warn: " + Strings.formatFromArray(args));
			});
		},
	    
		info: function info() {
			var args = $A(arguments);
			this.consumers.forEach(function(c) { 
				if (c.info) c.info.apply(c, args); 
				else c.log("Info: " + Strings.formatFromArray(args));
			});
		},
	    
		log: function log() {
			this.consumers.invoke('log', Strings.formatFromArray($A(arguments)));
		},
	    
		assert: function assert(expr, msg) {
			if (!expr) this.log("assert failed:" + msg);
		}
	}
	
	// WebCards
	// if(UserAgent.isChrome){//Google Chrome dose not support multiple Params for logging
	// 	var orignalWarn = platformConsole.warn;
	// 	platformConsole.warn = function(){
	// 		orignalWarn.apply(platformConsole,[Strings.formatFromArray($A(arguments))]);
	// 	};
	// 	
	// 	var orignalInfo = platformConsole.info;
	// 	platformConsole.info = function(){
	// 		orignalInfo.apply(platformConsole,[Strings.formatFromArray($A(arguments))]);
	// 	};
	// 	
	// 	var orignalLog = platformConsole.log;
	// 	platformConsole.log = function(){
	// 		orignalLog.apply(platformConsole,[Strings.formatFromArray($A(arguments))]);
	// 	};
	// }
	
    
})(); 

Object.extend(Global.window, {
	onerror: function(message, url, code) {
		console.log('in %s: %s, code %s', url, message, code);
	},
	/* commented out by Adam, don't want this at all, because it overwrites our own version
	onbeforeunload: function(evt) { 
		if (Config.askBeforeQuit) {
			var msg = "Lively Kernel data may be lost if not saved.";
			evt.returnValue = msg; 
			return msg;
		} else return null;
	}
	*/
	// onblur: function(evt) { console.log('window got blur event %s', evt); },
	// onfocus: function(evt) { console.log('window got focus event %s', evt); }
});


(function() { // override config options with options from the query part of the URL

    // may have security implications ...
    var query = Global.document.documentURI.split('?')[1];
    if (!query) return;

    var configOverrides = query.toQueryParams();
    for (var p in configOverrides) {
	if (Config.hasOwnProperty(p)) { // can't set unknown properties
	    // this is surprisingly convoluted in Javascript:
	    if ((typeof Config[p].valueOf()) === 'boolean') { 
		// make sure that "false" becomes false
		Config[p] = configOverrides[p].toLowerCase() == "true";
	    } else {
		Config[p] = configOverrides[p];
	    }
	} else {
	    console.log("ignoring unknown property " + p);
	}
    }
})();    


// ===========================================================================
// DOM manipulation (Browser and graphics-independent)
// ===========================================================================

Namespace =  {
    SVG : "http://www.w3.org/2000/svg", 
    LIVELY : UserAgent.usableNamespacesInSerializer ? "http://www.experimentalstuff.com/Lively"  : null, 
    XLINK : "http://www.w3.org/1999/xlink", 
    XHTML: "http://www.w3.org/1999/xhtml"
};

var Converter = {
    documentation: "singleton used to parse DOM attribute values into JS values",


    toBoolean: function toBoolean(string) {
		return string && string == 'true';
    },

    fromBoolean: function fromBoolean(object) {
	if (object == null) return "false";
	var b = object.valueOf();
	// this is messy and should be revisited
	return (b === true || b === "true") ? "true" : "false";
    },

    parseInset: function(string) {
	// syntax: <left>(,<top>(,<right>,<bottom>)?)?
	
	if (!string || string == "none") return null;
	try {
	    var box = string.split(",");
	} catch (er) {alert("string is " + string + " string? " + (string instanceof String)) }
	var t, b, l, r;
	switch (box.length) {
	case 1:
	    b = l = r = t = lively.data.Length.parse(box[0].strip());
	    break;
	case 2:
	    t = b = lively.data.Length.data.parse(box[0].strip());
	    l = r = lively.data.Length.data.parse(box[1].strip());
	    break;
	case 4:
	    t = lively.data.Length.parse(box[0].strip());
	    l = lively.data.Length.parse(box[1].strip());
	    b = lively.data.Length.parse(box[2].strip());
	    r = lively.data.Length.parse(box[3].strip());
	    break;
	default:
	    console.log("unable to parse padding " + padding);
	    return null;
	} 
        return Rectangle.inset(t, l, b, r);
    },

	wrapperAndNodeEncodeFilter: function(baseObj, key) {
		var value = baseObj[key];
		if (value instanceof lively.data.Wrapper) return value.uri();
		if (value instanceof Document || value instanceof Element || value instanceof DocumentType)
			return JSON.serialize({XML: Exporter.stringify(value)});
		return value;
	},

	wrapperAndNodeDecodeFilter:  function(baseObj, key) {
		var value = baseObj[key];
		// console.log("wrapperAndNodeDecodeFilter: " + baseObj + " key: " + key + " value: " + baseObj[key]);
		if (Object.isString(value)) {
			var uri = lively.data.FragmentURI.parse(value)
			if (uri) {
				// resolve uri to an object
				// Search the world, because we don't have an general URI resolver
				var obj = WorldMorph.current().resolveUriToObject(uri)
				if (obj)
					return obj;
				else
					return value;
			}
		}
		return Converter.nodeDecodeFilter(baseObj, key)
    },

    nodeEncodeFilter: function(baseObj, key) {
        var value = baseObj[key];
		if (!value) return value;
        if (!value.nodeType) return value;
        if (value.nodeType !== document.DOCUMENT_NODE && value.nodeType !== document.DOCUMENT_TYPE_NODE)
            return JSON.serialize({XML: Exporter.stringify(value)});
        throw new Error('Cannot store Document/DocumentType'); // to be removed
    },
    
    toJSONAttribute: function(obj) {
		return obj ? escape(JSON.serialize(obj, Converter.wrapperAndNodeEncodeFilter)) : "";
    },

    nodeDecodeFilter: function(baseObj, key) {
		var value = baseObj[key];
		if (!value || !Object.isString(value) || !value.include('XML')) return value;
		var unserialized = JSON.unserialize(value);
		if (!unserialized.XML) return value;
		// var xmlString = value.substring("XML:".length);
		// FIXME if former XML was an Element, it has now a new parentNode, seperate in Elements/Documents?
		//dbgOn(true);
		var node = new DOMParser().parseFromString(unserialized.XML, "text/xml");
        return document.importNode(node.documentElement, true);
    },

    fromJSONAttribute: function(str) {
		return str ?  JSON.unserialize(unescape(str), Converter.nodeDecodeFilter) : null;
    },
    
    needsJSONEncoding: function(value) {
		// some objects can be saved in as DOM attributes using their
		// .toString() form, others need JSON
		if (value instanceof Color) return false;
		var type = typeof value.valueOf();
		return type != "string" && type != "number"; 
    },

	quoteCDATAEndSequence: function(string) {
		var closeCDATASequence = "]]>";
		if (string.include(closeCDATASequence)) {
			console.log("Warning: quoted CDATA Sequence ] ] >")
			string = string.replace(closeCDATASequence, "\\]\\]\\>");
		};
		return string
	},

	// TODO parallels to preparePropertyForSerialization in scene.js
	// Why to we encodeProperties for Records at runtime and not at serialization time?
    encodeProperty: function(prop, propValue, isItem) {
		if (isItem) {
			var desc = LivelyNS.create("item");
		} else {
			var desc = LivelyNS.create("field", {name: prop});
		}
		if (Converter.isJSONConformant(propValue) || propValue instanceof Array) { // hope for the best wrt/arrays
		    // FIXME: deal with arrays of primitives etc?
		    var encoding;
		    if (propValue === null)
				encoding = NodeFactory.createText("null");
		    else switch (typeof propValue) {
		    	case "number":
		    	case "boolean":
					encoding = NodeFactory.createText(String(propValue));
					break;
		    	default:
					var jsonSource = JSON.serialize(propValue, Converter.wrapperAndNodeEncodeFilter);
					encoding = NodeFactory.createCDATA(this.quoteCDATAEndSequence(jsonSource));
		    }
		    desc.appendChild(encoding);
		    return desc;
		} 
	
		if (propValue && propValue.toLiteral) {
		    desc.setAttributeNS(null, "family", propValue.constructor.type);
		    desc.appendChild(NodeFactory.createCDATA(JSON.serialize(propValue.toLiteral())));
		    return desc;
		}
				
		if (propValue.nodeType) {
		    switch (propValue.nodeType) {
		    case document.DOCUMENT_NODE:
		    case document.DOCUMENT_TYPE_NODE:
			throw new Error('Cannot store Document/DocumentType'); // to be removed
		    default:
			desc.setAttributeNS(null, "isNode", true); // Replace with DocumentFragment
			desc.appendChild(document.importNode(propValue, true));
		    }
		    return desc;
		} 
		return null;
    },
    
    isJSONConformant: function(value) { // for now, arrays not handled but could be
        if (value instanceof Element && value.ownerDocument === document) return false;
        // why disallow all objects?
	// KP: because we don't know how to handle them up front, special cases handled bye encodeProperty
	// this makes simple objects like {a: 1} hard to serialize
	// fix for now: objects can determine by themselves if isJSONConformant should be true
        return value == null || value.isJSONConformant || (typeof value.valueOf()  !== 'object');
    }

};


var NodeFactory = {

    createNS: function(ns, name, attributes) {
	var element = Global.document.createElementNS(ns, name);
	return NodeFactory.extend(ns, element, attributes);
    },

    create: function(name, attributes) {
	//return this.createNS(Namespace.SVG, name, attributes);  // doesn't work
	var element = Global.document.createElementNS(Namespace.SVG, name);
	return NodeFactory.extend(null, element, attributes);
    },

    extend: function(ns, element, attributes) {
	if (attributes) {
	    for (var name in attributes) {
		if (!attributes.hasOwnProperty(name)) continue;
		element.setAttributeNS(ns, name, attributes[name]);
	    }
	}
	return element;
    },

    createText: function(string) {
	return Global.document.createTextNode(string);
    },
    
    createNL: function(string) {
	return Global.document.createTextNode("\n");
    },

    createCDATA: function(string) {
	return Global.document.createCDATASection(string);
    },

	CDATAType: function() {
		return Global.document.CDATA_SECTION_NODE;
	},
	
	TextType: function() {
		return Global.document.TEXT_NODE;
	}


};

XLinkNS = {
	create: function(href, doc) {
		var doc = doc || Global.document;
		var node = NodeFactory.createNS(null, 'script', {type: "text/ecmascript"});
		node.setAttribute('xlink:href', href);
		// XLinkNS.setHref(node, href); // does not seem to work
		return node;
	},
    setHref: function(node, href) {
	return node.setAttributeNS(Namespace.XLINK, "href", href);
    },
    
    getHref: function(node) {
	return node.getAttributeNS(Namespace.XLINK, "href");
    }
};

LivelyNS = {

	create: function(name, attributes) {
		return NodeFactory.createNS(Namespace.LIVELY, name, attributes);
	},

	getAttribute: function(node, name) {
		if (UserAgent.isOpera) return node.getAttribute(name); // Fix for Opera 10.10
		return node.getAttributeNS(Namespace.LIVELY, name);
	},

	removeAttribute: function(node, name) {
		return node.removeAttributeNS(Namespace.LIVELY, name);
	},

	setAttribute: function(node, name, value) {
		node.setAttributeNS(Namespace.LIVELY, name, value);
	},

	getType: function(node) {
		return node.getAttributeNS(Namespace.LIVELY, "type");
	},

	setType: function(node, string) {
		node.setAttributeNS(Namespace.LIVELY, "type", string);
	}
};

XHTMLNS = {

	create: function(name, attributes) {
		return NodeFactory.createNS(Namespace.XHTML, name, attributes);
	},

	getAttribute: function(node, name) {
		if (UserAgent.isOpera) return node.getAttribute(name); // Fix for Opera 10.10
		return node.getAttributeteNS(null, name);
	},

	removeAttribute: function(node, name) {
		return node.removeAttributeNS(null, name);
	},

	setAttribute: function(node, name, value) {
		node.setAttributeNS(null, name, value);
	},

	getType: function(node) {
		return node.getAttributeNS(Namespace.LIVELY, "type");
	},

	setType: function(node, string) {
		node.setAttributeNS(Namespace.LIVELY, "type", string);
	}
};
  
Class.addMixin(lively.data.DOMRecord, lively.data.Wrapper.prototype);
Class.addMixin(lively.data.DOMNodeRecord, lively.data.Wrapper.prototype);



if (window.shouldShowLoadingMessages) { console.log("Loaded basic DOM manipulation code"); }

// ===========================================================================
// Event handling foundations
// ===========================================================================

/**
  * @class Event: replacement Event class. (NOTE: PORTING-SENSITIVE CODE)
  * The code below rebinds the Event class to a LK substitute that wraps around 
  * the browser implementation.
  * For a detailed description of the Event class provided by browsers,
  * refer to, e.g., David Flanagan's book (JavaScript: The Definitive Guide).
  */

var Event = (function() {
    var tmp = Event; // note we're rebinding the name Event to point to a different class 

    var Event = Object.subclass('Event', {

	capitalizer: {
		mouseup: 'MouseUp', mousedown: 'MouseDown', mousemove: 'MouseMove', 
		mouseover: 'MouseOver', mouseout: 'MouseOut', mousewheel: 'MouseWheel',
		keydown: 'KeyDown', keypress: 'KeyPress', keyup: 'KeyUp',
		// touch and gesture stuff added by Adam
		touchstart: 'TouchStart', touchmove: 'TouchMove', touchend: 'TouchEnd', touchcancel: 'TouchCancel',
		gesturestart: 'GestureStart', gesturechange: 'GestureChange', gestureend: 'GestureEnd',
	},
	
	initialize: function(rawEvent) {
		this.rawEvent = rawEvent;
		this.type = this.capitalizer[rawEvent.type] || rawEvent.type;
		//this.charCode = rawEvent.charCode;

		// fix timeStamp, e.g in Opera
		this.timeStamp = this.rawEvent.timeStamp || new Date().getTime();

		this.prepareMousePoint();
		
		this.hand = null;

		// use event.timeStamp
		// event.msTime = (new Date()).getTime();
		this.mouseButtonPressed = false;
	},
	
	// added by Adam
	setHand: function(hand) {
	  this.hand = hand;
	  return this;
	},

	prepareMousePoint: function() {
		if (this.isMouseEvent())
			this.addMousePoint(this.rawEvent)
	},
	
  offset: function() {
  	// Rearranged this whole function to make it work right in both FireFox and Safari. -- Adam

  	// note that FF doesn't doesnt calculate offsetLeft/offsetTop early enough we don't precompute these values
  	var e = this.canvas();
  	// Look up the parentNode chain for a node that actually knows its offsetParent. Necessary because
  	// for some reason in FireFox not every node does. -- Adam
  	while (e && !e.offsetParent) { e = e.parentNode; }

  	var offsetX = 0;
  	var offsetY = 0; // Why the heck was this -3? -- Adam

		while (e) {
			offsetX += e.offsetLeft || 0; // || 0 added by Adam
			offsetY += e.offsetTop  || 0; // || 0 added by Adam
			e = e.offsetParent;
  	}

  	return pt(offsetX, offsetY);
  },
	
	addMousePoint: function(evtOrTouch) {
		var pos = pt(evtOrTouch.pageX || evtOrTouch.clientX, evtOrTouch.pageY || evtOrTouch.clientY);
		this.mousePoint = pos.subPt(this.offset());
		this.priorPoint = this.mousePoint;
	},
	
	isMouseEvent: function() {
		return Event.mouseEvents.include(this.rawEvent.type);
	},
	
	// touch and gesture stuff added by Adam
	isTouchEvent: function() {
		return Event.touchEvents.include(this.rawEvent.type);
	},
 	isGesture: function() { return this.touches().length > 1 },
	// see http://www.sitepen.com/blog/2008/07/10/touching-and-gesturing-on-the-iphone/
	touches: function() { return this.rawEvent.touches },
	targetTouches: function() { return this.rawEvent.targetTouches },
	changedTouches: function() { return this.rawEvent.changedTouches },
	
	simpleCopy: function() {
		return new Event(this.rawEvent);
	},

	canvas: function() {
		if (!UserAgent.usableOwnerSVGElement) {
			// so much for multiple worlds on one page
			return Global.document.getElementById("canvas");
		} else {
			return this.rawEvent.currentTarget.ownerSVGElement;
		}
	},

	stopPropagation: function() {
		this.rawEvent.stopPropagation();
	},

	preventDefault: function() {
		this.rawEvent.preventDefault();
    this.rawEvent.returnValue = false; // Added because I think it might help on Windows, though I'm really not sure. -- Adam, 2008
	},

	stop: function() {
		this.preventDefault();
		this.stopPropagation();
	},

	isAltDown: function() {
		return this.rawEvent.altKey;
	},

	isCommandKey: function() {
		// this is LK convention, not the content of the event
		if (Config.useAltAsCommand)
			return this.isAltDown();
		if (UserAgent.isWindows || UserAgent.isLinux )
			return this.isCtrlDown()
		if (UserAgent.isOpera) // Opera recognizes cmd as ctrl!!?
			return this.isCtrlDown()
		return this.isMetaDown()
	},

	isShiftDown: function() {
		return this.rawEvent.shiftKey;
	},

	isMetaDown: function() {
		return this.rawEvent.metaKey;
	},

	isCtrlDown: function() {
		return this.rawEvent.ctrlKey;
	},

	toString: function() {
		return Strings.format("#<Event:%s%s%s>",
			this.type,
			this.mousePoint ?  "@" + this.mousePoint : "",
			this.getKeyCode() || "");
	},

	setButtonPressedAndPriorPoint: function(buttonPressed, priorPoint) {
		this.mouseButtonPressed = buttonPressed;
		// if moving or releasing, priorPoint will get found by prior morph
		this.priorPoint = priorPoint; 
	},

	handlerName: function() {
		return "on" + this.type;
	},

	getKeyCode: function() {
		return this.rawEvent.keyCode;
	},

	getKeyChar: function() {
		if (this.type == "KeyPress") { // rk what's the reason for this test?
			var id = this.rawEvent.charCode || this.rawEvent.which;
			if (id > 63000) return ""; // Old Safari sends weird key char codes
			return id ? String.fromCharCode(id) : "";
		} else  {
			var code = this.rawEvent.which;
			return code && String.fromCharCode(code);
		}
	},

	wheelDelta: function() {
	    // FIXME: make browser-independent
	    return this.rawEvent.wheelDelta;
	},
	
	point: function() {
	    // likely origin of event, obvious for mouse events, the hand's position for
	    // keyboard events
	    return this.mousePoint || this.hand.getPosition();
	},
	
	isLeftMouseButtonDown: function() {
		return this.rawEvent.button === 0;
	},

	isMiddleMouseButtonDown: function() {
		return this.rawEvent.button === 1;
	},

	isRightMouseButtonDown: function() {
		return this.rawEvent.button === 2;
	}

    });

    Event.rawEvent = tmp;

    Object.extend(Event, {
		// copied from prototype.js:
		KEY_BACKSPACE: 8,
		KEY_TAB:       9,
		KEY_RETURN:   13,
		KEY_ESC:      27,
		KEY_LEFT:     37,
		KEY_UP:       38,
		KEY_RIGHT:    39,
		KEY_DOWN:     40,
		KEY_DELETE:   46,
		KEY_HOME:     36,
		KEY_END:      35,
		KEY_PAGEUP:   33,
		KEY_PAGEDOWN: 34,
		KEY_INSERT:   45,

		// not in prototype.js:
		KEY_SPACEBAR: 32,
		
		prepareEventSystem: function() {
		    var disabler = {    
				handleEvent: function(evt) { 	
			    	evt.preventDefault(); 
			    	return false;
				}
		    };
		    var canvas = avocado.transporter.livelyKernelInitializer.createCanvasIfNone(); // aaa used to say Global.document.getElementById("canvas") but better to create it if it's not there yet. -- Adam
			if (!canvas) return
		    canvas.addEventListener("dragstart", disabler, true);
		    canvas.addEventListener("selectstart", disabler, true);
			if (Config.suppressDefaultMouseBehavior)
				Global.document.oncontextmenu = Functions.False
		},
    });

    var basicMouseEvents =  ["mousedown", "mouseup", "mousemove", "mousewheel"];
    var extendedMouseEvents = [ "mouseover", "mouseout"];
    Event.mouseEvents = basicMouseEvents.concat(extendedMouseEvents);

    Event.keyboardEvents = ["keypress", "keyup", "keydown"];
    // touch and gesture stuff added by Adam
    Event.touchEvents = ["touchstart", "touchmove", "touchend", "touchcancel"];
    Event.gestureEvents = ["gesturestart", "gesturechange", "gestureend"];
    Event.basicInputEvents = basicMouseEvents.concat(Event.keyboardEvents, Event.touchEvents, Event.gestureEvents);

    return Event;
})();

function equals(leftObj, rightObj) {
    if (!leftObj && !rightObj) return true;
    if (!leftObj || !rightObj) return false;
    switch (leftObj.constructor) {
        case String:
	case Boolean:
	case Number:
            return leftObj == rightObj;
    };
    if (leftObj.isEqualNode)
        return leftObj.isEqualNode(rightObj);
    var cmp = function(left, right) {
	for (var value in left)
	    if (!(left[value] instanceof Function))
		return equals(left[value], right[value]);
    };
    return cmp(leftObj, rightObj) && cmp(rightObj, leftObj);
};


Object.subclass('Exporter', {
    documentation: "Implementation class for morph serialization",

    rootMorph: null,

	initialize: function(rootMorph) {
		this.rootMorph = rootMorph;
		(rootMorph instanceof Morph) || console.log("weird, root morph is " + rootMorph);
	},

	extendForSerialization: function(optSystemDictionary) {
		console.log("extendForSerialization " + optSystemDictionary)
		
		// decorate with all the extra needed to serialize correctly. Return the additional nodes, to be removed 
		var helperNodes = [];

		var exporter = this;

		lively.data.Wrapper.collectSystemDictionaryGarbage(this.rootMorph);	

		this.rootMorph.withAllSubmorphsDo(function() { 
			exporter.verbose && console.log("serializing " + this);
			this.prepareForSerialization(helperNodes, optSystemDictionary);			
			var nl = NodeFactory.createNL();
			this.rawNode.parentNode.insertBefore(nl, this.rawNode);
			helperNodes.push(nl);
		});
		return helperNodes;
	},

	removeHelperNodes: function(helperNodes) {
		for (var i = 0; i < helperNodes.length; i++) {
			var n = helperNodes[i];
			n.parentNode.removeChild(n);
		}
	},

	serialize: function(destDocument) {
		// model is inserted as part of the root morph.
		var helpers = this.extendForSerialization();
		var result = destDocument.importNode(this.rootMorph.rawNode, true);
		this.removeHelperNodes(helpers);
		return result;
	}
});

Object.extend(Exporter, {

	stringify: function(node) {
		return node ? new XMLSerializer().serializeToString(node) : null;
	},

	stringifyArray: function(nodes, conj) {
		return nodes.map(function(n) { return Exporter.stringify(n) }).join(conj);
	},

	shrinkWrapNode: function(node) {
		// FIXME deal with subdirectories: rewrite the base doc and change xlink:href for scripts
		var importer = new Importer();
		var newDoc = importer.getBaseDocument();
		importer.canvas(newDoc).appendChild(newDoc.importNode(node, true));
		return newDoc;
	},

	shrinkWrapMorph: function(morph) {
		var importer = new Importer();
		var newDoc = importer.getBaseDocument();
		if (!newDoc) 
			throw new Error('Can not continue serializing World beacause the base document is broken')
		newDoc.getElementsByTagName("title")[0].textContent = document.title; // persist the title
		// FIXME this should go to another place?
		this.addSystemDictionary(newDoc);
		importer.canvas(newDoc).appendChild(new Exporter(morph).serialize(newDoc));
		return newDoc;
	},
	
	addSystemDictionary: function(doc) {
		var dict = lively.data.Wrapper.dictionary;
		if (!dict) return;
		var preExisting = doc.getElementById(dict.id);
		if (preExisting)
			preExisting.parentNode.removeChild(preExisting);
		var newDict = dict.cloneNode(true);
		doc.getElementsByTagName('svg')[0].appendChild(doc.importNode(newDict, true));
	},

	saveDocumentToFile: function(doc, filename) {
		console.group("save document")
		if (!filename) return null;
		if (!filename.endsWith('.xhtml')) {
			filename += ".xhtml";
			console.log("changed url to " + filename + " for base " + URL.source);
		}

		var url = URL.source.withFilename(filename);
		
		var r = new WebResource(url);
		connect(r, 'status', this, 'showSaveStatus');
		
		// TODO add progress bar
		// connect(r, 'progress', WorldMorph.current(), 'alert', {converter: function(rpe) { return rpe.loaded }});
		
		r.beAsync().put(doc)
		
		return url;
	},

	showSaveStatus: function(status) {
		if (status.isSuccess()) {
			console.log("success publishing world at " + status.url + ", status " + status.code());
			console.timeEnd("save document")
			console.groupEnd("save document")
		} else {
			WorldMorph.current().alert("failure publishing world at " + status.url + ", status " + status.code());
		}
		console.groupEnd("save document")
	},
	
	saveNodeToFile: function(node, filename) {
		return this.saveDocumentToFile(this.shrinkWrapNode(node), filename);
	}

});

Object.subclass('Copier', {
	documentation: "context for performing deep copy of objects",

	wrapperMap: null,

	toString: function() { 
		return "#<Copier>"; 
	},

	initialize: function() {
		this.wrapperMap = {};
	},

	addMapping: function(oldId, newMorph) {
		dbgOn(!this.wrapperMap);
		this.wrapperMap[oldId] = newMorph; 
	},

	lookup: function(oldId) {
		return this.wrapperMap[oldId];
	},
	
	lookUpOrCopy: function(original) {
		if (!original) 
			return null;
		var replacement = this.lookup(original.id());
		if (!replacement) {
			// console.log("lookUpOrCopy: no replacement found for " + original.id());
		   	var replacement = original.copy(this);
			this.addMapping(original.id(), replacement);
		};
		return replacement
	},


	shallowCopyProperties: function(wrapper, other) {	
		for (var p in other) {
		    this.shallowCopyProperty(p, wrapper, other)
		} 
	},	

	shallowCopyProperty: function(property, wrapper, other) {
	    if (!(other[property] instanceof Function) 
			&& other.hasOwnProperty(property) 
			&& other.noShallowCopyProperties
			&& !other.noShallowCopyProperties.include(property)) {
			if (other[property] instanceof lively.data.Wrapper) {
			    var replacement = this.lookup(other[property].id());
			    wrapper[property] = replacement || other[property];
			} else  {			
				wrapper[property] = other[property];
			}
	    }
	},
	
	smartCopyProperty: function(property, wrapper, other) {
		// console.log("smartCopyProperty " + property + " " + wrapper + " from: " + other)
		var original = other[property];
		if (original) {
			if (Object.isArray(original)) {
				wrapper[property] = original.collect(function each(ea) { 
					return this.lookUpOrCopy(ea)}, this);
			} else {			
				wrapper[property] = this.lookUpOrCopy(original)
			};
		};
	}
}); 

// 'dummy' copier for simple objects
Copier.marker = Object.extend(new Copier(), {
    addMapping: Functions.Empty,
    lookup: Functions.Null
});

Copier.subclass('Importer', {
    documentation: "Implementation class for morph de-serialization",

    verbose: !!Config.verboseImport,
    
	toString: function() {
		return "#<Importer>";
	},

	initialize: function($super) {
		$super();
		this.scripts = [];
		this.models = [];
		this.patchSites = [];
	},

	canvas: function(doc) {
		// find the first "svg" element with id "canvas"
		var elements = doc.getElementsByTagName("svg");
		for (var i = 0; i < elements.length; i++) {
			var el = elements.item(i);
			if (el.getAttribute("id") == "canvas") {
				return el;
			}
		}
		console.log("canvas not found in document " + doc);
		return null;
	},

	getBaseDocument: function() {
		// FIXME memoize
		var webRes = new WebResource(URL.source).get()
		var status = webRes.status;
		if (!status.isSuccess()) {
			console.log("failure retrieving  " + URL.source + ", status " + status);
			return null;
		} else {
			var doc = webRes.contentDocument;
			console.log("problems to parse  " + URL.source);
			if (!doc)
				return null;
			this.clearCanvas(doc);
			return doc;
		}
	},

    
	canvasContent: function(doc) {
		var canvas = this.canvas(doc);
		var elements = [];
		for (var node = canvas.firstChild; node != null; node = node.nextSibling) {
			switch (node.localName) {
				case "g":
				elements.push(node);
				break;
			}
		}
		return elements;
	},

	clearCanvas: function(doc) {
		var canvas = this.canvas(doc);
		var node = canvas.firstChild;
		while (node) {
			var toRemove = node;
			node = node.nextSibling;
			if (toRemove.localName == "g") 
				canvas.removeChild(toRemove);
		}
	},

	startScripts: function(world) {
		this.verbose && console.log("start scripts %s in %s", this.scripts, world);
		// sometimes there are null values in this.scripts. Filter them out
		this.scripts.select(function(ea) {return ea}).forEach(function(s) { s.start(world); });
	},
    
    addPatchSite: function(wrapper, name, ref, optIndex) {
		this.patchSites.push([wrapper, name, ref, optIndex]);
    },
    
    importWrapperFromNode: function(rawNode) {
		///console.log('making morph from %s %s', node, LivelyNS.getType(node));
		// call reflectively b/c 'this' is not a Visual yet. 
		var wrapperType = lively.data.Wrapper.getEncodedType(rawNode);
	
		if (!wrapperType || !Class.forName(wrapperType)) {
			if (Config.silentFailOnWrapperClassNotFound) {
				console.log(Strings.format("ERROR: node %s (parent %s) cannot be a morph of %s",
		    		   	rawNode.tagName, rawNode.parentNode, wrapperType));
				return new Morph(this, rawNode)
			} else {
			    throw new Error(Strings.format("node %s (parent %s) cannot be a morph of %s",
			    	rawNode.tagName, rawNode.parentNode, wrapperType));	    
			}
		}

		return new (Class.forName(wrapperType))(this, rawNode);
		/*
		try {

		} catch (er) {
		    console.log("%s instantiating type %s from node %s", er, 
				wrapperType, Exporter.stringify(rawNode));
		    throw er;
		}*/
	},

    importWrapperFromString: function(string) {
		return this.importWrapperFromNode(this.parse(string));
    },

	parse: function(string) {
		var parser = new DOMParser();
		var xml = parser.parseFromString('<?xml version="1.0" standalone="no"?> ' + string, "text/xml");
		if (xml.documentElement.tagName == "html") {
			throw new Error("xml parse error: " + Exporter.stringify(xml.documentElement));
		} 
		return document.importNode(xml.documentElement, true);
	},

	importFromNodeList: function(nodes) {
		var morphs = [];
		for (var i = 0; i < nodes.length; i++) {
			var node = nodes[i];
			// console.log("found node " + Exporter.stringify(node));
			if (node.localName != "g")  continue;
			morphs.push(this.importWrapperFromNode(node.ownerDocument === Global.document ? 
				node : Global.document.importNode(node, true)));
		}
		return morphs;
	},

	finishImport: function(world) {
		this.patchReferences();
		this.hookupModels();
		this.runDeserializationHooks();
		try {
			this.startScripts(world);
		} catch (er) {
			console.log("scripts failed: " + er);
		}
	},

    patchReferences: function() {
		for (var i = 0, N = this.patchSites.length; i < N; i++) {
		    var site = this.patchSites[i];
		    var wrapper = site[0];
		    var name = site[1];
		    var ref = site[2];
		    var index = site[3];
		    var found;
		    if (index !== undefined) {
				if (!wrapper[name]) {
					wrapper[name] = [];
				} else if (!(wrapper[name] instanceof Array)) { 
					throw new Error('whoops, serialization problem?');
				}
				found = (wrapper[name])[index] = this.lookup(ref);
		    } else {
				found = wrapper[name] = this.lookup(ref);
		    }
			if (!found  && name === 'clip') {
				// last hope, not clean
				found = wrapper[name] = new lively.scene.Clip(this, Global.document.getElementById(ref));
				if (found) console.warn('Found reference somehow but not in the way it was intended to be found!!!')
			}
		    if (!found) {
				console.warn("no value found for field %s ref %s in wrapper %s", name, ref, wrapper);
		    } else {
				//console.log("found " + name + "=" + found + " and assigned to " + wrapper);
		    }
		}
    },

	hookupModels: function() {
		Properties.forEachOwn(this.wrapperMap, function each(key, wrapper) {
			if (wrapper.reconnectModel) {// instanceof View
				var m = wrapper.reconnectModel();
				m && console.log('connecting model on ' + wrapper + " model " + m);
			}
		});
	},

	runDeserializationHooks: function() {
		Properties.forEachOwn(this.wrapperMap, function each(key, wrapper) {
			if (wrapper.onDeserialize) {
				wrapper.onDeserialize();
			}
			// collect scripts
			if (wrapper.activeScripts) this.scripts = this.scripts.concat(wrapper.activeScripts);
		}, this);
	},


	loadWorldInSubworld: function(doc) {
		var nodes = this.canvasContent(doc);
		if (!nodes) {
			WorldMorph.current().alert('no morphs found');
			return null;
		}
		var world = new WorldMorph(WorldMorph.current().canvas());
		var morphs = this.importFromNodeList(nodes);

		morphs.forEach(function(morph) {
			if (morph instanceof WorldMorph) morph.submorphs.clone().forEach(function(m) { world.addMorph(m) });
			else world.addMorph(morph);
		});
	
		// post addition
		this.finishImport(world);

		var link = WorldMorph.current().reactiveAddMorph(new LinkMorph(world));
		link.addPathBack();
		return world;
	},

	loadWorldContentsInCurrent: function(doc) {
		var world = this.loadWorldContents(doc);
		// FIXME? scripts have started already ?
		world.submorphs.clone().forEach(function(m) { 
			WorldMorph.current().addMorph(m) 
		});
	},
    
	loadWorldContents: function(doc) { 
		// possibly doc === Global.document; 
		var world = null;
		var morphs = this.importFromNodeList(this.canvasContent(doc));

		if (!(0 in morphs)) 
			return null;

		var canvas = this.canvas(doc);

		if (morphs[0] instanceof WorldMorph) {
			world = morphs[0];	
			if (morphs.length > 1) console.log("more than one top level morph following a WorldMorph, ignoring remaining morphs");
		} else {
			// no world, create one and add all the serialized morphs to it.
			world = new WorldMorph(canvas);
			// this adds a the WorldMorph's <g> at the end of the list
			canvas.appendChild(world.rawNode);
			// the following will reparent all the existing morphs under the WorldMorph's <g>
			morphs.clone().forEach(function(m) { world.addMorph(m); });
		}
		this.finishImport(world);

		return world;
	}
});

Importer.marker = Object.extend(new Importer(), {
    addMapping: Functions.Empty,
    lookup: Functions.Null
});



// ===========================================================================
// Morph functionality
// ===========================================================================

Object.subclass('MouseHandlerForDragging', {

	handleMouseEvent: function(evt, targetMorph) {
		if (evt.type == "MouseDown") evt.hand.setMouseFocus(targetMorph);
		evt.hand.resetMouseFocusChanges();

		var handler = targetMorph[evt.handlerName()];
		if (handler) handler.call(targetMorph, evt, targetMorph);

		if (evt.type == "MouseUp") {
			// cancel focus unless it was set in the handler
			if (evt.hand.resetMouseFocusChanges() == 0) {
				evt.hand.setMouseFocus(null);
			}
		}
		return true; 
	},

    handlesMouseDown: Functions.False
});

Object.subclass('MouseHandlerForRelay', {

	initialize: function (target, eventSpec) {
		//  Send events to a different target, with different methods
		//    Ex: box.relayMouseEvents(box.owner, {onMouseUp: "boxReleased", onMouseDown: "boxPressed"})
		this.target = target;
		this.eventSpec = eventSpec || {onMouseDown: "onMouseDown", onMouseMove: "onMouseMove", onMouseUp: "onMouseUp"};
	},

	handleMouseEvent: function(evt, originalTarget) {
		if (evt.type == "MouseDown") evt.hand.setMouseFocus(originalTarget);
		evt.hand.resetMouseFocusChanges();

		var handler = this.target[this.eventSpec[evt.handlerName()]];
		if (handler) handler.call(this.target, evt, originalTarget);

		if (evt.type == "MouseUp") {
			// cancel focus unless it was set in the handler
			if (evt.hand.resetMouseFocusChanges() == 0) {
				evt.hand.setMouseFocus(null);
			}
		}
		return true; 
	},

    handlesMouseDown: Functions.True

});

// aaa - Added by Adam, not sure what I'm doing, just want a XenoMorph with clickable HTML links.
Object.subclass('MouseHandlerForDoingTheDefaultThing', {

	handleMouseEvent: function(evt, targetMorph) {
	  return false;
	},

    handlesMouseDown: Functions.True
});


lively.data.Wrapper.subclass('Morph', {

    documentation: "Base class for every graphical, manipulatable object in the system", 

	doNotSerialize: ['fullBounds'],

    // prototype vars
	name: '',
    rotation: 0.0,
    scalePoint: pt(1,1),

    style: {},

    focusHaloBorderWidth: 4,

    fishEye: false,        // defines if fisheye effect is used
    fisheyeScale: 1.0,     // set the default scaling to 1.0
    fisheyeGrowth: 1.0,    // up to fisheyeGrowth size bigger (1.0 = double size)
    fisheyeProximity: 0.5, // where to react wrt/ size (how close we need to be)

    keyboardHandler: null, //a KeyboardHandler for keyboard repsonse, etc
    layoutHandler: null, //a LayoutHandler for special response to setExtent, etc
    openForDragAndDrop: true, // Submorphs can be extracted from or dropped into me
    mouseHandler: MouseHandlerForDragging.prototype, //a MouseHandler for mouse sensitivity, etc
    noShallowCopyProperties: ['id', 'rawNode', 'shape', 'submorphs', 'defs', 'activeScripts', 'nextNavigableSibling', 'focusHalo', 'fullBounds', '__annotation__', '_poseManager'], // __annotation__ and _poseManager added by Adam
    isEpimorph: false, // temporary additional morph that goes away quickly, not included in bounds

    suppressBalloonHelp: Config.suppressBalloonHelp,

    nextNavigableSibling: null, // keyboard navigation

	internalInitialize: function(rawNode, shouldAssign) {
		this.rawNode = rawNode;
		this.submorphs = [];
		
    if (!avocado.shouldBreakCreatorSlotsInOrderToImprovePerformance) {
  		reflect(this).slotAt('rawNode'  ).beCreator(); // aaa - kind of a hack, added by Adam so that we can file out morphs
  		reflect(this).slotAt('submorphs').beCreator(); // aaa - kind of a hack, added by Adam so that we can file out morphs
    }
    
		this.owner = null;
		if (shouldAssign) {
			LivelyNS.setType(this.rawNode, this.getType());
			this.setId(this.newId());
		}
	},

	createRawNode: function() { return NodeFactory.create("g") },
	
    initialize: function(shape) {
		//console.log('initializing morph %s %s', initialBounds, shapeType);
		this.internalInitialize(this.createRawNode(), true);
		dbgOn(!shape.bounds);
		// we must make sure the Morph keeps its original size (wrt/fisheyeScale)
		if (this.fisheyeScale != 1) this.scalePoint = this.scalePoint.scaleBy(1 / this.fisheyeScale);
		this.origin = shape.origin();
		shape.translateBy(this.origin.negated());
		this.initializePersistentState(shape);
		this.initializeTransientState();
    },

	shallowCopy: function () {
		// Return a copy of this morph with no submorphs, but 
		//  with the same shape and shape attributes as this
		return new Morph(this.shape.copy()); 
	},

	duplicate: function () { 
		// Return a full copy of this morph and its submorphs, with owner == null
		var copy = this.copy(new Copier());
		copy.owner = null;
		return copy;
	},

	initializePersistentState: function(shape) {
		// a rect shape by default, will change later
		this.shape = shape;
		
		// aaa - kind of a hack, added by Adam so that we can file out morphs
		if (Global.reflect) {
		  var mir = reflect(this);
		  mir.slotAt('shape').beCreator();
		  mir.slotAt('fullBounds').setInitializationExpression('null');
		  mir.slotAt('pvtCachedTransform').setInitializationExpression('null');
		}
		
		this.rawNode.appendChild(this.shape.rawNode);
		if (this.styleClass) { // inherited from prototype
			var attr = this.styleClass.join(' ');
			this.rawNode.setAttribute("class", attr);
			// Safari needs the explicit assignment (perhaps the names have to be real stylesheets).
			this.rawNode.className.baseVal = attr;
		}
		this.applyStyle(this.style);
		return this;
	},

    // setup various things 
	initializeTransientState: function() { 
		this.fullBounds = null; // a Rectangle in owner coordinates
		// this includes the shape as well as any submorphs
		// cached here and lazily computed by bounds(); invalidated by layoutChanged()

		// this.created = false; // exists on server now
		// some of this stuff may become persistent
	},
    
	copySubmorphsFrom: function(copier, other) {
			
		// console.log("copy submorphs from " + other);
		if (other.hasSubmorphs()) { // deep copy of submorphs
			other.submorphs.forEach(function each(m) {
				if (m.isEpimorph || m.ignoreWhenCopying) {
					// console.log("ignore " + m)
					return; // ignore temp morphs
				};
				var copy = m.copy(copier);
				copier.addMapping(m.id(), copy);
				copy.owner = null;	// Makes correct transfer of transform in next addMorph
				this.addMorph(copy);
				if (copy.owner !== this)
					console.log("ERROR could not add: " + copy + " to " + this)
			}, this);
		};
	},
	
	copyAttributesFrom: function(copier, other) {
		for (var p in other) {
			if (/* Why exclude functions? -- Adam  other[p] instanceof Function || */ !other.hasOwnProperty(p) || this.noShallowCopyProperties.include(p))
				continue;

			if (other[p] instanceof Morph) {
				var replacement = (p === "owner") ? null : copier.lookup(other[p].id());
				if (replacement !== this[p] && this.submorphs.include(this[p])) {
					// when the morph is replaced from the attribute it probably should also removed from the submorphs
					// this should fix the problem with node creation in initializePersistentState
					this.removeMorph(this[p]);					
				}
				this[p] = replacement || other[p];
				// if(replacement)
				//	console.log("found no replacement for: " + other[p].id());
				// console.log("replace '"+ p +"' with morph: " + this[p].id())
				// an instance field points to a submorph, so copy
				// should point to a copy of the submorph
				continue;
			}

			if (other[p] instanceof lively.scene.Image) {
				this[p] = other[p].copy(copier);
				this.addWrapper(this[p]);
				continue
			}

			// TODO: move logic to bindings.js
			if (p == 'attributeConnections') {
				other[p].forEach(function(con) {
					if (!con.getTargetObj().id)
						throw new Error('tried to copy binding and target obj has no id!');
					var spec = {};
					if (con.converter) spec.converter = con.converter.toString();
					if (con.removeAfterUpdate) spec.removeAfterUpdate = con.removeAfterUpdate;
							
					connect(
						this,
						con.getSourceAttrName(),
						copier.lookup(con.getTargetObj().id()) || con.getTargetObj(),
						con.getTargetMethodName(),
						spec)
				}, this)
				continue;
			}

			if (!(other[p] instanceof lively.paint.Gradient)) {
				this[p] = other[p];
			}
			
			// aaa - hack to copy the _model and other sub-objects properly; in the long run, this whole
			// copying mechanism should be using deepCopyRecursingIntoCreatorSlots -- Adam
		  var otherSlot = reflect(other).slotAt(p);
		  if (otherSlot.equals(otherSlot.contents().probableCreatorSlot())) {
			  this[p] = avocado.deepCopier.create().recordOriginalAndCopy(other, this).copy(other[p]);
			}
			
		  // set the creator slot if necessary -- Adam
		  var creatorSlot = reflect(other[p]).theCreatorSlot();
		  if (creatorSlot && creatorSlot.name() === p && creatorSlot.holder().reflectee() === other) {
		    reflect(this).slotAt(p).beCreator();
			}

		} // shallow copy by default, note that arrays of Morphs are not handled
	},

	copyActiveScriptsFrom: function(copier, other) {
		if (other.activeScripts != null) { 
			for (var i = 0; i < other.activeScripts.length; i++) {
				var a = other.activeScripts[i];
				// Copy all reflexive scripts (messages to self)
				if (a.actor === other) {
					this.startStepping(a.stepTime, a.scriptName, a.argIfAny);
					// Note -- may want to startStepping other as well so they are sync'd
				}
			}
		}
	},

	copyModelFrom: function(copier, other) {
		// try to be clever with Relays
		if(other.formalModel && (this.formalModel.delegate instanceof Record)) {
			var replaceModel = copier.lookup(other.getModel().id());
			if (replaceModel) {
					this.connectModel(replaceModel.newRelay(this.formalModel.definition));
			}
		};

    // hack to make ButtonMorphs duplicatable; I think the right fix is to implement a deepCopy that uses creator slots -- Adam
		if (other.modelPlug && other.modelPlug.model.morph === other) {
			this.modelPlug = Object.shallowCopy(other.modelPlug);
			this.modelPlug.model = Object.shallowCopy(other.modelPlug.model);
			this.modelPlug.model.morph = this;
			reflect(this).slotAt('modelPlug').beCreator();
			reflect(this.modelPlug).slotAt('model').beCreator();
    }
    
    // same hack for TextMorphs and others that just have 'model' point right at the morph -- Adam
		if (other.modelPlug && other.modelPlug.model === other) {
			this.modelPlug = Object.shallowCopy(other.modelPlug);
			this.modelPlug.model = this;
			reflect(this).slotAt('modelPlug').beCreator();
	  }
	},

	copyFrom: function(copier, other) {
		this.internalInitialize(other.rawNode.cloneNode(false), true);
		copier.addMapping(other.id(), this);
		
		this.pvtSetTransform(this.getTransform());
		
		// creates new childNodes of rawNode, that may not be wanted
		this.initializePersistentState(other.shape.copy(copier));

		this.copySubmorphsFrom(copier, other);
		this.copyAttributesFrom(copier, other);
		this.copyModelFrom(copier, other);

		this.internalSetShape(other.shape.copy());
		this.origin = other.origin.copy();

		if (other.pvtCachedTransform) { 
			this.pvtCachedTransform = other.pvtCachedTransform.copy();
		} 
		
		this.initializeTransientState();
		this.copyActiveScriptsFrom(copier, other)
		
		// added by Adam to keep the world's _morphsByObject dictionary up-to-date
		if (other._model !== null && typeof(other._model) !== 'undefined') {
		  var world = this.world() || WorldMorph.current();
		  if (world.existingMorphFor(other._model) === other) {
  		  world.rememberMorphFor(this._model, this);
		  }
		}

		this.layoutChanged();
		return this; 
	},

	deserialize: function($super, importer, rawNode) {
		// FIXME what if id is not unique?
		$super(importer, rawNode);
	
		this.internalInitialize(rawNode, false);
		this.pvtSetTransform(this.getTransform());

		this.restoreFromSubnodes(importer);
		this.restorePersistentState(importer);    

		if (!this.shape) { 
			console.log("Error in Morph.deserialize(): I have no shape! Fall back to Rectangle!");
			var shape = new lively.scene.Rectangle(new Rectangle(0, 0, 100, 100));
			this.initializePersistentState(shape);
			this.applyStyle({fill: Color.red});
		};

		this.initializeTransientState();
		importer.verbose && console.log("deserialized " + this);
	},

	prepareForSerialization: function($super, extraNodes, optSystemDictionary) {	
		// this is the morph to serialize
		var fill = this.getFill();
		if (optSystemDictionary && fill instanceof lively.paint.Gradient) {
			var rawPropNode = optSystemDictionary.ownerDocument.getElementById(fill.id());
			if (rawPropNode) {
				// do nothing				
			} else {
				optSystemDictionary.appendChild(fill.rawNode.cloneNode(true));
			};
		};
		
		
		if (Config.useTransformAPI) {
			// gotta set it explicitly, it's not in SVG
			this.setTrait("transform", this.getTransform().toAttributeValue());
			// FIXME, remove?
		}
		return $super(extraNodes, optSystemDictionary);
	},
    
	restorePersistentState: function(importer) {
		var pointerEvents = this.getTrait("pointer-events");
		if (pointerEvents == "none") {
			this.ignoreEvents();
		} else if (pointerEvents) {
			console.log("can't handle pointer-events " + pointerEvents);
		}
		return; // override in subclasses
	},

	restoreFromSubnode: function(importer, node) {
		// Override me
	},

	restoreFromDefsNode: function(importer, node) {
	    // the only one handled here "code"
		var codeNodes = [];
    	if (!Config.skipChanges) { // Can be blocked by URL param 
        	var codes = node.getElementsByTagName("code");
        	for (var j = 0; j < codes.length; j++) { codeNodes.push(codes.item(j)) };
			if (codeNodes.length > 1) console.warn('More than one code node');
			// ChangeSet of World gets evaluated in main
    	}
	},

    restoreFromSubnodes: function(importer) {
        //  wade through the children
        var children = [];
        var helperNodes = [];
        
        for (var desc = this.rawNode.firstChild; desc != null; desc = desc.nextSibling) {
            if (desc.nodeType == Node.TEXT_NODE || desc.nodeType == Node.COMMENT_NODE) {
                if (desc.textContent == "\n") 
                    helperNodes.push(desc); // remove newlines, which will be reinserted for formatting
                continue; // ignore whitespace and maybe other things
            }
            var type = lively.data.Wrapper.getEncodedType(desc);
            // depth first traversal

			// WebCards...
		 	// if (type && !type.startsWith("anonymous_")) { //I have no idea what that mean

            if (type) {
                var wrapper = importer.importWrapperFromNode(desc);
                if (wrapper instanceof Morph) {
                    this.submorphs.push(wrapper); 
                    wrapper.owner = this;
                } else children.push(desc);
            } else {
                children.push(desc);
            }
        }

        for (var i = 0; i < children.length; i++) {
            var node = children[i];
            var shape = lively.scene.Shape.importFromNode(importer, node);
            if (shape) {
                this.shape = shape;
                continue;
            }
            switch (node.localName) {
                // nodes from the Lively namespace
            case "field": {
                // console.log("found field " + Exporter.stringify(node));
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
            case "defs": { 
				this.restoreFromDefsNode(importer, node);
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

	resolveUriToObject: function(uri) {
		if (this.id() == uri)
			return this;
		if (this.ownerWidget) {
			var result = this.ownerWidget.resolveUriToObject(uri)
			if (result)
				return result;
		};	
		for (var i=0; i < this.submorphs.length; i++) {
			var result = this.submorphs[i].resolveUriToObject(uri);
			if (result)
				return result;
		}
		return null
	},
	
	getName: function() { return this.name },
	setName: function(str) { this.name = str },
});

Morph.addMethods({	// tmp copy

	getStyleClass: function() {
		return this.styleClass || [];
	},

	setStyleClass: function(value) {
		var attr;
		if (value instanceof Array) {
			this.styleClass = value;
			attr = value.join(' ');
		} else {
			this.styleClass = [value];
			attr = String(value);
		}
		this.rawNode.setAttribute("class", attr);
	},

	canvas: function() {
		if (!UserAgent.usableOwnerSVGElement) {
			// so much for multiple worlds on one page
			return Global.document.getElementById("canvas");
		} else {
			return (this.rawNode && this.rawNode.ownerSVGElement) || Global.document.getElementById("canvas");
		}
	},

	setVisible: function(flag) { // FIXME delegate to sceneNode when conversion finished
		if (flag) this.rawNode.removeAttributeNS(null, "display");
		else this.rawNode.setAttributeNS(null, "display", "none");
		return this;
	},

	isVisible: function() { // FIXME delegate to sceneNode when conversion finished
		// Note: this may not be correct in general in SVG due to inheritance,
		// but should work in LIVELY.
		var hidden = this.rawNode.getAttributeNS(null, "display") == "none";
		return hidden == false;
	},

	applyFilter: function(filterUri) {// FIXME delegate to sceneNode when conversion finished
		if (filterUri) 
			this.rawNode.setAttributeNS(null, "filter", filterUri);
		else
		this.rawNode.removeAttributeNS(null, "filter");
	}
});

Morph.addMethods({  

    getOwnerWidget: function() {
		if(this.ownerWidget) {
			return this.ownerWidget
		};
		if (this.owner) {
			return this.owner.getOwnerWidget();
		}
		return undefined;
	}
});

// Functions for change management
Object.extend(Morph, {
    
	onLayoutChange: function(fieldName) { 
		return function layoutChangeAdvice(/* arguments*/) {
			var priorExtent = this.innerBounds().extent();
			this.changed();
			var args = $A(arguments);
			var proceed = args.shift();
			var result = proceed.apply(this, args);
			this.layoutChanged(priorExtent);
			this.changed(); 
			return result;
		}
	},

	fromLiteral: function(literal) {
		var morph = new Morph(literal.shape);
		if (literal.submorphs) {
			if (Object.isArray(literal.submorphs))
				morph.setSubmorphs(literal.submorphs);
			else throw new TypeError();
		}
		if (literal.transforms) {
			morph.setTransforms(literal.transforms);
		}
		return morph;
	}

});


// Extend Polylines and polygons to curves
Morph.addMethods({
	makeCurve: function() {
		//  Convert a polyline to a curve;  maybe a polygon to a blob  
		var verts = this.shape.vertices();
		var isClosed = this.shape instanceof lively.scene.Polygon;
		// Need closing vertext for closed curves
		if (verts.length < 2) return;
		if (isClosed && (!verts[0].eqPt(verts.last()))) verts = verts.concat([verts[0]])
		var current = verts[0];
		var ctrl = current;
		var controlPts = [];
		controlPts.push(ctrl);
		for (var i=1; i<verts.length; i++) {  // compute default control points
			ctrl = current.subPt(ctrl).addPt(current);
			controlPts.push(ctrl);
			current = verts[i];
		}
		// Fix first control point if we have 3 or more verts
		if (verts.length <= 3) controlPts[1] = verts[1].subPt(verts[2]).addPt(verts[1]);
		var morph = Morph.makeCurve(verts, controlPts, isClosed)
		this.world().addMorph(morph);
		morph.setPosition(this.position());
}
});

// Fill Garbage Collection on Serialization...
Morph.addMethods({
	collectAllUsedFills: function($super, result) {
		result = $super(result);
		var fill = this.getFill();
		if (fill instanceof lively.paint.Gradient)
			result.push(fill);
		if (this.submorphs) {
			this.submorphs.each(function(ea) {
				ea.collectAllUsedFills(result)
			}, this);
		}
		// do nothing
		return result
	}
});

// Functions for manipulating the visual attributes of Morphs
Morph.addMethods({

	setFill: function(fill) {
		this.shape.setFill(fill);
		this.changed();
		return this; // added by Adam
	},

  // added by Adam
	setFillBase: function(fillBase) {
	  return this.setFill(fillBase ? avocado.ui.defaultFillWithColor(fillBase) : null);
	},

	getFill: function() {
		return this.shape.getFill();
	},

	setBorderColor: function(newColor) {
		this.shape.setStroke(newColor);
		// this.changed();
	},

	getBorderColor: function() {
		return new Color(Importer.marker, this.shape.getStroke());
	},

	setBorderWidth: function(newWidth) {
		if (newWidth == null) newWidth = 0;
		var oldWidth = this.getBorderWidth();
		if (newWidth == oldWidth) return;

		// Opt: only notify change with the bigger of two bounds
		if (oldWidth > newWidth) this.changed();
		this.shape.setStrokeWidth(newWidth); 
		if (newWidth > oldWidth) this.changed();
	},

	getBorderWidth: function() {
		return this.shape.getStrokeWidth() || 0; // FIXME: fix defaults logic
	},

 	setBorderRadius: function(r) {//jd
    	this.shape.roundEdgesBy(r);
		this.changed();
    },

 	getBorderRadius: function() {
		return this.shape.getBorderRadius(); 
	},

	shapeRoundEdgesBy: function(r) {
		this.setBorderRadius(r);
	},

	getFillOpacity: function() { return this.shape.getFillOpacity(); }, // bug fix: didn't say "return" -- Adam

    setFillOpacity: function(op) {
	this.shape.setFillOpacity(op);
	this.changed(); // FIXME better use specific update
	return this; // added by Adam
},

    setStrokeOpacity: function(op) { 
	this.shape.setStrokeOpacity(op);
	this.changed(); // FIXME better use specific update
},

	getStrokeOpacity: function() { this.shape.getStrokeOpacity(); },

    setLineJoin: function(joinType) { this.shape.setLineJoin(joinType); },

	getLineJoin: function() { this.shape.getLineJoin(); }, 

    setLineCap: function(capType) { this.shape.setLineCap(capType); },

 	getLineCap: function() { this.shape.getLineCap(); },

	applyStyle: function(specs) { // note: use reflection instead?
		for (var i = 0; i < arguments.length; i++) {
			var spec = arguments[i];
			if(!spec) return;  // dbgOn(!spec);
			if (spec.borderWidth !== undefined) this.setBorderWidth(spec.borderWidth);
			if (spec.borderColor !== undefined) this.setBorderColor(spec.borderColor);
			if (spec.fill !== undefined) this.setFill(spec.fill);
			if (spec.opacity !== undefined) {
				this.setFillOpacity(spec.opacity);
				this.setStrokeOpacity(spec.opacity); 
			}
			if (spec.fillOpacity !== undefined) this.setFillOpacity(spec.fillOpacity);
			if (spec.strokeOpacity !== undefined) this.setStrokeOpacity(spec.strokeOpacity);

			if (this.shape.roundEdgesBy && spec.borderRadius !== undefined) { 
				this.shape.roundEdgesBy(spec.borderRadius);
			}
			if (spec.suppressGrabbing !== undefined) this.suppressGrabbing = spec.suppressGrabbing;
			if (spec.suppressHandles !== undefined) this.suppressHandles = spec.suppressHandles;
			
			// All this stuff added by Adam
			if (spec.openForDragAndDrop !== undefined) this.openForDragAndDrop = spec.openForDragAndDrop;
			if (spec.grabsShouldFallThrough !== undefined) this.grabsShouldFallThrough = spec.grabsShouldFallThrough;
			if (spec.horizontalLayoutMode !== undefined) this.horizontalLayoutMode = spec.horizontalLayoutMode;
			if (spec.verticalLayoutMode !== undefined) this.verticalLayoutMode = spec.verticalLayoutMode;
			if (spec.fillBase !== undefined) this.setFillBase(spec.fillBase);
			if (spec.shouldIgnoreEvents) this.ignoreEvents();
			if (spec.shouldIgnoreAllExceptDefaultEvents) this.ignoreAllExceptDefaultEvents();
			
			// This stuff added by Adam too.
			if (this._layout  && this._layout .adjustStyleSpec) { this._layout .applyStyle(spec); }
			if (this._stylist && this._stylist.adjustStyleSpec) { this._stylist.applyStyle(this, spec); }
		}
		return this;
	},

	makeStyleSpec: function() {
		// Adjust all visual attributes specified in the style spec
		var spec = { };
		spec.borderWidth = this.getBorderWidth();
		spec.borderColor = this.getBorderColor();
		spec.fill = this.getFill();
		if (this.shape.getBorderRadius) spec.borderRadius = this.shape.getBorderRadius() || 0.0;
		spec.fillOpacity = typeof this.shape.getFillOpacity() !== undefined ? this.shape.getFillOpacity() : 1.0;
		spec.strokeOpacity = typeof this.shape.getStrokeOpacity() !== undefined ?  this.shape.getStrokeOpacity() : 1.0;		

		// All this stuff added by Adam
		spec.openForDragAndDrop = this.openForDragAndDrop;
		spec.grabsShouldFallThrough = this.grabsShouldFallThrough;
		spec.horizontalLayoutMode = this.horizontalLayoutMode;
		spec.verticalLayoutMode = this.verticalLayoutMode;
		spec.shouldIgnoreEvents = !this.mouseHandler;

    // added by Adam
		if (this._layout  && this._layout .adjustStyleSpec) { this._layout.adjustStyleSpec(spec);  }
		if (this._stylist && this._stylist.adjustStyleSpec) { this._stylist.adjustStyleSpec(this, spec); }
		
		return spec;
	},

	applyStyleNamed: function(name) {
		var style = this.styleNamed(name);
		if (style)
			this.applyStyle(style);
		else
			console.warn("applyStyleNamed: no style named " + name)
	},

	styleNamed: function(name) {
		// Look the name up in the Morph tree, else in current world
		if (this.displayTheme) return this.displayTheme[name];
		if (this.owner) return this.owner.styleNamed(name);
		var world = WorldMorph.current();
		if (world && (this !== world)) return world.styleNamed(name);
		return DisplayThemes.lively[name]; // FIXME for onDeserialize, when no world exists yet
	},

	linkToStyles: function(styleClassList, optSupressApplication) {
		// Record the links for later updates, and apply them now
		this.setStyleClass(styleClassList);
		if (!optSupressApplication) this.applyLinkedStyles();
		return this;
	},

	applyLinkedStyles: function() {
		// Apply all the styles to which I am linked, in order
		var styleClasses = this.getStyleClass();
		if (!styleClasses) return;
		for (var i = 0; i < styleClasses.length; i++) {
			this.applyStyleNamed(styleClasses[i]); 
		}
	},

	// NOTE:  The following four methods should all be factored into a single bit of reshaping logic
	applyFunctionToShape: function() {  // my kingdom for a Smalltalk block!
		var args = $A(arguments);
		var func = args.shift();
		func.apply(this.shape, args);
		this.adjustForNewBounds();
	}.wrap(Morph.onLayoutChange('shape')),

	internalSetShape: function(newShape) {
		if (!newShape.rawNode) {
			console.log('newShape is ' + newShape);
			lively.lang.Execution.showStack();
		}

		this.rawNode.replaceChild(newShape.rawNode, this.shape.rawNode);
		this.shape = newShape;
		reflect(this).slotAt('shape').beCreator(); // aaa - kind of a hack, added by Adam so that we can file out morphs
		this.adjustForNewBounds();
	},

	setShape: function(newShape) {
		this.internalSetShape(newShape);
	}.wrap(Morph.onLayoutChange('shape')),

	reshape: function(partName, newPoint, lastCall) {
		try {
			var result = this.shape.reshape(partName,newPoint,lastCall); 
			
			// added by Adam
      this.horizontalLayoutMode = this.verticalLayoutMode = avocado.LayoutModes.Rigid;
      this.minimumExtentMayHaveChanged();
      
			return result;
		} finally {
			// FIXME: consider converting polyline to polygon when vertices merge.
			this.adjustForNewBounds();
		}
	}.wrap(Morph.onLayoutChange('shape')),

	setVertices: function(newVerts) {
		// particular to polygons
		this.shape.setVertices(newVerts);
		this.adjustForNewBounds();
	}.wrap(Morph.onLayoutChange('shape')),

});

Object.subclass('LayoutManager', {

    setBounds: function(target, newRect) {
		// DI: Note get/setBounds should be deprecated in favor of get/setExtent and get/setPosition
		// This is so that layout management can move things around without triggering redundant or
		// recursive calls on adjustForNewBounds(q.v.)

		// All calls on morph.setBounds should be converted to two calls as above (or just one if,
		// eg, only the extent or position is changing).

		// Of course setBounds remains entirely valid as a message to the *shape* object and, 
		// in fact, shape.setBounds() will have to be called from both setPosition and setExtent
		// but adjustForNewBounds will only need to be called from setExtent.

		// Finally, there is an argument for calling layoutChanged from setPosition and setExtent,
		// since the caller must do it otherwise.  This would simplify things overall.

		// DI:  Note that there is an inconsistency here, in that we are reading and comparing
		// the full bounds, yet if we set extent, it only affects the shape (ie, innerBounds)
	
		var priorBounds = target.bounds();

		if (!newRect.topLeft().eqPt(priorBounds.topLeft())) {  // Only set position if it changes
		    target.setPosition(newRect.topLeft());
		}
		if (!newRect.extent().eqPt(priorBounds.extent())) {  // Only set extent if it changes
		    // FIXME some shapes don't support setFromRect
		    target.shape.setBounds(newRect.extent().extentAsRectangle());
	 	    target.adjustForNewBounds();
		}
    },

	setExtent: function(target, newExtent) {
		target.setBounds(target.getPosition().extent(newExtent));
	},

	setPosition: function(target, newPosition) {
		if (!newPosition)
			return;
		var delta = newPosition.subPt(target.getPosition());
		target.translateBy(delta);
		return delta;
	},

	// Hack by Adam to allow avoiding creating new Points. -- Adam
	setPositionXY: function(target, newX, newY) {
		var oldPosition = target.getPosition();
		target.translateByXY(newX - oldPosition.x, newY - oldPosition.y);
	},

    layoutChanged: function(target) {
	
    },

    beforeAddMorph: function(supermorph, submorph, isFront) {  // isFront -> general spec of location?
    },

    removeMorph: function(supermorph, submorph) {
		// new behavior:
		supermorph.layoutChanged();
    },

	layout: function(supermorph) {
		// subclass responsibility
	},

	leftMarginOf: function(morph) {
		return morph.margin ? morph.margin.left() : 0;
	},

	rightMarginOf: function(morph) {
		return morph.margin ? morph.margin.right() : 0;
	},

	topMarginOf: function(morph) {
		return morph.margin ? morph.margin.top() : 0;
	},

	bottomMarginOf: function(morph) {
		return morph.margin ? morph.margin.bottom() : 0;
	},

    rightPaddingOf: function(morph) {
		return morph.padding ? morph.padding.right() : 0;
    },

	leftPaddingOf: function(morph) {
		return morph.padding ? morph.padding.left() : 0;
	},

	topPaddingOf: function(morph) {
		return morph.padding ? morph.padding.top() : 0;
	},

	bottomPaddingOf: function(morph) {
		return morph.padding ? morph.padding.bottom() : 0;
	}
    
});

LayoutManager.subclass('HorizontalLayout',  { // alignment more than anything

	beforeAddMorph: function(supermorph, submorph, isFront) {
		if (submorph.isEpimorph) return;

		// runs before submorph is added
		var dx = this.leftMarginOf(submorph);
		var dy;
		var last = supermorph.topSubmorph();

		if (!last) {
			dx += this.leftPaddingOf(supermorph);
			dy =  this.topPaddingOf(supermorph);
			submorph.align(submorph.bounds().topLeft(), pt(dx, dy));
		} else {
			dx += this.rightMarginOf(last);
			dy = 0;
			submorph.align(submorph.bounds().topLeft(), last.bounds().topRight());
			submorph.translateBy(pt(dx, dy));
		}
	},
	
	layout: function(supermorph) {
		var x = this.leftPaddingOf(supermorph);
		var y =  this.topPaddingOf(supermorph);
		var submorphs = supermorph.visibleSubmorphs();
		for(var i=0; i < submorphs.length; i++) {
			var submorph = submorphs[i];
			x += this.leftMarginOf(submorph)
			submorph.align(submorph.bounds().topLeft(), pt(x, y));
			x += submorph.bounds().width;
			x += this.rightMarginOf(submorph);
		}
	},
});


LayoutManager.subclass('VerticalLayout',  { // alignment more than anything

	beforeAddMorph: function(supermorph, submorph, isFront) {
		if (submorph.isEpimorph) return;
		// runs before submorph is added
		var dx;
		var dy = this.topMarginOf(submorph);
		var last = supermorph.topSubmorph();

		if (!last) {
			dx = this.leftPaddingOf(supermorph);
			dy += this.topPaddingOf(supermorph);
			submorph.align(submorph.bounds().topLeft(), pt(dx, dy));
		} else {
			dx = 0;
			dy += this.bottomMarginOf(last);
			submorph.align(submorph.bounds().topLeft(), last.bounds().bottomLeft());
			//submorph.translateBy(pt(dx, dy));
		}
	},

	layout: function(supermorph) {
		var x = this.leftPaddingOf(supermorph);
		var y =  this.topPaddingOf(supermorph);
		var submorphs = supermorph.visibleSubmorphs();
		for(var i=0; i < submorphs.length; i++) {
			var submorph = submorphs[i];
			y += this.topMarginOf(submorph)
			submorph.align(submorph.bounds().topLeft(), pt(x, y));
			y += submorph.bounds().height;
			y += this.bottomMarginOf(submorph);
		}
	},

});

Morph.addMethods({
    
	layoutManager: new LayoutManager(), // singleton

	// Simple hack until the layout manager can relayout
	relayout: function() {
		if (this.layoutManager) {
			this.layoutManager.layout(this)
		}	
	},

	setBounds: function(newRect) {
		if (!newRect) return;
		this.layoutManager.setBounds(this, newRect);
	}.wrap(Morph.onLayoutChange('shape')),

	setExtent: function(newExtent) {
		this.layoutManager.setExtent(this, newExtent);
		return this; // added by Adam;
	},

	getExtent: function(newRect) { return this.shape.bounds().extent() },

	containsPoint: function(p) { 
		// p is in owner coordinates
		if (!this.bounds().containsPoint(p)) return false;
		return this.shape.containsPoint(this.relativize(p)); 
	},

	containsWorldPoint: function(p) { // p is in world coordinates
		if (this.owner == null) return this.containsPoint(p);
		return this.containsPoint(this.ownerLocalize(p)); 
	},

	fullContainsPoint: function(p) { // p is in owner coordinates
		return this.bounds().containsPoint(p); 
	},

	fullContainsWorldPoint: function(p) { // p is in world coordinates
		// Changed all uses of owner.localize to ownerLocalize. -- Adam
		// Commented out the following line because ownerLocalize works fine now for WorldMorphs. -- Adam
		// if (this.owner == null) return this.fullContainsPoint(p);
		return this.fullContainsPoint(this.ownerLocalize(p)); 
	},

	addNonMorph: function(node) {
		if (node instanceof lively.data.Wrapper) throw new Error("add rawNode, not the wrapper itself");
		return this.rawNode.insertBefore(node, this.shape && this.shape.rawNode.nextSibling);
	},

	addWrapper: function(w) {
		if (w && w.rawNode) {
			this.addNonMorph(w.rawNode);
			return w;
		} else return null;
	},

	addPseudoMorph: function(pseudomorph) {
		if (pseudomorph instanceof Global.PseudoMorph) {
			return this.addMorph(pseudomorph);
		} else 
			throw new Error(pseudomorph + " is not a PseudoMorph");
	},

});

// Submorph management functions
Morph.addMethods({ 

    addMorph: function(morph, shouldNotForceLayoutRejiggering) { return this.addMorphFrontOrBack(morph, true, shouldNotForceLayoutRejiggering) }, // shouldNotForceLayoutRejiggering added by Adam

	addMorphAt: function(morph, position) {
		var morph = this.addMorphFrontOrBack(morph, true);
		morph.setPosition(position);
		return morph;
	},

    addMorphFront: function(morph) { return this.addMorphFrontOrBack(morph, true) },

    addMorphBack: function(morph) { return this.addMorphFrontOrBack(morph, false) },

	addMorphFrontOrBack: function(m, isFront, shouldNotForceLayoutRejiggering) { // shouldNotForceLayoutRejiggering added by Adam
		console.assert(m instanceof Morph, "not an instance");
		if (m.owner) {
			var tfm = m.transformForNewOwner(this);
			m.owner.removeMorph(m); // KP: note not m.remove(), we don't want to stop stepping behavior
			m.setTransform(tfm); 
			// FIXME transform is out of date
			// morph.setTransform(tfm); 
			// m.layoutChanged(); 
		} 
		this.layoutManager.beforeAddMorph(this, m, isFront);
		this.insertMorph(m, isFront);
		m.changed();
		m.layoutChanged();
		this.layoutChanged();
    if (!shouldNotForceLayoutRejiggering) { this.forceLayoutRejiggeringIfNecessaryAfter('addMorph', m); } // added by Adam
		return m;
	},
	
	bringToFront: function() {
		if (!this.owner)
			return;
		if (this.owner.topSubmorph() === this)
			return;
		var owner = this.owner;
		this.remove();
		owner.addMorphFront(this)
	},

	setSubmorphs: function(morphs) {
		console.assert(morphs instanceof Array, "not an array");
		if (morphs != null) {
			this.submorphs = [].concat(morphs);
			reflect(this).slotAt('submorphs').beCreator(); // aaa - kind of a hack, added by Adam so that we can file out morphs
			this.submorphs.forEach(function (m) { 
				if (m.owner) {
					var tfm = m.transformForNewOwner(this);
					m.owner.removeMorph(m);
					m.setTransform(tfm); 
				} 
				this.rawNode.appendChild(m.rawNode); 
				m.owner = this;
				m.changed();
				m.layoutChanged();
			}, this);
		}
		this.layoutChanged();
	},

    indexOfSubmorph: function(m) {
		if (this.submorphs.length == 0) return -1;  // no submorphs at all
		for (var i=0; i<this.submorphs.length; i++) 
			if (this.submorphs[i] === m) return i;
    	return -1;  // not there
	},

	getInsertPositionFor: function(m, isFront) {
		if (this.submorphs.length == 0) return null; // if no submorphs, append to nodes
		return isFront ? this.submorphs.last().rawNode.nextSibling : this.submorphs.first().rawNode;
	},
	
	insertMorph: function(m, isFront) { // low level, more like Node.insertBefore?
		var insertionPt = this.getInsertPositionFor(m, isFront); // the last one, so drawn last, so front
		this.rawNode.insertBefore(m.rawNode, insertionPt);
		if (isFront)
			this.submorphs.pushAndAdjustCreatorSlots(m); // aaa fileout hack -- Adam
		else
			this.submorphs.unshiftAndAdjustCreatorSlots(m); // aaa fileout hack -- Adam
		m.owner = this;
		return m;
	},
	
	removeMorph: function(m, shouldNotForceLayoutRejiggering) {// FIXME? replaceMorph() with remove as a special case   // shouldNotForceLayoutRejiggering added by Adam

		var index = this.submorphs.indexOf(m);
		if (index < 0) {
			m.owner !== this && console.log("%s has owner %s that is not %s?", m, m.owner, this);
			return null;
		}

		m.removeRawNode();
		var spliced = this.submorphs.spliceAndAdjustCreatorSlots(index, 1); // aaa fileout hack -- Adam
		if (spliced instanceof Array) spliced = spliced[0];
		if (m !== spliced) {
			console.log("invariant violated removing %s, spliced %s", m, spliced);
		}

		// cleanup, move to ?
		m.owner = null;
		m.setHasKeyboardFocus(false);

		this.layoutManager.removeMorph(this, m);
    if (!shouldNotForceLayoutRejiggering) { this.forceLayoutRejiggeringIfNecessaryAfter('removeMorph', m); } // added by Adam
		return m;
    },

	removeAllMorphs: function() {
		this.changed();
		this.submorphs.invoke('removeRawNode');
		this.submorphs.clear();
		this.layoutChanged(); 
	},

	hasSubmorphs: function() {
		return this.submorphs.length != 0;
	},

	remove: function() {
		// Note this is the only removal method that stops stepping fo the morph structure
		if (!this.owner) return null;  // already removed

		this.stopAllStepping();
		this.changed();
		this.owner.removeMorph(this);

    this.detachArrowEndpoints(); // added by Adam

		return this;
	},

	withAllSubmorphsDo: function(func, rest) {
		// Call the supplied function on me and all of my submorphs by recursion.
		var args = $A(arguments);
		args.shift();
		func.apply(this, args);
		for (var i = 0; i < this.submorphs.length; i++) {
			this.submorphs[i].withAllSubmorphsDo(func, rest);
		}
	},

	invokeOnAllSubmorphs: function(selector, rest) {
		var args = $A(arguments);
		args.shift();
		var func = this[selector];
		func.apply(this, args);
		for (var i = 0; i < this.submorphs.length; i++)
		this.submorphs[i].invokeOnAllSubmorphs(selector, rest);
	},

	topSubmorph: function() {
		// the morph on top is the last one in the list
		return this.visibleSubmorphs().last();
	},

	visibleSubmorphs: function() {
		return this.submorphs.reject(function(ea) {return ea instanceof SchedulableAction})
	},

	getMorphNamed: function (name) {
		for (var i = 0; i < this.submorphs.length; i++) {
			var morph = this.submorphs[i];
			if (morph.getName() === name) return morph;
		}
		for (var i = 0; i < this.submorphs.length; i++)  {
			var morph = this.submorphs[i].getMorphNamed(name);
			if (morph) return morph;
		}
		return null;
	},

	// morph gets an opportunity to shut down when WindowMorph closes 
	shutdown: function() {
		this.remove();
	},

	okToDuplicate: function() {
	  // Changed by Adam to check the model.
	  if (typeof(this._model) !== 'undefined' && this._model !== null && typeof(this._model.okToDuplicate) === 'function') {
	    return this._model.okToDuplicate();
	  } else {
  	  return true;
	  }
  },

});

// Morph bindings to its parent, world, canvas, etc.
Morph.addMethods({

	world: function() {
		return this.owner ? this.owner.world() : null;
	},

	validatedWorld: function() {
		// Return the world that this morph is in, checking that it hasn't been removed
		if (this.owner == null) return null;
		if (this.owner.indexOfSubmorph(this) < 0) return null;
		return this.owner.validatedWorld();
	},

	openInWorld: function(loc) {
        WorldMorph.current().addMorph(this);
        loc && this.setPosition(loc);
    },
	
	toString: function() {
		try {
			return Strings.format("%s(%s)", this.rawNode && this.id() || "" , 
			this.shape ? "[" + this.shape.bounds().toTuple() + "]" : "");
		} catch (e) {
			//console.log("toString failed on %s", [this.id(), this.getType()]);
			return "#<Morph?{" + e + "}>";
		}
	},

	inspect: function() {
		try {
			return this.toString();
		} catch (err) {
			return "#<inspect error: " + err + ">";
		}
	},

    // Morph coordinate transformation functions

    // SVG has transform so renamed to getTransform()
    getTransform: function() {
		if (this.pvtCachedTransform) return this.pvtCachedTransform;
	
		if (Config.useTransformAPI) {
		    var impl = this.rawNode.transform.baseVal.consolidate();
		    this.pvtCachedTransform = new lively.scene.Similitude(impl ? impl.matrix : null); // identity if no transform specified
		} else {
		    // parse the attribute: by Dan Amelang
		    var s = this.rawNode.getAttributeNS(null, "transform");
		    //console.log('recalculating transform from ' + s);
		    var matrix = null;
		    var match = s && s.match(/(\w+)\s*\((.*)\)/);
		    if (match) {
			matrix = this.canvas().createSVGMatrix();
			var args = match[2].split(/(?:\s|,)+/).
			map(function(n) { return parseFloat(n) || 0; });
			switch (match[1]) {
			case 'matrix':
			    matrix.a = args[0]; matrix.b = args[1];
			    matrix.c = args[2]; matrix.d = args[3];
			    matrix.e = args[4]; matrix.f = args[5];
			    break;
			case 'translate':
			    matrix = matrix.translate(args[0], args[1] || 0); // may be just one arg
			    break;
			case 'scale':
			    matrix = matrix.scaleNonUniform(args[0], args[1] || 1.0);
			    break;
			case 'rotate':
			    // FIXME check:
			    matrix = matrix.translate(-args[1], -args[2]).rotate(args[0]).translate(args[1], args[2]);
			    console.log('made ' + matrix + ' from ' + args);
			    break;
			case 'skewX':
			    matrix = matrix.skewX(args[0]);
			    break;
			case 'skewY':
			    matrix = matrix.setSkewY(args[0]);
			    break;
			}
		    }
		    this.pvtCachedTransform = new lively.scene.Similitude(matrix);
		}
		return this.pvtCachedTransform;
    },

	pvtSetTransform: function(tfm) {
		this.origin = tfm.getTranslation();
		this.rotation = tfm.getRotation().toRadians();
		this.scalePoint = tfm.getScalePoint();
		// we must make sure the Morph keeps its original size (wrt/fisheyeScale)
		if (this.fisheyeScale != 1) this.scalePoint = this.scalePoint.scaleBy(1 / this.fisheyeScale);
		this.transformChanged();
	},

	setTransforms: function(array) {
		// FIXME update origin/rotation/scale etc?
		// collapse the transforms and apply the result?
		lively.scene.Node.prototype.setTransforms.call(this, array);
		this.transformChanged();
	},

    setTransform: function(tfm) { this.pvtSetTransform(tfm); }.wrap(Morph.onLayoutChange('transform')),

	transformToMorph: function(other) {
		// getTransformToElement has issues on some platforms
		dbgOn(!other);
		if (Config.useGetTransformToElement) {
			return this.rawNode.getTransformToElement(other.rawNode);
		} else {
			var tfm = this.getGlobalTransform();
			var inv = other.getGlobalTransform().createInverse();
			//console.log("own global: " + tfm + " other inverse " + inv);
			tfm.preConcatenate(inv);
			//console.log("transforming " + this + " to " + tfm);
			return tfm;
		}
	},

	getGlobalTransform: function() {
		var globalTransform = new lively.scene.Similitude();
		var world = this.world();
		// var trace = [];
		for (var morph = this; morph != null; morph = morph.owner) { // changed morph != world to morph != null, to allow world-scaling -- Adam
			globalTransform.preConcatenate(morph.getTransform());
			// trace.push(globalTransform.copy());
		}
		// console.log("global transform trace [" + trace + "] for " + this);
		return globalTransform;
	},

  // Hacked to allow callers to avoid creating the Point object. -- Adam
	translateBy: function(delta) {
	  return this.translateByXY(delta.x, delta.y);
  },
	translateByXY: function(x, y) {
		this.changed();
		this.origin = this.origin.addXY(x, y);
		// this.layoutChanged();
		// Only position has changed; not extent.  Thus no internal layout is needed
		this.transformChanged();
		if (this.fullBounds != null) this.fullBounds = this.fullBounds.translatedByXY(x, y);
		// DI: I don't think this can affect owner.  It may increase fullbounds
		//     due to stickouts, but not the bounds for layout...
		if (this.owner /* && this.owner !== this.world() */ && !this.isEpimorph) this.owner.layoutChanged(); 
		this.changed();
		return this; 
	},

	setRotation: function(theta) { // in radians
		this.rotation = theta;
		// layoutChanged will cause this.transformChanged();
	}.wrap(Morph.onLayoutChange('rotation')),
    
	setScale: function(scale/*:float*/) { 
		// While scalePoint carries both x- and y-scaling,
		//    getScale() and setScale() allow the use of simple, er, scalars
		this.setScalePoint(pt(scale, scale));
		return this; // added by Adam
	},

	setScalePoint: function(sp) { 
		this.scalePoint = sp;
		// layoutChanged will cause this.transformChanged();
	}.wrap(Morph.onLayoutChange('scale')),

	gettranslation: function() { 
		return this.getTransform().getTranslation(); 
	},

	getRotation: function() { 
		// Note: the actual transform disambiguates scale and rotation as though scale.x > 0
		var rot = this.getTransform().getRotation().toRadians(); 
		if (this.scalePoint.x >= 0) return rot;

		// if scale.x is negative, then we have to decode the difference
		if (rot < 0) return rot + Math.PI;
		return rot - Math.PI;
	},

	getScale: function() {
		return this.getTransform().getScale(); 
	},

	moveBy: function(delta) {
		this.translateBy(delta);
	},

	rotateBy: function(delta) {
		this.setRotation(this.getRotation()+delta);
	},

	scaleBy: function(factor) {
		// Perform a linear scaling (based on x scale) by the given factor
		this.setScale(this.getScale()*factor);
	},
	beClipMorph: function() {
		// For simple morphs (rectangles, ellipses, polygons) this will cause all submorphs
		// to be clipped to the shape of this morph.
		// Note: the bounds function should probably be copied from ClipMorph as
		//		part of this mutation
		var defs = this.rawNode.appendChild(NodeFactory.create('defs'));
		this.clip = new lively.scene.Clip(this.shape);
		defs.appendChild(this.clip.rawNode);
		this.clip.applyTo(this);
		this.isClipMorph = true;
	},

	throb: function() {
		this.scaleBy(this.getScale() <= 1 ? 2 : 0.9);
	},

	align: function(p1, p2) {
		return this.translateBy(p2.subPt(p1)); 
	},

    centerAt: function(p) {
		return this.align(this.bounds().center(), p); 
    },

	getCenter: function() { return this.bounds().center() },

	moveOriginBy: function(delta) {
		// This method changes the origin (and thus center of rotation) without changing any other effect
		// To center a rectangular morph, use m.moveOriginBy(m.innerBounds().center())
		this.origin = this.origin.addPt(delta);
		var deltaNegated = delta.negated();
		this.shape.translateBy(deltaNegated);
		this.submorphs.forEach(function (ea) { ea.translateBy(deltaNegated); });
	},

	// Animated moves for, eg, window collapse/expand
	animatedInterpolateTo: function(destination, nSteps, msPer, callBackFn, finalScale) {
		if (nSteps <= 0) return;
		var loc = this.position();
		var delta = destination.subPt(loc).scaleBy(1 / nSteps);
		var scaleDelta = finalScale ? (this.getScale() - finalScale) / nSteps : 0;
		// console.log("scaleDelta = " + scaleDelta);
		var path = [];
		for (var i = 1; i<=nSteps; i++) { loc = loc.addPt(delta); path.unshift(loc); }
		this.animatedFollowPath(path, msPer, callBackFn, scaleDelta);
    },

    animatedFollowPath: function(path, msPer, callBackFn, scaleDelta) {
		var spec = {path: path.clone(), callBack: callBackFn, scaleDelta: scaleDelta};
		spec.action = this.startStepping(msPer, 'animatedPathStep', spec);	
    },


	animatedPathStep: function(spec, scaleDelta) {
		if (spec.path.length >= 1){
			this.setScale(this.getScale()-spec.scaleDelta);
			this.setPosition(spec.path.pop());
		}
		if (spec.path.length >= 1) return
		//spec.action.stop(this.world()); //JD: out
		this.stopSteppingScriptNamedAndRemoveFromSubmorphs('animatedPathStep');//JD: delte script out of activeScripts, neede for deserialization
		spec.callBack.call(this);
	},

    // toggle fisheye effect on/off
	toggleFisheye: function() { 
		// if fisheye is true, we need to scale the morph to original size
		if (this.fishEye) {
			this.setScale(this.getScale() / this.fisheyeScale);
			this.setFisheyeScale(1.0);
		}
		// toggle fisheye
		this.fishEye = !this.fishEye;
	},

	// sets the scaling factor for the fisheye between 1..fisheyeGrowth
	setFisheyeScale: function (newScale) {
		// take the original centerpoint
		var p = this.bounds().center();

		this.fisheyeScale = newScale;
		this.pvtCachedTransform = null;
		this.layoutChanged();  
		this.changed();

		// if the fisheye was on move the fisheye'd morph by the difference between 
		// original center point and the new center point divided by 2
		if (this.fishEye) {
			// (new.center - orig.center)/2
			var k = this.bounds().center().subPt(p).scaleBy(.5).negated();
			if (!pt(0,0).eqPt(k)) {
				this.setPosition(this.position().addPt(k));
				this.layoutChanged();  
				this.changed();
			}
		}
	},

    // Experimental radial "black hole" scrolling feature: When
    // an object comes close enough to the "event horizon" (specified
    // by 'towardsPoint'), the object is zoomed into the black hole.
    // Negative 'howMuch' values are used to "collapse" the display, 
    // while positive values expand and restore the display back to its 
    // original state.  For further information, see  
    // Sun Labs Technical Report SMLI TR-99-74, March 1999.
	moveRadially: function(towardsPoint, howMuch) {
		var position = this.getPosition();
		var relativePt = position.subPt(towardsPoint);
		var distance = towardsPoint.dist(position);
		if (!this.inBlackHole) this.inBlackHole = 0;

		// The object disappears entirely when it is less than 5 pixels away
		// The 'inBlackHole' counter keeps track of how many levels deep
		// the object is in the black hole, allowing the display to be
		// restored correctly.
		if (distance <= 5) {
			if (howMuch < 0) {
				this.inBlackHole++;
				this.setScale(0);
			} else {
				this.inBlackHole--;            
			}
		} 

		if (this.inBlackHole == 0) {
			// Start shrinking the object when it is closer than 200 pixels away
			if (distance > 5 && distance < 200) this.setScale(distance/200);
			else if (distance >= 200 && this.getScale() != 1) this.setScale(1);

			// Calculate new location for the object
			var theta = Math.atan2(relativePt.y, relativePt.x);
			var newDistance = distance + howMuch;
			if (newDistance < 0) newDistance = 1;    
			var newX = newDistance * Math.cos(theta);
			var newY = newDistance * Math.sin(theta);
			this.setPosition(towardsPoint.addPt(pt(newX,newY)));
		}
	}
});

Morph.addMethods({     // particle behavior

	bounceInOwnerBounds: function() {
		this.bounceInBounds(this.owner.innerBounds());
	},
	
	bounceInBounds: function(ob) {
		// typcially ob = this.owner.innerBounds()
		// Bounce by reversing the component of velocity that put us out of bounds
		if (!this.velocity) return;  // Can't bounce without a velocity vector

		// We take care to only reverse the direction if it's wrong,
		//	but we move in any case, since we might be deeply out of bounds
		var b = this.bounds();
		if (b.x < ob.x) {
			if (this.velocity.x < 0) this.velocity = this.velocity.scaleByPt(pt(-1, 1));
			this.moveBy(this.velocity);
		}
		if (b.maxX() > ob.maxX()) {
			if (this.velocity.x > 0) this.velocity = this.velocity.scaleByPt(pt(-1, 1));
			this.moveBy(this.velocity);
		}
		if (b.y < ob.y) {
			if (this.velocity.y < 0) this.velocity = this.velocity.scaleByPt(pt(1, -1));
			this.moveBy(this.velocity);
		}
		if (b.maxY() > ob.maxY()) {
			if (this.velocity.y > 0) this.velocity = this.velocity.scaleByPt(pt(1, -1));
			this.moveBy(this.velocity);
		}
	},
	
	stepByVelocities: function() {
		if (this.velocity) this.moveBy(this.velocity);
		if (this.angularVelocity) this.rotateBy(this.angularVelocity);
	},
	
	stepAndBounce: function() {  // convenience for tile scripting
		this.stepByVelocities();
		this.bounceInOwnerBounds();
	}
});


Morph.addMethods({     // help handling

	getHelpText: Functions.Null,  // override to supply help text

	showHelp: function(evt) {

		if (this.suppressBalloonHelp) return false;
		if (this.owner instanceof HandMorph) return false;
		var helpText = this.getHelpText();
		if (!helpText) return false;

		// Create only one help balloon at a time
		if (this.helpBalloonMorph && !this.helpBalloonMorph.getPosition().eqPt(evt.point())) {
			this.helpBalloonMorph.setPosition(this.window().localize(evt.point()));
			return false;
		} else {
			var width = Math.min(helpText.length * 20, 260); // some estimate of width.
			var window = this.window();
			var pos = window.localize(evt.point());
			this.helpBalloonMorph = new TextMorph(pos.addXY(10, 10).extent(pt(width, 20)), helpText);
			window.addMorph(this.helpBalloonMorph.beHelpBalloonFor(this));
			return true;
		}
	},

	hideHelp: function() {
		if (!this.helpBalloonMorph)  
			return;
		this.helpBalloonMorph.remove();
		delete this.helpBalloonMorph;
	}

});



// Morph mouse event handling functions
Morph.addMethods({

	// KP: equivalent of the DOM capture phase
	// KP: hasFocus is true if the receiver is the hands's focus (?)
	captureMouseEvent: function Morph$captureMouseEvent(evt, hasFocus) {
		// Dispatch this event to the frontmost receptive morph that contains it
		// Note boolean return for event consumption has not been QA'd
		// if we're using the fisheye... 
		if (this.fishEye) {
			// get the distance to the middle of the morph and check if we're 
			// close enough to start the fisheye
			var size = Math.max(this.bounds().width, this.bounds().height);

			var dist = evt.mousePoint.dist(this.bounds().center()) / this.fisheyeProximity;
			if (dist <= size) {
				// the fisheye factor is between 1..fisheyeGrowth
				this.setFisheyeScale(1 + this.fisheyeGrowth * Math.abs(dist/size - 1));
			} else {
				// just a precaution to make sure fisheye scaling isn't 
				// affecting its surrounding any more
				this.setFisheyeScale(1.0);
			}
		}
		if (hasFocus) return this.mouseHandler.handleMouseEvent(evt, this);

		if (!evt.priorPoint || !this.fullContainsWorldPoint(evt.priorPoint)) return false;

		if (this.hasSubmorphs()) {
			// If any submorph handles it (ie returns true), then return
			for (var i = this.submorphs.length - 1; i >= 0; i--) {
				if (this.submorphs[i].captureMouseEvent(evt, false)) return true;
			}
		}
		if (this.mouseHandler == null)
			return false;

		if (!evt.priorPoint || !this.shape.containsPoint(this.localize(evt.priorPoint))) 
			return false;


		return this.mouseHandler.handleMouseEvent(evt, this); 
	},


	areEventsIgnored: function() {
		return this.getTrait("pointer-events") == "none";
	},

	ignoreEvents: function() { // will not respond nor get focus
		this.mouseHandler = null;
		this.setTrait("pointer-events", "none");
		return this;
	},

	enableEvents: function() {
		this.mouseHandler = MouseHandlerForDragging.prototype;
		this.removeTrait("pointer-events");
		return this;
	},

  // added by Adam
	ignoreAllExceptDefaultEvents: function() {
    this.mouseHandler = MouseHandlerForDoingTheDefaultThing.prototype; // needed to make normal HTML events work, like clicking on links
		this.removeTrait("pointer-events");
		return this;
	},

	relayMouseEvents: function(target, eventSpec) {
		this.mouseHandler = new MouseHandlerForRelay(target, eventSpec); 
	},

	handlesMouseDown: function(evt) {
	  if (this._eventHandler && typeof(this._eventHandler.onMouseDown) === 'function') { return true; } // added by Adam
		if (this.mouseHandler == null || evt.isCommandKey()) return false;	//default behavior
		if (this.shouldAllowSelecting()) { return true; } // added by Adam
		if (evt.isDoubleClick() && this.handlesDoubleClick()) { return true; } // added by Adam
		return this.mouseHandler.handlesMouseDown(); 
	},

  runAvocadoEventHandler: function (handlerMethodName, evt) {
    // aaa hack added by Adam, this'll be overwritten later when the Avocado code is loaded
  },
  
	onMouseDown: function(evt) {
		if (!(this instanceof WorldMorph) && this.checkForDoubleClick(evt)) { return true; } // Added by Adam
		this.hideHelp();
		if (this.shouldAllowSelecting()) { this.makeSelection(evt); } // Added by Adam
    return this.runAvocadoEventHandler('onMouseDown', evt); // added by Adam
	}, //default behavior

  onMouseMove: function(evt, hasFocus) { //default behavior
     // why does LK not by default check okToBeGrabbedBy(evt)? -- Adam
      if (evt.mouseButtonPressed && this==evt.hand.mouseFocus && ((this.owner && this.owner.openForDragAndDrop) || this.okToBeGrabbedBy(evt))) {
          this.moveBy(evt.mousePoint.subPt(evt.priorPoint));
      } // else this.checkForControlPointNear(evt);
      if (!evt.mouseButtonPressed) this.checkForControlPointNear(evt);
      return this.runAvocadoEventHandler('onMouseMove', evt); // added by Adam
  },

	onMouseUp: function(evt) {
    return this.runAvocadoEventHandler('onMouseUp', evt); // added by Adam
	}, //default behavior

	//onKeyWhatever stuff added by Adam - I guess if the methods aren't there they don't get called, but I want them here so I can call my own event handler
	onKeyDown: function(evt) {
    return this.runAvocadoEventHandler('onKeyDown', evt); // added by Adam
	},
	onKeyPress: function(evt) {
    return this.runAvocadoEventHandler('onKeyPress', evt); // added by Adam
	},
	onKeyUp: function(evt) {
    return this.runAvocadoEventHandler('onKeyUp', evt); // added by Adam
	},
	
	considerShowHelp: function(oldEvt) {
		// if the mouse has not moved reasonably
		var hand = oldEvt.hand;
		if (!hand) return; // this is not an active world so it doesn't have a hand
		else if (oldEvt.mousePoint && hand.getPosition().dist(oldEvt.mousePoint) < 10) // oldEvt.mousePoint existence check added by Adam
		this.showHelp(oldEvt);
	},

	delayShowHelp: function(evt) {
		var scheduledHelp = new SchedulableAction(this, "considerShowHelp", evt, 0);
		if (this.world())
			this.world().scheduleForLater(scheduledHelp, Config.ballonHelpDelay || 1000, false);
	},

	onMouseOver: function(evt) {
		this.delayShowHelp(evt);
		try {
			// Highlight morphs when you can drop something on them. -- Adam
			if (typeof(this.beHighlighted) === 'function') {
			  var ms = evt.hand.submorphs.select(function(m) { return this.okToReceiveDrop(m); }.bind(this));
				if (ms.size() > 0) {
					this.showPotentialDrops(ms, evt);
				}
			}

      return this.runAvocadoEventHandler('onMouseOver', evt); // added by Adam
		} catch (ex) {
			console.log("Exception in onMouseOver for " + this + ": " + ex);
		}
	},
	
	// Added by Adam
	showPotentialDrops: function(potentialDrops, evt) {
		this.beHighlighted();
	},
	
	// Added by Adam
	hidePotentialDrops: function(evt) {
		this.beUnhighlighted();
	},

	onMouseOut: function(evt) { 
		this.hideHelp();

		// Highlight morphs when you can drop something on them. -- Adam
		if (typeof(this.beUnhighlighted) === 'function') {
			this.hidePotentialDrops();
		}

    return this.runAvocadoEventHandler('onMouseOut', evt); // added by Adam
	}, 

	onMouseWheel: function(evt) {
		if (!this.world()) return false;
		return this.world().onMouseWheel(evt);
	},

	takesKeyboardFocus: Functions.False,

	setHasKeyboardFocus: Functions.False, // no matter what, say no

	requestKeyboardFocus: function(hand) {
		if (this.takesKeyboardFocus()) {
			if (this.setHasKeyboardFocus(true)) {
				hand.setKeyboardFocus(this);
				return true;
			}
		}
		return false;
	},

	relinquishKeyboardFocus: function(hand) {
		hand.setKeyboardFocus(null);
		return this.setHasKeyboardFocus(false); 
	},

	onFocus: function(hand) {
		this.addFocusHalo();
	},

	onBlur: function(hand) {
		this.removeFocusHalo();
	},

	removeFocusHalo: function() {
		if (!this.focusHalo) return false;
		//this.focusHalo.removeRawNode();
		this.focusHalo.remove();
		this.focusHalo = null;
		return true;
	},

	focusHaloInset: 2,

	focusStyle: {
		fill: null, 
		borderColor: Color.blue,
		strokeOpacity: 0.3
	},

	adjustFocusHalo: function() {
		this.focusHalo.setBounds(this.localBorderBounds().expandBy(this.focusHaloInset));
	},

	addFocusHalo: function() {
		if (this.focusHalo || this.focusHaloBorderWidth <= 0) return false;
		this.focusHalo = Morph.makeRectangle(this.localBorderBounds().expandBy(this.focusHaloInset));
		this.focusHalo.name = "FocusHalo";
		this.focusHalo.isEpimorph = true;  // Do this before adding the halo
		this.addMorph(this.focusHalo);
		this.focusHalo.applyStyle(this.focusStyle);
		this.focusHalo.setBorderWidth(this.focusHaloBorderWidth);
		this.focusHalo.setLineJoin(lively.scene.LineJoins.Round);
		this.focusHalo.ignoreEvents();
		return true;
	}

});


// Morph grabbing and menu functionality
Morph.addMethods({

	checkForControlPointNear: function(evt) {
		if (this.suppressHandles) return false; // disabled
		if (this.owner == null) return false; // cant reshape the world
		if (this.hasHandles()) return false; // handles already on - no rollovers
		var partName = this.shape.partNameNear(this.localize(evt.point()));
		if (partName == null) return false;

		var loc = this.shape.partPosition(partName);
		var handle = this.makeHandle(loc, partName, evt);
		if (!handle) return false;  // makeHandle variants may return null

		this.addMorph(handle);  
		handle.showHelp(evt);
		if (evt.hand.mouseFocus instanceof HandleMorph) evt.hand.mouseFocus.remove();
		evt.hand.setMouseFocus(handle);
		return true; 
	},
addAllHandles: function(evt) {
		if (this.suppressHandles) return false; // disabled
		if (this.owner == null) return false; // can't reshape the world
		var partNames = this.shape.allPartNames();  // Array of name
		for (var i=0; i<partNames.length; i++) {
			var loc = this.shape.partPosition(partNames[i]);
			var handle = this.makeHandle(loc, partNames[i], evt);
			handle.mode = 'reshape';
			handle.showingAllHandles = true;
			handle.rollover = false; 
			handle.isEpimorph = false;  // make bounds grow so feels click outside target
			this.addMorph(handle);  
		}
		if (evt.hand.mouseFocus instanceof HandleMorph) evt.hand.mouseFocus.remove();
	},
	
	hasHandles: function(h) { return this.submorphs.any(function (m) { return m instanceof HandleMorph }); },
	
	removeAllHandlesExcept: function(h) {
		var removals = [];
		this.submorphs.forEach(function (m) { if (m !== h && m instanceof HandleMorph) removals.push(m); });
		removals.forEach(function (m) { m.remove(); });
	},

	makeHandle: function(position, partName, evt) { // can be overriden
		var handleShape = Object.isString(partName) || partName >= 0 ? lively.scene.Rectangle : lively.scene.Ellipse;
		return new HandleMorph(position, handleShape, evt.hand, this, partName);
	},

    copySubmorphsOnGrab: false, // acts as a palette if true.
    

	suppressGrabbing: false,

    // May be overridden to preempt (by returning null) the default action of grabbing me
    // or to otherwise prepare for being grabbed or find a parent to grab instead
    okToBeGrabbedBy: function(evt) {
		if (this.suppressGrabbing)
			return null;
		
		// added by Adam
		if (this.owner && !this.owner.openForDragAndDrop)
		  return null;
		
		return this; 
    },

	editMenuItems: function(evt) { 
		return [];  // Overridden by, eg, TextMorph
	},

	showMorphMenu: function(evt) {
		if (evt.hand.lastMorphMenu && evt.hand.lastMorphMenu.owner) {
			evt.hand.lastMorphMenu.remove(); // cleanup old open menus
		};
		var menu = this.morphMenu(evt);
		var menuCaption = this.getName() ? this.getName() + ' - ' : '';
		menuCaption += Object.inspect(this).truncate();
		menu.openIn(this.world(), evt.point(), false, menuCaption); 
		evt.hand.lastMorphMenu = menu;
	},

	morphMenu: function(evt) { 
		var items = [
			["remove", this.remove],
			["drill", this.showOwnerChain.curry(evt)],
			["grab", this.pickMeUp.curry(evt)],
			["drag", this.dragMe.curry(evt)],
			["edit style", function() { new StylePanel(this).open()}],
			[((this.hasHandles()) ? "hide" : "show") + " all handles", function(evt) {
				if (this.hasHandles()) this.removeAllHandlesExcept(null);
					else this.addAllHandles(evt) }.bind(this) ],		
			["inspect", function(evt) { new SimpleInspector(this).openIn(this.world())}],
			["show class in browser", function(evt) { var browser = new SimpleBrowser(this);
				browser.openIn(this.world(), evt.point());
				browser.getModel().setClassName(this.getType());}]
			];
		if (this.okToDuplicate())
			items.unshift(["duplicate", this.copyToHand.curry(evt.hand)]);

		if (this.shape instanceof lively.scene.Polyline || this.shape instanceof lively.scene.Polygon)
			items.push( ["copy to curve", this.makeCurve]);

		if (this.getModel() instanceof SyntheticModel)
			items.push( ["show Model dump", this.addModelInspector.curry(this)]);

		var menu = new MenuMorph(items, this);

		menu.addLine();
		menu.addItem( ["world...", function() {this.world().showMorphMenu(evt)}.bind(this)]);

		menu.addLine();

		menu.addItems(this.subMenuItems(evt));
		return menu;
	},

	subMenuItems: function(evt) {
		var propertiesItems =  [
			["edit name...", function() { this.world().prompt('edit name', function(input) { this.setName(input) }.bind(this), this.getName()) }],
			["reset rotation", this.setRotation.curry(0)],
			["reset scaling", this.setScale.curry(1)],
			[((this.suppressGrabbing) ? "[] grabbing" : "[X] grabbing"), function(){this.suppressGrabbing = !this.suppressGrabbing}.bind(this)],
			[((this.suppressHandles) ? "[] handles" : "[X] handles"), function(){this.suppressHandles = !this.suppressHandles}.bind(this)],
			[((this._shouldAllowSelecting) ? "disallow selecting" : "allow selecting"), function(){this._shouldAllowSelecting = !this._shouldAllowSelecting; console.log("Just set _shouldAllowSelecting of " + reflect(this).inspect() + " to " + this._shouldAllowSelecting); }.bind(this)], // added by Adam
			[((this.fishEye) ? "turn fisheye off" : "turn fisheye on"), this.toggleFisheye],
			[(this.openForDragAndDrop ? "close DnD" : "open DnD"), this.toggleDnD.curry(evt.point())],
			// ["add button behavior", function() { this.addMorph(new ButtonBehaviorMorph(this)); }], // commented out by Adam - need the room in the menu
			[(this.copySubmorphsOnGrab ? "unpalettize" :  "palettize"), function() { this.copySubmorphsOnGrab = !this.copySubmorphsOnGrab; }]
		];
		var windowItems = [
			["put me in a window", this.putMeInAWindow.curry(this.position())], 
			["put me in a tab", this.putMeInATab.curry(this.position())],
			["put me in the open", this.putMeInTheWorld.curry(this.position())],
			["show Lively markup", this.addSvgInspector.curry(this)],
			["package", function(evt) {  // FIXME insert package morph in exactly the same position?
				new PackageMorph(this).openIn(this.world(), evt.point()); this.remove(); } ],
			["publish packaged ...", function() { this.world().prompt('publish as (.xhtml)', this.exportLinkedFile.bind(this)); }] 
		];
		return [
			['Properties', propertiesItems],
			// ['Window and World', windowItems] // commented out by Adam - don't want this stuff, and need to make room in the menu
		]
	},

    showPieMenu: function(evt) {
    	var menu, targetMorph = this;
		var items = [
			['undo (~)', function(evt) { PieMenuMorph.doUndo(); }],
			['duplicate (o-->o)', function(evt) {
				evt.hand.setPosition(menu.mouseDownPoint);
				menu.targetMorph.copyToHand(evt.hand);
				var theCopy = evt.hand.submorphs[0];
				PieMenuMorph.setUndo(function() { theCopy.remove(); });  // Why doesn't this work??
				}],
			['move (o-->)', function(evt) {
				var oldPos = targetMorph.getPosition();
				PieMenuMorph.setUndo(function() { targetMorph.setPosition(oldPos); });
				evt.hand.setPosition(menu.mouseDownPoint);
				evt.hand.addMorph(menu.targetMorph);
				if (menu.targetMorph instanceof SelectionMorph)  // Fixme:  This should be in SelectionMorph
					menu.targetMorph.selectedMorphs.forEach( function(m) { evt.hand.addMorph(m); });
				}],
			['scale (o < O)', function(evt) {
				var oldScale = targetMorph.getScale();
				PieMenuMorph.setUndo(function() { targetMorph.setScale(oldScale); });
				menu.addHandleTo(targetMorph, evt, 'scale');
				}],
			[((targetMorph.hasHandles()) ? "hide" : "show") + " all handles ([])", function(evt) {
				if (targetMorph.hasHandles()) targetMorph.removeAllHandlesExcept(null);
					else targetMorph.addAllHandles(evt) }],
			['delete (X)', function(evt) {
				var oldOwner = targetMorph.owner;
				PieMenuMorph.setUndo(function() { oldOwner.addMorph(targetMorph); });
				targetMorph.remove();
				}],
			['edit style (<>)', function() { new StylePanel(this).open()}],
			['rotate (G)', function(evt) {
				var oldRotation = targetMorph.getRotation();
				PieMenuMorph.setUndo(function() { targetMorph.setRotation(oldRotation); });
				menu.addHandleTo(targetMorph, evt, 'rotate');
				}]
		];
		menu = new PieMenuMorph(items, this, 0.5);
		menu.open(evt);
    },

	dragMe: function(evt) {
		var offset = this.getPosition().subPt(this.ownerLocalize(evt.point()));
		var mouseRelay= {
			captureMouseEvent: function(e) { 
				if (e.type == "MouseMove")  this.setPosition(this.ownerLocalize(e.hand.getPosition()).addPt(offset));
				if (e.type == "MouseDown" || e.type == "MouseUp")  e.hand.setMouseFocus(null); 
			}.bind(this),
		};
		evt.hand.setMouseFocus(mouseRelay);
	},

	putMeInAWindow: function(loc) {
		var c = this.immediateContainer();
		var w = this.world();
		var wm = new WindowMorph(this.windowContent(), this.windowTitle());
		// Position it so the content stays in place
		w.addMorphAt(wm, loc.subPt(wm.contentOffset));
		if (c) c.remove();
	},

	putMeInATab: function(loc) {
		var c = this.immediateContainer();
		var w = this.world();
		var wm = new TabbedPanelMorph(this.windowContent(), this.windowTitle());
		w.addMorphAt(wm, wm.getPosition());
		if (c) c.remove();
	},

	putMeInTheWorld: function(loc) {
		var c = this.immediateContainer();
		var loc = c ? c.position().addPt(c.contentOffset) : this.position();
		this.world().addMorphAt(this, loc);
		if (c) c.remove();
	},

	immediateContainer: function() { // Containers override to return themselves
		if (this.owner) return this.owner.immediateContainer();
		else return null;
	},

	windowContent: function() {
		return this; // Default response, overridden by containers
	},

	windowTitle: function() {
		return Object.inspect(this).truncate(); // Default response, overridden by containers
	},

	toggleDnD: function(loc) {
		// console.log(this + ">>toggleDnD");
		this.openForDragAndDrop = !this.openForDragAndDrop;
	},

	openDnD: function(loc) {
		this.openForDragAndDrop = true;
		return this; // Added by Adam to allow chaining
	},

	closeDnD: function(loc) {
		// console.log(this + ">>closeDnD");
		this.openForDragAndDrop = false;
		return this; // Added by Adam to allow chaining
	},

    closeAllToDnD: function(loc) {
        // console.log(this + ">>closeAllDnD");
        // Close this and all submorphs to drag and drop
        this.closeDnD(); 
        // make this recursive to give children a chance to interrupt...
        this.submorphs.forEach( function(ea) { ea.closeAllToDnD(); });
	return this; // Added by Adam to allow chaining
    },

	openAllToDnD: function() {
		// Open this and all submorphs to drag and drop
		this.withAllSubmorphsDo( function() { this.openDnD(); });
		return this; // Added by Adam to allow chaining
	},

	dropMeOnMorph: function(receiver) {
		receiver.addMorph(this); // this removes me from hand
	},

	pickMeUp: function(evt) {
		var offset = evt.hand.getPosition().subPt(evt.point());
		this.moveBy(offset);
		evt.hand.addMorphAsGrabbed(this);
	},

	notify: function(msg, loc) {
		if (!loc) loc = this.world().positionForNewMorph();
		new MenuMorph([["OK", 0, "toString"]], this).openIn(this.world(), loc, false, msg); 
	},

	showOwnerChain: function(evt) {
		var items = this.ownerChain().reverse().map(
			function(each) { 
				return [Object.inspect(each).truncate(), function(evt2) { each.showMorphMenu(evt) }]; 
			});
		new MenuMorph(items, this).openIn(this.world(), evt.point(), false, "Top item is topmost");
	},

	copyToHand: function(hand) {
		// Function.prototype.shouldTrace = true;
		var copy = this.copy(new Copier());
		// when copying submorphs, make sure that the submorph that becomes a top-level morph 
		// reappears in the same location as its original.
		console.log('copied %s', copy);
		copy.owner = null; // so following addMorph will just leave the tfm alone
		this.owner.addMorph(copy); // set up owner as the original parent so that...        
		hand.addMorph(copy);  // ... it will be properly transformed by this addMorph()
		copy.setPosition(copy.getExtent().scaleBy(-0.5)); // Grab it by the center. -- Adam, May 2010
		hand.showAsGrabbed(copy);
		// copy.withAllSubmorphsDo(function() { this.startStepping(null); }, null);
    copy.refreshContentOfMeAndSubmorphs(); // added by Adam
		return copy
	},

	shadowCopy: function(hand) {
		// This is currently an expensive and error-prone deep copy
		// Better would be a shallow copy unless there are submorphs outside bounds
		var copy;
		try {
		  // Yeah, let's put in a faster hack for now; we're having performance problems
		  // with grabbing complex morphs. -- Adam
		  //copy = this.copy(new Copier());
		  copy = new Morph(this.shape.copy());
		  copy.setPosition(this.getPosition());
		  copy.setScale(this.getScale());
		}
		catch (e) { copy = Morph.makeRectangle(this.bounds()); }
		copy.withAllSubmorphsDo( function() {
			if (this.fill || this.getFill()) this.setFill(Color.black);
			else this.setFill(null);
			if (this.getBorderColor()) this.setBorderColor(Color.black);
			this.setFillOpacity(0.3);
			this.setStrokeOpacity(0.3);
		});
		copy.owner = null; // so later addMorph will just leave the tfm alone
		return copy;
	},

	morphToGrabOrReceiveDroppingMorph: function(evt, droppingMorph) {
		return this.morphToGrabOrReceive(evt, droppingMorph, true);
	},

	morphToGrabOrReceive: function(evt, droppingMorph, checkForDnD) {
		// If checkForDnD is false, return the morph to receive this mouse event (or null)
		// If checkForDnD is true, return the morph to grab from a mouse down event (or null)
		// If droppingMorph is not null, then check that this is a willing recipient (else null)

		if (this.isEpimorph)
			return null;

		if (!this.fullContainsWorldPoint(evt.mousePoint)) return null; // not contained anywhere
		// First check all the submorphs, front first
		for (var i = this.submorphs.length - 1; i >= 0; i--) {
			var hit = this.submorphs[i].morphToGrabOrReceive(evt, droppingMorph, checkForDnD); 
			if (hit != null) { 
				return hit;  // hit a submorph
			}
		};

		// Check if it's really in this morph (not just fullBounds)
		if (!this.containsWorldPoint(evt.mousePoint)) return null;

		// If no DnD check, then we have a hit (unless no handler in which case a miss)
		if (!checkForDnD) return this.mouseHandler ? this : null;

		// On drops, check that this is a willing recipient
		if (droppingMorph != null) {
			return this.okToReceiveDrop(droppingMorph) ? this : null;
		} else {
			// On grabs, can't pick up the world or morphs that handle mousedown
			// DI:  I think the world is adequately checked for now elsewhere
			// else return (!evt.isCommandKey() && this === this.world()) ? null : this; 
			return this;
		}

	},

	morphToReceiveEvent: function(evt) {
		// This should replace morphToGrabOrReceive... in Hand where events
		// must be displatched to morphs that are closed to DnD
		return this.morphToGrabOrReceive(evt, null, false);
	},

	ownerChain: function() {
		// Return an array of me and all my owners
		// First item is, eg, world; last item is me
		if (!this.owner) return [this];
		var owners = this.owner.ownerChain();
		owners.push(this);
		return owners;
	},

	acceptsDropping: function(morph) { 
		return this.openForDragAndDrop && !(morph instanceof WindowMorph);
	}

});

Morph.subclass('PseudoMorph', {
    description: "This hack to make various objects serializable, despite not being morphs",
    
	initialize: function($super) {
		$super(new lively.scene.Group());
		this.setVisible(false);
	}

});

// TODO: Is this still used?
// Deprecated?
PseudoMorph.subclass('Invocation', {
    initialize: function($super, actor, scriptName, argIfAny) {
	$super();
	this.actor = actor;
	this.scriptName = scriptName;
	this.argIfAny = argIfAny; // better be primitive
    },

    exec: function Invocation$exec() {
	if (!this.actor) {
	    console.warn("no actor on script %s", this);
	    return null;
	}
	var func = this.actor[this.scriptName];
	if (func) {
	    return func.call(this.actor, this.argIfAny);
	} else {
	    //console.warn("no callback on actor %s", this.actor);
	    return null;
	}
    }

});


Invocation.subclass('SchedulableAction', {

	documentation: "Description of a periodic action",
	beVerbose: false,

	initialize: function($super, actor, scriptName, argIfAny, stepTime) {
		$super(actor, scriptName, argIfAny);
		this.stepTime = stepTime;
		this.ticks = 0;
	},

	toString: function() {
		return Strings.format("#<SchedulableAction[actor=%s,script=%s,arg=%s,stepTime=%s]>", 
		this.actor, this.scriptName, this.argIfAny, this.stepTime);
	},

	stop: function(world) {
		if (this.beVerbose) console.log("stopped stepping task %s", this);
		world.stopSteppingFor(this);
	},

	start: function(world) {
		if (this.beVerbose) console.log("started stepping task %s", this);
		world.startSteppingFor(this);
	},

	equalActorAndName: function(other) {
		if (!other) 
			return false;
		if (this === other) 
			return true;
		return (this.actor === other.actor) && (this.scriptName == other.scriptName)
	}
});

// Morph stepping/timer functions
Morph.addMethods({

    startSteppingScripts: function() { }, // May be overridden to start stepping scripts

	stopStepping: function() {
		if (!this.activeScripts) return;
		// ignore null values
		this.activeScripts.select(function (ea) { return ea }).invoke('stop', this.world());
		this.activeScripts = null;
	},
	
	stopSteppingScriptNamed: function(sName) {
		if (!this.activeScripts) return;
		this.activeScripts.select(function (ea) { return ea.scriptName == sName }).invoke('stop', this.world());
		this.activeScripts = this.activeScripts.select(function (ea) { return ea.scriptName !== sName });	
		if (this.activeScripts.length == 0) this.activeScripts = null;
	},

	startStepping: function(stepTime, scriptName, argIfAny) {
		if (!scriptName) 
			throw Error("Old code");
		var action = new SchedulableAction(this, scriptName, argIfAny, stepTime);
		this.addActiveScript(action);
		action.start(this.world());
		return action;
	},

	addActiveScript: function(action) {
		// Every morph carries a list of currently active actions (alarms and repetitive scripts)
		if (!this.activeScripts) this.activeScripts = [action];
		else this.activeScripts.push(action);
		if (!action.rawNode.parentNode) 
			this.addMorph(action);
		return this;
		// if we're deserializing the rawNode may already be in the markup
	},

    stopAllStepping: function() {  // For me and all my submorphs 
		this.withAllSubmorphsDo( function() { this.stopStepping(); });
    },

    suspendAllActiveScripts: function() {  // For me and all my submorphs
		this.withAllSubmorphsDo( function() { this.suspendActiveScripts(); });
    },

	suspendActiveScripts: function() {
		if (this.activeScripts) { 
			this.suspendedScripts = this.activeScripts.clone();
			this.stopStepping();
		}
	},

	resumeAllSuspendedScripts: function() {
		var world = WorldMorph.current();
		this.withAllSubmorphsDo( function() {
			if (this.suspendedScripts) {
				// ignore null values
				this.suspendedScripts.select(function (ea) { return ea }).invoke('start', world);
				this.activeScripts = this.suspendedScripts;
				this.suspendedScripts = null;
			}
		});
	}

});

// Morph bounds, coordinates, moving and damage reporting functions
Morph.addMethods({ 
    
    // bounds returns the full bounding box in owner coordinates of this morph and all its submorphs
	bounds: function(ignoreTransients, ignoreTransform) {
		if (this.fullBounds != null) return this.fullBounds;

		var tfm = this.getTransform();
		var fullBounds = this.localBorderBounds(ignoreTransform ? null : tfm);

		var subBounds = this.submorphBounds(ignoreTransients);
		if (subBounds != null) {
			// could be simpler when no rotation...
			fullBounds = fullBounds.union(tfm.transformRectToRect(subBounds));
		}

		if (fullBounds.width < 3 || fullBounds.height < 3) {
			// Prevent Horiz or vert lines from being ungrabable
			fullBounds = fullBounds.expandBy(3); 
		}
		this.fullBounds = fullBounds;
		return fullBounds; 
	},
    
	submorphBounds: function(ignoreTransients) {
		var subBounds = null;
		for (var i = 0; i < this.submorphs.length; i++) {
			var m = this.submorphs[i];
			if ((ignoreTransients && m.isEpimorph))
				continue;
			if (!m.isVisible()) {
				continue;
			}
			subBounds = subBounds == null ? m.bounds(ignoreTransients) : subBounds.union(m.bounds(ignoreTransients));
		}
		return subBounds;
	},
    
    // innerBounds returns the bounds of this morph only, and in local coordinates
    innerBounds: function() { 
		return this.shape.bounds();
    },
    
	localBorderBounds: function(optTfm) {
		// defined by the external edge of the border
		// if optTfm is defined, transform the vertices first, then take the union
		dbgOn(!this.shape);
		var bounds = optTfm ? Rectangle.unionPts(this.shape.vertices().invoke('matrixTransform', optTfm)) : this.shape.bounds();

		var borderMargin = this.getBorderWidth()/2;
		// double border margin for polylines to account for elbow protrusions
		if (this.shape.hasElbowProtrusions) borderMargin = borderMargin*2 + 1;
		bounds = bounds.expandBy(borderMargin);
		return bounds;
	},
    
    
    /** 
      * mapping coordinates in the hierarchy
      * @return [Point]
      */

    // map local point to world coordinates
    worldPoint: function(pt) { 
		return pt.matrixTransform(this.transformToMorph(this.world())); 
    },

	// map owner point to local coordinates
	relativize: function(pt) { 
		if (!this.owner) { 
			throw new Error('no owner; call me after adding to a morph? ' + this);
		}
		try {
			return pt.matrixTransform(this.owner.transformToMorph(this)); 
		} catch (er) {
			// console.info("ignoring relativize wrt/%s", this);
			return pt;
		}
	},

    // map owner rectangle to local coordinates
    relativizeRect: function(r) { 
		return rect(this.relativize(r.topLeft()), this.relativize(r.bottomRight()));
    },

    // map world point to local coordinates
	localize: function(pt) {
		if (pt == null) console.log('null pt');   
		if (this.world() == null) {
			// console.log('ERROR in '+  this.id() +' localize: '+ pt + ' this.world() is null');   
			// printStack();
			return pt;
		}
		return pt.matrixTransform(this.world().transformToMorph(this));
	},

    // map local point to owner coordinates
	localizePointFrom: function(pt, otherMorph) {   
		try {
			return pt.matrixTransform(otherMorph.transformToMorph(this));
		} catch (er) {
			// lively.lang.Execution.showStack();
			console.log("problem " + er + " on " + this + " other " + otherMorph);
			return pt;
		}
	},

  // added by Adam
  ownerLocalize: function(pt) {
		if (! this.owner) { return pt; }
    return this.owner.localize(pt);
  },
  
    transformForNewOwner: function(newOwner) {
		return new lively.scene.Similitude(this.transformToMorph(newOwner));
    },

	changed: function() {
		// Note most morphs don't need this in SVG, but text needs the 
		// call on bounds() to trigger layout on new bounds
		if(this.owner) this.owner.invalidRect(this.bounds());

    if (this._changeNotifier) { this._changeNotifier.notifyAllObservers(); } // Added by Adam
	},

	invalidRect: function() {
		// Do nothing (handled by SVG).  Overridden in canvas.
    },

    layoutOnSubmorphLayout: function(submorph) {
		// override to return false, in which case layoutChanged() will not be propagated to
		// the receiver when a submorph's layout changes. 
		return true;
    },

	transformChanged: function() {
		var scalePt = this.scalePoint;
		if (this.fisheyeScale != 1) scalePt = scalePt.scaleBy(this.fisheyeScale);
		this.pvtCachedTransform = new lively.scene.Similitude(this.origin, this.rotation, scalePt);
		this.pvtCachedTransform.applyTo(this.rawNode);
		if (this._cachedVisibleBounds) { this._cachedVisibleBounds = null; } // added by Adam
	},

	layoutChanged: function Morph$layoutChanged() {
		// layoutChanged() is called whenever the cached fullBounds may have changed
		// It invalidates the cache, which will be recomputed when bounds() is called
		// Naturally it must be propagated up its owner chain.
		// Note the difference in meaning from adjustForNewBounds()
		// KP: the following may or may not be necessary:

		this.transformChanged(); // DI: why is this here?
		if(! this.fullBounds) return;  // already called

		this.fullBounds = null;
		if (this.owner && this.owner.layoutOnSubmorphLayout(this) && !this.isEpimorph) {     // May affect owner as well...
			this.owner.layoutChanged();
		}
		this.layoutManager.layoutChanged(this);
	},

	adjustForNewBounds: function() {
		// adjustForNewBounds() is called whenever the innerBounds may have changed in extent
		//  -- it should really be called adjustForNewExtent --
		// Depending on the morph and its layoutManager, it may then re-layout its
		// submorphs and, in the process, propagate the message down to leaf morphs (or not)
		// Of course a change in innerBounds implies layoutChanged() as well,
		// but, for now, these are called separately.
		// NB:  Because some morphs may re-lay themselves out in response to adjustForNewBounds()
		// adjustForNewBounds() *must never be called from* a layout operation;
		// The layout process should only move and resize submorphs, but never change the innerBounds

		// If this method is overridden by a subclass, it should call super as well
		if (this.focusHalo) this.adjustFocusHalo();
		
		if (this._layout && this._layout.adjustForNewBounds) { this._layout.adjustForNewBounds(this); } // added by Adam
	},

	position: function() { // Deprecated -- use getPosition
		return this.shape.bounds().topLeft().addPt(this.origin); 
	},

	getPosition: function() {
		return this.shape.bounds().topLeft().addPt(this.origin); 
	},

	setPosition: function(newPosition) {
		this.layoutManager.setPosition(this, newPosition);
		return this; // added by Adam
	},
	
	// Hack by Adam to allow avoiding creating new Points. -- Adam
	setPositionXY: function(newX, newY) {
		this.layoutManager.setPositionXY(this, newX, newY);
  }

});

// Inspectors for Morphs
Morph.addMethods({

	addSvgInspector: function() {
		var xml = Exporter.stringify(new Exporter(this).serialize(Global.document));
		var txt = this.world().addTextWindow({
			content: xml,
			title: "XML dump", 
			position: this.world().positionForNewMorph(null, this)
		});
		txt.innerMorph().xml = xml; // FIXME a sneaky way of passing original text.
	},

	addModelInspector: function() {
		var model = this.getModel();
		if (model instanceof SyntheticModel) {
			var variables = model.variables();
			var list = [];
			for (var i = 0; i < variables.length; i++) {
				var varName = variables[i];
				list.push(varName + " = " + model.get(varName));
			}
			this.world().addTextListWindow({
				content: list,
				title: "Simple Model dump",
				position: this.world().positionForNewMorph(null, this)
			});
		}
	}
});


// Morph factory methods for creating simple morphs easily
Object.extend(Morph, {

	makeLine: function(verts, lineWidth, lineColor) {
		// make a line with its origin at the first vertex
		// Note this works for simple lines (2 vertices) and general polylines
		verts = verts.invoke('subPt', verts[0]);
		var shape = new lively.scene.Polyline(verts);
		var morph = new Morph(shape);
		morph.setBorderWidth(lineWidth);
		morph.setBorderColor(lineColor);
		morph.setFill(null);
		return morph;
	},

	makeCircle: function(location, radius, lineWidth, lineColor, fill) {
		// make a circle of the given radius with its origin at the center
		var morph = new Morph(new lively.scene.Ellipse(location, radius));
		morph.setBorderWidth(lineWidth);
		morph.setBorderColor(lineColor);
		morph.setFill(fill || Color.blue);
		return morph;
	},

	makeEllipse: function(bounds, lineWidth, lineColor, fill) {
		// make a circle first (a bit wasteful)
		var morph = this.makeCircle(bounds.center(), 0, lineWidth, lineColor, fill);
		morph.setBounds(bounds);
		morph.moveOriginBy(morph.innerBounds().center())
		return morph;
	},

	makeRectangle: function(/**/) {
		var morph;
		switch (arguments.length) {
			case 1: // rectangle
			if (!(arguments[0] instanceof Rectangle)) throw new TypeError(arguments[0] + ' not a rectangle');
			morph = new Morph(new lively.scene.Rectangle(arguments[0]));
			break;
			case 2: // location and extent
			morph = new Morph(new lively.scene.Rectangle(arguments[0].extent(arguments[1])));
			break;
			case 4: // x,y,width, height
			morph = new Morph(new lively.scene.Rectangle(new Rectangle(arguments[0], arguments[1], arguments[2], arguments[3])));
			break;
			default:
			throw new Error("bad arguments " + arguments);
		}
		return morph.applyStyle({borderWidth: 1, borderColor: Color.black, fill: Color.blue});
	},

	makePolygon: function(verts, lineWidth, lineColor, fill) {
		var morph = new Morph(new lively.scene.Polygon(verts));
		morph.setBorderWidth(lineWidth);
		morph.setBorderColor(lineColor);
		morph.setFill(fill);
		return morph;
		//return morph.applyStyle({fill: fill, borderWidth: lineWidth, borderColor: lineColor});
	},

	makeStar: function(position) {
		var makeStarVertices = function(r,center,startAngle) {
			var vertices = [];
			var nVerts = 10;
			for (var i=0; i <= nVerts; i++) {
				var a = startAngle + (2*Math.PI/nVerts*i);
				var p = Point.polar(r,a);
				if (i%2 == 0) p = p.scaleBy(0.39);
				vertices.push(p.addPt(center)); 
			}
			return vertices; 
		}
		var morph = Morph.makePolygon(makeStarVertices(50,pt(0,0),0), 1, Color.black, Color.yellow);
		morph.setPosition(position);
		return morph
	},
	makeCurve: function(verts, ctrls, closed) {
		// Make up a new quadratic spline from the supplied vertices and control points.
		// ctrls[i] is the ctrl point for segment from verts[i-1] to verts[i].  (ctrls[0] is never used)
		if (verts.length < 2) return;
		// console.log("verts = " + Object.inspect(verts));
		// console.log("ctrls = " + Object.inspect(ctrls));
		var g = lively.scene;
		var cmds = [];
		cmds.push(new g.MoveTo(true, verts[0].x,  verts[0].y));
		for (var i=1; i<verts.length; i++) {
			cmds.push(new g.QuadCurveTo(true, verts[i].x, verts[i].y, ctrls[i].x, ctrls[i].y));
		}
		var morph = new Morph(new g.Path(cmds));
		if (closed) morph.applyStyle({ fill: Color.red, borderWidth: 1, borderColor: Color.black});
			else morph.applyStyle({ fill: null, borderWidth: 3, borderColor: Color.red});
		return morph;
},


	makeHeart: function(position) {
		var g = lively.scene;
		var shape = new g.Path([
			new g.MoveTo(true, 0,  0),
			new g.CurveTo(true, 48.25, -5.77),
			new g.CurveTo(true, 85.89, 15.05),
			new g.CurveTo(true, 61.36, 32.78),
			new g.CurveTo(true, 53.22, 46.00),
			new g.CurveTo(true, 25.02, 68.58),
			new g.CurveTo(true, 1.03,  40.34),
			new g.CurveTo(true, 0,  0),
		]);
		var morph = new Morph(shape);
		morph.applyStyle({ fill: Color.red, borderWidth: 3, borderColor: Color.red});
		morph.setPosition(position);
		morph.rotateBy(3.9);
		return morph
	}
});

// View trait
ViewTrait = {
    connectModel: function(plugSpec, optKickstartUpdates) {
	// FIXME what if already connected, 
	if (plugSpec instanceof Relay) {
	    // new style model
	    this.formalModel = plugSpec;
	    // now, go through the setters and add notifications on model
	    if (plugSpec.delegate instanceof Record) 
		plugSpec.delegate.addObserversFromSetters(plugSpec.definition, this, optKickstartUpdates);
	    return;
	} else if (plugSpec instanceof Record) {
	    this.formalModel = plugSpec;
	    plugSpec.addObserversFromSetters(plugSpec.definition, this, optKickstartUpdates);
	    return;
	}
	// connector makes this view pluggable to different models, as in
	// {model: someModel, getList: "getItemList", setSelection: "chooseItem"}
	var newPlug = (plugSpec instanceof ModelPlug) ? plugSpec : new ModelPlug(plugSpec);
	
	var model = newPlug.model;
	if (!(model instanceof Model) && !this.checkModel(newPlug))
	    console.log("model " + model +  " is not a Model, view " + this);

	this.modelPlug = newPlug;
	reflect(this).slotAt('modelPlug').beCreator(); // aaa hack for morph-saving -- Adam

	if (model.addDependent) { // for mvc-style updating
	    model.addDependent(this);
	} 
	return this;
    },

    relayToModel: function(model, optSpec, optKickstart) {
	return this.connectModel(Relay.newInstance(optSpec || {}, model), optKickstart);
    },

    reconnectModel: function() {
	if (this.formalModel instanceof Relay) {
	    // now, go through the setters and add notifications on model
	    //alert('delegate ' + this.formalModel.delegate);
	    if (this.formalModel.delegate instanceof Record)  {
		this.formalModel.delegate.addObserversFromSetters(this.formalModel.definition, this);
	    }
	} else if (this.formalModel instanceof Record) {
	    this.formalModel.addObserversFromSetters(this.formalModel.definition, this);
	} //else alert('formal model ' + this.formalModel);
    },

    checkModel: function(plugSpec) {
	// For non-models, check that all supplied handler methods can be found
	var result = true;
	Properties.forEachOwn(plugSpec, function(modelMsg, value) {
	    if (modelMsg == 'model') return;
	    var handler = plugSpec.model[value];
	    
	    if (!handler || !(handler instanceof Function)) {
		// console.log
		alert("Supplied method name, " + value + " does not resolve to a function.");
		result = false;
	    }
	});
	return result;
    },

    disconnectModel: function() {
	var model = this.getModel();
	if (model && model.removeDependent) { // for mvc-style updating
	    model.removeDependent(this);
	} 
    },

    getModel: function() {
	var plug = this.getModelPlug();
	if (plug) return plug.model;
	else return this.getActualModel();
    },

    getActualModel: function() {
	return this.formalModel instanceof Relay ? this.formalModel.delegate : this.formalModel;
    },
    
    getModelPlug: function() { 
	var plug = this.modelPlug;
	return (plug && plug.delegate) ?  plug.delegate : plug;
    },

    getModelValue: function(functionName, defaultValue) {
	// functionName is a view-specific message, such as "getList"
	// The model plug then provides a reference to the model, as well as
	// the specific model accessor for the aspect being viewed, say "getItemList"
	// Failure at any stage will return the default value.
	// TODO: optionally verify that variable name is listed in this.pins
	if (this.formalModel) {  
	    // snuck in compatiblitiy with new style models
	    var impl = this.formalModel[functionName];
	    return impl ? impl.call(this.formalModel) : defaultValue;
	}
	
	var plug = this.getModelPlug();
	if (plug == null || plug.model == null || functionName == null) return defaultValue;
	var func = plug.model[plug[functionName]];
	if (func == null) return defaultValue;
	return func.call(plug.model); 
    },

    setModelValue: function(functionName, newValue) {
	// functionName is a view-specific message, such as "setSelection"
	// The model plug then provides a reference to the model, as well as
	// the specific model accessor for the aspect being viewed, say "chooseItem"
	// Failure at any stage is tolerated without error.
	// Successful sets to the model supply not only the newValue, but also
	// a reference to this view.  This allows the model's changed() method
	// to skip this view when broadcasting updateView(), and thus avoid
	// needless computation for a view that is already up to date.
	// TODO: optionally verify that variable name is listed in this.pins
	if (this.formalModel) { 
	    // snuck in compatiblitiy with new style models
	    var impl = this.formalModel[functionName];
	    return impl && impl.call(this.formalModel, newValue);
	}
	var plug = this.getModelPlug();
	if (plug == null || plug.model == null || functionName == null) return null;
	var func = plug.model[plug[functionName]];
	if (func == null) return null;
	func.call(plug.model, newValue, this);
	return plug[functionName];
    },

    updateView: function(aspect, controller) {
	// This method is sent in response to logic within the model executing
	//     this.changed(aspect, source)
	// The aspect used is the name of the get-message for the aspect
	// that needs to be updated in the view (and presumably redisplayed)
	// All actual view morphs will override this method with code that
	// checks for their aspect and does something useful in that case.
    }
};

Object.subclass('View', ViewTrait, {

    initialize: function(modelPlug) {
	if (modelPlug)
	    this.connectModel(modelPlug);
    },

    getType: function() { // convenience
	return this.constructor.getOriginal().type;
    },

    toString: function() {
	return "#<" + this.getType() + ">";
    }

});

Morph.addMethods(ViewTrait);


// ===========================================================================
// MVC model support
// ===========================================================================

/**
  * @class Model
  * An MVC style model class that allows changes to be automatically
  * propagated to multiple listeners/subscribers/dependents. 
  */ 

// A typical model/view relationship is set up in the following manner:
//        panel.addMorph(m = newTextListPane(new Rectangle(200,0,200,150)));
//        m.connectModel({model: this, getList: "getMethodList", setSelection: "setMethodName"});
// The "plug" object passed to connectModel() points to the model, and converts from
// view-specific messages like getList() and setSelection() to model-specific messages
// like getMethodList() and setMethodName.  This allow a single model to have, eg,
// several list views, each viewing a different list aspect of the model.

// A number of morphs are used as views, or "widgets".  These include TextMorph,
// ListMorph, ButtonMorph, SliderMorph, etc.  Each of these morphs uses the above
// plug mechanism to get or set model values and to respond to model changes.
// these are documented in Morph.getModelValue, setModelValue, and updateView

Object.subclass('Model', {

    initialize: function(dep) { 
	// Broadcasts an update message to all dependents when a value changes.
	this.dependents = (dep != null) ? [dep] : [];
    },

    addDependent: function (dep) { 
	this.dependents.push(dep); 
    },

    removeDependent: function (dep) {
	var ix = this.dependents.indexOf(dep);
	if (ix < 0) return;
	this.dependents.splice(ix, 1); 
    },

    changed: function(varName, source) {
	// Broadcast the message "updateView" to all dependents
	// If source (a dependent) is given, we skip it (already updated)
	// If varName is not given, then null will be the aspect of the updateView()
	//console.log('changed ' + varName);
	for (var i = 0; i < this.dependents.length; i++) {
	    if (source !== this.dependents[i]) {
		// console.log('updating %s for name %s', this.dependents[i], varName);
		this.dependents[i].updateView(varName, source);
	    } 
	} 
    },

    toString: function() {
	return Strings.format("#<Model:%s>", this.dependents);
    },

    // test?
    copyFrom: function(copier, other) {
	this.dependents = [];
	other.dependents.forEach(function(dep) { this.dependents.push(copier.lookup(dep.id())) }, this);
    }

});

lively.data.Wrapper.subclass('ModelPlug', { // obsolete with CheapListMorph?
    documentation: "A 'translation' from view's variable names to model's variable names",

    initialize: function(spec) {
	var props = [];
	Properties.forEachOwn(spec, function(p) {
	    this[p] = spec[p];
	    props.push(p);
	}, this);
    },
    
    toString: function() {
	var pairs = [];
	Properties.forEachOwn(this, function(p, value) { if (p != 'model') pairs.push(p + ":" + value) });
	return "#<ModelPlug{" + pairs.join(',') + "}>";
    },

    serialize: function(modelId) {
	var rawNode = LivelyNS.create("modelPlug", {model: modelId});
	Properties.forEachOwn(this, function(prop, value) {
	    switch (prop) {
	    case 'model':
	    case 'rawNode':
		break;
	    default:
		rawNode.appendChild(LivelyNS.create("accessor", {formal: prop, actual: value}));
	    }
	}, this);
	return rawNode;
    },

    inspect: function() {
	return JSON.serialize(this);
    },

    deserialize: function(importer, rawNode) {
	for (var acc = rawNode.firstChild; acc != null;  acc = acc.nextSibling) {
	    if (acc.localName != 'accessor') continue;
	    this[LivelyNS.getAttribute(acc, "formal")] = LivelyNS.getAttribute(acc, "actual");
	}
    }
});


Model.subclass('SyntheticModel', {
    documentation: "A stereotyped model synthesized from a list of model variables",

    initialize: function($super, vars) {
	$super(null);
	if (!(vars instanceof Array)) 
	    throw new Error("wrong argument to SyntheticModel: " + vars);
	for (var i = 0; i < vars.length; i++) {
	    var v = vars[i];
	    if (v.startsWith('-') || v.startsWith('+')) 
		v = v.slice(1);
	    this.addVariable(v, null);
	}
    },

    makeGetter: function(name) {
	// functional programming is fun!
	
	return function() { 
	    return this[name]; 
	};
    },

    makeSetter: function(name) {
	return function(newValue, v) { 
	    this[name] = newValue; 
	    this.changed(this.getterName(name), v); 
	};
    },

    addVariable: function(varName, initialValue) {
	this[varName] = initialValue;
	this[this.getterName(varName)] = this.makeGetter(varName);
	this[this.setterName(varName)] = this.makeSetter(varName);
    },

    getterName: function(varName) {
	return "get" + varName;
    },

    get: function(varName) {
	var method = this[this.getterName(varName)];
	if (!method) throw new Error(this.getterName(varName) + " not present ");
	return method.call(this, varName);
    },

    setterName: function(varName) {
	return "set" + varName;
    },

    set: function(varName, value) {
	var method = this[this.setterName(varName)]
	if (!method) throw new Error(this.setterName(varName) + " not present");
	return method.call(this, varName, value);
    },

    makePlugSpecFromPins: function(pinList) {
	var spec = { model: this};
	pinList.forEach(function(decl) {
	    if (!decl.startsWith('-')) { // not read-only
		var stripped = decl.startsWith('+') ? decl.slice(1) : decl;
		spec[this.setterName(stripped)] = this.setterName(stripped);
	    }
	    if (!decl.startsWith('+')) { // not write-only
		var stripped = decl.startsWith('-') ? decl.slice(1) : decl;
		spec[this.getterName(stripped)] = this.getterName(stripped);
	    }
	}, this);
	return spec;
    },

    makePlugSpec: function() {
	// make a plug of the form {model: this, getVar1: "getVar1", setVar1: "setVar1" .. }
	var spec = {model: this};
	this.variables().forEach(function(v) { 
	    var name = this.getterName(v);
	    spec[name] = name;
	    name = this.setterName(v);
	    spec[name] = name;
	}, this);
	return spec;
    },

    variables: function() {
	return Properties.own(this).filter(function(name) { return name != 'dependents'});
    }
});


Morph.addMethods({

	exportLinkedFile: function(filename) {
		var url;
		if (Global["WikiNavigator"] && WikiNavigator.current) {
			var nav = WikiNavigator.current;
			url = WikiNavigator.fileNameToURL(filename);
			nav.interactiveSaveWorld(url);
		} else {
			url = WorldMorph.current().saveWorld(filename);
		}
		if (url) this.world().reactiveAddMorph(new ExternalLinkMorph(url));
		return url;
	}

});


// ===========================================================================
// World-related widgets
// ===========================================================================

// A unique characteristics of the Morphic graphics system is that
// all the objects (morphs) live in a "world" that is shared between 
// different objects and even between different users.  A world can
// contain a large number of different applications/widgets, much like
// in an operating system a folder can contain a lot of files.  Worlds
// can be linked to each other using LinkMorphs.  As a consequence,
// the entire system can contain a large number of worlds, each of
// which contains a large number of simultaneously running applications
// and widgets. 

Morph.subclass("PasteUpMorph", {

    documentation: "used for layout, most notably the world and, e.g., palettes",

    initialize: function($super, bounds, shapeType) {
        return $super(bounds, shapeType);
    },
    
	captureMouseEvent: function PasteUpMorph$captureMouseEvent($super, evt, hasFocus) {
		if (evt.type == "MouseDown" && this.onMouseDown(evt)) return;
		if (evt.type == "MouseWheel" && this.onMouseWheel(evt)) return;
		$super(evt, hasFocus); 
	},

	onMouseDown: function PasteUpMorph$onMouseDown($super, evt) {  //default behavior is to grab a submorph
		$super(evt);
		var m = this.morphToReceiveEvent(evt);
		if (false && m instanceof HandleMorph) { // Verify handles work with pie menus, then delete
			m.onMouseDown(evt);  // fixme
			return true;
		}
		if (Config.usePieMenus) {
			if (m.handlesMouseDown(evt)) return false;
			m.showPieMenu(evt, m);
			return true;
		}
		if (m == null) { 
			this.makeSelection(evt); 
			return true; 
		} else if (!evt.isCommandKey() && evt.isLeftMouseButtonDown()) {
			if (m === this.world()) { 
				this.makeSelection(evt); 
				return true; 
			} else if (m.handlesMouseDown(evt)) 
				return false;
		}
		evt.hand.grabMorph(m, evt);
		return true; 
	},


	bounds: function($super, ignoreTransients, ignoreTransform) {
		return $super(ignoreTransients, true);
	},
	
	onMouseWheel: function(evt) {
		if (!evt.isCommandKey()) return false;
		evt.preventDefault();

		var oldScale = this.getScale();
		var wheelDelta = evt.wheelDelta();
		var minScale = 0.1, maxScale = 50;
		if (oldScale < minScale && wheelDelta < 0) return false;
		if (oldScale > maxScale && wheelDelta > 0) return false;
		var scaleDelta = 1 + evt.wheelDelta() / 10000;
		this.scaleBy(scaleDelta);

		// actually this should be a layoutChanged but implementing
		// layoutChanged in WorldMorph is expensive since it is always called when a
		// submorph's layout is changed (owner chain propagation)
		this.resizeCanvasToFitWorld();
		
		// Zoom into/out of the current mouse position:
		// p is the current mouse position. If we wouldn't move the window the new mouse pos would be scaledP.
		// We calculate the vector from scaledP to p and scale that by the current scale factor
		// We end up with a vector that can be used to scroll the screen to zoom in/out
		var p = evt.point();
		var scaledP = p.scaleBy(1/scaleDelta);
		var translatedP = p.subPt(scaledP).scaleBy(this.getScale());
		window.scrollBy(translatedP.x, translatedP.y)

		return true
	},
	
    okToBeGrabbedBy: function(evt) {
        // Paste-ups, especially the world, cannot be grabbed normally
        return null; 
    },

	makeSelection: function(evt) {	//default behavior is to grab a submorph
		if (this.world().currentSelection != null) this.world().currentSelection.removeOnlyIt();
		
		var m = new SelectionMorph(evt.point().asRectangle());
		this.world().currentSelection = m;
		
		this.world().addMorph(m);
		var handle = new HandleMorph(pt(0,0), lively.scene.Rectangle, evt.hand, m, "bottomRight");
		handle.setExtent(pt(0, 0));
    handle.focusHaloBorderWidth = 0; // added by Adam; the halo looks weird
		handle.mode = 'reshape';
		m.addMorph(handle);
		evt.hand.setMouseFocus(handle);
		evt.hand.setKeyboardFocus(handle);
	},


    
});

(function initDisplayThemes() {
namespace('lively.Text');

if (!Global.DisplayThemes)
	Global.DisplayThemes = {};

DisplayThemes['lively'] = using(lively.paint).link({
	styleName: 'lively',
	raisedBorder: { // conenience grouping
		//borderWidth: 2,
		borderColor: {$:"LinearGradient", 
			stops: [{$:"Stop", offset: 0, color: Color.lightGray}, 
					{$:"Stop", offset: 1, color: Color.darkGray.darker(3)}],
			vector: lively.paint.LinearGradient.SouthEast
		}
	},
	titleBar: { 
		borderRadius: 8, 
		borderWidth: 2, 
		bordercolor: Color.black,
		fill: {$:"LinearGradient", 
			stops: [{$:"Stop", offset: 0.0, color: Color.primary.blue.lighter()},
					{$:"Stop", offset: 0.5, color: Color.primary.blue},
					{$:"Stop", offset: 1.0, color: Color.primary.blue.lighter(2)}], 
			vector: lively.paint.LinearGradient.SouthNorth 
		}
	},
	slider: { 
		borderColor: Color.black, 
		borderWidth: 1, 
		fill: {$: "LinearGradient", 
			stops: [{$:"Stop", offset: 0, color: Color.primary.blue.lighter(2)},
					{$:"Stop", offset: 1, color: Color.primary.blue}]
		}
	},
	button: { 
		borderColor: Color.neutral.gray, 
		borderWidth: 0.3, borderRadius: 4,
		fill: {$:"LinearGradient", 
			stops: [{$:"Stop", offset:0, color:Color.darkGray}, 
					{$:"Stop", offset:1, color: Color.darkGray.lighter(2)}],
			vector: lively.paint.LinearGradient.SouthNorth }
	},
	widgetPanel: { 
		borderColor: Color.blue, 
		borderWidth: 4, 
		borderRadius: 16,
		fill: Color.blue.lighter(), opacity: 0.4
	},
	clock: { 
		borderColor: Color.black, borderWidth: 4,
		fill: {$:"RadialGradient", 
			stops: [{$:"Stop", offset: 0, color:Color.primary.blue.lighter(2)}, 
					{$:"Stop", offset: 1, color:Color.primary.blue.lighter()} ]}
	},
	panel: {
		fill: Color.primary.blue.lighter(2), 
		borderWidth: 2, 
		borderColor: Color.black
	},
	link: {
		borderColor: Color.green, 
		borderWidth: 1, 
		fill: Color.blue
	},
	helpText: { 
		borderRadius: 15, 
		fill: Color.primary.yellow.lighter(3), 
		fillOpacity: .8
	},
	fabrik: {
		borderColor: Color.gray.darker(), 
		borderWidth: 1.0 , 
		borderRadius: 2,
		fill: Color.gray, 
		opacity: 1
	},
	world: {
		fill: {	$:"LinearGradient", 
			stops: [{$:"Stop", offset: 0.00, color: Color.primary.blue.lighter()},
					{$:"Stop", offset: 0.25, color: Color.primary.blue},
					{$:"Stop", offset: 0.50, color: Color.primary.blue.lighter()},
					{$:"Stop", offset: 0.75, color: Color.primary.blue},
					{$:"Stop", offset: 1.00, color: Color.primary.blue} ]}

	}
})

})() // initDisplayThemes


PasteUpMorph.subclass("WorldMorph", {
    
    documentation: "A Morphic world (a visual container of other morphs)",
    fill: Color.primary.blue,
    defaultExtent: pt(1280, 1024),
	styleClass: ['world'],
	
    // Default theme for the theme manager    

	initialize: function($super, canvas, backgroundImageId) {
		var bounds = Rectangle.fromElement(canvas);
		// sometimes bounds has zero dimensions (when reloading thes same page, timing issues?
		// in Firefox bounds may be 1x1 size?? maybe everything should be run from onload or sth?
		if (bounds.width < 2) {
			bounds.width = this.defaultExtent.x;
		}

		if (bounds.height < 2) {
			bounds.height = this.defaultExtent.y;
		}

		if (backgroundImageId) {
			var background = NodeFactory.create("use");
			XLinkNS.setHref(background, backgroundImageId);
			this.addNonMorph(background);
		}
		$super(new lively.scene.Rectangle(bounds));

		this.setDisplayTheme(this.displayTheme); // apply display theme

		//gradient.rawNode.setAttributeNS(null, "gradientTransform", "translate(0, -0.1) skewY(10)");		     
		this.enterCount = 0;
	},

	doNotSerialize: ['hands', 'scheduledActions', 'lastStepTime', 'mainLoop', 'worldId', 'secondTick', 'currentScript', 'currentSelection' ],

    initializeTransientState: function($super) {
        $super();
        this.hands = [];
		
		var theme = DisplayThemes[Config.defaultDisplayTheme];
		if (!theme)
			console.log('ERROR: could not find Theme ' + Config.defaultDisplayTheme)
		this.displayTheme = theme; // set display them without applying it
		
		this.withAllSubmorphsDo( function() { this.layoutChanged(); });  // Force installation of transforms

        this.scheduledActions = [];  // an array of schedulableActions to be evaluated
        this.lastStepTime = (new Date()).getTime();
        this.mainLoopFunc = this.doOneCycle.bind(this).logErrors('Main Loop');
        this.mainLoop = Global.setTimeout(this.mainLoopFunc, 30);
        this.worldId = ++WorldMorph.worldCount;

        return this;
    },

	collectAllUsedFills: function($super, usedFills) {
		usedFills = $super(usedFills);
		Properties.forEachOwn(this.displayTheme,  function(ea) {
			var style = this[ea]
			if (style && (style.fill  instanceof lively.paint.Gradient)) {
				usedFills.push(style.fill);
			} 
		}.bind(this.displayTheme))
		return usedFills
	},
    
	remove: function() {
		if (!this.rawNode.parentNode) return null;  // already removed
		this.stopStepping();
		this.removeRawNode();
		return this;
	},

	// called by insertMorph to determine the rawNode after the new inserted morph
	getInsertPositionFor: function(m, isFront) {
		if (this.submorphs.length == 0) return this.hands.length > 0 ? this.hands[0].rawNode : null;
		return isFront ? this.submorphs.last().rawNode.nextSibling : this.submorphs.first().rawNode;
	},
	
	toggleNativeCursor: function(flag) {
		this.canvas().setAttributeNS(null, "cursor", flag ? "auto" : "none");
	},

	resizeCanvasToFitWorld: function() {
		var canvas = this.canvas();
		if (!canvas) return;
		this.transformChanged();
		this.fullBounds = null;
		if (canvas.clientWidth != this.bounds().width)
			canvas.setAttribute("width", this.bounds().width + canvas.offsetLeft * this.getScale());
		if (canvas.clientHeight != this.bounds().height)
			canvas.setAttribute("height", this.bounds().height + canvas.offsetTop * this.getScale());
	},

	displayOnCanvas: function(canvas) {
		// this.remove();
		if (this.rawNode.parentNode !== canvas) canvas.appendChild(this.rawNode);
		var hand = this.addHand(new HandMorph(true));
		WorldMorph.currentWorld = this; // this conflicts with mutliple worlds
		reflect(WorldMorph).slotAt('currentWorld').beCreator(); // aaa - kind of a hack, added by Adam so that we can file out morphs
		if (Config.resizeScreenToWorldBounds)
			this.resizeCanvasToFitWorld(this);
		this.onEnter(); 

		this.enterCount ++;
	},

  // added by Adam
  ownerLocalize: function(pt) {
		if (pt == null) console.log('null pt in ownerLocalize');   
		return pt.matrixTransform(this.getTransform());
  },
    
	addHand: function(hand) {
		if (this.hands.length > 0 && !this.hands.first())
			this.hands.shift(); // FIXME: Quick bugfix. When deserializing the world the hands.first() is sometimes undefined
		this.hands.push(hand);
		hand.owner = this;
		hand.registerForEvents(this);
		hand.registerForEvents(hand);
		hand.layoutChanged();

		Event.keyboardEvents.forEach(function(each) {
			document.documentElement.addEventListener(each, hand, hand.handleOnCapture);
		});

		this.rawNode.appendChild(hand.rawNode);
		return hand;
	},
    
	removeHand: function(hand) {
		hand.setMouseFocus(null); // cleanup, just in case
		hand.setKeyboardFocus(null); // cleanup (calls blur(), which will remove the focus halo)
		hand.removeRawNode();
		hand.unregisterForEvents(this);
		hand.unregisterForEvents(hand);

		Event.keyboardEvents.forEach(function(each) {
			document.documentElement.removeEventListener(each, hand, hand.handleOnCapture);
		});

		this.hands.splice(this.hands.indexOf(hand), 1);
	},


    toggleBalloonHelp: function() {
        Morph.prototype.suppressBalloonHelp = !Morph.prototype.suppressBalloonHelp;
    },

    toggleDebugBackground: function() {
        // Debug background is transparent, so that we can see the console
        // if it is not otherwise visible
        Config.useDebugBackground = !Config.useDebugBackground;
        this.shape.setFillOpacity(Config.useDebugBackground ? 0.8 : 1.0);
    },

    chooseDisplayTheme: function(evt) { 
        var themes = DisplayThemes;
        var target = this; // trouble with function scope
        var themeNames = Properties.own(themes);
        var items = themeNames.map(
            function(each) { return [each, target, "setDisplayTheme", themes[each]]; });
        var menu = new MenuMorph(items, this);
        menu.openIn(this.world(), evt.point());
    },
    
    setDisplayTheme: function(styleDict) { 
        this.displayTheme = styleDict;
        this.withAllSubmorphsDo( function() { this.applyLinkedStyles(); });
    },
    
    restart: function() {
        window.location && window.location.reload();
    },

    
    layoutChanged: function() {
	// do nothing
    },

    layoutOnSubmorphLayout: function() {
	return false;
    },
    
    world: function() { 
        return this; 
    },
    
    validatedWorld: function() { 
        return this; 
    },
    
    firstHand: function() {
        return this.hands[0];
    },
    
    moveBy: function(delta) { // don't try to move the world
    },
    
    //  *** The new truth about ticking scripts ***
    //  A morph may have any number of active scripts
    //  Each is activated by a call such as
    //      this.startStepping(50, "rotateBy", 0.1);
    //  Note that stepTime is in milliseconds, as are all lower-level methods
    //  The arguments are: stepTime, scriptName, argIfAny
    //  This in turn will create a SchedulableAction of the form
    //  { actor: aMorph, scriptName: "rotateBy", argIfAny: 0.1, stepTime: 50, ticks: 0 }
    //  and this action will be both added to an array, activeScripts in the morph,
    //  and it will be added to the world's scheduledActions list, which is an array of
    //  tuples of the form [msTimeToRun, action]
    //  The ticks field is used to tally ticks spent in each schedulableAction --
    //  It is incremented on every execution, and it is multiplied by 0.9 every second
    //  Thus giving a crude 10-second average of milliseconds spent in this script
    //  every 10 seconds.  The result is divided by 10 in the printouts.
    //
    //  The message startSteppingScripts can be sent to morphs when they are placed in the world.
    //  It is intended that this may be overridden to start any required stepping.
    //  The message stopStepping will be sent when morphs are removed from the world.
    //  In this case the activeScripts array of the morph is used to determine exactly what
    //  scripts need to be unscheduled.  Note that startSteppingScripts is not sent
    //  automatically, whereas stopStepping is.  We know you won't forget to 
    //  turn your gadgets on, but we're more concerned to turn them off when you're done.

    scheduleForLater: function(action, delayInMs, removePrior) {
        if (removePrior) this.stopSteppingFor(action, true);  // unschedule earlier
        this.scheduleAction(new Date().getTime() + delayInMs, action);
    },
    
    startSteppingFor: function(action) {
        if (!action.scriptName)
	    throw new Error("old code");
        // New code for stepping schedulableActions
        this.stopSteppingFor(action, true);  // maybe replacing arg or stepTime
        this.scheduleAction(new Date().getTime(), action);
    },
    
    stopSteppingFor: function(action, fromStart) { // should be renamed to unschedule()
        // fromStart means it is just getting rid of a previous one if there,
	    // so not an error if not found

        if (this.currentScript === action) {
		    // Not in queue; just prevent it from being rescheduled
		    this.currentScript = null;
		    return;
		};

		this.scheduledActions = this.scheduledActions.reject(function(ea) {
			var eaAction = ea[1]
			return action.equalActorAndName(eaAction)
		})
    },

 	stopSteppingScriptNamedAndRemoveFromSubmorphs: function(sName) {
		if (!this.activeScripts) return;
		var all =this.activeScripts.select(function (ea) { return ea.scriptName == sName });
		all.invoke('stop', this.world());
		all.each(function(ea) {this.removeMorph(ea);}.bind(this));//remove
		this.activeScripts = this.activeScripts.select(function (ea) { return ea.scriptName !== sName });	
		if (this.activeScripts.length == 0) this.activeScripts = null;
    },
    
    validateScheduler: function() {
        // inspect an array of all the actions in the scheduler.  Note this
        // is not the same as scheduledActions which is an array of tuples with times
	var list = this.scheduledActions.clone();  // shorthand
        for (var i = 0; i < list.length; i++) {
            var actn = list[i][1];
            if (actn.actor instanceof Morph && actn.actor.validatedWorld() !== this) {
                this.stopSteppingFor(actn)
            }
        }
    },

    inspectScheduledActions: function() {
        // inspect an array of all the actions in the scheduler.  Note this
        // is not the same as scheduledActions which is an array of tuples with times
        new SimpleInspector(this.scheduledActions.map(function(each) { return each[1]; })).open();
    },

    doOneCycle: function WorldMorph$doOneCycle(world) {
        // Process scheduled scripts

        // Run through the scheduledActions queue, executing those whose time has come
        // and rescheduling those that have a repeatRate
        // Note that actions with error will not get rescheduled
        // (and, unless we take the time to catch here, will cause all later 
        // ones in the queue to miss this tick.  Better less overhead, I say
        // DI: **NOTE** this needs to be reviewed for msClock rollover
        // -- also note we need more time info for multi-day alarm range
        // When we do this, I suggest that actions carry a date and msTime
        // and until their day is come, they carry a msTime > a day
        // That way they won't interfere with daily scheduling, but they can
        // still be dealt with on world changes, day changes, save and load.
	var msTime = new Date().getTime();
	var timeOfNextStep = Infinity;
        var list = this.scheduledActions;  // shorthand
        var timeStarted = msTime;  // for tallying script overheads
	while (list.length > 0 && list[list.length - 1][0] <= msTime) {
            var schedNode = list.pop();  // [time, action] -- now removed
            var action = schedNode[1];
            this.currentScript = action; // so visible from stopStepping
            lively.lang.Execution.resetDebuggingStack();  // Reset at each tick event
	    try {
                action.exec();
            } catch (er) {
                console.warn("error on actor %s: %s", action.actor, er);
                dbgOn(true);
                lively.lang.Execution.showStack();
		timeStarted = new Date().getTime();
		continue;
            }
            // Note: if error in script above, it won't get rescheduled below (this is good)
	    
            // Note: stopStepping may set currentScript to null so it won't get rescheduled
            if (this.currentScript && action.stepTime > 0) {
                var nextTime = msTime + action.stepTime;
                this.scheduleAction(nextTime, action)
            }
            this.currentScript = null;

            var timeNow = new Date().getTime();
            var ticks = timeNow - timeStarted;
            if (ticks > 0) action.ticks += ticks;  // tally time spent in that script
            timeStarted = timeNow;
        }
	//  Generate a mouseMove if any ticking scripts have run so that
	//  simulations can respond where, eg, a morph moves under the mouse
	//  DI:  This is *only* needed for the slide-keyboard-under-mouse demo (very cool)
	//	Uses extra cycles, though, and currently fails in Opera
	if(Config.nullMoveAfterTicks) { // set this true in localConfig for the demo
		var myHand = this.firstHand();
		if (myHand) myHand.makeANullMove();
	}
        if (list.length > 0) timeOfNextStep = Math.min(list[list.length-1][0], timeOfNextStep);

        // Each second, run through the tick tallies and mult by 0.9 to 10-sec "average"
        if (!this.secondTick) this.secondTick = 0;
        var secondsNow = Math.floor(msTime / 1000);
        if (this.secondTick != secondsNow) {
            this.secondTick = secondsNow;
            var tallies = {};
            for (var i=0; i<list.length; i++) {
                var action = list[i][1];
                tallies[action.scriptName] = action.ticks;
                action.ticks *= 0.9 // 10-sec decaying moving window
            }
            if (Config.showSchedulerStats && secondsNow % 10 == 0) {
                console.log('New Scheduler length = ' + this.scheduledActions.length);
                console.log('Script timings...');  // approx ms per second per script
                for (var p in tallies) console.log(p + ': ' + (tallies[p]/10).toString());
            }
        }
        this.lastStepTime = msTime;
        this.setNextStepTime(timeOfNextStep);
    },

    setNextStepTime: function(timeOfNextStep) {
        if (timeOfNextStep == Infinity) { // didn't find anything to cycle through
            this.mainLoop = null; 
        } else {
            this.mainLoop = Global.setTimeout(this.mainLoopFunc, timeOfNextStep - this.lastStepTime);
        }
    },

    kickstartMainLoop: function() {
        // kickstart the timer (note arbitrary delay)
        this.mainLoop = Global.setTimeout(this.mainLoopFunc, 10);
    },

    scheduleAction: function(msTime, action) { 
        // Insert a SchedulableAction into the scheduledActions queue

        var list = this.scheduledActions;  // shorthand
        for (var i=list.length-1; i>=0; i--) {
            var schedNode = list[i];
            if (schedNode[0] > msTime) {
                list.splice(i+1, 0, [msTime, action]);
                if (!this.mainLoop) this.kickstartMainLoop();
                return; 
            }
        }
        list.splice(0, 0, [msTime, action]);
        if (!this.mainLoop) this.kickstartMainLoop();
    },

    onEnter: function() {},
    onExit: function() {},

    /**
     * override b/c of parent treatement
     */
    relativize: function(pt) { 
        return pt;
        //return pt.matrixTransform(this.rawNode.parentNode.getTransformToElement(this.rawNode)); 
    },
    
	openURLasText: function(url, title) {
		// FIXME: This should be moved with other handy services like confirm, notify, etc		
		var pane = this.addTextWindow({content: "fetching ... ", title: title});
		var r = new WebResource(url);
		lively.bindings.connect(r, 'content', pane.innerMorph(), 'setTextString');
		r.beAsync().get();
		
	},

	viewport: function() {
		try {
			return Rectangle.ensure(this.canvas().viewport);
			} catch (er) { // FF doesn't implement viewport ?
			return this.shape.bounds();
		}
	},

	alert: function(varargs) {
		var message = Strings.formatFromArray($A(arguments));
		var openDialog = function() {
			alert(message)
		};
		this.setStatusMessage(message, Color.red, undefined, openDialog, undefined, "alert: ")
	}.logErrors('alert'),

	prompt: function(message, callback, defaultInput) {
    // aaa: LK's prompt dialog thing seems (as of Feb. 2009) to be broken.
    // I doubt it's hard to fix, but for now I don't wanna get distracted by it. -- Adam
    callback.call(window, prompt(message, defaultInput));
    return;

		var model = Record.newPlainInstance({Message: message, Input: defaultInput || "", Result: null});
		model.addObserver({ 
			onResultUpdate: function(value) { 
				if (value == true && callback) callback.call(Global, model.getInput());
			}
		});
		var dialog = new PromptDialog(model.newRelay({Message: "-Message", Result: "+Result", Input: "Input"}));
		var window = dialog.openIn(this, pt(0,0));
		window.setPosition(this.positionForNewMorph(window));
	},

    editPrompt: function(message, callback, defaultInput) {
		var dialog = new PromptDialogMorph();
		dialog.title = message;
		dialog.setText(defaultInput);
		dialog.callback = callback;
		dialog.openIn(this, this.positionForNewMorph(dialog));
    },

	confirm: function(message, callback) {
		var model = Record.newPlainInstance({Message: message, Result: null});
		model.addObserver({ 
			onResultUpdate: function(value) { 
				if (value && callback) callback.call(Global, value);
			}});
		var dialog = new ConfirmDialog(model.newRelay({Message: "-Message", Result: "+Result"}));
		var window = dialog.openIn(this, pt(0,0));
		window.setPosition(this.positionForNewMorph(window));
		return dialog;
	},
    
	addFramedMorph: function(morph, title, optLoc, optSuppressControls) {
		var displ = pt(5, 5);
		return this.addMorphAt(
			new WindowMorph(morph, title, optSuppressControls), 
			optLoc || this.positionForNewMorph(morph).subPt(displ));
	},

	addTextWindow: function(spec) {
		// FIXME: typecheck the spec 
		if (Object.isString(spec.valueOf())) spec = {content: spec}; // convenience
		var extent = spec.extent || pt(500, 200);
		var pane = this.internalAddWindow(
				newTextPane(extent.extentAsRectangle(), spec.content || ""),
				spec.title, spec.position);
		if (spec.acceptInput !== undefined) pane.innerMorph().acceptInput = spec.acceptInput;
		if (spec.plug) pane.connectModel(spec.plug, true);
		return pane;
	},

	addTextListWindow: function(spec) {
		// FIXME: typecheck the spec 
		if (spec instanceof Array) spec = {content: spec }; // convenience
		var content = spec.content;
		if (!content) content = "";
		if (!(content instanceof Array)) content = [content];
		var extent = spec.extent || pt(500, Math.min(300, content.length * TextMorph.prototype.fontSize * 1.5));
		var rec = extent.extentAsRectangle();
		var pane = this.internalAddWindow(newTextListPane(rec, content), spec.title, spec.position);
		if (spec.plug) pane.connectModel(spec.plug, true);
		return pane;
	},

	internalAddWindow: function(pane, titleSpec, posSpec) {
		var pos = (posSpec instanceof Point) ? posSpec : undefined;
		pane.setBorderWidth(2);  pane.setBorderColor(Color.black);
		var win = this.addFramedMorph(pane, String(titleSpec || ""), pos || this.firstHand().position().subPt(pt(5, 5)));
		if (posSpec == "center") {
			win.align(win.bounds().center(), this.viewport().center());
		}
		return pane;
	},


	addMorphFrontOrBack: function($super, m, front) {
		var oldTop = this.topWindow();
		var result = $super(m, front);
		if (!front || !(m instanceof WindowMorph)) return result;
		// if adding a new window on top, then make it active
		if (oldTop) oldTop.titleBar.highlight(false);
		m.takeHighlight();
		return result;
	},

	topWindow: function() {
		for (var i= this.submorphs.length - 1; i >= 0; i--) {
			var sub = this.submorphs[i];
			if (sub instanceof WindowMorph) return sub;
		}
		return null;
	},

	positionForNewMorph: function(newMorph, relatedMorph) {
		// this should be much smarter than the following:
		if (relatedMorph)
			return relatedMorph.bounds().topLeft().addPt(pt(5, 0));
		var pos = this.firstHand().getPosition();
		if (!newMorph) return pos;
		var viewRect = this.windowBounds();
		var newMorphBounds = pos.extent(newMorph.getExtent());
		if (viewRect.containsRect(newMorphBounds)) return pos;
		return viewRect.center().subPt(newMorphBounds.extent().scaleBy(0.5));
	},

	reactiveAddMorph: function(morph, relatedMorph) { 	// add morph in response to a user action, make it prominent
		return this.addMorphAt(morph, this.positionForNewMorph(morph, relatedMorph));
	},
    
    resizeByUser: function() {
      var world = this;
      var cb = function(newSizePtLiteral) {
    	  try {
    	    var newPoint = eval(newSizePtLiteral);
    	    basicResize(world, world.canvas(), newPoint.x, newPoint.y);
        } catch(e) {
    	    world.alert('Wrong input ' +  newSizePtLiteral);
  		  }
    	};
    	world.prompt('Enter extent', cb, world.bounds().bottomRight().toString());
    },

	addProgressBar: function(optPt) {
		var center = optPt || this.windowBounds().center()
		var progressBar = new ProgressBarMorph(new Rectangle(0,0, 450, 30))
		this.addMorph(progressBar);
		progressBar.align(progressBar.bounds().center(), center);
		progressBar.ignoreEvents();
		return progressBar
	},

});

// Give Feedback on Saving
WorldMorph.addMethods({

	promptAndSaveWorld: function() {
		this.prompt("world file (.xhtml)", function(filename) {
			var start = new Date().getTime();	
			this.exportLinkedFile(filename);
			var time = new Date().getTime() - start;
			this.setStatusMessage("world save as " + filename + " in " + time + "ms", Color.green, 3)	
		}.bind(this)); 
	},

	saveWorld: function(optURL) {
		optURL = optURL || URL.source.filename()
		var start = new Date().getTime();
		this.removeHand(this.firstHand());
		var url = Exporter.saveDocumentToFile(Exporter.shrinkWrapMorph(this.world()), optURL);
		this.addHand(new HandMorph(true));
		var time = new Date().getTime() - start;
		this.setStatusMessage("world saved to " + optURL + " in " + time + "ms", Color.green, 3)
		return url;
	},
	
	windowBounds: function() {
		var topLeft = pt(Global.pageXOffset, Global.pageYOffset);
		var width = Math.min(
			Global.document.documentElement.clientWidth * 1/this.world().getScale(),
			WorldMorph.current().getExtent().x);
		var height = Math.min(
			Global.document.documentElement.clientHeight * 1/this.world().getScale(),
			WorldMorph.current().getExtent().y)
		return topLeft.extent(pt(width, height))
	},
	
	visibleBounds: function() {
		var windowBounds = this.windowBounds();
		var worldBounds = this.shape.bounds(); // use shape so no stick-outs are included
		var upperLeft = pt(Math.max(windowBounds.x, worldBounds.x), Math.max(windowBounds.y, worldBounds.y));
		var lowerRight = pt(Math.min(windowBounds.width, worldBounds.width), Math.min(windowBounds.height, worldBounds.height));
		return upperLeft.extent(lowerRight);
	},

	setStatusMessage: function(msg, color, delay, callback, optStyle, messageKind) {
		if (!this._statusMorphContainer) {
			this._statusMorphContainer = new StatusMessageContainer();
			this.addMorph(this._statusMorphContainer);
			this._statusMorphContainer.startUpdate();		
		};
		var container = this._statusMorphContainer;
		container.align(container.bounds().topRight(), this.visibleBounds().topRight());
		container.name = "statusMorphContainer";
		container.bringToFront();
		container.addStatusMessage(msg, color, delay, callback, optStyle, messageKind);
	},	
});

/**
 *	WorldMorph Menu 
 *
 *  Question: Should features register itself in the menu, 
 *  or should the menu give an overview of available features 
 *  and load the modules on demand?
 */
WorldMorph.addMethods({
	morphMenu: function($super, evt) { 
		var menu = $super(evt);
		menu.keepOnlyItemsNamed(["inspect", "edit style"]);
		menu.addItems([['reset scale', function(evt) { var w = evt.hand.world(); w.setScale(1); w.resizeCanvasToFitWorld() }]]);

    // This world-navigation feature is usually very annoying, though occasionally very useful.
    // Keep it off by default until we find a non-annoying UI for it. -- Adam
    var navOn = this.shouldSlideIfClickedAtEdge;
    menu.addItem(["turn " + (navOn ? 'off' : 'on') + " world navigation", function(evt) {
      this.shouldSlideIfClickedAtEdge = !navOn;
    }.bind(this)]);
		
		menu.addLine();
		menu.addItems(this.subMenuItems(evt));
		menu.addLine();
		menu.addItems([
			["New subworld (LinkMorph)", function(evt) { evt.hand.world().addMorph(new LinkMorph(null, evt.point()));}],  
			["External link", function(evt) { evt.hand.world().addMorph(new ExternalLinkMorph(URL.source, evt.point()));}],
			["authenticate for write access", function() {
				new NetRequest().put(URL.source.withFilename('auth'));
				// sometimes the wikiBtn seems to break after an authenticate
				if (Config.showWikiNavigator) WikiNavigator.enableWikiNavigator(true); }],
			["publish world as ... ", function() { this.promptAndSaveWorld()}]
		]);
		if (Global.URL && (URL.source.filename() != "index.xhtml") ) { // Global. avoids an error if Network.js not loaded
			// save but only if it's not the startup world
			menu.addItem(["save current world to current URL", function() { 
				menu.remove(); 
				this.saveWorld();
			}]);
		}
		if(Config.debugExtras) {
			menu.addItem(["arm profile for next mouseDown", function() {evt.hand.armProfileFor("MouseDown") }]);
			menu.addItem(["arm profile for next mouseUp", function() {evt.hand.armProfileFor("MouseUp") }]);
		}
		menu.addItem(["resize world", this.resizeByUser]);
		menu.addItem(["restart system", this.restart]);
		return menu;
	},
	
	simpleMorphsSubMenuItems: function(evt) {
		var world = this.world();
		return [
			["Line", function(evt) { 
				var p = evt.point(); 
				var m = Morph.makeLine([p, p.addXY(60, 30)], 2, Color.black);
				world.addMorph(m);
				m.setPosition(evt.point())}],
			["Connector", function(evt) { 
				require('lively.Connector').toRun(function() {
					var m = Morph.makeConnector(evt.point())
					world.addMorph(m);
					m.setGlobalEndPos(evt.point().addXY(60, 30))
				})}],
			["Rectangle", function(evt) { world.addMorph(Morph.makeRectangle(evt.point(), pt(60, 30)));}],
			["Ellipse", function(evt) { world.addMorph(Morph.makeCircle(evt.point(), 25)); }],
			["TextMorph", function(evt) { 
				var text = new TextMorph(evt.point().extent(pt(120, 10)), "This is a TextMorph");
				world.addMorph(text);}],
			["Star",function(evt) { world.addMorph(Morph.makeStar(evt.point()))}],
			["Heart", function(evt) { world.addMorph(Morph.makeHeart(evt.point()))}],
			["Marker", function(evt) {world.addMorph(new MarkerMorph(evt.point().extent(pt(100, 100))))}]
		];
	},

	complexMorphsSubMenuItems: function(evt) {
		var world = this.world();
		return [
			["SliderMorph", function(evt) { world.addMorph(Widget.makeSlider(evt.point().extent(pt(120, 40))))}],
			["ButtonMorph", function(evt) { world.addMorph(new ScriptableButtonMorph(evt.point().extent(pt(70, 30))))}],
			["ProgressBarMorph", function(evt) { world.addMorph(new ProgressBarMorph(evt.point().extent(pt(70, 30))))}],
			["ScaleMorph", function(evt) { world.addMorph(new ScaleMorph(evt.point().extent(pt(70, 30))))}],
			["Clock", function(evt) {
				require('lively.Examples').toRun(function() {
					var m = world.addMorph(new ClockMorph(evt.point(), 50));
					m.startSteppingScripts();
					ChangeSet.current().addWorldRequirement('lively.Examples')
				})}],
			["FabrikClock", function(evt) {
				require('lively.Fabrik').toRun(function() {
					var clock = new FabrikClockWidget();
					var morph = clock.buildView();
					world.addMorph(morph);
					morph.setPosition(evt.point());
					morph.startSteppingScripts(); }); }],
			["Text Window", function(evt) { 
				WorldMorph.current().addTextWindow("Editable text"); }],
			["Piano Keyboard", function(evt) {
				require('lively.Examples').toRun(function() {
					var m = new PianoKeyboard(evt.point());
					m.scaleBy(1.5);	 m.rotateBy(-Math.PI*2/12);
					world.addMorph(m); }); }],
			["Kaleidoscope", function(evt) {
				require('lively.Examples').toRun(function() {
					var kal = WorldMorph.current().addMorph(new SymmetryMorph(300, 7)); 
					kal.startUp(); }) } ],
			["Image Morph", function(evt) {
				world.prompt('Enter image URL', function(urlString) {
					var img = new ImageMorph(evt.point().extent(pt(100,100)), urlString);
					img.openInWorld() }) }],
			["Video Morph", function(evt) {
				VideoMorph.openAndInteractivelyEmbed(evt.point()) }],
			["Layout Demo", function(evt) {
				require('lively.GridLayout').toRun(function() {
					GridLayoutMorph.demo(evt.hand.world(), evt.point()); }); }],
			["Effects demo (FF only)", function(evt) { require('lively.demofx').toRun(Functions.Empty); }],
			["PresentationPage", function(evt) { 
				require('lively.Presentation').toRun(function(){
					world.addMorph(new lively.Presentation.PageMorph(new Rectangle(0,0,800,600)))
				}); 
			}],
			// ["Duplicator Panel", function(evt) { 
			// 	require('lively.Graffle').toRun(function(){
			// 		world.addMorph(Morph.makeDefaultDuplicatorPanel(evt.point()))
			// 	}); 
			// }], 
			["FileUpload Morph", function(evt) { 
				require('lively.FileUploadWidget').toRun(function(){
					var morph = new FileUploadMorph();
					world.addMorph(morph)
					morph.setPosition(evt.point());
				}); 
			}],
		];
	},
	
	toolSubMenuItems: function(evt) {
		var world = this.world();
		var toolMenuItems = [
//			["Class Browser", function(evt) { new SimpleBrowser().openIn(world, evt.point()); }],
			["System code browser", function(evt) { require('lively.ide').toRun(function(unused, ide) {new ide.SystemBrowser().openIn(world)})}],
			["Local code Browser", function(evt) { require('lively.ide').toRun(function(unused, ide) {new ide.LocalCodeBrowser().openIn(world)})}],
			["Wiki code Browser", function(evt) { require('lively.ide', 'lively.LKWiki').toRun(function(unused, ide) {
				var cb = function(input) {
					var repo = new URL(input);
					new ide.WikiCodeBrowser(repo).open()
				};
				world.prompt('Wiki base URL?', cb, URL.source.getDirectory().toString());
				})}],
			["Switch System browser directory...", function(evt) { require('lively.ide').toRun(function(unused, ide) {
				var cb = function(input) {
					if (!input.endsWith('/')) input += '/';
					ide.startSourceControl().switchCodeBase(new URL(input));
				};
				world.prompt('Enter System browser directory (URL)', cb, URL.source.getDirectory().toString());
				})}],				
			["File Browser", function(evt) { new FileBrowser().openIn(world) }],
			["Object Hierarchy Browser", function(evt) { new ObjectBrowser().openIn(world); }],	
			["Enable profiling", function() {
					Config.debugExtras = true;
					lively.lang.Execution.installStackTracers(); }],
			["Console", function(evt) {world.addFramedMorph(new ConsoleWidget(50).buildView(pt(800, 100)), "Console"); }],
			["TestRunner", function(evt) { require('lively.TestFramework').toRun(function() { new TestRunner().openIn(world) }) }],
			["OMetaWorkspace", function(evt) { require('lively.Ometa').toRun(function() { new OmetaWorkspace().openIn(world); }) }],
			["Call Stack Viewer", function(evt) { 
			if (Config.debugExtras) lively.lang.Execution.showStack("use viewer");
			else new StackViewer(this).openIn(world); }],	  
			["FrameRateMorph", function(evt) {
				var m = world.addMorph(new FrameRateMorph(evt.point().extent(pt(160, 10)), "FrameRateMorph"));
				m.startSteppingScripts(); }],
			["EllipseMaker", function(evt) {
				var m = world.addMorph(new EllipseMakerMorph(evt.point()));
				m.startSteppingScripts(); }],
			["XHTML Browser", function(evt) { 
				var xeno = new XenoBrowserWidget('sample.xhtml');
				xeno.openIn(world); }],
			["Viewer for latest file changes", function(evt) {
			var cb = function(input) {
				require('lively.LKWiki').toRun(function(u,m) {
					var url = new URL(input);
					console.log(url);
					new LatestWikiChangesList(url).openIn(world);
			}); }
				world.prompt('Url to observe', cb, URL.source.getDirectory().toString()); 
			}]
		];

		if (Config.debugExtras) { var index = -1;
			for (var i=0; i<toolMenuItems.length; i++) if (toolMenuItems[i][0] == "Enable profiling") index = i;
				if (index >= 0) 
					toolMenuItems.splice(index, 1,
						["-----"],
						["Profiling help", function(evt) { this.openURLasText( URL.common.project.withRelativePath(
							"/trac/wiki/ProfilingHelp?format=txt"), "Profiling help"); }],
						["Arm profile for next mouseDown", function() {evt.hand.armProfileFor("MouseDown") }],
						["Arm profile for next mouseUp", function() {evt.hand.armProfileFor("MouseUp") }],
						["Disable profiling", function() {
							Config.debugExtras = false;
							lively.lang.Execution.installStackTracers("uninstall");	 }],
						["-----"]);
		};
		return toolMenuItems
	},

	scriptingSubMenuItems: function(evt) {
		var world = this.world();
		return [
			["TileScriptingBox", function(evt) { require('lively.TileScripting').toRun(function() {new lively.TileScripting.TileBox().openIn(world); }) }],
			["Fabrik Component Box", function(evt) { require('lively.Fabrik').toRun(function() { Fabrik.openComponentBox(world); }) }],
			["Webcards with name", function(evt) { require('apps.Webcards').toRun(function(){
					var sds = new SimpleDataStore(pt(600, 300));
					world.prompt("Name of stack:", sds.openStackWithName.bind(sds));
					world.addFramedMorph(sds, 'WebCards', pt(333, 222));
				}); 
			}],
         
		];
	},

	preferencesSubMenuItems: function(evt) {
		var world = this.world();
		return [
			[(Config.usePieMenus ? "don't " : "") + "use pie menus",
					  function() { Config.usePieMenus = !Config.usePieMenus; }],
			["choose display theme...", this.chooseDisplayTheme],
			[(Morph.prototype.suppressBalloonHelp ? "enable balloon help" : "disable balloon help"),
					  this.toggleBalloonHelp],
			[(HandMorph.prototype.useShadowMorphs ? "don't " : "") + "show drop shadows",
			  function () { HandMorph.prototype.useShadowMorphs = !HandMorph.prototype.useShadowMorphs}],
			[(Config.showGrabHalo ? "don't " : "") + "show bounds halos",
			  function () { Config.showGrabHalo = !Config.showGrabHalo}],
			[HandMorph.prototype.applyDropShadowFilter ? "don't use filter shadows" : "use filter shadows (if supported)",
			  function () { HandMorph.prototype.applyDropShadowFilter = !HandMorph.prototype.applyDropShadowFilter}],
			[(Config.useDebugBackground ? "use normal background" : "use debug background"),
					  this.toggleDebugBackground]
		];
	},

	helpSubMenuItems: function(evt) {
		var world = this.world();
		return	[
			["Connect documentation", function(evt) {
				require('lively.bindings').toRun(function() {
					world.openURLasText(new URL("http://lively-kernel.org/trac/wiki/ConnectHelp?format=txt"), "Connect documentation");
				})
			}],
			["Command key help", function(evt) {
				this.openURLasText(new URL("http://lively-kernel.org/trac/wiki/CommandKeyHelp?format=txt"), "Command key help"); }]
		];
	},
	
	subMenuItems: function(evt) {
		//console.log("mouse point == %s", evt.mousePoint);
		return [
			['Simple morphs', this.simpleMorphsSubMenuItems(evt)],
			['Complex morphs', this.complexMorphsSubMenuItems(evt)],
			['Tools', this.toolSubMenuItems(evt)],
			['Scripting', this.scriptingSubMenuItems(evt)],
			['Preferences', this.preferencesSubMenuItems(evt)],
			['Help', this.helpSubMenuItems(evt)]];
	},
	
	showPieMenu: function(evt) {
		var beTouchFn;
		if (UserAgent.isTouch) {
			if (Config.touchBeMouse) {
				// If we were in mouse mode; switch back to touch
				beTouchFn = function(e) {
					//ClipboardHack.ensurePasteBuffer().blur();
					Config.touchBeMouse = false; // currently not used
					// evt.hand.lookTouchy()
				};
			} else {
				// Otherwise, switch to mouse mode now (we just clicked in world)
				// ClipboardHack.ensurePasteBuffer().focus();
				Config.touchBeMouse = true; // currently not used
				// evt.hand.lookNormal()
				return;
			}
		}
		var menu, targetMorph = this;
		var items = [
			['make selection ([NE])', function(evt) { targetMorph.makeSelection(evt); }],
			['make selection ([SE])', function(evt) { targetMorph.makeSelection(evt); }],
			['make selection ([SW])', function(evt) { targetMorph.makeSelection(evt); }],
			((UserAgent.isTouch) ? ['use touch ((O))', beTouchFn]
				: ['make selection ([NW])', function(evt) { targetMorph.makeSelection(evt); }])
			];
		menu = new PieMenuMorph(items, this, 0, beTouchFn);
		menu.open(evt);
	}
 
})

Object.extend(WorldMorph, {    
    worldCount: 0,
    
    currentWorld: null,
    
    current: function() {
        return WorldMorph.currentWorld;
    }

    
});



/**
 * @class HandMorph
 * Since there may be multiple users manipulating a Morphic world
 * simultaneously, we do not want to use the default system cursor.   
 */ 

Morph.subclass("HandMorph", {
    
    documentation: "Defines a visual representation for the user's cursor.",
    applyDropShadowFilter: !!Config.useDropShadow,
    dropShadowFilter: "url(#DropShadowFilter)",
    useShadowMorphs: Config.useShadowMorphs,

    shadowOffset: pt(5,5),
    handleOnCapture: true,
    logDnD: Config.logDnD,
    grabHaloLabelStyle: {fontSize: Math.floor((Config.defaultFontSize || 12) *0.85), padding: Rectangle.inset(0)},

    initialize: function($super, local) {
        $super(new lively.scene.Polygon([pt(0,0), pt(10, 8), pt(4,9), pt(8,16), pt(4,9), pt(0, 12)]));
		this.applyStyle({fill: local ? Color.primary.blue : Color.primary.red, borderColor: Color.black, borderWidth: 1});
	
        this.isLocal = local;

        this.keyboardFocus = null;
        this.mouseFocus = null;
		this.mouseFocusChanges_ = 0; // count mouse focus changes until reset
        this.mouseOverMorph = null;
        this.lastMouseEvent = null;
        this.lastMouseDownPoint = pt(0,0);
        this.lastMouseDownEvent = null;
        this.hasMovedSignificantly = false;
        this.grabInfo = null;
        
        this.mouseButtonPressed = false;

        this.keyboardFocus = null; 

        this.priorPoint = null;
        this.owner = null;
		this.boundMorph = null; // surrounds bounds
		this.layoutChangedCount = 0; // to prevent recursion on layoutChanged
		
		this.setTrait("pointer-events", "none"); // added by Adam, needed to make HTML links clickable in XenoMorphs, hope it doesn't screw anything else up
		
		// added by Adam - I don't like seeing the hand morph, especially on a touch device
		this.setFill(null);
		this.setBorderWidth(0);
		this.setBorderColor(null);
		
        return this;
    },

  isHand: true, // added by Adam
  
	id: function() {
		if (!this.rawNode) {
			return undefined
		}
		return this.rawNode.getAttribute("id");
	},

    lookNormal: function(morph) {
        this.shape.setVertices([pt(0,0), pt(10, 8), pt(4,9), pt(8,16), pt(4,9), pt(0, 12)]);
    },
lookTouchy: function(morph) {
	// Make the cursor look polygonal to indicate touch events go to pan/zoom
	var n = 5, r = 10, theta = 2*Math.PI/n;
	var verts = [0, 1, 2, 3, 4, 0].map(function(i) { return Point.polar(r, i*theta).addXY(20,0) });
	this.shape.setVertices(verts);
    },


    lookLinky: function(morph) {
        this.shape.setVertices([pt(0,0), pt(18,10), pt(10,18), pt(0,0)]);
    },

	lookLikeAnUpDownArrow: function() {
		//       /\
		//     /_ _\
		//     _||_
		//    \   /
		//     \/
		var verts = [
			pt(8.0,0.0), pt(16.0,8.0), pt(12.0,8.0), pt(12.0,16.0), pt(16.0,16.0),
			pt(8.0,24.0), pt(0.0,16.0), pt(4.0,16.0), pt(4.0,8.0), pt(0.0,8.0)
		];
		this.shape.setVertices(verts);
	},

    registerForEvents: function(morph) {
        Event.basicInputEvents.forEach(function(name) { 
            morph.rawNode.addEventListener(name, this, this.handleOnCapture);}, this);
    },
    
    unregisterForEvents: function(morph) {
        Event.basicInputEvents.forEach(function(name) { 
            morph.rawNode.removeEventListener(name, this, this.handleOnCapture);}, this);
    },
    
    resetMouseFocusChanges: function() {
		var result = this.mouseFocusChanges_;
		this.mouseFocusChanges_ = 0;
		return result;
    },

    // added by Adam
    getMouseFocus:    function() { return this.mouseFocus    || null; },
    getKeyboardFocus: function() { return this.keyboardFocus || null; },
    
    setMouseFocus: function(morphOrNull) {
        //console.log('setMouseFocus: ' + morphOrNull);
		this.mouseFocus = morphOrNull;
		// this.setFill(this.mouseFocus ? Color.primary.blue.lighter(2) : Color.primary.blue);
		this.mouseFocusChanges_ ++;
    },
    
    setKeyboardFocus: function(morphOrNull) {
        if (this.keyboardFocus === morphOrNull) return;

        if (this.keyboardFocus != null) {
            // console.log('blur %s', this.keyboardFocus);
            this.keyboardFocus.onBlur(this);
            this.keyboardFocus.setHasKeyboardFocus(false);
        }
        
        this.keyboardFocus = morphOrNull; 
        
        if (this.keyboardFocus) {
            this.keyboardFocus.onFocus(this);
        }
    },
    
    world: function() {
        return this.owner;
    },

	// this is the DOM Event callback
	handleEvent: function HandMorph$handleEvent(rawEvt) {
		var evt = new Event(rawEvt);
		evt.hand = this;
		// console.log("event type = " + rawEvt.type);

		lively.lang.Execution.resetDebuggingStack();
		switch (evt.type) {
			case "MouseWheel":
			case "MouseMove":
			case "MouseDown":
			case "MouseUp":
				this.handleMouseEvent(evt);
				break;
			// touch and gesture stuff added by Adam
			case "TouchStart":
			case "TouchMove":
			case "TouchEnd":
			case "TouchCancel":
				this.handleTouchEvent(evt);
				break;
			case "GestureStart":
			case "GestureChange":
			case "GestureEnd":
				this.handleGestureEvent(evt);
				break;
			case "KeyDown":
			case "KeyPress": 
			case "KeyUp":
				this.handleKeyboardEvent(evt);
				break;
			default:
				console.log("unknown event type " + evt.type);
		}
		evt.stopPropagation();
		return;
		//return evt; // for touch development FIXME remove
	}.logErrors('Event Handler'),

    armProfileFor: function(evtType) { 
		this.profileArmed = evtType;  // either "MouseDown" or "MouseUp"
    },

	makeANullMove: function() {
		// Process a null mouseMove event -- no change in x, y
		// Allows simulations to respond where, eg, a morph moves under the mouse
		// Note: Fabrik generates also Mouse events with newFakeMouseEvent; to be merged
		var last = this.lastMouseEvent;
		if (!last) return;
		var nullMove = new Event(last.rawEvent);
		nullMove.type = "MouseMove";
		nullMove.hand = this;
		// console.log("last = " + Object.inspect(this.lastMouseEvent));
		// console.log("null = " + Object.inspect(nullMove));
		this.reallyHandleMouseEvent(nullMove);
		this.lastMouseEvent = last;  // Restore -- necess??
	},

	handleMouseEvent: function HandMorph$handleMouseEvent(evt) {
		if(!Config.debugExtras || !this.profileArmed || this.profileArmed != evt.type) {
			// Profile not armed or event doesnt match
			return this.reallyHandleMouseEvent(evt);
		}
		// Run profile during handling of this event
		this.profileArmed = null;  // Only this once
		var result;
		lively.lang.Execution.trace(function() { result = this.reallyHandleMouseEvent(evt) }.bind(this), this.profilingOptions );
		return result;
	},

	reallyHandleMouseEvent: function HandMorph$reallyHandleMouseEvent(evt) { 
		// console.log("reallyHandleMouseEvent " + evt + " focus " +  this.mouseFocus);
		
		// var rawPosition = evt.mousePoint;
		var world = this.owner;
		evt.mousePoint = evt.mousePoint.matrixTransform(world.getTransform().createInverse()); // for scaling
		evt.setButtonPressedAndPriorPoint(this.mouseButtonPressed, 
					  this.lastMouseEvent ? this.lastMouseEvent.mousePoint : null);
		//-------------
		// mouse move
		//-------------
		if (evt.type == "MouseMove" || evt.type == "MouseWheel") { // it is just a move
			this.setPosition(evt.mousePoint);
			
			if(evt.isShiftDown())
				this.alignToGrid();
			
			this.updateGrabHalo();
			
			if (evt.mousePoint.dist(this.lastMouseDownPoint) > 10) { 
				this.hasMovedSignificantly = true;
			}
			
			var shouldEnablePanningExperiment = true; // added by Adam
      if (shouldEnablePanningExperiment && world && evt.type == "MouseMove" && evt.isShiftDown() && evt.isMetaDown()) { // aaa or maybe it should just be Meta?
        if (this._panningStartPoint) {
          var v = this._panningStartPoint.subPt(evt.mousePoint);
          // console.log("Panning by " + v + "; start point was " + this._panningStartPoint + " and current mouse point is " + evt.mousePoint);
          world.slideBy(v);
        }
        this._panningStartPoint = evt.mousePoint;
        return true;
      } else {
        this._panningStartPoint = null;
      }
		  
			if (this.mouseFocus) { // if mouseFocus is set, events go to that morph
				this.mouseFocus.captureMouseEvent(evt, true);
			} else if (world) {
				var receiver = world.morphToReceiveEvent(evt);
				// console.log("found receiver: " + receiver)
				if (this.checkMouseOverAndOut(receiver, evt)) {	 // mouseOverMorph has changed...
					if (!receiver || !receiver.canvas()) return false;	// prevent errors after world-switch
					// Note if onMouseOver sets focus, it will get onMouseMove
					if (this.mouseFocus) this.mouseFocus.captureMouseEvent(evt, true);
					else if (!evt.hand.hasSubmorphs()) world.captureMouseEvent(evt, false); 
				} else if (receiver) {
					// gestureHandler stuff added by Adam, want to use Moousture for gestures
					if (UserAgent.isTouch && receiver.gestureHandler) {
						receiver.gestureHandler(evt.rawEvent);
					}
					receiver.captureMouseEvent(evt, false);
				}
			}
			this.lastMouseEvent = evt;
			return true;
		} 

	
		//-------------------
		// mouse up or down
		//-------------------
		if (!evt.mousePoint.eqPt(this.position())) { // Only happens in some OSes
			// and when window wake-up click hits a morph
			this.moveBy(evt.mousePoint.subPt(this.position())); 
		}

		this.mouseButtonPressed = (evt.type == "MouseDown") || (UserAgent.isTouch && evt.isTouchEvent());  // aaa - touch stuff added by Adam, not sure this is the right place for it
		this.setBorderWidth(this.mouseButtonPressed ? 2 : 1);
		evt.setButtonPressedAndPriorPoint(this.mouseButtonPressed, this.lastMouseEvent ? this.lastMouseEvent.mousePoint : null);
	
		if (this.mouseFocus != null) {
			if (this.mouseButtonPressed) {
				this.mouseFocus.captureMouseEvent(evt, true);
				this.lastMouseDownPoint = evt.mousePoint; 
			} else {
				this.mouseFocus.captureMouseEvent(evt, true);
			}
		} else {
			if (this.hasSubmorphs() && (evt.type == "MouseDown" || this.hasMovedSignificantly)) {
				// If laden, then drop on mouse up or down
				var m = this.topSubmorph();
				var receiver = world.morphToGrabOrReceiveDroppingMorph(evt, m);

				// Changed to make the morph go back if the drop fails. -- Adam
				if (receiver) {
					this.dropMorphsOn(receiver);
				} else {
					this.dropMorphsOn(world);
					if (m.shouldRevertAfterFailedDrop) {
						var previousOwner    = this.grabInfo[0];
						var previousPosition = this.grabInfo[1];
						m.ensureIsInWorld(world, previousPosition, true, true, false, function() {
							previousOwner.addMorph(m);
						});
					}
				}

				// aaa - not really sure this is a good idea, but I want double-click to work for putting back grabbed morphs -- Adam
				if (evt.isDoubleClick()) { m.onDoubleClick(evt); }
			} else {
				// console.log("hand dispatching event %s to owner %s", evt, this.owner);
				// This will tell the world to send the event to the right morph
				// We do not dispatch mouseup the same way -- only if focus gets set on mousedown
				if (evt.type == "MouseDown") world.captureMouseEvent(evt, false);
			}
			if (evt.type == "MouseDown") {
				this.lastMouseDownPoint = evt.mousePoint;
				this.lastMouseDownEvent = evt;
				this.hasMovedSignificantly = false; 
			}
		}
		this.lastMouseEvent = evt; 
		return true;
	},
	
    checkMouseUpIsInClickTimeSpan: function(mouseUpEvent) {
		// console.log("checkMouseUpIsInClickTimeSpan " + this.lastMouseDownEvent.timeStamp )
		if (!this.lastMouseDownEvent || !mouseUpEvent)
			return false;
		return (mouseUpEvent.timeStamp - this.lastMouseDownEvent.timeStamp) < (400)
	},

    checkMouseOverAndOut: function(newMouseOverMorph, evt) {
		if (newMouseOverMorph === this.mouseOverMorph) return false;

		// if over a new morph, send onMouseOut, onMouseOver
		if (this.mouseOverMorph) this.mouseOverMorph.onMouseOut(evt);
		this.mouseOverMorph = newMouseOverMorph;
		// console.log('msOverMorph set to: ' + Object.inspect(this.mouseOverMorph));
		if (this.mouseOverMorph) this.mouseOverMorph.onMouseOver(evt);
		return true;
	},
	
	// touch and gesture stuff added by Adam
	handleTouchEvent: function HandMorph$handleTouchEvent(evt) {
	  // console.log("handleTouchEvent of type " + evt.type);

    // aaa - WRONG, don't hard-code to use just the first touch
		var touch = evt.changedTouches()[0];
		if (!touch) { console.warn('Cannot setup touch event because cannot find touch!'); } else { evt.mousePoint = pt(touch.pageX || touch.clientX, touch.pageY || touch.clientY).subPt(evt.offset()); }

	  var world = this.world();
	  
		this.setPosition(evt.mousePoint);
		
		var touchedMorph = world.morphToReceiveEvent(evt);
		if (touchedMorph !== this._mostRecentlyTouchedMorph) {
		  if (this._mostRecentlyTouchedMorph) { this._mostRecentlyTouchedMorph.runAvocadoEventHandler('onTouchOut', evt); }
		  this._mostRecentlyTouchedMorph = touchedMorph;
		  if (this._mostRecentlyTouchedMorph) { this._mostRecentlyTouchedMorph.runAvocadoEventHandler('onTouchOver', evt); }
		}
    
		if (evt.type === "TouchStart") {
		  this.lastMouseDownEvent = evt;
		  this.hasMovedSignificantly = false;
		  
			if (touchedMorph && ((touchedMorph.owner && touchedMorph.owner.openForDragAndDrop) || touchedMorph.okToBeGrabbedBy(evt))) {
        this.grabMorph(touchedMorph, evt);
			}
		  
		  setTimeout(function() {
		    if (this.lastMouseDownEvent == evt) { // the user hasn't lifted his finger yet
  		    if (! this.hasMovedSignificantly) {
  		      // aaa - make this a "long touch" event and call some method on the _eventHandler or something
  		      this.dropMorphsOn(world);
    				var touchedMorph = world.morphToReceiveEvent(evt);
    				touchedMorph.showContextMenu(evt);
  		    }
		    }
		  }.bind(this), 750);

      if (touchedMorph) { touchedMorph.runAvocadoEventHandler('onTouchStart', evt); }
		} else if (evt.type === "TouchEnd") {
		  this.lastMouseDownEvent = null;
		  this.hasMovedSignificantly = false;
      this.dropMorphsOn(world);

      if (touchedMorph) { touchedMorph.runAvocadoEventHandler('onTouchEnd', evt); }
		} else if (evt.type === "TouchMove") {
			if (evt.mousePoint.dist(this.lastMouseDownEvent.mousePoint) > 10) { 
				this.hasMovedSignificantly = true;
			}

      if (touchedMorph) { touchedMorph.runAvocadoEventHandler('onTouchMove', evt); }
		} else if (evt.type === "TouchCancel") {
		  this.lastMouseDownEvent = null;
		  this.hasMovedSignificantly = false;
      this.dropMorphsOn(world); // aaa - should actually return them to their previous positions or something

      if (touchedMorph) { touchedMorph.runAvocadoEventHandler('onTouchCancel', evt); }
	  }
		
		evt.preventDefault();
  },

	handleGestureEvent: function HandMorph$handleGestureEvent(evt) {
	  // console.log("Got to handleGestureEvent, evt.type is " + evt.type + "; now what?");
		evt.preventDefault();
  },

    layoutChanged: function($super) {
		this.layoutChangedCount ++;
		try {
			$super();
			if (this.layoutChangedCount == 1) {
				Config.showGrabHalo && this.updateGrabHalo();
			}
		} finally {
			this.layoutChangedCount --;
		}
    },


    showAsGrabbed: function(grabbedMorph) {
		// At this time, there are three separate hand-effects:
		//  1. applyDropShadowFilter, if it works, will cause the graphics engine to put a nice
		//	   gaussian blurred drop-shadow on morphs that are grabbed by the hand
		//  2. showGrabHalo will cause a halo object to be put at the end of the hand's
		//	   submorph list for every grabbed morph (has property 'morphTrackedByHalo')
		//  3. useShadowMorphs will cause a shadowCopy of each grabbed morph to be put
		//	   at the end of the hand's submorph list (has property 'isHandMorphShadow')
		// So, if everything is working right, the hand's submorph list looks like:
		//	front -> Mc, Mb, Ma, Ha, Sa, Hb, Sb, Hc, Sc <- back [note front is last ;-]
		// Where M's are grabbed morphs, H's are halos if any, and S's are shadows if any

        if (this.applyDropShadowFilter) grabbedMorph.applyFilter(this.dropShadowFilter); 

		if (Config.showGrabHalo) {
		    var bounds = grabbedMorph.bounds(true);
		    var halo = this.addMorphBack(Morph.makeRectangle(bounds).applyStyle({fill: null, borderWidth: 0.5 }));
		    halo.morphTrackedByHalo = grabbedMorph;
		    halo.shape.setStrokeDashArray(String([3,2]));
		    halo.setLineJoin(lively.scene.LineJoins.Round);
		    halo.ignoreEvents();

		    var idLabel = new TextMorph(pt(20,10).extentAsRectangle(), String(grabbedMorph.id())).beLabel();
		    idLabel.applyStyle(this.grabHaloLabelStyle);
		    halo.addMorph(idLabel);
		    idLabel.align(idLabel.bounds().bottomLeft(), halo.innerBounds().topRight());
	    
		    var pos = grabbedMorph.getPosition();
		    var posLabel = new TextMorph(pt(20, 10).extentAsRectangle(), "").beLabel();
		    posLabel.applyStyle(this.grabHaloLabelStyle);
		    halo.positionLabel = halo.addMorph(posLabel);

			this.updateGrabHalo();
		}
        if (this.useShadowMorphs) {
			var shadow = grabbedMorph.shadowCopy();
			shadow.isHandMorphShadow = true;
			this.addMorphBack(shadow);
			shadow.moveBy(pt(8, 8));
		}
    },

    showAsUngrabbed: function(grabbedMorph) {
		if (this.applyDropShadowFilter) grabbedMorph.applyFilter(null);
    },
    
    alignToGrid: function() {
        if(!Config.showGrabHalo) return;
        var grid = function(a) {
            return a - (a % (Config.alignToGridSpace || 5))
		};
		this.submorphs.forEach(function(halo) {
		    if (halo.morphTrackedByHalo) { // this is a tracking halo
	        	if (!halo.orgSubmorphPosition)
			    halo.orgSubmorphPosition = halo.morphTrackedByHalo.getPosition();
			var oldPos = this.worldPoint(halo.orgSubmorphPosition);
			var gridPos = pt(grid(oldPos.x), grid(oldPos.y));
			halo.morphTrackedByHalo.setPosition(this.localize(gridPos));
		    }
		}.bind(this));
    },

    updateGrabHalo: function Morph$updateGrabHalo() {
		// Note there may be several grabHalos, and drop shadows as well
		// See the comment in showAsGrabbed 
		this.submorphs.forEach(function(halo) {
		    if (halo.morphTrackedByHalo) { // this is a tracking halo
				halo.setBounds(halo.morphTrackedByHalo.bounds(true).expandBy(3));
				if (halo.positionLabel) {
				    var pos = this.worldPoint(halo.morphTrackedByHalo.getPosition());
				    var posLabel = halo.positionLabel;
				    posLabel.setTextString(pos.x.toFixed(1) + "," + pos.y.toFixed(1));
				    posLabel.align(posLabel.bounds().bottomCenter(), halo.innerBounds().topLeft());
				}
		    }
		}.bind(this));
    },

	grabMorph: function(grabbedMorph, evt) { 
		if (evt.isShiftDown() && (evt.isAltDown() || evt.isMetaDown())) {
			grabbedMorph.dragMe(evt);
			return;
		}
		if (evt.isShiftDown() || (grabbedMorph.owner && grabbedMorph.owner.copySubmorphsOnGrab == true)) {
			if (!grabbedMorph.okToDuplicate()) return;
			grabbedMorph.copyToHand(this);
			return;
		}
		if (evt.isCommandKey() || evt.isRightMouseButtonDown() || evt.isMiddleMouseButtonDown()) {
			grabbedMorph.showMorphMenu(evt);
			return;
		}
		// Give grabbed morph a chance to, eg, spawn a copy or other referent
		grabbedMorph = grabbedMorph.okToBeGrabbedBy(evt);
		if (!grabbedMorph) return;

		if (grabbedMorph.owner && !grabbedMorph.owner.openForDragAndDrop) return;

		if (this.keyboardFocus && grabbedMorph !== this.keyboardFocus) {
			this.keyboardFocus.relinquishKeyboardFocus(this);
		}
		// console.log('grabbing %s', grabbedMorph);
		// Save info for cancelling grab or drop [also need indexInOwner?]
		// But for now we simply drop on world, so this isn't needed
		this.grabInfo = [grabbedMorph.owner, grabbedMorph.position()];
		if (this.logDnD) console.log('%s grabbing %s', this, grabbedMorph);
		this.addMorphAsGrabbed(grabbedMorph);
		// grabbedMorph.updateOwner(); 
		this.changed(); //for drop shadow
	},
    
    addMorphAsGrabbed: function(grabbedMorph) { 
        this.addMorph(grabbedMorph);
		this.showAsGrabbed(grabbedMorph);
    },
    
    dropMorphsOn: function(receiver) {
		if (receiver !== this.world()) 
			this.unbundleCarriedSelection();
		if (this.logDnD) 
			console.log("%s dropping %s on %s", this, this.topSubmorph(), receiver);
		this.carriedMorphsDo( function(m) {
			m.dropMeOnMorph(receiver);
			this.showAsUngrabbed(m);
		});
		this.shadowMorphsDo( function(m) { m.stopAllStepping(); });
		this.removeAllMorphs() // remove any shadows or halos
    },

    carriedMorphsDo: function(func) {
		// Evaluate func for only those morphs that are being carried,
		// as opposed to, eg, halos or shadows
		this.submorphs.clone().reverse().forEach(function(m) {
		    if (!m.morphTrackedByHalo && !m.isHandMorphShadow) func.call(this, m);
		}.bind(this));
    },

    shadowMorphsDo: function(func) { 
		// Evaluate func for only those morphs that are shadows,
		this.submorphs.clone().reverse().forEach(function(m) {
		    if (m.isHandMorphShadow) func.call(this, m);
		}.bind(this));
    },

    unbundleCarriedSelection: function() {
        // Unpack the selected morphs from a selection prior to drop or jump to other world
        if (!this.hasSubmorphs() || !(this.topSubmorph() instanceof SelectionMorph)) return;
        var selection = this.topSubmorph();
        for (var i=0; i<selection.selectedMorphs.length; i++) {
            this.addMorph(selection.selectedMorphs[i])
        }
        selection.removeOnlyIt();
    },

    moveSubmorphs: function(evt) {
        var world = this.world();
	
        // Display height is returned incorrectly by many web browsers.
        // We use an absolute Y-value instead. 
        var towardsPoint = pt(world.bounds().center().x, 350);

        switch (evt.getKeyCode()) {
        case Event.KEY_LEFT:
            this.submorphs.invoke('moveBy', pt(-10,0));
            evt.stop();
            return true;
        case Event.KEY_RIGHT:
            // forget the existing selection
            this.submorphs.invoke('moveBy', pt(10, 0));
            evt.stop();
            return true;
        case Event.KEY_UP:
            this.submorphs.invoke('moveBy', pt(0, -10));
            evt.stop();
            return true;
        case Event.KEY_DOWN:
            this.submorphs.invoke('moveBy', pt(0, 10));
            evt.stop();
            return true;

            // Experimental radial scrolling feature
            // Read the comments near method Morph.moveRadially()
        case Event.KEY_PAGEUP:
        case 65: // The "A" key
	    world.submorphs.invoke('moveRadially', towardsPoint, 10);
            this.moveRadially(towardsPoint, 10);            
            evt.stop();
            return true;
        case Event.KEY_PAGEDOWN:
        case 90: // The "Z" key
	    world.submorphs.invoke('moveRadially', towardsPoint, -10);
            this.moveRadially(towardsPoint, -10);            
            evt.stop();
            return true;
        }
        
        return false;
    },

    transformSubmorphs: function(evt) {
		var fun = null;
		switch (evt.getKeyChar()) {
			case '>':
				fun = function(m) { m.setScale(m.getScale()*1.1) };
				break;
			case '<':
				fun = function(m) { m.setScale(m.getScale()/1.1) };
				break;
			case ']':
				fun = function(m) { m.setRotation(m.getRotation() + 2*Math.PI/16) };
				break;
			case '[':
				fun = function(m) { m.setRotation(m.getRotation() - 2*Math.PI/16) };
				break;
		}
		if (fun) {
			this.submorphs.forEach(fun);
			evt.stop();
			return true;
		} else return false;
	},

	isKeyDown: function(character) {
		if (!this.keysDown)
			return false;
		return this.keysDown[character]
	},
	
	forgetKeyDown: function(evt) {
		if (!this.keysDown)
			return;
		this.keysDown[evt.getKeyChar()] = false;
		// hack, around weired events when command is pressed
		if (evt.getKeyCode() == 91) {
			// console.log("clear keydown list...")
			this.keysDown = {};
		
		};
	},

	rememberKeyDown: function(evt) {
		if (!this.keysDown) {
			this.keysDown = {};
		};
 		//console.log("remember KeyDown " + evt.getKeyChar())
		this.keysDown[evt.getKeyChar().toUpperCase()] = true;
	},

    handleKeyboardEvent: function(evt) {
  		// console.log("event: " + evt )
      
		if(evt.type == "KeyUp") {
 			this.forgetKeyDown(evt);			
		};
    
    // Experimenting with a menu idea that I learned from Richard Kulisz. -- Adam
    // http://www.c2.com/cgi/wiki?WheelMenu
    if (avocado.ui && avocado.ui.shouldEnableMouseFreeMenuExperiment) {
      if (evt.isAltDown()) {
        if (evt.getKeyCode() === 18) { // I think this means no other key is pressed, just Alt -- Adam
          evt.mousePoint = this.getPosition();
          var receiver = this.world().morphToReceiveEvent(evt);
          receiver.showContextMenu(evt);
          return;
        }
      }
      if (evt.isCtrlDown()) {
        if (evt.getKeyCode() === 17) { // I think this means no other key is pressed, just Ctrl -- Adam
          evt.mousePoint = this.getPosition();
          var receiver = this.world().morphToReceiveEvent(evt);
          receiver.showMorphMenu(evt);
          return;
        }
      }
    }
      
      
        if (this.hasSubmorphs())  {
            if (evt.type == "KeyDown" && this.moveSubmorphs(evt)) return;
            else if (evt.type == "KeyPress" && this.transformSubmorphs(evt)) return;
        }
		var consumed = false;
        // manual bubbling up b/c the event won't bubble by itself
		var world = this.world();
        for (var responder = this.keyboardFocus || world; responder != null; responder = responder.owner || world) {
			if (responder.takesKeyboardFocus()) {
                var handler = responder[evt.handlerName()];
                if (handler) {
                    if (handler.call(responder, evt)) {
						consumed = true;
                        break; // event consumed?		
					}
                }
            }
			if (responder == world) break;
        }

		if (!consumed) {
			// console.log("not consumed " + evt)
			// the single command key evt 
			if (evt.isCommandKey())
				ClipboardHack.selectPasteBuffer();			
				
			// remember key down for mouse events
			if(evt.type == "KeyPress") {
				this.rememberKeyDown(evt);
			};
		};
		this.blockBrowserKeyBindings(evt);
    },
	
    blockBrowserKeyBindings: function(evt) {
		switch (evt.getKeyCode()) {
			case Event.KEY_SPACEBAR: // [don't] scroll
		    	// stop keypress but don't try to stop preceeding keydown,
		    	// which would prevent keypress from firing and being handled by Text etc
		    	if (evt.type == "KeyPress") evt.stop();
		    	break;
		    case Event.KEY_BACKSPACE: // [don't] go to the previous page 
		    	evt.stop();
		    	break;
			case 22:
			case 3:
			case 24:
				if (evt.isCtrlDown() && evt.type == "KeyPress") 
					evt.preventDefault(); // ctrl+x, ctrl+c, or ctrl+v pressed
				break;
			}
		switch (evt.getKeyChar()) {
			case "[":
			case "]":
		    	if (evt.isMetaDown() && evt.type == "KeyPress") {
					// Safari would want to navigate the history
					evt.preventDefault();
					break;
		    }
		}	
    },

	bounds: function($super) {
		// account for the extra extent of the drop shadow
		// FIXME drop shadow ...
		return this.shadowMorph ? $super().expandBy(this.shadowOffset.x) : $super();
	},

	getInsertPositionFor: function(m, isFront) {
		if (this.submorphs.length == 0) return this.shape.rawNode;
		return isFront ? this.submorphs.last().rawNode : this.submorphs.first().rawNode;
	},

    toString: function($super) { 
        var superString = $super();
        var extraString = Strings.format(", local=%s,id=%s", this.isLocal, this.id());
        if (!this.hasSubmorphs()) 
			return superString + ", an empty hand" + extraString;
        return Strings.format("%s, a hand carrying %s%s", superString, this.topSubmorph(), extraString);
    },

	removeIndicatorMorph: function() {
		if (!this.indicatorMorph)
			return;
		this.indicatorMorph.remove();
		this.indicatorMorph = undefined;
	},

	ensureIndicatorMorph: function() {
		if (this.indicatorMorph)
			return this.indicatorMorph;
		var morph = new TextMorph(new Rectangle(0,0,100,20));
		morph.setPosition(this.shape.bounds().bottomRight().addPt(pt(-5,-5)))
		morph.ignoreEvents();
		morph.isEpimorph = true;
		morph.setBorderWidth(0);
		morph.setFill(null);
		this.indicatorMorph = morph;
		this.addMorph(morph);
		return morph
	},

	hasSubmorphs: function() {
		if (this.submorphs.length == 0)
			return false;
		else
			return this.submorphs.reject(function(ea) {return ea.isEpimorph}).length != 0;
	},
});

WorldMorph.addMethods({

	takesKeyboardFocus: Functions.True,
	
	onKeyDown: function(evt) {
		// console.log("WorldMorph onKeyDown " + this + " ---  " + evt + " char: " + evt.getKeyChar() )		
		return ClipboardHack.tryClipboardAction(evt, this);
	},
	
	onKeyPress: function(evt) {
		// do nothing
		// console.log("World onKeyPress " + evt + " char: " + evt.getKeyChar())
		return false;
	},

	onKeyUp: function(evt) {
		// do nothing
		// console.log("World onKeyUp " + evt + " char: " + evt.getKeyChar())
		return false
	},

	/* Actions */
	
	copySelectionAsXMLString: function() {
		if (!this.currentSelection) {
			console.log("WorldMorph: don't know what to copy")
			return
		}
		var selectedMorphs = this.currentSelection.selectedMorphs
		if (selectedMorphs.length == 0) {
			console.log("WorldMorph: selection is empty")
			return 
		};
		
		var copier = new Copier();
		var doc = new ClipboardCopier().createBaseDocument();
		var worldNode = doc.childNodes[0].childNodes[0];
		
		var container = new Morph.makeRectangle(new Rectangle(0,0,10,10));
		container.isSelectionContainer = true;
				
		selectedMorphs.each(function(ea) {
			container.addMorph(ea.copy(copier));
		})
		
		var systemDictionary =	container.rawNode.appendChild(NodeFactory.create("defs"));
		systemDictionary.setAttribute("id", "SystemDictionary");
		
		worldNode.appendChild(container.rawNode);
		var exporter = new Exporter(container);
		var helpers = exporter.extendForSerialization(systemDictionary);
		var result = Exporter.stringify(container.rawNode);
		exporter.removeHelperNodes(helpers);
	
		return result
	},

	pasteDestinationMorph: function() {
		return this;
	},

	doCopy: function() {
		var source = this.copySelectionAsXMLString();
		TextMorph.clipboardString = source;
	},
	
	doPaste: function() {
		if (TextMorph.clipboardString) {
			// console.log("paste morphs...")
			this.pasteFromSource(TextMorph.clipboardString);
		}
	},
	
	calcTopLeftOfPoints: function(points) {
		var min_x;
		var min_y;
		points.each(function(ea) {
			if (!min_x || ea.x < min_x)
				min_x = ea.x;
			if (!min_y || ea.y < min_y)
				min_y = ea.y;
		});
		return pt(min_x, min_y)
	},
	
	pastePosition: function() {
		var pos = this.hands.first().lastMouseDownPoint;
		if (!pos || pos.eqPt(pt(0,0)))
			pos = this.hands.first().getPosition();
		return pos
	},
	
	calcPasteOffsetFrom: function(morphs) {
		if(morphs.length == 0)
			return;
		var topLeft = this.calcTopLeftOfPoints(morphs.collect(function(ea) {return ea.getPosition()}))		
		return this.pastePosition().subPt(topLeft);
	},
	
	// similarities to Fabrik >> pasteComponentFromXMLStringIntoFabrik
	// TODO refactor
	pasteFromSource: function(source){
		var copier = new ClipboardCopier();
		var morphs = copier.loadMorphsWithWorldTrunkFromSource(source);
		if (morphs.length == 0) {
			var pos = this.pastePosition();
			var textMorph = new TextMorph(new Rectangle(pos.x,pos.y,200,100), source);
			this.addMorph(textMorph);
			return;
		}
		// unpack potential selection morph
		if(morphs[0] && morphs[0].isSelectionContainer) {
			morphs = morphs[0].submorphs
		};
		var copier = new Copier();
		var offset = this.calcPasteOffsetFrom(morphs);
		morphs.each(function(ea) {
			var copy = ea.copy(copier);
			this.pasteDestinationMorph().addMorph(copy)
			if (offset) {
				copy.moveBy(offset)
			}	
		}, this)
	},

	doCut: function() {
		console.log("cut selection")
		this.doCopy();
 		if (this.currentSelection) 
			this.currentSelection.remove();
	},
})

Morph.subclass('LinkMorph', {

    documentation: "two-way hyperlink between two Lively worlds",
    helpText: "Click here to enter or leave a subworld.\n" +
        "Use menu 'grab' to move me.  Drag objects\n" +
        "onto me to transport objects between worlds.",
    openForDragAndDrop: false,
    suppressHandles: true,
	style: {
		borderColor: Color.black, 
		fill: lively.lang.let(lively.paint, function(g) { 
			return new g.RadialGradient([new g.Stop(0, Color.blue.lighter()) , new g.Stop(0.5, Color.blue), 
			new g.Stop(1, Color.blue.darker())], pt(0.4, 0.2))})
	},
    
	initialize: function($super, otherWorld, initialPosition) {
		// In a scripter, type: world.addMorph(new LinkMorph(null))

		// Note: Initial position can be specified either as a rectangle or point.
		// If no position is specified, place the icon in the lower left corner
		// of the screen.
		initialPosition = initialPosition || WorldMorph.current().bounds().bottomLeft().addXY(50, -50);
		$super(new lively.scene.Ellipse(initialPosition, 25));
		var bounds = this.shape.bounds();

		// Make me look a bit like a world
		[new Rectangle(0.15,0,0.7,1), new Rectangle(0.35,0,0.3,1), new Rectangle(0,0.3,1,0.4)].forEach(function(each) {
			// Make longitude / latitude lines
			var lineMorph = new Morph(new lively.scene.Ellipse(bounds.scaleByRect(each)));
			lineMorph.applyStyle({fill: null, borderWidth: 1, borderColor: Color.black}).ignoreEvents();
			this.addMorph(lineMorph);
		}, this);

		if (!otherWorld) {
			this.myWorld = this.makeNewWorld(this.canvas());
			this.addPathBack();
		} else {
			this.myWorld = otherWorld;
		}
		return this;
	},
    
	makeNewWorld: function(canvas) {
		return new WorldMorph(canvas);
	},
    
	addPathBack: function() {
		var pathBack = new LinkMorph(WorldMorph.current(), this.bounds().center());

		pathBack.setFill(lively.lang.let(lively.paint, function(gfx) {
			return new gfx.RadialGradient([new gfx.Stop(0, Color.orange), 
			new gfx.Stop(0.5, Color.red), 
			new gfx.Stop(1, Color.red.darker(2))],
			pt(0.4, 0.2));
		}));

		this.myWorld.addMorph(pathBack);
		return pathBack;
	},
    
	onDeserialize: function() {
		//if (!this.myWorld) 
		this.myWorld = WorldMorph.current(); // a link to the current world: a reasonable default?
	},

	handlesMouseDown: function(evt) {
		return true; 
	},

	onMouseDown: function(evt) {
		this.enterMyWorld(evt); 
		return true; 
	},

	morphMenu: function($super, evt) { 
		var menu = $super(evt);
		menu.addItem(["publish linked world as ... ", function() { 
		this.world().prompt("world file (.xhtml)", this.exportLinkedFile.bind(this)); }]);
		menu.replaceItemNamed("package", ["package linked world", function(evt) {
			new PackageMorph(this.myWorld).openIn(this.world(), this.bounds().topLeft()); this.remove()} ]);
		return menu;
	},

	enterMyWorld: function(evt) { // needs vars for oldWorld, newWorld
		carriedMorphs = [];

		// Save, and suspend stepping of, any carried morphs
		evt.hand.unbundleCarriedSelection();
		evt.hand.carriedMorphsDo( function (m) {
			m.suspendAllActiveScripts();
			carriedMorphs.splice(0, 0, m);
			evt.hand.shadowMorphsDo( function(m) { m.stopAllStepping(); });
			evt.hand.showAsUngrabbed(m);
		});
		evt.hand.removeAllMorphs();
		this.hideHelp();
		this.myWorld.changed();
		var oldWorld = WorldMorph.current();
		oldWorld.onExit();    
		// remove old hands
		oldWorld.hands.clone().forEach(function(hand) { 
			oldWorld.removeHand(hand);
		});

		if (Config.suspendScriptsOnWorldExit) {
			oldWorld.suspendAllActiveScripts();
		}

		var canvas = oldWorld.canvas();
		oldWorld.remove(); // some SVG calls may stop working after this point in the old world.

		console.log('left world %s through %s', oldWorld, this);

		// display world first, then add hand, order is important!
		var newWorld = this.myWorld;
		if (newWorld.owner) {
			console.log("new world had an owner, removing");
			newWorld.remove();
		}

		newWorld.displayOnCanvas(canvas);  // Becomes current at this point

		if (Config.suspendScriptsOnWorldExit) { 
			newWorld.resumeAllSuspendedScripts();
		}

		carriedMorphs.forEach(function(m) {
			var hand = newWorld.firstHand();
			m.resumeAllSuspendedScripts();
			hand.addMorphAsGrabbed(m);
		});

		if (Config.showThumbnail) {
			var scale = 0.1;
			if (newWorld.thumbnail) {
				console.log("disposing of a thumbnail");
				newWorld.thumbnail.remove();
			}
			newWorld.thumbnail = Morph.makeRectangle(Rectangle.fromElement(canvas));
			newWorld.thumbnail.setPosition(this.bounds().bottomRight());
			newWorld.addMorph(newWorld.thumbnail);
			newWorld.thumbnail.setScale(scale);
			newWorld.thumbnail.addMorph(oldWorld);
		}

		if (carriedMorphs.length > 0) newWorld.firstHand().emergingFromWormHole = true; // prevent re-entering
	},
    
	onMouseOver: function($super, evt) {
		if (evt.hand.hasSubmorphs()) { // if hand is laden enter world bearing gifts
			if (!evt.hand.emergingFromWormHole) this.enterMyWorld(evt);
		} else {
			$super(evt);
		}
	},

	onMouseOut: function($super, evt) {
		evt.hand.emergingFromWormHole = false;
		$super(evt);
	},

	getHelpText: function() {
		return this.helpText;
	},
	
	addLabel: function(text) {
		var label = new TextMorph(pt(110, 25).extentAsRectangle(), text).applyStyle({borderRadius: 10, borderWidth: 2});
		this.addMorph(label);
		label.align(label.bounds().leftCenter(), this.shape.bounds().rightCenter().addXY(5, 0));
		label.linkToStyles(['raisedBorder']);
		return label;
	},
    
});

LinkMorph.subclass('ExternalLinkMorph', {

    documentation: "A link to a different web page, presumably containing another LK",

    style: { borderColor: Color.black, fill: new lively.paint.RadialGradient([new lively.paint.Stop(0, Color.green), 
									     new lively.paint.Stop(1, Color.yellow)])},
    
    initialize: function($super, url, position) {
		$super(null, position || pt(0, 0));
		this.url = url;
		this.win = null; // browser window
    },

    makeNewWorld: Functions.Null, 
    
    addPathBack: Functions.Null,

	enterMyWorld: function(evt) {
		if (evt.isCommandKey()) {
			this.world().confirm("Leave current runtime to enter another page?", function (answer) {
				if (answer) Global.location = this.url.toString();
				else console.log("cancelled loading " + this.url);
			});
		} else {
			if (this.win && !this.win.closed) this.win.focus();
			else this.win = Global.window.open(this.url);
		}
	},
    
    getHelpText: function() {
		return "Click to enter " + this.url;
    },

	morphMenu: function($super, evt) { 
		var menu = $super(evt);
		menu.addItem(["set link target...", function() {
			this.world().prompt("Set new target file", function(answer) {
				this.url = URL.source.withFilename(answer);
			}.bind(this), URL.source.toString());
		}]);
		return menu;
	}
    
});

 function interactiveEval(text) {
    // FIXME for compatibility, load jQuery for some interactive conveniences
	// ECMAScript 3rd edition, section 12.4: 
	// “Note that an ExpressionStatement cannot start with an opening curly brace because that might make it ambiguous with a Block.“
	//text = '(' + text + ')'; // workaround for that issue
	return eval(text);
 }

// for Fabrik
Morph.addMethods({
    isContainedIn: function(morph) {
        if (!this.owner)
            return false;
        if (this.owner === morph)
            return true;
        else
            return this.owner.isContainedIn(morph)
    },
});

// For driving a Car... 
Morph.addMethods({

	moveForwardBy: function(amount) {
		var nose = pt(1,0)
		var dir = nose.matrixTransformDirection(this.getTransform()).normalized();
		this.moveBy(dir.scaleBy(amount))
	},

	// TODO: There is a bug in Safari (the matrix multiplication is the wrong way around)
	// that is not taken into account here....
	rotateAround: function(angle, center) {
		var tfm = new lively.scene.Similitude().toMatrix();
		tfm = tfm.translate(center.x, center.y);
		tfm = tfm.rotate(angle)		
		tfm = tfm.translate( -center.x, -center.y);	
		var oldTfm = this.getTransform().toMatrix();
		var newTfm = oldTfm.multiply(tfm);
		this.setTransform(new lively.scene.Similitude(newTfm));
	},

	turnBy: function(angle) {
		this.rotateAround(angle, this.shape.bounds().center())		
	}
})


// for Fabrik
HandMorph.addMethods({
    changed: function($super, morph) {
        $super();
        this.globalPosition = this.getPosition();
        this.submorphs.forEach(function(ea){
            // console.log("changed "+ ea);
            ea.changed("globalPosition", this.getPosition());
        }, this);
    }
});

Morph.subclass('BoxMorph', {

    documentation: "Occupies a rectangular area of the screen, can be laid out",

    // FIXME: this doesn't account properly for border width
    // the CSS box model, see http://www.w3.org/TR/REC-CSS2/box.html    
    padding: new Rectangle(0, 0, 0, 0), // between morph borders and its content (inwards)
    margin: new Rectangle(0, 0, 0, 0), // between morph border and its 

    initialize: function($super, initialBounds) {
		$super(new lively.scene.Rectangle(initialBounds || this.defaultBounds)); // defaultBounds added by Adam
    },
        // ??
    innerBounds: function() { 
        return this.shape.bounds().insetByRect(this.padding);
    },

	applyStyle: function($super, spec) { // no default actions, note: use reflection instead?
		$super(spec);
		if (!spec) {
			throw new TypeError('spec is undefined in applyStyle');		
		}
		if (spec.padding !== undefined) {
			if (!(spec.padding instanceof Rectangle)) 
				throw new TypeError(spec.padding + ' not a Rectangle');
			this.padding = spec.padding;
		}
		return this; // added by Adam, I think it's just a bug that this was omitted
	}

});

BoxMorph.subclass('ContainerMorph', {
    documentation: "Box morph whose shape grows to contain all its submrphs",

	initialize: function($super,rect) {
		$super(rect);//new Rectangle(0,0,0,0));
	},

    initializeTransientState: function($super) {
        $super();
        this.priorExtent = this.innerBounds().extent();
    },

	addMorph: function($super, m, isFront) {
		var ret = $super(m, isFront);
		this.shape.setBounds(this.submorphBounds(true).outsetByRect(this.padding));
		return ret;
	},

	adjustForNewBounds: function ($super) {
		// borrowed from PanelMorph
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

    
});


ClipboardHack = {
	ensurePasteBuffer: function() {
		// Return a reference to a text element to serve as our proxy for communication
		//   with the OS about text such as cut/paste, or iPad keyboard input
		if (UserAgent.isMozilla && UserAgent.fireFoxVersion) return;
		var buffer = document.getElementById("copypastebuffer");
		if (buffer) return buffer;

		// Not there yet -- create a new one
		buffer = document.createElement("textarea");
		buffer.setAttribute("cols","1");
		buffer.setAttribute("rows","1");
		buffer.setAttribute("id","copypastebuffer");
		// buffer.setAttribute("style","position:absolute;z-index: -400;left:0px; top:1px; width:1px; height:1px;");
		if (UserAgent.isTouch) { // hack to test text input on iPad
			buffer.setAttribute("style","position:fixed;z-index: 5;left:0px; top:0px; width:100px; height:30px;");
		} else {
			// the Clipboard buffer needs a minimum width, otherwise it will scroll the page on the first paste
			buffer.setAttribute("style","position:fixed;z-index: -5;left:0px; top:0px; width:50px; height:1px;");
		}
		buffer.textContent = "NoText";
		var outerBody = Global.document.body || Global.parent.document.body;
		outerBody.appendChild(buffer);
		return buffer;
	},
	
	selectPasteBuffer: function() {
		var buffer = this.ensurePasteBuffer();
		if (buffer) buffer.select();
	},
	
	invokeKeyboard: function() {
	 		if (!UserAgent.isTouch) return;
			var buffer = this.ensurePasteBuffer();
			if (buffer) buffer.focus();
	},
	
	tryClipboardAction: function(evt, target) {
        // Copy and Paste Hack that works in Webkit/Safari
        if (!evt.isMetaDown() && !evt.isCtrlDown()) return false;
		this.selectPasteBuffer();
        var buffer = this.ensurePasteBuffer();
        if(!buffer) return false;
        if (evt.getKeyChar().toLowerCase() === "v" || evt.getKeyCode() === 22) {		
            buffer.onpaste = function() {
				TextMorph.clipboardString = event.clipboardData.getData("text/plain");
                if(target.doPaste) {
                  target.doPaste();
                  event.preventDefault(); // added by Adam, otherwise it pastes twice
                }
            };
        	buffer.focus();
        	return true;
        };
        if (evt.getKeyChar().toLowerCase() === "c" || evt.getKeyCode() === 3) {
			if(target.doCopy) target.doCopy();
			buffer.textContent = TextMorph.clipboardString;
			buffer.select();
        	buffer.focus();
        	return true;
        };
        if (evt.getKeyChar().toLowerCase() === "x" || evt.getKeyCode() === 24) {
			if (target.doCut) target.doCut();
			buffer.textContent = TextMorph.clipboardString;
			buffer.select();
        	buffer.focus();
        	return true;
        };
		// console.log('Clipboard action not successful');
		return false;
    },

}

Global.basicResize = function(world, canvas, newWidth, newHeight) {
	canvas.setAttribute("width", newWidth);
	canvas.setAttribute("height", newHeight);
	world.setExtent(pt(newWidth, newHeight));
	world.fullBounds = new Rectangle(0, 0, newWidth, newHeight);
};

window.onresize = function(evt) {
	if (!Config.onWindowResizeUpdateWorldBounds) return; 
	var h = document.getElementsByTagName('html')[0];
    var world = WorldMorph.current();
	if (!world) {
		console.log("Error: No world to resize.")
		return;
	}		
	// Todo: get rid of the arbitrary offset without getting scrollbars
	var canvas = world.rawNode.parentNode;
    var newWidth = h.clientWidth - 4;
    var newHeight = h.clientHeight-  4;
};

Global.$morph = function getMorphNamedShortcut(name) { return WorldMorph.current().getMorphNamed(name) };

// Helper method with GUI stuff, so it can't go into Helper.js
Global.inspect = function(inspectee) {
	var world = WorldMorph.current();
	new SimpleInspector(inspectee).openIn(world, world.hands.first().getPosition());
};

Object.subclass('ClipboardCopier', {
	
	copySelectionAsXMLString: function(component) {
		var componentCopy = component.copy(new Copier());
		var copy = componentCopy.panel;		
		var doc = this.createBaseDocument();
		var worldNode = doc.childNodes[0].childNodes[0];
		worldNode.appendChild(copy.rawNode);
		var exporter = new Exporter(copy);
		// todo: what about the SystemDictionary
		var helpers = exporter.extendForSerialization();
		var result = Exporter.stringify(copy.rawNode);
		exporter.removeHelperNodes(helpers);
		return result
	},
	
	createBaseDocument: function(source) {
		return new DOMParser().parseFromString('<?xml version="1.0" standalone="no"?>' +
			'<svg xmlns="http://www.w3.org/2000/svg" id="canvas">' +
                '<g type="WorldMorph" id="1:WorldMorph" transform="matrix(1 0 0 1 0 0)" fill="rgb(255,255,255)">'+
                    '<rect x="0" y="0" width="800" height="600"/>' +          
                    source  +
                '</g>'+ 
            '</svg>', /* "text/xml" */ "application/xml");
	},

	loadMorphsWithWorldTrunkFromSource: function(source) {
    	var xml = this.createBaseDocument(source);
		var systemDictionary = xml.getElementById("SystemDictionary");
		var globalSystemDictionary = lively.data.Wrapper.prototype.dictionary();
		if(systemDictionary) {
			$A(systemDictionary.childNodes).each(function(ea) {
				var result = lively.data.FragmentURI.getElement(ea.id);
				
				// TODO: give the element a new id and map it, is there an implemnentation laying around somewhere here?
				if(!result) 
					globalSystemDictionary.appendChild(ea.cloneNode(true))
			})
		}
		var world = new Importer().loadWorldContents(xml);
		return world.submorphs
    },	
});


if (window.shouldShowLoadingMessages) { console.log('loaded Core.js'); }
