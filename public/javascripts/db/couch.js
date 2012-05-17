avocado.transporter.module.create('db/couch', function(requires) {

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

  add.method('storeString', function () {
    return ["avocado.couch.dbServer.atURL(", this._baseURL.inspect(), ", ", this._proxyURL.inspect(), ")"].join("");
  }, {category: ['transporting']});

  add.method('doRequest', function (httpMethod, url, paramsStringOrObject, body, callback, errback) {
    // See http://wiki.apache.org/couchdb/Complete_HTTP_API_Reference for a list of possible requests.
    
    if (typeof(callback) !== 'function' || typeof(errback) !== 'function') { throw new Error("Need to pass in a callback and errback to doRequest."); }
    
    var fullURL = this._baseURL + url;
    var paramsString = avocado.http.paramsStringFrom(paramsStringOrObject);
    var req = new XMLHttpRequest();
    var urlForTheImmediateRequest;
    if (this._proxyURL) {
      urlForTheImmediateRequest = this._proxyURL;
      if (httpMethod === 'GET') {
        urlForTheImmediateRequest = urlForTheImmediateRequest + "?url=" + (fullURL + encodeURIComponent(paramsString ? (fullURL.include("?") ? "&" : "?") + paramsString : ""));
      } else {
        body = "url=" + fullURL + (paramsString ? "&" + paramsString : "") + "\n" + body;
      }
    } else {
      urlForTheImmediateRequest = fullURL;
    }
    //console.log("About to doRequest: " + httpMethod + " " + urlForTheImmediateRequest + "\n" + body);
    req.open(httpMethod, urlForTheImmediateRequest, true);
    req.setRequestHeader("Content-Type", "application/json");
    req.onreadystatechange = function() {
      if (req.readyState === 4) {
        //console.log("Received response from CouchDB: " + req.responseText);
        try {
          obj = JSON.parse(req.responseText);
          callback(obj);
        } catch (e) {
          errback(e);
        }
      }
    };
    req.send(body);
  }, {category: ['requests']});

});


