avocado.transporter.module.create('transporter/object_graph_walker', function(requires) {

requires('core/testFramework');
requires('core/dom_stuff');

}, function(thisModule) {


thisModule.addSlots(avocado, function(add) {

  add.creator('objectGraphWalker', {}, {category: ['object graph']});

  add.creator('senders', {}, {category: ['object graph']});

});


thisModule.addSlots(avocado.objectGraphWalker, function(add) {

  add.method('create', function () {
    var w = Object.create(this);
    w.initialize.apply(w, arguments);
    return w;
  });

  add.method('initialize', function () {
    this._objectCount = 0; // just for fun;
  });

  add.method('visitor', function () {
    return this._visitor;
  });

  add.method('setVisitor', function (v) {
    this._visitor = v;
    return this;
  });

  add.creator('visitors', {});

  add.data('namesToIgnore', ["__annotation__", "_annotationsForObjectsThatShouldNotHaveAttributesAddedToThem", "_creatorSlotHolder", "localStorage", "sessionStorage", "globalStorage", "enabledPlugin"], {comment: 'Having enabledPlugin in here is just for now - the right solution is to figure out what\'s this clientInformation thing, and what are these arrays that aren\'t really arrays?', initializeTo: '["__annotation__", "_annotationsForObjectsThatShouldNotHaveAttributesAddedToThem", "_creatorSlotHolder", "localStorage", "sessionStorage", "globalStorage", "enabledPlugin"]'});

  add.method('go', function (root) {
    this.reset();
    this._startTime = new Date().getTime();
    this.walk(root === undefined ? window : root);
    if (this._shouldAlsoWalkSpecialUnreachableObjects) { this.walkSpecialUnreachableObjects(); }
    if (!this._shouldNotUndoMarkingsWhenDone) { this.undoAllMarkings(); }
    return this.results();
  });

  add.method('goStartingAtRootSlots', function (rootSlots) {
    this.reset();
    this._startTime = new Date().getTime();
    rootSlots.each(function(rootSlot) {
      this.walkAttribute(rootSlot.holder().reflectee(), rootSlot.name());
    }.bind(this));
    if (this._shouldAlsoWalkSpecialUnreachableObjects) { this.walkSpecialUnreachableObjects(); }
    if (!this._shouldNotUndoMarkingsWhenDone) { this.undoAllMarkings(); }
    return this.results();
  });

  add.method('reset', function () {
    // children can override
    this._marked = [];
    this._objectCount = 0;
    if (this._visitor) { this._visitor.reset(); }
  });

  add.method('results', function () {
    return this._visitor.results();
  });

  add.method('resultsAreSlots', function () {
    return this._visitor.resultsAreSlots();
  });

  add.method('objectCount', function () { return this._objectCount; });

  add.method('beInDebugMode', function () {
    this._debugMode = true;
    return this;
  });

  add.method('alsoWalkSpecialUnreachableObjects', function () {
    this._shouldAlsoWalkSpecialUnreachableObjects = true;
    return this;
  });

  add.method('doNotUndoMarkingsWhenDone', function () {
    this._shouldNotUndoMarkingsWhenDone = true;
    return this;
  });

  add.method('doNotIgnoreDOMObjects', function () {
    this._shouldNotIgnoreDOMObjects = true;
    return this;
  });

  add.method('useDOMChildNodePseudoSlots', function () {
    this.doNotIgnoreDOMObjects();
    this._shouldUseDOMChildNodePseudoSlots = true;
    return this;
  });

  add.method('ignoreSimpleMethods', function () {
    this._shouldIgnoreSimpleMethods = true;
    return this;
  });

  add.method('ignoreObjectsWithAStoreString', function () {
    this._shouldIgnoreObjectsWithAStoreString = true;
    return this;
  });

  add.method('alsoRevisitAlreadyVisitedObjects', function () {
    this._shouldRevisitAlreadyVisitedObjects = true;
    return this;
  });

  add.creator('path', {});

  add.method('walkSpecialUnreachableObjects', function () {
    var walker = this;
    
    // 'for' loops don't see String and Number and Array and their 'prototype' slots.
    ['Object', 'String', 'Number', 'Boolean', 'Array', 'Function', 'Error', 'Node', 'Text'].forEach(function(typeName) {
        var type = window[typeName];
        var pathToType          = avocado.objectGraphWalker.path.create(window, typeName);
        var pathToTypePrototype = pathToType.extendWith(type, 'prototype');
        walker.markObject(type, pathToType, true);
        walker.markObject(type.prototype, pathToTypePrototype, true);
        walker.walk(type);
        walker.walk(type.prototype);
        walker.visitor().reachedSlot(window, typeName, type); // aaa - if I do this, maybe I don't need the above line where I walk the type?
    });
    
    // another special case, I think
    this.markObject(window['__proto__'], avocado.objectGraphWalker.path.create(window, '__proto__'), true);
  });

  add.method('setShouldWalkIndexables', function (b) {
    this.shouldWalkIndexables = b;
    return this;
  });

  add.method('nameOfObjectWithPath', function (howDidWeGetHere) {
    // useful for debugging
    var s = [];
    var p = howDidWeGetHere;
    while (p) {
      s.unshift(p.slotName);
      p = p.previous;
    }
    return s.join('.');
  });

  add.creator('tests', Object.create(avocado.testCase), {category: ['tests']});

  add.method('inspect', function () {
    return this._visitor.inspect();
  });

  add.method('canHaveSlots', function (o) {
    if (o === null) { return false; }
    var t = typeof o;
    return t === 'object' || t === 'function';
  });

  add.method('shouldIgnoreObject', function (o) {
    // the DOM is a nightmare, stay away
    if (!this._shouldNotIgnoreDOMObjects && (avocado.DOMStuff.isDOMNode(o) || avocado.DOMStuff.isDOMElement(o))) { return true; }
    
    if (this._shouldIgnoreSimpleMethods && avocado.annotator.isSimpleMethod(o)) { return true; }
    
    if (this._shouldIgnoreObjectsWithAStoreString && avocado.transporter.canUseStoreStringToTransportObject(o)) { return true; }
    
    return false;
  });

  add.method('markObject', function (object, howDidWeGetHere, shouldExplicitlySetIt) {
    if (this._debugMode) { console.log("Marking object " + this.nameOfObjectWithPath(howDidWeGetHere)); }
    if (this._shouldRevisitAlreadyVisitedObjects) { // in case this is a shorter path
      this._visitor.reachedObject(object, howDidWeGetHere, shouldExplicitlySetIt);
    }
    
    // Return false if this object has already been marked; otherwise mark it and return true.
    //
    // Would use an identity dictionary here, if JavaScript could do one. As it is, we'll
    // have to mark the annotation and then come by again and unmark it.
    var objectAnno;
    try { objectAnno = avocado.annotator.annotationOf(object); } catch (ex) { return false; } // FireFox bug
    
    if (! this._visitor.shouldContinueRecursingIntoObject(object, objectAnno, howDidWeGetHere)) { return false; }
    
    var walkers = objectAnno.walkers = objectAnno.walkers || (window.avocado && avocado.set && Object.newChildOf(avocado.set, avocado.hashTable.identityComparator)) || [];
    if (walkers.include(this)) { return false; }
    walkers.push(this);
    this._marked.push(object);
    return true;
  });

  add.method('undoAllMarkings', function () {
    // Could walk the graph again so that we don't need to create this big
    // list of marked stuff. But for now this'll do.
    if (! this._marked) { return; }
    this._marked.each(function(obj) {
      var anno = avocado.annotator.actualExistingAnnotationOf(obj);
      if (anno) {
        if (anno.walkers) {
          if (anno.walkers.remove) {
            anno.walkers.remove(this);
          } else {
            anno.walkers = anno.walkers.without(this);
          }

          // Probably better to remove the walkers collection, so it doesn't stick around as a memory leak.
          if (anno.walkers.size() === 0) { delete anno.walkers; }
        }

        anno.deleteIfRedundant(obj);
      }
    }.bind(this));
    this._marked = [];
  });

  add.method('walk', function (currentObj, howDidWeGetHere) {
    if (this.shouldIgnoreObject(currentObj, howDidWeGetHere)) { return; }
    if (! this.markObject(currentObj, howDidWeGetHere)) { return; }

    this._objectCount += 1;
    this._visitor.reachedObject(currentObj, howDidWeGetHere);

    if (typeof(currentObj.hasOwnProperty) === 'function') {
      if (this._debugMode) { console.log("About to walk through the properties of object " + this.nameOfObjectWithPath(howDidWeGetHere)); }
      
      if (this._shouldUseDOMChildNodePseudoSlots && (avocado.DOMStuff.isDOMNode(currentObj) || avocado.DOMStuff.isDOMElement(currentObj))) {
        // Treat DOM nodes specially because the DOM is a nightmare.
        var childNodes = currentObj.childNodes;
        for (var i = 0, n = childNodes.length; i < n; ++i) {
          this.walkDOMChildNode(currentObj, i, childNodes[i], howDidWeGetHere);
        }
      } else {
        for (var name in currentObj) {
          if (currentObj.hasOwnProperty(name) && ! this.namesToIgnore.include(name) && !this._visitor.shouldIgnoreSlot(currentObj, name, howDidWeGetHere)) {
            this.walkAttribute(currentObj, name, howDidWeGetHere);
          }
        }
        
        if (currentObj !== null && typeof(currentObj) !== 'undefined') {
          this.walkAttribute(currentObj, '__proto__', howDidWeGetHere);
        }

        // Workaround for Chrome. -- Adam
        if (! avocado.javascript.prototypeAttributeIsEnumerable) {
          if (currentObj.hasOwnProperty("prototype")) {
            this.walkAttribute(currentObj, "prototype", howDidWeGetHere);
          }
        }
      }
    }
  });

  add.method('walkAttribute', function (currentObj, name, howDidWeGetHere) {
    if (this._debugMode) { console.log("About to walk attribute " + name + " of " + this.nameOfObjectWithPath(howDidWeGetHere)); }
    var contents;
    var encounteredFirefoxBug = false;
    try { contents = currentObj[name]; } catch (ex) { encounteredFirefoxBug = true; }
    if (! encounteredFirefoxBug) {
      this._visitor.reachedSlot(currentObj, name, contents);
      if (this._visitor.shouldContinueRecursingIntoSlot(currentObj, name, howDidWeGetHere)) {
        if (this.canHaveSlots(contents)) {
          var shouldWalkContents;
          // aaa - this isn't right. But I don't wanna walk all the indexables.
          try { shouldWalkContents = contents.constructor !== Array || this.shouldWalkIndexables; }
          catch (ex) { shouldWalkContents = true; } // another FireFox problem?
          if (shouldWalkContents) {
            this.walk(contents, avocado.objectGraphWalker.path.create(currentObj, name, howDidWeGetHere));
          }
        }
      }
    }
  });

  add.method('walkDOMChildNode', function (parentNode, index, childNode, howDidWeGetHere) {
    this._visitor.reachedDOMChildNode(parentNode, index, childNode);
    
    this.walk(childNode, avocado.objectGraphWalker.path.create(parentNode, "childnode" + index, howDidWeGetHere));
  });

});


thisModule.addSlots(avocado.objectGraphWalker.path, function(add) {

  add.method('create', function () {
    var p = Object.create(this);
    p.initialize.apply(p, arguments);
    return p;
  });

  add.method('initialize', function (slotHolder, slotName, previous) {
    this.slotHolder = slotHolder;
    this.slotName = slotName;
    this.previous = previous;
  });

  add.method('extendWith', function (slotHolder, slotName) {
    return avocado.objectGraphWalker.path.create(slotHolder, slotName, this);
  });

});


thisModule.addSlots(avocado.objectGraphWalker.tests, function(add) {

  add.method('testIncremental', function () {
    var w1 = avocado.objectGraphWalker.visitors.testingObjectGraphWalker.create().createWalker();
    w1.go();
    var n = 'objectGraphWalker_tests___extraSlotThatIAmAdding';
    var o = {};
    window[n] = o;
    var w2 = avocado.objectGraphWalker.visitors.testingObjectGraphWalker.create().createWalker();
    w2.go();
    this.assertEqual(w1.objectCount() + 1, w2.objectCount());
    delete window[n];
  });

});


thisModule.addSlots(avocado.senders, function(add) {

  add.data('byID', {}, {initializeTo: '{}'});

  add.method('of', function (id) {
    return this.byID[id] || [];
  });

  add.creator('finder', {});

  add.method('rememberIdentifiersUsedBy', function (f) {
    if (typeof(f) !== 'function') { return; }
    var str = f.toString();
    var idRegex = /[A-Z_$a-z][A-Z_$0-9a-z]*/g;
    var ids = str.match(idRegex);
    if (!ids) { return; }
    var sendersByID = this.byID;
    for (var i = 0, n = ids.length; i < n; ++i) {
      var id = ids[i];
      if (id !== '__annotation__' && !avocado.javascript.reservedWords[id]) {
        var senders = sendersByID[id];
        if (!senders) {
          senders = [];
          sendersByID[id] = senders;
        }
        senders.push(f);
      }
    }
  });

});


thisModule.addSlots(avocado.senders.finder, function(add) {

  add.method('create', function (id) {
    return Object.newChildOf(this, id);
  });

  add.method('initialize', function (id) {
    this._id = id;
  });

  add.method('inspect', function () { return "senders of " + this._id; });

  add.method('go', function () {
    return avocado.senders.of(this._id).map(function(x) {
      return reflect(x).probableCreatorSlot();
    });
  });

  add.method('resultsAreSlots', function () { return true; });

});


thisModule.addSlots(avocado.objectGraphWalker.visitors, function(add) {

  add.creator('general', {});

});


thisModule.addSlots(avocado.objectGraphWalker.visitors.general, function(add) {

  add.method('create', function () {
    var v = Object.create(this);
    v.initialize.apply(v, arguments);
    return v;
  });

  add.method('initialize', function () {
    this._results = [];
  });

  add.method('inspect', function () {
    return reflect(this).name();
  });

  add.method('createWalker', function () {
    return avocado.objectGraphWalker.create().setVisitor(this);
  });

  add.method('reset', function () {
    // children can override;
  });

  add.method('results', function () {
    return this._results;
  });

  add.method('resultsAreSlots', function () {
    return this._resultsAreSlots;
  });

  add.method('shouldContinueRecursingIntoObject', function (object, objectAnno, howDidWeGetHere) {
    // children can override
    return true;
  });

  add.method('shouldContinueRecursingIntoSlot', function (holder, slotName, howDidWeGetHere) {
    // children can override
    return true;
  });

  add.method('shouldIgnoreSlot', function (holder, slotName, contents) {
    // children can override;
    return false;
  });

  add.method('reachedObject', function (o) {
    // children can override;
  });

  add.method('reachedSlot', function (holder, slotName, contents) {
    // children can override;
  });

  add.method('reachedDOMChildNode', function (parentNode, index, childNode) {
    // children can override;
  });

});


thisModule.addSlots(avocado.objectGraphWalker.visitors, function(add) {

  add.creator('objectGraphAnnotator', Object.create(avocado.objectGraphWalker.visitors.general));

});


thisModule.addSlots(avocado.objectGraphWalker.visitors.objectGraphAnnotator, function(add) {

  add.method('createWalker', function ($super) {
    return $super().ignoreSimpleMethods().ignoreObjectsWithAStoreString().alsoRevisitAlreadyVisitedObjects();
  });

  add.method('alsoMakeCreatorSlots', function () {
    this._shouldMakeCreatorSlots = true;
    return this;
  });

  add.method('alsoBuildListsOfUsedIdentifiers', function () {
    this._shouldBuildListsOfUsedIdentifiers = true;
    return this;
  });

  add.method('alsoAssignUnownedSlotsToModule', function (moduleOrFn) {
    return this.alsoAssignSlotsToModule(function(holder, slotName, contents) {
      var holderAnno = avocado.annotator.existingAnnotationOf(holder);
      var slotAnno = holderAnno && holderAnno.existingSlotAnnotation(slotName);
      var alreadyAssignedToModule = avocado.annotator.getModuleAssignedExplicitlyOrImplicitlyTo(slotAnno, holder);
      if (alreadyAssignedToModule) {
        return undefined;
      } else {
        if (typeof(moduleOrFn) === 'function') {
          return moduleOrFn(holder, slotName, contents);
        } else {
          return moduleOrFn;
        }
      }
    });
  });

  add.method('alsoAssignSlotsToModule', function (moduleOrFn) {
    this.moduleToAssignSlotsTo = moduleOrFn;
    return this;
  });

  add.method('makeCreatorSlotIfNecessary', function (contents, howDidWeGetHere, shouldExplicitlySetIt) {
    if (! howDidWeGetHere) { return; }
    if (contents === window) { return; }
    var contentsAnno;
    var slotHolder = howDidWeGetHere.slotHolder;
    var slotName   = howDidWeGetHere.slotName;
    
    if (slotName === '__proto__') { return; } // not sure this is the right thing to do, but for now let's go with it

    // Optimization: don't bother creating an annotation just to set its creator slot if that creator
    // slot is already determinable from the object itself.
    var implicitCS = avocado.annotator.creatorSlotDeterminableFromTheObjectItself(contents);
    if (implicitCS && implicitCS.holder === slotHolder && implicitCS.name === slotName) {
      // no need to do anything
    } else {
      try { contentsAnno = avocado.annotator.annotationOf(contents); } catch (ex) { return; } // FireFox bug

      if (shouldExplicitlySetIt) {
        contentsAnno.setCreatorSlot(slotName, slotHolder);
      } else {
        var existingCS = contentsAnno.explicitlySpecifiedCreatorSlot();
        if (existingCS && existingCS.contentsObject() === contents) {
          // no need to do anything
        } else {
          contentsAnno.addPossibleCreatorSlot(slotName, slotHolder);
        }
      }
    }
  });

  add.method('reachedObject', function (contents, howDidWeGetHere, shouldExplicitlySetIt) {
    if (this._shouldMakeCreatorSlots) {
      this.makeCreatorSlotIfNecessary(contents, howDidWeGetHere, shouldExplicitlySetIt);
    }
    
    if (this._shouldBuildListsOfUsedIdentifiers) {
      // Remember identifiers so we can search for "senders".
      avocado.senders.rememberIdentifiersUsedBy(contents);
    }
  });

  add.method('reachedSlot', function (holder, slotName, contents) {
    if (! this.moduleToAssignSlotsTo) { return; }
    if (slotName === '__proto__') { return; }
    
    var module;
    if (typeof(this.moduleToAssignSlotsTo) === 'function') {
      module = this.moduleToAssignSlotsTo(holder, slotName, contents);
    } else {
      module = this.moduleToAssignSlotsTo;
    }
    
    if (module) {
      if (this._debugMode) { console.log("Setting module of " + slotName + " to " + module); }
      avocado.annotator.setModuleIfNecessary(holder, slotName, module);
    } else {
      if (this._debugMode) { console.log("NOT setting module of " + slotName); }
    }
  });

});


thisModule.addSlots(avocado.objectGraphWalker.visitors, function(add) {

  add.creator('implementorsFinder', Object.create(avocado.objectGraphWalker.visitors.general));

});


thisModule.addSlots(avocado.objectGraphWalker.visitors.implementorsFinder, function(add) {

  add.method('initialize', function ($super, slotName) {
    $super();
    this._slotNameToSearchFor = slotName;
  });

  add.method('inspect', function () { return "Well-known implementors of '" + this._slotNameToSearchFor + "'"; });

  add.method('reachedSlot', function (holder, slotName, contents) {
    if (slotName === this._slotNameToSearchFor && holder !== avocado.senders.byID && reflect(holder).isWellKnown('probableCreatorSlot')) {
      this._results.push(reflect(holder).slotAt(slotName));
    }
  });

  add.data('_resultsAreSlots', true);

});


thisModule.addSlots(avocado.objectGraphWalker.visitors, function(add) {

  add.creator('unownedSlotFinder', Object.create(avocado.objectGraphWalker.visitors.general));

});


thisModule.addSlots(avocado.objectGraphWalker.visitors.unownedSlotFinder, function(add) {

  add.method('inspect', function () { return "Unowned attributes"; });

  add.method('shouldContinueRecursingIntoObject', function (object, objectAnno, howDidWeGetHere) {
    // Factor the system better, so that this object-graph-walker
    // can do exactly what the transporter does.
    if (avocado.annotator.isSimpleMethod(object)) { return false; }
    
    if (avocado.transporter.canUseStoreStringToTransportObject(object)) { return false; }
    
    return true;
  });

  add.method('shouldContinueRecursingIntoSlot', function (holder, slotName, howDidWeGetHere) {
    var slot = reflect(holder).slotAt(slotName);
    var isCreator = slot.equals(slot.contents().explicitlySpecifiedCreatorSlot());
    if (!isCreator) { return false; }
    if (slot.getModuleAssignedToMeExplicitly()) { return false; } // since all the objects under it will implicitly have that module
    return true;
  });

  add.method('shouldIgnoreSlot', function (holder, slotName, howDidWeGetHere) {
    var slotAnno = avocado.annotator.annotationOf(holder).slotAnnotation(slotName);
    if (slotAnno.initializationExpression()) { return true; }
    return false;
  });

  add.method('reachedSlot', function (holder, slotName, contents) {
    if (slotName === '__proto__') { return; }
    var slotAnno = avocado.annotator.annotationOf(holder).existingSlotAnnotation(slotName); // for performance, don't create the annotation if it's not needed
    if (! avocado.annotator.getModuleAssignedExplicitlyOrImplicitlyTo(slotAnno, holder)) {
      if (avocado.annotator.isMagicSlotNameOnFunction(holder, slotName)) { return; }
      var slot = reflect(holder).slotAt(slotName);
      if (slot.isFromACopyDownParent()) { return; }
      
      console.log("Found unowned slot: " + slot.holder().name() + "." + slot.name());
      this._results.push(slot);
    }
  });

  add.data('_resultsAreSlots', true);

});


thisModule.addSlots(avocado.objectGraphWalker.visitors, function(add) {

  add.creator('referenceFinder', Object.create(avocado.objectGraphWalker.visitors.general));

});


thisModule.addSlots(avocado.objectGraphWalker.visitors.referenceFinder, function(add) {

  add.method('initialize', function ($super, o) {
    $super();
    this._objectToSearchFor = o;
  });

  add.method('inspect', function () { return "Well-known references to " + reflect(this._objectToSearchFor).inspect(); });

  add.method('reachedSlot', function (holder, slotName, contents) {
    if (contents === this._objectToSearchFor) {
      var holderMir = reflect(holder);
      if (holderMir.isWellKnown('probableCreatorSlot')) {
        this._results.push(holderMir.slotAt(slotName));
      }
    }
  });

  add.method('reachedObject', function (o) {
    var mir = reflect(o);
    if (mir.parent().reflectee() === this._objectToSearchFor && mir.isWellKnown('probableCreatorSlot')) {
      this._results.push(mir.parentSlot());
    }
  });

  add.data('_resultsAreSlots', true);

});


thisModule.addSlots(avocado.objectGraphWalker.visitors, function(add) {

  add.creator('childFinder', Object.create(avocado.objectGraphWalker.visitors.general));

});


thisModule.addSlots(avocado.objectGraphWalker.visitors.childFinder, function(add) {

  add.method('initialize', function ($super, o) {
    $super();
    this._objectToSearchFor = o;
  });

  add.method('reachedObject', function (o) {
    var mir = reflect(o);
    if (mir.parent().reflectee() === this._objectToSearchFor && mir.isWellKnown('probableCreatorSlot')) {
      this._results.push(o);
    }
  });

});


thisModule.addSlots(avocado.objectGraphWalker.visitors, function(add) {

  add.creator('annotationWalker', Object.create(avocado.objectGraphWalker.visitors.general));

});


thisModule.addSlots(avocado.objectGraphWalker.visitors.annotationWalker, function(add) {

  add.method('initialize', function ($super) {
    $super();
    this._simpleFunctionCount = 0;
    this._simpleFunctionPrototypeCount = 0;
    this._emptyObjectCount = 0;
    this._otherObjectCount = 0;
    this._otherObjects = [];
    this._emptyObjects = [];
  });

  add.method('reachedObject', function (o) {
    if (o && typeof(o.hasOwnProperty) === 'function' && avocado.annotator.actualExistingAnnotationOf(o)) {
      var mir = reflect(o);
      if (mir.isReflecteeSimpleMethod()) {
        this._simpleFunctionCount += 1;
      } else {
        var cs = mir.theCreatorSlot();
        if (cs && cs.name() === 'prototype' && cs.holder().isReflecteeSimpleMethod()) {
          this._simpleFunctionPrototypeCount += 1;
        } else if (mir.size() === 0 && mir.reflectee().__proto__ === Object.prototype) {
          this._emptyObjectCount += 1;
          this._emptyObjects.push(mir.reflectee());
        } else {
          this._otherObjectCount += 1;
          this._otherObjects.push(mir.reflectee());
        }
      }
    }
  });

});


thisModule.addSlots(avocado.objectGraphWalker.visitors, function(add) {

  add.creator('testingObjectGraphWalker', Object.create(avocado.objectGraphWalker.visitors.general));

});


thisModule.addSlots(avocado.objectGraphWalker.visitors.testingObjectGraphWalker, function(add) {

  add.method('createWalker', function ($super) {
    return $super().doNotUndoMarkingsWhenDone(); // so that the tests can examine the _marked list;
  });

  add.method('reset', function ($super) {
    $super();
    this._objectsReached = [];
    this._slotsReached = [];
  });

  add.method('reachedObject', function (o) {
    this._objectsReached.push(o);
  });

  add.method('reachedSlot', function (holder, slotName, contents) {
    var slot = reflect(holder).slotAt(slotName);
    this._slotsReached.push(slot);
  });

  add.method('slotCount', function () {
    return this._slotsReached.length;
  });

});


});
