transporter.module.create('core/enumerator', function(requires) {}, function(thisModule) {


thisModule.addSlots(lobby, function(add) {

  add.creator('enumerator', {}, {category: ['collections']}, {comment: 'An Enumerable whose contents are whatever is yielded by calling the specified method.', copyDownParents: [{parent: Enumerable}]});

});


thisModule.addSlots(enumerator, function(add) {

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

  add.method('_each', function (f) {
    var method = this._object[this._methodName];
    if (this._methodArgs.length === 0) { // just an optimization to avoid creating unnecessary arrays
      return method.call(this._object, f);
    } else {
      return method.apply(this._object, this._methodArgs.concat([f]));
    }
  }, {category: ['iterating']});

  add.creator('tests', Object.create(TestCase.prototype), {category: ['tests']});

});


thisModule.addSlots(enumerator.tests, function(add) {

  add.method('eachInteger', function (start, end, f) {
    for (var i = start; i < end; ++i) { f(i); }
  });

  add.method('testToArray', function () {
    var e = enumerator.create(this, 'eachInteger', 3, 10);
    this.assertEqual([3, 4, 5, 6, 7, 8, 9].join(','), e.toArray().join(','));
  });

});


});
