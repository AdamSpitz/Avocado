avocado.transporter.module.create('projects/projects', function(requires) {

}, function(thisModule) {


thisModule.addSlots(avocado, function(add) {

  add.creator('project', {}, {category: ['projects']});

});


thisModule.addSlots(avocado.project, function(add) {

  add.method('current', function () {
    if (this._current) { return this._current; }
    if (! modules.thisProject) { return null; }
    this._current = this.create({ moduleName: "thisProject", name: "This project" });
    return this._current;
  }, {category: ['current one']});

  add.method('setCurrent', function (p) {
    this._current = p;
    
	  if (this.shouldOnlyShowDeploymentArea()) {
	    var dm = p.deploymentMorphIfAny();
	    if (dm) { avocado.ui.currentWorld().addMorph(dm); }
    }
    
    if (typeof(avocado.justSetCurrentProject) === 'function') {
      avocado.justSetCurrentProject(p);
    }
    
    return p;
  }, {category: ['current one']});

  add.method('shouldOnlyShowDeploymentArea', function () {
    return avocado.applicationList.applications().any(function(app) { return app.shouldOnlyShowDeploymentArea; });
  }, {category: ['current one']});

  add.method('create', function (info) {
    return Object.newChildOf(this, info);
  }, {category: ['creating']});

  add.method('initialize', function (info) {
    this._module = modules[info.moduleName];
    this.setName(info.name);
    this.setIsPrivate(info.isPrivate);
    if (info._id) {
      this.setID(info._id);
    } else {
      avocado.transporter.idTracker.createTemporaryIDFor(this);
    }
  }, {category: ['creating']});

  add.method('name', function () { return this._name; }, {category: ['accessing']});

  add.method('setName', function (n) { this._name = n; this.markAsChanged(); }, {category: ['accessing']});

  add.method('id', function () { return this._projectID; }, {category: ['accessing']});

  add.method('setID', function (id) { this._projectID = id; }, {category: ['accessing']});

  add.data('_modificationFlag', null, {category: ['accessing'], initializeTo: 'null'});

  add.method('modificationFlag', function () {
    return this._modificationFlag || (this._modificationFlag = avocado.modificationFlag.create(this, [this.module().modificationFlag()]));
  }, {category: ['accessing']});

  add.method('isPrivate', function () { return this._isPrivate; }, {category: ['accessing']});

  add.method('setIsPrivate', function (b) { this._isPrivate = b; this.markAsChanged(); }, {category: ['accessing']});

  add.method('isInTrashCan', function () { return this._isInTrashCan; }, {category: ['accessing']});

  add.method('putInTrashCan', function () { this._isInTrashCan = true; this.markAsChanged(); }, {category: ['accessing']});

  add.method('module', function () { return this._module; }, {category: ['accessing']});

  add.method('inspect', function () { return this.name(); }, {category: ['printing']});

  add.method('toString', function () { return this.name(); }, {category: ['printing']});

  add.method('markAsChanged', function () {
    this.modificationFlag().markAsChanged();
  }, {category: ['keeping track of changes']});

  add.method('markAsUnchanged', function () {
    this.modificationFlag().markAsUnchanged();
  }, {category: ['keeping track of changes']});

  add.method('whenChangedNotify', function (observer) {
    this.modificationFlag().notifier().addObserver(observer);
  }, {category: ['keeping track of changes']});

  add.method('deploymentMorph', function () {
    var module = this.currentWorldStateModule();
    var morph = module._deploymentMorph;
    if (! morph) {
      morph = module._deploymentMorph = new Morph(new lively.scene.Rectangle(pt(0,0).extent(pt(600,450))));
      morph.setFill(Color.white);
      morph.setBorderColor(Color.black);
      morph.switchEditModeOn();
      
      /* aaa - I do want some sort of instructions for the programmer, but I don't want this
       label to appear in the deployed project. -- Adam, June 2011
      var label = avocado.label.newMorphFor("Put things in this box to make them appear in the deployed project");
      label.fitText();
      morph.addMorphCentered(label);
      */
      
      var slot = reflect(module).slotAt('_deploymentMorph');
      slot.beCreator();
      slot.setModule(module);
    }
    return morph;
  }, {category: ['deploying']});

  add.method('deploymentMorphIfAny', function () {
    return modules.currentWorldState && modules.currentWorldState._deploymentMorph;
  }, {category: ['deploying']});

  add.method('addGlobalCommandsTo', function (cmdList, evt) {
    cmdList.addLine();
    
    cmdList.addItem(["project info", function(evt) {
      var currentProject = avocado.project.current();
      if (! currentProject) {
        avocado.transporter.module.named("thisProject");
        currentProject = avocado.project.current();
      }
      avocado.ui.grab(currentProject, evt);
    }]);
  }, {category: ['commands']});

  add.method('togglePrivacy', function (evt) {
    this.setIsPrivate(! this.isPrivate());
  }, {category: ['commands']});

  add.method('grabDeploymentMorph', function (evt) {
    this.deploymentMorph().grabMe(evt);
  }, {category: ['commands']});

  add.method('grabRootModule', function (evt) {
    avocado.ui.grab(this.module(), evt);
  }, {category: ['commands']});

  add.method('rename', function (evt) {
    avocado.ui.prompt("New name?", function(n) { if (n) { this.setName(n); }}.bind(this), this.name(), evt);
  }, {category: ['commands']});

  add.method('determineVersionsToSave', function () {
    var versionsToSave = {};
    var rootModule = this.module();
    var modulesNotToSave = {};
    var modulesLeftToLookAt = [this.module()];
    while (modulesLeftToLookAt.length > 0) {
      var m = modulesLeftToLookAt.pop();
      if (!modulesNotToSave[m.name()] && !versionsToSave[m.name()]) {
        // aaa - Could make this algorithm faster if each module knew who required him - just check
        // if m itself has changed, and if so then walk up the requirements chain making sure that
        // they're included.
        if (m === rootModule || m.modificationFlag().hasThisOneOrChildrenChanged()) { // always save the root, just makes things simpler
          versionsToSave[m.name()] = m.createNewVersion();
          m.requirements().each(function(requiredModuleName) { modulesLeftToLookAt.push(modules[requiredModuleName])});
        } else {
          modulesNotToSave[m.name()] = m;
        }
      }
    }
    return versionsToSave;
  }, {category: ['saving']});

  add.method('sortVersionsToSave', function (versionsToSave) {
    var moduleGraph = avocado.graphs.directed.create([this.module()], function(m) { return m.requiredModules(); });
    var sortedModules = moduleGraph.topologicalSort();
    var sortedVersionsToSave = [];
    sortedModules.each(function(m) {
      var v = versionsToSave[m.name()];
      if (v) { sortedVersionsToSave.push(v); }
    });
    return sortedVersionsToSave;
  }, {category: ['saving']});

  add.data('_shouldNotSaveCurrentWorld', false, {category: ['saving']});

  add.method('currentWorldStateModule', function () {
    return modules.currentWorldState || this.module().createNewOneRequiredByThisOne('currentWorldState');
  }, {category: ['saving']});

  add.method('resetCurrentWorldStateModule', function () {
    if (!modules.currentWorldState) { return; }
    if (!modules.currentWorldState.morphs) { return; }
    var morphs = modules.currentWorldState.morphs;
  	var morphsArrayMir = reflect(morphs);
    // Need to take the slots in the "morphs" array out of the module whenever we reset the
    // array to an empty one, so that the transporter doesn't gripe about the old array not
    // being well-known.
    morphs.forEach(function(m, i) { morphsArrayMir.slotAt(i).setModule(null); });
	  modules.currentWorldState.morphs = [];
  	reflect(modules.currentWorldState).slotAt('morphs').beCreator();
  }, {category: ['saving']});

  add.method('assignCurrentWorldStateToTheRightModule', function () {
  	var currentWorldStateModule = this.currentWorldStateModule();
  	
  	currentWorldStateModule.morphs = [];
  	reflect(currentWorldStateModule).slotAt('morphs').beCreator(); // .setInitializationExpression('[]'); // aaa I don't understand why this was here, it just seems broken
  	var morphsArrayMir = reflect(currentWorldStateModule.morphs);
  	
    var currentWorldSubmorphs = avocado.ui.currentWorld().submorphs;
    var currentWorldSubmorphsMir = reflect(currentWorldSubmorphs);
    currentWorldSubmorphs.forEach(function(m, i) {
      if (! m.shouldNotBeTransported() && ! m.shouldIgnorePoses()) {
    	  currentWorldStateModule.morphs.push(m);
    	  
        // If the morph is already owned by some creator slot other than the world's submorphs array,
        // don't steal it, just remember which module it's in, and make the currentWorldState module
        // depend on it.
        var mMir = reflect(m);
        var cs = mMir.theCreatorSlot();
        var csModule;
        if (cs && cs.contents().equals(mMir) && (csModule = cs.getModuleAssignedToMeExplicitlyOrImplicitly()) && !cs.holder().equals(currentWorldSubmorphsMir) && mMir.creatorSlotChain()) {
          if (csModule !== currentWorldStateModule) {
            currentWorldStateModule.addRequirement(csModule.name());
          }
        } else {
          morphsArrayMir.slotAt(currentWorldStateModule.morphs.length - 1).beCreator();
        }
  	  }
  	});
  	
  	currentWorldStateModule.postFileIn = function() {
  	  var w = avocado.ui.currentWorld();
  	  if (! avocado.project.shouldOnlyShowDeploymentArea()) {
    	  this.morphs.forEach(function(m) { w.addMorph(m); });
  	  }
  	  avocado.project.resetCurrentWorldStateModule();
  	};
  	reflect(currentWorldStateModule).slotAt('postFileIn').beCreator();
  	reflect(currentWorldStateModule).normalSlots().each(function(s) { s.setModule(currentWorldStateModule); });
  	
    // aaa - hack; really these slots should be annotated with an initializeTo: 'undefined' or something like that
    // AAAAAAAAAA - we're not actually walking anymore, now that we have the new module slotFinder, so I think I've gotta do the initializeTo thing now
  	// walker.namesToIgnore = walker.namesToIgnore.concat(['pvtCachedTransform', 'fullBounds', '_currentVersion', '_requirements', '_modificationFlag']);

    currentWorldStateModule.markAsChanged();
    
  });

  add.method('autoSave', function (evt) {
  	this.save(evt, true);
  });

  add.method('save', function (evt, isAutoSave) {
    if (!this._shouldNotSaveCurrentWorld) { this.assignCurrentWorldStateToTheRightModule(); }
    
    var versionsToSave = this.determineVersionsToSave();
    var sortedVersionsToSave = this.sortVersionsToSave(versionsToSave);
    
    // Check to make sure there aren't any *other* changes in the image that aren't part of this project.
    var allChangedModules = avocado.transporter.module.changedOnes();
    var changedModulesNotInThisProject = allChangedModules.select(function(m) { return !versionsToSave[m.name()] && m !== modules.init; }).toArray(); // AAAAAAAAAAAA
    if (changedModulesNotInThisProject.size() > 0) { // aaaaaaaaaaaaaaaaaaaaa
      avocado.ui.showObjects(changedModulesNotInThisProject, "changed modules not in this project", evt);
      avocado.messageNotifier.showError("WARNING: You have modified modules that are not part of your project; they will not be saved.", evt, Color.orange);
    }
    
    var mockRepo = avocado.project.moduleRepository.create(this, isAutoSave);
    mockRepo.setRoot(versionsToSave[this.module().name()]);
    var errors = avocado.transporter.fileOutPlural(sortedVersionsToSave.map(function(v) { return { moduleVersion: v }; }), evt, mockRepo, this.defaultModuleFilerOuter());
    if (errors.length === 0) {
      var server = this.defaultServer();
      var format = this.defaultFormat();
      server.save(mockRepo, format, true, function() {
        console.log("Successfully saved the project.");
    	  if (!this._shouldNotSaveCurrentWorld) { avocado.project.resetCurrentWorldStateModule(); }
        this.markAsUnchanged();
      }.bind(this), function(failureReason) {
        console.log("Error saving " + this + ": " + failureReason);
      });
    } else {
      console.log("Not saving because there were transporter errors.");
    }
  }, {category: ['saving']});

  add.creator('moduleRepository', {}, {category: ['saving']});

  add.creator('servers', {}, {category: ['saving']});

  add.creator('formats', {}, {category: ['saving']});

  add.method('defaultServer', function () {
    // aaa - this needs to be specified by the various kinds of servers
    // return this._defaultServer || avocado.project.servers.savingScript.create("http://" + window.location.host + "/project/save", "post");
    return this._defaultServer || avocado.project.servers.webdav.create(modules.bootstrap.repository(), "put");
  }, {category: ['saving']});

  add.method('defaultFormat', function () {
    // aaa - this needs to be specified by the various kinds of servers
    // return this._defaultFormat || this.formats.json;
    return this._defaultFormat || this.formats.runnable;
  }, {category: ['saving']});

  add.method('defaultModuleFilerOuter', function () {
    // aaa - this needs to be specified by the various kinds of servers
    // return avocado.transporter.module.filerOuters.justBody;
    return avocado.transporter.module.filerOuters.normal;
  }, {category: ['saving']});

  add.method('setDefaultServer', function (s) {
    this._defaultServer = s;
  }, {category: ['saving']});

  add.method('setDefaultFormat', function (f) {
    this._defaultFormat = f;
  }, {category: ['saving']});

  add.method('commands', function () {
    return avocado.command.list.create(this, [
      avocado.command.create('save', this.save),
      avocado.command.create('show deployment area', this.grabDeploymentMorph),
      avocado.command.create('rename', this.rename),
      avocado.command.create(this.isPrivate() ? 'be public' : 'be private', this.togglePrivacy),
      avocado.command.create('get root module', this.grabRootModule)
    ]);
  }, {category: ['user interface', 'commands']});

});


thisModule.addSlots(avocado.project.moduleRepository, function(add) {

  add.method('create', function (project, isAutoSave) {
    return Object.newChildOf(this, project, isAutoSave);
  }, {category: ['creating']});

  add.method('initialize', function (project, isAutoSave) {
    this._project = project;
    this._projectData = {
      _id: project.id(),
      name: project.name(),
      isPrivate: project.isPrivate(),
      isInTrashCan: project.isInTrashCan(),
      isAutoSave: isAutoSave,
      modules: []
    };
  }, {category: ['creating']});

  add.method('setRoot', function (rootModuleVersion) {
    this._projectData.root = rootModuleVersion.versionID();
  }, {category: ['saving']});

  add.method('fileOutModuleVersion', function (moduleVersion, codeToFileOut, successBlock, failBlock) {
    this._projectData.modules.push({
      module: moduleVersion.module().name(),
      version: moduleVersion.versionID(),
      parents: moduleVersion.parentVersions().map(function(pv) { return pv.versionID(); }),
      reqs: moduleVersion.requiredModuleVersions().map(function(v) { return v.versionID(); }),
      code: codeToFileOut
    });
  }, {category: ['saving']});

});


thisModule.addSlots(avocado.project.formats, function(add) {

  add.creator('json', {});

  add.creator('runnable', {});

});


thisModule.addSlots(avocado.project.formats.json, function(add) {

  add.method('fileContentsFromProjectData', function (projectData) {
    return Object.toJSON(projectData);
  });

  add.method('parseResponse', function (responseText) {
    return JSON.parse(responseText);
  });

  add.method('contentType', function () {
    return 'application/json';
  });

});


thisModule.addSlots(avocado.project.formats.runnable, function(add) {

  add.method('fileContentsFromProjectData', function (projectData) {
    var projectDataToSend = {};
    if (projectData._id) { projectDataToSend._id = projectData._id.toString(); }
    projectDataToSend.moduleName = "thisProject";
    projectDataToSend.name = projectData.name.toString();
    projectDataToSend.isPrivate = !! projectData.isPrivate;
    return "modules.bootstrap.repository().fileIn('thisProject', function() {\n  avocado.project.setCurrent(avocado.project.create(" + Object.toJSON(projectDataToSend) + "));\n});\n";
  });

  add.method('parseResponse', function (responseText) {
    // I don't think there should be anything in the responseText.
    return {};
  });

  add.method('contentType', function () {
    return 'text/plain';
  });

});


thisModule.addSlots(WorldMorph.prototype, function(add) {

  add.method('deployProjectFromFile', function (projectFileName, callback) {
    avocado.transporter.availableRepositories[0].fileIn(projectFileName.withoutSuffix(".js"), function() {
      this.deployProject(avocado.project.current(), callback);
    }.bind(this));
  }, {category: ['projects']});

  add.method('deployProject', function (p, callback) {
    var dm = p.deploymentMorph();
    this.addMorphAt(dm, pt(0,0));
    dm.grabsShouldFallThrough = true;
    var desiredExtent = dm.getExtent().scaleBy(dm.getScale());
    this.setExtent(desiredExtent);
    var canvas = this.canvas();
    canvas.setAttribute("width",  desiredExtent.x);
    canvas.setAttribute("height", desiredExtent.y);
    this.changed();
    if (callback) { callback(); }
  }, {category: ['projects']});

});


thisModule.addSlots(avocado.project.servers, function(add) {

  add.creator('generic', {});

  add.creator('savingScript', Object.create(avocado.project.servers.generic));

});


thisModule.addSlots(avocado.project.servers.savingScript, function(add) {

  add.method('create', function (url) {
    return Object.newChildOf(this, url);
  }, {category: ['creating']});

  add.method('initialize', function (url) {
    this._url = url;
  }, {category: ['creating']});

  add.method('save', function (moduleRepo, format, shouldSaveAsSingleFile, successBlock, failBlock) {
    // shouldSaveAsSingleFile is ignored because the server is smart enough to store the modules
    // separately and recombine them as needed; the parameter is just here for compatibility with
    // the webdav one. -- Adam, June 2011
    
    var body = format.fileContentsFromProjectData(moduleRepo._projectData);
    console.log("About to save the project to URL " + this._url + ", sending:\n" + body);
    
    var req = new XMLHttpRequest();
    req.open('post', this._url, true);
    req.onreadystatechange = function() {
      if (req.readyState === 4) {
        try {
          var status = req.status;
          var success = !status || (status >= 200 && status < 300);
          if (success) {
            this.onSuccessfulPost(format.parseResponse(req.responseText), successBlock, failBlock);
          } else {
            failBlock("Failed to file out project " + moduleRepo._project + " to repository " + moduleRepo + "; HTTP status code was " + status);
          }
        } catch (e) {
          failBlock("Failed to file out project " + moduleRepo._project + " to repository " + moduleRepo + "; exception was " + e);
        }
      }
    }.bind(this);
    req.send(body);
  }, {category: ['saving']});

  add.method('onSuccessfulPost', function (responseJSON, successBlock, failBlock) {
    if (responseJSON.error) {
      failBlock("Server responded with error: " + responseJSON.error);
    } else {
      var realIDsByTempID = responseJSON;
      for (var tempID in realIDsByTempID) {
        avocado.transporter.idTracker.recordRealID(tempID, realIDsByTempID[tempID]);
      }
      successBlock();
    }
  }, {category: ['saving']});

});


thisModule.addSlots(avocado.project.servers, function(add) {

  add.creator('webdav', Object.create(avocado.project.servers.generic));

});


thisModule.addSlots(avocado.project.servers.webdav, function(add) {

  add.method('create', function (repo) {
    return Object.newChildOf(this, repo);
  }, {category: ['creating']});

  add.method('initialize', function (repo) {
    this._repo = repo;
  }, {category: ['creating']});

  add.method('callbackThatAccumulatesErrorsIn', function (errors, callback) {
    return function(errorMessage) {
      errors.push(errorMessage);
      callback();
    };
  }, {category: ['saving']});

  add.method('save', function (moduleRepo, format, shouldSaveAsSingleFile, successBlock, failBlock) {
    var project = moduleRepo._project;
    var projectData = moduleRepo._projectData;
    var modulesData = projectData.modules;
    projectData.modules = projectData.modules.map(function(moduleData) { return moduleData.module; });
    if (shouldSaveAsSingleFile) {
      var fileContents = [];
      
      modulesData.forEach(function(moduleData) {
        fileContents.push(moduleData.code, "\n\n");
      });
      
      fileContents.push(format.fileContentsFromProjectData(projectData));
      this._repo.saveFile(project.name() + "_project.js", fileContents.join(""), successBlock, failBlock);
    } else {
      var errors = [];
      avocado.callbackWaiter.on(function(generateIntermediateCallback) {
        modulesData.forEach(function(moduleData) {
          var intermediateCallback = generateIntermediateCallback();
          avocado.transporter.fileOut(modules[moduleData.module].currentVersion(), this._repo, moduleData.code, intermediateCallback, this.callbackThatAccumulatesErrorsIn(errors, intermediateCallback));
        }.bind(this));

        var intermediateCallback = generateIntermediateCallback();
        var projectBody = format.fileContentsFromProjectData(projectData);
        this._repo.saveFile(project.name() + "_project.js", projectBody, intermediateCallback, this.callbackThatAccumulatesErrorsIn(errors, intermediateCallback));
      }.bind(this), function() {
        if (errors.length === 0) {
          successBlock();
        } else {
          failBlock(errors.join(", "));
        }
      }, "saving a project");
    }
  }, {category: ['saving']});

});


});
