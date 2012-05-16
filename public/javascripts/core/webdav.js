avocado.transporter.module.create('core/webdav', function(requires) {

}, function(thisModule) {


thisModule.addSlots(avocado, function(add) {

  add.creator('webdav', {}, {category: ['WebDAV']});

});


thisModule.addSlots(avocado.webdav, function(add) {

  add.creator('file', {});

});


thisModule.addSlots(avocado.webdav.file, function(add) {

  add.method('create', function (url) {
    return Object.newChildOf(this, url);
  }, {category: ['creating']});

  add.method('initialize', function (url) {
    this._url = url;
  }, {category: ['creating']});

  add.method('fileName', function () {
    return this._url.filename();
  }, {category: ['accessing']});

  add.method('contentText', function (callback) {
    if (typeof(this._cachedContents) === 'undefined' && !this._contentsReq) {
      var thisFile = this;
      var req = Object.newChildOf(avocado.http.request, this.urlString());
      this._contentsReq = req;
      req.send(function(responseText) {
        thisFile._cachedContents = responseText;
        delete thisFile._contentsReq;
        avocado.ui.justChanged(thisFile);
        if (callback) { callback(responseText); }
      }, function(err) {
        console.log("Error getting contents of " + thisFile.urlString() + " - " + err);
      });
    }
    return this._cachedContents || "";
  }, {category: ['accessing']});

  add.method('setContentText', function (t, callback) {
    this._cachedContents = t || "";
    if (!this._contentsSetterReq) {
      var thisFile = this;
      var req = Object.newChildOf(avocado.http.request, this.urlString()).setHTTPMethod("PUT").setPostBody(this._cachedContents);
      this._contentsSetterReq = req;
      req.send(function() {
        delete thisFile._contentsSetterReq;
        if (callback) { callback(); }
      }, function(err) {
        console.log("Error setting contents of " + thisFile.urlString() + " - " + err);
      });
    }
    avocado.ui.justChanged(thisFile);
  }, {category: ['accessing']});

  add.method('urlString', function () {
    return this._url.toString();
  }, {category: ['accessing']});

  add.method('toString', function () {
    return this.fullName();
  }, {category: ['printing']});

  add.method('fullName', function () {
    return this.urlString();
  }, {category: ['printing']});

  add.method('hashCode', function () {
    return this.urlString();
  }, {category: ['comparing']});

  add.method('equals', function (other) {
    return typeof(other.urlString) === 'function' && this.urlString() === other.urlString();
  }, {category: ['comparing']});

  add.data('isImmutableForMorphIdentity', true, {category: ['comparing']});

  add.method('sortOrder', function () { return this.urlString().toUpperCase(); }, {category: ['sorting']});

});


thisModule.addSlots(avocado.transporter.repositories.httpWithWebDAV, function(add) {

  add.method('immediateContents', function () {
    return [this._rootDir || (this._rootDir = new FileDirectory(new URL(this._url)))];
  });

});


thisModule.addSlots(FileDirectory.prototype, function(add) {

  add.method('urlString', function () {
    return this.url.toString();
  }, {category: ['accessing']});

  add.method('toString', function () {
    return this.immediateName();
  }, {category: ['printing']});

  add.method('immediateName', function () {
    return this.url.filename();
  }, {category: ['printing']});

  add.method('hashCode', function () {
    return this.urlString();
  }, {category: ['comparing']});

  add.method('equals', function (other) {
    return typeof(other.urlString) === 'function' && this.urlString() === other.urlString();
  }, {category: ['comparing']});

  add.data('isImmutableForMorphIdentity', true, {category: ['comparing']});

  add.method('sortOrder', function () { return this.urlString().toUpperCase(); }, {category: ['sorting']});

  add.method('immediateContents', function () {
    if (! this._immediateContents) {
      var subdirs = this.subdirectories().selectThenMap(function(subDirURL) { return ! subDirURL.filename().startsWith("."); }, function(subDirURL) { return new FileDirectory(subDirURL); });
      var files = this.files().selectThenMap(function(fileURL) { return ! fileURL.filename().startsWith("."); }, function(fileURL) { return avocado.webdav.file.create(fileURL); });
      this._immediateContents = subdirs.concat(files);
    }
    return this._immediateContents;
  }, {category: ['user interface']});

  add.method('commands', function () {
    var cmdList = avocado.command.list.create();
    return cmdList;
  }, {category: ['user interface']});

  add.method('dragAndDropCommands', function () {
    var cmdList = avocado.command.list.create();
    return cmdList;
  }, {category: ['user interface']});

});


});
