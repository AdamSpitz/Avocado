avocado.transporter.module.create('core/graphs', function(requires) {

requires('core/testFramework');
requires('core/collections/hash_table');

}, function(thisModule) {


thisModule.addSlots(avocado, function(add) {

  add.creator('graphs', {}, {category: ['graphs']});

});


thisModule.addSlots(avocado.graphs, function(add) {

  add.creator('directed', {});

  add.creator('tests', Object.create(avocado.testCase), {category: ['tests']});

});


thisModule.addSlots(avocado.graphs.directed, function(add) {

  add.method('create', function (roots, adjacencyFn) {
    return Object.newChildOf(this, roots, adjacencyFn);
  }, {category: ['creating']});

  add.method('initialize', function (roots, adjacencyFn) {
    this._roots = roots;
    this._adjacencyFn = adjacencyFn;
  }, {category: ['creating']});

  add.method('verticesPointedToBy', function (v) {
    return this._adjacencyFn(v);
  }, {category: ['accessing']});

  add.method('topologicalSort', function () {
    var sorted = [];
    var visited = avocado.set.copyRemoveAll();
    
    var visit = function (n) {
      if (! visited.includes(n)) {
        visited.add(n);
        this.verticesPointedToBy(n).each(function(m) {
          visit(m);
        });
        sorted.push(n);
      }
    }.bind(this);
            
    this._roots.each(function(r) { visit(r); });
    return sorted;
  }, {category: ['sorting']});

});


thisModule.addSlots(avocado.graphs.tests, function(add) {

  add.method('checkTopologicalSort', function (graph) {
    var sorted = graph.topologicalSort();
    for (var i = 0; i < sorted.length; ++i) {
      var v = sorted[i];
      var adj = graph.verticesPointedToBy(v);
      adj.each(function(adjV) {
        this.assert(sorted.indexOf(adjV) < i, "" + v + " should come before " + adjV);
      }.bind(this));
    }
  });

  add.method('testTopologicalSort', function () {
    var adjacencyLists = {
      a: ['b', 'c'],
      b: ['d'],
      c: ['d', 'e']
    };
    
    var graph = avocado.graphs.directed.create(['a'], function(v) { return adjacencyLists[v] || []; });
    this.checkTopologicalSort(graph);
  });

});


});
