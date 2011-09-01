avocado.transporter.module.create('lk_programming_environment/test_case_morph', function(requires) {

requires('lk_ext/shortcuts');
requires('lk_ext/rows_and_columns');
requires('core/testFramework');

}, function(thisModule) {


thisModule.addSlots(avocado.testCase, function(add) {

  add.method('newMorph', function () {
    var m = avocado.TableMorph.newRow().setModel(this).applyStyle(this.defaultMorphStyle);
    m.typeName = 'test case';
    m.setColumns([m.createNameLabel()]);
    
    m.commands = function() {
      var cmdList = this.commands().wrapForMorph(m);
      
      cmdList.itemWith("label", "run").wrapFunction(function(oldFunctionToRun, evt) {
        m.createAndRunAndUpdateAppearance();
      });
      
      return cmdList;
    }.bind(this);
    
    m.createAndRunAndUpdateAppearance = function(callback) {
      m._latestResult = null;
      m.refreshContentOfMeAndSubmorphs();
      this.createAndRun(function(result) {
        m._latestResult = result;
        m.refreshContentOfMeAndSubmorphs();
        if (callback) { callback(result); }
      });
    }.bind(this);
    
    m.anyFailedOrNull = function() {
      var r = m._latestResult;
      return r ? r.anyFailed() : null;
    };
    
    m.updateFill = function() { avocado.testCase.updateFillOfMorph(m); };
    
    m.refreshContentOfMeAndSubmorphs();
    m.startPeriodicallyUpdating();
    return m;
  }, {category: ['user interface']});

  add.creator('defaultMorphStyle', Object.create(avocado.TableMorph.boxStyle), {category: ['user interface']});
  
  add.method('updateFillOfMorph', function (m) {
    var r = m.anyFailedOrNull();
    if (r === true) {
      m.setFill(avocado.testCase.resultProto.failedMorphStyle.fill);
    } else if (r === false) {
      m.setFill(avocado.testCase.resultProto.defaultMorphStyle.fill);
    } else {
      m.setFill(avocado.testCase.defaultMorphStyle.fill);
    }
  }, {category: ['user interface']});

});


thisModule.addSlots(avocado.testCase.suite, function(add) {

  add.method('newMorph', function () {
    var m = new avocado.TreeNodeMorph(this).applyStyle(this.defaultMorphStyle);
    m.typeName = 'test suite';
    
    m.commands = function() {
      var cmdList = avocado.command.list.create(this);
      cmdList.addItem({label: 'run', pluralLabel: 'run tests', go: function() {
        m.createAndRunAndUpdateAppearance();
      }});
      return cmdList;
    };
    
    m.createAndRunAndUpdateAppearance = function(callback) {
      m.immediateContentMorphs().each(function(cm) { cm._latestResult = null; });
      m.refreshContentOfMeAndSubmorphs();
      
      avocado.callbackWaiter.on(function(finalCallback) {
        m.immediateContentMorphs().each(function(cm) {
          var callbackForThisOne = finalCallback();
          cm.createAndRunAndUpdateAppearance(function() {
            m.refreshContentOfMeAndSubmorphs();
            callbackForThisOne();
          });
        });
      }, function() {
        m.refreshContentOfMeAndSubmorphs();
        if (callback) { callback(); }
      }, "running test suite");
    };
    
    m.anyFailedOrNull = function() {
      var r = false;
      m.immediateContentMorphs().each(function(cm) {
        var mr = cm.anyFailedOrNull();
        if (mr === null) { r = null; throw $break; }
        if (mr === true) { r = true; throw $break; }
      });
      return r;
    };
    
    m.updateFill = function() { avocado.testCase.updateFillOfMorph(m); };
    
    m.refreshContentOfMeAndSubmorphs();
    m.startPeriodicallyUpdating();
    return m;
  }, {category: ['user interface']});

  add.creator('defaultMorphStyle', Object.create(avocado.TableMorph.boxStyle), {category: ['user interface']});

  add.method('commands', function () {
  }, {category: ['user interface', 'commands']});

});


thisModule.addSlots(avocado.testCase.resultProto, function(add) {

  add.method('newMorph', function () {
    // aaa - This code is obsolete, now that we have the new UI where we change the test case's colour.
    // Delete it once I'm satisfied that the new way is better.
    
    var m = avocado.TableMorph.newColumn().setModel(this);
    m.applyStyle(this.anyFailed() ? this.failedMorphStyle : this.defaultMorphStyle);

    var rows = [m.createNameLabel()];
    this.failed.each(function(f) {
      rows.push(avocado.RowMorph.createSpaceFilling([TextMorph.createLabel(f.toString())]));
    });
    m.setRows(rows);
    return m;
  }, {category: ['user interface']});

  add.creator('defaultMorphStyle', {}, {category: ['user interface']});

  add.creator('failedMorphStyle', Object.create(avocado.testCase.resultProto.defaultMorphStyle), {category: ['user interface']});

});


thisModule.addSlots(avocado.testCase.defaultMorphStyle, function(add) {

  add.data('fill', new lively.paint.LinearGradient([new lively.paint.Stop(0, new Color(0.5, 0.5, 0.5)), new lively.paint.Stop(1, new Color(0.75, 0.75, 0.75))], lively.paint.LinearGradient.SouthNorth));

});


thisModule.addSlots(avocado.testCase.suite.defaultMorphStyle, function(add) {

  add.data('fill', new lively.paint.LinearGradient([new lively.paint.Stop(0, new Color(0.5, 0.5, 0.5)), new lively.paint.Stop(1, new Color(0.75, 0.75, 0.75))], lively.paint.LinearGradient.SouthNorth));

});


thisModule.addSlots(avocado.testCase.resultProto.defaultMorphStyle, function(add) {

  add.data('fill', new lively.paint.LinearGradient([new lively.paint.Stop(0, new Color(0, 0.8, 0)), new lively.paint.Stop(1, new Color(0.4980392156862745, 0.9019607843137255, 0.4980392156862745))], lively.paint.LinearGradient.SouthNorth));

  add.data('padding', {top: 2, bottom: 2, left: 4, right: 4, between: {x: 2, y: 2}}, {initializeTo: '{top: 2, bottom: 2, left: 4, right: 4, between: {x: 2, y: 2}}'});

  add.data('borderRadius', 10);

  add.data('openForDragAndDrop', false);

});


thisModule.addSlots(avocado.testCase.resultProto.failedMorphStyle, function(add) {

  add.data('fill', new lively.paint.LinearGradient([new lively.paint.Stop(0, new Color(0.8, 0, 0)), new lively.paint.Stop(1, new Color(0.9019607843137255, 0.4980392156862745, 0.4980392156862745))], lively.paint.LinearGradient.SouthNorth));

});


});
