transporter.module.create('lk_programming_environment/module_morph', function(requires) {

requires('lk_ext/rows_and_columns');
requires('transporter/transporter');

}, function(thisModule) {


thisModule.addSlots(transporter.module, function(add) {

  add.method('newMorph', function () {
    var m = new avocado.RowMorph();
    var module = this;
    m._module = module;

    m.setPadding({top: 2, bottom: 2, left: 4, right: 4, between: {x: 3, y: 3}});
    m.setFill(lively.paint.defaultFillWithColor(Color.red.lighter()));
    m.shape.roundEdgesBy(10);
    m.closeDnD();

    var nameLabel = TextMorph.createLabel(function() { return module.name(); });

    var fileOutButton = ButtonMorph.createButton('Save as .js file', module.fileOutAndReportErrors.bind(module), 2);
    var optionalFileOutButton = Morph.createOptionalMorph(fileOutButton, function() { return module.canBeFiledOut(); });
    optionalFileOutButton.refreshContent();

    var changeIndicator = TextMorph.createLabel(function() { return module.hasChangedSinceLastFileOut() ? ' has changed ' : ''; });
    changeIndicator.setTextColor(Color.green.darker());

    m.inspect = function () { return module.name(); };
    m.addCommandsTo = function(cmdList) {
      module.addCommandsTo(cmdList);
      var saveCmd = cmdList.itemWith("id", "save");
      if (saveCmd) {
        saveCmd.pluralLabel = 'save modules as .js files';
        saveCmd.pluralGo = transporter.fileOutPluralMorphs.bind(transporter);
      }
    };

    m.setColumns([nameLabel, changeIndicator, optionalFileOutButton, m.createDismissButton()]);

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
