avocado.transporter.startAvocado(function(world) {
  // can add code here for stuff that should happen after the Avocado world loads
  // world.showMessage("Right-click the background to start");
  
  // aaa remove this, just for testing the new placeholder stuff
  avocado.ui.showCentered(reflect({x: 3, s: 'argle bargle', o: {hello: 'Hello!'}}), function(m) {
    m.refreshContentOfMeAndSubmorphs();
  });
  

  /*
  // aaa remove this stuff, just playing to see how 3D coordinates work
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
  var canvas = document.createElement("canvas");
  var canvasContext = canvas.getContext("2d");
  canvas.width  = 128;
  canvas.height = 128;
  canvasContext.shadowColor = "#000";
  canvasContext.shadowBlur = 7;
  canvasContext.fillStyle = "orange";
  canvasContext.font = "30pt arial bold";
  canvasContext.fillText('Test', 10, 64);
  
  var cm = avocado.ui.newMorph(avocado.ui.shapeFactory.newCanvas(canvas));
  world.addMorph(cm);
  */
  
  /*
  var str = "Abcdefghij";
  var tm = avocado.ui.newMorph(avocado.ui.shapeFactory.newTextEditor(str, 16, Color.black, true));
  tm.setPosition(pt3D(0, -40, 0));
  
  tm.setEventHandler({
    onMouseDown: function(morph, evt) {
      morph.getShape().placeCaretAtWorldPoint(evt.hit.point);
      evt.hand.setKeyboardFocus(morph);
      return true;
    },
    
    onKeyDown: function(morph, evt) {
      morph.getShape().insertStringAt(morph.getShape()._caretMesh._charCoords, evt.getKeyChar());
    },
  });
  
  world.addMorph(tm);
  */
  
  /*
  var charRowMorph = avocado.table.newRowMorph().beInvisible();
  charRowMorph.layout().setPadding({top: 0, bottom: 0, left: 3, right: 3, between: {x: 2, y: 4}});
  for (var i = 0; i < str.length; ++i) {
    var ch = str[i];
    var chMorph = avocado.ui.newMorph(avocado.ui.shapeFactory.newText(ch, 16, Color.black));
    charRowMorph.layout().addCell(chMorph);
  }
  charRowMorph.setPosition(pt3D(0, 0, 0));
  world.addMorph(charRowMorph);
  */
  
});
