avocado.transporter.module.create('lk_ext/types', function(requires) {

requires('general_ui/types');

}, function(thisModule) {


thisModule.addSlots(avocado.types.bool, function(add) {

  add.method('createInputMorph', function (slot) {
    return new avocado.CheckBoxMorph(slot);
  }, {category: ['input']});
  
});


thisModule.addSlots(avocado.types.longString, function(add) {

  add.method('createInputMorph', function (slot) {
    var tm = avocado.frequentlyEditedText.newMorphFor(slot);
    tm.setScale(0.3);
    tm.setFill(null);
    tm.applyStyle({horizontalLayoutMode: avocado.LayoutModes.SpaceFill, verticalLayoutMode: avocado.LayoutModes.SpaceFill});
    return ScrollPane.containing(tm, avocado.treeNode.defaultExtent());
  }, {category: ['input']});
  
});


thisModule.addSlots(avocado.types.enumeration.prompterProto, function(add) {
  
  add.method('prompt', function (caption, context, evt, callback) {
    avocado.ComboBoxMorph.prompt("Which?", "Choose", "Cancel", this._possibilities, this._possibilities.first(), callback);
  });
  
});


});
