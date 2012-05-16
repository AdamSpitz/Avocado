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

  add.method('remove', function (element) {
    var i = this.indexOf(element);
    if (i < 0) { return false; }
    this.splice(i, 1);
    return true;
  }, {category: ['transforming']});

  add.method('isEmpty', function () {
    return this.length === 0;
  }, {category: ['testing']});

});


});
