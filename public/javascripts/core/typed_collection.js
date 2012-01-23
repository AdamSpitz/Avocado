avocado.transporter.module.create('core/typed_collection', function(requires) {

}, function(thisModule) {


thisModule.addSlots(avocado, function(add) {

  add.creator('typedCollection', {}, {category: ['collections']}, {copyDownParents: [{parent: Enumerable}]});

});


thisModule.addSlots(avocado.typedCollection, function(add) {
  
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

  add.method('size', function () {
    return this._elements.size();
  }, {category: ['accessing']});

  add.method('remove', function (element) {
    this._elements.remove(element);
  }, {category: ['accessing']});

  add.method('mapElementsAndType', function (elementMapFn, typeMapFn) {
    return avocado.typedCollection.create(typeMapFn(this.elementType()), this.elements().map(elementMapFn));
  }, {category: ['accessing']});

  add.method('commands', function () {
    var cmdList = avocado.command.list.create(this);
    cmdList.addItem(avocado.command.create("add", function(evt) {
      var newOne = this.elementType().createForAddingTo ? this.elementType().createForAddingTo(this) : this.elementType().create();
      this.elements().push(newOne);
      avocado.ui.justChanged(this, function(morph) {
        morph.takeInputFocus(evt.hand);
      }, evt);
    }));
    return cmdList;
  }, {category: ['user interface', 'commands']});

});


});