thisModule.addSlots(avocado.couch.db, function(add) {

  add.method('proxyURL', function () {
    // aaa - This is still a bit too hard-coded. Should be configurable from within Avocado, I think. -- Adam
    var baseURL = avocado.transporter.avocadoBaseURL;
    if (baseURL === undefined) { baseURL = document.documentURI; }
    baseURL = baseURL.substring(0, baseURL.lastIndexOf("/")) + '/';
    return baseURL + "cgi/proxy.cgi";
  });

  add.method('findDBAtURL', function (url, callback, errback) {
    var i = url.lastIndexOf("/");
    if (i < 0 || i === url.length - 1) { errback(new Error("A CouchDB URL should be of the form http://server:5984/db")); return; }
    var server = avocado.couch.dbServer.atURL(url.substr(0, i), this.proxyURL());
    var db = server.dbNamed(url.substr(i + 1));
    db.ensureExists(callback, errback);
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

  add.method('toString', function () { return this.name(); }, {category: ['printing']});

  add.method('baseURL', function () { return this._server.baseURL() + "/" + this.name(); }, {category: ['accessing']});

  add.method('labelString', function () { return this._name; }, {category: ['user interface']});

  add.method('textualReference', function () { return 'couch:' + this.baseURL(); }, {category: ['accessing']});

  add.method('storeString', function () {
    return ["(", this._server.storeString(), ").dbNamed(", this._name.inspect(), ")"].join("");
  }, {category: ['transporting']});

  add.method('doRequest', function (httpMethod, url, paramsStringOrObject, body, callback, errback) {
    this._server.doRequest(httpMethod, "/" + this.name() + url, paramsStringOrObject, body, callback, errback);
  }, {category: ['requests']});

  add.method('ensureExists', function (callback, errback) {
    if (this._isKnownToExist) { callback(this); return; }
    
    this.doRequest("PUT", "", "", "", function (responseObj) {
      if (responseObj.ok || responseObj.error === 'file_exists') {
        this._isKnownToExist = true;
        callback(this);
      } else {
        errback(responseObj);
      }
    }.bind(this), errback);
  }, {category: ['creating']});

  add.method('ensureDoesNotExist', function (callback, errback) {
    this.doRequest("DELETE", "", "", "", function (responseObj) {
      delete this._isKnownToExist;
      this._refsByID = {};
      callback(this);
    }.bind(this), errback);
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

  add.method('addDocument', function (obj, callback, errback) {
    var ref = avocado.remoteObjectReference.table.refForObject(obj);

    var alreadyInDB = ref.realm();
    if (alreadyInDB) {
      if (alreadyInDB === this) {
        this.putDocumentAt(ref.id(), obj, callback, errback);
      } else {
        errback(new Error("That object is already in a different DB: " + alreadyInDB));
      }
    } else {
      var json = this.convertRealObjectToJSON(obj);
      this.doRequest("POST", "", "", json, function(responseObj) {
        if (responseObj.ok) {
          ref.setDBInfo(this, responseObj.id, responseObj.rev);
          responseObj.ref = ref;
          callback(responseObj);
        } else {
          errback(responseObj);
        }
      }.bind(this), errback);
    }
  }, {category: ['documents']});

  add.method('putDocumentAt', function (id, obj, callback, errback) {
    var ref = avocado.remoteObjectReference.table.refForObject(obj);
    
    var alreadyInDB = ref.realm();
    if (alreadyInDB && alreadyInDB !== this) {
      errback(new Error("That object is already in a different DB: " + alreadyInDB));
    } else if (alreadyInDB && ref.id() !== id) {
      errback(new Error("That object is already in this DB under a different ID: " + ref.id()));
    } else {
      var extraSlots = ref._rev ? { _rev: ref._rev } : {};
      var json = this.convertRealObjectToJSON(obj, extraSlots);
      this.doRequest("PUT", "/" + id, "", json, function(responseObj) {
        if (responseObj.ok) {
          ref._rev = responseObj.rev;
          responseObj.ref = ref;
          callback(responseObj);
        } else {
          errback(responseObj);
        }
      }.bind(this), errback);
    }
  }, {category: ['documents']});

  add.method('deleteDocumentAt', function (id, callback, errback) {
    var ref = this.existingRemoteRefForID(id);
    if (! ref) { callback(); return; } // aaa - this is probably not the right thing to do, but right now I just want to say "delete the object if it's there, otherwise don't worry about it"
    var rev = ref._rev;
    this.doRequest("DELETE", "/" + id, "rev=" + rev, null, function(responseObj) {
      callback(responseObj);
    }.bind(this), errback);
  }, {category: ['documents']});

  add.method('getDocument', function (id, callback, errback) {
    this.doRequest("GET", "/" + id, "", null, function(responseObj) {
      var idAgain = responseObj._id;
      if (id !== idAgain) {
        var errorObj;
        if (typeof(responseObj.error) !== 'undefined') {
          errorObj = responseObj;
        } else {
          errorObj = { error: "The document that came back from the DB has a different ID from the one we asked for.", reason: "unknown" };
        }
        
        errback(errorObj);
      } else {
        var ref = this.updateRealObjectFromDumbDataObject(responseObj);
        if (callback) { callback(ref.object(), ref.id(), ref); }
      }
    }.bind(this));
  }, {category: ['documents']});

  add.method('convertRealObjectToJSON', function (obj, hardwiredSlots) {
    if (typeof(obj) === 'string') { return obj; } // allow raw JSON
    
    var mir = reflect(obj);
    var slots = mir.slots().toArray();
    slots.push(mir.parentSlot());
    if (hardwiredSlots) {
      reflect(hardwiredSlots).normalSlots().each(function(hardwiredSlot) {
        slots.push(Object.newChildOf(avocado.slots.hardWiredContents, mir, hardwiredSlot.name(), hardwiredSlot.contents()));
      });
    }
    
    var fo = avocado.transporter.module.filerOuters.json.create(this);
    fo.fileOutSlots(slots);
    if (fo.errors().size() > 0) { throw new Error("Errors converting " + obj + " to JSON: " + fo.errors().map(function(e) { return e.toString(); }).join(", ")); }
    return fo.fullText() || "{}";
  }, {category: ['documents', 'converting']});

  add.method('updateRealObjectFromDumbDataObject', function (dumbDataObj) {
    var id = dumbDataObj._id;
    delete dumbDataObj._id;
    var ref = this.remoteRefForID(id);
    ref._rev = dumbDataObj._rev;
    delete dumbDataObj._rev;
    
    var obj = ref.object() || dumbDataObj;
    if (obj === dumbDataObj) {
      ref.setObject(obj);
    }
    
    var underscoreReplacementLength = 'underscoreReplacement'.length;
    var names = reflect(dumbDataObj).normalSlotNames();
    names.each(function(name) {
      var contents = dumbDataObj[name];
      var realName = name;
      var realContents = contents;
      
      if (realName.substr(0, underscoreReplacementLength) === 'underscoreReplacement') {
        realName = realName.substr(underscoreReplacementLength);
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

      if (realName.endsWith('__id')) {
        realName = realName.substr(0, realName.length - '__id'.length);
        realContents = this.remoteRefForID(contents).object();
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

  add.creator('container', {}, {category: ['relationships']});

  add.creator('design', {}, {category: ['designs']});

  add.creator('view', {}, {category: ['designs']});

  add.creator('query', {}, {category: ['designs']});

  add.method('designWithName', function (n) {
    return this._designsByName[n] || (this._designsByName[n] = Object.newChildOf(this.design, this, n));
  }, {category: ['designs']});

  add.method('containerTypesOrganizer', function () {
    return Object.newChildOf(this.containerTypesOrganizerProto, this);
  }, {category: ['containers']});

  add.creator('containerTypesOrganizerProto', {}, {category: ['containers']});

  add.method('commands', function () {
    var cmdList = avocado.command.list.create(this);
    cmdList.addItem(avocado.command.create('container types', function(evt) {
      avocado.ui.grab(this.containerTypesOrganizer(), evt);
    }));
    return cmdList;
  }, {category: ['user interface', 'commands']});

  add.method('dragAndDropCommands', function () {
    var cmdList = avocado.command.list.create(this);
    cmdList.addItem(avocado.command.create("add object", function(evt, mir) {
      this.addDocument(mir.reflectee(), function(responseObj) {
        var ref = responseObj.ref;
        // anything to do here?
      }, function(err) {
        throw err; // aaa or display it in a better way
      });
    }).setArgumentSpecs([avocado.command.argumentSpec.create('mir').onlyAccepts(function(o) {
      return o && typeof(o.reflectee) === 'function' && o.reflectee();
    })]));
    return cmdList;
  }, {category: ['user interface', 'drag and drop']});

});


thisModule.addSlots(avocado.couch.db.prompter, function(add) {

  add.method('prompt', function (caption, context, evt, callback) {
    avocado.ui.prompt('CouchDB URL?', function(url) {
      avocado.couch.db.findDBAtURL(url, callback, avocado.ui.showError);
    }, 'http://localhost:5984/dbname', evt);
  }, {category: ['prompting']});

});


thisModule.addSlots(avocado.couch.db.tests, function(add) {

  add.creator('argle', {});

  add.creator('bargle', {});

  add.method('asynchronouslyTestBasicStuff', function (callback, errback) {
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
                  avocado.remoteObjectReference.table.findObjectReferredToAs('{"realm": ' + db2.textualReference().inspect(true) + ', "id": ' + id2.inspect(true) + '}', function(obj2Again) {
                    this.assertEqual("onetwothree", obj2Again.toString());
                    callback();
                  }.bind(this), errback);
                }.bind(this), errback);
              }.bind(this), errback);
            }.bind(this), errback);
          }.bind(this), errback);
        }.bind(this), errback);
      }.bind(this), errback);
    }.bind(this), errback);
  });

  add.method('asynchronouslyTestQuerying', function (callback, errback) {
    var server = avocado.couch.dbServer.atURL('http://localhost:5984', avocado.couch.db.proxyURL());
    var db = server.dbNamed('avocado_querying_tests');
    db.ensureDoesNotExist(function () {
      db.ensureExists(function () {
        var design = db.designWithName("queryTest");
        var argleBargles = avocado.couch.db.relationships.oneToMany.create(avocado.couch.db.tests.argle, avocado.couch.db.tests.bargle, '_argle');
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
                                this.assertEqual(3, argle1BarglesResults.length);
                                this.assertEqual(argle1,   argle1BarglesResults[0].object());
                                this.assertEqual(bargle11, argle1BarglesResults[1].object());
                                this.assertEqual(bargle12, argle1BarglesResults[2].object());
                                argle2Bargles.getResults(function(responseObj) {
                                  var argle2BarglesResults = responseObj.refs;
                                  this.assertEqual(3, argle2BarglesResults.length);
                                  this.assertEqual(argle2,   argle2BarglesResults[0].object());
                                  this.assertEqual(bargle21, argle2BarglesResults[1].object());
                                  this.assertEqual(bargle22, argle2BarglesResults[2].object());
                                  callback();
                                }.bind(this), errback);
                              }.bind(this), errback);
                            }.bind(this), errback);
                          }.bind(this), errback);
                        }.bind(this), errback);
                      }.bind(this), errback);
                    }.bind(this), errback);
                  }.bind(this)), errback;

                }.bind(this), errback);
              }.bind(this), errback);
            }.bind(this), errback);
          }.bind(this), errback);
        }.bind(this), errback);
      }.bind(this), errback);
    }.bind(this), errback);
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
    return this._argle;
  });

  add.method('setArgle', function (argle) {
    if (! reflect(argle).reflecteeRemoteReference()) { throw new Error("Must set argle to an object that is stored in a DB."); }
    this._argle = argle;
  });

});


