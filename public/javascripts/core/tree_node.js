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

  add.method('toString', function () {
    return this._name;
  }, {category: ['printing']});

  add.method('immediateContents', function () {
    return this._immediateContents;
  }, {category: ['accessing']});

  add.method('setImmediateContents', function (contents) {
    this._immediateContents = contents;
    return this;
  }, {category: ['accessing']});

  add.method('setImmediateContentsToResultOrErrorFrom', function (request) {
    request.get(function(result) {
      this.setImmediateContents(result);
      avocado.ui.justChanged(this);
    }.bind(this), function(err) {
      this.setImmediateContents([Error.create(err)]);
      avocado.ui.justChanged(this);
    }.bind(this));
  }, {category: ['accessing']});

});


});
