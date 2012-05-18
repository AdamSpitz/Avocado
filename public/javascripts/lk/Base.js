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

 (function() {
// ES 3.1 proposed static functions
// according to rationale_for_es3_1_static_object_methodsaug26.pdf on wiki.ecmascript.org
// implementation uses __defineGetter__/__proto__ logic


Object.defineProperty = function(object, property, descriptor) {
	if (typeof descriptor  !== 'object') throw new TypeError();
	if (descriptor.value) {
		object[String(property)] = descriptor.value;
	} else {
		if (descriptor.getter) 
			object.__defineGetter__(property, descriptor.getter);
		if (descriptor.setter)
			object.__defineSetter__(property, descriptor.setter);
	}
	return object;
};
	 
Object.defineProperties = function(object, descriptorSet) {
	for (var name in descriptorSet) {
		if (!descriptorSet.hasOwnProperty(name)) continue;
		Object.defineProperty(object, name, descriptorSet[name]);
	}
	return object;
}
	 
Object.defineProperties(Object, {
  // I like mine better. -- Adam
  /*
	create: { 
		value: function(proto, descriptorSet) { //descriptor can be undefined
			var object = {};
			object.__proto__ = proto;
			Object.defineProperties(object, descriptorSet);
			return object;
		}
	},
	*/

	keys: { 
		value: function(object, optFast) {
			if (typeof object !== 'object') throw new TypeError('not an object');
			var names = []; // check behavior wrt arrays
			for (var name in object) {
				if (object.hasOwnProperty(name)) 
					names.push(name);
			}
			if (!optFast) names.sort();
			return names;
		}
	},
	 
	getOwnPropertyNames: { 
		value: function(object) {
			// would be different from keys if we could access non-enumerable properties
			return Object.keys(object);
		}
	},
	 
	getPrototypeOf: { 
		value: function(object) {
			if (typeof object !== 'object') throw new TypeError('type ' + (typeof object) + ' does not have a prototype');
			return object.__proto__;
		}
	},
	 
	getOwnPropertyDescriptor: { 
		value: function(object, name) {
			// FIXME? use $schema?
			var descriptor = { enumerable: true, writable: true, flexible: true};
			var getter = object.__lookupGetter__(name);
			var setter = object.__lookupSetter__(name);
			if (getter || setter) {
				descriptor.getter = getter;
				descriptor.setter = setter;
			} else {
				descriptor.value = object[name];
			}
			return descriptor;
		}
	},
	 
	seal: {
		value: function(object) {
			// prevent adding and removing properties
			// in rhino only see use org.mozilla.javascript.tools.shell.Global.seal
			// not implementable yet
			return object;
		}
	},

	freeze: { 
		value: function(object) {
			// like seal, but properties are read-only now
			// not implementable yet
			return object;
		}
	}
});

Object.defineProperties(Function.prototype, {
	bind: { 
		value: function(self, var_args) {
			var thisFunc = this;
			if (arguments.length === 0) {
				return function() {
					return thisFunc.apply(self, arguments);
				}
			}
			var leftArgs = Array.prototype.slice.call(arguments, 1);
			return function(var_args) {
				var args = leftArgs.concat(Array.prototype.slice.call(arguments, 0));
				return thisFunc.apply(self, args);
			};
		}
	},

	// FIXME redefining, 
	bind: {
		value: function bind() {
			function cdr(iterable) {
				var length = iterable.length, results = new Array(length - 1);
				while (length--) results[length - 1] = iterable[length];
				return results;
			}
			// this is the prototype.js definition

      var __method = this, object = arguments[0];
			// Hacked to speed up the very common case where we're only binding the receiver. -- Adam
			if (arguments.length < 2) {
  			if (object === undefined) { return this; }
  			return function thisBound() {
  				return __method.apply(object, arguments);
  			}
			}

			var args = cdr(arguments);
			return function bound() {
				return __method.apply(object, args.concat($A(arguments)));
			}
		}
	}
});
})();


// set to the context enclosing the SVG context.
// rk: replaced "this.window.top || this.window" with "this.window"
// rk: when is it necessary to use the parent context?
var Global = this.window || GLOBAL /*for Node.js*/;
function dbgOn(cond, optMessage) {
	if (optMessage) console.log(optMessage);
	if (cond) eval('debugger'); // note that rhino has issues with this keyword  // aaa hacked to say eval('debugger') instead of just debugger, because YUI compressor barfs on it -- Adam
	// also call as: throw dbgOn(new Error(....))
	return cond;
}

// namespace logic adapted from
// http://higher-order.blogspot.com/2008/02/designing-clientserver-web-applications.html
var using = (function() {

	function Util(args) {  // args is an escaping arguments array
		this.objects = Array.prototype.concat.apply([], args);
		//var ownArgs = this.objects = new Array(args.length);
		//for (var i = 0; i < args.length; i++) ownArgs[i] = args[i];
	};

	Util.prototype = {

		log: function(msg) {
			console.log(msg);
		},

		run: function(inner) {
			var args = this.objects;
			if (this.moduleName) { 
				// little convenience, 
				if (args.length > 0) this.log('using().module(): ignoring args ' + args);
				return module(this.moduleName).requires().toRun(inner);
			} else return inner.apply(args[0], args); 
		},

		model: function(model) {
			// KP: interestingly, declaring the above as "model: function model(model)" 
			// seems to bind model to to the function, not the formal parameter, at least in rhino!
			this.model = model;
			return this;
		},

		module: function(moduleName) {
			this.moduleName = moduleName;
			return this;
		},

		link: function link(literal, variableMap) { 
			variableMap = variableMap || {};
			return new lively.data.Resolver().link(literal, [], undefined, variableMap, this.objects, this.model); 
		},

		extend: function extend(base, extLiteral) {
			return this.link(Object.extend(Object.clone(base), extLiteral));
		},

		test: function(inner) {
			try {
				return this.run(inner);
			} catch (er) {
				alert('test failed: ' + er);
				return undefined;
			}
		}
	}

	return function using() {
		return new Util(arguments);
	}
})();


function namespace(spec, context) {
	var	 i,N;
	context = context || Global;
	spec = spec.valueOf();
	if (typeof spec === 'object') {
		if (typeof spec.length === 'number') {//assume an array-like object
			for (i = 0,N = spec.length; i < N; i++) {
				return namespace(spec[i], context);
			}
		} else {//spec is a specification object e.g, {com: {trifork: ['model,view']}}
			for (i in spec) if (spec.hasOwnProperty(i)) {
				context[i] = context[i] || new lively.lang.Namespace(context, i);
					return namespace(spec[i], context[i]);//recursively descend tree
			}
		}
	} else if (typeof spec === 'string') {
		(function handleStringCase() {
			var parts;
			parts = spec.split('.');
			for (i = 0, N = parts.length; i<N; i++) {
				spec = parts[i];
				if (!Class.isValidIdentifier(spec)) {
					throw new Error('"'+spec+'" is not a valid name for a package.');
				}
				context[spec] = context[spec] || new lively.lang.Namespace(context, spec);
				context = context[spec];
			}
		})();
		return context;
	} else {
		throw new TypeError();
	}
}


