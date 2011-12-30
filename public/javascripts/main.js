avocado.transporter.startAvocado(function(world) {
  // can add code here for stuff that should happen after the Avocado world loads
  world.showMessage("Right-click the background to start");
  /*
  // aaa remove this stuff, just playing to see how 3D coordinates work
  var o = avocado.ui.newMorph(avocado.ui.shapeFactory.newBox(100, 100, 10, pt3D(0, 0, 0)));
  var m = avocado.ui.newMorph(avocado.ui.shapeFactory.newBox(50, 10, 10, pt3D(0, 0, 0)));
  o.setFill(Color.red);
  avocado.ui.currentWorld().addMorph(o);
  o.addMorph(m);
  o.setCenterPosition(pt3D(-75, -25, 0));
  m.setTopLeftPosition(pt3D(-50, -50, 30));
  */
});
