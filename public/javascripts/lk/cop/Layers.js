/*
 * Copyright (c) 2009-2010 Hasso-Plattner-Institut
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
 * COP Layers for JavaScript
 */

module('cop.Layers').requires().toRun(function(thisModule) {

var log_layer_code = false;	
var log = function log(string) { if(log_layer_code) console.log(string); }; 


Global.ContextJS = {}

ContextJS.withLogLayerCode = function(func) {
	try {
		var old  = log_layer_code; 
		log_layer_code = true
		func();
	} finally {
		log_layer_code = old;
	}	
};

/*
 * extend the subclassing behavior of Lively Kernel to allow fo Layer-In-Class constructs  
 */	
Object.extend(Function.prototype, { 
	subclass: Object.subclass.wrap(function(proceed) {
		var args = $A(arguments);
		args.shift();
		var layeredMethods = [];
	
		for (var i=1; i < args.length; i++) {
			var methods = args[i];
			Object.keys(methods).each(function(ea) {
				var m = ea.match(/([A-Za-z0-9]+)\$([A-Za-z0-9]*)/);
				if (m) {
					var getter = methods.__lookupGetter__(m[0]);
					var setter = methods.__lookupSetter__(m[0]);
					layeredMethods.push({layerName: m[1], methodName: m[2], methodBody: methods[ea], 
						getterMethod: getter, setterMethod: setter});
					delete methods[ea];
				};
			});
		};
		var klass =  proceed.apply(this, args);
		layeredMethods.each(function(ea){
			// log("layer property " + ea.methodName + " in " + ea.layerName);
			var layer = Global[ea.layerName];
			if (!layer) throw new Error("could not find layer: " + ea.layerName);
			if (ea.getterMethod || ea.setterMethod) {
				if (ea.getterMethod) {
					layerGetterMethod(layer, klass.prototype, ea.methodName, ea.getterMethod);
				};
				if (ea.setterMethod) {
					layerSetterMethod(layer, klass.prototype, ea.methodName, ea.setterMethod);
				};
				makePropertyLayerAware(klass.prototype, ea.methodName);
			} else {
				// log("layer method " + ea.methodName + " in " + ea.layerName);
				layerMethod(layer, klass.prototype, ea.methodName, ea.methodBody);
			}
		});
		return klass;
	})
});

/*
 * Private Helper Methods
 */
var lookupLayeredFunctionForObject = function Layers$lookupLayeredFunctionForObject(self, layer, obj, function_name, methodType, n) {
	if (layer) {
		// we have to look for layers defintions for self, self.prototype, ... there may be layered methods 
		// in a subclass of "obj"			
		var layer_defition_for_object = getLayerDefinitionForObject(layer, self);
		if(layer_defition_for_object) {
			// log("  found layer definitions for object");
			var layered_function;
			// TODO: optional proceed goes here....
			if (methodType == 'getter') {
				layered_function = layer_defition_for_object.__lookupGetter__(function_name);
			} else if (methodType == 'setter'){
				layered_function = layer_defition_for_object.__lookupSetter__(function_name);
			} else {
				layered_function = layer_defition_for_object[function_name];
			};
		}
		if(!layered_function)  {
			// try the superclass hierachy
			// log("look for superclass of: " + self.constructor)
			var superclass = self.constructor.superclass
			if (superclass) {
				foundClass = superclass;
				// log("layered function is not found in this partial method, lookup for my prototype?")
				return lookupLayeredFunctionForObject(superclass.prototype, layer, obj, function_name, methodType)
			} else {
				// log("obj has not prototype")
			}
		};
		return layered_function
		
	};
}

var executeWithLayers = function ContextJS$executeWithLayers(base_function, self, layers, index, obj, function_name, args, methodType) {
	// log("executeWithLayers(" + layers + ", " + obj + ", " + function_name+")");
	if (index < layers.length) {
		var layer = layers[layers.length - index - 1];
		var layered_function = lookupLayeredFunctionForObject(self, layer, obj, function_name, methodType)
		if (layered_function) {
			// log("  found layered function: " + layered_function);
			var new_proceed = function executeWithLayers_new_proceed() {
				var new_arguments = $A(arguments);
				new_arguments.unshift(null);
				// log("new_proceed " + new_arguments)
				// var new_arguments = args; // arguments can not be overridden...				
				return executeWithLayers(base_function, self, layers, index + 1, obj, function_name, new_arguments, methodType);
			};
			args[0] = new_proceed;
			return layered_function.apply(self, args);	
		}
		
		return executeWithLayers(base_function, self, layers, index + 1, obj, function_name, args, methodType);
	};
	// log("execute base method");
	args.shift(); // remove proceed argument
	return base_function.apply(self, args);
};

Object.extend(ContextJS, {

	makeFunctionLayerAware: function(base_obj, function_name) {
		if (!base_obj) throw new Error("can't layer an non existent object");

		var base_function = base_obj[function_name];
		if (!base_function) {
			// console.log("WARNING can't layer an non existent function" + function_name +" , so do nothing")
			// return;
			base_function = Functions.Null
		};
		if (base_function.isLayerAware) {
			// nothing to do
			return;
		};
		// log("ContextJS.makeFunctionLayerAware: " + base_obj );
		var wrapped_function = function() {
			var args = $A(arguments);
			args.unshift(null); // empty proceed argument (performance optimisation uglyness)
			return executeWithLayers(base_function, this, computerLayersFor(this), 0, base_obj, function_name, args);
		};
		
		if (base_obj.constructor) {
			wrapped_function.displayName = 'wrapped ' + base_obj.constructor.name + "$" + function_name
		};
		wrapped_function.isLayerAware = true;
	
		base_obj[function_name] = wrapped_function;
	}
})

/* because getters, setters and normal methods are differently read and written, there
   are three paths, that are principally the same but differ in some methodnames... */
Global.makePropertyLayerAware = function(base_obj, property) {
	if (!base_obj) throw new Error("can't layer an non existent object");

    
	var getter = base_obj.__lookupGetter__(property);
	var layered_property = "__layered_" + property +"__";

	if (!getter) {
		// does not work when dealing with classes and instances...
		base_obj[layered_property] = base_obj[property]; // take over old value
		getter = function() {
			// return base_obj[layered_property]
			return this[layered_property];
		};		
		base_obj.__defineGetter__(property, getter);
	}; 
	if (!getter.isLayerAware) {
		var wrapped_getter =  function() {
			return executeWithLayers(getter, this, computerLayersFor(this), 0, base_obj, property, [null], 'getter');
		};
		
		wrapped_getter.displayName = "layered get " + (base_obj.constructor ? (base_obj.constructor.type + "$"): "") +  +property
		wrapped_getter.isLayerAware = true;
		base_obj.__defineGetter__(property, wrapped_getter);
	} 
	var setter = base_obj.__lookupSetter__(property);
	if (!setter) {
		var setter = function(value, value2) {
			// log(this.toString() + " set " + property +" to " +value );
			//base_obj[layered_property] = value
			this[layered_property] = value;
		};
		base_obj.__defineSetter__(property, setter);
	};
	if (!setter.isLayerAware) {
		var wrapped_setter = function ContextJS$makeFunctionLayerAwareWrappedSetter() {
			var args = $A(arguments);
			args.unshift(null);
			return executeWithLayers(setter, this, computerLayersFor(this), 0, base_obj, property, args, 'setter');
		};
		wrapped_setter.displayName = "layered set " + (base_obj.constructor ? (base_obj.constructor.type + "$"): "") +  +property	
		wrapped_setter.isLayerAware = true;
		base_obj.__defineSetter__(property, wrapped_setter);
	}
};

Global.getLayerDefinitionForObject = function Layers$getLayerDefinitionForObject(layer, object) {
	// log("getLayerDefinitionForObject(" + layer + "," + object +")")
	if (!layer || !object)
		return;
	var result = layer[object._layer_object_id];
	if (result) {
		return result
	} else {
		return getLayerDefinitionForObject(layer, object.prototype)
	}
}


var object_id_counter = 0; // hack, to work around absence of identity dictionaries in JavaScript 
// we could perhaps limit ourselfs to layer only those objects that respond to object.id()

// because working with objects is a serialization problem in itself, perhaps we should restrict ourself in working with classes
// So classes have names and names can be used as keys in dictionaries :-)

Global.ensurePartialLayer = function Layers$ensurePartialLayer(layer, object) {
	// log("ensurePartialLayer(" + layer + ", " +object+ ")")
	if (!layer)
		throw new Error("in ensurePartialLayer: layer is nil")
	if(!object.hasOwnProperty("_layer_object_id")) {
		object._layer_object_id = object_id_counter++;
	};
	if (!layer[object._layer_object_id]) {
		layer[object._layer_object_id] = {};
	};	
	return layer[object._layer_object_id];
};

Global.layerMethod = function(layer, object,  property, func) {
	ensurePartialLayer(layer, object)[property] = func;
	func.displayName = "layered " + layer.name + " " + (object.constructor ? (object.constructor.type + "$"): "") + property
	ContextJS.makeFunctionLayerAware(object, property);
};

Global.layerGetterMethod = function(layer, object, property, getter) {
	// log("layerGetterMethod "+ layer + ", " + object +", " + property);
	ensurePartialLayer(layer, object).__defineGetter__(property, getter);
};

Global.layerSetterMethod = function(layer, object, property, setter) {
	// log("layerSetterMethod "+ layer + ", " + object +", " + property);
	ensurePartialLayer(layer, object).__defineSetter__(property, setter);
};

Global.layerProperty = function(layer, object,  property, defs) {
	if (!defs) {
		return layerPropertyWithShadow(layer, object, property);
	}
	var getter = defs.__lookupGetter__(property);
	if (getter) {
		layerGetterMethod(layer, object,  property, getter);
	};
    var setter = defs.__lookupSetter__(property);
	if (setter) {
		layerSetterMethod(layer, object,  property, setter);
	};
	if (getter || setter) {
		makePropertyLayerAware(object, property);
	} else {		
		layerMethod(layer, object,  property, defs[property]);
	};
};

layerPropertyWithShadow = function(layer, object, property) {
	var defs = {};
	var selector = "_layered_"+layer.name+"_"+ property; 
	defs.__defineGetter__(property, function(proceed){
		if(this[selector] === undefined && proceed) {
			// fallback / procceed on property lookup if layer does not define it own state
			return proceed();
		} else {
			return this[selector];
		}});
	defs.__defineSetter__(property, function(proceed, v) { 
		this[selector] = v;});
	layerProperty(layer, object, property, defs);
};

computerLayersFor = function Layers$computerLayersFor(obj) { 
	if (obj && obj.activeLayers) {
		// the object is now fully responsible for the layer composition
		return obj.activeLayers(Global.currentLayers)
	};
	var layers = Global.currentLayers(obj);
	return layers
};

Global.composeLayers = function Layers$composeLayers(stack, index, obj) {
	// console.log("compose " + stack + " index: " + index)
	if (index === undefined) {
		index = stack.length - 1;
	};
	if (index == 0) {
		if (obj && obj.getActivatedLayers) {
			var objectLayers = obj.getActivatedLayers();
			if (objectLayers) {
				return GlobalLayers.clone().concat(objectLayers)
			}
		};
		return GlobalLayers.clone();
	};
	var current = stack[index];
	var rest = Global.composeLayers(stack, index - 1, obj);
	if (current.withLayers) {
		rest = rest.reject(function(ea){return current.withLayers.include(ea);});
		return rest.concat(current.withLayers.clone());
	};
	if (current.withoutLayers) {
		rest = rest.reject(function(ea){return current.withoutLayers.include(ea);});
		return rest;
	};
	throw new Error("Error: Problems in layer composition");
};

Global.currentLayers= function Layers$currentLayers(obj) {
	if (Global.LayerStack.length == 0) {
		throw new Error("The default layer is missing");
	};
	var result;
	// NON OPTIMIZED VERSION FOR STATE BASED LAYER ACTIVATION
	if (obj) {
		result = composeLayers(Global.LayerStack, Global.LayerStack.length - 1, obj);
	} else {
		var current = Global.LayerStack.last();
		if (!current.composition) {
			current.composition = composeLayers(Global.LayerStack, Global.LayerStack.length - 1);
		} 
		result = current.composition
	}
	// return result

	// NON OPTIMIZED VERSION FOR LAYER SELECTION	
	return result.select(function(ea) {
		return ea && (!ea.selectAfterComposition || ea.selectAfterComposition(obj, result))
	})	
};


// clear cached layer compositions
var invalidateLayerComposition = function Layers$invalidateLayerComposition() {
	Global.LayerStack.each(function(ea) {
		ea.composition = null;
	});
};

Global.resetLayerStack = function() {
	Global.LayerStack = [{isStatic: true, toString: function() {return "BaseLayer"}, composition: null}];
	invalidateLayerComposition();
};


// can be replaced with basic objects
Object.subclass("Layer", {
	
	initialize: function(name) {
		this.name = name;
	},
	
	getName: function() {
		return this.name;
	},
	
	toString: function() {
		return this.name;
	},	
	
	toLiteral: function() {
		if (!this.name)
			console.warn("Layer: Can not serialize without a name!")
		return {
			name: this.name,
		};
	},
});


Object.extend(Layer, {
	fromLiteral: function(literal) {
		// console.log("Deserializing Layer Activation from: " + literal.name)
		return createLayer(literal.name, false)
	}
});


/** ContextJS API **/

/* Layer Definition */

// creates a named global layer
Global.createLayer = function(name, silent) {
	if (Global[name]) {
		if (!silent)
			console.log("Layer "+ name + " is already there");
		return Global[name];
	};
	var layer = new Layer(name);
	Global[name] = layer;
	return layer
};

// Layering objects may be a garbage collection problem, because the layers keep strong reference to the objects
Global.layerObject = function(layer, object, defs) {
	// log("layerObject");
	Object.keys(defs).each(function(function_name) {
		// log(" layer property: " + function_name);
		layerProperty(layer, object, function_name, defs);
	});
};

// layer around only the class methods
Global.layerClass = function(layer, classObject, defs) {
	layerObject(layer, classObject.prototype, defs);
};

// layer around class methods and all subclass methods
// (might be related to Aspect oriented programming)
Global.layerClassAndSubclasses = function(layer, classObject, defs) {
	// log("layerClassAndSubclasses");
	layerClass(layer, classObject, defs);
	
	// and now wrap all overriden methods...
	classObject.allSubclasses().each(function(eaClass) {
		// log("make m1 layer aware in " + eaClass)
		var obj = eaClass.prototype;
		Object.keys(defs).each(function(eaFunctionName) {
			if (obj.hasOwnProperty(eaFunctionName)) {
				if (obj[eaFunctionName] instanceof Function) {
					ContextJS.makeFunctionLayerAware(obj, eaFunctionName)
				} else {
					// to be tested...
					// makePropertyLayerAware(eaClass.prototype, m1)
				}
			};
		});
	})
};

/* Layer Activation */

Global.withLayers = function withLayers(layers, func) {
	LayerStack.push({withLayers: layers});
	// console.log("callee: " + withLayers.caller)
	try {
		func();
	} finally {
		LayerStack.pop();
	}
};

Global.withoutLayers = function withoutLayers(layers, func) {
	LayerStack.push({withoutLayers: layers});
	try {
		func();
	} finally {
		LayerStack.pop();
	}
};

/* Global Layer Activation */


Global.enableLayer = function(layer) {
	if (GlobalLayers.include(layer))
		return;
	else {
		GlobalLayers.push(layer);
		invalidateLayerComposition();
	};
};

Global.disableLayer = function(layer) {
	if (!GlobalLayers.include(layer))
		return;
	else {
		GlobalLayers = GlobalLayers.reject(function(ea) { return ea == layer;});
		invalidateLayerComposition();
	}
};

/* Example implementation of a layerable object */

// encode layers as strings for serialization...
var layerToStrings = function Laysers$layerToStrings(layers) {
	if (layers) {
		return layers.collect(function(ea) {return ea.getName()}) 
	};
};

var stringsToLayer = function Layers$stringsToLayer(strings) {
	if (strings) {
		return strings.collect(function(ea) {return Global[ea]}) 
	};
};


LayerableObjectTrait = {
	
	setWithLayers: function(layers) {
		this.withLayers = layers
		//this._withLayers = layerToStrings(layers);
	},

	setWithoutLayers: function(layers) {
		this.withoutLayers = layers
		//this._withoutLayers = layerToStrings(layers);;
	},
	
	getWithLayers: function(layers) {
		if (this.withLayers) {
			return this.withLayers
		};
		// if (this._withLayers) {
		//	return stringsToLayer(this._withLayers)
		//};
		return [];
	},

	getWithoutLayers: function(layers) {
		if (this.withoutLayers) {
			return this.withoutLayers
		};
		//if (this._withoutLayers) {
		//	return stringsToLayer(this._withoutLayers)
		//};
		return [];
	},


	// FLAG: REWRITE for performance...
	getActivatedLayers: function LayerableObjectTrait$getActivatedLayers(optCallerList) {
		var layers = this.getWithLayers();
		var withoutLayers  = this.getWithoutLayers();		
		var self= this;
		var optCallerList = optCallerList || [];
		if (optCallerList.include(this)) {
			// How should we deal with cycles?
			throw new Error("cycle in getActivatedLayers")
		};
		optCallerList.push(this);
		this.lookupLayersIn.each(function Layers$getActivatedLayers$lookupLayersIn(ea){
			if (self[ea] && self[ea].getActivatedLayers) {
				var parentLayers = self[ea].getActivatedLayers(optCallerList).reject(
					function(ea){return layers.include(ea)});
				layers = layers.concat(parentLayers);
				layers = layers.reject(function(ea){return withoutLayers.include(ea)}); 
			};
		});
		return layers;
	},

	// less generic, support only "owner" relationship
	// getActivatedLayers: function LayerableObjectTrait$getActivatedLayers() {
	// 	var layers = this.getWithLayers();
	// 	var withoutLayers  = this.getWithoutLayers();		
	// 	var self= this;
	// 	if (this.owner) {
	// 		var parentLayers = self.owner.getActivatedLayers().reject(function(ea){return layers.include(ea)});
	// 		layers = layers.concat(parentLayers);
	// 		layers = layers.reject(function(ea){return withoutLayers.include(ea)})
	// 	};
	// 	return layers;
	// },

	
	// Experiment with both directions to find a good solution
	// activateLayersOn: [],   // forward  // DEPRICATED, but may be usable for generating events
	
	lookupLayersIn: [], // backward  
	
	// propagateLayers: function(property, action, layers) {
	// 	if(!this[property]) { 
	// 		return;
	// 	};
	// 	
	// 	if(this[property][action]) {
	// 		this[property][action](layers);
	// 	} else if(this[property] instanceof Array) {
	// 		// iterate over collection if property is a collection
	// 		this[property].each(function(ea) {
	// 			if(ea && ea[action]) {
	// 				ea[action](layers);
	// 			}
	// 		})
	// 	}
	// },
	
	// activateLayers: function(layers) { 
	// 	this.setWithLayers(layers);
	// 	var self = this;
	// 	this.activateLayersOn.each(function(ea) {
	// 		self.propagateLayers(ea, "activateLayers", layers);
	// 	});
	// },
	// 
	// deactivateLayers: function(layers) {
	// 	// layers is not used at the moment
	// 	this.setWithLayers(undefined);
	// 	var self = this;
	// 	this.activateLayersOn.each(function(ea) { 
	// 		self.propagateLayers(ea, "deactivateLayers", layers);
	// 	});
	// },
	
};

Object.subclass("LayerableObject");
Object.extend(LayerableObject.prototype, LayerableObjectTrait) // I don't know why .prototype is neccessary here

// Static Initialize
GlobalLayers = [];
resetLayerStack();

});
console.log("loaded Layers.js");