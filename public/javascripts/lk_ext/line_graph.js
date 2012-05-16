avocado.transporter.module.create('lk_ext/line_graph', function(requires) {

requires('core/line_graph');

}, function(thisModule) {


thisModule.addSlots(avocado.lineGraph, function(add) {

  add.method('newMorph', function () {
    return new this.Morph(this);
  }, {category: ['user interface']});

  add.method('Morph', function Morph() { Class.initializer.apply(this, arguments); }, {category: ['user interface']});

});


thisModule.addSlots(avocado.lineGraph.Morph, function(add) {

  add.data('displayName', 'Morph');

  add.data('superclass', Morph);

  add.data('type', 'avocado.lineGraph.Morph');

  add.creator('prototype', Object.create(Morph.prototype));

});


thisModule.addSlots(avocado.lineGraph.Morph.prototype, function(add) {

  add.data('constructor', avocado.lineGraph.Morph);

  add.method('initialize', function ($super, g) {
    $super(new lively.scene.Rectangle(new Rectangle(0, 0, 400, 200)));
    this.setModel(g);
    this.refreshContentOfMeAndSubmorphs();
  }, {category: ['creating']});

  add.method('createLineMorph', function (line) {
    line.determineMinAndMax();
    var range = line.max() - line.min();
    var morphExtent = this.getExtent();
    var padding = 5;
    var i = 0;
    var m = new Morph(new lively.scene.Polyline(line.values().map(function(v) {
      ++i;
      return pt(padding + ((morphExtent.x - padding - padding) * i / line.numberOfValues()), morphExtent.y - (padding + (v - line.min()) * (morphExtent.y - padding - padding) / range));
    })));
    m.applyStyle(this.lineStyle);
    return m;
  }, {category: ['updating']});

  add.method('refreshContent', function () {
    if (this._lineMorphs) { this._lineMorphs.forEach(function(m) { m.remove(); }); }
    this._lineMorphs = this._model.lines().map(function(line) { return this.createLineMorph(line); }.bind(this));
    this._lineMorphs.forEach(function(m) { this.addMorph(m); }.bind(this));
  }, {category: ['updating']});

  add.creator('style', {}, {category: ['styles']});

  add.creator('lineStyle', {}, {category: ['styles']});

});


thisModule.addSlots(avocado.lineGraph.Morph.prototype.style, function(add) {

  add.data('fill', new Color(1, 1, 1));

});


thisModule.addSlots(avocado.lineGraph.Morph.prototype.lineStyle, function(add) {

  add.data('borderColor', new Color(0, 0, 0));

  add.data('borderWidth', 1);

  add.data('fill', null);

  add.data('suppressGrabbing', true);

  add.data('openForDragAndDrop', false);

  add.data('shouldIgnoreEvents', true);

});


});
