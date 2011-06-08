avocado.transporter.module.create('lk_ext/scatter', function(requires) {

requires('lk_ext/animation');

}, function(thisModule) {


thisModule.addSlots(Morph.prototype, function(add) {

  add.method('scatterNearMe', function (morphs) {
    var world = this.world();
    var rectToScatterIn = this.bounds().insetBy(-200).intersection(world.bounds().insetBy(50));
    var rectToAvoid = this.bounds().insetBy(-50);
    world.scatter(morphs, rectToScatterIn, rectToAvoid);
  });

});


thisModule.addSlots(WorldMorph.prototype, function(add) {

  add.method('scatter', function (morphs, rectToScatterIn, rectToAvoid) {
    if (!rectToScatterIn) { rectToScatterIn = this.bounds().insetBy(50); }
    morphs.each(function(m) {
      while (true) {
        var p = rectToScatterIn.randomPoint();
        if (!rectToAvoid || !rectToAvoid.containsPoint(p)) {
          m.ensureIsInWorld(this, p, true, true, false);
          return p;
        }
      }
    }.bind(this));
  });

});


});
