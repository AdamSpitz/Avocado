transporter.module.create('lk_ext/poses', function(requires) {
  
requires('core/poses');
  
}, function(thisModule) {


thisModule.addSlots(avocado.poses, function(add) {

  add.method('addGlobalCommandsTo', function (menu) {
    // aaa - need a way to get the right world
    // aaa - LK-dependent
    WorldMorph.current().poseManager().addGlobalCommandsTo(menu);
  }, {category: ['menu']});

});


thisModule.addSlots(avocado.poses.manager, function(add) {

  add.method('world', function () {
    // aaa LK-dependent
    return WorldMorph.current();
  }, {category: ['accessing']});
  
});


thisModule.addSlots(WorldMorph.prototype, function(add) {

  add.method('poseManager', function () {
    if (! this._poseManager) {
      this._poseManager = Object.newChildOf(avocado.poses.manager);
    }
    return this._poseManager;
  }, {category: ['poses']});

  add.method('posers', function () {
    return this.allPotentialPosers().reject(function(m) { return m.shouldIgnorePoses(); });
  }, {category: ['poses']});
  
  add.method('allPotentialPosers', function() {
    return $A(this.submorphs);
  });
});


thisModule.addSlots(Morph.prototype, function(add) {

  add.method('shouldIgnorePoses', function (uiState) {
    return false;
  }, {category: ['poses']});

  add.method('constructUIStateMemento', function () {
    // override this and assumeUIState in children if you want them to be recalled in a particular state
    return null;
  }, {category: ['poses']});

  add.method('assumeUIState', function (uiState) {
    // override this and constructUIStateMemento in children if you want them to be recalled in a particular state;
  }, {category: ['poses']});

  add.method('transferUIStateTo', function (otherMorph, evt) {
    otherMorph.assumeUIState(this.constructUIStateMemento());
  }, {category: ['poses']});

});


thisModule.addSlots(MenuMorph.prototype, function(add) {

  add.method('shouldIgnorePoses', function (uiState) {
    return ! this.stayUp;
  }, {category: ['poses']});

});


});
