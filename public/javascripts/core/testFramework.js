avocado.transporter.module.create('core/testFramework', function(requires) {

requires('core/naming');

}, function(thisModule) {


thisModule.addSlots(avocado, function(add) {

  add.creator('testCase', {}, {category: ['test framework']}, {comment: 'Copied a lot of this from the LK test framework. Don\'t want\nto just use theirs because we might not always be using LK.'});

});


thisModule.addSlots(avocado.testCase, function(add) {

  add.method('initialize', function (optTestSelector) {
		this.currentSelector = optTestSelector;
		this.statusUpdateFunc = null;
		this.clearResults();
	});

  add.method('log', function (aString) {
    console.log(aString);
  }, {category: ['logging']});

  add.method('name', function () {
    return this.currentSelector || this.wholeTestCaseName();
  }, {category: ['naming']});

  add.method('wholeTestCaseName', function () {
    return reflect(this).name();
  }, {category: ['naming']});
  
  add.creator('namingScheme', Object.create(avocado.namingScheme), {category: ['naming']});

  add.method('nameWithinEnclosingObject', function (enclosingObject) {
    var n = this.name();
    if (enclosingObject) {
      if (enclosingObject.testToBeRun().name() === n) { return ""; }
    }
    return n;
  }, {category: ['naming']});

  add.method('testToBeRun', function () { return this; }, {category: ['accessing']});

  add.method('id', function () {
    return this.wholeTestCaseName() + '>>' + this.currentSelector;
  }, {category: ['accessing']});

  add.method('toString', function ($super) {
    return this.name();
  }, {category: ['printing']});

  add.method('inspect', function () {
    return this.name();
  }, {category: ['printing']});

  add.method('immediateContents', function () {
    if (this.result().hasStarted() && this.result().anyFailed()) {
      return [this.result()];
    } else {
      return [];
    }
  }, {category: ['contents']});
  
  add.method('setUp', function () {});

  add.method('tearDown', function () {});

  add.method('createAssertionFailureException', function (msg) {
    var e = new Error(msg);
    e.isAssertion = true;
    return e;
  }, {category: ['assertions']});

  add.method('assert', function (bool, msg) {
    if (bool) { return; }
    msg = " assert failed " + (msg ? '(' + msg + ')' : '');
		this.show(this.id() + msg);
    throw this.createAssertionFailureException(msg);
  }, {category: ['assertions']});

  add.method('assertEqual', function (firstValue, secondValue, msg) {
    if (! this.areEqual(firstValue, secondValue)) {
      throw this.createAssertionFailureException((msg || "") + " (" + firstValue + " != " + secondValue + ") ");
    }
  }, {category: ['assertions']});

  add.method('assertIdentity', function (firstValue, secondValue, msg) {
		if (firstValue === secondValue) { return; }
		this.assert(false, (msg ? msg : '') + ' (' + firstValue +' !== ' + secondValue +')');
  }, {category: ['assertions']});

  add.method('assertEqualJSON', function (firstValue, secondValue, msg) {
    this.assertEqual(JSON.stringify(firstValue), JSON.stringify(secondValue), msg);
  }, {category: ['assertions']});

  add.method('areEqual', function (firstValue, secondValue) {
    if (firstValue === secondValue) { return true; }
    if (firstValue && firstValue.equals && firstValue.equals(secondValue)) { return true; } // changed this to check a general 'equals' method. -- Adam
    if (firstValue == secondValue) { return true; }
    return false;
  }, {category: ['assertions']});

  add.method('assertNotEqual', function (firstValue, secondValue, msg) {
    if (this.areEqual(firstValue, secondValue)) {
      throw this.createAssertionFailureException((msg || "") + " (" + firstValue + " == " + secondValue + ") ");
    }
  }, {category: ['assertions']});

  add.method('assertThrowsException', function (func, msg) {
    var thrown = false;
    try {
      func();
    } catch (ex) {
      thrown = true;
    }
    this.assert(thrown, msg); // can't put this inside the try because it works by throwing an exception;
  }, {category: ['assertions']});

  add.method('show', function (string) { this.log(string); }, {category: ['logging']});

  add.method('allTestSelectors', function () {
    var functionNames = [];
    for (var name in this) {
      if ((name.startsWith('test') || name.startsWith('asynchronouslyTest')) && typeof this[name] === 'function') {
        functionNames.push(name);
      }
    }
    return functionNames;
  }, {category: ['finding test methods']});

  add.method('copyForTestSelector', function (optTestSelector) {
    return Object.newChildOf(this, optTestSelector);
  });
  
  add.method('eachLeaf', function (f) {
    f(this);
  }, {category: ['iterating']});

  add.method('leaves', function () {
    return avocado.enumerator.create(this, 'eachLeaf');
  }, {category: ['iterating']});

  add.method('runTest', function (callback) {
    this.clearResults();
    this._result.recordStarted();
		var t1 = this._result.timestamp();
		try {
			this.setUp();
			this.runTestFunction(function() {
    		var t2 = new Date().getTime();
  			this._result.recordFinished(null, t2 - t1);
  			callback();
			}.bind(this), function(e) {
    		var t2 = new Date().getTime();
  			this._result.recordFinished(e, t2 - t1);
  		  callback();
			}.bind(this));
		} catch (e) {
  		var t2 = new Date().getTime();
			this._result.recordFinished(e, t2 - t1);
		  callback();
		} finally {
		  this.doTearDown();
		}
	});

  add.method('runTestFunction', function (successCallback, failureCallback) {
		var testFn = this[this.currentSelector];
		if (this.currentSelector.startsWith('asynchronouslyTest')) {
		  testFn.call(this, successCallback, failureCallback);
	  } else {
	    testFn.call(this);
	    successCallback();
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

  add.method('createAndRunAndUpdateAppearance', function (callback) {
    avocado.ui.justChanged(this);
		this.runTest(function() {
      avocado.ui.justChanged(this);
  		if (callback) { callback(this._result); }
		}.bind(this));
  }, {category: ['user interface', 'commands']});

  add.creator('singleOrCompositeResult', {}, {category: ['results']});

  add.creator('singleResult', Object.create(avocado.testCase.singleOrCompositeResult), {category: ['results']});
  
  add.creator('compositeResult', Object.create(avocado.testCase.singleOrCompositeResult), {category: ['results']});

  add.creator('resultHistory', {}, {category: ['results']});

  add.method('clearResults', function () {
		this._result = Object.newChildOf(avocado.testCase.singleResult, this);
  }, {category: ['running']});

  add.method('result', function () {
    return this._result;
  }, {category: ['accessing']});

  add.method('timestamp', function () {
    // aaa - kind of weird, should really just be on the result object
    return this._result.timestamp();
  }, {category: ['accessing']});

  add.method('getTestCaseObject', function (evt) {
    avocado.ui.grab(reflect(this), evt);
  }, {category: ['user interface', 'commands']});

  add.method('commands', function () {
    var cmdList = avocado.command.list.create(this);
    cmdList.addItem({label: 'run', pluralLabel: 'run tests', go: function(evt) { this.createAndRunAndUpdateAppearance(); }});
    cmdList.addLine();
    cmdList.addItem({label: 'get test case object', go: this.getTestCaseObject});
    return cmdList;
  }, {category: ['user interface', 'commands']});

  add.method('addGlobalCommandsTo', function (cmdList) {
    cmdList.addLine();

    var enableHistoryViewingExperiment = false;
    if (!enableHistoryViewingExperiment) {
      cmdList.addItem(["get tests", function(evt) {
        var testSuite = this.suite.forTestingAvocado();
        avocado.ui.grab(testSuite, evt);
      }.bind(this)]);
    } else {
      cmdList.addItem(["get tests", function(evt) {
        var testSuite = this.suite.forTestingAvocado();
        testSuite._shouldBeDisplayedAsOneLongRow = true;
        var history = Object.newChildOf(this.resultHistory, testSuite);
        avocado.ui.grab(history, evt);
      }.bind(this)]);
    }
  }, {category: ['user interface', 'commands']});

  add.creator('suite', {}, {category: ['suites']});

});


thisModule.addSlots(avocado.testCase.singleOrCompositeResult, function(add) {

  add.method('initialize', function (test) {
		this._test = test;
	}, {category: ['creating']});
	
	add.method('passFailSummaryString', function () {
	  var summary = { passed: 0, failed: 0, total: 0 };
	  this._test.leaves().forEach(function(leaf) {
	    summary.total += 1;
	    if (leaf.result().passed()) { summary.passed += 1; }
	    if (leaf.result().failed()) { summary.failed += 1; }
	  });
	  return summary.passed + " passed, " + summary.failed + " failed";
	}, {category: ['printing']});
  
});


thisModule.addSlots(avocado.testCase.singleResult, function(add) {

  add.method('result', function () {
    // for setting the morph's fill
    return this;
  }, {category: ['accessing']});

  add.method('hasStarted', function () {
    return this._hasStarted;
  }, {category: ['accessing']});

  add.method('hasFinished', function () {
    return this._hasFinished;
  }, {category: ['accessing']});
  
  add.method('passed', function () {
    return this.hasFinished() && ! this._error;
  }, {category: ['accessing']});
  
  add.method('allPassed', function () {
    return this.passed();
  }, {category: ['accessing']});

  add.method('failed', function () {
    return this.hasFinished() && ! this.allPassed();
  }, {category: ['accessing']});

  add.method('anyFailed', function () {
    return this.failed();
  }, {category: ['accessing']});

  add.method('timeToRun', function () {
    return this._timeToRun;
  }, {category: ['accessing']});

  add.method('recordStarted', function () {
    this._hasStarted = true;
    this._timestamp = new Date().getTime();
  }, {category: ['accessing']});

  add.method('timestamp', function () {
    return this._timestamp;
  }, {category: ['accessing']});

  add.method('recordFinished', function (error, time) {
    this._error = error;
    this._timeToRun = time;
    this.recordStarted(); // since this method might be called without having already called recordStarted, if we're displaying pre-computed test results
    this._hasFinished = true;
  }, {category: ['accessing']});
  
  add.method('toString', function () {
    if (! this.hasStarted()) {
      return "";
    } else if (! this.hasFinished()) {
      return "running...";
    } else if (this.allPassed()) {
      return "passed";
    } else {
      var s = ["failed "];
      if (this._error.sourceURL !== undefined) {
        s.push("(", this.getFileNameFromError(this._error));
        if (this._error.line !== undefined) {
          s.push(":", this._error.line);
        }
        s.push("): ");
      }
      s.push(typeof(this._error.message) !== 'undefined' ? this._error.message : this._error);
      return s.join("");
    }
  }, {category: ['printing']});

  add.method('getFileNameFromError', function (err) {
    if (!err.sourceURL) { return ""; }
    var path = err.sourceURL.split("/");
    return path[path.length - 1].split("?")[0];
	});

  add.method('logFailures', function (log) {
    if (this.anyFailed()) {
      log(this._error);
    }
  });

});


thisModule.addSlots(avocado.testCase.compositeResult, function(add) {

  add.method('timeToRun', function () {
    var total = 0;
    this._test.subtests().forEach(function(subtest) {
      var r = subtest.result();
      total += (r && r.hasFinished() ? r.timeToRun() : 0);
    });
    return total;
	}, {category: ['accessing']});
	
  add.method('hasFinished', function () {
    return this._test.subtests().all(function(t) { return t.result() && t.result().hasFinished(); });
  });
	
  add.method('allPassed', function () {
    return this._test.subtests().all(function(t) { return t.result() && t.result().allPassed(); });
  });

  add.method('anyFailed', function () {
    return this._test.subtests().any(function(t) { return t.result() && t.result().anyFailed(); });
  });

  add.method('failures', function () {
    return this._test.subtests().select(function(t) { return t.result() && t.result().anyFailed(); });
  });

  add.method('logFailures', function (log) {
    this.failures().forEach(function(t) {
      t.result().logFailures(log);
    });
  });

  add.method('timestamp', function () {
    // I dunno, maybe the composite one should get its own timestamp.
    var timestamp = null;
    this._test.subtests().forEach(function(t) {
      var subTimestamp = t.result().timestamp();
      if (!timestamp || (subTimestamp && subTimestamp < timestamp)) {
        timestamp = subTimestamp;
      }
    });
    return timestamp;
  }, {category: ['accessing']});
  
});


thisModule.addSlots(avocado.testCase.resultHistory, function(add) {
  
  add.method('initialize', function (test) {
    this._tests = [test];
  }, {category: ['creating']});
  
  add.method('toString', function () {
    return "History of " + this.testToBeRun();
  }, {category: ['printing']});

  add.method('entries', function () { return this._tests; }, {category: ['accessing']});

  add.method('testToBeRun', function () { return this._tests[0]; }, {category: ['accessing']});
  
  add.creator('namingScheme', avocado.testCase.namingScheme, {category: ['naming']});

  add.method('nameWithinEnclosingObject', function (enclosingObject) {
    var n = this.testToBeRun().nameWithinEnclosingObject(enclosingObject);
    return n ? "History of " + n : "History";
  }, {category: ['naming']});
  
  add.method('immediateContents', function () {
    var rows = this._tests.map(function(test) {
      var row = test.leaves().toArray();
      /* I want these labels, but they need to be a constant readable size, not dependent on the number of leaves.
      row.unshift(avocado.label.create(test.toString()));
      row.push(avocado.label.create(function() { return test.result().passFailSummaryString(); }));
      */
      return row;
    });
    
    var table = avocado.table.contents.createWithRows(rows);
    table._desiredSpaceToScaleTo = pt(800, null); // aaa hack; I think what I need is some way to combine a Table Layout with an Auto-Scaling Layout
    table.updateStyleOfMorph = function(morph) { morph.setFill(Color.blue); }; // aaa ugh
    return table;
    
    // return this._tests;
  }, {category: ['contents']});
  
  add.method('titleModel', function () {
    if (! this._titleSentence) {
      var displayOptions = Object.newChildOf(avocado.testCase.resultHistory.displayOptions, this);
      var resultNumberHolder = avocado.accessors.forMethods(displayOptions, 'numberOfEntriesBeingShown');
      var daysNumberHolder   = avocado.accessors.forMethods(displayOptions, 'numberOfDaysBeingShown');
      this._titleSentence = avocado.activeSentence.create(["You're viewing the last ", resultNumberHolder, " results, which span ", daysNumberHolder, " days"]);
    }
    return this._titleSentence;
  }, {category: ['user interface']});
  
  add.creator('displayOptions', {}, {category: ['user interface']});
  
});


thisModule.addSlots(avocado.testCase.resultHistory.displayOptions, function(add) {
  
  add.method('initialize', function (history) {
    this._history = history;
    this.setNumberOfEntriesBeingShown(5);
  }, {category: ['creating']});

  add.method('numberOfEntriesBeingShown', function () {
    return this._numberOfEntriesBeingShown;
  }, {category: ['accessing']});

  add.method('setNumberOfEntriesBeingShown', function (n) {
    this._numberOfEntriesBeingShown = Math.max(0, Math.min(n, this._history.entries().size()));
    return this;
  }, {category: ['accessing']});

  add.method('amountOfTimeBeingShown', function () {
    var oldestEntry = this._history.entries()[this._history.entries().size() - this._numberOfEntriesBeingShown];
    if (!oldestEntry) { return 0; }
    return new Date().getTime() - oldestEntry.timestamp();
  }, {category: ['accessing']});

  add.method('setAmountOfTimeBeingShown', function (durationInMilliseconds) {
    var cutoff = new Date().getTime() - durationInMilliseconds;
    var oldestEntryIndex = this._history.entries().size();
    this._history.entries().forEach(function(e, i) { if (e.timestamp() >= cutoff) { oldestEntryIndex = i; throw $break; }; });
    this.setNumberOfEntriesBeingShown(this._history.entries().size() - oldestEntryIndex);
    return this;
  }, {category: ['accessing']});

  add.method('numberOfDaysBeingShown', function () {
    return Math.floor(this.amountOfTimeBeingShown() / (1000 * 60 * 60 * 24));
  }, {category: ['accessing']});

  add.method('setNumberOfDaysBeingShown', function (n) {
    return this.setAmountOfTimeBeingShown(1000 * 60 * 60 * 24 * n);
  }, {category: ['accessing']});
  
});


thisModule.addSlots(avocado.testCase.suite, function(add) {
  
  add.method('create', function () {
    var s = Object.create(this);
    s.initialize.apply(s, arguments);
    return s;
  }, {category: ['creating']});
  
  add.method('createForTestCasePrototypes', function (testCasePrototypes, name) {
    return this.create(testCasePrototypes.map(function(t) { return avocado.testCase.suite.createForAppropriatelyPrefixedMethodsOf(t); }), name);
  }, {category: ['creating']});
  
  add.method('createForAppropriatelyPrefixedMethodsOf', function (testCasePrototype) {
    var testCases = testCasePrototype.allTestSelectors().map(function(sel) { return testCasePrototype.copyForTestSelector(sel); });
    return this.create(testCases, testCasePrototype.wholeTestCaseName());
  }, {category: ['creating']});
  
  add.method('initialize', function (subtests, name) {
    this._subtests = subtests;
    this._name = name || "some tests";
    this._result = Object.newChildOf(avocado.testCase.compositeResult, this);
  }, {category: ['creating']});
  
  add.method('subtests', function () { return this._subtests; }, {category: ['accessing']});

  add.method('result', function () { return this._result; }, {category: ['accessing']});

  add.method('timestamp', function () {
    // aaa - kind of weird, should really just be on the result object
    return this._result.timestamp();
  }, {category: ['accessing']});
  
  add.method('name', function () { return this._name; }, {category: ['accessing']});
  
  add.method('testToBeRun', function () { return this; }, {category: ['accessing']});

  add.method('toString', function () { return this.name(); }, {category: ['printing']});

  add.method('inspect', function () { return this.toString(); }, {category: ['printing']});

  add.creator('namingScheme', avocado.testCase.namingScheme, {category: ['naming']});

  add.method('nameWithinEnclosingObject', function (enclosingObject) {
    var n = this.name();
    if (enclosingObject) {
      if (enclosingObject.testToBeRun().name() === n) { return ""; }
    }
    return n;
  }, {category: ['naming']});
  
  add.method('immediateContents', function () {
    return this.subtests();
  }, {category: ['contents']});
  
  add.method('requiresContentsSummary', function () {
    return false;
  }, {category: ['user interface']});
  
  add.data('_forTestingAvocado', null, {category: ['Avocado tests'], initializeTo: 'null'});

  add.method('forTestingAvocado', function () {
    // aaa - This should be replaced with a more general mechanism for finding tests.
    return this._forTestingAvocado || (this._forTestingAvocado = this.createForTestCasePrototypes(this.testCasePrototypesForTestingAvocado(), "Avocado tests"));
  }, {category: ['Avocado tests']});

  add.method('testCasePrototypesForTestingAvocado', function () {
    return [
      avocado.dictionary.tests,
      avocado.set.tests,
      avocado.accessors.tests,
      avocado.mirror.tests,
      avocado.transporter.tests,
      avocado.objectGraphWalker.tests,
      exitValueOf.tests,
      avocado.enumerator.tests,
      avocado.compositeCollection.tests,
      avocado.range.tests,
      avocado.notifier.tests,
      avocado.stringBuffer.tests,
      avocado.deepCopier.tests,
      String.prototype.tests,
      Array.prototype.tests,
      avocado.command.tests,
      avocado.dependencies.tests,
      avocado.list.tests,
      avocado.graphs.tests,
      //avocado.prettyPrinter.tests, // aaa - not yet working on Safari, jsparse uses regex(input) instead of regex.exec(input)
      // avocado.process.tests, // aaa - not working yet on Chrome, overflows the stack, not sure why
      avocado.remoteMirror.tests,
      avocado.couch.db.tests
    ];
  }, {category: ['Avocado tests']});

  add.method('commands', function () {
    var cmdList = avocado.command.list.create(this);
    cmdList.addItem({label: 'run', pluralLabel: 'run tests', go: function() {
      this.createAndRunAndUpdateAppearance();
    }});
    return cmdList;
  }, {category: ['user interface', 'commands']});

  add.method('dragAndDropCommands', function () {
    var cmdList = avocado.command.list.create(this);
    // aaa - allow adding and removing from the list of tests?
    return cmdList;
  }, {category: ['user interface', 'drag and drop']});

  add.method('clearResults', function () {
    this._subtests.forEach(function(t) { t.clearResults(); });
  }, {category: ['running']});

  add.method('createAndRunAndUpdateAppearance', function (callback) {
    var thisSuite = this;
    
    this.clearResults();
    avocado.ui.justChanged(this);
    
    avocado.callbackWaiter.on(function(generateIntermediateCallback) {
      thisSuite.subtests().each(function(t) {
        var callbackForThisOne = generateIntermediateCallback();
        // Use setTimeout so that the UI thread doesn't freeze while the tests are running. Though it's not actually multithreading. -- Adam
        setTimeout(function() {
          t.createAndRunAndUpdateAppearance(function() {
            avocado.ui.justChanged(thisSuite);
            callbackForThisOne();
          });
        }, 0)
      });
    }, function() {
      avocado.ui.justChanged(thisSuite);
      if (callback) { callback(); }
    }, "running test suite");
  }, {category: ['running']});
  
  add.method('eachLeaf', function (f) {
    this.subtests().forEach(function(t) { t.eachLeaf(f); });
  }, {category: ['iterating']});

  add.method('leaves', function () {
    return avocado.enumerator.create(this, 'eachLeaf');
  }, {category: ['iterating']});

});


});
