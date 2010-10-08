transporter.module.create('transporter/object_graph_walker', function(requires) {

requires('core/lk_TestFramework');

}, function(thisModule) {


thisModule.addSlots(lobby, function(add) {

  add.creator('objectGraphWalker', {}, {category: ['transporter']});

  add.creator('creatorSlotMarker', Object.create(objectGraphWalker), {category: ['transporter']});

  add.creator('implementorsFinder', Object.create(objectGraphWalker), {category: ['transporter']});

  add.creator('referenceFinder', Object.create(objectGraphWalker), {category: ['transporter']});

  add.creator('childFinder', Object.create(objectGraphWalker), {category: ['transporter']});

  add.creator('testingObjectGraphWalker', Object.create(objectGraphWalker), {category: ['transporter']});

});


thisModule.addSlots(childFinder, function(add) {

  add.method('initialize', function ($super, o) {
    $super();
    this.objectToSearchFor = o;
  });

  add.method('reachedObject', function (o) {
    if (reflect(o).parent().reflectee() === this.objectToSearchFor && reflect(o).isWellKnown('probableCreatorSlot')) {
      this._results.push(o);
    }
  });

});


thisModule.addSlots(implementorsFinder, function(add) {

  add.method('initialize', function ($super, slotName) {
    $super();
    this.slotNameToSearchFor = slotName;
  });

  add.method('inspect', function () { return "Well-known implementors of '" + this.slotNameToSearchFor + "'"; });

  add.method('reachedSlot', function (holder, slotName, contents) {
    if (slotName === this.slotNameToSearchFor && reflect(holder).isWellKnown('probableCreatorSlot')) {
      this._results.push(reflect(holder).slotAt(slotName));
    }
  });

});


thisModule.addSlots(referenceFinder, function(add) {

  add.method('initialize', function ($super, o) {
    $super();
    this.objectToSearchFor = o;
  });

  add.method('inspect', function () { return "Well-known references to " + reflect(this.objectToSearchFor).inspect(); });

  add.method('reachedSlot', function (holder, slotName, contents) {
    if (contents === this.objectToSearchFor) {
      var holderMir = reflect(holder);
      if (holderMir.isWellKnown('probableCreatorSlot')) {
        this._results.push(holderMir.slotAt(slotName));
      }
    }
  });

  add.method('reachedObject', function (o) {
    var mir = reflect(o);
    if (mir.parent().reflectee() === this.objectToSearchFor && mir.isWellKnown('probableCreatorSlot')) {
      this._results.push(mir.parentSlot());
    }
  });

});


thisModule.addSlots(objectGraphWalker, function(add) {

  add.method('create', function () {
    var w = Object.create(this);
    w.initialize.apply(w, arguments);
    return w;
  });

  add.method('initialize', function () {
    this._objectCount = 0; // just for fun;
  });

  add.data('namesToIgnore', ["__annotation__", "localStorage", "sessionStorage", "globalStorage", "enabledPlugin"], {comment: 'Having enabledPlugin in here is just a hack for now - what\'s this clientInformation thing, and what are these arrays that aren\'t really arrays?', initializeTo: '["__annotation__", "localStorage", "sessionStorage", "globalStorage", "enabledPlugin"]'});

  add.method('go', function (root) {
    this.reset();
    this._startTime = new Date().getTime();
    this.walk(root === undefined ? lobby : root, 0);
    this.undoAllMarkings();
    return this.results();
  });

  add.method('reset', function () {
    // children can override
    this._results = [];
    this._marked = [];
    this._objectCount = 0;
  });

  add.method('results', function () {
    // children can override
    return this._results;
  });

  add.method('objectCount', function () { return this._objectCount; });

  add.creator('tests', Object.create(TestCase.prototype), {category: ['tests']});

  add.method('inspect', function () {
    return reflect(this).name();
  });

  add.method('canHaveSlots', function (o) {
    if (o === null) { return false; }
    var t = typeof o;
    return t === 'object' || t === 'function';
  });

  add.method('isDOMNode', function (o) {
    // http://stackoverflow.com/questions/384286/javascript-isdom-how-do-you-check-if-a-javascript-object-is-a-dom-object
    try {
      if (typeof Node === "object" && o instanceof Node) { return true; }
      if (typeof o === "object" && typeof o.nodeType === "number" && typeof o.nodeName === "string") { return true; }
    } catch (ex) {
      // Firefox sometimes throws an exception here. Don't know why.
    }
    return false;
  });

  add.method('isDOMElement', function (o) {
    try {
      if (typeof HTMLElement       === "object" && o instanceof HTMLElement          ) { return true; }
      if (typeof HTMLIFrameElement === "object" && o instanceof HTMLIFrameElement    ) { return true; }
      if (typeof o === "object" && o.nodeType === 1 && typeof o.nodeName === "string") { return true; }
    } catch (ex) {
      // Firefox sometimes throws an exception here. Don't know why.
    }
    return false;
  });

  add.method('shouldIgnoreObject', function (o) {
    if (this.isDOMNode(o) || this.isDOMElement(o)) { return true; } // the DOM is a nightmare, stay the hell away
    return false;
  });

  add.method('markObject', function (object, howDidWeGetHere) {
    // Return false if this object has already been marked; otherwise mark it and return true.
    //
    // Would use an identity dictionary here, if JavaScript could do one. As it is, we'll
    // have to mark the annotation and then come by again and unmark it.
    var objectAnno;
    try { objectAnno = annotator.annotationOf(object); } catch (ex) { return false; } // stupid FireFox bug
    var walkers = objectAnno.walkers = objectAnno.walkers || (window.set && Object.newChildOf(set, hashTable.identityComparator)) || [];
    if (walkers.include(this)) { return false; }
    walkers.push(this);
    this._marked.push(objectAnno);
    return true;
  });

  add.method('undoAllMarkings', function () {
    // Could walk the graph again so that we don't need to create this big
    // list of marked stuff. But for now this'll do.
    if (! this._marked) { return; }
    this._marked.each(function(m) {
      if (m.walkers.remove) {
        m.walkers.remove(this);
      } else {
        m.walkers = m.walkers.without(this);
      }
    }.bind(this));
    this._marked = [];
  });

  add.method('reachedObject', function (o) {
    // children can override;
  });

  add.method('reachedSlot', function (holder, slotName, contents) {
    // children can override;
  });

  add.method('walk', function (currentObj, howDidWeGetHere) {
    if (this.shouldIgnoreObject(currentObj, howDidWeGetHere)) { return; }
    if (! this.markObject(currentObj, howDidWeGetHere)) { return; }

    this._objectCount += 1;
    this.reachedObject(currentObj, howDidWeGetHere);

    for (var name in currentObj) {
      if (currentObj.hasOwnProperty(name) && ! this.namesToIgnore.include(name)) {
        this.walkAttribute(currentObj, name, howDidWeGetHere);
      }
    }

    // Workaround for Chrome bug. -- Adam
    if (! window.prototypeAttributeIsEnumerable) {
      if (currentObj.hasOwnProperty("prototype")) {
        this.walkAttribute(currentObj, "prototype", howDidWeGetHere);
      }
    }
  });

  add.method('walkAttribute', function (currentObj, name, howDidWeGetHere) {
    var contents;
    var encounteredStupidFirefoxBug = false;
    try { contents = currentObj[name]; } catch (ex) { encounteredStupidFirefoxBug = true; }
    if (! encounteredStupidFirefoxBug) {
      this.reachedSlot(currentObj, name, contents);
      if (this.canHaveSlots(contents)) {
        var shouldWalkContents;
        // aaa - this isn't right. But I don't wanna walk all the indexables.
        try { shouldWalkContents = contents.constructor !== Array || this.shouldWalkIndexables; }
        catch (ex) { shouldWalkContents = true; } // another FireFox problem?
        if (shouldWalkContents) {
          this.walk(contents, {previous: howDidWeGetHere, slotHolder: currentObj, slotName: name});
        }
      }
    }
  });

});


thisModule.addSlots(creatorSlotMarker, function(add) {

  add.method('annotateExternalObjects', function (shouldMakeCreatorSlots, moduleForExpatriateSlots) {
    var marker = this.create();
    marker.moduleForExpatriateSlots = moduleForExpatriateSlots;
    marker.shouldMakeCreatorSlots = shouldMakeCreatorSlots;
    marker.reset();
    marker.walk(lobby);
    // aaa - WTFJS, damned for loops don't seem to see String and Number and Array and their 'prototype' slots.
    ['Object', 'String', 'Number', 'Boolean', 'Array', 'Function'].each(function(typeName) {
        var type = window[typeName];
        var pathToType          = {                       slotHolder: window, slotName:  typeName   };
        var pathToTypePrototype = { previous: pathToType, slotHolder:   type, slotName: 'prototype' };
        marker.markObject(type, pathToType, true);
        marker.markObject(type.prototype, pathToTypePrototype, true);
        marker.walk(type.prototype);
    });
  });

  add.method('markObject', function ($super, contents, howDidWeGetHere, shouldExplicitlySetIt) {
    this.reachedObject(contents, howDidWeGetHere, shouldExplicitlySetIt); // in case this is a shorter path
    return $super(contents, howDidWeGetHere);
  });

  add.method('reachedObject', function (contents, howDidWeGetHere, shouldExplicitlySetIt) {
    if (! this.shouldMakeCreatorSlots) { return; }
    if (! howDidWeGetHere) { return; }
    if (contents === window) { return; }
    var contentsAnno;
    var slotHolder = howDidWeGetHere.slotHolder;
    var slotName   = howDidWeGetHere.slotName;
    try { contentsAnno = annotator.annotationOf(contents); } catch (ex) { return false; } // stupid FireFox bug
    if (shouldExplicitlySetIt) {
      contentsAnno.setCreatorSlot(slotName, slotHolder);
    } else {
      if (! contentsAnno.explicitlySpecifiedCreatorSlot()) {
        contentsAnno.addPossibleCreatorSlot(slotName, slotHolder);
      }
    }
  });

  add.method('reachedSlot', function (holder, slotName, contents) {
    if (! this.moduleForExpatriateSlots) { return; }
    var existingSlotAnno = annotator.existingSlotAnnotation(holder, slotName);
    var slotAnno = existingSlotAnno || {};
    if (slotAnno.module) { return; }
    slotAnno.module = this.moduleForExpatriateSlots;
    annotator.annotationOf(holder).setSlotAnnotation(slotName, slotAnno);
  });

});


thisModule.addSlots(testingObjectGraphWalker, function(add) {

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

  add.method('slotCount', function (o) {
    return this._slotsReached.length;
  });

  add.method('undoAllMarkings', function () {
    // Don't undo them, so that the tests can examine the _marked list.;
  });

});


thisModule.addSlots(objectGraphWalker.tests, function(add) {

  add.method('testIncremental', function () {
    var w1 = testingObjectGraphWalker.create();
    w1.go();
    var n = 'objectGraphWalker_tests___extraSlotThatIAmAdding';
    var o = {};
    window[n] = o;
    var w2 = testingObjectGraphWalker.create();
    w2.go();
    this.assertEqual(w1.objectCount() + 1, w2.objectCount());
    delete window[n];
  });

});


});
