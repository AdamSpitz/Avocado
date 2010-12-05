transporter.module.create('lk_programming_environment/module_morph', function(requires) {

requires('lk_ext/shortcuts');
requires('lk_ext/rows_and_columns');
requires('transporter/transporter');

}, function(thisModule) {


thisModule.addSlots(transporter.module, function(add) {

  add.method('newMorph', function () {
    var m = new avocado.RowMorph().setModel(this).applyStyle(this.defaultMorphStyle);
    var module = this;

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
  
  add.creator('defaultMorphStyle', Object.create(Morph.boxStyle), {category: ['user interface']});

});


thisModule.addSlots(transporter.module.defaultMorphStyle, function(add) {
  
  add.data('fill', lively.paint.defaultFillWithColor(Color.red.lighter()));

});


thisModule.addSlots(transporter, function(add) {

  add.method('fileOutPluralMorphs', function (morphsAndCommands, evt) {
    // aaa - This is a hack. Come up with a more general, cleaner way of doing
    // plural commands that can handle both SelectionMorph and other mechanisms.
    morphsAndCommands.each(function(x) { x.module = x.morph._model; });
    transporter.fileOutPlural(morphsAndCommands, evt);
  }, {category: ['user interface', 'commands', 'filing out']});

});


});
