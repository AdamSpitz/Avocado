transporter.module.create('core/testFramework', function(requires) {}, function(thisModule) {


thisModule.addSlots(avocado, function(add) {

  add.creator('testCase', {}, {category: ['test framework']}, {comment: 'Copied a lot of this from the LK test framework. Don\'t want\nto just use theirs because we might not always be using LK.'});

});


thisModule.addSlots(avocado.testCase, function(add) {

  add.data('shouldRun', true);

  add.method('initialize', function (testResult, optTestSelector) {
		this.result = testResult || Object.newChildOf(this.resultProto);
		this.currentSelector = optTestSelector;
		this.statusUpdateFunc = null;
	});

  add.method('log', function (aString) {
    console.log(aString);
	});

  add.method('id', function () { return this.name() + '>>' + this.currentSelector; });

  add.method('setUp', function () {});

  add.method('tearDown', function () {});

  add.method('assert', function (bool, msg) {
        if (bool) return;
        msg = " assert failed " + msg ? '(' + msg + ')' : '';
		this.show(this.id() + msg);
        throw {isAssertion: true, message: msg, toString: function() { return msg }}
    });

  add.method('assertEqual', function (firstValue, secondValue, msg) {
    if (! this.areEqual(firstValue, secondValue)) {
      throw {isAssertion: true, message: (msg ? msg	 : "") + " (" + firstValue + " != " + secondValue + ") "};
    }
  });

  add.method('assertIdentity', function (firstValue, secondValue, msg) {
		if (firstValue === secondValue) { return; }
		this.assert(false, (msg ? msg : '') + ' (' + firstValue +' !== ' + secondValue +')');
	});

  add.method('allTestSelectors', function () {
    var functionNames = [];
    for (var name in this) {
      if ((name.startsWith('test') || name.startsWith('asynchronouslyTest')) && typeof this[name] === 'function') {
        functionNames.push(name);
      }
    }
    return functionNames;
  });

  add.method('toString', function ($super) {
	    return $super() + "(" + this.timeToRun +")";
	});

  add.method('show', function (string) { this.log(string); });

  add.method('running', function () {
		this.show('Running ' + this.id());
		this.statusUpdateFunc && this.statusUpdateFunc(this, 'running');
	});

  add.method('success', function () {
		this.show(this.id()+ ' done', 'color: green;');
		this.statusUpdateFunc && this.statusUpdateFunc(this, 'success');
	});

  add.method('failure', function (error) {
		this._errorOccured = true; 
		var message = error.toString();
		var file = error.sourceURL || error.fileName;
		var line = error.line || error.lineNumber;
		message += ' (' + file + ':' + line + ')';
		message += ' in ' + this.id();
		this.show(message , 'color: red;');
		this.statusUpdateFunc && this.statusUpdateFunc(this, 'failure', message);
	});

  add.method('createTests', function () {
    return this.allTestSelectors().collect(function(sel) {
      return this.create(this.result, sel);
    }, this);
  });

  add.method('name', function () {
    return reflect(this).name();
  });

  add.method('create', function (testResult, optTestSelector) {
    return Object.newChildOf(this, testResult, optTestSelector);
  });

  add.method('createAndRun', function () {
    var testCase = this.create();
    testCase.runAll();
    var result = testCase.result;
    result.testCase = testCase;
    return result;
  });

  add.method('runTest', function (callback) {
    if (!this.shouldRun) return;

		this.running();
		try {
			this.setUp();
			this.runTestFunction(function() {
  			this.result.addSuccess(this.name(), this.currentSelector); // fixed by Adam to say this.name() instead of this.constructor.type
  			this.success();
  			callback();
			}.bind(this));
		} catch (e) {
			this.result.addFailure(this.name(), this.currentSelector, e); // fixed by Adam to say this.name() instead of this.constructor.type
			this.failure(e);
		  callback();
		} finally {
		  this.doTearDown();
		}
	});

  add.method('runTestFunction', function (callback) {
		var testFn = this[this.currentSelector];
		if (this.currentSelector.startsWith('asynchronouslyTest')) {
		  testFn.call(this, callback);
	  } else {
	    testFn.call(this);
	    callback();
	  }
  });

  add.method('doTearDown', function () {
		try {
			this.tearDown();
		} catch(e) {
      var errStr = "" + e.constructor.name + ": ";
      for (var i in e) { s += i + ": " + String(e[i]) + ", " }; // get everything out....
			this.log('Couldn\'t run tearDown for ' + this.id() + ' ' + printError(errStr));
		}
  });

  add.method('inspect', function () {
    return this.name();
  });

  add.method('areEqual', function (firstValue, secondValue) {
    if (firstValue === secondValue) { return true; }
    if (firstValue && firstValue.equals && firstValue.equals(secondValue)) { return true; } // changed this to check a general 'equals' method. -- Adam
    if (firstValue == secondValue) { return true; }
    return false;
  });

  add.method('assertNotEqual', function (firstValue, secondValue, msg) {
    if (this.areEqual(firstValue, secondValue)) {
      throw {isAssertion: true, message: (msg ? msg	 : "") + " (" + firstValue + " == " + secondValue + ") "};
    }
  });

  add.method('assertThrowsException', function (func, msg) {
    var thrown = false;
    try {
      func();
    } catch (ex) {
      thrown = true;
    }
    this.assert(thrown, msg); // can't put this inside the try because it works by throwing an exception;
  });

  add.method('runAll', function (statusUpdateFunc) {
		var tests = this.createTests();
		var totalTime = 0;
		tests.forEach(function(test) {
  		var t1 = new Date().getTime();
			test.statusUpdateFunc = statusUpdateFunc;
			test.runTest(function() {
    		var t2 = new Date().getTime();
    		this.result.incrementTimeToRun(this.name(), t2 - t1);
			}.bind(this));
		}.bind(this));
	});

  add.creator('resultProto', {}, {category: ['results']});

  add.method('createAndRunAndShowResult', function () {
    avocado.ui.showNextTo(this, this.createAndRun(), this);
  }, {category: ['user interface', 'commands']});

  add.method('getTestCaseObject', function (evt) {
    avocado.ui.grab(reflect(this), evt);
  }, {category: ['user interface', 'commands']});

  add.method('commands', function () {
    var cmdList = avocado.command.list.create(this);
    cmdList.addItem({label: 'run', pluralLabel: 'run tests', go: this.createAndRunAndShowResult});
    cmdList.addLine();
    cmdList.addItem({label: 'get test case object', go: this.getTestCaseObject});
    return cmdList;
  }, {category: ['user interface', 'commands']});

  add.method('buttonCommands', function () {
    return avocado.command.list.create(this, [
      avocado.command.create('Run', this.createAndRunAndShowResult)
    ]);
  }, {category: ['user interface', 'commands']});

  add.method('addGlobalCommandsTo', function (cmdList) {
    cmdList.addLine();

    cmdList.addItem(["get tests", function(evt) {
      avocado.ui.showObjects(this.allAvocadoTestCasePrototypes(), "test cases for avocado");
    }.bind(this)]);
  }, {category: ['user interface', 'commands']});

  add.method('allAvocadoTestCasePrototypes', function () {
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
      avocado.list.tests,
      avocado.prettyPrinter.tests,
      organization.tests,
      avocado.process.tests,
      avocado.remoteMirror.tests
    ];
  });

});


thisModule.addSlots(avocado.testCase.resultProto, function(add) {

  add.method('initialize', function () {
		this.failed = [];
		this.succeeded = [];
		this.timeToRun = {};
	});

  add.method('incrementTimeToRun', function (testCaseName, time) {
	    return this.timeToRun[testCaseName] = (this.timeToRun[testCaseName] || 0) + time;
	});

  add.method('setTimeToRun', function (testCaseName, time) {
	    return this.timeToRun[testCaseName] = time;
	});

  add.method('getTimeToRun', function (testCaseName) {
	    return this.timeToRun[testCaseName];
	});

  add.method('addSuccess', function (className, selector) {
		this.succeeded.push({
				classname: className,
				selector: selector});
	});

  add.method('addFailure', function (className, selector, error) {
	  // Better error message than the standard LK one.
	  var failure = {
				classname: className,
				selector: selector,
				err: error
		};
		failure.toString = this.failureDescription.bind(this, failure);
		this.failed.push(failure);
  });

  add.method('failureDescription', function (failure) {
    var s = avocado.stringBuffer.create(failure.selector).append(" failed ");
    if (failure.err.sourceURL !== undefined) {
      s.append("(").append(this.getFileNameFromError(failure.err));
      if (failure.err.line !== undefined) {
        s.append(":").append(failure.err.line);
      }
      s.append("): ");
    }
    s.append(typeof(failure.err.message) !== 'undefined' ? failure.err.message : failure.err);
    return s.toString();
  });

  add.method('runs', function () {
		if (!this.failed) 
			return 0; 
		return this.failed.length + this.succeeded.length;
	});

  add.method('toString', function () {
    return this.inspect();
	});

  add.method('getFileNameFromError', function (err) {
    if (!err.sourceURL) { return ""; }
    var path = err.sourceURL.split("/");
    return path[path.length - 1].split("?")[0];
	});

  add.method('failureList', function () {
		var result = this.failed.collect(function(ea) {
			return ea.classname + '.' + ea.selector + '\n  -->' + ea.err.constructor.name + ":" + ea.err.message  +
	            ' in ' + this.getFileNameFromError(ea.err) + 
	            (ea.err.line ? ' ( Line '+ ea.err.line + ')' : "");
		}, this);
		return result;
	});

  add.method('successList', function () {
		return this.succeeded.collect(function(ea) { return ea.classname + '.' + ea.selector });
	});

  add.method('totalTimeToRun', function () {
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

  add.method('inspect', function () {
    return this.testCase.name() + "(" + this.totalTimeToRun() + " ms)";
  });

  add.method('allPassed', function () {
    return this.failed.length === 0;
  });

  add.method('anyFailed', function () {
    return ! this.allPassed();
  });

  add.method('getErrorObjects', function (evt) {
    this.failed.each(function(f) {
      avocado.ui.grab(reflect(f.err), evt);
    });
  }, {category: ['user interface', 'commands']});

  add.method('commands', function () {
    var cmdList = avocado.command.list.create();
    cmdList.addItem({label: 'get error objects', go: this.getErrorObjects.bind(this), isApplicable: this.anyFailed.bind(this)});
    return cmdList;
  }, {category: ['user interface', 'commands']});

});


});
