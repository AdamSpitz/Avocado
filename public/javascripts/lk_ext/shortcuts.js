transporter.module.create('lk_ext/shortcuts', function(requires) {

}, function(thisModule) {


thisModule.addSlots(lively.paint, function(add) {

  add.method('defaultFillWithColor', function(c) {
    if (!c) { return null; }
    return new lively.paint.LinearGradient([new lively.paint.Stop(0, c),
                                            new lively.paint.Stop(1, c.lighter())],
                                           lively.paint.LinearGradient.SouthNorth);
  }, {category: ['shortcuts']});

});


thisModule.addSlots(TextMorph, function(add) {
  
  add.method('createLabel', function(textOrFunction, pos, extent) {
    var initialText = typeof textOrFunction === 'function' ? textOrFunction() : textOrFunction || "";
    var tf = new this((pos || pt(5, 10)).extent(extent || pt(0, 0)), initialText);
    tf.acceptInput = false;
    tf.closeDnD();
    tf.beLabel();
    if (typeof textOrFunction === 'function') {
      tf.refreshText = function() {this.setText(textOrFunction());};
    }
    return tf;
  }, {category: ['shortcuts']});

  add.method('createInputBox', function(initialText, extent) {
    var tm = new this(pt(5, 10).extent(extent || pt(50, 20)), initialText || "");
    tm.closeDnD();
    tm.suppressHandles = true;
    return tm;
  }, {category: ['shortcuts']});

});


thisModule.addSlots(ButtonMorph, function(add) {
  
  add.creator('simpleModelPlug', {}, {category: ['shortcuts']});

  add.method('createButton', function (contents, f, padding) {
    var contentsMorph = (typeof contents === 'string' || typeof contents === 'function') ? TextMorph.createLabel(contents) : contents;
    var p = (padding !== null && padding !== undefined) ? padding : 5;
    if (Config.fatFingers) { p = Math.max(p, 10); }
    var b = new ButtonMorph(pt(0,0).extent(contentsMorph.bounds().extent().addXY(p * 2, p * 2)));
    b.run = f;
    reflect(b).slotAt('run').beCreator();
    b.addMorphAt(contentsMorph, pt(p, p));

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
  
  add.method('initialize', function(m) { this.morph = m; });

  add.data('Value', null);
  
  add.method('getValue', function ()  { return this.Value; });

  add.method('setValue', function (v) { this.Value = v; if (!v) { this.morph.run(Event.createFake()); } });

});


thisModule.addSlots(DisplayThemes.lively.button, function(add) {

  add.data('fill', new lively.paint.LinearGradient([new lively.paint.Stop(0, Color.gray.lighter()), new lively.paint.Stop(1, Color.gray.darker())]));
  
  add.data('openForDragAndDrop', false);
  
});


thisModule.addSlots(Morph.prototype, function(add) {
  
  add.method('createNameLabel', function() {
    return TextMorph.createLabel(function() { return this.inspect(); }.bind(this));
  }, {category: ['shortcuts']});

});


thisModule.addSlots(Morph, function(add) {
  
  add.method('createEitherOrMorph', function(m1, m2, condition) {
    // aaa - callers that are TableMorphs already should just use the new enhanced morphToggler, don't need to wrap it in this RowMorph anymore
    var r = new avocado.RowMorph().beInvisible();
    var t1 = avocado.morphToggler.create(null, m1);
    var t2 = avocado.morphToggler.create(null, m2);
    r.setPotentialColumns([t1, t2]);
    r.refreshContent = avocado.makeSuperWork(r, "refreshContent", function($super) {
      var c = condition();
      var evt = Event.createFake();
      t1.setValue(!!c, evt);
      t2.setValue( !c, evt);
      return $super();
    });
    return r;
  }, {category: ['shortcuts']});

  add.method('createOptionalMorph', function(m, condition, layoutModes) {
    var om = Morph.createEitherOrMorph(m, new avocado.RowMorph().beInvisible(), condition);
    om.horizontalLayoutMode = (layoutModes || m).horizontalLayoutMode;
    om.verticalLayoutMode   = (layoutModes || m).verticalLayoutMode;
    return om;
  }, {category: ['shortcuts']});

  add.method('createSpacer', function() {
    return new avocado.RowMorph().beInvisible().beSpaceFilling();
  }, {category: ['shortcuts']});

  add.method('wrapToTakeUpConstantWidth', function(width, morph) {
    return this.wrapToTakeUpConstantSpace(pt(width, null), morph);
  }, {category: ['shortcuts']});

  add.method('wrapToTakeUpConstantHeight', function(height, morph) {
    return this.wrapToTakeUpConstantSpace(pt(null, height), morph);
  }, {category: ['shortcuts']});

  add.method('wrapToTakeUpConstantSpace', function(space, morph) {
    var wrapper = new avocado.RowMorph().beInvisible();
    wrapper._desiredSpaceToScaleTo = space;
    wrapper.setColumns([morph]);
    return wrapper;
  }, {category: ['shortcuts']});

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
  
  add.method('simulatePress', function(evt) {
    this.onMouseDown(evt);
    this.onMouseUp(evt);
  }, {category: ['shortcuts']});

});


thisModule.addSlots(ScrollPane, function(add) {

  add.method('ifNecessaryToContain', function(morph, maxExtent) {
    if (morph.getExtent().y <= maxExtent.y) { return morph; }
    return this.containing(morph, maxExtent);
  }, {category: ['shortcuts']});

  add.method('containing', function(morph, extent) {
    var sp = new this(morph, extent.extentAsRectangle());
    sp.closeDnD();
    sp.clipMorph.closeDnD();
    sp.adjustForNewBounds();
    return sp;
  }, {category: ['shortcuts']});

});


});
