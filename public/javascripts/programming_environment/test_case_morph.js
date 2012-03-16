avocado.transporter.module.create('programming_environment/test_case_morph', function(requires) {

requires('general_ui/table_layout');
requires('core/testFramework');

}, function(thisModule) {


thisModule.addSlots(avocado.testCase, function(add) {

  add.method('newMorph', function () {
    var m = avocado.treeNode.newMorphFor(this, this.defaultMorphStyle);
    m.typeName = 'test case';
    
    m.refreshContentOfMeAndSubmorphs();
    m.startPeriodicallyUpdating();
    return m;
  }, {category: ['user interface']});

  add.creator('defaultMorphStyle', Object.create(avocado.table.boxStyle), {category: ['user interface']});
  
  add.method('updateStyleOfMorph', function (m) {
    var r = m._model.result();
    if (r && r.hasFinished()) {
      if (r.anyFailed()) {
        m.setFillBase(avocado.testCase.singleResult.failedMorphStyle.fillBase);
      } else {
        m.setFillBase(avocado.testCase.singleResult.defaultMorphStyle.fillBase);
      }
    } else {
      m.setFillBase(avocado.testCase.defaultMorphStyle.fillBase);
    }
  }, {category: ['user interface']});

});


thisModule.addSlots(avocado.testCase.suite, function(add) {

  add.method('newMorph', function () {
    var m = avocado.treeNode.newMorphFor(this, this.defaultMorphStyle);
    m.typeName = 'test suite';
    
    
    // aaa - just an experiment
    if (this._shouldBeDisplayedAsOneLongRow) {
      avocado.treeNode.actualContentsPanelForMorph(m).layout().cleaningUpPoseFor = function (contentMorphs) {
        return this._morph.poseManager().rowPose(contentMorphs);
      };
    }
    
    
    m.refreshContentOfMeAndSubmorphs();
    m.startPeriodicallyUpdating();
    return m;
  }, {category: ['user interface']});

  add.creator('defaultMorphStyle', Object.create(avocado.table.boxStyle), {category: ['user interface']});

  add.creator('contentsPanelExtent', function() {
    if (this._shouldBeDisplayedAsOneLongRow) {
      return pt(200, 6);
    } else {
      return avocado.treeNode.defaultExtent();
    }
  }, {category: ['user interface']});
  
  add.method('updateStyleOfMorph', function (m) {
    avocado.testCase.updateStyleOfMorph(m);
  }, {category: ['user interface']});

});


thisModule.addSlots(avocado.testCase.resultHistory, function(add) {

  add.method('newMorph', function () {
    return avocado.treeNode.newMorphFor(this);
  }, {category: ['user interface']});
  
  add.method('shouldContentsPanelUseZooming', function () {
    // probably I want something fancier than just an old-style tree, but let's try this for now
    return false;
  }, {category: ['user interface']});

});


thisModule.addSlots(avocado.testCase.singleResult, function(add) {

  add.method('newMorph', function () {
    return avocado.messageNotifier.create(this.toString(), Color.gray).newMorph().setModel(this);
  }, {category: ['user interface']});
  
  add.method('updateStyleOfMorph', function (m) {
    avocado.testCase.updateStyleOfMorph(m);
  }, {category: ['user interface']});

  add.creator('defaultMorphStyle', {}, {category: ['user interface']});

  add.creator('failedMorphStyle', {}, {category: ['user interface']});

});


thisModule.addSlots(avocado.testCase.defaultMorphStyle, function(add) {

  add.data('fillBase', new Color(0.5, 0.5, 0.5));

});


thisModule.addSlots(avocado.testCase.suite.defaultMorphStyle, function(add) {

  add.data('fillBase', new Color(0.5, 0.5, 0.5));

});


thisModule.addSlots(avocado.testCase.singleResult.defaultMorphStyle, function(add) {

  add.data('fillBase', new Color(0, 0.8, 0.5));

});


thisModule.addSlots(avocado.testCase.singleResult.failedMorphStyle, function(add) {

  add.data('fillBase', new Color(0.8, 0.3, 0));

});


});
