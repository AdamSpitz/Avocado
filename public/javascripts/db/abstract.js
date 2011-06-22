avocado.transporter.module.create('db/abstract', function(requires) {

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


thisModule.addSlots(avocado.annotator.objectAnnotationPrototype, function(add) {
  
  add.method('getDBRef', function () {
    return this.dbRef;
  }, {category: ['databases']});
  
  add.method('setDBRef', function (ref) {
    this.dbRef = ref;
  }, {category: ['databases']});
  
});


thisModule.addSlots(avocado.remoteObjectReference.table, function(add) {

  add.data('databases', [], {initializeTo: '[]'});

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
    avocado.annotator.annotationOf(obj).setDBRef(ref);
  });

  add.method('forgetRefForObject', function (obj) {
    avocado.annotator.annotationOf(obj).setDBRef(null);
  });

  add.method('existingRefForObject', function (obj) {
    return avocado.annotator.annotationOf(obj).getDBRef();
  });

  add.method('refForObject', function (obj) {
    var anno = avocado.annotator.annotationOf(obj);
    var ref = anno.getDBRef();
    if (! ref) {
      ref = avocado.remoteObjectReference.create(obj);
      anno.setDBRef(ref);
    }
    return ref;
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
