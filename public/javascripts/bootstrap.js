window.bootstrapTheModuleSystem = function () {

// The bootstrap module is kind of a mess. Try to minimize it.

if (typeof Object.create !== 'function') {
  Object.create = function(parent) {
    function F() {}
    F.prototype = parent;
    return new F();
  };
}

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
    for (var property in o) {
      if (o.hasOwnProperty(property) && property !== '__oid__') {
        c[property] = o[property];
      }
    }
    return c;
  };
}


// Gotta overwrite Prototype's Object.extend, or bad things happen with annotations.
Object.extend = function extend(destination, source) {
  for (var property in source) {
    if (property !== '__oid__') {
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

    existingSlotAnnotation: function(name) {
      if (! this.slotAnnotations) { return null; }
      return this.slotAnnotations[this.annotationNameForSlotNamed(name)];
    },
    
    eachSlotAnnotation: function(f) {
      var slotAnnos = this.slotAnnotations;
      var prefixLength = this._slotAnnoPrefix.length;
      for (var n in slotAnnos) {
        if (slotAnnos.hasOwnProperty(n)) {
          f(n.substr(prefixLength), slotAnnos[n]);
        }
      }
    },

    setSlotAnnotation: function(name, slotAnno) {
      if (slotAnno) {
        var realSlotAnno = annotator.asSlotAnnotation(slotAnno);
        // sometimes annotation definitions come in as strings. Hack to force the UI to work anyways
	      if (! realSlotAnno['category'] instanceof Array) {
		      realSlotAnno['category'] = [realSlotAnno['category']]; 
        }
        this.slotAnnotations[this.annotationNameForSlotNamed(name)] = realSlotAnno;
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
      delete this.slotAnnotations[this.annotationNameForSlotNamed(name)];
    },

    explicitlySpecifiedCreatorSlot: function () {
      return this.hasOwnProperty('creatorSlot') ? this.creatorSlot : null;
    },

    setCreatorSlot: function(name, holder) {
      if (name !== undefined && holder !== undefined) {
        this.creatorSlot = {name: name, holder: holder};
      } else {
        delete this.creatorSlot;
      }
      // delete this.possibleCreatorSlots; // don't need these anymore // aaa - no, I disagree now, leave them there so people can easily change it back -- Adam, Oct. 2010
    },

    addPossibleCreatorSlot: function(name, holder) {
      // if (this.explicitlySpecifiedCreatorSlot()) { return; } // no point // aaa - no, I disagree now, leave them there so people can easily change it back -- Adam, Oct. 2010
      var slots = this.possibleCreatorSlots = this.possibleCreatorSlots || [];

      // Don't add duplicates.
      // aaa - Quadratic, blecch. Use a hash table? but hash_table.js isn't loaded yet. Oh, well - might not matter if I keep the list small.
      for (var i = 0, n = slots.length; i < n; ++i) {
        var s = slots[i];
        if (name === s.name && holder === s.holder) { return; }
      }

      this.possibleCreatorSlots.push({name: name, holder: holder});
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
            var srcSlotAnno = annotator.existingSlotAnnotation(src, name);
            if (srcSlotAnno && srcSlotAnno.category) {
              var dstSlotAnno = this.setSlotAnnotation(name, {});
              dstSlotAnno.category = srcSlotAnno.category;
	      // aaa - Make sure the JSQuiche server gets updated?
	      // Do we store each slot's category separately, or store
	      // the fact that there's a copy-down parent?
            }
          }
        }
      }
    },

    categorize: function(catParts, slotNames) {
      // Just a shortcut to let us categorize a bunch of slots at a time.
      for (var i = 0, n = slotNames.length; i < n; ++i) {
	      var slotName = slotNames[i];
	      this.slotAnnotation(slotName).category = catParts;
      }
    }
  },

  slotAnnotationPrototype: {
  },

  _nextOID: 2,

  oidOf: function(o) {
    // HACK: Damned JavaScript. Adding attributes to Object.prototype and stuff like that
    // is a bad idea, because people use for..in loops to enumerate their attributes.
    // So we'll hard-code their OIDs here.
    if (o === Object.prototype) { return 0; }
    if (o ===  Array.prototype) { return 1; }
    if (o.hasOwnProperty('__oid__')) { return o.__oid__; }
    var oid = this._nextOID++;
    o.__oid__ = oid;
    return oid;
  },

  _annotations: [],

  annotationOf: function(o) {
    var oid = this.oidOf(o);
    var a = this._annotations[oid];
    if (a) { return a; }
    a = this.newObjectAnnotation();
    a.object = o;
    this._annotations[oid] = a;
    return a;
  },

  existingAnnotationOf: function(o) {
    var oid = this.oidOf(o);
    var a = this._annotations[oid];
    return a;
  },

  newObjectAnnotation: function() {
    return this.asObjectAnnotation({slotAnnotations: {}});
  },

  asObjectAnnotation: function(anno) {
    // aaa - In browsers that don't allow you to set __proto__, create a new
    // object and copy over the slots.
    anno['__proto__'] = this.objectAnnotationPrototype;
    return anno;
  },
  
  loadObjectAnnotation: function(o, rawAnno, creatorSlotName, creatorSlotHolder) {
    var a = annotator.annotationOf(o);
    
    if (creatorSlotName && creatorSlotHolder) {
      a.setCreatorSlot(creatorSlotName, creatorSlotHolder);
    }
    
    if (rawAnno) {
      for (var property in rawAnno) {
        if (rawAnno.hasOwnProperty(property) && property !== '__oid__') {
          a[property] = rawAnno[property];
        }
      }

      a.copyDownSlotsFromAllCopyDownParents(o);
    }
    
    return a;
  },

  asSlotAnnotation: function(slotAnno) {
    // aaa - In browsers that don't allow you to set __proto__, create a new
    // object and copy over the slots.
    slotAnno['__proto__'] = this.slotAnnotationPrototype;
    return slotAnno;
  },

  existingSlotAnnotation: function(holder, name) {
    var anno = this.existingAnnotationOf(holder);
    if (!anno) { return null; }
    return anno.existingSlotAnnotation(name);
  },
  
  adjustSlotsToOmit: function(rawSlotsToOmit) {
    var slotsToOmit = rawSlotsToOmit || [];
    if (typeof slotsToOmit === 'string') {
      slotsToOmit = slotsToOmit.split(" ");
    }
    if (! slotsToOmit.include('__oid__')) {
      slotsToOmit.push('__oid__');
    }
    return slotsToOmit;
  }
};

