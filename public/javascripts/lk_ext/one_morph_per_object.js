avocado.transporter.module.create('lk_ext/one_morph_per_object', function(requires) {

}, function(thisModule) {


thisModule.addSlots(WorldMorph.prototype, function(add) {

  add.creator('morphIdentityComparator', {}, {category: ['one morph per object']});

  add.data('_morphsByObject', null, {category: ['one morph per object'], initializeTo: 'null'});
  
  add.method('morphsByObject', function () {
    return this._morphsByObject || (this._morphsByObject = avocado.dictionary.copyRemoveAll(this.morphIdentityComparator));
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
    if (typeof(obj.newMorph) === 'function') {
      return obj.newMorph();
    } else {
      var m = new avocado.MessageNotifierMorph(obj.toString(), Color.yellow);
      m._model = obj;
      return m;
    }
  }, {category: ['one morph per object']});

  add.method('rememberMorphFor', function (obj, morph) {
    this.morphsByObject().put(obj, morph);
    return morph;
  }, {category: ['one morph per object']});

});


thisModule.addSlots(WorldMorph.prototype.morphIdentityComparator, function(add) {

  add.method('keysAreEqual', function (k1, k2) {
    var c = k1.isImmutableForMorphIdentity ? avocado.hashTable.equalityComparator : avocado.hashTable.identityComparator;
    return c.keysAreEqual(k1, k2);
  }, {category: ['hashing']});

  add.method('hashCodeForKey', function (k) {
    var c = (k !== null && typeof(k) !== 'undefined' && k.isImmutableForMorphIdentity) ? avocado.hashTable.equalityComparator : avocado.hashTable.identityComparator;
    return c.hashCodeForKey(k);
  }, {category: ['hashing']});

});


thisModule.addSlots(Morph.prototype, function(add) {

  add.method('actualMorphToShow', function (context) {
    // If this morph is already elsewhere in the world, don't yank it from there, just show a placeholder.
    var thisMorph = this;
    if (typeof(this._model) !== 'undefined' && (!this.ownerChainIncludes(context)) && this.world()) {
      return context.placeholderForMorph(thisMorph);
    }
    
    return this;
  });
  
  add.method('placeholdersByMorph', function () {
    return this._placeholdersByMorph || (this._placeholdersByMorph = avocado.dictionary.copyRemoveAll(avocado.dictionary.identityComparator));
  }, {category: ['one morph per object']});
  
  add.method('placeholderForMorph', function (morph) {
    return this.placeholdersByMorph().getOrIfAbsentPut(morph, function() { console.log("Showing placeholder instead of " + morph); return new avocado.PlaceholderMorph(morph); });
  }, {category: ['one morph per object']});

});


});
