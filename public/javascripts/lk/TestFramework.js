/*
 * Copyright (c) 2006-2009 Sun Microsystems, Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.

 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */


/* An adhoc testFramework. It defines a TestCase class which should be subclassed for
creating own tests. TestResult and TestSuite are used internally for running the Tests.
TestRunner is a Widget which creates a standard xUnit TestRunner window. All tests of 
the system can be run from it */

/*
 * Related Work:
 * - http://www.cjohansen.no/en/javascript/test_driven_development_with_javascript_part_two
 */

module('lively.TestFramework').requires().toRun(function(thisModule) {

Object.subclass('TestCase', {

    shouldRun: true,
    
	initialize: function(testResult, optTestSelector) {
		this.result = testResult || new TestResult();
		this.currentSelector = optTestSelector;
		this.statusUpdateFunc = null;
	},
	
	verbose: function() {
	    return true;
	},
	
	log: function(aString) {
        if (this.verbose())
            console.log(aString);
	},
	
	createTests: function() {
		return this.allTestSelectors().collect(function(sel) {
			return new this.constructor(this.result, sel);
		}, this);
	},
	
	runAll: function(statusUpdateFunc) {
		var tests = this.createTests()
		var t = Functions.timeToRun(function() {
			tests.forEach(function(test) {
				test.statusUpdateFunc = statusUpdateFunc;
				test.runTest();
			})
		})
		this.result.setTimeToRun(this.name(), t);
		
	},
	
	name: function() {
	    return this.constructor.type
	},
	
	id: function() { return this.name() + '>>' + this.currentSelector },
	
	setUp: function() {},
	
	tearDown: function() {},
	
	runTest: function(aSelector) {
	    if (!this.shouldRun) return;
		this.currentSelector = aSelector || this.currentSelector;

		this.running();
		try {
			this.setUp();
			this[this.currentSelector]();
			this.result.addSuccess(this.name(), this.currentSelector); // fixed by Adam to say this.name() instead of this.constructor.type
			this.success();
		} catch (e) {
			this.result.addFailure(this.name(), this.currentSelector, e); // fixed by Adam to say this.name() instead of this.constructor.type
			this.failure(e);
		} finally {
			try {
				this.tearDown();
			} catch(e) {
				this.log('Couldn\'t run tearDown for ' + this.id() + ' ' + printError(e));
			}
		}
	},
	
	debugTest: function(selector) {
		// FIXME
            lively.lang.Execution.installStackTracers();
	    this.runTest(selector);
            lively.lang.Execution.installStackTracers("uninstall");
	    return this.result.failed.last();
	},

    assert: function(bool, msg) {
        if (bool) return;
        msg = " assert failed " + msg ? '(' + msg + ')' : '';
		this.show(this.id() + msg);
        throw {isAssertion: true, message: msg, toString: function() { return msg }}
    },
      
	// deprecated!!!
	assertEqual: function(firstValue, secondValue, msg) { this.assertEquals(firstValue, secondValue, msg) },
	
	assertEquals: function(firstValue, secondValue, msg){
	    if (firstValue && firstValue.constructor === Point && secondValue &&
	        secondValue.constructor === Point && firstValue.eqPt(secondValue)) return;
		if (firstValue == secondValue) return;
		this.assert(false, (msg ? msg : '') + ' (' + firstValue +' != ' + secondValue +')');
	},
	
	assertIdentity: function(firstValue, secondValue, msg){
		if(firstValue === secondValue) return
		this.assert(false, (msg ? msg : '') + ' (' + firstValue +' !== ' + secondValue +')');
	},

	assertEqualState: function(leftObj, rightObj, msg) {
        msg = (msg ? msg : ' ') + leftObj + " != " + rightObj + " because ";
		if (!leftObj && !rightObj) return;
		if (!leftObj || !rightObj) this.assert(false, msg);
		switch (leftObj.constructor) {
			case String:
			case Boolean:
			case Boolean:
			case Number: {
				this.assertEqual(leftObj, rightObj, msg);
				return;
			}
		};
		if (leftObj.isEqualNode) {
		    this.assert(leftObj.isEqualNode(rightObj), msg);
            return;
		};
		var cmp = function(left, right) {
			for (var value in left) {
				if (!(left[value] instanceof Function)) {
					// this.log('comparing: ' + left[value] + ' ' + right[value]);
					try {
					    this.assertEqualState(left[value], right[value], msg);
					} catch (e) {
                        // debugger;
					    throw e;
					}
				};
			};
		}.bind(this);
		cmp(leftObj, rightObj);
		cmp(rightObj, leftObj);		
	},
	
	assertMatches: function(expectedSpec, obj, msg) {
	  for (var name in expectedSpec) {
		var expected = expectedSpec[name];
		var actual = obj[name];
		if (expected === undefined || expected === null) {
		  this.assertEquals(expected, actual, name + ' was expected to be ' + expected + (msg ? ' -- ' + msg : ''));
		  continue;
		}
		if (expected.constructor === Function) continue;
		//if (!expected && !actual) return;
		switch (expected.constructor) {
		  case String:
		  case Boolean:
		  case Number: {
			this.assertEquals(expected, actual, name + ' was expected to be ' + expected + (msg ? ' -- ' + msg : ''));
			continue;
		  }
		};
		this.assertMatches(expected, actual, msg);
	  }
	},
	
    assertIncludesAll: function(arrayShouldHaveAllItems, fromThisArray, msg) {
        fromThisArray.each(function(ea, i) {
            this.assert(arrayShouldHaveAllItems.include(ea), 'difference at: ' + i + ' ' + msg)
        }, this);
    },
    
	allTestSelectors: function() {
	    return this.constructor.functionNames().select(function(ea) {
	        return this.constructor.prototype.hasOwnProperty(ea) && ea.startsWith('test');
	    }, this);
	},
	
	toString: function($super) {
	    return $super() + "(" + this.timeToRun +")"
	},

	show: function(string) { this.log(string) },

	running: function() {
		this.show('Running ' + this.id());
		this.statusUpdateFunc && this.statusUpdateFunc(this, 'running');
	},

	success: function() {
		this.show(this.id()+ ' done', 'color: green;');
		this.statusUpdateFunc && this.statusUpdateFunc(this, 'success');
	},

	failure: function(error) {
		this._errorOccured = true; 
		var message = error.toString();
		var file = error.sourceURL || error.fileName;
		var line = error.line || error.lineNumber;
		message += ' (' + file + ':' + line + ')';
		message += ' in ' + this.id();
		this.show(message , 'color: red;');
		this.statusUpdateFunc && this.statusUpdateFunc(this, 'failure', message);
	},
	
});

TestCase.subclass('AsyncTestCase', {

	initialize: function($super, testResult, testSelector) {
		$super(testResult, testSelector);
		this._maxWaitDelay = 1000; // ms
		this._done = false;
	},

	setMaxWaitDelay: function(ms) { this._maxWaitDelay = ms },

	show: function(string) { console.log(string) },

	done: function() {
		this._done = true;
		if (!this._errorOccured) this.success();
	},

	isDone: function() { return this._done },

	delay: function(func, ms) {
		var sel = this.currentSelector;
		console.log('Scheduled action for ' + sel)
		func = func.bind(this);

		(function() {
			console.log('running delayed action for ' + sel);
			try { func() } catch(e) { this.failure(e) }
		}).bind(this).delay(ms / 1000)
	},

	runAll: function(statusUpdateFunc) {
		var tests = this.createTests();

		tests.forEach(function(test) {
			test.statusUpdateFunc = statusUpdateFunc;
			test.scheduled();
		});

		var runAllAsync = tests.reverse().inject(
			function() { console.log('All tests of ' + this.name() + ' done'); }.bind(this),
			function(testFunc, test) { return test.runAndDoWhenDone.bind(test).curry(testFunc) }
		);

		runAllAsync();

		return tests;
	},

	runAndDoWhenDone: function(func) {
		this.runTest();
		var self = this;
		var waitMs = 100;
		(function doWhenDone(timeWaited) {
			if (timeWaited >= self._maxWaitDelay) {
				if (!self._errorOccured)
					self.failure(new Error('Asynchronous test was not done after ' + timeWaited + 'ms'));
				func();
				return;
			}
			if (self.isDone()) { func(); return };
			// console.log('Deferring test after ' + self.id());
			doWhenDone.curry(timeWaited + waitMs).delay(waitMs / 1000);
		})(0);
	},

	scheduled: function() { this.show('Scheduled ' + this.id()) },

	success: function($super) {
		this.isDone() ? $super() : this.running();
	},

});

TestCase.subclass('MorphTestCase', {
	
	setUp: function() {
		this.morphs = [];
		this.world = WorldMorph.current();
	},
	
	tearDown: function() {
		if (this._errorOccured) {
			// let the morphs stay open
		} else {
			this.morphs.each(function(ea) { ea.remove()})
		}				
	},
	
	openMorph: function(m) {
		this.morphs.push(m);
		this.world.addMorph(m)
	},

	openMorphAt: function(m, loc) {
		this.morphs.push(m);
		this.world.addMorphAt(m, loc)
	},
});


Object.subclass('TestSuite', {
	initialize: function() {
		this.result = new TestResult();
		this.testsToRun = []
		
	},
	
	setTestCases: function(testCaseClasses) {
		this.testCaseClasses = testCaseClasses
	},
	
	testCasesFromModule: function(m) {
		if (!m) throw new Error('testCasesFromModule: Module not defined!');
		var testClasses = m.classes().select(function(ea) {
			return ea.isSubclassOf(TestCase) && ea.prototype.shouldRun;
		});
		this.setTestCases(testClasses);
	},
	
	runAll: function() {
	    this.testClassesToRun = this.testCaseClasses;
	    this.runDelayed();
	},
	
	runDelayed: function() {
	    var testCaseClass = this.testClassesToRun.shift();
	    if (!testCaseClass) {
	        if (this.runFinished)
	            this.runFinished();
	        return
	    }
		var testCase = new testCaseClass(this.result)
	    if (this.showProgress)
	        this.showProgress(testCase);
        testCase.runAll();
        var scheduledRunTests = new SchedulableAction(this, "runDelayed", null, 0);
        WorldMorph.current().scheduleForLater(scheduledRunTests, 0, false);
	},	
});


Object.subclass('TestResult', {
	initialize: function() {
		this.failed = [];
		this.succeeded = [];
		this.timeToRun = {};
	},
	
	setTimeToRun: function(testCaseName, time) {
	    return this.timeToRun[testCaseName]= time
	},
	
	getTimeToRun: function(testCaseName) {
	    return this.timeToRun[testCaseName]
	},
	
	addSuccess: function(className, selector) {
		this.succeeded.push({
				classname: className,
				selector: selector});
	},
	
	addFailure: function(className, selector, error) {
		this.failed.push({
				classname: className,
				selector: selector,
				err: error,
				toString: function(){ return this.classname + "." + this.selector + " failed: " + this.err }});
	},
	
	runs: function() {
		if (!this.failed) 
			return 0; 
		return this.failed.length + this.succeeded.length;
	},
	
	toString: function() {
        return "[TestResult " + this.shortResult() + "]"
	},
	
	// not used, but can be useful for just getting a string
	printResult: function() {
		var string = 'Tests run: ' + this.runs() + ' -- Tests failed: ' + this.failed.length;
		string += ' -- Failed tests: \n';
		this.failed.each(function(ea) {
			string +=  ea.classname + '.' + ea.selector + '\n   -->' 
			    + ea.err.message +  '\n';
		});
		string += ' -- TestCases timeToRuns: \n';
		var self = this;
		var sortedList = $A(Properties.all(this.timeToRun)).sort(function(a,b) {
		    return self.getTimeToRun(a) - self.getTimeToRun(b)});
		sortedList.each(function(ea){
		   string +=  this.getTimeToRun(ea)  + " " + ea+ "\n"
		}, this);
		return string
	},
	
	shortResult: function() {
		if (!this.failed)
			return;
		var time = Object.values(this.timeToRun).inject(0, function(sum, ea) {return sum + ea});
		var msg = Strings.format('Tests run: %s -- Tests failed: %s -- Time: %ss',
			this.runs(), this.failed.length, time/1000);
		return  msg;
	},
	
	getFileNameFromError: function(err) {
	    if (err.sourceURL)
            return new URL(err.sourceURL).filename()
        else
            return "";
	},
	
	failureList: function() {
		var result = this.failed.collect(function(ea) {
			return ea.classname + '.' + ea.selector + '\n  -->' + ea.err.constructor.name + ":" + ea.err.message  +
	            ' in ' + this.getFileNameFromError(ea.err) + 
	            (ea.err.line ? ' ( Line '+ ea.err.line + ')' : "");
		}, this);
		return result
	},
	
	successList: function() {
		return this.succeeded.collect(function(ea) { return ea.classname + '.' + ea.selector });
	}
});

Widget.subclass('TestRunner', {

	viewTitle: "TestRunner",
	documentation: 'Just a simple Tool for running tests in the Lively Kernel environment',
	initialViewExtent: pt(600,500),
	formals: ['TestClasses', 'SelectedTestClass', 'ResultText', 'FailureList', 'Failure'],
	ctx: {},
	
	initialize: function($super, optTestModule) {
		$super(null);
		var model = Record.newPlainInstance((function(){var x={};this.formals.each(function(ea){x[ea]=null});return x}.bind(this))());
		this.onTestClassesUpdate = Functions.Null;
		this.onSelectedTestClassUpdate = Functions.Null;
		this.onResultTextUpdate = Functions.Null;
		this.onFailureListUpdate = Functions.Null;
		this.onFailureUpdate = Functions.Null;
		this.relayToModel(model, {TestClasses: 'TestClasses', SelectedTestClass: 'SelectedTestClass', ResultText: 'ResultText', FailureList: 'FailureList', Failure: 'Failure'});
		
		model.setTestClasses(optTestModule ?
			this.testClassesOfModule(optTestModule) :
			this.allTestClasses());

		return this;
	},
	
	runTests: function(buttonDown) {
		if (buttonDown) return;
		this.runSelectedTestCase();
	},

	runAllTests: function(buttonDown) {
		if (buttonDown) return;
		this.runAllTestCases();
	},

	runSelectedTestCase: function() {
		var testClassName = this.getSelectedTestClass();
		if (!testClassName) return;
		var testCase = new (Class.forName(testClassName))();

		testCase.runAll();
		this.setResultOf(testCase);		
	},
	
	runAllTestCases: function() {
		var testSuite = new TestSuite();
		var counter = 0;
		//all classes from the list
		testSuite.setTestCases(this.getTestClasses().map(function(ea) {
		    return Class.forName(ea);
		}));
		var self = this;
		var total = self.resultBar.getExtent().x;
		var step = self.resultBar.getExtent().x / testSuite.testCaseClasses.length;
		// Refactor!
		testSuite.showProgress = function(testCase) {
		    self.setResultText(testCase.name()); // fixed by Adam to say testCase.name() instead of testCase.constructor.type
		    self.resultBar.setExtent(pt(step*counter,  self.resultBar.getExtent().y));
		    var failureList = testSuite.result.failureList();
		    if(failureList.length > 0) {
		        self.setFailureList(failureList);
		        self.resultBar.setFill(Color.red);
		    };
		    counter += 1;
		};
		testSuite.runAll();
		testSuite.runFinished = function() {
	        self.setResultOf(testSuite);
		};		
		
	},
		
	setResultOf: function(testObject) {
		this.testObject = testObject;
		this.setResultText(this.testObject.result.shortResult());
		this.setFailureList(this.testObject.result.failureList());
		this.setBarColor(this.testObject.result.failureList().length == 0 ? Color.green : Color.red);
		console.log(testObject.result.printResult());
		// updating list with timings
		this.setTestClasses(this.getTestClasses(),true);
	},

	testClassesOfModule: function(m) {
		return m.classes()
			.select(function(ea) { return ea.isSubclassOf(TestCase) && ea.prototype.shouldRun })
		    .collect(function(ea) { return ea.type })
		    .select(function(ea) { return !ea.include('Dummy') })
		    .select(function(ea) { return Config.skipGuiTests ? !ea.endsWith('GuiTest') : true })
            .sort();
	},

	allTestClasses: function() {
		return TestCase.allSubclasses()
		    .select(function(ea) { return ea.prototype.shouldRun })
		    .collect(function(ea) { return ea.type })
		    .select(function(ea) { return !ea.include('Dummy') })
		    .select(function(ea) { return Config.skipGuiTests ? !ea.endsWith('GuiTest') : true })
            .sort();
	},
	
	buildView: function(extent) {
		var panel = PanelMorph.makePanedPanel(extent, [
		   ['testClassList', newRealListPane, new Rectangle(0, 0, 1, 0.6)],
		   ['runButton', function(initialBounds){return new ButtonMorph(initialBounds)}, new Rectangle(0, 0.6, 0.5, 0.05)],
		   ['runAllButton', function(initialBounds){return new ButtonMorph(initialBounds)}, new Rectangle(0.5, 0.6, 0.5, 0.05)],
		   ['resultBar', function(initialBounds){return new TextMorph(initialBounds)}, new Rectangle(0, 0.65, 1, 0.05)],
		   ['failuresList', newTextListPane, new Rectangle(0, 0.7, 1, 0.3)],
		]);

		var model = this.getModel();
		// necessary?
		var self = this;
		var testClassList = panel.testClassList;
		this.testClassListMorph = testClassList.innerMorph();
		this.testClassListMorph.itemPrinter = function(item) { 
		     var string = "";
		     if (self.testObject) {
		         var time = self.testObject.result.getTimeToRun(item);
		         if (time) string += "  ("+ time + "ms)";
		     }
             return  item.toString() + string ;
        };
		
		
		testClassList.connectModel(model.newRelay({List: '-TestClasses', Selection: '+SelectedTestClass'}), true);
		testClassList.innerMorph().focusHaloBorderWidth = 0;
	
		var runButton = panel.runButton;
		runButton.setLabel("Run TestCase");
		runButton.connectModel({model: self, setValue: "runTests"});
		
		var runAllButton = panel.runAllButton;
		runAllButton.setLabel("Run All TestCases");
		runAllButton.connectModel({model: self, setValue: "runAllTests"});
		
		// directly using the morph for setting the color -- 
		this.resultBar = panel.resultBar;
		this.resultBar.connectModel(model.newRelay({Text: '-ResultText'}));

		var failuresList = panel.failuresList;
		failuresList.connectModel(model.newRelay({List: '-FailureList', Selection: '+Failure'}));
		// quick hack for building stackList
		model.setFailure = model.setFailure.wrap(function(proceed, failureDescription) {
			// FIXME: put his in testResult
			proceed(failureDescription);
			if (!self.testObject) {
			    console.log('could not find my testObject :-(');
			    return;
			}
			var i = self.testObject.result.failureList().indexOf(failureDescription);
			self.openErrorStackViewer(self.testObject.result.failed[i]);
		});
		
		return panel;
		},
		
		setBarColor: function(color) {
		this.resultBar.setFill(color);
	},
	
	openErrorStackViewer: function(testFailedObj) {

	    if (!testFailedObj) return;
	    
		var testCase = new (Class.forName(testFailedObj.classname))();
		var failedDebugObj = testCase.debugTest(testFailedObj.selector);

		if (!failedDebugObj.err.stack) {
			console.log("Cannot open ErrorStackViewer: no stack");
			return;
		};
		
		new ErrorStackViewer(failedDebugObj).openIn(WorldMorph.current(), pt(220, 10));
	}
	
});

TestRunner.openIn = function(world, loc) {
    if (!world) world = WorldMorph.current();
    if (!loc) loc = pt(120, 10);
	new TestRunner().openIn(world, loc);
};

Widget.subclass('ErrorStackViewer', {

	defaultViewTitle: "ErrorStackViewer",
	defaultViewExtent: pt(450,350),
	
	initialize: function($super, testFailedObj) {
		$super();
		var list = [];	
		if(testFailedObj && testFailedObj.err && testFailedObj.err.stack) {
		    if(! testFailedObj.err.stack.each)
		        console.log("ErrorStackViewer: don't know what to do with" +testFailedObj.err.stack )
		    else
		        testFailedObj.err.stack.each(function(currentNode, c) { list.push(c.copyMe()) });
		};
		this.formalModel = Record.newInstance(
			{StackList: {}, MethodSource: {}, ArgumentsList: {}, SelectedCaller: {}},
			{StackList: list, MethodSource: "", ArgumentsList: [], SelectedCaller: null}, {});
		return this;
	},
	
	setStackList: function(list) {
        this.formalModel.setStackList(list)
	},
	
	buildView: function(extent) {
		var panel = PanelMorph.makePanedPanel(extent, [
			['callerList', newTextListPane, new Rectangle(0, 0, 1, 0.3)],
			['argumentsList', newTextListPane, new Rectangle(0, 0.3, 0.7, 0.2)],
			['inspectButton', function(initialBounds){return new ButtonMorph(initialBounds)}, new Rectangle(0.7, 0.3, 0.3, 0.2)],
			['methodSource', newTextPane, new Rectangle(0, 0.5, 1, 0.5)]
		]);
		
		var model = this.formalModel;
		
		var callerList = panel.callerList;
		callerList.connectModel({model: this, getList: "getCallerList", setSelection: "setCaller"});
		callerList.updateView("all");
		
		var argumentsList = panel.argumentsList;
		this.argumentsList = argumentsList;
		argumentsList.connectModel({model: model, getList: "getArgumentsList"});
		
		var inspectButton = panel.inspectButton;
		this.inspectButton = inspectButton;
		inspectButton.setLabel("Inspect");
		inspectButton.connectModel({model: this, setValue: "inspectCaller"});
		
		var methodSource = panel.methodSource;
		// FIXME
		this.methodSource = methodSource;
		methodSource.connectModel({model: model, getText: "getMethodSource"});
		
		formalModel = this.formalModel;
		var self = this;
		methodSource.innerMorph().boundEval = methodSource.innerMorph().boundEval.wrap(function(proceed, str) {
			console.log("eval " + str);
			try {
				var stackNode = formalModel.getSelectedCaller();
				var argNames = self.extractArgumentString(stackNode.method.toString());
				var source = "argFunc = function("+ argNames +") {return eval(str)}; argFunc";			
				return eval(source).apply(formalModel.getSelectedCaller().itsThis, stackNode.args); // magic...
			} catch(e) {
				console.log("Error in boundEval: " + e.toString())
				return ""
			}
		}); 

		return panel;
	},
	
	getCallerList: function() {
		return this.formalModel.getStackList().collect(function(ea) {
			var argsString = '---'
			var args = $A(ea.args);
			if (args.length > 0)
				argsString = '(' + args + ')';
			if(!(ea.method && ea.method.qualifiedMethodName))	
				return "no method found for " + printObject(ea);
				
			return ea.method.qualifiedMethodName() + argsString});
	},
	
	setCaller: function(callerString) {
		if (!callerString) return;
		var i = this.getCallerList().indexOf(callerString);
		var contextNode = this.formalModel.getStackList()[i];
		if (!contextNode) {
			this.formalModel.setMethodSource('Error: Can\'t find contextNode in stack!');
			this.methodSource.updateView("getMethodSource");
			return;
		}
		this.formalModel.setSelectedCaller(contextNode);
		this.formalModel.setMethodSource(contextNode.method.inspectFull());
		this.methodSource.updateView("getMethodSource");
		
		this.formalModel.setArgumentsList(this.getArgumentValueNamePairs(contextNode));
		this.argumentsList.updateView("getArgumentsList");
	},
	
	inspectCaller: function(value) {
		if (!value) return;
		var contextNode = this.formalModel.getSelectedCaller(contextNode);
		new SimpleInspector(contextNode).openIn(WorldMorph.current(), pt(200,10))
	},
	
	getArgumentValueNamePairs: function(stackNode) {
		var args = $A(stackNode.args);
		var argNames = this.getArgumentNames(stackNode.method.toString());
		console.log('Argnames: ' + args);
		var nameValues = argNames.inject([], function(nameValuePairs, eaArgName) {
			nameValuePairs.push(eaArgName + ': ' + args.shift());
			return nameValuePairs;
		});
		nameValues = nameValues.concat(args.collect(function(ea) {
			return 'unnamed: ' + ea;
		}));
		return nameValues;
	},
	
	extractArgumentString: function(methodSource) {
		var match =  /function.*?\((.*?)\)/.exec(methodSource);
		if (!match) {
			console.log("Error in extractArgumentString: " +methodSource);
			return ""
		};
		return match[1]
	},
	
	getArgumentNames: function(methodSrc) {
		var match =  /function.*?\((.*?)\)/.exec(methodSrc);
		if (!match) return [];
		var parameterString = match[1];
		return parameterString.split(", ").reject(function(ea) { return ea == '' });
	}
});
    
/* 
 * *** Error properties for documentation: ***
 *  Example from WebKit
 *    message:  assert failed (no files read), 
 *    line: 70
 *    expressionBeginOffset: 1765
 *    expressionEndOffset: 1836
 *    sourceId: 18326
 *    sourceURL: http://localhost/lk/kernel/TestFramework.js
 */

Global.printError = function printError(e) {
   var s = "" + e.constructor.name + ": ";
   for (i in e) { s += i + ": " + String(e[i]) + ", "}; // get everything out....
   return s
}

Global.logError = function logError(e) {
    console.log("Error: " + printError(e));
}

Global.openStackViewer = function openStackViewer() {
   var stack = getStack();
   stack.shift();
   stack.shift();
   var stackList = stack.collect(function(ea){return {method: ea, args: []}});
   var viewer = new ErrorStackViewer();
   viewer.setStackList(stackList);
   var window = viewer.openIn(WorldMorph.current(), pt(220, 10));
   return window;
};

console.log("loaded TestFramework.js");

});
