transporter.module.create('core/functions', function(requires) {

}, function(thisModule) {


thisModule.addSlots(Function.prototype, function(add) {

  add.method('memoize', function () {
    // aaa - this isn't really a full memoize, it's just for functions that take no arguments
    var originalFunction = this;
    var result;
    var hasRun = false;
    return function() {
      if (! hasRun) {
        hasRun = true;
        result = originalFunction();
      }
      return result;
    };
  }, {category: ['avocado']});

});


});
