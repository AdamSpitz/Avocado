avocado.transporter.module.create('programming_environment/module_morph', function(requires) {

requires('general_ui/table_layout');
requires('transporter/transporter');

}, function(thisModule) {


thisModule.addSlots(avocado.transporter.module, function(add) {

  add.method('newMorph', function () {
    var m = avocado.table.newRowMorph().setModel(this).applyStyle(this.defaultMorphStyle);
    m.typeName = 'module';

    var changeIndicator = avocado.label.newMorphFor(function() {
      var module = this.ownerWithAModel()._model;
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
    m.layout().setCells(columns);

    m.commands = function() {
      var module = this.ownerWithAModel()._model;
      var cmdList = module.commands().wrapForMorph(m);
      var saveCmd = cmdList.itemWith("id", "save");
      if (saveCmd) {
        saveCmd.pluralLabel = 'save modules as .js files';
        saveCmd.pluralGo = avocado.transporter.fileOutPluralMorphs.bind(avocado.transporter);
      }
      return cmdList;
    };

    this.whenChangedNotify(m.refreshContentIfOnScreenOfMeAndSubmorphs.bind(m));
    m.startPeriodicallyUpdating();
    return m;
  }, {category: ['user interface']});

  add.creator('defaultMorphStyle', Object.create(avocado.table.boxStyle), {category: ['user interface']});

});


thisModule.addSlots(avocado.transporter.module.defaultMorphStyle, function(add) {

  add.data('fillBase', new Color(0.9, 0.5, 0.5));

});


thisModule.addSlots(avocado.transporter, function(add) {

  add.method('fileOutPluralMorphs', function (morphsAndCommands, evt) {
    // aaa - This is a hack. Come up with a more general, cleaner way of doing
    // plural commands that can handle both SelectionMorph and other mechanisms.
    morphsAndCommands.each(function(x) { x.moduleVersion = x.morph._model.currentVersion(); });
    avocado.transporter.fileOutPlural(morphsAndCommands, evt);
  }, {category: ['user interface', 'commands', 'filing out']});

});


});
