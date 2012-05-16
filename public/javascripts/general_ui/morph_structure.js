avocado.transporter.module.create('general_ui/morph_structure', function(requires) {

requires('general_ui/basic_morph_mixins');

}, function(thisModule) {


thisModule.addSlots(avocado.morphMixins.Morph, function(add) {

  add.method('isSameTypeAs', function (m) {
    return m && m['__proto__'] === this['__proto__'];
  }, {category: ['morph structure']});

  add.method('ownerSatisfying', function (condition) {
    var o = this.getOwner();
    if (!o) { return null; }
    if (condition(o)) { return o; }
    return o.ownerSatisfying(condition);
  }, {category: ['morph structure']});

  add.method('ownerWithAModel', function () {
    if (typeof(this._model) !== 'undefined') { return this; }
    return this.ownerSatisfying(function(m) { return typeof(m._model) !== 'undefined'; });
  }, {category: ['morph structure']});

  add.method('outermostOwner', function () {
    var m = this;
    while (m) {
      var o = m.getOwner();
      if (!o || o.isWorld) { return m; }
      m = o;
    }
    throw new Error("Should never get here.");
  }, {category: ['morph structure']});

  add.method('submorphEnumerator', function () {
    return avocado.enumerator.create(this, 'eachSubmorph');
  }, {category: ['morph structure']});

  add.method('eachSubmorphRecursively', function (f) {
    this.eachSubmorph(function(m) {
      f(m);
      m.eachSubmorphRecursively(f);
    });
  }, {category: ['morph structure']});

  add.method('submorphsRecursively', function () {
    return avocado.enumerator.create(this, 'eachSubmorphRecursively');
  }, {category: ['morph structure']});

  add.method('ownerChainIncludes', function (m) {
    var o = this.getOwner();
    while (o) {
      if (o === m) { return true; }
      o = o.getOwner();
    }
    return false;
  }, {category: ['morph structure']});

  add.method('eachOwnerRecursively', function (f) {
    var o = this.getOwner();
    while (o) {
      f(o);
      o = o.getOwner();
    }
  }, {category: ['morph structure']});

  add.method('ownersRecursively', function () {
    return avocado.enumerator.create(this, 'eachOwnerRecursively');
  }, {category: ['morph structure']});

  add.method('detachSubmorphsSatisfying', function (criterion) {
    var world = this.world();
    if (world) {
      this.eachSubmorph(function(m) {
        if (criterion(m)) {
          world.addMorphAt(m, this.worldPoint(m.getPosition()));
        }
      }.bind(this));
    }
  }, {category: ['morph structure']});

});


});
