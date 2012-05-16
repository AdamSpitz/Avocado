avocado.transporter.module.create('general_ui/history_morph', function(requires) {

requires('core/history');
requires('general_ui/table_layout');

}, function(thisModule) {


thisModule.addSlots(avocado.history, function(add) {

  add.method('newMorph', function () {
    var m = avocado.table.newColumnMorph().setModel(this);
    m.applyStyle(this.defaultMorphStyle);

    var nameLabel = m.createNameLabel();
    
    m.potentialContentMorphs = function() {
      var rows = [nameLabel];
      var latest = m._model.latest();
      if (latest !== null && typeof(latest) !== 'undefined') {
        rows.push(avocado.ui.currentWorld().morphFor(latest));
      } else {
        rows.push(avocado.messageNotifier.create("None", new Color(0.2, 0.5, 0.5)).newMorph());
      }
      return avocado.table.contents.createWithColumns([rows]);
    };
    
    m.refreshContentOfMeAndSubmorphs();
    return m;
  }, {category: ['user interface']});

  add.creator('defaultMorphStyle', Object.create(avocado.table.boxStyle), {category: ['user interface']});

});


thisModule.addSlots(avocado.history.defaultMorphStyle, function(add) {

  add.data('fillBase', new Color(0.2, 0.5, 0.5));

});


});
