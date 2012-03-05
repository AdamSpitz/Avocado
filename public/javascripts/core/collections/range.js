avocado.transporter.module.create('core/collections/range', function(requires) {

}, function(thisModule) {


thisModule.addSlots(avocado, function(add) {

  add.creator('range', {}, {category: ['collections']}, {comment: 'A range of numbers.', copyDownParents: [{parent: Enumerable}]});

});


thisModule.addSlots(avocado.range, function(add) {

  add.method('create', function () {
    var r = Object.create(this);
    r.initialize.apply(r, arguments);
    return r;
  }, {category: ['creating']});

  add.method('initialize', function (start, end, step) {
    this._start = start;
    this._end   = end;
    this._step  = step || 1;
    this._shouldIncludeStart = true;
    this._shouldIncludeEnd   = false;
  }, {category: ['creating']});

  add.method('start', function () { return this._start;    }, {category: ['accessing']});

  add.method('setStart', function (s) {        this._start = s;}, {category: ['accessing']});

  add.method('end', function () { return this._end;    }, {category: ['accessing']});

  add.method('setEnd', function (e) {        this._end = e;}, {category: ['accessing']});

  add.method('step', function () { return this._step;    }, {category: ['accessing']});

  add.method('setStep', function (s) {        this._step = s;}, {category: ['accessing']});

  add.method('includeStart', function () {
    this._shouldIncludeStart = true;
    return this;
  }, {category: ['including or excluding endpoints']});

  add.method('doNotIncludeStart', function () {
    this._shouldIncludeStart = false;
    return this;
  }, {category: ['including or excluding endpoints']});

  add.method('includeEnd', function () {
    this._shouldIncludeEnd = true;
    return this;
  }, {category: ['including or excluding endpoints']});

  add.method('doNotIncludeEnd', function () {
    this._shouldIncludeEnd = false;
    return this;
  }, {category: ['including or excluding endpoints']});

  add.method('_each', function (f) {
    var step  = this._step;
    var end   = this._end;
    var start = this._shouldIncludeStart ? this._start : this._start + step;
    if (this._shouldIncludeEnd) {
      for (var i = start; i <= end; i += step) { f(i); }
    } else {
      for (var i = start; i <  end; i += step) { f(i); }
    }
  }, {category: ['iterating']});

  add.creator('tests', Object.create(avocado.testCase), {category: ['tests']});

});


thisModule.addSlots(avocado.range.tests, function(add) {

  add.method('testStuff', function () {
    var r = avocado.range.create(3, 10);
    this.assertEqual([3, 4, 5, 6, 7, 8, 9], r.toArray());
    r.includeEnd();
    this.assertEqual([3, 4, 5, 6, 7, 8, 9, 10], r.toArray());
    r.doNotIncludeStart();
    this.assertEqual([4, 5, 6, 7, 8, 9, 10], r.toArray());
    r.doNotIncludeEnd();
    this.assertEqual([4, 5, 6, 7, 8, 9], r.toArray());
    r.includeStart();
    this.assertEqual([3, 4, 5, 6, 7, 8, 9], r.toArray());

    r.setStep(2);
    this.assertEqual([3, 5, 7, 9], r.toArray());
  });

});


});