thisModule.addSlots(avocado.couch.db.relationships, function(add) {

  add.creator('oneToMany', {});

});


thisModule.addSlots(avocado.couch.db.relationships.oneToMany, function(add) {

  add.method('create', function () {
    var c = Object.create(this);
    c.initialize.apply(c, arguments);
    return c;
  }, {category: ['creating']});

  add.method('createFromViewDocument', function (viewDoc, viewName) {
    var containerTypeMir = avocado.mirror.forObjectNamed(viewDoc.containerCreatorSlotChain);
    var   elementTypeMir = avocado.mirror.forObjectNamed(viewDoc.elementCreatorSlotChain);
    var prefix = this.viewNamePrefix(containerTypeMir, elementTypeMir);
    if (viewName.substr(0, prefix.length) !== prefix) {
      throw new Error("View name " + viewName.inspect() + " does not match the view's element type " + reflect(viewDoc.elementCreatorSlotChain).expressionEvaluatingToMe());
    }
    var attrName = viewName.substr(prefix.length);
    return this.create(containerTypeMir.reflectee(), elementTypeMir.reflectee(), attrName);
  }, {category: ['creating']});

  add.method('initialize', function (containerType, elementType, nameOfAttributePointingToContainer) {
    this._containerTypeMir = reflect(containerType);
    this._elementTypeMir   = reflect(elementType);
    this._nameOfAttributePointingToContainer = nameOfAttributePointingToContainer;
  }, {category: ['creating']});

  add.method('viewName', function () {
    return this.viewNamePrefix(this._containerTypeMir, this._elementTypeMir) + this._nameOfAttributePointingToContainer;
  }, {category: ['views']});

  add.method('viewNamePrefix', function (containerTypeMir, elementTypeMir) {
    var contPart = containerTypeMir.creatorSlotChain().reverse().map(function(s) { return s.name(); }).join("__");
    var elemPart =   elementTypeMir.creatorSlotChain().reverse().map(function(s) { return s.name(); }).join("__");
    return contPart + "__" + elemPart + "___";
  }, {category: ['views']});

  add.method('containerTypeMir', function () { return this._containerTypeMir; }, {category: ['accessing']});

  add.method('elementTypeMir', function () { return this._elementTypeMir; }, {category: ['accessing']});

  add.method('nameOfAttributePointingToContainer', function () { return this._nameOfAttributePointingToContainer; }, {category: ['accessing']});

  add.method('copyForAttribute', function (nameOfAttributePointingToContainer) {
    var c = Object.shallowCopy(this);
    c._nameOfAttributePointingToContainer = nameOfAttributePointingToContainer;
    return c;
  }, {category: ['copying']});

  add.method('toString', function () {
    return this._nameOfAttributePointingToContainer;
  }, {category: ['printing']});

  add.method('stringForMapFunction', function () {
    var s = [];
    s.push("function(doc) { var p = doc.underscoreReplacement__proto____creatorPath; if (!p) { return; }");
    
    var containerCreatorSlotChain = this._containerTypeMir.creatorSlotChain();
    s.push(" if (p.length === ", containerCreatorSlotChain.length);
    for (var i = 0, n = containerCreatorSlotChain.length; i < n; ++i) {
      s.push(" && p[", i, "] === ", containerCreatorSlotChain[n - 1 - i].name().inspect());
    }
    s.push(") { emit([doc._id, 0], doc); }");
    
    var elementCreatorSlotChain = this._elementTypeMir.creatorSlotChain();
    s.push(" if (p.length === ", elementCreatorSlotChain.length);
    for (var i = 0, n = elementCreatorSlotChain.length; i < n; ++i) {
      s.push(" && p[", i, "] === ", elementCreatorSlotChain[n - 1 - i].name().inspect());
    }
    var attrName = this._nameOfAttributePointingToContainer;
    if (attrName[0] === '_') { attrName = 'underscoreReplacement' + attrName; }
    s.push(" && doc.", attrName, "__id !== undefined");
    s.push(") { emit([doc.", attrName, "__id, 1], doc); }");
    
    s.push(" }");
    return s.join("");
  }, {category: ['views']});

  add.method('viewInDesign', function (design) {
    return design.viewNamed(this.viewName());
  }, {category: ['views']});

  add.method('attachMetaInfoToViewDocument', function (viewDoc) {
    viewDoc.containerCreatorSlotChain = this._containerTypeMir.creatorSlotChain().map(function(s) { return s.name(); }).reverse();
    viewDoc.  elementCreatorSlotChain = this._elementTypeMir  .creatorSlotChain().map(function(s) { return s.name(); }).reverse();
  }, {category: ['views']});

  add.method('containerFor', function (containerObj, design) {
    var containerRef = avocado.remoteObjectReference.table.refForObject(containerObj);
    return avocado.couch.db.container.create(this, containerRef, design);
  }, {category: ['querying']});

  add.method('queryFor', function (containerObj, design) {
    var ref = avocado.remoteObjectReference.table.existingRefForObject(containerObj);
    if (!ref) { throw new Error("Can't create a oneToMany query for " + containerObj + " because we don't know its ID."); }
    return this.queryForID(ref.id(), design);
  }, {category: ['querying']});

  add.method('queryForID', function (containerID, design) {
    return this.viewInDesign(design).newQuery({startkey: '[' + containerID.inspect(true) + ',0]', endkey: '[' + containerID.inspect(true) + ',{}]'});
  }, {category: ['querying']});

  add.method('storeString', function () {
    return ["avocado.couch.db.relationships.oneToMany.create(", this._containerTypeMir.creatorSlotChainExpression(), ", ", this._elementTypeMir.creatorSlotChainExpression(), ", ", this._nameOfAttributePointingToContainer.inspect(), ")"].join("");
  }, {category: ['transporting']});

});


