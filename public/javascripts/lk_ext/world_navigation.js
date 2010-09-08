transporter.module.create('lk_ext/world_navigation', function(requires) {}, function(thisModule) {


thisModule.addSlots(WorldMorph.prototype, function(add) {

  add.method('slideBy', function (p) {
    var delta = p.scaleBy(1 / this.getScale());
    //this.origin = this.origin.addPt(p);
    //this.shape.translateBy(delta.negated());
    // Blecch. I would have preferred to leave the morphs at the same world-coordinates and just
    // make the top-left corner be (-X,-Y) instead of (0,0). But that was turning out to be complicated.
    // So for now, just move all the morphs by (X,Y).
    this.submorphs.each(function(m) {
      m.startZoomingInAStraightLineTo(m.position().addPt(delta), false, false, true);
    });
  }, {category: ['navigation']});

  add.method('zoomBy', function (factor) {
    this.staySameSizeAndSmoothlyScaleTo(this.getScale() * factor);
  }, {category: ['navigation']});

});


});
