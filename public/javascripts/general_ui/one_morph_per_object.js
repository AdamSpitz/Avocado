avocado.transporter.module.create('general_ui/one_morph_per_object', function(requires) {

requires('general_ui/basic_morph_mixins');

}, function(thisModule) {


thisModule.addSlots(avocado.morphMixins.WorldMorph, function(add) {

  add.data('_morphsByObject', null, {category: ['one morph per object'], initializeTo: 'null'});

  add.method('morphsByObject', function () {
    return this._morphsByObject || (this._morphsByObject = avocado.dictionary.copyRemoveAll(avocado.morphIdentityComparator));
  }, {category: ['one morph per object']});

  add.method('existingMorphFor', function (obj) {
    return this.morphsByObject().get(obj);
  }, {category: ['one morph per object']});

  add.method('forgetAboutExistingMorphFor', function (obj, expectedOne) {
    var existingOne = this.morphsByObject().get(obj);
    if (existingOne === expectedOne) { this.morphsByObject().removeKey(obj); }
  }, {category: ['one morph per object']});

  add.method('morphFor', function (obj) {
    return this.morphsByObject().getOrIfAbsentPut(obj, function() {
      return this.newMorphFor(obj);
    }.bind(this));
  }, {category: ['one morph per object']});

  add.method('newMorphFor', function (obj) {
    var isNullOrUndefined = obj === null || typeof(obj) === 'undefined';
    if (!isNullOrUndefined && typeof(obj.newMorph) === 'function') {
      return obj.newMorph();
    } else {
      var str = isNullOrUndefined ? "" + obj : obj.toString();
      return avocado.messageNotifier.create(str, Color.yellow.lighter()).newMorph().setModel(obj);
    }
  }, {category: ['one morph per object']});

  add.method('rememberMorphFor', function (obj, morph) {
    this.morphsByObject().put(obj, morph);
    return morph;
  }, {category: ['one morph per object']});

});


thisModule.addSlots(avocado, function(add) {

  add.creator('morphIdentityComparator', {}, {category: ['user interface', 'one morph per object']});

});


thisModule.addSlots(avocado.morphIdentityComparator, function(add) {

  add.method('keysAreEqual', function (k1, k2) {
    var c = (k1 !== null && typeof(k1) !== 'undefined' && k1.isImmutableForMorphIdentity) ? avocado.hashTable.equalityComparator : avocado.hashTable.identityComparator;
    return c.keysAreEqual(k1, k2);
  }, {category: ['hashing']});

  add.method('hashCodeForKey', function (k) {
    var c = (k !== null && typeof(k) !== 'undefined' && k.isImmutableForMorphIdentity) ? avocado.hashTable.equalityComparator : avocado.hashTable.identityComparator;
    return c.hashCodeForKey(k);
  }, {category: ['hashing']});

});


thisModule.addSlots(avocado.morphMixins.Morph, function(add) {

  add.method('actualMorphToShow', function (context) {
    // If this morph is already elsewhere in the world, don't yank it from there, just show a placeholder.
    if (typeof(this._model) !== 'undefined' && (!this.ownerChainIncludes(context)) && this.world()) {
      return context.placeholderForMorph(this);
    }
    
    return this;
  });

  add.method('placeholdersByMorph', function () {
    return this._placeholdersByMorph || (this._placeholdersByMorph = avocado.dictionary.copyRemoveAll(avocado.dictionary.identityComparator));
  }, {category: ['one morph per object']});

  add.method('placeholderForMorph', function (morph) {
    return this.placeholdersByMorph().getOrIfAbsentPut(morph, function() {
      return avocado.placeholder.newPlaceholderMorphForMorph(morph);
    });
  }, {category: ['one morph per object']});

});


});
