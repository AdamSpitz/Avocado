



// Example for static layer activation

Morph.addMethods(LayerableObjectTrait);
Morph.prototype.activateLayersFrom = ["owner"];

createLayer("TokyoTimeLayer");

layerClass(TokyoTimeLayer, ClockMorph, {
 	get timeZoneOffset() {
 		return  8;
 	}
});

