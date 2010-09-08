transporter.module.create('lk_ext/scatter', function(requires) {

requires('lk_ext/animation');

}, function(thisModule) {


thisModule.addSlots(Morph.prototype, function(add) {

  add.method('scatter', function (morphs) {
    var world = this.world();
    var rectToScatterIn = this.bounds().insetBy(-200).intersection(world.bounds().insetBy(50));
    var rectToAvoid = this.bounds().insetBy(-50);
    morphs.each(function(m) {
      while (true) {
        var p = rectToScatterIn.randomPoint();
        if (! rectToAvoid.containsPoint(p)) {
          m.ensureIsInWorld(world, p, true, true, false);
          return p;
        }
      }
    }.bind(this));
  });

});


});
