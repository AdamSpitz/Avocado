avocado.transporter.module.create('programming_environment/webdav', function(requires) {

requires('core/webdav');

}, function(thisModule) {


thisModule.addSlots(avocado.transporter.repositories.httpWithWebDAV, function(add) {

  add.method('newMorph', function () {
    return avocado.treeNode.newMorphFor(this);
  }, {category: ['user interface']});

});


thisModule.addSlots(avocado.webdav.file, function(add) {

  add.method('newMorph', function () {
    var m = avocado.table.newColumnMorph().applyStyle(this.defaultMorphStyle);
    var titleLabel = avocado.infrequentlyEditedText.newMorphFor(avocado.accessors.forMethods(this, 'fileName'));
    var contentsMorph = avocado.types.longString.createInputMorph(avocado.accessors.forMethods(this, 'contentText'));
    m.layout().setCells([titleLabel, contentsMorph]);
    //m.startPeriodicallyUpdating();
    return m;
  }, {category: ['user interface']});

  add.creator('defaultMorphStyle', {}, {category: ['user interface']});

});


thisModule.addSlots(avocado.webdav.file.defaultMorphStyle, function(add) {

  add.data('borderRadius', 10);

  add.data('fillBase', new Color(0.9, 0.5, 0.5));

});


});
