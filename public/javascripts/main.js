avocado.transporter.startAvocado(function(world) {
  world.setFill(Color.white);
  
  avocado.shouldBreakCreatorSlotsInOrderToImprovePerformance = true;
    
  // can add code here for stuff that should happen after the Avocado world loads
  
  avocado.applicationList.applications().forEach(function(app) {
    if (app.initializeWorld) { app.initializeWorld(world); }
  });

  world.showMessage((UserAgent.isTouch ? "Long-touch" : "Right-click") + " the background to start");
  
});