function module(moduleName) {
	
	function isNamespaceAwareModule(moduleName) {
		return moduleName && !moduleName.endsWith('.js');
	}
	
	function convertUrlToNSIdentifier(url) {
		var result = url;
		result = result.replace(/\//, '.');
		// get rid of '.js'
		if (result.endsWith('.js')) result = result.substring(0, result.lastIndexOf('.'));
		return result;
	}
	
	function createNamespaceModule(moduleName) {
		return namespace(isNamespaceAwareModule(moduleName) ? moduleName : convertUrlToNSIdentifier(moduleName));
	}
	
	function basicRequire(/*module, requiredModuleNameOrAnArray, anotherRequiredModuleName, ...*/) {
		var args = $A(arguments);	 
		var module = args.shift();
		var preReqModuleNames = Object.isArray(args[0]) ? args[0] : args; // support modulenames as array and parameterlist
		var requiredModules = [];
		for (var i = 0; i < preReqModuleNames.length; i++) {
			var reqModule = createNamespaceModule(preReqModuleNames[i]);
			module.addRequiredModule(reqModule);
			requiredModules.push(reqModule);
		}

		return {
			toRun: function(code) {
				code = code.curry(module); // pass in own module name for nested requirements
				var codeWrapper = function() { // run code with namespace modules as additional parameters
					code.apply(this, requiredModules);
				}
				module.addOnloadCallback(codeWrapper);
				module.load();
			}
		};
	};

	dbgOn(!Object.isString(moduleName));
	var module = createNamespaceModule(moduleName);
	module.wasDefined = true;
	module.requires = basicRequire.curry(module);
	return module;
};

function require(/*requiredModuleNameOrAnArray, anotherRequiredModuleName, ...*/) {
	function getUniqueName() { return 'anonymous_module_' + require.counter }
	require.counter !== undefined ? require.counter++ : require.counter = 0;
	var args = $A(arguments);
	return module(getUniqueName()).beAnonymous().requires(Object.isArray(args[0]) ? args[0] : args);
};


// ===========================================================================
// Our JS library extensions (JS 1.5, no particular browser or graphics engine)
// ===========================================================================

/**
  * LK class system.
  */

Object.extend(Function.prototype, {

	subclass: function(/*... */) {
		// Main method of the LK class system.

		// {className} is the name of the new class constructor which this method synthesizes
		// and binds to {className} in the Global namespace. 
		// Remaining arguments are (inline) properties and methods to be copied into the prototype 
		// of the newly created constructor.

		// modified from prototype.js
	
		var args = arguments;
		var className = args[0];
		var targetScope = Global;
		var shortName = null;
		if (className) {
			targetScope = Class.namespaceFor(className);
			shortName = Class.unqualifiedNameFor(className);
		}  else {
			shortName = "anonymous_" + (Class.anonymousCounter++);
			className = shortName;
		}
	
		var klass;
		if (className && targetScope[shortName] && (targetScope[shortName].superclass === this)) {
			// preserve the class to allow using the subclass construct in interactive development
			klass = targetScope[shortName]; 
		} else {
			klass = Class.newInitializer(shortName);
			klass.superclass = this;
			var protoclass = function() { }; // that's the constructor of the new prototype object
			protoclass.prototype = this.prototype;
			klass.prototype = new protoclass();
			klass.prototype.constructor = klass;
			klass.prototype.constructor.type = className; // KP: .name would be better but js ignores .name on anonymous functions
			klass.prototype.constructor.displayName = className; // for debugging, because name can not be assigned
			if (className) {
			  targetScope[shortName] = klass; // otherwise it's anonymous
			  avocado.annotator.annotationOf(klass).setCreatorSlot(shortName, targetScope); // aaa - kind of a hack, added by Adam so that we can file out Morph subclasses
			  
			  // aaa - Another hack to avoid having hundreds of uncategorized classes cluttering
			  // up the global namespace. -- Adam, August 2010
			  if (targetScope === Global) {
			    avocado.annotator.annotationOf(Global).setSlotAnnotation(shortName, {initializeTo: ['null']}); // so it doesn't show up as an unowned slot
			    avocado.annotator.annotationOf(Global).categorize(['avocado', 'lively kernel'], [shortName]);
			  }

			}
		};

		for (var i = 1; i < args.length; i++) {
			klass.addMethods(args[i] instanceof Function ? (args[i])() : args[i]);
		}
		if (!klass.prototype.initialize) {
			klass.prototype.initialize = Functions.Empty;
		}

		return klass;
	},

	addMethods: function(source) {
		// copy all the methods and properties from {source} into the
		// prototype property of the receiver, which is intended to be
		// a class constructor.	 Method arguments named '$super' are treated
		// specially, see Prototype.js documentation for "Class.create()" for details.
		// derived from Class.Methods.addMethods() in prototype.js
		var ancestor = this.superclass && this.superclass.prototype;
		
		var className = this.type || "Anonymous";

		for (var property in source) {
		  if (property !== '__annotation__') { // aaa - Hacked by Adam, not sure what else to do.
			var getter = source.__lookupGetter__(property);
			if (getter) this.prototype.__defineGetter__(property, getter);
			var setter = source.__lookupSetter__(property);
			if (setter) this.prototype.__defineSetter__(property, setter);
			if (getter || setter)
			continue;

			var value = source[property];
			// weirdly, RegExps are functions in Safari, so testing for Object.isFunction on
			// regexp field values will return true. But they're not full-blown functions and don't 
			// inherit argumentNames from Function.prototype
		
			if (ancestor && Object.isFunction(value) && value.argumentNames
				&& value.argumentNames().first() == "$super") {
				(function() { // wrapped in a method to save the value of 'method' for advice
					var method = value;
					var advice = (function(m) {
						return function callSuper() {
							var method = ancestor[m];
							if (!method)
								throw new Error(Strings.format('Trying to call super of' + 
									'%s>>%s but super method non existing in %s',
									className, m, ancestor.constructor.type));
							return method.apply(this, arguments);
						};
					})(property);

					advice.methodName = "$super:" + (this.superclass ? this.superclass.type + "." : "") + property;

					value = Object.extend(advice.wrap(method), {
						valueOf:  function() { return method },
						toString: function() { return method.toString() },
						originalFunction: method
					});
				})();
			}
			
			if (Object.isFunction(value)) {
				
				
			}
			
			this.prototype[property] = value;
		
			if (property === "formals") { // rk FIXME remove this cruft
				// special property (used to be pins, but now called formals to disambiguate old and new style
				Class.addPins(this, value);
			} else if (Object.isFunction(value)) {
				// remember name for profiling in WebKit
				value.displayName = property; // aaa changed this from className + "$" + property to make implicit creator slots work -- Adam
				
				for ( ; value; value = value.originalFunction) {
					if (value.methodName) {
						//console.log("class " + this.prototype.constructor.type 
						// + " borrowed " + value.qualifiedMethodName());
					}
					value.declaredClass = this.prototype.constructor.type;
					value._creatorSlotHolder = this.prototype; // added by Adam to allow implicit creator slots
					value.methodName = property;
				}
			}
		  }
		} // end of for (var property in source)
		
		return this;
	},

	addProperties: function(spec, recordType) {
		Class.addMixin(this, recordType.prototype.create(spec).prototype);
	},

	isSubclassOf: function(aClass) {
		return this.superclasses().include(aClass);
	},
	
	allSubclasses: function() {
		return Global.classes(true).select(function(ea) { return ea.isSubclassOf(this) }.bind(this));
	},
	
	superclasses: function() {
		if (!this.superclass) return [];
		if (this.superclass === Object) return [Object];
		return this.superclass.superclasses().concat([this.superclass]);
	}

});

var Class = {
	
	anonymousCounter: 0,
	
	initializerTemplate: (function CLASS(){ Class.initializer.apply(this, arguments) }).toString(),
	
	newInitializer: function(name) {
		// this hack ensures that class instances have a name
		return eval(Class.initializerTemplate.replace(/CLASS/g, name) + ";" + name);
	},

	initializer: function initializer() {
		// check for the existence of Importer, which may not be defined very early on
		if (Global.Importer && (arguments[0] instanceof Importer)) {
			this.deserialize.apply(this, arguments);
		} else if (Global.Copier && (arguments[0] instanceof Copier)) {
			this.copyFrom.apply(this, arguments);
		} else if (Global.Restorer && (arguments[0] instanceof Restorer)) {
			// for WebCards)
			//Do nothing
		} else {
			// if this.initialize is undefined then prolly the constructor was called without 'new'
			this.initialize.apply(this, arguments); 
		}
	},

	def: function Class$def(constr, superConstr, optProtos, optStatics) {
		// currently not used
		// Main method of the LK class system.

		// {className} is the name of the new class constructor which this method synthesizes
		// and binds to {className} in the Global namespace. 
		// Remaining arguments are (inline) properties and methods to be copied into the prototype 
		// of the newly created constructor.

		// modified from prototype.js

		var klass = Class.newInitializer("klass");
		klass.superclass = superConstr;

		var protoclass = function() { }; // that's the constructor of the new prototype object
		protoclass.prototype = superConstr.prototype;

		klass.prototype = new protoclass();

		// Object.extend(klass.prototype, constr.prototype);
		klass.prototype.constructor = klass; 
		var className  = constr.name; // getName()
		klass.addMethods({initialize: constr});
		// KP: .name would be better but js ignores .name on anonymous functions
		klass.type = className;


		if (optProtos) klass.addMethods(optProtos);
		if (optStatics) Object.extend(klass, optStatics);

		Global[className] = klass;
		return klass;
	},

	isValidIdentifier: function(str) {
		return (/^(?:[a-zA-Z_][\w\-]*[.])*[a-zA-Z_][\w\-]*$/).test(str);
	},
	
	isClass: function Class$isClass(object) {
		if(object === Object
			|| object === Array
			|| object === Function
			|| object === String
			|| object === Number) {
				return true;
		} 
		return (object instanceof Function) && (object.superclass !== undefined);
	},

	className: function Class$className(cl) {
		if(cl === Object) return "Object"
		if(cl === Array) return "Array"
		if(cl === Function) return "Function"
		if(cl === String) return "String"
		if(cl === Number) return "Number"
		return cl.type;
	},

	forName: function forName(name) {
		// lookup the class object given the qualified name
		var lastDot = name.lastIndexOf('.'); // lastDot may be -1
		var ns = Class.namespaceFor(name);
		var shortName = Class.unqualifiedNameFor(name);
		return ns[shortName];
	},

	deleteObjectNamed: function Class$delteObjectNamed(name) {
		var lastDot = name.lastIndexOf('.'); // lastDot may be -1
		var ns = Class.namespaceFor(name);
		var shortName = Class.unqualifiedNameFor(name);
		if (!ns[shortName]) return;
		delete ns[shortName];
	},

	unqualifiedNameFor: function Class$unqualifiedNameFor(name) {
		var lastDot = name.lastIndexOf('.'); // lastDot may be -1
		var unqualifiedName = name.substring(lastDot + 1);
		if (!Class.isValidIdentifier(unqualifiedName)) throw new Error('not a name ' + unqualifiedName);
		return unqualifiedName;
	},

	namespaceFor: function Class$namespaceFor(className) {
		// get the namespace object given the qualified name
		var lastDot = className.lastIndexOf('.');
		if (lastDot < 0) return Global;
		else return namespace(className.substring(0, lastDot));
	},

	withAllClassNames: function Class$withAllClassNames(scope, callback) {
		for (var name in scope) {
			try {
				if (Class.isClass(scope[name]))
					callback(name);
			} catch (er) { // FF exceptions
			}
		}
		callback("Object");
		callback("Global");
	},

	makeEnum: function Class$makeEnum(strings) {
		// simple mechanism for making objecs with property values set to
		// property names, to be used as enums.

		var e = {};
		for (var i = 0; i < strings.length; i++) {
			e[strings[i]] = strings[i];
		}
		return e;
	},

	getConstructor: function Class$getConstructor(object) {
		return object.constructor.getOriginal();
	},

	getPrototype: function Class$getPrototype(object) {
		return object.constructor.getOriginal().prototype;
	},

	applyPrototypeMethod: function Class$applyPrototypeMethod(methodName, target, args) {
		var method = this.getPrototype(target);
		if (!method) throw new Error("method " + methodName + " not found");
		return method.apply(this, args);
	},

	getSuperConstructor: function Class$getSuperConstructor(object) {
		return object.constructor.getOriginal().superclass;
	},

	getSuperPrototype: function Class$getSuperPrototype(object) {
		var sup = this.getSuperConstructor(object);
		return sup && sup.prototype;
	},

	addPins: function Class$addPins(cls, spec) {
		Class.addMixin(cls, Relay.newDelegationMixin(spec).prototype);
	},
	
	addMixin: function Class$addMixin(cls, source) {
		var spec = {};
		for (var prop in source) {
			var value = source[prop];
			switch (prop) {
				case "constructor": case "initialize": case "deserialize": case "copyFrom": 
				case "toString": case "definition": case "description":
				break;
				default:
				if (cls.prototype[prop] === undefined) // do not override existing values!
				spec[prop] = value;
			}
		}
		cls.addMethods(spec);
	}

};

var Strings = {
	documentation: "Convenience methods on strings",
	
	format: function Strings$format() {
		return this.formatFromArray($A(arguments));
	},
	
	// adapted from firebug lite
	formatFromArray: function Strings$formatFromArray(objects) {
		var self = objects.shift();
		if(!self) {console.log("Error in Strings>>formatFromArray, self is undefined")};

		function appendText(object, string) {
			return "" + object;
		}
	
		function appendObject(object, string) {
			return "" + object;
		}
	
		function appendInteger(value, string) {
			return value.toString();
		}
	
		function appendFloat(value, string, precision) {
			if (precision > -1) return value.toFixed(precision);
			else return value.toString();
		}
	
		var appenderMap = {s: appendText, d: appendInteger, i: appendInteger, f: appendFloat}; 
		var reg = /((^%|[^\\]%)(\d+)?(\.)([a-zA-Z]))|((^%|[^\\]%)([a-zA-Z]))/; 
	
		function parseFormat(fmt) {
			var oldFmt = fmt;
			var parts = [];
		
			for (var m = reg.exec(fmt); m; m = reg.exec(fmt)) {
				var type = m[8] || m[5];
				var appender = type in appenderMap ? appenderMap[type] : appendObject;
				var precision = m[3] ? parseInt(m[3]) : (m[4] == "." ? -1 : 0);
				parts.push(fmt.substr(0, m[0][0] == "%" ? m.index : m.index + 1));
				parts.push({appender: appender, precision: precision});
		
				fmt = fmt.substr(m.index + m[0].length);
			}
			if (fmt)
				parts.push(fmt.toString());
		
			return parts;
		};
	
		var parts = parseFormat(self);
		var str = "";
		var objIndex = 0;
	
		for (var i = 0; i < parts.length; ++i) {
			var part = parts[i];
			if (part && typeof(part) == "object") {
				var object = objects[objIndex++];
				str += (part.appender || appendText)(object, str, part.precision);
			} else {
				str += appendText(part, str);
			}
		}
		return str;
	},

	withDecimalPrecision: function Strings$withDecimalPrecision(str, precision) {
		var floatValue = parseFloat(str);
		return isNaN(floatValue) ? str : floatValue.toFixed(precision);
	}
};


var Functions = {
	documentation: "collection of reusable functions",

	Empty: function() {},

	K: function(arg) { return arg; },

	Null: function Functions$Null() { return null; },

	False: function Functions$False() { return false; },

	True: function Functions$True() { return true; },

	all: function Functions$all(object) {
		var a = [];
		for (var name in object) {	
			if (object[name] instanceof Function)
				a.push(name);
		} 
		return a;
	},

	timeToRun: function Functions$timeToRun(func) {
		var startTime = (new Date()).getTime(); 
		func();
		return new Date().getTime() - startTime;
	}
};
	
var Properties = {
	documentation: "convenience property access functions",

	all: function Properties$all(object, predicate) {
		var a = [];
		for (var name in object) {	
			if (!(object[name] instanceof Function) && (predicate ? predicate(name, object) : true)) {
			a.push(name);
			}
		} 
		return a;
	},
	
	own: function Properties$own(object) {
		var a = [];
		for (var name in object) {	
			if (object.hasOwnProperty(name)) {
			var value = object[name];
			if (!(value instanceof Function))
				a.push(name);
			}
		} 
		return a;
	},

	forEachOwn: function Properties$forEachOwn(object, func, context) {
		for (var name in object) {
			if (object.hasOwnProperty(name)) {
				var value = object[name];
				if (!(value instanceof Function)) {
					var result = func.call(context || this, name, value);
					// cont && cont.call(context || this, result); 
				}
			}
		}
	}
};


// bootstrap namespaces
Object.subclass('Namespace', {

	initialize: function(context, nsName) {
		this.namespaceIdentifier = context.namespaceIdentifier + '.' + nsName;
		this.createTime = new Date();
	},
		
	gather: function(selector, condition, recursive) {
		var result = Object.values(this).select(function(ea) { return condition.call(this, ea) }, this);
		if (!recursive) return result;
		return	this.subNamespaces().inject(result, function(result, ns) { return result.concat(ns[selector](true)) });
	},
	
	subNamespaces: function(recursive) {
		return this.gather(
			'subNamespaces',
			function(ea) { return (ea instanceof lively.lang.Namespace || ea === Global) && ea !== this },
			recursive);
	},
	
	classes: function(recursive) {		  
		var normalClasses = this.gather(
			'classes',
			function(ea) { return ea && ea !== this.constructor && Class.isClass(ea) },
			recursive);
		if (this === Global)
			return [Array, Number, String, Function].concat(normalClasses);
		return normalClasses;
	},
	
	functions: function(recursive) {
		return this.gather(
			'functions',
			function(ea) { return ea && !Class.isClass(ea) && Object.isFunction(ea) && !ea.declaredClass && this.requires !== ea },
			recursive);
	}
	
});

// let Glabal act like a namespace itself
Object.extend(Global, Namespace.prototype);
Global.namespaceIdentifier = 'Global';

Namespace.addMethods({ // module specific, should be a subclass?
	
	uri: function() { // FIXME cleanup necessary
		var id = this.namespaceIdentifier; // something like lively.Core
		var namespacePrefix;
		if (id.startsWith('Global.')) namespacePrefix = 'Global.';
		else throw dbgOn(new Error('unknown namespaceIdentifier'));
		var url = Config.codeBase + this.namespaceIdentifier.substr(namespacePrefix.length).replace(/\./g, '/');
		if (!this.isAnonymous()) url += '.js'; // FIXME not necessary JavaScript?!
		return url;
	},
	
	addDependendModule: function(depModule) {
		if (!this.dependendModules) this.dependendModules = [];
		this.dependendModules.push(depModule);
	},

	informDependendModules: function() {
		if (!this.dependendModules) return;
		var deps = this.dependendModules.uniq();
		this.dependendModules = [];
		deps.forEach(function(ea) { ea.removeRequiredModule(this) }, this);
	},
	
	addRequiredModule: function(requiredModule) {
		if (requiredModule.isLoaded()) return;
		if (!this.pendingRequirements) this.pendingRequirements = [];
		this.pendingRequirements.push(requiredModule);
		requiredModule.addDependendModule(this);
	},
	
	removeRequiredModule: function(requiredModule) {
		if (this.pendingRequirements && !this.pendingRequirements.include(requiredModule))
			throw dbgOn(new Error('requiredModule not there'));
		this.pendingRequirements = this.pendingRequirements.without(requiredModule);
		if (!this.hasPendingRequirements()) {
			// console.log('no more requirements for ' + this.uri());
			this.load();
		}
	},
		
	pendingRequirementNames: function() {
		if (!this.pendingRequirements) return [];
		return this.pendingRequirements.collect(function(ea) { return ea.uri() });	  
	},
	
	hasPendingRequirements: function() {
		return this.pendingRequirements && this.pendingRequirements.length > 0;
	},
	
	loadRequirementsFirst: function() {
		this.pendingRequirements && this.pendingRequirements.invoke('load');
	},
	
	addOnloadCallback: function(cb) {
		if (!this.callbacks) this.callbacks = [];
		this.callbacks.push(cb);
	},
	
	runOnloadCallbacks: function() {
		if (!this.callbacks) return;
		var cb;
		while (cb = this.callbacks.shift()) { cb() };
	},
	
	isLoaded: function() {
		return this._isLoaded;
	},
		
	isLoading: function() {
		// aaa - hack added by Adam to enable static loading
		if (window.avocado && avocado.isLoadingStatically) {return true;}

		// aaa - another hack added by Adam, to enable XHR+eval loading
		if (window.avocado && avocado.transporter && typeof avocado.transporter.loadedURLs[this.uri()] === 'function') {return true;}

		// aaa - jeez, one more hack, for when we use urlForKernelModuleName (like on GAE) -- Adam
		var name = this.namespaceIdentifier;
		if (name.indexOf("Global.") === 0) { name = name.substr("Global.".length); }
		if (name.indexOf("lively.") === 0) { name = name.substr("lively.".length); }
		if (name === 'jslint') {  // blecch
		} else {
		  name = "lk/" + name.replace(/\./g, '/');
		}

		var realURI;
		if (window.urlForKernelModuleName) {
  		realURI = window.urlForKernelModuleName(name);
		  if (window.avocado && avocado.transporter && typeof avocado.transporter.loadedURLs[realURI] === 'function') { return true;}
		}

		if (this.isLoaded()) return false;
		if (this.uri().include('anonymous')) return true;

		// Check both what LK thinks the URI should be and what Avocado thinks the URI should be. -- Adam
		if (Loader.scriptInDOM(this.uri())) return true;
		if (realURI && Loader.scriptInDOM(realURI)) return true;
		return false;
	},
	
	load: function() {
		if (this.isLoaded()) {
			this.runOnloadCallbacks();
			return;
		}
		if (this.isLoading() && this.wasDefined && !this.hasPendingRequirements()) {
			this.runOnloadCallbacks();
			this._isLoaded = true;
			// time is not only the time needed for the Netrequest and code evaluation
			// but the complete time span from the creation of the module (when the module is first encountered)
			// to evaluation the evaluation of its code, including load time of all requirements
			var time = this.createTime ? new Date() - this.createTime : 'na';
			// console.log(this.uri() + ' loaded in ' + time + ' ms'); // aaa - commented this out, it's annoying. -- Adam
			this.informDependendModules();
			return;
		}
		if (this.isLoading()) {
			this.loadRequirementsFirst();
			return;
		}
		Loader.loadJs(this.uri());
	},
	
	isAnonymous: function() {
		return this._isAnonymous
	},
	
	beAnonymous: function() {
		this._isAnonymous = true;
		return this;
	}
	
});

(function moveNamespaceClassToLivelyLang() {
	// namespace('lively.lang');
	lively = new Namespace(Global, 'lively');
	lively.lang = new Namespace(lively, 'lang');
	lively.lang.Namespace = Namespace;
	delete Namespace;
})();

lively.lang.Execution = { // will be extended later
	showStack: Functions.Null,
	resetDebuggingStack: Functions.Null,
	installStackTracers: Functions.Null,
};


lively.lang.let = function(/** **/) {
	// lively.lang.let(y, function(x) { body }) is equivalent to { let y = x; body; }
	return arguments[arguments.length - 1].apply(this, arguments);
}

/*
 * Stack Viewer when Dan's StackTracer is not available
 * FIXME rk: move this to Helper.js?
 */
function getStack() {
	var result = [];
	for(var caller = arguments.callee.caller; caller; caller = caller.caller) {
		if (result.indexOf(caller) != -1) {
		   result.push({name: "recursive call can't be traced"});
		   break;
		}
		result.push(caller);
	};
	return result;	
};

function printStack() {	 
	function guessFunctionName(func) {
		if(func.name) return func.name;
		var m = func.toString().match(/function (.+)\(/);
		if (m) return m[1];
		return func
	};

	var string = "== Stack ==\n";
	var stack = getStack();
	stack.shift(); // for getStack
	stack.shift(); // for printStack (me)
	var indent = "";
	for(var i=0; i < stack.length; i++) {
		string += indent + i + ": " +guessFunctionName(stack[i]) + "\n";
		indent += " ";		  
	};
	return string;
};

function logStack() {
	this.console.log(printStack())
};

/**
/* Our extensions to JavaScript base classes
 */

/**
  * Extensions to class Function
  */  
Object.extend(Function.prototype, {

	inspectFull: function() {
		var methodBody = this.toString();
		methodBody = methodBody.substring(8, methodBody.length);
		return this.qualifiedMethodName() + methodBody;
	},

	inspect: function() {
		// Print method name (if any) and the first 80 characters of the decompiled source (without 'function')
		var def = this.toString();
		var i = def.indexOf('{');
		var header = this.qualifiedMethodName() + def.substring(8, i);
		var body = (def.substring(i, 88) + (def.length > 88 ? '...' : '')).replace(/\n/g, ' ');	 // strip newlines
		return header + body;
	},

	qualifiedMethodName: function() {
		return (this.declaredClass ? this.declaredClass + "." : "")	 
		+ (this.methodName || this.name || "anonymous");
	},

	functionNames: function(filter) {
		var functionNames = [];

		for (var name in this.prototype) { 
			try {
				if ((this.prototype[name] instanceof Function) 
				&& (!filter || filter(name))) { 
					functionNames.push(name);
				} 
			} catch (er) {
				// FF can throw an exception here ...
			}
		}

		return functionNames;
	},

	withAllFunctionNames: function(callback) {
		for (var name in this.prototype) { 
			try {
				var value = this.prototype[name];
				if (value instanceof Function) 
					callback(name, value, this);
			} catch (er) {
				// FF can throw an exception here ...
			}
		}
	},

	localFunctionNames: function() {
		var sup = this.superclass || ((this === Object) ? null : Object);

		try {
			var superNames = (sup == null) ? [] : sup.functionNames();
		} catch (e) {
			var superNames = [];
		}
		var result = [];

		this.withAllFunctionNames(function(name, value, target) {
			if (!superNames.include(name) || target.prototype[name] !== sup.prototype[name]) 
				result.push(name);
		});
		return result;
	},

	getOriginal: function() {
		// get the original 'unwrapped' function, traversing as many wrappers as necessary.
		var func = this;
		while (func.originalFunction) func = func.originalFunction;
		return func;
	},
	
	logErrors: function(prefix) {
	  return this; // aaa this interferes with Chrome's debugging stuff -- Adam
	  
		if (Config.ignoreAdvice) return this;

		var advice = function logErrorsAdvice(proceed/*,args*/) {
			var args = $A(arguments); args.shift(); 
			try {
				return proceed.apply(this, args); 
			} catch (er) {
				if (prefix) console.warn("ERROR: %s.%s(%s): err: %s %s", this, prefix, args,  er, er.stack || "");
				else console.warn("ERROR: %s %s", er, er.stack || "");
				logStack();
				if (Global.printObject)
					console.warn("details: " + printObject(er));
				// lively.lang.Execution.showStack();
				throw er;
			}
		}
	
		advice.methodName = "$logErrorsAdvice";
		var result = this.wrap(advice);
		result.originalFunction = this;
		result.methodName = "$logErrorsWrapper";
		return result;
	},
	
	logCompletion: function(module) {
		if (Config.ignoreAdvice) return this;

		var advice = function logCompletionAdvice(proceed) {
			var args = $A(arguments); args.shift(); 
			try {
				var result = proceed.apply(this, args);
			} catch (er) {
				console.warn('failed to load %s: %s', module, er);
				lively.lang.Execution.showStack();
				throw er;
			}
			if (window.shouldShowLoadingMessages) { console.log('completed %s', module); }
			return result;
		}

		advice.methodName = "$logCompletionAdvice::" + module;

		var result = this.wrap(advice);
		result.methodName = "$logCompletionWrapper::" + module;
		result.originalFunction = this;
		return result;
	},

	logCalls: function(isUrgent) {
		if (Config.ignoreAdvice) return this;

		var original = this;
		var advice = function logCallsAdvice(proceed) {
			var args = $A(arguments); args.shift(); 
			var result = proceed.apply(this, args);
			if (isUrgent) { 
				console.warn('%s(%s) -> %s', original.qualifiedMethodName(), args, result); 
			} else {
				console.log( '%s(%s) -> %s', original.qualifiedMethodName(), args, result);
			}
			return result;
		}

		advice.methodName = "$logCallsAdvice::" + this.qualifiedMethodName();

		var result = this.wrap(advice);
		result.originalFunction = this;
		result.methodName = "$logCallsWrapper::" + this.qualifiedMethodName();
		return result;
	},
	
	traceCalls: function(stack) {
		var advice = function traceCallsAdvice(proceed) {
			var args = $A(arguments); args.shift();
			stack.push(args);
			var result = proceed.apply(this, args);
			stack.pop();
			return result;
		};
		return this.wrap(advice);
	}
	
});



/**
  * Extensions to class Number
  */  
Object.extend(Number.prototype, {

	// random integer in 0 .. n-1
	randomSmallerInteger: function() {
		return Math.floor(Math.random()*this); 
	},

	roundTo: function(quantum) {
		return Math.round(this/quantum)*quantum; 
	},

	toDegrees: function() { 
		return (this*180/Math.PI) % 360; 
	},

	toRadians: function() { 
		return this/180 * Math.PI; 
	}

});


/**
  * Extensions to class String
  */  
Object.extend(String.prototype, {
	size: function() { // so code can treat, eg, Texts like Strings
		return this.length;
	},

	asString: function() { // so code can treat, eg, Texts like Strings
		return this;
	}
});

/**
  * Extensions to class Array
  */  
Object.extend(Array.prototype, { 
	forEachShowingProgress: function(progressBar, iterator, labelFunc, whenDoneFunc) {
		progressBar.setValue(0);
		var steps = this.length;
		(this.reverse().inject(
			function() { progressBar.setValue(1); whenDoneFunc && whenDoneFunc() },
			function(nextFunc, item, idx) {
				return function() {
					progressBar.setValue((steps-idx) / steps);
					if (labelFunc)
						progressBar.setLabel(labelFunc(item, idx));
					iterator(item, idx);
					nextFunc.delay(0);
				}
			}
		))();
	},
});
Object.subclass('CharSet', {
	documentation: "limited support for charsets"
});

Object.extend(CharSet, {
	lowercase: "abcdefghijklmnopqrstuvwxyz",
	uppercase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
	digits: "0123456789",
	underscore: "_",
	nonAlpha: "`1234567890-=[]\;',./",
	shiftedNonAlpha: '~!@#$%^&*()_+{}:"<>?|',
	leftBrackets: "*({[<'" + '"',
	rightBrackets: "*)}]>'" + '"'
});

Object.extend(CharSet, {
	// select word, brackets
	alphaNum: CharSet.lowercase + CharSet.uppercase + CharSet.digits + CharSet.underscore,
	charsAsTyped: CharSet.uppercase + CharSet.nonAlpha,
	charsUnshifted: CharSet.lowercase + CharSet.nonAlpha,
	charsShifted: CharSet.uppercase + CharSet.shiftedNonAlpha,

	nonBlank: function(cc) {  
		return " \n\r\t".include(cc) == false;
	}

});
	
Object.subclass('Record', {

	description: "abstract data structure that maps getters/setters onto DOM properties or plain JS objects",
	definition: "none yet",
	// Note: can act as a mixin, so no instance state!

	initialize: function(rawNode, spec) {
		this.rawNode = rawNode; // DOM or plain JS Object
		Properties.forEachOwn(spec, function(key, value) { 
			this["set" + key].call(this, value); 
		}, this);
	},
	
	newRelay: function(spec) {
		return Relay.newInstance(spec, this);
	},

	addObserver: function(dep, optForwardingSpec) {
		if (optForwardingSpec) {
			// do forwarding
			dep = Relay.newInstance(optForwardingSpec, dep);
		}
		// find all the "on"<Variable>"Update" methods of dep
		for (var name in dep) {
			var match = name.match(/on(.*)Update/);
			if (match) {
				var varname = match[1];
				if (!this["set" + varname])
					throw new Error("cannot observe nonexistent variable " + varname);
				Record.addObserverTo(this, varname, dep);
			}
		}
	},

	// dep may be the relay or relay.delegate, can be called with dep, dep and fielName, or only with fielName
	removeObserver: function(dep, fieldName) {
		if (fieldName && !this[fieldName + '$observers']) {
			console.log('Tried to remove non existing observer:' + fieldName + '$observers');
			return;
		};
		if (fieldName && !dep) { // remove all abservers from this field
			this[Record.observerListName(fieldName)] = null;
			return;
		};
		var observerFields = fieldName ?
			[Record.observerListName(fieldName)] :
			Object.keys(this).select(function(ea) { return ea.endsWith('$observers') });
		observerFields.forEach(function(ea) {
			this[ea] = this[ea].reject(function(relay) { return relay === dep || relay.delegate === dep });
		}, this);
	},

	addObserversFromSetters: function(reverseSpec, dep, optKickstartUpdates) {
		var forwardSpec = {};
		Properties.forEachOwn(reverseSpec, function each(key, value) {
			if (Object.isString(value.valueOf())) {
				if (!value.startsWith("+")) // if not write only, get updates
					forwardSpec[value.startsWith("-") ? value.substring(1) : value] = "!" + key;
			} else if (value.mode !== '+') {
				var spec = forwardSpec[value.name] =  {};
				spec.name = "!" + key;
				// FIXME: Q&A the following
				spec.from = value.from;
				spec.to = value.to;
			}
		});
		// FIXME: sometimes automatic update callbacks are not desired!
		this.addObserver(dep, forwardSpec);
		function callUpdate(self, key, value, from) {
			var target = "on" + key + "Update";
			var source = "get" + value;
			// trigger updates
			try {
				var tmp = self[source].call(self);
				dep[target].call(dep, from ? from(tmp) : tmp);
			} catch (er) {
				console.log("on kickstart update: " + er + " on " + dep + " " + target
				+ " mapping to " + source + " " + er.stack);
			}
		}

		if (!optKickstartUpdates) return;
		Properties.forEachOwn(reverseSpec, function each(key, value) {
			if (Object.isString(value.valueOf())) {
				if (!value.startsWith("+")) {
					if (value.startsWith("-")) value = value.substring(1);
					callUpdate(this, key, value, value.from);
				}
			} else if (value.mode !== '+') {
				callUpdate(this, key, value.name, value.from);
			}
		}, this);
	},


	toString: function() {
		return "#<Record{" + String(JSON.serialize(this.definition)) + "}>";
	},

	create: function(bodySpec) { // called most likely on the prototype object
		var klass = this.constructor.subclass.apply(this.constructor);
		//console.log('got record type ' + this.constructor.name);
		klass.addMethods(Record.extendRecordClass(bodySpec));
		klass.prototype.definition = bodySpec;
		return klass;
	},
	
	// needed for adding fields for fabric
	addField: function(fieldName, coercionSpec, forceSet) {
		var spec = {}; spec[fieldName] = coercionSpec || {};
		this.constructor.addMethods(new Record.extendRecordClass(spec));
		this.definition[fieldName]= spec[fieldName];
		if (!forceSet) return;
		// does this do anything now?
		this['set' + fieldName] = this['set' + fieldName].wrap(function(proceed, value, optSource, force) {
			proceed(value, optSource, true);
		})
	}
	
});


Record.subclass('PlainRecord', {
	getRecordField: function(name) { return this.rawNode[name] },

	setRecordField: function(name, value) { return this.rawNode[name] = value },

	removeRecordField: function(name) { delete this.rawNode[name] }
});

Object.extend(Record, {
	
	newPlainInstance: function(spec) {
		var argSpec = {};
		var fieldSpec = {};
		Properties.forEachOwn(spec, function (key, value) {
			fieldSpec[key] = {};
			argSpec[key] = value;
		});
		return this.newInstance(fieldSpec, argSpec, {});
	},

	newNodeInstance: function(spec) { // backed by a DOM node
		var argSpec = {};
		var fieldSpec = {};
		Properties.forEachOwn(spec, function (key, value) {
			fieldSpec[key] = {};
			argSpec[key] = value;
		});
		return this.newInstance(fieldSpec, argSpec, NodeFactory.create("record"));
	},

	newInstance: function(fieldSpec, argSpec, optStore) {
		if (arguments.length < 2) throw new Error("call with two or more arguments");
		var storeClass;
		if (!optStore) {
			storeClass = lively.data.DOMNodeRecord; // FXIME forward reference
			optStore = NodeFactory.create("record"); // FIXME flat JavaScript instead by default?
		} else {
			storeClass = optStore instanceof Global.Node ? lively.data.DOMNodeRecord : PlainRecord;
		}

		var Rec = storeClass.prototype.create(fieldSpec);
		return new Rec(optStore, argSpec);
	},

	extendRecordClass: function(bodySpec) {
		var def = {};
		Properties.forEachOwn(bodySpec, function(name, value) {
			Record.addAccessorMethods(def, name, value);
		});
		return def;
	},

	addAccessorMethods: function(def, fieldName, spec) {
		dbgOn(fieldName.startsWith("set") || fieldName.startsWith("get")); // prolly a prob
		if (spec.mode !== "-")
			def["set" + fieldName] = this.newRecordSetter(spec.name || fieldName, spec.to, spec.byDefault);
		if (spec.mode !== "+")
			def["get" + fieldName] = this.newRecordGetter(spec.name || fieldName, spec.from, spec.byDefault);
	},

	
	observerListName: function(name) { return name + "$observers"},

	addObserverTo: function(rec, varname, dep) {
		var deps = rec[Record.observerListName(varname)];
		if (!deps) deps = rec[Record.observerListName(varname)] = [];
		else if (deps.indexOf(dep) >= 0) return;
		deps.push(dep);
	},
   
	notifyObserversOf: function(rec, fieldName, coercedValue, optSource, oldValue, force) {
		var deps = rec[Record.observerListName(fieldName)];
		if (!force && (oldValue === coercedValue)) {
			// console.log("--- notifyObserversOf stops here: " + rec + ", "+ fieldName + ", " + coercedValue);
			return;
		};
		var updateName = "on" + fieldName + "Update";
		if (!deps) return;
		for (var i = 0; i < deps.length; i++) {
			var dep = deps[i];
			// shouldn't this be uncoerced value? ......
			var method = dep[updateName];
			// console.log('updating  ' + updateName + ' in ' + Object.keys(dep));
			// "force" should not be propageted
			method.call(dep, coercedValue, optSource || rec /*rk: why pass rec in ?*/);
		}
	},

	newRecordSetter: function newRecordSetter(fieldName, to, byDefault) {
		var name = fieldName;
		return function recordSetter(value, optSource, optForce) {
			// console.log("set " + value + ", " + optSource + ", " + force)
			var coercedValue;
			if (value === undefined) {
				this.removeRecordField(name);
			} else {
				if (value == null && byDefault) value = byDefault;
				coercedValue = to ? to(value) : value;
				var oldValue = this.getRecordField(name) 
				this.setRecordField(name, coercedValue);
			}
			Record.notifyObserversOf(this, name, coercedValue, optSource, oldValue, optForce);
		}
	},
	
	newRecordGetter: function newRecordGetter(name, from, byDefault) {
		return function recordGetter() {
			if (this === this.constructor.prototype) // we are the prototype? not foolproof but works in LK
				return byDefault; 
			if (!this.rawNode)
				throw new Error("no rawNode");
			var value = this.getRecordField(name);
			if (!value && byDefault) return byDefault;
			else if (from) return from(value);
			else return value;
		}
	},

	createDependentObserver: function(target, computedProperty, baseProperties /*:Array*/) {
		// create an observer that will trigger the observers of
		// computedProperty whenever one of the baseProperties changes
		// The returned observer has to be added to target (as in target.addObserver

		var getterName = "get" + computedProperty;
		if (!target[getterName])
			throw new Error('unknown computedProperty ' + computedProperty);

		function notifier(value, source, record) {
			var newValue = record[getterName].call(record);
			return Record.notifyObserversOf(record, computedProperty, newValue);
		}
		var observer = {};
		baseProperties.forEach(function(prop) {
			// FIXME check if target has field "get" + prop
			observer["on" + prop + "Update"] = notifier;
		});
		return observer;
	},

});

Object.subclass('Relay', {
	documentation: "Property access forwarder factory",
	initialize: function(delegate) {
		// FIXME here a checker could verify this.prototype and check
		// that the delegate really has all the methods
		this.delegate = delegate; 
	}
});

Object.extend(Relay, {

	newRelaySetter: function newRelaySetter(targetName, optConv) {
		return function setterRelay(/*...*/) {
			if (!this.delegate)
				new Error("delegate in relay not existing " + targetName);
			var impl = this.delegate[targetName];
			if (!impl)
				throw dbgOn(new Error("delegate " + this.delegate + " does not implement " + targetName));
			var args = arguments;
			if (optConv) {
				args = $A(arguments);
				args.unshift(optConv(args.shift()));
			}
			return impl.apply(this.delegate, args);
		}
	},

	newRelayGetter: function newRelayGetter(targetName, optConv) {
		return function getterRelay(/*...*/) {
			if (!this.delegate)
				throw dbgOn(new Error("delegate in relay not existing " + targetName)); 
			var impl = this.delegate[targetName];
			if (!impl)
				throw dbgOn(new Error("delegate " + this.delegate + " does not implement " + targetName)); 
			var result = impl.apply(this.delegate, arguments);
			return optConv ? optConv(result) : result;
		}
	},

	newRelayUpdater: function newRelayUpdater(targetName, optConv) {
		return function updateRelay(/*...*/) {
			var impl = this.delegate[targetName];
			if (!impl)
				throw dbgOn(new Error("delegate " + this.delegate + " does not implement " + targetName)); 
			return impl.apply(this.delegate, arguments);
		}
	},

	handleStringSpec: function(def, key, value) {
		dbgOn(value.startsWith("set") || value.startsWith("get")); // probably a mixup

		if (value.startsWith("!")) {
			// call an update method with the derived name
			def["on" + key + "Update"] = Relay.newRelayUpdater("on" + value.substring(1) + "Update");
			// see below
			def["set" + key] = Relay.newRelayUpdater("on" + value.substring(1) + "Update");
		} else if (value.startsWith("=")) {
			// call exactly that method
			def["on" + key + "Update"] = Relay.newRelayUpdater(value.substring(1));
			// FIXME: e.g. closeHalo is a ButtonMorph,
			// this.closeHalo.connectModel(Relay.newInstance({Value: "=onRemoveButtonPress"}, this)); should call
			// this.onRemoveButtonPress()
			// the method newDelegatorSetter --> setter() which is triggered from setValue() of the button would only look
			// for the method setValue in def, but there is onyl onValueUpdate, so add also setValue ...
			def["set" + key] = Relay.newRelayUpdater(value.substring(1));
		} else {
			if (!value.startsWith('-')) { // not read-only
				var stripped = value.startsWith('+') ? value.substring(1) : value;
				def["set" + key] = Relay.newRelaySetter("set" + stripped);
			}
			if (!value.startsWith('+')) { // not write-only
				var stripped = value.startsWith('-') ? value.substring(1) : value;
				def["get" + key] = Relay.newRelayGetter("get" + stripped);
			}
		}
	},


	handleDictSpec: function(def, key, spec) { // FIXME unused
		var mode = spec.mode;
		if (mode === "!") {
			// call an update method with the derived name
			def["on" + key + "Update"] = Relay.newRelayUpdater("on" + spec.name + "Update", spec.from);
		} else if (mode === "=") {
			// call exactly that method
			def["on" + key + "Update"] = Relay.newRelayUpdater(spec.name, spec.from);
		} else {
			if (mode !== '-') { // not read-only
				def["set" + key] = Relay.newRelaySetter("set" + spec.name, spec.to);
			}
			if (mode !== '+') { // not write-only
				def["get" + key] = Relay.newRelayGetter("get" + spec.name, spec.from);
			}
		}
	},

	create: function(args) {
		var klass = Relay.subclass();
		var def = {
			definition: Object.clone(args), // how the relay was constructed
			copy: function(copier) {
				var result =  Relay.create(this.definition);
				copier.shallowCopyProperty("delegatee", result, this);
				return result
			},
			toString: function() {
				return "#<Relay{" + String(JSON.serialize(args)) + "}>";
			}
		};
		Properties.forEachOwn(args, function(key, spec) { 
			if (Object.isString(spec.valueOf()))
				Relay.handleStringSpec(def, key, spec); 
			else 
			Relay.handleDictSpec(def, key, spec);
		});

		klass.addMethods(def);
		return klass;
	},

	newInstance: function(spec, delegate) {
		var Fwd = Relay.create(spec); // make a new class
		return new Fwd(delegate); // now make a new instance
	},
	
	// not sure if it belongs in Relay	  
	newDelegationMixin: function(spec) {

		function newDelegatorGetter (name, from, byDefault) {
			var methodName = "get" + name;
			return function getter() {
				var m = this.formalModel;
				if (!m)
					return this.getModelValue(methodName, byDefault);
				var method = m[methodName];
				if (!method) return byDefault;
				var result = method.call(m);
				return (result === undefined) ? byDefault : (from ? from(result) : result);
			}
		}

		function newDelegatorSetter(name, to) {
			var methodName = "set" + name;
			return function setter(value, force) {
				var m = this.formalModel;
				if (!m) 
					return this.setModelValue(methodName, value);
				var method = m[methodName];
				// third arg is source, fourth arg forces relay to set value even if oldValue === value
				return method && method.call(m, to ? to(value) : value, this, force);
			}
		}

		var klass = Object.subclass();

		if (spec instanceof Array) {
			spec.forEach(function(name) {
				if (!name.startsWith('-')) { // not read-only
					var stripped = name.startsWith('+') ? name.substring(1) : name;
					klass.prototype["set" + stripped] = newDelegatorSetter(stripped);
				}
				if (!name.startsWith('+')) { // not write-only
					var stripped = name.startsWith('-') ? name.substring(1) : name;
					klass.prototype["get" + stripped] = newDelegatorGetter(stripped);
				}
			});
		} else {
			Properties.forEachOwn(spec, function(name, desc) {
				var mode = desc.mode;
				if (mode !== "-")
					klass.prototype["set" + name] = newDelegatorSetter(name, desc.to);
				if (mode !== "+")
					klass.prototype["get" + name] = newDelegatorGetter(name, desc.from, desc.byDefault);
			});
		}
		return klass;
	}

});

namespace('lively');
// Global.console && Global.console.log("loaded basic library"); // commented out by Adam - it's getting annoying


// ===========================================================================
// Portable graphics foundations
// ===========================================================================

Object.subclass("Point", {
	documentation: "2D Point",

	initialize: function(x, y) {
		this.x = x;
		this.y = y;
		return this;
	},

	deserialize: function(importer, string) { // reverse of toString
		var array = string.slice(3, -1).split(',');
		this.x = lively.data.Coordinate.parse(array[0]);
		this.y = lively.data.Coordinate.parse(array[1]);
	},

	addPt: function(p) { return new Point(this.x + p.x, this.y + p.y); },
	addXY: function(dx,dy) { return new Point(this.x + dx, this.y + dy); },
	midPt: function(p) { return new Point((this.x + p.x)/2, (this.y + p.y)/2); },
	subPt: function(p) { return new Point(this.x - p.x, this.y - p.y); },
	negated: function() { return new Point(-this.x, -this.y); },
	inverted: function() { return new Point(1.0/this.x, 1.0/this.y); },
	invertedSafely: function() { return new Point(this.x && 1.0/this.x, this.y && 1.0/this.y); },
	scaleBy: function(scale) { return new Point(this.x*scale,this.y*scale); },
	scaleByPt: function(scalePt) { return new Point(this.x*scalePt.x,this.y*scalePt.y); },
	lessPt: function(p) { return this.x < p.x && this.y < p.y; },
	leqPt: function(p) { return this.x <= p.x && this.y <= p.y; },
	eqPt: function(p) { return this.x == p.x && this.y == p.y; },
	withX: function(x) { return pt(x, this.y); },
	withY: function(y) { return pt(this.x, y); },

	normalized: function() {
		var r = this.r();
		return pt(this.x / r, this.y / r);
	},

	dotProduct: function(p) { return this.x * p.x + this.y * p.y },

	minPt: function(p, acc) { 
		if (!acc) acc = new Point(0, 0); 
		acc.x = Math.min(this.x, p.x); 
		acc.y = Math.min(this.y, p.y);	
		return acc;
	},

	maxPt: function(p, acc) { 
		if (!acc) acc = new Point(0, 0);
		acc.x = Math.max(this.x, p.x);
		acc.y = Math.max(this.y, p.y); 
		return acc;
	},

	roundTo: function(quantum) { return new Point(this.x.roundTo(quantum), this.y.roundTo(quantum)); },

	random: function() {  return new Point(this.x*Math.random(), this.y*Math.random());	 },

	dist: function(p) { 
		var dx = this.x - p.x;
		var dy = this.y - p.y;
		return Math.sqrt(dx*dx + dy*dy); 
	},

	nearestPointOnLineBetween: function(p1, p2) { // fasten seat belts...
		if (p1.x == p2.x) return pt(p1.x, this.y);
		if (p1.y == p2.y) return pt(this.x, p1.y);
		var x1 = p1.x;
		var y1 = p1.y;
		var x21 = p2.x - x1;
		var y21 = p2.y - y1;
		var t = (((this.y - y1) / x21) + ((this.x - x1) / y21)) / ((x21 / y21) + (y21 / x21));
		return pt(x1 + (t * x21) , y1 + (t * y21)); 
	},

	asRectangle: function() { return new Rectangle(this.x, this.y, 0, 0); },
	extent: function(ext) { return new Rectangle(this.x, this.y, ext.x, ext.y); },
	extentAsRectangle: function() { return new Rectangle(0, 0, this.x, this.y) },

	toString: function() {
		return Strings.format("pt(%1.f,%1.f)", this.x, this.y);
	},

	toTuple: function() {
		return [ this.x, this.y ];
	},

	toLiteral: function() { return {x: this.x, y: this.y}; },

	inspect: function() {
		return JSON.serialize(this);
	},

	matrixTransform: function(mx, acc) {
		if (!acc) acc = pt(0, 0); // if no accumulator passed, allocate a fresh one
		acc.x = mx.a * this.x + mx.c * this.y + mx.e;
		acc.y = mx.b * this.x + mx.d * this.y + mx.f;
		return acc;
	},

	matrixTransformDirection: function(mx, acc) {
		if (!acc) acc = pt(0, 0); // if no accumulator passed, allocate a fresh one
		acc.x = mx.a * this.x + mx.c * this.y ;
		acc.y = mx.b * this.x + mx.d * this.y ;
		return acc;
	},
	
	// added by Adam for compatibility with other coordinate systems where y goes up instead of down
  moveDownAndRightBy: function (x, y) {
    return this.addXY(x, y);
  },

	// Polar coordinates (theta=0 is East on screen, and increases in CCW direction
	r: function() { return this.dist(pt(0,0)); },
	theta: function() { return Math.atan2(this.y,this.x); },

	copy: function() { return new Point(this.x, this.y); }
});

Point.addMethods({

	fastR: function() { 
		var a = this.x*this.x+this.y*this.y;
		var x = 17;
		for (var i = 0; i < 6; i++)
		x = (x+a/x)/2;
		return x;
	},

	fastNormalized: function() {
		var r = this.fastR();
		return pt(this.x / r, this.y / r);
	},
});

Object.extend(Point, {

	ensure: function(duck) { // make sure we have a Lively point
		if (duck instanceof Point) { 
			return duck;
		} else { 
			return new Point(duck.x, duck.y);
		}
	},

	// Note: theta=0 is East on the screen, and increases in counter-clockwise direction
	polar: function(r, theta) { return new Point(r*Math.cos(theta), r*Math.sin(theta)); },
	random: function(scalePt) { return new Point(scalePt.x.randomSmallerInteger(), scalePt.y.randomSmallerInteger()); },

	fromLiteral: function(literal) {
		return pt(literal.x, literal.y);
	}

});

// Shorthand for creating point objects
function pt(x, y) { 
	return new Point(x, y);
}

Object.subclass("Rectangle", {

	documentation: "primitive rectangle", 
	// structually equivalent to SVGRect 
	
	initialize: function(x, y, w, h) {
	this.x = x;
	this.y = y;
	this.width = w;
	this.height = h;
	return this;
	},

	copy: function() { return new Rectangle(this.x, this.y, this.width, this.height);  },
	maxX: function() { return this.x + this.width; },
	maxY: function() { return this.y + this.height; },
	withWidth: function(w) { return new Rectangle(this.x, this.y, w, this.height)},
	withHeight: function(h) { return new Rectangle(this.x, this.y, this.width, h)},
	withX: function(x) { return new Rectangle(x, this.y, this.width, this.height)},
	withY: function(y) { return new Rectangle(this.x, y, this.width, this.height)},
	extent: function() { return new Point(this.width,this.height); },
	withExtent: function(ext) { return new Rectangle(this.x, this.y, ext.x, ext.y); },
	center: function() { return new Point(this.x+(this.width/2),this.y+(this.height/2))},
	//Control point readers and writers
	topLeft: function() { return new Point(this.x, this.y)},
	topRight: function() { return new Point(this.maxX(), this.y)},
	bottomRight: function() { return new Point(this.maxX(), this.maxY())},
	bottomLeft: function() { return new Point(this.x, this.maxY())},
	leftCenter: function() { return new Point(this.x, this.center().y)},
	rightCenter: function() { return new Point(this.maxX(), this.center().y)},
	topCenter: function() { return new Point(this.center().x, this.y)},
	bottomCenter: function() { return new Point(this.center().x, this.maxY())},
	withTopLeft: function(p) { return Rectangle.fromAny(p, this.bottomRight()) },
	withTopRight: function(p) { return Rectangle.fromAny(p, this.bottomLeft()) },
	withBottomRight: function(p) { return Rectangle.fromAny(p, this.topLeft()) },
	withBottomLeft: function(p) { return Rectangle.fromAny(p, this.topRight()) },
	withLeftCenter: function(p) { return new Rectangle(p.x, this.y, this.width + (this.x - p.x), this.height)},
	withRightCenter: function(p) { return new Rectangle(this.x, this.y, p.x - this.x, this.height)},
	withTopCenter: function(p) { return new Rectangle(this.x, p.y, this.width, this.height + (this.y - p.y))},
	withBottomCenter: function(p) { return new Rectangle(this.x, this.y, this.width, p.y - this.y)}
});

Rectangle.addMethods({

	containsPoint: function(p) {
		return this.x <= p.x && p.x <= this.x + this.width && this.y<= p.y && p.y <= this.y + this.height;
	},

	containsRect: function(r) {
		return this.x <= r.x && this.y<= r.y && r.maxX()<=this.maxX() && r.maxY()<=this.maxY();
	},

	constrainPt: function(pt) { return pt.maxPt(this.topLeft()).minPt(this.bottomRight()); },

	intersection: function(r) {
		// return rect(this.topLeft().maxPt(r.topLeft()),this.bottomRight().minPt(r.bottomRight())); 
		var nx = Math.max(this.x, r.x);
		var ny = Math.max(this.y, r.y);
		var nw = Math.min(this.x + this.width, r.x + r.width) - nx;
		var nh = Math.min(this.y + this.height, r.y + r.height) - ny;
		return new Rectangle(nx, ny, nw, nh);
	},

	intersects: function(r) { return this.intersection(r).isNonEmpty(); },	// not the fastest

	union: function(r) {
	  // Optimized to avoid creating Point objects. -- Adam
	  var locationX = Math.min(this.x, r.x);
	  var locationY = Math.min(this.y, r.y);
	  var cornerX = Math.max(this.maxX(), r.maxX());
	  var cornerY = Math.max(this.maxY(), r.maxY());
  	return new Rectangle(locationX, locationY, cornerX - locationX, cornerY - locationY);
		// return rect(this.topLeft().minPt(r.topLeft()),this.bottomRight().maxPt(r.bottomRight())); 
	},

	isNonEmpty: function(rect) { return this.width > 0 && this.height > 0; },

	dist: function(r) { // dist between two rects
		var p1 = this.closestPointToPt(r.center()); 
		var p2 = r.closestPointToPt(p1);  
		return p1.dist(p2); 
	},

	closestPointToPt: function(p) { // Assume p lies outside me; return a point on my perimeter
		return pt(Math.min(Math.max(this.x, p.x), this.maxX()),
		Math.min(Math.max(this.y, p.y), this.maxY())); 
	},

	randomPoint: function() { // return a some point from inside me
		return Point.random(pt(this.width, this.height)).addPt(this.topLeft());
	},

  // Hacked to allow callers to avoid creating the Point object. -- Adam
	translatedBy: function(d) {
		return this.translatedByXY(d.x, d.y);
	},
	translatedByXY: function(dx, dy) {
		return new Rectangle(this.x+dx, this.y+dy, this.width, this.height); 
	},

	scaleByRect: function(r) { // r is a relative rect, as a pane spec in a window
		return new Rectangle (
			this.x + (r.x*this.width),
			this.y + (r.y*this.height),
			r.width * this.width,
			r.height * this.height ); 
	},

	scaleRectIn: function(fullRect) { // return a relative rect for this as a part of fullRect
		return new Rectangle (
			(this.x - fullRect.x) / fullRect.width,
			(this.y - fullRect.y) / fullRect.height,
			this.width	/ fullRect.width,
			this.height / fullRect.height ); 
	},
	
	// Added by Adam
	matrixTransform: function(tfm) {
    return rect(this.topLeft().matrixTransform(tfm), this.bottomRight().matrixTransform(tfm));
	},

	insetBy: function(d) {
		return new Rectangle(this.x+d, this.y+d, this.width-(d*2), this.height-(d*2));
	},

	insetByPt: function(p) {
		return new Rectangle(this.x+p.x, this.y+p.y, this.width-(p.x*2), this.height-(p.y*2));
	},

	expandBy: function(delta) { return this.insetBy(0 - delta); }

});

Object.extend(Rectangle, {
	corners: ["topLeft","topRight","bottomRight","bottomLeft"], 
	sides: ["leftCenter","rightCenter","topCenter","bottomCenter"]
});

Rectangle.addMethods({

	partNamed: function(partName) { 
		return this[partName].call(this); 
	},

	withPartNamed: function(partName,newValue) {
		return this[this.setterName(partName)].call(this, newValue); 
	},

	setterName: function(partName) {
		return "with" + partName[0].toUpperCase() + partName.slice(1); 
	},

	partNameNear: function(partNames,p,dist) { 
		var partName = this.partNameNearest(partNames,p);
		return (p.dist(this.partNamed(partName)) < dist) ? partName : null; 
	},

	partNameNearest: function(partNames, p) { 
		var dist = 1.0e99;
		var partName = partNames[0];

		for (var i=0; i<partNames.length; i++) { 
			var partName = partNames[i];
			var pDist = p.dist(this.partNamed(partName));
			if (pDist < dist) {var nearest = partName; dist = pDist} 
		}

		return nearest; 
	},

	toString: function() { 
		return Strings.format("rect(%s,%s)", this.topLeft(), this.bottomRight());
	},

	toTuple: function() {
		return [this.x, this.y, this.width, this.height];
	},

	inspect: function() {
		return JSON.serialize(this);
	}
});

Rectangle.addMethods({
	// These methods enable using rectangles as insets, modeled after
	// the CSS box model, see http://www.w3.org/TR/REC-CSS2/box.html
	// note topLeft() bottomRight() etc, return the intuitively
	// correct values for Rectangles used as insets.

	left: function() {
		return this.x;
	},

	right: function() {
		return this.maxX();
	},

	top: function() {
		return this.y;
	},

	bottom: function() {
		return this.maxY();
	},

	toInsetTuple: function() {
		return [this.left(), this.top(), this.right(), this.bottom()];
	},

	toAttributeValue: function(d) {
		var d = 0.01;
		var result = [this.left()];
		if (this.top() === this.bottom() && this.left() === this.right()) {
			if (this.top() === this.left()) result.push(this.top());
			} else result = result.concat([this.top(), this.right(), this.bottom()]);
			return result.invoke('roundTo', d || 0.01);
	},

	insetByRect: function(r) {
		return new Rectangle(this.x + r.left(), this.y + r.top(), this.width - (r.left() + r.right()), this.height - (r.top() + r.bottom()));
	},

	outsetByRect: function(r) {
		return new Rectangle(this.x - r.left(), this.y - r.top(), this.width + (r.left() + r.right()), this.height + (r.top() + r.bottom()));
	},

	toLiteral: function() { return {x: this.x, y: this.y, width: this.width, height: this.height}; },

});



Object.extend(Rectangle, {

	fromAny: function(ptA, ptB) {
		return rect(ptA.minPt(ptB), ptA.maxPt(ptB));
	},

	fromLiteral: function(literal) {
		return new Rectangle(literal.x, literal.y, literal.width, literal.height);
	},

	unionPts: function(points) {
		var min = points[0];
		var max = points[0];

		// AT: Loop starts from 1 intentionally
		for (var i = 1; i < points.length; i++) {
			min = min.minPt(points[i]);
			max = max.maxPt(points[i]); 
		}

		return rect(min, max); 
	},

	ensure: function(duck) {
		if (duck instanceof Rectangle) {
			return duck;
		} else {
			return new Rectangle(duck.x, duck.y, duck.width, duck.height);
		}
	},

	fromElement: function(element) {
		return new Rectangle(element.x.baseVal.value, element.y.baseVal.value, 
			element.width.baseVal.value, element.height.baseVal.value);
	},

	inset: function(left, top, right, bottom) {
		if (top === undefined) top = left;
		if (right === undefined) right = left;
		if (bottom === undefined) bottom = top;
		return new Rectangle(left, top, right - left, bottom - top);
	}

});

// Shorthand for creating rectangle objects
function rect(location, corner) {
	return new Rectangle(location.x, location.y, corner.x - location.x, corner.y - location.y);
};

// ===========================================================================
// Color support
// ===========================================================================

Object.subclass("Color", { 

	documentation: "Fully portable support for RGB colors",

	initialize: function(r, g, b) {
		this.r = r;
		this.g = g;
		this.b = b;
	},

	// Mix with another color -- 1.0 is all this, 0.0 is all other
	mixedWith: function(other, proportion) { 
		var p = proportion;
		var q = 1.0 - p;
		return new Color(this.r*p + other.r*q, this.g*p + other.g*q, this.b*p + other.b*q); 
	},

	darker: function(recursion) { 
		var result = this.mixedWith(Color.black, 0.5);
		return recursion > 1  ? result.darker(recursion - 1) : result;
	},

	lighter: function(recursion) { 
		if (recursion == 0) 
			return this;
		var result = this.mixedWith(Color.white, 0.5);
		return recursion > 1 ? result.lighter(recursion - 1) : result;
	},
	
	// added by Adam
	isVeryLight: function() { return this.r >= 0.95 && this.g >= 0.95 && this.b >= 0.95; },
	isVeryDark:  function() { return this.r <= 0.05 && this.g <= 0.05 && this.b <= 0.05; },

	toString: function() {
		function floor(x) { return Math.floor(x*255.99) };
		return "rgb(" + floor(this.r) + "," + floor(this.g) + "," + floor(this.b) + ")";
	},

	toTuple: function() {
		return [this.r, this.g, this.b];
	},
	
	deserialize: function(importer, colorStringOrTuple) {
		if (!colorStringOrTuple) return null;
		// dbgOn(!str.match);
		var color;
		if (colorStringOrTuple instanceof Color) color = colorStringOrTuple;
		else if (colorStringOrTuple instanceof String) color = Color.fromString(colorStringOrTuple)
		else color = Color.fromTuple(colorStringOrTuple);
		this.r = color.r;
		this.g = color.g;
		this.b = color.b;
	}
});

Object.extend(Color, {

	black: new Color(0,0,0),
	white: new Color(1,1,1),
	gray: new Color(0.8,0.8,0.8),
	red: new Color(0.8,0,0),
	green: new Color(0,0.8,0),
	yellow: new Color(0.8,0.8,0),
	blue:  new Color(0,0,0.8),
	purple: new Color(1,0,1),
	magenta: new Color(1,0,1),
	

	random: function() {
		return new Color(Math.random(),Math.random(),Math.random()); 
	},

	hsb: function(hue,sat,brt) {
		var s = sat;
		var b = brt;
		// zero saturation yields gray with the given brightness
		if (sat == 0) return new Color(b,b,b);
		var h = hue % 360;
		var h60 = h / 60;
		var i = Math.floor(h60); // integer part of hue
		var f = h60 - i; // fractional part of hue
		var p = (1.0 - s) * b;
		var q = (1.0 - (s * f)) * b;
		var t = (1.0 - (s * (1.0 - f))) * b;

		switch (i) {
			case 0:	 return new Color(b,t,p);
			case 1:	 return new Color(q,b,p);
			case 2:	 return new Color(p,b,t);
			case 3:	 return new Color(p,q,b);
			case 4:	 return new Color(t,p,b);
			case 5:	 return new Color(b,p,q);
			default: return new Color(0,0,0); 
		} 
	},

	wheel: function(n) { 
		return Color.wheelHsb(n,0.0,0.9,0.7); 
	},

	// Return an array of n colors of varying hue
	wheelHsb: function(n,hue,sat,brt) {
		var a = new Array(n);
		var step = 360.0 / (Math.max(n,1));

		for (var i = 0; i < n; i++) 
		a[i] = Color.hsb(hue + i*step, sat, brt);

		return a; 
	},

	rgb: function(r, g, b) {
		return new Color(r/255, g/255, b/255);
	},

	fromLiteral: function(spec) {
		return new Color(spec.r, spec.g, spec.b);
	},

	fromTuple: function(tuple) {
		return new Color(tuple[0], tuple[1], tuple[2]);
	},

	fromString: function(str) {
		var tuple = Color.parse(str);
		return tuple && Color.fromTuple(tuple);
	},

	parse: function(str) { 
		// FIXME this should be much more refined
		// FIXME handle keywords
		if (!str || str == 'none')
			return null;
		var match = str.match("rgb\\((\\d+),(\\d+),(\\d+)\\)");
		var r,g,b;
		if (match) { 
			r = parseInt(match[1])/255;
			g = parseInt(match[2])/255;
			b = parseInt(match[3])/255;
			return [r, g, b];
		} else if (str.length == 7 && str.charAt(0) == '#') {
			r = parseInt(str.substring(1,3), 16)/255;
			g = parseInt(str.substring(3,5), 16)/255;
			b = parseInt(str.substring(5,7), 16)/255;
			return [r, g, b];
		} else return null;
	}
});


Object.extend(Color, {
	darkGray: Color.gray.darker(),
	lightGray: Color.gray.lighter(),
	veryLightGray: Color.gray.lighter().lighter(),
	turquoise: Color.rgb(0, 240, 255),
	//	  brown: Color.rgb(182, 67, 0),
	//	  red: Color.rgb(255, 0, 0),
	orange: Color.rgb(255, 153, 0),
	//	  yellow: Color.rgb(204, 255, 0),
	//	  limeGreen: Color.rgb(51, 255, 0),
	//	  green: Color.rgb(0, 255, 102),
	//	  cyan: Color.rgb(0, 255, 255),
	//	  blue: Color.rgb(0, 102, 255),
	//	  purple: Color.rgb(131, 0, 201),
	//	  magenta: Color.rgb(204, 0, 255),
	//	  pink: Color.rgb(255, 30, 153),

	tangerine: Color.rgb(242, 133, 0),

	primary: {
		// Sun palette
		blue: Color.rgb(0x53, 0x82, 0xA1),
		orange: Color.rgb(0xef, 0x6f, 0x00),
		green: Color.rgb(0xb2, 0xbc, 00),
		yellow: Color.rgb(0xff, 0xc7, 0x26)
	},

	secondary: {
		blue: Color.rgb(0x35, 0x55, 0x6b),
		orange: Color.rgb(0xc0, 0x66, 0x00),
		green: Color.rgb(0x7f, 0x79, 0x00),
		yellow: Color.rgb(0xc6, 0x92, 0x00)
	},

	neutral: {
		lightGray: Color.rgb(0xbd, 0xbe, 0xc0),
		gray: Color.rgb(0x80, 0x72, 0x77)
	}

});

// Global.console && Global.console.log("Loaded platform-independent graphics primitives"); // commented out by Adam - it's getting annoying

namespace('lively.data');
// FIXME the following does not really belong to Base should be somewhere else
Record.subclass('lively.data.DOMRecord', {
	description: "base class for records backed by a DOM Node",
	noShallowCopyProperties: ['id', 'rawNode', '__annotation__'], // __annotation__ added by Adam

	initialize: function($super, store, argSpec) {
		$super(store, argSpec);
		this.setId(this.newId());
		var def = this.rawNode.appendChild(NodeFactory.create("definition"));
		def.appendChild(NodeFactory.createCDATA(String(JSON.serialize(this.definition))));
	},

	deserialize: function(importer, rawNode) {
		this.rawNode = rawNode;
	},

	getRecordField: function(name) { 
		dbgOn(!this.rawNode || !this.rawNode.getAttributeNS);
		var result = this.rawNode.getAttributeNS(null, name);
		if (result === null) return undefined;
		else if (result === "") return null;
		if (result.startsWith("json:")) return Converter.fromJSONAttribute(result.substring("json:".length));
		else return result;
	},

	setRecordField: function(name, value) {
		if (value === undefined) {
			throw new Error("use removeRecordField to remove " + name);
		}
		if (value && Converter.needsJSONEncoding(value)) {
			value = "json:" + Converter.toJSONAttribute(value);
		}

		return this.rawNode.setAttributeNS(null, name, value || "");
	},

	removeRecordField: function(name) {
		return this.rawNode.removeAttributeNS(null, name);
	},

	copyFrom: function(copier, other) {
		// console.log("COPY DOM RECORD")
		if (other.rawNode) this.rawNode = other.rawNode.cloneNode(true);
		this.setId(this.newId());
		copier.addMapping(other.id(), this);

		copier.shallowCopyProperties(this, other);
		
		return this; 
	},

});

lively.data.DOMRecord.subclass('lively.data.DOMNodeRecord', {
	documentation: "uses nodes instead of attributes to store values",

	getRecordField: function(name) { 
		var fieldElement = this[name + "$Element"];
		if (fieldElement) {
			if (lively.data.Wrapper.isInstance(fieldElement)) {
				return fieldElement; // wrappers are stored directly
			};			
			if (LivelyNS.getAttribute(fieldElement, "isNode")) return fieldElement.firstChild; // Replace with DocumentFragment
			var value = fieldElement.textContent;
			if (value) {
			var family = LivelyNS.getAttribute(fieldElement, "family");
			if (family) {
				var klass = Class.forName(family);
				if (klass) throw new Error('unknown type ' + family);
				return klass.fromLiteral(JSON.unserialize(value, Converter.nodeDecodeFilter));
				} else {
					if (value == 'NaN') return NaN;
					if (value == 'undefined') return undefined;
					if (value == 'null') return null;
					// jl: fixes a bug but wrapperAndNodeDecodeFilter is not clever enought... 
					// so waiting for pending refactoring
					// return JSON.unserialize(value, Converter.wrapperAndNodeDecodeFilter);
					return JSON.unserialize(value);
				}
			}
		} else {
			// console.log('not found ' + name);
			return undefined;
		}
	},
	
	setRecordField: function(name, value) {
		if (value === undefined) {
			throw new Error("use removeRecordField to remove " + name);
		}
		var propName = name + "$Element"; 
		var fieldElement = this[propName];
		if (fieldElement && fieldElement.parentElement === this.rawNode) {
			this.rawNode.removeChild(fieldElement);
		}
		
		if (lively.data.Wrapper.isInstance(value)) { 
			this[propName] = value; // don't encode wrappers, handle serialization somewhere else 
		} else {
			fieldElement = Converter.encodeProperty(name, value);
			if (fieldElement) this.rawNode.appendChild(fieldElement);
			else console.log("failed to encode " + name + "= " + value);
			this[propName] = fieldElement;
		}
		// console.log("created cdata " + fieldElement.textContent);
	},
	
	removeRecordField: function(name) {
		var fieldElement = this[name + "$Element"];
		if (fieldElement) {
			try { // FIXME ... argh!!!
				this.rawNode.removeChild(fieldElement);
			} catch(e) {
				console.warn('Cannot remove record field' + name + ' of ' + this + ' because ' + e);
			}
			delete this.fieldElement;
		}
	},

	

	deserialize: function(importer, rawNode) {
		this.rawNode = rawNode;
	
		var bodySpec = JSON.unserialize(rawNode.getElementsByTagName('definition')[0].firstChild.textContent);
		this.constructor.addMethods(Record.extendRecordClass(bodySpec));
		this.definition = bodySpec;
	
		$A(rawNode.getElementsByTagName("field")).forEach(function(child) {
				// this[name + "$Element"] = child.getAttributeNS(null, "name");
			this[child.getAttributeNS(null, "name") + "$Element"] = child;
		}, this);
	},

	copyFrom: function($super, copier, other) {
		$super(copier, other);
		this.constructor.addMethods(Record.extendRecordClass(other.definition));
		$A(this.rawNode.getElementsByTagName("field")).forEach(function(child) {
			this[child.getAttributeNS(null, "name") + "$Element"] = child;
		}, this);
		return this; 
	},

	updateDefintionNode: function() {
		var definitionNode = this.rawNode.getElementsByTagName("definition")[0];
		definitionNode.removeChild(definitionNode.firstChild);
		definitionNode.appendChild(NodeFactory.createCDATA(String(JSON.serialize(this.definition))));  
	},
	
	addField: function($super, fieldName, coercionSpec, forceSet) {
		$super(fieldName, coercionSpec, forceSet);
		this.updateDefintionNode();
	}
	
});

// note: the following happens later
//Class.addMixin(DOMRecord, lively.data.Wrapper.prototype);

Record.subclass('lively.data.StyleRecord', {
	description: "base class for records backed by a DOM Node",
	getRecordField: function(name) { 
		dbgOn(!this.rawNode || !this.rawNode.style);
		var result = this.rawNode.style.getPropertyValue(name);

		if (result === null) return undefined;
		else if (result === "") return null;
		else return result;
	},

	setRecordField: function(name, value) {
		dbgOn(!this.rawNode || !this.rawNode.style);
		if (value === undefined) {
			throw new Error("use removeRecordField to remove " + name);
		}
		return this.rawNode.style.setProperty(name, value || "", "");
	},

	removeRecordField: function(name) {
		dbgOn(!this.rawNode || !this.rawNode.style);
		return this.rawNode.style.removeProperty(name);
	}

});


Object.subclass('lively.data.Bind', {
	// unify with the record mechanism
	
	// note that Bind could specify which model to bind to, not just the default one
	initialize: function(varName, kickstart, debugString) {
		this.varName = varName;
		this.kickstart = kickstart;
		this.key = null;
		this.debugString = debugString;
		this["on" + varName + "Update"] = this.update;
	},

	update: function(value) {
		if (Object.isNumber(this.key)) {
			console.log('cannot notify owner of array ' + this.target + ' to update element ' + this.key);
			return;
		}
		var method = this.target["set" + this.key];
		if (!method) { console.warn('no method for binding ' + this.varName + " to " + this.key); return }
		if (this.debugString) console.log('triggering update of ' + this.varName  + " to " + value 
		+ " context " + this.debugString);
		method.call(this.target, value);
	},


	get: function(model) {
		if (!model) return undefined;
		var method = model["get" + this.varName];
		dbgOn(!method);
		var result = method.call(model);
		if (this.debugString) 
			console.log('Bind to:' + this.varName  + " retrieved model value " + result	 
		+ ' context '  + this.debugString);
		return result;
	},

	toString: function() {
		return "{Bind to: " + this.varName + "}";
	},

	hookup: function(target, model) {
		this.target = target;
		model.addObserver(this);
		if (this.kickstart)
			this.update(this.get(model)); // kickstart
	}
});

Object.extend(lively.data.Bind, {
	fromLiteral: function(literal) {
		return new lively.data.Bind(literal.to, literal.kickstart || false, literal.debugString);
	}	
});



Object.subclass('lively.data.Resolver', {
	description: "resolves literals to full-blown objects",
	storedClassKey: '$', // type info, missing in 
	variableBindingKey: '$var',
	defaultSearchPath: [Global],

	link: function(literal, binders, key, variableBindings, optSearchPath, optModel) {
		var constr;
		var type = literal[this.storedClassKey];
		if (type) {
			var path = optSearchPath || this.defaultSearchPath;
			for (var i = 0; i < path.length; i++)  {
				constr = path[i][type];
				if (constr) 
					break;
			}
			//console.log('was looking for ' + type + ' in ' +	path + ' and found ' + constr);
		} else if (literal.constructor !== Object) { 
			// not of the form {foo: 1, bar: "baz"},  return it as is
			return literal; 
		}

		var initializer = {}; 
		var subBinders = [];
		for (var name in literal) {
			if (name === this.storedClassKey) continue;
			if (name === this.variableBindingKey) continue;
			if (!literal.hasOwnProperty(name)) continue;
			var value = literal[name];
			if (value === null || value === undefined)
				initializer[name] = value;
			else switch (typeof value) {
				case "number":
				case "string":
				case "boolean":
				initializer[name] = value;
				break;
				case "function":
				break; // probably an error
				case "object": {
					if (value instanceof Array) {
						var array = initializer[name] = [];
						for (var i = 0; i < value.length; i++)	{
							array.push((this.link(value[i], subBinders, i, variableBindings, optSearchPath, optModel)));
						}
					} else {
						initializer[name] = this.link(value, subBinders, name, variableBindings, optSearchPath, optModel);
					}
					break;
				}
				default: 
				throw new TypeError('unexpeced type of value ' + value);
			}
		}

		var reified;
		if (type) {
			if (!constr) throw new Error('no class named ' + type);
			if (!constr.fromLiteral) throw new Error('class ' + constr.name + ' does not support fromLiteral');
			reified = constr.fromLiteral(initializer, optModel);
			if (reified instanceof lively.data.Bind) {
				reified.key = key;
				binders.push(reified);
				reified = reified.get(optModel);
			} else {
				subBinders.forEach(function(binder) {
					binder.hookup(reified, optModel);
				});
			}

		} else {
			//console.log('reified is ' + (initializer && initializer.constructor) + " vs  " + literal);
			reified = initializer;
		}

		if (literal[this.variableBindingKey]) {
			var varName = literal[this.variableBindingKey];
			//console.log('binding ' + varName + ' to ' + reified + " on " + variableBindings);
			variableBindings[varName] = reified;
		}

		return reified;
	}
});

Global.ModelMigration = {
	set: function(objectWithModel, slotName, value, force) { // derived from newDelegatorSetter -> setter
		var m = objectWithModel.formalModel;
		if (!m) 
			return objectWithModel.setModelValue('set' + slotName, value);
		var method = m['set' + slotName];
		// third arg is source, fourth arg forces relay to set value even if oldValue === value
		return method && method.call(m, value, objectWithModel, force);
	}
}
