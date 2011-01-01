transporter.module.create('db/abstract', function(requires) {}, function(thisModule) {


thisModule.addSlots(avocado, function(add) {

  add.creator('objectsAndDBsAndIDs', {}, {category: ['databases']});

});


thisModule.addSlots(avocado.objectsAndDBsAndIDs, function(add) {
  
  add.data('entries', [], {initializeTo: '[]'});
  
  add.creator('entry', {});
  
  add.method('rememberObject', function (obj, db, id) {
    var existingEntry = this.entryForObject(obj);
    if (existingEntry) {
      if (db !== existingEntry._db) { throw new Error("Already have an entry for " + obj + ", but it's for a different database: "  + existingEntry._db + " instead of " + db); } 
      if (id !== existingEntry._id) { throw new Error("Already have an entry for " + obj + ", but it's got a different object ID: " + existingEntry._id + " instead of " + id); } 
      return existingEntry;
    }
    
    var newEntry = Object.newChildOf(this.entry, obj, db, id);
    this.entries.push(newEntry);
    return newEntry;
  });
  
  add.method('entryForObject', function (obj) {
    for (var i = 0, n = this.entries.length; i < n; ++i) {
      var entry = this.entries[i];
      if (entry._object === obj) { return entry; }
    }
    return null;
  });
  
  add.method('entryForDBAndID', function (db, id) {
    for (var i = 0, n = this.entries.length; i < n; ++i) {
      var entry = this.entries[i];
      if (entry._db === db && entry._id === id) { return entry; }
    }
    return null;
  });
  
  add.method('findObjectForDBAndID', function (db, id, callback) {
    var entry = this.entryForDBAndID(db, id);
    if (entry) { callback(entry._object); return; }
    db.findObjectByID(id, callback);
  });
  
  add.method('findDBReferredToAs', function (ref, callback) {
    if (ref.startsWith("couch:")) {
      avocado.couch.db.findDBAtURL(ref.substr("couch:".length), callback);
      return;
    }
    throw new Error("What kind of DB is this? " + ref);
  });
  
  add.method('findObjectReferredToAs', function (ref, callback) {
    if (typeof(ref) === 'string') { ref = JSON.parse(ref); }
    this.findDBReferredToAs(ref.db, function(db) {
      this.findObjectForDBAndID(db, ref.id, callback);
    }.bind(this));
  });

});


thisModule.addSlots(avocado.objectsAndDBsAndIDs, function(add) {
  
  add.method('initialize', function (obj, db, id) {
    this._object = obj;
    this._db = db;
    this._id = id;
  });
  
});


});
