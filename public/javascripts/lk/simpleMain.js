
function connectLKObjectToHTML(obj, propName, htmlElement, htmlAttrName) {
	function informHTMLElement(val) {
		htmlElement[htmlAttrName] = val;
	}
	// if obj[propName] is a function, create a wrapper
	if (Object.isFunction(obj[propName])) {
		obj[propName] = obj[propName].wrap(function(proceed, val) {
			console.log(propName + 'called with ' + val);
			proceed(val);
			informHTMLElement(val);
		});
		return;		
	}
	// otherwise replace propName with getter end setter, rename key for property to "_" + name 
	var privateName = '_' + propName;
	obj[privateName] = obj[propName];
	obj.__defineGetter__(propName, function() { return this[privateName]; });
	obj.__defineSetter__(propName, function(val) {
		this[privateName] = val;
		informHTMLElement(val);
	});
}

function connectHTMLElementToLK(htmlElement, htmlAttrName, obj, propName) {
	htmlElement.onchange = function(evt) {
		if (Object.isFunction(obj[propName]))
			obj[propName](htmlElement[htmlAttrName])
		else
			obj[propName] = htmlElement[htmlAttrName];
	}
}

function connectAndShowClock(htmlElement, world) {
	require('lively.Examples').toRun(function() {
        var widget = new ClockMorph(pt(100, 100), 50);
        world.addMorph(widget);
        widget.startSteppingScripts();

		// create menu for changing time zone offset
		var items = [];
		for (var i = -11; i <= 13; i++)
			(function(i) {items.push(['UTC' + (i>=0?'+':'') + i.toString(), function() { widget.timeZoneOffset = i }])})(i);
		var menu = new MenuMorph(items, widget);
		widget.morphMenu = function(evt) { return menu };

		if (!htmlElement) return;
		// connect to html element
		connectLKObjectToHTML(widget, 'timeZoneOffset', htmlElement, 'value');
		connectHTMLElementToLK(htmlElement, 'value', widget, 'timeZoneOffset');
		widget.timeZoneOffset = widget.timeZoneOffset;
	})
}

function connectAndShowEngine(htmlElement, world) {
	require('lively.Examples').toRun(function() {
		EngineMorph.makeEngine(world, pt(0, 0));
        var engine = WorldMorph.current().submorphs.last().targetMorph;
		
		connectLKObjectToHTML(engine, 'makeCylinders', htmlElement, 'value');
		connectHTMLElementToLK(htmlElement, 'value', engine, 'makeCylinders');
    });
}

function main(functionToRun) {
    var canvas = Global.document.getElementById("canvas");
	var world = new WorldMorph(canvas); 
   	world.displayOnCanvas(canvas);
	functionToRun && functionToRun(world);
}
