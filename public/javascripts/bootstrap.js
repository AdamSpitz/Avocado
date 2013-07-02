window.bootstrapTheModuleSystem = function () {

// The bootstrap module is kind of a mess. Try to minimize it.

if (! window.hasOwnProperty('avocado')) { window.avocado = {}; }

Object.basicCreate = function(parent) {
  var constr = function BasicConstructor() {};
  constr.prototype = parent;
  return new constr();
};

Object.create = function(parent) {
  var anno = annotator.annotationOf(parent);
  var constr = anno.constructorForMakingChildrenOf(parent);
  return new constr();
};

if (typeof Object.newChildOf !== 'function') {
  Object.newChildOf = function(parent) {
    var child = Object.create(parent);
    if (child.initialize) {
      var args;
      if (typeof($A) !== 'undefined') {
        args = $A(arguments);
        args.shift();
      } else {
        args = [];
        for (var i = 1, n = arguments.length; i < n; ++i) { args.push(arguments[i]); }
      }
      child.initialize.apply(child, args);
    }
    return child;
  };
}

if (typeof Object.shallowCopy !== 'function') {
  Object.shallowCopy = function(o) {
    var c = Object.create(o['__proto__']);
    if (typeof(o.hasOwnProperty) !== 'function') { throw new Error("Cannot shallowCopy this object because it has no hasOwnProperty function."); }
    for (var property in o) {
      if (o.hasOwnProperty(property) && property !== '__annotation__') {
        c[property] = o[property];
      }
    }
    return c;
  };
}

Object.inheritsFrom = function(ancestor, child) {
  // Does JS have a built-in way to check this? Similar to instanceof, but for checking the
  // prototype chain directly rather than assuming we have access to the constructor object?
  var p = child;
  while (p) {
    if (p === ancestor) { return true; }
    p = p['__proto__'];
  }
  return false;
};


// Gotta overwrite Prototype's Object.extend, or bad things happen with annotations.
Object.extend = function extend(destination, source) {
  for (var property in source) {
    if (property !== '__annotation__') {
      destination[property] = source[property];
    }
  }
  return destination;
};


Object.extendWithJustDirectPropertiesOf = function extendWithJustDirectPropertiesOf(destination, source) {
  if (typeof(source.hasOwnProperty) !== 'function') { throw new Error("extendWithJustDirectPropertiesOf: source has no hasOwnProperty function"); }
  for (var property in source) {
    if (source.hasOwnProperty(property) && property !== '__annotation__') {
      destination[property] = source[property];
    }
  }
  return destination;
};


var annotator = {
  objectAnnotationPrototype: {
    _slotAnnoPrefix: 'anno_',
    
    annotationNameForSlotNamed: function(name) {
      // can't just use the name because it leads to conflicts with stuff inherited from Object.prototype
      return this._slotAnnoPrefix + name;
    },

    asSlotAnnotation: function(slotAnno, slotName) {
      if (slotAnno['__proto__'] !== avocado.annotator.slotAnnotationPrototype) {
        slotAnno = Object.extendWithJustDirectPropertiesOf(Object.create(avocado.annotator.slotAnnotationPrototype), slotAnno);

        var catParts = slotAnno.category;
        if (catParts) {
          delete slotAnno.category;
          this.setCategoryPartsForSlotNamed(slotName, catParts, slotAnno);
        }
      }

      return slotAnno;
    },

    existingSlotAnnotation: function(name) {
      return this[this.annotationNameForSlotNamed(name)];
    },
    
    eachSlotAnnotation: function(f) {
      var prefixLength = this._slotAnnoPrefix.length;
      for (var n in this) {
        if (this.hasOwnProperty(n)) {
          var slotName = n.substr(prefixLength);
          if (n.substr(0, prefixLength) === this._slotAnnoPrefix) {
            f(n.substr(prefixLength), this[n]);
          }
        }
      }
    },

    setSlotAnnotation: function(name, slotAnno) {
      if (slotAnno) {
        var realSlotAnno = this.asSlotAnnotation(slotAnno, name);
        this[this.annotationNameForSlotNamed(name)] = realSlotAnno;
        return realSlotAnno;
      } else {
        this.removeSlotAnnotation(name);
        return undefined;
      }
    },

    slotAnnotation: function(name) {
      return this.existingSlotAnnotation(name) || this.setSlotAnnotation(name, {});
    },

    removeSlotAnnotation: function(name) {
      delete this[this.annotationNameForSlotNamed(name)];
    },
    
    getComment: function() {
      return this.comment;
    },
    
    setComment: function(c) {
      this.comment = c;
    },

    constructorTemplate: "(function() { return function CONSTRUCTOR_FUNCTION() {}; })()",

    constructorForMakingChildrenOf: function(parent, explicitlySpecifiedName) {
      return this.constructorForMakingChildrenOfMyObject || this.createConstructorForMakingChildrenOf(parent, explicitlySpecifiedName);
    },

    createConstructorForMakingChildrenOf: function(parent, explicitlySpecifiedName) {
      var name;
      if (explicitlySpecifiedName) {
        name = explicitlySpecifiedName;
      } else {
        var cs = this.explicitlySpecifiedCreatorSlot();
        if (cs) { name = cs.name; }
        if (!name || name === '__proto__') { name = 'something'; }
      }
      var constr = eval(this.constructorTemplate.replace(/CONSTRUCTOR_FUNCTION/g, name));
      constr.prototype = parent;
      this.constructorForMakingChildrenOfMyObject = constr;
      return constr;
    },
    
    isRedundant: function (objectThatIAnnotate) {
      for (var p in this) {
        if (this.hasOwnProperty(p)){
          if (p !== 'creatorSlot') { return false; }
          var cs = this.creatorSlot;
          var implicitCS = avocado.annotator.creatorSlotDeterminableFromTheObjectItself(objectThatIAnnotate);
          if (! implicitCS) { return false; }
          if (cs.name !== implicitCS.name || cs.holder !== implicitCS.holder) { return false; }
        }
      }
      return true;
    },
    
    deleteIfRedundant: function (objectThatIAnnotate) {
      if (objectThatIAnnotate.__annotation__ === this && this.isRedundant(objectThatIAnnotate)) {
        delete objectThatIAnnotate.__annotation__;
      }
    },
    
    explicitlySpecifiedCreatorSlot: function () {
      return this.hasOwnProperty('creatorSlot') ? this.creatorSlot : null;
    },
    
    setCreatorSlot: function(name, holder) {
      if (name !== undefined && holder !== undefined) {
        this.creatorSlot = Object.newChildOf(avocado.annotator.slotSpecifierPrototype, name, holder);
      } else {
        delete this.creatorSlot;
      }
      
      delete this.constructorForMakingChildrenOfMyObject; // name has changed, so make a new constructor
      
      // delete this.possibleCreatorSlots; // don't need these anymore // aaa - no, I disagree now, leave them there so people can easily change it back -- Adam, Oct. 2010
    },

    addPossibleCreatorSlot: function(name, holder) {
      // if (this.explicitlySpecifiedCreatorSlot()) { return; } // no point // aaa - no, I disagree now, leave them there so people can easily change it back -- Adam, Oct. 2010
      
      var cs = Object.newChildOf(avocado.annotator.slotSpecifierPrototype, name, holder);
      
      // optimization: don't bother creating an array until we have more than one
      if (! this.possibleCreatorSlots) {
        this.possibleCreatorSlots = cs;
      } else {
        var slots = this.possibleCreatorSlots = this.arrayOfPossibleCreatorSlots();

        // Don't add duplicates.
        // aaa - Quadratic, blecch. Use a hash table? but hash_table.js isn't loaded yet. Oh, well - might not matter if I keep the list small.
        for (var i = 0, n = slots.length; i < n; ++i) {
          var s = slots[i];
          if (name === s.name && holder === s.holder) { return; }
        }

        slots.push(cs);
      }
    },

    numberOfPossibleCreatorSlots: function () {
      var ss = this.possibleCreatorSlots;
      if (!ss) { return 0; }
      if (! (ss instanceof Array)) { return 1; }
      return ss.length;
    },
  
    onlyPossibleCreatorSlot: function () {
      var ss = this.possibleCreatorSlots;
      if (!ss) { return null; }
      if (! (ss instanceof Array)) { return ss; }
      return ss && ss.length === 1 ? ss[0] : null;
    },

    theCreatorSlot: function () {
      // aaa - I think I should just make this call probableCreatorSlot
      return this.explicitlySpecifiedCreatorSlot() || this.onlyPossibleCreatorSlot();
    },

    probableCreatorSlot: function () {
      var cs = this.explicitlySpecifiedCreatorSlot();
      if (cs) { return cs; }
      var count = this.numberOfPossibleCreatorSlots();
      if (count === 0) { return null;     }
      if (count === 1) { return this.onlyPossibleCreatorSlot(); }
      var slots = this.arrayOfPossibleCreatorSlots();
      var shortest = null;
      var shortestLength;
      for (var i = 0, n = slots.length; i < n; ++i) {
        var s = slots[i];
        var sLength = avocado.annotator.creatorChainLength(s.holder);
        if (typeof(sLength) === 'number') {
          if (!shortest || sLength < shortestLength) {
            // This one's shorter, so probably better; use it instead.
            shortest = s;
            shortestLength = sLength;
          }
        }
      }
      return shortest;
    },
    
    arrayOfPossibleCreatorSlots: function () {
      var ss = this.possibleCreatorSlots;
      if (!ss) { return []; }
      if (! (ss instanceof Array)) { return [ss]; }
      return ss;
    },
    
    copyDownSlotsFromAllCopyDownParents: function(obj) {
      if (this.copyDownParents) {
        for (var i = 0, n = this.copyDownParents.length; i < n; i += 1) {
          var cdp = this.copyDownParents[i];
          if (typeof(cdp.parent) === 'undefined') {
            throw new Error("Each element of the array must contain a 'parent' slot pointing to the desired copy-down parent; e.g. [{parent: Enumerable}]");
          }
          this.copyDownSlots(obj, cdp.parent, cdp.slotsToOmit);
        }
      }
    },
    
    copyDownSlots: function(dst, src, rawSlotsToOmit) {
      var slotsToOmit = annotator.adjustSlotsToOmit(rawSlotsToOmit);
      for (var name in src) {
        if (src.hasOwnProperty(name)) {
          if (! slotsToOmit.include(name)) {
            dst[name] = src[name];
            
            // Copy down the category (and maybe other stuff?).
            var srcAnno = avocado.annotator.existingAnnotationOf(src);
            if (srcAnno) {
              var srcSlotAnno = srcAnno.existingSlotAnnotation(name);
              if (srcSlotAnno && srcSlotAnno.categoryParts()) {
                var dstSlotAnno = this.setSlotAnnotation(name, {});
                this.setCategoryPartsForSlotNamed(name, srcSlotAnno.categoryParts(), dstSlotAnno);
        	      // aaa - Make sure the JSQuiche server gets updated?
        	      // Do we store each slot's category separately, or store
        	      // the fact that there's a copy-down parent?
              }
            }
          }
        }
      }
    },
    
    getCategoryCache: function(catParts) {
      var c = this.categoryCache;
      if (!c) { c = this.categoryCache = Object.newChildOf(avocado.annotator.categoryCachePrototype); }
      if (catParts) {
        for (var i = 0, n = catParts.length; i < n; ++i) {
          c = c.getOrCreateSubcategory(catParts[i]);
        }
      }
      return c;
    },
    
    setCategoryPartsForSlotNamed: function(slotName, catParts, alreadyGotTheSlotAnno) {
      var slotAnno = alreadyGotTheSlotAnno || this.slotAnnotation(slotName); // just an optimization, allow it to be passed in if the caller already has it
      
      var oldCatCache = slotAnno.category;
      if (oldCatCache) { oldCatCache.removeSlotName(slotName); }
      
      if (catParts) {
        // Sometimes we screw up when hacking on the text files and accidentally write a category as
        // a string instead of an array of strings.
        if (! (catParts instanceof Array)) { catParts = [catParts]; }
        
        var c = this.getCategoryCache(catParts);
        slotAnno.category = c;
        c.addSlotName(slotName);
      } else {
        delete slotAnno.category;
      }
    },

    categorize: function(catParts, slotNames) {
      // Just a shortcut to let us categorize a bunch of slots at a time.
      for (var i = 0, n = slotNames.length; i < n; ++i) {
	      var slotName = slotNames[i];
	      this.setCategoryPartsForSlotNamed(slotName, catParts);
      }
    },
  
    asRawDataObject: function () {
      var raw = {};
      if (this.comment        ) { raw.comment         = this.comment;         }
      if (this.copyDownParents) { raw.copyDownParents = this.copyDownParents; }
      return raw;
    },

    copy: function () {
      var c = avocado.annotator.asObjectAnnotation(this.asRawDataObject());
      this.eachSlotAnnotation(function(slotName, slotAnno) {
        c.setSlotAnnotation(slotName, slotAnno.asRawDataObject());
      });
      return c;
    }
  },

  slotSpecifierPrototype: {
    initialize: function(name, holder) {
      this.name = name;
      this.holder = holder;
    },
    
    contentsObject: function() {
      return this.holder[this.name];
    }
  },

  slotAnnotationPrototype: {
    categoryParts: function() {
      var c = this.category;
      if (!c) { return null; }
      return c.parts();
    },
    
    getModuleAssignedToMeExplicitly: function() {
      return this.module;
    },
    
    setModule: function(m) {
      this.module = m;
    },
    
    forgetModule: function() {
      delete this.module;
    },
    
    getComment: function() {
      return this.comment;
    },
    
    setComment: function(c) {
      this.comment = c;
    },
    
    initializationExpression: function() {
      return this.initializeTo;
    },
    
    setInitializationExpression: function(e) {
      this.initializeTo = e;
    },
    
    equals: function(other) {
      for (var n in this) {
        if (this.hasOwnProperty(n)) {
          if (this[n] !== other[n]) { return false; }
        }
      }
      return true;
    },
    
    hashCode: function () {
      var catParts = this.categoryParts();
      return catParts ? catParts.join(',') : 'no category';
    },

    asRawDataObject: function () {
      var raw = {};
      var catParts = this.categoryParts();
      if (catParts          && catParts.length > 0) { raw.category     = catParts;                        }
      if (this.comment                            ) { raw.comment      = this.getComment();               }
      if (this.initializeTo                       ) { raw.initializeTo = this.initializationExpression(); }
      return raw;
    }
  },
  
  categoryCachePrototype: {
    initialize: function(n, supercat) {
      
      // The OLD way of doing categories was that they were just in each slot annotation. This
      // had two problems:
      //   - A category didn't really "exist" until it had at least one slot in it. Which was
      //     annoying, because the natural way of creating categories in the UI is for the user
      //     to say "add category" and *then* add slots to it, so the category would kinda be
      //     in this weird limbo until the slot was actually added. It was awkward to hack the
      //     UI to make it remember to keep the newly-created category around.
      //   - It was slow for really big objects (like "window"), because to find the contents
      //     of a category, the UI would have to search through every slot in the object.
      //
      // So now, an object annotation keeps these "category cache" objects around (in addition
      // to having them in the slot annotations). The category's cache remembers which slots
      // are in the category.
      // 
      // Unfortunately, there's no way to catch the creation of new slots by code like "obj.x = 3",
      // so we can't guarantee that this data structure will be up to date. That's why we think
      // of it as a cache rather than a guaranteed-up-to-date parallel data structure. And I
      // think that when doing an update, we just replace the whole structure, which means that
      // we can't have the slots keep pointers to their category caches... which is fine, this
      // isn't meant to solve that problem.
      //
      // For now, I think the mirror morph's refreshContent method refreshes this cache
      // whenever it runs (so once every 8 seconds, or whatever it is). But maybe it'd make
      // sense to keep a timestamp and check it whenever someone accesses the cache, so that
      // it'll still keep getting updated even if there's no mirror morph on the screen.
      
      
      this._lastPart = n;
      this._supercategory = supercat;
    },
    
    parts: function() {
      var ps = [];
      var c = this;
      while (c && typeof(c._lastPart) !== 'undefined') {
        ps.unshift(c._lastPart);
        c = c._supercategory;
      }
      return ps;
    },
    
    subcategories: function() {
      if (! this._subcategories) { this._subcategories = {}; }
      return this._subcategories;
    },
    
    getOrCreateSubcategory: function(name) {
      var subcats = this.subcategories();
      var c = subcats[name];
      if (!c) {
        c = subcats[name] = Object.newChildOf(avocado.annotator.categoryCachePrototype, name, this);
      }
      return c;
    },
    
    removeSubcategory: function(name) {
      if (! this._subcategories) { return; }
      delete this._subcategories[name];
    },
    
    removeMe: function() {
      if (! this._supercategory) { return; }
      this._supercategory.removeSubcategory(this._lastPart);
    },
    
    eachSubcategoryName: function(f) {
      for (var name in this._subcategories) {
        if (this._subcategories.hasOwnProperty(name)) {
          f(name);
        }
      }
    },
    
    addSlotName: function(name) {
      if (! this._slotNames) { this._slotNames = {}; }
      this._slotNames[name] = true;
    },
    
    removeSlotName: function(name) {
      if (! this._slotNames) { return; }
      delete this._slotNames[name];
    },
    
    eachSlotName: function(f) {
      for (var name in this._slotNames) {
        if (this._slotNames.hasOwnProperty(name)) {
          f(name);
        }
      }
    }
  },

  _nextOID: 0,

  oidOf: function(o) {
    // aaa - We're not gonna be able to transport identityDictionaries (because we're not
    // actually saving the OID, we're recreating it each time we load the object into the image).
    // Not a problem for now, but keep it in mind.
    var a = this.annotationOf(o);
    if (a.hasOwnProperty('oid')) { return a.oid; }
    return a.oid = this._nextOID++;
  },

  annotationOf: function(o) {
    var a = this.existingAnnotationOf(o);
    if (a !== null) { return a; }
    a = this.newObjectAnnotation(o);
    o.__annotation__ = a;
    return a;
  },

  existingAnnotationOf: function(o) {
    var a = this.actualExistingAnnotationOf(o);
    if (a) { return a; }
    
    // If there's an implicit creator slot, gotta treat the annotation as if it already exists.
    // aaa - Though we should optimize that in the mirror code that asks for a creator slot - can
    // just return the creator slot straight, without creating this annotation object. Though
    // with decent GC this might not matter. Don't worry about it yet.
    var cs = this.creatorSlotDeterminableFromTheObjectItself(o);
    if (cs) {
      return o.__annotation__ = this.newObjectAnnotation(o);
    }
    
    return null;
  },

  actualExistingAnnotationOf: function(o) {
    if (typeof(o.hasOwnProperty) === 'function' && o.hasOwnProperty('__annotation__')) { return o.__annotation__; }
    
    // HACK: In JavaScript, adding attributes to Object.prototype and stuff like that
    // is a bad idea, because people use for..in loops to enumerate their attributes.
    // So we'll keep a special array to hold their annotations.
    if (o === Object.prototype || o === Array.prototype) { return this.specialAnnotationOf(o); }
    
    return null;
  },

  _annotationsForObjectsThatShouldNotHaveAttributesAddedToThem: [],

  specialAnnotationOf: function(o) {
    var specialAnnoRecords = this._annotationsForObjectsThatShouldNotHaveAttributesAddedToThem;
    for (var i = 0, n = specialAnnoRecords.length; i < n; ++i) {
      var r = specialAnnoRecords[i];
      if (r.object === o) { return r.annotation; }
    }
    
    var a = this.newObjectAnnotation(o);
    specialAnnoRecords.push({object: o, annotation: a});
    return a;
  },

  newObjectAnnotation: function(o) {
    var a = Object.create(this.objectAnnotationPrototype);
    
    // Small hack to enable an optimization.
    var cs = this.creatorSlotDeterminableFromTheObjectItself(o);
    if (cs) { a.creatorSlot = cs; }
    
    return a;
  },

  asObjectAnnotation: function(anno) {
    // aaa - In browsers that don't allow you to set __proto__, create a new
    // object and copy over the slots.
    // aaa - OK, try it that way, not just for browsers that can't set __proto__,
    // but because using Object.create makes Chrome memory profiles show up nicer.
    // anno['__proto__'] = this.objectAnnotationPrototype;
    // return anno;
    if (anno['__proto__'] === this.objectAnnotationPrototype) { return anno; }
    return Object.extendWithJustDirectPropertiesOf(Object.create(this.objectAnnotationPrototype), anno);
  },

  loadObjectAnnotation: function(o, rawAnno, creatorSlotName, creatorSlotHolder) {
    var a;
    
    if (creatorSlotName && creatorSlotHolder) {
      var implicitCS = this.creatorSlotDeterminableFromTheObjectItself(o);
      if (!a && implicitCS && implicitCS.name === creatorSlotName && implicitCS.holder === creatorSlotHolder) {
        // no need to create the annotation just for this
      } else {
        a = a || annotator.annotationOf(o);
        a.setCreatorSlot(creatorSlotName, creatorSlotHolder);
      }
    }
    
    if (rawAnno) {
      for (var property in rawAnno) {
        if (rawAnno.hasOwnProperty(property) && property !== '__annotation__') {
          a = a || annotator.annotationOf(o);
          a[property] = rawAnno[property];
        }
      }

      a = a || annotator.actualExistingAnnotationOf(o);
      if (a) {
        a.copyDownSlotsFromAllCopyDownParents(o);
      }
    }
    
    return a;
  },

  existingSlotAnnotation: function(holder, name) {
    var anno = this.existingAnnotationOf(holder);
    if (!anno) { return null; }
    return anno.existingSlotAnnotation(name);
  },
  
  moduleOfAnyCreatorInChainFor: function(o) {
    var p = o;
    while (true) {
      var cs = this.theCreatorSlotOf(p);
      if (!cs) { return null; }
      var slotAnno = this.existingSlotAnnotation(cs.holder, cs.name);
      if (slotAnno) {
        var m = slotAnno.getModuleAssignedToMeExplicitly();
        if (m) { return m; }
      }
      p = cs.holder;
    }
  },
  
  getModuleAssignedExplicitlyOrImplicitlyTo: function(slotAnno, holder) {
    return (slotAnno && slotAnno.getModuleAssignedToMeExplicitly()) || this.moduleOfAnyCreatorInChainFor(holder);
  },
  
  setModuleIfNecessary: function(holder, slotName, desiredModule) {
    var implicitModule = this.moduleOfAnyCreatorInChainFor(holder);
    if ((implicitModule || null) === (desiredModule || null)) {
      // Optimization: Avoid creating the slot annotation if it's not necessary.
      var holderAnno = this.existingAnnotationOf(holder);
      var slotAnno = holderAnno && holderAnno.existingSlotAnnotation(slotName);
      if (slotAnno) { slotAnno.forgetModule(); }
    } else {
      this.annotationOf(holder).slotAnnotation(slotName).setModule(desiredModule);
      if (desiredModule) { desiredModule.slotCollection().add(holder, slotName); }
      
      var shouldLogModules = false;
      if (shouldLogModules) {
        var chain = this.creatorSlotChainOf(holder);
        chain.push(slotName);
        console.log("Setting module of " + chain.join(".") + " to " + desiredModule._name);
      }
    }
  },
  
  isEmptyObject: function(o) {
    if (typeof(o) !== 'object') { return false; }
    try { // workaround for Firefox problem
      if (o['__proto__'] !== Object.prototype) { return false; }
    } catch (ex) {
      return false;
    }
    if (typeof(o.hasOwnProperty) !== 'function') { return false; }
    for (var n in o) {
      if (o.hasOwnProperty(n)) {
        return false;
      }
    }
    return true;
  },

  LK_slotNamesAttachedToMethods: ['declaredClass', 'methodName', 'displayName', '_creatorSlotHolder'],
  LK_slotNamesUsedForMakingSuperWork: ['valueOf', 'toString', 'originalFunction'],
  
  isSimpleMethod: function(o) {
    if (typeof(o) !== 'function') { return false; }

    var hasSuper = o.argumentNames && o.argumentNames()[0] === '$super';

    if (typeof(o.hasOwnProperty) !== 'function') { return false; }
    for (var n in o) {
      if (o.hasOwnProperty(n) && n !== '__annotation__') {
        if (            this.LK_slotNamesAttachedToMethods.include(n)) { continue; }
        if (hasSuper && this.LK_slotNamesUsedForMakingSuperWork .include(n)) { continue; }
        if (n === 'prototype' && this.isEmptyObject(o[n])) { continue; }
        return false;
      }
    }
    return true;
  },
  
  isMagicSlotNameOnFunction: function(o, n) {
    if (typeof(o) !== 'function') { return false; }
    if (this.LK_slotNamesAttachedToMethods.include(n)) { return true; }
    var hasSuper = o.argumentNames && o.argumentNames().first() === '$super';
    if (hasSuper && this.LK_slotNamesUsedForMakingSuperWork.include(n)) { return true; }
    return false;
  },
  
  creatorSlotDeterminableFromTheObjectItself: function(o) {
    // Some very common kinds of objects have enough information in them to let us know the creator
    // slot without being explicitly told.
    
    // Functions already have a displayName (or should), and we can set _creatorSlotHolder ourselves.
    if (typeof(o) === 'function' && typeof(o.displayName) === 'string' && o._creatorSlotHolder) {
      return Object.newChildOf(avocado.annotator.slotSpecifierPrototype, o.displayName, o._creatorSlotHolder);
    }
    
    // Function (constructor) prototypes.
    if (this.isEmptyObject(o)) {
      var c = o.constructor;
      if (c && o === c.prototype) {
        return Object.newChildOf(avocado.annotator.slotSpecifierPrototype, 'prototype', c);
      }
    }
    
    return null;
  },

  theCreatorSlotOf: function(o) {
    if (!o) { return null; }
    var cs = this.creatorSlotDeterminableFromTheObjectItself(o);
    if (cs) { return cs; }
    var a = this.existingAnnotationOf(o);
    if (!a) { return null; }
    return a.probableCreatorSlot();
  },
  
  creatorSlotChainOf: function(o) {
    var chain = [];
    var h = o;
    while (true) {
      var cs = this.theCreatorSlotOf(h);
      if (! cs) { break; }
      chain.unshift(cs.name);
      h = cs.holder;
    }
    return chain;
  },

  creatorChainLength: function (o) {
    var len = 0;
    while (o !== window) {
      var anno = this.existingAnnotationOf(o);
      if (!anno) { return null; }
      var cs = anno.theCreatorSlot(); // aaa wrong - should be probableCreatorSlot, I think, but gotta avoid infinite loop
      if (!cs) { return null; }
      len += 1;
      o = cs.holder;
    }
    return len;
  },
  
  canonicalCategoryParts: [],
  
  canonicalizeCategoryParts: function(nonCanonical) {
    var len = nonCanonical.length;
    for (var i = 0, n = this.canonicalCategoryParts.length; i < n; ++i) {
      var canonical = this.canonicalCategoryParts[i];
      if (this.areCategoryPartsEqual(canonical, nonCanonical)) { return canonical; }
    }
    this.canonicalCategoryParts.push(nonCanonical);
    return nonCanonical;
  },
  
  areCategoryPartsEqual: function(catParts1, catParts2) {
    var len = catParts1.length;
    if (catParts2.length !== len) { return false; }
    for (var i = 0; i < len; ++i) {
      var p1 = catParts1[i];
      var p2 = catParts2[i];
      if (p1 !== p2) { return false; }
    }
    return true;
  },
  
  adjustSlotsToOmit: function(rawSlotsToOmit) {
    var slotsToOmit = rawSlotsToOmit || [];
    if (typeof slotsToOmit === 'string') {
      slotsToOmit = slotsToOmit.split(" ");
    }
    if (! slotsToOmit.include('__annotation__')) {
      slotsToOmit.push('__annotation__');
    }
    return slotsToOmit;
  }
};

avocado.annotator = annotator;

// Need to use basicCreate to create the annotations for the annotation prototypes; otherwise we get an infinite recursion.
annotator.objectAnnotationPrototype.__annotation__ = Object.basicCreate(annotator.objectAnnotationPrototype);

annotator.annotationOf(avocado).setCreatorSlot('avocado', window);
annotator.annotationOf(window).setSlotAnnotation('avocado', {category: ['avocado']});

annotator.annotationOf(avocado.annotator).setCreatorSlot('annotator', avocado);
annotator.annotationOf(avocado).setSlotAnnotation('annotator', {category: ['annotations']});
annotator.annotationOf(annotator.objectAnnotationPrototype).setCreatorSlot('objectAnnotationPrototype', annotator);
annotator.annotationOf(annotator.slotAnnotationPrototype).setCreatorSlot('slotAnnotationPrototype', annotator);
annotator.annotationOf(annotator.slotSpecifierPrototype).setCreatorSlot('slotSpecifierPrototype', annotator);
annotator.annotationOf(annotator.categoryCachePrototype).setCreatorSlot('categoryCachePrototype', annotator);

avocado.javascript = {};
annotator.annotationOf(avocado.javascript).setCreatorSlot('javascript', avocado);
annotator.annotationOf(avocado).setSlotAnnotation('javascript', {category: ['javascript']});

avocado.javascript.reservedWords = {'abstract': true, 'boolean': true, 'break': true, 'byte': true, 'case': true, 'catch': true, 'char': true, 'class': true, 'const': true, 'continue': true, 'debugger': true, 'default': true, 'delete': true, 'do': true, 'double': true, 'else': true, 'enum': true, 'export': true, 'extends': true, 'false': true, 'final': true, 'finally': true, 'float': true, 'for': true, 'function': true, 'goto': true, 'if': true, 'implements': true, 'import': true, 'in': true, 'instanceof': true, 'int': true, 'interface': true, 'long': true, 'native': true, 'new': true, 'null': true, 'package': true, 'private': true, 'protected': true, 'public': true, 'return': true, 'short': true, 'static': true, 'super': true, 'switch': true, 'synchronized': true, 'this': true, 'throw': true, 'throws': true, 'transient': true, 'true': true, 'try': true, 'typeof': true, 'var': true, 'volatile': true, 'void': true, 'while': true, 'with': true};

// aaa - Copied from Base.js. Just a hack to make $super work. Not really sure
// what the right solution is in the long run - how do we make this work with
// both prototype-style inheritance and class-style inheritance?
avocado.makeSuperWork = function(holder, property, contents) {
  var value = contents;
  var hasSuperArgument = typeof(value) === 'function' && value.argumentNames && value.argumentNames()[0] === "$super";
  if (hasSuperArgument) {
    var superclass = holder.constructor && this === holder.constructor.prototype && holder.constructor.superclass;
    var ancestor = superclass ? superclass.prototype : holder['__proto__']; // using [] to fool JSLint
    if (ancestor) {
      (function() { // wrapped in a method to save the value of 'method' for advice
        var method = value;
        var advice = (function(m) {
          return function callSuper() {
            return ancestor[m].apply(this, arguments);
          };
        })(property);
        advice.methodName = "$super:" + (superclass ? superclass.type + "." : "") + property;

        value = advice.wrap(method);
        value.valueOf = function() { return method; };
        value.toString = function() { return method.toString(); };
        value.originalFunction = method;
      })();
    } else {
      throw new Error("cannot makeSuperWork, there is no ancestor");
    }
  } else {
    // fine, nothing to do
  }
  return value;
};
annotator.annotationOf(avocado.makeSuperWork).setCreatorSlot('makeSuperWork', avocado);
annotator.annotationOf(avocado).setSlotAnnotation('makeSuperWork', {category: ['inheritance']});

// Seems like Chrome doesn't actually enumerate the "prototype" slot.
// This is just a simple test to see.
(function() {
  function SomeConstructor() {}
  SomeConstructor.prototype.someAttribute = 42;
  avocado.javascript.prototypeAttributeIsEnumerable = false;
  for (var name in SomeConstructor) {
    if (SomeConstructor.hasOwnProperty(name)) {
      if (name === 'prototype') {
        avocado.javascript.prototypeAttributeIsEnumerable = true;
      }
    }
  }
})();


avocado.callbackWaiter = {
  on: function(functionThatYieldsCallbacks, functionToRunWhenDone, name) {
    return Object.newChildOf(this, functionToRunWhenDone, name).yieldCallbacks(functionThatYieldsCallbacks);
  },
  
  initialize: function(functionToRunWhenDone, name) {
    this._name = name;
    this._functionToRunWhenDone = functionToRunWhenDone;
    this._callbacks = [];
    this._numberOfCallsExpected = 0;
    this._numberCalledSoFar = 0;
    this._doneYieldingCallbacks = false;
    this._alreadyDone = false;
  },
  
  yieldCallbacks: function(functionThatYieldsCallbacks) {
    var thisWaiter = this;
    functionThatYieldsCallbacks(function() { return thisWaiter.createCallback(); });
    this._doneYieldingCallbacks = true;
    if (! this._alreadyDone) { this.checkWhetherDone(); }
  },
  
  checkWhetherDone: function() {
    if (this._alreadyDone) {
      throw "Called a callback again after we're already done.";
    }

    if (! this._doneYieldingCallbacks) { return; }

    if (this._numberCalledSoFar >= this._numberOfCallsExpected) {
      this._alreadyDone = true;
      if (this._functionToRunWhenDone) { this._functionToRunWhenDone(); }
    }
  },
  
  createCallback: function() {
    this._numberOfCallsExpected += 1;
    var thisWaiter = this;
    var callback = function() {
      if (callback.alreadyCalled) { throw new Error("Wait a minute, this one was already called!"); }
      callback.alreadyCalled = true;
      thisWaiter._numberCalledSoFar += 1;
      thisWaiter.checkWhetherDone();
    };
    this._callbacks.push(callback);
    return callback;
  }
};
annotator.annotationOf(avocado.callbackWaiter).setCreatorSlot('callbackWaiter', avocado);
annotator.annotationOf(avocado).setSlotAnnotation('callbackWaiter', {category: ['callbacks']});

window.modules = {};
annotator.annotationOf(modules).setCreatorSlot('modules', window);
annotator.annotationOf(window).setSlotAnnotation('modules', {category: ['avocado']});

if (! avocado.hasOwnProperty('transporter')) { avocado.transporter = {}; }
annotator.annotationOf(avocado.transporter).setCreatorSlot('transporter', avocado);
annotator.annotationOf(avocado).setSlotAnnotation('transporter', {category: ['transporter']});

avocado.transporter.loadedURLs = {};
annotator.annotationOf(avocado.transporter).slotAnnotation('loadedURLs').setInitializationExpression("{}");

avocado.transporter.loadOrder = [];

avocado.transporter.shouldLog = false;

avocado.transporter.module = {};
annotator.annotationOf(avocado.transporter.module).setCreatorSlot('module', avocado.transporter);

avocado.transporter.module.version = {};
annotator.annotationOf(avocado.transporter.module.version).setCreatorSlot('version', avocado.transporter.module);

avocado.transporter.module.cache = {};
annotator.annotationOf(avocado.transporter.module).slotAnnotation('cache').setInitializationExpression("{}");

avocado.transporter.module.onLoadCallbacks = {};
annotator.annotationOf(avocado.transporter.module).slotAnnotation('onLoadCallbacks').setInitializationExpression("{}");

avocado.transporter.slotCollection = {};
annotator.annotationOf(avocado.transporter.slotCollection).setCreatorSlot('slotCollection', avocado.transporter);

avocado.transporter.slotCollection.initialize = function(shouldIncludeSubObjectsOfCreatorSlot) {
  this._explicitlyIncluded = [];
};

avocado.transporter.slotCollection.add = function(holder, name) {
  this._explicitlyIncluded.push(Object.newChildOf(avocado.annotator.slotSpecifierPrototype, name, holder));
};

avocado.transporter.module.named = function(n) {
  var m = modules[n];
  if (m) {return m;}
  if (avocado.transporter.shouldLog) { console.log("Creating module named " + n); }
  m = modules[n] = Object.create(this);
  m._name = n;
  annotator.annotationOf(m).setCreatorSlot(n, modules);
  avocado.transporter.module.cache[n] = Object.newChildOf(avocado.transporter.slotCollection, function(s) {
    var sm = s.getModuleAssignedToMeExplicitlyOrImplicitly();
    return m === sm || !sm;
  });
  return m;
};

avocado.transporter.module.create = function(n, reqBlock, contentsBlock, versionInfo) {
  if (modules[n]) { throw 'The ' + n + ' module is already loaded.'; }
  var newModule = this.named(n);

  if (versionInfo) {
    newModule.setCurrentVersion(Object.newChildOf(avocado.transporter.module.version, newModule, versionInfo.versionID, 'unknown'));
  }
  
  avocado.callbackWaiter.on(function(finalCallback) {
    reqBlock(function(reqName) {
      newModule.requires(reqName, finalCallback());
    });
  }, function() {
    avocado.transporter.loadOrder.push({module: n});
    contentsBlock(newModule);
    if (avocado.transporter.shouldLog) { console.log("Finished loading module: " + n); }
    if (newModule.objectsWithAPostFileInMethod) {
      newModule.objectsWithAPostFileInMethod.each(function(o) {
        o.postFileIn();
      });
      delete newModule.objectsWithAPostFileInMethod;
    }
    avocado.transporter.module.doneLoadingModuleNamed(n);
  }, n);
};

avocado.transporter.module.setCurrentVersion = function (v) {
  this._currentVersion = v;
};

avocado.transporter.module.version.initialize = function (module, id, parentVersions) {
  this._module = module;
  this._id = id || "";
  this._parentVersions = parentVersions || [];
};

avocado.transporter.module.callWhenDoneLoadingModuleNamed = function(n, callback) {
  callback = callback || function() {};

  if (typeof(callback) !== 'function') { throw "What kind of callback is that? " + callback; }
  
  var existingOnLoadCallback = avocado.transporter.module.onLoadCallbacks[n];
  if (!existingOnLoadCallback) {
    avocado.transporter.module.onLoadCallbacks[n] = callback;
  } else if (typeof(existingOnLoadCallback) === 'function') {
    avocado.transporter.module.onLoadCallbacks[n] = function() {
      existingOnLoadCallback();
      callback();
    };
  } else if (existingOnLoadCallback === 'done') {
    // Already done; just call it right now.
    callback();
    return true;
  } else {
    throw "What's wrong with the on-load callback? " + typeof(existingOnLoadCallback);
  }
  return false;
};

avocado.transporter.module.doneLoadingModuleNamed = function(n) {
  var onLoadCallback = avocado.transporter.module.onLoadCallbacks[n];
  if (typeof(onLoadCallback) === 'function') {
    avocado.transporter.module.onLoadCallbacks[n] = 'done';
    onLoadCallback();
  } else if (onLoadCallback === 'done') {
    // Fine, I think.
  } else if (typeof(onLoadCallback) === 'undefined') {
    // aaa - I think this is OK too. Really, this whole callback system is a mess - needs to be cleaned up. -- Adam, Feb. 2011
    avocado.transporter.module.onLoadCallbacks[n] = 'done';
  } else {
    throw "What's wrong with the on-load callback for " + n + "? " + typeof(onLoadCallback);
  }
};

avocado.transporter.module.slotCollection = function() {
  return avocado.transporter.module.cache[this._name];
};

avocado.transporter.module.slotAdder = {
  data: function(name, contents, slotAnnotation, contentsAnnotation) {
    var holderAnno = annotator.annotationOf(this.holder);
    if (! slotAnnotation) { slotAnnotation = Object.create(annotator.slotAnnotationPrototype); }
    slotAnnotation = holderAnno.asSlotAnnotation(slotAnnotation, name);
    holderAnno.setSlotAnnotation(name, slotAnnotation);
    this.holder[name] = contents;
    annotator.setModuleIfNecessary(this.holder, name, this.module);
    if (contentsAnnotation) { // used for creator slots
      annotator.loadObjectAnnotation(contents, contentsAnnotation, name, this.holder);
    }
    
    if (name === 'postFileIn') {
      this.module.objectsWithAPostFileInMethod = this.module.objectsWithAPostFileInMethod || [];
      this.module.objectsWithAPostFileInMethod.push(this.holder);
    }
  },
  
  creator: function(name, contents, slotAnnotation, objectAnnotation) {
    this.data(name, contents, slotAnnotation, objectAnnotation || {});

    if (typeof(contents.postFileIn) === 'function') {
      this.module.objectsWithAPostFileInMethod = this.module.objectsWithAPostFileInMethod || [];
      this.module.objectsWithAPostFileInMethod.push(contents);
    }
    
    // aaa - Where's the right place to put this? How do we make sure that the stuff filed in before the
    // senders code still has its senders indexed?
    if (!window.shouldNotInitializeReflectiveSystem && avocado.senders && avocado.senders.rememberIdentifiersUsedBy) {
      if (typeof(contents) === 'function') {
        avocado.senders.rememberIdentifiersUsedBy(contents);
      }
    }
  },

  method: function(name, contents, slotAnnotation) {
    contents.displayName = name; // this'll show up in the Safari debugger
    contents._creatorSlotHolder = this.holder; // to allow implicit creator slots
    this.creator(name, avocado.makeSuperWork(this.holder, name, contents), slotAnnotation);
  },
  
  domChildNode: function(name, contents, slotAnnotation, contentsAnnotation) {
    this.holder.appendChild(contents);
  }
};

avocado.transporter.module.addSlots = function(holder, block) {
  var holderType = typeof(holder);
  if (holder === null || (holderType !== 'object' && holderType !== 'function')) { throw new Error("Cannot addSlots to " + holder); }
  var slotAdder = Object.create(this.slotAdder);
  slotAdder.module = this;
  slotAdder.holder = holder;
  block(slotAdder);
};

annotator.annotationOf(window).categorize(['avocado', 'bootstrap'], ['__annotation__', 'bootstrapTheModuleSystem', 'modules', 'currentUser', 'jsQuicheBaseURL', 'kernelModuleSavingScriptURL', 'logoutURL', 'startAvocadoGoogleApp', 'urlForKernelModuleName', 'isInCodeOrganizingMode']);

avocado.transporter.module.callWhenDoneLoadingModuleNamed('bootstrap',       function() {});
avocado.transporter.module.callWhenDoneLoadingModuleNamed('bootstrap_lk',    function() {}); // aaa lk-specific
avocado.transporter.module.callWhenDoneLoadingModuleNamed('bootstrap_three', function() {}); // aaa threejs-specific;
};
bootstrapTheModuleSystem();



