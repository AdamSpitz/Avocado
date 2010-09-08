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
 * Contributions.js. This file contains contributed code in various states of usability,
 * often not strictly following Lively Kernel conventions.
 */

module('lively.Contributions').requires().toRun(function(thisModule) {
	
// ===========================================================================
// The DungBeetle Game Example
// ===========================================================================

/**
 * @class DungBeetleMorph
 */

ClipMorph.subclass('DungBeetleMorph', {
		
	  /* static final url */
  	IMAGEURL: "http://www.cs.tut.fi/~delga/SunLabsLivelyKernel/DungBeetle/",
  	TILES_X: 8,
  	TILES_Y: 8,
  	OFFSET_X: 8,
  	OFFSET_Y: 50,
	TILESIZE: 28,

	MY_LOCATION_X: 1,
	MY_LOCATION_Y: 0,
	
	ENEMY_LOCATION_X: 6,
	ENEMY_LOCATION_Y: 7,

	TIMER_ON: false,
	
	DUNG: [],
	
	timerID: 0,
	
	initialize: function($super, rect) {
        $super(rect);
	    this.initLobbyRoom();
	  	return this;
	},	
	
	// Create the lobbyroom
	initLobbyRoom: function() {
		this.endGame();
		var splashUrl = this.IMAGEURL + "dungbeetle_splash.png";
		var startUrl = this.IMAGEURL + "softkey_start.png";
		var quitUrl = this.IMAGEURL + "softkey_quit.png";
		var startUrlDown = this.IMAGEURL + "softkey_start_down.png";
		var quitUrlDown = this.IMAGEURL + "softkey_quit_down.png";	

		// creates background image
		var r =  new Rectangle(0,0,240,320);
		var backgroundImage = new ImageMorph(r, splashUrl);
	
	  	// creates buttons
		var r = new Rectangle(10,307,66,13);
		this.startButton = new ImageButtonMorph(r, startUrl, startUrlDown);
		var r = new Rectangle(166,307,66,13);
	  	this.quitButton = new ImageButtonMorph(r, quitUrl,quitUrlDown);
	
	  	// button hooks
        this.startButton.connectModel({model: this, setValue: "initGameRoom"});
        this.quitButton.connectModel({model: this, setValue: "quitDungBeetle"});
	  	
	    // adds images and buttons to lobby
		this.addMorph(backgroundImage);
		this.addMorph(this.startButton);
		this.addMorph(this.quitButton);
	},
	
	// Quit game
	quitDungBeetle: function() {
		this.owner().remove();
	},
	
	// Start game
	initGameRoom: function() {
		
		this.TIMER_ON = false;
		var sand1Url = this.IMAGEURL + "tile_sand1.png";
		var sand2Url = this.IMAGEURL + "tile_sand2.png";
		var homeUrl = this.IMAGEURL + "tile_home.png";
		var enemyHomeUrl = this.IMAGEURL + "tile_enemy_home.png";
		var backUrl = this.IMAGEURL + "softkey_back.png";
		var backDownUrl = this.IMAGEURL + "softkey_back_down.png";
		var enemyBeetle1Url = this.IMAGEURL + "bug_blue1.png";
		var enemyBeetle2Url = this.IMAGEURL + "bug_blue2.png";

		//initialises variables
		this.MY_LOCATION_X = 1,
		this.MY_LOCATION_Y = 0,
	
		this.ENEMY_LOCATION_X = 6,
		this.ENEMY_LOCATION_Y = 7,

		//removes items from dung array
		this.DUNG.splice(0,this.DUNG.length);
		
		for (var i=0; i<9; i++) {
		  for (var j=0; j<12; j++) {
			var tileUrl = sand2Url;
			var tileImage = new ImageMorph(new Rectangle(this.TILESIZE*i,this.TILESIZE*j,this.TILESIZE,this.TILESIZE), tileUrl);			
		    // adds tile
			this.addMorph(tileImage);
		  }
		}

		for (var i=0; i<this.TILES_X; i++) {
		  for (var j=0; j<this.TILES_Y; j++) {
			var tileUrl = "";
			var sum = i+j;
			var modulo = sum%2;
			if(i==0){
				tileUrl = homeUrl;
			}else if (i==this.TILES_X-1){
				tileUrl = enemyHomeUrl;
		  	}else if (modulo==0){
				tileUrl = sand1Url;
			}else{
				tileUrl = sand2Url;			
			}
			// creates tile
			var tileImage = new ImageMorph(new Rectangle(this.TILESIZE*i+this.OFFSET_X,this.TILESIZE*j+this.OFFSET_Y,this.TILESIZE,this.TILESIZE), tileUrl);			
		    // adds tile
			this.addMorph(tileImage);
		  }
		}
		
		this.title=new TextMorph(new Rectangle(70, 20, 100, 20), "DUNG BEETLE").beLabel();
		this.addMorph(this.title);	
	
		this.backButton = new ImageButtonMorph(new Rectangle(166,307,66,13), backUrl,backDownUrl);
        this.backButton.connectModel({model: this, setValue: "initLobbyRoom"});
		this.addMorph(this.backButton);	
	
		this.enemyBeetle = new ImageMorph(new Rectangle(this.TILESIZE*this.ENEMY_LOCATION_X+this.OFFSET_X,this.TILESIZE*this.ENEMY_LOCATION_Y+this.OFFSET_Y,this.TILESIZE,this.TILESIZE),enemyBeetle1Url);
		this.addMorph(this.enemyBeetle);		

		this.myBeetle = null;
		this.moveMyBeetle(this.MY_LOCATION_X, this.MY_LOCATION_Y);
	},    

	
	startGame: function(){
		if (!this.TIMER_ON){
			console.log('game started');
			this.timerOff();
		}
	},

	timerOff: function(){
		this.TIMER_ON = false;
			this.addRandomDung();
			if (!this.timerCallback) this.timerCallback = arguments.callee.bind(this).logErrors('dungbeetle Timer');
			this.timerID=window.setTimeout(this.timerCallback, 5000);		
			this.TIMER_ON = true;
	},
	
	addRandomDung: function(){
		var random_x=Math.round(Math.random()*(this.TILES_X-1));
		var random_y=Math.round(Math.random()*(this.TILES_Y-1));
		if (!this.isDung(random_x,random_y)&&!this.isEnemy(random_x,random_y) &&!this.isMe(random_x,random_y)){
			this.addDung(random_x,random_y);	
		}	
	},
	
	addDung: function(dung_x,dung_y){
		var dungUrl = this.IMAGEURL + "boo.png";
		      	
      	var dung = {};
		var tile = new ImageMorph(new Rectangle(this.TILESIZE*dung_x+this.OFFSET_X,this.TILESIZE*dung_y+this.OFFSET_Y,this.TILESIZE,this.TILESIZE),dungUrl);
      	
      	dung.tile = tile;
		dung.x=dung_x;
		dung.y=dung_y;
      	
		var index = this.DUNG.length;
		
		this.DUNG[index] = dung;
		
		this.addMorph(this.DUNG[index].tile);		
		
	},
	
	moveMyBeetle: function(x,y){
		var myBeetle1Url = this.IMAGEURL + "bug_green1.png";
		var myBeetle2Url = this.IMAGEURL + "bug_green2.png";

		// checks if x or y is null
		if (isNaN(x)||isNaN(y)){
			return;
		}		
		
		if (!this.isInsideGamingArea(x,y)){
			return;
		}

		if (this.myBeetle != null){
			this.myBeetle.remove();				
		}
		
		this.myBeetle = new ImageMorph(new Rectangle(this.TILESIZE*x+this.OFFSET_X,this.TILESIZE*y+this.OFFSET_Y,this.TILESIZE,this.TILESIZE), myBeetle1Url);
		this.addMorph(this.myBeetle);
		
		this.MY_LOCATION_X=x;
		this.MY_LOCATION_Y=y;
	},

	isMe: function(x,y){
		if ((this.MY_LOCATION_X==x)&&(this.MY_LOCATION_Y==y)){
		  	console.log('Found me');
			return true;
		}
		return false;
	},

	isEnemy: function(x,y){
		if ((this.ENEMY_LOCATION_X==x)&&(this.ENEMY_LOCATION_Y==y)){
		  	console.log('enemyFound');
			return true;
		}
		return false;
	},
	
	pushDung: function(old_x,old_y,x,y){
		// if dung is found from place player wants to go
		if (this.isDung(x,y)){
		  	console.log('pushing dung');
			// calculate place where to push a new dungpile
			var delta_x = x-old_x;
			var delta_y = y-old_y;
			var new_location_x=x+delta_x;
			var new_location_y=y+delta_y;
		
			// are we going to push dungpile on top another
			if (this.isDung(new_location_x,new_location_y)){
			  	console.log("dungpile can't be moved on top of the another pile");				
				return false;
			}else if (!this.isInsideGamingArea(new_location_x,new_location_y)){
			  	console.log("dungpile can't be moved outside of the gaming area");
				return false;
			}else if(this.isEnemy(new_location_x,new_location_y)){
			  	console.log("dungpile can't be moved on top of the enemy");
				return false;
			}
			
			this.removeDung(x,y);
			this.addDung(new_location_x,new_location_y);
			this.findWinner();
		}
		return true;
	},

	findWinner: function(){
		var iWon = true;
		var enemyWon = true;
		for (var i=0; i<this.TILES_Y; i++) {
			if (!this.isDung(0,i)){
				iWon = false;				
			}
		}
		for (var i=0; i<this.TILES_Y; i++) {
			if (!this.isDung(this.TILES_X-1,i)){
				enemyWon = false;				
			}
		}
		if (iWon){
		  	console.log('You won');							
		  	this.endGame();
		}
		if (enemyWon){
			console.log('enemy won');							
			this.endGame();
		}
	},
	
	endGame: function(){
        if (this.timerID) {
            console.log('shutting down the game');
            window.clearTimeout(this.timerID);
        }		
	},
	
	removeDung: function(x,y){
		// find the tile
		var dung_index = this.getDungIndex(x,y);		
		while (dung_index>-1){
			console.log('removing dung_index ' + dung_index);
			var tile = this.DUNG[dung_index].tile;
			this.removeMorph(tile);
			// deletes dung from array
			this.DUNG.splice(dung_index,1);			
			dung_index = this.getDungIndex(x,y);
		}
	},
	
	isDung: function(x,y){
		if (this.getDungIndex(x,y)>=0){
			return true;
		}
      	return false;
	},

	getDungIndex: function(x,y){
		for (var i = 0; i < this.DUNG.length; i++) {
			var cur_x=this.DUNG[i].x;
			var cur_y=this.DUNG[i].y;
			if (cur_x==x&&cur_y==y){
				return i;
			}
      	}
		return -1;
	},
	
	isInsideGamingArea: function(x,y){
		// checks borders
		if (x<0||y<0||this.TILES_X<=x||this.TILES_Y<=y){			
			return false;
		}
		return true;
	},
	
    handlesMouseDown: function() {
        return true; // hack
    },

    onMouseDown: function(evt) {
        this.requestKeyboardFocus(evt.hand);
        return true; 
    },

    setHasKeyboardFocus: function(newSetting) { 
        return newSetting;
    },
    
    takesKeyboardFocus: Functions.True,	  
    
    onKeyDown: function(event) { 
		var key = event.getKeyCode() || event.charCode;

      	var x=this.MY_LOCATION_X;  
      	var y=this.MY_LOCATION_Y;  
      	var moved = false;
      	
        // Check if any cursor keys have been pressed and set flags.
		if (key == Event.KEY_LEFT) {
		  	moved=true;
			x--;
		} else if (key == Event.KEY_RIGHT) {
		  	moved=true;
			x++;
		} else if (key == Event.KEY_UP) {
		  	moved=true;
			y--;
		} else if (key == Event.KEY_DOWN) {
		  	moved=true;
			y++;
		}
		
		if (moved&&(!this.isEnemy(x,y))&&this.pushDung(this.MY_LOCATION_X,this.MY_LOCATION_Y,x,y)){
			this.startGame();
			this.moveMyBeetle(x, y);		
			console.log('beetle moved');
		}
		event.stop();
	},
	
	onKeyUp: function(evt) { 
        evt.stop();
        return true; 
    }
}); 


// ===========================================================================
// The Instant Messenger Widget Example
// ===========================================================================

/**
 * @class MessengerWidget
 * Placeholder for an instant messenger widget (to be completed) 
 */
 
Model.subclass('MessengerWidget', {

    imagepath: "Resources/IM/",
    serverURL: "http://livelykernel.sunlabs.com:8093",

    initialize: function($super) { 
        $super();
//        this.id = Math.round(Math.random()*2147483647); // TODO: use Config.random for requests?
        this.id = Config.random;
        this.text = "";
        this.chatroom = "";
        this.server = new URL(this.serverURL);
        var id = this.id;
	var req = new NetRequest({model: this, setStatus: "setConnectionStatus"});
        req.get(this.server.withPath("foreground.html?login=IM"));
    },

    setConnectionStatus: function(status) {
	if (status >= 300) console.log("communication failure, status " + status);
    },
    
    openIn: function(world, location) {
        return world.addFramedMorph(this.buildView(pt(300, 255)), 'Instant Messenger', location);
    },
    
    buildView: function(extent) {
        var panel = new PanelMorph(extent);
	var g = lively.paint;
	var gradient = 
	    new g.LinearGradient([new g.Stop(0, Color.white), new g.Stop(1, Color.primary.blue.lighter())], 
				 g.LinearGradient.EastWest); 
	panel.applyStyle({fill: gradient, borderWidth: 2});
        this.textpanel = panel.addMorph(newTextPane(new Rectangle(10, 10, 280, 180), " "));
	this.textpanel.connectModel({model: this, getText: "getChatText", setText: "setChatText"});
	// m.innerMorph().autoAccept = true;
	
        var m = panel.addMorph(new TextMorph(new Rectangle(10, 210, 220, 50), "<enter text here>"))
	m.connectModel({model: this, getText: "getIMText", setText: "setIMText"});
        m.autoAccept = true;
        panel.addMorph(new ImageButtonMorph(new Rectangle(240, 200,  50,  50), 
					    this.imagepath + "Talk.PNG", 
					    this.imagepath + "Talk_down.PNG")).connectModel({model: this, setValue: "send"});
        // disable the 2 set value calls for the button
        m.onMouseUp = function(evt) {
            var newValue = this.isToggle() ? !this.getValue() : false;
            this.changeAppearanceFor(newValue); 
        };
        
        this.initpanel = new PanelMorph(pt(300, 255));
        panel.addMorph(this.initpanel);
        this.initpanel.setFill(new lively.paint.LinearGradient([new lively.paint.Stop(0, Color.white), 
								new lively.paint.Stop(1, Color.primary.blue)], 
							       lively.paint.LinearGradient.NorthSouth));
        this.nickName = this.initpanel.addMorph(new TextMorph(new Rectangle(10, 10, 220, 20), 
							      "<please enter your nickname>"));
	//.connectModel({model: this, getText: "getIMText", setText: "setIMText"});
        var b = this.initpanel.addMorph(new ButtonMorph(new Rectangle(240,10,50,20)));
        b.onMouseUp = function(evt) {
            var newValue = this.isToggle() ? !this.getValue() : false;
            this.changeAppearanceFor(newValue); 
        };
        b.connectModel({model: this, setValue: "setNick"});
        m = this.initpanel.addMorph(new TextMorph(new Rectangle(250, 10, 30, 20), "GO"));
        m.relayMouseEvents(b, {onMouseDown: "onMouseDown", onMouseMove: "onMouseMove", onMouseUp: "onMouseUp"});
	m.applyStyle({fillOpacity: 0, borderWidth: 0});
        
        return panel;
    },
    
    setIMText: function(newtext) {
        this.text = newtext;
        this.changed("getIMText");
    },

    getIMText: function() {
        return this.text;
    },

    getChatText: function() {
        return this.chatroom;
    },

    setChatText: function(newtext) {
        if ( this.chatroom == "" ) {
            this.chatroom = newtext + "\n";
        } else {
            this.chatroom = this.getChatText() + newtext + "\n";
        }
        this.changed("getChatText");
    },
    
    setNick: function() {
        this.load(); // start loading changes from the database
        if ( this.nickName.textString == "<please enter your nickname>" ) {
            this.nick = "anonymous" + Math.round(Math.random()*499);;
        } else {
            this.nick = this.nickName.textString.replace(/^\s+|\s+$/g, '').replace(/\s/g, "_").replace(/=/g, "_");
        }
        this.nickName = null;
        this.initpanel.remove();
        this.id = this.nick;
    },
    
    setForegroundResponse: function(text) {
        this.setChatText(parent.id + ": " + this.getIMText()); // add the current line immediately
        this.setIMText(""); // yes yes.. so its a little laggy to add the current line and delete it...
        this.textpanel.setScrollPosition(1);//this.textpanel.innerMorph().bounds().height);
    },
    
    send: function() {
        var parent = this;
        if ( this.text != null && this.text != "" ) {
            var url = this.server.withPath("foreground.html?action=updatemany&key." 
		+ this.id + "=" + this.text.replace(/=/g, ""));
            var req = new NetRequest({model: this, setResponseText: "setForegroundResponse"});
            req.get(url);
        }
	//        this.load();
    }, 
    
    setBackgroundResponse: function(response) {
        try {
            var end = response.indexOf("function");
            if (end == -1) {
                var text = response.substr(0);
            } else {
                var text = response.substring(0, end);
            }
            this.parseResponse(text);
            this.textpanel.setScrollPosition(1);
        } catch (e) { console.log('got error %s', e); }
        // start polling for new events
        parent.load();
    },

    load: function() {
	var req = new NetRequest({model: this, setResponseText: "setBackgroundResponse"});
	req.get(new URL(this.server.withPath("background.html")));
    },
    
    parseResponse: function (response) {
        // remove whitespaces
        var idstring = response.replace(/<!--[^-]*-->/g, "");
        var IDstring = idstring.replace(/^\s+|\s+$/g, '');
        var IDs = IDstring.match(/\w+(?==)/g);
        if (!IDs) {
            return;
        }
        for ( var i = 0; i < IDs.length; i++ ) {
            //console.log("ID " + IDs[i]);
            if ( IDs[i] != this.id ) {
                // parse answer..
                // gets the line from the first '=', starting from the location of the given ID
                var begin = response.indexOf("=", response.indexOf(IDs[i]))+1;
                var end = response.indexOf("=", begin);
                if ( end == -1 ) {
                    end = response.length;
                }
                var contents = response.substring(begin, end);
                var line = ""; 
                if (IDs.length > 1) {
                    var lastwhitespace = contents.lastIndexOf(" ");
                    line = contents.substring(0, lastwhitespace);
                } else {
                    line = contents;
                }
                line = line.replace(/^\s+|\s+$/g, ''); // remove white spaces
                //console.log(i + ": " + IDs[i] + "=" + line + "\n");

                // set it to chat window
                if ( line != "" || line != null ) {
                    this.setChatText(IDs[i] + ": " + line);
                }
            }
/*
// FIXME: kill the database if needed
                new NetRequest(this.server + "foreground.html?action=updatemany&key." + IDs[i] + "=", { 
                method: 'get',
                
                onSuccess: function(transport) {
                }
                
            });*/
        }
    }
    
});

/**
 * @class DoodleMorph: A simple drawing program
 */

ClipMorph.subclass("DoodleMorph", {

    style: {borderWidth: 0, fill: Color.veryLightGray},
    imagepath: "Resources/doodle/",

    initialize: function($super, extent) {
        $super(extent.asRectangle(), "rect");
        this.drawingColor = Color.red;
        this.lineWidth = 2.0;
        this.colorvalue = true;
        this.borderMenuOpen = false;
        this.line = false;
        
        // The doodle that we are creating currently
        this.currentMorph = null;
        this.start = null;

        var iconSize = 40;
        var r = new Rectangle(0, 0, iconSize, iconSize);
        this.linebutton = new ImageButtonMorph(r, this.imagepath + "line.png", this.imagepath + "line_down.png");
        var r = new Rectangle(0, iconSize, iconSize, iconSize);
        this.rectbutton = new ImageButtonMorph(r, this.imagepath + "rectangle.png", this.imagepath + "rectangle_down.png");
        var r = new Rectangle(0, iconSize*2, iconSize, iconSize);
        this.circlebutton = new ImageButtonMorph(r, this.imagepath + "circle.png", this.imagepath + "circle_down.png");
        var r = new Rectangle(0, iconSize*3, iconSize, iconSize);
        this.widthbutton = new ImageButtonMorph(r, this.imagepath + "lines.png", this.imagepath + "lines_down.png");
        var r = new Rectangle(0, iconSize*4, iconSize, iconSize);
        this.colorsbutton = new ImageButtonMorph(r, this.imagepath + "colors.png", this.imagepath + "colors_down.png");
        var r = new Rectangle(0, iconSize*5, iconSize, iconSize);
        this.stylebutton = new ImageButtonMorph(r, this.imagepath + "style.png", this.imagepath + "style_down.png");

        this.linebutton.onMouseUp = function(evt) {
            var newValue = this.isToggle() ? !this.getValue() : false;
            this.changeAppearanceFor(newValue); 
        };
        this.linebutton.connectModel({model: this, setValue: "addLine"});
        this.addMorph(this.linebutton);

        this.rectbutton.onMouseUp = function(evt) {
            var newValue = this.isToggle() ? !this.getValue() : false;
           this.changeAppearanceFor(newValue); 
        };
        this.rectbutton.connectModel({model: this, setValue: "addRect"});
        this.addMorph(this.rectbutton);

        this.circlebutton.onMouseUp = function(evt) {
            var newValue = this.isToggle() ? !this.getValue() : false;
            this.changeAppearanceFor(newValue); 
        };
        this.circlebutton.connectModel({model: this, setValue: "addCirc"});
        this.addMorph(this.circlebutton);
                
        this.widthbutton.onMouseUp = function(evt) {
            var newValue = this.toggles ? !this.getValue() : false;
            this.changeAppearanceFor(newValue); 
        };
        this.widthbutton.connectModel({model: this, setValue: "setLine", getValue: "getLine"});
        this.addMorph(this.widthbutton);

        this.colorsbutton.toggle = true;
        this.colorsbutton.connectModel({model: this, setValue: "setColor", getValue: "getColor"});
        this.addMorph(this.colorsbutton);

        this.stylebutton.onMouseUp = function(evt) {
            var newValue = this.isToggle() ? ! this.getValue() : false;
            this.changeAppearanceFor(newValue); 
        };
        this.stylebutton.connectModel({model: this, setValue: "setStyle"});
        this.addMorph(this.stylebutton);

        // Position for new objects created from menus
        this.newPos = 25;

        return this;
    },
    
    onMouseMove: function(evt) {
    },

    onMouseUp: function(evt) {
        evt.hand.setFill(Color.primary.blue); 
    },

    onMouseDown: function(evt) { // Default behavior is to grab a submorph
        this.openForDragAndDrop = true;
        var m = this.morphToReceiveEvent(evt);
        if (m == null || m == this) { 
            this.makeSelection(evt); 
            return true; 
        }
        if (m.handlesMouseDown(evt)) return false;
        evt.hand.grabMorph(m, evt);
        return true; 
    },

    handlesMouseDown: Functions.True,

    makeSelection: function(evt) { 
        if (this.currentSelection != null) this.currentSelection.removeOnlyIt();
        if ( !evt.hand.mouseButtonPressed ) return;
        
        var m = this.currentSelection = this.addMorph(new SelectionMorph(this.localize(evt.point()).extent(pt(5,5)), this));
	m.shape.setStrokeDashArray([3,2]);
        var handle = new HandleMorph(evt.point(), lively.scene.Rectangle, evt.hand, m, "bottomRight");
        m.addMorph(handle);
        handle.setBounds(handle.bounds().center().asRectangle());
//        if (evt.hand.mouseFocus instanceof HandleMorph) evt.hand.mouseFocus.remove();
        evt.hand.setMouseFocus(handle);
    },    

    // Add menu items for creating rectangles and ellipses
    morphMenu: function($super, evt) {
        var menu = $super(evt);
        menu.addLine();
        menu.addItem(["add rectangle", this, 'addRect']);
        menu.addItem(["add ellipse",   this, 'addCircle']);
        return menu;
    },

    addLine: function() {
        var morph = Morph.makeRectangle(this.newPos * 2, this.newPos, 60, 20);
        morph.setShape(new lively.scene.Polyline([pt(0,20),pt(60,0)]));
	morph.applyStyle({fill: null, borderWidth: this.lineWidth, borderColor: this.drawingColor});
        this.addMorph(morph);

        this.newPos += 25;
        if (this.newPos > 125) this.newPos = 25;            
    },

    addRect: function() {
        var morph = Morph.makeRectangle(this.newPos * 2, this.newPos, 60, 20);
	morph.applyStyle({fill: this.fillColor, borderWidth: this.lineWidth, borderColor: this.drawingColor});
        this.addMorph(morph);
	
        this.newPos += 25;
        if (this.newPos > 125) this.newPos = 25;            
    },
    
    addCirc: function() {
        var morph = new Morph(new Rectangle(this.newPos * 2, this.newPos, 60, 20), 'ellipse');
	morph.applyStyle({fill: this.fillColor, borderWidth: this.lineWidth, borderColor: this.drawingColor});
        this.addMorph(morph);

        this.newPos += 25;
        if (this.newPos > 125) this.newPos = 25;            
    },
    
    setColor: function(val) {
        console.log("Setting Color");
        this.colorvalue = val;
        if ( !this.colorvalue && this.colorMorph != null ) { // false
            this.colorMorph.remove();
            return;
        }

        if ( this.colorMorph != null ) {
            if ( this.colorMorph.position() != this.colorsbutton.bounds().topRight().subPt(pt(0,20)) ) {
                this.colorMorph.setPosition(this.colorsbutton.bounds().topRight().subPt(pt(0,20)));
            }
            this.addMorph(this.colorMorph);
            return;
        }
  
        if (this.colorvalue) {
            this.colorMorph = new Morph(new lively.scene.Rectangle(this.colorsbutton.bounds().topRight().subPt(pt(0,20)).extent(pt(110,110))));
            this.colorMorph.applyStyle({fill: Color.white, fillOpacity: .7, borderRadius: 10});

            var m = new TextMorph(new Rectangle(10, 5, 80, 20), "Border color");
            m.relayMouseEvents(this.colorMorph, {onMouseDown: "onMouseDown", onMouseUp: "onMouseUp"});
	    m.applyStyle({borderWidth: 0, fillOpacity: 0, borderRadius: 10});
            this.colorMorph.addMorph(m);

            m = new TextMorph(new Rectangle(10, 65, 80, 20), "Fill color");
            m.relayMouseEvents(this.colorMorph, {onMouseDown: "onMouseDown", onMouseUp: "onMouseUp"});
	    m.applyStyle({borderWidth: 0, fillOpacity: 0, borderRadius: 10});
            this.colorMorph.addMorph(m);

            this.colorpicker = new ColorPickerMorph(new Rectangle(10, 25, 40, 20));
            this.colorMorph.addMorph(this.colorpicker);
            this.fillpicker = new ColorPickerMorph(new Rectangle(10, 85, 40, 20));
            this.colorMorph.addMorph(this.fillpicker);

            this.colorMorph.borderRect = Morph.makeCircle(pt(80, 35), 10);
            this.colorMorph.borderRect.setFill(this.drawingColor);
            this.colorMorph.addMorph(this.colorMorph.borderRect);
            this.colorMorph.fillRect = Morph.makeCircle(pt(80, 95), 10);
            this.colorMorph.fillRect.setFill(this.fillColor);
            this.colorMorph.addMorph(this.colorMorph.fillRect);

            this.colorMorph.moveBy(this.colorsbutton.bounds().topRight().subPt(pt(0,20)));
            this.addMorph(this.colorMorph);
            this.colorpicker.connectModel({model: this, setColor: "setColoring"});
            this.fillpicker.connectModel({model: this, setColor: "setFillColor"});

            this.colorMorph.setPosition(this.colorsbutton.bounds().topRight().subPt(pt(0,20)));

        }
    },
    
    getColor: function() {
        return this.colorvalue;
    },
    
    setColoring: function(color) {
        console.log("Setting coloring");

        this.drawingColor = color;
        this.colorMorph.borderRect.setFill(this.drawingColor);
        if ( this.currentSelection != null ) {
            this.currentSelection.setBorderColor(this.drawingColor);
        }
    },

    setFillColor: function(color) {
        this.fillColor = color;
        this.colorMorph.fillRect.setFill(this.fillColor);
        if ( this.currentSelection != null ) {
            this.currentSelection.setFill(this.fillColor);
        }

    },

    setLine: function(value) {

        this.line = value;
        var items = [
            ["No borders", this, "setLineWidth", 0],
            ["1", this, "setLineWidth", 1],
            ["2", this, "setLineWidth", 2],
            ["3", this, "setLineWidth", 3],
            ["4", this, "setLineWidth", 4],
            ["5", this, "setLineWidth", 5],
            ["10", this, "setLineWidth", 10],
            ["15", this, "setLineWidth", 15],
        ];
        if ( !this.borderMenuOpen ) {
            this.borderMenuOpen = true;
            (this.borders = new MenuMorph(items, this)).openIn(this.world(), 
							       this.worldPoint(this.widthbutton.bounds().topRight()), true);
        } else {
            this.borders.remove();
            this.borderMenuOpen = false;
        }
    },
    
    getLine: function() {
        return this.line;
    }, 
    
    setLineWidth: function (newWidth) {
        this.lineWidth = newWidth;
        if ( this.currentSelection != null ) {
            this.currentSelection.setBorderWidth(this.lineWidth);
        }
        this.borders.remove();
        this.borderMenuOpen = false;
    },
    
    setStyle: function() {
        if (this.currentSelection != null) {
            new StylePanel(this.currentSelection).open();
        }
    }
});


lively.Contributions.installFasteroids = function (world, rect) {
console.log("-------------- Loading Fasteroids ----------------");
// Yet to do...
// End game when asteroid or fragment hits ship
// Add button/ menu command for click to restart
// Make asteroids break into fragments
// Allow DnD of, eg, clock to add other morphs as asteroids
// When blast a morph, make fragments out of its submorphs (one level)

ClipMorph.subclass('Fasteroids', {
    initialize: function ($super, initialBounds) {
	// An attempt to show how small Asteroids can be in Morphic
	// Here we set up the game board
	$super(initialBounds);
	this.asteroids = [];
	for (var i=4; i<10; i++) this.addMorphToGroup(this.makeAsteroid(i, 200, Color.green), this.asteroids);
	this.torpedos = [];
	this.fragments = [];
	this.ship = this.addMorph(new Ship([pt(0, -10), pt(5, 10), pt(-5, 10), pt(0, -10)], 1, Color.black, Color.blue));
	this.ship.setPosition(this.innerBounds().center());
	this.setFill(Color.black);
    },
    makeAsteroid: function(nSides, circumf, fillColor) {
	//makes a simple polygon of n sides
	if(nSides < 3) return;
	var p = new Pen();
	for (var i=0; i<= nSides; i++) { p.go(circumf/nSides); p.turn(360/nSides); };
        var p0 = Rectangle.unionPts(p.vertices).center();
        var verts = p.vertices.invoke('subPt', p0);
	var veloc = pt(6, 6).random().subPt(pt(3, 3));
	var rot = 0.6*Math.random() - 0.3;
	return new Asteroid(verts, 1, Color.yellow, Color.darkGray.darker(3), veloc, rot).translateBy(this.innerBounds().extent().random());
    },
    tick: function() {
        // Don't bother stepping if we are in a collapsed window
        if (this.immediateContainer() && !this.immediateContainer().contentIsVisible()) return;
	this.asteroids.forEach( function (each) { each.tick(); });
	this.torpedos.forEach( function (each) { each.tick(); });
	this.fragments.forEach( function (each) { each.tick(); });
	this.ship.tick();
	this.checkForCollisions();
    },
    checkForCollisions: function(evt) {
	if (this.torpedos.length == 0) return;
	var torpBox = this.torpedos[0].bounds();
	console.log("torpBnds = " + torpBox);
	this.torpedos.forEach( function(torp) { torpBox = torpBox.union(torp.bounds()); });
	console.log("torpBox = " + torpBox);
	this.asteroids.forEach( function (ast) { var astBnds = ast.bounds();
		if (astBnds.intersects(torpBox)) {  // asteroid is in torpedo region
			this.torpedos.forEach( function (torp) {
				if (torp.bounds().intersects(astBnds)  // torpedo in its bounds
					&& ast.containsPoint(torp.bounds().center())) {  // actual hit
					this.removeMorphFromGroup(ast, this.asteroids);
					this.removeMorphFromGroup(torp, this.torpedos);
				}
			}.bind(this));
		}
	}.bind(this));
        return true; 
    },
    addMorphToGroup: function(m, group) { group.push(this.addMorph(m)); },
    removeMorphFromGroup: function(m, group) {
	m.remove();
	var ix = group.indexOf(m);
	if (ix < 0) return;
	group.splice(ix, 1); 
    },

    handlesMouseDown: Functions.True,
    onMouseDown: function(evt) { this.requestKeyboardFocus(evt.hand); return true; },
    setHasKeyboardFocus: function(newSetting) { return newSetting; },
    takesKeyboardFocus: Functions.True,

    onKeyDown: function(evt) { 
        if(this.ship.keyDown(evt, true)) { evt.stop(); return true; }
	return false
    },
    onKeyUp: function(evt) { 
        if(this.ship.keyDown(evt, false)) { evt.stop(); return true; }
	return false
    },
    startSteppingScripts: function() {
	this.startStepping(100, "tick"); // ten frames per second
    }
});

Morph.subclass('InertialBody', {
    initialize: function ($super, verts, lineWidth, lineColor, fill, velocity, angularVelocity) {
	// I'm a polygon with velocity and spin
	$super(new lively.scene.Polygon(verts));
	this.applyStyle({fill: fill, borderWidth: lineWidth, borderColor: lineColor});
	this.velocity = velocity || pt(0, 0);
	this.angularVelocity = angularVelocity || 0;
    },
    tick: function() {
	this.updatePosition();
    },
    updatePosition: function() {
	if (this.owner === null) return;
	this.rotateBy(this.angularVelocity);
	this.moveBy(this.velocity);
	if (!this.testInBounds()) this.isOutOfBounds();
    },
    testInBounds: function() {
	return this.bounds().intersects(this.owner.innerBounds());
    },
    isOutOfBounds: function() { // May override, eg to remove
	this.wrapAround()
    },
    wrapAround: function() {
	var ownerBox = this.owner.innerBounds();  // fix - relative!
	var myBox = this.bounds();
	if (this.velocity.x > 0 && myBox.x > ownerBox.maxX()) this.moveBy(pt(-ownerBox.width, 0));
	if (this.velocity.y > 0 && myBox.y > ownerBox.maxY()) this.moveBy(pt(0, -ownerBox.height));
	if (this.velocity.x < 0 && myBox.maxX() < ownerBox.x) this.moveBy(pt(ownerBox.width, 0));
	if (this.velocity.y < 0 && myBox.maxY() < ownerBox.y) this.moveBy(pt(0, ownerBox.height));
    }
});

InertialBody.subclass('Asteroid', {
    initialize: function ($super, verts, lineWidth, lineColor, fill, velocity, angularVelocity) {
	// Asteroids are sizeable polygons that drift and wrap around the bounds
	// until they are destroyed by missiles or until they clobber the ship
	// They simply inherit all behavior from InertialBody
	$super(verts, lineWidth, lineColor, fill, velocity, angularVelocity);
    }
});

InertialBody.subclass('Torpedo', {
    initialize: function ($super, verts, lineWidth, lineColor, fill, velocity, angularVelocity) {
	// Torpedos are little bullets with constant velocity.  They disappear when out of bounds
	$super(verts, lineWidth, lineColor, fill, velocity, angularVelocity);
    },
    isOutOfBounds: function() { // Missiles go away when out of bounds
	this.owner.removeMorphFromGroup(this, this.owner.torpedos)
    }
});

InertialBody.subclass('Ship', {
    initialize: function ($super, verts, lineWidth, lineColor, fill) {
	//  The ship's position and rotation give the initial trajectory to its missiles
	//  Left and right keys rotate it, and 
	//  up and down buttons add thrust and retro to its velocity
	$super(verts, lineWidth, lineColor, fill);
	this.cycle = 0;
    },
    keyDown: function(event, downElseUp) {
        // Check if any cursor keys have been pressed and set flags.
	// Return false if we are not interested in this event      
        var key = event.getKeyCode();
	//console.log("key = " + key + (downElseUp?" down":" up"));
        if (key == Event.KEY_LEFT) { this.leftThrust = downElseUp; return true; }
        else if (key == Event.KEY_RIGHT) { this.rightThrust = downElseUp; return true; }
        else if (key == Event.KEY_UP) { this.fwdThrust = downElseUp; return true; }
        else if (key == Event.KEY_DOWN) { this.retroThrust = downElseUp; return true; }
        else if (key == Event.KEY_SPACEBAR) {
		if (!this.shooting && downElseUp) this.shoot();  // immed shot on first click
		this.shooting = downElseUp;
		return true; }
	return false
    },
    tick: function() {
	if (this.rightThrust) this.rotateBy(0.1);
	if (this.leftThrust) this.rotateBy(-0.1);
	var heading = this.getRotation()-Math.PI/2;
	if (this.fwdThrust) this.velocity = this.velocity.addPt(Point.polar(0.5, heading));
	if (this.retroThrust) this.velocity = this.velocity.subPt(Point.polar(0.5, heading));
	if (this.shooting && this.cycle++ >= 3) this.shoot();  // limit rep rate
	this.updatePosition();
    },
    shoot: function() {
	var heading = this.getRotation()-Math.PI/2;
	var noseLoc = this.bounds().center().addPt(Point.polar(5, heading));
	verts = [noseLoc, noseLoc.addPt(Point.polar(4, heading))];
	this.owner.addMorphToGroup(new Torpedo(verts, 1, Color.white, null, Point.polar(5, heading)), this.owner.torpedos);
	this.cycle = 0;
    }
});
Fasteroids.openInWindow = function(world, loc) {
    var game = new Fasteroids(new Rectangle(0, 0, 600, 300));
    world.addFramedMorph(game, 'A Lively Asteroids', loc);
    game.startSteppingScripts();
    };
Fasteroids.openInWindow(world, pt(150, 100));
console.log("-------------- End Fasteroids ----------------");
};

});