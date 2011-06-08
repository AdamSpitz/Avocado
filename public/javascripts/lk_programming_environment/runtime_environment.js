avocado.transporter.module.create('lk_programming_environment/runtime_environment', function(requires) {

requires('avocado_lib');

}, function(thisModule) {

  
thisModule.addSlots(modules['lk_programming_environment/runtime_environment'], function(add) {

  add.method('postFileIn', function () {
    avocado.theApplication = avocado.runtime;
    
    if (avocado.world) {
      avocado.world.addApplication(avocado.runtime);
    }
  });
  
});


thisModule.addSlots(avocado, function(add) {

  add.creator('runtime', {}, {category: ['runtime environment']});

});


thisModule.addSlots(avocado.runtime, function(add) {

  add.method('worldName', function () { return "Avocado"; }, {category: ['printing']});

  add.data('isReflectionEnabled', false, {category: ['enabling reflection']});

  add.data('shouldOnlyShowDeploymentArea', true, {category: ['deployment area']});

  add.data('debugMode', false, {category: ['debug mode']});

  add.creator('menuItemContributors', [], {category: ['menu']});

  add.method('addGlobalCommandsTo', function (cmdList) {
    cmdList.addLine();

    this.menuItemContributors.each(function(c) {
      c.addGlobalCommandsTo(cmdList);
    });

  }, {category: ['menu']});

});


});
