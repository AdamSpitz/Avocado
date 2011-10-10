avocado.transporter.module.create('reflection/process', function(requires) {

requires('core/testFramework');

}, function(thisModule) {


thisModule.addSlots(avocado, function(add) {

  add.creator('process', {}, {category: ['avocado', 'reflection']});

  add.method('grabStack', function () {
    // Just here for convenience.
    var p = avocado.process.create().trimLeaves(1);
    avocado.ui.grab(p);
    return p;
  }, {category: ['avocado', 'reflection']});

});


thisModule.addSlots(avocado.process, function(add) {

  add.method('create', function () {
    return Object.newChildOf(this, arguments.callee.caller);
  }, {category: ['creating']});

  add.method('initialize', function (f) {
    this._leaf = this.contextFor(f);
  }, {category: ['creating']});

  add.creator('context', {}, {category: ['contexts']});

  add.creator('tests', Object.create(avocado.testCase), {category: ['tests']});

  add.method('leafContext', function () {
    return this._leaf;
  }, {category: ['accessing']});

  add.method('contextFor', function (f) {
    return this.context.create(f, this);
  }, {category: ['accessing']});

  add.method('inspect', function () {
    return "a process";
  }, {category: ['printing']});

  add.method('printTo', function (logger, max) {
    var c = this.leafContext();
    var i = 0;
    while (c && i++ < max) {
      c.printTo(logger);
      c = c.callerContext();
    }
  }, {category: ['printing']});

  add.method('trimLeaves', function (n) {
    for (var i = 0; i < n; ++i) {
      this._leaf = this._leaf.callerContext();
    }
    return this;
  }, {category: ['trimming']});

});


thisModule.addSlots(avocado.process.context, function(add) {

  add.method('create', function (f, p) {
    return Object.newChildOf(this, f, p);
  }, {category: ['creating']});

  add.method('initialize', function (f, p) {
    this._function = f;
    this._process = p;
    
    this._args = $A(this._function.arguments);
    var caller = this._function.caller;
    this._caller = caller ? this._process.contextFor(caller) : null;
  }, {category: ['creating']});

  add.method('rawFunction', function () {
    return this._function;
  }, {category: ['accessing']});

  add.method('functionMirror', function () {
    return this._functionMirror || (this._functionMirror = reflect(this._function));
  }, {category: ['accessing']});

  add.method('callerContext', function () {
    return this._caller;
  }, {category: ['accessing']});

  add.method('args', function () {
    return this._args;
  }, {category: ['accessing']});

  add.method('functionName', function () {
    return this.rawFunction().displayName || this.functionMirror().inspect();
  }, {category: ['accessing']});

  add.method('argNames', function () {
    var names = this._argNames;
    if (names) { return names; }
    var regex = /\(([^(]*)\)/;
    var functionString = this._function.toString();
    var match = regex.exec(functionString);
    if (! match) { throw new Error("Cannot find argument names of function: " + functionString); }
    var argsString = match[1].strip();
    if (argsString.length === 0) {
      names = []
    } else {
      names = argsString.split(',').map(function(s) { return s.strip(); });
    }
    this._argNames = names;
    return names;
  }, {category: ['accessing']});

  add.method('toString', function () {
    return this.functionName();
  }, {category: ['printing']});

  add.method('inspect', function () {
    return this.toString();
  }, {category: ['printing']});

  add.method('printTo', function (logger) {
    logger.log(this.inspect());
  }, {category: ['printing']});

  add.method('commandToGrabAllArgs', function () {
    return avocado.command.create("arguments", function(evt) { avocado.ui.grab(reflect(this.args()), evt); }, this);
  }, {category: ['user interface']});

  add.method('commandToGrabArg', function (i) {
    return avocado.command.create(this.argNames()[i], function(evt) { avocado.ui.grab(reflect(this.args()[i]), evt); }, this);
  }, {category: ['user interface']});

});


thisModule.addSlots(avocado.process.tests, function(add) {

  add.method('simpleNestingA', function (x) {
    return this.simpleNestingB(x + 4, 'neat');
  });

  add.method('simpleNestingB', function (y, z) {
    return this.simpleNestingC('a', 'b', 'c');
  });

  add.method('simpleNestingC', function () {
    return this.simpleNestingD(111);
  });

  add.method('simpleNestingD', function () {
    return avocado.process.create();
  });

  add.method('testCallStack', function () {
    var p = this.simpleNestingA(3);
    var c = p.leafContext();
    this.assertEqual("simpleNestingD", c.functionName());
    this.assertEqual([111], c.args());
    this.assertEqual([], c.argNames());
    c = c.callerContext();
    this.assertEqual("simpleNestingC", c.functionName());
    this.assertEqual(['a', 'b', 'c'], c.args());
    this.assertEqual([], c.argNames());
    c = c.callerContext();
    this.assertEqual("simpleNestingB", c.functionName());
    this.assertEqual([7, 'neat'], c.args());
    this.assertEqual(['y', 'z'], c.argNames());
    c = c.callerContext();
    this.assertEqual("simpleNestingA", c.functionName());
    this.assertEqual([3], c.args());
    this.assertEqual(['x'], c.argNames());
    c = c.callerContext();
    this.assertEqual("testCallStack", c.functionName());
    this.assertEqual([], c.args());
    this.assertEqual([], c.argNames());
  });

});


});
