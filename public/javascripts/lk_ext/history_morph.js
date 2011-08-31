avocado.transporter.module.create('lk_ext/history_morph', function(requires) {

requires("core/history");
requires("lk_ext/rows_and_columns");

}, function(thisModule) {


thisModule.addSlots(avocado.history, function(add) {
  
  add.method('newMorph', function () {
    var m = avocado.TableMorph.newColumn().setModel(this);
    m.applyStyle(this.defaultMorphStyle);

    var nameLabel = m.createNameLabel();
    
    m.potentialContent = function() {
      var rows = [nameLabel];
      var latest = m._model.latest();
      if (typeof(latest) !== 'undefined') { rows.push(WorldMorph.current().morphFor(latest)); }
      return avocado.tableContents.createWithColumns([rows]);
    };
    
    m.refreshContentOfMeAndSubmorphs();
    return m;
  }, {category: ['user interface']});

  add.creator('defaultMorphStyle', {}, {category: ['user interface']});
  
});


thisModule.addSlots(avocado.history.defaultMorphStyle, function(add) {

  add.data('fill', new lively.paint.LinearGradient([new lively.paint.Stop(0, new Color(0.2, 0.5, 0.5)), new lively.paint.Stop(1, new Color(0.3, 0.75, 0.75))], lively.paint.LinearGradient.SouthNorth));

});


});