if (! window.hasOwnProperty('avocado')) { window.avocado = {}; }
annotator.annotationOf(avocado).setCreatorSlot('avocado', window);
annotator.annotationOf(window).setSlotAnnotation('avocado', {category: ['avocado']});

avocado.annotator = annotator;
annotator.annotationOf(avocado.annotator).setCreatorSlot('annotator', avocado);
annotator.annotationOf(avocado).setSlotAnnotation('annotator', {category: ['annotations']});

avocado.javascript = {};
annotator.annotationOf(avocado.javascript).setCreatorSlot('javascript', avocado);
annotator.annotationOf(avocado).setSlotAnnotation('javascript', {category: ['javascript']});

avocado.javascript.reservedWords = {'abstract': true, 'boolean': true, 'break': true, 'byte': true, 'case': true, 'catch': true, 'char': true, 'class': true, 'const': true, 'continue': true, 'debugger': true, 'default': true, 'delete': true, 'do': true, 'double': true, 'else': true, 'enum': true, 'export': true, 'extends': true, 'false': true, 'final': true, 'finally': true, 'float': true, 'for': true, 'function': true, 'goto': true, 'if': true, 'implements': true, 'import': true, 'in': true, 'instanceof': true, 'int': true, 'interface': true, 'long': true, 'native': true, 'new': true, 'null': true, 'package': true, 'private': true, 'protected': true, 'public': true, 'return': true, 'short': true, 'static': true, 'super': true, 'switch': true, 'synchronized': true, 'this': true, 'throw': true, 'throws': true, 'transient': true, 'true': true, 'try': true, 'typeof': true, 'var': true, 'volatile': true, 'void': true, 'while': true, 'with': true};

// aaa - Copied from Base.js. Just a hack to make $super work. Not really sure
// what the right solution is in the long run - how do we make this work with
// both prototype-style inheritance and class-style inheritance?
avocado.hackToMakeSuperWork = function(holder, property, contents) {
  var value = contents;
  var superclass = holder.constructor && this === holder.constructor.prototype && holder.constructor.superclass;
  var ancestor = superclass ? superclass.prototype : holder['__proto__']; // using [] to fool JSLint
  if (ancestor && typeof(value) === 'function' && value.argumentNames && value.argumentNames().first() === "$super") {
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
  }
  return value;
};
annotator.annotationOf(avocado.hackToMakeSuperWork).setCreatorSlot('hackToMakeSuperWork', avocado);
annotator.annotationOf(avocado).setSlotAnnotation('hackToMakeSuperWork', {category: ['inheritance']});

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
      throw "Whoa, called a callback again after we're already done.";
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
annotator.annotationOf(window).setSlotAnnotation('modules', {category: ['transporter']});

