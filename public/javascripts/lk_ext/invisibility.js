avocado.transporter.module.create('lk_ext/invisibility', function(requires) {

}, function(thisModule) {


thisModule.addSlots(Morph.prototype, function(add) {

  add.method('beInvisible', function () {
    return this.applyStyle(this.invisibleStyle);
  }, {category: ['shortcuts']});

  add.creator('invisibleStyle', {}, {category: ['styles']});
  
});


thisModule.addSlots(Morph.prototype.invisibleStyle, function(add) {

  add.data('padding', 0);

  add.data('borderWidth', 0);

  add.data('fill', null);

  add.data('suppressGrabbing', true);

  add.data('shouldIgnoreEvents', true);

  add.data('openForDragAndDrop', false);

});


});
