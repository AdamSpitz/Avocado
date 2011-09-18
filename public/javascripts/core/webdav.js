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

  add.creator('directory', {});

  add.creator('file', {});

});


thisModule.addSlots(FileDirectory.prototype, function(add) {
  
  add.method('urlString', function () {
    return this.url.toString();
  }, {category: ['accessing']});

  add.method('toString', function () {
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
  
  add.method('immediateContents', function () {
    if (! this._immediateContents) {
      var subdirs = this.subdirectories().map(function(subDirURL) { return new FileDirectory(subDirURL); });
      var files = this.files().map(function(fileURL) { return Object.newChildOf(avocado.webdav.file, fileURL); });
      this._immediateContents = subdirs.concat(files);
    }
    return this._immediateContents;
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
  }, {category: ['printing']});

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
            var t1 = new Date().getTime();
            var m = avocado.ui.worldFor(Event.createFake()).existingMorphFor(thisFile);
            if (m) {
              for (var i = 0; i < 1; ++i) {
                m.refreshContentIfOnScreenOfMeAndSubmorphs();
              }
            }
            // aaaaaaaaaa put this back instead: avocado.ui.justChanged(thisFile);
            var t2 = new Date().getTime();
            console.log("Took: " + (t2 - t1));
          }
        };
        req.send();
      } catch (ex) {
        return "cannot get contents"
      }
    }
    return this._cachedContents || "";
  }, {category: ['printing']});
  
  add.method('urlString', function () {
    return this._url.toString();
  }, {category: ['accessing']});

  add.method('toString', function () {
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
