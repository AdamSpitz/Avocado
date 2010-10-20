transporter.module.create('lk_ext/world_navigation', function(requires) {}, function(thisModule) {


thisModule.addSlots(WorldMorph.prototype, function(add) {

  add.method('slideIfClickedAtEdge', function (evt) {
    var b = this.fullBounds;
    var p = evt.point();
    var amountToSlide = 50;
    if (p.x <= 50) { this.slideBy(pt(-amountToSlide,0)); }
    if (p.y <= 50) { this.slideBy(pt(0,-amountToSlide)); }
    if (b.maxX() - p.x <= 50) { this.slideBy(pt(amountToSlide,0)); }
    if (b.maxY() - p.y <= 50) { this.slideBy(pt(0,amountToSlide)); }
  }, {category: ['navigation']});

  add.method('slideBy', function (p) {
    var delta = p.scaleBy(1 / this.getScale());
    //this.origin = this.origin.addPt(p);
    //this.shape.translateBy(delta.negated());
    // Blecch. I would have preferred to leave the morphs at the same world-coordinates and just
    // make the top-left corner be (-X,-Y) instead of (0,0). But that was turning out to be complicated.
    // So for now, just move all the morphs by (X,Y).
    this.submorphs.each(function(m) {
      // The animated version is a bit weird for now, I think. -- Adam
      // m.startZoomingInAStraightLineTo(m.position().addPt(delta), false, false, true);
      m.moveBy(delta);
    });
  }, {category: ['navigation']});

  add.method('zoomBy', function (factor) {
    this.staySameSizeAndSmoothlyScaleTo(this.getScale() * factor);
  }, {category: ['navigation']});

});


});
