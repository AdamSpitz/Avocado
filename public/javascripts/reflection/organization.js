avocado.transporter.module.create('reflection/organization', function(requires) {

requires('reflection/category');
requires('core/collections/hash_table');

}, function(thisModule) {


thisModule.addSlots(avocado, function(add) {

  add.creator('abstractOrganization', {}, {category: ['reflection']});

});


thisModule.addSlots(avocado.abstractOrganization, function(add) {

  add.method('categoryForSlot', function (s) {
    return this.categoryOrNullForSlot(s) || [];
  }, {category: ['categories']});

  add.method('alphabeticallyCategorizeUncategorizedSlotsOf', function (mir) {
    var uncategorized = mir.rootCategory().subcategory("uncategorized");
    mir.normalSlots().each(function(s) {
      var c = mir.category(this.categoryForSlot(s));
      if (c.isRoot()) {
        this.setCategoryForSlot(s, uncategorized.subcategory((s.name()[0] || '_unnamed_').toUpperCase()).parts());
      }
    }.bind(this));
  }, {category: ['organizing']});

  add.method('commentForReflecteeOf', function (mir) {
    return this.commentOrNullForReflecteeOf(mir) || "";
  }, {category: ['comments']});

  add.method('commentForSlot', function (s) {
    return this.commentOrNullForSlot(s) || "";
  }, {category: ['comments']});

  add.method('findUnusedPoseName', function () {
    var i = 1;
    while (true) {
      var n = "pose " + i;
      if (! this.getPose(n)) { return n; }
      i += 1;
    }
  }, {category: ['poses']});

  add.method('promptForPoseName', function (callWhenDone) {
    avocado.ComboBoxMorph.prompt("Name this pose.", "Save pose", "Cancel", this.poses().keys().sort(), this.findUnusedPoseName(), callWhenDone);
  }, {category: ['poses']});

});


thisModule.addSlots(avocado, function(add) {

  add.creator('organization', Object.create(avocado.abstractOrganization), {category: ['reflection']});

});


thisModule.addSlots(avocado.organization, function(add) {

  add.data('current', null, {initializeTo: 'null'});

  add.method('setCurrent', function (org) {
    avocado.organization.current = org;
    org.update();
  }, {category: ['loading']});

  add.method('temporarilySetCurrent', function (org, f) {
    var previousOrg = avocado.organization.current;
    try {
      this.setCurrent(org);
      var result = f();
    } finally {
      avocado.organization.current = previousOrg;
    }
    return result;
  }, {category: ['loading']});

});


thisModule.addSlots(avocado, function(add) {

  add.creator('organizationUsingAnnotations', Object.create(avocado.abstractOrganization), {category: ['reflection']});

});


thisModule.addSlots(avocado.organizationUsingAnnotations, function(add) {

  add.method('postFileIn', function () {
    if (!avocado.organization.current) { avocado.organization.setCurrent(this); }
  }, {category: ['transporting']});

  add.method('update', function (callWhenDone) {
    // nothing to do here
    if (callWhenDone) { callWhenDone(); }
  }, {category: ['loading']});

  add.method('unlink', function () {
    // nothing to do here;
  }, {category: ['tests']});

  add.method('copyEmpty', function () {
    return this;
  }, {category: ['copying']});

  add.method('categoryOrNullForSlot', function (s) {
    if (! s.hasInheritedOrUninheritedAnnotation()) { return null; }
    return s.annotationForReading().categoryParts();
  }, {category: ['categories']});

  add.method('setCategoryForSlot', function (s, catParts) {
    s.holder().annotationForWriting().setCategoryPartsForSlotNamed(s.name(), catParts);
  }, {category: ['categories']});

  add.method('commentOrNullForReflecteeOf', function (mir) {
    var a = mir.annotationForReading();
    if (! a) { return null; }
    var c = a.getComment();
    if (c === undefined) { return null; }
    return c;
  }, {category: ['comments']});

  add.method('setCommentForReflecteeOf', function (mir, c) {
    mir.annotationForWriting().comment = c || "";
  }, {category: ['comments']});

  add.method('commentOrNullForSlot', function (s) {
    if (! s.hasInheritedOrUninheritedAnnotation()) { return null; }
    var a = s.annotationForReading();
    var c = a.getComment();
    if (c === undefined) { return null; }
    return c;
  }, {category: ['comments']});

  add.method('setCommentForSlot', function (s, c) {
    s.annotationForWriting().setComment(c);
  }, {category: ['comments']});

  add.data('_rememberedPosesByName', null, {category: ['poses'], initializeTo: 'null'});

  add.method('poses', function () {
    return this._rememberedPosesByName || (this._rememberedPosesByName = avocado.dictionary.copyRemoveAll());
  }, {category: ['poses']});

  add.method('getPose', function (poseName) {
    return this.poses().get(poseName);
  }, {category: ['poses']});

  add.method('rememberPose', function (pose) {
    this.poses().put(pose.name(), pose);
  }, {category: ['poses']});

});


thisModule.addSlots(avocado, function(add) {

  add.creator('organizationChain', Object.create(avocado.abstractOrganization), {category: ['reflection']});

});


thisModule.addSlots(avocado.organizationChain, function(add) {

  add.method('create', function (o1, o2) {
    return Object.newChildOf(this, o1, o2);
  });

  add.method('initialize', function (o1, o2) {
    this._org1 = o1;
    this._org2 = o2;
  });

  add.method('update', function (callWhenDone) {
    avocado.callbackWaiter.on(function(finalCallback) {
      this._org1.update(finalCallback());
      this._org2.update(finalCallback());
    }.bind(this), callWhenDone);
  }, {category: ['loading']});

  add.method('copyEmpty', function () {
    return avocado.organizationChain.create(this._org1.copyEmpty(), this._org2.copyEmpty());
  }, {category: ['copying']});

  add.method('unlink', function () {
    this._org1.unlink();
    this._org2.unlink();
    if (this === avocado.organization.current) { avocado.organization.current = this.copyEmpty(); }
  }, {category: ['tests']});

  add.method('categoryOrNullForSlot', function (s) {
    return this._org1.categoryOrNullForSlot(s) || this._org2.categoryOrNullForSlot(s);
  }, {category: ['categories']});

  add.method('setCategoryForSlot', function (s, catParts) {
    return this._org1.setCategoryForSlot(s, catParts);
  }, {category: ['categories']});

  add.method('commentOrNullForReflecteeOf', function (mir) {
    return this._org1.commentOrNullForReflecteeOf(mir) || this._org2.commentOrNullForReflecteeOf(mir);
  }, {category: ['comments']});

  add.method('setCommentForReflecteeOf', function (mir, c) {
    return this._org1.setCommentForReflecteeOf(mir, c);
  }, {category: ['comments']});

  add.method('commentOrNullForSlot', function (s) {
    return this._org1.commentOrNullForSlot(s) || this._org2.commentOrNullForSlot(s);
  }, {category: ['comments']});

  add.method('setCommentForSlot', function (s, c) {
    return this._org1.setCommentForSlot(s, c);
  }, {category: ['comments']});

  add.method('poses', function () {
    var poses = avocado.dictionary.copyRemoveAll();
    this._org2.poses().eachKeyAndValue(function(k, v) { poses.put(k, v); });
    this._org1.poses().eachKeyAndValue(function(k, v) { poses.put(k, v); });
    return poses;
  }, {category: ['poses']});

  add.method('getPose', function (poseName) {
    return this._org1.getPose(poseName) || this._org2.getPose(poseName);
  }, {category: ['poses']});

  add.method('rememberPose', function (pose) {
    this._org1.rememberPose(pose);
  }, {category: ['poses']});

});


});
