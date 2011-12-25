avocado.transporter.module.create('lk_ext/message_notifier', function(requires) {

requires('general_ui/message_notifier');
requires('lk_ext/rows_and_columns');

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

  add.creator('defaultMorphStyle', Object.create(avocado.TableMorph.boxStyle), {category: ['user interface']});

});


thisModule.addSlots(Error.prototype.defaultMorphStyle, function(add) {
  
  add.data('fill', new lively.paint.LinearGradient([new lively.paint.Stop(0, new Color(1, 0, 0)), new lively.paint.Stop(1, new Color(1, 0.2, 0.2))], lively.paint.LinearGradient.SouthNorth));
  
});


});
