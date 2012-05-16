avocado.transporter.module.create('lk_ext/tags', function(requires) {

}, function(thisModule) {


thisModule.addSlots(avocado, function(add) {

  add.creator('tag', {}, {category: ['user interface']});

});


thisModule.addSlots(avocado.tag, function(add) {

  add.method('create', function () {
    var a = Object.create(this);
    a.initialize.apply(a, arguments);
    return a;
  }, {category: ['creating']});

  add.method('initialize', function (name, criterion) {
    this._name = name;
    this._criterion = criterion;
  }, {category: ['creating']});

  add.method('toString', function () {
    return this._name || "";
  }, {category: ['printing']});

  add.method('matches', function (o) {
    return this._criterion(o);
  }, {category: ['matching']});

  add.method('matchesMorph', function (m) {
    var model = m._model;
    if (typeof(model) === 'undefined') { return false; }
    return this.matches(model);
  }, {category: ['matching']});

  add.creator('cloud', {});

  add.method('Morph', function Morph() { Class.initializer.apply(this, arguments); }, {category: ['ui']});

});


thisModule.addSlots(avocado.tag.cloud, function(add) {

  add.method('create', function () {
    var a = Object.create(this);
    a.initialize.apply(a, arguments);
    return a;
  }, {category: ['creating']});

  add.method('initialize', function (name, tagTypes, allPossibleObjects) {
    this._name = name;
    this._allElements = tagTypes.map(function(tagType) { return avocado.tag.cloud.element.create(this, tagType); }.bind(this));
    this._allPossibleObjects = allPossibleObjects;
  }, {category: ['creating']});

  add.method('name', function () {
    return this._name;
  }, {category: ['accessing']});

  add.method('allElements', function () {
    return this._allElements;
  }, {category: ['accessing']});

  add.method('allTagTypes', function () {
    return this.allElements().map(function(e) { return e.tagType(); });
  }, {category: ['accessing']});

  add.method('toString', function () {
    return this._name || "";
  }, {category: ['printing']});

  add.method('immediateContents', function () {
    return this.allElements();
  });

  add.method('allPossibleObjects', function () {
    if (this._allPossibleObjects) { return this._allPossibleObjects; }
    var objs = [];
    // aaa - I don't think this object should know about morphs.
    WorldMorph.current().eachSubmorph(function(morph) {
      var model = morph._model;
      if (typeof(model) !== 'undefined') { objs.push(model); }
    });
    return objs;
  });

  add.creator('element', {});

  add.creator('defaultMorphStyle', {}, {category: ['user interface']});

  add.method('newMorph', function () {
    var m = avocado.treeNode.newMorphFor(this, this.defaultMorphStyle);
    m.typeName = 'tag cloud';
    return m;
  }, {category: ['user interface']});

  add.method('tagAllMorphsInWorld', function (w) {
    w = w || WorldMorph.current();
    this.allElements().forEach(function(e) {
      w.tagSubmorphsWithNewTag(e.tagType(), e.fill());
    });
  }, {category: ['user interface']});

});


thisModule.addSlots(avocado.tag.cloud.element, function(add) {

  add.method('create', function () {
    var a = Object.create(this);
    a.initialize.apply(a, arguments);
    return a;
  }, {category: ['creating']});

  add.method('initialize', function (cloud, tagType) {
    this._cloud = cloud;
    this._tagType = tagType;
    this._fill = Color.random();
  }, {category: ['creating']});

  add.method('cloud', function () {
    return this._cloud;
  }, {category: ['accessing']});

  add.method('fill', function () {
    return this._fill;
  }, {category: ['accessing']});

  add.method('tagType', function () {
    return this._tagType;
  }, {category: ['accessing']});

  add.method('toString', function () {
    return this.tagType().toString();
  }, {category: ['printing']});

  add.method('immediateContents', function () {
    return this.cloud().allPossibleObjects().select(function(o) { return this._tagType.matches(o); }.bind(this));
  });

  add.creator('defaultMorphStyle', {}, {category: ['user interface']});

  add.method('newMorph', function () {
    var m = avocado.treeNode.newMorphFor(this, {fill: this._fill});
    m.typeName = 'tag cloud element';
    return m;
  }, {category: ['user interface']});

});


thisModule.addSlots(avocado.tag.cloud.defaultMorphStyle, function(add) {

  add.data('fillBase', new Color(0.1, 0.5, 0.6));

});


thisModule.addSlots(avocado.tag.Morph, function(add) {

  add.data('displayName', 'Morph');

  add.data('superclass', Morph);

  add.data('type', 'avocado.tag.Morph');

  add.creator('prototype', Object.create(Morph.prototype));

});


thisModule.addSlots(avocado.tag.Morph.prototype, function(add) {

  add.data('constructor', avocado.tag.Morph);

  add.method('initialize', function ($super, tag, fill) {
    $super(new lively.scene.Ellipse(pt(0,0), 10));
    this._model = tag;
    this.setFill(fill);
    this.setFillOpacity(0.4);
  }, {category: ['creating']});

  add.data('shouldNotBePartOfRowOrColumn', true);

  add.data('suppressHandles', true);

});


thisModule.addSlots(Morph.prototype, function(add) {

  add.method('allLikeMe', function () {
    // aaa - Flesh this out, make it smart about finding related objects.
    if (typeof(this._model) === 'undefined') { return []; }
    if (typeof(this._model.matchesMorph) !== 'function') { return []; }
    return this.owner.owner.submorphs.select(function(morph) { return this._model.matchesMorph(morph); }.bind(this));
  }, {category: ['finding related objects']});

  add.method('taggingCommands', function () {
    var items = [];

    items.push(avocado.command.create("add tag", function(evt, targetMorph) {
      var tagMorph = avocado.placeholder.newPlaceholderMorphForMorph(targetMorph);
      this.aboutToReceiveDrop(tagMorph);
      this.addTagMorph(tagMorph);
      if (targetMorph.owner instanceof avocado.CarryingHandMorph) {
        targetMorph.owner.putBackInOriginalPosition(targetMorph, evt);
      }
    }).setArgumentSpecs([
      avocado.command.argumentSpec.create('target').onlyAcceptsType(avocado.morphWithAModel).useMorphicContextualArgFinder()
    ]));
    
    if (false) { // aaa - I think we need something like this but I'm not sure of the details yet.

      if (this.owner.isHighlighted()) {
        items.push(avocado.command.create('unhighlight related objects', function(evt) { this.allLikeMe().forEach(function(tm) { tm.beUnhighlighted(); }); }));
      } else {
        items.push(avocado.command.create('highlight related objects', function(evt) { this.allLikeMe().forEach(function(tm) { tm.beHighlighted(); }); }));
      }
    
      items.push(avocado.command.create('gather related objects', function(evt) {
        var container = this.owner.owner;
        var pose = avocado.poses.list.create("all tagged " + this._model, container.getExtent.bind(container), this.allLikeMe());
        evt.hand.world().promptForPoint(function(startingPos) {
          container.poseManager().assumePose(pose, startingPos);
        });
      }));
    
    }
    
    return items;
  }, {category: ['tagging']});

  add.method('tagColorsByType', function () {
    if (! this._tagColorsByType) {
      this._tagColorsByType = avocado.dictionary.copyRemoveAll(avocado.dictionary.identityComparator);
    }
    return this._tagColorsByType;
  }, {category: ['tagging']});

  add.method('getOrCreateColorForTagType', function (tagType, preferredColor) {
    return this.tagColorsByType().getOrIfAbsentPut(tagType, function() { return preferredColor || Color.random(); });
  }, {category: ['tagging']});

  add.method('tagSubmorphsWithNewTag', function (tagType, color) {
    this.getOrCreateColorForTagType(tagType, color);
    this.tagSubmorphsWithTag(tagType);
  }, {category: ['tagging']});

  add.method('tagSubmorphsWithTag', function (tagType) {
    var color = this.getOrCreateColorForTagType(tagType);
    this.eachSubmorph(function(m) {
      if (tagType.matchesMorph(m)) {
        m.addTagMorph(avocado.placeholder.newPlaceholderMorphForMorph(tagType));
      }
    });
  }, {category: ['tagging']});

  add.method('currentTags', function () {
    if (! this._tagHolderMorph) { return []; }
    return this.tagHolderMorph().submorphs;
  }, {category: ['tagging']});

  add.method('addTagMorph', function (tagMorph) {
    this.ensureTagHolderMorphIsVisible().layout().addCell(tagMorph);
    return this;
  }, {category: ['tagging']});

  add.method('ensureTagHolderMorphIsVisible', function () {
    // Children should feel free to override this if they want to specify exactly where to place tags.
    var m = this.tagHolderMorph();
    if (! m.owner) { this.addMorphAt(m, pt(20,0)); }
    return m;
  }, {category: ['tagging']});

  add.method('tagHolderMorph', function () {
    if (! this._tagHolderMorph) {
      this._tagHolderMorph = this.createTagHolderMorph();
    }
    return this._tagHolderMorph;
  }, {category: ['tagging']});

  add.method('createTagHolderMorph', function () {
    return avocado.table.newColumnMorph().applyStyle({fill: null}).ignoreEvents();
  }, {category: ['tagging']});

});


});
