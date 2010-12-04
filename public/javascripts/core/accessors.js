transporter.module.create('core/accessors', function(requires) {}, function(thisModule) {


thisModule.addSlots(avocado, function(add) {
  
  add.creator('accessors', {}, {category: ['core']});
  
});


thisModule.addSlots(avocado.accessors, function(add) {
  
  add.method('forAttribute', function(obj, n) {
    return this.create(function() { return obj[n]; }, function(v) { obj[n] = v; });
  }, {category: ['creating']});
  
  add.method('forMethods', function(obj, getterName, setterName) {
    if (!setterName) { setterName = "set" + getterName.capitalize(); }
    return this.create(function() { return obj[getterName].call(obj); }, function(v) { obj[setterName].call(obj, v); });
  }, {category: ['creating']});
  
  add.method('create', function(getter, setter) {
    return Object.newChildOf(this, getter, setter);
  }, {category: ['creating']});
  
  add.method('initialize', function(getter, setter) {
    this.getter = getter;
    this.setter = setter;
  }, {category: ['creating']});
  
  add.method('get', function() {
    return this.getter();
  }, {category: ['accessing']});
  
  add.method('set', function(v) {
    return this.setter(v);
  }, {category: ['accessing']});
  
});


});
