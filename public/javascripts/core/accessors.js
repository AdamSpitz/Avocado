avocado.transporter.module.create('core/accessors', function(requires) {

requires('core/value_holder');

}, function(thisModule) {


thisModule.addSlots(avocado, function(add) {

  add.creator('accessors', Object.create(avocado.generalValueHolder), {category: ['core']});

});


thisModule.addSlots(avocado.accessors, function(add) {

  add.method('forAttribute', function (obj, n) {
    return avocado.attributeAccessors.create(obj, n);
  }, {category: ['creating']});

  add.method('forMethods', function (obj, getterName, setterName) {
    return avocado.methodAccessors.create(obj, getterName, setterName);
  }, {category: ['creating']});

  add.method('create', function () {
    var c = Object.create(this);
    c.initialize.apply(c, arguments);
    return c;
  }, {category: ['creating']});

  add.method('initialize', function (getter, setter) {
    this.get = getter;
    this.set = setter;
  }, {category: ['creating']});

  add.method('canGet', function () {
    return !! this.get;
  }, {category: ['testing']});

  add.method('canSet', function () {
    return !! this.set;
  }, {category: ['testing']});

  add.method('getValue', function () {
    return this.get();
  }, {category: ['accessing']});

  add.method('setValue', function (v) {
    this.set(v);
    return this;
  }, {category: ['accessing']});

  add.creator('tests', Object.create(avocado.testCase), {category: ['tests']});

});


thisModule.addSlots(avocado.accessors.tests, function(add) {

  add.method('testRawFunctions', function () {
    var i = 0;
    var a = avocado.accessors.create(function() { return i; }, function(n) { i = n; });
    this.assertEqual(0, a.get());
    a.set(77);
    this.assertEqual(77, a.get());
    this.assertEqual(77, i);
    this.assert(a.canGet());
    this.assert(a.canSet());
    
    var a2 = avocado.accessors.create(function() { return i + 6; });
    this.assertEqual(83, a2.get());
    this.assert( a2.canGet());
    this.assert(!a2.canSet());
    this.assertThrowsException(function() { a2.set(11); });
    this.assertEqual(77, i);

    var a3 = avocado.accessors.create(null, function(n) { i = n - 8; });
    this.assert(!a3.canGet());
    this.assert( a3.canSet());
    a3.set(55);
    this.assertEqual(47, i);
  });

  add.method('testAttributeAccessors', function () {
    var o = {i: 0};
    var a = avocado.accessors.forAttribute(o, 'i');
    this.assertEqual(0, a.get());
    a.set(77);
    this.assertEqual(77, a.get());
    this.assertEqual(77, o.i);
    this.assert(a.canGet());
    this.assert(a.canSet());
  });

  add.method('testMethodAccessors', function () {
    var o = { _v: 0, value: function() { return this._v; }, setValue: function(v) { this._v = v; }, setValueToHalfOf: function(w) { this._v = w / 2; } };
    var a = avocado.accessors.forMethods(o, 'value');
    this.assertEqual(0, a.get());
    a.set(77);
    this.assertEqual(77, a.get());
    this.assertEqual(77, o._v);
    this.assert(a.canGet());
    this.assert(a.canSet());
    
    var a2 = avocado.accessors.forMethods(o, 'value', 'setValueToHalfOf');
    this.assertEqual(77, a2.get());
    this.assert(a2.canGet());
    this.assert(a2.canSet());
    a2.set(66);
    this.assertEqual(33, a2.get());
    this.assertEqual(33, o._v);

    var a3 = avocado.accessors.forMethods(o, 'bleh', 'argle');
    this.assert(!a3.canGet());
    this.assert(!a3.canSet());
    this.assertThrowsException(function() { a3.get(  ); });
    this.assertThrowsException(function() { a3.set(22); });
  });

});


thisModule.addSlots(avocado, function(add) {

  add.creator('methodAccessors', Object.create(avocado.accessors), {category: ['core']});

});


thisModule.addSlots(avocado.methodAccessors, function(add) {

  add.method('initialize', function (obj, getterName, setterName) {
    this._object = obj;
    this._getterName = getterName;
    this._setterName = setterName || "set" + getterName.capitalize();
  }, {category: ['creating']});

  add.method('get', function () {
    var obj = this._object;
    var getter = obj[this._getterName];
    if (!getter) { throw new Error("No attribute named " + this._getterName + " on " + obj); }
    return getter.apply(obj, arguments);
  }, {category: ['accessing']});

  add.method('set', function (v) {
    var obj = this._object;
    var setter = obj[this._setterName];
    if (!setter) { throw new Error("No attribute named " + this._setterName + " on " + obj); }
    setter.apply(obj, arguments);
    if (this._notifier) { this._notifier.notifyAllObservers(); }
    return obj;
  }, {category: ['accessing']});

  add.method('canGet', function () {
    return !! this._object[this._getterName];
  }, {category: ['testing']});

  add.method('canSet', function () {
    return !! this._object[this._setterName];
  }, {category: ['testing']});

});


thisModule.addSlots(avocado, function(add) {

  add.creator('attributeAccessors', Object.create(avocado.accessors), {category: ['core']});

});


thisModule.addSlots(avocado.attributeAccessors, function(add) {

  add.method('initialize', function (obj, attrName) {
    this._object = obj;
    this._attrName = attrName;
  }, {category: ['creating']});

  add.method('get', function () {
    return this._object[this._attrName];
  }, {category: ['accessing']});

  add.method('set', function (v) {
    this._object[this._attrName] = v;
  }, {category: ['accessing']});

  add.method('canGet', function () {
    return true;
  }, {category: ['testing']});

  add.method('canSet', function () {
    return true;
  }, {category: ['testing']});

});


});
