avocado.transporter.module.create('core/line_graph', function(requires) {

}, function(thisModule) {


thisModule.addSlots(avocado, function(add) {

  add.creator('lineGraph', {}, {category: ['graphing']});

});


thisModule.addSlots(avocado.lineGraph, function(add) {

  add.method('create', function (valuesOfLines) {
    return Object.newChildOf(this, valuesOfLines);
  }, {category: ['creating']});

  add.method('initialize', function (valuesOfLines) {
    this._lines = valuesOfLines ? valuesOfLines.map(function(values) { return avocado.lineGraph.line.create(this, values); }.bind(this)) : [];
  }, {category: ['creating']});

  add.method('lines', function () {
    return this._lines;
  }, {category: ['accessing']});

  add.creator('line', {}, {category: ['prototypes']});

});


thisModule.addSlots(avocado.lineGraph.line, function(add) {

  add.method('create', function (graph, values) {
    return Object.newChildOf(this, graph, values);
  }, {category: ['creating']});

  add.method('initialize', function (graph, values) {
    this._graph = graph;
    this._values = values;
  }, {category: ['creating']});

  add.method('values', function () {
    return this._values;
  }, {category: ['accessing']});

  add.method('min', function () {
    return this._min;
  }, {category: ['accessing']});

  add.method('max', function () {
    return this._max;
  }, {category: ['accessing']});

  add.method('numberOfValues', function () {
    return this._numberOfValues || this._values.size();
  }, {category: ['accessing']});

  add.method('addValue', function (v) {
    this._values.push(v);
    avocado.ui.justChanged(this._graph);
  }, {category: ['accessing']});

  add.method('determineMinAndMax', function () {
    var min, max;
    var i = 0;
    this.values().forEach(function(v) {
      if (typeof(min) === 'undefined' || v < min) { min = v; }
      if (typeof(max) === 'undefined' || v > max) { max = v; }
      ++i;
    });
    if (typeof(min) === 'undefined') { min = 0; }
    if (typeof(max) === 'undefined' || min === max) { max = min + 100; }
    this._min = min;
    this._max = max;
    this._numberOfValues = i;
  }, {category: ['scale']});

});


});
