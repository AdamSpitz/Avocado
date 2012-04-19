avocado.transporter.module.create('lk_programming_environment/runtime_environment', function(requires) {

requires('avocado_lib');

}, function(thisModule) {

  
thisModule.addSlots(avocado, function(add) {

  add.creator('runtime', {}, {category: ['runtime environment']});

});


thisModule.addSlots(avocado.runtime, function(add) {

  add.method('loadAsTopLevelEnvironment', function () {
    avocado.livelyKernelUI.isZoomingEnabled = true;
    avocado.livelyKernelUI.debugMode = false;
    avocado.applicationList.addApplication(this);
  });
  
  add.method('worldName', function () { return "Avocado"; }, {category: ['printing']});

  add.data('isReflectionEnabled', false, {category: ['enabling reflection']});

  add.data('isMorphMenuEnabled', false, {category: ['enabling reflection']});

  add.data('shouldOnlyShowDeploymentArea', true, {category: ['deployment area']});

  add.creator('menuItemContributors', [], {category: ['menu']});

  add.method('addGlobalCommandsTo', function (cmdList) {
    cmdList.addLine();

    this.menuItemContributors.each(function(c) {
      c.addGlobalCommandsTo(cmdList);
    });

  }, {category: ['menu']});

});


});
