avocado.transporter.module.create('core/types', function(requires) {

}, function(thisModule) {


thisModule.addSlots(avocado, function(add) {

  add.creator('types', {}, {category: ['core']});

});


thisModule.addSlots(avocado.types, function(add) {

  add.creator('general', {});

  add.creator('boolean', Object.create(avocado.types.general));

  add.creator('string', Object.create(avocado.types.general));
  
  add.creator('shortString', Object.create(avocado.types.string));

  add.creator('longString', Object.create(avocado.types.string));

  add.creator('collection', Object.create(avocado.types.general));

  add.creator('mirror', Object.create(avocado.types.general));

});


thisModule.addSlots(avocado.types.boolean, function(add) {

  add.method('doesTypeMatch', function (o) {
    return typeof(o) === 'boolean';
  }, {category: ['testing']});
  
});


thisModule.addSlots(avocado.types.string, function(add) {

  add.method('doesTypeMatch', function (o) {
    return typeof(o) === 'string';
  }, {category: ['testing']});
  
});


thisModule.addSlots(avocado.types.collection, function(add) {

  add.method('of', function (elemType) {
    return Object.newChildOf(this, elemType);
  }, {category: ['creating']});

  add.method('initialize', function (elemType) {
    this._elemType = elemType;
  }, {category: ['creating']});

  add.method('doesTypeMatch', function (o) {
    if (!o) { return false; }
    if (typeof(o.each) !== 'function') { return false; }
    var elemType = this._elemType;
    return exitValueOf(function(exit) {
      o.each(function(elem) {
        if (! elemType.doesTypeMatch(elem)) { exit(false); }
      });
      return true;
    });
  }, {category: ['testing']});

});


thisModule.addSlots(avocado.types.mirror, function(add) {

  add.method('onReflecteeOfType', function (reflecteeType) {
    return Object.newChildOf(this, reflecteeType);
  }, {category: ['creating']});

  add.method('initialize', function (reflecteeType) {
    this._reflecteeType = reflecteeType;
  }, {category: ['creating']});

  add.method('doesTypeMatch', function (o) {
    if (!o) { return false; }
    if (typeof(o.reflectee) !== 'function') { return false; }
    return this._reflecteeType.doesTypeMatch(o.reflectee());
  }, {category: ['testing']});

});


});
