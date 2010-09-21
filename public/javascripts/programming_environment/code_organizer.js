transporter.module.create('programming_environment/code_organizer', function(requires) {

requires('avocado_lib');
requires('lk_ext/poses');
requires('programming_environment/categorize_libraries');
requires('programming_environment/category_morph');
requires('programming_environment/slot_morph');
requires('programming_environment/slice_morph');
requires('programming_environment/mirror_morph');

}, function(thisModule) {


thisModule.addSlots(lobby, function(add) {

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
      evt.hand.world().morphFor(reflect(window)).grabMe(evt);
    }]);

    this.menuItemContributors.each(function(c) {
      c.addGlobalCommandsTo(cmdList);
    });

    if (this.debugMode) {
      cmdList.addLine();

      if (organization.current === organizationUsingAnnotations) {
        cmdList.addItem(["use JSQuiche organization", function(evt) {
          organization.setCurrent(organizationChain.create(organization.named(organization.name()), organizationUsingAnnotations));
        }.bind(this)]);
      } else {
        cmdList.addItem(["stop using JSQuiche organization", function(evt) {
          organization.setCurrent(organizationUsingAnnotations);
        }.bind(this)]);
      }
    }

  }, {category: ['menu']});

  add.method('initialize', function () {
    var shouldPrintLoadOrder = false;
    if (shouldPrintLoadOrder) { transporter.printLoadOrder(); }
    
    creatorSlotMarker.annotateExternalObjects(true);
    window.categorizeGlobals();

    // make the lobby mirror morph less unwieldy, since people tend to keep lots of stuff there
    reflect(window).categorizeUncategorizedSlotsAlphabetically();
  }, {category: ['initializing']});

});


thisModule.addSlots(jsQuiche.menuItemContributors, function(add) {

  add.data('0', poses);

});


});
