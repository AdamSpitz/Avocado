avocado.transporter.module.create('core/tree_node', function(requires) {

}, function(thisModule) {


thisModule.addSlots(avocado, function(add) {

  add.creator('treeNode', {}, {category: ['tree nodes']});

});


thisModule.addSlots(avocado.treeNode, function(add) {

  add.method('create', function () {
    var n = Object.create(this);
    n.initialize.apply(n, arguments);
    return n;
  }, {category: ['creating']});

  add.method('initialize', function (name, contents) {
    this._name = name;
    this._immediateContents = contents;
  }, {category: ['creating']});

  add.method('name', function () {
    return this._name;
  }, {category: ['accessing']});

  add.method('setName', function (n) {
    this._name = n;
    return this;
  }, {category: ['accessing']});

  add.method('toString', function () {
    return this._name;
  }, {category: ['printing']});

  add.method('immediateContents', function () {
    return this._immediateContents;
  }, {category: ['accessing']});

  add.method('eachOfImmediateContents', function (f) {
    if (typeof(this._immediateContents.forEach) === 'function') {
      this._immediateContents.forEach(f);
    } else {
      f(this._immediateContents);
    }
  }, {category: ['iterating']});

  add.method('setImmediateContents', function (contents) {
    this._immediateContents = contents;
    return this;
  }, {category: ['accessing']});

  add.method('getNewContentsFrom', function (request, callback) {
    request.get(callback, function(err) { callback([Error.create(err)]); });
  }, {category: ['accessing']});

  add.method('asynchronousContentRequest', function () {
    return this._asynchronousContentRequest;
  }, {category: ['updating']});

  add.method('setAsynchronousContentRequest', function (req) {
    this._asynchronousContentRequest = req;
    return this;
  }, {category: ['updating']});

  add.method('getRemoteData', function () {
    this.eachOfImmediateContents(function(c) {
      if (c && typeof(c.getRemoteData) === 'function') { c.getRemoteData(); }
    });
    
    var req = this.asynchronousContentRequest();
    if (req) {
      this.getNewContentsFrom(req, function(newContents) {
        this.setImmediateContents(newContents);
        avocado.ui.justChanged(this);
      }.bind(this));
    }
    
    return this;
  }, {category: ['updating']});

  add.method('commands', function () {
    // aaa - this might be a bad idea; do I really want the commands to be on the tree node rather than on the contents?
    return this._immediateContents.commands && this._immediateContents.commands();
  }, {category: ['user interface', 'commands']});

});


});
