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
// ===========================================================================
// Graphics primitives (SVG specific, browser-independent)
// ===========================================================================


namespace('lively.data');

Object.subclass('lively.data.Wrapper', {
	documentation: "A wrapper around a native object, stored as rawNode",

	rawNode: null,

	deserialize: function(importer, rawNode) {
		this.rawNode = rawNode;
		reflect(this).slotAt('rawNode').beCreator(); // aaa - kind of a hack, added by Adam so that we can file out morphs
		dbgOn(!rawNode);
		var id = rawNode.getAttribute("id");
		if (id) importer.addMapping(id, this); 
	},

	copyFrom: function(copier, other) {
		if (other.rawNode) {
		  this.rawNode = other.rawNode.cloneNode(true);
  		reflect(this).slotAt('rawNode').beCreator(); // aaa - kind of a hack, added by Adam so that we can file out morphs
	  }
	},

	copy: function(copier) {
		// Make copying work even with non-class-based Morphs. -- Adam
		// var myClass = Class.forName(this.getType());
		// return new myClass(copier || Copier.marker, this);
		var c = Object.create(this['__proto__']);
		c.copyFrom(copier || Copier.marker, this);
		return c;
	},

	getType: function() {
		var ctor = this.constructor.getOriginal();
		if (ctor.type) return ctor.type;
		console.log("no type for " + ctor);
		lively.lang.Execution.showStack();
		return null;
	},

	newId: (function() {
		// this may be a Problem, after deserializing and when copy and pasting... 
		var wrapperCounter = 0;
		return function(optNewCounter) {
			if (optNewCounter) {
				wrapperCounter = optNewCounter;
				return;
			}
			return Math.uuid ? Math.uuid() : ++wrapperCounter; // so use (pseudo) uuids when available
		}
	})(),

	id: function() {
		dbgOn(!this.rawNode);
		return this.rawNode.getAttribute("id");
	},

	setId: function(value) {
		var prev = this.id();
		// easy parsing if value is an int, just call parseInt()
		this.rawNode.setAttribute("id", value + ":" + this.getType()); // this may happen automatically anyway by setting the id property
		return prev;
	},

	setDerivedId: function(origin) {
		this.setId(origin.id().split(':')[0]);
		return this;
	},

	removeRawNode: function() {
		var parent = this.rawNode && this.rawNode.parentNode;
		return parent && parent.removeChild(this.rawNode);
	},

	replaceRawNode: function(newRawNode) { // added by Adam
		var parent = this.rawNode && this.rawNode.parentNode;
		return parent && parent.replaceChild(newRawNode, this.rawNode);
	},

	replaceRawNodeChildren: function(replacement) {
		while (this.rawNode.firstChild) this.rawNode.removeChild(this.rawNode.firstChild);
		if (replacement) this.rawNode.appendChild(replacement);
	},

	toString: function() {
		try {
			return "#<" + this.getType() +	":" + this.rawNode + ">";
		} catch (err) {
			return "#<toString error: " + err + ">";
		}
	},

	inspect: function() {
		try {
			return this.toString() + "[" + this.toMarkupString() + "]";
		} catch (err) {
			return "#<inspect error: " + err + ">";
		}
	},

	toMarkupString: function() {
		// note forward reference
		return Exporter.stringify(this.rawNode);
	},

	uri: function() {
		return lively.data.FragmentURI.fromString(this.id());
	},

	// convenience attribute access
	getLivelyTrait: function(name) {
		return this.rawNode.getAttributeNS(Namespace.LIVELY, name);
	},

	// convenience attribute access
	setLivelyTrait: function(name, value) {
		return this.rawNode.setAttributeNS(Namespace.LIVELY, name, value);
	},

	// convenience attribute access
	removeLivelyTrait: function(name) {
		return this.rawNode.removeAttributeNS(Namespace.LIVELY, name);
	},

	getLengthTrait: function(name) {
		return lively.data.Length.parse(this.rawNode.getAttributeNS(null, name));
	},

	setLengthTrait: function(name, value) {
		this.setTrait(name, value);
	},

	getTrait: function(name) {
		return this.rawNode.getAttributeNS(null, name);
	},

	setTrait: function(name, value) {
		return this.rawNode.setAttributeNS(null, name, String(value));
	},

	removeTrait: function(name) {
		return this.rawNode.removeAttributeNS(null, name);
	},

	getDefsNode: function() {
		var defNode = $A(this.rawNode.getElementsByTagName('defs')).detect(function(ea) {
			if (ea == null) {
				lively.lang.Execution.showStack();
				return false;
			}
			return ea.parentNode === this.rawNode;
		}, this);
		// create and append one when defNode is not there
		if (!defNode)
			defNode = this.rawNode.appendChild(NodeFactory.create('defs'));
		return defNode;
	},
	
	doNotSerialize: ['rawNode'],

	isPropertyOnIgnoreList: function(prop) {
		return this.doNotSerialize.include(prop) || this.isPropertyOnIgnoreListInClassHierarchy(prop, this.constructor);
	},

	isPropertyOnIgnoreListInClassHierarchy: function(prop, klass) {
		if (klass === Object)
			return false;
		return klass.prototype.doNotSerialize.include(prop) || this.isPropertyOnIgnoreListInClassHierarchy(prop, klass.superclass);
	},
	
	prepareForSerialization: function(extraNodes, optSystemDictionary) {
		for (var prop in this) {
			if (!this.hasOwnProperty(prop)) 
				continue;
			if (this.isPropertyOnIgnoreList(prop))
				continue;
			var m = this[prop];
			if (m === this.constructor.prototype[prop])	 // save space
				continue;
			this.preparePropertyForSerialization(prop, m, extraNodes, optSystemDictionary);
		}
	},

	appendHelperNode: function(node, extraNodes) {
		try {
			extraNodes.push(this.rawNode.appendChild(node));
		} catch (er) { throw er;}
		// console.log("appendHelperNode " + node.tagName + " " + node.parentNode)
		node.isHelper = true;
		// who deletes the extra whitespace after the nodes are reloaded? 
		// extraNodes.push(this.rawNode.appendChild(NodeFactory.createNL())); 
	},
	
	prepareArrayPropertyForSerialization: function(prop, propValue, extraNodes, optSystemDictionary) {
		if (prop === 'submorphs')
			return;	 // we'll deal manually
		var arr = LivelyNS.create("array", {name: prop});
		var abort = false;
		propValue.forEach(function iter(elt) {
			if (elt && lively.data.Wrapper.isInstance(elt)) { // FIXME what if Wrapper is a mixin?
				// if item empty, don't set the ref field
				var item =	(elt && elt.id()) ? LivelyNS.create("item", {ref: elt.id()}) : LivelyNS.create("item"); 
				extraNodes.push(arr.appendChild(item));
				extraNodes.push(arr.appendChild(NodeFactory.createNL()));
			} else {
				var item = Converter.encodeProperty(null, elt, true);
				if (item) {
					extraNodes.push(arr.appendChild(item));
					extraNodes.push(arr.appendChild(NodeFactory.createNL()));
				} else {
					console.log("ERROR Serializing item in array " + prop + " of " + this)
					abort = true;
					return;
				}
			}
		}, this);
		if (!abort) { 
			//console.assert($A(this.rawNode.getElementsByTagName("array")).select(function(ea){ 
			//	  return ea.getAttribute("name") == prop }).length == 1, "ERROR: node with " + prop + " is already in raw Node");
			this.appendHelperNode(arr, extraNodes);
		}	
	},
	
	prepareWrapperPropertyForSerialization: function(prop, propValue, extraNodes, optSystemDictionary) {
		if (prop === 'owner') 
		return; // we'll deal manually
		if (propValue instanceof lively.paint.Gradient || propValue	 instanceof lively.scene.Image) {
			return; // these should sit in defs and be handled by restoreDefs() 
		}

		//console.log("serializing field name='%s', ref='%s'", prop, m.id(), m.getType());
		if (!propValue.rawNode) {
			console.log("wha', no raw node on " + propValue);
		} else if (propValue.id() != null) {
			var desc = LivelyNS.create("field", {name: prop, ref: propValue.id()});
			this.appendHelperNode(desc, extraNodes);;
			if (prop === "ownerWidget") {
				// console.log('recursing for field ' + prop);
				propValue.prepareForSerialization(extraNodes, optSystemDictionary);
				this.appendHelperNode(propValue.rawNode, extraNodes);
			}
		}
	},
	
	prepareRelayPropertyForSerialization: function(prop, propValue, extraNodes, optSystemDictionary) {
		var delegate = propValue.delegate;
		if (lively.data.Wrapper.isInstance(delegate)) { // FIXME: better instanceof
			var desc = LivelyNS.create("relay", {name: prop, ref: delegate.id()});
			Properties.forEachOwn(propValue.definition, function(key, value) {
				var binding = desc.appendChild(LivelyNS.create("binding"));
				// extraNodes.push(binding); 
				binding.setAttributeNS(null, "formal", key);
				binding.setAttributeNS(null, "actual", value);
			});
			this.appendHelperNode(desc, extraNodes);
		} else {
			console.warn('unexpected: '+ propValue + 's delegate is ' + delegate);
		}		
	},

	preparePropertyForSerialization: function(prop, propValue, extraNodes, optSystemDictionary) {
		// console.log("prepare property " + prop + ": " + optSystemDictionary)
		if (propValue instanceof Function) {
			return;
		} else if (lively.data.Wrapper.isInstance(propValue)) { 
			this.prepareWrapperPropertyForSerialization(prop, propValue, extraNodes, optSystemDictionary)
		} else if (propValue instanceof Relay) {
			this.prepareRelayPropertyForSerialization(prop, propValue, extraNodes, optSystemDictionary)
		} else if (propValue instanceof Array) {
			this.prepareArrayPropertyForSerialization(prop, propValue, extraNodes, optSystemDictionary) 
		} else if (prop === 'rawNode' || prop === 'defs') { // necessary because nodes get serialized
			return;
		} else {
			var node = Converter.encodeProperty(prop, propValue);
			node && this.appendHelperNode(node, extraNodes);;
		}
	},

	reference: function() {
		// console.log("reference " + this)
		if (!this.refcount) {
			if (!this.id()) {
				this.setId(this.newId());
			}
			this.dictionary().appendChild(this.rawNode);
			this.refcount = 1; 
			return;
		}
		this.refcount ++;
	},

	dereference: function() {
		// console.log("dereference " + this)
		// sadly, when the object owning the gradient is reclaimed, nobody will tell us to dereference
		if (this.refcount === undefined) throw new Error('sorry, undefined');
		this.refcount --;
		if (this.refcount == 0) {
			if (this.rawNode.parentNode) this.dictionary().removeChild(this.rawNode);
		}
	},

	dictionary: function() {
		if (lively.data.Wrapper.dictionary)
			return	lively.data.Wrapper.dictionary;
		if (lively.data.Wrapper.dictionary = Global.document.getElementById("SystemDictionary"))
			return lively.data.Wrapper.dictionary;
		var canvas = Global.document.getElementById("canvas");
		lively.data.Wrapper.dictionary =  canvas.appendChild(NodeFactory.create("defs"));
		lively.data.Wrapper.dictionary.setAttribute("id", "SystemDictionary");
		return lively.data.Wrapper.dictionary;
	},
	
	deserializeWidgetFromNode: function(importer, node) {
		var type = lively.data.Wrapper.getEncodedType(node);
		if (!type)
			throw new Error("Error in deserializing Widget: no getEncodedType for " + node);
		var klass = Class.forName(type);
		if (!klass)
			throw new Error("Error in deserializing Widget:" + type + ", no class");

		var widget = new klass(importer, node);
		widget.restoreFromSubnodes(importer, node);
		return widget
	},
	
	deserializeValueFromNode: function(importer, node) {
		var value = node.textContent;
		if (!value) return null
		
		if (value === 'NaN')
			return	NaN; // JSON doesn't unserializes NaN

		var family = LivelyNS.getAttribute(node, "family");
		if (family) {
			var cls = Class.forName(family);
			if (!cls) throw new Error('unknown type ' + family);
			return cls.fromLiteral(JSON.unserialize(value), importer);
		}
			
		try {
			return JSON.unserialize(value);
		} catch (e) {
			console.log('Error in lively.data.Wrapper.deserializeValueFromNode:');
			console.log(e + ' was thrown when deserializing: ' + value);
		}
	},
		
	deserializeFieldFromNode: function(importer, node) {
		var name = LivelyNS.getAttribute(node, "name");
		if (!name)
			throw new Error("could not deserialize field without name");
		
		var ref = LivelyNS.getAttribute(node, "ref");
		if (ref) {
			importer.addPatchSite(this, name, ref);
			return
		}
		
		var isNode = node.getAttributeNS(null, 'isNode');
		if (isNode !== '' && isNode != null) {
			// we have a normal node, nothing to deserialize but reassign
			var realNode = node.firstChild;
			node.removeChild(realNode);
			this[name] = realNode;
			this.addNonMorph(realNode);
			return
		}
		
		this[name] = this.deserializeValueFromNode(importer, node);
	},

	deserializeRelayFromNode: function(importer, node) {
	   var spec = {};
		$A(node.getElementsByTagName("binding")).forEach(function(elt) {
			var key = elt.getAttributeNS(null, "formal");
			var value = elt.getAttributeNS(null, "actual");
			spec[key] = value;
		});
		var name = LivelyNS.getAttribute(node, "name");
		if (name) {
			var relay = this[name] = Relay.newInstance(spec, null);
			var ref = LivelyNS.getAttribute(node, "ref");
			importer.addPatchSite(relay, "delegate", ref);
		}
		node.parentNode.removeChild(node);
	},
	
	deserializeRecordFromNode: function(importer, node) { 
		var spec = JSON.unserialize(node.getElementsByTagName("definition")[0].textContent);
		var Rec = lively.data.DOMNodeRecord.prototype.create(spec);
		var model = new Rec(importer, node);
		var id = node.getAttribute("id");
		if (id) importer.addMapping(id, model); 
		this.actualModel = model;
	},
	
	deserializeArrayFromNode: function(importer, node) {
		var name = LivelyNS.getAttribute(node, "name");
		this[name] = [];
		var index = 0;
		$A(node.getElementsByTagName("item")).forEach(function(elt) {
			var ref = LivelyNS.getAttribute(elt, "ref");
			if (ref) {
				importer.addPatchSite(this, name, ref, index);
			} else {
				// rk 3/22/10 node instead of elt was used, was that a bug?
				this[name].push(this.deserializeValueFromNode(importer, elt));
			}
			index ++;
		}, this);
	},

	resolveUriToObject: function(uri) {
		if (this.id() == uri)
			return this;
		return null
	}

});

