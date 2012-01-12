avocado.transporter.startAvocado(function(world) {
  // can add code here for stuff that should happen after the Avocado world loads
  world.showMessage("Right-click the background to start");
  // aaa remove this stuff, just playing to see how 3D coordinates work
  /*
  var o = avocado.ui.newMorph(avocado.ui.shapeFactory.newBox(pt3D(100, 100, 100), pt3D(0, 0, 0)));
  var m = avocado.ui.newMorph(avocado.ui.shapeFactory.newBox(pt3D( 50,  10,  10), pt3D(0, 0, 0)));
  o.setFill(Color.red);
  world.addMorph(o);
  o.setScale(0.25);
  
  o.addMorph(m);
  m.setTopLeftPosition(pt3D(-50, -50, 50));
  //o.setTopLeftPosition(pt3D(0, 0, 0));

  o.setCenterPosition(pt3D(50, 50, 50));
  m.setExtent(pt3D(0, 20, 5));
  //o.setCenterPosition(pt3D(-75, -25, 0));
  */
  /*
  world.addMorphAt(avocado.label.create('0').newMorph(), pt3D(  0,   0,   0));
  world.addMorphAt(avocado.label.create('x').newMorph(), pt3D(150,   0,   0));
  world.addMorphAt(avocado.label.create('y').newMorph(), pt3D(  0, 150,   0));
  world.addMorphAt(avocado.label.create('z').newMorph(), pt3D(  0,   0, 150));
  */
});
