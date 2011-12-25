avocado.transporter.module.create('general_ui/basic_morph_mixins', function(requires) {

}, function(thisModule) {


thisModule.addSlots(avocado, function(add) {
  
  add.creator('morphMixins', {}, {category: ['user interface']});

});


thisModule.addSlots(avocado.morphMixins, function(add) {

  add.method('installAll', function () {
    reflect(Morph.prototype).setCopyDownParents([{parent: this.Morph}]);
    reflect(WorldMorph.prototype).setCopyDownParents([{parent: this.WorldMorph}]);
  }, {category: ['installing']});
  
  add.creator('Morph', {});
  
  add.creator('WorldMorph', {});

});


});
