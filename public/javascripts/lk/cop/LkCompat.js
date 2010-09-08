
/* Code loader. Appends file to DOM. */
var Loader = {
    
    loadJs: function(url, onLoadCb) {
        
        if (document.getElementById(url)) return;
        
        var script = document.createElement('script');
        script.id = url;
        script.type = 'text/javascript';
        script.src = url;
        var node = document.getElementsByTagName("head")[0];
        if (onLoadCb) script.onload = onLoadCb;
        node.appendChild(script);
    },
    
    scriptInDOM: function(url) {
        if (document.getElementById(url)) return true;
        var preloaded = document.getElementsByTagName('head')[0].childNodes;
        for (var i = 0; i < preloaded.length; i++)
            if (preloaded[i].getAttribute &&
                    preloaded[i].getAttribute('src') &&
                        url.endsWith(preloaded[i].getAttribute('src')))
                            return true
        return false;
    }
};

Config = {};

var platformConsole = Global.window.console || ( Global.window.parent && Global.window.parent.console); 
if (!platformConsole) {
	// window.alert && window.alert('no console! console output disabled');
	platformConsole = { log: function(msg) { } } // do nothing as a last resort
}

if (platformConsole.warn && platformConsole.info && platformConsole.assert) {
	// it's a Firebug/Firebug lite console, it does all we want, so no extra work necessary
	try {
		Global.console = platformConsole;
		Global.console.consumers = [platformConsole]; // compatibility fix	        
	} catch (e) {
		platformConsole.log('Problem with setting Global.console?');
	}
} else {
	// rebind to something that has all the calls
	Global.console = {

		consumers: [ platformConsole], // new LogWindow() ],

		warn: function() {
			var args = $A(arguments);
			this.consumers.forEach(function(c) { 
				if (c.warn) c.warn.apply(c, args); 
				else c.log("Warn: " + Strings.formatFromArray(args)); // potential bug, because log seems to distributes it againg
			});
		},

		info: function() {
			var args = $A(arguments);
			this.consumers.forEach(function(c) { 
				if (c.info) c.info.apply(c, args); 
				else c.log("Info: " + Strings.formatFromArray(args));// potential bug, because log seems to distributes it againg
			});
		},

		log: function() {
			this.consumers.invoke('log', Strings.formatFromArray($A(arguments)));
		},

		assert: function(expr, msg) {
			if (!expr) this.log("assert failed:" + msg);
		}
	}
}


// fake widget 
Object.subclass('Widget', {

})

