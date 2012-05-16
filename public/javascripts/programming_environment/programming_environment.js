avocado.transporter.module.create('programming_environment/programming_environment', function(requires) {

requires('avocado_lib');
requires('general_ui/general_ui');
requires('programming_environment/mirror_morph');
requires('programming_environment/categorize_libraries');
requires('programming_environment/evaluator_morph');
requires('programming_environment/module_morph');
requires('programming_environment/pretty_printer');
requires('programming_environment/searching');
requires('programming_environment/test_case_morph');
requires('programming_environment/webdav');
requires('db/couch');
requires('demo/person');

}, function(thisModule) {


thisModule.addSlots(avocado, function(add) {

  add.creator('programmingEnvironment', {}, {category: ['loading']});

  add.creator('reflectionMenuContributor', {}, {category: ['menu']});

});


thisModule.addSlots(avocado.programmingEnvironment, function(add) {

  add.method('loadAsTopLevelEnvironment', function () {
    avocado.isReflectionEnabled = true;
    
    avocado.categorizeGlobals();

    // make the window's mirror morph less unwieldy, since people tend to keep lots of stuff there
    reflect(window).categorizeUncategorizedSlotsAlphabetically();
    
    avocado.applicationList.addApplication(this);
  });

  add.method('worldName', function () { return "Avocado"; }, {category: ['printing']});

  add.data('isMorphMenuEnabled', true, {category: ['enabling reflection']});

  add.method('addGlobalCommandsTo', function (cmdList) {
    if (avocado.ui.debugMode) {
      cmdList.addLine();
      avocado.ui.programmingEnvironment.addUISpecificDebugModeGlobalCommandsTo(cmdList);
    }

    this.menuItemContributors.each(function(c) {
      c.addGlobalCommandsTo(cmdList);
    });
  }, {category: ['menu']});

});


thisModule.addSlots(avocado.reflectionMenuContributor, function(add) {

  add.method('addGlobalCommandsTo', function (cmdList) {
    cmdList.addLine();
    
    cmdList.addItem(["create new object", function(evt) {
      avocado.ui.growFromNothing(reflect({}), evt);
    }]);

    cmdList.addItem(["get the window object", function(evt) {
      avocado.ui.grab(reflect(window), evt);
    }]);
  });

});


});
