avocado.transporter.module.create('core/history', function(requires) {

}, function(thisModule) {


thisModule.addSlots(avocado, function(add) {

  add.creator('history', {}, {category: ['core']});

});


thisModule.addSlots(avocado.history, function(add) {

  add.method('create', function () {
    var h = Object.create(this);
    h.initialize.apply(h, arguments);
    return h;
  }, {category: ['creating']});

  add.method('initialize', function (name) {
    this._name = name;
    this._versions = [];
  }, {category: ['creating']});

  add.method('toString', function () {
    return this._name;
  }, {category: ['printing']});

  add.method('inspect', function () {
    return this.toString();
  }, {category: ['printing']});

  add.method('latest', function () {
    if (this._versions.length === 0) { return null; }
    return this._versions[this._versions.length - 1];
  }, {category: ['accessing']});

  add.method('addLatest', function (v) {
    if (this._versions.length > 0 && this.latest() === null) {
      this._versions[this._versions.length - 1] = v;
    } else {
      this._versions.push(v);
    }
  }, {category: ['accessing']});

  add.method('clearLatest', function () {
    if (this.latest() !== null) {
      this.addLatest(null);
    }
  }, {category: ['accessing']});

});


});
