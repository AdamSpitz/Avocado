avocado.transporter.module.create('core/testFramework', function(requires) {

requires('core/naming');

}, function(thisModule) {


thisModule.addSlots(avocado, function(add) {

  add.creator('testCase', {}, {category: ['test framework']}, {comment: 'Copied a lot of this from the LK test framework. Don\'t want\nto just use theirs because we might not always be using LK.'});

});


thisModule.addSlots(avocado.testCase, function(add) {

  add.method('initialize', function (optTestSelector) {
		this._currentSelector = optTestSelector;
		this.clearResults();
	});

  add.method('log', function (aString) {
    console.log(aString);
  }, {category: ['logging']});

  add.method('name', function () {
    return this._currentSelector || this.wholeTestCaseName();
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
    return this.wholeTestCaseName() + '>>' + this._currentSelector;
  }, {category: ['accessing']});

  add.method('copy', function () {
    var c = Object.newChildOf(this['__proto__'], this._currentSelector);
    c._result = this._result.copy();
    c._previousRun = this;
    return c;
  }, {category: ['creating']});

  add.method('toString', function ($super) {
    return this.name();
  }, {category: ['printing']});

  add.method('inspect', function () {
    return this.name();
  }, {category: ['printing']});

  add.method('immediateContents', function () {
    var r = this.result();
    if (r.hasStarted() && r.anyFailed()) {
      var cs = [r];
      // I like the idea, but this doesn't come out quite right yet.
      // var e = r._error;
      // if (e && e.objectsToShow) { e.objectsToShow.forEach(function(o) { cs.push(o); }); }
      return cs;
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
		var testFn = this[this._currentSelector];
		if (this._currentSelector.startsWith('asynchronouslyTest')) {
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


thisModule.addSlots(avocado.testCase, function(add) {

  add.creator('singleResult', Object.create(avocado.testCase.singleOrCompositeResult), {category: ['results']});

});


thisModule.addSlots(avocado.testCase.singleResult, function(add) {

  add.method('result', function () {
    // for setting the morph's fill
    return this;
  }, {category: ['accessing']});

  add.method('copy', function () {
    return Object.deepCopyRecursingIntoCreatorSlots(this);
  }, {category: ['copying']});

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
    return this.hasFinished() && ! this.passed();
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
    this._test.justRecordedFinishing(error, time);
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
  }, {category: ['printing']});

  add.method('logFailures', function (log) {
    if (this.anyFailed()) {
      log(this._error);
    }
  }, {category: ['printing']});

  add.method('isTheSameAs', function (other) {
    if (this.passed()) {
      return other.passed();
    } else {
      return "" + this._error === "" + other._error;
    }
  }, {category: ['comparing']});

  add.method('commands', function () {
    var cmdList = avocado.command.list.create(this);
    if (this._error) {
      if (this._error.objectsToShow) {
        cmdList.addItem(avocado.command.create("show failure information", function(evt) {
          avocado.ui.showObjects(this._error.objectsToShow, "failure information", evt);
        }));
      }
    }
    return cmdList;
  }, {category: ['user interface', 'commands']});

});


thisModule.addSlots(avocado.testCase, function(add) {

  add.creator('compositeResult', Object.create(avocado.testCase.singleOrCompositeResult), {category: ['results']});

  add.creator('resultHistory', {}, {category: ['results']});

  add.method('clearResults', function () {
		this._result = Object.newChildOf(avocado.testCase.singleResult, this);
		return this;
  }, {category: ['running']});

  add.method('justRecordedFinishing', function (error, time) {
    if (this._notifier) { this._notifier.notifyAllObservers(error); }
    avocado.ui.justChanged(this);
  }, {category: ['results']});

  add.method('notifier', function () {
    return this._notifier || (this._notifier = avocado.notifier.on(this));
  }, {category: ['accessing']});

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

    cmdList.addItem(["get tests", function(evt) {
      var testSuite = this.suite.forTestingAvocado();
      avocado.ui.grab(testSuite, evt);
    }.bind(this)]);
  }, {category: ['user interface', 'commands']});

  add.creator('suite', {}, {category: ['suites']});

  add.creator('subset', {}, {category: ['suites']});

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

  add.method('passes', function () {
    return this._test.subtests().select(function(t) { return t.result() && t.result().allPassed(); });
  });

  add.method('failures', function () {
    return this._test.subtests().select(function(t) { return t.result() && t.result().anyFailed(); });
  });

  add.method('passingLeaves', function () {
    return this._test.leaves().select(function(t) { return t.result() && t.result().allPassed(); });
  });

  add.method('failingLeaves', function () {
    return this._test.leaves().select(function(t) { return t.result() && t.result().anyFailed(); });
  });

  add.method('changedLeaves', function () {
    return this._test.leaves().select(function(t) { return t._previousRun && t.result() && ! t.result().isTheSameAs(t._previousRun.result()); });
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

  add.method('summarySentence', function (parts) {
    var s = avocado.activeSentence.create(parts);
    //s._aaa_hack_minimumExtent = pt(1000, 200);
    //s._aaa_hack_style = "background-color: red";
    s._aaa_hack_linkStyleClass = "summaryLink";
    s._aaa_hack_style = "font-family: sans-serif";
    s._aaa_hack_desiredSpace = pt(null, 50);
    s._aaa_hack_desiredScale = 12;
    s._aaa_hack_desiredWidth = 100;
    return s;
  }, {category: ['printing']});

  add.method('summarySentences', function (history) {
    var   totalPart = avocado.testCase.subset.create(history, this._test, history.isStillRunning(this._test) ? "so far" : "in total", this._test. leaves().toArray());
    var  failedPart = avocado.testCase.subset.create(history, this._test, "failed",                                                   this.failingLeaves().toArray());
    var  passedPart = avocado.testCase.subset.create(history, this._test, "passed",                                                   this.passingLeaves().toArray());
    var changedPart = avocado.testCase.subset.create(history, this._test, "changed",                                                  this.changedLeaves().toArray());
    // return [this.summarySentence([totalPart, ". ", passedPart, ", ", failedPart, ". ", changedPart])];
    return [
      this.summarySentence([  totalPart]),
      this.summarySentence([ passedPart]),
      this.summarySentence([ failedPart]),
      this.summarySentence([changedPart]),
    ];
  }, {category: ['printing']});

});


thisModule.addSlots(avocado.testCase.resultHistory, function(add) {

  add.method('initialize', function (entries) {
    this._entries = entries;
  }, {category: ['creating']});

  add.method('toString', function () {
    return "History of " + this.testToBeRun();
  }, {category: ['printing']});

  add.method('entries', function () { return this._entries; }, {category: ['accessing']});

  add.method('setEntries', function (entries) { this._entries = entries; return this; }, {category: ['accessing']});

  add.method('testToBeRun', function () { return this._entries[0]; }, {category: ['accessing']});

  add.data('namingScheme', avocado.testCase.namingScheme, {category: ['naming']});

  add.method('nameWithinEnclosingObject', function (enclosingObject) {
    var n = this.testToBeRun().nameWithinEnclosingObject(enclosingObject);
    return n ? "History of " + n : "History";
  }, {category: ['naming']});

  add.method('immediateContents', function () {
    var indexTable = Object.newChildOf(this.indexTable);
    var headerRow = [null, "total", "passed", "failed", "changed"].map(function(h) {
      var s = avocado.activeSentence.create([h || ""]);
      s._aaa_hack_style = "font-family: sans-serif";
      s._aaa_hack_desiredSpace = pt(null, 50);
      s._aaa_hack_desiredScale = 12;
      s._aaa_hack_desiredWidth = h ? 100 : 63;
      return s;
    });
    var rows = [];
    rows.push(headerRow);
    this._entries.forEach(function(test, rowIndex) {
      var leaves = test.leaves().toArray();
      var row;
      if (rowIndex === 0) {
        row = this.sortRowByStatus(leaves);
        row.forEach(function(leaf, index) {
          indexTable.recordNewIndexForID(leaf.id());
        });
      } else {
        row = [];
        var metaIndexByTestID = {};
        leaves.forEach(function(leaf) {
          row[indexTable.findOrCreateIndexForID(leaf.id(), metaIndexByTestID)] = leaf;
        });
      }
      
      // aaa - I want the summary, but it needs to be a constant readable size, not dependent on the number of leaves.
      row = [null].concat(test.result().summarySentences(this), row);
      rows.push(row);
    }.bind(this));

    if (this._isOKToRunItAgain && typeof(this.runItAgain) === 'function') {
      var s = avocado.activeSentence.create([{getValue: function() { return "Run"; }, doAction: function(evt) { this.runItAgain(evt); }.bind(this)}]);
      s._aaa_hack_desiredSpace = pt(null, 50);
      s._aaa_hack_desiredScale = 15;
      s._aaa_hack_desiredWidth = 50;
      rows.push([s]);
    }
    
    var table = avocado.table.contents.createWithRows(rows);
    table._desiredSpaceToScaleTo = pt(800, null); // aaa hack; I think what I need is some way to combine a Table Layout with an Auto-Scaling Layout
    return table;
  }, {category: ['contents']});

  add.method('enableRunning', function () {
    this._isOKToRunItAgain = true;
    avocado.ui.justChanged(this);
    return this;
  }, {category: ['running']});

  add.method('disableRunning', function () {
    this._isOKToRunItAgain = false;
    avocado.ui.justChanged(this);
    return this;
  }, {category: ['running']});

  add.method('isStillRunning', function (test) {
    return test === this.entries().last() && typeof(this.runItAgain) === 'function' && !this._isOKToRunItAgain;
  }, {category: ['running']});

  add.creator('indexTable', {}, {category: ['contents']}, {comment: 'I think maybe what we want is to sort the first row by status\n(so all the passing ones are together), but then use\nthe same order for subsequent rows, so that you\ncan see at a glance whether something has changed from\nthe previous run. -- Adam'});

  add.method('sortRowByStatus', function (originalRow) {
    var unfinished = [], passed = [], failed = [];
    originalRow.forEach(function(test) {
      var result = test.result();
      var section = result.hasFinished() ? (result.anyFailed() ? failed : passed) : unfinished;
      section.push(test);
    });
    return passed.concat(failed, unfinished);
  }, {category: ['contents']});

  add.method('titleModel', function () {
    if (! this._titleSentence) {
      var displayOptions = Object.newChildOf(avocado.testCase.resultHistory.displayOptions, this);
      var resultNumberHolder = avocado.accessors.forMethods(displayOptions, 'numberOfEntriesBeingShown');
      var daysNumberHolder   = avocado.accessors.forMethods(displayOptions, 'numberOfDaysBeingShown');
      this._titleSentence = avocado.activeSentence.create(["You're viewing the last ", resultNumberHolder, " results, which span ", daysNumberHolder, " days."]);
    }
    return this._titleSentence;
  }, {category: ['user interface']});

  add.creator('interestingEntriesProto', {});

  add.method('createInterestingEntriesList', function () {
    return Object.newChildOf(this.interestingEntriesProto, this);
  }, {category: ['user interface']});

  add.creator('displayOptions', {}, {category: ['user interface']});

  add.method('makeUpSomeRandomResults', function (suite, numberOfRuns, newPassFrequency, newFailFrequency, maxDelay) {
    suite.setExtraDescription("Trial " + 0);
    this.entries().push(suite);
    for (var i = 1; i <= numberOfRuns - 1; ++i) {
      suite = suite.copy().randomlyChangeSomeResults(newPassFrequency, newFailFrequency, maxDelay);
      suite.setExtraDescription("Trial " + i);
      this.entries().push(suite);
    }
    return this;
  }, {category: ['making up fake results']});

  add.method('makeUpAnotherRowOfRandomResults', function (newPassFrequency, newFailFrequency, maxDelay, callbackForEachIndividualTestFinishing, callbackForWholeThingFinishing) {
    var newEntry = this.entries().last().copy().clearResults().setExtraDescription("Trial " + this.entries().size());
    this.entries().push(newEntry);
    avocado.ui.justChanged(this, function() {
      newEntry.randomlyChangeSomeResults(newPassFrequency, newFailFrequency, maxDelay, callbackForEachIndividualTestFinishing, callbackForWholeThingFinishing);
    });
  }, {category: ['making up fake results']});

});


thisModule.addSlots(avocado.testCase.resultHistory.indexTable, function(add) {

  add.method('initialize', function () {
    this._indicesByID = {};
    this._nextFreeIndex = 0;
  }, {category: ['creating']});

  add.method('indicesForID', function (id) {
    return this._indicesByID[id] || (this._indicesByID[id] = []);
  }, {category: ['accessing']});

  add.method('recordNewIndexForID', function (id) {
    var index = this._nextFreeIndex++;
    this.indicesForID(id).push(index);
    //console.log("First row, putting " + id + " at " + index);
    return index;
  }, {category: ['accessing']});

  add.method('findOrCreateIndexForID', function (id, metaIndexByID) {
    // aaa - This has got to be some of the most confusing code I've ever written.
    // The basic problem is that we can't count on the tests all having unique IDs.
    // They probably have names that can serve as sorta-almost-unique IDs, though.
    // So _indicesByID will keep track of *all* the indices corresponding to a
    // particular ID. And so as the next set of test results comes in, we need to
    // keep track of how *many* tests with ID 42 we've seen so far. That's what
    // the "meta index" is.
    //
    // But... yikes.
    // -- Adam
    var indexOfIndex = metaIndexByID[id] || 0;
    var indices = this.indicesForID(id);
    var index = indices[indexOfIndex];
    if (typeof(index) === 'undefined') {
      index = this._nextFreeIndex++;
      indices[indexOfIndex] = index;
    }
    metaIndexByID[id] = indexOfIndex + 1;
    //console.log("Later row, putting " + id + " at " + index);
    return index;
  }, {category: ['accessing']});

});


thisModule.addSlots(avocado.testCase.resultHistory.interestingEntriesProto, function(add) {

  add.method('initialize', function (history) {
    this._history = history;
  }, {category: ['creating']});

  add.method('subset', function () {
    return this.titleModel().content();
  }, {category: ['accessing']});

  add.method('setSubset', function (subset) {
    this.titleModel().setContent(subset);
    return this;
  }, {category: ['accessing']});

  add.method('titleModel', function () {
    if (! this._titleSentence) {
      this._titleSentence = avocado.activeSentence.create([
        function() { return this.content() ? this.content().tests().size() : ""; },
        function() { return this.content() ? " tests " : ""; },
        function() { return this.content() ? this.content().fullDescription() : ""; },
        function() { return this.content() ? "." : ""; }
      ]);
    }
    return this._titleSentence;
  }, {category: ['user interface']});

});


thisModule.addSlots(avocado.testCase.resultHistory.displayOptions, function(add) {

  add.method('initialize', function (history) {
    this._history = history;
  }, {category: ['creating']});

  add.method('numberOfEntriesBeingShown', function () {
    return typeof(this._numberOfEntriesBeingShown) === 'number' ? this._numberOfEntriesBeingShown : this._history.entries().size();
  }, {category: ['accessing']});

  add.method('setNumberOfEntriesBeingShown', function (n) {
    this._numberOfEntriesBeingShown = n;
    return this;
  }, {category: ['accessing']});

  add.method('amountOfTimeBeingShown', function () {
    var oldestEntry = this._history.entries()[this._history.entries().size() - this.numberOfEntriesBeingShown()];
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

  add.method('copy', function () {
    var c = avocado.testCase.suite.create(this._subtests.map(function(t) { return t.copy(); }), this._name);
    c._previousRun = this;
    return c;
  }, {category: ['creating']});

  add.method('timestamp', function () {
    // aaa - kind of weird, should really just be on the result object
    return this._result.timestamp();
  }, {category: ['accessing']});

  add.method('name', function () { return this._name; }, {category: ['accessing']});

  add.method('extraDescription', function () { return this._extraDescription; }, {category: ['accessing']});

  add.method('setExtraDescription', function (d) { this._extraDescription = d; return this; }, {category: ['accessing']});

  add.method('testToBeRun', function () { return this; }, {category: ['accessing']});

  add.method('toString', function () { return this.name(); }, {category: ['printing']});

  add.method('inspect', function () { return this.toString(); }, {category: ['printing']});

  add.data('namingScheme', avocado.testCase.namingScheme, {category: ['naming']});

  add.method('nameWithinEnclosingObject', function (enclosingObject) {
    var n = this.name();
    var d = this.extraDescription() || "";
    if (enclosingObject) {
      if (enclosingObject.testToBeRun().name() === n) { return d || ""; }
    }
    return n + (d ? ": " + d : "");
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
      // avocado.couch.db.tests, // aaa - I think these should still work, but I don't have Couch installed at the moment
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
    return this;
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

  add.method('makeUpSomeRandomResults', function (failureFrequency) {
    if (typeof(failureFrequency) !== 'number') { failureFrequency = 0.1; }
    this.clearResults();
    this.eachLeaf(function(test) {
      var timeToRun = Math.random() * 200;
      if (Math.random() < failureFrequency) {
        test._result.recordFinished(new Error("who knows why?"), timeToRun);
      } else {
        test._result.recordFinished(null, timeToRun);
      }
    });
    return this;
  }, {category: ['making up fake results']});

  add.method('randomlyChangeSomeResults', function (newPassFrequency, newFailFrequency, maxDelay, callbackForEachIndividualTestFinishing, callbackForWholeThingFinishing) {
    if (typeof(newPassFrequency) !== 'number') { newPassFrequency = 0.05; }
    if (typeof(newFailFrequency) !== 'number') { newFailFrequency = 0.05; }
    
    avocado.callbackWaiter.on(function(generateIntermediateCallback) {
      this.eachLeaf(function(test) {
        var timeToRun = Math.random() * 200;
        var error;
        if (test._previousRun._result.failed()) {
          error = Math.random() < newPassFrequency ? null : test._previousRun._result._error;
        } else {
          error = Math.random() < newFailFrequency ? new Error("who knows why?") : null;
        }

        var intermediateCallback = generateIntermediateCallback();
        var doThisOne = function() {
          test._result.recordFinished(error, timeToRun);
          if (callbackForEachIndividualTestFinishing) { callbackForEachIndividualTestFinishing(test); }
          intermediateCallback();
        };
        
        if (!maxDelay) {
          doThisOne();
        } else {
          setTimeout(doThisOne, Math.random() * maxDelay);
        }
      });
    }.bind(this), callbackForWholeThingFinishing, "randomly changing some test results");
    return this;
  }, {category: ['making up fake results']});

  add.method('makeUpARandomResultHistory', function (numberOfRuns, newPassFrequency, newFailFrequency) {
    var history = Object.newChildOf(avocado.testCase.resultHistory, []);
    history.makeUpSomeRandomResults(this, numberOfRuns, newPassFrequency, newFailFrequency);
    return history;
  }, {category: ['making up fake results']});

});


thisModule.addSlots(avocado.testCase.subset, function(add) {

  add.method('create', function () {
    var s = Object.create(this);
    s.initialize.apply(s, arguments);
    return s;
  }, {category: ['creating']});

  add.method('initialize', function (history, suite, kind, tests) {
    this._history = history;
    this._suite = suite;
    this._kind  = kind;
    this._tests = tests || [];
  }, {category: ['creating']});

  add.method('tests', function () {
    return this._tests;
  }, {category: ['accessing']});

  add.method('setTests', function (tests) {
    this._tests = tests;
    return this;
  }, {category: ['accessing']});

  add.method('toString', function () {
    return this._tests.size().toString(); // + " " + this._kind;
  }, {category: ['printing']});

  add.method('fullDescription', function () {
    return this._kind + (this._suite ? " in " + this._suite.nameWithinEnclosingObject(this._history) : "");
  }, {category: ['printing']});

  add.method('getValue', function () {
    return this;
  }, {category: ['accessing']});

  add.method('doAction', function (evt, linkNode) {
    this._history.showInterestingSubset(evt, this, linkNode);
  }, {category: ['linking']});

});


});
