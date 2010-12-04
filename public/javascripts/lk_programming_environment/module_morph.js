transporter.module.create('lk_programming_environment/module_morph', function(requires) {

requires('lk_ext/rows_and_columns');
requires('transporter/transporter');

}, function(thisModule) {


thisModule.addSlots(transporter.module, function(add) {

  add.method('newMorph', function () {
    var m = Morph.createBox(this, Color.red.lighter());
    var module = this;
    m._module = module;

    var changeIndicator = TextMorph.createLabel(function() { return module.hasChangedSinceLastFileOut() ? ' has changed ' : ''; });
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

});


thisModule.addSlots(transporter, function(add) {

  add.method('fileOutPluralMorphs', function (morphsAndCommands, evt) {
    // aaa - This is a hack. Come up with a more general, cleaner way of doing
    // plural commands that can handle both SelectionMorph and other mechanisms.
    morphsAndCommands.each(function(x) { x.module = x.morph._module; });
    transporter.fileOutPlural(morphsAndCommands, evt);
  }, {category: ['user interface', 'commands', 'filing out']});

});


});
