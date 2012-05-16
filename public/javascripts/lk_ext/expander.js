avocado.transporter.module.create('lk_ext/expander', function(requires) {

}, function(thisModule) {


thisModule.addSlots(avocado, function(add) {

  add.method('ExpanderMorph', function ExpanderMorph() { Class.initializer.apply(this, arguments); }, {category: ['ui']});

});


thisModule.addSlots(avocado.ExpanderMorph, function(add) {

  add.data('displayName', 'ExpanderMorph');

  add.data('superclass', ButtonMorph);

  add.data('type', 'avocado.ExpanderMorph');

  add.creator('prototype', Object.create(ButtonMorph.prototype));

});


thisModule.addSlots(avocado.ExpanderMorph.prototype, function(add) {

  add.data('constructor', avocado.ExpanderMorph);

  add.method('initialize', function ($super, expandee) {
    var s = this.defaultSideLength();
    $super(pt(0, 0).extent(pt(s, s))); // aaa - should fix ButtonMorph so that its initial shape doesn't have to be a rectangle
    var model = avocado.booleanHolder.containing(false);
    this.connectModel({model: model, getValue: "isChecked", setValue: "setChecked"});
    this._expandee = expandee;
    model.addObserver(function() {if (this._expandee && this._expandee.world()) { this._expandee.refreshContentOfMeAndSubmorphs(); }}.bind(this));
    return this;
  });

  add.data('toggle', true, {category: ['toggling']});

  add.data('styleClass', ['button', 'expander'], {category: ['style'], initializeTo: '[\'button\', \'expander\']'});

  add.data('focusHaloBorderWidth', 0, {category: ['style'], comment: 'I don\'t like the halo'});

  add.method('defaultSideLength', function () { return 12 * (Config.fatFingers ? 2 : 1); });

  add.method('getHelpText', function () { return (this.isExpanded() ? 'Collapse' : 'Expand') + ' me'; });

  add.method('verticesForValue', function (value) {
    var s = this.defaultSideLength();
    return value ? [pt(0,0), pt(s,0), pt(s/2, s), pt(0,0)] : [pt(0,0), pt(s, s/2), pt(0,s), pt(0,0)];
  });

  add.method('changeAppearanceFor', function ($super, value) {
    if (this.shape.setVertices) {
      this.shape.setVertices(this.verticesForValue(value));
    } else {
      var oldStyle = this.makeStyleSpec();
      this.setShape(new lively.scene.Polygon(this.verticesForValue(false)));
      this.applyStyle(oldStyle); // workaround for ButtonMorphs having to start off being a rectangle
    }
    // $super(value); // Messes things up, I think. -- Adam;
  });

  add.method('isExpanded', function () {return !!this.getModel().getValue();});

  add.method('setExpanded', function (b) {if (this.isExpanded() !== !!b) {this.setValue(!!b); this.updateView("all");}});

  add.method('constructUIStateMemento', function () {
    return this.isExpanded();
  });

  add.method('assumeUIState', function (uiState, callWhenDone, evt) {
    this.setExpanded(uiState);
    if (callWhenDone) { callWhenDone(); }
  });

});


thisModule.addSlots(DisplayThemes.lively, function(add) {

  add.creator('expander', {}, {category: ['expanders']});

});


thisModule.addSlots(DisplayThemes.lively.expander, function(add) {

  add.data('fill', new lively.paint.LinearGradient([new lively.paint.Stop(0, new Color(0.75, 0.75, 0.95)), new lively.paint.Stop(1, new Color(0.5, 0.5, 0.9))]), {initializeTo: 'new lively.paint.LinearGradient([new lively.paint.Stop(0, new Color(0.75, 0.75, 0.95)), new lively.paint.Stop(1, new Color(0.5, 0.5, 0.9))])'});

});


});
