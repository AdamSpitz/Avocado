avocado.transporter.module.create('lk_ext/message_notifier', function(requires) {

requires('general_ui/message_notifier');
requires('general_ui/table_layout');

}, function(thisModule) {


thisModule.addSlots(avocado.label, function(add) {
  
  add.method('newMorphWithInitialText', function(initialText, pos, extent) {
    var tf = new TextMorph((pos || pt(5, 10)).extent(extent || pt(0, 0)), initialText);
    tf.acceptInput = false;
    tf.closeDnD();
    tf.beLabel();

    return tf;
  }, {category: ['user interface']});

});


thisModule.addSlots(avocado.infrequentlyEditedText, function(add) {

  add.method('newMorph', function () {
    var m = new avocado.TwoModeTextMorph(this._stringSpecifier);
    if (this._emphasis) { m.setEmphasis(this._emphasis); }
    if (this._nameOfEditCommand) { m.setNameOfEditCommand(this._nameOfEditCommand); }
    m.backgroundColorWhenWritable = null;
    m.ignoreEvents();
    return m;
  }, {category: ['user interface']});

});


thisModule.addSlots(Error.prototype, function(add) {

  add.method('newMorph', function () {
    return avocado.treeNode.newMorphFor(this, this.defaultMorphStyle);
  }, {category: ['user interface']});

  add.creator('defaultMorphStyle', Object.create(avocado.table.boxStyle), {category: ['user interface']});

});


thisModule.addSlots(Error.prototype.defaultMorphStyle, function(add) {
  
  add.data('fillBase', new Color(1, 0, 0));
  
});


});
