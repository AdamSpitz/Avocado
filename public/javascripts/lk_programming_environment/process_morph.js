avocado.transporter.module.create('lk_programming_environment/process_morph', function(requires) {

requires('general_ui/table_layout');
requires('reflection/process');
requires('programming_environment/slot_morph');

}, function(thisModule) {


thisModule.addSlots(avocado.process, function(add) {

  add.method('newMorph', function () {
    var m = avocado.table.newColumnMorph().setModel(this).applyStyle(this.defaultMorphStyle);
    m._numberToShow = 0;
    m._hasMore = true;

    var headerRow = avocado.table.createSpaceFillingRowMorph([m.createNameLabel(), avocado.ui.createSpacer(), m.createDismissButton()]);
    
    var world = WorldMorph.current();
    var contentColumn = avocado.table.newColumnMorph().beInvisible();
    contentColumn.setPotentialContentMorphsFunction(function () {
      var rows = [];
      var c = m._model.leafContext();
      for (var i = 0, n = m._numberToShow; c && i < n; ++i) {
        rows.push(world.morphFor(c));
        c = c.callerContext();
      }
      m._hasMore = !!c;
      moreOrLessRow.refreshContentOfMeAndSubmorphs();
      return avocado.table.contents.createWithColumns([rows]);
    });
    
    var moreButton = avocado.command.create('More', function(evt) { m._numberToShow += 10; contentColumn.refreshContent(); }).newMorph();
    var moreOrLessRow = avocado.table.createSpaceFillingRowMorph([
      avocado.ui.createSpacer(),
      avocado.table.createOptionalMorph(moreButton, function() { return m._hasMore; }),
      avocado.ui.createSpacer()
    ]).applyStyle({padding: 3});
    
    m.layout().setCells([headerRow, contentColumn, moreOrLessRow]);
    
    m._numberToShow = 10;
    m.refreshContentOfMeAndSubmorphs();
    return m;
  }, {category: ['user interface']});

  add.creator('defaultMorphStyle', Object.create(avocado.table.boxStyle), {category: ['user interface']});

});


thisModule.addSlots(avocado.process.defaultMorphStyle, function(add) {

  add.data('fillBase', new Color(0.5, 0.9, 0.5));

});


thisModule.addSlots(avocado.process.context, function(add) {

  add.method('newMorph', function () {
    var slot = this.functionMirror().probableCreatorSlot();
    if (! slot) { slot = reflect({ unknownFunction: this.rawFunction() }).slotAt('unknownFunction'); }
    var contextSlot = Object.create(slot);
    contextSlot._processContext = this;
    var slotMorph = avocado.slots.userInterface.newMorphFor(contextSlot);
    slotMorph.applyStyle(this.defaultMorphStyle);
    var m = avocado.table.createSpaceFillingRowMorph([slotMorph]);
    m._model = this;
    return m;
  }, {category: ['user interface']});

  add.method('createDescriptionMorphFor', function (slotMorph) {
    var m = avocado.table.newRowMorph().beInvisible();
    var columns = [slotMorph.findOrCreateTitleLabel()];
    var context = this._processContext;
    var args = context.args();
    var argNames = context.argNames();
    if (args.length > argNames.length) {
      columns.push(context.commandToGrabAllArgs().newMorph());
    } else {
      for (var i = 0, n = args.length; i < n; ++i) {
        columns.push(context.commandToGrabArg(i).newMorph());
      }
    }
    m.layout().setCells(columns);
    return m;
  }, {category: ['user interface']});

  add.creator('defaultMorphStyle', {}, {category: ['user interface']});

});


thisModule.addSlots(avocado.process.context.defaultMorphStyle, function(add) {

  add.data('horizontalLayoutMode', avocado.LayoutModes.SpaceFill);

});


});
