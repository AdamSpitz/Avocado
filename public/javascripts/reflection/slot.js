transporter.module.create('reflection/slot', function(requires) {

requires('reflection/mirror');

}, function(thisModule) {


thisModule.addSlots(avocado, function(add) {

  add.creator('slots', {}, {category: ['reflection']});

});


thisModule.addSlots(avocado.slots, function(add) {

  add.creator('abstract', {});

  add.creator('plain', Object.create(avocado.slots['abstract']));

  add.creator('parent', Object.create(avocado.slots['abstract']));

  add.creator('functionBody', Object.create(avocado.slots['abstract']));

  add.creator('hardWiredContents', Object.create(avocado.slots['abstract']));

  add.creator('domChildNode', Object.create(avocado.slots.hardWiredContents));

});


thisModule.addSlots(avocado.slots['abstract'], function(add) {

  add.method('create', function () {
    var s = Object.create(this);
    s.initialize.apply(s, arguments);
    return s;
  });

  add.method('initialize', function (m) {
    this._mirror = m;
    return this;
  }, {category: ['creating']});

  add.data('_mirror', reflect({}), {category: ['accessing'], initializeTo: 'reflect({})'});

  add.method('mirror', function () { return this._mirror; }, {category: ['accessing']});

  add.method('holder', function () { return this._mirror; }, {category: ['accessing']});

  add.method('inspect', function () { return this.name(); }, {category: ['printing']});

  add.method('toString', function () {
    if (this.name() === undefined) { return ""; }
    return this.name();
  }, {category: ['printing']});

  add.method('sortOrder', function () { return this.name().toUpperCase(); }, {category: ['sorting']});

  add.method('isFunctionBody', function () { return false; }, {category: ['testing']});

  add.method('isHardWired', function () { return false; }, {category: ['testing']});

  add.method('isDOMChildNode', function () { return false; }, {category: ['testing']});

  add.method('isParent', function () { return false; }, {category: ['testing']});

  add.data('isAvocadoSlot', true, {category: ['testing']});

  add.method('doesTypeMatch', function (obj) { return obj && obj.isAvocadoSlot; }, {category: ['testing']});

  add.method('canBeAddedToCategory', function () { return true; }, {category: ['testing']});

  add.method('copyDownParentThatIAmFrom', function () { return null; }, {category: ['copy-down parents']});

  add.method('isFromACopyDownParent', function () { return !! this.copyDownParentThatIAmFrom(); }, {category: ['copy-down parents']});

  add.method('isArrayIndex', function () {
    if (! this.holder().isReflecteeArray()) { return false; }
    var i = parseInt(this.name(), 10);
    return ! isNaN(i);
  }, {category: ['testing']});

  add.method('markModuleAsChanged', function () {
    var module = this.module();
    if (module) { module.markAsChanged(); }
  }, {category: ['accessing annotation', 'module']});

  add.method('creatorSlotChainEndingWithMe', function (kindOfCreatorSlot) {
    var chain = this.holder().creatorSlotChain(kindOfCreatorSlot);
    if (!chain) { return null; }
    chain.unshift(this);
    return chain;
  }, {category: ['creator slots']});

  add.method('sourceCode', function () {
    try {
      var contentsMir = this.contents();
      
      // used to also say  || this.equals(contentsMir.probableCreatorSlot())  but I don't think I like it. -- Adam
      return contentsMir.expressionEvaluatingToMe(this.isSimpleMethod()); 
    } catch (ex) {
      return "cannot display contents";
    }
  }, {category: ['user interface']});

  add.method('newContentsForSourceCode', function (s) {
    //avocado.ui.showMessageIfWarningDuring(function() {
      // need the assignment and the semicolon so that JSLint doesn't gripe about seeing a naked expression
      var ok = JSLINT(avocado.stringBuffer.create('var ___contents___ = (').append(s).append(');').toString());
      if (!ok) {
        JSLINT.errors.each(function(error) {
          throw new Error("JSLint says: " + error.reason);
        });
      }
    //}.bind(this));

    var newContents = avocado.ui.showMessageIfErrorDuring(function() {
      return reflect(eval("(" + s + ")"));
    }.bind(this));
    
    return newContents;
  }, {category: ['user interface']});

  add.method('bePossibleCreatorSlotIfNoneAlreadySpecified', function () {
    var c = this.contents();
    if (!c.explicitlySpecifiedCreatorSlot() && c.canHaveCreatorSlot()) {
      c.addPossibleCreatorSlot(this);
    }
  }, {category: ['user interface', 'creator slots']});

  add.method('interactivelyBeCreator', function (evt) {
    // aaa - Maybe the justChanged stuff should be put into the regular beCreator method.
    this.beCreator();
    avocado.ui.justChanged(this.contents());
    avocado.ui.justChanged(this);
  }, {category: ['user interface', 'creator slots']});

  add.method('likelyModules', function () {
    return this.holder().likelyModules();
  }, {category: ['user interface', 'modules']});

  add.creator('filterizer', {}, {category: ['filtering']});

  add.method('commands', function () {
    var cmdList = avocado.command.list.create(this);
    
    var copyDown = this.copyDownParentThatIAmFrom();
    if (copyDown) {
      var copyDownParentMir = reflect(copyDown.parent);
      cmdList.addItem({label: "copied down from " + copyDownParentMir.name(), go: function(evt) {
        avocado.ui.grab(copyDownParentMir, evt);
      }});
    } else {
      var isModifiable = !window.isInCodeOrganizingMode;
      
      if (isModifiable && this.beCreator && this.contents().canHaveCreatorSlot()) {
        var cs = this.contents().explicitlySpecifiedCreatorSlot();
        if (!cs || ! cs.equals(this)) {
          cmdList.addItem({label: "be creator", go: function(evt) { this.interactivelyBeCreator(evt); }});
        }
      }

      if (isModifiable && this.setModule) {
        cmdList.addItem(avocado.command.create("set module", function(evt, module) {
          this.setModule(module);
        }).setArgumentSpecs([
          avocado.command.argumentSpec.create("To which module?").onlyAcceptsType(transporter.module)
        ]));
      }

      if (isModifiable && this.setModuleRecursively) {
        cmdList.addItem(avocado.command.create("set module recursively", function(evt, module) {
          this.setModuleRecursively(module);
        }).setArgumentSpecs([
          avocado.command.argumentSpec.create("To which module?").onlyAcceptsType(transporter.module)
        ]));
      }
    }

    cmdList.addLine();
    
    if (this.wellKnownImplementors) {
      cmdList.addItem({label: "implementors", go: function(evt) {
        avocado.ui.grab(avocado.searchResultsPresenter.create(avocado.implementorsFinder.create(this.name()), evt)).redo();
      }});
    }

    if (this.wellKnownSenders) {
      cmdList.addItem({label: "senders", go: function(evt) {
        avocado.ui.grab(avocado.searchResultsPresenter.create(avocado.senders.finder.create(this.name()), evt)).redo();
      }});
    }
    
    // pretty-printer isn't working yet
    if (false && isModifiable && this.contents().prettyPrint) {
      cmdList.addSection([{label: "pretty-print", go: function(evt) {
        avocado.ui.grab(reflect(this.contents().prettyPrint()), evt);
      }}]);
    }
    
    return cmdList;
  }, {category: ['user interface', 'commands']});

});


thisModule.addSlots(avocado.slots['abstract'].filterizer, function(add) {

  add.method('create', function () {
    return Object.newChildOf(this);
  }, {category: ['creating']});

  add.method('initialize', function () {
  }, {category: ['creating']});

  add.method('excludeSlotsNotInModuleNamed', function (moduleName) {
    this._moduleName = moduleName;
    return this;
  }, {category: ['filtering']});

  add.method('excludeSlotsAlreadyAssignedToAModule', function () {
    this._wantOnlyUnowned = true;
    return this;
  }, {category: ['filtering']});

  add.method('excludeCopyDowns', function () {
    this._shouldExcludeCopyDowns = true;
    return this;
  }, {category: ['filtering']});

  add.method('matchesSlot', function (slot) {
    if (this._shouldExcludeCopyDowns && slot.isFromACopyDownParent()) { return false; }
    
    var m = slot.module();
    if (this._wantOnlyUnowned) { return !m; }
    if (this._moduleName) { return m && m.name() === this._moduleName; }
    
    return true;
  }, {category: ['matching']});

});


thisModule.addSlots(avocado.slots.functionBody, function(add) {

  add.method('name', function () { return "*body*"; }, {category: ['accessing']});

  add.method('contents', function () { return this._mirror; }, {category: ['accessing']});

  add.method('isSimpleMethod', function () { return true; }, {category: ['testing']});

  add.method('isFunctionBody', function () { return true; }, {category: ['testing']});

});


thisModule.addSlots(avocado.slots.hardWiredContents, function(add) {

  add.method('initialize', function (m, n, c) {
    this._mirror = m;
    this._name = n;
    this._contents = c;
  }, {category: ['creating']});

  add.method('name', function () { return this._name; }, {category: ['accessing']});

  add.method('contents', function () { return this._contents; }, {category: ['accessing']});

  add.method('initializationExpression', function () {
    return "";
  }, {category: ['accessing annotation', 'initialization expression']});

  add.method('isHardWired', function () { return true; }, {category: ['testing']});

  add.method('equals', function (s) {
    if (!s) { return false; }
    if (typeof(s.name) !== 'function' || typeof(s.isHardWired) !== 'function') { return false; }
    return s.isHardWired() && this.name() === s.name() && this.mirror().equals(s.mirror()) && this.contents().equals(s.contents());
  }, {category: ['comparing']});

});


thisModule.addSlots(avocado.slots.domChildNode, function(add) {

  add.method('isDOMChildNode', function () { return true; }, {category: ['testing']});

});


thisModule.addSlots(avocado.slots.parent, function(add) {

  add.method('name', function () { return "__proto__"; }, {category: ['accessing']});

  add.method('sortOrder', function () { return ''; }, {category: ['sorting'], comment: 'Should come first.'});

  add.method('isParent', function () { return true; }, {category: ['testing']});

  add.method('contents', function () { return this._mirror.parent(); }, {category: ['accessing']});

  add.method('setContents', function (m) {
    this.markModuleAsChanged();
    return this._mirror.setParent(m);
  }, {category: ['accessing']});

  add.method('equals', function (s) {
    if (!s) { return false; }
    return s.isParent() && this.mirror().equals(s.mirror());
  }, {category: ['comparing']});

  add.method('hashCode', function () {
    return 'parent_' + this.mirror().hashCode();
  }, {category: ['comparing']});

  add.method('isSimpleMethod', function () { return false; }, {category: ['testing']});

  add.method('module', function () {
    var cs = this.mirror().theCreatorSlot();
    return cs ? cs.module() : null;
  }, {category: ['accessing annotation', 'module']});

  add.method('initializationExpression', function () {
    return "";
  }, {category: ['accessing annotation', 'initialization expression']});

  add.method('beCreator', function () {
    this.markModuleAsChanged();
    this.contents().setCreatorSlot(this);
    return this;
  }, {category: ['creator slots']});

});


thisModule.addSlots(avocado.slots.plain, function(add) {

  add.method('initialize', function (m, n) {
    this._mirror = m;
    this._name = n;
    return this;
  }, {category: ['creating']});

  add.data('_name', 'argleBargle', {category: ['accessing']});

  add.method('name', function () { return this._name; }, {category: ['accessing']});

  add.method('contents', function () {
    return this._mirror.contentsAt(this.name());
  }, {category: ['accessing']});

  add.method('setContents', function (m) {
    this.markModuleAsChanged();
    return this._mirror.setContentsAt(this.name(), m);
  }, {category: ['accessing']});

  add.method('equals', function (s) {
    if (!s) { return false; }
    if (typeof(s.name) !== 'function' || typeof(s.mirror) !== 'function') { return false; }
    return this.name() === s.name() && this.mirror().equals(s.mirror());
  }, {category: ['comparing']});

  add.method('hashCode', function () {
    return this.name().hashCode() + this.mirror().hashCode();
  }, {category: ['comparing']});

  add.method('copyTo', function (targetCatOfNewMir) {
    var newSlot = targetCatOfNewMir.mirror().slotAt(this.name());
    newSlot.setContents(this.contents());
    newSlot.setCategory(targetCatOfNewMir);
    return newSlot;
  }, {category: ['copying']});

  add.method('copyInto', function (targetCatOfNewMir) {
    // for compatibility with categories
    return this.copyTo(targetCatOfNewMir);
  }, {category: ['copying']});

  add.method('remove', function () {
    this.markModuleAsChanged();
    this.mirror().removeSlotAt(this.name());
    this.removeAnnotation();
  }, {category: ['removing']});

  add.method('isSimpleMethod', function () {
    return this.contents().isReflecteeSimpleMethod();
  }, {category: ['testing']});

  add.method('rename', function (newName) {
    var oldName = this.name();
    if (oldName === newName) {return;}
    var contentsMir = this.contents();
    var holder = this.holder();
    if (  holder.reflecteeHasOwnProperty(newName)) { throw holder.reflecteeToString() + " already has a slot named " + newName; }
    if (! holder.reflecteeHasOwnProperty(oldName)) { throw holder.reflecteeToString() + " has no slot named "        + oldName; }

    var isCreator = this.equals(this.contents().explicitlySpecifiedCreatorSlot());
    var holderAnno = holder.annotationForWriting();
    var slotAnno = this.annotationIfAny();

    var newSlot = holder.slotAt(newName);
    this.remove();
    newSlot.setContents(contentsMir);
    newSlot.setAnnotation(slotAnno);

    if (isCreator) {newSlot.beCreator();}

    return newSlot;
  }, {category: ['accessing']});

  add.method('hasAnnotation', function () {
    return this.holder().hasAnnotation() && this.holder().annotationForReading().existingSlotAnnotation(this.name());
  }, {category: ['accessing annotation']});

  add.method('annotationForWriting', function () {
    return this.holder().annotationForWriting().slotAnnotation(this.name());
  }, {category: ['accessing annotation']});

  add.method('setAnnotation', function (a) {
    return this.holder().annotationForWriting().setSlotAnnotation(this.name(), a);
  }, {category: ['accessing annotation']});

  add.method('removeAnnotation', function () {
    this.holder().annotationForWriting().removeSlotAnnotation(this.name());
  }, {category: ['accessing annotation']});

  add.method('annotationIfAny', function () {
    return this.annotationForReading();
  }, {category: ['accessing annotation']});

  add.method('annotationForReading', function () {
    if (! this.holder().hasAnnotation()) { return null; }
    return this.holder().annotationForWriting().existingSlotAnnotation(this.name());
  }, {category: ['accessing annotation']});

  add.method('beCreator', function () {
    this.markModuleAsChanged();
    this.contents().setCreatorSlot(this);
    return this;
  }, {category: ['creator slots']});

  add.method('module', function () {
    if (! this.hasAnnotation()) { return null; }
    return this.annotationForWriting().getModule();
  }, {category: ['accessing annotation', 'module']});

  add.method('setModule', function (m) {
    var a = this.annotationForWriting();
    var oldModule = a.getModule();
    var holder = this.holder();
    a.setModule(m);
    
    if (m)         {
      m.slotCollection().addPossibleHolder(holder.reflectee()); // aaa - there'll be a lot of duplicates; fix the performance later;
      m.markAsChanged();
    }
    
    if (oldModule) {
      oldModule.markAsChanged();
    }

    this.contents().hackToMakeSureArrayIndexablesGetFiledOut(this);
    
    avocado.ui.justChanged(this);
  }, {category: ['accessing annotation', 'module']});

  add.method('setModuleRecursively', function (m) {
    if (this.isFromACopyDownParent()) { return; }
    this.setModule(m);
    var c = this.contents();
    if (!c.reflecteeStoreString() && !c.isReflecteeSimpleMethod() && !this.initializationExpression()) { // no need if we're not going to be filing in the object slot-by-slot anyway
      if (this.equals(c.theCreatorSlot())) {
        c.setModuleRecursively(m);
      }
    }
  }, {category: ['accessing annotation', 'module']});

  add.method('moduleName', function () {
    var module = this.module();
    return module ? module.name() : "";
  }, {category: ['user interface', 'accessing annotation', 'module']});

  add.method('setModuleName', function (n) {
    var module = transporter.module.existingOneNamed(n);
    if (module) { return this.setModule(module); }
    avocado.ui.confirm("The '" + n + "' module does not exist. Create it?", function(b) {
      if (b) {
        this.setModule(transporter.module.named(n));
      }
    }.bind(this));
  }, {category: ['user interface', 'accessing annotation', 'module']});

  add.method('initializationExpression', function () {
    if (! this.hasAnnotation()) { return ""; }
    return this.annotationForReading().initializationExpression() || "";
  }, {category: ['accessing annotation', 'initialization expression']});

  add.method('setInitializationExpression', function (e) {
    this.annotationForWriting().setInitializationExpression(e);
  }, {category: ['accessing annotation', 'initialization expression']});

  add.method('comment', function () {
    return avocado.organization.current.commentForSlot(this);
  }, {category: ['accessing annotation', 'comment']});

  add.method('setComment', function (c) {
    avocado.organization.current.setCommentForSlot(this, c);
  }, {category: ['accessing annotation', 'comment']});

  add.method('category', function () {
    var cds = this.slotThatIAmCopiedDownFrom();
    if (cds) { return cds.category(); }
    
    return this.holder().category(avocado.organization.current.categoryForSlot(this));
  }, {category: ['accessing annotation', 'category']});

  add.method('setCategory', function (c) {
    avocado.organization.current.setCategoryForSlot(this, c.parts());
  }, {category: ['accessing annotation', 'category']});

  add.method('copyDownParentThatIAmFrom', function () {
    var name = this.name();
    var cdps = this.holder().copyDownParents();
    for (var i = 0, n = cdps.length; i < n; ++i) {
      var cdp = cdps[i];
      var parentMir = reflect(cdp.parent);
      if (parentMir.reflecteeHasOwnProperty(name)) {
        var slotsToOmit = cdp.slotsToOmit || [];
        if (typeof slotsToOmit === 'string') { slotsToOmit = slotsToOmit.split(' '); }
        if (! slotsToOmit.include(name)) { return cdp; }
      }
    }
  }, {category: ['copy-down parents']});

  add.method('slotThatIAmCopiedDownFrom', function () {
    var cdp = this.copyDownParentThatIAmFrom();
    if (cdp) { return reflect(cdp.parent).slotAt(this.name()); }
    return null;
  }, {category: ['copy-down parents']});

  add.method('wellKnownImplementors', function () {
    return avocado.implementorsFinder.create(this.name()).go();
  }, {category: ['searching']});

  add.method('wellKnownSenders', function () {
    return avocado.senders.finder.create(this.name()).go();
  }, {category: ['searching']});

});


});
