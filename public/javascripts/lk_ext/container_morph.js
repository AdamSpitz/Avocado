avocado.transporter.module.create('lk_ext/container_morph', function(requires) {

requires('lk_ext/tree_morph');

}, function(thisModule) {


thisModule.addSlots(avocado, function(add) {

  add.method('ContainerMorph', function ContainerMorph() { Class.initializer.apply(this, arguments); }, {category: ['ui']});

});


thisModule.addSlots(avocado.ContainerMorph, function(add) {

  add.data('superclass', avocado.TreeNodeMorph);

  add.data('type', 'avocado.ContainerMorph');

  add.creator('prototype', Object.create(avocado.TreeNodeMorph.prototype));

});


thisModule.addSlots(avocado.ContainerMorph.prototype, function(add) {

  add.data('constructor', avocado.ContainerMorph);

  add.method('initialize', function ($super) {
    var model = Object.newChildOf(this.modelUsingWhicheverMorphsHappenToBeThere, this);
    $super(model, avocado.TreeNodeMorph.functionForCreatingTreeContentsPanel(model, true));
    
    reflect(this).slotAt('_model').beCreator();
  }, {category: ['creating']});
  
  add.creator('modelUsingWhicheverMorphsHappenToBeThere', {});

  add.creator('style', {}, {category: ['styles']});
  
});


thisModule.addSlots(avocado.ContainerMorph.prototype.modelUsingWhicheverMorphsHappenToBeThere, function(add) {
  
  add.method('initialize', function (morph) {
    this._morph = morph;
    this._containerName = 'a container';
    this._titleAccessors = avocado.accessors.forAttribute(this, '_containerName');
  }, {category: ['creating']});
  
  add.method('toString', function () { return "morphs of " + this._morph; });
  
  add.method('immediateContents', function () {
    return this._morph.actualContentsPanel().submorphs.map(function(m) { return typeof(m._model) !== 'undefined' ? m._model : { newMorph: function() { return m; }}; });
  }, {category: ['accessing']});
  
  add.method('titleAccessors', function () {
    return this._titleAccessors;
  }, {category: ['accessing']});

});


thisModule.addSlots(avocado.ContainerMorph.prototype.style, function(add) {
  
  add.data('fill', new lively.paint.LinearGradient([new lively.paint.Stop(0, new Color(1, 0.8, 0.5)), new lively.paint.Stop(1, new Color(1, 0.9, 0.75))], lively.paint.LinearGradient.SouthNorth));
  
  add.data('openForDragAndDrop', false);
  
  add.data('borderRadius', 10);

});


});
