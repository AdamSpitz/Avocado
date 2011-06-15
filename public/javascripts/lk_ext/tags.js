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

  add.method('immediateSubnodes', function () {
    return [];
  });

  add.method('nonNodeContents', function () {
    return this.allElements();
  });

  add.method('allPossibleObjects', function () {
    if (this._allPossibleObjects) { return this._allPossibleObjects; }
    var objs = [];
    // aaa - I don't think this object should know about morphs.
    WorldMorph.current().submorphs.forEach(function(morph) {
      var model = morph._model;
      if (typeof(model) !== 'undefined') { objs.push(model); }
    });
    return objs;
  });
  
  add.creator('element', {});

  add.creator('defaultMorphStyle', {}, {category: ['user interface']});

  add.method('newMorph', function () {
    var m = new avocado.TreeNodeMorph(this).applyStyle(this.defaultMorphStyle);
    m.typeName = 'tag cloud';
    return m;
  }, {category: ['user interface']});
  
  add.method('tagAllMorphsInWorld', function (w) {
    w = w || WorldMorph.current();
    this.allElements().forEach(function(e) {
      w.addTagType(e.tagType(), e.fill());
    });
  }, {category: ['user interface']});
  
});


thisModule.addSlots(avocado.tag.cloud.defaultMorphStyle, function(add) {

  add.data('fill', new lively.paint.LinearGradient([new lively.paint.Stop(0, new Color(0.1, 0.5, 0.6)), new lively.paint.Stop(1, new Color(0.2, 0.6, 0.75))], lively.paint.LinearGradient.SouthNorth));

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

  add.method('immediateSubnodes', function () {
    return [];
  });

  add.method('nonNodeContents', function () {
    return this.cloud().allPossibleObjects().select(function(o) { return this._tagType.matches(o); }.bind(this));
  });
  
  add.method('nonNodeMorphFor', function ($super, m) {
    var realMorph = $super(m);
    realMorph.refreshContentOfMeAndSubmorphs();
    return new avocado.PlaceholderMorph(realMorph).refreshContentOfMeAndSubmorphs();
  });

  add.creator('defaultMorphStyle', {}, {category: ['user interface']});

  add.method('newMorph', function () {
    var m = new avocado.TreeNodeMorph(this);
    m.setFill(this._fill);
    m.typeName = 'tag cloud element';
    m.refreshContentOfMeAndSubmorphs();
    return m;
  }, {category: ['user interface']});
  
});


thisModule.addSlots(avocado.tag.Morph, function(add) {

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
  
  add.method('allLikeMe', function () {
    return this.owner.owner.submorphs.select(function(morph) { return this._model.matchesMorph(morph); }.bind(this));
  }, {category: ['finding others']});
  
  add.method('commands', function () {
    var cmdList = avocado.command.list.create(this);
    
    if (this.owner.isHighlighted()) {
      cmdList.addItem(avocado.command.create('unhighlight all', function(evt) { this.allLikeMe().forEach(function(tm) { tm.beUnhighlighted(); }); }));
    } else {
      cmdList.addItem(avocado.command.create('highlight all', function(evt) { this.allLikeMe().forEach(function(tm) { tm.beHighlighted(); }); }));
    }
    
    cmdList.addItem(avocado.command.create('gather all', function(evt) {
      var container = this.owner.owner;
      var pose = avocado.poses.list.create("all tagged " + this._model, container, this.allLikeMe());
      evt.hand.world().promptForPoint(function(startingPos) {
        container.poseManager().assumePose(pose, startingPos);
      });
    }));
    
    return cmdList;
  }, {category: ['matching']});
  
});


thisModule.addSlots(Morph.prototype, function(add) {

  add.method('tagColorsByType', function () {
    if (! this._tagColorsByType) {
      this._tagColorsByType = avocado.dictionary.copyRemoveAll(avocado.dictionary.identityComparator);
    }
    return this._tagColorsByType;
  }, {category: ['tagging']});
  
  add.method('addTagType', function (tagType, color) {
    this.tagColorsByType().put(tagType, color || Color.random());
    this.tagSubmorphsWithTag(tagType);
  }, {category: ['tagging']});
  
  add.method('tagSubmorphsWithTag', function (tagType) {
    var color = this.tagColorsByType().get(tagType);
    this.submorphs.forEach(function(m) {
      if (tagType.matchesMorph(m)) {
        var tm = new avocado.tag.Morph(tagType, color);
        m.addMorphAt(tm, pt(5,5));
      }
    });
  }, {category: ['tagging']});

});


});
