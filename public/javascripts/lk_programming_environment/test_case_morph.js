transporter.module.create('lk_programming_environment/test_case_morph', function(requires) {

requires('lk_ext/rows_and_columns');

}, function(thisModule) {


thisModule.addSlots(TestCase.prototype, function(add) {

  add.method('newMorph', function () {
    var m = Morph.createBox(this, Color.purple.darker());
    m._testCaseProto = this;

    var runButton = avocado.command.create('Run', function(evt) { m._testCaseProto.createAndRunAndShowResult(); }).newMorph();
    
    m.setColumns([m.createNameLabel(), runButton, m.createDismissButton()]);
    return m;
  }, {category: ['user interface']});

});


thisModule.addSlots(TestResult.prototype, function(add) {

  add.method('newMorph', function () {
    var m = new avocado.ColumnMorph();
    m._model = this;

    m.setPadding({top: 2, bottom: 2, left: 4, right: 4, between: {x: 2, y: 2}});
    m.setFill(lively.paint.defaultFillWithColor(this.anyFailed() ? Color.red : Color.green));
    m.shape.roundEdgesBy(10);
    m.closeDnD();

    var nameLabel = TextMorph.createLabel(this.inspect());

    m.inspect = function () { return m._model.testCase.inspect(); };

    var rows = [nameLabel];
    this.failed.each(function(f) {
      rows.push(avocado.RowMorph.createSpaceFilling([TextMorph.createLabel(f.toString())]));
    });
    m.setRows(rows);
    return m;
  }, {category: ['user interface']});

});


});
