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

  add.creator('db', Object.create(avocado.db));

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

  add.method('proxyURL', function () {
    // aaa - This is still a bit too hard-coded. Should be configurable from within Avocado, I think. -- Adam
    var baseURL = transporter.avocadoBaseURL;
    if (baseURL === undefined) { baseURL = document.documentURI; }
    baseURL = baseURL.substring(0, baseURL.lastIndexOf("/")) + '/';
    return baseURL + "cgi/proxy.cgi";
  });

  add.method('findDBAtURL', function (url, callback) {
    var i = url.lastIndexOf("/");
    if (i < 0 || i === url.length - 1) { throw new Error("A CouchDB URL should be of the form http://server:5984/db"); }
    var server = avocado.couch.dbServer.atURL(url.substr(0, i), this.proxyURL());
    var db = server.dbNamed(url.substr(i + 1));
    db.ensureExists(callback);
  }, {category: ['creating']});

  add.creator('prompter', {}, {category: ['user interface']});

  add.method('initialize', function (server, name) {
    this._server = server;
    this._name = name;
    this._refsByID = {};
    this._designsByName = {};
  }, {category: ['creating']});

  add.creator('tests', Object.create(avocado.testCase), {category: ['tests']});

  add.method('name', function () { return this._name; }, {category: ['accessing']});

  add.method('baseURL', function () { return this._server.baseURL() + "/" + this.name(); }, {category: ['accessing']});

  add.method('labelString', function () { return this._name; }, {category: ['user interface']});

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
      this._refsByID = {};
      callback(this);
    }.bind(this));
  }, {category: ['creating']});

  add.method('error', function (responseObj) {
    throw new Error(responseObj.error + ": " + responseObj.reason);
  }, {category: ['handling errors']});

  add.method('remoteRefForID', function (id) {
    var ref = this.existingRemoteRefForID(id);
    if (ref) { return ref; }
    ref = avocado.remoteObjectReference.create(undefined, this, id);
    this.rememberRemoteRefForID(id, ref);
    return ref;
  }, {category: ['documents']});

  add.method('rememberRemoteRefForID', function (id, ref) {
    this._refsByID[id] = ref;
  }, {category: ['documents']});

  add.method('forgetRemoteRefForID', function (id) {
    delete this._refsByID[id];
    
  }, {category: ['documents']});

  add.method('existingRemoteRefForID', function (id, throwErrorIfNotFound) {
    var ref = this._refsByID[id];
    if (throwErrorIfNotFound && !ref) { throw new Error("Don't know anything about a document with ID " + id); }
    return ref;
  }, {category: ['documents']});

  add.method('addDocument', function (obj, callback) {
    var ref = avocado.remoteObjectReference.table.refForObject(obj);

    var alreadyInDB = ref.db();
    if (alreadyInDB) {
      if (alreadyInDB === this) {
        this.putDocumentAt(ref.id(), obj, callback);
      } else {
        throw new Error("That object is already in a different DB: " + alreadyInDB);
      }
    } else {
      var json = this.convertRealObjectToJSON(obj);
      this.doRequest("POST", "", "", json, function(responseObj) {
        if (responseObj.ok) {
          ref.setDBInfo(this, responseObj.id, responseObj.rev);
          responseObj.ref = ref;
          callback(responseObj);
        } else {
          this.error(responseObj);
        }
      }.bind(this));
    }
  }, {category: ['documents']});

  add.method('putDocumentAt', function (id, obj, callback) {
    var ref = avocado.remoteObjectReference.table.refForObject(obj);
    
    var alreadyInDB = ref.db();
    if (alreadyInDB && alreadyInDB !== this) {
      throw new Error("That object is already in a different DB: " + alreadyInDB);
    } else if (alreadyInDB && ref.id() !== id) {
      throw new Error("That object is already in this DB under a different ID: " + ref.id());
    } else {
      var json = this.convertRealObjectToJSON(obj, ref.rev());
      this.doRequest("PUT", "/" + id, "", json, function(responseObj) {
        if (responseObj.ok) {
          ref.setRev(responseObj.rev);
          responseObj.ref = ref;
          callback(responseObj);
        } else {
          this.error(responseObj);
        }
      }.bind(this));
    }
  }, {category: ['documents']});

  add.method('deleteDocumentAt', function (id, callback) {
    var ref = this.existingRemoteRefForID(id);
    if (! ref) { callback(); return; } // aaa - this is probably not the right thing to do, but right now I just want to say "delete the object if it's there, otherwise don't worry about it"
    var rev = ref._rev;
    this.doRequest("DELETE", "/" + id, "rev=" + rev, null, function(responseObj) {
      callback(responseObj);
    }.bind(this));
  }, {category: ['documents']});

  add.method('getDocument', function (id, callback) {
    this.doRequest("GET", "/" + id, "", null, function(responseObj) {
      var idAgain = responseObj._id;
      if (id !== idAgain) { throw new Error("Uh oh, something's wrong, why does the document that came back from the DB have a different ID than the one we asked for?"); }
      var ref = this.updateRealObjectFromDumbDataObject(responseObj);
      callback(ref.object(), ref.id());
    }.bind(this));
  }, {category: ['documents']});

  add.method('convertRealObjectToJSON', function (obj, rev) {
    if (typeof(obj) === 'string') { return obj; } // allow raw JSON
    
    var mir = reflect(obj);
    var slots = mir.slots();
    if (rev) {
      slots = slots.toArray();
      slots.push(Object.newChildOf(avocado.slots.hardWiredContents, mir, '_rev', reflect(rev)));
    }
    
    var fo = transporter.module.filerOuters.json.create(this);
    fo.fileOutSlots(slots);
    if (fo.errors().size() > 0) { throw new Error("Errors converting " + obj + " to JSON: " + fo.errors().map(function(e) { return e.toString(); }).join(", ")); }
    return fo.fullText();
  }, {category: ['documents', 'converting']});

  add.method('updateRealObjectFromDumbDataObject', function (dumbDataObj) {
    var id = dumbDataObj._id;
    delete dumbDataObj._id;
    var ref = this.remoteRefForID(id);
    ref._rev = dumbDataObj._rev;
    
    var obj = ref.object() || dumbDataObj;
    if (obj === dumbDataObj) {
      ref.setObject(obj);
    }
    
    var underscoreHackLength = 'underscoreHack'.length;
    var names = reflect(dumbDataObj).normalSlotNames();
    names.each(function(name) {
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
      if (nameChanged) { delete dumbDataObj[name]; }
      
      if (obj !== dumbDataObj || nameChanged || contents !== realContents) {
        obj[realName] = realContents;
      }
    }.bind(this));
    
    return ref;
  }, {category: ['documents', 'converting']});

  add.method('findObjectByID', function (id, callback) {
    this.remoteRefForID(id).fetchObjectIfNotYetPresent(callback);
  }, {category: ['objects']});

  add.creator('relationships', {}, {category: ['relationships']});

  add.creator('design', {}, {category: ['designs']});

  add.creator('view', {}, {category: ['designs']});

  add.creator('query', {}, {category: ['designs']});

  add.method('designWithName', function (n) {
    return this._designsByName[n] || (this._designsByName[n] = Object.newChildOf(this.design, this, n));
  }, {category: ['designs']});

  add.method('dragAndDropCommands', function () {
    var cmdList = avocado.command.list.create(this);
    cmdList.addItem(avocado.command.create("add object", function(evt, mir) {
      this.addDocument(mir.reflectee(), function(responseObj) {
        var ref = responseObj.ref;
        // anything to do here?
      });
    }).setArgumentSpecs([avocado.command.argumentSpec.create('mir').onlyAccepts(function(o) {
      return o && typeof(o.reflectee) === 'function' && o.reflectee();
    })]));
    return cmdList;
  }, {category: ['user interface', 'drag and drop']});

});


