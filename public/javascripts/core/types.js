avocado.transporter.module.create('core/types', function(requires) {

}, function(thisModule) {


thisModule.addSlots(avocado, function(add) {

  add.creator('types', {}, {category: ['core']});

});


thisModule.addSlots(avocado.types, function(add) {

  add.method('checkToSeeIfTypeMatches', function (type, obj) {
    if (!type) { return false; } // Or should it return true? But I think I'd kinda rather have to explicitly specify an "anything" type.
    if (typeof(type.doesTypeMatch) === 'function') {
      return type.doesTypeMatch(obj);
    } else if (typeof(type) === 'function') {
      return type(obj);
    } else {
      return Object.inheritsFrom(type, obj);
    }
  }, {category: ['checking']});

  add.creator('general', {});

});


thisModule.addSlots(avocado.types.general, function(add) {

  add.method('defaultValue', function () {
    return undefined;
  }, {category: ['default values']});

});


thisModule.addSlots(avocado.types, function(add) {

  add.creator('bool', Object.create(avocado.types.general), {}, {comment: 'Some JS tools don\'t like it if I call it "boolean" - reserved word or something.'});

});


thisModule.addSlots(avocado.types.bool, function(add) {

  add.method('defaultValue', function () {
    return false;
  }, {category: ['default values']});

  add.method('doesTypeMatch', function (o) {
    return typeof(o) === 'boolean';
  }, {category: ['testing']});

});


thisModule.addSlots(avocado.types, function(add) {

  add.creator('number', Object.create(avocado.types.general));

});


thisModule.addSlots(avocado.types.number, function(add) {

  add.method('doesTypeMatch', function (o) {
    return typeof(o) === 'number';
  }, {category: ['testing']});

  add.method('objectForString', function (s) {
    return Number(s);
  }, {category: ['converting']});

});


thisModule.addSlots(avocado.types, function(add) {

  add.creator('string', Object.create(avocado.types.general));

});


thisModule.addSlots(avocado.types.string, function(add) {

  add.method('doesTypeMatch', function (o) {
    return typeof(o) === 'string';
  }, {category: ['testing']});

  add.method('objectForString', function (s) {
    return s;
  }, {category: ['converting']});

});


thisModule.addSlots(avocado.types, function(add) {

  add.creator('shortString', Object.create(avocado.types.string));

  add.creator('longString', Object.create(avocado.types.string));

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


thisModule.addSlots(avocado.types, function(add) {

  add.creator('mirror', Object.create(avocado.types.general));

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
    return !this._reflecteeType || this._reflecteeType.doesTypeMatch(o.reflectee());
  }, {category: ['testing']});

});


thisModule.addSlots(avocado.types, function(add) {

  add.creator('enumeration', Object.create(avocado.types.general));

});


thisModule.addSlots(avocado.types.enumeration, function(add) {

  add.method('forPossibilities', function (possibilities) {
    return Object.newChildOf(this, possibilities);
  }, {category: ['creating']});

  add.method('initialize', function (possibilities) {
    this._possibilities = possibilities;
  }, {category: ['creating']});

  add.method('doesTypeMatch', function (o) {
    return this._possibilities.include(o);
  }, {category: ['testing']});

  add.creator('prompterProto', {}, {category: ['prompting']});

  add.method('prompter', function () {
    return Object.newChildOf(this.prompterProto, this._possibilities);
  });

});


thisModule.addSlots(avocado.types.enumeration.prompterProto, function(add) {

  add.method('initialize', function (possibilities) {
    this._possibilities = possibilities;
  });

});


});
