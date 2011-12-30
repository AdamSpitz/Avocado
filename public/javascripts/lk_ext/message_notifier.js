avocado.transporter.module.create('lk_ext/message_notifier', function(requires) {

requires('general_ui/message_notifier');
requires('general_ui/table_layout');

}, function(thisModule) {


thisModule.addSlots(avocado.label, function(add) {
  
  add.method('newMorph', function () {
    var m = TextMorph.createLabel(this._string);
    if (this._emphasis) { m.setEmphasis(this._emphasis); }
    return m;
  }, {category: ['user interface']});
  
});


thisModule.addSlots(Error.prototype, function(add) {

  add.method('newMorph', function () {
    return avocado.TreeNodeMorph.create(this).refreshContentOfMeAndSubmorphs().applyStyle(this.defaultMorphStyle);
  }, {category: ['user interface']});

  add.creator('defaultMorphStyle', Object.create(avocado.table.boxStyle), {category: ['user interface']});

});


thisModule.addSlots(Error.prototype.defaultMorphStyle, function(add) {
  
  add.data('fillBase', new Color(1, 0, 0));
  
});


});
