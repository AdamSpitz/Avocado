avocado.transporter.module.create('db/abstract', function(requires) {

requires('core/collections/hash_table');

}, function(thisModule) {


thisModule.addSlots(avocado, function(add) {

  add.creator('remoteObjectReference', {}, {category: ['remote references']});

  add.creator('db', {}, {category: ['databases']});

});


thisModule.addSlots(avocado.remoteObjectReference, function(add) {

  add.creator('table', {});

  add.method('create', function (obj, realm, id) {
    return Object.newChildOf(this, obj, realm, id);
  }, {category: ['creating']});

  add.method('initialize', function (obj, realm, id) {
    this._object = obj;
    this._realm = realm;
    this._id = id;
  }, {category: ['creating']});

  add.method('object', function () { return this._object; }, {category: ['accessing']});

  add.method('realm', function () { return this._realm; }, {category: ['accessing']});

  add.method('id', function () { return this._id; }, {category: ['accessing']});

  add.method('setObject', function (o) {
    if (this._object) { throw new Error("This ref already has an object. Don't change it."); }
    this._object = o;
    avocado.remoteObjectReference.table.rememberRefForObject(o, this);
  }, {category: ['accessing']});

  add.method('setDBInfo', function (realm, id, rev) {
    if (this._realm) { throw new Error("This ref already has a DB and ID. Don't change it."); }
    this._realm = realm;
    this._id = id;
    this._rev = rev;
    realm.rememberRemoteRefForID(id, this);
  }, {category: ['accessing']});

  add.method('fetchObjectIfNotYetPresent', function (callback) {
    var obj = this.object();
    if (obj) {
      if (callback) { callback(obj); }
    } else {
      this.realm().getDocument(this.id(), callback);
    }
    return this;
  }, {category: ['objects']});

  add.method('forgetMe', function () {
    if (this._realm ) { this._realm.forgetRemoteRefForID(this._id); }
    if (this._object) { this.table.forgetRefForObject(this._object); }
  });

  add.method('expressionToRecreateRefAndFetchObject', function () {
    return ["(", this._realm.storeString(), ").remoteRefForID(", this.id().inspect(), ").fetchObjectIfNotYetPresent()"].join("");
  }, {category: ['transporting']});

});


thisModule.addSlots(avocado.remoteObjectReference.table, function(add) {

  add.data('realms', {}, {initializeTo: '{}'});

  add.method('addRealm', function (name, realm) {
    if (this.realms[name]) {
      throw new Error("Already have a realm named " + name);
      // or we could assign it a different name
    }
    
    this.realms[name] = realm;
  });

  add.method('rememberRefForObject', function (obj, ref) {
    avocado.annotator.annotationOf(obj).setRemoteRef(ref);
  });

  add.method('forgetRefForObject', function (obj) {
    avocado.annotator.annotationOf(obj).setRemoteRef(null);
  });

  add.method('existingRefForObject', function (obj) {
    return avocado.annotator.annotationOf(obj).getRemoteRef();
  });

  add.method('refForObject', function (obj) {
    var anno = avocado.annotator.annotationOf(obj);
    var ref = anno.getRemoteRef();
    if (! ref) {
      ref = avocado.remoteObjectReference.create(obj);
      anno.setRemoteRef(ref);
    }
    return ref;
  });

  add.method('findRealmReferredToAs', function (realmID, callback) {
    var colon = realmID.indexOf(":");
    var realmType = colon >= 0 ? realmID.substring(0, colon) : 'named';
    var restOfID  = colon >= 0 ? realmID.substring(colon + 1) : realmID;
    if (realmType === "named") {
      var realm = this.realms[restOfID];
      if (realm) {
        callback(realm);
        return;
      } else {
        throw new Error("No realm named " + restOfID);
      }
    } else if (realmType === "couch") {
      avocado.couch.db.findDBAtURL(restOfID, callback, function(err) { throw err; });
      return;
    }
    throw new Error("What kind of realm is this? " + realmID);
  });

  add.method('findObjectReferredToAs', function (refLiteral, callback) {
    var refLiteralObj = typeof(refLiteral) === 'string' ? JSON.parse(refLiteral) : refLiteral;
    this.findRealmReferredToAs(refLiteralObj.realm, function(realm) {
      realm.findObjectByID(refLiteralObj.id, callback);
    });
  });

});


thisModule.addSlots(avocado.annotator.objectAnnotationPrototype, function(add) {

  add.method('getRemoteRef', function () {
    return this.remoteRef;
  }, {category: ['remote references']});

  add.method('setRemoteRef', function (ref) {
    this.remoteRef = ref;
  }, {category: ['remote references']});

});


});
