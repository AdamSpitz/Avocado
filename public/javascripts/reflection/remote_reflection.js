avocado.transporter.module.create('reflection/remote_reflection', function(requires) {

requires('reflection/mirror');

}, function(thisModule) {


thisModule.addSlots(avocado, function(add) {

  add.creator('remoteMirror', Object.create(avocado.mirror), {category: ['reflection', 'remote']});

});


thisModule.addSlots(avocado.remoteMirror, function(add) {

  add.method('initialize', function (server, remoteOIDOrPrimitive, type) {
    this._server = server;
    this._remoteOIDOrPrimitive = remoteOIDOrPrimitive;
    this._type = type;
    this._contentsByName = {};
    this._typesByName = {};
  }, {category: ['creating']});

  add.creator('tests', Object.create(avocado.testCase), {category: ['tests']});

  add.method('reflectee', function () {
    throw new Error('Cannot access reflectee of a remote object');
  }, {category: ['accessing']});

  add.method('storeStringNeeds', function () {
    return avocado.remoteMirror;
  }, {category: ['transporting']});

  add.method('remoteOIDOrPrimitive', function () {
    return this._remoteOIDOrPrimitive;
  }, {category: ['numbers']});

  add.method('primitiveReflectee', function () {
    if (this.hasOID()) { throw new Error("not a primitive"); }
    return this._remoteOIDOrPrimitive;
  }, {category: ['numbers']});

  add.method('remoteOID', function () {
    if (! this.hasOID()) { throw new Error("not an object"); }
    return this._remoteOIDOrPrimitive;
  }, {category: ['accessing']});

  add.method('hasOID', function () {
    return this.canHaveSlots();
  }, {category: ['testing']});

  add.method('server', function () {
    return this._server;
  }, {category: ['accessing']});

  add.method('updateContentsAndTypes', function (contentsByName, typesByName) {
    this._contentsByName = contentsByName;
    this._typesByName = typesByName;
  }, {category: ['updating']});

  add.method('equals', function (m) {
    if (!m) { return false; }
    if (typeof(m.server) !== 'function') { return false; }
    if (typeof(m.remoteOIDOrPrimitive) !== 'function') { return false; }
    if (typeof(m.reflecteeType) !== 'function') { return false; }
    return this.remoteOIDOrPrimitive() === m.remoteOIDOrPrimitive() && this.reflecteeType() === m.reflecteeType() && this.server() === m.server();
  }, {category: ['comparing']});

  add.method('hashCode', function () {
    return avocado.identityHashFor(this.remoteOIDOrPrimitive());
  }, {category: ['comparing']});

  add.method('isRootOfGlobalNamespace', function () {
    return false; // aaa for now;
  }, {category: ['naming']});

  add.method('reflecteeToString', function () {
    return ""; // aaa do a remote call?;
  }, {category: ['naming']});

  add.method('inspect', function ($super) {
    return [$super(), " (on ", this._server.inspect(), ")"].join("");
  }, {category: ['naming']});

  add.method('realSlotNameFor', function (n) {
    if (n.substring(0, 5) !== 'slot_') { throw new Error("Assertion failure: why doesn't it start with 'slot_'?"); }
    return n.substring(5);
  }, {category: ['accessing slot contents']});

  add.method('eachNormalSlotName', function (f) {
    reflect(this._contentsByName).eachNormalSlotName(function (key) {
      var n = this.realSlotNameFor(key);
      if (n !== '__annotation__' && n !== '__proto__') {
        f(n);
      }
    }.bind(this));
  }, {category: ['iterating']});

  add.method('contentsAt', function (n) {
    var key = 'slot_' + n;
    return this._server.mirrorForOIDAndType(this._contentsByName[key], this._typesByName[key]);
  }, {category: ['accessing slot contents']});

  add.method('setContentsAt', function (n, mir) {
    this._server.setSlotContents(this.remoteOID(), n, mir.remoteOIDOrPrimitive(), mir.reflecteeType());
  }, {category: ['accessing slot contents']});

  add.method('removeSlotAt', function (n) {
    this._server.removeSlot(this.remoteOID(), n);
  }, {category: ['accessing slot contents']});

  add.method('reflecteeObjectHasOwnProperty', function (n) {
    return this._contentsByName.hasOwnProperty('slot_' + n);
  }, {category: ['accessing reflectee']});

  add.method('reflecteeType', function () {
    return this._type;
  }, {category: ['accessing']});

  add.method('canAccessParent', function () {
    return this.hasOID(); // aaa for now, can't access Number.prototype, String.prototype, etc.;
  }, {category: ['testing']});

  add.method('isReflecteeNull', function () {
    return this._remoteOIDOrPrimitive === null;
  }, {category: ['testing']});

  add.method('isReflecteeArray', function () {
    return this.reflecteeType() === 'object' && this.reflecteeHasOwnProperty('length'); // aaa reasonable approximation for now;
  }, {category: ['testing']});

  add.method('isReflecteeSimpleMethod', function () {
    return false; // aaa for now;
  }, {category: ['testing']});

  add.method('isReflecteeProbablyAClass', function () {
    return false; // aaa for now;
  }, {category: ['testing']});

  add.method('reflecteeLength', function () {
    return this.contentsAt('length').primitiveReflectee();
  }, {category: ['arrays']});

  add.method('getExistingAnnotation', function () {
    return null; // aaa how do we do annotations?;
  }, {category: ['annotations']});

});


thisModule.addSlots(avocado.remoteMirror.tests, function(add) {

  add.method('testSimpleObject', function () {
    var s = avocado.mockRemoteObjectServer.create();
    s.addObject({x: 3, y: 4});
    s.rootOID(function(rootOID) {
      this.assertEqual(0, rootOID);
      var rootMir = s.mirrorForOIDAndType(rootOID, 'object');
      this.assertEqual(['x', 'y'], rootMir.normalSlotNames().toArray());
      // avocado.ui.grab(rootMir);
    }.bind(this));
  });

});


thisModule.addSlots(avocado, function(add) {

  add.creator('remoteObjectServer', {}, {category: ['reflection', 'remote']});

});


thisModule.addSlots(avocado.remoteObjectServer, function(add) {

  add.method('create', function () {
    var c = Object.create(this);
    c.initialize.apply(c, arguments);
    return c;
  }, {category: ['creating']});

  add.method('initialize', function () {
    this._cachedMirrors = avocado.set.copyRemoveAll();
  }, {category: ['creating']});

  add.method('mirrorForOIDAndType', function (oid, t) {
    var mir = Object.newChildOf(avocado.remoteMirror, this, oid, t);
    var existingMir = this._cachedMirrors.entryForKey(mir);
    if (existingMir) { return existingMir; }
    this._cachedMirrors.add(mir);
    this.updateMirror(mir);
    return mir;
  });

  add.method('updateMirror', function (mir) {
    this.getObjectContents(mir.remoteOIDOrPrimitive(), mir.reflecteeType(), function(contentsByName, typesByName) {
      mir.updateContentsAndTypes(contentsByName, typesByName);
    });
  }, {category: ['updating']});

});


thisModule.addSlots(avocado, function(add) {

  add.creator('mockRemoteObjectServer', Object.create(avocado.remoteObjectServer), {category: ['reflection', 'remote']});

});


thisModule.addSlots(avocado.mockRemoteObjectServer, function(add) {

  add.data('_nextOID', 0);

  add.method('initialize', function ($super) {
    $super();
    this._objectsByOID = [];
    this._oidsByObject = Object.newChildOf(avocado.dictionary, avocado.dictionary.identityComparator);
  }, {category: ['creating']});

  add.method('inspect', function () {
    return "mock server";
  }, {category: ['printing']});

  add.method('addObject', function (o) {
    var remoteOID = this._nextOID++;
    this._objectsByOID[remoteOID] = o;
    this._oidsByObject.put(o, remoteOID);
    return remoteOID;
  }, {category: ['mocking']});

  add.method('rootOID', function (callback) {
    // aaa not right, obviously
    callback(0);
  }, {category: ['remote protocol']});

  add.method('getObjectContents', function (oidOrPrimitive, type, callback) {
    var localObj = (type === 'function' || (type === 'object' && oidOrPrimitive !== null)) ? this.objectForOID(oidOrPrimitive) : oidOrPrimitive;
    var localMir = reflect(localObj);
    var contentsByName = {};
    var typesByName = {};
    localMir.slots().each(function(s) {
      var n = 'slot_' + s.name();
      var c = s.contents().reflectee();
      contentsByName[n] = this.oidOrPrimitiveForObject(c);
      typesByName[n] = typeof(c);
    }.bind(this));
    callback(contentsByName, typesByName);
  }, {category: ['remote protocol']});

  add.method('objectForOID', function (oid) {
    return this._objectsByOID[oid];
  }, {category: ['mocking']});

  add.method('isPrimitive', function (obj) {
    var t = typeof(obj);
    return ! (t === 'function' || (t === 'object' && obj !== null));
  }, {category: ['mocking']});

  add.method('oidOrPrimitiveForObject', function (obj) {
    if (this.isPrimitive(obj)) {
      return obj;
    } else {
      return this._oidsByObject.getOrIfAbsent(obj, function() { return this.addObject(obj); }.bind(this));
    }
  }, {category: ['mocking']});

  add.method('setSlotContents', function (remoteOID, n, contentsRemoteOID, contentsType, callback) {
    var v;
    if (contentsType === 'function' || (contentsType === 'object' && contentsRemoteOID !== null)) {
      v = this.objectForOID(contentsRemoteOID);
    } else {
      v = contentsRemoteOID;
    }
    reflect(this.objectForOID(remoteOID)).setContentsAt(n, reflect(v));
    if (callback) { callback(); }
  }, {category: ['remote protocol']});

  add.method('removeSlot', function (remoteOID, n, callback) {
    reflect(this.objectForOID(remoteOID)).removeSlotAt(n);
    if (callback) { callback(); }
  }, {category: ['remote protocol']});

});


});