thisModule.addSlots(avocado.couch.db.design, function(add) {

  add.method('initialize', function (db, n) {
    this._db = db;
    this._name = n;
    var id = "_design/" + n;
    var ref = db.existingRemoteRefForID(id);
    this._rawDoc = {
      "_id" : id,
      "_rev" : (ref ? ref.rev() : undefined),
      "views" : {}
    };
    this._viewsByName = {};
  }, {category: ['creating']});

  add.method('rawDoc', function () { return this._rawDoc; }, {category: ['accessing']});

  add.method('name', function () { return this._name; }, {category: ['accessing']});

  add.method('db', function () { return this._db; }, {category: ['accessing']});

  add.method('id', function () { return this.rawDoc()._id; }, {category: ['accessing']});

  add.method('remove', function (callback) {
    this._db.deleteDocumentAt(this.id(), callback);
  }, {category: ['adding and removing']});

  add.method('put', function (callback) {
    var json = JSON.stringify(this.rawDoc());
    this._db.putDocumentAt(this.id(), json, callback);
  }, {category: ['adding and removing']});

  add.method('doRequest', function (httpMethod, url, paramsString, body, callback) {
    this._db.doRequest(httpMethod, "/" + this.id() + url, paramsString, body, callback);
  }, {category: ['requests']});

  add.method('viewNamed', function (viewName) {
    return this._viewsByName[viewName] || (this._viewsByName[viewName] = Object.newChildOf(avocado.couch.db.view, this, viewName));
  }, {category: ['views']});

  add.method('addViewForRelationship', function (r) {
    this.rawDoc().views[r.viewName()] = { map: r.stringForMapFunction() };
  }, {category: ['views']});

});


