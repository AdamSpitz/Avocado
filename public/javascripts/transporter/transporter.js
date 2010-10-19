transporter.module.create('transporter/transporter', function(requires) {

requires('core/lk_TestFramework');
requires('reflection/reflection');

}, function(thisModule) {


thisModule.addSlots(transporter, function(add) {

  add.method('prepareToFileStuffOut', function () {
    // aaa - Not sure yet whether this is more confusing than it's worth.
    // avocado.creatorSlotMarker.annotateExternalObjects(true);
  }, {category: ['filing out']});

  add.creator('tests', Object.create(TestCase.prototype), {category: ['tests']});

  add.creator('reasonsForNeedingCreatorPath', {}, {category: ['filing out']});

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
    return "it's referenced from the " + this._param;
  });

});


thisModule.addSlots(transporter.reasonsForNeedingCreatorPath.objectContainsSlotInTheModule, function(add) {

  add.method('toString', function () {
    return "the module contains slots in that object";
  });

});


thisModule.addSlots(transporter.module, function(add) {

  add.method('name', function () { return this._name; }, {category: ['accessing']});

  add.method('lastPartOfName', function () { return this.name().split('/').last(); }, {category: ['accessing']});

  add.method('toString', function () { return this.name(); }, {category: ['printing']});

  add.method('uninstall', function () {
    this.eachSlot(function(s) { s.remove(); });
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
    // aaa - crap, should fix up the modules that depend on this one;
  }, {category: ['accessing']});

  add.method('hasChangedSinceLastFileOut', function () {
    return this._hasChangedSinceLastFileOut;
  }, {category: ['keeping track of changes']});

  add.method('markAsChanged', function () {
    this._hasChangedSinceLastFileOut = true;
  }, {category: ['keeping track of changes']});

  add.method('markAsUnchanged', function () {
    this._hasChangedSinceLastFileOut = false;
  }, {category: ['keeping track of changes']});

  add.method('canBeFiledOut', function () {
    return !!this.repository();
  }, {category: ['transporting']});

  add.method('repository', function () {
    return this._repository;
  }, {category: ['accessing']});

  add.method('slots', function () {
    return avocado.enumerator.create(this, 'eachSlot').toArray();
  }, {category: ['accessing']});

  add.method('eachSlotInMirror', function (mir, f) {
    mir.eachNormalSlot(function(s) {
      if (s.module() === this) {
        f(s);
      }
    }.bind(this));

    if (mir.isReflecteeArray()) {
      var cs = mir.theCreatorSlot();
      if (cs && cs.module() === this) {
        for (var i = 0, n = mir.reflectee().length; i < n; ++i) {
          f(mir.slotAt(i.toString()));
        }
      }
    }
  }, {category: ['iterating']});

  add.method('eachSlot', function (f) {
    var alreadySeen = avocado.set.copyRemoveAll(); // aaa - remember that mirrors don't hash well; this'll be slow for big modules unless we fix that
    this.objectsThatMightContainSlotsInMe().each(function(obj) {
      var mir = reflect(obj);
      if (! alreadySeen.includes(mir)) {
        alreadySeen.add(mir);
        this.eachSlotInMirror(mir, f);
      }
    }.bind(this));
  }, {category: ['iterating']});

  add.creator('abstractFilerOuter', {}, {category: ['transporting']});

  add.creator('filerOuter', Object.create(transporter.module.abstractFilerOuter), {category: ['transporting']});

  add.creator('annotationlessFilerOuter', Object.create(transporter.module.abstractFilerOuter), {category: ['transporting']});

  add.creator('mockFilerOuter', Object.create(transporter.module.abstractFilerOuter), {category: ['transporting']});

  add.method('codeToFileOut', function (filerOuter) {
    if (this.preFileInFunctionName) {
      filerOuter.writePreFileInFunction(this.preFileInFunctionName);
    }
    
    filerOuter.writeModule(this.name(), this._requirements, function() {
      this.slotsInOrderForFilingOut().each(function(s) {
        try {
          var h = s.holder();
          filerOuter.nextSlotIsIn(h);
          s.fileOutWith(filerOuter);
        } catch (ex) {
          filerOuter.errors().push(ex);
        }
      }.bind(this));
      filerOuter.doneWithThisObject();
    }.bind(this));

    return filerOuter.fullText();
  }, {category: ['transporting']});

  add.method('fileOutWithoutAnnotations', function (successBlock, failBlock) {
    return this.fileOut(Object.newChildOf(this.annotationlessFilerOuter), null, successBlock, failBlock);
  }, {category: ['transporting']});

  add.method('codeOfMockFileOut', function () {
    return this.codeToFileOut(Object.newChildOf(this.mockFilerOuter)).toString();
  }, {category: ['transporting']});

  add.method('fileOut', function (filerOuter, repo, successBlock, failBlock) {
    var codeToFileOut;
    filerOuter = filerOuter || Object.newChildOf(this.filerOuter);
    try {
      codeToFileOut = this.codeToFileOut(filerOuter).toString();
      var errors = filerOuter.errors();
      if (errors.length > 0) {
        return failBlock(errors.length.toString() + " error" + (errors.length === 1 ? "" : "s") + " trying to file out " + this, errors);
      }
    } catch (ex) {
      return failBlock(ex, [ex]);
    }
    transporter.fileOut(this, repo, codeToFileOut, function() {this.markAsUnchanged(); if (successBlock) { successBlock(); }}.bind(this), failBlock);
  }, {category: ['transporting']});

  add.creator('slotOrderizer', {}, {category: ['transporting']});

  add.method('slotsInOrderForFilingOut', function (f) {
    return Object.newChildOf(this.slotOrderizer, this).determineOrder();
  }, {category: ['transporting']});

  add.method('eachModule', function (f) {
    reflect(lobby.modules).eachNormalSlot(function(s) { f(s.contents().reflectee()); });
  }, {category: ['iterating']});

  add.method('changedOnes', function () {
    return Object.newChildOf(avocado.enumerator, this, 'eachModule').select(function(m) { return m.hasChangedSinceLastFileOut(); });
  }, {category: ['keeping track of changes']});

});


