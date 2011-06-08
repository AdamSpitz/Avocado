avocado.transporter.module.create('core/types', function(requires) {

requires('core/exit');

}, function(thisModule) {


thisModule.addSlots(avocado, function(add) {

  add.creator('types', {}, {category: ['core']});

});


thisModule.addSlots(avocado.types, function(add) {

  add.creator('general', {});

  add.creator('collection', Object.create(avocado.types.general));

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


});
