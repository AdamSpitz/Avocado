transporter.module.create('reflection/slot', function(requires) {

requires('reflection/mirror');

}, function(thisModule) {


thisModule.addSlots(lobby, function(add) {

  add.creator('slots', {}, {category: ['reflection']});

});


thisModule.addSlots(slots, function(add) {

  add.creator('abstract', {});

  add.creator('plain', Object.create(slots['abstract']));

  add.creator('parent', Object.create(slots['abstract']));

  add.creator('functionBody', Object.create(slots['abstract']));

});


thisModule.addSlots(slots['abstract'], function(add) {

  add.method('initialize', function (m) {
    this._mirror = m;
    return this;
  }, {category: ['creating']});

  add.data('_mirror', reflect({}), {category: ['accessing'], initializeTo: 'reflect({})'});

  add.method('mirror', function () { return this._mirror; }, {category: ['accessing']});

  add.method('holder', function () { return this._mirror; }, {category: ['accessing']});

  add.method('isFunctionBody', function () { return false; }, {category: ['testing']});

  add.method('isParent', function () { return false; }, {category: ['testing']});

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

});


thisModule.addSlots(slots.functionBody, function(add) {

  add.method('name', function () { return "*body*"; }, {category: ['accessing']});

  add.method('contents', function () { return this._mirror; }, {category: ['accessing']});

  add.method('isSimpleMethod', function () { return true; }, {category: ['testing']});

  add.method('isFunctionBody', function () { return true; }, {category: ['testing']});

});


thisModule.addSlots(slots.parent, function(add) {

  add.method('name', function () { return "__proto__"; }, {category: ['accessing']});

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

  add.method('toString', function () {
    if (this.name() === undefined) { return ""; }
    return this.mirror().name() + "." + this.name() + " slot";
  }, {category: ['printing']});

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
  }, {category: ['creator slots']});

});


thisModule.addSlots(slots.plain, function(add) {

  add.method('initialize', function (m, n) {
    this._mirror = m;
    this._name = n;
    return this;
  }, {category: ['creating']});

  add.data('_name', 'argleBargle', {category: ['accessing']});

  add.method('name', function () { return this._name; }, {category: ['accessing']});

  add.method('contents', function () {
    return reflect(this._mirror.primitiveContentsAt(this.name()));
  }, {category: ['accessing']});

  add.method('setContents', function (m) {
    this.markModuleAsChanged();
    return this._mirror.primitiveSetContentsAt(this.name(), m.reflectee());
  }, {category: ['accessing']});

  add.method('equals', function (s) {
    if (!s) { return false; }
    return this.name() === s.name() && this.mirror().equals(s.mirror());
  }, {category: ['comparing']});

  add.method('hashCode', function () {
    return this.name().hashCode() + this.mirror().hashCode();
  }, {category: ['comparing']});

  add.method('toString', function () {
    if (this.name() === undefined) { return ""; }
    return this.name() + " slot";
  }, {category: ['printing']});

  add.method('copyTo', function (newMir) {
    var newSlot = newMir.slotAt(this.name());
    newSlot.setContents(this.contents());
    return newSlot;
  }, {category: ['copying']});

  add.method('remove', function () {
    this.markModuleAsChanged();
    this.mirror().primitiveRemoveSlotAt(this.name());
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
    var o = holder.reflectee();
    if (  o.hasOwnProperty(newName)) { throw o + " already has a slot named " + newName; }
    if (! o.hasOwnProperty(oldName)) { throw o + " has no slot named "        + oldName; }

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
    return this.holder().hasAnnotation() && this.holder().annotation().existingSlotAnnotation(this.name());
  }, {category: ['accessing annotation']});

  add.method('annotation', function () {
    return this.holder().annotationForWriting().slotAnnotation(this.name());
  }, {category: ['accessing annotation']});

  add.method('setAnnotation', function (a) {
    return this.holder().annotationForWriting().setSlotAnnotation(this.name(), a);
  }, {category: ['accessing annotation']});

  add.method('removeAnnotation', function () {
    this.holder().annotationForWriting().removeSlotAnnotation(this.name());
  }, {category: ['accessing annotation']});

  add.method('annotationIfAny', function () {
    if (! this.holder().hasAnnotation()) { return null; }
    return this.holder().annotationForWriting().existingSlotAnnotation(this.name());
  }, {category: ['accessing annotation']});

  add.method('beCreator', function () {
    this.markModuleAsChanged();
    this.contents().setCreatorSlot(this);
  }, {category: ['creator slots']});

  add.method('module', function () {
    if (! this.hasAnnotation()) { return null; }
    return this.annotation().module;
  }, {category: ['accessing annotation', 'module']});

  add.method('setModule', function (m) {
    var a = this.annotation();
    var oldModule = a.module;
    var holder = this.holder();
    a.module = m;
    m.objectsThatMightContainSlotsInMe().push(holder.reflectee()); // aaa - there'll be a lot of duplicates; fix the performance later;
    if (oldModule) { oldModule.markAsChanged(); }
    if (m)         { m.markAsChanged(); }

    this.contents().hackToMakeSureArrayIndexablesGetFiledOut(this);
  }, {category: ['accessing annotation', 'module']});

  add.method('setModuleRecursively', function (m) {
    this.setModule(m);
    var c = this.contents();
    if (!c.reflecteeStoreString() && !c.isReflecteeSimpleMethod() && !this.initializationExpression()) { // no need if we're not going to be filing in the object slot-by-slot anyway
      if (this.equals(c.theCreatorSlot())) {
        c.setModuleRecursively(m);
      }
    }
  }, {category: ['accessing annotation', 'module']});

  add.method('initializationExpression', function () {
    if (! this.hasAnnotation()) { return ""; }
    return this.annotation().initializeTo || "";
  }, {category: ['accessing annotation', 'initialization expression']});

  add.method('setInitializationExpression', function (e) {
    this.annotation().initializeTo = e;
  }, {category: ['accessing annotation', 'initialization expression']});

  add.method('comment', function () {
    return organization.current.commentForSlot(this);
  }, {category: ['accessing annotation', 'comment']});

  add.method('setComment', function (c) {
    organization.current.setCommentForSlot(this, c);
  }, {category: ['accessing annotation', 'comment']});

  add.method('category', function () {
    return category.create(organization.current.categoryForSlot(this));
  }, {category: ['accessing annotation', 'category']});

  add.method('setCategory', function (c) {
    organization.current.setCategoryForSlot(this, c.parts());
  }, {category: ['accessing annotation', 'category']});

  add.method('copyDownParentThatIAmFrom', function () {
    var name = this.name();
    return this.holder().copyDownParents().find(function(cdp) {
      var parentMir = reflect(cdp.parent);
      if (parentMir.reflecteeHasOwnProperty(name)) {
        var slotsToOmit = cdp.slotsToOmit || [];
        if (typeof slotsToOmit === 'string') { slotsToOmit = slotsToOmit.split(' '); }
        return ! slotsToOmit.include(name);
      } else {
        return false;
      }
    }.bind(this));
  }, {category: ['testing']});

  add.method('wellKnownImplementors', function () {
    return implementorsFinder.create(this.name()).go();
  }, {category: ['searching']});

});


});
