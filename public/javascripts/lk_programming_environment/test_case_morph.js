transporter.module.create('lk_programming_environment/test_case_morph', function(requires) {

requires('lk_ext/shortcuts');
requires('lk_ext/rows_and_columns');

}, function(thisModule) {


thisModule.addSlots(TestCase.prototype, function(add) {

  add.method('newMorph', function () {
    var m = new avocado.RowMorph().setModel(this).applyStyle(this.defaultMorphStyle);

    var columns = [m.createNameLabel()];
    this.buttonCommands().commands().each(function(c) { columns.push(c.newMorph()); });
    columns.push(m.createDismissButton());
    m.setColumns(columns);
    
    return m;
  }, {category: ['user interface']});

  add.creator('defaultMorphStyle', Object.create(avocado.TableMorph.boxStyle), {category: ['user interface']});

});


thisModule.addSlots(TestResult.prototype, function(add) {

  add.method('newMorph', function () {
    var m = new avocado.ColumnMorph().setModel(this);
    m.applyStyle(this.anyFailed() ? this.failedMorphStyle : this.defaultMorphStyle);

    var rows = [m.createNameLabel()];
    this.failed.each(function(f) {
      rows.push(avocado.RowMorph.createSpaceFilling([TextMorph.createLabel(f.toString())]));
    });
    m.setRows(rows);
    return m;
  }, {category: ['user interface']});

  add.creator('defaultMorphStyle', {}, {category: ['user interface']});

  add.creator('failedMorphStyle', Object.create(TestResult.prototype.defaultMorphStyle), {category: ['user interface']});

});


thisModule.addSlots(TestCase.prototype.defaultMorphStyle, function(add) {

  add.data('fill', new lively.paint.LinearGradient([new lively.paint.Stop(0, new Color(0.4980392156862745, 0, 0.4980392156862745)), new lively.paint.Stop(1, new Color(0.7490196078431373, 0.4980392156862745, 0.7490196078431373))], lively.paint.LinearGradient.SouthNorth));

});


thisModule.addSlots(TestResult.prototype.defaultMorphStyle, function(add) {

  add.data('fill', new lively.paint.LinearGradient([new lively.paint.Stop(0, new Color(0, 0.8, 0)), new lively.paint.Stop(1, new Color(0.4980392156862745, 0.9019607843137255, 0.4980392156862745))], lively.paint.LinearGradient.SouthNorth));

  add.data('padding', {top: 2, bottom: 2, left: 4, right: 4, between: {x: 2, y: 2}}, {initializeTo: '{top: 2, bottom: 2, left: 4, right: 4, between: {x: 2, y: 2}}'});

  add.data('borderRadius', 10);

  add.data('openForDragAndDrop', false);

});


thisModule.addSlots(TestResult.prototype.failedMorphStyle, function(add) {

  add.data('fill', new lively.paint.LinearGradient([new lively.paint.Stop(0, new Color(0.8, 0, 0)), new lively.paint.Stop(1, new Color(0.9019607843137255, 0.4980392156862745, 0.4980392156862745))], lively.paint.LinearGradient.SouthNorth));

});


});