thisModule.addSlots(slots['abstract'], function(add) {

  add.method('fileOutInfo', function () {
    var creationMethod = "data";
    var contentsExpr;
    var contents = this.contents();
    var array = null;
    var isCreator = false;
    var initializer = this.initializationExpression();
    if (initializer) {
      contentsExpr = initializer;
    } else {
      var storeString = contents.reflecteeStoreString();
      if (storeString) {
        contentsExpr = storeString;
      } else if (! contents.canHaveCreatorSlot()) {
        contentsExpr = contents.expressionEvaluatingToMe();
      } else {
        var cs = contents.theCreatorSlot();
        if (!cs) {
          var err = new Error("Cannot file out a reference to an object without a creator slot: " + contents.name());
          err.mirrorWithoutCreatorPath = contents;
          throw err;
        } else if (! cs.equals(this)) {
          // This is just a reference to some well-known object that's created elsewhere.
          transporter.reasonsForNeedingCreatorPath.recordIfExceptionDuring(function() {
            contentsExpr = contents.creatorSlotChainExpression();
          }, transporter.reasonsForNeedingCreatorPath.referencedBySlotInTheModule.create(this));
        } else {
          isCreator = true;
          if (contents.isReflecteeFunction()) {
            creationMethod = "method";
            contentsExpr = contents.reflectee().toString();
            //contentsExpr = contents.prettyPrint({indentationLevel: 2});
          } else {
            creationMethod = "creator";
            if (contents.isReflecteeArray()) {
              contentsExpr = "[]";
            } else {
              var contentsParent = contents.parent();
              if (contentsParent.equals(reflect(Object.prototype))) {
                contentsExpr = "{}";
              } else {
                transporter.reasonsForNeedingCreatorPath.recordIfExceptionDuring(function() {
                  var parentInfo = contents.parentSlot().fileOutInfo();
                  contentsExpr = "Object.create(" + parentInfo.contentsExpr + ")";
                }, transporter.reasonsForNeedingCreatorPath.ancestorOfObjectCreatedInTheModule.create(contents));
              }
            }
          }
        }
      }
    }
    return {creationMethod: creationMethod, contentsExpr: contentsExpr, isCreator: isCreator};
  }, {category: ['transporting']});

  add.method('fileOutWith', function (filerOuter) {
    var info = this.fileOutInfo();
      
    var contents = this.contents();

    var slotAnnoToStringify = {};
    var slotAnno = this.annotation();
    if (slotAnno.comment                                      ) { slotAnnoToStringify.comment      = slotAnno.comment;      }
    if (slotAnno.category      && slotAnno.category.length > 0) { slotAnnoToStringify.category     = slotAnno.category;     }
    if (slotAnno.initializeTo                                 ) { slotAnnoToStringify.initializeTo = slotAnno.initializeTo; }
    var slotAnnoExpr = reflect(slotAnnoToStringify).expressionEvaluatingToMe();

    var objectAnnoExpr;
    if (info.isCreator) {
      var objectAnnoToStringify = {};
      var objectAnno = contents.annotation();
      if (objectAnno) {
        if (objectAnno.comment        ) {objectAnnoToStringify.comment         = objectAnno.comment;        }
        if (objectAnno.copyDownParents) {objectAnnoToStringify.copyDownParents = objectAnno.copyDownParents;}
        objectAnnoExpr = reflect(objectAnnoToStringify).expressionEvaluatingToMe();
      }
    }
    
    // The fileout looks a bit prettier if we don't bother showing ", {}, {}" all over the place.
    var optionalArgs = "";
    if (objectAnnoExpr && objectAnnoExpr !== '{}') {
      optionalArgs = ", " + objectAnnoExpr + optionalArgs;
    }
    if (optionalArgs !== '' || (slotAnnoExpr && slotAnnoExpr !== '{}')) {
      optionalArgs = ", " + slotAnnoExpr + optionalArgs;
    }

    filerOuter.writeSlot(info.creationMethod, this.name(), info.contentsExpr, optionalArgs);

    // aaa - Stupid hack because some browsers won't let you set __proto__ so we have to treat it specially.
    if (info.isCreator) {
      var contentsParentSlot = contents.parentSlot();
      if (contentsParentSlot.equals(contentsParentSlot.contents().theCreatorSlot())) {
        filerOuter.writeStupidParentSlotCreatorHack(contentsParentSlot);
      }
    }
  }, {category: ['transporting']});

});


