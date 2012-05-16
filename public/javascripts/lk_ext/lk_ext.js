avocado.transporter.module.create('lk_ext/lk_ext', function(requires) {

requires('core/math');
requires('general_ui/general_ui');
requires('lk_ext/changes');
requires('lk_ext/menus');
requires('lk_ext/commands');
requires('lk_ext/grabbing');
requires('lk_ext/transporting_morphs');
requires('lk_ext/text_morph_variations');
requires('lk_ext/shortcuts');
requires('lk_ext/check_box');
requires('lk_ext/combo_box');
requires('lk_ext/layout');
requires('lk_ext/collection_morph');
requires('lk_ext/container_morph');
requires('lk_ext/animation');
requires('lk_ext/scatter');
requires('lk_ext/expander');
requires('lk_ext/message_notifier');
requires('lk_ext/poses');
requires('lk_ext/morph_factories');
requires('lk_ext/core_sampler');
requires('lk_ext/edit_mode');
requires('lk_ext/world_navigation');
requires('lk_ext/carrying_hand');
requires('lk_ext/types');
requires('lk_ext/morph_chooser');
requires('lk_ext/line_graph');
requires('lk_ext/html');

}, function(thisModule) {


thisModule.addSlots(avocado, function(add) {

  add.creator('livelyKernelUI', Object.create(avocado.generalUI), {category: ['user interface']});

});


thisModule.addSlots(avocado.livelyKernelUI, function(add) {

  add.method('worldFor', function (evtOrMorph) {
    if (evtOrMorph) {
      if (typeof(evtOrMorph.world) === 'function') {
        return evtOrMorph.world();
      } else if (typeof(evtOrMorph.hand) === 'object') {
        return evtOrMorph.hand.world();
      }
    }
    return WorldMorph.current();
  });

  add.method('showNextTo', function (objToBeNextTo, objToShow, callback, evt) {
    // This is maybe a bit too much abstraction. But let's try it for now. Un-abstract
    // it if this function starts needing a million arguments. -- Adam, Oct. 2010
    var w = this.worldFor(evt);
    var morphToBeNextTo = w.morphFor(objToBeNextTo);
    w.morphFor(objToShow).ensureIsInWorld(w, morphToBeNextTo.worldPoint(pt(morphToBeNextTo.getExtent().x + 50, 0)), true, true, true, callback);
  });

  add.method('defaultFillWithColor', function (c) {
    if (!c) { return null; }
    return new lively.paint.LinearGradient([new lively.paint.Stop(0, c),
                                            new lively.paint.Stop(1, c.lighter())],
                                           lively.paint.LinearGradient.SouthNorth);
  });

  add.method('newMorph', function (shape) {
    return new Morph(shape || lively.scene.Rectangle.createWithIrrelevantExtent());
  });

  add.method('currentWorld', function () {
    return WorldMorph.current();
  });

  add.creator('shapeFactory', {});

  add.data('isZoomingEnabled', true);

  add.data('shouldMirrorsUseZooming', true);

  add.data('debugMode', false);

});


thisModule.addSlots(avocado.livelyKernelUI.shapeFactory, function(add) {

  add.method('newRectangle', function (rectangle) {
    return new lively.scene.Rectangle(rectangle || new Rectangle(0, 0, 10, 10));
  });

  add.method('newCircle', function (centre, radius) {
    return new lively.scene.Ellipse(centre, radius);
  });

  add.method('newPieWedge', function (thetaA, thetaC, innerRadius, outerRadius) {
    var thetaB = (thetaA + thetaC) / 2;
    var p0    = Point.polar(innerRadius, thetaA);
    var p1    = Point.polar(innerRadius, thetaC);
    var ctrl1 = Point.polar(innerRadius * 1.05, thetaB);
    var p2    = Point.polar(outerRadius, thetaA);
    var p3    = Point.polar(outerRadius, thetaC);
    var ctrl2 = Point.polar(outerRadius * 1.05, thetaB);
		var g = lively.scene;
		var cmds = [];
		cmds.push(new g.MoveTo(true, p0.x,  p0.y));
		cmds.push(new g.QuadCurveTo(true, p1.x, p1.y, ctrl1.x, ctrl1.y));
		cmds.push(new g.LineTo(true, p3.x,  p3.y));
		cmds.push(new g.QuadCurveTo(true, p2.x, p2.y, ctrl2.x, ctrl2.y));
		cmds.push(new g.LineTo(true, p0.x,  p0.y));
		return new g.Path(cmds);
  }, {category: ['layout']});

  add.method('newPolygon', function (vertices) {
    return new lively.scene.Polygon(vertices);
  });

  add.method('newPolyLine', function (vertices) {
    return new lively.scene.Polyline(vertices);
  });

});


});
