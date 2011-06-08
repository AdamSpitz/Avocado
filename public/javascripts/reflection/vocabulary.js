avocado.transporter.module.create('reflection/vocabulary', function(requires) {

requires('reflection/mirror');

}, function(thisModule) {


thisModule.addSlots(avocado, function(add) {

  add.creator('vocabulary', {}, {category: ['reflection']}, {comment: 'If you\'ve got a better name for this object, I\'m open to suggestions.\nThe idea is that this represents every message an object understands.'});

});


thisModule.addSlots(avocado.vocabulary, function(add) {

  add.method('create', function (mir) {
    return Object.newChildOf(this, mir);
  }, {category: ['creating']});

  add.method('initialize', function (mir) {
    this._mirror = mir;
  }, {category: ['creating']});

  add.method('mirror', function () { return this._mirror; }, {category: ['accessing']});

  add.method('equals', function (other) {
    if (!other) { return false; }
    if (this.mirror !== other.mirror) { return false; }
    return this.mirror().equals(other.mirror());
  }, {category: ['comparing']});

  add.method('hashCode', function () {
    return "vocabulary for " + this.mirror().hashCode();
  }, {category: ['comparing']});

  add.method('inspect', function () {
    return "vocabulary for " + this.mirror().inspect();
  }, {category: ['printing']});

  add.method('toString', function () {
    return this.inspect();
  }, {category: ['printing']});

});


});
