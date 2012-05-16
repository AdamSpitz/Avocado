avocado.transporter.module.create('core/collections/typed_collection', function(requires) {

}, function(thisModule) {


thisModule.addSlots(avocado, function(add) {

  add.creator('typedCollection', {}, {category: ['collections']}, {copyDownParents: [{parent: Enumerable}]});

});


thisModule.addSlots(avocado.typedCollection, function(add) {

  add.method('size', function () {
    return this._elements.size();
  }, {category: ['accessing']});

  add.method('create', function () {
    var c = Object.create(this);
    c.initialize.apply(c, arguments);
    return c;
  }, {category: ['creating']});

  add.method('initialize', function (elementType, elements) {
    this._elementType = elementType;
    this._elements = elements || [];
  }, {category: ['creating']});

  add.method('elementType', function () {
    return this._elementType;
  }, {category: ['accessing']});

  add.method('elements', function () {
    return this._elements;
  }, {category: ['accessing']});

  add.method('setElements', function (c) {
    this._elements = c;
    return this;
  }, {category: ['accessing']});

  add.method('forEach', function (f) {
    this._elements.forEach(f);
  }, {category: ['iterating']});

  add.method('_each', function (f) {
    this.forEach(f);
  }, {category: ['iterating']});

  add.method('remove', function (element) {
    this._elements.remove(element);
  }, {category: ['accessing']});

  add.method('mapElementsAndType', function (elementMapFn, typeMapFn) {
    return avocado.typedCollection.create(typeMapFn(this.elementType()), this.elements().map(elementMapFn));
  }, {category: ['accessing']});

  add.method('push', function (element) {
    this.elements().push(element);
  }, {category: ['adding']});

  add.method('addANewOne', function () {
    var newOne = this.elementType().createForAddingTo ? this.elementType().createForAddingTo(this) : this.elementType().create();
    this.push(newOne);
    return newOne;
  }, {category: ['adding']});

  add.method('ifNotAlreadyPresentAdd', function (element) {
    if (! this._elements.include(element)) {
      this.push(element);
    }
  }, {category: ['accessing']});

  add.method('commands', function () {
    var cmdList = avocado.command.list.create(this);
    cmdList.addItem(avocado.command.create("add", function(evt) {
      var newOne = this.addANewOne();
      avocado.ui.justChanged(this, function(morph) {
        avocado.ui.setInputFocus(newOne, evt);
      }, evt);
    }));
    return cmdList;
  }, {category: ['user interface', 'commands']});

});


});