Object.extend(lively.data.Wrapper, {
	getEncodedType: function(node) { // this should be merged with getType
		var id = node.getAttribute("id");
		return id && id.split(":")[1];
	},

	isInstance: function(m) {
		return m instanceof lively.data.Wrapper || m instanceof lively.data.DOMRecord;
	}

});


/* Garbage Collection */

lively.data.Wrapper.addMethods({
	removeGarbageRelayNodes: function() {
		$A(this.rawNode.childNodes).each(function(ea) {
			if(ea.tagName == "relay")
				this.rawNode.removeChild(ea)
		}, this)	
	},

	removeGarbageFromRawNode: function() {
		"WorldMorph.current().removeGarbageFromRawNode()"
		this.removeGarbageRelayNodes();
		this.submorphs.each(function(ea) {
			ea.removeGarbageFromRawNode()
		})
	}
	
});

lively.data.Wrapper.addMethods({
	collectAllUsedFills: function(result) {
		// do nothing
		return result || [];
	},
});

Object.extend(lively.data.Wrapper, {

	collectAllFillsInObjects: function(objects, result) {
		result = result || [];
		var self = this;
		objects.each(function(ea) {
			self.collectAllFillsInObject(ea, result);
		})
		return result		
	},

	collectAllFillsInObject: function(object, result) {
		result = result || [];
		if (!object)
			return result;
		Properties.forEachOwn(object, function(key, value) { 
			// console.log("key " + key + " value" + value)
			if (value && value instanceof lively.paint.Gradient) {
				result.push(value)
			}
		});

		// we could walkup all properties in all objects recursivly...
		// but that may take some time (measure it?)
		// lookup static fills in classes
		if (object.prototype) {
			this.collectAllFillsInObject(object.prototype, result)
		};

		// look into the style object
		if (object.style) {
			this.collectAllFillsInObject(object.style, result)
		};

		return result
	},

	collectSystemDictionaryGarbage: function(rootMorph) {
		"lively.data.Wrapper.collectSystemDictionaryGarbage()"
		if (!rootMorph)
			rootMorph = WorldMorph.current();
		var fills = [];
		this.collectAllFillsInObjects(Object.values(Global), fills);
		rootMorph.collectAllUsedFills(fills)
		var usedFillIds = fills.collect(function(ea){return ea.id()});
		var dict = rootMorph.dictionary();
		$A(dict.childNodes).each(function(ea) {
			// console.log("GC considering " + ea)
			if(['linearGradient', 'radialGradient'].include(ea.tagName) && !usedFillIds.include(ea.id)) {
				// console.log("SystemDictionary GC: remove " + ea)
				dict.removeChild(ea)
			}
		});
	},
});

Object.extend(Object.subclass('lively.data.FragmentURI'), {
	parse: function(string) {
		var match = string && string.match("url\\(#(.*)\\)");
		return match && match[1];
		// 'ur(#fragmentURI)'
		//return string.substring(5, string.length - 1);
	},

	fromString: function(id) {
		return "url(#" + id + ")";
	},

	getElement: function(string) {
		var id = this.parse(string);
		return id && Global.document.getElementById(id);
	}
});

// See http://www.w3.org/TR/css3-values/
// and http://www.w3.org/TR/CSS2/syndata.html#values	

Object.extend(Object.subclass('lively.data.Length'), {

	parse: function(string) {
	// FIXME: handle units
	return parseFloat(string);
	}
});


Object.extend(lively.data.Length.subclass('lively.data.Coordinate'), {
	parse: function(string) {
	// FIXME: handle units
	return parseFloat(string);
	}
});