thisModule.addSlots(avocado.couch.db.view, function(add) {

  add.method('initialize', function (design, n) {
    this._design = design;
    this._name = n;
  }, {category: ['creating']});

  add.method('design', function () { return this._design; }, {category: ['accessing']});

  add.method('name', function () { return this._name; }, {category: ['accessing']});

  add.method('newQuery', function (options) {
    return Object.newChildOf(avocado.couch.db.query, this, options);
  }, {category: ['queries']});

  add.method('queryForAllResults', function () {
    return this.newQuery();
  }, {category: ['queries']});

});


thisModule.addSlots(avocado.couch.db.query, function(add) {

  add.method('initialize', function (view, options) {
    this._view = view;
    this._options = options;
  }, {category: ['creating']});

  add.method('view', function () { return this._view; }, {category: ['accessing']});

  add.method('options', function () { return this._options; }, {category: ['accessing']});

  add.method('getResults', function (callback) {
    // aaa - implement other kinds of queries, not just "get all results"
    var db = this.view().design().db();
    this.view().design().doRequest("GET", "/_view/" + this.view().name(), "", null, function(responseObj) {
      responseObj.refs = responseObj.rows.map(function(row) { return db.updateRealObjectFromDumbDataObject(row.value); });
      callback(responseObj);
    });
  }, {category: ['views']});

});


thisModule.addSlots(avocado.couch.db.relationships, function(add) {

  add.creator('oneToMany', {});

});


thisModule.addSlots(avocado.couch.db.relationships.oneToMany, function(add) {

  add.method('create', function (containerType, elementType, nameOfAttributePointingToContainer) {
    return Object.newChildOf(this, containerType, elementType, nameOfAttributePointingToContainer);
  }, {category: ['creating']});

  add.method('initialize', function (containerType, elementType, nameOfAttributePointingToContainer) {
    this._containerType = containerType;
    this._elementType = elementType;
    this._nameOfAttributePointingToContainer = nameOfAttributePointingToContainer;
  }, {category: ['creating']});

  add.method('viewName', function () {
    return reflect(this._elementType).explicitlySpecifiedCreatorSlot().name() + "__" + this._nameOfAttributePointingToContainer;
  }, {category: ['views']});

  add.method('stringForMapFunction', function () {
    var containerCreatorSlotChain = reflect(this._containerType).creatorSlotChain();
    var   elementCreatorSlotChain = reflect(this._elementType  ).creatorSlotChain();
    var s = ["function(doc) { var p = doc.underscoreHack__proto____creatorPath; if (!p) { return; }"];
    
    s.push(" if (p.length === ", containerCreatorSlotChain.length);
    for (var i = 0, n = containerCreatorSlotChain.length; i < n; ++i) {
      s.push(" && p[", i, "] === ", containerCreatorSlotChain[n - 1 - i].name().inspect());
    }
    s.push(") { emit([doc._id, 0], doc); } else");
    
    s.push(" if (p.length === ", elementCreatorSlotChain.length);
    for (var i = 0, n = elementCreatorSlotChain.length; i < n; ++i) {
      s.push(" && p[", i, "] === ", elementCreatorSlotChain[n - 1 - i].name().inspect());
    }
    s.push(") { emit([doc.", this._nameOfAttributePointingToContainer, ", 1], doc); }");
    
    s.push(" }");
    return s.join("");
  }, {category: ['views']});

  add.method('viewInDesign', function (design) {
    return design.viewNamed(this.viewName());
  }, {category: ['views']});

  add.method('queryFor', function (container, design) {
    var ref = avocado.remoteObjectReference.table.existingRefForObject(container);
    if (!ref) { throw new Error("Can't create a oneToMany query for " + container + " because we don't know its ID."); }
    var id = ref.id();
    return this.viewInDesign(design).newQuery({startkey: '[' + id.inspect(true) + ']', endkey: '[' + id.inspect(true) + ',{}]'});
  }, {category: ['querying']});

});


thisModule.addSlots(avocado.couch.db.prompter, function(add) {

  add.method('prompt', function (caption, context, evt, callback) {
    WorldMorph.current().prompt('CouchDB URL?', function(url) {
      if (url) {
        avocado.couch.db.findDBAtURL(url, callback);
      }
    }, 'http://localhost:5984/dbname');
  }, {category: ['prompting']});

});


