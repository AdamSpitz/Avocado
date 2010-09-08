transporter.module.create('lk_ext/edit_mode', function(requires) {}, function(thisModule) {


thisModule.addSlots(Morph.prototype, function(add) {

  add.method('switchEditModeOn', function () {
    if (this.isInEditMode) { return; }
    this.isInEditMode = true;
    this.suppressHandles = false;
    this.submorphs.each(function(m) { m.switchEditModeOn(); });
  });

  add.method('switchEditModeOff', function () {
    if (! this.isInEditMode) { return; }
    delete this.isInEditMode;
    this.suppressHandles = true;
    this.submorphs.each(function(m) { m.switchEditModeOff(); });
  });

});


});
