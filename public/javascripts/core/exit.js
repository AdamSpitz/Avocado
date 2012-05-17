avocado.transporter.module.create('core/exit', function(requires) {

requires('core/testFramework');

}, function(thisModule) {


thisModule.addSlots(window, function(add) {

  add.method('exitValueOf', function (f) {
    var exitToken = {};
    var exiter = function(v) {
      exitToken.value = v;
      throw exitToken;
    };
    try {
      return f(exiter);
    } catch (exc) {
      if (exc === exitToken) {
        return exc.value;
      } else {
        // must be some other exception
        throw exc;
      }
    }
  }, {category: ['avocado', 'control flow']});

});


thisModule.addSlots(exitValueOf, function(add) {

  add.data('displayName', 'exitValueOf');

  add.creator('tests', Object.create(avocado.testCase), {category: ['tests']});

  add.creator('prototype', {});

});


thisModule.addSlots(exitValueOf.tests, function(add) {

  add.method('testNotExiting', function () {
    this.assertEqual(7, exitValueOf(function(exit) { return 7; }));
  });

  add.method('testExiting', function () {
    this.assertEqual(6, exitValueOf(function(exit) { exit(6); return 7; }));
  });

  add.method('testExitingFromInsideAFunction', function () {
    this.assertEqual('good', exitValueOf(function(exit) {
      [1, 2, 3, 4, 5, 6, 7, 8, 9].each(function(n) { if (n === 4) { exit('good'); } });
      return 'no good';
    }));
  });

});


});