using(namespace('lively.scene'), lively.data.Wrapper).run(function(unused, Wrapper) {

function locateCanvas() {
	// dirty secret
	return Global.document.getElementById("canvas");
}

Wrapper.subclass('lively.scene.Node');
	
this.Node.addProperties({ 
	FillOpacity: { name: "fill-opacity", from: Number, to: String, byDefault: 1.0},
	StrokeOpacity: { name: "stroke-opacity", from: Number, to: String, byDefault: 1.0},
	StrokeWidth: { name: "stroke-width", from: Number, to: String, byDefault: 1.0},
	LineJoin: {name: "stroke-linejoin"},
	LineCap: {name: "stroke-linecap"},
	StrokeDashArray: {name: "stroke-dasharray"},
	StyleClass: {name: "class"}
}, Config.useStyling ? lively.data.StyleRecord : lively.data.DOMRecord);

this.Node.addMethods({	 

	documentation:	"Objects that can be located on the screen",
	//In this particular implementation, graphics primitives are
	//mapped onto various SVG objects and attributes.

	rawNode: null, // set by subclasses

	setBounds: function(bounds) { 
		//copy uses this, so throwing is not nice
    	console.warn('Node: setBounds unsupported on type ' + this.getType());
		// throw new Error('setBounds unsupported on type ' + this.getType());
	},

	copyFrom: function($super, copier, other) {
		$super(copier, other);
		this._fill = other._fill;

		if (this._fill instanceof lively.paint.Gradient) {
			this._fill.reference();
		}
		this._stroke = other._stroke;
		if (this._stroke instanceof lively.paint.Gradient) {
			this._stroke.reference();
		}
	},

	deserialize: function($super, importer, rawNode) {
		$super(importer, rawNode);
		var attr = rawNode.getAttributeNS(null, "fill");
		var url = lively.data.FragmentURI.parse(attr);
		if (url) {
			// FIXME
			//this._fill = lively.data.FragmentURI.getElement(fillAttr);
		} else {
			this._fill = Color.fromString(attr);
		}

		attr = rawNode.getAttributeNS(null, "stroke");
		url = lively.data.FragmentURI.parse(attr);
		if (url) {
			// FIXME
			//this._stroke = lively.data.FragmentURI.getElement(fillAttr);
		} else {
			this._stroke = Color.fromString(attr);
		}
	},

	canvas: function() {
		if (!UserAgent.usableOwnerSVGElement) {
			// so much for multiple worlds on one page
			return locateCanvas();
		} else {
			return (this.rawNode && this.rawNode.ownerSVGElement) || locateCanvas();
		}
	},

	nativeContainsWorldPoint: function(p) {
		var r = this.canvas().createSVGRect();
		r.x = p.x;
		r.y = p.y;
		r.width = r.height = 0;
		return this.canvas().checkIntersection(this.rawNode, r);
	},

	setVisible: function(flag) {
		if (flag) this.rawNode.removeAttributeNS(null, "display");
		else this.rawNode.setAttributeNS(null, "display", "none");
		return this;
	},

	isVisible: function() {
		// Note: this may not be correct in general in SVG due to inheritance,
		// but should work in LIVELY.
		var hidden = this.rawNode.getAttributeNS(null, "display") == "none";
		return hidden == false;
	},

	applyFilter: function(filterUri) {
		// deprecated
		if (filterUri) 
			this.rawNode.setAttributeNS(null, "filter", filterUri);
		else
			this.rawNode.removeAttributeNS(null, "filter");
	},

	translateBy: function(displacement) {
		// todo
	},

	setFill: function(paint) {
		if ((this._fill !== paint) && (this._fill instanceof lively.paint.Gradient)) {
			this._fill.dereference();
		}
		this._fill = paint;
		if (paint === undefined) {
			this.rawNode.removeAttributeNS(null, "fill");
		} else if (paint === null) {
			this.rawNode.setAttributeNS(null, "fill", "none");
		} else if (paint instanceof Color) {
			this.rawNode.setAttributeNS(null, "fill", String(paint));
		} else if (paint instanceof lively.paint.Gradient) {
			paint.reference();
			this.rawNode.setAttributeNS(null, "fill", paint.uri());
		} else {
			throw dbgOn(new TypeError('cannot deal with paint ' + paint));
		}
	},

	getFill: function() {
		// hack
		if (this._fill || this._fill === null)
			return this._fill;
		var attr = this.rawNode.getAttribute('fill');
		if (!attr) { 
			false && console.log("Didn't find fill for " + this); return null; 
		};
		var rawFill = lively.data.FragmentURI.getElement(attr);
		if (!rawFill) { 
			false && console.log("Didn't find fill for " + this); return null; 
		};
		var klass = lively.data.Wrapper.getEncodedType(rawFill);
		klass = Class.forName(klass) || Class.forName('lively.paint.' + klass);
		if (!klass) { 
			false && console.log("Didn't find fill for " + this); return null; 
		};
		var importer = new Importer();
		//dbgOn(true);
		this._fill = new klass(importer, rawFill);
		return this._fill;
	},
	
	setStroke: function(paint) {
		if ((this._stroke !== paint) && (this._stroke instanceof lively.paint.Gradient)) {
			this._stroke.dereference();
		}
		this._stroke = paint;
		if (paint === undefined) {
			this.rawNode.removeAttributeNS(null, "stroke");
		} else if (paint === null) {
			this.rawNode.setAttributeNS(null, "stroke", "none");
		} else if (paint instanceof Color) {
			this.rawNode.setAttributeNS(null, "stroke", String(paint));
		} else if (paint instanceof lively.paint.Gradient) {
			paint.reference();
			this.rawNode.setAttributeNS(null, "stroke", paint.uri());
		} else throw dbgOn(new TypeError('cannot deal with paint ' + paint));
	},

	getStroke: function() {
		return this._stroke;
	},

	getTransforms: function() {
		if (!this.cachedTransforms) {
			var list = this.rawNode.transform.baseVal;
			var array = this.cachedTransforms = new Array(list.numberOfItems);
  		reflect(this).slotAt('cachedTransforms').setInitializationExpression('undefined'); // aaa hack? -- Adam
			for (var i = 0; i < list.numberOfItems; i++) {
				// FIXME: create specialized classes (Rotate/Translate etc)
				array[i] = new lively.scene.Transform(list.getItem(i), this);
			}
		}
		return this.cachedTransforms;
	},

	setTransforms: function(array) {
		var useDOM = Config.useTransformAPI;
		if (useDOM) {
			var list = this.rawNode.transform.baseVal;
			list.clear();
		}
		this.cachedTransforms = array;
		reflect(this).slotAt('cachedTransforms').setInitializationExpression('undefined'); // aaa hack? -- Adam
		for (var i = 0; i < array.length; i++) {
			var existingTargetNode = array[i].targetNode;
			if (existingTargetNode && existingTargetNode !== this) 
				console.warn('reusing transforms? not good');
			array[i].targetNode = this;
			useDOM && list.appendItem(array[i].rawNode);
		}
		useDOM || this.rawNode.setAttributeNS(null, "transform" , array.invoke('toString').join(' '));

	},

	transformListItemChanged: function(tfm) {  // note that Morph has transformChanged (singular)
		if (!Config.useTransformAPI) {
			//console.log('changed ' + tfm + ' on ' + this);
			var array = this.cachedTransforms;
			if (array) {
				//(array.indexOf(tfm) < 0) && console.warn('cached transforms not set? passing ' + tfm);
				this.rawNode.setAttributeNS(null, "transform" , array.invoke('toString').join(' '));
			} 
		}
	}
});

// FIXME: unfortunate aliasing for FX, should be removed (Bind doesn't translate accessors properly)
this.Node.addMethods({
	setstroke: lively.scene.Node.prototype.setStroke,
	setfill: lively.scene.Node.prototype.setFill,
	setfillOpacity: lively.scene.Node.prototype.setFillOpacity,
	setvisible: lively.scene.Node.prototype.setVisible
});


// ===========================================================================
// Shape functionality
// ===========================================================================

// Shapes are portable graphics structures that are used for isolating
// the implementation details of the underlying graphics architecture from
// the programmer.	Each Morph in our system has an underlying Shape object
// that maps the behavior of the Morph to the underlying graphics system
// in a fully portable fashion.


this.Node.subclass('lively.scene.Shape', {

	shouldIgnorePointerEvents: false,
	controlPointProximity: 10,
	hasElbowProtrusions: false,

	toString: function() {
		return Strings.format("a Shape(%s,%s)", this.getType(), this.bounds());
	},

	initialize: function() {
		if (this.shouldIgnorePointerEvents) this.ignoreEvents();
	},


	applyFunction: function(func,arg) { 
		func.call(this, arg); 
	},

	toPath: function() {
		throw new Error('unimplemented');
	},

	origin: function() {
		return this.bounds().topLeft();
	}
});


 Object.extend(this.Shape, {
	 // merge with Import.importWrapperFromNode?
	 importFromNode: function(importer, node) {
		switch (node.localName) {
			case "ellipse":
				return new lively.scene.Ellipse(importer, node);
				break;
			case "rect":
				return new lively.scene.Rectangle(importer, node);
				break;
			case "polyline":
				return new lively.scene.Polyline(importer, node);
				break;
			case "polygon":
				return new lively.scene.Polygon(importer, node);
				break;
			case "path":
				return new lively.scene.Path(importer, node);
				break;
			case "g":
				return new lively.scene.Group(importer, node);
				break;
			default:
				return null;
		}
	 },

	fromLiteral: function(node, literal) {
		// axiliary
		if (literal.stroke !== undefined) node.setStroke(literal.stroke);
		node.setStrokeWidth(literal.strokeWidth === undefined ? 1 : literal.strokeWidth);
		if (literal.fill !== undefined) node.setFill(literal.fill);
		if (literal.fillOpacity !== undefined) node.setFillOpacity(literal.fillOpacity);
		if (literal.strokeLineCap !== undefined) node.setLineCap(literal.strokeLineCap);

		if (literal.transforms !== undefined) node.setTransforms(literal.transforms);

		return node;
	}
});

Object.extend(this,	 { 
	LineJoins: Class.makeEnum(["Miter", "Round", "Bevel" ]), // note that values become attribute values
	LineCaps:  Class.makeEnum(["Butt",	"Round", "Square"])	 // likewise	
});

this.Shape.subclass('lively.scene.Rectangle', {

	documentation: "Rectangle shape",

	initialize: function($super, rect) {
		$super();
		this.rawNode = NodeFactory.create("rect");
		
    if (!avocado.shouldBreakCreatorSlotsInOrderToImprovePerformance) {
		  reflect(this).slotAt('rawNode').beCreator(); // aaa - kind of a hack, added by Adam so that we can file out morphs
	  }
	  
		this.setBounds(rect || new Rectangle(0, 0, 0, 0));
		return this;
	},

	setBounds: function(r) {
		dbgOn(!r);
		this.setLengthTrait("x", r.x);
		this.setLengthTrait("y", r.y);
		this.setLengthTrait("width", Math.max(0, r.width));
		this.setLengthTrait("height", Math.max(0, r.height));
		return this;
	},

	toPath: function() {
		// FIXME account for rounded edges
		return new lively.scene.Path(this.bounds());
	},

	bounds: function() {
		var x = this.rawNode.x.baseVal.value;
		var y = this.rawNode.y.baseVal.value;
		var width = this.rawNode.width.baseVal.value;
		var height = this.rawNode.height.baseVal.value;
		return new Rectangle(x, y, width, height);
	},

	translateBy: function(displacement) {
		this.setLengthTrait("x", this.getLengthTrait("x") + displacement.x);
		this.setLengthTrait("y", this.getLengthTrait("y") + displacement.y);
	},


	vertices: function() {
		var b = this.bounds();
		return [b.topLeft(), b.topRight(), b.bottomLeft(), b.bottomRight()];
	},

	containsPoint: function(p) {
		var x = this.rawNode.x.baseVal.value;
		var width = this.rawNode.width.baseVal.value;
		if (!(x <= p.x && p.x <= x + width))
			return false;
		var y = this.rawNode.y.baseVal.value;
		var height = this.rawNode.height.baseVal.value;
		return y <= p.y && p.y <= y + height;
	},

	reshape: function(partName,newPoint, ignored) {
		var r = this.bounds().withPartNamed(partName, newPoint);
		this.setBounds(r);
	},

	partNameNear: function(p) {
		return this.bounds().partNameNear(Rectangle.corners, p, this.controlPointProximity);
	},

	allPartNames: function() {return Rectangle.corners; },


	partPosition: function(partName) {
		return this.bounds().partNamed(partName);
	},

	getBorderRadius: function() {
		return this.getLengthTrait("rx") || 0;
	},

	// consider arcWidth and arcHeight instead
	roundEdgesBy: function(r) {
		if (r) {
			this.setLengthTrait("rx", r);
			this.setLengthTrait("ry", r);
			var w = this.getStrokeWidth();	// DI:	Needed to force repaint(!)
			this.setStrokeWidth(w+1); 
			this.setStrokeWidth(w); 
		}
		return this;
	}
});


Object.extend(this.Rectangle, {
	fromLiteral: function(literal) {
		var x = literal.x || 0.0;
		var y = literal.y || 0.0;
		var width = literal.width || 0.0;
		var height = literal.height || 0.0;

		var node = new lively.scene.Rectangle(new Rectangle(x, y, width, height));
		lively.scene.Shape.fromLiteral(node, literal);
		if (literal.arcWidth !== undefined) node.roundEdgesBy(literal.arcWidth/2);
		return node;
	}
});


this.Shape.subclass('lively.scene.Ellipse', {

	documentation: "Ellipses and circles",

	initialize: function($super /*,rest*/) {
		$super();
		this.rawNode = NodeFactory.create("ellipse");
		reflect(this).slotAt('rawNode').beCreator(); // aaa - kind of a hack, added by Adam so that we can file out morphs
		switch (arguments.length) {
			case 2:
				this.setBounds(arguments[1]);
				break;
			case 3:
				this.setBounds(arguments[1].asRectangle().expandBy(arguments[2]));
				break;
			default:
				throw new Error('bad arguments ' + $A(arguments));
		}
	},

	setBounds: function(r) {
		this.setLengthTrait("cx", r.x + r.width/2);
		this.setLengthTrait("cy", r.y + r.height/2);
		this.setLengthTrait("rx", r.width/2);
		this.setLengthTrait("ry", r.height/2);
		return this;
	},

	center: function() {
		return pt(this.rawNode.cx.baseVal.value, this.rawNode.cy.baseVal.value);
	},

	origin: function() {
		return this.center();
	},

	// For ellipses, test if x*x + y*y < r*r
	containsPoint: function(p) {
		var w = this.rawNode.rx.baseVal.value * 2;
		var h = this.rawNode.ry.baseVal.value * 2;
		var c = pt(this.rawNode.cx.baseVal.value, this.rawNode.cy.baseVal.value);
		var dx = Math.abs(p.x - c.x);
		var dy = Math.abs(p.y - c.y)*w/h;
		return (dx*dx + dy*dy) <= (w*w/4) ; 
	},


	bounds: function() {
		//console.log("rawNode " + this.rawNode);
		var w = this.rawNode.rx.baseVal.value * 2;
		var h = this.rawNode.ry.baseVal.value * 2; 
		var x = this.rawNode.cx.baseVal.value - this.rawNode.rx.baseVal.value;
		var y = this.rawNode.cy.baseVal.value - this.rawNode.ry.baseVal.value;
		return new Rectangle(x, y, w, h);
	}, 

	translateBy: function(displacement) {
		this.setLengthTrait("cx", this.getLengthTrait("cx") + displacement.x);
		this.setLengthTrait("cy", this.getLengthTrait("cy") + displacement.y);
	},

	vertices: function() {
		var b = this.bounds();
		var coeff = 4;
		var dx = b.width/coeff;
		var dy = b.height/coeff;
		// approximating by an octagon
		return [b.topCenter().addXY(-dx,0), b.topCenter().addXY(dx ,0),
		b.rightCenter().addXY(0, -dy), b.rightCenter().addXY(0, dy),
		b.bottomCenter().addXY(dx, 0), b.bottomCenter().addXY(-dx, 0),
		b.leftCenter().addXY(0, dy), b.leftCenter().addXY(0, -dy)];
	},

	partNameNear: function(p) {
		return this.bounds().partNameNear(Rectangle.sides, p, this.controlPointProximity);
	},
allPartNames: function() {return Rectangle.sides; },


	reshape: this.Rectangle.prototype.reshape,
	partPosition: this.Rectangle.prototype.partPosition

});

Object.extend(this.Ellipse, {
	fromLiteral: function(literal) {
		var node = new lively.scene.Ellipse(pt(literal.centerX || 0.0, literal.centerY || 0.0), literal.radius);
		lively.scene.Shape.fromLiteral(node, literal);
		return node;
	}
});



this.Shape.subclass('lively.scene.Polygon', {
	documentation: "polygon",

	hasElbowProtrusions: true,
	useDOM: false,

	initialize: function($super, vertlist) {
		this.rawNode = NodeFactory.create("polygon");
		reflect(this).slotAt('rawNode').beCreator(); // aaa - kind of a hack, added by Adam so that we can file out morphs
		this.setVertices(vertlist);
		$super();
		return this;
	},

	copyFrom: function($super, copier, other) {
		$super(copier, other);
		this.setVertices(other.vertices());
	},

	setVertices: function(vertlist) {
		if (this.rawNode.points) {
			this.rawNode.points.clear();
		}
		if (this.useDOM) vertlist.forEach(function(p) { this.rawNode.points.appendItem(p) }, this);
		else this.rawNode.setAttribute("points",
		vertlist.map(function (p) { return (p.x||0.0) + "," + (p.y||0.0) }).join(' '));
	},

	vertices: function() {
		var array = [];
		for (var i = 0; i < this.rawNode.points.numberOfItems; i++) {
			var item = this.rawNode.points.getItem(i);
			array.push(Point.ensure(item));
		}
		return array;
	},

	translateBy: function(displacement) {
		var array = [];
		for (var i = 0; i < this.rawNode.points.numberOfItems; i++) {
			var item = this.rawNode.points.getItem(i);
			array.push(Point.ensure(item).addPt(displacement));
		}
		this.setVertices(array);
	},

	toString: function() {
		var pts = this.vertices();
		return this.rawNode.tagName + "[" + pts + "]";
	},


	bounds: function() {
		// FIXME very quick and dirty, consider caching or iterating over this.points
		var vertices = this.vertices();
		// Opera has been known not to update the SVGPolygonShape.points property to reflect the SVG points attribute
		console.assert(vertices.length > 0, 
			"lively.scene.Polygon.bounds: vertices has zero length, " + this.rawNode.points 
			+ " vs " + this.rawNode.getAttributeNS(null, "points"));
			return Rectangle.unionPts(vertices);
	},

	origin: function() {
		// no natural choice to pick the origin of a polgon/polyline
		return pt(0, 0);
	},

	reshape: function(ix, newPoint, lastCall) {
		// See the comment in allPartNames
		// Here we decode the "partName" index to select a vertex, midpoint or control point
		// and then replace that point with newPoint, and update the shape

		// ix is an index into vertices
		var verts = this.vertices();  // less verbose
		if (ix < 0) { // negative means insert a vertex
			ix = -ix;
			verts.splice(ix, 0, newPoint);
			this.setVertices(verts);
			return; // undefined result for insertion 
		}
		var closed = verts[0].eqPt(verts[verts.length - 1]);
		if (closed && ix == 0) {  // and we're changing the shared point (will always be the first)
			verts[0] = newPoint;  // then change them both
			verts[verts.length - 1] = newPoint; 
		} else {
			verts[ix] = newPoint;
		}

		var shouldMerge = false;
		var howClose = 6;
		if (verts.length > 2) {
			// if vertex being moved is close to an adjacent vertex, make handle show it (red)
			// and if its the last call (mouse up), then merge this with the other vertex
			if (ix > 0 && verts[ix - 1].dist(newPoint) < howClose) {
				if (lastCall) { 
					verts.splice(ix, 1); 
					if (closed) verts[0] = verts[verts.length - 1]; 
				} else {
					shouldMerge = true;
				} 
			}

			if (ix < verts.length - 1 && verts[ix + 1].dist(newPoint) < howClose) {
				if (lastCall) { 
					verts.splice(ix, 1); 
					if (closed) verts[verts.length - 1] = verts[0];
				} else {
					shouldMerge = true;
				} 
			}
		}
		this.setVertices(verts); 
		return shouldMerge;
	},

	partNameNear: function(p) {
		var codes = this.allPartNames();
		for (var i=0; i<codes.length; i++)
			if (this.partPosition(codes[i]).dist(p) < this.controlPointProximity) return codes[i];
		return null;
	},
allPartNames: function() {
		// Note: for reshaping of polygons and lines, the "partNames" are
		//  integer codes with the following meaning...
		//	0...(N-1)  -- the N vertices themselves
		//	-1...-N  -- negative of the line segment index for inserting a new vertex
		//  This scheme may also be extended to curves as follows...
		//	N...(2N-1)  -- first control point for the given (i-N)-th line segment
		//  2N...(3N-1)  -- second control point for the (i-2N)-th line segment
		// This encoding scheme is shared also by partPosition() and reshape()

		var verts = this.vertices();
		var locs = [];
		for (var i = 0; i < verts.length; i++) { locs.push(i); };  // vertices

		var nLines = verts.length-1;
		// Some polygons have last point = first; some don't
		if ((this instanceof lively.scene.Polygon) && !verts.first().eqPt(verts.last())) nLines = verts.length;
		for (var i = 0; i < nLines; i++) { locs.push(-(i + 1)); };  // midpoints
		return locs; 
	},


	// borrowed from http://local.wasp.uwa.edu.au/~pbourke/geometry/insidepoly/
	containsPoint: function(p) {
		var counter = 0;
		var vertices = this.vertices();
		var p1 = vertices[0];
		for (var i = 1; i <= vertices.length; i++) {
			var p2 = vertices[i % vertices.length];
			if (p.y > Math.min(p1.y, p2.y)) {
				if (p.y <= Math.max(p1.y, p2.y)) {
					if (p.x <= Math.max(p1.x, p2.x)) {
						if (p1.y != p2.y) {
							var xinters = (p.y-p1.y)*(p2.x-p1.x)/(p2.y-p1.y)+p1.x;
							if (p1.x == p2.x || p.x <= xinters)
								counter ++;
						}
					}
				}
			}
			p1 = p2;
		}

		if (counter % 2 == 0) {
			return false;
		} else {
			return true;
		}
	},

	partPosition: function(partName) {
		// See the comment in allPartNames
		// Here we decode the "partName" index to select a vertex, midpoint or control point
		var verts = this.vertices();
		if (partName >= 0) return verts[partName];
		// Case of midpoint of last segment when first vertex is not duplicated
		if (-partName > (verts.length-1)) return verts[-partName - 1].midPt(verts[0]); 
		return verts[-partName].midPt(verts[-partName - 1]); 
	}

});

Object.extend(this.Polygon, {
	fromLiteral: function(literal) {
		return lively.scene.Shape.fromLiteral(new lively.scene.Polygon(literal.points), literal);
	}
});

lively.scene.Shape.subclass('lively.scene.Polyline', {
	documentation: "Like polygon but not necessarily closed and does not include the interior",

	hasElbowProtrusions: true,

	initialize: function($super, vertlist) {
		this.rawNode = NodeFactory.create("polyline");
		reflect(this).slotAt('rawNode').beCreator(); // aaa - kind of a hack, added by Adam so that we can file out morphs
		this.setVertices(vertlist);
		$super();
	},

	containsPoint: function(p) {
		var howNear = 6;
		var vertices = this.vertices();
		for (var i = 1; i < vertices.length; i++) {
			var pNear = p.nearestPointOnLineBetween(vertices[i-1], vertices[i]);
			if (pNear.dist(p) < howNear) {
				return true; 
			}
		}
		return false; 
	},

	setStartX: function(x) {
		var v = this.vertices();
		var first = v.first();
		v.splice(0, 1, first.withX(x));
		this.setVertices(v);
	},

	setStartY: function(y) {
		var v = this.vertices();
		var first = v.first();
		v.splice(0, 1, first.withY(y));
		this.setVertices(v);
	},

	setEndX: function(x) {
		var v = this.vertices();
		var last = v.last();
		v.splice(-1, 1, last.withX(x));
		this.setVertices(v);
	},

	setEndY: function(y) {
		var v = this.vertices();
		var last = v.last();
		v.splice(-1, 1, last.withY(y));
		this.setVertices(v);
	},

	addPoint: function(point) {
		// FIXME can this be done more efficiently? certainly...
		this.setVertices(this.vertices().concat(point));
	},
	
	// poorman's traits :)
	bounds: this.Polygon.prototype.bounds,
	origin: this.Polygon.prototype.origin,
	vertices: this.Polygon.prototype.vertices,
	setVertices: this.Polygon.prototype.setVertices,
	reshape: this.Polygon.prototype.reshape,
	partNameNear: this.Polygon.prototype.partNameNear,
allPartNames: this.Polygon.prototype.allPartNames,

	partPosition: this.Polygon.prototype.partPosition,
	translateBy: this.Polygon.prototype.translateBy
});

Object.extend(this.Polyline, {
	fromLiteral: function(literal) {
	return lively.scene.Shape.fromLiteral(new lively.scene.Polyline(literal.points), literal);
	}
});

this.Line = { // sugar syntax
	fromLiteral: function(literal) {
		var pts = [
			pt(literal.StartX || 0.0, literal.StartY || 0.0),
			pt(literal.EndX || 0.0, literal.EndY || 0.0)];
		// FIXME more efficient?
		return lively.scene.Polyline.fromLiteral(Object.extend(literal, {points: pts}));
	}
};


// --------------------
// --------- Paths ----
// --------------------
// see http://www.w3.org/TR/SVG/paths.html
Wrapper.subclass('lively.scene.PathElement', {
	initialize: function(isAbsolute) {
		this.isAbsolute = isAbsolute;
	},
	realCharCode: function() {
		return this.isAbsolute ? this.charCode.toUpperCase() : this.charCode.toLowerCase();
	},
	attributeFormat: function() {
		throw new Error('subclass responsiblity');
	},
	translate:function(x, y, force) {
		throw new Error('subclass responsiblity (' + this.constructor.type + ')');
	},
	toString: function() { return 'PathElement("' + this.attributeFormat() + '")' },
});

Object.extend(lively.scene.PathElement, {
	parse: function(data) {
		var
			splitNumberRegex = /[\s*,\s*]+/,
			splitTypeAndNumberRegex = /(NaN|[^a-df-zA-Z]+)?([A-Za-df-z])?(NaN|[^a-df-zA-Z]+)?/,
			typeTestRegex = /[a-df-zA-Z]/,
			typeAbsTestRegex = /[A-Z]/;

		// split number pairs
		var chunks = data.split(splitNumberRegex);
		// split up types
		chunks = chunks.inject([], function(all, chunk) {
			var splitted = splitTypeAndNumberRegex.exec(chunk);
			if (!splitted) return all;
			if (splitted[1] !== undefined)
				all.push(splitted[1]);
			if (splitted[2] !== undefined)
				all.push(splitted[2]);
			if (splitted[3] !== undefined)
				all.push(splitted[3]);
			return all;
		});
console.log(chunks)
		// create PathElement objects from splitted data
		var
			pathElementClasses = lively.scene.PathElement.allSubclasses(),
			pathElements = [],
			klass = null,
			currentChunks = [],
			isAbsolute;
		while (chunks.length > 0) {
			var chunk = chunks.shift()
			if (typeTestRegex.test(chunk)) {
				isAbsolute = typeAbsTestRegex.test(chunk);
				var klass = pathElementClasses.detect(function(klass) {
					return klass.prototype.charCode == chunk.toUpperCase();
				});
				if (!klass)
					throw dbgOn(new Error('Trying to parse SVG path elements. No support for ' + chunk));
			} else {
				currentChunks.push(Number(chunk) || 0);
			};
			if (currentChunks.length == klass.dataLength) {
				pathElements.push(klass.create(isAbsolute, currentChunks));
				currentChunks = [];
			}
		}
		return pathElements;
	},	
});

this.PathElement.subclass('lively.scene.MoveTo', {
	charCode: 'M',

	initialize: function($super, isAbsolute, x, y) {
		$super(isAbsolute);
		this.x = x;
		this.y = y;
	},

	allocateRawNode: function(rawPathNode) {
		this.rawNode = this.isAbsolute ?
			rawPathNode.createSVGPathSegMovetoAbs(this.x, this.y) :
			rawPathNode.createSVGPathSegMovetoRel;
		return this.rawNode;
	},

	controlPoints: function() {
		return [pt(this.x, this.y)];
	},
	
	attributeFormat: function() {
		return this.realCharCode() + this.x + "," + this.y;
	},
	
	translate:function(x, y, force) {
		if (!this.isAbsolute && !force) return;
		this.x += x;
		this.y += y;
	},
});
Object.extend(lively.scene.MoveTo, {
	fromLiteral: function(literal) {
		return new lively.scene.MoveTo(literal.isAbsolute, literal.x || 0.0, literal.y || 0.0);
	},
	parse: function(data) {
		var codeExtractor = /([A-Za-z])\s?(-?[0-9]+(?:.[0-9]+)?|NaN),(-?[0-9]+(?:.[0-9]+)?|NaN)/;
	},
	dataLength: 2,
	create: function(isAbsolute, arr) {
		return new this(isAbsolute, arr[0], arr[1])
	},
});


this.PathElement.subclass('lively.scene.LineTo', {
	charCode: 'L',
	initialize: function($super, isAbsolute, x, y) {
		$super(isAbsolute);
		this.x = x;
		this.y = y;
	},

	allocateRawNode: function(rawPathNode) {
		this.rawNode = this.isAbsolute ?
			rawPathNode.createSVGPathSegLinetoAbs(this.x, this.y) :
			rawPathNode.createSVGPathSegLinetoRel(this.x, this.y);
		return this.rawNode;
	},

	controlPoints: function() {
		return [pt(this.x, this.y)];
	},
	
	attributeFormat: function() {
		return this.realCharCode() + this.x + "," + this.y;
	},
	
	translate:function(x, y, force) {
		if (!this.isAbsolute && !force) return;
		this.x += x;
		this.y += y;
	},
});
Object.extend(lively.scene.LineTo, {
	fromLiteral: function(literal) {
		return new lively.scene.LineTo(literal.isAbsolute, literal.x || 0.0, literal.y || 0.0);
	},
	dataLength: 2,
	create: function(isAbsolute, arr) {
		return new this(isAbsolute, arr[0], arr[1])
	},
});


this.PathElement.subclass('lively.scene.HorizontalTo', {
	charCode: 'H',
	initialize: function($super, isAbsolute, x) {
		$super(isAbsolute);
		this.x = x;
	},

	allocateRawNode: function(rawPathNode) {
		this.rawNode = this.isAbsolute ?
			rawPathNode.createSVGPathSegLinetoHorizontalAbs(this.x) :
			rawPathNode.createSVGPathSegLinetoHorizontalRel(this.x);
		return this.rawNode;
	},

	controlPoints: function() {
		return [];
	},
	
	attributeFormat: function() {
		return this.realCharCode() + this.x;
	},
	translate:function(x, y, force) {
		if (!this.isAbsolute && !force) return;
		this.x += x;
	},
});
Object.extend(lively.scene.HorizontalTo, {
	fromLiteral: function(literal) {
		return new lively.scene.HorizontalTo(literal.isAbsolute, literal.x || 0.0);
	},
	dataLength: 1,
	create: function(isAbsolute, arr) {
		return new this(isAbsolute, arr[0])
	},
});


this.PathElement.subclass('lively.scene.VerticalTo', {
	charCode: 'V',
	initialize: function($super, isAbsolute, y) {
		$super(isAbsolute);
		this.y = y;
	},

	allocateRawNode: function(rawPathNode) {
		this.rawNode = this.isAbsolute ?
			rawPathNode.createSVGPathSegLinetoVerticalAbs(this.y) :
			rawPathNode.createSVGPathSegLinetoVerticalRel(this.y);
		return this.rawNode;
	},

	controlPoints: function() {
		return [];
	},
	
	attributeFormat: function() {
		return this.realCharCode() + this.y;
	},
	
	translate:function(x, y, force) {
		if (!this.isAbsolute && !force) return;
		this.y += y;
	},
});
Object.extend(lively.scene.VerticalTo, {
	fromLiteral: function(literal) {
		return new lively.scene.VerticalTo(literal.isAbsolute, literal.y || 0.0);
	},
	dataLength: 1,
	create: function(isAbsolute, arr) {
		return new this(isAbsolute, arr[0])
	},
});


this.PathElement.subclass('lively.scene.CurveTo', {

	charCode: 'T', // shouldn't it be the S type anyway?

	initialize: function($super, isAbsolute, x, y) {
		$super(isAbsolute);
		this.x = x;
		this.y = y;
	},

	allocateRawNode: function(rawPathNode) {
		this.rawNode = this.isAbsolute ?
			rawPathNode.createSVGPathSegCurvetoQuadraticSmoothAbs(this.x, this.y) :
			rawPathNode.createSVGPathSegCurvetoQuadraticSmoothRel(this.x, this.y);
		return this.rawNode;
	},

	controlPoints: function() {
		return [pt(this.x, this.y)];
	},
	
	attributeFormat: function() {
		return this.realCharCode() + this.x + "," + this.y;
	},
	
	translate:function(x, y, force) {
		if (!this.isAbsolute && !force) return;
		this.x += x;
		this.y += y;
	},
});
Object.extend(lively.scene.CurveTo, {
	fromLiteral: function(literal) {
		return new lively.scene.CurveTo(literal.isAbsolute, literal.x || 0.0, literal.y || 0.0);
	},
	dataLength: 2,
	create: function(isAbsolute, arr) {
		return new this(isAbsolute, arr[0], arr[1])
	},
});

this.PathElement.subclass('lively.scene.QuadCurveTo', {

	charCode: 'Q',

	initialize: function($super, isAbsolute, x, y, controlX, controlY) {
		$super(isAbsolute);
		this.x = x;
		this.y = y;
		this.controlX = controlX;
		this.controlY = controlY;
	},

	allocateRawNode: function(rawPathNode) {
		this.rawNode = this.isAbsolute ?
			rawPathNode.createSVGPathSegCurvetoQuadraticAbs(this.x, this.y, this.controlX, this.controlY) :
			rawPathNode.createSVGPathSegCurvetoQuadraticRel(this.x, this.y, this.controlX, this.controlY);
		return this.rawNode;
	},

	controlPoints: function() {
		return [pt(this.controlX, this.controlY), pt(this.x, this.y)];
	},

	attributeFormat: function() {
		return this.realCharCode() + this.controlX + "," + this.controlY + " " + this.x + "," + this.y;
	},

	translate:function(x, y, force) {
		if (!this.isAbsolute && !force) return;
		this.x += x;
		this.y += y;
		this.controlX += x;
		this.controlY += y;
	},
});
Object.extend(lively.scene.QuadCurveTo, {
	fromLiteral: function(literal) {
		return new lively.scene.QuadCurveTo(literal.isAbsolute, literal.x || 0.0, literal.y || 0.0, 
			literal.controlX || 0.0, literal.controlY || 0.0);
	},
	dataLength: 4,
	create: function(isAbsolute, arr) {
		return new this(isAbsolute, arr[2], arr[3], arr[0], arr[1])
	},
}); 


this.PathElement.subclass('lively.scene.BezierCurve2CtlTo', {

	charCode: 'C',

	initialize: function($super, isAbsolute, x, y, controlX1, controlY1, controlX2, controlY2) {
		$super(isAbsolute);
		this.x = x;
		this.y = y;
		this.controlX1 = controlX1
		this.controlY1 = controlY1
		this.controlX2 = controlX2
		this.controlY2 = controlY2
	},

	allocateRawNode: function(rawPathNode) {
		this.rawNode = this.isAbsolute ?
			rawPathNode.createSVGPathSegCurvetoCubicAbs(this.x, this.y, this.controlX1, this.controlY1, this.controlX2, this.controlY2) :
			rawPathNode.createSVGPathSegCurvetoCubicRel(this.x, this.y, this.controlX1, this.controlY1, this.controlX2, this.controlY2);
		return this.rawNode;
	},

	controlPoints: function() {
		return [pt(this.controlX1, this.controlY1), pt(this.controlX2, this.controlY2), pt(this.x, this.y)];
	},

	attributeFormat: function() {
		return this.realCharCode() + this.controlX1 + "," + this.controlY1 + " " + this.controlX2 + "," + this.controlY2 + " " + this.x + "," + this.y;
	},
	
	translate:function(x, y, force) {
		if (!this.isAbsolute && !force) return;
		this.x += x;
		this.y += y;
		this.controlX1 += x;
		this.controlY1 += y;
		this.controlX2 += x;
		this.controlY2 += y;
	},

});
Object.extend(lively.scene.BezierCurve2CtlTo, {
	fromLiteral: function(literal) {
		return new lively.scene.BezierCurve2CtlTo(literal.isAbsolute, literal.x || 0.0, literal.y || 0.0, 
			literal.controlX1 || 0.0, literal.controlY1 || 0.0,
			literal.controlX2 || 0.0, literal.controlY2 || 0.0);
	},
	dataLength: 6,
	create: function(isAbsolute, arr) {
		return new this(isAbsolute, arr[4], arr[5], arr[0], arr[1], arr[2], arr[3])
	},
});


this.PathElement.subclass('lively.scene.BezierCurve1CtlTo', {

	charCode: 'S',

	initialize: function($super, isAbsolute, x, y, controlX2, controlY2/*no typo*/) {
		$super(isAbsolute);
		this.x = x;
		this.y = y;
		this.controlX2 = controlX2
		this.controlY2 = controlY2
	},

	allocateRawNode: function(rawPathNode) {
		this.rawNode = this.isAbsolute ?
			rawPathNode.createSVGPathSegCurvetoCubicSmoothAbs(this.x, this.y, this.controlX2, this.controlY2) :
			rawPathNode.createSVGPathSegCurvetoCubicSmoothAbs(this.x, this.y, this.controlX2, this.controlY2);
		return this.rawNode;
	},

	controlPoints: function() {
		return [pt(this.controlX2, this.controlY2), pt(this.x, this.y)];
	},

	attributeFormat: function() {
		return this.realCharCode() + this.controlX2 + "," + this.controlY2 + " " + this.x + "," + this.y;
	},
	
	translate:function(x, y, force) {
		if (!this.isAbsolute && !force) return;
		this.x += x;
		this.y += y;
		this.controlX2 += x;
		this.controlY2 += y;
	},

});
Object.extend(lively.scene.BezierCurve1CtlTo, {
	fromLiteral: function(literal) {
		return new lively.scene.BezierCurve1CtlTo(literal.isAbsolute, literal.x || 0.0, literal.y || 0.0, 
			literal.controlX2 || 0.0, literal.controlY2 || 0.0);
	},
	dataLength: 4,
	create: function(isAbsolute, arr) {
		return new this(isAbsolute, arr[2], arr[3], arr[0], arr[1])
	},
});


this.PathElement.subclass('lively.scene.ArcTo', {

	charCode: 'A',

	initialize: function($super, isAbsolute, x, y, rx, ry, xRotation, largeFlag, sweepFlag) {
		$super(isAbsolute);
		this.x = x;
		this.y = y;
		this.rx = rx;
		this.ry = ry;
		this.xRotation = xRotation;
		this.largeFlag = largeFlag;
		this.sweepFlag = sweepFlag;
	},

	allocateRawNode: function(rawPathNode) {
		this.rawNode = this.isAbsolute ?
			rawPathNode.createSVGPathSegArcAbs(this.x, this.y, this.rx, this.ry, this.xRotation, this.largeFlag, this.sweepFlag) :
			rawPathNode.createSVGPathSegArcRel(this.x, this.y, this.rx, this.ry, this.xRotation, this.largeFlag, this.sweepFlag);
		return this.rawNode;
	},

	controlPoints: function() {
		return [pt(this.rx, this.ry), pt(this.x, this.y)];
	},

	attributeFormat: function() {
		return this.realCharCode() + this.rx + "," + this.ry + " " + this.xRotation + " " + this.largeFlag + " " + this.sweepFlag + " " + this.x + "," + this.y;
	},
	
	translate:function(x, y, force) {
		if (!this.isAbsolute && !force) return;
		this.x += x;
		this.y += y;
	},

});
Object.extend(lively.scene.ArcTo, {
	fromLiteral: function(literal) {
		return new lively.scene.ArcTo(literal.isAbsolute, literal.x || 0.0, literal.y || 0.0, 
			literal.rx || 0, literal.ry || 0, literal.xRotation || 0, literal.largeFlag || 0, literal.sweepFlag || 0);
	},
	dataLength: 7,
	create: function(isAbsolute, arr) {
		return new this(isAbsolute, arr[5], arr[6], arr[0], arr[1], arr[2], arr[3], arr[4])
	},
});


this.PathElement.subclass('lively.scene.ClosePath', {

	charCode: 'Z',

	allocateRawNode: function(rawPathNode) {
		this.rawNode = rawPathNode.createSVGPathSegClosePath();
		return this.rawNode;
	},

	controlPoints: function() {
		return [];
	},
	
	attributeFormat: function() {
		return this.realCharCode();
	},
	
	translate:function(x, y, force) {},
});
Object.extend(lively.scene.ClosePath, {
	fromLiteral: function(literal) {
		return new lively.scene.ClosePath(literal.isAbsolute); // necessary?
	},
	dataLength: 0,
	create: function(isAbsolute, arr) {
		return new this(isAbsolute)
	},
});


this.Shape.subclass('lively.scene.Path', {
	documentation: "Generic Path with arbitrary Bezier curves",

	hasElbowProtrusions: true,

	initialize: function($super, elements, morph) {
		this.rawNode = NodeFactory.create("path");
		this.dontChangeShape = false;
		this.morph = morph;  // Only for temporary testing -- see setVerticesAndControls
		this.setElements(elements || []);
		return this;
	},
	
	deserialize: function($super, importer, rawNode) {
		$super(importer, rawNode);
		this.setElementsFromSVGData(rawNode.getAttributeNS(null, 'd'));
	},

	copyFrom: function($super, copier, other) {
		$super(copier, other);		
		this.setElements(other.elements);
		
		// aaa hack for morph-saving - don't want copies sharing elements -- Adam
		this.setElementsFromSVGData(this.createSVGDataFromElements());

		// WebCards Changes:
		// var res = $super(copier, other);
		// 		this.setVertices(other.vertices());
		// 		this.cachedVertices = other.cachedVertices;
		// 		return res;		
	},
	
	setElementsFromSVGData: function(data) {
		var elements = lively.scene.PathElement.parse(data);
		this.setElements(elements);
	},
	
	createSVGDataFromElements: function() {
		var attr = "";
		for (var i = 0; i < this.elements.length; i++) {
			// var seg = elts[i].allocateRawNode(this.rawNode);
			// this.rawNode.pathSegList.appendItem(seg);
			attr += this.elements[i].attributeFormat() + " ";
		}
		return attr
	},

	setElements: function(elts) {
		this.cachedVertices = null;
		this.elements = elts;
		
		// aaa hack for morph-saving -- Adam
		elts.makeAllCreatorSlots();
		reflect(this).slotAt('elements').beCreator();
		reflect(this).slotAt('cachedVertices').setInitializationExpression('undefined');
		
		this.rawNode.setAttributeNS(null, "d", this.createSVGDataFromElements());
	},

	normalize: function(hintX, hintY) {
		// when elements are translated and are not beginning
		// in origin translate them so they do
		var first = this.elements[0];
		if (first.constructor != lively.scene.MoveTo) {
			console.warn('cannot normalize path not beginning with MoveTo');
			return;
		}
		var x = first.x * -1 + (hintX || 0);
		var y = first.y * -1 + (hintY || 0);
		var isFirst = true;
		for (var i = 0; i < this.elements.length; i++) {
			this.elements[i].translate(x, y, isFirst);
			isFirst = false;
		}
		this.setElements(this.elements);
	},
	
	setVertices: function(vertlist) {
		if (this.dontChangeShape) return
		// emit SVG path symbol based on point attributes
		// p==point, i=array index
		function map2svg(p,i) {
			var code;
			if (i==0 || p.type && p.type=="move") {
				code = "M";
			} else if (p.type && p.type=="line") {
				code = "L";
			} else if (p.type && p.type=="arc" && p.radius) {
				code = "A" + (p.radius.x || p.radius) + "," +
				(p.radius.y || p.radius) + " " + (p.angle || "0") +
				" " + (p.mode || "0,1") + " ";
			} else if (p.type && p.type=="curve" && p.control) {
				// keep control points relative so translation works
				code = "Q" + (p.x+p.control.x) + "," + (p.y+p.control.y) + " ";
			} else {
				code = "T";	 // default - bezier curve with implied control pts
			}
			return code + p.x + "," + p.y;
		}
		var d = vertlist.map(map2svg).join('');
		//console.log("d=" + d);
		if (d.length > 0)
			this.rawNode.setAttributeNS(null, "d", d);
	},

	setVerticesAndControls: function(verts, ctrls, closed) {
		// Complete hack only so that we can play with editing.  
		// May leaves garbage in DOM

		// copied from Morph.makeCurve...
		var g = lively.scene;
		var cmds = [];
		cmds.push(new g.MoveTo(true, verts[0].x,  verts[0].y));
		for (var i=1; i<verts.length; i++) {
			var el = ctrls[i] ?
				new g.QuadCurveTo(true, verts[i].x, verts[i].y, ctrls[i].x, ctrls[i].y) :
				new g.CurveTo(true, verts[i].x, verts[i].y);
			cmds.push(el);
		}
		this.setElements(cmds);
	},

	
	vertices: function() {
		// [DI] Note this is a test only -- not all path elements will work with this
		if (this.cachedVertices != null) return this.cachedVertices;
		this.cachedVertices = [];
		this.elements.forEach(function(el) {
			var vertex = el.controlPoints().last(); // FIXME controlPoints method should be fixed!
			if (vertex) this.cachedVertices.push(vertex);
		}, this);
		return this.cachedVertices;
	},

	controlPoints: function() {
		// [DI] Note this is a test only -- no caching, not all path elements will work with this
		var ctls = [];
			this.elements.forEach(function(el) { 
				var cs = el.controlPoints();  // cs = [vert] or [p1, vert] or [p1, p2, vert]
				ctls.push(cs.slice(0,cs.length-1));   // this is cs.butLast, ie [] or [p1] or [p1, p2]
				});
		return ctls;
	},


	containsPoint: function(p) {
	  /*
		var verts = this.vertices();
		//if (UserAgent.webKitVersion >= 525)
		return Rectangle.unionPts(verts).containsPoint(p);
		//else return this.nativeContainsWorldPoint(p);
		*/

  	// aaa - Copied from the Polygon code, works better, important for wheel menus because
  	// otherwise multiple wedges can be highlighted at a time -- Adam, June 2011
		var counter = 0;
		var vertices = this.vertices();
		var p1 = vertices[0];
		for (var i = 1; i <= vertices.length; i++) {
			var p2 = vertices[i % vertices.length];
			if (p.y > Math.min(p1.y, p2.y)) {
				if (p.y <= Math.max(p1.y, p2.y)) {
					if (p.x <= Math.max(p1.x, p2.x)) {
						if (p1.y != p2.y) {
							var xinters = (p.y-p1.y)*(p2.x-p1.x)/(p2.y-p1.y)+p1.x;
							if (p1.x == p2.x || p.x <= xinters)
								counter ++;
						}
					}
				}
			}
			p1 = p2;
		}

		if (counter % 2 == 0) {
			return false;
		} else {
			return true;
		}
	},

	bounds: function() {
		var u = Rectangle.unionPts(this.vertices());
		// FIXME this is not correct (extruding arcs) but it's an approximation
		return u;
	},

	setBounds: function(bounds) { 
		console.log('setBounds unsupported on type ' + this.getType());
	},

	// poorman's traits :)
	partNameNear: this.Polygon.prototype.partNameNear,
	allPartNames: function() {
		// Note: for reshaping of polygons and lines, the "partNames" are
		//  integer codes with the following meaning...
		//	0...(N-1)  -- the N vertices themselves
		//	-1...-N  -- negative of the line segment index for inserting a new vertex
		//  This scheme may also be extended to curves as follows...
		//	N...(2N-1)  -- first control point for the given (i-N)-th line segment
		//  2N...(3N-1)  -- second control point for the (i-2N)-th line segment
		// This encoding scheme is shared also by partPosition() and reshape()

		// Vertices...
		var locs = [];
		var verts = this.vertices();
		for (var i = 0; i < verts.length; i++) { locs.push(i); };  // vertices

		// Midpoints (for insertion)
		// Some polygons have last point = first; some don't
		if (false) {  // Note: this wont work right for paths yet
			var nLines = (verts.first().eqPt(verts.last())) ? verts.length-1 : verts.length;
			for (var i = 0; i < nLines; i++) { locs.push(-(i + 1)); };  // midpoints
		}

		// Control points
		var N = verts.length;
		var ctls = this.controlPoints();
		for (var i = 0; i < ctls.length; i++) { 
			var cs = ctls[i];
			if (cs.length > 0) locs.push(N + i);  // first control pt for curve elements
			if (cs.length > 1) locs.push(2*N + i);  // second control pt for curve elements
		};
		return locs; 
	},

	partPosition: function(partName) {
		// See the comment in allPartNames
		// Here we decode the "partName" index to select a vertex, midpoint or control point
		var verts = this.vertices();  var N = verts.length;

		// Midpoint of segment
		if (partName < 0) {  
			// Check for midpoint of last segment when first vertex is not duplicated
			if (-partName > (verts.length-1)) return verts[-partName - 1].midPt(verts[0]); 
			return verts[-partName].midPt(verts[-partName - 1]);
		}
		// Normal vertex
		if (partName < N) return verts[partName];

		var ctls = this.controlPoints();
		// First control point
		if (partName < N*2) return ctls[partName - N][0];

		// Second control point
		if (partName < N*3) return ctls[partName - N*2][1];
console.log("can't find partName = " + partName);
console.log("verts = " + Object.inspect(verts));
console.log("ctls = " + Object.inspect(ctls));
	},


	reshape: function(ix, newPoint, lastCall) {
		// See the comment in allPartNames
		// Here we decode the "partName" index to select a vertex, midpoint or control point
		// and then replace that point with newPoint, and update the shape

		// ix is an index into vertices
		var verts = this.vertices();  // less verbose
		var ctrls = this.controlPoints().map(function(elt) {return elt[0]; });
		if (!ctrls[0]) ctrls[0] = ctrls[1];
		if (ix < 0) { // negative means insert a vertex
			return false;  // Inserting a vertex wont work yet without splicing in a controlpt as well
			ix = -ix;
			verts.splice(ix, 0, newPoint);
			this.setVerticesAndControls(verts, ctrls);
			return; // undefined result for insertion 
		}
		var N = verts.length;
		var closed = verts[0].eqPt(verts[verts.length - 1]);
		if (ix >= N) {
			// Edit a control point
			ctrls[ix-N] = newPoint;
//console.log("verts = " + Object.inspect(verts));
//console.log("ctrls = " + Object.inspect(ctrls));
			this.setVerticesAndControls(verts, ctrls, closed);
			return false; // normal -- no merging
		}
		if (closed && ix == 0) {  // and we're changing the shared point (will always be the first)
			verts[0] = newPoint;  // then change them both
			verts[verts.length - 1] = newPoint; 
		} else {
			verts[ix] = newPoint;
		}

		var shouldMerge = false;
		var howClose = 6;
		if (verts.length > 2) {
			// if vertex being moved is close to an adjacent vertex, make handle show it (red)
			// and if its the last call (mouse up), then merge this with the other vertex
			if (ix > 0 && verts[ix - 1].dist(newPoint) < howClose) {
				if (lastCall) { 
					verts.splice(ix, 1); 
					if (closed) verts[0] = verts[verts.length - 1]; 
				} else {
					shouldMerge = true;
				} 
			}

			if (ix < verts.length - 1 && verts[ix + 1].dist(newPoint) < howClose) {
				if (lastCall) { 
					verts.splice(ix, 1); 
					if (closed) verts[verts.length - 1] = verts[0];
				} else {
					shouldMerge = true;
				} 
			}
		}
		this.setVerticesAndControls(verts, ctrls, closed); 
		return shouldMerge;
	},

});

Object.extend(lively.scene.Path, {
	fromLiteral: function(literal) {
		return new lively.scene.Path(literal.elements);
	},
});

this.Shape.subclass('lively.scene.Group', {
	documentation: 'Grouping of scene objects',

	initialize: function() {
		this.rawNode = NodeFactory.create("g");
		reflect(this).slotAt('rawNode').beCreator(); // aaa - kind of a hack, added by Adam so that we can file out morphs
		this.content = [];
		reflect(this).slotAt('content').beCreator(); // aaa - kind of a hack, added by Adam so that we can file out morphs
	},

	copyFrom: function($super, copier, other) {
		$super(copier, other);
		this.content = other.content.clone();
		/* firefox doesn't need this
		var tx = other.pvtGetTranslate();

if (tx) { 
console.log('translate ' + tx + ' on ' + this);
this.translateBy(tx);
} */
// FIXME deep copy?
	},

	deserialize: function($super, copier, rawNode) {
		$super(copier, rawNode);
		this.content = [];
	},

	add: function(node) {
		this.rawNode.appendChild(node.rawNode);
		this.content.push(node);
	},

	removeAll: function() {
		while (this.rawNode.firstChild) this.rawNode.removeChild(this.rawNode.firstChild);
		this.content = [];
	},

	setContent: function(nodes) {
		// FIXME how about clearing what's there
		nodes.forEach(function(node) { 
			this.add(node); 
		}, this);
	},

	bounds: function() {
		// this creates duplication between morphs and scene graphs, division of labor?
		// move Morph logic here
		var subBounds = null;
		var disp = this.pvtGetTranslate() || pt(0, 0);

		for (var i = 0; i < this.content.length; i++) {
			var item = this.content[i];
			if (!item.isVisible()) 
				continue;
			var itemBounds = item.bounds().translatedBy(disp);
			subBounds = subBounds == null ? itemBounds : subBounds.union(itemBounds);
		}
		var result =  subBounds || new Rectangle(0, 0, 0, 0);
		return result;
	},

	setBounds: function(bnds) {
		// console.log('doing nothing to set bounds on group');
	},

	containsPoint: function(p) {
		// FIXME this should mimic relativize in Morph
		var disp = this.pvtGetTranslate() || pt(0, 0);
		p = p.subPt(disp);
		return this.content.some(function(item) { return item.containsPoint(p); });
	},

	origin: function(shape) { 
		return this.bounds().topLeft();
	},

	pvtGetTranslate: function() {
		var tfms = this.getTransforms();
		if (tfms.length == 1 && tfms[0].type() == SVGTransform.SVG_TRANSFORM_TRANSLATE) {
			return tfms[0].getTranslate();
		} else return null;
	},

	translateBy: function(displacement) {
		var tfms = this.getTransforms();
		if (tfms.length == 1 && tfms[0].type() == SVGTransform.SVG_TRANSFORM_TRANSLATE) {
			var tr = tfms[0].getTranslate();
			tfms[0].setTranslate(tr.x + displacement.x, tr.y + displacement.y);
		} if (tfms.length == 0) {
			var tfm = new lively.scene.Transform(null, this);
			tfm.setTranslate(displacement.x, displacement.y);
			this.setTransforms([tfm]);

		} else console.warn('no translate for you ' + displacement + ' length ' + tfms.length + " type " + tfms[0].type());
	},
	reshape: Functions.Empty,

	partNameNear: this.Rectangle.prototype.partNameNear,
	allPartNames: this.Rectangle.prototype.allPartNames,

	partPosition: this.Rectangle.prototype.partPosition,
	vertices: this.Rectangle.prototype.vertices
});


Object.extend(this.Group, {
	fromLiteral: function(literal) {
		var group = new lively.scene.Group();
		literal.content && group.setContent(literal.content);
		if (literal.transforms) {
			group.setTransforms(literal.transforms);
		}
		if (literal.clip) {
			var clip = new lively.scene.Clip(literal.clip);
			var defs = group.rawNode.appendChild(NodeFactory.create('defs'));
			defs.appendChild(clip.rawNode);
			clip.applyTo(group);
		}
		return group;
	}
});

this.Node.subclass('lively.scene.Image');
	
this.Image.addProperties({ 
	Opacity: { name: "opacity", from: Number, to: String, byDefault: 1.0}
}, Config.useStyling ? lively.data.StyleRecord : lively.data.DOMRecord);

this.Image.addMethods({
	description: "Primitive wrapper around images",

	initialize: function(url, width, height) {
		if (!url) return;
		if (url.startsWith('#'))
			this.loadUse(url);
		else
		this.loadImage(url, width, height);
	},

	deserialize: function($super, importer, rawNode) {
		if (rawNode.namespaceURI != Namespace.SVG) {
			// this brittle and annoying piece of code is a workaround around the likely brokenness
			// of Safari's XMLSerializer's handling of namespaces
			var href = rawNode.getAttributeNS(null /* "xlink"*/, "href");
			if (href)
			if (href.startsWith("#")) {
				// not clear what to do, use target may or may not be in the target document
				this.loadUse(href);
			} else {
				this.loadImage(href);
			}
		} else {
			$super(importer, rawNode);
		}
	},

	bounds: function() {
		return new Rectangle(0, 0, this.getWidth(), this.getHeight());
	},

	containsPoint: function(p) {
		return this.bounds().containsPoint(p);
	},

	getWidth: function(optArg) {
		return lively.data.Length.parse((optArg || this.rawNode).getAttributeNS(null, "width"));
	},

	getHeight: function(optArg) {
		return lively.data.Length.parse((optArg || this.rawNode).getAttributeNS(null, "height"));
	},

	setWidth: function(width) {
		this.rawNode.setAttributeNS(null,"width", width);
	},

	setHeight: function(height) {
		this.rawNode.setAttributeNS(null, "height", height);
	},

	reload: function() {
		if (this.rawNode.localName == "image")	{
			XLinkNS.setHref(this.rawNode, this.getURL() + "?" + new Date());
		}
	},

	getURL: function() {
		return XLinkNS.getHref(this.rawNode);
	},

	scaleBy: function(factor) {
		new lively.scene.Similitude(pt(0, 0), 0, pt(factor, factor)).applyTo(this.rawNode);
	},

	loadUse: function(url) {
		if (this.rawNode && this.rawNode.localName == "use") {
			XLinkNS.setHref(this.rawNode, url);
			return null; // no new node;
		} else {
			this.removeRawNode();
			this.rawNode = NodeFactory.create("use");
			XLinkNS.setHref(this.rawNode, url);
			return this.rawNode;
		}
	},

	loadImage: function(href, width, height) {

		if (this.rawNode && this.rawNode.localName == "image") {
			XLinkNS.setHref(this.rawNode, href);
			return null;
		} else {
			var useDesperateSerializationHack = !Config.suppressImageElementSerializationHack;
			if (useDesperateSerializationHack) {
				width = width || this.getWidth();
				height = height || this.getHeight();

				// this desperate measure appears to be necessary to work
				// around Safari's serialization issues.  Note that
				// somehow this code has to be used both for normal
				// loading and loading at deserialization time, otherwise
				// it'll fail at deserialization
				var xml = Strings.format('<image xmlns="http://www.w3.org/2000/svg" ' 
				+ 'xmlns:xlink="http://www.w3.org/1999/xlink" ' 
				+ ' width="%s" height="%s" xlink:href="%s"/>', width, height, href);
				this.rawNode = new Importer().parse(xml);
			} else {

				// this should work but doesn't:

				this.rawNode = NodeFactory.createNS(Namespace.SVG, "image");
				this.rawNode.setAttribute("width", width);
				this.rawNode.setAttribute("height", height);
				XLinkNS.setHref(this.rawNode, href);
			}
			return this.rawNode;
		}
	}
});


this.Node.subclass('lively.scene.Clip', {
	documentation: "currently wrapper around SVG clipPath",

	initialize: function(shape) {
		this.rawNode = NodeFactory.create('clipPath');
		//var newId =  ++ this.constructor.clipCounter;
		this.setId(String(this.newId()));
		this.setClipShape(shape);
	},

	deserialize: function(importer, rawNode) {
		this.rawNode = rawNode;
		//FIXME remap the id?
		if (!rawNode) {
			// throw new Error("deserializing Clip without rawNode");
			console.log("Error: deserializing Clip without rawNode");
			return
		};
		var node = rawNode.firstChild; // really firstElement, allow for whitespace
		if (!node) return; // empty clipPath?
		this.shape = lively.scene.Shape.importFromNode(importer, node);

	},

	setClipShape: function(shape) {
		this.shape = shape.copy(); // FIXME: target.outline() ?
		this.replaceRawNodeChildren(this.shape.rawNode);
	},

	applyTo: function(target) {
		target.setTrait("clip-path", this.uri());	
	}

});

Object.extend(this.Clip, {
	clipCounter: 0,
});


Object.subclass('lively.scene.Similitude', {
	// could be made SVG indepenent
	documentation: "Support for object rotation, scaling, etc.",

	//translation: null, // may be set by instances to a component SVGTransform
	//rotation: null, // may be set by instances to a component SVGTransform
	//scaling: null, // may be set by instances to a component SVGTransform
	eps: 0.0001, // precision

	/**
	* create a similitude is a combination of translation rotation and scale.
	* @param [Point] delta
	* @param [float] angleInRadians
	* @param [float] scale
	*/

	initialize: function(duck) { 
		// matrix is a duck with a,b,c,d,e,f, could be an SVG matrix or a Lively Transform
		// alternatively, its a combination of translation rotation and scale
		if (duck) {
			if (duck instanceof Point) {
				var delta = duck;
				var angleInRadians = arguments[1] || 0.0;
				var scale = arguments[2];
				if (scale === undefined) scale = pt(1.0, 1.0); 
				this.a = this.ensureNumber(scale.x * Math.cos(angleInRadians));
				this.b = this.ensureNumber(scale.y * Math.sin(angleInRadians));
				this.c = this.ensureNumber(scale.x * - Math.sin(angleInRadians));
				this.d = this.ensureNumber(scale.y * Math.cos(angleInRadians));
				this.e = this.ensureNumber(delta.x);
				this.f = this.ensureNumber(delta.y);
			} else {
				this.fromMatrix(duck);
			}
		} else {
			this.a = this.d = 1.0;
			this.b = this.c = this.e = this.f = 0.0;
		}
		this.matrix_ = this.toMatrix();
	},

	getRotation: function() { // in degrees
		// Note the ambiguity with negative scales is resolved by assuming scale x is positive
		var r =	 Math.atan2(-this.c, this.a).toDegrees();
		return Math.abs(r) < this.eps ? 0 : r; // don't bother with values very close to 0
	},

	getScale: function() {
		// Note the ambiguity with negative scales and rotation is resolved by assuming scale x is positive
		var a = this.a;
		var c = this.c; 
		var s = Math.sqrt(a * a + c * c);
		return Math.abs(s - 1) < this.eps ? 1 : s; // don't bother with values very close to 1
	},

	getScalePoint: function() {
		// Note the ambiguity with negative scales and rotation is resolved by assuming scale x is positive
		var a = this.a;
		var b = this.b;
		var c = this.c;
		var d = this.d;
		var sx = Math.sqrt(a * a + c * c);
		var r =	 Math.atan2(-c, a);	 // radians
		var sy = (Math.abs(b) > Math.abs(d)) ? b / Math.sin(r) : d / Math.cos(r);  // avoid div by 0
		return pt(sx, sy);
	},

  // Hacked by Adam as a way to avoid creating the point object
	getScaleX: function() {
		var a = this.a;
		var c = this.c;
		return Math.sqrt(a * a + c * c);
	},
	getScaleY: function() {
		var a = this.a;
		var b = this.b;
		var c = this.c;
		var d = this.d;
		var r =	 Math.atan2(-c, a);	 // radians
		return (Math.abs(b) > Math.abs(d)) ? b / Math.sin(r) : d / Math.cos(r);  // avoid div by 0
	},


	isTranslation: function() {
		return this.matrix_.type === SVGTransform.SVG_TRANSFORM_TRANSLATE;
	},

	getTranslation: function() {
		return pt(this.e, this.f);
	},

	toAttributeValue: function() { 
	  // Optimization: don't create the point objects. -- Adam
	  
		// var delta = this.getTranslation();
		// var attr = "translate(" + delta.x + "," + delta.y +")";
		var attr = "translate(" + this.e + "," + this.f +")";

		var theta = this.getRotation();
		if (theta != 0.0) attr += " rotate(" + theta  +")"; // in degrees

		//var sp = this.getScalePoint();
		//if (sp.x != 1.0 || sp.y != 1.0)	 attr += " scale(" + sp.x + "," + sp.y + ")";
		var sx = this.getScaleX();
		var sy = this.getScaleY();
		if (sx != 1.0 || sy != 1.0)	 attr += " scale(" + sx + "," + sy + ")";

		return attr;
	},

	applyTo: function(rawNode) { 
		if (Config.useTransformAPI) {
			var list = rawNode.transform.baseVal;
			var canvas = locateCanvas();

			var translation = canvas.createSVGTransform();
			translation.setTranslate(this.e, this.f);
			list.initialize(translation);
			if (this.b || this.c) {
				var rotation = canvas.createSVGTransform();
				rotation.setRotate(this.getRotation(), 0, 0);
				list.appendItem(rotation);
			}
			if (this.a != 1.0 || this.d != 1.0) {
				var scaling = canvas.createSVGTransform();
				var sp = this.getScalePoint();
				scaling.setScale(sp.x, sp.y);
				list.appendItem(scaling);
			}
		} else {
			rawNode.setAttributeNS(null, "transform", this.toAttributeValue());
		}
	},

	toString: function() {
		return this.toAttributeValue();
	},

	transformPoint: function(p, acc) {
		return p.matrixTransform(this, acc);
	},

	transformDirection: function(p, acc) {
		return p.matrixTransformDirection(this, acc);
	},

	matrixTransformForMinMax: function(pt, minPt, maxPt) {
		var x = this.a * pt.x + this.c * pt.y + this.e;
		var y = this.b * pt.x + this.d * pt.y + this.f;
		if (x > maxPt.x) maxPt.x = x;
		if (y > maxPt.y) maxPt.y = y;
		if (x < minPt.x) minPt.x = x;
		if (y < minPt.y) minPt.y = y;
	},

	transformRectToRect: function(r) {
		// This gets called a lot from invalidRect, so it has been optimized a bit
		var minPt = pt(Infinity, Infinity);
		var maxPt = pt(-Infinity, -Infinity);
		this.matrixTransformForMinMax(r.topLeft(), minPt, maxPt);
		this.matrixTransformForMinMax(r.bottomRight(), minPt, maxPt);
		if (this.isTranslation()) return rect(minPt, maxPt);

		this.matrixTransformForMinMax(r.topRight(), minPt, maxPt);
		this.matrixTransformForMinMax(r.bottomLeft(), minPt, maxPt);
		return rect(minPt, maxPt);
	},

	copy: function() {
		return new lively.scene.Similitude(this);
	},

	toMatrix: function() {
		var mx = locateCanvas().createSVGMatrix();
		mx.a = this.a;
		mx.b = this.b;
		mx.c = this.c;
		mx.d = this.d;
		mx.e = this.e;
		mx.f = this.f;
		return mx;
	},

	ensureNumber: function(value) {
		// note that if a,b,.. f are not numbers, it's usually a
		// problem, which may crash browsers (like Safari) that don't
		// do good typechecking of SVGMatrix properties before passing
		// them to native code.	 It's probably too late to figure out
		// the cause, but at least we won't crash.
		if (isNaN(value)) { throw dbgOn(new Error('not a number'));}
		return value;
	},


	fromMatrix: function(mx) {
		this.a = this.ensureNumber(mx.a);
		this.b = this.ensureNumber(mx.b);
		this.c = this.ensureNumber(mx.c);
		this.d = this.ensureNumber(mx.d);
		this.e = this.ensureNumber(mx.e);
		this.f = this.ensureNumber(mx.f);
	},

	preConcatenate: function(t) {
		var m = this.matrix_;
		this.a =  t.a * m.a + t.c * m.b;
		this.b =  t.b * m.a + t.d * m.b;
		this.c =  t.a * m.c + t.c * m.d;
		this.d =  t.b * m.c + t.d * m.d;
		this.e =  t.a * m.e + t.c * m.f + t.e;
		this.f =  t.b * m.e + t.d * m.f + t.f;
		this.matrix_ = this.toMatrix();
		return this;
	},

	createInverse: function() {
		return new lively.scene.Similitude(this.matrix_.inverse());
	}

});

Wrapper.subclass('lively.scene.Transform', {
	// a more direct wrapper for SVGTransform
	initialize: function(rawNode, targetNode) {
		if (!rawNode) rawNode = locateCanvas().createSVGTransform();
		this.rawNode = rawNode;
		reflect(this).slotAt('rawNode').beCreator(); // aaa - kind of a hack, added by Adam so that we can file out morphs
		// we remember the target node so that we can inform it that we changed
		this.targetNode = targetNode; 
	},

	getTranslate: function() {
		if (this.rawNode.type == SVGTransform.SVG_TRANSFORM_TRANSLATE) {
			var mx = this.rawNode.matrix;
			return pt(mx.e, mx.f);
		} else throw new TypeError('not a translate ' + this + ' type ' + this.type());
	},

	setTranslate: function(x, y) {
		// note this overrides all the values
		this.rawNode.setTranslate(x, y);
		this.targetNode.transformListItemChanged(this);
		return this;
	},

	setRotate: function(angleInDegrees, anchorX, anchorY) {
		// note this overrides all the values
		this.rawNode.setRotate(angleInDegrees, anchorX || 0.0, anchorY || 0.0);
		this.targetNode.transformListItemChanged(this);
		return this;
	},

	setTranslateX: function(x) {
		if (this.rawNode.type == SVGTransform.SVG_TRANSFORM_TRANSLATE) {
			var tr = this.getTranslate();
			this.rawNode.setTranslate(x, tr.y);
			this.targetNode.transformListItemChanged(this);
		
		} else throw new TypeError('not a translate ' + this);
	},

	setX: function(x) {
		return this.setTranslateX(x);
	},
	
	setTranslateY: function(y) {
		if (this.rawNode.type == SVGTransform.SVG_TRANSFORM_TRANSLATE) {
			var tr = this.getTranslate();
			this.rawNode.setTranslate(tr.x, y);
			this.targetNode.transformListItemChanged(this);
		} else throw new TypeError('not a translate ' + this);
	},

	setY: function(y) {
		return this.setTranslateY(y);
	},


	type: function() {
		return this.rawNode.type;
	},

	getAngle: function() {
		/*
		var r =	 Math.atan2(this.matrix.b, this.matrix.d).toDegrees();
		return Math.abs(r) < this.eps ? 0 : r; // don't bother with values very close to 0
		*/
		return this.rawNode.angle;
	},

	getScale: function() {
		if (this.rawNode.type == SVGTransform.SVG_TRANSFORM_SCALE) {
			var mx = this.rawNode.matrix;
			var a = mx.a;
			var c = mx.c;
			return Math.sqrt(a * a + c * c);
		} else throw new TypeError('not a scale ' + this.rawNode);
	},
	
	toString: function() {
		switch (this.rawNode.type) {
		case SVGTransform.SVG_TRANSFORM_TRANSLATE:
			var delta = this.getTranslate();
			return "translate(" + delta.x + "," + delta.y +")";
		case SVGTransform.SVG_TRANSFORM_ROTATE:
			var mx = this.rawNode.matrix;
			if (mx.e || mx.f) {
				var disp = pt(mx.e || 0, mx.f || 0);
				var str = "translate(" + disp.x.toFixed(2) + "," + disp.y.toFixed(2) + ") "; 
				str += "rotate(" + this.getAngle().toFixed(2) + ") ";
				//str += "translate(" + (-disp.x).toFixed(2)  + ", " + (-disp.y).toFixed(2) + ")";
				// FIXME, hmm.... wouldn't we want to transform back?
				//console.log('format ' + str);
				return str;
			} else return "rotate(" + this.getAngle()  +")"; // in degrees
		case SVGTransform.SVG_TRANSFORM_SCALE:
			return "scale(" + this.getScale() + ")";
		default:
			var mx = this.rawNode.matrix;
			return "matrix(" + [mx.a, mx.b, mx.c, mx.d, mx.e, mx.f].join(', ') + ")"; // FIXME
		}
	}
});

lively.scene.Translate = {
	fromLiteral: function(literal) {
		var tfm = new lively.scene.Transform();
		tfm.rawNode.setTranslate(literal.X || 0.0, literal.Y || 0.0);
		// tfm.targetNode should be set from setTransforms, already on the call stack
		return tfm;
	}
};


lively.scene.Transform.subclass('lively.scene.Rotate', {
	// FIXME: fold into Transform
	initialize: function($super, degrees, anchorX, anchorY) {
		$super(null, null);
		// doesn't know its target node yet
		this.anchor = pt(anchorX|| 0.0, anchorY || 0.0);
		this.rawNode.setRotate(degrees, anchorX || 0.0, anchorY || 0.0);
	},

	setAngle: function(angle) {
		//console.log('setting angle to ' + angle);
		this.setRotate(angle, this.anchor.x, this.anchor.y);
	}
});

Object.extend(lively.scene.Rotate, {
	fromLiteral: function(literal) {
		return new lively.scene.Rotate(literal.Angle, literal.X, literal.Y);
	}
});

Wrapper.subclass('lively.scene.Effect', {

	initialize: function(id) {
		this.rawNode = NodeFactory.create("filter");
		this.effectNode = this.rawNode.appendChild(NodeFactory.create(this.nodeName));
		this.rawNode.setAttribute("id", id);
	},

	applyTo: function(target) {
		this.reference();
		target.setTrait("filter", this.uri());
	}

});

this.Effect.subclass('lively.scene.GaussianBlurEffect', {
	nodeName: "feGaussianBlur",
	initialize: function($super, radius, id) { // FIXME generate IDs automatically
		$super(id);
		this.effectNode['in'] = "SourceGraphics"; // FIXME more general
		this.setRadius(radius);
	},

	setRadius: function(radius) {
		var blur = this.effectNode;
		if (blur.setStdDeviation)
			blur.setStdDeviation(radius, radius);
		else  // Safari doesn't define the method
		blur.setAttributeNS(null, "stdDeviation", String(radius));
	},
});


this.Effect.subclass('lively.scene.BlendEffect', {
	nodeName: "feBlend",
	initialize: function($super, id, optSourceURL) { // FIXME generate IDs automatically
		$super(id);
		this.effectNode.setAttributeNS(null, "mode", "normal");
		this.effectNode.setAttributeNS(null, "in", "SourceGraphic"); // FIXME more general

		if (optSourceURL) {
			var feImage = this.rawNode.insertBefore(NodeFactory.create("feImage"), this.effectNode);
			feImage.setAttributeNS(null, "result", "image");
			feImage.setAttributeNS(Namespace.XLINK, "href", optSourceURL);
			this.effectNode.setAttributeNS(null, "in2", "image");
		} else {
			this.effectNode.setAttributeNS(null, "in2", optSourceURL);
		}
	}
});

this.Effect.subclass('lively.scene.ColorAdjustEffect', {
	nodeName: "feColorMatrix",
	initialize: function($super, id) { // FIXME generate IDs automatically
		$super(id);
		this.effectNode.setAttributeNS(null, "type", "matrix");
		this.effectNode.setAttributeNS(null, "in", "SourceGraphic"); // FIXME more general
		// FIXME: obviously random numbers
		this.effectNode.setAttributeNS(null, "values", [
			2/3, 2/3, 2/3, 0, 0,
			2/3, 2/3, 2/3, 0, 0,
			2/3, 2/3, 2/3, 0, 0,
			2/3, 2/3, 3/3, 0, 0].join(' '))
	}
});

this.Effect.subclass('lively.scene.SaturateEffect', {
	nodeName: "feColorMatrix",
	initialize: function($super, id, value) { // FIXME generate IDs automatically
		$super(id);
		this.effectNode.setAttributeNS(null, "type", "saturate");
		this.effectNode.setAttributeNS(null, "in", "SourceGraphic"); // FIXME more general
		this.effectNode.setAttributeNS(null, "values", String(value));
	}
});

lively.scene.Node.subclass('lively.scene.Text', {
	documentation: "wrapper around SVG Text elements",
	initialize: function() {
		this.rawNode = NodeFactory.create("text", { "kerning": 0 });
		reflect(this).slotAt('rawNode').beCreator(); // aaa - kind of a hack, added by Adam so that we can file out morphs
	},

	getFontSize: function() {
		return this.getLengthTrait("font-size");
	},

	getFontFamily: function() {
		return this.getTrait("font-family");
	}

});




}); // end using lively.scene