window.transporter = {};
annotator.annotationOf(transporter).setCreatorSlot('transporter', window);
annotator.annotationOf(window).setSlotAnnotation('transporter', {category: ['transporter']});

transporter.loadedURLs = {};

transporter.loadOrder = [];

transporter.module = {};
annotator.annotationOf(transporter.module).setCreatorSlot('module', transporter);

transporter.module.cache = {};

transporter.module.onLoadCallbacks = {};

transporter.module.named = function(n) {
  var m = modules[n];
  if (m) {return m;}
  //console.log("Creating module named " + n);
  m = modules[n] = Object.create(this);
  m._name = n;
  annotator.annotationOf(m).setCreatorSlot(n, modules);
  transporter.module.cache[n] = [];
  return m;
};

transporter.module.create = function(n, reqBlock, contentsBlock) {
  if (modules[n]) { throw 'The ' + n + ' module is already loaded.'; }
  var newModule = this.named(n);
  avocado.callbackWaiter.on(function(finalCallback) {
    reqBlock(function(reqName) {
      newModule.requires(reqName, Object.extend(finalCallback(), {aaa_name: reqName}));
    });
  }, function() {
    transporter.loadOrder.push({module: n});
    contentsBlock(newModule);
    // console.log("Finished loading module: " + n);
    if (newModule.objectsWithAPostFileInMethod) {
      newModule.objectsWithAPostFileInMethod.each(function(o) {
        o.postFileIn();
      });
      delete newModule.objectsWithAPostFileInMethod;
    }
    transporter.module.doneLoadingModuleNamed(n);
  }, n);
};

transporter.module.callWhenDoneLoadingModuleNamed = function(n, callback) {
  callback = callback || function() {};

  if (typeof(callback) !== 'function') { throw "What kind of callback is that? " + callback; }
  
  var existingOnLoadCallback = transporter.module.onLoadCallbacks[n];
  if (!existingOnLoadCallback) {
    transporter.module.onLoadCallbacks[n] = callback;
  } else if (typeof(existingOnLoadCallback) === 'function') {
    transporter.module.onLoadCallbacks[n] = function() {
      existingOnLoadCallback();
      callback();
    };
  } else if (existingOnLoadCallback === 'done') {
    // Already done; just call it right now.
    callback();
    return true;
  } else {
    throw "Whoa, what's wrong with the on-load callback? " + typeof(existingOnLoadCallback);
  }
  return false;
};

transporter.module.doneLoadingModuleNamed = function(n) {
  var onLoadCallback = transporter.module.onLoadCallbacks[n];
  if (typeof(onLoadCallback) === 'function') {
    transporter.module.onLoadCallbacks[n] = 'done';
    onLoadCallback();
  } else if (onLoadCallback === 'done') {
    // Fine, I think.
  } else {
    throw "Whoa, what's wrong with the on-load callback for " + n + "? " + typeof(onLoadCallback);
  }
};

transporter.module.objectsThatMightContainSlotsInMe = function() {
  return transporter.module.cache[this._name];
};

