/*
 * Copyright (c) 2006-2009 Sun Microsystems, Inc.
 *
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

/**
 * Examples.js.  This file contains the sample morphs (mini-applications)
 * that will be included in the system when it starts. 
 */

module('lively.Examples').requires().toRun(function(thisModule) {

// ===========================================================================
// Widget (panel) Tester Demo
// ===========================================================================

Widget.subclass('TestWidget', {

    documentation: "a panel with various sample widgets such as buttons, sliders, etc.",

    openIn: function(world, location) {
	var view = this.buildView(pt(300, 220));
	view.ownerWidget = this;
        return world.addMorphAt(view, location);
    },
    
    buildView: function(extent) {
	var panel = new PanelMorph(extent);
        // Make a fancy panel.  Note: Transparency does not
        // work with gradients or stipple patterns yet!
        panel.linkToStyles(['widgetPanel'], Config.useStyling);
	var model = Record.newNodeInstance({Text: "Hello World", TextSel: null, 
	    List: ["one","two","three"],
	    ListItem: null, PrintValue: null,
	    B1Value: null, B2Value: null, SliderValue: 0.5, SliderRange: 0.1}); 
	panel.relayToModel(model);
	this.relayToModel(model);
	this.ownModel(model);

        // Two simple buttons, one toggles...
        var m = panel.addMorph(new ButtonMorph(new Rectangle(20,20,50,20)));
        m.relayToModel(model, {Value: "B1Value"});
	
        m = panel.addMorph(new ButtonMorph(new Rectangle(20,50,50,20)));
        m.relayToModel(model, {Value: "B1Value"});
        
        m.toggle = true;

        // Two buttons sharing same value...
        m = panel.addMorph(new ButtonMorph(new Rectangle(80,20,50,20)));
        m.relayToModel(model, {Value: "B2Value"});
	
	m = panel.addMorph(new ButtonMorph(new Rectangle(80,50,50,20)));
        m.relayToModel(model, {Value: "B2Value"});
	

        // Two lists sharing same selection...
        m = panel.addMorph(new TextListMorph(new Rectangle(20,80,50,20), []));
	m.relayToModel(model, {List: "-List", Selection: "ListItem"}, true);

        m = panel.addMorph(new TextListMorph(new Rectangle(80,80,50,20), []));
        m.relayToModel(model, {List: "-List", Selection: "ListItem"}, true);

        // Three text views sharing same text...
        m = panel.addMorph(new TextMorph(new Rectangle(140,20,140,20), "Hello World"));
        m.relayToModel(model, {Text: "Text", Selection: "+TextSel"});

        panel.addMorph(m = new TextMorph(new Rectangle(140,50,140,20),"Hello World"));
        m.relayToModel(model, {Text: "Text", Selection: "+TextSel"});
        panel.addMorph(m = new TextMorph(new Rectangle(140,80,140,20),"Hello World"));
	m.relayToModel(model, {Text: "Text", Selection: "+TextSel"});
        m.autoAccept = true;
        panel.addMorph(m = new TextMorph(new Rectangle(140,110,140,20), "selection"));
        m.relayToModel(model, {Text: "TextSel"});


        // Two linked print views sharing the same value
        panel.addMorph(m = new PrintMorph(new Rectangle(20,140,100,20),"3+4"));
        m.relayToModel(model, {Value: "PrintValue"});
        panel.addMorph(m = new PrintMorph(new Rectangle(20,170,100,20),"3+4"));
        m.relayToModel(model, {Value: "PrintValue"});


        // Slider linked to print view, with another for slider width
        m = panel.addMorph(new PrintMorph(new Rectangle(140,140,80,20), "0.5"));
        m.relayToModel(model, {Value: "SliderValue"});
        m = panel.addMorph(new PrintMorph(new Rectangle(230,140,50,20), "0.1"));
        m.relayToModel(model, {Value: "SliderRange"});

        m = panel.addMorph(new SliderMorph(new Rectangle(140,170,140,20)));
        m.relayToModel(model, {Value: "SliderValue",  SliderExtent: "-SliderRange"}, true);
	
        return panel;
    }

});

// ===========================================================================
// The Clock example
// ===========================================================================

Morph.subclass("ClockMorph", {

    openForDragAndDrop: false,
    styleClass: ['clock', 'raisedBorder'],

    initialize: function($super, position, radius, timeZoneOffset, hour12or24, roman) {
        $super(new lively.scene.Ellipse(position, radius));
        this.applyLinkedStyles();
        this.timeZoneOffset = timeZoneOffset || (-1 * new Date().getTimezoneOffset() / 60) - 1;
		this.nHours = hour12or24 || 12
        this.makeNewFace(roman);  // Roman
    },

    makeNewFace: function(useRoman) { 
        this.removeAllMorphs();
		var bnds = this.innerBounds();
        var radius = bnds.width/2;
		var fontSize = (this.nHours == 12) ? (useRoman ? 8 : 9) : 6;
        for (var i = 0; i < this.nHours; i++) {
			var labelPosition = bnds.center().addXY(0, -1).addPt(Point.polar(radius*0.85, (this.angleForHour(i))));
	    	var labelNo = (i == 0 && (this.nHours == 12 || useRoman)) ? this.nHours : i;
			var label = (useRoman && this.nHours == 12) ? ["XII", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI"][i] : labelNo.toString();
			this.addMorph(TextMorph.makeLabel(label,{fontSize: fontSize}).centerAt(labelPosition));
        }
        this.hours = this.addMorph(Morph.makePolygon([pt(-2.5, 0), pt(0, -radius*0.50), pt(2.5, 0)], 0, null, Color.blue));
        this.minutes = this.addMorph(Morph.makePolygon([pt(-2, 0), pt(0, -radius*0.70), pt(2, 0)], 0, null, Color.blue));
        this.seconds = this.addMorph(Morph.makePolygon([pt(-1.5, radius*0.25), pt(0, -radius*0.85), pt(1.5, radius*0.25)], 0, null, Color.red));
        this.dot = this.addMorph(Morph.makeCircle(pt(0, 0), 3, 0, null, Color.red));
    
        this.setHands();
        this.changed(); 
    },
angleForHour: function(hr) {
	    	var angle12 = (this.nHours == 12) ? -0.25 : 0.25;  // Offset of 12 oclock from zero degrees (east)
			return ( hr / this.nHours + angle12)*Math.PI*2;
    },



    reshape: Functions.Null,
    
    startSteppingScripts: function() {
        this.startStepping(1000, "setHands"); // once per second
    },

    setHands: function() { 
        var timeNow = new Date();
        var offset = Number(this.timeZoneOffset) + 1;
		offset += (this.nHours == 12) ? 3 : 6;  // compensate for angle of 12
        var second = timeNow.getUTCSeconds();
        var minute = timeNow.getUTCMinutes() + second/60;
        var hour = timeNow.getUTCHours() + offset + minute/60;
        this.hours.setRotation(this.angleForHour(hour));
        this.minutes.setRotation(minute/60*2*Math.PI);
        this.seconds.setRotation(second/60*2*Math.PI); 
    }
});


Morph.subclass("SymmetryMorph", {

    initialize: function($super, size, nFold) {
		//  WorldMorph.current().addMorph(new SymmetryMorph(300, 7)) 
       $super(new lively.scene.Rectangle(new Rectangle(2*size+20, size, size, size)));
		this.setFill(Color.blue.lighter());
		this.radius = size;
		this.menu = new MenuMorph([]);
		for (var i=2; i<=17; i++) this.menu.addItem([i.toString(), this, 'setNFold', i]);
		this.menu.openIn(this, pt(175,20), true, "Add or edit shapes in wedge at left.\n" +
			"Choose number of segments below..."); 
		this.setNFold(nFold);
  },
layoutChanged: function($super, argIfAny) {  // Override to update whenever content changes
		this.needsUpdate = true;
		return $super(argIfAny);
	},

updateIfNeeded: function() {
	if (this.needsUpdate && !(this.owner instanceof HandMorph)) 
		{this.updateDisplayMorph();
		this.needsUpdate = false; }
	},
startUp: function() {
	this.startStepping(250, "updateIfNeeded");
	},
setNFold: function(n) {
	this.nFold = n;
	if (this.guideLine) this.guideLine.remove(); 
	this.guideLine = null;  // will update the guideline
	this.needsUpdate = true;
	},
    updateDisplayMorph: function() { 
	var r = this.radius;
	var pi = Math.PI;
	var theta = pi / this.nFold;
	var vertices = [ pt(0, 0), Point.polar(r, pi/2 - theta), Point.polar(r, pi/2) ];

	// Build a new kaleidoscope disk at start or after removal
	if (!this.displayMorph || !this.displayMorph.owner) { 
		this.displayMorph = Morph.makeCircle(pt(r+10, r+10), r);
		this.displayMorph.setFill(null);
		this.world().addMorph(this.displayMorph); }
	this.displayMorph.removeAllMorphs();
	if (! this.guideLine) { this.guideLine = this.addMorph(Morph.makeLine(vertices, 1, Color.gray));
			this.guideLine.ignoreEvents(); }

	// Make a clipping slice and copy morphs from the master (this) into it
	var slice = this.displayMorph.addMorph(Morph.makePolygon(vertices, 0, null, this.getFill()));
	slice.beClipMorph();
	this.submorphs.forEach( function(morph) {
		if (!(morph instanceof SchedulableAction) && morph !== this.guideLine && morph !== this.menu) {
			var cpy = slice.addMorph(morph.duplicate());
			// Don't step the copies -- they'll step anyway because of the master
			cpy.withAllSubmorphsDo(function() {this.stopStepping(); }); }
		}.bind(this)); 

	// Make a reflected slice and then copy both slices with rotation
	var reflection = this.displayMorph.addMorph(slice.duplicate());
	reflection.setScalePoint(pt(-1, 1));
	for (var i=1; i<=this.nFold-1; i++) {
		[ slice, reflection ].forEach( function (segment) {
			var copy = segment.duplicate();
			copy.rotateBy(theta*2*i);
			this.displayMorph.addMorph(copy);
		}.bind(this)); }
	this.addMorph(this.menu); //keeps it on top
	}
});


// ===========================================================================
// Piano Keyboard
// ===========================================================================
BoxMorph.subclass('PianoKeyboard', {

    // obtained by uuencode -m
    click: "UklGRkwCAABXQVZFZm10IBAAAAABAAEAIlYAACJWAAABAAgAZGF0YSgCAACAgICAgICAgICAgICA"
	+ "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgH+AgICA"
	+"gICAgICAf4CAgICDh4qDd3h8f4aJgX2DioyCcWhufYmEe4KRkoR0a298ioyGgISKhnxzb3SBi4yG"
	+ "goOEgHdydn6GjIyGfXl5fICAf4GBgoOAfnx6eXyDiId/enuBhYOBgICCg4KAfn1/goOCgIB/fn5/"
	+ "gIGAfn+BgoKCgYB+fn+BgoKCgYCAgIGBgH+Bg4OCgH+AgYCAgIGAgICAgH9/f4CAgYGAgH9/gIGA"
	+ "gICBgYGBgYB/f4CBgYGAfn5/gIGAf3+AgYCAf3+AgYGAf3+AgICAgH+AgYGBf35/gYGBgYGBgYB/"
	+ "fn+BgoKBgH+AgYB+fX+Bg4OCgYB/f4CAgIGBgYGBgYB/f3+Af3+AgYKDgn99fX6AgoKBgICAgYB/"
	+ "f4CAgICAgICAf3+AgYGAgICAgIB/gICAgICAgIB/f3+AgYCAgICAgICBgYCAgICBgYB/f3+AgICA"
	+ "gYGAgH9/f3+AgYKBgYCAgICAgH9+f4GCgoGAf39/gICAgIGBgYCAf39/gIGBgYCAgIGBgH9/gICB"
	+ "gYGAgICAgYGAgICAgH9/gICBgYCAgH9/f4CAgICAgIGBgYB/fn+AgYKBgICAgIB/f4CBgYGAf35/"
	+ "f4CAgIGBgYCAgIB/f4CAgICAgICAgICAgIA=",



    initialize: function($super, loc) {
	//  -- Lets Boogie! --
	$super(loc.extent(pt(100, 20)));
	var wtWid, bkWid, keyRect, key, octavePt, nWhite, nBlack;
	var nOctaves = 6;
	var margin = pt(4, 4);
	wtWid = 8; bkWid = 5;


	for (var i=0; i<nOctaves+1; i++) {
	    if (i < nOctaves) {nWhite = 7;  nBlack = 5; }
	    else {nWhite = 1;  nBlack = 0; } // Hich C
	    octavePt = this.innerBounds().topLeft().addPt(margin).addXY(7*wtWid*i, -1);
	    for (var j=0; j<nWhite; j++) {
		keyRect = octavePt.addXY((j)*wtWid, 0).extent(pt(wtWid+1, 36));
		key = Morph.makeRectangle(keyRect);  key.setFill(Color.white);  key.myFill = Color.white;
        	key.relayMouseEvents(this,  { onMouseDown: "pianoKeyDown", onMouseUp: "pianoKeyUp", onMouseMove: "pianoKeyMove" } );
		key.noteNumber = i*12 + ([1, 3, 5, 6, 8, 10, 12][j]);
		this.addMorph(key);
	    }
	    for (var j=0; j<nBlack; j++) {
		keyRect = octavePt.addXY([6, 15, 29, 38, 47][j], 1).extent(pt(bkWid, 21));
		key = Morph.makeRectangle(keyRect);  key.setFill(Color.black);  key.myFill = Color.black;
        	key.relayMouseEvents(this, { onMouseDown: "pianoKeyDown", onMouseUp: "pianoKeyUp", onMouseMove: "pianoKeyMove" } );
		key.noteNumber = i*12 + ([2, 4, 7, 9, 11][j]);
		this.addMorph(key);
	    }
	}
	// New bounds encloses all keys but no more
	this.setExtent(this.bounds().extent().addPt(margin));
	this.setFill(Color.darkGray.darker());
    },

    initializeTransientState: function($super) {
	$super();
	//this.audio = new Audio("data:audio/x-wav;base64," + this.click);
	this.audio = new Audio();
	this.audio.volume = 1.0;
	this.baseURL = URL.source.dirname() + "/Resources/Sounds/C4.wav";
    },
    
    deserialize: function($super, importer, rawNode) {
	$super(importer, rawNode);
	this.submorphs.invoke('relayMouseEvents', this, 
			      { onMouseDown: "pianoKeyDown", onMouseUp: "pianoKeyUp", onMouseMove: "pianoKeyMove" });
    },


    pianoKeyDown: function(evt, key) {
	key.setFill(Color.green);
	// console.log("key number " + key.noteNumber + " pressed."); 
	this.audio.src = this.baseURL + "?noteNumber=" + key.noteNumber;
	this.audio.load();
	this.audio.play();

    },
    pianoKeyUp: function(evt, key, optSuppressPause) {
	key.setFill(key.myFill);
	// console.log("key number " + key.noteNumber + " released."); 
	if (!optSuppressPause) this.audio.pause();
	this.audio.currentTime = 0;
    },
    pianoKeyMove: function(evt, key) {
        if (!evt.mouseButtonPressed) return;
	if (!key.containsWorldPoint(evt.mousePoint) ) {
	    // user dragged out with mouse down
	    var newKey = this.morphToReceiveEvent(evt);
	    this.pianoKeyUp(evt, key, !!newKey);
	    evt.hand.setMouseFocus(null);
	    // See if it's now on a new key a la glissando

	    if (newKey) {
		this.pianoKeyDown(evt, newKey);
		evt.hand.setMouseFocus(newKey);
	    }
	}
    }
});
    


//===========================================================================
// RSS Feed reader example
// ===========================================================================

Widget.subclass('FeedWidget', {
    documentation: "RSS Feed Reader",

    initialViewExtent: pt(500, 200),
    pins: [ "URL", "+ItemList", "+ChannelTitle", "-SelectedItemTitle", "+SelectedItemContent", "+Widget"],
    
    initialize: function($super, urlString) {
	var model = new SyntheticModel(["FeedURL", "ItemList", "ChannelTitle", "SelectedItemContent", 
	    "SelectedItemTitle", "ItemMenu", "Widget"]);

	$super({model: model, 
		setURL: "setFeedURL", getURL: "getFeedURL",
		setItemList: "setItemList",
		setChannelTitle: "setChannelTitle", 
		setWidget: "setWidget",
		getSelectedItemTitle: "getSelectedItemTitle", 
		setSelectedItemContent: "setSelectedItemContent"});

	this.setModelValue("setURL", urlString);
	this.initializeTransientState();
    },

    onDeserialize: function() {
	this.initializeTransientState();
    },

    getURL: function() {
	return new URL(this.getModelValue("getURL"));
    },

    setURL: function(urlString) {
	var code = this.setModelValue("setURL", urlString);
	this.feed.kickstart();
    },

    initializeTransientState: function() {
	this.channels = null;
	this.getModel().ItemMenu = [
	    ["open in new window", "openLink"],
	    ["get XML source", "makeSourcePane"],
	    ["Jonathan Schwartz's Blog", "setURL", "http://blogs.sun.com/jonathan/feed/entries/rss"],
	    ["Unofficial Apple blog", "setURL", "http://feeds.tuaw.com/weblogsinc/tuaw"],
	    ["Ajaxian", "setURL", "http://feeds.feedburner.com/ajaxian"],
	];
	this.feed = new Feed({model: this, setFeedChannels: "pvtSetFeedChannels", getURL: "getURL"});
	this.setModelValue("setWidget", this);
	this.feed.kickstart();
    },


    openLink: function(ignored, evt) {
	var item = this.getEntry(this.getModelValue("getSelectedItemTitle"));
	var urlString = item.link();
	if (urlString) 
	    window.open(urlString);
    },

    makeSourcePane: function(ignored, evt) {
	var item = this.getEntry(this.getModelValue("getSelectedItemTitle"));
	if (!item) return; // complain?
	WorldMorph.current().addTextWindow({ 
	    title: "XML source for " + item.title(),
	    position: evt.point(),
	    extent: pt(500, 200),
	    content: item.toMarkupString(),
	    acceptInput: false
	});
    },

    pvtSetFeedChannels: function(channels) {
	this.channels = channels;
	var items = this.extractItemList(channels);
	//console.log("set items to " + items);
	this.setModelValue("setItemList",  items);
	this.setModelValue("setChannelTitle", "RSS feed from " +  channels[0].title());
    },
    
    updateView: function(aspect, controller) {
	var p = this.modelPlug;
	if (!p) return;
	switch (aspect) {
	case this.modelPlug.getSelectedItemTitle:
	    var title = this.getModelValue("getSelectedItemTitle");
	    if (title) {
		var entry = this.getEntry(title);
		// console.log("got entry " + entry);
		this.setModelValue("setSelectedItemContent", entry ? entry.description() : "?");
	    }
	    break;
	}
    },
    
    extractItemList: function(channels) {
	return channels[0].items.invoke('title');
    },

    getEntry: function(title) {
        var items = this.channels[0].items;
        for (var i = 0; i < items.length; i++) {
            if (items[i].title() == title) {
                return items[i];
            }
        }
	return null;
    },
    
    getSelectedItemDescription: function() { 
	var entry = this.getEntry(this.getModelValue("getSelectedItemTitle"));
	return entry && entry.description();
    },

    buildView: function(extent, model) {
        var panel = new PanelMorph(extent);
	panel.linkToStyles(['panel']);


        var rect = extent.extentAsRectangle();
        var m = panel.addMorph(newTextListPane(rect.withBottomRight(rect.bottomCenter())));
        m.connectModel({model: model, getList: "getItemList", 
			setSelection: "setSelectedItemTitle", getMenu: "getItemMenu", getMenuTarget: "getWidget"});
	
	var m = panel.addMorph(newTextPane(rect.withTopLeft(rect.topCenter())));
	m.innerMorph().acceptInput = false;
        m.connectModel({model: model, getText: "getSelectedItemContent"});
        return panel;
    },
    
    getViewTitle: function() {
	var title = new TextMorph(new Rectangle(0, 0, 150, 15), 'RSS feed                    ').beLabel();
	title.connectModel({model: this.getModel(), getText: 'getChannelTitle'});
	return title;
    }
    
});





// ===========================================================================
// Squiggle Draw Example
// ===========================================================================


PanelMorph.subclass('SquiggleMorph', {

    documentation: "An even simpler drawing program",
    drawingHandColor: Color.yellow,
    style: { 
	borderWidth: 2, 
	fill: using(lively.paint).link({$:"LinearGradient", 
					stops: [{$:"Stop", offset: 0, color: Color.white},
						{$:"Stop", offset: 1, color: Color.primary.blue.lighter()}], 
					vector: lively.paint.LinearGradient.NorthSouth
				       })
    },
    
    penStyle: {
	borderWidth: 2, borderColor: Color.red, fill: null
    },
    
    initialize: function($super, ext) {
        $super(ext);
        // The squiggle that we are creating currently
        this.currentMorph = null;
        this.start = null;
        this.savedHandColor = null;
	this.contentMorph = this.addMorph(new ClipMorph(ext.extentAsRectangle().insetBy(this.getBorderWidth()/2)));
	this.contentMorph.ignoreEvents();
    },
    
    onMouseDown: function(evt) {
        if (!this.currentMorph) {
            this.start = this.localize(evt.point());
            this.currentMorph = this.contentMorph.addMorph(new Morph(new lively.scene.Polyline([this.start])));
	    this.currentMorph.applyStyle(this.penStyle);
            // TODO: relaying events stops from moving morphs after drawing them..
            // this.currentMorph.relayMouseEvents(this, {onMouseMove: "onMouseMove"});

            // 'solution' 1: we disable the drawn morph and enable morphs only 
            // when selection tool is in use
            /*
            if (!this.value) {
                this.currentMorph.ignoreEvents();
            }
            */ 
            this.savedHandColor = evt.hand.getFill();
            evt.hand.setFill(this.drawingHandColor);
        } else {
            this.onMouseUp(evt);
        }
    },

    onMouseMove: function(evt) {
        if (this.currentMorph) {
	    if (!this.containsWorldPoint(evt.point())) {
		this.onMouseUp(evt);
		return;
	    } 
	    var verts = this.currentMorph.shape.vertices();
	    var pt = this.localize(evt.point());//.subPt(this.start));
	    if (verts.length > 0 && !verts[verts.length - 1].eqPt(pt)) {
                verts.push(pt);
                this.currentMorph.shape.setVertices(verts);
	    }
        } else {
            this.checkForControlPointNear(evt);
        }
    },

    onMouseUp: function(evt) {
        this.currentMorph = null;
        this.start = null;
        evt.hand.setFill(this.savedHandColor);
    },

    handlesMouseDown: Functions.True
        
});

// ===========================================================================
// The 3D Rotation Example
// ===========================================================================

/*==============================================================================
 * ThreeDeeDemo.js -- 3D object rotation demo
 * Based on C code written originally in the 1980s
 * and a Java version written in 1998.
 *============================================================================*/

using(namespace('threedee', thisModule)).run(function(threedee) {

    // Rapid sin and cos functions inherited from the original
    // C program.  Note that you must supply a multiplier in 
    // addition to the (decimal) angle parameter,
    // or otherwise the result is always 0 or 1.

    // Tables for rapid sin calculation
    var upper = new Array( 
        0, 3050, 5582, 6159, 1627, 5440, 7578, 3703, 3659, 9461, 2993, 
        4887, 226, 7813, 8902, 7469, 6260, 1054, 5473, 6862, 3701, 5349, 
        4523, 978, 9455, 9604, 1604, 2008, 6059, 6048, 1, 3990, 6695, 
        1275, 6679, 8431, 4456, 4841, 6329, 3241, 3302, 5690, 1901, 860, 
        2796, 5741, 9414, 4187, 3469, 1923, 4309, 2870, 6152, 3863, 5473, 
        5603, 6047, 3457, 1412, 5011, 2521, 5462, 3319, 1496, 3801, 4411, 
        3244, 4157, 7398, 6297, 5625, 538, 5266, 8623, 8015, 652, 7317, 
        9010, 5819, 374, 7325, 5375, 5393, 5859, 1997, 6283, 819, 2186, 
        3281, 6565, 1
    ); 

    var lower = new Array(
        1, 174761, 159945, 117682, 23324, 62417, 72497, 30385, 26291, 60479, 
        17236, 25612, 1087, 34732, 36797, 28858, 22711, 3605, 17711, 21077, 
        10821, 14926, 12074, 2503, 23246, 22725, 3659, 4423, 12906, 12475, 2, 
        7747, 12634, 2341, 11944, 14699, 7581, 8044, 10280, 5150, 5137, 8673, 
        2841, 1261, 4025, 8119, 13087, 5725, 4668, 2548, 5625, 3693, 7807, 4837, 
        6765, 6840, 7294, 4122, 1665, 5846, 2911, 6245, 3759, 1679, 4229, 4867, 
        3551, 4516, 7979, 6745, 5986, 569, 5537, 9017, 8338, 675, 7541, 9247, 
        5949, 381, 7438, 5442, 5446, 5903, 2008, 6307, 821, 2189, 
        3283, 6566, 1
    );

    function rapidSin90(multiplier, sin) {
        return Math.round(multiplier * upper[sin] / lower[sin]);
    }

    function rapidSin(multiplier, sin) {

        while (sin < 0) sin += 360; // Can be slow...
        sin %= 360;

        if (sin <=  90) return rapidSin90(multiplier, sin);
        if (sin <= 180) return rapidSin90(multiplier, 180-sin);
        if (sin <= 270) return -rapidSin90(multiplier, sin-180);
        return -rapidSin90(multiplier, 360-sin);
    }
    
    function rapidCos(multiplier, cos) {
        return rapidSin(multiplier, cos+90);
    }

/*==============================================================================
 * Constants for the 3D viewer
 *============================================================================*/

    // center: Used for storing the center coordinates
    // of our physical drawing plane (window).
    var center = pt(90, 100); // Math.round(window.width / 2), Math.round(window.height / 2);

    // planeDist: The 2D projection plane distance from origo
    var planeDist = -180;

    // clipPlane: Object move limit (to avoid clipping problems)
    var clipPlane = -5750;

/*==============================================================================
 * 3D object definition (the object to be rotated/displayed)
 *============================================================================*/

    // points3D: The endpoints of the wireframe image
    // Define "Sun rose" as a wireframe image
    var points3D  = [
    [750, 200, 0], 
    [553, 234, 0],
    [380, 334, 0],
    [252, 487, 0],
    [183, 675, 0],
    [175, 2700, 0],
    [650, 2700, 0],
    [650, 775, 0],
    [850, 775, 0],
    [850, 2700, 0],
    [1325, 2700, 0],
    [1316, 675, 0],
    [1248, 487, 0],
    [1119, 334, 0],
    [946, 234, 0],
    [750, 200, 0],

    [2150, 2700, 0],
    [1953, 2665, 0],
    [1780, 2565, 0],
    [1652, 2412, 0],
    [1583, 2225, 0],
    [1575, 200, 0],
    [2050, 200, 0],
    [2050, 2125, 0],
    [2250, 2125, 0],
    [2250, 200, 0],
    [2725, 200, 0],
    [2716, 2225, 0],
    [2648, 2412, 0],
    [2519, 2565, 0],
    [2346, 2665, 0],
    [2150, 2700, 0],

    [-200, 750, 0],
    [-234, 553, 0],
    [-334, 380, 0],
    [-487, 252, 0],
    [-675, 184, 0],
    [-2700, 175, 0],
    [-2700, 650, 0],
    [-775, 650, 0],
    [-775, 850, 0],
    [-2700, 850, 0],
    [-2700, 1325, 0],
    [-675, 1316, 0],
    [-487, 1248, 0],
    [-334, 1119, 0],
    [-234, 946, 0],
    [-200, 750, 0],

    [-2700, 2150, 0],
    [-2665, 1953, 0],
    [-2565, 1780, 0],
    [-2412, 1652, 0],
    [-2225, 1583, 0],
    [-200, 1575, 0],
    [-200, 2050, 0],
    [-2125, 2050, 0],
    [-2125, 2250, 0],
    [-200, 2250, 0],
    [-200, 2725, 0],
    [-2225, 2716, 0],
    [-2412, 2648, 0],
    [-2565, 2519, 0],
    [-2665, 2346, 0],
    [-2700, 2150, 0],

    [-2150, -2700, 0],
    [-2346, -2665, 0],
    [-2519, -2565, 0],
    [-2648, -2412, 0],
    [-2716, -2225, 0],
    [-2725, -200, 0],
    [-2250, -200, 0],
    [-2250, -2125, 0],
    [-2050, -2125, 0],
    [-2050, -200, 0],
    [-1575, -200, 0],
    [-1583, -2225, 0],
    [-1652, -2412, 0],
    [-1780, -2565, 0],
    [-1953, -2665, 0],
    [-2150, -2700, 0],

    [-750, -200, 0],
    [-946, -235, 0],
    [-1119, -335, 0],
    [-1248, -488, 0],
    [-1316, -675, 0],
    [-1325, -2700, 0],
    [-850, -2700, 0],
    [-850, -775, 0],
    [-650, -775, 0],
    [-650, -2700, 0],
    [-175, -2700, 0],
    [-183, -675, 0],
    [-252, -488, 0],
    [-380, -335, 0],
    [-553, -235, 0],
    [-750, -200, 0],

    [2700, -2150, 0],
    [2665, -2346, 0],
    [2565, -2519, 0],
    [2412, -2648, 0],
    [2225, -2716, 0],
    [200, -2725, 0],
    [200, -2250, 0],
    [2125, -2250, 0],
    [2125, -2050, 0],
    [200, -2050, 0],
    [200, -1575, 0],
    [2225, -1583, 0],
    [2412, -1652, 0],
    [2565, -1780, 0],
    [2665, -1953, 0],
    [2700, -2150, 0],

    [200, -750, 0],
    [235, -946, 0],
    [335, -1119, 0],
    [488, -1248, 0],
    [675, -1316, 0],
    [2700, -1325, 0],
    [2700, -850, 0],
    [775, -850, 0],
    [775, -650, 0],
    [2700, -650, 0],
    [2700, -175, 0],
    [675, -184, 0],
    [488, -252, 0],
    [335, -380, 0],
    [235, -553, 0],
    [200, -750, 0],

    [0, 0, 0],
    [0, 0, 2000]
];

/*==============================================================================
 * WireObject instance constructor
 *============================================================================*/

Object.subclass('lively.Examples.threedee.WireObject', {
    // WireObject constructor: create the wireframe object
    initialize: function(hereX, hereY, hereZ) {

        // Set the location of the object
        this.x = hereX;
        this.y = hereY;
        this.z = hereZ;

        // Allocate arrays for storing the individual point
        // projection coordinates of the object
        this.px = [];
        this.py = [];
        this.pz = [];

        // Initialize the 3D projection vector
        for (var i = 0; i < points3D.length; i++) {
            this.px[i] = points3D[i][0];
            this.py[i] = points3D[i][1];
            this.pz[i] = points3D[i][2];
        }
                
        // Create the 2D projection (view) vector
        this.vx = [];
        this.vy = [];

    },
    
    /*==============================================================================
     * WireObject instance rotation and projection methods
     *============================================================================*/

    // Function WireObject.rotate: rotate the object by the given angle
    // (angles are expressed in decimal degrees, i.e., full circle = 360)
    rotate: function(angleX, angleY, angleZ) {

        var limit = points3D.length;
        
        for (var i = 0; i < limit; i++) {
            var rx = points3D[i][0];
            var ry = points3D[i][1];
            var rz = points3D[i][2];
    
            // Rotate around X axis
            if (angleX != 0) {
                var nry = ry;
                ry = rapidCos(ry, angleX) - rapidSin(rz, angleX);
                rz = rapidSin(nry, angleX) + rapidCos(rz, angleX);
            }
            
            // Rotate around Y axis
            if (angleY != 0) {
                var nrx = rx;
                rx = rapidCos(rx, angleY) - rapidSin(rz, angleY);
                rz = rapidSin(nrx, angleY) + rapidCos(rz, angleY);
            }
    
            // Rotate around Z axis
            if (angleZ != 0) {
                var nrx = rx;
                rx = rapidCos(rx, angleZ) - rapidSin(ry, angleZ);
                ry = rapidSin(nrx, angleZ) + rapidCos(ry, angleZ);
            }
            
            this.px[i] = rx;
            this.py[i] = ry;
            this.pz[i] = rz;
        }
    },
      
    // Function WireObject.project: calculate a 2D projection
    // for the wireframe object based on the camera coordinates
    project: function(cameraX, cameraY, cameraZ) {
        var sx, sy, sz;
        var cx, cy;
        
        var limit = points3D.length;
        for (var i = 0; i < limit; i++) {
            sx = this.x + this.px[i] + cameraX;
            sy = this.y + this.py[i] + cameraY;
            sz = this.z + this.pz[i] + cameraZ;
            
            // Calculate perspective projection
            cx = Math.round(sx * planeDist / sz);
            cy = Math.round(sy * planeDist / sz);
            
            // Note: for parallel (non-perspective) projection,
            // replace 'cx' and 'cy' below with 'sx' and 'sy'
            this.vx[i] = center.x  + cx;
            this.vy[i] = center.y - cy;
        }
    },

    // Function WireObject.display: display the 2D projection of the object
    display: function(morphArray) {
    
        // NOTE: Sun Logo consists of eight U's
        // Because we cannot use different colors
        // for drawing the different line segments,
        // we draw the logo as eight separate polyline
        // morphs, all generated from the same projection
        // vector.
    
        var U = 0;
    
        for (var i = 0; i < 8; i++) { 
            var shape = new lively.scene.Polygon([pt(this.vx[U],this.vy[U])]);
	    shape.setFill(Color.primary.blue);
	    shape.setStrokeWidth(2);
	    shape.setStroke(Color.black);
            shape.setLineJoin(lively.scene.LineJoins.Round);
            morphArray[i].setShape(shape);
            // shape.setFill(new Color(0xAA, 0, 0xCC)); // Approximate Sun purple color

            var verts = shape.vertices();
        
            // Note: Loop starts from 1 intentionally!
            for (var j = 1; j < 16; j++) {
                var thisPt = pt(this.vx[U+j], this.vy[U+j]);
                verts.push(thisPt);
            }
            shape.setVertices(verts);
        
            // Proceed to the next Sun U
            U += 16;
        }
    },

    // Function paint(): (Re)paint the 3D view
    paint: function(morphArray, angleX, angleY, angleZ) {
        this.rotate(angleX, angleY, angleZ);
        this.project(0, 0, 0);
        this.display(morphArray);
    }

}); 

PanelMorph.subclass('lively.Examples.Sun3DMorph', {
    documentation: "Sun logo rotating in 3D",

    initialize: function($super, rect) {
        $super(rect);
	
	this.applyStyle({borderWidth: 2, fillOpacity: .2, fill: Color.veryLightGray});
	this.contentMorph = this.addMorph(new ClipMorph(this.innerBounds().insetBy(this.getBorderWidth()/2)));
	this.contentMorph.ignoreEvents();

        // Create a bunch of polyline objects for drawing the Sun U's 
        this.morphArray = [];
        for (var i = 0; i < 8; i++) {
            this.morphArray[i] = new Morph(new lively.scene.Polyline([pt(0,0)]));
            this.morphArray[i].applyStyle({borderWidth: 2, borderColor: Color.red});
            this.contentMorph.addMorph(this.morphArray[i]);
        }

        this.wireObject = new threedee.WireObject(0,  0, -6000);
        this.wireObject.paint(this.morphArray, 0, 0, 0);

        return this;
    },

    onMouseMove: function(evt) {

        var angleY = -evt.point().x;
        var angleX = -evt.point().y;
        if (this.wireObject) {
            this.wireObject.paint(this.morphArray, angleX, angleY, 0);
        }
	evt.hand.setMouseFocus(this);
        return true;
    }

});

}); // end of the 3D demo module

// ===========================================================================
// The Asteroids Game Example
// ===========================================================================

// The JavaScript implementation of the Asteroids game
// is derived from a Java applet written and copyrighted
// by Mike Hall in 1998.  The code is used here by permission.

// Note: The code below has been translated from the original
// Java implementation; it has nothing to do with morphic style
// and should not be used as a model for a morphic application.
// See "Fasteroids" is "Contributions.js" file for a sketch of
// how it should be done.

// FIXME: There are still problems with the coordinate space.
// For instance, shooting is not as precise as in the original game.

/*****************************************************************************

  Asteroids.js

  Keyboard Controls:

  S            - Start Game    P           - Pause Game
  Cursor Left  - Rotate Left   Cursor Up   - Fire Thrusters
  Cursor Right - Rotate Right  Cursor Down - Fire Retro Thrusters
  Spacebar     - Fire Cannon   H           - Hyperspace
  M            - Toggle Sound  D           - Toggle Graphics Detail

*****************************************************************************/

using(namespace('asteroids', thisModule)).run(function(module) {

// The game instance
var gameMorph = null;
    
/* Graphics parameters */

// Dimensions of the graphics area (should be based on the size of the window)
var gameWidth  = 600;
var gameHeight = 300;

/************************************************************************************************
  The AsteroidsSprite class defines a game object, including it's shape, position, movement and
  rotation. It also can detemine if two objects collide.
************************************************************************************************/

Object.subclass('lively.Examples.asteroids.AsteroidsSprite', {

    /* boolean */ active: false,    // Active flag.
    /* double */  angle: 0,         // Current angle of rotation.
    /* double */  deltaAngle:  0,   // Amount to change the rotation angle.
    /* double */  currentX: 0,      // Current position on screen.
    /* double */  currentY: 0,
    /* double */  deltaX: 0,        // Amount to change the screen position.
    /* double */  deltaY: 0,
    /* Point[] */ shape: null,  // Initial sprite shape, centered at the origin (0,0).
    /* lively.scene.Polygon */ sprite: null, // Final location and shape of sprite after applying rotation and
    // moving to screen position. Used for drawing on the screen and
    // in detecting collisions.
    // Morphic-specific data
    morph: null,
    morphShape: null,

    initialize: function(vertices) {
        this.shape = vertices;
        this.sprite = new lively.scene.Polygon([]);
	this.sprite.setFill(Color.black);
	this.sprite.setStrokeWidth(1);
	this.sprite.setStroke(Color.yellow);
    },
    
    // Methods:

    advance: function() {
        // Update the rotation and position of the sprite based on the delta values. If the sprite
        // moves off the edge of the screen, it is wrapped around to the other side.

        this.angle += this.deltaAngle;
        if (this.angle < 0)
            this.angle += 2 * Math.PI;
        if (this.angle > 2 * Math.PI)
            this.angle -= 2 * Math.PI;
        this.currentX += this.deltaX;
        if (this.currentX < -gameWidth / 2)
            this.currentX += gameWidth;
        if (this.currentX > gameWidth / 2)
            this.currentX -= gameWidth;
        this.currentY -= this.deltaY;
        if (this.currentY < -gameHeight / 2)
            this.currentY += gameHeight;
        if (this.currentY > gameHeight / 2)
            this.currentY -= gameHeight;
    },
    
    render: function() {
        // Render the sprite's shape and location by rotating its base shape
        // and moving it to its proper screen position.

        var tfm = new lively.scene.Similitude(pt(this.currentX + gameWidth/2, this.currentY + gameHeight/2), -this.angle, pt(1,1));
        this.sprite.setVertices(this.shape.map(function(v) { return tfm.transformPoint(v); }));
        // Create a new morph based on the sprite
        this.morph = this.createMorph(this.sprite);
    },
    
    isColliding: function(/* AsteroidsSprite */ s) {
        // Determine if one sprite overlaps with another, i.e., if any vertice
        // of one sprite lands inside the other.

        var mine = this.sprite.vertices();
        var other = s.sprite.vertices();
        for (var i = 0; i < other.length; i++)
            if (this.sprite.containsPoint(other[i]))
                return true;
        for (var i = 0; i < mine.length; i++)
            if (s.sprite.containsPoint(mine[i]))
                return true;
        return false;
    },

    createMorph: function(sprite) {
        // This function creates a Morph out of a game polygon/sprite
        var verts = sprite.vertices();
        if (verts.length > 0) {
            var morph;
            // This is inefficient: We should reuse the shape instead of creating a new one
            if (this.morph) {
                morph = this.morph; 
                morph.setPosition(verts[0]);
                morph.setShape(sprite);
            } else {
                morph = new Morph(sprite);
                morph.setShape(sprite);
                gameMorph.addMorph(morph);
            }
            return morph;
        } else {
            return null;
        }
    }

});


/************************************************************************************************
  Main application code -- constants and variables
************************************************************************************************/

  // Constants

  /* static final int */ var SHORTDELAY = 50;         // Milliseconds between screen updates.
  /* static final int */ var LONGDELAY = 1000;        // Longer delay when the game is collapsed.
  /* static final int */ var DELAY = -1;              // Milliseconds between screen updates.


  /* static final int */ var MAX_SHIPS = 3;           // Starting number of ships per game.

  /* static final int */ var MAX_SHOTS =  6;          // Maximum number of sprites for photons,
  /* static final int */ var MAX_ROCKS =  8;          // asteroids and explosions.
  /* static final int */ var MAX_SCRAP = 20;

  /* static final int */ var SCRAP_COUNT = 30;        // Counter starting values.
  /* static final int */ var HYPER_COUNT = 60;
  /* static final int */ var STORM_PAUSE = 30;
  /* static final int */ var UFO_PASSES  =  3;

  /* static final int */ var MIN_ROCK_SIDES =  8;     // Asteroid shape and size ranges.
  /* static final int */ var MAX_ROCK_SIDES = 12;
  /* static final int */ var MIN_ROCK_SIZE  = 15;     // Used to be 20
  /* static final int */ var MAX_ROCK_SIZE  = 30;     // Used to be 40
  /* static final int */ var MIN_ROCK_SPEED =  2;
  /* static final int */ var MAX_ROCK_SPEED = 12;

  /* static final int */ var BIG_POINTS    =  25;     // Points for shooting different objects.
  /* static final int */ var SMALL_POINTS  =  50;
  /* static final int */ var UFO_POINTS    = 250;
  /* static final int */ var MISSILE_POINTS = 500;

  /* static final int */ var NEW_SHIP_POINTS = 5000;  // Number of points needed to earn a new ship.
  /* static final int */ var NEW_UFO_POINTS  = 2750;  // Number of points between flying saucers.

  // Background stars.

  /* int */ var numStars = 0;
  /* Point[] */ stars = [];

  // Game data.

  /* int */ var score = 0;
  /* int */ var highScore = 0;
  /* int */ var newShipScore = 0;
  /* int */ var newUfoScore = 0;

  /* boolean */ var loaded = false;
  /* boolean */ var paused = false;
  /* boolean */ var playing = false;
  /* boolean */ var sound = false;
  /* boolean */ var detail = false;

  // Key flags.

  /* boolean */ var left  = false;
  /* boolean */ var right = false;
  /* boolean */ var up    = false;
  /* boolean */ var down  = false;

  // Sprite objects.

  /* AsteroidsSprite */   var ship = null;
  /* AsteroidsSprite */   var ufo = null;
  /* AsteroidsSprite */   var missile = null;
  /* AsteroidsSprite[] */ var photons    = []; /* new AsteroidsSprite[MAX_SHOTS]; */
  /* AsteroidsSprite[] */ var asteroids  = []; /* new AsteroidsSprite[MAX_ROCKS]; */
  /* AsteroidsSprite[] */ var explosions = []; /* new AsteroidsSprite[MAX_SCRAP]; */

  // Ship data.

  /* int */ var shipsLeft = 0;       // Number of ships left to play, including current one.
  /* int */ var shipCounter = 0;     // Time counter for ship explosion.
  /* int */ var hyperCounter = 0;    // Time counter for hyperspace.

  // Photon data.

  /* int[] */ var photonCounter = []; /* new int[MAX_SHOTS]; */ // Time counter for life of a photon.
  /* int   */ var photonIndex = 0;                              // Next available photon sprite.

  // Flying saucer data.

  /* int */ var ufoPassesLeft = 0;    // Number of flying saucer passes.
  /* int */ var ufoCounter = 0;       // Time counter for each pass.

  // Missile data.

  /* int */ var missileCounter;       // Counter for life of missile.

  // Asteroid data.

  /* boolean[] */ var asteroidIsSmall = [] /* new boolean[MAX_ROCKS]; */ // Asteroid size flag.
  /* int       */ var asteroidsCounter = 0;                              // Break-time counter.
  /* int       */ var asteroidsSpeed = 0;                                // Asteroid speed.
  /* int       */ var asteroidsLeft = 0;                                 // Number of active asteroids.

  // Explosion data.

  /* int[] */ var explosionCounter = []; /* new int[MAX_SCRAP]; */ // Time counters for explosions.
  /* int   */ var explosionIndex = 0;                              // Next available explosion sprite.

  // Sound clips.
  // NOTE: Audio is not supported yet in the JavaScript version
  /* AudioClip */ var crashSound = null;
  /* AudioClip */ var explosionSound = null;
  /* AudioClip */ var fireSound = null;
  /* AudioClip */ var missileSound = null;
  /* AudioClip */ var saucerSound = null;
  /* AudioClip */ var thrustersSound = null;
  /* AudioClip */ var warpSound = null;

  // Flags for looping sound clips.

  /* boolean */ var thrustersPlaying = false;
  /* boolean */ var saucerPlaying = false;
  /* boolean */ var missilePlaying = false;

  // Values for the offscreen image.

  /* Dimension */ var offDimension = null;
  /* Image */     var offImage = null;
  /* Graphics */  var offGraphics = null;

  // Font data.
  /* NOTE: Fonts are not supported yet in the JavaScript version
  Font font = new Font("Helvetica", Font.BOLD, 12);
  FontMetrics fm;
  */
  
  var text_score = null;
  var text_ships = null;
  var text_high  = null;
  var text_name  = null;
  var text_info  = null;
  
  var fontWidth = 16;
  var fontHeight = 16; // getStringHeight("X");

/************************************************************************************************
  Main application code -- Methods.
************************************************************************************************/


  // Application initialization
  module.initialize = function() {

      // Generate starry background.
      initBackground();
      
      // Show score, opening texts, etc.
      showTextStrings();
      
      // Create shape for the ship sprite.
      
      ship = new module.AsteroidsSprite([pt(0, -10), pt(7, 10), pt(-7, 10)]);
      
      // Create shape for the photon sprites.
      
      for (var i = 0; i < MAX_SHOTS; i++) {
          photons[i] = new module.AsteroidsSprite([pt(1,1), pt(1,-1), pt(-1,1), pt(-1,-1)]);
      }
      
      // Create shape for the flying saucer.
      
      ufo = new module.AsteroidsSprite([pt(-15,0), pt(-10,-5), pt(-5,-5), pt(-5,-9), pt(5,-9), pt(5,-5), pt(10,-5), pt(15,0), pt(10,5),pt(-10,5)]);
      
      // Create shape for the guided missile.
      
      missile = new module.AsteroidsSprite([pt(0,-4), pt(1,-3), pt(1,3), pt(2,4), pt(-2,4),pt(-1,3), pt(-1,-3)]);
      
      // Create asteroid sprites.
      
      for (i = 0; i < MAX_ROCKS; i++)
          asteroids[i] = new module.AsteroidsSprite([]);
      
      // Create explosion sprites.
      
      for (i = 0; i < MAX_SCRAP; i++)
          explosions[i] = new module.AsteroidsSprite([]);

    // Set font data.
    /* NOTE: Fonts are not supported yet
    g.setFont(font);
    fm = g.getFontMetrics();
    fontWidth = fm.getMaxAdvance();
    fontHeight = fm.getHeight();
    */

    // Initialize game data and put us in 'game over' mode.

    highScore = 0;
    sound = false;
    detail = false;
    initGame();
    endGame();
  }

  function initGame() {

    // Initialize game data and sprites.

    score = 0;
    shipsLeft = MAX_SHIPS;
    asteroidsSpeed = MIN_ROCK_SPEED;
    newShipScore = NEW_SHIP_POINTS;
    newUfoScore = NEW_UFO_POINTS;
    initShip();
    initPhotons();
    stopUfo();
    stopMissile();

    initAsteroids();
    initExplosions();
    playing = true;
    paused = false;
  }

  function endGame() {

    // Stop ship, flying saucer, guided missile and associated sounds.

    playing = false;
    stopShip();
    stopUfo();
    stopMissile();
  }

  // Create the starry background
  function initBackground() {

    numStars = Math.floor(gameWidth * gameHeight / 5000);
    stars = []; /* new Point[numStars]; */

    var starStyle = {fill: Color.yellow, borderColor: Color.yellow};
    for (var i = 0; i < numStars; i++) {
        stars[i] = pt((Math.random() * gameWidth), (Math.random() * gameHeight));

        var m = Morph.makeRectangle(stars[i], pt(1, 1));
        m.applyStyle(starStyle);
        gameMorph.addMorph(m);
    }
  }

  var textStyle = {fill: Color.black, textColor: Color.yellow};

  function showTextStrings() {

    if (!text_score) {
        text_score = new TextMorph(new Rectangle(10, 0, 100, fontHeight), "Score: " + score);
        text_score.applyStyle(textStyle);
        gameMorph.addMorph(text_score);
    } else {
        text_score.setTextString("Score: " + score);
    }
      
    if (!text_ships) {
        text_ships = new TextMorph(new Rectangle(10, gameHeight-fontHeight-6, 100, fontHeight), "Ships: " + shipsLeft);
        text_ships.applyStyle(textStyle);
        gameMorph.addMorph(text_ships);
    } else {
        text_ships.setTextString("Ships: " + shipsLeft);
    }

    if (!text_high) {
        text_high = new TextMorph(new Rectangle(gameWidth-120, 0, 100, fontHeight), "High: " + highScore);
	text_high.applyStyle(textStyle);
        gameMorph.addMorph(text_high);
    } else {
        text_high.setTextString("High: " + highScore);
    }

    if (!playing) {
      if (!text_name) {
          text_name = new TextMorph(new Rectangle(gameWidth / 2 - 140, gameHeight / 2 - 36, 280, 16), "A S T E R O I D S ! Copyright 1998 by Mike Hall");
	  text_name.applyStyle(textStyle);
          gameMorph.addMorph(text_name);
      }
      
      if (!text_info) {
          text_info = new TextMorph(new Rectangle(gameWidth / 2 - 100, gameHeight / 2, 200, 16), "Game Over: Press S to start");
	  text_info.applyStyle(textStyle);
          gameMorph.addMorph(text_info);
      }
    } else {
        if (text_name) {
            text_name.remove();
            text_name = null;
        }
        
        if (text_info) {
            text_info.remove();
            text_info = null;    
        }  
    }
  }


ClipMorph.subclass("lively.Examples.asteroids.GameMorph", {
    
    runAsteroidsGame: function runAsteroidsGame() {

    // This is the main loop.
    
    // Load sounds.
    
    if (!loaded) {
        loadSounds();
        loaded = true;
        // loadThread.stop();
    }

    if (!(paused || this.owner.isCollapsed())) {
        // Move and process all sprites.

        updateShip();
        updatePhotons();
        updateUfo();
        updateMissile();
        updateAsteroids();
        updateExplosions();

        // Check the score and advance high score, add a new ship or start the flying
        // saucer as necessary.

        if (score > highScore)
            highScore = score;
        if (score > newShipScore) {
            newShipScore += NEW_SHIP_POINTS;
            shipsLeft++;
        }
        if (playing && score > newUfoScore && !ufo.active) {
            newUfoScore += NEW_UFO_POINTS;
            ufoPassesLeft = UFO_PASSES;
            initUfo();
        }

        // If all asteroids have been destroyed create a new batch.

        if (asteroidsLeft <= 0) {
            if (--asteroidsCounter <= 0)
                initAsteroids();
        }

        // Update the screen (necessary because this doesn't use morphic for animation)
        if (this.world().repaintCanvas) this.world().repaintCanvas();  // Needed for canvas (SVG is OK)
        
        // Update score
        showTextStrings();

    }

    // If the game is collapsed, use a longer delay to reduce CPU usage
    // Now it actually pauses when collapsed, but slow-down logic is still here -- DI
    var oldDelay = DELAY;
    DELAY = this.owner.isCollapsed() ? LONGDELAY : SHORTDELAY;
    if (oldDelay != DELAY) console.log("Changing timer from %s to %s for Asteroids", oldDelay, DELAY);
    
    // Set new timer delay for the game
    if (this.timeoutID) window.clearTimeout(this.timeoutID);
    if (!this.timerCallback) this.timerCallback = arguments.callee.bind(this).logErrors('Asteroid Timer');
    this.timeoutID = Global.setTimeout(this.timerCallback, DELAY);

    }

});

  function loadSounds() {

    // Load all sound clips by playing and immediately stopping them.

    /* NOTE: Sounds are not supported yet
    try {
      crashSound     = getAudioClip(new URL(getDocumentBase(), "crash.au"));
      explosionSound = getAudioClip(new URL(getDocumentBase(), "explosion.au"));
      fireSound      = getAudioClip(new URL(getDocumentBase(), "fire.au"));
      missileSound   = getAudioClip(new URL(getDocumentBase(), "missile.au"));
      saucerSound    = getAudioClip(new URL(getDocumentBase(), "saucer.au"));
      thrustersSound = getAudioClip(new URL(getDocumentBase(), "thrusters.au"));
      warpSound      = getAudioClip(new URL(getDocumentBase(), "warp.au"));
    }
    catch (MalformedURLException e) {}

    crashSound.play();     crashSound.stop();
    explosionSound.play(); explosionSound.stop();
    fireSound.play();      fireSound.stop();
    missileSound.play();    missileSound.stop();
    saucerSound.play();    saucerSound.stop();
    thrustersSound.play(); thrustersSound.stop();
    warpSound.play();      warpSound.stop();
    */
  }

  function initShip() {

    ship.active = true;
    ship.angle = 0.0;
    ship.deltaAngle = 0.0;
    ship.currentX = 0.0;
    ship.currentY = 0.0;
    ship.deltaX = 0.0;
    ship.deltaY = 0.0;
    ship.render();
//    if (loaded)
//      thrustersSound.stop();
    thrustersPlaying = false;

    hyperCounter = 0;
  }

  function updateShip() {

    var dx, dy, limit;

    if (!playing)
      return;

    // Rotate the ship if left or right cursor key is down.

    if (left) {
      ship.angle += Math.PI / 16.0;
      if (ship.angle > 2 * Math.PI)
        ship.angle -= 2 * Math.PI;
    }
    if (right) {
      ship.angle -= Math.PI / 16.0;
      if (ship.angle < 0)
        ship.angle += 2 * Math.PI;
    }

    // Fire thrusters if up or down cursor key is down. Don't let ship go past
    // the speed limit.

    dx = -Math.sin(ship.angle);
    dy =  Math.cos(ship.angle);
    limit = 0.8 * MIN_ROCK_SIZE;
    if (up) {
      if (ship.deltaX + dx > -limit && ship.deltaX + dx < limit)
        ship.deltaX += dx;
      if (ship.deltaY + dy > -limit && ship.deltaY + dy < limit)
        ship.deltaY += dy;
    }
    if (down) {
      if (ship.deltaX - dx > -limit && ship.deltaX - dx < limit)
        ship.deltaX -= dx;
      if (ship.deltaY - dy > -limit && ship.deltaY - dy < limit)
        ship.deltaY -= dy;
    }

    // Move the ship. If it is currently in hyperspace, advance the countdown.

    if (ship.active) {
      ship.advance();
      ship.render();

      if (ship.morph) {
          ship.morph.setBorderColor(Color.purple);
      }  


      if (hyperCounter > 0) {
        hyperCounter--;

        if (ship.morph) {
            // var c = 255 - (255 / HYPER_COUNT) * hyperCounter;
            ship.morph.setFill(Color.random());    
        }
      }
    }

    // Ship is exploding, advance the countdown or create a new ship if it is
    // done exploding. The new ship is added as though it were in hyperspace.
    // (This gives the player time to move the ship if it is in imminent danger.)
    // If that was the last ship, end the game.

    else {
      if (--shipCounter <= 0) {
        if (shipsLeft > 0) {
          initShip();
          hyperCounter = HYPER_COUNT;
        }
        else
          endGame();
      }
    }
  }

  function stopShip() {

    ship.active = false;
    shipCounter = SCRAP_COUNT;
    if (shipsLeft > 0)
      shipsLeft--;
//    if (loaded)
//      thrustersSound.stop();
    thrustersPlaying = false;
    
    if (ship.morph) {
        ship.morph.remove();
        ship.morph = null;
    } 
  }

  function initPhotons() {

    for (var i = 0; i < MAX_SHOTS; i++) {
      photons[i].active = false;
      photonCounter[i] = 0;

      if (photons[i].morph) {
          photons[i].morph.remove();
          photons[i].morph = null;
      } 

    }
    photonIndex = 0;
  }

  function updatePhotons() {

    // Move any active photons. Stop it when its counter has expired.

    for (var i = 0; i < MAX_SHOTS; i++)
      if (photons[i].active) {
    
        photons[i].advance();
        photons[i].render();

        if (--photonCounter[i] < 0) {
          photons[i].active = false;
                              
          if (photons[i].morph) {
              photons[i].morph.remove();
              photons[i].morph = null;
          }
        }
      }
  }

  function initUfo() {

    var temp;

    // Randomly set flying saucer at left or right edge of the screen.

    ufo.active = true;
    ufo.currentX = -gameWidth / 2;
    ufo.currentY = Math.random() * gameHeight;
    ufo.deltaX = MIN_ROCK_SPEED + Math.random() * (MAX_ROCK_SPEED - MIN_ROCK_SPEED);
    if (Math.random() < 0.5) {
      ufo.deltaX = -ufo.deltaX;
      ufo.currentX = gameWidth / 2;
    }
    ufo.deltaY = MIN_ROCK_SPEED + Math.random() * (MAX_ROCK_SPEED - MIN_ROCK_SPEED);
    if (Math.random() < 0.5)
      ufo.deltaY = -ufo.deltaY;
    ufo.render();
    saucerPlaying = true;
//    if (sound)
//      saucerSound.loop();

    // Set counter for this pass.

    ufoCounter = Math.floor(gameWidth / Math.abs(ufo.deltaX));
  }

  function updateUfo() {

    var i, d;

    // Move the flying saucer and check for collision with a photon. Stop it when its
    // counter has expired.

    if (ufo.active) {
      ufo.advance();
      ufo.render();
      if (--ufoCounter <= 0) {
        if (--ufoPassesLeft > 0)
          initUfo();
        else
          stopUfo();
      } else {
        for (i = 0; i < MAX_SHOTS; i++)
          if (photons[i].active && ufo.isColliding(photons[i])) {
//            if (sound)
//              crashSound.play();
            explode(ufo);
            stopUfo();
            score += UFO_POINTS;
          }

          // On occasion, fire a missile at the ship if the saucer is not
          // too close to it.

          d = Math.max(Math.abs(ufo.currentX - ship.currentX), Math.abs(ufo.currentY - ship.currentY));
          if (ship.active && hyperCounter <= 0 && ufo.active && !missile.active &&
              d > 4 * MAX_ROCK_SIZE && Math.random() < .03)
            initMissile();
       }
    }
  }

  function stopUfo() {

    ufo.active = false;
    ufoCounter = 0;
    ufoPassesLeft = 0;
//    if (loaded)
//      saucerSound.stop();
    saucerPlaying = false;

    if (ufo.morph) {
        ufo.morph.remove();
        ufo.morph = null;
    } 
  }

  function initMissile() {

    missile.active = true;
    missile.angle = 0.0;
    missile.deltaAngle = 0.0;
    missile.currentX = ufo.currentX;
    missile.currentY = ufo.currentY;
    missile.deltaX = 0.0;
    missile.deltaY = 0.0;
    missile.render();
    missileCounter = 3 * Math.max(gameWidth, gameHeight) / MIN_ROCK_SIZE;
//    if (sound)
//      missileSound.loop();
    missilePlaying = true;
  }

  function updateMissile() {

    var i;

    // Move the guided missile and check for collision with ship or photon. Stop it when its
    // counter has expired.

    if (missile.active) {
      if (--missileCounter <= 0)
        stopMissile();
      else {
        guideMissile();
        missile.advance();
        missile.render();

        if (missile.morph) {
            var c = Math.min(missileCounter * 24, 255);
            missile.morph.setBorderColor(new Color(c, c, c));
        }

        for (i = 0; i < MAX_SHOTS; i++)
          if (photons[i].active && missile.isColliding(photons[i])) {
//            if (sound)
//              crashSound.play();
            explode(missile);
            stopMissile();
            score += MISSILE_POINTS;
          }
        if (missile.active && ship.active && hyperCounter <= 0 && ship.isColliding(missile)) {
//          if (sound)
//            crashSound.play();
          explode(ship);
          stopShip();
          stopUfo();
          stopMissile();
        }
      }
    }
  }

  function guideMissile() {

    /* double */ var dx, dy, angle;

    if (!ship.active || hyperCounter > 0)
      return;

    // Find the angle needed to hit the ship.

    dx = ship.currentX - missile.currentX;
    dy = ship.currentY - missile.currentY;
    if (dx == 0 && dy == 0)
      angle = 0;
    if (dx == 0) {
      if (dy < 0)
        angle = -Math.PI / 2;
      else
        angle = Math.PI / 2;
    }
    else {
      angle = Math.atan(Math.abs(dy / dx));
      if (dy > 0)
        angle = -angle;
      if (dx < 0)
        angle = Math.PI - angle;
    }

    // Adjust angle for screen coordinates.

    missile.angle = angle - Math.PI / 2;

    // Change the missile's angle so that it points toward the ship.

    missile.deltaX = MIN_ROCK_SIZE / 3 * -Math.sin(missile.angle);
    missile.deltaY = MIN_ROCK_SIZE / 3 *  Math.cos(missile.angle);
  }

  function stopMissile() {

    missile.active = false;
    missileCounter = 0;
//    if (loaded)
//      missileSound.stop();
    missilePlaying = false;

    if (missile.morph) {
        missile.morph.remove();
        missile.morph = null;
    } 
  }

  function initAsteroids() {

    var i, j;
    var s;
    /* double */ var theta, r;
    var x, y;

    // Create random shapes, positions and movements for each asteroid.

    for (i = 0; i < MAX_ROCKS; i++) {

      // Create a jagged shape for the asteroid and give it a random rotation.
     if (asteroids[i].morph) {
          asteroids[i].morph.remove();
          asteroids[i].morph = null;
      }
       
      asteroids[i].shape = [];
      s = MIN_ROCK_SIDES + (Math.random() * (MAX_ROCK_SIDES - MIN_ROCK_SIDES));
      for (j = 0; j < s; j ++) {
        theta = 2 * Math.PI / s * j;
        r = MIN_ROCK_SIZE + (Math.random() * (MAX_ROCK_SIZE - MIN_ROCK_SIZE));
        x = -Math.round(r * Math.sin(theta));
        y =  Math.round(r * Math.cos(theta));
        asteroids[i].shape.push(pt(x, y));
      }
      asteroids[i].active = true;
      asteroids[i].angle = 0.0;
      asteroids[i].deltaAngle = (Math.random() - 0.5) / 10;

      // Place the asteroid at one edge of the screen.

      if (Math.random() < 0.5) {
        asteroids[i].currentX = -gameWidth / 2;
        if (Math.random() < 0.5)
          asteroids[i].currentX = gameWidth / 2;
        asteroids[i].currentY = Math.random() * gameHeight;
      }
      else {
        asteroids[i].currentX = Math.random() * gameWidth;
        asteroids[i].currentY = -gameHeight / 2;
        if (Math.random() < 0.5)
          asteroids[i].currentY = gameHeight / 2;
      }

      // Set a random motion for the asteroid.

      asteroids[i].deltaX = Math.random() * asteroidsSpeed;
      if (Math.random() < 0.5)
        asteroids[i].deltaX = -asteroids[i].deltaX;
      asteroids[i].deltaY = Math.random() * asteroidsSpeed;
      if (Math.random() < 0.5)
        asteroids[i].deltaY = -asteroids[i].deltaY;

      asteroids[i].render();
      asteroidIsSmall[i] = false;
    }

    asteroidsCounter = STORM_PAUSE;
    asteroidsLeft = MAX_ROCKS;
    if (asteroidsSpeed < MAX_ROCK_SPEED)
      asteroidsSpeed++;
  }

  function initSmallAsteroids(n) {

    var count;
    var i, j;
    var s;
    /* double */ var tempX, tempY;
    /* double */ var theta, r;
    var x, y;

    // Create one or two smaller asteroids from a larger one using inactive asteroids. The new
    // asteroids will be placed in the same position as the old one but will have a new, smaller
    // shape and new, randomly generated movements.

    count = 0;
    i = 0;
    tempX = asteroids[n].currentX;
    tempY = asteroids[n].currentY;
    do {
      if (!asteroids[i].active) {

        if (asteroids[i].morph) {
            asteroids[i].morph.remove();
            asteroids[i].morph = null;
        }

        asteroids[i].shape = [];
        s = MIN_ROCK_SIDES + (Math.random() * (MAX_ROCK_SIDES - MIN_ROCK_SIDES));
        for (j = 0; j < s; j ++) {
          theta = 2 * Math.PI / s * j;
          r = (MIN_ROCK_SIZE + (Math.random() * (MAX_ROCK_SIZE - MIN_ROCK_SIZE))) / 2;
          x = -Math.round(r * Math.sin(theta));
          y =  Math.round(r * Math.cos(theta));
          asteroids[i].shape.push(pt(x, y));
        }
        asteroids[i].active = true;
        asteroids[i].angle = 0.0;
        asteroids[i].deltaAngle = (Math.random() - 0.5) / 10;
        asteroids[i].currentX = tempX;
        asteroids[i].currentY = tempY;
        asteroids[i].deltaX = Math.random() * 2 * asteroidsSpeed - asteroidsSpeed;
        asteroids[i].deltaY = Math.random() * 2 * asteroidsSpeed - asteroidsSpeed;
        asteroids[i].render();
        asteroidIsSmall[i] = true;
        count++;
        asteroidsLeft++;
      }
      i++;
    } while (i < MAX_ROCKS && count < 2);
  }

  function updateAsteroids() {

    var i, j;

    // Move any active asteroids and check for collisions.

    for (i = 0; i < MAX_ROCKS; i++)
      if (asteroids[i].active) {
      
        asteroids[i].advance();
        asteroids[i].render();

        // If hit by photon, kill asteroid and advance score. If asteroid is large,
        // make some smaller ones to replace it.

        for (j = 0; j < MAX_SHOTS; j++)
          if (photons[j].active && asteroids[i].active && asteroids[i].isColliding(photons[j])) {
            asteroidsLeft--;
            asteroids[i].active = false;
            photons[j].active = false;

//            if (sound)
//              explosionSound.play();
            explode(asteroids[i]);
            
            if (asteroids[i].morph) {
                asteroids[i].morph.remove();
                asteroids[i].morph = null;
            }
            
            if (photons[j].morph) {
                photons[j].morph.remove();
                photons[j].morph = null;
            }

            if (!asteroidIsSmall[i]) {
              score += BIG_POINTS;
              initSmallAsteroids(i);
            }
            else
              score += SMALL_POINTS;
          }

        // If the ship is not in hyperspace, see if it is hit.

        if (ship.active && hyperCounter <= 0 && asteroids[i].active && asteroids[i].isColliding(ship)) {
//          if (sound)
//            crashSound.play();
          explode(ship);
          stopShip();
          stopUfo();
          stopMissile();
        }
    }
  }

  function initExplosions() {

    for (var i = 0; i < MAX_SCRAP; i++) {
      explosions[i].shape = [];
      explosions[i].active = false;
      explosionCounter[i] = 0;

      if (explosions[i].morph) {
          explosions[i].morph.remove();
          explosions[i].morph = null;
      }

    }
    explosionIndex = 0;
  }

  function explode(/* AsteroidsSprite */ s) {

    var c, i, j;

    // Create sprites for explosion animation. The each individual line segment of the given sprite
    // is used to create a new sprite that will move outward  from the sprite's original position
    // with a random rotation.

    s.render();
    var sverts = s.sprite.vertices();
    c = 2;
    if (detail || sverts.length < 6)
      c = 1;
    for (i = 0; i < sverts.length; i += c) {
      explosionIndex++;
      if (explosionIndex >= MAX_SCRAP)
        explosionIndex = 0;
        
      if (explosions[explosionIndex].morph) {
          explosions[explosionIndex].morph.remove();
          explosions[explosionIndex].morph = null;
      }
        
      explosions[explosionIndex].active = true;
      explosions[explosionIndex].shape = [];
      explosions[explosionIndex].shape.push(s.shape[i].copy());
      j = i + 1;
      if (j >= sverts.length)
        j -= sverts.length;
      explosions[explosionIndex].shape.push(s.shape[j].copy());
      explosions[explosionIndex].angle = s.angle;
      explosions[explosionIndex].deltaAngle = (Math.random() * 2 * Math.PI - Math.PI) / 15;
      explosions[explosionIndex].currentX = s.currentX;
      explosions[explosionIndex].currentY = s.currentY;
      explosions[explosionIndex].deltaX = -s.shape[i].x / 5;
      explosions[explosionIndex].deltaY = -s.shape[i].y / 5;
      explosionCounter[explosionIndex] = SCRAP_COUNT;
    }
  }

  function updateExplosions() {

    // Move any active explosion debris. Stop explosion when its counter has expired.

    for (var i = 0; i < MAX_SCRAP; i++)
      if (explosions[i].active) {
        explosions[i].advance();
        explosions[i].render();
        
        if (explosions[i].morph) {
            // var c = (255 / SCRAP_COUNT) * explosionCounter[i];
            explosions[i].morph.setFill(Color.random() /* new Color(0, c, c) */);
            explosions[i].morph.setBorderColor(Color.random() /* new Color(0, c, c) */);
        }
        
        if (--explosionCounter[i] < 0) {
          explosions[i].active = false;
          
          if (explosions[i].morph) {
              explosions[i].morph.remove();
              explosions[i].morph = null;
          }
        }
      }
  }

/*
 * The game morph and event handlers
 */

  function keyDown(event) {

      var key = event.getKeyCode();

    // Check if any cursor keys have been pressed and set flags.

    if (key == Event.KEY_LEFT)
      left = true;
    if (key == Event.KEY_RIGHT)
      right = true;
    if (key == Event.KEY_UP)
      up = true;
    if (key == Event.KEY_DOWN)
      down = true;

    if ((up || down) && ship.active && !thrustersPlaying) {
//      if (sound && !paused)
//        thrustersSound.loop();
      thrustersPlaying = true;
    }

    // Spacebar: fire a photon and start its counter.

    if (key == Event.KEY_SPACEBAR && ship.active) {
//      if (sound & !paused)
//        fireSound.play();
      photonIndex++;
      if (photonIndex >= MAX_SHOTS)
        photonIndex = 0;
      photons[photonIndex].active = true;
      photons[photonIndex].currentX = ship.currentX;
      photons[photonIndex].currentY = ship.currentY;
      photons[photonIndex].deltaX = MIN_ROCK_SIZE * -Math.sin(ship.angle);
      photons[photonIndex].deltaY = MIN_ROCK_SIZE *  Math.cos(ship.angle);
      photonCounter[photonIndex] = Math.min(gameWidth, gameHeight) / MIN_ROCK_SIZE;
    }

      key = event.getKeyChar().toUpperCase();
    // 'H' key: warp ship into hyperspace by moving to a random location and starting counter.

    if (key == "H" && ship.active && hyperCounter <= 0) {
      ship.currentX = Math.random() * gameWidth;
      ship.currentX = Math.random() * gameHeight;
      hyperCounter = HYPER_COUNT;
//      if (sound & !paused)
//        warpSound.play();
    }

    // 'P' key: toggle pause mode and start or stop any active looping sound clips.

    if (key == "P") {
      if (paused) {
//        if (sound && missilePlaying)
//          missileSound.loop();
//        if (sound && saucerPlaying)
//          saucerSound.loop();
//        if (sound && thrustersPlaying)
//          thrustersSound.loop();
      }
      else {
//        if (missilePlaying)
//          missileSound.stop();
//        if (saucerPlaying)
//          saucerSound.stop();
//        if (thrustersPlaying)
//          thrustersSound.stop();
      }
      paused = !paused;
    }

    // 'M' key: toggle sound on or off and stop any looping sound clips.

    if (key == "M" && loaded) {
/*
      if (sound) {
        crashSound.stop();
        explosionSound.stop();
        fireSound.stop();
        missileSound.stop();
        saucerSound.stop();
        thrustersSound.stop();
        warpSound.stop();
      }
      else {
        if (missilePlaying && !paused)
          missileSound.loop();
        if (saucerPlaying && !paused)
          saucerSound.loop();
        if (thrustersPlaying && !paused)
          thrustersSound.loop();
      }
      sound = !sound;
*/
    }

    // 'D' key: toggle graphics detail on or off.

    if (key == "D") {
      detail = !detail;
    }

    // 'S' key: start the game, if not already in progress.

    if (key == "S" && loaded && !playing)
      initGame();

    return true;
  }

  function keyUp(event) {

      var key = event.getKeyCode();

    // Check if any cursor keys where released and set flags.

    if (key == Event.KEY_LEFT)
      left = false;
    if (key == Event.KEY_RIGHT)
      right = false;
    if (key == Event.KEY_UP)
      up = false;
    if (key == Event.KEY_DOWN)
      down = false;

    if (!up && !down && thrustersPlaying) {
//      thrustersSound.stop();
      thrustersPlaying = false;
    }

    return true;
  }

    module.GameMorph.addMethods({
    
    initialize: function($super, rect) {
        $super(rect);
        this.timeoutID = null;
        // Set black background color for the game
        this.setFill(Color.black);
        return this;
    },
    
    handlesMouseDown: Functions.True, // hack

    onMouseDown: function(evt) {
        this.requestKeyboardFocus(evt.hand);
        return true; 
    },

    setHasKeyboardFocus: function(newSetting) { 
        return newSetting;
    },
    
    takesKeyboardFocus: Functions.True,

    onKeyDown: function(evt) { 
        keyDown(evt);
        if (evt.getKeyCode() == Event.KEY_ESC) {
            this.relinquishKeyboardFocus(this.world().firstHand());
        }
        evt.stop();
        return true; 
    },

    onKeyUp: function(evt) { 
        keyUp(evt);
        evt.stop();
        return true; 
    },

    shutdown: function($super) {
        if (this.timeoutID) {
            console.log('shutting down the game');
            window.clearTimeout(this.timeoutID);
        }
        $super();
    }

});

    module.makeGameMorph = function(rect) {
    gameMorph = new module.GameMorph(rect); 
    return gameMorph;
}

    

}); // end of the asteroid game module

// ===========================================================================
// The Weather Widget Example
// ===========================================================================
 
// Weather widget works by selecting the city from the list.
// It uses XMLHttpRequest to obtain weather info for the selected city
 
// We should consider using other weather service.
// These images are of low quality
Widget.subclass('WeatherWidget', NetRequestReporterTrait, {

    description: "Example widget with updated weather info for a list of cities",
    imagepath: "Resources/weather/",
    viewTitle: "Weather widget",
    initialViewExtent: pt(250, 260),

    
    initialize: function($super) { 
	$super();
	var model = 
	    Record.newNodeInstance({Locale: null, WeatherDesc: null, Temperature: null, Wind: null, 
				    Gusts: null, DewPoint: null, Humidity: null, Visibility: null, 
				    ImageURL:"http://www.bbc.co.uk/weather/images/banners/weather_logo.gif"});
	this.relayToModel(model, {Locale: "-Locale", WeatherDesc: "+WeatherDesc", Temperature: "+Temperature", 
				  Wind: "+Wind", Gusts: "+Gusts", DewPoint: "+DewPoint", 
				  Humidity: "+Humidity", Visibility: "+Visibility"});
	this.ownModel(model);
	this.initializeTransientState();
    },
    
    onDeserialize: function() {
	this.initializeTransientState();
    },
    
    initializeTransientState: function() {
	this.feed = new Feed({model: this, setFeedChannels: "parseChannels", setStatus: "setRequestStatus"});
    },
    
    parseChannels: function(channels) {
	if (channels.length <= 0) return;
	var channel = channels[0];
	var text = channel.items[0].description();
	var arr = text.split(",");
	var topic = channel.items[0].title();
  var weather = topic.substring(topic.indexOf("\n"), topic.indexOf(".")).replace(/^\s+|\s+$/g, '');
	var model = this.getModel(); 
	model.setWeatherDesc(weather[0].toUpperCase() + weather.substr(1));
	model.setTemperature(arr[0].replace(/^\s+|\s+$/g, ''));
	model.setWind(arr[1].replace(/^\s+|\s+$/g, ''));
	model.setGusts(arr[2].replace(/^\s+|\s+$/g, ''));
	model.setDewPoint(arr[3].replace(/^\s+|\s+$/g, ''));
	model.setHumidity(arr[4].replace(/^\s+|\s+$/g, '') + ", " + arr[5].replace(/^\s+|\s+$/g, ''));
	model.setVisibility(arr[6].replace(/^\s+|\s+$/g, ''));
    },

	onLocaleUpdate: function(item) {
		var citycode = null;
		// initialize UI update
		switch (item) {
			case "San Francisco, California":
				citycode = "105";
				break;
			case "Tampere, Finland":
				citycode = "2967";
				break;
			case "London, United Kingdom":
				citycode = "8";
				break;
			case "Berlin, Germany":
				citycode = "50";
				break;
		}
		if (citycode) {
			var url = new URL("http://news.bbc.co.uk/weather/forecast/" + citycode + "/ObservationsRSS.xml");
			this.feed.request(url);
		}
	},

    
	buildView: function(extent) {
		
		var panel = new PanelMorph(extent).linkToStyles(["panel"]);
		var model = this.getModel();
		panel.relayToModel(model, {});
		var gfx = lively.paint;
		panel.applyStyle({borderWidth: 2, 
			fill: new gfx.LinearGradient([new gfx.Stop(0, Color.white),
			new gfx.Stop(1, Color.primary.blue)], 
			gfx.LinearGradient.NorthSouth)
		});
		//panel.setBorderColor(Color.blue);
		// TODO: add rounding to all the elements (panel, window & titlebar)
		// or make the titlebar round depending on the window
		var m; 

		var r = new Rectangle(10,20,25,20);
		var startOffsetY = 73;
		var height = 25;
		var subWidgetBounds = function(i) { return r.withY(startOffsetY + i * height) };

		var disableScaling = true;
		panel.addMorph(m = new ImageMorph(r, this.imagepath + "city.png", disableScaling));
		m.setFill(null);
		panel.addMorph(m = new ImageMorph(subWidgetBounds(0), this.imagepath + "weather.png", disableScaling));
		m.setFill(null);
		r = r.withWidth(20);
		panel.addMorph(m = new ImageMorph(subWidgetBounds(1), this.imagepath + "temperature.png", disableScaling));
		m.setFill(null);
		panel.addMorph(m = new ImageMorph(subWidgetBounds(2), this.imagepath + "wind.png", disableScaling));
		m.setFill(null);
		panel.addMorph(m = new ImageMorph(subWidgetBounds(3), this.imagepath + "wind_dir.png", disableScaling));
		m.setFill(null);
		panel.addMorph(m = new ImageMorph(subWidgetBounds(4), this.imagepath + "barometer.png", disableScaling));
		m.setFill(null);
		panel.addMorph(m = new ImageMorph(subWidgetBounds(5), this.imagepath + "humidity.png", disableScaling));
		m.setFill(null);
		panel.addMorph(m = new ImageMorph(subWidgetBounds(6), this.imagepath + "visibility.png", disableScaling));
		m.setFill(null);

		r = new Rectangle(40, 3, 200, 20);
		m = panel.addMorph(new TextListMorph(r, ["San Francisco, California", "Tampere, Finland", "London, United Kingdom", "Berlin, Germany"]));
		m.connectModel(model.newRelay({ Selection: "Locale"}));
		m.selectLineAt(0); // Select the first item by default

		// build the textfields for the weather panel
		m = panel.addMorph(new TextMorph(subWidgetBounds(0), "---"));
		m.connectModel(model.newRelay({Text: "-WeatherDesc"}));
		m.takesKeyboardFocus = Functions.True;


		m = panel.addMorph(new TextMorph(subWidgetBounds(1), "---"));
		m.connectModel(model.newRelay({Text: "-Temperature"}));
		m.takesKeyboardFocus = Functions.True;

		m = panel.addMorph(new TextMorph(subWidgetBounds(2), "---"));
		m.connectModel(model.newRelay({Text: "-Wind"}));
		m.takesKeyboardFocus = Functions.True;

		m = panel.addMorph(new TextMorph(subWidgetBounds(3), "---"));
		m.connectModel(model.newRelay({Text: "-Gusts"}));
		m.takesKeyboardFocus = Functions.True;

		m = panel.addMorph(new TextMorph(subWidgetBounds(4), "---"));
		m.connectModel(model.newRelay({Text: "-DewPoint"}));
		m.takesKeyboardFocus = Functions.True;

		m = panel.addMorph(new TextMorph(subWidgetBounds(5), "---"));
		m.connectModel(model.newRelay({Text: "-Humidity"}));
		m.takesKeyboardFocus = Functions.True;

		m = panel.addMorph(new TextMorph(subWidgetBounds(6), "---"));
		m.connectModel(model.newRelay({Text: "-Visibility"}));

		m.takesKeyboardFocus = Functions.True;

		var image = panel.addMorph(new ImageMorph(subWidgetBounds(7),undefined,true));
		image.connectModel(model.newRelay({URL: "-ImageURL"}));

		image.setFill(null);

		this.onLocaleUpdate("San Francisco, California");
		return panel;
	}
    
});


// ===========================================================================
// The Stock Widget Example
// ===========================================================================

Widget.subclass('StockWidget', NetRequestReporterTrait, {

    viewTitle: 'Stock Widget',
    initialViewExtent: pt(580, 460),
    pins: ["-StockIndex", "Company", "+Quote", "+NewsURL", "+NewsHeaders"],

    initialize: function($super) { 
	var model = new SyntheticModel(this.pins);
	$super(model.makePlugSpecFromPins(this.pins));
	this.setModelValue("setCompany", "JAVA");
	this.initializeTransientState();
    },

    initializeTransientState: function() {
	this.feed = new Feed({model: this, setFeedChannels: "extractNewsHeaders", setStatus: "setRequestStatus"});
    },

    onDeserialize: function() {
	this.initializeTransientState();
    },
    
    updateView: function(aspect, controller) {
	var p = this.modelPlug;
	if (!p) return;
	switch (aspect) {
	case p.getStockIndex:
	    var item = this.getModelValue("getStockIndex");
            var entry = this.config[item];
	    this.setModelValue("setNewsURL", this.makeNewsURL(entry.ticker));
	    this.feed.request(this.makeNewsURL(entry.ticker));
	    break;
	case p.getCompany:
	    this.requestQuote(this.getModelValue("getCompany"));
	    break;
	}
    },

    openIn: function($super, world, location) {
	var view = $super(world, location);
        this.startSteppingRefreshCharts(view.targetMorph);
        return view;
    },

    makeNewsURL: function(ticker) {
        return new URL("http://finance.google.com/finance").withQuery({morenews: "10", 
								       rating: "1", 
								       q: "INDEX" + ticker, 
								       output: "rss"});
    },

    // FIXME: The image links here are no longer necessary.  Remove later.
    config: {
    "DOW JONES": { 
        ticker: 'DJX:.DJI', 
        image: "http://bigcharts.marketwatch.com/charts/gqplus/fpDJIA-narrow.gqplus?167" },
        // image: "http://newsimg.bbc.co.uk/media/images/42214000/jpg/_42214402_dowtwo.jpg" },
    "NASDAQ": { 
        ticker: 'NASDAQ:.IXIC',
        image: "http://bigcharts.marketwatch.com/charts/gqplus/fpNASDAQ-narrow.gqplus?167" },
        // image: "http://content.nasdaq.com/graphs/HOMEIXIC.gif?89649" },
    "NYSE": { 
        ticker: 'NYSE:NYA.X',
        image: "http://www.forecasts.org/images/stock-market/nysecomp.gif"},

    "S&P INX": { 
        ticker: 'SP:.INX',
        image: "http://stockcharts.com/charts/historical/images/SPX1960t.png" }
    },
       
    requestQuote: function(company, destVariable) {
        console.log('requesting quote for ' + company);
        var url = new URL("http://download.finance.yahoo.com/d/quotes.csv").withQuery({ s:company.toLowerCase(), f:'sl1d1t1c1ohgv', e: '.csv'});	
	var req = new NetRequest({model: this, setStatus: "setRequestStatus", setResponseText: "formatQuote"});
	req.setContentType("text/html");
	req.get(url);
    },
    
    buildView: function(extent, model) {
        var panel = new PanelMorph(extent).linkToStyles(['panel']);
	var gfx = lively.paint;
	panel.applyStyle({fill: new gfx.LinearGradient([new gfx.Stop(0, Color.white), 
							new gfx.Stop(1, Color.primary.blue.lighter())],
						       gfx.LinearGradient.NorthSouth)});
	panel.linkToStyles(['raisedBorder']);
	panel.connectModel({model: model});
	
        // Marketwatch/Bigcharts logo
        var m = panel.addMorph(new ImageMorph(new Rectangle(20, 10, 135, 68), 
	    "http://b.mktw.net/images/logo/frontpage.gif"));
        
        // Dow Jones chart
        var image = new ImageMorph(new Rectangle(160, 10, 175, 160), 
	    "http://bigcharts.marketwatch.com/charts/gqplus/fpDJIA-narrow.gqplus?167");
        panel.leftChartImage = image;
        m = panel.addMorph(image);
        m.setFill(Color.white);

        // NASDAQ chart
        image = new ImageMorph(new Rectangle(360, 10, 175, 160), 
			       "http://bigcharts.marketwatch.com/charts/gqplus/fpNASDAQ-narrow.gqplus?167", true);
        panel.rightChartImage = image;
        m = panel.addMorph(image);
        m.setFill(Color.white);
        // m.connectModel({model: this, getURL: "getIndexChartURL"});

        // Newsfeed selector
        m = panel.addMorph(new TextListMorph(new Rectangle(20, 180, 90, 20), Object.keys(this.config)));
        m.connectModel({model: model, getSelection: "getStockIndex", setSelection: "setStockIndex"});
	m.setModelValue("setSelection", 'DOW JONES');


        // Newsfeed panel
        m = panel.addMorph(Global.newTextListPane(new Rectangle(160, 180, 410, 150)));
        m.connectModel({model: model, getList: "getNewsHeaders"});

        // Company-specific stock quotes

        m = panel.addMorph(new TextMorph(new Rectangle(160, 340, 410, 20), ""));
	m.connectModel({model: model, getText: "getQuote"});
	
        // Company selector for stock quotes
        m = panel.addMorph(new TextListMorph(new Rectangle(20, 340, 120, 40), ["AAPL", "NOK", "GOOG", "SAP"]));
        m.connectModel({model: model, getSelection: "getCompany", setSelection: "setCompany"});
	m.setModelValue("setSelection", "AAPL");

	
	// FIXME: problematic for serialization
        panel.refresh = function() {
           // console.log("Refreshing charts...");
            this.leftChartImage.reload(); 
            this.rightChartImage.reload(); 
        };

        return panel;
    },
    
    startSteppingRefreshCharts: function(panel) {
        panel.startStepping(60000, 'refresh');
    },
    
    formatQuote: function(responseText) {
	function trim(str) {
	    if (!str) return null;
            return str.toString().strip().replace(/[\s]{2,}/,' ');
	}
	
	var arr = responseText.split(',');

        var fmtQuote = "Name: " + arr[0] + "\n" 
            + "Last: " + arr[1]+ "\n"
            + "Change: " + arr[4]+ "\n"
            + "Open: " + arr[5]+ "\n"
            + "High: " + arr[6]+ "\n"
            + "Low: " + arr[7]+ "\n"
            + "Volume: " + trim(arr[8]);
	
	this.setModelValue('setQuote', fmtQuote);
    },

    extractNewsHeaders: function(channels) {
	var result = null;
	if (!channels || !channels[0])
	    result = [];
	else 
	    result = channels[0].items.invoke('title');
	this.setModelValue('setNewsHeaders', result);
    }
    

});

// ===========================================================================
// The Map Widget Example
// ===========================================================================

thisModule.maps = function() {

// 6 is largest as a system print, lower numbers are debugprints
// 6 is to be used if user must be notified lower levels to developer use
var debugpriority = 6;
pd = function (text, priority) {
    if (priority >= debugpriority) {
        console.log(text);
    }
}

// Constants that all mapmorphs use
var IMAGEFOLDER = "Resources/map/";

var MAPSFOLDER = IMAGEFOLDER + "maps";
var MAPSURL = []; //format "http://mt.google.com/mt?n=404&v=w2.99&x=" + tempx + "&y=" + tempy + "&zoom="+zoomRatio
MAPSURL[0] = "http://mt.google.com/mt?n=404&v=w2.99&x=";
MAPSURL[1] = "&y=";
MAPSURL[2] = "&zoom=";

var SATELLITESFOLDER = IMAGEFOLDER + "satellitemaps";
var SATELLITESURL = [];//format http://kh.google.com/kh?n=404&v=10&t=%s
SATELLITESURL[0] = "http://kh.google.com/kh?n=404&v=10&t=";
SATELLITESURL[1] = "";
SATELLITESURL[2] = "";

var TileSize = pt(256, 256);

/**
 * @class ZoomLevel
 * -tells everything program needs to know for certain zoomlevel
 */
function Zoomlevel() {
    this.zoom = 0;
    this.maxX = 0;
    this.maxY = 0;
    this.hotspotX = 0;
    this.hotspotY = 0;
    this.toSource = function toSource() {
        return this.zoom + ":" + this.maxX + ":" + this.maxY;
    }
}

/**
 * @class Maparea
 *   -tells how big is the functional map area
 *   -and its location
 *   -contains function (boolean) returns true if x,y is inside area
 */
function MapArea() {
    this.x = 0;
    this.y = 0;
    this.width = 0;
    this.height = 0;
    this.Contains = function(x_, y_){
        if ( (x_ >= this.x) && (x_ < (this.x + this.width)) ) {
            if ( (y_ >= this.y) && (y_ < (this.y + this.height)) ) {
                return true;
            }
        }
        return false;
    }
}

/**
 * @class MapFrameMorph
 */

/*
Mapframe has all buttons and cliprect where the actual map is located
Typically the actual map is used straigth with this.map 
online parameter tells should the application load the maps from google

Mapframe has menu which can be accessed by Ctrl+MouseClick in frame area
*/

Morph.subclass("MapFrameMorph", {

    style: { borderWidth: 5, fill: new Color(0.5,0.5,0.5,0.8) },

    initialize: function($super, initialBounds, online) { 
        pd("MapFrameMorph",2);
        $super(new lively.scene.Rectangle(initialBounds));
        this.online = online;
        this.topLeft = this.bounds().topLeft();
        this.bottomRight = this.bounds().bottomRight();

        var clipInset = 23;
        this.mapclip = new ClipMorph(initialBounds.extent().extentAsRectangle().insetBy(clipInset));
	
        this.map = new MapMorph(new Rectangle(0, 0, 5*TileSize.x, 5*TileSize.y), this.online);
        this.map.hasFrame = true;
        this.mapclip.addMorph(this.map);
        this.addMorph(this.mapclip);

        this.mapmodel = new MapModel(this);

        var iconSize = 40;
        var r = new Rectangle(0, 0, iconSize/2, initialBounds.height - iconSize - 10);
        this.leftbutton = new ImageButtonMorph(r, IMAGEFOLDER + "buttonleft.PNG", 
                                          IMAGEFOLDER + "buttonleftdown.PNG");
        this.leftbutton.align(this.leftbutton.bounds().rightCenter(), 
                              this.mapclip.bounds().leftCenter().addXY(-clipInset, 0));
        this.leftbutton.connectModel({model: this.mapmodel, setValue: "goLeft", getValue: "isStepping"});
        this.leftbutton.toggle = true;
        this.addMorph(this.leftbutton);

        this.rightbutton = new ImageButtonMorph(r, IMAGEFOLDER + "buttonright.PNG", 
                                                IMAGEFOLDER + "buttonrightdown.PNG");
        this.rightbutton.align(this.rightbutton.bounds().leftCenter(), 
        this.mapclip.bounds().rightCenter().addXY(clipInset, 0));

        this.rightbutton.connectModel({model: this.mapmodel, setValue: "goRight", getValue: "isStepping"});
        this.rightbutton.toggle = true;
        this.addMorph(this.rightbutton);

        r = new Rectangle(this.topLeft.x + 25,this.topLeft.y-20,this.bottomRight.x-this.topLeft.x-52,20);
        this.upbutton =  new ImageButtonMorph(r, IMAGEFOLDER + "buttonup.PNG",IMAGEFOLDER + "buttonupdown.PNG");
        this.upbutton.connectModel({model: this.mapmodel, setValue: "goUp", getValue: "isStepping"});
        this.upbutton.toggle = true;
        this.addMorph(this.upbutton);

        r = new Rectangle(this.topLeft.x + 25,this.bottomRight.y,this.bottomRight.x-this.topLeft.x-52,20);
        this.downbutton = new ImageButtonMorph(r, IMAGEFOLDER + "buttondown.PNG", IMAGEFOLDER + "buttondowndown.PNG");
        this.downbutton.connectModel({model: this.mapmodel, setValue: "goDown", getValue: "isStepping"});
        this.downbutton.toggle = true;
        this.addMorph(this.downbutton);

        r = new Rectangle(0, 0, iconSize, iconSize);
        this.zinbutton = new ImageButtonMorph(r, IMAGEFOLDER + "zoom.PNG",IMAGEFOLDER + "zoomdown.PNG");
        this.zinbutton.align(this.zinbutton.bounds().topLeft(), this.bounds().topLeft());
        this.zinbutton.connectModel({model: this.mapmodel, setValue: "setZoomIn"});
        this.addMorph(this.zinbutton);

        this.zoutbutton = new ImageButtonMorph(r, IMAGEFOLDER + "zoomout.PNG", IMAGEFOLDER + "zoomoutdown.PNG");
        this.zoutbutton.align(this.zoutbutton.bounds().bottomRight(), this.bounds().bottomRight());
        this.zoutbutton.connectModel({model: this.mapmodel, setValue: "setZoomOut"}); 
        this.addMorph(this.zoutbutton);

        this.maptypebutton = new ImageButtonMorph(r, IMAGEFOLDER + "maptype.PNG", IMAGEFOLDER + "maptype2.PNG");
        this.maptypebutton.align(this.maptypebutton.bounds().bottomLeft(), this.bounds().bottomLeft());
        this.maptypebutton.connectModel({model: this.mapmodel, setValue: "setMapType", getValue: "isSatelliteView"});
        this.maptypebutton.toggle = true;
        this.addMorph(this.maptypebutton);

        pd("MapFrameMorph constructed",2);
        return this;
    } 
    
});

/**
 * @class MapModel
 */

Model.subclass('MapModel', {

    initialize: function($super, frame) {
        $super(frame);
        this.frame = frame;
    },

    goTo: function(flag, dx, dy) {
        var map = this.frame.map;
        if (!flag) {
            map.stopStepping();
	    console.log('stopped stepping for %s %s', dx, dy);
            map.stepping = false;
        } else {
            map.startStepping(100, "scrollingStep", pt(dx, dy));
            map.stepping = true;
        }
    },
    
    isStepping: function() {
        console.log('is stepping %s', this.frame.map.stepping);
        return this.frame.map.stepping;
    },
    
    goRight: function(flag) {
        this.goTo(flag, -1, 0);
    },
    
    goLeft: function(flag) {
        this.goTo(flag, 1, 0);
    },

    goUp: function(flag) {
        this.goTo(flag, 0, 1);
    },
    
    goDown: function(flag) {
        this.goTo(flag, 0, -1);
    },
    
    setZoomIn: function(flag) {
        if (flag) this.frame.map.loadImagesToMap("zoomin");
    },
    
    setZoomOut: function(flag) {
        if (flag) this.frame.map.loadImagesToMap("zoomout");
    },

    setMapType: function(flag) {
        this.frame.map.changeMapType();
    },
    
    isSatelliteView: function() {
        return this.frame.map.selectedmap == SATELLITESFOLDER;
    }

});

/**
 * @class MapMorph
 *
 * Mapmorph is the 5x5 maptile largemap located inside Mapframe cliprect
 * It can be moved with dragging. 
 * When dragged longer distance than 1 tile new maps are loaded and map is centered
 *
 * May have mapmarkers as submorphs
 */

Morph.subclass("MapMorph", {

    initialize: function($super, initialBounds, online) { 
      pd("MapMorph",2);
	$super(new lively.scene.Rectangle(initialBounds));

      this.setFill(Color.blue.lighter());
      this.setBorderWidth(0);
      this.selectedmap = MAPSFOLDER; 
      this.selectedURL = [];
      this.selectedURL = MAPSURL;
      
      this.images = [ [], [], [], [], [] ];
      this.imagerects = [ [], [], [], [], [] ];
      
      //maparea 
      this.maparea = new MapArea();
      this.maparea.x = 0;
      this.maparea.y = 0;
      this.maparea.width = 3*TileSize.x;
      this.maparea.height = 3*TileSize.y;
      // Current map zoom ratio
      this.zoomRatio;
      this.mapmovedX = 0;
      this.mapmovedY = 0;
      //zoomobjects
      this.zo = []; 
      //image in process
      this.x = 0; //this.ix = 0;
      this.y = 0; //,this.iy = 0;
      /* Imagemap 5x5 matrix like this 3x3
      (x-1,y-1)  (x  ,y-1)  (x+1,y-1)
      (x-1,y  )  (x  ,y  )  (x+1,y  ) 
      (x-1,y+1)  (x  ,y+1)  (x+1,y+1)
      */
      this.imagesloaded = false;
      
      //these for calculatin moved amount
      this.startpoint = null;
      this.endpoint = null;
      
      this.pointerimages = [];
      
      this.online = online;
      this.hasFrame = false;
      this.initMap();

      this.stepping = false;
      return this;
    }, 
  
    copy: function($super) {
        var newMap = $super();
        newMap.removeAllMorphs();
        return newMap; 
    },

    draw: function() {
        var success = false;
        for (var iy = 0; iy < 5; iy ++) {
            for (var ix = 0; ix < 5; ix ++) {
                if (this.images[iy][ix]) {
                    // pd("adding image " + this.images[this.iy][this.ix] + " ix " + this.ix + " iy " + this.iy,2);
                    var imgId = "mapFragment_" + this.id() + "_" + iy + "_" + ix;
                    var oldImg = document.getElementById(imgId);
                    if (oldImg) {
                        oldImg.parentNode.removeChild(oldImg);
                    }
    
                    var img = NodeFactory.create("image", { 
                        x: -TileSize.x + ix * TileSize.x, 
                        y: -TileSize.y + iy * TileSize.y, 
                        width: 256, 
                        height: 256
                    });
                    img.setAttributeNS(Namespace.XLINK, "href", this.images[iy][ix]);
                    img.setAttribute("id", imgId);
                    this.addNonMorph(img);
                }
            }
       }
       pd("Draw complete",2);
    
    }, 
  
  /*
  This function updates map movement and it also adds menu to mapframe
  */
  okToBeGrabbedBy: function(evt) {
    console.log("coords" + evt.mousePoint + " center " + this.bounds().center()+ " in wc " +this.worldPoint(this.bounds().center()));
    this.startpoint = evt.mousePoint; //this line is here only bacause this morph does not listen mousedown events
    return null; //otherwise map will be able to take out from mapframe  
  },
  
  handlesMouseDown: function(evt) {
      //pd("handlesMouseDown", 2);
      return true;
  },

  onMouseDown: function(evt){
      //console.log("coords" + evt.mousePoint + " center " + this.bounds().center()+ " in wc " +this.worldPoint(this.bounds().center()));
    this.startpoint = evt.mousePoint; //this line is here only bacause this morph does not listen mousedown events
  },

  onMouseUp: function(evt) { 
    //Sometimes map pops up from the framework... FIXME
    if (evt.mousePoint && this.startpoint){
        this.endpoint = evt.mousePoint;
        pd("scale of map: " + this.getScale(), 2)
        var currentscale = this.getScale();
        this.mapmovedX += (this.endpoint.x - this.startpoint.x);
        this.mapmovedY += (this.endpoint.y - this.startpoint.y);
        //console.log("moved x " + this.mapmovedX + " y " + this.mapmovedY);
       if ( ( this.mapmovedX > TileSize.x*currentscale )){
            //do until map is at place
                while( this.mapmovedX > TileSize.x*currentscale){
                    this.mapmovedX -= TileSize.x*currentscale;
                    this.mapX = -TileSize.x*currentscale;
                    //moving map right
                    this.x -= 1;
                    this.x = this.getValueX(this.x);
                    this.loadImagesToMap("left");
                    this.moveBy(pt(-TileSize.x*currentscale,0));
                }
            }else if ( ( this.mapmovedX < -TileSize.x*currentscale) ){
                //do until map is at place
                while( this.mapmovedX < -TileSize.x*currentscale){
                    this.mapmovedX += TileSize.x*currentscale;
                    this.mapX = -TileSize.x*currentscale;
                    //moving map left
                    this.x += 1;
                    this.x = this.getValueX(this.x);
                    this.loadImagesToMap("right");
                    this.moveBy(pt(TileSize.x*currentscale,0));
                }
            }
            if ( ( this.mapmovedY < -TileSize.y*currentscale) ){
                //do until map is at place
                while( this.mapmovedY < -TileSize.y*currentscale){        
                    this.mapmovedY += TileSize.y*currentscale;
                    this.mapY = -TileSize.y*currentscale;
                    //moving map up
                    this.y += 1;
                    this.y = this.getValueY(this.y);
                    this.loadImagesToMap("down");
                    this.moveBy(pt(0,TileSize.y*currentscale));
                }

            }else if ( ( this.mapmovedY > TileSize.y*currentscale) ){
                //do until map is at place
                while( this.mapmovedY > TileSize.y*currentscale){    
                    this.mapmovedY -= TileSize.y*currentscale;
                    this.mapY = -TileSize.y*currentscale;
                    //moving map down
                    this.y -= 1;
                    this.y = this.getValueY(this.y);
                    this.loadImagesToMap("up");
                    this.moveBy(pt(0,-TileSize.y*currentscale));
   
                }

            }
        }
    this.buttondown = false;
    this.startpoint = null;
    this.endpoint = null;
    this.changed();
    
  },
  
  scrollMap: function(p) { 
      //pd("scrollMap",3);
      var currentscale = this.getScale();
      this.mapmovedX += p.x;
      this.mapmovedY += p.y;
      // pd("moved x " + this.mapmovedX + " y " + this.mapmovedY, 2);
      if ( ( this.mapmovedX > TileSize.x*currentscale )) {
          //do until map is at place
          while ( this.mapmovedX > TileSize.x*currentscale) {
                    this.mapmovedX -= TileSize.x*currentscale;
                    this.mapX = -TileSize.x*currentscale;
                    //moving map right
                    this.x -= 1;
                    this.x = this.getValueX(this.x);
                    this.loadImagesToMap("left");
                    this.moveBy(pt(-TileSize.x*currentscale,0));
          }
          
      } else if ( ( this.mapmovedX < -TileSize.x*currentscale) ) {
                //do until map is at place
                while ( this.mapmovedX < -TileSize.x*currentscale) {
                    this.mapmovedX += TileSize.x*currentscale;
                    this.mapX = -TileSize.x*currentscale;
                    //moving map left
                    this.x += 1;
                    this.x = this.getValueX(this.x);
                    this.loadImagesToMap("right");
                    this.moveBy(pt(TileSize.x*currentscale,0));
                }
      }
      
      if ( ( this.mapmovedY < -TileSize.y*currentscale) ) {
                //do until map is at place
                while ( this.mapmovedY < -TileSize.y*currentscale) {        
                    this.mapmovedY += TileSize.y*currentscale;
                    this.mapY = -TileSize.y*currentscale;
                    //moving map up
                    this.y += 1;
                    this.y = this.getValueY(this.y);
                    this.loadImagesToMap("down");
                    this.moveBy(pt(0,TileSize.y*currentscale));
                }

      } else if ( ( this.mapmovedY > TileSize.y*currentscale) ) {
                //do until map is at place
                while ( this.mapmovedY > TileSize.y*currentscale) {    
                    this.mapmovedY -= TileSize.y*currentscale;
                    this.mapY = -TileSize.y*currentscale;
                    //moving map down
                    this.y -= 1;
                    this.y = this.getValueY(this.y);
                    this.loadImagesToMap("up");
                    this.moveBy(pt(0,-TileSize.y*currentscale));
   
                }
      }

      this.buttondown = false;
      this.startpoint = null;
      this.endpoint = null;
      this.changed();
  },

    scrollingStep: function(delta) {
        var value = this.getScale()*20;
        var vector = pt(value*delta.x, value*delta.y);
        this.moveBy(vector); 
        this.scrollMap(vector);
    },
  
  addMapMarker: function(url, rect){
      if (rect == null) {rect = new Rectangle(this.shape.bounds.center().x,this.shape.bounds.center().y,16,20);}
      this.pointerimages.push(new MapMarkerMorph(url, rect, pt(0,0)));
      this.addMorph(this.pointerimages[this.pointerimages.length-1]);
  },
  
  getMapMarkers: function(){
      return this.pointerimages;
  },
  
  initMap: function(){
      this.initializeZoomObjects();
      this.zoomRatio = 13;
      //map starting position corner is topleft and not in screen but above it!
      this.mapX = this.maparea.x -TileSize.x, this.mapY = this.maparea.y -TileSize.y;
      this.mapmovedX = 0, this.mapmovedY = 0;
      this.x = this.zo[this.zoomRatio].hotspotX, this.y = this.zo[this.zoomRatio].hotspotY;
      this.loadInitImages();
      pd("init complete",2);
  },
  
  loadInitImages: function() {
        for (var iy = 0; iy < 5; iy += 1){
            for (var ix = 0; ix < 5; ix += 1){
            this.loadImagesCorrectly(ix, iy);
            }
        }
        this.draw();
        this.imagesloaded = true;
  },
  
  getValueX: function(x){
      var value = x;
      if (value < 0) value = this.zo[this.zoomRatio].maxX + 1 + value;
      if (value > this.zo[this.zoomRatio].maxX) value = value - this.zo[this.zoomRatio].maxX -1;
      return value;
  },
  
  getValueY: function(y){
      var value = y;
      if (value < 0) value = this.zo[this.zoomRatio].maxY + 1 + value; //for handling not only -1 but -x also
      if (value > this.zo[this.zoomRatio].maxY) value = value - this.zo[this.zoomRatio].maxY -1;
      return value;
  },
  
  loadImagesCorrectly: function(ix, iy){
    pd("loadImagesCorrectly ",2);
    var tempx = this.getValueX(this.x + ix -2);
    var tempy = this.getValueY(this.y + iy -2);
    var img = null;
    if (!this.online) img = this.loadImageFromDisk(tempx, tempy, this.zoomRatio);
    var satURL ="";
    if (img){
        this.images[iy][ix] = img;
        this.imagerects[iy][ix] = new Rectangle(ix*TileSize.x, iy*TileSize.y, TileSize.x*5, TileSize.y*5);
        if (this.images[iy][ix] == null ) {
              pd("--image is NULL!", 5);
        } else {pd("loaded image from file:" + this.images[iy][ix], 5);}
    } else {
        if (this.selectedURL == MAPSURL){
            img = this.selectedURL[0] + tempx + this.selectedURL[1] + tempy + this.selectedURL[2] + this.zoomRatio;
        } else if (this.selectedURL == SATELLITESURL){
            satURL = this.generateSatelliteURL(tempx,tempy);
            img = this.selectedURL[0] + satURL;
        }
        if (img != null ){
            if (this.selectedURL == MAPSURL){
                //saveImageToDisk(this.selectedURL[0] + tempx + this.selectedURL[1] + tempy + this.selectedURL[2] + zoomRatio, tempx, tempy,zoomRatio);
            } else if (this.selectedURL == SATELLITESURL){
                satURL = this.generateSatelliteURL(tempx,tempy);
                //saveImageToDisk(this.selectedURL[0] + satURL, tempx, tempy,zoomRatio);
            }
            this.images[iy][ix] = img;
            this.imagerects[iy][ix] = new Rectangle(ix*TileSize.x, iy*TileSize.y, TileSize.x*5, TileSize.y*5);
            
        } else {
            this.images[iy][ix] = null; 
            this.imagerects[iy][ix] = null;
            pd("Error processing map image",6);
        }
    }
    this.changed();
  },
  
  /*Tries to find image from file
    if not found 
    returns null                    
    or
    image
  */
  loadImageFromDisk: function(x,y,zoom){
    var filename = "map"+x+"_"+y+".png";
    var foldername = "file:" + this.selectedmap + "/" +zoom+ "/";
    pd("loaded: " + foldername+filename,1);
    return foldername+filename;
  },
  
  loadImagesToMap: function(direction) {
      pd("MapMorph.prototype.loadImagesToMap direction" + direction,2);
      switch (direction) {
      case "down":
            this.rollImage(direction);
            var iy = 4;
            for (var ix = 0; ix < 5; ix += 1){
                this.loadImagesCorrectly(ix, iy);    
            }
            this.imagesloaded = true;
            break;
      case "up":
            this.rollImage(direction);
            var iy = 0;
            for (var ix = 0; ix < 5; ix ++) {
                this.loadImagesCorrectly(ix, iy);   
            }
            this.imagesloaded = true;
            break;
      case "right":
            this.rollImage(direction);
            var ix = 4;
            for (var iy = 0; iy < 5; iy ++) {
                this.loadImagesCorrectly(ix, iy);  
            }
            this.imagesloaded = true;
            break;    
      case "left":
            this.rollImage(direction);
            var ix = 0;
            for (var iy = 0; iy < 5; iy ++) {
                this.loadImagesCorrectly(ix, iy);    
            }
            this.imagesloaded = true;
            break;
      case "zoomin":
            this.ZoomIn();
            break;
      case "zoomout":
            this.ZoomOut();
            break;
    
      }
      this.draw();
      this.changed();
  },
  
    ZoomIn: function() {
        pd("MapMorph.prototype.ZoomIn",2);
        this.zoomRatio -= 1;
        if (this.zoomRatio < 0) {
            this.zoomRatio = 0;
            pd("Minimum zoom level reached",6);
        } else {
            //try to keep the center in same position in new zoom
            this.x = this.x*2
            this.y = this.y*2;
        }
        this.loadInitImages();
    },
  
    ZoomOut: function() {
        pd("MapMorph.prototype.ZoomOut",2);
        this.zoomRatio += 1;
        if (this.zoomRatio > 16) {
            this.zoomRatio = 16;
            pd("Maximum zoom level reached",6);
        } else {
            //try to keep the center in same position in new zoom
            this.x = Math.floor(this.x/2);
            this.y = Math.floor(this.y/2);
        }
        this.loadInitImages();
    },
    
  generateSatelliteURL: function(x,y){
      //pd("MapMorph.prototype.generateSatelliteURL",2);
    var tempx = x;
    var tempy = y;
    var x_max = 0;
    x_max = (1 + this.zo[this.zoomRatio].maxX);
    var zoom = this.zoomRatio;
    var URLstring = "t";
    /*QuadTree search for mapURL*/
    //for (var i = 0; i < (17 - zoomRatio); i++){
    while (x_max > 1) {
        if ( tempx > (x_max/2) ){
            if ( tempy > (x_max/2) ){
                //downright s
                URLstring += "s";
                //reduce y by half of ymax to next round
                tempy = tempy - x_max/2;
            } else {
                //toprigth r
                URLstring += "r";
            }
            //reduce x by half of ymax to next round
            tempx = tempx - x_max/2;
        } else {
            if ( tempy > (x_max/2) ){
                //downleft t
                URLstring += "t";
                //reduce y by half of ymax to next round
                tempy = tempy - x_max/2;
            } else {
                //topleft q
                URLstring += "q";
            }

        }
        x_max = x_max / 2;//zo[16 - i ].maxY +1;
    }
    pd("MapMorph.prototype.generateSatelliteURL returns string" + URLstring,1);
    return URLstring;
    
  },

    changeMapType: function() {
        pd("MapMorph.prototype.ChangeMapType",2);
        if (this.selectedmap == SATELLITESFOLDER){
            this.selectedmap = MAPSFOLDER;
            this.selectedURL = MAPSURL;
            this.loadInitImages();
        } else if (this.selectedmap == MAPSFOLDER){
            this.selectedmap = SATELLITESFOLDER;
            this.selectedURL = SATELLITESURL;
            this.loadInitImages();
            //alert("Entering experimental mapmode.");
        }
        this.changed();
  },

  // Move the imagematrix to some direction
  // done before loading images
  rollImage: function(direction) {
    pd("MapMorph.prototype.rollImage direction" + direction,2);
    switch (direction) {

    case "down":
        this.images[0][0] = this.images[1][0];
        this.images[0][1] = this.images[1][1];
        this.images[0][2] = this.images[1][2];
        this.images[0][3] = this.images[1][3];
        this.images[0][4] = this.images[1][4];
                        
        this.images[1][0] = this.images[2][0];
        this.images[1][1] = this.images[2][1];
        this.images[1][2] = this.images[2][2];
        this.images[1][3] = this.images[2][3];
        this.images[1][4] = this.images[2][4]; 
                
        this.images[2][0] = this.images[3][0];
        this.images[2][1] = this.images[3][1];
        this.images[2][2] = this.images[3][2];
        this.images[2][3] = this.images[3][3];
        this.images[2][4] = this.images[3][4];   
              
        this.images[3][0] = this.images[4][0];
        this.images[3][1] = this.images[4][1];
        this.images[3][2] = this.images[4][2];
        this.images[3][3] = this.images[4][3];
        this.images[3][4] = this.images[4][4]; 
        //roll also mapmarks
        for (var i = 0; i < this.pointerimages.length; i++) {
            this.pointerimages[i].moveBy(pt(0, -TileSize.y));
        }              
        //images.shift();
        break;

    case "up":
        this.images[4][0] = this.images[3][0];
        this.images[4][1] = this.images[3][1];
        this.images[4][2] = this.images[3][2];
        this.images[4][3] = this.images[3][3];
        this.images[4][4] = this.images[3][4]; 
               
        this.images[3][0] = this.images[2][0];
        this.images[3][1] = this.images[2][1];
        this.images[3][2] = this.images[2][2];
        this.images[3][3] = this.images[2][3];
        this.images[3][4] = this.images[2][4]; 
            
        this.images[2][0] = this.images[1][0];
        this.images[2][1] = this.images[1][1];
        this.images[2][2] = this.images[1][2];
        this.images[2][3] = this.images[1][3];
        this.images[2][4] = this.images[1][4]; 
               
        this.images[1][0] = this.images[0][0];
        this.images[1][1] = this.images[0][1];
        this.images[1][2] = this.images[0][2];
        this.images[1][3] = this.images[0][3];
        this.images[1][4] = this.images[0][4];        

        //images[2] = images[1]; // DO NOT DO THIS, -> javascript nice copy-features
        //images[1] = images[0];
        
        //roll also mapmarks
        for (var i = 0; i < this.pointerimages.length; i++) {
            this.pointerimages[i].moveBy(pt(0, TileSize.y));
        }
        break;
    
    case "right":
        this.images[0][0] = this.images[0][1];
        this.images[1][0] = this.images[1][1];
        this.images[2][0] = this.images[2][1];
        this.images[3][0] = this.images[3][1];
        this.images[4][0] = this.images[4][1];       
        
        this.images[0][1] = this.images[0][2];
        this.images[1][1] = this.images[1][2];
        this.images[2][1] = this.images[2][2];
        this.images[3][1] = this.images[3][2];
        this.images[4][1] = this.images[4][2]; 

        this.images[0][2] = this.images[0][3];
        this.images[1][2] = this.images[1][3];
        this.images[2][2] = this.images[2][3];
        this.images[3][2] = this.images[3][3];
        this.images[4][2] = this.images[4][3]; 

        this.images[0][3] = this.images[0][4];
        this.images[1][3] = this.images[1][4];
        this.images[2][3] = this.images[2][4];
        this.images[3][3] = this.images[3][4];
        this.images[4][3] = this.images[4][4]; 
        for (var i = 0; i < this.pointerimages.length; i++) {
            this.pointerimages[i].moveBy(pt(-TileSize.x, 0));
        }                    
        break;

    case "left":
        this.images[0][4] = this.images[0][3];
        this.images[1][4] = this.images[1][3];
        this.images[2][4] = this.images[2][3];
        this.images[3][4] = this.images[3][3];
        this.images[4][4] = this.images[4][3];

        this.images[0][3] = this.images[0][2];
        this.images[1][3] = this.images[1][2];
        this.images[2][3] = this.images[2][2];
        this.images[3][3] = this.images[3][2];
        this.images[4][3] = this.images[4][2];
    
        this.images[0][2] = this.images[0][1];
        this.images[1][2] = this.images[1][1];
        this.images[2][2] = this.images[2][1];
        this.images[3][2] = this.images[3][1];
        this.images[4][2] = this.images[4][1];        
        
        this.images[0][1] = this.images[0][0];
        this.images[1][1] = this.images[1][0];
        this.images[2][1] = this.images[2][0];
        this.images[3][1] = this.images[3][0];
        this.images[4][1] = this.images[4][0];        
        for (var i = 0; i < this.pointerimages.length; i++) {
            this.pointerimages[i].moveBy(pt(TileSize.x, 0));
        }      
        break;
    }
  },
  
  /*Initializes Map areas for each zoomlevel
  Hotspots are the locations of Tampere at the moment
  */
  initializeZoomObjects: function(){
    //zo.length = 18
    for (var i = 0; i < 18; i +=1){
        this.zo[i] = null;
    }

    //alert("zo length " + zo.length);
    this.zo[0] = new Zoomlevel();
    this.zo[0].maxX = 130880;     //estimate
    this.zo[0].maxY = 130880;     //estimate
    this.zo[0].hotspotX = 74188;
    this.zo[0].hotspotY = 36946;
    
    this.zo[1] = new Zoomlevel();
    this.zo[1].maxX = 65540;     //estimate
    this.zo[1].maxY = 65440;     //estimate
    this.zo[1].hotspotX = 37094;
    this.zo[1].hotspotY = 18473;
    
    this.zo[2] = new Zoomlevel();
    this.zo[2].maxX = 32736;     //estimate
    this.zo[2].maxY = 32736;     //estimate
    this.zo[2].hotspotX = 18547;
    this.zo[2].hotspotY = 9236;
    
    this.zo[3] = new Zoomlevel();
    this.zo[3].maxX = 16368;     //estimate
    this.zo[3].maxY = 16368;     //estimate
    this.zo[3].hotspotX = 9273;
    this.zo[3].hotspotY = 4618;
    
    this.zo[4] = new Zoomlevel();
    this.zo[4].maxX = 8184;     //estimate
    this.zo[4].maxY = 8184;     //estimate
    this.zo[4].hotspotX = 4636;
    this.zo[4].hotspotY = 2309;
    
    this.zo[5] = new Zoomlevel();
    this.zo[5].maxX = 4092;     //estimate
    this.zo[5].maxY = 4092;     //estimate
    this.zo[5].hotspotX = 2318;
    this.zo[5].hotspotY = 1154;
    
    this.zo[6] = new Zoomlevel();
    this.zo[6].maxX = 2047;     //estimate
    this.zo[6].maxY = 2047;     //estimate
    this.zo[6].hotspotX = 1159;
    this.zo[6].hotspotY = 577;
        
    this.zo[7] = new Zoomlevel();
    this.zo[7].maxX = 1023;
    this.zo[7].maxY = 1023;
    this.zo[7].hotspotX = 579;
    this.zo[7].hotspotY = 288;
    
    this.zo[8] = new Zoomlevel();
    this.zo[8].maxX = 511;
    this.zo[8].maxY = 511;
    this.zo[8].hotspotX = 289;
    this.zo[8].hotspotY = 144;
    
    this.zo[9] = new Zoomlevel();
    this.zo[9].maxX = 255;
    this.zo[9].maxY = 255;
    this.zo[9].hotspotX = 144;
    this.zo[9].hotspotY = 72;
    
    this.zo[10] = new Zoomlevel();
    this.zo[10].maxX = 127;
    this.zo[10].maxY = 127;
    this.zo[10].hotspotX = 72;
    this.zo[10].hotspotY = 36;
    
    this.zo[11] = new Zoomlevel();
    this.zo[11].maxX = 63;
    this.zo[11].maxY = 63;
    this.zo[11].hotspotX = 36;
    this.zo[11].hotspotY = 18;
    
    this.zo[12] = new Zoomlevel();
    this.zo[12].maxX = 31;
    this.zo[12].maxY = 31;
    this.zo[12].hotspotX = 18;
    this.zo[12].hotspotY = 8;
    
    this.zo[13] = new Zoomlevel();
    this.zo[13].maxX = 15;
    this.zo[13].maxY = 15;
    this.zo[13].hotspotX = 8;
    this.zo[13].hotspotY = 4;
    
    this.zo[14] = new Zoomlevel();
    this.zo[14].maxX = 7;
    this.zo[14].maxY = 7;
    this.zo[14].hotspotX = 4;
    this.zo[14].hotspotY = 2;
    
    this.zo[15] = new Zoomlevel();
    this.zo[15].maxX = 3;
    this.zo[15].maxY = 3;
    this.zo[15].hotspotX = 2;
    this.zo[15].hotspotY = 1;
    
    this.zo[16] = new Zoomlevel();
    this.zo[16].maxX = 1;
    this.zo[16].maxY = 1;
    this.zo[16].hotspotX = 1;
    this.zo[16].hotspotY = 1;

  }
  
});

    // module exports
    return { MapFrameMorph: MapFrameMorph, tileExtent: TileSize }

}(); // end of the map demo module


using(namespace('canvascape', thisModule)).run(function(module) { 

// ===========================================================================
// The CanvasScape 3D Maze Walker Example
// ===========================================================================

// This code is derived from an implementation written and copyrighted
// by Abraham Joffe (http://www.abrahamjoffe.com.au/ben/canvascape/).

/**
 * @class MiniMapMorph: The "radar view" for the game
 */

Morph.subclass("lively.Examples.canvascape.MiniMapMorph", {
    
    initialize: function($super, rect) {
        $super(new lively.scene.Rectangle(rect));
        console.log("minimap init"); 
        this.setFill(Color.black); 
        this.x = rect.topLeft().x;
        this.y = rect.topLeft().y;
        this.width = 0;//8*arena.length;
        this.height = 0;//8*arena[0].length;
        this.color = Color.yellow;//0xcc33333;
        this.background = Color.black;
        this.px = 0;//this.x + this.width / 2; //player pos
        this.py = 0;//this.y +  this.height / 2;       
        this.player;
        console.log("minimap init done"); 
        
        return this;
    }, 
    
    updatePlayerLocation: function(xloc, yloc) {
        //this.pLoc = this.worldPoint(pt(xloc,yloc));
        //console.log("location " + this.pLoc.x + " " + this.pLoc.y);
        if (this.player) this.removeMorph(this.player);
        this.player = Morph.makeCircle(pt(xloc, yloc), 3);
        this.player.setFill(Color.blue);
        this.addMorph(this.player);
    }, 
    
    getPlayerLocation: function(){
        return this.pLoc;
    }
    
});

/**
 * @class CanvasScapeMorph: The Canvas Game Morph
 */

ClipMorph.subclass("lively.Examples.canvascape.CanvasScapeMorph", {
    
    initialize: function($super, rect) {
        $super(rect);
        console.log("init"); 
        this.setFill(Color.veryLightGray);
        this.initParameters();
        this.initGame(); 
        this.loadLevel(1);
        this.addMorph(this.map);
        return this;
    }, 
    
    initGame: function() {
        console.log("initGame"); 
        this.level = "Level 1";
        this.timepassed = 0;
        this.mseconds = 0;
        this.timeleft = this.level1time;
        this.timepassed = 0;
        this.found = 0;
        this.gameon = true;
        this.timeleft = this.level1time;
        this.playerPos=[2,2]; // x,y (from top left)
        this.playerDir=0.2; // theta, facing right=0=2pi
        this.note = "Click on the floor and press space bar to start the game. Use arrow keys to steer yourself through the maze.";
        this.drawCanvas();
    },
    
    handlesMouseDown: function() {
        return true;
    },

    onMouseDown: function(evt) {
        this.requestKeyboardFocus(evt.hand);
        return true; 
    },
   
    setHasKeyboardFocus: function(newSetting) { 
        return newSetting;
    },
    
    takesKeyboardFocus: Functions.True,


    onKeyDown: function(evt) { 
        this.keyDown(evt);
        return true; 
    },

    onKeyUp: function(evt) { 
        this.keyUp(evt);
        return true; 
    },

    initParameters: function(){
        this.startint = 0;
        this.sinterval = 0;
        this.level1time = 70;
        this.level2time = 80;
        this.level3time = 180;
      
        this.arena=[];
        this.arena[0]= [1,1,1,1,1,1,1,1,1,1,1,1,1,1]
        this.arena[1]= [1,0,0,0,2,0,0,0,0,0,1,2,0,1]
        this.arena[2]= [1,0,0,1,0,1,1,1,0,0,0,0,1,1]
        this.arena[3]= [1,0,1,0,0,0,0,1,0,0,1,0,0,1]
        this.arena[4]= [1,0,0,0,0,1,0,1,0,0,1,1,0,1]
        this.arena[5]= [1,0,1,1,0,0,0,0,0,0,0,0,0,1]
        this.arena[6]= [1,0,2,1,0,1,1,1,0,0,1,2,1,1]
        this.arena[7]= [1,1,0,1,0,0,0,1,0,0,0,0,0,1]
        this.arena[8]= [1,0,0,1,0,1,0,0,0,0,1,1,0,1]
        this.arena[9]= [1,0,2,0,0,1,0,0,0,0,1,2,0,1]
        this.arena[10]=[1,1,1,1,1,1,1,1,1,1,1,1,1,1]
        this.found  = 0;
        this.maxobjects = 6; // number 2:s in map
      
        if (!this.difficulty) this.difficulty = "medium";
      
        this.gameon = false;
        this.sky = new ImageMorph(new Rectangle(0,20,4800,150), "Resources/canvasscape/sky2.jpg", true);
        this.sky.setHasKeyboardFocus = function(newSetting) { return newSetting;
        this.owner.setHasKeyboardFocus( true); };
        this.sky.takesKeyboardFocus = function() { this.owner.setHasKeyboardFocus( true);};
        this.sky.onKeyUp = function(evt) {console.log("skyonup")}; 
        this.sky.onKeyDown = function(evt) {console.log("skyondown")};
        this.sky.relayMouseEvents(this, {onKeyDown: "onKeyDown", onKeyUp: "onKeyUp", setHasKeyboardFocus: "setHasKeyboardFocus", takesKeyboardFocus: "takesKeyboardFocus"});
        this.addMorph(this.sky);
        
        this.objArray = new Array();    
        this.overlay;      
        this.pi=Math.PI;    
        this.total=0;     
        this.samples=400;
        this.playerPos=[2,2]; // x,y (from top left)
        this.playerDir=0.2; // theta, facing right=0=2pi
        this.playerPosZ=1;
        this.key=[0,0,0,0,0]; // left, right, up, down
        this.playerVelY=0;
        this.face=[];
        this.jumpCycle=0;
        this.color = Color.red;
        this.note = "";
        this.map = new module.MiniMapMorph(new Rectangle(5,25,8*this.arena.length,8*this.arena[0].length));
        this.morphArray =[];
        console.log("initParameters completed");
    },
     
    wallDistance: function(theta) {

        var data=[];
        this.face=[];
    
        var x = this.playerPos[0], y = this.playerPos[1];
        var deltaX, deltaY;
        var distX, distY;
        var stepX, stepY;
        var mapX, mapY;
        
        var atX=Math.floor(x), atY=Math.floor(y);
    
        var thisRow=-1;
        var thisSide=-1;
    
        var lastHeight=0;
    
        this.objArray = new Array();
      
        for (var i=0; i<this.samples; i++) {
            theta+=this.pi/(3*this.samples)+2*this.pi;
            theta%=2*this.pi;
    
            mapX = atX, mapY = atY;
    
            deltaX=1/Math.cos(theta);
            deltaY=1/Math.sin(theta);
    
            if (deltaX>0) {
                stepX = 1;
                distX = (mapX + 1 - x) * deltaX;
            } else {
                stepX = -1;
                distX = (x - mapX) * (deltaX*=-1);        
            }
            
            if (deltaY>0) {
                stepY = 1;
                distY = (mapY + 1 - y) * deltaY;
            } else {
                stepY = -1;
                distY = (y - mapY) * (deltaY*=-1);
            }

            for (var j=0; j<20; j++) {
                if (distX < distY) {
                    mapX += stepX;
                    if (this.arena[mapX][mapY]) {
                        if (thisRow!=mapX || thisSide!=0) {
    
                            if (i>0) {
                                if (this.arena[mapX][mapY] == 2){
                                    this.objArray.push(data.length);
                                }
                                data.push(i);
                                data.push(lastHeight);
                            }
                            if (this.arena[mapX][mapY] == 2){
                                this.objArray.push(data.length);
                            }
                            data.push(i);
                            data.push(distX);
                            thisSide=0;
                            thisRow=mapX;
    
                            this.face.push(1+stepX);
                        }
                        lastHeight=distX;
                        break;
                    }
                    distX += deltaX;
                }
                else {
                    mapY += stepY;
                    if (this.arena[mapX][mapY]) {
                        if (thisRow!=mapY || thisSide!=1) {
                            
                            if (i>0) {
                                if (this.arena[mapX][mapY] == 2){
                                this.objArray.push(data.length);
                                }
                                data.push(i);
                                data.push(lastHeight);
                            }
                            if (this.arena[mapX][mapY] == 2){
                                this.objArray.push(data.length);
                            }    
                            data.push(i);
                            data.push(distY);
                            thisSide=1;
                            thisRow=mapY;
    
                            this.face.push(2+stepY)
                        }
                        lastHeight=distY;
                        break;
                    }
                    distY += deltaY;
                }
            }
        }
        data.push(i);
        data.push(lastHeight);
        return data;
    }, 
    
    drawCanvas: function(){
        var morppi;

        for (var r = 0; r < this.morphArray.length; r++){
            this.morphArray[r].remove();
        }
        
        this.morphArray = [];
        this.sky.setPosition(pt( -this.playerDir/(2*this.pi)*2400, 0));
        
        morppi = new TextMorph(new Rectangle(0,0,800,20));
        morppi.setTextString(this.level+ ". Blue walls found " + this.found + " / " + this.maxobjects + ". Time left: " + this.timeleft + ". Time passed: " + this.timepassed);
        morppi.relayMouseEvents(this, {onMouseDown: "onMouseDown", onMouseUp: "onMouseUp"});
        this.addMorph(morppi);
        this.morphArray.push(morppi);
        
        if (this.note != "") {
            morppi = new TextMorph(new Rectangle(0,280,800,20));
            morppi.setTextString(this.note);
            morppi.relayMouseEvents(this, {onMouseDown: "onMouseDown", onMouseUp: "onMouseUp"});
            this.addMorph(morppi);
            this.morphArray.push(morppi);
        }
        
        var theta = this.playerDir-this.pi/6;    
        var wall=this.wallDistance(theta);
        this.map.updatePlayerLocation(8*this.playerPos[0], 8*this.playerPos[1]);
        this.color = Color.black;

        var linGrad;
        var tl,tr,bl,br;        
        var theta1,theta2,fix1,fix2;
        var drawobject = false;

        for (var i=0; i<wall.length; i+=4) {
    
            theta1=this.playerDir-this.pi/6 + this.pi*wall[i]/(3*this.samples);
            theta2=this.playerDir-this.pi/6 + this.pi*wall[i+2]/(3*this.samples);
            
            fix1 = Math.cos(theta1-this.playerDir);
            fix2 = Math.cos(theta2-this.playerDir);
    
            var h=2-this.playerPosZ;
    
            var wallH1=100/(wall[i+1]*fix1);
            var wallH2=100/(wall[i+3]*fix2);
    
            tl=[wall[i]*2, 150-wallH1*h];
            tr=[wall[i+2]*2, 150-wallH2*h]
            br=[wall[i+2]*2, tr[1]+wallH2*2];
            bl=[wall[i]*2, tl[1]+wallH1*2]
    
            var shade1=Math.floor(wallH1*2+20); if (shade1>255) shade1=255;
            var shade2=Math.floor(wallH2*2+20); if (shade2>255) shade2=255;
    
            drawobject = false;
            for (var s = 0; s < this.objArray.length; s+=1) {
                if ( (this.objArray[s] >= i-1) && (this.objArray[s] < i + 2) ) {
                    //wall is an object
                    wallH1=100/(wall[i+1]*fix1);
                    wallH2=100/(wall[i+3]*fix2);
    
                    tl=[wall[i]*2, 150-wallH1*h];
                    tr=[wall[i+2]*2, 150-wallH2*h]
                    br=[wall[i+2]*2, tr[1]+wallH2*2];
                    bl=[wall[i]*2, tl[1]+wallH1*2]
                    drawobject = true;
                }
            }

            if ( (i/4)%2 == 0) {
                var c = ((this.face[i/4]%2==0 ? shade1 : 1) * (this.face[i/4]==1 ? shade1 : 1) * (this.face[i/4]==2 ? 1 : shade1))/255;
                this.color= new Color(shade1/512,shade1/512,shade1/512);
            } else {
                var c = ((this.face[i/4]%2==0 ? shade1 : 1) * (this.face[i/4]==1 ? shade1 : 1) * (this.face[i/4]==2 ? 1 : shade1))/255;
                this.color= new Color(c,c,c);
                this.color= new Color(shade2/512,shade2/512,shade2/512);
            }

            if (drawobject) {
                morppi = new Morph(new lively.scene.Polygon([pt(tl[0],tl[1]),pt(tr[0],tr[1]),pt(br[0],br[1]),pt(bl[0],bl[1])]));
		morppi.setFill(Color.blue);
                morppi.relayMouseEvents(this, {onMouseDown: "onMouseDown", onMouseUp: "onMouseUp"});
                this.addMorph(morppi);
            } else {
                morppi = new Morph(new lively.scene.Polygon([pt(tl[0],tl[1]),pt(tr[0],tr[1]),pt(br[0],br[1]),pt(bl[0],bl[1])]));
		morppi.setFill(this.color);
                morppi.relayMouseEvents(this, {onMouseDown: "onMouseDown", onMouseUp: "onMouseUp"});
                this.addMorph(morppi);
            }
            
            this.morphArray.push(morppi);
               
        }

    }, 
    
    nearWall: function(x,y){
        var xx,yy;
        if (isNaN(x)) x=this.playerPos[0];
        if (isNaN(y)) y=this.playerPos[1];

        for (var i=-0.1; i<=0.1; i+=0.2) {
            xx=Math.floor(x+i);
            for (var j=-0.1; j<=0.1; j+=0.2) {
                yy=Math.floor(y+j);
                if (this.arena[xx][yy] == 2) {
                this.arena[xx][yy] = 0;
                this.found += 1;
                if (this.found == this.maxobjects){
                    this.endLevel();
                }
                }
                if (this.arena[xx][yy]) return true;
            }
        }
        
        return false;
    },

    wobbleGun: function(){
        var mag=this.playerVelY;
        //not in use
        //this.overlay.style.backgroundPosition=(10+Math.cos(this.total/6.23)*mag*90)+"px "+(10+Math.cos(this.total/5)*mag*90)+"px";
    },
    
    update: function(){
        this.total++;
        var change=false;
    
        if (this.jumpCycle) {
            this.jumpCycle--;
            change=true;
            this.playerPosZ = 1 + this.jumpCycle*(20-this.jumpCycle)/110;
        } else if (this.key[4]) this.jumpCycle=20;
        
        if (this.key[0]) {
            if (!this.key[1]) {
                this.playerDir-=0.07; //left
                change=true;
            }
        } else if (this.key[1]) {
            this.playerDir+=0.07; //right
            change=true;
        }
    
        if (change) {
            this.playerDir+=2*this.pi;
            this.playerDir%=2*this.pi;
        }
    
        if (this.key[2] && !this.key[3]) {
            if (this.playerVelY<0.1) this.playerVelY += 0.02;
        } else if (this.key[3] && !this.key[2]) {
            if (this.playerVelY>-0.1) this.playerVelY -= 0.02;
        } else {
            if (this.playerVelY<-0.02) this.playerVelY += 0.015;
            else if (this.playerVelY>0.02) this.playerVelY -= 0.015;
            else this.playerVelY=0;
        }

        if (this.playerVelY!=0) {
    
            var oldX=this.playerPos[0];;
            var oldY=this.playerPos[1];        
            var newX=oldX+Math.cos(this.playerDir)*this.playerVelY;
            var newY=oldY+Math.sin(this.playerDir)*this.playerVelY;
    
            if (!this.nearWall(newX, oldY)) {
                this.playerPos[0]=newX;
                oldX=newX;
                change=true;
            }

            if (!this.nearWall(oldX, newY)) {
                this.playerPos[1]=newY;
                change=true;
            }
    
        }
        
        if (this.playerVelY) this.wobbleGun();
        if (change) this.drawCanvas();
    
    }, 

    initUnderMap: function(){ // now its actually drawMinimap
        this.map.removeAllMorphs();
        var morppi;

        this.color = this.map.color;
        for (var i=0; i<this.arena.length; i++) {
            for (var j=0; j<this.arena[i].length; j++) {
                if (this.arena[i][j] && this.arena[i][j] != 2) {
                    if (this.difficulty != "hard") {
                        morppi = Morph.makeRectangle(i*8,  j*8, 8, 8);
                        morppi.setFill(this.color);
                        this.map.addMorph(morppi);
                    }
                } 
                if (this.arena[i][j] == 2 && this.difficulty == "easy") {
                    //this.color = Color.red;
                    morppi = Morph.makeRectangle( i*8,  j*8, 8, 8);
                    morppi.setFill(Color.red);
                    this.map.addMorph(morppi);
                }
            }    
        }
        
        this.color = Color.black;
    },

    calculateMaxObjects: function() {
        var count = 0;
        for (i = 0; i < this.arena.length; i++){
            for (j = 0; j < this.arena[i].length; j++){
                if (this.arena[i][j] == 2){
                    count +=1;
                }
            }
        }
        this.maxobjects = count;
    },
    
    endLevel: function() {
        if (this.level == "Level 1") {
            this.note = "Level 2";
            this.loadLevel(2);
            this.timeleft = this.timeleft + this.level2time;
            return;
        } else if (this.level == "Level 2") {
            this.note = "Level 3";
            this.loadLevel(3);
            this.timeleft = this.timeleft + this.level3time;
            return;
        } else if (this.level == "Level 3"){
            this.note = "Game completed.  Press space bar for another game.";
            this.level="Finished";
            this.endGame();
        }
    },

    changeKey: function(which, to) {
        // FIXME: Hard-coded key codes used here!
        switch (which){
            case 65: case 37: this.key[0]=to; break; // left
            case 87: case 38: this.key[2]=to; break; // up
            case 68: case 39: this.key[1]=to; break; // right
            case 83: case 40: this.key[3]=to; break; // down
            //case 32: this.key[4]=to; break; // space bar;
            case 17: 
                //newGame();
                break; 
        }
    },

    keyDown: function(event) {

        var key = event.getKeyCode();
      
        // Check if any cursor keys have been pressed and set flags.      
        if (key == Event.KEY_LEFT)
            this.changeKey(37, 1);
        else if (key == Event.KEY_RIGHT)
            this.changeKey(39, 1);
        else if (key == Event.KEY_UP)
            this.changeKey(38, 1);
        else if (key == Event.KEY_DOWN)
            this.changeKey(40, 1);
        else if (event.getKeyCode() == Event.KEY_SPACEBAR) { 
            this.startGame();
        }
    },
      
    keyUp: function(event) {
        var key = event.getKeyCode();
    
        // Check if any cursor keys have been pressed and set flags.
        if (key == Event.KEY_LEFT)
            this.changeKey(37, 0);
        else if (key == Event.KEY_RIGHT)
            this.changeKey(39, 0);
        else if (key == Event.KEY_UP)
            this.changeKey(38, 0);
        else if (key == Event.KEY_DOWN)
            this.changeKey(40, 0);
    },

    loadLevel: function(number){
    
        if (number == 1) {
            this.arena = [];
            this.arena[0]= [1,1,1,1,1,1,1,1,1,1,1,1,1,1]
            this.arena[1]= [1,0,0,0,2,0,0,0,0,0,1,2,0,1]
            this.arena[2]= [1,0,0,1,0,1,1,1,0,0,0,0,1,1]
            this.arena[3]= [1,0,1,0,0,0,0,1,0,0,1,0,0,1]
            this.arena[4]= [1,0,0,0,0,1,0,1,0,0,1,1,0,1]
            this.arena[5]= [1,0,1,1,0,0,0,0,0,0,0,0,0,1]
            this.arena[6]= [1,0,2,1,0,1,1,1,0,0,1,2,1,1]
            this.arena[7]= [1,1,0,1,0,0,0,1,0,0,0,0,0,1]
            this.arena[8]= [1,0,0,1,0,1,0,0,0,0,1,1,0,1]
            this.arena[9]= [1,0,2,0,0,1,0,0,0,0,1,2,0,1]
            this.arena[10]=[1,1,1,1,1,1,1,1,1,1,1,1,1,1]
            this.calculateMaxObjects();
            this.level = "Level 1";

        } else if (number == 2) {
            this.arena = [];
            this.arena[0]= [1,1,1,1,1,1,1,1,1,1,1,1,1,1]
            this.arena[1]= [1,0,0,0,0,0,1,0,0,0,0,2,0,1]
            this.arena[2]= [1,0,0,0,1,0,1,0,1,2,1,1,0,1]
            this.arena[3]= [1,1,1,1,1,0,1,0,1,0,0,2,0,1]
            this.arena[4]= [1,0,0,0,0,0,0,0,1,1,1,1,0,1]
            this.arena[5]= [1,0,1,1,1,0,1,0,0,0,0,0,0,1]
            this.arena[6]= [1,0,0,0,0,0,0,0,0,0,0,1,1,1]
            this.arena[7]= [1,0,1,0,0,0,0,1,1,1,0,0,0,1]
            this.arena[8]= [1,0,2,1,1,1,0,1,2,1,0,1,0,1]
            this.arena[9]= [1,1,0,0,0,0,2,0,0,0,0,1,2,1]
            this.arena[10]=[1,1,1,1,1,1,1,1,1,1,1,1,1,1]
            this.calculateMaxObjects();
            this.level = "Level 2";

        } else if (number == 3) {
            this.arena = [];
            this.arena[0]= [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
            this.arena[1]= [1,0,0,1,0,0,0,2,1,2,0,0,1,0,1,2,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,1]
            this.arena[2]= [1,0,0,1,0,0,0,2,1,0,1,0,1,0,0,1,0,0,1,1,1,1,2,0,0,1,0,1,0,1,0,0,0,1,0,1,1,1,1,1,1,0,1,0,2,1,2,0,1]
            this.arena[3]= [1,1,0,1,0,1,0,0,0,0,1,0,1,0,0,1,0,0,2,1,1,1,1,0,0,1,0,1,0,1,2,0,0,1,0,1,0,0,0,0,1,0,1,0,1,1,1,0,1]
            this.arena[4]= [1,0,0,1,0,1,1,1,1,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,0,1,0,0,0,1,0,1,0,1,2,2,1,0,1,0,0,1,0,0,1]
            this.arena[5]= [1,0,0,1,0,1,0,1,0,0,1,0,1,1,1,0,1,1,1,1,1,1,1,1,1,1,0,0,0,1,1,1,0,0,0,1,0,1,2,2,1,0,1,0,0,1,0,0,1]
            this.arena[6]= [1,1,0,0,0,0,0,0,0,0,1,0,0,0,1,0,1,0,0,0,1,0,0,2,1,0,0,0,0,0,0,0,1,0,0,1,0,1,1,1,1,0,1,0,1,1,1,0,1]
            this.arena[7]= [1,0,0,0,1,1,1,1,0,1,1,1,1,0,1,2,1,0,1,0,1,2,1,0,1,0,1,0,0,0,0,0,1,2,0,1,0,0,0,0,0,0,1,0,0,0,0,0,1]
            this.arena[8]= [1,0,1,1,1,2,0,0,0,1,1,0,0,2,1,0,1,0,1,2,1,0,1,0,0,2,1,1,1,1,1,0,1,0,0,1,1,1,1,1,1,1,1,1,1,0,1,1,1]
            this.arena[9]= [1,0,0,2,0,0,1,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0,0,0,1,0,1,0,2,0,0,0,0,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,1]
            this.arena[10]=[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
            this.calculateMaxObjects();
            this.level = "Level 3";
        }
        
        this.playerPos=[2,2]; // x,y (from top left)
        this.playerDir=0.2; // theta, facing right=0=2pi
        this.map.width = 8*this.arena.length;
        this.map.height = 8*this.arena[0].length;
        this.map.updatePlayerLocation(8*this.playerPos[0], 8*this.playerPos[1]);
        this.map.shape.setBounds(new Rectangle(0,0,this.map.width, this.map.height));
        this.initUnderMap();
        
        this.key=[0,0,0,0,0];
        this.found = 0;

        this.drawCanvas();
    },

    stopGame: function(){
        this.note = "You ran out of time.  Press space bar for another game.";
        this.update();
        if (this.map) this.map.remove();
        this.initGame(); 
        this.initUnderMap();
        this.addMorph(this.map);
        this.stopStepping();
    },

    doUpdate: function() {
        this.mseconds += 35;
        if (this.mseconds > 1000) {
            this.mseconds -= 1000;
            this.timepassed += 1;
            this.timeleft -= 1;
            if (this.timeleft <= 0) this.stopGame();
        }
        this.update(); 
    },

    startGame: function() {
        if (this.map) this.map.remove();
        this.initGame();
        this.map = new module.MiniMapMorph(new Rectangle(5,25,8*this.arena.length,8*this.arena[0].length)); 
        this.initUnderMap();
        this.addMorph(this.map);
        this.note="";
        this.startStepping(35, "doUpdate");
    },


    setDifficulty: function(dif){
        this.difficulty = dif;
        this.startGame();
    },

    morphMenu: function($super, evt) {
        var menu = $super(evt);
        menu.addLine();
        menu.addItem(["Stop game",  this, 'stopGame']);
        menu.addItem(["Start easy game",  this, 'setDifficulty', 'easy']);
        menu.addItem(["Start medium game",  this, 'setDifficulty', 'medium']);
        menu.addItem(["Start hard game",  this, 'setDifficulty', 'hard']);
        return menu;
    }
});

}); // end canvascape

// ===========================================================================
// The Morphic Radial Engine Demo
// ===========================================================================


BoxMorph.subclass("EngineMorph", {

    documentation: "The Radial Engine demo",
    angleStep: Math.PI/8,
    style: using(lively.paint).link({
	fill: {$:"LinearGradient", stops: [{$:"Stop", offset: 0, color: Color.gray},
					   {$:"Stop", offset: 1, color: Color.darkGray}],
	       vector: lively.paint.LinearGradient.NorthSouth},
	borderColor: Color.black, 
	borderWidth: 1}),

    styleClass: ['raisedBorder'],

    pistonStyle: using(lively.paint).link({
	fill: {$:"LinearGradient", stops: [{$:"Stop", offset: 0.0, color: Color.darkGray},
					   {$:"Stop", offset: 0.4, color: Color.lightGray},
					   {$:"Stop", offset: 1.0, color: Color.darkGray}],
	       vector: lively.paint.LinearGradient.EastWest},
	borderColor: Color.black, 
	borderWidth: 2}),
    
    crankPinStyle: using(lively.paint).link({
	fill: {$:"RadialGradient", stops: [{$:"Stop", offset:0, color: Color.darkGray},
					   {$:"Stop", offset:1, color: Color.gray.darker(2)}]},
	borderColor: Color.black, 
	borderWidth: 1}),
   
    initialize: function($super, fullRect) {
        // A lively model by Dan Ingalls - 9/25/2007
        $super(fullRect);
	this.applyLinkedStyles();
        this.makeLayout(1, false);
        this.setRunning(true);
    },

    initializeTransientState: function($super, initialBounds) {
	var bnds = this.innerBounds().withHeight(this.innerBounds().width);
        var center = bnds.center();
        var relBore = 0.14;
        var cr = bnds.scaleByRect(new Rectangle(0.5 - (relBore/2), 0.1, relBore, 0.2));
        var dHead = cr.width*0.2;  // slight dome at top of cylinder -- room for valves
        var pistonBW = 2;
	this.topPosDisplacement = pt(pistonBW, dHead);
    },

    makeLayout: function(nCylinders, alternating) {
        // FYI, here's the declarative structure...
        //    Engine
        //        Crank
        //            CrankPin
        //        CrankPinCap - follows the crank pin, but appears over connecting rods
        //        ConnectingRod (with highlight)
        //        Cylinder (may be many)
        //            Piston
        //                WristPin
        console.log("making layout " + this);

        var bnds = this.innerBounds().withHeight(this.innerBounds().width);
        var center = bnds.center();
        this.stroke = bnds.height*0.14;
        this.normalSpeed = 100;
        this.crank = Morph.makeCircle(center, this.stroke*0.8, 4, Color.black, Color.gray);
        this.addMorph(this.crank);
        this.crankPin = Morph.makeCircle(pt(0, -this.stroke/2), this.stroke*0.25, 1, Color.black, Color.gray.darker(2));
        this.crank.addMorph(this.crankPin);
	this.crankPinCap = this.crankPin.copy();
	this.crankPinCap.applyStyle(this.crankPinStyle);
        this.alternate = alternating;
        this.makeCylinders(nCylinders);

        var menu = new MenuMorph([]);
        for (var i=1; i<=9; i++) menu.addItem([i.toString(), this, 'makeCylinders', i]);
        menu.openIn(this, pt(80,440), true, "Number of cylinders"); 

        menu = new MenuMorph([
            ["sequential", this, 'setAlternateTiming', false],
            ["alternate", this, 'setAlternateTiming', true] ]);
        menu.openIn(this, pt(300,440), true, "Ignition timing"); 

        this.addRunMenu();

        var label = this.addMorph(TextMorph.makeLabel("The Radial Engine",{fontSize: 20}));
        label.align(label.bounds().topCenter(), bnds.bottomCenter().addXY(0, -20));
    },

    addRunMenu: function() {
        if (this.runMenu) this.runMenu.remove();
        this.runMenu = new MenuMorph([
            (this.running ? ["stop", this, 'setRunning', false]
                          : ["run", this, 'setRunning', true]),
            ["step", this, 'doStep'],
            ["rebuild", this, 'rebuild'],
            (this.stepTime == this.normalSpeed ? ["fast", this, 'setStepTime', 1]
             : ["slow", this, 'setStepTime', this.normalSpeed])
        ]);
        this.runMenu.openIn(this, pt(310,515), true, "Operating State");
    },

    makeCylinders: function(nCylinders) {
        // Build cylinder-piston assembly with center of rotation at crank center
        this.crankAngle = 0; // goes up to 4*pi, while rotation wraps at 2*pi
        this.crank.setRotation(this.crankAngle);
        var bnds = this.innerBounds().withHeight(this.innerBounds().width);
        var center = bnds.center();
        var relBore = 0.14;
        var cr = bnds.scaleByRect(new Rectangle(0.5 - (relBore/2), 0.1, relBore, 0.2));
        var dHead = cr.width*0.2;  // slight dome at top of cylinder -- room for valves
        var cylVerts = [cr.topRight(), cr.bottomRight(),  //vertices of cylinder polygon
            cr.topRight().addXY(0, this.stroke), cr.topLeft().addXY(0, this.stroke),
            cr.bottomLeft(), cr.topLeft(),
            cr.topLeft().addXY(dHead, -dHead), cr.topRight().addXY(-dHead, -dHead),
            cr.topRight()
        ];
        cylVerts = cylVerts.invoke('subPt', this.crank.bounds().center());
        var cylinder = Morph.makePolygon(cylVerts, 4, Color.black, Color.gray);
        cylinder.setLineJoin(lively.scene.LineJoins.Round);
        cylinder.setPosition(cr.topLeft().addXY(0, -dHead));
        var pistonBW = this.pistonStyle.borderWidth;
        var pistonDx = (cylinder.getBorderWidth() + pistonBW) / 2 - 1;
        var piston = Morph.makeRectangle(cr.insetByPt(pt(pistonDx, (cr.height-this.stroke)/2)));
	piston.applyStyle(this.pistonStyle);
        cylinder.addMorph(piston);
        var wristPin = Morph.makeCircle(piston.innerBounds().center(), cr.width*0.1, 0, null, Color.black);
        piston.addMorph(wristPin);

        // Duplicate and rotate the cylinder assembly to complete the engine
        if (this.cylinders) this.cylinders.invoke('remove'); // remove any previous assemblies
	if (this.connectingRods) this.connectingRods.invoke('remove');

        this.cylinders = []; // Note this is an array that points to various submorphs
	this.connectingRods = [];
        for (var i=0; i<nCylinders; i++) {
            var cyl = cylinder.copy();
            this.addMorph(cyl)
            cyl.angle = (Math.PI*2/nCylinders)*i;
            if (this.alternate && i%2 == 1) cyl.angle += Math.PI*2;
            cyl.setRotation(cyl.angle);
            cyl.piston = cyl.topSubmorph();
	    cyl.piston.topPos = cyl.innerBounds().topLeft().addPt(this.topPosDisplacement);
            cyl.wristPin = cyl.piston.topSubmorph();
            this.cylinders.push(cyl);
            // Note: cyl.connectingRod points to a morph that is not a submorph yet
            // Real endpoints get set later in doStep
            this.connectingRods[i] = cyl.addMorph(Morph.makeLine(
                [pt(10, 10), pt(10, 10)], cr.width*0.15, Color.gray.darker(2) ));
            this.connectingRods[i].addMorph(Morph.makeLine( // extra morph for highlight on rod
                [pt(10, 10), pt(10, 10)], cr.width*0.05, Color.darkGray ));
            cyl.addMorph(cyl.piston);  // brings it on top of connecting rod (looks better)
            this.movePiston(cyl);
        };
	this.connectingRods[nCylinders-1].addMorph(this.crankPinCap);
	this.doStep(); // makes connecting rods
    },

    movePiston: function(cyl) { // Method to move piston and connecting rod
        var pi = Math.PI;
        var phase = (this.crankAngle - cyl.angle);
        if (phase < 0) phase += pi*4;
        var dy = (Math.cos(phase) - 1) * this.stroke/2;
        cyl.piston.setPosition(cyl.piston.topPos.addXY(0, -dy));
        var cycle = Math.floor(phase / pi);  // Change color based on cycle
        var frac = phase / pi - cycle;  // Change shading based on fractional part of cycle (wow ;-)
        switch (cycle) {
            case 0: cyl.setFill(Color.blue.lighter());  break;  // intake
            case 1: cyl.setFill(Color.blue.mixedWith(Color.blue.lighter(), frac));  break;  // compression
            case 2: cyl.setFill(Color.red.lighter().mixedWith(Color.red, frac));  break;  // power
            case 3: cyl.setFill(Color.red.lighter());  break; 
        }  // exhaust
        if (Math.abs(phase-2*pi) < this.angleStep/2) cyl.setFill(Color.yellow);  // ignition
    },

    setRunning: function(trueOrFalse) {
        this.running = trueOrFalse;
        this.addRunMenu();
    },

    nextStep: function() {
        if (!this.running) return;
        // Don't bother stepping if we are in a collapsed window
        if (this.immediateContainer() && !this.immediateContainer().contentIsVisible()) return;
        this.doStep();
    },

    doStep: function() {
	var crPt;
        this.crankAngle += this.angleStep; 
        if (this.crankAngle > Math.PI*4) this.crankAngle -= Math.PI*4;
        this.crank.setRotation(this.crankAngle);  // Rotate the crankshaft
        this.cylinders.forEach(function(cyl, i) {
            this.movePiston(cyl);  // Move the pistons
            var cr = this.connectingRods[i];
            cr.setVertices(  // Relocate the connecting rods
                [cr.localizePointFrom(this.crankPin.bounds().center(), this.crank),
                cr.localizePointFrom(cyl.wristPin.bounds().center(), cyl.piston)]
            );
            cr.submorphs[0].setVertices(  // also the highlight stripes
                [cr.shape.vertices()[0],
                cr.shape.vertices()[1]]
            );
            crPt = cr.shape.vertices()[0];
        }, this);
	this.crankPinCap.setPosition(crPt.subPt(this.crankPinCap.getExtent().scaleBy(0.5)));
    },

    setAlternateTiming: function(trueOrFalse) {
        // Demonstrate alternate and sequential firing order
        this.alternate = trueOrFalse;
        this.makeCylinders(this.cylinders.length);
	this.doStep(); // makes connecting rods
    },

    rebuild: function() {
        this.removeAllMorphs();
        this.makeLayout(this.cylinders.length, this.alternate);
    },

    setStepTime: function(ms) {
        this.stepTime = ms;
        this.addRunMenu();
        this.stopStepping();
        this.startStepping(ms,'nextStep');
    },

    onMouseMove: function(evt) {
	// Hack:  trigger mouseMove check to unhighlight fixed menus
        this.submorphs.forEach(function (each) {each.onMouseMove(evt); });
    },

    startSteppingScripts: function() { this.setStepTime(this.normalSpeed); },

    layoutOnSubmorphLayout: Functions.False
});

EngineMorph.makeEngine = function(world, pos) {
    var engine = new EngineMorph(new Rectangle(0, 0, 400, 600));
    // KP: add the top morph to the world first, to make firefox happy
    world.addFramedMorph(engine, 'A Lively Engine', pos);
    engine.openAllToDnD();  // have a little fun...
    engine.startSteppingScripts();
}

// ===========================================================================
// Video Player Demo
// ===========================================================================

/*
 * AnimMorph is the animation "engine" that loads the frames for the animation
 */
  
Morph.subclass("AnimMorph", {
    
    initialize: function($super, rect) {  
        $super(new lively.scene.Rectangle(rect));
        this.dim = rect.extent();
    },

    startup: function(frameURL, numberOfFrames, frameType) {

        this.setFill(Color.black);

        this.play = false;
        this.data = new Array();
        this.frame = 0;
        this.play = false;

        for ( var i = 1; i <= numberOfFrames; i++ ) {
            var index = i;
            // so far using animations with less than 4 digits
            if ( i < 10 ) {
                index = "000" + i;
            } else if ( index < 100 ) {
                index = "00" + i;
            } else if ( index < 1000 ) {
                index = "0" + i;
            }
            this.data.push(frameURL + index + frameType);
        }
        
        this.status = Morph.makeCircle(this.bounds().center(), 50);
        this.status.handlesMouseDown = function() {
            return true;
        }
        this.status.onMouseDown = function (evt) {
            this.owner.play = true;
            this.remove();
        }
        this.addMorph(this.status);
        this.status.setFill(Color.white);
        this.status.setFillOpacity(0.7);
        this.status.setBorderWidth(0);
	var k = new Morph(new lively.scene.Polyline([pt(-20,-20),pt(30,0),pt(-20,20), pt(-20,-20)]));
	k.applyStyle({borderWidth: 1, borderColor:Color.blue});
        this.status.addMorph(k);
        k.setFill(Color.blue.lighter());
        k.relayMouseEvents(this.status, {onMouseDown: "onMouseDown", onMouseUp: "onMouseUp"});
    },
    
    loadURL: function(url) {
        if (this.image && this.image.tagName != 'image') {
            this.removeChild(this.image);
            this.image = null;            
        }

        if (!this.image) {
            var image = this.image = NodeFactory.create("image", { x: 0, y: 0, width: this.dim.x, height: this.dim.y});
            this.addNonMorph(image);
        }
        this.image.setAttributeNS(Namespace.XLINK, "href", url);
    },

    reload: function() {
        if (this.url) {
            this.loadURL(this.url);
        }
    },
            
    nextFrame: function() {

        if (this.play) {
            this.showNext();
        } 
    },
    
    showNext: function() {

        this.frame++;
        if (this.frame == this.data.length) {
            this.frame = 0;
            this.play = false;
            this.addMorph(this.status);
        }
        this.url = this.data[this.frame];
        this.reload();
    },

    handlesMouseDown: function() {
        return true;
    },
    
    // should we make a better control panel for the animation with mouseover and mouseout?
    onMouseOver: function($super, evt) {
       // console.log("mouse over");
    },
    
    onMouseOut: function($super, evt) {
       // console.log("mouse out");
    },
    
    onMouseDown: function(evt) {
        if ( this.play ) {
            this.play = false;
            this.addMorph(this.status);
        } 
    }

});

/*
 * PlayerMorph is the end-user interface for showing the animation
 */ 

BoxMorph.subclass("PlayerMorph",  {

    initialize: function($super) {
        var rect = new Rectangle(0, 0, 330, 260);
        $super(rect);
        this.setFill(using(lively.paint).run(function(gfx) {
	    return new gfx.LinearGradient([new gfx.Stop(0, Color.white), new gfx.Stop(1, Color.primary.blue)], 
					  gfx.LinearGradient.NorthSouth);
	}));
					     
        this.animation = new AnimMorph(rect);
        this.animation.startup("Resources/Anim/Frame", 469, ".jpg"); 

        this.addMorph(this.animation);
    },
    
    start: function() {
        this.animation.play = true;
    },
    
    stop: function() {
        this.animation.play = false;
    },
    
    openIn: function(world, location) {
        world.addFramedMorph(this, 'AnimationMorph', location);
        this.startAnimation();
    },
    
    startAnimation: function() {
        this.animation.startStepping(100,"nextFrame"); 
    }    
});


}); // end of Examples module