avocado.transporter.module.create('bootstrap', function(requires) {

}, function(thisModule) {


thisModule.addSlots(window, function(add) {
  
  add.data('isInProgrammingEnvironmentMode', false, {category: ['avocado', 'config'], initializeTo: 'false'});
  
  add.data('isInCodeOrganizingMode', false, {category: ['avocado', 'config'], initializeTo: 'false'});
  
  add.data('isInRunMode', false, {category: ['avocado', 'config'], initializeTo: 'false'});
  
});


thisModule.addSlots(modules.bootstrap, function(add) {

  add.data('preFileInFunctionName', 'bootstrapTheModuleSystem');

});


thisModule.addSlots(avocado.transporter, function(add) {

  add.creator('repositories', {});

  add.data('availableRepositories', [], {initializeTo: '[]'});

  add.method('repositoryContainingModuleNamed', function (name) {
    // aaa fix once I want to allow multiple repositories
    return this.availableRepositories[0];
  }, {category: ['loading']});

  add.method('fileIn', function (name, moduleLoadedCallback) {
    var repo = this.repositoryContainingModuleNamed(name);
    if (!repo) {
      throw new Error("There is no repository containing a module named '" + name + "'; available repositories are: [" + this.availableRepositories.join(", ") + "]");
    }
    repo.fileIn(name, moduleLoadedCallback);
  }, {category: ['loading']});

  add.method('fileInIfWanted', function (name, callWhenDone) {
    if (this.shouldLoadModule(name)) {
      this.repositoryContainingModuleNamed(name).fileIn(name, callWhenDone);
    } else {
      if (callWhenDone) { callWhenDone(); }
    }
  }, {category: ['loading']});

  add.method('shouldLoadModule', function (name) {
    return true;
  }, {category: ['bootstrapping']});

  add.method('loadExternal', function (names, callWhenDone) {
    if (names.length === 0) { return callWhenDone(); }
    var name = names.shift();
    avocado.transporter.fileIn(name, function() {
      avocado.transporter.loadExternal(names, callWhenDone);
    });
  }, {category: ['bootstrapping']});

  add.method('loadJSFileFromURL', function (url, callWhenDone) {
    var i = url.lastIndexOf("/");
    var repoURL = url.substring(0, i) + '/';
    var fileName = url.substring(i + 1);
    var repo = Object.newChildOf(avocado.transporter.repositories.http, repoURL);
    repo.fileIn(fileName, function () {
      console.log("Loaded " + url);
      if (callWhenDone) { callWhenDone(); }
    });
  }, {category: ['bootstrapping']});

  add.method('initializeRepositories', function () {
    var baseURL = avocado.transporter.avocadoBaseURL;
    if (baseURL === undefined) { baseURL = document.documentURI; }
    baseURL = baseURL.substring(0, baseURL.lastIndexOf("/")) + '/';
    var repoURL = baseURL + "javascripts/";
    
    // aaa - hack because I want saving to keep working on my local machine
    if (repoURL.indexOf("http://localhost") === 0 || repoURL.indexOf("http://127.0.0.1") === 0) { avocado.kernelModuleSupportsWebDAV = true; }
    
    var kernelRepo;
    if (window.kernelModuleSavingScriptURL) {
      var savingScriptURL = window.kernelModuleSavingScriptURL;
      kernelRepo = Object.newChildOf(avocado.transporter.repositories.httpWithSavingScript, repoURL, savingScriptURL);
    } else if (avocado.kernelModuleSupportsWebDAV) {
      kernelRepo = Object.newChildOf(avocado.transporter.repositories.httpWithWebDAV, repoURL);
    } else {
      kernelRepo = Object.newChildOf(avocado.transporter.repositories.http, repoURL);
    }
    
    if (window.urlForKernelModuleName) {
      kernelRepo.urlForModuleName = window.urlForKernelModuleName;
    }
    
    avocado.transporter.availableRepositories.push(kernelRepo);
    
    modules.bootstrap.setRepository(kernelRepo);
    
    // aaa - This is not really the right place for this. I think. Maybe. Where's the
    // place where we really know where the emailing script is? -- Adam
    avocado.transporter.emailingScriptURL = "http://" + document.domain + "/cgi-bin/emailSource.cgi";
  }, {category: ['bootstrapping']});

  add.method('initializeCallbackWaiters', function () {
    avocado.callbackWaiter.on(function(callback) {
      avocado.transporter.callWhenWorldIsCreated = callback();
      avocado.transporter.callWhenAllAvocadoCodeIsLoaded = callback();
    }, function () {
      avocado.transporter.doneLoadingAllOfAvocado();
    });
  }, {category: ['bootstrapping']});

  add.method('putUnownedSlotsInInitModule', function () {
    var initModule = avocado.transporter.module.named('init');
    // aaa - HACK! necessary because the phone runs out of memory while doing this, I think.
    // The right solution in the long run, I think, is to have some clear way of specifying
    // whether the programming-environment stuff should be loaded. -- Adam
    if (!window.shouldNotInitializeReflectiveSystem && (!window.UserAgent || !UserAgent.isIPhone)) {
      var annotator = avocado.objectGraphWalker.visitors.objectGraphAnnotator.create();
      annotator.alsoMakeCreatorSlots();
      annotator.alsoBuildListsOfUsedIdentifiers();
      annotator.alsoAssignUnownedSlotsToModule(initModule);
      annotator.createWalker().alsoWalkSpecialUnreachableObjects().go();
    }
  }, {category: ['bootstrapping']});

  add.method('printLoadOrder', function () {
    console.log("# This code was produced by calling avocado.transporter.printLoadOrder()\n\n" + avocado.transporter.loadOrder.map(function(itemToLoad) {
      if (itemToLoad.externalScript) {
        return "externalScript(" + itemToLoad.externalScript.inspect() + ");";
      } else if (itemToLoad.module) {
        return "newModule(" + itemToLoad.module.inspect() + ");";
      } else if (itemToLoad.doIt) {
        return "doIt(" + itemToLoad.doIt.inspect() + ");";
      } else {
        throw "What's this weird thing in the loadOrder?"
      }
    }).join("\n"));
  }, {category: ['bootstrapping']});

  add.data('whatHasAlreadyBeenLoaded', {}, {category: ['bootstrapping'], initializeTo: '{}'});

  add.method('createAvocadoWorld', function () {
    Event.prepareEventSystem();
    var world = avocado.transporter.userInterfaceInitializer.createAvocadoWorld();
    if (this.callWhenDoneCreatingAvocadoWorld) {
      this.callWhenDoneCreatingAvocadoWorld(world);
      delete this.callWhenDoneCreatingAvocadoWorld;
    }
    return world;
  }, {category: ['bootstrapping']});

  add.method('createAvocadoWorldIfBothTheCodeAndTheWindowAreLoaded', function () {
    if (avocado.transporter.whatHasAlreadyBeenLoaded.isDoneLoadingAvocadoLib && avocado.transporter.whatHasAlreadyBeenLoaded.isDoneLoadingWindow) {
      avocado.world = avocado.transporter.createAvocadoWorld();
      avocado.transporter.callWhenWorldIsCreated();
      delete avocado.transporter.callWhenWorldIsCreated;
    }
  }, {category: ['bootstrapping']});

  add.method('doneLoadingWindow', function () {
    avocado.transporter.whatHasAlreadyBeenLoaded.isDoneLoadingWindow = true;
    if (avocado.transporter.userInterfaceInitializer) { avocado.transporter.userInterfaceInitializer.doneLoadingWindow(); }
    avocado.transporter.createAvocadoWorldIfBothTheCodeAndTheWindowAreLoaded();
  }, {category: ['bootstrapping']});

  add.method('doneLoadingAvocadoLib', function () {
    avocado.transporter.whatHasAlreadyBeenLoaded.isDoneLoadingAvocadoLib = true;
    avocado.transporter.createAvocadoWorldIfBothTheCodeAndTheWindowAreLoaded();
  }, {category: ['bootstrapping']});

  add.method('doneLoadingAllAvocadoCode', function () {
    avocado.transporter.userInterfaceInitializer.doneLoadingAllAvocadoCode();
    avocado.morphMixins.installAll();
    
    avocado.transporter.callWhenAllAvocadoCodeIsLoaded();
    delete avocado.transporter.callWhenAllAvocadoCodeIsLoaded;
  }, {category: ['bootstrapping']});

  add.method('doneLoadingAllOfAvocado', function () {
    if (window.callWhenDoneLoadingAvocado) {
      window.callWhenDoneLoadingAvocado(avocado.world);
      delete window.callWhenDoneLoadingAvocado;
    }
  }, {category: ['bootstrapping']});

  add.method('doBootstrappingStep', function (name) {
    avocado.transporter.loadOrder.push({doIt: 'avocado.transporter.' + name + '();'});
    //console.log("Doing bootstrapping step: " + name);
    return this[name].call(this);
  }, {category: ['bootstrapping']});

  add.method('startAvocado', function (callWhenDone) {
    if (typeof(callWhenDone) !== 'undefined') { window.callWhenDoneLoadingAvocado = callWhenDone; }
    
    this.doBootstrappingStep('initializeCallbackWaiters');
    this.doBootstrappingStep('initializeRepositories');

    avocado.transporter.userInterfaceInitializer.loadUserInterface(function() {

      avocado.transporter.fileInIfWanted("transporter/object_graph_walker", function() {
        avocado.transporter.doBootstrappingStep('putUnownedSlotsInInitModule');
        
        avocado.transporter.fileInIfWanted("avocado_lib", function() {
          avocado.transporter.doBootstrappingStep('doneLoadingAvocadoLib');
          avocado.transporter.userInterfaceInitializer.loadTopLevelEnvironment(function() {
            avocado.transporter.doBootstrappingStep('doneLoadingAllAvocadoCode');
          });
        });
      });
    });
  }, {category: ['bootstrapping']});
  
  add.method('canUseStoreStringToTransportObject', function (o) {
    if (o === null || typeof(o) === 'undefined') { return false; }
    if (typeof(o.storeString) !== 'function') { return false; }
    
    var storeStringFunctionAnno = avocado.annotator.existingAnnotationOf(o.storeString);
    var storeStringFunctionCreatorSlot = storeStringFunctionAnno && storeStringFunctionAnno.probableCreatorSlot();
    var storeStringFunctionIsOnThisObject = !!(storeStringFunctionCreatorSlot && o === storeStringFunctionCreatorSlot.holder);
    
    var storeStringNeedsThisObject = typeof(o.storeStringNeeds) === 'function' && o === o.storeStringNeeds();
    
    return !storeStringNeedsThisObject && !storeStringFunctionIsOnThisObject;
  }, {category: ['bootstrapping']});

});


thisModule.addSlots(avocado, function(add) {

  add.data('version', '0.15', {category: ['version']});

  add.creator('http', {}, {category: ['HTTP']});

  add.creator('generalUI', {}, {category: ['user interface'], comment: 'An extra layer of indirection, so that we can switch between LK and ThreeJS and various other UI systems.'});

});


thisModule.addSlots(avocado.http, function(add) {

  add.method('paramsStringFrom', function (paramsStringOrObject) {
    if (!paramsStringOrObject) { return ""; }
    if (typeof(paramsStringOrObject) === 'string') { return paramsStringOrObject; }
    var params = [];
    for (var n in paramsStringOrObject) {
      if (paramsStringOrObject.hasOwnProperty(n)) {
        params.push(encodeURIComponent(n) + "=" + encodeURIComponent(paramsStringOrObject[n]));
      }
    }
    return params.join("&");
  }, {category: ['requests']});

  add.creator('request', {}, {category: ['XHR']});

  add.creator('scriptTagRequest', {}, {category: ['script tags']});

});


thisModule.addSlots(avocado.http.request, function(add) {

  add.method('initialize', function (path) {
    this._path = path;
  }, {category: ['creating']});

  add.method('httpMethod', function () {
    return this._httpMethod || "GET";
  }, {category: ['accessing']});

  add.method('params', function () {
    return this._params || {};
  }, {category: ['accessing']});

  add.method('paramsString', function () {
    return avocado.http.paramsStringFrom(this.params());
  }, {category: ['accessing']});

  add.method('headers', function () {
    return this._headers || {};
  }, {category: ['accessing']});

  add.method('eachHeader', function (f) {
    var headers =  this.headers()
  	for (var headerName in headers) {
  	  if (headers.hasOwnProperty(headerName)) {
  	    f(headerName, headers[headerName]);
  	  }
  	}
  	if (this.httpMethod() === "POST") {
    	f("Content-type", "application/x-www-form-urlencoded");
  	}
  }, {category: ['accessing']});

  add.method('url', function () {
    if (this.httpMethod() === "GET") {
      return this._path + "?" + this.paramsString();
    } else {
      return this._path;
    }
  }, {category: ['accessing']});

  add.method('body', function () {
    var method = this.httpMethod();
    if (method === "POST" || method === "PUT") {
      if (this._postBody) {
        return this._postBody;
      } else {
        return this.paramsString();
      }
    } else {
      return undefined;
    }
  }, {category: ['accessing']});

  add.method('send', function (callback, errback, partback) {
  	var req = new XMLHttpRequest();
  	var httpMethod = this.httpMethod();
  	var url = this.url();
  	var debugMode = this._debugMode;
  	
  	req.open(httpMethod, url, ! this._isSynchronous);
  	this.eachHeader(function(name, value) { req.setRequestHeader(name, value); });

    var index = 0;
    req.onreadystatechange = function () {
      if (partback && req.readyState === 3) {
        if (req.status == 200) {
          var rtlen = req.responseText.length;
          if (index < rtlen) {
            var nextPartOfResponseText = req.responseText.substring(index);
            partback(nextPartOfResponseText);
            index = rtlen;
          }
        }
      } else if (req.readyState === 4) {
        if (req.status >= 200 && req.status < 300) {
          var responseText = req.responseText;
          if (debugMode) {
            console.log("Received response from " + url);
            if (responseText) { console.log(responseText); }
          }
          callback(responseText);
        } else {
          errback("HTTP status: " + req.status);
        }
      }
    }
    
    var body = this.body();
  	if (debugMode) {
  	  console.log("Sending HTTP " + httpMethod + " to " + url);
      if (body) { console.log(body); }
  	}
    req.send(body);
  }, {category: ['sending']});

});


thisModule.addSlots(avocado.http.scriptTagRequest, function(add) {

  add.method('initialize', function (path) {
    this._path = path;
  }, {category: ['creating']});

  add.method('fullPath', function () {
    var p = this._path;
    // aaa - might want to have caching in production?
    if (p.indexOf('?') >= 0) { p += "&t=" + new Date().getTime(); } else { p += "?t=" + new Date().getTime(); } // to avoid caching;
    return p;
  }, {category: ['sending']});

  add.method('send', function (callback) {
    var script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = this.fullPath();
    script.onload = callback;
    var head = document.getElementsByTagName('head')[0];
    head.appendChild(script);
  }, {category: ['sending']});

});


thisModule.addSlots(avocado.transporter.module, function(add) {

  add.data('_repository', null, {initializeTo: 'null'});

  add.method('setRepository', function (r) {
    this._repository = r;
    return this;
  }, {category: ['accessing']});

  add.method('existingOneNamed', function (n) {
    return modules[n];
  }, {category: ['accessing']});

  add.method('requirements', function () {
    if (! this._requirements) { this._requirements = []; }
    return this._requirements;
  }, {category: ['requirements']});

  add.method('addRequirement', function (nameOfRequiredModule) {
    if (this.requirements().include(nameOfRequiredModule)) { return; }
    this.requirements().push(nameOfRequiredModule);
    this.markAsChanged();
  }, {category: ['requirements']});

  add.method('requires', function (moduleName, reqLoadedCallback) {
    this.requirements().push(moduleName);

    reqLoadedCallback = reqLoadedCallback || function() {};

    var module = avocado.transporter.module.existingOneNamed(moduleName);
    if (module) {
      avocado.transporter.module.callWhenDoneLoadingModuleNamed(moduleName, reqLoadedCallback);
    } else {
      avocado.transporter.fileIn(moduleName, reqLoadedCallback);
    }
  }, {category: ['requirements']});

});


thisModule.addSlots(avocado.transporter.repositories, function(add) {

  add.creator('abstract', {});

});


thisModule.addSlots(avocado.transporter.repositories['abstract'], function(add) {

  add.method('fileIn', function (name, moduleLoadedCallback) {
    if (avocado.transporter.module.callWhenDoneLoadingModuleNamed(name, moduleLoadedCallback)) { return; }
    
    var thisRepository = this;
    this.loadModuleNamed(name, function() {
      var module = modules[name];
      if (module) {
        module.setRepository(thisRepository);
      } else {
        // Must just be some external Javascript library - not one of our
        // modules. So we consider the module to be loaded now, since the
        // file is loaded.
        avocado.transporter.loadOrder.push({externalScript: name});
        if (avocado.transporter.shouldLog) { console.log("Finished loading external script: " + name); }
        avocado.transporter.module.doneLoadingModuleNamed(name);
      }
    });
  }, {category: ['loading']});

});


thisModule.addSlots(avocado.transporter.repositories, function(add) {

  add.creator('console', Object.create(avocado.transporter.repositories['abstract']));

  add.creator('http', Object.create(avocado.transporter.repositories['abstract']));

});


thisModule.addSlots(avocado.transporter.repositories.http, function(add) {

  add.method('initialize', function (url) {
    this._url = url;
  }, {category: ['creating']});

  add.method('url', function () {
    return this._url;
  }, {category: ['printing']});

  add.method('toString', function () {
    return this.url();
  }, {category: ['printing']});

  add.method('urlForModuleName', function (name) {
    return this.urlForFileName((name.substring(name.length - 3) !== '.js') ? name + ".js" : name);
  }, {category: ['saving to WebDAV']});

  add.method('urlForFileName', function (name) {
    return this.url() + name;
  }, {category: ['saving to WebDAV']});

  add.method('loadModuleNamed', function (name, callWhenDone) {
    var url = this.urlForModuleName(name);
    if (avocado.transporter.shouldLog) { console.log("About to try to loadModuleNamed " + name + " at URL " + url); }
    this.loadURL(url, callWhenDone);
  }, {category: ['loading']});

  add.method('loadURL', function (url, scriptLoadedCallback) {
    scriptLoadedCallback = scriptLoadedCallback || function() {};

    // Don't load the same JS file more than once.
    var loadingStatus = avocado.transporter.loadedURLs[url];
    if (typeof loadingStatus === 'function') {
      avocado.transporter.loadedURLs[url] = function() {
        loadingStatus();
        scriptLoadedCallback();
      };
      return;
    } else if (loadingStatus === 'done') {
      return scriptLoadedCallback();
    } else if (loadingStatus) {
      throw "Wait, it's not a callback function and it's not 'done'; what is it?"
    }

    // aaa - don't use this global loadedURLs thing, use something repo-specific.
    avocado.transporter.loadedURLs[url] = scriptLoadedCallback;

    var loadingFunction = avocado.transporter._functionToLoadAURL;
    if (!loadingFunction) {
      var thisRepo = this;
      var shouldUseXMLHttpRequest = false; // aaa - not sure which way is better; seems to be a tradeoff
      if (shouldUseXMLHttpRequest) {
        loadingFunction = function(url, callback) { thisRepo.loadURLUsingXHR(url, callback); };
      } else {
        loadingFunction = function(url, callback) { thisRepo.loadURLUsingScriptTag(url, callback); };
      }
    }
    loadingFunction(url, function() {
      avocado.transporter.loadedURLs[url]();
      avocado.transporter.loadedURLs[url] = 'done';
    });
  }, {category: ['loading']});

  add.method('loadURLUsingXHR', function (url, callback) {
    var req = Object.newChildOf(avocado.http.request, url);
    req.send(function(_fileContents) {
      // I really hope "with" is the right thing to do here. We seem to need
      // it in order to make globally-defined things work.
      with (window) { eval("//@ sourceURL=" + url + "\n" + _fileContents); } // sourceURL will show up in the debugger
      callback();
    }, function(err) {
      throw err;
    });
  }, {category: ['loading']});

  add.method('loadURLUsingScriptTag', function (url, callback) {
    var req = Object.newChildOf(avocado.http.scriptTagRequest, url);
    req.send(callback);
  }, {category: ['loading']});

  add.method('canFileOutIndividualModules', function () {
    return typeof(this.fileOutModuleVersion) === 'function';
  }, {category: ['saving']});

});


thisModule.addSlots(avocado.transporter.repositories, function(add) {

  add.creator('httpWithWebDAV', Object.create(avocado.transporter.repositories.http));

  add.creator('httpWithSavingScript', Object.create(avocado.transporter.repositories.http));

});


thisModule.addSlots(avocado.transporter.repositories.httpWithSavingScript, function(add) {

  add.method('initialize', function (url, savingScriptURL) {
    this._url = url;
    this._savingScriptURL = savingScriptURL;
  }, {category: ['creating']});

});


});