transporter.module.slotAdder = {
  data: function(name, contents, slotAnnotation, contentsAnnotation) {
    if (! slotAnnotation) { slotAnnotation = {}; }
    this.holder[name] = contents;
    slotAnnotation.module = this.module;
    annotator.annotationOf(this.holder).setSlotAnnotation(name, slotAnnotation);
    if (contentsAnnotation) { // used for creator slots
      annotator.loadObjectAnnotation(contents, contentsAnnotation, name, this.holder);
    }

    // aaa see hackToMakeSureArrayIndexablesGetFiledOut
    if (typeof contents === 'object' && contents instanceof Array) {
      this.module.objectsThatMightContainSlotsInMe().push(contents);
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
    if (avocado.senders && avocado.senders.rememberIdentifiersUsedBy) {
      if (typeof(contents) === 'function') {
        avocado.senders.rememberIdentifiersUsedBy(contents, {slotHolder: this.holder, slotName: name});
      }
    }
  },

  method: function(name, contents, slotAnnotation) {
    contents.displayName = name; // this'll show up in the Safari debugger
    this.creator(name, avocado.hackToMakeSuperWork(this.holder, name, contents), slotAnnotation);
  }
};

transporter.module.addSlots = function(holder, block) {
  this.objectsThatMightContainSlotsInMe().push(holder);
  var slotAdder = Object.create(this.slotAdder);
  slotAdder.module = this;
  slotAdder.holder = holder;
  block(slotAdder);
};

annotator.annotationOf(window).categorize(['avocado', 'bootstrap'], ['__oid__', 'bootstrapTheModuleSystem', 'livelyBaseURL', 'loadTheLKTestFramework', 'modules', 'transporter', 'currentUser', 'jsQuicheBaseURL', 'kernelModuleSavingScriptURL', 'logoutURL', 'startAvocadoGoogleApp', 'urlForKernelModuleName', 'wasServedFromGoogleAppEngine', 'isInCodeOrganizingMode']);

transporter.module.callWhenDoneLoadingModuleNamed('bootstrap', function() {});
};
bootstrapTheModuleSystem();