thisModule.addSlots(avocado.couch.db.container, function(add) {

  add.method('create', function () {
    var c = Object.create(this);
    c.initialize.apply(c, arguments);
    return c;
  }, {category: ['creating']});

  add.method('initialize', function (relationship, containerRef, design, optionalName) {
    this._relationship = relationship;
    this._containerRef = containerRef;
    this._design = design;
    this._name = optionalName;
    this._contents = [];
  }, {category: ['creating']});

  add.method('containerObj', function () {
    return this._containerRef.object();
  }, {category: ['creating']});

  add.method('copyRemoveAll', function () {
    var newContainerObj = Object.create(this.containerObj().__proto__);
    return this._relationship.containerFor(newContainerObj, this._design);
  }, {category: ['copying']});

  add.method('setAttributeName', function (n) {
    this._relationship = this._relationship.copyForAttribute(n);
    this._contents = [];
  }, {category: ['accessing']});

  add.method('setContainerName', function (n) {
    this._name = n;
  }, {category: ['accessing']});

  add.method('contents', function () {
    return this._contents;
  }, {category: ['accessing']});

  add.method('relationship', function () {
    return this._relationship;
  }, {category: ['accessing']});

  add.method('db', function () {
    return this._design.db();
  }, {category: ['accessing']});

  add.method('doesTypeMatch', function (obj) { return obj && obj.__proto__ === avocado.couch.db.container; }, {category: ['testing']});

  add.method('updateContents', function (callback) {
    var ref = this._containerRef;
    if (!ref.id()) { return this; }
    var query = this._relationship.queryForID(ref.id(), this._design);
    query.getResults(function(responseObj) {
      if (responseObj.refs) {
        var containerRef = responseObj.refs.shift();
        this._contents = responseObj.refs.map(function(ref) { return reflect(ref.object()); }); // aaa - enhance this, want to be able to hold more than mirrors
      } else {
        if (responseObj.error) {
          console.error("Error: " + responseObj.error + ", reason: " + responseObj.reason);
        } else {
          throw new Error("What is going on?");
        }
      }
      if (callback) { callback(this._contents); }
    }.bind(this), function(err) { throw err; });
    return this;
  }, {category: ['updating']});

  add.method('toString', function () {
    if (this._name) { return this._name; }
    var elementTypeName = this._relationship.elementTypeMir().name().withoutSuffix(".prototype");
    return elementTypeName + "s whose " + this._relationship.nameOfAttributePointingToContainer() + " is " + reflect(this.containerObj()).inspect();
  }, {category: ['printing']});

  add.method('immediateContents', function () {
    return this._contents;
  }, {category: ['accessing']});

  add.method('commands', function () {
    var cmdList = avocado.command.list.create(this);

    cmdList.addItem(avocado.command.create('change attribute', function(evt, attributeName) {
      this.setAttributeName(attributeName);
      avocado.ui.justChanged(this, null, evt);
      this.updateContents(function() { avocado.ui.justChanged(this, evt); }.bind(this));
    }.bind(this)).setArgumentSpecs([
      avocado.command.argumentSpec.create('attributeName').onlyAcceptsType(String)
    ]));

    cmdList.addItem(avocado.command.create('rename', function(evt, containerName) {
      this.setContainerName(containerName);
      avocado.ui.justChanged(this, null, evt);
    }.bind(this)).setArgumentSpecs([
      avocado.command.argumentSpec.create('containerName').onlyAcceptsType(String)
    ]));

    cmdList.addItem(avocado.command.create('get container object', function(evt) {
      avocado.ui.grab(reflect(this.containerObj()), evt);
    }));

    return cmdList;
  }, {category: ['commands']});

  add.method('dragAndDropCommands', function () {
    var cmdList = avocado.command.list.create(this);
    
    cmdList.addItem(avocado.command.create("add mirror", function(evt, mir) {
      this.addObject(mir.reflectee(), function(responseObj) {
        var ref = responseObj.ref;
        avocado.ui.justChangedContent(this, evt);
        console.log("Successfully added " + mir.name() + " to " + this);
      }.bind(this), function(err) {
        throw err; // aaa or display it in a better way
      });
    }).setArgumentSpecs([avocado.command.argumentSpec.create('mir').onlyAccepts(function(mir) {
      if (!mir) { return false; }
      if (typeof(mir.reflectee) !== 'function') { return false; }
      var obj = mir.reflectee();
      return Object.inheritsFrom(this._relationship.elementTypeMir().reflectee(), obj);
    }.bind(this))]));
    
    return cmdList;
  }, {category: ['commands']});

  add.method('addObject', function (elementObj, callback, errback) {
    this.db().addDocument(this.containerObj(), function(responseObj) { // aaa - figure out a better way to make sure the container obj is in the DB
      this._containerRef = responseObj.ref;
      elementObj[this._relationship.nameOfAttributePointingToContainer()] = this.containerObj();
      this.db().addDocument(elementObj, function() {
        this.updateContents(callback);
      }.bind(this), errback);
    }.bind(this), errback);
  }, {category: ['adding']});

  add.method('storeString', function () {
    return ["avocado.couch.db.container.create(", this._relationship.storeString(), ", ", this._containerRef.expressionToRecreateRefAndFetchObject(), ", ", this._design.storeString(), (this._name ? ", " + Object.inspect(this._name) : ""), ")"].join("");
  }, {category: ['transporting']});

});


