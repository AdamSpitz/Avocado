transporter.module.create('core/accessors', function(requires) {}, function(thisModule) {


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

});


thisModule.addSlots(avocado.methodAccessors, function(add) {

  add.method('initialize', function (obj, getterName, setterName) {
    this._object = obj;
    this._getterName = getterName;
    this._setterName = setterName || "set" + getterName.capitalize();
  }, {category: ['creating']});

  add.method('get', function () {
    var obj = this._object;
    return obj[this._getterName].call(obj);
  }, {category: ['accessing']});

  add.method('set', function (v) {
    var obj = this._object;
    obj[this._setterName].call(obj, v);
  }, {category: ['accessing']});
  
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
  
});



});