thisModule.addSlots(avocado.couch.db.tests, function(add) {

  add.creator('argle', {});

  add.creator('bargle', {});

  add.method('asynchronouslyTestBasicStuff', function (callIfSuccessful) {
    var server = avocado.couch.dbServer.atURL('http://localhost:5984', avocado.couch.db.proxyURL());
    server.doRequest("GET", "/", "", null, function (responseObj) {
      this.assertEqual(responseObj.couchdb, 'Welcome');
      var db1 = server.dbNamed('avocado_tests_1');
      var db2 = server.dbNamed('avocado_tests_2');
      db1.ensureExists(function () {
        db2.ensureExists(function () {
          var argle1 = Object.newChildOf(this.argle, 1, 2, 3);
          db1.addDocument(argle1, function(responseObj) {
            var ref = responseObj.ref;
            var id = ref.id();
            ref.forgetMe();
            db1.getDocument(id, function(obj, idAgain) {
              this.assertEqual(id, idAgain);
              this.assertEqual("123", obj.toString());
              var argle2 = Object.newChildOf(this.argle, 'one', 'two', 'three'); // aaa - change one of these to say argle1, try inter-db references
              db2.addDocument(argle2, function(responseObj) {
                var ref2 = responseObj.ref;
                var id2 = ref2.id();
                ref2.forgetMe();
                db2.getDocument(id2, function(obj2, id2Again) {
                  this.assertEqual("onetwothree", obj2.toString());
                  avocado.remoteObjectReference.table.findObjectReferredToAs('{"db": ' + db2.textualReference().inspect(true) + ', "id": ' + id2.inspect(true) + '}', function(obj2Again) {
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
    var server = avocado.couch.dbServer.atURL('http://localhost:5984', avocado.couch.db.proxyURL());
    var db = server.dbNamed('avocado_querying_tests');
    db.ensureDoesNotExist(function () {
      db.ensureExists(function () {
        var design = db.designWithName("queryTest");
        var argleBargles = avocado.couch.db.relationships.oneToMany.create(avocado.couch.db.tests.argle, avocado.couch.db.tests.bargle, 'argle__ref__id');
        design.addViewForRelationship(argleBargles);
        design.rawDoc().views.bFive = { map: "function(doc) { if (doc.b === 5) { emit(doc._id, doc); }}" };
        design.remove(function(responseObj) {
          design.put(function(responseObj) {
            var argle1 = Object.newChildOf(this.argle, 1, 2, 3);
            var argle2 = Object.newChildOf(this.argle, 3, 5, 7);
            var argle3 = Object.newChildOf(this.argle, 4, 5, 6);
            db.addDocument(argle1, function(responseObj) {
              db.addDocument(argle2, function(responseObj) {
                db.addDocument(argle3, function(responseObj) {

                  argle3.c = 'six';
                  // I think addDocument should do a putDocumentAt if the object is already in the DB.
                  db.addDocument(argle3, function(responseObj) {
                    
                    design.viewNamed('bFive').queryForAllResults().getResults(function(responseObj) {
                      var results = responseObj.refs;
                      this.assertEqual(2, results.size());
                      this.assertEqual("357",   results[0].object().toString());
                      this.assertEqual("45six", results[1].object().toString());

                      // Let's try out the oneToMany relationship object.
                      var bargle11 = Object.newChildOf(this.bargle, argle1, "one", 1);
                      var bargle12 = Object.newChildOf(this.bargle, argle1, "two", 2);
                      var bargle21 = Object.newChildOf(this.bargle, argle2, "one", 1);
                      var bargle22 = Object.newChildOf(this.bargle, argle2, "two", 2);
                      var argle1Bargles = argleBargles.queryFor(argle1, design);
                      var argle2Bargles = argleBargles.queryFor(argle2, design);
                      db.addDocument(bargle11, function(responseObj) {
                        db.addDocument(bargle12, function(responseObj) {
                          db.addDocument(bargle21, function(responseObj) {
                            db.addDocument(bargle22, function(responseObj) {
                              argle1Bargles.getResults(function(responseObj) {
                                var argle1BarglesResults = responseObj.refs;
                                this.assertEqual(argle1,   argle1BarglesResults[0].object());
                                this.assertEqual(bargle11, argle1BarglesResults[1].object());
                                this.assertEqual(bargle12, argle1BarglesResults[2].object());
                                callIfSuccessful();
                              }.bind(this));
                            }.bind(this));
                          }.bind(this));
                        }.bind(this));
                      }.bind(this));
                    }.bind(this));
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


thisModule.addSlots(avocado.couch.db.tests.bargle, function(add) {

  add.method('initialize', function (argle, s, t) {
    this.s = s;
    this.t = t;
    this.setArgle(argle);
  });

  add.method('toString', function () {
    return "" + this.argle() + this.s + this.t;
  });

  add.method('argle', function () {
    return this.argle__ref.object();
  });

  add.method('setArgle', function (argle) {
    this.argle__ref = avocado.remoteObjectReference.table.refForObject(argle);
  });

});


});
