avocado.transporter.module.create('lk_programming_environment/test_case_morph', function(requires) {

requires('lk_ext/shortcuts');
requires('lk_ext/rows_and_columns');
requires('core/testFramework');

}, function(thisModule) {


thisModule.addSlots(avocado.testCase, function(add) {

  add.method('newMorph', function () {
    var m = avocado.TreeNodeMorph.create(this).applyStyle(this.defaultMorphStyle);
    m.typeName = 'test case';
    
    m.refreshContentOfMeAndSubmorphs();
    m.startPeriodicallyUpdating();
    return m;
  }, {category: ['user interface']});

  add.creator('defaultMorphStyle', Object.create(avocado.TableMorph.boxStyle), {category: ['user interface']});
  
  add.method('updateFillOfMorph', function (m) {
    var r = m._model.result();
    if (r && r.hasFinished()) {
      if (r.anyFailed()) {
        m.setFill(avocado.testCase.singleResult.failedMorphStyle.fill);
      } else {
        m.setFill(avocado.testCase.singleResult.defaultMorphStyle.fill);
      }
    } else {
      m.setFill(avocado.testCase.defaultMorphStyle.fill);
    }
  }, {category: ['user interface']});

});


thisModule.addSlots(avocado.testCase.suite, function(add) {

  add.method('newMorph', function () {
    var m = avocado.TreeNodeMorph.create(this).applyStyle(this.defaultMorphStyle);
    m.typeName = 'test suite';
    
    m.refreshContentOfMeAndSubmorphs();
    m.startPeriodicallyUpdating();
    return m;
  }, {category: ['user interface']});

  add.creator('defaultMorphStyle', Object.create(avocado.TableMorph.boxStyle), {category: ['user interface']});
  
  add.method('updateFillOfMorph', function (m) {
    avocado.testCase.updateFillOfMorph(m);
  }, {category: ['user interface']});

});


thisModule.addSlots(avocado.testCase.singleResult, function(add) {

  add.method('newMorph', function () {
    return new avocado.MessageNotifierMorph(this.toString(), Color.gray).setModel(this);
  }, {category: ['user interface']});
  
  add.method('updateFillOfMorph', function (m) {
    avocado.testCase.updateFillOfMorph(m);
  }, {category: ['user interface']});

  add.creator('defaultMorphStyle', {}, {category: ['user interface']});

  add.creator('failedMorphStyle', {}, {category: ['user interface']});

});


thisModule.addSlots(avocado.testCase.defaultMorphStyle, function(add) {

  add.data('fill', new lively.paint.LinearGradient([new lively.paint.Stop(0, new Color(0.5, 0.5, 0.5)), new lively.paint.Stop(1, new Color(0.75, 0.75, 0.75))], lively.paint.LinearGradient.SouthNorth));

});


thisModule.addSlots(avocado.testCase.suite.defaultMorphStyle, function(add) {

  add.data('fill', new lively.paint.LinearGradient([new lively.paint.Stop(0, new Color(0.5, 0.5, 0.5)), new lively.paint.Stop(1, new Color(0.75, 0.75, 0.75))], lively.paint.LinearGradient.SouthNorth));

});


thisModule.addSlots(avocado.testCase.singleResult.defaultMorphStyle, function(add) {

  add.data('fill', new lively.paint.LinearGradient([new lively.paint.Stop(0, new Color(0, 0.8, 0)), new lively.paint.Stop(1, new Color(0.4980392156862745, 0.9019607843137255, 0.4980392156862745))], lively.paint.LinearGradient.SouthNorth));

});


thisModule.addSlots(avocado.testCase.singleResult.failedMorphStyle, function(add) {

  add.data('fill', new lively.paint.LinearGradient([new lively.paint.Stop(0, new Color(0.8, 0, 0)), new lively.paint.Stop(1, new Color(0.9019607843137255, 0.4980392156862745, 0.4980392156862745))], lively.paint.LinearGradient.SouthNorth));

});


});
