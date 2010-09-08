

module('lively.FabrikExtensions').requires('lively.Helper', 'cop.Layers').toRun(function() {

createLayer("WorldClockLayer");
createLayer("TokyoTimeLayer");
createLayer("BerlinTimeLayer");


layerClass(WorldClockLayer, ClockMorph, {
	setHands: function(proceed) {
		if (this.name == "Tokyo") {
			withLayers([TokyoTimeLayer], function() {
				return proceed();
			});
			return;
		} else {
			return proceed();			
		}
	}
});

layerClass(TokyoTimeLayer, ClockMorph, {
 	get timeZoneOffset(proceed) {
 		return 9;
 	}		
});

// layerClass(BerlinTimeLayer, ClockMorph, {
//  	get timeZoneOffset(proceed) {
//  		return 2;
//  	}		
// });


// layerClass(TokyoTimeLayer, Date, {
// 	getTimezoneOffset: function(proceed) {
// 		return - 9 * 60;
// 	}		
// });

enableLayer(WorldClockLayer);
	



	
});