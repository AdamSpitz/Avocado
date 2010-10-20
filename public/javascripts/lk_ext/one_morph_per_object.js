transporter.module.create('lk_ext/one_morph_per_object', function(requires) {}, function(thisModule) {


thisModule.addSlots(WorldMorph.prototype, function(add) {

  add.creator('morphIdentityComparator', {}, {category: ['one morph per object']});

  add.method('morphsByObject', function () {
    return this._morphsByObject || (this._morphsByObject = avocado.dictionary.copyRemoveAll(this.morphIdentityComparator));
  }, {category: ['one morph per object']});

  add.method('existingMorphFor', function (obj) {
    return this.morphsByObject().get(obj);
  }, {category: ['one morph per object']});

  add.method('morphFor', function (obj) {
    return this.morphsByObject().getOrIfAbsentPut(obj, function() {
      if (typeof(obj.newMorph) === 'function') {
        return obj.newMorph();
      } else {
        return new avocado.MessageNotifierMorph(obj.toString(), Color.yellow);
      }
    });
  });

});


thisModule.addSlots(WorldMorph.prototype.morphIdentityComparator, function(add) {

  add.method('keysAreEqual', function (k1, k2) {
    if (k1.isImmutableForMorphIdentity) { return avocado.hashTable.equalityComparator.keysAreEqual(k1, k2); }
    return k1 === k2;
  }, {category: ['hashing']});

  add.method('hashCodeForKey', function (k) {
    if (k1.isImmutableForMorphIdentity) { return avocado.hashTable.equalityComparator.hashCodeForKey(k); }
    // aaa - Blecch, why does JS not support identity hashes?
    return 42;
  }, {category: ['hashing']});

});


});
