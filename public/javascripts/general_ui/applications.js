avocado.transporter.module.create('general_ui/applications', function(requires) {

requires('general_ui/basic_morph_mixins');

}, function(thisModule) {


thisModule.addSlots(avocado, function(add) {
  
  add.creator('applicationList', {}, {category: ['user interface']});
  
});


thisModule.addSlots(avocado.applicationList, function(add) {

  add.method('worldName', function () {
    var appNames = [];
    this.applications().each(function(app) {
      if (typeof(app.worldName) === 'function') {
        var n = app.worldName();
        if (n) {appNames.push(n);}
      }
    });
    return appNames.join(", ");
  }, {category: ['printing']});

  add.method('applications', function () {
    this._applications = this._applications || [];
    return this._applications;
  }, {category: ['accessing']});

  add.method('addApplication', function (app) {
    var apps = this.applications();
    if (! apps.include(app)) {
      apps.push(app);
    }
  }, {category: ['adding']});

  add.method('commands', function () {
    var cmdList = avocado.command.list.create();

    // aaa TOTAL HACK. GAE isn't really an "application", exactly. Maybe we need
    // some separate concept here? -- Adam
    if (window.wasServedFromGoogleAppEngine && window.googleAppEngine) {
      googleAppEngine.addGlobalCommandsTo(cmdList);
    }

    this.applications().each(function(app) { app.addGlobalCommandsTo(cmdList); });

    if (cmdList.size() === 0) { return null; }
    return cmdList;
  }, {category: ['commands']});

});


thisModule.addSlots(avocado.morphMixins.WorldMorph, function(add) {
  
  add.method('applicationList', function () {
    return avocado.applicationList;
  }, {category: ['applications']})

  add.method('inspect', function () {
    return this.applicationList().worldName();
  }, {category: ['printing']})
  
  add.method('commands', function () {
    return this.applicationList().commands();
  }, {category: ['commands']});
  
});


});
