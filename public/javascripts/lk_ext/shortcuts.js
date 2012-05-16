avocado.transporter.module.create('lk_ext/shortcuts', function(requires) {

}, function(thisModule) {


thisModule.addSlots(TextMorph, function(add) {

  add.method('createInputBox', function (initialText, extent) {
    var tm = new this(pt(5, 10).extent(extent || pt(50, 20)), initialText || "");
    tm.closeDnD();
    tm.suppressHandles = true;
    return tm;
  }, {category: ['shortcuts']});

});


thisModule.addSlots(ButtonMorph, function(add) {

  add.creator('simpleModelPlug', {}, {category: ['shortcuts']});

  add.method('createButton', function (contents, f, padding, labelPos) {
    var contentsMorph = (typeof contents === 'string' || typeof contents === 'function') ? avocado.label.newMorphFor(contents) : contents;
    var p = (padding !== null && padding !== undefined) ? padding : 5;
    if (Config.fatFingers) { p = Math.max(p, 10); }
    var b = new ButtonMorph(pt(0,0).extent(contentsMorph.bounds().extent().addXY(p * 2, p * 2)));
    b.run = f;
    reflect(b).slotAt('run').beCreator();
    b.addMorphAt(contentsMorph, labelPos || pt(p, p));

    var plugSpec = {
      model: Object.newChildOf(ButtonMorph.simpleModelPlug, b),
      getValue: "getValue",
      setValue: "setValue"
    };
    reflect(plugSpec).slotAt('model').beCreator();

    b.connectModel(plugSpec);
    return b;
  }, {category: ['shortcuts']});

});


thisModule.addSlots(ButtonMorph.simpleModelPlug, function(add) {

  add.method('initialize', function (m) { this.morph = m; });

  add.data('Value', null);

  add.method('getValue', function () { return this.Value; });

  add.method('setValue', function (v) { this.Value = v; if (!v) { this.morph.run(Event.createFake()); } });

});


thisModule.addSlots(DisplayThemes.lively.button, function(add) {

  add.data('fill', new lively.paint.LinearGradient([new lively.paint.Stop(0, new Color(0.9019607843137255, 0.9019607843137255, 0.9019607843137255)), new lively.paint.Stop(1, new Color(0.4, 0.4, 0.4))], lively.paint.LinearGradient.NorthSouth));

  add.data('openForDragAndDrop', false);

});


thisModule.addSlots(Event, function(add) {

  add.method('createFake', function (hand) {
    hand = hand || WorldMorph.current().firstHand();
    return {
      hand: hand,
      isShiftDown: Functions.False,
      isForContextMenu: Functions.False,
      isForMorphMenu: Functions.False,
      isForGrabbing: function() {
        return this.type !== 'MouseMove' && !this.isForMorphMenu() && !this.isForContextMenu();
      },
      point: function() { return this.mousePoint || this.hand.getPosition(); }
    };
  }, {category: ['shortcuts']});

});


thisModule.addSlots(ButtonMorph.prototype, function(add) {

  add.method('simulatePress', function (evt) {
    this.onMouseDown(evt);
    this.onMouseUp(evt);
  }, {category: ['shortcuts']});

});


thisModule.addSlots(Morph.prototype, function(add) {

  add.method('wrappedInScrollPaneIfNecessaryToFitWithin', function (maxExtent) {
    if (this.getExtent().y <= maxExtent.y) { return this; }
    return ScrollPane.containing(this, maxExtent);
  }, {category: ['scrolling']});

});


thisModule.addSlots(ScrollPane, function(add) {

  add.method('containing', function (morph, extent) {
    var sp = new this(morph, extent.extentAsRectangle());
    sp.closeDnD();
    sp.clipMorph.closeDnD();
    sp.adjustForNewBounds();
    return sp;
  }, {category: ['shortcuts']});

});


});
