avocado.transporter.module.create('general_ui/poses', function(requires) {

requires('core/poses');
requires('general_ui/basic_morph_mixins');

}, function(thisModule) {


thisModule.addSlots(avocado.poses, function(add) {

  add.method('addGlobalCommandsTo', function (menu) {
    avocado.ui.currentWorld().poseManager().addGlobalCommandsTo(menu);
  }, {category: ['menu']});

});


thisModule.addSlots(avocado.morphMixins.Morph, function(add) {

  add.method('poseManager', function () {
    if (! this._poseManager) {
      this._poseManager = Object.newChildOf(avocado.poses.manager, this);
      reflect(this).slotAt('_poseManager').setInitializationExpression('null');
    }
    return this._poseManager;
  }, {category: ['poses']});

  add.method('posers', function () {
    return this.allPotentialPosers().reject(function(m) { return m.shouldIgnorePoses(); }).toArray();
  }, {category: ['poses']});

  add.method('allPotentialPosers', function () {
    return this.submorphEnumerator();
  });

  add.method('shouldIgnorePoses', function () {
    return false;
  }, {category: ['poses']});

  add.method('constructUIStateMemento', function () {
    // override constructUIStateMemento and assumeUIState, or uiStateParts, in children if you want them to be recalled in a particular state
    
    if (this.partsOfUIState) {
      var parts = typeof(this.partsOfUIState) === 'function' ? this.partsOfUIState() : this.partsOfUIState;
      var uiState = {};
      reflect(parts).normalSlots().each(function(slot) {
        var partName = slot.name();
        var part = slot.contents().reflectee();
        if (part) {
          if (!(part.isMorph) && part.collection && part.keyOf && part.getPartWithKey) {
            uiState[partName] = part.collection.map(function(elem) {
              return { key: part.keyOf(elem), uiState: elem.constructUIStateMemento() };
            });
          } else {
            uiState[partName] = part.constructUIStateMemento();
          }
        }
      });
      return uiState;
    }
    
    return null;
  }, {category: ['poses']});

  add.method('assumeUIState', function (uiState, evt) {
    // override constructUIStateMemento and assumeUIState, or uiStateParts, in children if you want them to be recalled in a particular state

    if (this.partsOfUIState) {
      if (!uiState) { return; }
      evt = evt || Event.createFake();
      var parts = typeof(this.partsOfUIState) === 'function' ? this.partsOfUIState() : this.partsOfUIState;
      reflect(parts).normalSlots().each(function(slot) {
        var partName = slot.name();
        var part = slot.contents().reflectee();
        if (part) {
          if (!(part.isMorph) && part.collection && part.keyOf && part.getPartWithKey) {
            uiState[partName].each(function(elemKeyAndUIState) {
              part.getPartWithKey(this, elemKeyAndUIState.key).assumeUIState(elemKeyAndUIState.uiState);
            }.bind(this));
          } else {
            part.assumeUIState(uiState[partName], evt);
          }
        }
      }.bind(this));
    }
  }, {category: ['poses']});

  add.method('transferUIStateTo', function (otherMorph, evt) {
    otherMorph.assumeUIState(this.constructUIStateMemento());
  }, {category: ['poses']});

});


});
