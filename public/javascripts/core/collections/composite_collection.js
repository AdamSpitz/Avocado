avocado.transporter.module.create('core/collections/composite_collection', function(requires) {

}, function(thisModule) {


thisModule.addSlots(avocado, function(add) {

  add.creator('compositeCollection', {}, {category: ['collections']}, {comment: 'A collection made up of multiple subcollections', copyDownParents: [{parent: Enumerable}]});

});


thisModule.addSlots(avocado.compositeCollection, function(add) {

  add.method('include', function (e) {
    return this._subcollections.any(function(subcollection) { return subcollection.include(e); });
  }, {category: ['testing']});

  add.method('toArray', function () {
    var a = [];
    this.each(function(x) { a.push(x); });
    return a;
  }, {category: ['transforming']});

  add.method('size', function () {
    var s = 0;
    this._subcollections.each(function(subcollection) { s += subcollection.size(); });
    return s;
  }, {category: ['accessing']});

  add.method('create', function () {
    var c = Object.create(this);
    c.initialize.apply(c, arguments);
    return c;
  }, {category: ['creating']});

  add.method('initialize', function (subcollections) {
    this._subcollections = subcollections;
  }, {category: ['creating']});

  add.method('_each', function (f) {
    this._subcollections._each(function(subcollection) {
      subcollection._each(f);
    });
  }, {category: ['iterating']});

  add.method('forEach', function (f) {
    return this.each(f);
  }, {category: ['iterating']});

  add.method('sort', function (f) {
    return this.toArray().sort(f);
  }, {category: ['sorting']});

  add.creator('tests', Object.create(avocado.testCase), {category: ['tests']});

});


thisModule.addSlots(avocado.compositeCollection.tests, function(add) {

  add.method('testSimple', function () {
    var c = avocado.compositeCollection.create([[1, 2, 3], [4], [5, 6, 7]]);
    this.assertEqual([1, 2, 3, 4, 5, 6, 7].join(' '), c.toArray().join(' '));
    this.assert(c.include(1));
    this.assert(c.include(3));
    this.assert(c.include(7));
    this.assert(! c.include(8));
    this.assertEqual(7, c.size());
  });

});


});
