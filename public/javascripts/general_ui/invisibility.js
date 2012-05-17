avocado.transporter.module.create('general_ui/invisibility', function(requires) {

requires('general_ui/basic_morph_mixins');

}, function(thisModule) {


thisModule.addSlots(avocado.morphMixins.Morph, function(add) {

  add.method('beInvisible', function () {
    return this.applyStyle(this.invisibleStyle);
  }, {category: ['shortcuts']});

  add.creator('invisibleStyle', {}, {category: ['styles']});

});


thisModule.addSlots(avocado.morphMixins.Morph.invisibleStyle, function(add) {

  add.data('padding', 0);

  add.data('borderWidth', 0);

  add.data('fill', null);

  add.data('suppressGrabbing', true);

  add.data('shouldIgnoreEvents', true);

  add.data('openForDragAndDrop', false);

});


});
