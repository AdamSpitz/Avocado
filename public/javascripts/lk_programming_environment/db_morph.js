transporter.module.create('lk_programming_environment/db_morph', function(requires) {

requires('db/abstract');

}, function(thisModule) {


thisModule.addSlots(avocado.db, function(add) {
  
  add.method('Morph', function Morph() { Class.initializer.apply(this, arguments); }, {category: ['user interface']});

  add.method('newMorph', function () {
    return new this.Morph(this);
  }, {category: ['user interface']});

  add.method('morph', function () {
    return WorldMorph.current().morphFor(this);
  }, {category: ['user interface']});

  add.method('newMorph', function () {
    return new this.Morph(this);
  }, {category: ['user interface']});
  
  add.creator('morphFactory', {}, {category: ['user interface']})

});


thisModule.addSlots(avocado.db.morphFactory, function(add) {

  add.method('factoryName', function () { return 'database'; });

  add.method('createFactoryMorph', function () {
    var dbMorph = new avocado.db.Morph(null);
    
    var factory = new avocado.TableMorph();
    factory.applyStyle(avocado.morphFactories.defaultStyle);
    factory.replaceContentWith(avocado.tableContents.createWithRows([[dbMorph]]));
    return factory;
  });
  
  add.data('enableDBExperiment', false)

  add.data('postFileIn', function () {
    if (this.enableDBExperiment && avocado.morphFactories) {
      avocado.morphFactories.globalFactories.push(this);
    }
  });

});


thisModule.addSlots(avocado.db.Morph, function(add) {

  add.data('superclass', Morph);

  add.creator('prototype', Object.create(Morph.prototype));

  add.data('type', 'avocado.db.Morph');

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
    if (this._model) { return $super(); }
    
    var cmdList = avocado.command.list.create(this);
    cmdList.addItem(avocado.command.create('connect to', function(evt, db) {
      this.setDB(db);
    }.bind(this)).setArgumentSpecs([
      avocado.command.argumentSpec.create('db').onlyAcceptsType(avocado.couch.db)
    ]));
    
    return cmdList;
  }, {category: ['commands']});

});


thisModule.addSlots(avocado.db.Morph.prototype.defaultStyle, function(add) {
  
  add.data('fill', Color.purple);
  
  add.data('borderWidth', 1);
  
  add.data('borderColor', Color.black);
  
  add.data('openForDragAndDrop', false);
  
});


});
