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


// play with an analog phone dial thingy (sau)

/**
 * @class PhoneMorph
 */

module('lively.phone').requires().toRun(function() {

console.log("start phone.js");
Morph.subclass('PhoneMorph', {
	initialize: function($super, position, radius) {
	    this.radius = radius;
	    $super(new lively.scene.Ellipse(position, radius));
	    this.makeLayout();
	},

	ringOn: function() {
		if (this.flashCount) return;
		this.oldFill=this.getFill();
		this.startStepping(100, "doRing");
	},

	doRing: function() {
		if (this.flashCount) {
			if (this.flashCount%6 == 2) {
				this.doPhoneCmd("cmd=R+200"); // XXX doesn't go here
			}
			if (this.flashCount++%60 < 40) {
				this.setFill(this.flashCount&1 ? Color.green : Color.magenta);
			}
		} else {
			this.flashCount = 1;
		}
	},

	ringOff: function() {
		if (this.flashCount) {
			console.log("ring off "+ this.flashCount);
			// this.stopSteppingFor("doRing"); // Why doesn't this work?
			this.stopStepping();
			this.setFill(this.oldFill);
			delete this.flashCount;
			this.doPhoneCmd("cmd=R+off"); // XXX doesn't go here
		}
	},

	ring: function(on) {
		if (on) {
			this.ringOn() 
		} else {
			this.ringOff();
		}
	},

	doPhoneCmd: function(query) {
		var req = new NetRequest();
		var file = "phone.bsl"; // need to pass this in as a parameter
		req.get(new URL(Global.location.toString()).withFilename(file) + "?" + query);
	},

	makeLayout: function() {
		var big=this.radius;		// Radius of phone dial
		var small=big * 0.15;		// Radius of finger hole
		var hookAngle=0.5;			// Where the finger hook goes
		var phi = -0.6;				// Offset angle for dial holes
		var nudge=pt(0.1, 0.1);		// allow us to make almost circular arcs
		var scale=(big-small)*.95;	// radius to locate dial holes
		var origin = pt(big-2*small,2*small-big);	// center of the dial

	        var dial = Morph.makeRectangle(0, 0, 0, 0);
		this.dial=dial;	//tmp
	        var shim = Morph.makeCircle(pt(0, 0), big/2);
		var rt2 = (1.0/Math.sqrt(2.0));
		shim.setFillOpacity(.5);

		var label = new TextMorph(new Rectangle(0,0,big*0.9,100), "X18814");
		label.applyStyle({fontSize: 16, borderWidth: 1, fill: null, wrapStyle: lively.Text.WrapStyle.Shrink});
		label.translateBy(label.bounds().center().negated());

		var letters = ["oper"," ","ABC","DEF","GHI","JKL","MNO","PRS","TUV","WXZ"];

		var p = [origin, origin.addPt(nudge)];
		p[1].type="arc"; p[1].radius=big; p[1].mode="1,0";
		for (var i = 0; i<10; i++) {
			// 1/2 ~= 2PI/12
			var x = origin.addXY(-(Math.sin(phi+i/2.0)*scale+big/2 + 2*small),
					Math.cos(phi+i/2.0)*scale+big/2 + 2*small);	// why be normal? (XXX wrong)
			x.type="move";
			p.push(x);
			var y = x.addPt(nudge);
			y.type="arc"; y.radius=small; y.mode="1,1";
			p.push(y);

			var idx = (10-i)%10;		// convert hole index to digit number
			var txt = letters[idx] + "\n   "+ idx;
			var digit = new TextMorph(new Rectangle(0, 0, 40, 20), txt);
			digit.scaleBy(1.7*small/digit.bounds().height);
			digit.applyStyle({borderWidth: 0, fill: null, wrapStyle: lively.Text.WrapStyle.Shrink});
			var adj=pt(small, -small).scaleBy(rt2);
			digit.translateBy(x.addPt(adj).subPt(digit.bounds().center())); // should use align
			digit.relayMouseEvents(this, {onMouseDown: "onMouseDown", onMouseMove: "onMouseMove", onMouseUp: "onMouseUp"});
			this.addMorph(digit);
		}
		dial.relayMouseEvents(this, {onMouseDown: "onMouseDown", onMouseMove: "onMouseMove", onMouseUp: "onMouseUp"});
		shim.relayMouseEvents(this, {onMouseDown: "onMouseDown", onMouseMove: "onMouseMove", onMouseUp: "onMouseUp"});


		function fixPath(points) {
			return points.collect(function(point, i) { // fix: path no longer created with points!
				var klass = i === 0 ? lively.scene.MoveTo : lively.scene.CurveTo;
				return new klass(true, point.x, point.y);
			});
		}
		
		dial.setShape(new lively.scene.Path(fixPath(p), Color.red, 0, Color.black));
		dial.setFillOpacity(.7);

		// finger hook
		var hook = Morph.makeRectangle(0, 0, 0, 0);
		var hp = [pt(0,0).addXY(big,0), pt(0,0).addXY(big-(2*small),0)];
		hp[1].type="arc"; hp[1].radius=2*small; hp[1].mode="0,1";
		hook.setShape(new lively.scene.Path(fixPath(hp), null, 4, Color.black));
		hook.scaleBy(.95);
		hook.rotateBy(hookAngle);

		this.addMorph(dial);
		this.addMorph(hook);
		dial.addMorph(shim);
		shim.addMorph(label);

		this.handlesMouseDown = function(evt) { 
			return true;
		};

		this.onMouseDown = function(evt) {
			this.center=this.bounds().center();
			var dist=this.center.dist(evt.mousePoint);
			delete this.theta0;
			delete this.theta1;
			if (dist > big/2) {
				this.theta1 = this.theta0 = evt.mousePoint.subPt(this.center).theta();
			}
		};

		// move the dial back

		this.undial = function() {
			var theta = dial.getRotation();
			if (theta <= 0.1 && theta >= 0.0) {
				dial.setRotation(0.0);
				this.stopStepping();
				if (this.dialFunc) {
					this.dialFunc(Math.round((this.counter-6)/5)%10, this.dialFuncData);
				}
			} else {
				dial.rotateBy(-0.1);
				this.counter++;
			}
		};

		this.setCallback = function(func, data) {
			this.dialFunc = func;
			this.dialFuncData = data;
		}

		this.onMouseUp = function(evt) {
			if (this.theta1) {
				this.startStepping(80,"undial"); 
				this.counter=0;
			}
		};

		this.onMouseMove =  function(evt) {
			if (evt.mouseButtonPressed && this.bounds().containsPoint(evt.mousePoint)) { 
				var dist=this.center.dist(evt.mousePoint);
				if (this.theta0 && dist > big/2) {
					var theta=evt.mousePoint.subPt(this.center).theta();
					if (theta>hookAngle && this.theta1<hookAngle) {
						// console.log("At hook");
					} else if (theta>this.theta1 || 2*Math.PI - (this.theta1-theta) < 0.2) {
						this.theta1 = theta;
						dial.setRotation(this.theta1-this.theta0);
					} 
				}
			}
		};
	}
});
console.log("end phone.js");

// sample html-ish form
// makes a set of label/entry pairs + a submit button
// - should resize itself to its morphs
// - should allow addMorph()

console.log("start form.js");
BoxMorph.subclass('SimpleFormMorph', {
	initialize: function($super, position, submit, labels, button) {
	    $super(position);
	    this.makeLayout(position, submit, labels, button);
	    this.labels = labels;
	    this.labels.push(button);
	},

	makeLayout: function(position, submit, labels, button) {
		this.linkToStyles(['widgetPanel']);

		this.offset=5;
		var maxw=0;
		for (var i=0; i < labels.length; i++) {
			var label=new TextMorph(new Rectangle(0, 0, 75, 20), labels[i]);
			this.addMorph(label).beLabel();
			label.align(label.bounds().topRight(), pt(100,this.offset));
			var h = label.bounds().height;

			var l=new TextMorph(new Rectangle(0, 0, 100, 20)).beInputLine();
			l.layoutHandler=this.doResize;
			l.label = label;	// this doesn't belong here
			this.addMorph(l);
			l.align(l.bounds().topLeft(), pt(105,this.offset));
			l.fieldName=labels[i].toLowerCase();
			if (l.fieldName == "password") {
				l.setFontFamily("webdings");
			}
			this[l.fieldName] = l; // so we can get to our morphs

			this.offset += h + 3;
			maxw = Math.max(maxw, l.bounds().width);
		}
		var b = new ButtonMorph(new Rectangle(0, 0, 75, 20)).setLabel(button || "submit");
		// should use b.align()
		b.translateBy(pt((position.width-b.bounds().width)/2, position.height-b.bounds().height-5));
		this[button || "submit"] = b;
		this["submit"] = b;
		this.addMorph(b);
		b.onMouseUp = function(evt) {
			var query="?submit=" + b.label.textString;
			for (var i=0; i<this.owner.submorphs.length; i++) {
				var m = this.owner.submorphs[i];
				if (m.fieldName) {
					query += "&" + m.fieldName + "=" + escape(m.textString);
				}
			}
			var req = new NetRequest().beSync();
			req.get(new URL(Global.location.toString()).withFilename(submit) + query);
		}
	},

	getMorph:  function(name) {
		return this[name]  || null;
	},

	reLayout: function() { // not done
		var max = pt(0,0);
	},

	doResize: function(morph, newSize) {	// gets called when one of my morps changes size
		console.log(morph.getExtent() + "=>" + newSize);
	}
});
console.log("end form.js");

// All the phone logic is here temporarily
Global.phoneDemo = function(world, origin, size) {
	origin = origin || pt(180,180); 
	size = size || 160;
	var pm = new PhoneMorph(origin, size);
	world.addMorph(pm);
    this.file = "phone.bsl"; // file to interact with server

	var labels = new Array("number");
	var dial = new SimpleFormMorph(new Rectangle(0,0,250,60), this.file, labels, "dial");
	world.addMorph(dial);
	dial.align(pt(dial.bounds().width/2,-5), pm.bounds().bottomCenter());

	pm.setCallback(function(num, data) {
		data.setTextString(data.textString + num);
	}, dial["number"]);

	labels = new Array("Server", "Username", "Password");
	var form = new SimpleFormMorph(new Rectangle(0,0,250,120), this.file, labels, "Register");
	form.align(pt(form.bounds().width/2,-5), dial.bounds().bottomCenter());
	var win = world.addMorph(new WindowMorph(form, "Configure Phone")).collapse();

	// this gets the responses from the phone CLI via the server in JSON format

	var sl = new TextMorph(new Rectangle(20,460,100,20), "diagnostics\ngo here").beLabel();
	sl.url=new URL(Global.location.toString()).withFilename("background_" + this.file);
	var model = new Model();
	model.setLabel = function(text) {
		// mabe we didn't found file then stop requesting
		if (text.match(/404 Not Found/)) {
			console.warn('some errror in phone.js')
			return
		}
		// remove html comments (this gets most of them)
		text = text.replace(/ *<!--([^-]*-[^-]+)*[^-]*-->[ \n]*/g,"");
		// console.log("Got: " + text);
	    var p; 
	    try { p = eval("(" + text + ")"); } catch (e) { console.log("error " + e); }
		if (p && p["line"]) {
			sl.updateTextString(p["line"]);
		} else {
			sl.updateTextString(text);
			sl.req.get(sl.url);
			return;
		}

		// process the cli event from the phone
		// we should probably do this on the server side

		var fields = p["line"].split("\t");
		console.log("fields=" + fields.join("|"));
		switch (fields[0]) {
			case "S":  {	// change state event
				var ring=false;
				/*
				if (fields[2].match("active")) {
					dial["dial"].submorphs[0].setTextColor(Color.primary.green);
				} else {
					dial["dial"].submorphs[0].setTextColor(Color.black);
				}
				*/
				if (fields[2].match("free")) {
					dial["dial"].setLabel("dial");
				} else if (fields[2].match("complete")) {
					dial["dial"].setLabel("hangup");
				} else if (fields[2].match("outgoing")) {
					dial["dial"].setLabel("dialing");
				} else if (fields[2].match("ringing")) {
					ring=true;
					dial["dial"].setLabel("answer");
				}
				pm.ring(ring);
			}
			case "T":  {	// text event
			}
			case "R":  {	// registration event
			}
			case "N":  {	// network statistics event
			}
			case "L":  {	// audio levels
			}
		}
		// console.log("Fetching...");
		sl.req.get(sl.url);
	}
    // this is the http request loop that runs in the background.
    // Make it a ext morph so we can see the server responses for debugging.
	sl.req = new NetRequest({model: model, setResponseText: "setLabel"});
	world.addMorph(sl);
	sl.req.get(sl.url);
        return pm;
}

}); // end of module