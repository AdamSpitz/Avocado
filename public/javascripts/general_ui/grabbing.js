avocado.transporter.module.create('general_ui/grabbing', function(requires) {

requires('general_ui/basic_morph_mixins');

}, function(thisModule) {


thisModule.addSlots(avocado.morphMixins.Morph, function(add) {

  add.method('grabCopy', function (evt) {
    var newMorph = avocado.ui.worldFor(evt).morphFor(this._model.copyForGrabbing());
    newMorph.applyStyle(this.styleForWhenNotEmbeddedInAnythingElse());
    newMorph.refreshContentOfMeAndSubmorphs();
    newMorph.forceLayoutRejiggering();
    newMorph._shouldDisappearAfterCommandIsFinished = true;
    evt.hand.grabMorphWithoutAskingPermission(newMorph, evt);
    return newMorph;
  }, {category: ['drag and drop']});

  add.method('copyToNewHolderAndDropOnWorld', function (world) {
    var newModel = this._model.copyToNewHolder();
    var newHolder = newModel.holder();
    if (newHolder) {
      var newHolderMorph = world.morphFor(newHolder);
      world.addMorphAt(newHolderMorph, this.position());
      avocado.ui.ensureVisible(newModel);
      newHolderMorph.refreshContentOfMeAndSubmorphs();
    } else {
      var newMorph = world.morphFor(newModel);
      world.addMorphAt(newMorph, this.position());
      newMorph.refreshContentOfMeAndSubmorphs();
    }
  }, {category: ['drag and drop']});

  add.method('wasJustDroppedOnWorld', function (world) {
    if (this._model && this._model.shouldCopyToNewHolderWhenDroppedOnWorld) {
      this.copyToNewHolderAndDropOnWorld(world);
    } else {
      // doing nothing is fine, I think...
    }
    if (this._shouldDisappearAfterCommandIsFinished) { this.remove(); }
  }, {category: ['drag and drop']});

  add.method('pullMorphsCloser', function (morphsToPull, titleContent, callWhenDone) {
    var detailsMorph = this._morphForViewingThingsInMoreDetail || this.world() || avocado.ui.currentWorld();
    var detailsMorphLayout = detailsMorph.layout();
    if (detailsMorphLayout && typeof(detailsMorphLayout.showMorphs) === 'function') {
      detailsMorphLayout.showMorphs(detailsMorph, morphsToPull, titleContent, null, callWhenDone);
    } else {
      var pm = detailsMorph.poseManager();
      pm.assumePose(pm.cleaningUpPose(morphsToPull), null, callWhenDone);
    }
  }, {category: ['pulling']});

});


});