thisModule.addSlots(transporter.module.abstractFilerOuter, function(add) {

  add.method('initialize', function () {
    this._buffer = avocado.stringBuffer.create();
    this._currentHolder = null;
    this._currentHolderExpr = null;
    this._errors = [];
  }, {category: ['creating']});

  add.method('fullText', function () {
    return this._buffer.toString();
  }, {category: ['accessing']});

  add.method('nextSlotIsIn', function (holder) {
    if (!this._currentHolder || ! holder.equals(this._currentHolder)) {
      this.doneWithThisObject();
      transporter.reasonsForNeedingCreatorPath.recordIfExceptionDuring(function() {
        this._currentHolder = holder;
        this._currentHolderExpr = holder.creatorSlotChainExpression();
      }.bind(this), transporter.reasonsForNeedingCreatorPath.objectContainsSlotInTheModule.create());
      this.writeObjectStarter();
    }
  }, {category: ['writing']});

  add.method('doneWithThisObject', function () {
    if (this._currentHolder) {
      this.writeObjectEnder();
      this._currentHolder = null;
      this._currentHolderExpr = null;
    }
  }, {category: ['writing']});

  add.method('errors', function () {
    return this._errors;
  }, {category: ['error handling']});

  add.method('writePreFileInFunction', function (fnName) {
    // This is basically just a hack to let us file out the bootstrap module.
    var f = window[fnName];
    this._buffer.append("window.").append(fnName).append(" = ").append(f.toString()).append(";\n");
    this._buffer.append(fnName).append("();\n\n\n\n");
  }, {category: ['writing']});

});


