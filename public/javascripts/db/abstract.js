transporter.module.create('db/abstract', function(requires) {

requires('core/hash_table');

}, function(thisModule) {


thisModule.addSlots(avocado, function(add) {

  add.creator('remoteObjectReference', {}, {category: ['databases']});

  add.creator('db', {}, {category: ['databases']});

});


thisModule.addSlots(avocado.remoteObjectReference, function(add) {

  add.creator('table', {});

  add.method('create', function (obj, db, id) {
    return Object.newChildOf(this, obj, db, id);
  }, {category: ['creating']});

  add.method('initialize', function (obj, db, id) {
    this._object = obj;
    this._db = db;
    this._id = id;
  }, {category: ['creating']});

  add.data('isRemoteReference', true, {category: ['testing']});

  add.method('object', function () { return this._object; }, {category: ['accessing']});

  add.method('db', function () { return this._db; }, {category: ['accessing']});

  add.method('id', function () { return this._id; }, {category: ['accessing']});

  add.method('rev', function () { return this._rev; }, {category: ['accessing']});

  add.method('setObject', function (o) {
    if (this._object) { throw new Error("This ref already has an object. Don't change it."); }
    this._object = o;
    avocado.remoteObjectReference.table.rememberRefForObject(o, this)
  }, {category: ['accessing']});

  add.method('setDBInfo', function (db, id, rev) {
    if (this._db) { throw new Error("This ref already has a DB and ID. Don't change it."); }
    this._db = db;
    this._id = id;
    this._rev = rev;
    db.rememberRemoteRefForID(id, this);
  }, {category: ['accessing']});

  add.method('setRev', function (rev) {
    this._rev = rev;
  }, {category: ['accessing']});

  add.method('fetchObjectIfNotYetPresent', function (callback) {
    var obj = this.object();
    if (obj) {
      if (callback) { callback(obj); }
    } else {
      this.db().getDocument(this.id(), callback);
    }
    return this;
  }, {category: ['objects']});

  add.method('forgetMe', function () {
    if (this._db)     { this._db.forgetRemoteRefForID(this._id); }
    if (this._object) { this.table.forgetRefForObject(this._object); }
  });
  
  add.method('expressionToRecreateRefAndFetchObject', function () {
    return ["(", this._db.storeString(), ").remoteRefForID(", this.id().inspect(), ").fetchObjectIfNotYetPresent()"].join("");
  }, {category: ['transporting']});

});


thisModule.addSlots(avocado.remoteObjectReference.table, function(add) {

  add.data('databases', [], {initializeTo: '[]'});

  add.data('refsByObject', avocado.dictionary.copyRemoveAll(avocado.dictionary.identityComparator), {initializeTo: 'avocado.dictionary.copyRemoveAll(avocado.dictionary.identityComparator)'});

  add.method('addDatabase', function (db) {
    if (! this.databases.include(db)) {
      this.databases.push(db);
    }
  });

  add.method('eachRef', function (f) {
    this.databases.each(function(db) {
      db.eachRef(f);
    });
  });

  add.method('refs', function (f) {
    return avocado.enumerator.create(this, 'eachRef');
  });

  add.method('rememberRefForObject', function (obj, ref) {
    this.refsByObject.put(obj, ref);
  });

  add.method('forgetRefForObject', function (obj) {
    this.refsByObject.removeKey(obj);
  });

  add.method('refForObject', function (obj) {
    return this.refsByObject.getOrIfAbsentPut(obj, function() {
      return avocado.remoteObjectReference.create(obj);
    });
  });

  add.method('existingRefForObject', function (obj) {
    return this.refsByObject.get(obj);
  });

  add.method('findDBReferredToAs', function (ref, callback) {
    if (ref.startsWith("couch:")) {
      avocado.couch.db.findDBAtURL(ref.substr("couch:".length), callback);
      return;
    }
    throw new Error("What kind of DB is this? " + ref);
  });

  add.method('findObjectReferredToAs', function (refLiteral, callback) {
    var refLiteralObj = typeof(refLiteral) === 'string' ? JSON.parse(refLiteral) : refLiteral;
    this.findDBReferredToAs(refLiteralObj.db, function(db) {
      db.findObjectByID(refLiteralObj.id, callback);
    });
  });

});


});
