// Just load the darned test framework.
require('lively.TestFramework').toRun(function() {});

// Oh, and add a couple of things to make it easier to use the framework
// in a prototype-based way instead of a class-based way.
Object.extend(TestCase.prototype, {
  create: function(testResult, optTestSelector) {
    return Object.newChildOf(this, testResult, optTestSelector);
  },

  name: function() {
    return reflect(this).name();
  },

  createTests: function() {
    return this.allTestSelectors().collect(function(sel) {
      return this.create(this.result, sel);
    }, this);
  },
	
  allTestSelectors: function() {
    var functionNames = [];
    for (var name in this) {
      if (name.startsWith('test') && typeof this[name] === 'function') {
        functionNames.push(name);
      }
    }
    return functionNames;
  }
});
