window.loadTheLKTestFramework = function() {
  require('lively.TestFramework').toRun(function() {});
};
window.loadTheLKTestFramework();



transporter.module.create('core/lk_TestFramework', function(requires) {}, function(thisModule) {


thisModule.addSlots(modules['core/lk_TestFramework'], function(add) {

  add.data('preFileInFunctionName', 'loadTheLKTestFramework');

});


thisModule.addSlots(TestCase.prototype, function(add) {

  add.method('create', function(testResult, optTestSelector) {
    return Object.newChildOf(this, testResult, optTestSelector);
  });
  
  add.method('createAndRun', function() {
    var testCase = this.create();
    testCase.runAll();
    var result = testCase.result;
    result.testCase = testCase;
    return result;
  });

  add.method('name', function() {
    return reflect(this).name();
  });

  add.method('inspect', function() {
    return this.name();
  });

  add.method('createTests', function() {
    return this.allTestSelectors().collect(function(sel) {
      return this.create(this.result, sel);
    }, this);
  });
	
  add.method('allTestSelectors', function() {
    var functionNames = [];
    for (var name in this) {
      if (name.startsWith('test') && typeof this[name] === 'function') {
        functionNames.push(name);
      }
    }
    return functionNames;
  });

  add.method('createAndRunAndShowResult', function () {
    avocado.ui.showNextTo(this, this.createAndRun(), this);
  }, {category: ['user interface', 'commands']});

  add.method('getTestCaseObject', function (evt) {
    avocado.ui.grab(reflect(this), evt);
  }, {category: ['user interface', 'commands']});

  add.method('addCommandsTo', function (cmdList) {
    cmdList.addItem({label: 'run', pluralLabel: 'run tests', go: this.createAndRunAndShowResult.bind(this)});
  
    cmdList.addLine();

    cmdList.addItem({label: 'get test case object', go: this.getTestCaseObject.bind(this)});
  }, {category: ['user interface', 'commands']});
  
});


thisModule.addSlots(TestResult.prototype, function(add) {

  add.method('totalTimeToRun', function() {
    var total = 0;
    for (var name in this.timeToRun) {
      if (this.timeToRun.hasOwnProperty(name)) {
        var t = this.timeToRun[name];
        if (typeof(t) === 'number') {
          total += t;
        }
      }
    }
    return total;
  });
  
  add.method('inspect', function() {
    return this.testCase.name() + "(" + this.totalTimeToRun() + " ms)";
  });
  
  add.method('allPassed', function() {
    return this.failed.length === 0;
  });
	
  add.method('anyFailed', function() {
    return ! this.allPassed();
  });
	
	add.method('addFailure', function(className, selector, error) {
	  // Better error message than the standard LK one.
		this.failed.push({
				classname: className,
				selector: selector,
				err: error,
				toString: function() {
          var s = avocado.stringBuffer.create(this.selector).append(" failed ");
          if (this.err.sourceURL !== undefined) {
            s.append("(").append(new URL(this.err.sourceURL).filename());
            if (this.err.line !== undefined) {
              s.append(":").append(this.err.line);
            }
            s.append("): ");
          }
          s.append(typeof(this.err.message) !== 'undefined' ? this.err.message : this.err);
          return s.toString();
        }
    });
  });

  add.method('getErrorObjects', function (evt) {
    this.failed.each(function(f) {
      avocado.ui.grab(reflect(f.err), evt);
    });
  }, {category: ['user interface', 'commands']});

  add.method('addCommandsTo', function (cmdList) {
    if (this.anyFailed()) {
      cmdList.addItem({label: 'get error objects', go: this.getErrorObjects.bind(this)});
    }
  }, {category: ['user interface', 'commands']});
  
});

thisModule.addSlots(TestCase, function(add) {

  add.method('addGlobalCommandsTo', function (cmdList) {
    cmdList.addLine();

    cmdList.addItem(["get tests", function(evt) {
      avocado.ui.showObjects(this.allAvocadoTestCasePrototypes(), "test cases for avocado");
    }.bind(this)]);
  }, {category: ['user interface', 'commands']});

  add.method('allAvocadoTestCasePrototypes', function() {
    // aaa - This should be replaced with a more general mechanism for finding tests.
    return [
      avocado.dictionary.tests,
      avocado.set.tests,
      mirror.tests,
      transporter.tests,
      avocado.objectGraphWalker.tests,
      exitValueOf.tests,
      avocado.enumerator.tests,
      avocado.range.tests,
      avocado.notifier.tests,
      avocado.stringBuffer.tests,
      String.prototype.tests,
      Array.prototype.tests,
      avocado.dependencies.tests,
      // doesn't work yet:  avocado.prettyPrinter.tests,
      organization.tests
    ];
  });
  
});


});
