avocado.transporter.module.create('lk_programming_environment/webdav_morphs', function(requires) {

requires('core/webdav');

}, function(thisModule) {


thisModule.addSlots(avocado.transporter.repositories.httpWithWebDAV, function(add) {
  
  add.method('newMorph', function () {
    return avocado.TreeNodeMorph.create(this);
  }, {category: ['user interface']});

});


thisModule.addSlots(FileDirectory.prototype, function(add) {
  
  add.method('newMorph', function () {
    return avocado.TreeNodeMorph.create(this);
  }, {category: ['user interface']});

});


thisModule.addSlots(avocado.webdav.file, function(add) {
  
  add.method('newMorph', function () {
    var m = avocado.table.newColumnMorph();
    var titleLabel = new avocado.TwoModeTextMorph(avocado.accessors.forMethods(this, 'fileName'));
    titleLabel.setFill(null);
    var contentsTextMorph = new avocado.TextMorphRequiringExplicitAcceptance(avocado.accessors.forMethods(this, 'contentText'));
    //contentsTextMorph._maxSpace = pt(100,200);
    //contentsTextMorph.adjustScale();
    contentsTextMorph.setScale(0.3);
    contentsTextMorph.setFill(null);
    var contentsMorph = ScrollPane.containing(contentsTextMorph, pt(100,150));
    m.layout().setCells([titleLabel, contentsMorph]);
    m.setFill(Color.red.lighter());
    //m.startPeriodicallyUpdating();
    return m;
  }, {category: ['user interface']});

});


});
