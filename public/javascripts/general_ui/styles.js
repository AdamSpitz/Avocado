avocado.transporter.module.create('general_ui/styles', function(requires) {

requires('general_ui/basic_morph_mixins');

}, function(thisModule) {


thisModule.addSlots(avocado.morphMixins.Morph, function(add) {

  add.method('setStylist', function (stylist) {
	  this._stylist = stylist;
	  return this;
	}, {category: ['styles']});

  add.method('nonNullFillInMeOrOwners', function () {
    var m = this;
    while (m) {
      var fill = m.getFill();
      if (fill) { return fill; }
      m = m.getOwner();
    }
    return null;
  }, {category: ['drag and drop']});

  add.method('styleForWhenNotEmbeddedInAnythingElse', function () {
    return {
      horizontalLayoutMode: avocado.LayoutModes.ShrinkWrap,
        verticalLayoutMode: avocado.LayoutModes.ShrinkWrap,
                      fill: this.nonNullFillInMeOrOwners()
    };
  }, {category: ['drag and drop']});

});


});
