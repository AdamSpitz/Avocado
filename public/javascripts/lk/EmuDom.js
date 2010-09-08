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


/*
 * This file presents a JavaScript emulation of enough of the DOM
 * to run the Lively Kernel.  It began with a version by Daniel Amelang
 * and was extended to full functionality by Krzysztof Palacz.
 */

Global.emudom = (function() {
var TODO = function() {
  var e = new Error;
  e.message = 'Not yet implemented:\n' + e.stack;
  throw e;
};
    

    var extend = function(destination, source) {
	for (var property in source) {
	    var getter = source.__lookupGetter__(property);
	    if (getter)
		destination.__defineGetter__(property, getter);
	    var setter = source.__lookupSetter__(property);
	    if (setter)
		destination.__defineSetter__(property, setter);
	    if (!getter && !setter)
		destination[property] = source[property];
	}
	return destination;
    };
    
    var deepClone = function(original /*, blacklist */) {
  var blacklist = Array.prototype.slice.call(arguments, 1);
  var clone = original;

  if (original && typeof original == 'object') {
    if (original instanceof Array) {
      clone = new Array(original.length);
      for (var i = 0; i < original.length; i++)
        clone[i] = (original[i] && original[i].deepClone) ?
                   original[i].deepClone() : deepClone(original[i]);
    }
    else {
      clone = {};
      clone.__proto__ = original.__proto__;
	//clone.constructor = original.constructor;

      for (var p in original) {
	  if (!original.hasOwnProperty(p)) continue;
        if (blacklist.indexOf(p) != -1)
          continue;
        var getter = original.__lookupGetter__(p);
        if (getter)
          clone.__defineGetter__(p, getter);
        var setter = original.__lookupSetter__(p);
        if (setter)
          clone.__defineSetter__(p, setter);
        if (!getter && !setter)
          clone[p] = (original[p] && original[p].deepClone) ?
                     original[p].deepClone() : deepClone(original[p]);
      }
    }
  }
  return clone;
};



    var NodeList = function() { this._nodes = []; };

extend(NodeList.prototype, {
  item: function(index) { return this._nodes[index]; },
    get length() { return this._nodes.length; },
  _each: function(iterator) { // this is for the sake of prototype.
      for (var i = 0, length = this._nodes.length; i < length; i++)
	  iterator(this.item([i]));
  }
    
});
//extend(NodeList.prototype, Enumerable);


// NamedNodeMap

var NamedNodeMap = function() { this._nodes = []; }

extend(NamedNodeMap.prototype, {
  getNamedItem: function(name) { return this.getNamedItemNS(null, name); },
  setNamedItem: function(arg)  { return this.setNamedItemNS(null, arg); },
  removeNamedItem: function(name) { return this.removeNamedItemNS(null, name); },
  item: function(index) { return this._nodes[index]; },
  get length() { return this._nodes.length; },

  getNamedItemNS: function(namespaceURI, localName) {
    for (var i = 0; i < this._nodes.length; i++) {
      if (this._nodes[i].localName == localName &&
          this._nodes[i].namespaceURI == namespaceURI)
        return this._nodes[i];
    }
    return null;
  },

  setNamedItemNS: function(arg) {
    var node = this.getNamedItemNS(arg.namespaceURI, arg.localName);
    if (node)
      this._nodes[this._nodes.indexOf(node)] = arg;
    else
      this._nodes.push(arg);
    return node;
  },

  removeNamedItemNS: function(namespaceURI, localName) {
    var node = this.getNamedItemNS(namespaceURI, localName);
    if (node)
      this._nodes.splice(this._nodes.indexOf(node), 1);
    return node;
  }
});

// Node

var Node = function() {};

extend(Node, {
  ELEMENT_NODE: 1,
  ATTRIBUTE_NODE: 2,
  TEXT_NODE: 3,
  CDATA_SECTION_NODE: 4,
  ENTITY_REFERENCE_NODE: 5,
  ENTITY_NODE: 6,
  PROCESSING_INSTRUCTION_NODE: 7,
  COMMENT_NODE: 8,
  DOCUMENT_NODE: 9,
  DOCUMENT_TYPE_NODE: 10,
  DOCUMENT_FRAGMENT_NODE: 11,
  NOTATION_NODE: 12,

  find: function(node, predicate) {
    if (predicate(node))
      return node;
    for (var i = 0; i < node.childNodes.length; i++) {
      result = Node.find(node.childNodes.item(i), predicate);
      if (result)
        return result;
    }
    return null;
  },

  findAncestor: function(node, predicate) {
    if (!node.parentNode)
      return null;
    else if (predicate(node.parentNode))
      return node.parentNode;
    else
      return Node.findAncestor(node.parentNode, predicate);
  },

  forEach: function(node, action) {
    action(node);
    for (var i = 0; i < node.childNodes.length; i++)
      Node.forEach(node.childNodes.item(i), action);
  }
});

extend(Node.prototype, {
  get nodeName()  { return null; },
  get nodeValue() { return null; },
  set nodeValue(value) { },
  get nodeType() { return 0; },
  get parentNode() { return this._parentNode; },
  get childNodes() { return this._childNodes ? this._childNodes : new NodeList; },
  get firstChild() { return this.childNodes.item(0); },
  get lastChild()  { return this.childNodes.item(this.childNodes.length - 1); },

  get previousSibling() {
    if (!this.parentNode)
      return null;
    var siblings = this.parentNode.childNodes;
    return siblings.item(siblings._nodes.indexOf(this) - 1);
  },

  get nextSibling() {
    if (!this.parentNode)
      return null;
    var siblings = this.parentNode.childNodes;
    return siblings.item(siblings._nodes.indexOf(this) + 1);
  },

  get attributes() { return this._attributes; },
  get ownerDocument() { return this._ownerDocument; },

  insertBefore: function(newChild, refChild) {
    if (!this._childNodes)
      return;
    this.removeChild(newChild);
    newChild._parentNode = this;
    if (refChild) {
      var index = this.childNodes._nodes.indexOf(refChild);
      this.childNodes._nodes.splice(index, 0, newChild);
    }
    else
      this.childNodes._nodes.push(newChild);
    return newChild;
  },

  replaceChild: function(newChild, oldChild) {
    this.insertBefore(newChild, oldChild);
    return this.removeChild(oldChild);
  },

  removeChild: function(oldChild) {
    if (!this._childNodes)
      return;
    var index = this.childNodes._nodes.indexOf(oldChild);
    if (index != -1) {
      oldChild._parentNode = null;
      this.childNodes._nodes.splice(index, 1);
    }
    return oldChild;
  },

  appendChild: function(newChild) {
    if (!this._childNodes)
      return newChild; // FIXME throw HIERARCHY_REQUEST_ERROR ?
    this.removeChild(newChild);
    newChild._parentNode = this;
    this.childNodes._nodes.push(newChild);
      return newChild;
  },

  hasChildNodes: function() { return this.childNodes.length > 0; },

  deepClone: function() {
      // KP: added _fxBegin, _fxShape to blacklist. This is obviously a workaround
      //,  objects should be able to declare their blacklists
    var clone = deepClone(this,
	'_ownerDocument', '_parentNode', '_ownerElement', '_fxBegin', '_fxShape');
    if (this._ownerDocument)
      clone._ownerDocument = this._ownerDocument;
    if (this.childNodes)
      for (var i = 0; i < this.childNodes.length; i++)
        clone.childNodes.item(i)._parentNode = clone;
    if (this.attributes)
      for (var i = 0; i < this.attributes.length; i++)
        clone.attributes.item(i)._ownerElement = clone;
    return clone;
  },

  cloneNode: function(deep) {
    var clone;
    if (deep)
      clone = this.deepClone();
    else {
	//clone = extend({}, this);
	clone = {};
	clone.__proto__ = this.__proto__;
	for (var p in this) {
	    if (!this.hasOwnProperty(p)) continue;
	    clone[p] = this[p];
	}
      clone._parentNode = null;
      if (this._childNodes)
        clone._childNodes = new NodeList;
      if (this._ownerElement)
        clone._ownerElement = null;
      // deep clone the attributes
      if (this._attributes) {
        clone._attributes = deepClone(this._attributes);
        for (var i = 0; i < this._attributes.length; i++)
          clone._attributes.item(i)._ownerElement = clone;
      }
    }
    return clone;
  },

  normalize: function() { TODO(); },
  isSupported: function(feature, version) { TODO(); },
  get namespaceURI() { return this._namespaceURI; },
  get prefix() { return this._prefix; },
  // TODO according to the spec, this is supposed to have strange side effects
  set prefix(value) { this._prefix = value; },
  get localName() { return this._localName; },

  hasAttributes: function() {
    return this.attributes && this.attributes.length > 0;
  }
});

// Attr

var Attr = function() { Node.call(this); };

extend(Attr.prototype, Node.prototype);
extend(Attr.prototype, {
  get nodeName() { return this.name; },
  get nodeValue() { return this.value; },
  set nodeValue(value) { this.value = value; },
  get nodeType() { return Node.ATTRIBUTE_NODE; },
  get parentNode() { return null; },

  get childNodes() {
    var nodes = new NodeList;
    if (this.value != '')
      nodes._nodes = [this.ownerDocument.createTextNode(this.value)];
    return nodes;
  },

  get name() { return this._name; },
  get specified() { return true; },
  get value() { return String(this._value); },

  set value(value) {
    this._value = String(value == null ? '' : value); 
    var owner = this.ownerElement;
    var specs = owner && owner.constructor.attributeSpecs;
    var spec = specs && specs[this.name];
    if (this._value == '' && spec && spec.defaultValue)
      this._value = spec.defaultValue;
    if (spec && spec.parser)
      this._value = spec.parser(this._value);
  },

  get ownerElement() { return this._ownerElement; },

  toString: function() { return this.name + '="' + this.value + '"'; }
});

// Element

var Element = function() {
  Node.call(this);
  this._childNodes = new NodeList;
  this._attributes = new NamedNodeMap;
};

extend(Element, {
  factories: {},

  // attributeSpec can have name, parser, type(.fromString), defaultValue and xmlName
  defineAttribute: function(element, attributeSpec) {
    attributeSpec = attributeSpec.name ? attributeSpec : {name:attributeSpec};
    var xmlName = attributeSpec.xmlName || attributeSpec.name;
    attributeSpec.parser = attributeSpec.parser ||
      (attributeSpec.type && attributeSpec.type.fromString) || attributeSpec.type;
    element.attributeSpecs = element.attributeSpecs || {};
    element.attributeSpecs[xmlName] = attributeSpec;

    // TODO we should not assume that all attributes have a getter
    element.prototype.__defineGetter__(attributeSpec.name, function() {
      var node = this.getAttributeNode(xmlName);
      if (!node) {
        node = this.ownerDocument.createAttribute(xmlName);
        this.setAttributeNode(node);
      }
      return node._value;
    });

    if (!attributeSpec.readonly) {
      element.prototype.__defineSetter__(attributeSpec.name, function(value) {
        var node = this.getAttributeNode(xmlName);
        if (!node) {
          node = this.ownerDocument.createAttribute(xmlName);
          this.setAttributeNode(node);
        }
        node.value = value;
      });
    }
  },

  defineAttributes: function(element) {
    for (var i = 1; i < arguments.length; i++)
      this.defineAttribute(element, arguments[i]);
  }
});

extend(Element.prototype, Node.prototype);
extend(Element.prototype, {
  get nodeName() { return this.tagName; },
  get nodeType() { return Node.ELEMENT_NODE; },
  get tagName() { return this._tagName; },

  getAttribute: function(name) {
    return this.getAttributeNS(null, name);
  },

  setAttribute: function(name, value) {
    return this.setAttributeNS(null, name, value);
  },

  removeAttribute: function(name) {
    return this.removeAttributeNS(null, name);
  },

  getAttributeNode: function(name) {
    return this.getAttributeNodeNS(null, name);
  },

  setAttributeNode: function(newAttr) {
    return this.setAttributeNodeNS(newAttr);
  },

  removeAttributeNode: function(oldAttr) {
    this.attributes.removeNamedItemNS(oldAttr.namespaceURI, oldAttr.localName);
    oldAttr._ownerElement = null;
    return oldAttr;
  },

  getElementsByTagName: function(name) {
    return this.getElementsByTagNameNS('*', name);
  },

  getAttributeNS: function(namespaceURI, localName) {
    var node = this.getAttributeNodeNS(namespaceURI, localName);
    return node ? node.value : null;
  },

  setAttributeNS: function(namespaceURI, qualifiedName, value) {
    // TODO we're supposed to reuse the attribute node if there already is
    // one with this namespaceURI and local name
    var attr = this.ownerDocument.createAttributeNS(namespaceURI, qualifiedName);
    this.setAttributeNodeNS(attr);
    attr.value = value;
  },

  removeAttributeNS: function(namespaceURI, localName) {
    var oldAttr = this.attributes.removeNamedItemNS(namespaceURI, localName); 
    oldAttr && (oldAttr._ownerElement = null);
  },

  getAttributeNodeNS: function(namespaceURI, localName) {
    return this.attributes.getNamedItemNS(namespaceURI, localName);
  },

  setAttributeNodeNS: function(newAttr) {
    var oldAttr = this.attributes.setNamedItemNS(newAttr);
    oldAttr && (oldAttr._ownerElement = null);
    newAttr._ownerElement = this;
    newAttr.value = newAttr.value; // Force the value to be parsed
    return oldAttr;
  },

  getElementsByTagNameNS: function(namespaceURI, localName) {
    var elements = new NodeList;
    Node.forEach(this, function(node) {
      if (node.nodeType == Node.ELEMENT_NODE &&
          (localName == '*'    || node.localName == localName) &&
          (namespaceURI == '*' || node.namespaceURI == namespaceURI))
        elements._nodes.push(node);
    });
    // TODO this list is supposed to be 'live'. We could use something like
    // a version number on the document that increments whenever the structure
    // changes (insertBefore called on a node) which has the effect of
    // invalidating the contents of the list (forcing a requery when
    // item or length is called on the list).
    return elements;
  },

  hasAttribute: function(name) {
    return this.hasAttributeNS(null, name);
  },

  hasAttributeNS: function(namespaceURI, localName) {
    return this.getAttributeNodeNS(namespaceURI, localName) != null;
  },

  // TODO some elements don't have closing tags
  toString: function(deep) {
    var result = '<' + this.nodeName;
    for (var i = 0; i < this.attributes.length; i++)
      result += ' ' + this.attributes.item(i).toString();
    result += '>\n';
    for (var i = 0; deep && i < this.childNodes.length; i++)
      result += this.childNodes.item(i).toString(deep) + '\n';
    result += '</' + this.tagName + '>';
    return result;
  }
});

// CharacterData

var CharacterData = function() { Node.call(this); };

extend(CharacterData.prototype, Node.prototype);
extend(CharacterData.prototype, {
  get data() { return this._data; },
  set data(value) { this._data = value; },
  get length() { return this.data ? this.data.length : 0; },

  substringData: function(offset, count) {
    return this.data.substr(offset, count);
  },

  appendData: function(arg) {
    this.data = this.data.concat(arg);
  },

  insertData: function(offset, arg) {
    this.data = this.data.substr(0, offset).concat(arg).
      concat(this.data.substr(offset));
  },

  deleteData: function(offset, count) {
    this.data = this.data.substr(0, offset).
      concat(this.data.substr(offset + count));
  },

  replaceData: function(offset, count, arg) {
    this.data = this.data.substr(0, offset).concat(arg).
      concat(this.data.substr(offset + count));
  }
});

// Text

var Text = function() { CharacterData.call(this); };

extend(Text.prototype, CharacterData.prototype);
extend(Text.prototype, {
  get nodeName() { return '#text'; },
  get nodeValue() { return this.data; },
  set nodeValue(value) { this.data = value; },
  get nodeType() { return Node.TEXT_NODE; },

  splitText: function(offset) {
    var text = new Text;
    text.data = this.data.substr(offset);
    this.data = this.data.substr(0, offset);
    if (this.parentNode) {
      var sibling = this.nextSibling;
      if (sibling)
        this.parentNode.insertBefore(text, sibling);
      else
        this.parentNode.appendChild(text);
    }
    return text;
  },
  
  toString: function() { return this.data; }
});

// TODO temporary work around for the lk naming clash...
var DOMText = Text;

// CDATASection

var CDATASection = function() { DOMText.call(this); };

extend(CDATASection.prototype, DOMText.prototype);
CDATASection.prototype.toString = function() {
  return '<![CDATA[' + this.data + ']]>';
};

// Document

var Document = function() {
  Node.call(this);
  this._childNodes = new NodeList;
};

extend(Document.prototype, Node.prototype);
extend(Document.prototype, {
  get nodeName() { return '#document;'; },
  get nodeType() { return Node.DOCUMENT_NODE; },
    get doctype() { TODO() },
  get implementation() { TODO(); },

  get documentElement() {
    return Node.find(this, function(e) {
      return e.nodeType == Node.ELEMENT_NODE;
    });
  },

  createElement: function(tagName) { return this.createElementNS(null, tagName); },
  createDocumentFragment: function() { TODO(); },

  createTextNode: function(data) {
    // TODO temporary work around for the lk naming clash...
    var text = new DOMText;
    text._ownerDocument = this;
    text.data = data;
    return text;
  },

  createComment: function(data) { TODO(); },

  createCDATASection: function(data) {
    var cdata = new CDATASection;
    cdata._ownerDocument = this;
    cdata.data = data;
    return cdata;
  },

  createProcessingInstruction: function(target, data) { TODO(); },

  createAttribute: function(name) {
    return this.createAttributeNS(null, name);
  },

  createEntityReference: function(name) { TODO(); },

  getElementsByTagName: function(tagName) {
    return this.getElementsByTagNameNS('*', tagName);
  },

  importNode: function(importedNode, deep) { TODO(); },

  createElementNS: function(namespaceURI, qualifiedName) {
    var match = qualifiedName.match(/(\w*):(\w*)/);
    var localName = (match && match[2]) || qualifiedName;
    var factory = Element.factories[namespaceURI];
    var element = new ((factory && factory[localName]) || Element);
    element._ownerDocument = this;
    element._tagName = qualifiedName;
    element._namespaceURI = namespaceURI;
    element._prefix = match && match[1];
    element._localName = localName;
    return element;
  },

  createAttributeNS: function(namespaceURI, qualifiedName) {
    var attr = new Attr;
    var match = qualifiedName.match(/(\w*):(\w*)/);
    attr._ownerDocument = this;
    attr._name = qualifiedName;
    attr._namespaceURI = namespaceURI;
    attr._prefix = match && match[1];
    attr._localName = (match && match[2]) || qualifiedName;
    attr.value = '';
    return attr;
  },

  getElementsByTagNameNS: function(namespaceURI, localName) {
    return this.documentElement.getElementsByTagNameNS(namespaceURI, localName);
  },

  getElementById: function(elementId) { return null; }
});

// FIXME
DocumentType = function() {}    




Object.subclass('Event', {
    get type() { return this._type; },
	set type(t) { this._type = t; },
    get currentTarget() { return this._currentTarget; },
    //...
    stopPropagation: function() { this._propagationStopped = true; },
    preventDefault: function() { /* no default to prevent?*/ },
    toString: function() { return this._type; }
});

Event.subclass('MouseEvent', {
    get shiftKey() { return this._shiftKey; },
    get altKey()  { return this._altKey; },
    get clientX() { return this._clientX; },
    get clientY() { return this._clientY; },
    toString: function() { return this._type + "@" + pt(this._clientX, this._clientY); }
});

  //FIXME: check standards

Event.subclass('KeyboardEvent', {
    get keyCode() { return this._keyCode },
    get charCode() {  return this._keyChar; }
});

var EventTarget = {
  // TODO check the spec again
  addEventListener: function(type, listener, useCapture) {
    this._eventListeners = this._eventListeners || {};
    this._eventListeners[type] = this._eventListeners[type] || []; 
    this._eventListeners[type].push(listener);
  },

  // TODO check the spec again
  removeEventListener: function(type, listener, useCapture) {
    this._eventListeners = this._eventListeners || {};
      var listeners = this._eventListeners[type];
      if (listeners && listeners.indexOf(listener) >= 0)
	  listeners.splice(listeners.indexOf(listener), 1);
    //TODO();
  },

  dispatchEvent: function(evt) {
    var listeners = this._eventListeners && this._eventListeners[evt.type];
    evt._currentTarget = this;
    if (listeners)
      listeners.forEach(function(l) { l.handleEvent(evt); });

    this.childNodes._nodes.forEach(function(c) {
      if (!evt._propagationStopped)
        c.dispatchEvent(evt);
    });
  },
};

Function.wrap(Element.prototype, ['deepClone', 'cloneNode'],
function(func, args) {
  var listeners = this._eventListeners;
  delete this._eventListeners;
  var clone = func.apply(this, args);
  listeners && (this._eventListeners = listeners);
  return clone;
});

// TODO we really should put this in Node, but we'll just put it in Element
// for now. The root reason/cause of this hack is that JS doesn't really
// support multiple inheritance.
extend(Element.prototype, EventTarget);
 extend(Text.prototype, EventTarget);


// TODO this should go in a separate file dedicated to CSS
var CSSStyleDeclaration = function() {};
CSSStyleDeclaration.fromString = function(s) { TODO(); };

// TODO missing interfaces (among many others)
// SVGUnitTypes
// SVGURIReference
// css::ViewCSS
// css::DocumentCSS
// events::DocumentEvent
// SVGZoomAndPan
// SVGFitToViewBox
// SVGTests
// SVGLangSpace
// SVGExternalResourcesRequired

// SVGNumber

var SVGNumber = function() {};

SVGNumber.fromString = function(s) {
  var object = new SVGNumber;
  object.value = s;
  return object;
};

extend(SVGNumber.prototype, {
  get value() { return this._value; },
  set value(value) { this._value = parseFloat(String(value)) || 0; },
  toString: function() { return String(this.value); }
});

// SVGLength

var SVGLength = function() {};

extend(SVGLength, {
  SVG_LENGTHTYPE_UNKNOWN:    0,
  SVG_LENGTHTYPE_NUMBER:     1,
  SVG_LENGTHTYPE_PERCENTAGE: 2,
  SVG_LENGTHTYPE_EMS:        3,
  SVG_LENGTHTYPE_EXS:        4,
  SVG_LENGTHTYPE_PX:         5,
  SVG_LENGTHTYPE_CM:         6,
  SVG_LENGTHTYPE_MM:         7,
  SVG_LENGTHTYPE_IN:         8,
  SVG_LENGTHTYPE_PT:         9,
  SVG_LENGTHTYPE_PC:        10,
  unitTypeToString: ['', '', '%', 'em', 'ex', 'px', 'cm', 'mm', 'in', 'pt', 'pc']
});

SVGLength.fromString = function(s) {
  var object = new SVGLength;
  object.valueAsString = s;
  return object;
};

extend(SVGLength.prototype, {
  get unitType() { return this._unitType; },
  get value() { return this._value; },
  set value(value) { this._value = parseFloat(String(value)) || 0; },
  get valueInSpecifiedUnits() { TODO(); },
  set valueInSpecifiedUnits(value) { TODO(); },
  get valueAsString() {
    var value = this._value;
    // TODO must denormalize other unit types, too
    if (this._unitType == SVGLength.SVG_LENGTHTYPE_PERCENTAGE)
      value *= 100;
    return value + SVGLength.unitTypeToString[this._unitType];
  },
  set valueAsString(value) {
      // KP: note that lengths can be negative in SVG
      var match = String(value).match(/((-)?\d*\.?\d*)(%|\w*)/);
    this.value = match && match[1];
    
    this._unitType = SVGLength.unitTypeToString.
      lastIndexOf(match && match[3] || '');
    // TODO must normalize other unit types, too
    if (this._unitType == SVGLength.SVG_LENGTHTYPE_PERCENTAGE)
      this._value /= 100;
  },
  newValueSpecifiedUnits:
    function(unitType, valueInSpecifiedUnits) { TODO(); },
  convertToSpecifiedUnits: function(unitType) { TODO(); },
  toString: function() { return this.valueAsString; }
});

// SVGPoint

var SVGPoint = function() {};

SVGPoint.fromString = function(s) {
  var point = new SVGPoint;
  var coors = s.split(/(?:\s|,)+/);
  point.x = parseFloat(coors[0]) || 0;
  point.y = parseFloat(coors[1]) || 0;
  return point;
};

extend(SVGPoint.prototype, {
  get x() { return this._x; },
  set x(value) { this._x = value; },
  get y() { return this._y; },
  set y(value) { this._y = value; },

  matrixTransform: function(matrix) {
    var point = new SVGPoint;
    point.x = this.x * matrix.a + this.y * matrix.c + matrix.e;
    point.y = this.x * matrix.b + this.y * matrix.d + matrix.f;
    return point;
  },

  toString: function() {
    return this.x + ',' + this.y;
  }
});

// SVGMatrix

var SVGMatrix = function() {
  this._a = 1.0; this._c = 0.0; this._e = 0.0;
  this._b = 0.0; this._d = 1.0; this._f = 0.0;
};

extend(SVGMatrix.prototype, {
  get a() { return this._a; },
  set a(value) { this._a = value; },
  get b() { return this._b; },
  set b(value) { this._b = value; },
  get c() { return this._c; },
  set c(value) { this._c = value; },
  get d() { return this._d; },
  set d(value) { this._d = value; },
  get e() { return this._e; },
  set e(value) { this._e = value; },
  get f() { return this._f; },
  set f(value) { this._f = value; },

  multiply: function(b) {
    var a = this;
    var ab = new SVGMatrix;
    ab.a = a.a * b.a + a.c * b.b;       ab.b = a.b * b.a + a.d * b.b;
    ab.c = a.a * b.c + a.c * b.d;       ab.d = a.b * b.c + a.d * b.d;
    ab.e = a.a * b.e + a.c * b.f + a.e; ab.f = a.b * b.e + a.d * b.f + a.f;
    return ab;
  },

  inverse: function() {
    var a = this;
    var b = new SVGMatrix;
    var d = 1 / (a.a * a.d - a.b * a.c);
    b.a =  a.d * d; b.c = -a.c * d; b.e = -a.e * b.a - a.f * b.c;
    b.b = -a.b * d; b.d =  a.a * d; b.f = -a.e * b.b - a.f * b.d;
    return b;
  },

  translate: function(x, y) {
    var matrix = new SVGMatrix;
    matrix.e = x; matrix.f = y
    return matrix.multiply(this);
  },

  scale: function(scaleFactor) {
    return this.scaleNonUniform(scaleFactor, scaleFactor);
  },

  scaleNonUniform: function(scaleFactorX, scaleFactorY) {
    var matrix = new SVGMatrix;
    matrix.a = scaleFactorX;
    matrix.d = scaleFactorY;
    return matrix.multiply(this);
  },

  rotate: function(angle) {
    var matrix = new SVGMatrix;
    matrix.a = Math.cos(angle);
    matrix.b = Math.sin(angle);
    matrix.c = -matrix.b;
    matrix.d = matrix.a;
    return matrix.multiply(this);
  },

  rotateFromVector: function(x, y) { TODO(); },
  flipX: function() { TODO(); },
  flipY: function() { TODO(); },

  skewX: function(angle) {
    var matrix = new SVGMatrix;
    matrix.c = Math.tan(angle);
    return matrix.multiply(this);
  },

  skewY: function(angle) {
    var matrix = new SVGMatrix;
    matrix.b = Math.tan(angle);
    return matrix.multiply(this);
  }
});

// SVGTransform

var SVGTransform = function() {
  this._type = SVGTransform.SVG_TRANSFORM_UNKNOWN;
};

extend(SVGTransform, {
  SVG_TRANSFORM_UNKNOWN:   0,
  SVG_TRANSFORM_MATRIX:    1,
  SVG_TRANSFORM_TRANSLATE: 2,
  SVG_TRANSFORM_SCALE:     3,
  SVG_TRANSFORM_ROTATE:    4,
  SVG_TRANSFORM_SKEWX:     5,
  SVG_TRANSFORM_SKEWY:     6,
  typeToString:
    ['unknown', 'matrix', 'translate', 'scale', 'rotate', 'skewX', 'skewY']
});

SVGTransform.fromString = function(s) {
  var transform = new SVGTransform;
  var match = s.match(/(\w+)\s*\((.*)\)/);
  if (match) {
    var args = match[2].split(/(?:\s|,)+/).
      map(function(n) { return parseFloat(n) || 0; });
    switch (match[1]) {
      case 'matrix':
        var matrix = new SVGMatrix;
        matrix.a = args[0]; matrix.b = args[1];
        matrix.c = args[2]; matrix.d = args[3];
        matrix.e = args[4]; matrix.f = args[5];
        transform.setMatrix(matrix);
        break;
      case 'translate':
        transform.setTranslate(args[0], args[1]);
        break;
      case 'scale':
        transform.setScale(args[0], args[1]);
        break;
      case 'rotate':
        transform.setRotate(args[0], args[1], args[2]);
        break;
      case 'skewX':
        transform.setSkewX(args[0]);
        break;
      case 'skewY':
        transform.setSkewY(args[0]);
        break;
    }
  }
  return transform;
};

extend(SVGTransform.prototype, {
  get type() { return this._type; },
  get matrix() { return this._matrix; },
  get angle() { return this._angle; },

  setMatrix: function(matrix) {
    this._type = SVGTransform.SVG_TRANSFORM_MATRIX;
    this._angle = 0;
    this._matrix = new SVGMatrix;
    this._matrix.a = matrix.a; this._matrix.b = matrix.b;
    this._matrix.c = matrix.c; this._matrix.d = matrix.d;
    this._matrix.e = matrix.e; this._matrix.f = matrix.f;
  },

  setTranslate: function(tx, ty) {
    this._type = SVGTransform.SVG_TRANSFORM_TRANSLATE;
    this._angle = 0;
    this._matrix = (new SVGMatrix).translate(tx, ty || 0);
  },

  setScale: function(sx, sy) {
    this._type = SVGTransform.SVG_TRANSFORM_SCALE;
    this._angle = 0;
    this._matrix = (new SVGMatrix).scaleNonUniform(sx, sy || sx);
  },

  setRotate: function(angle, cx, cy) {
      cx && console.log('ignoring anchor ' + [cx, cy]);
      //cx && TODO(); // We don't handle the optional cx cy yet
    this._type = SVGTransform.SVG_TRANSFORM_ROTATE;
    this._angle = angle;
    this._matrix = (new SVGMatrix).rotate(angle);
  },

  setSkewX: function(angle) {
    this._type = SVGTransform.SVG_TRANSFORM_SKEWX;
    this._angle = angle;
    this._matrix = (new SVGMatrix).skewX(angle);
  },

  setSkewY: function(angle) {
    this._type = SVGTransform.SVG_TRANSFORM_SKEWY;
    this._angle = angle;
    this._matrix = (new SVGMatrix).skewY(angle);
  },

  // TODO what about the optional cx cy for rotate?
  toString: function() {
    var args = [];
    with (SVGTransform)
      switch (this.type) {
        case SVG_TRANSFORM_MATRIX:    args = [this.matrix.a, this.matrix.b,
                                              this.matrix.c, this.matrix.d,
                                              this.matrix.e, this.matrix.f]; break;
        case SVG_TRANSFORM_TRANSLATE: args = [this.matrix.e, this.matrix.f]; break;
        case SVG_TRANSFORM_SCALE:     args = [this.matrix.a, this.matrix.d]; break;
        case SVG_TRANSFORM_ROTATE:    args = [this.angle];     break;
        case SVG_TRANSFORM_SKEWX:     args = [this.angle];     break;
        case SVG_TRANSFORM_SKEWY:     args = [this.angle];     break;
      }
    return SVGTransform.typeToString[this.type] + '(' + args.join(' ') + ')';
  }
});

// SVGList (used for SVGStringList, SVGPointList, etc.)

var SVGList = function() { this._items = []; };

extend(SVGList.prototype, {
  get numberOfItems() { return this._items.length; },
  clear: function() { this._items.length = 0; },

  initialize: function(newItem) {
    this.clear();
    return this.appendItem(newItem);
  },

  getItem: function(index) { return this._items[index]; },
  insertItemBefore: function(newItem, index) { TODO(); },
  replaceItem: function(newItem, index) { TODO(); },
  removeItem: function(index) { TODO(); },

  appendItem: function(newItem) {
    this._items.push(newItem);
    return newItem; 
  },

  toString: function() {
    return this._items.join(' ');
  }
});

// SVGPointList

var SVGPointList = function() { SVGList.call(this); };
extend(SVGPointList.prototype, SVGList.prototype);
extend(SVGPointList, {
  fromString: function(s) {
    var list = new SVGPointList;
    var items = s.split(/(?:\s|,)+/);
    for (var i = 0; i < items.length - 1; i += 2)
      list.appendItem(SVGPoint.fromString(items[i] + ',' + items[i + 1]));
    return list;
  }
});

// SVGNumberList

var SVGNumberList = function() { SVGList.call(this); };
extend(SVGNumberList.prototype, SVGList.prototype);
extend(SVGNumberList, {
  fromString: function(s) {
    var list = new SVGNumberList;
    var items = s.split(/(?:\s|,)+/);
    for (var i = 0; i < items.length; i++)
      list.appendItem(SVGNumber.fromString(items[i]));
    return list;
  }
});

// SVGLengthList

var SVGLengthList = function() { SVGList.call(this); };
extend(SVGLengthList.prototype, SVGList.prototype);
extend(SVGLengthList, {
  fromString: function(s) {
    var list = new SVGLengthList;
    var items = s.split(/(?:\s|,)+/);
    for (var i = 0; i < items.length; i++)
      list.appendItem(SVGLength.fromString(items[i]));
    return list;
  }
});

// SVGTransformList

var SVGTransformList = function() { SVGList.call(this); };
extend(SVGTransformList.prototype, SVGList.prototype);
extend(SVGTransformList, {
  fromString: function(s) {
    var list = new SVGTransformList;
    var items = s.split(/\)\s*,*\s*/);
    for (var i = 0; i < items.length - 1; i++)
      list.appendItem(SVGTransform.fromString(items[i] + ')'));
    return list;
  }
});

extend(SVGTransformList.prototype, {
  createSVGTransformFromMatrix: function(matrix) {
    var transform = new SVGTransform;
    transform.setMatrix(matrix);
    return transform;
  },

  consolidate: function() {
    if (this.numberOfItems == 0)
      return null;
    if (this.numberOfItems == 1)
      return this.getItem(0);
    var matrix = new SVGMatrix;
    for (var i = 0; i < this.numberOfItems; i++)
      matrix = this.getItem(i).matrix.multiply(matrix);
    this.clear();
    return this.appendItem(this.createSVGTransformFromMatrix(matrix));
  }
});

// SVGAnimated (used for SVGAnimatedBoolean, etc.)

var SVGAnimated = function() {};

SVGAnimated.defineAnimated = function(classToAnimate, readonly) {
  var fromString = classToAnimate.fromString || classToAnimate;
  var animatedClass = function() {};
  extend(animatedClass.prototype, SVGAnimated.prototype);
  if (!readonly)
    animatedClass.prototype.__defineSetter__('baseVal',
      function(value) { this._baseVal = value; });
  animatedClass.fromString = function(s) {
    var object = new animatedClass;
    object._baseVal = fromString(s);
    return object;
  };
  return animatedClass;
};

extend(SVGAnimated.prototype, {
  get baseVal() { return this._baseVal; },
  // TODO this isn't correct...
  get animVal() { return this._baseVal; },
  toString: function() { return this._baseVal.toString(); }
});

// TODO will Boolean correctly parse the value strings? Probably not...
var SVGAnimatedBoolean = SVGAnimated.defineAnimated(Boolean);
var SVGAnimatedNumber = SVGAnimated.defineAnimated(SVGNumber);
var SVGAnimatedEnumeration = SVGAnimated.defineAnimated(parseInt);
var SVGAnimatedLength = SVGAnimated.defineAnimated(SVGLength, true);
var SVGAnimatedString = SVGAnimated.defineAnimated(String);
var SVGAnimatedNumberList = SVGAnimated.defineAnimated(SVGNumberList, true);
var SVGAnimatedLengthList = SVGAnimated.defineAnimated(SVGLengthList, true);
var SVGAnimatedTransformList = SVGAnimated.defineAnimated(SVGTransformList, true);

// SVGLocatable

var SVGLocatable = function() {};
extend(SVGLocatable.prototype, {
  get nearestViewportElement() { TODO(); },
  get farthestViewportElement() { TODO(); },
  getBBox: function() { TODO(); },
  getCTM: function() { TODO(); },
  getScreenCTM: function() { TODO(); },

  getTransformToElement: function(element) {
    var matrix;

    if (this === element)
      return new SVGMatrix;
    if (this.parentNode && this.parentNode.getTransformToElement)
      matrix = this.parentNode.getTransformToElement(element);
    else
      matrix = new SVGMatrix;

    if (this.hasAttribute('transform') &&
        this.transform.baseVal.numberOfItems) {
      var list = new SVGTransformList;
      list._items = this.transform.baseVal._items.concat();
      // TODO which is right?
      matrix = matrix.multiply(list.consolidate().matrix.inverse());
      //matrix = list.consolidate().matrix.inverse().multiply(matrix);
    }

    return matrix;
  },
});

// SVGTransformable

var SVGTransformable = function() { SVGLocatable.call(this); };
extend(SVGTransformable.prototype, SVGLocatable.prototype);
Element.defineAttributes(SVGTransformable,
  {name:'transform', type:SVGAnimatedTransformList, readonly:true});

// SVGStylable

var SVGStylable = function() {};
Element.defineAttributes(SVGStylable,
  {name:'className', type:SVGAnimatedString,   readonly:true, xmlName:'class'},
  {name:'style',     type:CSSStyleDeclaration, readonly:true});
SVGStylable.prototype.getPresentationAttribute = function(name) { TODO(); };

// SVGAnimatedPoints

var SVGAnimatedPoints = function() {};
Element.defineAttributes(SVGAnimatedPoints,
  {name:'points',         type:SVGPointList, readonly:true});

extend(SVGAnimatedPoints.prototype, {
  get animatedPoints() { return this.points; } // TODO not correct...
});

// SVGElement

var SVGElement = function() { Element.call(this); };
extend(SVGElement.prototype, Element.prototype);
Element.factories['http://www.w3.org/2000/svg'] = SVGElement.factory = {};

SVGElement.defineElement = function(name, parents) {
  (parents = parents || []).unshift(this);
  var element = function() {
      parents.forEach(function(parent) { parent.call(this); }, this);
  };
  element.attributeSpecs = {};
  parents.forEach(function(parent) {
    extend(element.attributeSpecs, parent.attributeSpecs);
    extend(element.prototype, parent.prototype);
  });
  Element.defineAttributes.apply(Element,
    [element].concat(Array.prototype.slice.call(arguments, 2)));
  if (name) {
    this.factory[name] = element;
    element.tagName = 'http://www.w3.org/2000/svg:' + name;
  }
  return element;
};

Element.defineAttributes(SVGElement, 'id', 'xmlbase');

extend(SVGElement.prototype, {
  get ownerSVGElement() {
    return Node.findAncestor(this, function(p) { return p.nodeName == 'svg'; });
  },
  get viewpointElement() { TODO(); },
});

// SVGSVGElement

var SVGSVGElement = SVGElement.defineElement('svg', [SVGLocatable, SVGStylable],
  {name:'x',      type:SVGAnimatedLength, readonly:true, defaultValue:'0'},
  {name:'y',      type:SVGAnimatedLength, readonly:true, defaultValue:'0'},
  {name:'width',  type:SVGAnimatedLength, readonly:true, defaultValue:'100%'},
  {name:'height', type:SVGAnimatedLength, readonly:true, defaultValue:'100%'});

extend(SVGSVGElement.prototype, {
  createSVGMatrix: function() { return new SVGMatrix; },
  createSVGTransform: function() { return new SVGTransform; },
  createSVGPoint: function() { return new SVGPoint(); }
});

// SVGDefsElement

var SVGDefsElement = SVGElement.defineElement('defs',
  [SVGTransformable, SVGStylable]);

// SVGEllipseElement

var SVGEllipseElement = SVGElement.defineElement('ellipse',
  [SVGTransformable, SVGStylable],
  {name:'cx', type:SVGAnimatedLength, readonly:true, defaultValue:'0'},
  {name:'cy', type:SVGAnimatedLength, readonly:true, defaultValue:'0'},
  {name:'rx', type:SVGAnimatedLength, readonly:true, defaultValue:'0'},
  {name:'ry', type:SVGAnimatedLength, readonly:true, defaultValue:'0'});

// SVGGElement

var SVGGElement = SVGElement.defineElement('g', [SVGTransformable, SVGStylable]);

// SVGGradientElement

var SVGGradientElement = SVGElement.defineElement(null, [SVGStylable],
  {name:'gradientUnits',     type:SVGAnimatedEnumeration,   readonly:true},
  {name:'gradientTransform', type:SVGAnimatedTransformList, readonly:true},
  {name:'spreadMethod',      type:SVGAnimatedEnumeration,   readonly:true});

extend(SVGGradientElement, {
  SVG_SPREADMETHOD_UNKNOWN: 0,
  SVG_SPREADMETHOD_PAD:     1,
  SVG_SPREADMETHOD_REFLECT: 2,
  SVG_SPREADMETHOD_REPEAT:  3
});

// SVGLinearGradientElement

var SVGLinearGradientElement = SVGElement.defineElement('linearGradient',
  [SVGGradientElement],
  {name:'x1', type:SVGAnimatedLength, readonly:true, defaultValue:  '0%'},
  {name:'y1', type:SVGAnimatedLength, readonly:true, defaultValue:  '0%'},
  {name:'x2', type:SVGAnimatedLength, readonly:true, defaultValue:'100%'},
  {name:'y2', type:SVGAnimatedLength, readonly:true, defaultValue:  '0%'});

// SVGRadialGradientElement

var SVGRadialGradientElement = SVGElement.defineElement('radialGradient',
  [SVGGradientElement],
  {name:'cx', type:SVGAnimatedLength, readonly:true, defaultValue:'50%'},
  {name:'cy', type:SVGAnimatedLength, readonly:true, defaultValue:'50%'},
  {name: 'r', type:SVGAnimatedLength, readonly:true, defaultValue:'50%'},
  {name:'fx', type:SVGAnimatedLength, readonly:true},
  {name:'fy', type:SVGAnimatedLength, readonly:true});

// SVGPolygonElement

var SVGPolygonElement = SVGElement.defineElement('polygon',
  [SVGAnimatedPoints, SVGTransformable, SVGStylable]);

// SVGPolylineElement

var SVGPolylineElement = SVGElement.defineElement('polyline',
  [SVGAnimatedPoints, SVGTransformable, SVGStylable]);

// SVGRectElement

var SVGRectElement = SVGElement.defineElement('rect',
  [SVGTransformable, SVGStylable],
  {name:     'x', type:SVGAnimatedLength, readonly:true, defaultValue:'0'},
  {name:     'y', type:SVGAnimatedLength, readonly:true, defaultValue:'0'},
  {name: 'width', type:SVGAnimatedLength, readonly:true},
  {name:'height', type:SVGAnimatedLength, readonly:true},
  {name:    'rx', type:SVGAnimatedLength, readonly:true},
  {name:    'ry', type:SVGAnimatedLength, readonly:true});

// SVGStopElement

var SVGStopElement = SVGElement.defineElement('stop', [SVGStylable],
  {name:'offset', type:SVGAnimatedNumber, readonly:true});

// SVGTextContentElement

var SVGTextContentElement = SVGElement.defineElement(null, [SVGStylable],
  {name:'textLength',   type:SVGAnimatedLength,      readonly:true},
  {name:'lengthAdjust', type:SVGAnimatedEnumeration, readonly:true});

extend(SVGTextContentElement, {
  LENGTHADJUST_UNKNOWN:          0,
  LENGTHADJUST_SPACING:          1,
  LENGTHADJUST_SPACINGANDGLYPHS: 2
});

extend(SVGTextContentElement.prototype, {
  getNumberOfChars: function () { TODO(); },
  getComputedTextLength: function() { TODO(); },
  getSubStringLength: function(charnum, nchars) { TODO(); },
  getStartPositionOfChar: function(charnum) { TODO(); },
  getEndPositionOfChar: function(charnum) { TODO(); },
  getExtentOfChar: function(charnum) { TODO(); },
  getRotationOfChar: function(charnum) { TODO(); },
  getCharNumAtPosition: function(pot) { TODO(); },
  selectSubString: function(charnum, nchars) { TODO(); },
});

// SVGTextPositioningElement

var SVGTextPositioningElement = SVGElement.defineElement(null,
  [SVGTextContentElement],
  {name:'x',      type:SVGAnimatedLengthList, readonly:true},
  {name:'y',      type:SVGAnimatedLengthList, readonly:true},
  {name:'dx',     type:SVGAnimatedLengthList, readonly:true},
  {name:'dy',     type:SVGAnimatedLengthList, readonly:true},
  {name:'rotate', type:SVGAnimatedNumberList, readonly:true});

// SVGTextElement

var SVGTextElement = SVGElement.defineElement('text',
  [SVGTextPositioningElement, SVGTransformable]);

// SVGTSpanElement

var SVGTSpanElement = SVGElement.defineElement('tspan', [SVGTextPositioningElement]);


var SVGFilterElement = SVGElement.defineElement('filter',  [SVGStylable], // SVGURIReference, 
    {});

var SVGImageElement =  SVGElement.defineElement('image', [SVGLocatable, SVGStylable],
    {name:'x', type:SVGAnimatedLength, defaultValue:  '0'},
    {name:'y', type:SVGAnimatedLength, defaultValue:  '0'},
    {name:'width', type:SVGAnimatedLength, defaultValue: '0'},
    {name:'height', type:SVGAnimatedLength, defaultValue:  '0'}
);


var SVGFEGaussianBlurElement = SVGElement.defineElement('feGaussianBlur', null,
    {name: "in1", readonly: true, type:SVGAnimatedString},
    {name: "stdDeviation", readonly: true, type:SVGAnimatedNumber}
//    {name: "stdDeviationY", readonly: true, type:SVGAnimatedNumber} // verify the spec about XY vs a single deviation
);
						       

//

function SVGPathSegMovetoAbs(x, y) {
    this.x = x;
    this.y = y;
}

function SVGPathSegLinetoAbs(x, y) {
    this.x = x;
    this.y = y;
}
						
function SVGPathSegCurvetoQuadraticSmoothAbs(x, y) {
    this.x = x;
    this.y = y;
}

function SVGPathSegCurvetoQuadraticAbs(x, y, controlX, controlY) {
    this.x = x;
    this.y = y;
    this.controlX = controlX;
    this.controlY = controlY;
}

       
						       
var SVGPathElement = SVGElement.defineElement('path', [SVGLocatable, SVGStylable], {});
												     
extend(SVGPathElement.prototype, {
     createSVGPathSegMovetoAbs: function(x, y) {
	 return new SVGPathSegMovetoAbs(x, y);
     },

     createSVGPathSegLinetoAbs: function(x, y) {
	 return new SVGPathSegLinetoAbs(x, y);
     },

     createSVGPathSegCurvetoQuadraticSmoothAbs: function(x, y) {
	 return new SVGPathSegCurvetoQuadraticSmoothAbs(x, y);
     },

     createSVGPathSegCurvetoQuadraticAbs: function(x, y, controlX, controlY) {
	 return new SVGPathSegCurvetoQuadraticAbs(x, y, controlX, controlY);
     }

});

var HTMLDocument = function () { Document.call(this); };
extend(HTMLDocument.prototype, Document.prototype);

extend(HTMLDocument.prototype, {
  get title() { return this._title; },
  set title(value) { this._title = value; },
  get referrer() { return this._referrer; },
  get domain() { return this._domain; },
  get URL() { return this._URL; },
  get body() { return this._body; },
    set body(value) { this._body = value; },
  get images() { TODO(); },
  get applets() { TODO(); },
  get links() { TODO(); },
  get forms() { TODO(); },
  get anchors() { TODO(); },
  get cookie() { return this._cookie; },
  set cookie(value) { this._cookie = value; },
  open: function() { TODO(); },
  close: function() { TODO(); },
  write: function(text) { TODO(); },
  writeln: function(text) { TODO(); },
  getElementsByName: function(elementName) { TODO(); },

  getElementById: function(id) {
    return Node.find(this.documentElement, function(node) {
      // TODO case-sensitivity?
      return node.nodeType == Node.ELEMENT_NODE &&
             node.getAttribute('id') == id;
    });
  }
});

// HTMLElement

var HTMLElement = function() {
  Element.call(this);
  // TODO we should actually implement the CSS object, and this should be
  // an attribute node, see interface ElementCSSInlineStyle, which HTMLElements
  // should mix in.
  this.style = {};
};
extend(HTMLElement.prototype, Element.prototype);
Element.factories['http://www.w3.org/1999/xhtml'] = HTMLElement.factory = {};

HTMLElement.defineElement = function(name) {
  var element = function() { HTMLElement.call(this); };
  extend(element.prototype, HTMLElement.prototype);
  element.attributeSpecs = {};
  extend(element.attributeSpecs, HTMLElement.attributeSpecs);
  Element.defineAttributes.apply(Element,
    [element].concat(Array.prototype.slice.call(arguments, 1)));
  this.factory[name] = element;
  element.tagName = 'http://www.w3.org/1999/xhtml:' + name;
  return element;
};

Element.defineAttributes(HTMLElement, 'id', 'title', 'lang', 'dir',
  {name:'className', xmlName:'class'});

/* TODO should define tagName for each (using defineElement) */
['sub', 'sup', 'span', 'bdo', 'tt', 'i', 'b', 'u', 's', 'strike', 'big',
 'small', 'em', 'strong', 'dfn', 'code', 'samp', 'kbd', 'var', 'cite',
 'acronym', 'abbr', 'dd', 'dt', 'noframes', 'noscript', 'address', 'center'].
 forEach(function(name) { HTMLElement.factory[name] = HTMLElement; });

var HTMLHtmlElement = HTMLElement.defineElement('html', 'version');
var HTMLHeadElement = HTMLElement.defineElement('head', 'profile');
var HTMLBodyElement = HTMLElement.defineElement('body',
  'aLink', 'background', 'bgColor', 'link', 'text', 'vLink');
var HTMLDivElement = HTMLElement.defineElement('div', 'align');




    return {
	SVGGElement: SVGGElement,
	SVGRectElement: SVGRectElement,
	document: new HTMLDocument()
    }

}());

    

 
console.log('loaded DOM emulation');
