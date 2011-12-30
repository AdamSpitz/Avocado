avocado.transporter.module.create('general_ui/styles', function(requires) {

requires('general_ui/basic_morph_mixins');

}, function(thisModule) {

thisModule.addSlots(avocado.morphMixins.Morph, function(add) {
	
	add.method('setStylist', function(stylist) {
	  this._stylist = stylist;
	  return this;
	}, {category: ['styles']});

});


});
