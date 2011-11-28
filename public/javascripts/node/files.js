avocado.transporter.module.create('node/files', function(requires) {

}, function(thisModule) {


thisModule.addSlots(nodejs, function(add) {
  
  add.creator('fileOrDirectory', {}, {category: ['file system']});

  add.creator('directory', Object.create(nodejs.fileOrDirectory), {category: ['file system']});

  add.creator('file', Object.create(nodejs.fileOrDirectory), {category: ['file system']});
  
});


thisModule.addSlots(nodejs.fileOrDirectory, function(add) {
  
  add.method('create', function () {
    var o = Object.create(this);
    o.initialize.apply(o, arguments);
    return o;
  }, {category: ['creating']});
  
  add.method('initialize', function (owner, name) {
    this._owner = owner;
    this._name = name;
  }, {category: ['creating']});
  
  add.method('toString', function () {
    return this.immediateName();
  }, {category: ['printing']});

  add.method('immediateName', function () {
    return this._name;
  }, {category: ['printing']});

  add.method('fullName', function () {
    return (this._owner ? this._owner.fullName() + "/" : "") + this.immediateName();
  }, {category: ['printing']});

  add.method('hashCode', function () {
    return this.fullName();
  }, {category: ['comparing']});

  add.method('equals', function (other) {
    return typeof(other.fullName) === 'function' && this.fullName() === other.fullName();
  }, {category: ['comparing']});
  
  add.data('isImmutableForMorphIdentity', true, {category: ['comparing']});

  add.method('sortOrder', function () { return this.fullName().toUpperCase(); }, {category: ['sorting']});
  
});


thisModule.addSlots(nodejs.directory, function(add) {
  
  add.method('subdir', function (name) {
    return nodejs.directory.create(this, name);
  }, {category: ['creating']});
  
  add.method('fileNamed', function (name) {
    return nodejs.file.create(this, name);
  }, {category: ['creating']});

  add.method('getNames', function (callback, errback) {
    nodejs.fs.readdir(this.fullName(), function(err, files) {
      if (err) {
        errback(err);
      } else {
        if (callback) { callback(files); }
      }
    });
  }, {category: ['comparing']});
  
});


thisModule.addSlots(nodejs.file, function(add) {
  
  add.method('getContents', function (callback, errback) {
    nodejs.fs.readFile(this.fullName(), 'utf8', function (err, contents) {
      if (err) {
        errback(err);
      } else {
        if (callback) { callback(contents); }
      }
    });
  }, {category: ['comparing']});
  
});


});
