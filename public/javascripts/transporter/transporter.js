transporter.module.create('transporter/transporter', function(requires) {

requires('core/testFramework');
requires('core/notifier');
requires('reflection/reflection');
requires('transporter/writing');
requires('transporter/ordering');
requires('transporter/loading_and_saving');

}, function(thisModule) {


thisModule.addSlots(transporter, function(add) {

  add.creator('tests', Object.create(avocado.testCase), {category: ['tests']});

  add.creator('reasonsForNeedingCreatorPath', {}, {category: ['filing out']});

  add.method('addGlobalCommandsTo', function (cmdList, evt) {
    cmdList.addLine();

    cmdList.addItem(["show modules...", [
      ["unowned attributes", function(evt) {
        avocado.ui.grab(avocado.searchResultsPresenter.create(avocado.unownedSlotFinder.create(), evt)).redo();
      }],
      
      ["changed modules", function(evt) {
        var changedOnes = transporter.module.changedOnes();
        if (changedOnes.size() > 0) {
          avocado.ui.showObjects(changedOnes, "changed modules", evt);
        } else {
         WorldMorph.current().showMessage("No changed modules to display");
        }
      }],

      ["all modules", function(evt) {
        avocado.ui.showObjects(transporter.module.allModules(), "all modules", evt);
      }]
    ]]);

    if (transporter.availableRepositories.any(function(repo) { return repo.canListDirectoryContents; })) {
      cmdList.addItem(["load JS file...", function(evt) {
        var cmdList = transporter.repositories.prompter.commandListForRepositories(function(repo) { return repo.menuItemsForLoadMenu(); });
        avocado.ui.showMenu(cmdList, evt.hand.world(), "From where?", evt);
      }]);
    }
  }, {category: ['user interface', 'commands']});

  add.method('fileOutPlural', function (specs, evt, repo, filerOuterProto) {
    return avocado.ui.showErrorsThatOccurDuring(function(failBlock) {
      specs.each(function(spec) {
        spec.moduleVersion.fileOut(spec.filerOuter || filerOuterProto ? Object.newChildOf(filerOuterProto) : null, repo, function() {}, function(msg, errors) {
          if (errors) {
            errors.forEach(function(err) {
              var mir = err.mirrorWithoutCreatorPath;
              if (mir) {
                var module = spec.moduleVersion.module();
                var reason = err.reasonForNeedingCreatorPath || "of an unknown reason";
                err.objectsToShow = err.objectsToShow || [];
                err.objectsToShow.push(module + " needs " + mir.inspect() + " to have a creator path because " + reason);
              }
            });
          }
          failBlock(msg, errors);
        });
      });
    }.bind(this));
  }, {category: ['user interface', 'commands', 'filing out']});

  add.creator('idTracker', {}, {category: ['version IDs']});

});


thisModule.addSlots(transporter.idTracker, function(add) {

  add.data('latestTemporaryIDNumber', 0, {initializeTo: '0'});

  add.data('objectsByTemporaryID', {}, {initializeTo: '{}'});

  add.method('createTemporaryIDFor', function (obj) {
    var tempID = "tempID_" + (++this.latestTemporaryIDNumber);
    this.objectsByTemporaryID[tempID] = obj;
    obj.setID(tempID);
    return tempID;
  });

  add.method('recordRealID', function (tempID, realID) {
    var obj = this.objectsByTemporaryID[tempID];
    obj.setID(realID);
    delete this.objectsByTemporaryID[tempID];
    return obj;
  });

});


thisModule.addSlots(transporter.reasonsForNeedingCreatorPath, function(add) {

  add.method('recordIfExceptionDuring', function (f, reason) {
    try {
      return f();
    } catch (ex) {
      if (ex.mirrorWithoutCreatorPath) {
        if (ex.reasonForNeedingCreatorPath) {
          if (! ex.reasonForNeedingCreatorPath.include(reason)) {
            ex.reasonForNeedingCreatorPath += ", " + reason;
          }
        } else {
          ex.reasonForNeedingCreatorPath = reason;
        }
      }
      throw ex;
    }
  });

  add.creator('abstract', {});

  add.creator('ancestorOfObjectCreatedInTheModule', Object.create(transporter.reasonsForNeedingCreatorPath['abstract']));

  add.creator('objectContainsSlotInTheModule', Object.create(transporter.reasonsForNeedingCreatorPath['abstract']));

  add.creator('referencedBySlotInTheModule', Object.create(transporter.reasonsForNeedingCreatorPath['abstract']));

});


thisModule.addSlots(transporter.reasonsForNeedingCreatorPath['abstract'], function(add) {

  add.method('create', function (param) {
    return Object.newChildOf(this, param);
  });

  add.method('initialize', function (param) {
    this._param = param;
  });

  add.method('equals', function (other) {
    // aaa hack, should really have a general equality tester that isn't part of hashTable.
    return this['__proto__'] === other['__proto__'] && avocado.hashTable.equalityComparator.keysAreEqual(this._param, other._param);
  });

});


thisModule.addSlots(transporter.reasonsForNeedingCreatorPath.ancestorOfObjectCreatedInTheModule, function(add) {

  add.method('toString', function () {
    return "it is an ancestor of " + this._param.inspect();
  });

});


thisModule.addSlots(transporter.reasonsForNeedingCreatorPath.referencedBySlotInTheModule, function(add) {

  add.method('toString', function () {
    return "it's referenced from " + this._param;
  });

});


thisModule.addSlots(transporter.reasonsForNeedingCreatorPath.objectContainsSlotInTheModule, function(add) {

  add.method('toString', function () {
    return "the module contains slots in that object: " + this._param.name();
  });

});


thisModule.addSlots(transporter.module, function(add) {

  add.method('createNewOne', function (name, repo, parentModule) {
    if (!name)         { throw new Error("Cannot create a module with no name"); }
    if (modules[name]) { throw new Error("There is already a module named " + name); }
    var module = transporter.module.named(name);
    module._repository = repo;
    if (!parentModule && avocado.project.current()) { parentModule = avocado.project.current().module(); }
    if (parentModule) { parentModule.addRequirement(name); }
    return module;
  }, {category: ['creating']});

  add.method('name', function () { return this._name; }, {category: ['accessing']});

  add.method('lastPartOfName', function () { return this.name().split('/').last(); }, {category: ['accessing']});

  add.method('toString', function () { return this.name(); }, {category: ['printing']});

  add.method('inspect', function () { return this.name(); }, {category: ['printing']});

  add.data('isAvocadoModule', true, {category: ['testing']});

  add.method('doesTypeMatch', function (obj) { return obj && obj.isAvocadoModule; }, {category: ['testing']});

  add.creator('prompter', {}, {category: ['user interface']});

  add.method('uninstall', function () {
    this.slots().each(function(s) { s.remove(); });
    reflect(modules).slotAt(this._name).remove();
    reflect(transporter.module.cache).slotAt(this._name).remove();
  }, {category: ['removing']});

  add.method('rename', function (newName) {
    if (this.existingOneNamed(newName)) { throw new Error("There is already a module named " + newName); }
    var oldName = this._name;
    reflect(modules                 ).slotAt(oldName).rename(newName);
    reflect(transporter.module.cache).slotAt(oldName).rename(newName);
    this._name = newName;
    this.markAsChanged();
    // aaa - should fix up the modules that depend on this one;
  }, {category: ['accessing']});

  add.method('eachRequiredModule', function (f) {
    this.requiredModules().each(f);
  }, {category: ['requirements']});

  add.data('_modificationFlag', null, {category: ['keeping track of changes'], initializeTo: 'null'});

  add.method('modificationFlag', function () {
    if (this._modificationFlag) { return this._modificationFlag; }
    var subflags = avocado.enumerator.create(this, 'eachRequiredModule').map(function(m) { return m.modificationFlag(); });
    this._modificationFlag = avocado.modificationFlag.create(this, subflags);
    return this._modificationFlag;
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

  add.method('canBeFiledOut', function () {
    var r = this.repository();
    return r && r.canFileOutIndividualModules();
  }, {category: ['transporting']});

  add.method('currentVersion', function () {
    if (! this._currentVersion) { this.setCurrentVersion(this.version.create(this)); }
    return this._currentVersion;
  }, {category: ['versions']});

  add.method('createNewVersion', function () {
    this.setCurrentVersion(this.version.create(this, [this.currentVersion()]));
    transporter.idTracker.createTemporaryIDFor(this._currentVersion);
    return this._currentVersion;
  }, {category: ['versions']});

  add.method('requiredModules', function () {
    return this.requirements().map(function(mName) { return modules[mName]; }).compact();
  }, {category: ['requirements']});

  add.method('createNewOneRequiredByThisOne', function (name) {
    return transporter.module.createNewOne(name, this.repository(), this);
  }, {category: ['creating']});

  add.method('repository', function () {
    return this._repository;
  }, {category: ['accessing']});

  add.method('slots', function () {
    return avocado.enumerator.create(this, 'eachSlot');
  }, {category: ['accessing']});

  add.method('eachSlotInMirror', function (mir, f) {
    // We used to keep going and treat this as an error, but it got annoying and unusable;
    // we need to be able to just unhook an object from the well-known tree and assume that
    // it won't be saved anymore. So the plan now is to just offer a warning when putting the
    // mirror morph in the trash.
    if (! mir.isWellKnown('probableCreatorSlot')) { return; }
    
    mir.normalSlots().each(function(s) {
      if (s.isIncludedInModule(this)) {
        f(s);
      }
    }.bind(this));
    
    if (mir.canHaveIndexableSlots()) {
      var cs = mir.theCreatorSlot();
      if (cs && cs.isIncludedInModule(this) && cs.contents().equals(mir)) {
        mir.eachIndexableSlot(f);
      }
    }
  }, {category: ['iterating']});

  add.method('slotsInMirror', function (mir) {
    return avocado.enumerator.create(this, 'eachSlotInMirror', mir);
  }, {category: ['accessing']});

  add.method('eachSlot', function (f) {
    this.slotCollection().eachPossibleHolderMirror(function(mir) {
      this.slotsInMirror(mir).each(f);
    }.bind(this));
  }, {category: ['iterating']});

  add.method('interactiveRename', function (evt) {
    avocado.ui.prompt("New name?", function(newName) {
      avocado.ui.showMessageIfErrorDuring(function () {
        this.rename(newName);
      }.bind(this), evt);
    }.bind(this), this.name(), evt);
  }, {category: ['user interface', 'commands']});

  add.method('showAllObjects', function (evt) {
    var objectsToShow = [this];
    this.slotCollection().eachPossibleHolderMirror(function(mir) { objectsToShow.push(mir); });
    avocado.ui.showObjects(objectsToShow, "objects in module " + this.name(), evt);
  }, {category: ['user interface', 'commands']});

  add.method('commands', function () {
    var cmdList = avocado.command.list.create(this);
    cmdList.addItem({id: 'save', label: 'save as .js file', go: this.fileOutAndReportErrors, isApplicable: this.canBeFiledOut.bind(this)});
    // aaa - not working yet: cmdList.addItem({label: 'email me the source', go: this.emailTheSource, isApplicable: this.canBeFiledOut.bind(this)});

    cmdList.addItem({label: 'print to console', go: this.printToConsole});
    cmdList.addItem({label: 'forget I was changed', go: function(evt) { this.markAsUnchanged(); }, isApplicable: function() { return this.modificationFlag().hasJustThisOneChanged(); }.bind(this)});

    cmdList.addLine();

    cmdList.addItem({label: 'rename',            go: this.interactiveRename});
    cmdList.addItem({label: 'get module object', go: function(evt) { avocado.ui.grab(reflect(this), evt); }});

    cmdList.addLine();

    cmdList.addItem({label: 'all objects', go: this.showAllObjects});
    return cmdList;
  }, {category: ['user interface', 'commands']});

  add.method('buttonCommands', function () {
    return avocado.command.list.create(this, [
      avocado.command.create('Save as .js file', this.fileOutAndReportErrors).onlyApplicableIf(this.canBeFiledOut.bind(this))
    ]);
  }, {category: ['user interface', 'commands']});

  add.method('eachModule', function (f) {
    reflect(modules).normalSlots().each(function(s) { f(s.contents().reflectee()); });
  }, {category: ['iterating']});

  add.method('allModules', function () {
    return avocado.enumerator.create(this, 'eachModule');
  }, {category: ['iterating']});

  add.method('changedOnes', function () {
    return this.allModules().select(function(m) { return m.modificationFlag().hasJustThisOneChanged(); });
  }, {category: ['keeping track of changes']});

});


thisModule.addSlots(transporter.slotCollection, function(add) {
  
  add.method('eachPossibleHolderMirror', function (f) {
    var alreadySeen = avocado.set.copyRemoveAll(); // aaa - remember that mirrors don't hash well; this'll be slow for big modules unless we fix that
    this.possibleHolders().each(function(obj) {
      var mir = reflect(obj);
      if (! alreadySeen.includes(mir)) {
        alreadySeen.add(mir);
        f(mir);
      }
    });
  }, {category: ['iterating']});
  
});


thisModule.addSlots(transporter.module.prompter, function(add) {

  add.method('prompt', function (caption, context, evt, callback) {
    this.chooseOrCreateAModule(evt, context.likelyModules(), context, caption, function(m, evt) { callback(m); });
  });

  add.method('chooseOrCreateAModule', function (evt, likelyModules, target, menuCaption, callback) {
    var modulesCmdList = this.commandListForChoosingOrCreatingAModule(evt, likelyModules, target, callback);
    avocado.ui.showMenu(modulesCmdList, target, menuCaption, evt);
  });

  add.method('commandListForChoosingOrCreatingAModule', function (evt, likelyModules, target, callback) {
    var cmdList = avocado.command.list.create();
    cmdList.addItem(["new module...", function(evt) { this.createAModule(evt, target, callback); }.bind(this)]);
    cmdList.addLine();
    if (likelyModules.length > 0 && likelyModules.length < 8) {
      likelyModules.each(function(m) {
        if (m) { cmdList.addItem([m.name(), function(evt) { callback(m, evt); }]); }
      });
      cmdList.addLine();
    }
    cmdList.addItems(avocado.dictionary.menuItemsForPathTree(this.modulePathTree(), evt, callback));
    return cmdList;
  });

  add.method('modulePathTree', function () {
    return avocado.dictionary.createPathTree(transporter.module.allModules().map(function(m) { return { object: m, path: m.name().split('/') }; }));
  }, {category: ['module tree']});

  add.method('createAModule', function (evt, target, callback) {
    avocado.repositories.prompter.prompt('Which server should the new module live on?', target, evt, function(repo, evt) {
      avocado.ui.prompt("Module name?", function(name) {
        callback(transporter.module.createNewOne(name, repo), evt);
      }, null, evt);
    });
  });

});


thisModule.addSlots(transporter.module.version, function(add) {

  add.method('create', function (module, id, parentVersions) {
    return Object.newChildOf(this, module, id, parentVersions);
  }, {category: ['creating']});

  add.method('module', function () { return this._module; }, {category: ['accessing']});

  add.method('versionID', function () { return this._id; }, {category: ['accessing']});

  add.method('setID', function (id) { this._id = id; }, {category: ['accessing']});

  add.method('parentVersions', function () { return this._parentVersions; }, {category: ['accessing']});

  add.method('requiredModuleVersions', function () {
    // aaa should probably make this refer to them directly or something
    return this.module().requiredModules().map(function(m) { return m.currentVersion(); });
  }, {category: ['accessing']});

  add.method('toString', function () { return this.module().toString() + (this._id ? " version " + this._id : ""); }, {category: ['printing']});

  add.method('fileOut', function (filerOuter, repo, successBlock, failBlock) {
    var codeToFileOut;
    filerOuter = filerOuter || Object.newChildOf(this.module().filerOuters.normal);
    try {
      codeToFileOut = this.module().codeToFileOut(filerOuter).toString();
      var errors = filerOuter.errors();
      if (errors.length > 0) {
        return failBlock(errors.length.toString() + " error" + (errors.length === 1 ? "" : "s") + " trying to file out " + this.module(), errors);
      }
    } catch (ex) {
      return failBlock(ex, [ex]);
    }
    transporter.fileOut(this, repo, codeToFileOut, function() {this.module().markAsUnchanged(); if (successBlock) { successBlock(); }}.bind(this), failBlock);
  }, {category: ['transporting']});

});


thisModule.addSlots(avocado.slots['abstract'], function(add) {

  add.method('transportableInfo', function () {
    var contents = this.contents();
    var info = {
      name: this.name(),
      creationMethod: "data",
      contentsExpr: undefined,
      rawAnnotation: this.annotationForReading && this.annotationForReading() && this.annotationForReading().asRawDataObject(),
      contentsRawAnnotation: contents.annotationForReading() && contents.annotationForReading().asRawDataObject(),
      isCreator: false,
      isReferenceToWellKnownObjectThatIsCreatedElsewhere: false,
      isHardWired: this.isHardWired()
    };
    var array = null;
    var initializer = this.initializationExpression();
    if (initializer) {
      info.contentsExpr = initializer;
    } else {
      var storeString = contents.reflecteeStoreString();
      if (storeString) {
        info.contentsExpr = storeString;
      } else if (! contents.canHaveCreatorSlot()) {
        info.contentsExpr = contents.expressionEvaluatingToMe();
      } else {
        var cs = contents.theCreatorSlot();
        if (!cs && contents.isReflecteeRemoteReference()) {
          info.isReferenceToRemoteObject = true;
          info.remoteReference = contents.reflectee();
        } else {
          if (!cs) {
            // console.log("Marking " + this.name() + " as a possible creator slot.");
            contents.addPossibleCreatorSlot(this); // aaa - not sure this is a good idea, but maybe
            cs = contents.theCreatorSlot();
            if (!cs) { throw new Error("Why is there no creator? Something is wrong."); }
            
            /* Old code, remove it if the new automatically-make-it-a-possible-creator mechanism seems to be working. -- Adam, Mar. 2011
            var err = new Error("Cannot file out a reference to an object without a creator slot: " + contents.name());
            err.mirrorWithoutCreatorPath = contents;
            err.objectsToShow = [contents];
            err.reasonForNeedingCreatorPath = "it is referenced from " + this.holder().name() + "." + this.name();
            throw err;
            */
          }
          
          if (! cs.equals(this)) {
            transporter.reasonsForNeedingCreatorPath.recordIfExceptionDuring(function() {
              var chain = contents.creatorSlotChain('probableCreatorSlot');
              info.contentsExpr = contents.expressionForCreatorSlotChain(chain);
              info.isReferenceToWellKnownObjectThatIsCreatedElsewhere = chain.reverse().map(function(s) { return s.name(); });
              if (this.isDOMChildNode()) { info.creationMethod = 'domChildNode'; } // hack to let us transport morphs
            }.bind(this), transporter.reasonsForNeedingCreatorPath.referencedBySlotInTheModule.create(this));
          } else {
            info.isCreator = true;
            
            var contentsParentSlot = contents.parentSlot();
            var contentsParent = contentsParentSlot.contents();
            if (contentsParentSlot.equals(contentsParent.theCreatorSlot())) {
              info.parentCreatorSlotChainExpression = contentsParent.creatorSlotChainExpression();
              info.parentSlotName = contentsParentSlot.name();
              info.parentHolderCreatorSlotChainExpression = contentsParentSlot.holder().creatorSlotChainExpression();
              info.parentRawAnnotation = contentsParent.annotationForReading().asRawDataObject();
            }
            
            if (contents.isReflecteeFunction()) {
              info.creationMethod = "method";
              info.contentsExpr = contents.reflecteeToString();
              //info.contentsExpr = contents.prettyPrint({indentationLevel: 2});
            } else {
              info.creationMethod = "creator";
              if (contents.isReflecteeArray()) {
                info.contentsExpr = "[]";
              } else if (contents.isReflecteeDOMNode()) {
                info.contentsExpr = contents.reflectee().storeStringWithoutChildren(); // let the children be recreated as "slots"
              } else {
                var contentsParent = contents.parent();
                if (contentsParent.equals(reflect(Object.prototype))) {
                  info.contentsExpr = "{}";
                } else {
                  transporter.reasonsForNeedingCreatorPath.recordIfExceptionDuring(function() {
                    var parentInfo = contents.parentSlot().transportableInfo();
                    info.contentsExpr = "Object.create(" + parentInfo.contentsExpr + ")";
                  }, transporter.reasonsForNeedingCreatorPath.ancestorOfObjectCreatedInTheModule.create(contents));
                }
              }
            }
          }
        }
      }
    }
    return info;
  }, {category: ['transporting']});

});


thisModule.addSlots(avocado.annotator.objectAnnotationPrototype, function(add) {

  add.method('asRawDataObject', function () {
    var objectAnnoToStringify = {};
    if (this.comment        ) { objectAnnoToStringify.comment         = this.comment;         }
    if (this.copyDownParents) { objectAnnoToStringify.copyDownParents = this.copyDownParents; }
    return objectAnnoToStringify;
  }, {category: ['transporting']});

});


thisModule.addSlots(avocado.annotator.slotAnnotationPrototype, function(add) {

  add.method('asRawDataObject', function () {
    var slotAnnoToStringify = {};
    var catParts = this.categoryParts();
    if (catParts          && catParts.length > 0) { slotAnnoToStringify.category     = catParts;                        }
    if (this.comment                            ) { slotAnnoToStringify.comment      = this.getComment();               }
    if (this.initializeTo                       ) { slotAnnoToStringify.initializeTo = this.initializationExpression(); }
    return slotAnnoToStringify;
  }, {category: ['transporting']});

});


thisModule.addSlots(transporter.tests, function(add) {

  add.creator('someObject', {});

  add.method('addSlot', function (m, holder, name, contents) {
    var s = reflect(holder).slotAt(name);
    s.setContents(reflect(contents));
    s.setModule(m);
    return s;
  });

  add.method('testCreatingAndDestroying', function () {
    var w1 = avocado.testingObjectGraphWalker.create();
    w1.go();
    
    var m = transporter.module.named('blah');

    this.addSlot(m, this.someObject, 'qwerty', 3);
    
    m.uninstall();

    var w2 = avocado.testingObjectGraphWalker.create();
    w2.go();

    this.assertEqual(w1.objectCount(), w2.objectCount(), "leftover objects after destroying a module");
    this.assertEqual(w1.  slotCount(), w2.  slotCount(), "leftover slots after destroying a module");
  });

  add.method('testModuleCache', function () {
    var m = transporter.module.named('test_blah');

    this.assertEqual(0, m.slotCollection().possibleHolders().size());

    var s1 = this.addSlot(m, this.someObject, 'qwerty', 3);
    this.assertEqual([reflect(this.someObject)], m.slotCollection().possibleHolders().map(reflect).sort());
    this.assertEqual([s1], m.slots().sort());

    var s2 = this.addSlot(m, this.someObject, 'uiop', 4);
    this.assertEqual([reflect(this.someObject)], m.slotCollection().possibleHolders().map(reflect).toSet().toArray().sort());
    this.assertEqual([s1, s2], m.slots().sort());

    var n1 = new DOMParser().parseFromString('<abc def="ghi"><xyz></xyz></abc>', 'text/xml').documentElement;
    var n2 = n1.firstChild;
    var s3 = this.addSlot(m, this.someObject, 'node1', n1);
    var s4 = this.addSlot(m, this.someObject, 'node2', n2);
    this.assertEqual([reflect(n1), reflect(n2), reflect(this.someObject)], m.slotCollection().possibleHolders().map(reflect).toSet().toArray().sort());
    this.assertEqual([s3, s4, s1, s2], m.slots().sort());

    m.uninstall();
  });

  add.method('testChangeMarking', function () {
    var m1 = transporter.module.named('test_blah1');
    var m2 = transporter.module.named('test_blah2');

    this.assert(! m1.modificationFlag().hasJustThisOneChanged());
    this.assert(! m2.modificationFlag().hasJustThisOneChanged());

    var s1 = this.addSlot(m1, this.someObject, 'qwerty', 3);
    this.assert(  m1.modificationFlag().hasJustThisOneChanged());
    this.assert(! m2.modificationFlag().hasJustThisOneChanged());
    
    m1.markAsUnchanged();
    this.assert(! m1.modificationFlag().hasJustThisOneChanged());

    var s2 = this.addSlot(m2, this.someObject, 'uiop', 4);
    this.assert(! m1.modificationFlag().hasJustThisOneChanged());
    this.assert(  m2.modificationFlag().hasJustThisOneChanged());

    m1.uninstall();
    m2.uninstall();
  });

  add.method('testRenaming', function () {
    var m = transporter.module.named('test_blah');

    var s1 = this.addSlot(m, this.someObject, 'qwerty', {}).beCreator();
    var s2 = this.addSlot(m, this.someObject.qwerty, 'uiop', 4);

    this.assertEqual("test_blah", m.name());
    this.assert(s1.isIncludedInModule(m));
    this.assert(s2.isIncludedInModule(m));
    this.assertEqual(2, m.slots().size());
    m.rename("test_argleBargle");
    this.assertEqual("test_argleBargle", m.name());
    this.assert(s1.isIncludedInModule(m));
    this.assert(s2.isIncludedInModule(m));
    this.assertEqual(2, m.slots().size());
    this.assertEqual(m, transporter.module.existingOneNamed('test_argleBargle'));
    this.assert(! transporter.module.existingOneNamed('test_blah'));

    var m2 = transporter.module.named('test_blah');
    this.assertEqual(0, m2.slots().size());
    this.assertThrowsException(function() { m.rename("test_argleBargle"); });

    m.uninstall();
    m2.uninstall();
  });

  add.method('testTransportableInfo', function () {
    var m = transporter.module.named('test_blah');

    var s1 = this.addSlot(m, this.someObject, 'qwerty', {});
    s1.beCreator();

    var sp = reflect(this.someObject.qwerty).parentSlot();
    sp.setContents(reflect({}));
    sp.beCreator();

    this.assertEqual("{}",                sp.transportableInfo().contentsExpr);
    this.assertEqual("Object.create({})", s1.transportableInfo().contentsExpr);

    // aaa - lots more stuff I could test - this is actually an awesome place to test the transporter

    m.uninstall();
  });

  add.method('testOrderingForFilingOut', function () {
    var m = transporter.module.named('test_blah');

    var s1 = this.addSlot(m, this.someObject, 'qwerty', {});
    s1.beCreator();
    var s2 = this.addSlot(m, this.someObject.qwerty, 'uiop', 3);
    this.assertEqual([s1, s2], m.slotsInOrderForFilingOut());

    var sp = reflect(this.someObject.qwerty).parentSlot();
    sp.setContents(reflect({}));
    sp.beCreator();
    this.assertEqual(sp, sp.contents().theCreatorSlot());
    m.slotsInOrderForFilingOut();

    m.uninstall();
  });

  add.method('testFilingOutArrays', function () {
    var m = transporter.module.named('test_array_fileout');

    var s1 = this.addSlot(m, this.someObject, 'anArrayToFileOut', ['a', 2, 'three']);
    s1.beCreator();
    var a = s1.contents();
    this.assert(m.slotCollection().possibleHolders().include(this.someObject), "the creator slot should be in the module");
    this.assert(m.slotCollection().possibleHolders().include(a.reflectee()), "the indexable slots should be in the module");
    var indexables = [a.slotAt('0'), a.slotAt('1'), a.slotAt('2')];
    this.assertEqual([s1].concat(indexables), m.slotsInOrderForFilingOut());
    this.assertEqual([s1], m.slotsInMirror(reflect(this.someObject)).toArray());
    this.assertEqual(indexables, m.slotsInMirror(a).toArray());

    this.assertEqual(
"start module test_array_fileout\n" +
"  start object transporter.tests.someObject\n" +
"    slot anArrayToFileOut: []\n" +
"  end object transporter.tests.someObject\n" +
"  start object transporter.tests.someObject.anArrayToFileOut\n" +
"    slot 0: 'a'\n" +
"    slot 1: 2\n" +
"    slot 2: 'three'\n" +
"  end object transporter.tests.someObject.anArrayToFileOut\n",
    m.codeOfMockFileOut());

    m.uninstall();
  });

  add.method('obsolete_testObjectsWithNoCreatorPath', function () {
    // aaa - This test is obsolete, but we should do something similar to test the trash-can warning, once we've implemented that. -- Adam, Mar. 2011
    var m = transporter.module.named('test_non_well_known_objects');

    var o = {};
    var oMir = reflect(o);
    var s1 = this.addSlot(m, o, 'x', 3);
    var s2 = this.addSlot(m, o, 'y', 'four');
    
    var fo = transporter.module.filerOuters.mock.create();
    m.codeToFileOut(fo);
    this.assertEqual(1, fo.errors().length);
    this.assertEqual(oMir, fo.errors()[0].mirrorWithoutCreatorPath);
    this.assertEqual(transporter.reasonsForNeedingCreatorPath.objectContainsSlotInTheModule.create(s1), fo.errors()[0].reasonForNeedingCreatorPath);
    
    m.uninstall();
  });

  add.method('obsolete_testObjectsThatHaveParentsWithNoCreatorPath', function () {
    // aaa - This test is obsolete too.
    
    var m = transporter.module.named('test_non_well_known_parents');

    var p = {};
    var o = Object.create(p);
    var pMir = reflect(p);
    var oMir = reflect(o);
    var s1 = this.addSlot(m, o, 'x', 3);
    var s2 = this.addSlot(m, this.someObject, 'pleh', o);
    s2.beCreator();
    
    var fo = transporter.module.filerOuters.mock.create();
    m.codeToFileOut(fo);
    this.assertEqual(1, fo.errors().length);
    this.assertEqual(pMir, fo.errors()[0].mirrorWithoutCreatorPath);
    // aaa - fix this and put it back in; it's the right idea, just gotta fix the details, don't have time right now
    // this.assertEqual(transporter.reasonsForNeedingCreatorPath.ancestorOfObjectCreatedInTheModule.create(oMir), fo.errors()[0].reasonForNeedingCreatorPath);
    
    m.uninstall();
  });

  add.method('testFilingOutToJSON', function () {
      var m = transporter.module.named('test_JSON_fileout');

      this.addSlot(m, this.someObject, 'x', 123);
      this.addSlot(m, this.someObject, 'a', ['a', 2, 'three', false]).beCreator();
      this.addSlot(m, this.someObject, 's', 'pleh');
      this.addSlot(m, this.someObject, 'b', true);
      this.addSlot(m, this.someObject, 'o', {n: 456}).beCreator();
      this.addSlot(m, this.someObject, 'r', transporter.tests);
      
      var fo = transporter.module.filerOuters.json.create();
      fo.fileOutSlots(reflect(this.someObject).normalSlots());
      this.assertEqual([], fo.errors());
      this.assertEqual('{\n  "x": 123,\n  "a": [\n    "a",\n    2,\n    "three",\n    false\n  ],\n  "s": "pleh",\n  "b": true,\n  "o": {\n    "n": 456\n  },\n  "r__creatorPath": [\n    "transporter",\n    "tests"\n  ]\n}', fo.fullText());

      m.uninstall();
    });

});


});