thisModule.addSlots(transporter.module.filerOuter, function(add) {

  add.method('writeModule', function (name, reqs, bodyBlock) {
    //this._buffer.append("//@ sourceURL=").append(name).append(".js    so that the debugger shows the right file name when we load it using eval\n\n");
    this._buffer.append("transporter.module.create(").append(name.inspect()).append(", function(requires) {");
    
    if (reqs && reqs.length > 0) {
      this._buffer.append("\n\n");
      reqs.each(function(req) {
        this._buffer.append("requires(").append(req.inspect()).append(");\n");
      }.bind(this));
      this._buffer.append("\n");
    }

    this._buffer.append("}, function(thisModule) {\n\n\n");

    bodyBlock();

    this._buffer.append("});\n");
  }, {category: ['writing']});

  add.method('writeObjectStarter', function () {
    this._buffer.append("thisModule.addSlots(").append(this._currentHolderExpr).append(", function(add) {\n\n");
  }, {category: ['writing']});

  add.method('writeObjectEnder', function () {
    this._buffer.append("});\n\n\n");
  }, {category: ['writing']});

  add.method('writeSlot', function (creationMethod, slotName, contentsExpr, optionalArgs) {
    this._buffer.append("  add.").append(creationMethod).append("('").append(slotName).append("', ").append(contentsExpr);
    this._buffer.append(optionalArgs);
    this._buffer.append(");\n\n");
  }, {category: ['writing']});

  add.method('writeStupidParentSlotCreatorHack', function (parentSlot) {
    this._buffer.append("  annotator.annotationOf(");
    this._buffer.append(parentSlot.contents().creatorSlotChainExpression());
    this._buffer.append(").setCreatorSlot(").append(parentSlot.name().inspect());
    this._buffer.append(", ").append(parentSlot.holder().creatorSlotChainExpression());
    this._buffer.append(");\n\n");
  }, {category: ['writing']});

});


thisModule.addSlots(transporter.module.annotationlessFilerOuter, function(add) {

  add.method('writeModule', function (name, reqs, bodyBlock) {
    this._buffer.append("if (typeof(window.modules) === 'object') { modules[").append(name.inspect()).append("] = {}; }\n\n");
    bodyBlock();
  }, {category: ['writing']});

  add.method('writeObjectStarter', function () {
    // I don't like having to depend on an 'extend' method. Either we
    // define 'extend' as a local function at the start of the file, or
    // we just keep writing out the name of the object over and over.
    // Let's try the latter for now; it actually kinda looks cleaner. -- Adam
    // this._buffer.append("Object.extend(").append(this._currentHolderExpr).append(", {\n\n");
  }, {category: ['writing']});

  add.method('writeObjectEnder', function () {
    // this._buffer.append("});\n\n\n");
    this._buffer.append("\n\n");
  }, {category: ['writing']});

  add.method('writeSlot', function (creationMethod, slotName, contentsExpr, optionalArgs) {
    // this._buffer.append("  ").append(slotName).append(": ").append(contentsExpr).append(",\n\n");
    this._buffer.append(this._currentHolder.creatorSlotChainExpression()).append(".").append(slotName).append(" = ").append(contentsExpr).append(";\n\n");
  }, {category: ['writing']});

  add.method('writeStupidParentSlotCreatorHack', function (parentSlot) {
    // nothing to do here, I think;
  }, {category: ['writing']});

});


thisModule.addSlots(transporter.module.mockFilerOuter, function(add) {

  add.method('writeModule', function (name, reqs, bodyBlock) {
    this._buffer.append("start module ").append(name).append("\n");
    bodyBlock();
  }, {category: ['writing']});

  add.method('writeObjectStarter', function () {
    this._buffer.append("  start object ").append(this._currentHolderExpr).append("\n");
  }, {category: ['writing']});

  add.method('writeObjectEnder', function () {
    this._buffer.append("  end object ").append(this._currentHolderExpr).append("\n");
  }, {category: ['writing']});

  add.method('writeSlot', function (creationMethod, slotName, contentsExpr, optionalArgs) {
    this._buffer.append("    slot ").append(slotName).append(": ").append(contentsExpr).append("\n");
  }, {category: ['writing']});

  add.method('writeStupidParentSlotCreatorHack', function (parentSlot) {
    this._buffer.append("    parent slot ").append(parentSlot.contents().creatorSlotChainExpression()).append("\n");
  }, {category: ['writing']});

});


