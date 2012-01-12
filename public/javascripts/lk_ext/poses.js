avocado.transporter.module.create('lk_ext/poses', function(requires) {

requires('general_ui/poses');

}, function(thisModule) {


thisModule.addSlots(MenuMorph.prototype, function(add) {

  add.method('shouldIgnorePoses', function () {
    return ! this.stayUp;
  }, {category: ['poses']});

});


thisModule.addSlots(WorldMorph.prototype, function(add) {

  add.method('promptForPoint', function (callback) {
    var markerMorph = new Morph(new lively.scene.Ellipse(pt(0,0), 3));
    markerMorph.wasJustDroppedOnWorld = function(w) {
      var p = this.getPosition();
      this.remove();
      callback(p);
    };
    markerMorph.grabMeWithoutZoomingAroundFirst(Event.createFake());
  }, {category: ['poses']});

});


});