thisModule.addSlots(avocado.couch.db.design, function(add) {

  add.method('initialize', function (db, n) {
    this._db = db;
    this._name = n;
    var id = "_design/" + n;
    this._ref = db.existingRemoteRefForID(id);
    this._rawDoc = this._ref ? this._ref.object() : { _id : id, views : {} };
    this._viewsByName = {};
  }, {category: ['creating']});

  add.method('rawDoc', function () { return this._rawDoc; }, {category: ['accessing']});

  add.method('name', function () { return this._name; }, {category: ['accessing']});

  add.method('db', function () { return this._db; }, {category: ['accessing']});

  add.method('id', function () { return this.rawDoc()._id; }, {category: ['accessing']});

  add.method('remove', function (callback, errback) {
    this._db.deleteDocumentAt(this.id(), callback, errback);
  }, {category: ['adding and removing']});

  add.method('get', function (callback, errback) {
    return this._db.getDocument(this.id(), function(obj, id, ref) {
      this._rawDoc = obj;
      this._ref = ref;
      if (callback) { callback(obj); }
    }.bind(this), function(errorObj) {
      if (errback) {
        errback(errorObj);
      } else {
        if (callback) { callback(this._rawDoc); } // just use the local new one if there's no existing one
      }
    }.bind(this));
  }, {category: ['views']});

  add.method('put', function (callback, errback) {
    this._db.putDocumentAt(this.id(), this._rawDoc, function(responseObj) {
      this._ref = responseObj.ref;
      this._rawDoc = responseObj.ref.object();
      if (callback) { callback(responseObj); }
    }, errback);
  }, {category: ['adding and removing']});

  add.method('doRequest', function (httpMethod, url, paramsStringOrObject, body, callback, errback) {
    this._db.doRequest(httpMethod, "/" + this.id() + url, paramsStringOrObject, body, callback, errback);
  }, {category: ['requests']});

  add.method('viewNamed', function (viewName) {
    return this._viewsByName[viewName] || (this._viewsByName[viewName] = Object.newChildOf(avocado.couch.db.view, this, viewName));
  }, {category: ['views']});

  add.method('addViewForRelationship', function (r) {
    var viewDoc = { map: r.stringForMapFunction() };
    r.attachMetaInfoToViewDocument(viewDoc);
    this.rawDoc().views[r.viewName()] = viewDoc;
  }, {category: ['views']});

  add.method('storeString', function () {
    return ["(", this._db.storeString(), ").designWithName(", this._name.inspect(), ")"].join("");
  }, {category: ['transporting']});

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

  add.method('storeString', function () {
    return ["(", this._design.storeString(), ").viewNamed(", this._name.inspect(), ")"].join("");
  }, {category: ['transporting']});

});


