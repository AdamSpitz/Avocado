transporter.module.create('lk_programming_environment/test_case_morph', function(requires) {

requires('lk_ext/rows_and_columns');

}, function(thisModule) {


thisModule.addSlots(TestCase.prototype, function(add) {

  add.method('newMorph', function () {
    var m = new avocado.RowMorph();
    m._testCaseProto = this;

    m.setPadding({top: 2, bottom: 2, left: 4, right: 4, between: {x: 3, y: 3}});
    m.setFill(lively.paint.defaultFillWithColor(Color.purple.darker()));
    m.shape.roundEdgesBy(10);
    m.closeDnD();

    var nameLabel = TextMorph.createLabel(function() { return m._testCaseProto.inspect(); });
    var runButton = ButtonMorph.createButton('Run', function(evt) { m._testCaseProto.createAndRunAndShowResult(); }, 2);

    m.inspect = function () { return m._testCaseProto.inspect(); };
    m.addCommandsTo = function (cmdList) { m._testCaseProto.addCommandsTo(cmdList); };
    
    m.setColumns([nameLabel, runButton, m.createDismissButton()]);
    return m;
  }, {category: ['user interface']});

});


thisModule.addSlots(TestResult.prototype, function(add) {

  add.method('newMorph', function () {
    var m = new avocado.ColumnMorph();
    m._testResult = this;

    m.setPadding({top: 2, bottom: 2, left: 4, right: 4, between: {x: 2, y: 2}});
    m.setFill(lively.paint.defaultFillWithColor(this.anyFailed() ? Color.red : Color.green));
    m.shape.roundEdgesBy(10);
    m.closeDnD();

    var nameLabel = TextMorph.createLabel(this.inspect());

    m.inspect = function () { return m._testResult.testCase.inspect(); };
    m.addCommandsTo = function (cmdList) { m._testResult.addCommandsTo(cmdList); };

    var rows = [nameLabel];
    this.failed.each(function(f) {
      rows.push(avocado.RowMorph.createSpaceFilling([TextMorph.createLabel(f.toString())]));
    });
    m.setRows(rows);
    return m;
  }, {category: ['user interface']});

});


});
