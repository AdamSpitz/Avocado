avocado.transporter.module.create('lk_programming_environment/code_organizer', function(requires) {

requires('avocado_lib');
requires('lk_ext/poses');
requires('programming_environment/categorize_libraries');
requires('lk_programming_environment/mirror_morph');
requires('lk_programming_environment/searching');

}, function(thisModule) {


thisModule.addSlots(modules['lk_programming_environment/code_organizer'], function(add) {

  add.method('postFileIn', function () {
    avocado.categorizeGlobals();

    // make the window's mirror morph less unwieldy, since people tend to keep lots of stuff there
    reflect(window).categorizeUncategorizedSlotsAlphabetically();
    
    avocado.theApplication = jsQuiche;
    
    if (avocado.world) {
      avocado.world.addApplication(jsQuiche);
    }
  });

});


thisModule.addSlots(window, function(add) {

  add.creator('jsQuiche', {}, {category: ['JSQuiche']});

});


thisModule.addSlots(jsQuiche, function(add) {

  add.method('worldName', function () { return "JSQuiche"; }, {category: ['printing']});

  add.data('isReflectionEnabled', false, {category: ['enabling reflection']});

  add.data('debugMode', false, {category: ['debug mode']});

  add.creator('menuItemContributors', [], {category: ['menu']});

  add.method('addGlobalCommandsTo', function (cmdList) {
    cmdList.addLine();
    cmdList.addItem(["get the window object", function(evt) {
      avocado.ui.grab(reflect(window), evt);
    }]);

    this.menuItemContributors.each(function(c) {
      c.addGlobalCommandsTo(cmdList);
    });

    if (this.debugMode) {
      cmdList.addLine();

      if (avocado.organization.current === avocado.organizationUsingAnnotations) {
        cmdList.addItem(["use JSQuiche organization", function(evt) {
          avocado.organization.setCurrent(avocado.organizationChain.create(avocado.organization.named(avocado.organization.name()), avocado.organizationUsingAnnotations));
        }.bind(this)]);
      } else {
        cmdList.addItem(["stop using JSQuiche organization", function(evt) {
          avocado.organization.setCurrent(avocado.organizationUsingAnnotations);
        }.bind(this)]);
      }
    }

  }, {category: ['menu']});

  add.method('initialize', function () {
    avocado.categorizeGlobals();

    // make the window's mirror morph less unwieldy, since people tend to keep lots of stuff there
    reflect(window).categorizeUncategorizedSlotsAlphabetically();
  }, {category: ['initializing']});

});


});
