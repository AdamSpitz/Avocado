avocado.transporter.module.create('programming_environment/programming_environment', function(requires) {

requires('avocado_lib');
requires('general_ui/general_ui');
requires('programming_environment/mirror_morph');
requires('programming_environment/categorize_libraries');
requires('programming_environment/evaluator_morph');
requires('programming_environment/module_morph');
requires('programming_environment/pretty_printer');
requires('programming_environment/test_case_morph');
requires('db/couch');
requires('demo/person');

}, function(thisModule) {


thisModule.addSlots(modules['programming_environment/programming_environment'], function(add) {

  add.method('postFileIn', function () {
    avocado.categorizeGlobals();

    // make the window's mirror morph less unwieldy, since people tend to keep lots of stuff there
    reflect(window).categorizeUncategorizedSlotsAlphabetically();
    
    avocado.applicationList.addApplication(avocado);
  });

});


thisModule.addSlots(avocado, function(add) {

  add.method('worldName', function () { return "Avocado"; }, {category: ['printing']});

  add.data('isReflectionEnabled', true, {category: ['enabling reflection']});

  add.creator('menuItemContributors', [], {category: ['menu']});

  add.method('addGlobalCommandsTo', function (cmdList) {
    cmdList.addLine();
    
    cmdList.addItem(["create new object", function(evt) {
      avocado.ui.growFromNothing(reflect({}), evt);
    }]);

    cmdList.addItem(["get the window object", function(evt) {
      avocado.ui.grab(reflect(window), evt);
    }]);

    if (this.debugMode) {
      cmdList.addLine();
      this.addUISpecificDebugModeGlobalCommandsTo(cmdList);
    }

    this.menuItemContributors.each(function(c) {
      c.addGlobalCommandsTo(cmdList);
    });
  }, {category: ['menu']});

});


});