thisModule.addSlots(transporter.module.slotOrderizer, function(add) {

  add.method('initialize', function (m) {
    this._module = m;
    this._slotsInOrder = [];

    this.calculateSlotDependencies();

    this._cycleBreakersMir = reflect({});
    this._cycleBreakersByOriginalSlot = avocado.dictionary.copyRemoveAll();

    this._remainingSlotsByMirror = avocado.dictionary.copyRemoveAll();
    this._module.objectsThatMightContainSlotsInMe().each(function(obj) {
      var mir = reflect(obj);
      var slots = avocado.set.copyRemoveAll();
      this._module.eachSlotInMirror(mir, function(s) {
        slots.add(s);
        if (s.equals(s.contents().theCreatorSlot())) { slots.add(s.contents().parentSlot()); }
      }.bind(this));
      if (! slots.isEmpty()) {
        this._remainingSlotsByMirror.put(mir, slots);
      }
    }.bind(this));

    this.recalculateObjectDependencies();
  }, {category: ['creating']});

  add.method('addSlotDependenciesFor', function (s) {
      var contents = s.contents();
      if (s.equals(contents.theCreatorSlot())) {
        var parentSlot = contents.parentSlot();
        this.addSlotDependenciesFor(parentSlot);
        var parentCreatorSlot = parentSlot.contents().theCreatorSlot();
        if (parentCreatorSlot && parentCreatorSlot.module() === this) {
          this._slotDeps.contentDeps.addDependency(s, parentSlot);
        }
        
        var cdps = contents.copyDownParents();
        cdps.each(function(cdp) {
          var copyDownParent = reflect(cdp.parent);
          var slotsToOmit = annotator.adjustSlotsToOmit(cdp.slotsToOmit);
          var copyDownParentCreatorSlot = copyDownParent.theCreatorSlot();
          if (copyDownParentCreatorSlot && copyDownParentCreatorSlot.module() === this._module) {
            this._slotDeps.contentDeps.addDependency(s, copyDownParentCreatorSlot);
          }

          // aaa - For now, make every slot in the copy-down parent exist before the child,
          // because we don't yet have a mechanism to update the copy-down children on
          // the fly as the copy-down parent changes.
          this._module.eachSlotInMirror(copyDownParent, function(slotInCopyDownParent) {
            if (! slotsToOmit.include(slotInCopyDownParent.name())) {
              this._slotDeps.contentDeps.addDependency(s, slotInCopyDownParent);
            }
          }.bind(this));

        }.bind(this));
              
        this._module.eachSlotInMirror(contents, function(slotInContents) {
          this._slotDeps.holderDeps.addDependency(slotInContents, s);
        }.bind(this));
      } else if (! s.initializationExpression()) {
        var contentsCreatorSlot = contents.canHaveCreatorSlot() && contents.theCreatorSlot();
        if (contentsCreatorSlot && contentsCreatorSlot.module() === this._module) {
          this._slotDeps.contentDeps.addDependency(s, contentsCreatorSlot);
        }
      }
  }, {category: ['dependencies']});

  add.method('calculateSlotDependencies', function () {
    this._slotDeps = {  holderDeps: avocado.dependencies.copyRemoveAll(),
                       contentDeps: avocado.dependencies.copyRemoveAll() };
    
    this._module.eachSlot(function(s) { this.addSlotDependenciesFor(s); }.bind(this));
  }, {comment: 'If Javascript could do "become", this would be unnecessary, since we could just put in a placeholder and then swap it for the real object later.', category: ['dependencies']});

  add.method('recalculateObjectDependencies', function () {
    this._objDeps = avocado.dependencies.copyRemoveAll();

    this._slotDeps.holderDeps.eachDependency(function(depender, dependee) {
      this._objDeps.addDependency(depender.holder(), dependee.holder());
    }.bind(this));

    this._slotDeps.contentDeps.eachDependency(function(depender, dependee) {
      this._objDeps.addDependency(depender.holder(), dependee.holder());
    }.bind(this));
  }, {category: ['dependencies']});

  add.method('chooseAMirrorWithNoDependees', function () {
    return exitValueOf(function(exit) {
      this._remainingSlotsByMirror.eachKeyAndValue(function(mir, slots) {
        if (slots.size() === 0) { throw "oops, we were supposed to remove the mirror from the dictionary if it had no slots left"; }
        if (this._objDeps.dependeesOf(mir).size() === 0) { exit(mir); }
      }.bind(this));
      return null;
    }.bind(this));
  }, {category: ['dependencies']});

  add.method('chooseASlotWithThisManyDependees', function (n, slotsToChooseFrom) {
    if (slotsToChooseFrom) {
      return slotsToChooseFrom.find(function(s) {
        return this._slotDeps.holderDeps.dependeesOf(s).size() === 0 && this._slotDeps.contentDeps.dependeesOf(s).size() === 0;
      }.bind(this));
    } else {
      // choose any remaining slot
      return exitValueOf(function(exit) {
        this._remainingSlotsByMirror.eachKeyAndValue(function(mir, slots) {
          var s = this.chooseASlotWithThisManyDependees(n, slots);
          if (s) { exit(s); }
        }.bind(this));
        return null;
      }.bind(this));
    }
  }, {category: ['dependencies']});

  add.method('chooseSlotToTryToBreakCycle', function () {
    return exitValueOf(function(exit) {
      this._remainingSlotsByMirror.eachKeyAndValue(function(mir, slots) {
        var s = slots.find(function(s) {
          var dependees = this._slotDeps.contentDeps.dependeesOf(s);
          console.log(s + " depends on " + dependees);
          return dependees.size() === 0;
        }.bind(this));
        if (s) { exit(s); }
      }.bind(this));
    }.bind(this));
  }, {category: ['dependencies']});

  add.method('rememberCycleBreakerSlot', function (cycleBreakerSlot, originalSlot) {
    console.log("Created cycle-breaker slot for " + originalSlot + ": " + cycleBreakerSlot);
    this._remainingSlotsByMirror.getOrIfAbsentPut(this._cycleBreakersMir, function() {return avocado.set.copyRemoveAll();}).add(cycleBreakerSlot);
    this._cycleBreakersByOriginalSlot.getOrIfAbsentPut(originalSlot, function() {return [];}).push(cycleBreakerSlot);
  }, {category: ['dependencies']});

  add.method('insertCycleBreakerSlot', function () {
    throw "there is a cycle in the slot dependency graph; breaking the cycle is not implemented yet";
    // aaa - This code hasn't been properly tested; I don't trust it yet.
    var slot = this.chooseSlotToTryToBreakCycle();
    dbgOn(!slot);
    if (!slot) { throw new Error("Could not find a slot to use as a cycle-breaker."); }
    var cycleBreakerSlot = slot.copyTo(this._cycleBreakersMir).rename(this._cycleBreakersMir.findUnusedSlotName('breaker'));
    var initExpr = slot.initializationExpression();
    if (initExpr) { cycleBreakerSlot.setInitializationExpression(initExpr); }
    this._slotDeps. holderDeps.removeDependency(slot, slot.holder().theCreatorSlot());
    this._slotDeps.contentDeps.   addDependency(slot, cycleBreakerSlot);
    this._slotDeps.contentDeps.dependersOf(slot).each(function(depender) {
      this._slotDeps.contentDeps.removeDependency(depender, slot);
      this._slotDeps.contentDeps.   addDependency(depender, cycleBreakerSlot);
      console.log(depender + " no longer depends on " + slot + ", but on " + cycleBreakerSlot + " instead");
    }.bind(this));
    this.rememberCycleBreakerSlot(cycleBreakerSlot, slot);
  }, {category: ['dependencies']});

  add.method('determineOrder', function () {
    while (! this._remainingSlotsByMirror.isEmpty()) {
      var nextMirrorToFileOut = this.chooseAMirrorWithNoDependees();
      if (nextMirrorToFileOut) {
        this.nextObjectIs(nextMirrorToFileOut);
      } else {
        var nextSlotToFileOut = this.chooseASlotWithThisManyDependees(0);
        if (nextSlotToFileOut) {
          this.nextSlotIs(nextSlotToFileOut, true);
        } else {
          this.insertCycleBreakerSlot();
        }
      }
    }
    return this._slotsInOrder;
  }, {category: ['transporting']});

  add.method('nextObjectIs', function (nextMirrorToFileOut) {
    var slots = this._remainingSlotsByMirror.get(nextMirrorToFileOut);
    while (! slots.isEmpty()) {
      var nextSlotToFileOut = this.chooseASlotWithThisManyDependees(0, slots);
      if (nextSlotToFileOut) {
        this.nextSlotIs(nextSlotToFileOut, false);
      } else {
        throw "there is a cycle in the slot dependency graph within an object; breaking the cycle is not implemented yet";
      }
    }
    this._objDeps.removeDependee(nextMirrorToFileOut);
  }, {category: ['transporting']});

  add.method('nextSlotIs', function (s, shouldUpdateObjDeps) {
    //console.log("Next slot is " + s);
    if (s.isParent()) {
      // __proto__ slots need to be in there to make the dependency graph come out right, but shouldn't
      // actually be included in the final ordering; an object's __proto__ is actually done with the
      // object's creator slot. (Don't blame me, blame the browsers that don't allow __proto__ to be
      // set directly.)
    } else {
      this._slotsInOrder.push(s);
    }
    var holder = s.isParent() ? s.holder().theCreatorSlot().holder() : s.holder(); // aaa aaaaaaaaaa
    var slots = this._remainingSlotsByMirror.get(holder);
    slots.remove(s);
    if (slots.isEmpty()) { this._remainingSlotsByMirror.removeKey(holder); }
    this._slotDeps. holderDeps.removeDependee(s);
    this._slotDeps.contentDeps.removeDependee(s);
    if (shouldUpdateObjDeps) { this.recalculateObjectDependencies(); }
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

    this.assertEqual(0, m.objectsThatMightContainSlotsInMe().size());

    var s1 = this.addSlot(m, this.someObject, 'qwerty', 3);
    this.assertEqual([reflect(this.someObject)], m.objectsThatMightContainSlotsInMe().map(function(o) { return reflect(o); }).sort());
    this.assertEqual([s1], avocado.enumerator.create(m, 'eachSlot').toArray().sort());

    var s2 = this.addSlot(m, this.someObject, 'uiop', 4);
    this.assertEqual([reflect(this.someObject)], m.objectsThatMightContainSlotsInMe().map(function(o) { return reflect(o); }).toSet().toArray().sort());
    this.assertEqual([s1, s2], avocado.enumerator.create(m, 'eachSlot').toArray().sort());

    m.uninstall();
  });

  add.method('testChangeMarking', function () {
    var m1 = transporter.module.named('test_blah1');
    var m2 = transporter.module.named('test_blah2');

    this.assert(! m1.hasChangedSinceLastFileOut());
    this.assert(! m2.hasChangedSinceLastFileOut());

    var s1 = this.addSlot(m1, this.someObject, 'qwerty', 3);
    this.assert(  m1.hasChangedSinceLastFileOut());
    this.assert(! m2.hasChangedSinceLastFileOut());
    
    m1.markAsUnchanged();
    this.assert(! m1.hasChangedSinceLastFileOut());

    var s2 = this.addSlot(m2, this.someObject, 'uiop', 4);
    this.assert(! m1.hasChangedSinceLastFileOut());
    this.assert(  m2.hasChangedSinceLastFileOut());

    m1.uninstall();
    m2.uninstall();
  });

  add.method('testRenaming', function () {
    var m = transporter.module.named('test_blah');

    var s1 = this.addSlot(m, this.someObject, 'qwerty', {});
    var s2 = this.addSlot(m, this.someObject.qwerty, 'uiop',   4 );

    this.assertEqual("test_blah", m.name());
    this.assertEqual(m, s1.module());
    this.assertEqual(m, s2.module());
    this.assertEqual(2, m.slots().size());
    m.rename("test_argleBargle");
    this.assertEqual("test_argleBargle", m.name());
    this.assertEqual(m, s1.module());
    this.assertEqual(m, s2.module());
    this.assertEqual(2, m.slots().size());
    this.assertEqual(m, transporter.module.existingOneNamed('test_argleBargle'));
    this.assert(! transporter.module.existingOneNamed('test_blah'));

    var m2 = transporter.module.named('test_blah');
    this.assertEqual(0, m2.slots().size());
    this.assertThrowsException(function() { m.rename("test_argleBargle"); });

    m.uninstall();
    m2.uninstall();
  });

  add.method('testFileOutInfo', function () {
    var m = transporter.module.named('test_blah');

    var s1 = this.addSlot(m, this.someObject, 'qwerty', {});
    s1.beCreator();

    var sp = reflect(this.someObject.qwerty).parentSlot();
    sp.setContents(reflect({}));
    sp.beCreator();

    this.assertEqual("{}",                sp.fileOutInfo().contentsExpr);
    this.assertEqual("Object.create({})", s1.fileOutInfo().contentsExpr);

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
    this.assert(m.objectsThatMightContainSlotsInMe().include(this.someObject), "the creator slot should be in the module");
    this.assert(m.objectsThatMightContainSlotsInMe().include(a.reflectee()), "the indexable slots should be in the module");
    var indexables = [a.slotAt('0'), a.slotAt('1'), a.slotAt('2')];
    this.assertEqual([s1].concat(indexables), m.slotsInOrderForFilingOut());
    this.assertEqual([s1], avocado.enumerator.create(m, 'eachSlotInMirror', reflect(this.someObject)).toArray());
    this.assertEqual(indexables, avocado.enumerator.create(m, 'eachSlotInMirror', a).toArray());

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

  add.method('testObjectsWithNoCreatorPath', function () {
    var m = transporter.module.named('test_non_well_known_objects');

    var o = {};
    var oMir = reflect(o);
    var s1 = this.addSlot(m, o, 'x', 3);
    var s2 = this.addSlot(m, o, 'y', 'four');
    
    var fo = Object.newChildOf(transporter.module.mockFilerOuter);
    m.codeToFileOut(fo);
    this.assertEqual(1, fo.errors().length);
    this.assertEqual(oMir, fo.errors()[0].mirrorWithoutCreatorPath);
    this.assertEqual(transporter.reasonsForNeedingCreatorPath.objectContainsSlotInTheModule.create(), fo.errors()[0].reasonForNeedingCreatorPath);
    
    m.uninstall();
  });

  add.method('testObjectsThatHaveParentsWithNoCreatorPath', function () {
    var m = transporter.module.named('test_non_well_known_parents');

    var p = {};
    var o = Object.create(p);
    var pMir = reflect(p);
    var oMir = reflect(o);
    var s1 = this.addSlot(m, o, 'x', 3);
    var s2 = this.addSlot(m, this.someObject, 'pleh', o);
    s2.beCreator();
    
    var fo = Object.newChildOf(transporter.module.mockFilerOuter);
    m.codeToFileOut(fo);
    this.assertEqual(1, fo.errors().length);
    this.assertEqual(pMir, fo.errors()[0].mirrorWithoutCreatorPath);
    this.assertEqual(transporter.reasonsForNeedingCreatorPath.ancestorOfObjectCreatedInTheModule.create(oMir), fo.errors()[0].reasonForNeedingCreatorPath);
    
    m.uninstall();
  });

});


});
