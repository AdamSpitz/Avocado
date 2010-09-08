/*
 * Some minor benchmarking extensions for the TestFrameWork separated with layers
 *
 */
module('lively.TestRunnerExtensions').requires('lively.Helper', 'cop.Layers', 'lively.TestFramework').toRun(function() {
	
createLayer("TimeEachTestLayer");

layerClass(TimeEachTestLayer, TestCase, {
	runTest: function(proceed, selector) {
		var start = (new Date()).getTime();	
		proceed(selector);
		var time = (new Date()).getTime() - start;
		this.result.setTimeOfTestRun(this.currentSelector, time)
	},
});

layerClass(TimeEachTestLayer, TestResult, {

	setTimeOfTestRun: function(proceed, selector, time) {
		if (!this.timeOfTestRuns)
			this.timeOfTestRuns = {};
		this.timeOfTestRuns[selector] = time;
	},

	getSortedTimesOfTestRuns: function(proceed) {
		var times = this.timeOfTestRuns
		if(!times) return;	
		var sortedTimes = Object.keys(times).collect(function(eaSelector) {
			return [times[eaSelector], eaSelector]
		}).sort(function(a, b) {return a[0] - b[0]});
		return sortedTimes.collect(function(ea) {return ea.join("\t")}).join("\n")
	}
});


layerClass(TimeEachTestLayer, TestRunner, {
	setResultOf: function(proceed, testObject) {
		proceed(testObject);
		WorldMorph.current().setStatusMessage("\nTestRun: " + testObject.constructor.type + "\n" +
			testObject.result.getSortedTimesOfTestRuns(), Color.blue, 10);
		testObject.timeOfTestRuns = {} // clear the run...
	},
})

createLayer("TimeTestLayer");
enableLayer(TimeTestLayer);

layerClass(TimeTestLayer, TestRunner, {
	
	layersForTestRun: function() {
		var layers = [TimeEachTestLayer];
		if (Config.profileTestRuns)
			layers.push(ProfileEachTestLayer)
		return layers
	},

	runSelectedTestCase: function(proceed) {
		withLayers(this.layersForTestRun(), function() {
			proceed()
		})
	}
})

createLayer("ProfileEachTestLayer");
layerClass(ProfileEachTestLayer, TestCase, {
	runTest: function(proceed, selector) {
		var profileName = "profile "  + this.currentSelector 
		console.profile(profileName);
		proceed(selector);
		console.profileEnd(profileName);
	},
});

Config.profileTestRuns = true

});