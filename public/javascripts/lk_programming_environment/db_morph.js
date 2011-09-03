avocado.transporter.module.create('lk_programming_environment/db_morph', function(requires) {

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

  add.method('newMorph', function () {
    return new avocado.TreeNodeMorph(this).setShouldScaleContentsToFit(true).refreshContentOfMeAndSubmorphs().applyStyle({fill: new lively.paint.LinearGradient([new lively.paint.Stop(0, new Color(1, 0.8, 0.5)), new lively.paint.Stop(1, new Color(1, 0.9, 0.75))], lively.paint.LinearGradient.SouthNorth), borderRadius: 10});
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
    // Not really much point in having a whole factory just for one morph.
    // For now I've added a DB morph to the simple morphs factory.
    if (false && this.enableDBExperiment && avocado.morphFactories) {
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
    this.setDB(db);
  });

  add.creator('style', {}, {category: ['styles']});

  add.method('db', function () { return this._model; }, {category: ['accessing']});

  add.method('setDB', function (db) {
    this._model = db;
    if (this._labelMorph) { this._labelMorph.remove(); }
		this._labelMorph = TextMorph.createLabel(this.labelString()).fitText();
		this.addMorphAt(this._labelMorph, this._labelMorph.getExtent().scaleBy(-0.5));
  }, {category: ['accessing']});

  add.method('labelString', function () { return this.db() ? this.db().labelString() : 'CouchDB'; }, {category: ['accessing']});

  add.method('commands', function ($super) {
    if (this._model) {
      return $super();
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


thisModule.addSlots(avocado.db.Morph.prototype.style, function(add) {

  add.data('fill', new Color(1, 0, 1));

  add.data('borderWidth', 1);

  add.data('borderColor', new Color(0, 0, 0));

  add.data('openForDragAndDrop', false);

});


thisModule.addSlots(avocado.couch.db.container.Morph, function(add) {

  add.data('superclass', avocado.TreeNodeMorph);

  add.data('type', 'avocado.couch.db.container.Morph');

  add.creator('prototype', Object.create(avocado.TreeNodeMorph.prototype));

});


thisModule.addSlots(avocado.couch.db.container.Morph.prototype, function(add) {

  add.data('constructor', avocado.couch.db.container.Morph);

  add.method('initialize', function ($super, container) {
    $super(container);
    this.applyStyle(this.style);
    this.setShouldScaleContentsToFit(true);
    this.refreshContentOfMeAndSubmorphs();
  }, {category: ['creating']});

  add.creator('style', {}, {category: ['styles']});
  
  add.method('copyAttributesFrom', function ($super, copier, other) {
    // aaa - this is kind of a hack, but for now I just want a custom copy; in the
    // long run make this work with the general copying mechanism
    $super(copier, other);
    
    // Make a new container object, don't try to copy all the contents yet.
    this._model = this._model.copyRemoveAll();
  }, {category: ['copying']});
  
  add.method('updateContents', function (callback) {
    this._model.updateContents(function(contents) {
      contents.forEach(function(c) { this.contentMorphFor(c).refreshContentOfMeAndSubmorphs(); }.bind(this));
      this.contentsPanel().cleanUp();
      avocado.ui.justChanged(this._model, evt);
      if (callback) { callback(contents); }
    }.bind(this));
    return this;
  }, {category: ['updating']});
  
  add.method('storeString', function () {
    // aaa - hack, in the long run the transporter should be smart enough to handle this
    return ["(", this._model.storeString(), ").morph().setBasicMorphProperties(", this.basicMorphPropertiesStoreString(), ").updateContents()"].join("");
  }, {category: ['transporting']});

});


thisModule.addSlots(avocado.couch.db.container.Morph.prototype.style, function(add) {

  add.data('fill', new lively.paint.LinearGradient([new lively.paint.Stop(0, new Color(0.7, 1, 0.6)), new lively.paint.Stop(1, new Color(0.8, 1, 0.8))], lively.paint.LinearGradient.SouthNorth));
  
  add.data('openForDragAndDrop', false);
  
  add.data('borderRadius', 10);

});


});
