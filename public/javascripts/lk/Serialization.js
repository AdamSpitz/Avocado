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

Object.subclass('Serializer', {

    STORED_TYPE: "__stored_type__",
    initialize: function() {
	this.serialMap = new Hash(); 
	this.count = 0;
    },
    
    get: function(object) {
	var value = this.serialMap.get(object);
	if (value)
	    return value.valueOf();
	else
	    return null;
    },

    add: function(object) {
	var serial = this.get(object);
	if (serial) 
    	    return serial;
	this.count ++;
	serial =  this.count;
	// console.log('registering ' + object + ' at ' + serial);
	this.serialMap.set(object, serial);
	return serial;
    },
    
    toJSONProp: function(value, name) {
	if (value instanceof Object)
	    value = value.valueOf(); // convert to primitive if possible
	if (name == 'constructor') // special case, it should't be there
	    return;
	
	var type = typeof value;
	switch (type) {
	case "function":
	    return;
	case "object": {
	    var ref = this.get(value);
	    if (ref) {
		return { ref: ref};
		// console.log('ref of ' + name + ' is '  + ref  + ', entry ' + entry.toJSONString());
	    } else if (value) {
	    	if (value.writeReplace) {
		    return this.toJSONObject(value.writeReplace());
	    	} else {
		    return this.toJSONObject(value);
	    	}
	    } else if (value && value.constructor) {
	    	console.log('cannot handle with object of type ' + value.constructor.name);
	    }
	}
	    break;
	case "undefined":
	    console.log("weird, name " + name + " has undefined value");
	    return;
	default:
    	    var entry = {};
	    entry[type] = value;
	    return entry;
	}
    },

    
    toJSONObject: function(obj, debug) {
	debug && console.log('calling toJSON on ' + obj);
	if (obj == null)
	    return null;

	switch (typeof obj) {
    	case 'string':
    	case 'number':
    	case 'boolean':
	    debug && console.log('shortcut on ' + obj);
	    return obj;
	}
	
	var myserial = this.get(obj);
	if (myserial)
	    return { ref: myserial };
	
	
	if (!obj.constructor) {
	    // pure java object ...
	    console.log("weird, no constructor");
	    return {ref: this.add(obj), "type": "Object"};
	}
	
	var ref = this.add(obj);
	var ser = {};
	
	if (obj instanceof Array) {
    	    var slots = [];
	    for (var i = 0; i < obj.length; i++) {
		if (!obj[i]) {
		    console.log('weird: empty entry ' + i + " for " + obj);
		    //				continue;
		}
	    	var entry = this.toJSONProp(obj[i]);
	    	// console.log(' array element ' + obj[i] + ' entry ' + entry);
	    	if (entry)
		    slots.push(entry);
	    }
	    if (slots.length > 0)
		ser.slots = slots;
	} else {
    	    var slots = {};
	    for (var name in obj) {
		if (name == this.STORED_TYPE)
		    continue;
		if (obj.isTransient && obj.isTransient(name))
		    continue;
	    	var entry = this.toJSONProp(obj[name]);
	    	if (entry)
		    slots[name] = entry;
	    }
	    if (obj.hiddenProperties) {
		var props = obj.hiddenProperties();
		for (var i = 0; i < props.length; i++) {
		    var name = props[i];
		    if (!obj[name]) // didn't care to declare the property
			continue;
		    var entry = this.toJSONProp(obj[name]);
	    	    if (entry)
			slots[name] = entry;
		    else
			console.log('no entry for prop ' + name);
		}
	    }
	    ser.slots = slots;
	}
	// assigned last, gets printed first ...
	ser.ref = ref;
	if (obj[this.STORED_TYPE]) {
    	    ser['type'] = obj[this.STORED_TYPE];
	} else {
    	    ser['type'] = obj.constructor.name;
	}
	return ser;
    }
    
});