thisModule.addSlots(avocado.couch.db.query, function(add) {

  add.method('initialize', function (view, options) {
    this._view = view;
    this._options = options;
  }, {category: ['creating']});

  add.method('view', function () { return this._view; }, {category: ['accessing']});

  add.method('options', function () { return this._options; }, {category: ['accessing']});

  add.method('getResults', function (callback, errback) {
    // aaa - implement other kinds of queries, not just "get all results"
    var db = this.view().design().db();
    var viewName = this.view().name();
    this.view().design().doRequest("GET", "/_view/" + viewName, this.options(), null, function(responseObj) {
      if (responseObj.rows) {
        responseObj.refs = responseObj.rows.map(function(row) { return db.updateRealObjectFromDumbDataObject(row.value); });
      } else {
        errback(responseObj);
      }
      callback(responseObj);
    }.bind(this), errback);
  }, {category: ['views']});

});


thisModule.addSlots(avocado.couch.db.containerTypesOrganizerProto, function(add) {

  add.method('initialize', function (db) {
    this._db = db;
    this.setContainerPrototypes([]);
    this.updateContainerTypes();
  }, {category: ['creating']});

  add.method('toString', function () { return "Container types for " + this._db; });

  add.method('setContainerPrototypes', function (types) {
    types = types.toArray();
    this._containerPrototypes = types;
    types.forEach(function(containerProto) {
      containerProto.updateContents();
    });
  });

  add.method('design', function () {
    return this._db.designWithName("avocado_containers");
  }, {category: ['accessing']});

  add.method('updateContainerTypes', function (callback) {
    var design = this.design();
    design.get(function(designDoc) {
      var viewsDoc = designDoc.views;
      this.setContainerPrototypes(reflect(viewsDoc).normalSlotNames().map(function(viewName) {
        var viewDoc = viewsDoc[viewName];
        var relationship = avocado.couch.db.relationships.oneToMany.createFromViewDocument(viewDoc, viewName);
        return relationship.containerFor({}, design);
      }));
      if (callback) { callback(); }
    }.bind(this), function(err) {
      var relationship = avocado.couch.db.relationships.oneToMany.create(Object.prototype, Object.prototype, "holder");
      design.addViewForRelationship(relationship);
      design.put(function(responseObj) {
        this.setContainerPrototypes([relationship.containerFor({}, design)]);
        if (callback) { callback(); }
      }.bind(this), function(err) { throw err; });
    }.bind(this));
  }, {category: ['updating']});

  add.method('immediateContents', function () {
    return this._containerPrototypes;
  }, {category: ['accessing']});

  add.method('dragAndDropCommands', function () {
    var cmdList = avocado.command.list.create(this);
    cmdList.addItem(avocado.command.create("add container type", function(evt, container) {
      var design = this.design();
      design.get(function() {
        design.addViewForRelationship(container.relationship());
        design.put(function(responseObj) {
          this.updateContainerTypes(function() {
            avocado.ui.justChangedContent(this, evt);
          }.bind(this));
        }.bind(this), function(err) {
          console.error("Error setting the DB design: " + err.error + ", reason: " + err.reason);
        });
      }.bind(this), function(err) {
        console.error("Error getting the DB design: " + err.error + ", reason: " + err.reason);
      }.bind(this));
    }).setArgumentSpecs([avocado.command.argumentSpec.create('container').onlyAcceptsType(avocado.couch.db.container)]));
    return cmdList;
  }, {category: ['commands']});

});


});
