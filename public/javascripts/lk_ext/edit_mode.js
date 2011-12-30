avocado.transporter.module.create('lk_ext/edit_mode', function(requires) {

}, function(thisModule) {


thisModule.addSlots(Morph.prototype, function(add) {

  add.method('isInEditMode', function () {
    return this._isInEditMode;
  }, {category: ['edit mode']});

  add.method('switchEditModeOn', function () {
    if (this.isInEditMode()) { return; }
    this._isInEditMode = true;
    this.suppressHandles = false;
    this.openDnD();
    this.startUsingEditModeLayoutManager();
    this.eachSubmorph(function(m) { m.switchEditModeOn(); });
    return this;
  }, {category: ['edit mode']});

  add.method('switchEditModeOff', function () {
    if (! this.isInEditMode()) { return; }
    delete this._isInEditMode;
    this.suppressHandles = true;
    this.closeDnD();
    this.stopUsingEditModeLayoutManager();
    this.eachSubmorph(function(m) { m.switchEditModeOff(); });
    return this;
  }, {category: ['edit mode']});

  add.creator('editModeLayoutManagerTraits', {}, {category: ['edit mode']});

  add.method('startUsingEditModeLayoutManager', function () {
    this.layoutManager = Object.extend(Object.create(this.layoutManager), this.editModeLayoutManagerTraits);
    reflect(this).slotAt('layoutManager').beCreator();
  }, {category: ['edit mode']});

  add.method('stopUsingEditModeLayoutManager', function () {
    this.layoutManager = this.layoutManager['__proto__'];
  }, {category: ['edit mode']});

});


thisModule.addSlots(Morph.prototype.editModeLayoutManagerTraits, function(add) {

  add.method('beforeAddMorph', function (supermorph, submorph, isFront) {
    submorph.setPosition(submorph.getPosition().roundTo(10));
  });

});


});
