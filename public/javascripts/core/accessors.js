avocado.transporter.module.create('core/accessors', function(requires) {

}, function(thisModule) {


thisModule.addSlots(avocado, function(add) {

  add.creator('accessors', {}, {category: ['core']});

  add.creator('methodAccessors', Object.create(avocado.accessors), {category: ['core']});

  add.creator('attributeAccessors', Object.create(avocado.accessors), {category: ['core']});

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
    return getter.call(obj);
  }, {category: ['accessing']});

  add.method('set', function (v) {
    var obj = this._object;
    var setter = obj[this._setterName];
    if (!setter) { throw new Error("No attribute named " + this._setterName + " on " + obj); }
    setter.call(obj, v);
  }, {category: ['accessing']});
  
  add.method('canGet', function () {
    return !! this._object[this._getterName];
  }, {category: ['testing']});
  
  add.method('canSet', function () {
    return !! this._object[this._setterName];
  }, {category: ['testing']});

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
