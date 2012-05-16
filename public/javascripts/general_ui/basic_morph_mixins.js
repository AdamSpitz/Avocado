avocado.transporter.module.create('general_ui/basic_morph_mixins', function(requires) {

}, function(thisModule) {


thisModule.addSlots(avocado, function(add) {

  add.creator('morphMixins', {}, {category: ['user interface']});

});


thisModule.addSlots(avocado.morphMixins, function(add) {

  add.method('installAll', function () {
    reflect(Morph.prototype).setCopyDownParents([{parent: this.Morph}, {parent: this.MorphOrWorld}]);
    reflect(WorldMorph.prototype).setCopyDownParents([{parent: this.WorldMorph}]);
    reflect(TextMorph.prototype).setCopyDownParents([{parent: this.TextMorph}]);
  }, {category: ['installing']});

  add.creator('MorphOrWorld', {});

  add.creator('Morph', {});

  add.creator('WorldMorph', {});

  add.creator('TextMorph', {});

});


thisModule.addSlots(avocado.morphMixins.Morph, function(add) {

  add.data('isMorph', true, {category: ['testing']});

});


thisModule.addSlots(avocado.morphMixins.WorldMorph, function(add) {

  add.data('isWorld', true, {category: ['testing']});

});


});
