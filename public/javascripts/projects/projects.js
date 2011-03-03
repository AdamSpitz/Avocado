transporter.module.create('projects/projects', function(requires) {}, function(thisModule) {
  

thisModule.addSlots(avocado, function(add) {
  
  add.creator('project', {}, {category: ['projects']});
  
});
  

thisModule.addSlots(avocado.project, function(add) {
  
  add.method('current', function () {
    return this._current || (this._current = this.create({ name: "This project" }));
  }, {category: ['current one']});
  
  add.method('setCurrent', function (p) {
    this._current = p;
    
    if (typeof(avocado.justSetCurrentProject) === 'function') {
      avocado.justSetCurrentProject(p);
    }
  }, {category: ['current one']});
  
  add.method('create', function (info) {
    return Object.newChildOf(this, info);
  }, {category: ['creating']});
  
  add.method('initialize', function (info) {
    this.setName(info.name);
    this.setIsPrivate(info.isPrivate);
    if (info._id) {
      this.setID(info._id);
    } else {
      transporter.idTracker.createTemporaryIDFor(this);
    }
  }, {category: ['creating']});
  
  add.method('name', function () { return this._name; }, {category: ['accessing']});
  
  add.method('setName', function (n) { this._name = n; this.markAsChanged(); }, {category: ['accessing']});
  
  add.method('id', function () { return this._projectID; }, {category: ['accessing']});
  
  add.method('setID', function (id) { this._projectID = id; }, {category: ['accessing']});
  
  add.method('modificationFlag', function () {
    return this._modificationFlag || (this._modificationFlag = avocado.modificationFlag.create(this, [this.module().modificationFlag()]));
  }, {category: ['accessing']});
  
  add.method('isPrivate', function () { return this._isPrivate; }, {category: ['accessing']});
  
  add.method('setIsPrivate', function (b) { this._isPrivate = b; this.markAsChanged(); }, {category: ['accessing']});
  
  add.method('isInTrashCan', function () { return this._isInTrashCan; }, {category: ['accessing']});
  
  add.method('putInTrashCan', function () { this._isInTrashCan = true; this.markAsChanged(); }, {category: ['accessing']});

  add.method('module', function () { return modules.thisProject; }, {category: ['accessing']});
  
  add.method('inspect', function () { return this.name(); }, {category: ['printing']});
  
  add.method('toString', function () { return this.name(); }, {category: ['printing']});
  
  add.method('hasChangedSinceLastFileOut', function () {
    return this.modificationFlag().hasChanged();
  }, {category: ['keeping track of changes']});

  add.method('markAsChanged', function () {
    this.modificationFlag().markAsChanged();
  }, {category: ['keeping track of changes']});

  add.method('markAsUnchanged', function () {
    this.modificationFlag().markAsUnchanged();
  }, {category: ['keeping track of changes']});

  add.method('whenChangedNotify', function (observer) {
    this.modificationFlag().notifier().addObserver(observer);
  }, {category: ['keeping track of changes']});
  
  add.method('togglePrivacy', function (evt) {
    this.setIsPrivate(! this.isPrivate());
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
        if (m === rootModule || m.haveIOrAnyOfMyRequirementsChangedSinceLastFileOut()) { // always save the root, just makes things simpler
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
  
  add.method('resetCurrentWorldStateModule', function () {
    if (!modules.currentWorldState) { return; }
    if (!modules.currentWorldState.morphs) { return; }
    var morphs = modules.currentWorldState.morphs;
  	var morphsArrayMir = reflect(morphs);
    // Need to take the slots in the "morphs" array out of the module whenever we reset the
    // array to an empty, so that the transporter doesn't gripe about the old array not
    // being well-known.
    morphs.forEach(function(m, i) { morphsArrayMir.slotAt(i).setModule(null); });
	  modules.currentWorldState.morphs = [];
  	reflect(modules.currentWorldState).slotAt('morphs').beCreator();
  }, {category: ['saving']});
  
  add.method('assignCurrentWorldStateToTheRightModule', function () {
  	var currentWorldStateModule = modules.currentWorldState || this.module().createNewOneRequiredByThisOne('currentWorldState');
  	
  	currentWorldStateModule.morphs = [];
  	reflect(currentWorldStateModule).slotAt('morphs').beCreator().setInitializationExpression('[]');
  	var morphsArrayMir = reflect(currentWorldStateModule.morphs);
  	WorldMorph.current().submorphs.forEach(function(m, i) {
  	  currentWorldStateModule.morphs.push(m);
      morphsArrayMir.slotAt(currentWorldStateModule.morphs.length - 1).beCreator();
  	});
  	
  	currentWorldStateModule.postFileIn = function() {
  	  var w = WorldMorph.current();
  	  modules.currentWorldState.morphs.forEach(function(m) { w.addMorph(m); });
  	  avocado.project.resetCurrentWorldStateModule();
  	};
  	reflect(currentWorldStateModule).slotAt('postFileIn').beCreator();
  	
  	var walker = avocado.objectGraphAnnotator.create().setShouldWalkIndexables(true).beInDebugMode().alsoAssignUnownedSlotsToModule(currentWorldStateModule);
  	
    walker.shouldContinueRecursingIntoObject = function (object, objectAnno, howDidWeGetHere) {
      if (object === currentWorldStateModule) { return true; }
      if (typeof(object.storeString) === 'function') { return false; }
      var cs = objectAnno.explicitlySpecifiedCreatorSlot();
      if (!cs) { return true; }
      return cs.name === howDidWeGetHere.slotName && cs.holder === howDidWeGetHere.slotHolder;
    };
  	
    walker.shouldContinueRecursingIntoSlot = function (holder, slotName, howDidWeGetHere) {
      // aaa - hack; really these slots should be annotated with an initializeTo: 'undefined' or something like that
      if (['pvtCachedTransform', 'fullBounds', '_currentVersion', '_requirements'].include(slotName)) { return false; }
      return true;
    };

  	walker.go(currentWorldStateModule);
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
    var allChangedModules = transporter.module.changedOnes();
    var changedModulesNotInThisProject = allChangedModules.select(function(m) { return ! versionsToSave[m.name()]; }).toArray();
    if (changedModulesNotInThisProject.size() > 0) {
      avocado.ui.showObjects(changedModulesNotInThisProject, "changed modules not in this project", evt);
      avocado.MessageNotifierMorph.showError("WARNING: You have modified modules that are not part of your project; they will not be saved.", evt, Color.orange);
    }
    
    var mockRepo = avocado.project.repository.create(this, isAutoSave);
    mockRepo.setRoot(versionsToSave[this.module().name()]);
    var errors = transporter.fileOutPlural(sortedVersionsToSave.map(function(v) { return { moduleVersion: v }; }), evt, mockRepo, transporter.module.justBodyFilerOuter);
    if (errors.length === 0) {
      mockRepo.save(function() {
    	  if (!this._shouldNotSaveCurrentWorld) { avocado.project.resetCurrentWorldStateModule(); }
        this.markAsUnchanged();
        for (var moduleName in versionsToSave) {
          modules[moduleName].markAsUnchanged();
        }
      }.bind(this), function(failureReason) {
        console.log("Error saving " + this + ": " + failureReason);
      });
    } else {
      console.log("Not saving because there were transporter errors.");
    }
  }, {category: ['saving']});

  add.creator('repository', {}, {category: ['saving']});
  
  add.method('buttonCommands', function () {
    return avocado.command.list.create(this, [
      avocado.command.create('Save', this.save)
    ]);
  }, {category: ['user interface', 'commands']});
  
  add.method('commands', function () {
    return avocado.command.list.create(this, [
      avocado.command.create('save', this.save),
      avocado.command.create('rename', this.rename),
      avocado.command.create('get root module', this.grabRootModule),
      avocado.command.create(this.isPrivate() ? 'be public' : 'be private', this.togglePrivacy)
    ]);
  }, {category: ['user interface', 'commands']});
  
});


thisModule.addSlots(avocado.project.repository, function(add) {
  
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
  
  add.method('save', function (successBlock, failBlock) {
    var json = Object.toJSON(this._projectData);
    // aaa - I imagine it's possible to send the JSON without encoding it as a POST parameter, but let's not worry about it yet.
    var postBody = "projectDataJSON=" + encodeURIComponent(json);
    var url = "http://" + window.location.host + "/project/save";
    console.log("About to save the project to URL " + url + ", sending JSON:\n" + json);
    var req = new Ajax.Request(url, {
      method: 'post',
      //postBody: postBody,
      //contentType: 'application/x-www-form-urlencoded',
      postBody: json,
      contentType: 'application/json',

      asynchronous: true,
      onSuccess:   function(transport) { this.onSuccessfulPost(JSON.parse(transport.responseText), successBlock, failBlock); }.bind(this),
      onFailure:   function(t        ) { failBlock("Failed to file out project " + this._project + " to repository " + this + "; HTTP status code was " + req.getStatus()); }.bind(this),
      onException: function(r,      e) { failBlock("Failed to file out project " + this._project + " to repository " + this + "; exception was " + e); }.bind(this)
    });
  }, {category: ['saving']});
  
  add.method('onSuccessfulPost', function (responseJSON, successBlock, failBlock) {
    if (responseJSON.error) {
      failBlock("Server responded with error: " + responseJSON.error);
    } else {
      var realIDsByTempID = responseJSON;
      for (var tempID in realIDsByTempID) {
        transporter.idTracker.recordRealID(tempID, realIDsByTempID[tempID]);
      }
      successBlock();
    }
  }, {category: ['saving']});
  
});


});
