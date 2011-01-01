transporter.module.create('db/couch', function(requires) {

requires('core/testFramework');
requires('transporter/transporter');
requires('db/abstract');

}, function(thisModule) {


thisModule.addSlots(avocado, function(add) {

  add.creator('couch', {}, {category: ['databases']});

});


thisModule.addSlots(avocado.couch, function(add) {
  
  add.creator('dbServer', {});

  add.creator('db', {});

});


thisModule.addSlots(avocado.couch.dbServer, function(add) {
  
  add.method('atURL', function (baseURL, proxyURL) {
    return this.serversByURL[baseURL] || (this.serversByURL[baseURL] = Object.newChildOf(this, baseURL, proxyURL));
  }, {category: ['creating']});
  
  add.data('serversByURL', {}, {category: ['caching'], initializeTo: '{}'});
  
  add.method('initialize', function (baseURL, proxyURL) {
    this._baseURL = baseURL;
    this._proxyURL = proxyURL;
    this._dbsByName = {};
  }, {category: ['creating']});
  
  add.method('baseURL', function () { return this._baseURL; }, {category: ['accessing']});
  
  add.method('dbNamed', function (name) {
    return this._dbsByName[name] || (this._dbsByName[name] = Object.newChildOf(avocado.couch.db, this, name));
  }, {category: ['databases']});
  
  add.method('doRequest', function (httpMethod, url, paramsString, body, callback) {
    // See http://wiki.apache.org/couchdb/Complete_HTTP_API_Reference for a list of possible requests.
    
    if (typeof(callback) !== 'function') { throw new Error("Need to pass in a callback to doRequest."); }
    
    var fullURL = this._baseURL + url;
    var req = new XMLHttpRequest();
    var urlForTheImmediateRequest;
    if (this._proxyURL) {
      urlForTheImmediateRequest = this._proxyURL;
      if (httpMethod === 'GET') {
        urlForTheImmediateRequest = urlForTheImmediateRequest + "?url=" + fullURL + "&" + paramsString;
      } else {
        body = "url=" + fullURL + "&" + paramsString + "\n" + body;
      }
    } else {
      urlForTheImmediateRequest = fullURL;
    }
    req.open(httpMethod, urlForTheImmediateRequest, true);
    req.setRequestHeader("Content-Type", "application/json");
    req.onreadystatechange = function() {
      if (req.readyState === 4) {
        console.log("Received response from CouchDB: " + req.responseText);
        obj = JSON.parse(req.responseText);
        callback(obj);
      }
    };
    req.send(body);
  }, {category: ['requests']});

});


thisModule.addSlots(avocado.couch.db, function(add) {
  
  add.method('findDBAtURL', function (url, callback) {
    var i = url.lastIndexOf("/");
    var server = avocado.couch.dbServer.atURL(url.substr(0, i));
    var db = server.dbNamed(url.substr(i + 1));
    db.ensureExists(callback);
  }, {category: ['creating']});
  
  add.method('initialize', function (server, name) {
    this._server = server;
    this._name = name;
    this._revsByID = {};
    this._designsByName = {};
  }, {category: ['creating']});
  
  add.creator('tests', Object.create(avocado.testCase), {category: ['tests']})
  
  add.method('name', function () { return this._name; }, {category: ['accessing']});
  
  add.method('baseURL', function () { return this._server.baseURL() + "/" + this.name(); }, {category: ['accessing']});

  add.method('textualReference', function () { return 'couch:' + this.baseURL(); }, {category: ['accessing']});
 
  add.method('doRequest', function (httpMethod, url, paramsString, body, callback) {
    this._server.doRequest(httpMethod, "/" + this.name() + url, paramsString, body, callback);
  }, {category: ['requests']});
  
  add.method('ensureExists', function (callback) {
    if (this._isKnownToExist) { callback(this); return; }
    
    this.doRequest("PUT", "", "", "", function (responseObj) {
      if (responseObj.ok || responseObj.error === 'file_exists') {
        this._isKnownToExist = true;
        callback(this);
      } else {
        this.error(responseObj);
      }
    }.bind(this));
  }, {category: ['creating']});
  
  add.method('ensureDoesNotExist', function (callback) {
    this.doRequest("DELETE", "", "", "", function (responseObj) {
      delete this._isKnownToExist;
      this._revsByID = {};
      callback(this);
    }.bind(this));
  }, {category: ['creating']});
  
  add.method('error', function (responseObj) {
    throw new Error(responseObj.error + ": " + responseObj.reason);
  }, {category: ['handling errors']});
  
  add.method('addDocument', function (obj, callback) {
    var json = this.convertRealObjectToJSON(obj);
    this.doRequest("POST", "", "", json, function(responseObj) {
      if (responseObj.ok) {
        var id = responseObj.id; // aaa - What should I do with this?
        callback(responseObj);
      } else {
        this.error(responseObj);
      }
    }.bind(this));
  }, {category: ['documents']});
  
  add.method('putDocumentAt', function (id, obj, callback) {
    var json = this.convertRealObjectToJSON(obj);
    this.doRequest("PUT", "/" + id, "", json, function(responseObj) {
      if (responseObj.ok) {
        callback(responseObj);
      } else {
        this.error(responseObj);
      }
    }.bind(this));
  }, {category: ['documents']});
  
  add.method('deleteDocumentAt', function (id, callback) {
    var rev = this._revsByID[id];
    this.doRequest("DELETE", "/" + id, "rev=" + rev, null, function(responseObj) {
      callback(responseObj);
    }.bind(this));
  }, {category: ['documents']});

  add.method('getDocument', function (id, callback) {
    this.doRequest("GET", "/" + id, "", null, function(responseObj) {
      var idAgain = responseObj._id;
      if (id !== idAgain) { throw new Error("Uh oh, something's wrong, why does the document that came back from the DB have a different ID than the one we asked for?"); }
      delete responseObj._id;
      this._revsByID[id] = responseObj._rev;
      delete responseObj._rev;
      callback(this.convertDumbDataObjectToRealObject(responseObj), id);
    }.bind(this));
  }, {category: ['documents']});
  
  add.method('convertRealObjectToJSON', function (obj) {
    if (typeof(obj) === 'string') { return obj; } // allow raw JSON
    
    var fo = transporter.module.jsonFilerOuter.create();
    fo.fileOutSlots(reflect(obj).slots());
    if (fo.errors().size() > 0) { throw new Error("Errors converting " + obj + " to JSON: " + fo.errors().map(function(e) { return e.toString(); }).join(", ")); }
    return fo.fullText();
  }, {category: ['documents', 'converting']});
  
  add.method('convertDumbDataObjectToRealObject', function (dumbDataObj) {
    var id = dumbDataObj._id;
    
    var underscoreHackLength = 'underscoreHack'.length;
    for (var name in dumbDataObj) {
      var contents = dumbDataObj[name];
      var realName = name;
      var realContents = contents;
      
      if (realName.substr(0, underscoreHackLength) === 'underscoreHack') {
        realName = realName.substr(underscoreHackLength);
      }
      
      if (realName.endsWith('__creatorPath')) {
        realName = realName.substr(0, realName.length - '__creatorPath'.length);
        var chainNames = contents;
        var o = window;
        for (var i = 0; i < chainNames.length; ++i) {
          var slotName = chainNames[i];
          o = o[slotName];
          if (o === undefined || o === null) { throw new Error("Invalid creator path: " + chainNames.join(", ")); }
        }
        realContents = o;
      }
      
      var nameChanged = name !== realName;
      if (nameChanged) {
        delete dumbDataObj[name];
      }
      
      if (nameChanged || contents !== realContents) {
        dumbDataObj[realName] = realContents;
      }
    }
    
    return dumbDataObj;
  }, {category: ['documents', 'converting']});
  
  add.method('findObjectByID', function (id, callback) {
    this.getDocument(id, function(obj) {
      avocado.objectsAndDBsAndIDs.rememberObject(obj, this, id);
      callback(obj);
    }.bind(this));
  }, {category: ['objects']});
  
  add.creator('design', {}, {category: ['designs']});
  
  add.method('designWithName', function (n) {
    return this._designsByName[n] || (this._designsByName[n] = Object.newChildOf(this.design, this, n));
  }, {category: ['designs']});
  
});


thisModule.addSlots(avocado.couch.db.design, function(add) {
  
  add.method('initialize', function (db, n) {
    this._db = db;
    this._name = n;
    var id = "_design/" + n;
    this._rawDoc = {
      "_id" : id,
      "_rev" : db._revsByID[id],
      "views" : {}
    };
  }, {category: ['creating']});

  add.method('rawDoc', function () { return this._rawDoc; }, {category: ['accessing']});
  
  add.method('name', function () { return this._name; }, {category: ['accessing']});
  
  add.method('id', function () { return this.rawDoc()._id; }, {category: ['accessing']});
  
  add.method('remove', function (callback) {
    this._db.deleteDocumentAt(this.id(), callback);
  }, {category: ['adding and removing']});
  
  add.method('put', function (callback) {
    var json = JSON.stringify(this.rawDoc());
    this._db.putDocumentAt(this.id(), json, callback);
  }, {category: ['adding and removing']});
  
  
  add.method('getViewResults', function (viewName, callback) {
    this._db.doRequest("GET", "/" + this.id() + "/_view/" + viewName, "", null, callback);
  }, {category: ['views']});
  
});


thisModule.addSlots(avocado.couch.db.tests, function(add) {
  
  add.creator('argle', {});
  
  add.method('asynchronouslyTestBasicStuff', function (callIfSuccessful) {
    var server = avocado.couch.dbServer.atURL('http://localhost:5984', 'http://localhost/~adam/avocado/cgi/proxy.cgi');
    server.doRequest("GET", "/", "", null, function (responseObj) {
      this.assertEqual(responseObj.couchdb, 'Welcome');
      var db1 = server.dbNamed('avocado_tests_1');
      var db2 = server.dbNamed('avocado_tests_2');
      db1.ensureExists(function () {
        db2.ensureExists(function () {
          var argle1 = Object.newChildOf(this.argle, 1, 2, 3);
          db1.addDocument(argle1, function(responseObj) {
            var id = responseObj.id;
            db1.getDocument(id, function(obj, idAgain) {
              this.assertEqual(id, idAgain);
              this.assertEqual("123", obj.toString());
              avocado.objectsAndDBsAndIDs.rememberObject(obj, db1, id);
              var argle2 = Object.newChildOf(this.argle, 'one', 'two', 'three'); // aaa - change one of these to say argle1, try inter-db references
              db2.addDocument(argle2, function(responseObj) {
                var id2 = responseObj.id;
                db2.getDocument(id2, function(obj2, id2Again) {
                  this.assertEqual("onetwothree", obj2.toString());
                  
                  // Don't remember argle2 in avocado.objectsAndDBsAndIDs just yet; first, try getting it
                  // from the DB via a textual reference.
                  avocado.objectsAndDBsAndIDs.findObjectReferredToAs('{"db": ' + db2.textualReference().inspect(true) + ', "id": ' + id2.inspect(true) + '}', function(obj2Again) {
                    this.assertEqual("onetwothree", obj2Again.toString());
                    callIfSuccessful();
                  }.bind(this));
                }.bind(this));
              }.bind(this));
            }.bind(this));
          }.bind(this));
        }.bind(this));
      }.bind(this));
    }.bind(this));
  });

  add.method('asynchronouslyTestQuerying', function (callIfSuccessful) {
    var server = avocado.couch.dbServer.atURL('http://localhost:5984', 'http://localhost/~adam/avocado/cgi/proxy.cgi');
    var db = server.dbNamed('avocado_querying_tests');
    db.ensureDoesNotExist(function () {
      db.ensureExists(function () {
        var design = db.designWithName("queryTest");
        design.rawDoc().views.bFive = { map: "function(doc) { if (doc.b === 5) { emit(doc._id, doc); }}" };
        design.remove(function(responseObj) {
          design.put(function(responseObj) {
            db.addDocument(Object.newChildOf(this.argle, 1, 2, 3), function(responseObj) {
              db.addDocument(Object.newChildOf(this.argle, 3, 5, 7), function(responseObj) {
                db.addDocument(Object.newChildOf(this.argle, 4, 5, 6), function(responseObj) {
                  design.getViewResults('bFive', function(responseObj) {
                    var results = responseObj.rows.map(function(row) { return db.convertDumbDataObjectToRealObject(row.value); }.bind(this));
                    this.assertEqual(2, results.size());
                    this.assertEqual("357", results[0].toString());
                    this.assertEqual("456", results[1].toString());
                    callIfSuccessful();
                  }.bind(this));
                }.bind(this));
              }.bind(this));
            }.bind(this));
          }.bind(this));
        }.bind(this));
      }.bind(this));
    }.bind(this));
  });
  
});


thisModule.addSlots(avocado.couch.db.tests.argle, function(add) {
  
  add.method('initialize', function (a, b, c) {
    this.a = a;
    this.b = b;
    this.c = c;
  });
  
  add.method('toString', function () {
    return "" + this.a + this.b + this.c;
  });
  
});


});
