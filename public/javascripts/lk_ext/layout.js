avocado.transporter.module.create('lk_ext/layout', function(requires) {

requires('general_ui/layout');

}, function(thisModule) {


thisModule.addSlots(TextMorph.prototype, function(add) {

  add.method('layoutChanged', function ($super) {
    var r = $super();
    this.adjustForNewBounds();          // make the focus halo look right
    this.minimumExtentMayHaveChanged(); // play nicely with my new layout system
    return r;
  });

});


});
