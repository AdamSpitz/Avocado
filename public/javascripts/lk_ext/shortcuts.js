// aaa - Maybe some of this is handled by the style/theme mechanism?

lively.paint.defaultFillWithColor = function(c) {
  if (!c) { return null; }
  return new lively.paint.LinearGradient([new lively.paint.Stop(0, c),
                                          new lively.paint.Stop(1, c.lighter())],
                                         lively.paint.LinearGradient.SouthNorth);
};

TextMorph.createLabel = function(textOrFunction, pos, extent) {
  var initialText = typeof textOrFunction === 'function' ? textOrFunction() : textOrFunction || "";
  var tf = new this((pos || pt(5, 10)).extent(extent || pt(50, 20)), initialText);
  tf.acceptInput = false;
  tf.closeDnD();
  tf.beLabel();
  if (typeof textOrFunction === 'function') {
    tf.updateAppearance = tf.refreshText = function() {this.setText(textOrFunction());};
  }
  return tf;
};

ButtonMorph.createButton = function (contents, f, padding) {
  var contentsMorph = (typeof contents === 'string' || typeof contents === 'function') ? TextMorph.createLabel(contents) : contents;
  var p = (padding !== null && padding !== undefined) ? padding : 5;
  if (Config.fatFingers) { p = Math.max(p, 10); }
  var b = new ButtonMorph(pt(0,0).extent(contentsMorph.bounds().extent().addXY(p * 2, p * 2)));
  b.run = f;
  b.closeDnD();
  b.addMorphAt(contentsMorph, pt(p, p));
  b.connectModel({model: {morph: b, Value: null, getValue: function() {return this.Value;}, setValue: function(v) {this.Value = v; if (!v) {this.morph.run(Event.createFake());}}}, setValue: "setValue", getValue: "getValue"});
  return b;
};

Morph.createBox = function(obj, color) {
  var m = new avocado.RowMorph();
  m._model = obj;
  
  m.setPadding({top: 2, bottom: 2, left: 4, right: 4, between: {x: 3, y: 3}});
  m.setFill(lively.paint.defaultFillWithColor(color));
  m.shape.roundEdgesBy(10);
  m.closeDnD();

  m.inspect = function () { return this._model.inspect(); };
  
  return m;
};

Morph.prototype.createNameLabel = function() {
  return TextMorph.createLabel(function() { return this.inspect(); }.bind(this));
};

Morph.createEitherOrMorph = function(m1, m2, condition) {
  var r = new avocado.RowMorph().beInvisible();
  var t1 =  Object.newChildOf(avocado.toggler, function() {}, m1);
  var t2 =  Object.newChildOf(avocado.toggler, function() {}, m2);
  r.setPotentialColumns([t1, t2]);
  r.refreshContent = avocado.hackToMakeSuperWork(r, "refreshContent", function($super) {
    var c = condition();
    var evt = Event.createFake();
    t1.setValue(!!c, evt);
    t2.setValue( !c, evt);
    return $super();
  });
  return r;
};

Morph.createOptionalMorph = function(m, condition, layoutModes) {
  var om = Morph.createEitherOrMorph(m, new avocado.RowMorph().beInvisible(), condition);
  om.horizontalLayoutMode = (layoutModes || m).horizontalLayoutMode;
  om.verticalLayoutMode   = (layoutModes || m).verticalLayoutMode;
  return om;
};

Morph.createSpacer = function() {
  return new avocado.RowMorph().beInvisible().beSpaceFilling();
};

Event.createFake = function (hand) {
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
};

ButtonMorph.prototype.simulatePress = function(evt) {
  this.onMouseDown(evt);
  this.onMouseUp(evt);
};

ScrollPane.ifNecessaryToContain = function(morph, maxExtent) {
  if (morph.getExtent().y <= maxExtent.y) { return morph; }
  return this.containing(morph, maxExtent);
};

ScrollPane.containing = function(morph, extent) {
  var sp = new this(morph, extent.extentAsRectangle());
  sp.closeDnD();
  sp.clipMorph.closeDnD();
  sp.adjustForNewBounds();
  return sp;
};
