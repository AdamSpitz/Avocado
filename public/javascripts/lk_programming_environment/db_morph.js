transporter.module.create('lk_programming_environment/db_morph', function(requires) {

requires('lk_ext/container_morph');
requires('db/abstract');
requires('db/couch');

}, function(thisModule) {


thisModule.addSlots(avocado.db, function(add) {

  add.method('Morph', function Morph() { Class.initializer.apply(this, arguments); }, {category: ['user interface']});

  add.method('newMorph', function () {
    return new this.Morph(this);
  }, {category: ['user interface']});

  add.method('morph', function () {
    return WorldMorph.current().morphFor(this);
  }, {category: ['user interface']});

  add.creator('morphFactory', {}, {category: ['user interface']});

});


thisModule.addSlots(avocado.couch.db.containerTypesOrganizerProto, function(add) {

  add.method('Morph', function Morph() { Class.initializer.apply(this, arguments); }, {category: ['user interface']});

  add.method('newMorph', function () {
    return new this.Morph(this);
  }, {category: ['user interface']});

  add.method('morph', function () {
    return WorldMorph.current().morphFor(this);
  }, {category: ['user interface']});
  
});


thisModule.addSlots(avocado.couch.db.container, function(add) {

  add.method('Morph', function Morph() { Class.initializer.apply(this, arguments); }, {category: ['user interface']});

  add.method('newMorph', function () {
    return new this.Morph(this);
  }, {category: ['user interface']});

  add.method('morph', function () {
    return WorldMorph.current().morphFor(this);
  }, {category: ['user interface']});
  
});


thisModule.addSlots(avocado.db.morphFactory, function(add) {

  add.method('factoryName', function () { return 'database morphs'; });

  add.method('createFactoryMorph', function () {
    var dbMorph = new avocado.db.Morph(null);
    
    var factory = new avocado.TableMorph();
    factory.applyStyle(avocado.morphFactories.defaultStyle);
    factory.replaceContentWith(avocado.tableContents.createWithRows([[dbMorph]]));
    return factory;
  });

  add.data('enableDBExperiment', true);

  add.method('postFileIn', function () {
    if (this.enableDBExperiment && avocado.morphFactories) {
      avocado.morphFactories.globalFactories.push(this);
    }
  });

});


thisModule.addSlots(avocado.db.Morph, function(add) {

  add.data('superclass', Morph);

  add.data('type', 'avocado.db.Morph');

  add.creator('prototype', Object.create(Morph.prototype));

});


thisModule.addSlots(avocado.db.Morph.prototype, function(add) {

  add.data('constructor', avocado.db.Morph);

  add.method('initialize', function ($super, db) {
    $super(new lively.scene.Ellipse(pt(0,0), 40));
    this.applyStyle(this.defaultStyle);
    this.setDB(db);
  });

  add.creator('defaultStyle', {}, {category: ['styles']});

  add.method('db', function () { return this._model; }, {category: ['accessing']});

  add.method('setDB', function (db) {
    this._model = db;
    if (this._labelMorph) { this._labelMorph.remove(); }
		this._labelMorph = TextMorph.createLabel(this.labelString()).fitText();
		this.addMorphAt(this._labelMorph, this._labelMorph.getExtent().scaleBy(-0.5));
  }, {category: ['accessing']});

  add.method('labelString', function () { return this.db() ? this.db().labelString() : 'DB'; }, {category: ['accessing']});

  add.method('commands', function ($super) {
    if (this._model) {
      var cmdList = $super() || avocado.command.list.create(this);
      cmdList.addItem(avocado.command.create('container types', function(evt) { new avocado.couch.db.containerTypesOrganizerProto.Morph(this.db().containerTypesOrganizer()).grabMe(evt); }, this));
      return cmdList;
    } else {
      var cmdList = avocado.command.list.create(this);
      cmdList.addItem(avocado.command.create('connect to', function(evt, db) {
        this.setDB(db);
      }.bind(this)).setArgumentSpecs([
        avocado.command.argumentSpec.create('db').onlyAcceptsType(avocado.couch.db)
      ]));

      return cmdList;
    }
  }, {category: ['commands']});

});


thisModule.addSlots(avocado.db.Morph.prototype.defaultStyle, function(add) {

  add.data('fill', new Color(1, 0, 1));

  add.data('borderWidth', 1);

  add.data('borderColor', new Color(0, 0, 0));

  add.data('openForDragAndDrop', false);

});


thisModule.addSlots(avocado.couch.db.containerTypesOrganizerProto.Morph, function(add) {

  add.data('superclass', avocado.TreeNodeMorph);

  add.data('type', 'avocado.couch.db.containerTypesOrganizerProto.Morph');

  add.creator('prototype', Object.create(avocado.TreeNodeMorph.prototype));

});


thisModule.addSlots(avocado.couch.db.containerTypesOrganizerProto.Morph.prototype, function(add) {

  add.data('constructor', avocado.couch.db.containerTypesOrganizerProto.Morph);

  add.method('initialize', function ($super, containerTypesOrganizer) {
    $super();
    this._model = containerTypesOrganizer;
    this.applyStyle(this.defaultStyle);
    this.contentsPanel()._shouldScaleSubmorphsToFit = true;
    
    /* Do this differently. Can't override justReceivedDrop or the command system breaks.
    this.contentsPanel().justReceivedDrop = function(m) {
      this.owner.cleanUpContentsPanel();
    };
    */
    
    this.refreshContentOfMeAndSubmorphs();
  }, {category: ['creating']});
  
  add.method('inspect', function () {
    return this._model.toString();
  }, {category: ['printing']});

  add.creator('defaultStyle', {}, {category: ['styles']});
  
  add.method('refreshContent', function ($super) {
    $super();
    
  }, {category: ['updating']});

});


thisModule.addSlots(avocado.couch.db.containerTypesOrganizerProto.Morph.prototype.defaultStyle, function(add) {

  add.data('fill', new lively.paint.LinearGradient([new lively.paint.Stop(0, new Color(1, 0.8, 0.5)), new lively.paint.Stop(1, new Color(1, 0.9, 0.75))], lively.paint.LinearGradient.SouthNorth));
  
  add.data('openForDragAndDrop', false);
  
  add.data('borderRadius', 10);

});


thisModule.addSlots(avocado.couch.db.container.Morph, function(add) {

  add.data('superclass', avocado.TreeNodeMorph);

  add.data('type', 'avocado.couch.db.container.Morph');

  add.creator('prototype', Object.create(avocado.TreeNodeMorph.prototype));

});


thisModule.addSlots(avocado.couch.db.container.Morph.prototype, function(add) {

  add.data('constructor', avocado.couch.db.container.Morph);

  add.method('initialize', function ($super, container) {
    $super();
    this._model = container;
    this.applyStyle(this.defaultStyle);
    this.contentsPanel()._shouldScaleSubmorphsToFit = true;
    this.refreshContentOfMeAndSubmorphs();
  }, {category: ['creating']});
  
  add.method('inspect', function () {
    return this._model.toString();
  }, {category: ['printing']});
  
  add.method('toString', function () {
    return this._model.toString();
  }, {category: ['printing']});

  add.creator('defaultStyle', {}, {category: ['styles']});
  
  add.method('commands', function () {
    var cmdList = avocado.command.list.create(this);

    cmdList.addItem(avocado.command.create('change attribute', function(evt, attributeName) {
      this._model.setAttributeName(attributeName);
      this.refreshContentOfMeAndSubmorphs();
      this._model.updateContents(this.refreshContentOfMeAndSubmorphs.bind(this));
    }.bind(this)).setArgumentSpecs([
      avocado.command.argumentSpec.create('attributeName').onlyAcceptsType(String)
    ]));

    return cmdList;
  }, {category: ['commands']});
  
  add.method('copyAttributesFrom', function ($super, copier, other) {
    // aaa - this is kind of a hack, but for now I just want a custom copy; in the
    // long run make this work with the general copying mechanism
    $super(copier, other);
    
    // Make a new container object, don't try to copy all the contents yet.
    this._model = this._model.copyRemoveAll();
  }, {category: ['copying']});
  
  add.method('updateContents', function (callback) {
    this._model.updateContents(callback);
    return this;
  }, {category: ['updating']});
  
  add.method('storeString', function () {
    // aaa - hack, in the long run the transporter should be smart enough to handle this
    return ["(", this._model.storeString(), ").morph().updateContents()"].join("");
  }, {category: ['transporting']});

});


thisModule.addSlots(avocado.couch.db.container.Morph.prototype.defaultStyle, function(add) {

  add.data('fill', new lively.paint.LinearGradient([new lively.paint.Stop(0, new Color(1, 0.7, 0.6)), new lively.paint.Stop(1, new Color(1, 0.8, 0.8))], lively.paint.LinearGradient.SouthNorth));
  
  add.data('openForDragAndDrop', false);
  
  add.data('borderRadius', 10);

});


});
