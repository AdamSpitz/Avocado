avocado.transporter.module.create('lk_ext/shortcuts', function(requires) {

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
  
  add.method('createLabel', function(textOrFunctionOrObject, pos, extent) {
    var initialText = "";
    var calculateNewText = null;
    if (textOrFunctionOrObject) {
      if (typeof textOrFunctionOrObject === 'string') {
        initialText = textOrFunctionOrObject;
      } else if (typeof textOrFunctionOrObject === 'function') {
        calculateNewText = textOrFunctionOrObject;
      } else if (typeof textOrFunctionOrObject === 'object') {
        initialText = textOrFunctionOrObject.initialText || "";
        calculateNewText = textOrFunctionOrObject.calculateNewText;
      }
    }
    
    var tf = new this((pos || pt(5, 10)).extent(extent || pt(0, 0)), initialText);
    tf.acceptInput = false;
    tf.closeDnD();
    tf.beLabel();
    
    if (calculateNewText) {
      tf.calculateNewText = calculateNewText;
      tf.refreshText = function() { this.setText(this.calculateNewText()); };
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
    // can't use "bind" because we can't transport closures, so instead use ownerWithAModel
    return TextMorph.createLabel({
      initialText: this.inspect(),
      calculateNewText: function() {
        var o = this.ownerWithAModel();
        return o ? o.inspect() : "";
      }
    });
  }, {category: ['shortcuts']});

});


thisModule.addSlots(Morph, function(add) {
  
  add.method('createEitherOrMorph', function(morphs, functionReturningTheIndexOfTheOneToShow) {
    // aaa - callers that are TableMorphs already and just need two choices should just use the new enhanced morphToggler, don't need to wrap it in this RowMorph anymore
    var r = avocado.TableMorph.newRow().beInvisible();
    r.typeName = 'either-or morph';
    var togglers = morphs.map(function(m) { return avocado.morphToggler.create(null, m); });
    r.setPotentialColumns(togglers);
    r.refreshContent = avocado.makeSuperWork(r, "refreshContent", function($super) {
      var i = functionReturningTheIndexOfTheOneToShow();
      var evt = Event.createFake();
      togglers.each(function(t, ti) {
        t.setValue(i === ti, evt);
      });
      return $super();
    });
    return r;
  }, {category: ['shortcuts']});

  add.method('createOptionalMorph', function(m, condition, layoutModes) {
    var om = Morph.createEitherOrMorph([m, avocado.TableMorph.newRow().beInvisible()], function() { return condition() ? 0 : 1; });
    om.typeName = 'optional morph';
    om.horizontalLayoutMode = (layoutModes || m).horizontalLayoutMode;
    om.verticalLayoutMode   = (layoutModes || m).verticalLayoutMode;
    return om;
  }, {category: ['shortcuts']});

  add.method('createSpacer', function() {
    return avocado.TableMorph.newRow().beInvisible().beSpaceFilling();
  }, {category: ['shortcuts']});

  add.method('wrapToTakeUpConstantWidth', function(width, morph) {
    return this.wrapToTakeUpConstantSpace(pt(width, null), morph);
  }, {category: ['shortcuts']});

  add.method('wrapToTakeUpConstantHeight', function(height, morph) {
    return this.wrapToTakeUpConstantSpace(pt(null, height), morph);
  }, {category: ['shortcuts']});

  add.method('wrapToTakeUpConstantSpace', function(space, morph) {
    var wrapper = avocado.TableMorph.newRow().beInvisible();
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
