module('Tests.FabrikExtensionsTest').requires('lively.TestFramework', 'Tests.SerializationTests', 'lively.Fabrik', 'lively.FabrikExtensions').toRun(function(ownModule) {

TestCase.subclass('Tests.FabrikExtensionTest', {
	
	testTokyoDate: function() {
		var time = new Date();
		var hours = time.getUTCHours();
		var tokyoHours;
		withLayers([TokyoTimeLayer], function() {
			tokyoHours = time.getUTCHours();
		});
		this.assertEqual(tokyoHours, hours + 7, "TokyoTimeLayer is broken");

	}
});


});
