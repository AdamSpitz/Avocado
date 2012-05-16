avocado.transporter.module.create('lk_ext/container_morph', function(requires) {

requires('general_ui/tree_node');

}, function(thisModule) {


thisModule.addSlots(avocado, function(add) {

  add.creator('container', {}, {category: ['user interface']});

});


thisModule.addSlots(avocado.container, function(add) {

  add.creator('modelUsingWhicheverMorphsHappenToBeThere', {});

  add.creator('defaultStyle', {}, {category: ['styles']});

  add.method('newContainerMorph', function () {
    var model = Object.newChildOf(this.modelUsingWhicheverMorphsHappenToBeThere);
    var morph = avocado.treeNode.newMorphFor(model);
    model._morph = morph;
    reflect(morph).slotAt('_model').beCreator();
    return morph;
  });

});


thisModule.addSlots(avocado.container.modelUsingWhicheverMorphsHappenToBeThere, function(add) {

  add.method('initialize', function (morph) {
    this._morph = morph;
    this._containerName = 'a container';
    this._titleAccessors = avocado.accessors.forAttribute(this, '_containerName');
  }, {category: ['creating']});

  add.method('toString', function () { return "morphs of " + this._morph; });

  add.method('immediateContents', function () {
    var models = [];
    if (this._morph._contentsPanel) {
      this._morph._contentsPanel.eachSubmorph(function(m) {
        models.push(typeof(m._model) !== 'undefined' ? m._model : { newMorph: function() { return m; }});
      });
    }
    return models;
  }, {category: ['accessing']});

  add.method('titleAccessors', function () {
    return this._titleAccessors;
  }, {category: ['accessing']});

  add.data('shouldContentsPanelAutoOrganize', true);

});


thisModule.addSlots(avocado.container.defaultStyle, function(add) {

  add.data('fillBase', new Color(1, 0.8, 0.5));

  add.data('openForDragAndDrop', false);

  add.data('borderRadius', 10);

});


});
