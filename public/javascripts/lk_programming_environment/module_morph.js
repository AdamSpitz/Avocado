transporter.module.create('lk_programming_environment/module_morph', function(requires) {

requires('lk_ext/shortcuts');
requires('lk_ext/rows_and_columns');
requires('transporter/transporter');

}, function(thisModule) {


thisModule.addSlots(transporter.module, function(add) {

  add.method('newMorph', function () {
    var m = new avocado.RowMorph().setModel(this).applyStyle(this.defaultMorphStyle);
    m.typeName = 'module';
    var module = this;

    var changeIndicator = TextMorph.createLabel(function() {
      if (module.modificationFlag().hasJustThisOneChanged()) { return ' has changed '; }
      // aaa - maybe it's fine to just say 'has changed' here too?
      if (module.modificationFlag().hasThisOneOrChildrenChanged()) { return ' dependencies have changed '; }
      return '';
    });
    changeIndicator.setTextColor(Color.green.darker());

    var columns = [m.createNameLabel()];
    columns.push(changeIndicator);
    this.buttonCommands().commands().each(function(c) { columns.push(c.newMorph()); });
    columns.push(m.createDismissButton());
    m.setColumns(columns);

    m.commands = function() {
      var cmdList = module.commands().wrapForMorph(m);
      var saveCmd = cmdList.itemWith("id", "save");
      if (saveCmd) {
        saveCmd.pluralLabel = 'save modules as .js files';
        saveCmd.pluralGo = transporter.fileOutPluralMorphs.bind(transporter);
      }
      return cmdList;
    };

    module.whenChangedNotify(m.updateAppearance.bind(m));
    m.startPeriodicallyUpdating();
    return m;
  }, {category: ['user interface']});

  add.creator('defaultMorphStyle', Object.create(avocado.TableMorph.boxStyle), {category: ['user interface']});

});


thisModule.addSlots(transporter.module.defaultMorphStyle, function(add) {

  add.data('fill', new lively.paint.LinearGradient([new lively.paint.Stop(0, new Color(0.9019607843137255, 0.4980392156862745, 0.4980392156862745)), new lively.paint.Stop(1, new Color(0.9529411764705882, 0.7490196078431373, 0.7490196078431373))], lively.paint.LinearGradient.SouthNorth));

});


thisModule.addSlots(transporter, function(add) {

  add.method('fileOutPluralMorphs', function (morphsAndCommands, evt) {
    // aaa - This is a hack. Come up with a more general, cleaner way of doing
    // plural commands that can handle both SelectionMorph and other mechanisms.
    morphsAndCommands.each(function(x) { x.moduleVersion = x.morph._model.currentVersion(); });
    transporter.fileOutPlural(morphsAndCommands, evt);
  }, {category: ['user interface', 'commands', 'filing out']});

});


});
