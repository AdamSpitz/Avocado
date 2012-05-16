avocado.transporter.module.create('core/deep_copy', function(requires) {

}, function(thisModule) {


thisModule.addSlots(avocado, function(add) {

  add.creator('deepCopier', {}, {category: ['core']}, {comment: 'Does a deep copy, recursing into creator slots. This is not *always* what you want in a deep copy, but often it is.'});

});


thisModule.addSlots(avocado.deepCopier, function(add) {

  add.method('create', function () {
    return Object.newChildOf(this);
  }, {category: ['creating']});

  add.method('initialize', function () {
    this._originalsAndCopies = [];
  }, {category: ['creating']});

  add.method('copy', function (o) {
    var c = this.createCopyOf(o);
    this.fixInternalReferences(c);
    return c;
  }, {category: ['copying']});

  add.method('createCopyOf', function (o) {
    if (o === null) { return o; }
    
    if (this._debugMode) { console.log("Calling createCopyOf " + reflect(o).inspect()); }
    
    var t = typeof(o);
    var isObj  = t === 'object';
    var isFunc = t === 'function';
    if (isObj || isFunc) {
      var c;
      if (typeof(o.duplicate) === 'function') { // aaa hack, just for now until morphs can be copied the normal way
        c = o.duplicate(this);
      } else {
        var isArray = isObj && (o instanceof Array);
        c = isObj ? (isArray ? [] : Object.create(o['__proto__'])) : eval("(" + o.toString() + ")");
        var thisCopier = this;
        for (var n in o) {
          if (o.hasOwnProperty(n)) {
            var contents = o[n];
            if (n === '__annotation__') {
              c[n] = contents.copy();
            } else {
              var contentsType = typeof(contents);
              var contentsCreatorSlot = (contentsType === 'object' || contentsType === 'function') && avocado.annotator.theCreatorSlotOf(contents);
              if (contentsCreatorSlot && contentsCreatorSlot.name === n && contentsCreatorSlot.holder === o) {
                c[n] = thisCopier.createCopyOf(contents);
                avocado.annotator.annotationOf(c[n]).setCreatorSlot(n, c);
              } else {
                c[n] = contents;
              }
            }
          }
        }
      }
      this.recordOriginalAndCopy(o, c);
      return c;
    } else {
      return o;
    }
  }, {category: ['copying']});

  add.method('recordOriginalAndCopy', function (o, c) {
    if (! this._originalsAndCopies) { this._originalsAndCopies = []; }
    this._originalsAndCopies.push({original: o, copy: c});
    return this;
  }, {category: ['internal references']});

  add.method('fixInternalReferences', function (c) {
    if (! this._originalsAndCopies) { return; }
    
    if (c === null) { return c; }
    
    if (this._debugMode) { console.log("Calling fixInternalReferences " + reflect(c).inspect()); }
    
    var t = typeof(c);
    var isObj  = t === 'object';
    var isFunc = t === 'function';
    if (isObj || isFunc) {
      var thisCopier = this;
      var originalsAndCopies = this._originalsAndCopies;
      var originalsAndCopiesCount = originalsAndCopies.length;
      for (var n in c) {
        if (c.hasOwnProperty(n)) {
          if (n === '__annotation__') {
            // just ignore it, no refs to fix up, I think - oh, actually, could do the creator slot, but we've already done it up above
          } else {
            var contents = c[n];
            var contentsType = typeof(contents);
            if (contentsType === 'object' || contentsType === 'function') {
              var wasInternalRef = false;
              for (var i = 0; i < originalsAndCopiesCount; ++i) {
                var r = originalsAndCopies[i];
                if (contents === r.original) {
                  c[n] = r.copy;
                  wasInternalRef = true;
                  break;
                }
              }
              var contentsCreatorSlot = avocado.annotator.theCreatorSlotOf(contents);
              if (contentsCreatorSlot && contentsCreatorSlot.name === n && contentsCreatorSlot.holder === c) {
                thisCopier.fixInternalReferences(c[n]);
              }
            }
          }
        }
      }
    }
  }, {category: ['internal references']});

  add.creator('tests', Object.create(avocado.testCase), {category: ['tests']});

});


thisModule.addSlots(avocado.deepCopier.tests, function(add) {

  add.creator('objectWithNoSubObjects', {});

  add.creator('objectWithSubObjects', {});

  add.creator('objectWithSubObjectsAndInternalReferences', {});

  add.method('testSimpleObject', function () {
    var o = this.objectWithNoSubObjects;
    var c = Object.deepCopyRecursingIntoCreatorSlots(o);
    this.assert(c !== o);
    this.assertEqual(3, c.x);
    this.assertEqual('four', c.y);
    this.assert(c.externalRef === avocado.deepCopier.tests.objectWithSubObjects);
  });

  add.method('testObjectWithSubObjects', function () {
    var o = this.objectWithSubObjects;
    var c = Object.deepCopyRecursingIntoCreatorSlots(o);
    this.assert(c !== o);
    this.assertEqual(5, c.x);
    this.assertEqual(true, c.b);
    this.assert(c.m !== o.m);
    this.assertEqual(o.m.toString(), c.m.toString());
    this.assertEqual(15, o.m(4, 5, 6));
    this.assertEqual(15, c.m(4, 5, 6));
    this.assert(c.subObj !== o.subObj);
    this.assertEqual('uiop', c.subObj.qwerty);
    this.assert(c.subObj.subSubObj !== o.subObj.subSubObj);
    this.assertEqual(111, c.subObj.subSubObj.zxcv);
  });

  add.method('testObjectWithSubObjectsAndInternalReferences', function () {
    var o = this.objectWithSubObjectsAndInternalReferences;
    var c = Object.deepCopyRecursingIntoCreatorSlots(o);
    this.assert(c !== o);
    this.assertEqual(1, c.a);
    this.assert(c.subObj !== o.subObj);
    this.assertEqual(24, c.subObj.x);
    this.assert(c.subObj === c.internalRefToSubObj);
    this.assert(c === c.subObj.internalRefToRootObj);
  });

});


thisModule.addSlots(avocado.deepCopier.tests.objectWithNoSubObjects, function(add) {

  add.data('x', 3);

  add.data('y', 'four');

  add.data('externalRef', avocado.deepCopier.tests.objectWithSubObjects);

});


thisModule.addSlots(avocado.deepCopier.tests.objectWithSubObjects, function(add) {

  add.data('x', 5);

  add.data('b', true);

  add.method('m', function (a1, a2, a3) {
    return a1 + a2 + a3;
  });

  add.creator('subObj', {});

});


thisModule.addSlots(avocado.deepCopier.tests.objectWithSubObjects.subObj, function(add) {

  add.data('qwerty', 'uiop');

  add.creator('subSubObj', {});

});


thisModule.addSlots(avocado.deepCopier.tests.objectWithSubObjects.subObj.subSubObj, function(add) {

  add.data('zxcv', 111);

});


thisModule.addSlots(avocado.deepCopier.tests.objectWithSubObjectsAndInternalReferences, function(add) {

  add.data('a', 1);

  add.creator('subObj', {});

  add.data('internalRefToSubObj', avocado.deepCopier.tests.objectWithSubObjectsAndInternalReferences.subObj);

});


thisModule.addSlots(avocado.deepCopier.tests.objectWithSubObjectsAndInternalReferences.subObj, function(add) {

  add.data('x', 24);

  add.data('internalRefToRootObj', avocado.deepCopier.tests.objectWithSubObjectsAndInternalReferences);

});


thisModule.addSlots(Object, function(add) {

  add.method('deepCopyRecursingIntoCreatorSlots', function (o) {
    return avocado.deepCopier.create().copy(o);
  });

});


});
