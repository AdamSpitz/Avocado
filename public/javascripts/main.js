transporter.startAvocado(function(world) {
  // can add code here for stuff that should happen after the Avocado world loads
  new avocado.MessageNotifierMorph("Right-click the background to start", Color.green).ignoreEvents().showTemporarilyInCenterOfWorld(world);
});
