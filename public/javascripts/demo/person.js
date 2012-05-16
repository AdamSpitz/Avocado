avocado.transporter.module.create('demo/person', function(requires) {

requires('core/deep_copy');

}, function(thisModule) {


thisModule.addSlots(avocado, function(add) {

  add.creator('person', Object.create({}));

  add.creator('humanName', Object.create({}));

});


thisModule.addSlots(avocado.person, function(add) {

  add.creator('example', Object.create(avocado.person));

  add.method('toString', function () { return this._name.toString(); });

});


thisModule.addSlots(avocado.person.example, function(add) {

  add.creator('_name', Object.create(avocado.humanName));

  add.data('_age', 45);

});


thisModule.addSlots(avocado.person.example._name, function(add) {

  add.data('_first', 'Bob');

  add.data('_middle', 'J.');

  add.data('_last', 'Smith');

});


thisModule.addSlots(avocado.humanName, function(add) {

  add.creator('example', Object.create(avocado.humanName));

  add.method('copy', function () {
    return Object.deepCopyRecursingIntoCreatorSlots(this);
  }, {category: ['copying']});

  add.method('toString', function () {
    var n = [];
    if (this._first ) { n.push(this._first ); }
    if (this._middle) { n.push(this._middle); }
    if (this._last  ) { n.push(this._last  ); }
    return n.join(" ");
  }, {category: ['printing']});

  add.method('set', function (first, middle, last) {
    this._first = first;
    this._middle = middle;
    this._last = last;
    return this;
  }, {category: ['accessing']});

});


thisModule.addSlots(avocado.humanName.example, function(add) {

  add.data('_first', 'Bullwinkle');

  add.data('_middle', 'J.');

  add.data('_last', 'Moose');

});


});
