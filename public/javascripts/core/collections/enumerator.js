avocado.transporter.module.create('core/collections/enumerator', function(requires) {

}, function(thisModule) {


thisModule.addSlots(avocado, function(add) {

  add.creator('enumerator', {}, {category: ['collections']}, {comment: 'An Enumerable whose contents are whatever is yielded by calling the specified method.', copyDownParents: [{parent: Enumerable}]});

});


thisModule.addSlots(avocado.enumerator, function(add) {

  add.method('map', function (transformer) {
    return avocado.enumerator.create(this, 'eachMappedBy', transformer);
  }, {category: ['transforming']});

  add.method('select', function (condition) {
    return avocado.enumerator.create(this, 'eachFilteredBy', condition);
  }, {category: ['transforming']});

  add.method('toArray', function () {
    var a = [];
    this.each(function(x) { a.push(x); });
    return a;
  }, {category: ['transforming']});

  add.method('create', function () {
    var e = Object.create(this);
    e.initialize.apply(e, arguments);
    return e;
  }, {category: ['creating']});

  add.method('initialize', function () {
    var args = $A(arguments);
    this._object = args.shift();
    this._methodName = args.shift();
    this._methodArgs = args;
  }, {category: ['creating']});

  add.method('toString', function () {
    var s = [this._object.toString(), ".", this._methodName, "("];
    this._methodArgs.each(function(arg) { s.push("" + arg); });
    s.push(")");
    return s.join("");
  }, {category: ['printing']});

  add.method('forEach', function (f) {
    return this._each(f);
  }, {category: ['iterating']});

  add.method('_each', function (f) {
    var method = this._object[this._methodName];
    if (this._methodArgs.length === 0) { // just an optimization to avoid creating unnecessary arrays
      return method.call(this._object, f);
    } else {
      return method.apply(this._object, this._methodArgs.concat([f]));
    }
  }, {category: ['iterating']});

  add.method('sort', function (f) {
    return this.toArray().sort(f);
  }, {category: ['sorting']});

  add.method('eachFilteredBy', function (condition, f) {
    this.each(function(x) { if (condition(x)) { f(x); }; });
  }, {category: ['transforming']});

  add.method('eachMappedBy', function (transformer, f) {
    this.each(function(x) { f(transformer(x)); });
  }, {category: ['transforming']});

  add.creator('tests', Object.create(avocado.testCase), {category: ['tests']});

});


thisModule.addSlots(avocado.enumerator.tests, function(add) {

  add.method('eachInteger', function (start, end, f) {
    this._startedIterating = true;
    for (var i = start; i < end; ++i) { f(i); }
  });

  add.method('testToArray', function () {
    var e = avocado.enumerator.create(this, 'eachInteger', 3, 10);
    this.assertEqual([3, 4, 5, 6, 7, 8, 9].join(','), e.toArray().join(','));
  });

  add.method('testSelectAndMap', function () {
    var ints = avocado.enumerator.create(this, 'eachInteger', 1, 10);
    
    var odds = ints.select(function(i) { return i % 2 === 1; });
    this.assert(! this._startedIterating, "select() should return another enumerator; don't actually iterate until we have to");
    this.assertEqual([1, 3, 5, 7, 9].join(','), odds.toArray().join(','));
    this.assert(this._startedIterating);
    this._startedIterating = false;
    
    var squares = ints.map(function(i) { return i * i; });
    this.assert(! this._startedIterating, "map() should return another enumerator; don't actually iterate until we have to");
    this.assertEqual([1, 4, 9, 16, 25, 36, 49, 64, 81].join(','), squares.toArray().join(','));
    this.assert(this._startedIterating);
    this._startedIterating = false;
  });

});


});