// ===========================================================================
// Gradient colors, stipple patterns and coordinate transformatins
// ===========================================================================


using(namespace('lively.paint'), lively.data.Wrapper).run(function(unused, Wrapper) {

Wrapper.subclass('lively.paint.Stop', {
	initialize: function(offset, color) {
		dbgOn(isNaN(offset));
		this.rawNode = NodeFactory.create("stop", { offset: offset, "stop-color": color});
	},

	deserialize: function(importer, rawNode) {
		this.rawNode = rawNode;
	},

	copyFrom: function(copier, other) {
		if (other.rawNode) this.rawNode = other.rawNode.cloneNode(true);
	},

	color: function() {
		return Color.fromString(this.getTrait("stop-color"));
	},

	offset: function() {
		return this.getLengthTrait("offset");
	},

	toLiteral: function() {
		return { offset: String(this.offset()), color: String(this.color()) };
	},

	toString: function() {
		return "#<Stop{" + JSON.serialize(this.toLiteral()) + "}>";
	}

});

Object.extend(this.Stop, {
	fromLiteral: function(literal) {
		return new lively.paint.Stop(literal.offset, literal.color);
	}
});


// note that Colors and Gradients are similar but Colors don't need an SVG node
Wrapper.subclass("lively.paint.Gradient", {

	dictionaryNode: null,
	initialize: function($super, node) {
		$super();
		this.stops = [];
		this.refcount = 0;
		this.rawNode = node;
	},

	deserialize: function($super, importer, rawNode) {
		$super(importer, rawNode);
		//rawNode.removeAttribute("id");
		var rawStopNodes = $A(this.rawNode.getElementsByTagNameNS(Namespace.SVG, 'stop'));
		this.stops = rawStopNodes.map(function(stopNode) { return new lively.paint.Stop(importer, stopNode) });
		this.refcount = 0;
	},

	copyFrom: function($super, copier, other) {
		$super(copier, other);
		dbgOn(!other.stops);
		//this.rawNode.removeAttribute("id");
		var rawStopNodes = $A(this.rawNode.getElementsByTagNameNS(Namespace.SVG, 'stop'));
		this.stops = rawStopNodes.map(function(stopNode) { return new lively.paint.Stop(importer, stopNode) });
		this.refcount = 0;
	},

	addStop: function(offset, color) {
		var stop = new lively.paint.Stop(offset, color);
		this.stops.push(stop);
		this.rawNode.appendChild(stop.rawNode);
		return this;
	},

	setStops: function(list) {
		if (this.stops && this.stops.length > 0) throw new Error('stops already initialized to ' + this.stops);
		list.forEach(function(stop) {
			this.stops.push(stop);
			this.rawNode.appendChild(stop.rawNode);
		}, this);
	},

	toString: function() {
		return "#<" + this.getType() + this.toMarkupString() + ">";
	},

  // added by Adam; should implement these properly
	isVeryLight: function() { return false; },
	isVeryDark:  function() { return false; },
});


this.Gradient.subclass("lively.paint.LinearGradient", {

	initialize: function($super, stopSpec, vector) {
		vector = vector || lively.paint.LinearGradient.NorthSouth;
		$super(NodeFactory.create("linearGradient",
					  {x1: vector.x, y1: vector.y, 
					   x2: vector.maxX(), y2: vector.maxY()})); 
		this.vector = vector;  // cache for access without rawNode
		this.setStops(stopSpec);
		return this;
	},

    /*
    Was this here in the first place, or did I add it? Anyway, I'm implementing it up on Gradient over in changes.js. -- Adam
	mixedWith: function(color, proportion) {
		var result = new lively.paint.LinearGradient([]);
		for (var i = 0; i < this.stops.length; ++i) {
			result.addStop(this.stops[i].offset(), 
				       this.stops[i].color().mixedWith(color, proportion));
		}
		return result;
	}
	*/

});


Object.extend(this.LinearGradient, {
	fromLiteral: function(literal) {
		return new lively.paint.LinearGradient(literal.stops, 
			literal.vector || lively.paint.LinearGradient.NorthSouth);
	}
});

Object.extend(this.LinearGradient, {
	NorthSouth: rect(pt(0, 0), pt(0, 1)),
	SouthNorth: rect(pt(0, 1), pt(0, 0)),
	EastWest:	rect(pt(0, 0), pt(1, 0)),
	WestEast:	rect(pt(1, 0), pt(0, 0)),
	SouthWest:	rect(pt(1, 0), pt(0, 1)),  // Down and to the left
	SouthEast:	rect(pt(0, 0), pt(1, 1))   // Down and to the right -- default lighting direction
});


this.Gradient.subclass('lively.paint.RadialGradient', {

	initialize: function($super, stopSpec, optF) {
		$super(NodeFactory.create("radialGradient"));
		this.setStops(stopSpec);
		if (optF) {
			this.setTrait("fx", optF.x);
			this.setTrait("fy", optF.y);
		}
	}
});

Object.extend(this.RadialGradient, {
	fromLiteral: function(literal) {
		return new lively.paint.RadialGradient(literal.stops, literal.focus);
	}
});

});// lively.paint
