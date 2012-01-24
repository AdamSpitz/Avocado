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

  add.method('newMorphFor', function (stringSpecifier, nameOfEditCommand, emphasis) {
    var m = new avocado.TwoModeTextMorph(stringSpecifier);
    if (emphasis) { m.setEmphasis(emphasis); }
    if (nameOfEditCommand) { m.setNameOfEditCommand(nameOfEditCommand); }
    m.backgroundColorWhenWritable = null;
    m.ignoreEvents();
    return m;
  }, {category: ['user interface']});

  add.method('newMorph', function () {
    return this.newMorphFor(this._stringSpecifier, this._nameOfEditCommand, this._emphasis);
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
