avocado.transporter.module.create('lk_ext/morph_factories', function(requires) {

requires('lk_ext/core_sampler');

}, function(thisModule) {


thisModule.addSlots(avocado, function(add) {

  add.creator('morphFactories', {}, {category: ['ui']});

});


thisModule.addSlots(avocado.morphFactories, function(add) {

  add.creator('simpleMorphs', {}, {category: ['simple morphs']});

  add.creator('tools', {}, {category: ['tools']});

  add.data('globalFactories', [], {category: ['registering'], initializeTo: '[]'});

  add.method('addGlobalCommandsTo', function (menu) {
    menu.addLine();
    
    menu.addItem(["morph factory", avocado.morphFactories.globalFactories.map(function(factory) {
      return [factory.factoryName(), function(evt) { factory.createFactoryMorph().grabMe(evt); }]
    })]);
  }, {category: ['menu']});

  add.creator('defaultStyle', {}, {category: ['styles']});

});


thisModule.addSlots(avocado.morphFactories.simpleMorphs, function(add) {

  add.method('factoryName', function () { return 'simple morphs'; });

  add.method('createFactoryMorph', function () {
    var line     = Morph.makeLine([pt(0,0), pt(60, 30)], 2, Color.black).closeDnD();
    var rect     = Morph.makeRectangle(pt(0,0), pt(60, 30)).closeDnD();
    var ellipse  = Morph.makeCircle(pt(0,0), 25).closeDnD();
    var text     = new TextMorph(pt(0,0).extent(pt(120, 10)), "This is a TextMorph").closeDnD();
    var star     = Morph.makeStar(pt(0,0)).closeDnD();
    var heart    = Morph.makeHeart(pt(0,0)).closeDnD();
    var triangle = Morph.makePolygon([pt(-30,0), pt(30,0), pt(0,-50)], 1, Color.black, Color.green.darker());
    
    var buttonLabel = new avocado.TwoModeTextMorph();
    buttonLabel.setText("Button");
    buttonLabel.acceptChanges();
    buttonLabel.suppressHandles = true;
    buttonLabel.ignoreEvents();
    buttonLabel.backgroundColorWhenWritable = Color.white;
    var button  = ButtonMorph.createButton(buttonLabel, function(event) {
  this.world().showMessage("Inspect the button and edit its 'run' method.");
}).closeDnD();

    var container = avocado.container.newContainerMorph();

    var dbMorph = new avocado.db.Morph(null);

    ellipse.setFill(new Color(0.8, 0.5, 0.5)); // make it a different color than the rectangle
    
    var factory = Morph.makeRectangle(pt(0,0), pt(300, 560));
    factory.applyStyle(avocado.morphFactories.defaultStyle);
    factory.addMorphAt(line,      pt( 20,  20));
    factory.addMorphAt(rect,      pt(120,  20));
    factory.addMorphAt(ellipse,   pt( 20, 120));
    factory.addMorphAt(text,      pt(120, 120));
    factory.addMorphAt(star,      pt( 20, 220));
    factory.addMorphAt(heart,     pt(200, 300));
    factory.addMorphAt(button,    pt( 20, 340));
    factory.addMorphAt(triangle,  pt(150, 340));
    factory.addMorphAt(container, pt( 20, 410));
    factory.addMorphAt(dbMorph,   pt(190, 435));
    return factory;
  });

  add.method('postFileIn', function () {
    avocado.morphFactories.globalFactories.push(this);
  });

});


thisModule.addSlots(avocado.morphFactories.tools, function(add) {

  add.method('factoryName', function () { return 'tools'; });

  add.method('createFactoryMorph', function () {
    var coreSampler = new avocado.CoreSamplerMorph();
    
    var factory = Morph.makeRectangle(pt(0,0), pt(300, 200));
    factory.applyStyle(avocado.morphFactories.defaultStyle);
    factory.addMorphAt(coreSampler, pt( 70,  70));
    
    return factory;
  });

  add.method('postFileIn', function () {
    avocado.morphFactories.globalFactories.push(this);
  });

});


thisModule.addSlots(avocado.morphFactories.defaultStyle, function(add) {

  add.data('fill', new Color(0.1, 0.6, 0.7));

  add.data('borderWidth', 1);

  add.data('borderColor', new Color(0, 0, 0));

  add.data('openForDragAndDrop', false);

});


});
