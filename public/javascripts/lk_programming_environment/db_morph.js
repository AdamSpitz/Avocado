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

  add.creator('morphFactory', {}, {category: ['user interface']});

});


thisModule.addSlots(avocado.db.Morph, function(add) {

  add.data('displayName', 'Morph');

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
		this._labelMorph = avocado.label.newMorphFor(this.labelString()).fitText();
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


thisModule.addSlots(avocado.db.morphFactory, function(add) {

  add.method('factoryName', function () { return 'database morphs'; });

  add.method('createFactoryMorph', function () {
    var dbMorph = new avocado.db.Morph(null);
    
    var factory = avocado.table.newTableMorph();
    factory.applyStyle(avocado.morphFactories.defaultStyle);
    factory.replaceContentWith(avocado.table.contents.createWithRow([dbMorph]));
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


thisModule.addSlots(avocado.couch.db.containerTypesOrganizerProto, function(add) {

  add.method('newMorph', function () {
    return avocado.treeNode.newMorphFor(this, {fillBase: new Color(1, 0.8, 0.5), borderRadius: 10});
  }, {category: ['user interface']});

});


thisModule.addSlots(avocado.couch.db.container, function(add) {

  add.method('newMorph', function () {
    var m = avocado.treeNode.newMorphFor(this, this.defaultStyle);

    // aaa - this is a hack, but for now I just want a custom copy; in the
    // long run make this work with the general copying mechanism
    m.copyAttributesFrom = function (copier, other) {
      Morph.prototype.copyAttributesFrom.call(this, copier, other);

      // Make a new container object, don't try to copy all the contents yet.
      this._model = this._model.copyRemoveAll();
    };
  
    m.updateContents = function (callback) {
      this._model.updateContents(function(contents) {
        contents.forEach(function(c) { WorldMorph.current().morphFor(c).refreshContentOfMeAndSubmorphs(); }.bind(this));
        avocado.ui.justChangedContent(this._model, evt);
        if (callback) { callback(contents); }
      }.bind(this));
      return this;
    };
  
    m.storeString = function () {
      // aaa - hack, in the long run the transporter should be smart enough to handle this
      return ["WorldMorph.current().morphFor(", this._model.storeString(), ").setBasicMorphProperties(", this.basicMorphPropertiesStoreString(), ").updateContents()"].join("");
    };

    return m;
  }, {category: ['user interface']});

  add.creator('defaultStyle', {}, {category: ['user interface', 'styles']});

});


thisModule.addSlots(avocado.couch.db.container.defaultStyle, function(add) {

  add.data('fillBase', new Color(0.7, 1, 0.6));

  add.data('openForDragAndDrop', false);

  add.data('borderRadius', 10);

});


});
