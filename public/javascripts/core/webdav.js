avocado.transporter.module.create('core/webdav', function(requires) {

}, function(thisModule) {


thisModule.addSlots(avocado, function(add) {

  add.creator('webdav', {}, {category: ['WebDAV']});

});


thisModule.addSlots(avocado.transporter.repositories.httpWithWebDAV, function(add) {
  
  add.method('immediateContents', function () {
    return [this._rootDir || (this._rootDir = new FileDirectory(new URL(this._url)))];
  });
  
});


thisModule.addSlots(avocado.webdav, function(add) {

  add.creator('file', {});

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
      var files = this.files().selectThenMap(function(fileURL) { return ! fileURL.filename().startsWith("."); }, function(fileURL) { return Object.newChildOf(avocado.webdav.file, fileURL); });
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


thisModule.addSlots(avocado.webdav.file, function(add) {
  
  add.method('initialize', function (url) {
    this._url = url;
  }, {category: ['creating']});

  add.method('fileName', function () {
    return this._url.filename();
  }, {category: ['accessing']});

  add.method('contentText', function () {
    if (typeof(this._cachedContents) === 'undefined' && !this._contentsReq) {
      try {
        var thisFile = this;
        var req = new XMLHttpRequest();
        this._contentsReq = req;
        req.open("GET", this.urlString(), true);
        req.onreadystatechange = function() {
          if (req.readyState === 4) {
            thisFile._cachedContents = req.responseText;
            delete thisFile._contentsReq;

            var aaa_wantToTimeTheRefresh = true;
            if (! aaa_wantToTimeTheRefresh) {
              avocado.ui.justChanged(thisFile);
            } else {
              var t1 = new Date().getTime();
              var m = avocado.ui.worldFor(Event.createFake()).existingMorphFor(thisFile);
              if (m) { m.refreshContentIfOnScreenOfMeAndSubmorphs(); }
              var t2 = new Date().getTime();
              console.log("Took: " + (t2 - t1));
            }
          }
        };
        req.send();
      } catch (ex) {
        return "cannot get contents"
      }
    }
    return this._cachedContents || "";
  }, {category: ['accessing']});

  add.method('setContentText', function (t) {
    this._cachedContents = t || "";
    if (!this._contentsSetterReq) {
      try {
        var thisFile = this;
        var req = new XMLHttpRequest();
        this._contentsSetterReq = req;
        req.open("PUT", this.urlString(), true);
        req.onreadystatechange = function() {
          if (req.readyState === 4) {
            delete thisFile._contentsSetterReq;
          }
        };
        req.send(this._cachedContents);
      } catch (ex) {
        return "cannot get contents"
      }
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


});