Object.subclass('RemoteRef', {
    initialize: function(id) {
	this.id = id;
    },

    toString: function() {
	return "RemoteRef(" + this.id + ")";
    },

    writeExternal: function(ser) {
	return { id: this.id };
    },

    readExternal: function(deser, data) {
	//console.log('RemoteRef got data ' + data + "(" + (data || null).toJSONString() + ")");
	return new RemoteRef(data.slots.id.string);
    }
});


Object.subclass('Deserializer', {
    initialize: function() {
	this.serialMap = new Hash();
	//if (realClasses != false)
    	//this.setPrototype = true;
    }
    get: function(serial) {
	return this.serialMap.get(serial);
    },
    
    put: function(serial, object) {
	this.serialMap.set(serial, object);
	return serial;
    },
    
    extractValue: function(slot, debug) {
	var value = null;
	if (slot.hasOwnProperty('number')) {
    	    // console.log('value is ' + slot.number.toString());
	    return slot.number;
	} else if (slot.string) {
	    return slot.string;
	} else if (slot.hasOwnProperty('boolean')) {
	    return slot['boolean'];
	} else if (slot['type']) {
    	    // check class first
	    return this.fromJSON(slot, debug);
	    // console.log('got slot value ' + value);
	} else if (slot.ref) {
	    return this.get(slot.ref.valueOf());
	    // console.log(' looked up ref ' + slot.ref.valueOf()); // + " to " + value);
	} 
	return null;
    },
    
    fromJSON: function(/* parsed json */ parsedJSON, debug) {
	if (!parsedJSON)
	    return null;
	
	if (debug && parsedJSON) 
    	    console.log('processing : ' + Object.toJSON(parsedJSON));
	
	switch (typeof parsedJSON) {
    	case 'number':
    	case 'string':
    	case 'boolean':
	    return parsedJSON;
	}
	
	var type = parsedJSON["type"];
	
	var ref;
	
	if (parsedJSON.ref) {
	    ref = parsedJSON.ref.valueOf();
	    if (this.get(ref)) {
	    	var result = this.get(ref);
	    	debug && console.log('retrieved def  ' + result + " with ref " + ref);
	    	return result;
	    }
	} else {
    	    throw new Error(parsedJSON + '(' + Object.toJSON(parsedJSON) + ') doesnt have a ref');
	}
	
	var object;
	if (type == "Array") {
	    object = [];
	    this.put(ref, object);
	    if (parsedJSON.slots) 
		for (var i = 0; i <  parsedJSON.slots.length; i++) {
		    object.push(this.extractValue(parsedJSON.slots[i], debug));	
		}
	} else if (type) {
	    object = {};
	    // FIXME: ensure no funny business in the value of 'type'
	    if (this.setPrototype) {
		var constr = eval(type.toString());
		// note: a Rhino extension
		object.__proto__ = constr.prototype;
		if (object.readExternal) {
		    // read the ref first, in case readExternal overwrites it
	    	    debug && console.log('calling ' + type + ' readExternal on ' + parsedJSON.toJSONString());
	    	    object = object.readExternal(this, parsedJSON);
		    this.put(ref, object);
	   	    return object;
		}
	    } else {
		// special marker to recreate type
		object[Serializer.STORED_TYPE] = type.toString();		
	    }
	    this.put(ref, object);
	    if (parsedJSON.slots) {
		for (var name in parsedJSON.slots) {
		    var slot = parsedJSON.slots[name];
		    if (typeof slot == 'function')
			continue;
		    object[name] = this.extractValue(slot, debug);
		    debug && console.log('set ' + name + ' to ' + object[name]  
					 + "(" + Object.toJSON(object[name]) + ")"); 
		}
	    } 
	} else {
	    console.log('not found type for ' + parsedJSON); // but that's OK, it may just be a forward ref
	}
	// warning: calling value.toString() may blow up!
    
	debug && console.log('put ref ' + ref.valueOf() + ' to ' + object.toJSONString() + ' class ' + type);
	return object;
    }

});
