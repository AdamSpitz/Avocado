avocado.transporter.module.create('lk_programming_environment/process_morph', function(requires) {

requires('lk_ext/rows_and_columns');
requires('reflection/process');
requires('lk_programming_environment/slot_morph');

}, function(thisModule) {


thisModule.addSlots(avocado.process, function(add) {

  add.method('newMorph', function () {
    var m = avocado.TableMorph.newColumn().setModel(this).applyStyle(this.defaultMorphStyle);
    m._numberToShow = 0;
    m._hasMore = true;

    var headerRow = avocado.RowMorph.createSpaceFilling([m.createNameLabel(), Morph.createSpacer(), m.createDismissButton()]);
    
    var world = WorldMorph.current();
    var contentColumn = avocado.TableMorph.newColumn().beInvisible();
    contentColumn.potentialContent = function () {
      var rows = [];
      var c = m._model.leafContext();
      for (var i = 0, n = m._numberToShow; c && i < n; ++i) {
        rows.push(world.morphFor(c));
        c = c.callerContext();
      }
      m._hasMore = !!c;
      moreOrLessRow.refreshContentOfMeAndSubmorphs();
      return avocado.tableContents.createWithColumns([rows]);
    };
    
    var moreButton = avocado.command.create('More', function(evt) { m._numberToShow += 10; contentColumn.refreshContent(); }).newMorph();
    var moreOrLessRow = avocado.RowMorph.createSpaceFilling([
      Morph.createSpacer(),
      Morph.createOptionalMorph(moreButton, function() { return m._hasMore; }),
      Morph.createSpacer()
    ]).setPadding(3);
    
    m.setRows([headerRow, contentColumn, moreOrLessRow]);
    
    m._numberToShow = 10;
    m.refreshContentOfMeAndSubmorphs();
    return m;
  }, {category: ['user interface']});

  add.creator('defaultMorphStyle', Object.create(avocado.TableMorph.boxStyle), {category: ['user interface']});

});


thisModule.addSlots(avocado.process.context, function(add) {

  add.method('newMorph', function () {
    var slot = this.functionMirror().probableCreatorSlot();
    if (! slot) { slot = reflect({ unknownFunction: this.rawFunction() }).slotAt('unknownFunction'); }
    var contextSlot = Object.create(slot);
    contextSlot._processContext = this;
    var slotMorph = new avocado.process.context.Morph(contextSlot);
    slotMorph.applyStyle(this.defaultMorphStyle);
    var m = avocado.RowMorph.createSpaceFilling([slotMorph]);
    m._model = this;
    return m;
  }, {category: ['user interface']});

  add.creator('defaultMorphStyle', {}, {category: ['user interface']});

  add.method('Morph', function Morph() { Class.initializer.apply(this, arguments); }, {category: ['user interface']});

});


thisModule.addSlots(avocado.process.context.Morph, function(add) {

  add.data('superclass', avocado.slots['abstract'].Morph);

  add.data('type', 'avocado.process.context.Morph');

  add.data('pointer', avocado.slots['abstract'].Morph.pointer);

  add.creator('prototype', Object.create(avocado.slots['abstract'].Morph.prototype));

});


thisModule.addSlots(avocado.process.context.Morph.prototype, function(add) {

  add.data('constructor', avocado.process.context.Morph);

  add.method('descriptionMorph', function () {
    var m = avocado.TableMorph.newRow().beInvisible();
    var columns = [this.nameMorph()];
    var context = this._model._processContext;
    var args = context.args();
    var argNames = context.argNames();
    if (args.length > argNames.length) {
      columns.push(context.commandToGrabAllArgs().newMorph());
    } else {
      for (var i = 0, n = args.length; i < n; ++i) {
        columns.push(context.commandToGrabArg(i).newMorph());
      }
    }
    m.setColumns(columns);
    return m;
  }, {category: ['signature']});

});


thisModule.addSlots(avocado.process.defaultMorphStyle, function(add) {

  add.data('fill', new lively.paint.LinearGradient([new lively.paint.Stop(0, new Color(0.4980392156862745, 0.9019607843137255, 0.4980392156862745)), new lively.paint.Stop(1, new Color(0.7490196078431373, 0.9529411764705882, 0.7490196078431373))], lively.paint.LinearGradient.SouthNorth));

});


thisModule.addSlots(avocado.process.context.defaultMorphStyle, function(add) {

  add.data('horizontalLayoutMode', avocado.LayoutModes.SpaceFill);

});


});