transporter.module.create('bootstrap', function(requires) {}, function(thisModule) {


thisModule.addSlots(modules.bootstrap, function(add) {

  add.data('preFileInFunctionName', 'bootstrapTheModuleSystem');

});


thisModule.addSlots(transporter, function(add) {

  add.creator('repositories', {});

  add.data('availableRepositories', [], {initializeTo: '[]'});

  add.method('repositoryContainingModuleNamed', function (name) {
    // aaa fix once I want to allow multiple repositories
    return this.availableRepositories[0];
  }, {category: ['loading']});

  add.method('fileIn', function (name, moduleLoadedCallback) {
    this.repositoryContainingModuleNamed(name).fileIn(name, moduleLoadedCallback);
  }, {category: ['loading']});

  add.method('fileOut', function (m, repo, codeToFileOut, successBlock, failBlock) {
    (repo || m._repository).fileOutModule(m, codeToFileOut.replace(/[\r]/g, "\n"), successBlock, failBlock);
  }, {category: ['saving']});

  add.method('fileInIfWanted', function (name, callWhenDone) {
    if (this.shouldLoadModule(name)) {
      this.repositoryContainingModuleNamed(name).fileIn(name, callWhenDone);
    } else {
      if (callWhenDone) { callWhenDone(); }
    }
  }, {category: ['loading']});

  add.method('loadExternal', function (names, callWhenDone) {
    if (names.length === 0) { return callWhenDone(); }
    var name = names.shift();
    transporter.fileIn(name, function() {
      transporter.loadExternal(names, callWhenDone);
    });
  }, {category: ['bootstrapping']});

  add.method('createCanvasIfNone', function () {
    var canvas = document.getElementById("canvas");
    if (! canvas) {
      canvas = document.createElementNS("http://www.w3.org/2000/svg", 'svg');
      canvas.setAttribute('id', 'canvas');
      canvas.setAttribute('width',  '100%');
      canvas.setAttribute('height', '600');
      canvas.setAttribute('xmlns', "http://www.w3.org/2000/svg");
      canvas.setAttribute('xmlns:lively', "http://www.experimentalstuff.com/Lively");
      canvas.setAttribute('xmlns:xlink', "http://www.w3.org/1999/xlink");
      canvas.setAttribute('xmlns:xhtml', "http://www.w3.org/1999/xhtml");
      canvas.setAttribute('xml:space', "preserve");
      canvas.setAttribute('zoomAndPan', "disable");

      var title = document.createElement('title');
      title.appendChild(document.createTextNode('Lively canvas'));
      canvas.appendChild(title);
      
      // Put the canvas inside a div, because for some reason FireFox isn't calculating
      // offsetLeft and offsetTop for the canvas itself. Also, allow people to specify
      // an 'avocadoDiv' element so they can control where Avocado goes on the page.
      var avocadoDiv = document.getElementById('avocadoDiv');
      if (! avocadoDiv) {
        avocadoDiv = document.createElement('div');
        document.body.appendChild(avocadoDiv);
      }
      avocadoDiv.appendChild(canvas);
    }
    return canvas;
  }, {category: ['bootstrapping']});

  add.method('loadLivelyKernel', function (callWhenDone) {
    if (document.body) { this.createCanvasIfNone(); } else { window.onload = this.createCanvasIfNone; }

    // Later on could do something nicer with dependencies and stuff. For now,
    // let's just try dynamically loading the LK files in the same order we
    // loaded them when we were doing it statically in the .xhtml file.
    this.loadExternal(
      ["prototype/prototype",
       "lk/JSON",
       "lk/defaultconfig",
       "local-LK-config",
       "lk/Base",
       "lk/scene",
       "lk/Core",
       "lk/Text",
       "lk/Widgets",
       "lk/Network",
       "lk/Data",
       "lk/Storage",
       "lk/bindings",
       "lk/Tools",
       "lk/TestFramework",
       "lk/TouchSupport",
       "lk/cop/Layers",
       "moousture/mootools-1.2.4-core-nc",
       "moousture/Moousture",
       "moousture/iPhoneProbe",
       "jslint"
      ], function() {
        if (callWhenDone) { callWhenDone(); }
      }
    );
  }, {category: ['bootstrapping']});

  add.method('doneLoadingLivelyKernel', function () {
  }, {category: ['bootstrapping']});

  add.method('initializeRepositories', function () {
    var baseURL = window.livelyBaseURL;
    if (baseURL === undefined) { baseURL = document.documentURI; }
    baseURL = baseURL.substring(0, baseURL.lastIndexOf("/")) + '/';
    var repoURL = baseURL + "javascripts/";
    // aaa - hack because I haven't managed to get WebDAV working on adamspitz.com yet
    var kernelRepo;
    if (window.kernelModuleSavingScriptURL || repoURL.indexOf("coolfridgesoftware.com") >= 0) {
      var savingScriptURL = window.kernelModuleSavingScriptURL || "http://coolfridgesoftware.com/cgi-bin/savefile.cgi";
      kernelRepo = Object.create(transporter.repositories.httpWithSavingScript);
      kernelRepo.initialize(repoURL, savingScriptURL);
    } else {
      kernelRepo = Object.create(transporter.repositories.httpWithWebDAV);
      kernelRepo.initialize(repoURL);
    }
    
    if (window.urlForKernelModuleName) {
      kernelRepo.urlForModuleName = window.urlForKernelModuleName;
    }
    
    transporter.availableRepositories.push(kernelRepo);
    
    modules.bootstrap._repository = kernelRepo;
    
    // aaa - This is not really the right place for this. I think. Maybe. Where's the
    // place where we really know where the emailing script is? -- Adam
    transporter.emailingScriptURL = "http://" + document.domain + "/cgi-bin/emailSource.cgi";
  }, {category: ['bootstrapping']});

  add.method('putUnownedSlotsInInitModule', function () {
    var initModule = transporter.module.named('init');
    // aaa - HACK! necessary because the phone runs out of memory while doing this, I think.
    // The right solution in the long run, I think, is to have some clear way of specifying
    // whether the programming-environment stuff should be loaded. -- Adam
    if (!UserAgent.isIPhone) {
      avocado.creatorSlotMarker.annotateExternalObjects(true, initModule);
    }
  }, {category: ['bootstrapping']});

  add.method('printLoadOrder', function () {
    console.log(transporter.loadOrder.map(function(itemToLoad) {
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

  add.method('initializeAvocado', function () {
    Morph.prototype.suppressBalloonHelp = true; // I love the idea of balloon help, but it's just broken - balloons keep staying up when they shouldn't
    //Morph.suppressAllHandlesForever(); // those things are annoying // but useful for direct UI construction
    
    var canvas = document.getElementById("canvas");
    //console.log("About to create the world on canvas: " + canvas);
    var world = new WorldMorph(canvas);
    world.displayOnCanvas(canvas);
    modules.init.markAsUnchanged(); // because displayOnCanvas sets the creator slot of the world
    if (navigator.appName == 'Opera') { window.onresize(); }
    //console.log("The world should be visible now.");
    return world;
  }, {category: ['bootstrapping']});

  add.method('createAvocadoWorld', function () {
    Event.prepareEventSystem();
    var world = transporter.initializeAvocado();
    this.initializeGestures();
    if (this.callWhenDoneCreatingAvocadoWorld) {
      this.callWhenDoneCreatingAvocadoWorld(world);
      delete this.callWhenDoneCreatingAvocadoWorld;
    }
  }, {category: ['bootstrapping']});

  add.method('initializeGestures', function () {
    // aaa - big mess, just trying to see if it works
    var gstr = new Moousture.ReducedLevenMatcher({reduceConsistency: 1});
    var probe = new (UserAgent.isTouch ? Moousture.iPhoneProbe : Moousture.MouseProbe)(WorldMorph.current()); //$(document));
    var recorder = new Moousture.Recorder({maxSteps: 20, minSteps: 8, matcher: gstr});
    var monitor = new Moousture.Monitor(20, 1);
    //CCW circle motion vectors
    //gstr.addGesture([3,2,1,0,7,6,5,4], ccwCircle);
    //Make a triangle
    function triMov(error){
      if (error * 10 >= 8) { return; }
      WorldMorph.current().showContextMenu(Event.createFake());
    }

    gstr.addGesture([7, 1, 7, 1], triMov);
    //Zig zag swipe vectors
    //gstr.addGesture([4, 0, 4, 0], swipeMouse);
    
    //var swipeProbe = new Moousture.iPhoneProbe(WorldMorph.current().rawNode);
    //var swipeMonitor = new Moousture.Monitor(20, 1);
    //var swipeMatcher = new Moousture.ReducedLevenMatcher({reduceConsistency: 4});
    //var swipeRecorder = new Moousture.Recorder({maxSteps: 50, minSteps: 2, matcher: swipeMatcher});
    
    //swipeMatcher.addGesture([0], rightSwipe);
    //swipeMatcher.addGesture([4], leftSwipe);
    
    monitor.start(probe, recorder);
    //swipeMonitor.start(swipeProbe, swipeRecorder);
  }, {category: ['bootstrapping']});

  add.method('createAvocadoWorldIfBothTheCodeAndTheWindowAreLoaded', function () {
    if (transporter.isDoneLoadingAvocadoLib && transporter.isDoneLoadingWindow) {
      transporter.createAvocadoWorld();
      avocado.worldHasBeenCreated = true;
      this.initializeProgrammingEnvironmentIfTheCodeIsLoadedAndTheWorldIsCreated();
    }
  }, {category: ['bootstrapping']});

  add.method('initializeProgrammingEnvironmentIfTheCodeIsLoadedAndTheWorldIsCreated', function (callWhenDone) {
    if (this.isDoneLoadingProgrammingEnvironment && avocado.worldHasBeenCreated) {
      var shouldPrintLoadOrder = false;
      if (shouldPrintLoadOrder) { this.printLoadOrder(); }

      var app = window.isInCodeOrganizingMode ? window.jsQuiche : window.avocado;
      app.initialize();
      WorldMorph.current().addApplication(app);
    }
  }, {category: ['bootstrapping']});

  add.method('doneLoadingAvocadoLib', function () {
    transporter.doneLoadingLivelyKernel();
    transporter.isDoneLoadingAvocadoLib = true;
    transporter.createAvocadoWorldIfBothTheCodeAndTheWindowAreLoaded();
  }, {category: ['bootstrapping']});

  add.method('doneLoadingAllOfAvocado', function () {
    if (modules['lk_programming_environment/programming_environment'] || modules['lk_programming_environment/code_organizer']) {
      this.isDoneLoadingProgrammingEnvironment = true;
      this.initializeProgrammingEnvironmentIfTheCodeIsLoadedAndTheWorldIsCreated();
    }

    if (this.callWhenDoneLoadingAvocado) {
      this.callWhenDoneLoadingAvocado(WorldMorph.current());
      delete this.callWhenDoneLoadingAvocado;
    }
  }, {category: ['bootstrapping']});

  add.method('doBootstrappingStep', function (name) {
    transporter.loadOrder.push({doIt: 'transporter.' + name + '();'});
    //console.log("Doing bootstrapping step: " + name);
    return this[name].call(this);
  }, {category: ['bootstrapping']});

  add.method('shouldLoadModule', function (name) {
    // This is a total hack, not meant to be secure; I'm just putting it
    // in here to show how it's possible to avoid loading in the
    // programming environment. -- Adam
    if (name === "lk_programming_environment/programming_environment") {
      if (UserAgent.isIPhone) { return false; }
      if (window.isInCodeOrganizingMode) { return false; } // aaa HACK - what's the right way to do this?
      //if (window.wasServedFromGoogleAppEngine) { return currentUser && currentUser.isAdmin; }
    }
    if (name === "lk_programming_environment/code_organizer") {
      if (! window.isInCodeOrganizingMode) { return false; } // aaa HACK - what's the right way to do this?
    }
    return true;
  }, {category: ['bootstrapping']});

  add.method('startAvocado', function (callWhenDone) {
    this.callWhenDoneLoadingAvocado = callWhenDone;

    this.doBootstrappingStep('initializeRepositories');

    transporter.loadLivelyKernel(function() {

      transporter.fileInIfWanted("transporter/object_graph_walker", function() {
        transporter.doBootstrappingStep('putUnownedSlotsInInitModule');
        
        transporter.fileInIfWanted("avocado_lib", function() {
          transporter.doBootstrappingStep('doneLoadingAvocadoLib');
          transporter.fileInIfWanted("lk_programming_environment/code_organizer", function() {
            transporter.fileInIfWanted("lk_programming_environment/programming_environment", function() {
              transporter.doBootstrappingStep('doneLoadingAllOfAvocado');
            });
          });
        });
      });
    });
  }, {category: ['bootstrapping']});

});


thisModule.addSlots(transporter.repositories, function(add) {

  add.creator('abstract', {});

  add.creator('console', Object.create(transporter.repositories['abstract']));

  add.creator('http', Object.create(transporter.repositories['abstract']));

  add.creator('httpWithWebDAV', Object.create(transporter.repositories.http));

  add.creator('httpWithSavingScript', Object.create(transporter.repositories.http));

});


thisModule.addSlots(transporter.repositories['abstract'], function(add) {

  add.method('fileIn', function (name, moduleLoadedCallback) {
    if (transporter.module.callWhenDoneLoadingModuleNamed(name, moduleLoadedCallback)) { return; }
    
    var thisRepository = this;
    this.loadModuleNamed(name, function() {
      var module = modules[name];
      if (module) {
        module._repository = thisRepository;
      } else {
        // Must just be some external Javascript library - not one of our
        // modules. So we consider the module to be loaded now, since the
        // file is loaded.
        transporter.loadOrder.push({externalScript: name});
        //console.log("Finished loading external script: " + name);
        transporter.module.doneLoadingModuleNamed(name);
      }
    });
  }, {category: ['loading']});

});


thisModule.addSlots(transporter.repositories.http, function(add) {

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
    return this.url() + name + ".js";
  }, {category: ['saving to WebDAV']});

  add.method('loadModuleNamed', function (name, callWhenDone) {
    var url = this.urlForModuleName(name);
    //console.log("About to try to loadModuleNamed " + name + " at URL " + url);
    this.loadURL(url, callWhenDone);
  }, {category: ['loading']});

  add.method('loadURL', function (url, scriptLoadedCallback) {
    scriptLoadedCallback = scriptLoadedCallback || function() {};

    // Don't load the same JS file more than once.
    var loadingStatus = transporter.loadedURLs[url];
    if (typeof loadingStatus === 'function') {
      transporter.loadedURLs[url] = function() {
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
    transporter.loadedURLs[url] = scriptLoadedCallback;

    // Intentionally using primitive mechanisms (either XHR or script tags), so
    // that we don't depend on having any other code loaded.
    var shouldUseXMLHttpRequest = false; // aaa - not sure which way is better; seems to be a tradeoff
    if (shouldUseXMLHttpRequest) {
      var req = new XMLHttpRequest();
      req.open("GET", url, true);
      req.onreadystatechange = function() {
        if (req.readyState === 4) {
          var _fileContents = req.responseText;
          // I really hope "with" is the right thing to do here. We seem to need
          // it in order to make globally-defined things work.
          with (window) { eval("//@ sourceURL=" + url + "\n" + _fileContents); } // sourceURL will show up in the debugger
          transporter.loadedURLs[url]();
          transporter.loadedURLs[url] = 'done';
        }
      };
      req.send();
    } else {
      var head = document.getElementsByTagName("head")[0];
      var script = document.createElement('script');
      script.type = 'text/javascript';
      script.onload = function() {
        transporter.loadedURLs[url]();
        transporter.loadedURLs[url] = 'done';
      };
      script.src = url + (url.indexOf('?') >= 0 ? "&" : "?") + "t=" + new Date().getTime(); // to avoid caching; aaa - might want to have caching in production
      head.appendChild(script);
    }
  }, {category: ['loading']});

});


thisModule.addSlots(transporter.repositories.httpWithWebDAV, function(add) {

  add.method('fileOutModule', function (m, codeToFileOut, successBlock, failBlock) {
    var url = this.urlForModuleName(m.name());
    var shouldUseXMLHttpRequest = false; // don't wanna count on the LK Resource object existing
    if (shouldUseXMLHttpRequest) {
      var req = new XMLHttpRequest();
      req.open("PUT", url, true);
      req.onreadystatechange = function() {
        if (req.readyState === 4) {
          if (req.status >= 200 && req.status < 300) {
            console.log("Success! " + req.status + " at " + url);
            successBlock();
          } else {
            failBlock("failed to file out " + m + ", status is " + req.status + ", statusText is " + req.statusText);
          }
        }
      };
      req.send(codeToFileOut);
    } else {
      var urlObj = new URL(url);
      var status = new Resource(Record.newPlainInstance({URL: urlObj})).store(codeToFileOut, true).getStatus();
      if (status.isSuccess()) {
        successBlock();
      } else {
        failBlock("failed to file out " + m + ", status is " + status.code());
      }
    }
  }, {category: ['saving']});

});


thisModule.addSlots(transporter.repositories.httpWithSavingScript, function(add) {

  add.method('initialize', function (url, savingScriptURL) {
    this._url = url;
    this._savingScriptURL = savingScriptURL;
  }, {category: ['creating']});

  add.method('fileOutModule', function (m, codeToFileOut, successBlock, failBlock) {
    var repoURL = this.url();
    if (repoURL.endsWith("/")) { repoURL = repoURL.substring(0, repoURL.length - 1); }
    var url = this._savingScriptURL;
    var postBody = "repoURL=" + encodeURIComponent(repoURL) + "&module=" + encodeURIComponent(m.name()) + "&code=" + encodeURIComponent(codeToFileOut);
    //console.log("About to fileOutModule " + m.name() + " using saving script URL " + url + " and POST body:\n" + postBody);
    var req = new Ajax.Request(url, {
      method: 'post',
      postBody: postBody,
      contentType: 'application/x-www-form-urlencoded',
          
      asynchronous: true,
      onSuccess:   function(transport) { this.onSuccess(m, transport, successBlock); }.bind(this),
      onFailure:   function(t        ) { failBlock("Failed to file out module " + m + " to repository " + this + "; HTTP status code was " + req.getStatus()); }.bind(this),
      onException: function(r,      e) { failBlock("Failed to file out module " + m + " to repository " + this + "; exception was " + e); }.bind(this)
    });
  }, {category: ['saving']});

  add.data('shouldShowNewFileContentsInNewWindow', false, {category: ['downloading']});

  add.method('onSuccess', function (m, transport, callWhenDone) {
    var statusCodeIfAny = parseInt(transport.responseText);
    if (!isNaN(statusCodeIfAny)) {
      avocado.ui.showError("Failed to file out " + m + " module; status code " + statusCodeIfAny);
    } else {
      if (this.shouldShowNewFileContentsInNewWindow) {
        var urlToDownload = transport.responseText;
        window.open(urlToDownload);
      }
      callWhenDone();
    }
  }, {category: ['downloading']});

});


thisModule.addSlots(transporter.repositories.console, function(add) {

  add.method('fileOutModule', function (m, codeToFileOut, successBlock, failBlock) {
    console.log(codeToFileOut);
  });

});


thisModule.addSlots(transporter.module, function(add) {

  add.method('existingOneNamed', function (n) {
    return modules[n];
  }, {category: ['accessing']});

  add.method('requirements', function () {
    if (! this._requirements) { this._requirements = []; }
    return this._requirements;
  }, {category: ['requirements']});

  add.method('addRequirement', function (nameOfRequiredModule) {
    this.requirements().push(nameOfRequiredModule);
    this.markAsChanged();
  }, {category: ['requirements']});

  add.method('requires', function (moduleName, reqLoadedCallback) {
    this.requirements().push(moduleName);

    reqLoadedCallback = reqLoadedCallback || function() {};

    var module = transporter.module.existingOneNamed(moduleName);
    if (module) {
      transporter.module.callWhenDoneLoadingModuleNamed(moduleName, reqLoadedCallback);
    } else {
      transporter.fileIn(moduleName, reqLoadedCallback);
    }
  }, {category: ['requirements']});

});


});
