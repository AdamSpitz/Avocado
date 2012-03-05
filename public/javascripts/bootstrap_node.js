avocado.transporter.module.create('bootstrap_node', function(requires) {}, function(thisModule) {


thisModule.addSlots(avocado.transporter, function(add) {
  
  add.creator('nodeInitializer', {}, {category: ['user interface', 'NodeJS']});
  
  add.data('userInterfaceInitializer', avocado.transporter.nodeInitializer, {category: ['user interface']});

});


thisModule.addSlots(avocado.transporter.nodeInitializer, function(add) {

  add.method('loadUserInterface', function (callWhenDone) {
    avocado.transporter.loadExternal(
      ["prototype/prototype",
       "lk/Base",
       "lk/JSON"
      ], callWhenDone
    );
  }, {category: ['bootstrapping']});
  
  add.method('doneLoadingWindow', function () {
  }, {category: ['bootstrapping']});
  
  add.method('doneLoadingAllAvocadoCode', function () {
    avocado.ui = avocado.nodeJS.ui;
  }, {category: ['bootstrapping']});
  
  add.method('loadTopLevelEnvironment', function (callWhenDone) {
    // aaa - anything that should be done here?
    if (callWhenDone) { callWhenDone(); }
  }, {category: ['bootstrapping']});
  
});


});
