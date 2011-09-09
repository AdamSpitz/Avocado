avocado.transporter.module.create('core/array_extensions', function(requires) {

}, function(thisModule) {


thisModule.addSlots(Array.prototype, function(add) {
  
  add.method('selectThenMap', function (selectFn, mapFn) {
    var a = [];
    for (var i = 0, n = this.length; i < n; ++i) {
      var o = this[i];
      if (selectFn(o)) {
        a.push(mapFn(o));
      }
    }
    return a;
  }, {category: ['transforming']});

});


});
