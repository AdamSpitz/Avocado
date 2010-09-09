transporter.module.create('programming_environment/test_case_morph', function(requires) {

requires('core/string_buffer');
requires('lk_ext/rows_and_columns');

}, function(thisModule) {


thisModule.addSlots(TestCase.prototype, function(add) {

  add.method('newMorph', function () {
    return new this.Morph(this);
  }, {category: ['user interface']});

  add.method('Morph', function Morph() { Class.initializer.apply(this, arguments); }, {category: ['user interface']});

});


thisModule.addSlots(TestCase.prototype.Morph, function(add) {

  add.data('superclass', RowMorph);

  add.creator('prototype', Object.create(RowMorph.prototype));

  add.data('type', 'TestCase.prototype.Morph');
  
  add.method('addGlobalCommandsTo', function(cmdList) {
    cmdList.addLine();

    cmdList.addItem(["get tests", function(evt) {
      // aaa - gather these automatically
      var testCases = [
        dictionary.tests,
        set.tests,
        mirror.tests,
        transporter.tests,
        objectGraphWalker.tests,
        exitValueOf.tests,
        enumerator.tests,
        range.tests,
        notifier.tests,
        stringBuffer.tests,
        String.prototype.tests,
        Array.prototype.tests,
        dependencies.tests,
        organization.tests
      ];
      var world = evt.hand.world();
      world.assumePose(world.listPoseOfMorphsFor(testCases, "test cases for avocado"));
    }]);
  })

});


thisModule.addSlots(TestCase.prototype.Morph.prototype, function(add) {

  add.data('constructor', TestCase.prototype.Morph);

  add.method('initialize', function ($super, testCaseProto) {
    $super();
    this._testCaseProto = testCaseProto;

    this.setPadding({top: 2, bottom: 2, left: 4, right: 4, between: 3});
    this.setFill(lively.paint.defaultFillWithColor(Color.purple.darker()));
    this.shape.roundEdgesBy(10);

    this._nameLabel = TextMorph.createLabel(function() { return this._testCaseProto.name(); }.bind(this));
    this._runButton = ButtonMorph.createButton('Run', function(evt) { this.runAll(); }.bind(this), 2);

    this.setColumns([this._nameLabel, this._runButton, this.createDismissButton()]);
  }, {category: ['creating']});

  add.method('inspect', function () { return this._testCaseProto.name(); }, {category: ['printing']});

  add.method('runAll', function () {
    var w = this.world();
    var testCase = this._testCaseProto.create();
    testCase.runAll();
    var result = testCase.result;
    result.testCase = testCase;
    w.morphFor(result).ensureIsInWorld(w, this.worldPoint(pt(this.getExtent().x + 50, 0)), true, true, true);
  }, {category: ['commands']});

  add.method('getTestCaseObject', function (evt) {
    evt.hand.world().morphFor(reflect(this._testCaseProto)).grabMe(evt);
  }, {category: ['commands']});

  add.method('addCommandsTo', function (cmdList) {
    cmdList.addItem({label: 'run', pluralLabel: 'run tests', go: this.runAll.bind(this)});
  
    cmdList.addLine();

    cmdList.addItem({label: 'get test case object', go: this.getTestCaseObject.bind(this)});
  }, {category: ['commands']});

});


thisModule.addSlots(TestResult.prototype, function(add) {

  add.method('newMorph', function () {
    return new this.Morph(this);
  }, {category: ['user interface']});

  add.method('Morph', function Morph() { Class.initializer.apply(this, arguments); }, {category: ['user interface']});

});


thisModule.addSlots(TestResult.prototype.Morph, function(add) {

  add.data('superclass', ColumnMorph);

  add.creator('prototype', Object.create(ColumnMorph.prototype));

  add.data('type', 'TestResult.prototype.Morph');

});


thisModule.addSlots(TestResult.prototype.Morph.prototype, function(add) {

  add.data('constructor', TestResult.prototype.Morph);

  add.method('initialize', function ($super, testResult) {
    $super();
    this._testResult = testResult;
    this._testCase = testResult.testCase;

    this.setPadding({top: 2, bottom: 2, left: 4, right: 4, between: 2});
    this.setFill(lively.paint.defaultFillWithColor(this._testResult.failed.length > 0 ? Color.red : Color.green));
    this.shape.roundEdgesBy(10);

    var timeToRun = Object.newChildOf(enumerator, reflect(this._testResult.timeToRun), "eachNormalSlot").inject(0, function(sum, ea) {return sum + ea.contents().reflectee();});
    this._nameLabel = TextMorph.createLabel(this._testCase.name() + "(" + timeToRun + " ms)");

    var rows = [this._nameLabel];
    testResult.failed.each(function(f) {rows.push(this.createFailureRow(f));}.bind(this));
    this.setRows(rows);
  }, {category: ['creating']});

  add.method('createFailureRow', function (failure) {
    var s = stringBuffer.create(failure.selector).append(" failed ");
    if (failure.err.sourceURL !== undefined) {
      s.append("(").append(new URL(failure.err.sourceURL).filename());
      if (failure.err.line !== undefined) {
        s.append(":").append(failure.err.line);
      }
      s.append("): ");
    }
    s.append(failure.err.message !== undefined ? failure.err.message : failure.err);
    return RowMorph.createSpaceFilling([TextMorph.createLabel(s.toString())]);
  }, {category: ['creating']});

  add.method('inspect', function () { return this._testCase.name(); }, {category: ['printing']});

  add.method('getErrorObjects', function (evt) {
    this._testResult.failed.each(function(f) {
      evt.hand.world().morphFor(reflect(f.err)).grabMe(evt);
    });
  }, {category: ['menu']});

  add.method('addCommandsTo', function (cmdList) {
    if (this._testResult.failed.length > 0) {
      cmdList.addItem({label: 'get error objects', go: this.getErrorObjects.bind(this)});
    }
  }, {category: ['menu']});

});


});
