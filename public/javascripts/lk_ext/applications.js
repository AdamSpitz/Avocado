transporter.module.create('lk_ext/applications', function(requires) {}, function(thisModule) {


thisModule.addSlots(WorldMorph.prototype, function(add) {

  add.method('inspect', function () {
    var appNames = [];
    this.applications().each(function(app) {
      if (typeof(app.worldName) === 'function') {
        var n = app.worldName();
        if (n) {appNames.push(n);}
      }
    });
    return appNames.join(", ");
  }, {category: ['applications']});

  add.method('applications', function () {
    this._applications = this._applications || [];
    return this._applications;
  }, {category: ['applications']});

  add.method('addApplication', function (app) {
    var apps = this.applications();
    if (! apps.include(app)) {
      apps.push(app);
    }
  }, {category: ['applications']});

  add.method('commands', function ($super) {
    var cmdList = avocado.command.list.create();

    // aaa TOTAL HACK. GAE isn't really an "application", exactly. Maybe we need
    // some separate concept here? -- Adam
    if (window.wasServedFromGoogleAppEngine && window.googleAppEngine) {
      googleAppEngine.addGlobalCommandsTo(cmdList);
    }

    this.applications().each(function(app) { app.addGlobalCommandsTo(cmdList); });

    if (cmdList.size() === 0) { return null; }
    return cmdList;
  }, {category: ['applications']});

});


});
