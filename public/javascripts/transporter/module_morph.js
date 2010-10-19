transporter.module.create('transporter/module_morph', function(requires) {

requires('lk_ext/rows_and_columns');
requires('transporter/transporter');

}, function(thisModule) {


thisModule.addSlots(transporter.module, function(add) {

  add.method('newMorph', function () {
    return new this.Morph(this);
  }, {category: ['user interface']});

  add.method('Morph', function Morph() { Class.initializer.apply(this, arguments); }, {category: ['user interface']});

});


thisModule.addSlots(transporter.module.Morph, function(add) {

  add.data('superclass', avocado.RowMorph);

  add.creator('prototype', Object.create(avocado.RowMorph.prototype));

  add.data('type', 'transporter.module.Morph');

  add.method('doneUpload', function (name) {
    if (name.substr(-3) === '.js') { name = name.substr(0, name.length - 3); }
    transporter.fileIn(name, function() {
      new avocado.MessageNotifierMorph(name + " has been loaded.", Color.green).showTemporarilyInCenterOfWorld(WorldMorph.current());
    });
  });

});


thisModule.addSlots(transporter.module.Morph.prototype, function(add) {

  add.data('constructor', transporter.module.Morph);

  add.method('initialize', function ($super, module) {
    $super();
    this._module = module;

    this.setPadding({top: 2, bottom: 2, left: 4, right: 4, between: 3});
    this.setFill(lively.paint.defaultFillWithColor(Color.red.lighter()));
    this.shape.roundEdgesBy(10);
    this.closeDnD();

    this._nameLabel = TextMorph.createLabel(function() { return module.name(); });

    var fileOutButton = ButtonMorph.createButton('Save as .js file', this.fileOut.bind(this), 2);
    var optionalFileOutButton  = Morph.createOptionalMorph(fileOutButton, function() { return this._module.canBeFiledOut(); }.bind(this));
    optionalFileOutButton.refreshContent();

    this._changeIndicator = TextMorph.createLabel(function() { return this._module.hasChangedSinceLastFileOut() ? ' has changed ' : ''; }.bind(this));
    this._changeIndicator.setTextColor(Color.green.darker());

    this.setColumns([this._nameLabel, this._changeIndicator, optionalFileOutButton, this.createDismissButton()]);

    this.startPeriodicallyUpdating();
  }, {category: ['creating']});

  add.method('inspect', function () { return this._module.name(); }, {category: ['printing']});

  add.method('rename', function (evt) {
    evt.hand.world().prompt("New name?", function(newName) {
      avocado.MessageNotifierMorph.showIfErrorDuring(function () {
        this._module.rename(newName);
        this.updateAppearance();
      }.bind(this), evt);
    }.bind(this), this._module.name());
  }, {category: ['commands']});

  add.method('fileOut', function (evt) {
    this.fileOutPlural([{morph: this}], evt);
  }, {category: ['commands']});

  add.method('fileOutPlural', function (morphsAndCommands, evt, repo) {
    transporter.prepareToFileStuffOut();
    morphsAndCommands.each(function(morphAndCommand) {
      var m = morphAndCommand.morph;
      m._module.fileOut(null,
                        repo,
                        function() { m.refreshContentOfMeAndSubmorphs(); },
                        function(msg, errors) { m.errorFilingOut(msg, errors, evt); });
    });
  }, {category: ['commands']});

  add.method('errorFilingOut', function (msg, errors, evt) {
    var morphs = [];
    var someMirrorsNeedCreatorSlots = false;
    errors.each(function(err) {
      if (err.mirrorWithoutCreatorPath) {
        var world = evt.hand.world();
        var mirMorph = world.morphFor(err.mirrorWithoutCreatorPath);
        if (! morphs.include(mirMorph)) {
          console.log(this._module + " needs " + err.mirrorWithoutCreatorPath.inspect() + " to have a creator path because " + (err.reasonForNeedingCreatorPath || "I said so, that's why."));
          morphs.push(mirMorph);
        }
        someMirrorsNeedCreatorSlots = true;
      } else {
        morphs.push(new avocado.MessageNotifierMorph(err, Color.red));
      }
    }.bind(this));
    var world = evt.hand.world();
    world.assumePose(Object.newChildOf(avocado.poses.list, this._module + " errors", world, morphs));
    avocado.MessageNotifierMorph.showError(msg + (someMirrorsNeedCreatorSlots ? "; make sure these objects have creator paths" : ""), evt);
  }, {category: ['commands']});

  add.method('emailTheSource', function (evt) {
    var repo = Object.newChildOf(transporter.repositories.httpWithSavingScript,
				 this._module.repository().url(),
				 "http://" + document.domain + "/cgi-bin/emailSource.cgi");
    this.fileOutPlural([{morph: this}], evt, repo);
  }, {category: ['commands']});

  add.method('fileOutWithoutAnnotations', function (evt) {
    avocado.MessageNotifierMorph.showIfErrorDuring(function() { this._module.fileOutWithoutAnnotations(); }.bind(this), evt);
    this.refreshContentOfMeAndSubmorphs();
  }, {category: ['commands']});

  add.method('mockFileOut', function (evt) {
    console.log(this._module.codeOfMockFileOut());
  }, {category: ['commands']});

  add.method('printToConsole', function (evt) {
    this._module.fileOut(Object.newChildOf(transporter.module.annotationlessFilerOuter),
			   transporter.repositories.console,
			   function() {},
			   function(msg, errors) { this.errorFilingOut(msg, errors, evt); }.bind(this));
  }, {category: ['commands']});

  add.method('forgetIWasChanged', function (evt) {
    this._module.markAsUnchanged();
    this.refreshContentOfMeAndSubmorphs();
  }, {category: ['commands']});

  add.method('getModuleObject', function (evt) {
    evt.hand.world().morphFor(reflect(this._module)).grabMe(evt);
  }, {category: ['commands']});

  add.method('getAllObjects', function (evt) {
    var w = evt.hand.world();
    var objectsInPose = this._module.objectsThatMightContainSlotsInMe().map(function(o) { return reflect(o); });
    objectsInPose.unshift(this._module); // aaa - should really put it in a special place on the screen
    w.assumePose(w.listPoseOfMorphsFor(objectsInPose, "objects in module " + this._module.name()));
  }, {category: ['commands']});

  add.method('addCommandsTo', function (cmdList) {
    if (this._module.canBeFiledOut()) {
      cmdList.addItem({label: 'save as .js file', pluralLabel: 'save modules as .js files', go: this.fileOut.bind(this), pluralGo: this.fileOutPlural.bind(this)});
      // aaa - not working yet: cmdList.addItem({label: 'email me the source', go: this.emailTheSource.bind(this)});
    }

    cmdList.addItem({label: 'print to console', go: this.printToConsole.bind(this)});

    if (avocado.debugMode) {
      cmdList.addItem({label: 'print mock fileout', go: this.mockFileOut.bind(this)});
    }

    if (this._module.hasChangedSinceLastFileOut()) {
      cmdList.addItem({label: 'forget I was changed', go: this.forgetIWasChanged.bind(this)});
    }

    cmdList.addLine();

    cmdList.addItem({label: 'rename',            go: this.rename.bind(this)});
    cmdList.addItem({label: 'get module object', go: this.getModuleObject.bind(this)});

    cmdList.addLine();

    cmdList.addItem({label: 'all objects', go: this.getAllObjects.bind(this)});
  }, {category: ['menu']});

});


thisModule.addSlots(transporter, function(add) {

  add.method('chooseARepository', function (evt, targetMorph, menuCaption, callback) {
    if (transporter.availableRepositories.length === 1) { callback(transporter.availableRepositories[0], evt); return; }

    var repoMenu = new MenuMorph([], targetMorph);
    transporter.availableRepositories.each(function(repo) {
      repoMenu.addItem([repo.toString(), function() { callback(repo, evt); }])
    });
    repoMenu.openIn(evt.hand.world(), evt.point(), false, menuCaption);
  }, {category: ['menu']});

  add.method('createAModule', function (evt, targetMorph, callback) {
    this.chooseARepository(evt, targetMorph, 'Which server should the new module live on?', function(repo, evt) {
      evt.hand.world().prompt("Module name?", function(name) {
        if (name) {
	  if (lobby.modules[name]) {
	    throw "There is already a module named " + name;
	  }
	  var module = lobby.transporter.module.named(name);
	  module._repository = repo;
	  if (modules.thisProject) { modules.thisProject.addRequirement(name); }
	  callback(module, evt);
	}
      });
    });
  }, {category: ['menu']});

  add.method('modulePathDictionary', function () {
    var modulePathDictionary = avocado.dictionary.copyRemoveAll();
    transporter.module.eachModule(function(m) {
      var nameParts = m.name().split('/');
      var currentDictionary = modulePathDictionary;
      while (nameParts.length > 1) {
        var part = nameParts.shift();
        currentDictionary = currentDictionary.getOrIfAbsentPut(part, function() {return avocado.dictionary.copyRemoveAll();});
      }
      currentDictionary.put(nameParts.shift(), m);
    });
    return modulePathDictionary;
  }, {category: ['menu']});

  add.method('menuItemsForModulePathDictionary', function (modulePathDictionary, evt, callback) {
    if (modulePathDictionary.keys) { // aaa is there a better way to do a type test?
      return modulePathDictionary.keys().sort().map(function(dirName) {
          return [dirName, this.menuItemsForModulePathDictionary(modulePathDictionary.get(dirName), evt, callback)];
      }.bind(this));
    } else {
      // the leaves of the tree are the modules
      var module = modulePathDictionary;
      return function(evt) { callback(module, evt); };
    }
  }, {category: ['menu']});

  add.method('chooseOrCreateAModule', function (evt, likelyModules, targetMorph, menuCaption, callback) {
    var modulesMenu = new MenuMorph([], targetMorph);
    modulesMenu.addItem(["new module...", function(evt) { this.createAModule(evt, targetMorph, callback); }.bind(this)]);
    modulesMenu.addLine();
    if (likelyModules.length > 0 && likelyModules.length < 8) {
      likelyModules.each(function(likelyModule) {
        if (likelyModule) {
          modulesMenu.addItem([likelyModule.name(), function(evt) { callback(likelyModule, evt); }]);
        }
      }.bind(this));
      modulesMenu.addLine();
    }
    modulesMenu.addItems(this.menuItemsForModulePathDictionary(this.modulePathDictionary(), evt, callback));
    modulesMenu.openIn(targetMorph.world(), evt.point(), false, menuCaption);
  }, {category: ['menu']});

  add.method('addGlobalCommandsTo', function (menu, evt) {
    menu.addLine();

    var snapshottingWorks = false; // aaa - turn this on once it works.
    if (snapshottingWorks) {
    menu.addItem(["save snapshot", function(evt) {
      var s = avocado.snapshotter.create();
      s.walk(lobby);
      var snapshot = s.completeSnapshotText();

      var baseDirURL = URL.source.getDirectory().withRelativePath("javascripts/snapshots/");
      var fileName = "snapshot_" + s._number + ".js";
      var url = baseDirURL.withFilename(fileName);
      var status = new Resource(Record.newPlainInstance({URL: url})).store(snapshot, true).getStatus();
      if (! status.isSuccess()) {
        throw "failed to write " + fileName + ", status is " + status.code();
      }
    }]);
    }

    menu.addItem(["all modules", function(evt) {
      var world = evt.hand.world();
      world.assumePose(world.listPoseOfMorphsFor(Object.newChildOf(avocado.enumerator, transporter.module, 'eachModule'), "all modules"));
    }]);

    menu.addItem(["changed modules", function(evt) {
      var world = evt.hand.world();
      world.assumePose(world.listPoseOfMorphsFor(transporter.module.changedOnes(), "all modules"));
    }]);

    /* Not working yet.
      menu.addItem(["aaa upload file...", function(evt) {
        var form = document.getElementById('uploadForm');
        var fileInput = form.fileToUpload;
        fileInput.click();
      }.bind(this)]);
    */

    // aaa - hack because I haven't managed to get WebDAV working on adamspitz.com yet
    var shouldBeAbleToLoadJSFiles = avocado.debugMode;
    if (shouldBeAbleToLoadJSFiles) {
      menu.addItem(["load JS file...", function(evt) {
        var world = evt.hand.world();
        var modulesMenu = new MenuMorph([], world);
        transporter.availableRepositories.each(function(repo) {
          modulesMenu.addItem([repo.toString(), repo.menuItemsForLoadMenu()]);
        });
        modulesMenu.openIn(world, evt.point(), false, "From where?");
      }.bind(this)]);
    }

  }, {category: ['menu']});

});


thisModule.addSlots(transporter.repositories.http, function(add) {

  add.method('menuItemsForLoadMenu', function () {
    return this.menuItemsForLoadMenuForDir(new FileDirectory(new URL(this._url)), "");
  }, {category: ['menu']});

  add.method('menuItemsForLoadMenuForDir', function (dir, pathFromModuleSystemRootDir) {
    var menuItems = [];

    var subdirURLs = this.subdirectoriesIn(dir);
    subdirURLs.each(function(subdirURL) {
      var subdir = new FileDirectory(subdirURL);
      var subdirName = subdirURL.filename().withoutSuffix('/');
      menuItems.push([subdirName, this.menuItemsForLoadMenuForDir(subdir, pathFromModuleSystemRootDir ? pathFromModuleSystemRootDir + "/" + subdirName : subdirName)]);
    }.bind(this));
        
    var jsFileNames = this.filenamesIn(dir).select(function(n) {return n.endsWith(".js");});
    jsFileNames.each(function(n) {
      menuItems.push([n, function(evt) {
        var moduleName = n.substring(0, n.length - 3);
        avocado.MessageNotifierMorph.showIfErrorDuring(function() {
          this.fileIn(pathFromModuleSystemRootDir ? (pathFromModuleSystemRootDir + '/' + moduleName) : moduleName);
        }.bind(this), evt);
      }.bind(this)]);
    }.bind(this));

    return menuItems;
  }, {category: ['menu']});

});


thisModule.addSlots(transporter.repositories.httpWithWebDAV, function(add) {

  add.method('subdirectoriesIn', function (dir) {
    return dir.subdirectories();
  }, {category: ['directories']});

  add.method('filenamesIn', function (dir) {
    return dir.filenames();
  }, {category: ['directories']});

});


thisModule.addSlots(transporter.repositories.httpWithSavingScript, function(add) {

  add.method('subdirectoriesIn', function (dir) {
    return []; // aaa;
  }, {category: ['directories']});

  add.method('filenamesIn', function (dir) {
    return []; // aaa;
  }, {category: ['directories']});

});


});
