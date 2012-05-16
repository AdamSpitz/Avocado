avocado.transporter.module.create('core/modification_flag', function(requires) {

}, function(thisModule) {


thisModule.addSlots(avocado, function(add) {

  add.creator('modificationFlag', {}, {category: ['core']});

});


thisModule.addSlots(avocado.modificationFlag, function(add) {

  add.method('create', function (object, children) {
    return Object.newChildOf(this, object, children);
  }, {category: ['creating']});

  add.method('initialize', function (object, children) {
    this._object = object;
    this._children = children;
    this._hasChanged = false;
  }, {category: ['creating']});

  add.method('object', function () {
    return this._object;
  }, {category: ['accessing']});

  add.method('children', function () {
    return this._children;
  }, {category: ['accessing']});

  add.method('toString', function () {
    return ["modificationFlag(", this.hasJustThisOneChanged(), ") for ", this.object().toString()].join("");
  }, {category: ['printing']});

  add.method('hasChanged', function () {
    return this.hasThisOneOrChildrenChanged();
  }, {category: ['testing']});

  add.method('hasThisOneOrChildrenChanged', function () {
    if (this.hasJustThisOneChanged()) { return true; }
    if (this._children) {
      if (this._children.detect(function(c) { return c.hasChanged(); })) { return true; }
    }
    return false;
  }, {category: ['testing']});

  add.method('hasJustThisOneChanged', function () {
    return !! this._hasChanged;
  }, {category: ['testing']});

  add.method('notifier', function () {
    return this._notifier || (this._notifier = avocado.notifier.on(this.object()));
  }, {category: ['notification']});

  add.method('markAsChanged', function () {
    this._hasChanged = true;
    if (this._notifier) { this._notifier.notifyAllObservers(); }
  }, {category: ['marking']});

  add.method('markAsUnchanged', function () {
    this._hasChanged = false;
    if (this._notifier) { this._notifier.notifyAllObservers(); }
  }, {category: ['marking']});

});


});
