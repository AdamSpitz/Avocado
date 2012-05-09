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
 * Text.js.  Text-related functionality.
 */

module('lively.Text').requires().toRun(function(thisModule) {
        
Object.subclass('lively.Text.CharacterInfo', {
    // could simply use Point as extent.
    documentation: "simple printable info about a character's extent",

    initialize: function(width, height) {
	this.width = width;
	this.height = height;
    },

    toString: function() {
	return this.width + "x" + this.height;
    }

});


Object.subclass('lively.Text.Font', {

    documentation: "representation of a font",
    baselineFactor: 0.80,
    
    initialize: function(family/*:String*/, size/*:Integer*/, style/*:String*/){
        this.family = family;
        this.size = size;
        this.style = style ? style : 'normal';
        this.extents = null;
        // this.extents = this.computeExtents(family, size);
    },
    computeExtents: function(family, size) {
	// Note: this gets overridden depending on the environment.
        return [];
    },
    getSize: function() {
        return this.size;
    },

    getBaselineHeight: function() { // the distance between the top of the glyph to the baseline.
	return this.size * this.baselineFactor;
    },

    getFamily: function() {
        return this.family;
    },

    toString: function() {
        return this.family + " " + this.getSize();
    },

 	getCharWidth: function(charString) {
        var code = charString.charCodeAt(0);
        if (!this.extents) this.extents = this.computeExtents(this.family, this.size, this.style);
			var w = this.extents[code] ? this.extents[code].width : 4;
        if (isNaN(w)) {
            console.warn('getCharWidth: no width for ' + charString);
	    return 4;  // don't crash
        }
		return w * 1;
    },

    getCharHeight: function(charString) {
        var code = charString.charCodeAt(0);
        if (!this.extents) this.extents = this.computeExtents(this.family, this.size);
        return this.extents[code] ? this.extents[code].height : 12;
    },

    applyTo: function(wrapper) {
	var rawNode = wrapper.rawNode;
        rawNode.setAttributeNS(null, "font-size", this.getSize());
        rawNode.setAttributeNS(null, "font-family", this.getFamily());
        if (this.style == 'bold' || this.style == 'bold-italic') rawNode.setAttributeNS(null, "font-weight", 'bold');
        if (this.style == 'italic' || this.style == 'bold-italic') rawNode.setAttributeNS(null, "font-style", 'italic');
        //if (this.style == 'normal') {
	//    rawNode.setAttributeNS(null, "font-style", 'normal');
	//    rawNode.setAttributeNS(null, "font-weight", 'normal');
	//}
        // if (this.getSize() == 18 || this.style == 'bold' || this.style == 'italic') 
	//	console.log("applying " + this.getSize() + this.style);
    }

});
    

Object.extend(thisModule.Font, {
	fontCache: {},
	forFamily: function(familyName, size, style) {
		var cache = this.fontCache
		var styleKey = 'n';
		if (style == 'bold') styleKey = 'b';
		if (style == 'italic') styleKey = 'i';
		if (style == 'bold-italic') styleKey = 'bi';
		var key  = familyName + ":" + size + ":" + styleKey ;
		var entry = cache[key];
		if (entry) 
			return entry;
		try { 
			entry = new thisModule.Font(familyName, size, style);
		} catch(er) {
			console.log("%s when looking for %s:%s", er, familyName, size);
			return null;
		}
		cache[key] = entry;
		return entry;
	}
});
    
    
if (Config.fakeFontMetrics) { 
    
    thisModule.Font.addMethods({
        // wer're faking here, b/c native calls don't seem to work
        computeExtents: function(family, size) {
	    // adapted from the IE port branch
            var extents = [];
            for (var i = 33; i < 255; i++) {
		var ch = String.fromCharCode(i);
		switch (ch) {
                case 'i': case 'I': case 'l': case 't': case '.': case ',': case '\'':
                    //extents[i] = new thisModule.CharacterInfo(size*0.245, size);
		    extents[i] = new thisModule.CharacterInfo(size*0.345, size);
		    break;
		case 'M': case 'm': case 'W': case 'B': 
		case 'w': case 'S': case 'D': case 'A': case 'H': case 'C': case 'E':
                    extents[i] = new thisModule.CharacterInfo(size*0.820, size);
		    break;
		default:
                    extents[i] = new thisModule.CharacterInfo(size*0.505, size);
		    break;
                }
            }
            return extents;
        }
    });
    
} else if (Config.fontMetricsFromHTML)  {
    
thisModule.Font.addMethods({
 	computeExtents: function (family, size, style) {
	        var extents = [];
	        var body = null;
	        var doc; // walk up the window chain to find the (X)HTML context
	        for (var win = window; win; win = win.parent) {
	            doc = win.document;
	            var bodies = doc.documentElement.getElementsByTagName('body');
	            if (bodies && bodies.length > 0) {
	                body = bodies[0];
	                break;
	            }
	        }

	        if (!body) return [];

	        function create(name) {
	            // return doc.createElement(name);
	            return doc.createElementNS(Namespace.XHTML, name);
	        }
			// body = document.body
	        var d = body.appendChild(create("div"));

	        d.style.kerning    = 0;
	        d.style.fontFamily = family;
	        d.style.fontSize   = size + "px";
			if (style) {
				d.style.fontWeight = style;
			}
	        var xWidth = -1;
	        var xCode = 'x'.charCodeAt(0);
	        for (var i = 33; i < 255; i++) {
	            var sub = d.appendChild(create("span"));
	            sub.appendChild(doc.createTextNode(String.fromCharCode(i)));
	            extents[i] = new lively.Text.CharacterInfo(sub.offsetWidth,  sub.offsetHeight);
	            if (i == xCode) xWidth = extents[i].width;
	        }

	        if (xWidth < 0) { 
	            throw new Error('x Width is ' + xWidth);
	        }

	        if (d.offsetWidth == 0) {
	            console.log("timing problems, expect messed up text for font %s", this);
	        }

	        // handle spaces
	        var sub = d.appendChild(create("span"));
	        sub.appendChild(doc.createTextNode('x x'));

	        var spaceWidth = sub.offsetWidth - xWidth*2;
	        // console.log("font " + this + ': space width ' + spaceWidth + ' from ' + sub.offsetWidth + ' xWidth ' + xWidth);  // commented out because it's annoying -- Adam

	        // tjm: sanity check as Firefox seems to do this wrong with certain values
	        if (spaceWidth > 100) {    
	            extents[(' '.charCodeAt(0))] = new lively.Text.CharacterInfo(2*xWidth/3, sub.offsetHeight);
	        } else {
	            extents[(' '.charCodeAt(0))] = new lively.Text.CharacterInfo(spaceWidth, sub.offsetHeight);
	        }

	        //d.removeChild(span);
	        body.removeChild(d);
	        return extents;
	    }
});
} else if (Config.fontMetricsFromSVG)  {
    
thisModule.Font.addMethods({
    
    computeExtents: function(family, size) {
        var extents = [];
	var canvas = document.getElementById("canvas");
	var text = canvas.appendChild(document.createElementNS(Namespace.SVG, "text"));
	text.setAttributeNS(null, "font-size", size);
	text.setAttributeNS(null, "font-family", family);

	//text.setAttributeNS(null, "y", "100");
	var b = 33;
	var string = "";
	for (var i = b; i < 255; i++) {
	    string += String.fromCharCode(i);
	}
	text.appendChild(document.createTextNode(string));
	for (var i = b; i < 255; i++) {
	    var end = text.getEndPositionOfChar(i - b);
	    var start = text.getStartPositionOfChar(i - b);
	    var ext = text.getExtentOfChar(i - b);
	    extents[i] = new thisModule.CharacterInfo(end.x - start.x, start.y - ext.y);
	}
        canvas.removeChild(text);
	return extents;
    }
    
});

}    
    
lively.data.Wrapper.subclass('lively.Text.TextWord', {

    documentation: "represents a chunk of text which might be printable or might be whitespace",

    isWhite: false,
    isNewLine: false,
    isTab: false,

    initialize: function(offset, length) {
	this.startIndex = offset;
	this.stopIndex  = offset;
	this.length = length;
	this.shouldRender = true;
	this.bounds = null;
	this.rawNode = null;
    },

    adjustAfterEdits: function(delta, Ydelta) {
	this.startIndex += delta;
	this.stopIndex += delta;
	if (Ydelta != 0) {
		if (this.bounds) this.bounds = this.bounds.withY(this.bounds.y + Ydelta);
		if (this.rawNode) this.rawNode.setAttributeNS(null, "y",
												Number(this.rawNode.getAttributeNS(null, "y")) + Ydelta );
	}
    },

    deserialize: function(importer, rawNode) {
        this.rawNode = rawNode;
    },
    
    adjustAfterComposition: function(textString, deltaX, paddingX, baselineY) {
	// Align the text after composition
        if (deltaX != 0) this.bounds = this.bounds.withX(this.bounds.x + deltaX);
	if (paddingX != 0 && this.isSpaces()) this.bounds = this.bounds.withWidth(this.bounds.width + paddingX);
	if (this.rawNode != null) {
	    this.replaceRawNodeChildren(NodeFactory.createText(textString.substring(this.startIndex, this.getStopIndex() + 1))); 
            this.rawNode.setAttributeNS(null, "x", this.bounds.x);
	    this.rawNode.setAttributeNS(null, "y", baselineY);
	}
    },
    
    allocRawNode: function() {
	this.rawNode = NodeFactory.create("tspan");
	// aaa slow? reflect(this).slotAt('rawNode').beCreator(); // aaa hack for morph-saving -- Adam
    },
    
    compose: function(textLine, startLeftX, topLeftY, rightX) {
	// compose a word between startLeftX and rightX, stopping if the width or string width is exceeded
	// return true if we bumped into the width limit while composing

	this.font = textLine.currentFont;  // Cache for canvas display
	this.bounds = new Rectangle(startLeftX, topLeftY, undefined, this.font.getSize());
        var leftX = startLeftX;
	
        // get the character bounds until it hits the right side of the compositionWidth
        for (var i = this.startIndex; i < textLine.textString.length && i < this.getNextStartIndex(); i++) {
            var rightOfChar = leftX + textLine.getCharWidthAt(i);
	    if (rightOfChar >= rightX) {
		// Hit right bounds -- wrap at word break if possible
		if (i > this.startIndex)  {
		    this.stopIndex = i - 1;
		    this.bounds.width = leftX - startLeftX;
		} else {
		    this.stopIndex = this.startIndex;
		    this.bounds.width = rightOfChar - startLeftX;
		}
                return true;
            }
	    leftX = rightOfChar;
        }
        // Reached the end of text
        this.stopIndex = i - 1;
	this.bounds.width = rightOfChar - startLeftX;
	return false;
    },
    
    // accessor function
    getStopIndex: function() {
        return this.stopIndex;
    },

    getNextStartIndex: function() {
	return this.startIndex + this.length;
    },

    getContent: function(string) {
	return string.substring(this.startIndex, this.stopIndex);
    },

    indexForX: function(textLine, x) {
	if (this.rawNode == null) {
	    var virtualSpaceSize = this.bounds.width / this.length;
	    var spacesIn = Math.floor((x - this.bounds.x) / virtualSpaceSize);
	    return this.startIndex + spacesIn;
	} else {
	    var leftX = this.bounds.x;
	    for (var j = this.startIndex; j < (this.startIndex + this.length); j++) {
		var rightX = leftX + textLine.getCharWidthAt(j);
		if (x >= leftX && x <= rightX) break;
		leftX = rightX;
	    }
	    return j;
	}
	return this.startIndex; // failsafe
    },
    
    getBounds: function(textLine, stringIndex) {
    	// get the bounds of the character at stringIndex
	// DI: change order of this if, and dont test for getBounds
	if (this.rawNode) {
	    var leftX = this.bounds.x;
	    for (var j = this.startIndex; j <= stringIndex; j++) {
		var rightX = leftX + textLine.getCharWidthAt(j);
		if (j >= stringIndex) break;
		leftX = rightX;
	    }
	    return this.bounds.withX(leftX).withWidth(rightX - leftX);
	} else {
	    if (this.isSpaces()) {
		var virtualSpaceSize = this.bounds.width / this.length;
		var b = this.bounds.withWidth(virtualSpaceSize);
		b.x += virtualSpaceSize * (stringIndex - this.startIndex);
		return b;
	    } else {
		return this.bounds;
	    }
	}
    },

    isSpaces: function() {
        return this.isWhite && !this.isTab && !this.isNewLine;
    },
    
    // clone a chunk only copying minimal information
    
    
    // string representation
    toString: function() {
        var lString = "TextWord start: " + this.startIndex +
            " length: " + this.length +
            " isWhite: " + this.isWhite +
            " isNewLine: " + this.isNewLine +
            " isTab: " + this.isTab;
        if (this.bounds == null) {
            lString += " null bounds";
        } else {
            lString += " @(" + this.bounds.topLeft() + ")(" + this.bounds.extent() + ")";
        }
        return lString;
    },
    
    // create a chunk representing whitespace (typically space characters)
    asWhite: function() {
        this.isWhite = true;
        return this;
    },
    
    // create a chunk representing a newline   
    asNewLine: function() {
        this.isWhite = true;
        this.isNewLine = true;
        this.length = 1;
        return this;
    },
    
    // create a chunk representing a tab
    asTab: function() {
        this.isWhite = true;
        this.isTab = true;
        this.length = 1;
        return this;
    }
});



Object.subclass('lively.Text.TextLine', {
    documentation: 'renders lines composed of words and whitespace',

    lineHeightFactor: 1.2, // multiplied with the font size to set the distance between the lines, 
    // semantics analogous to CSS 
    
    whiteSpaceDict: {' ': true, '\t': true, '\r': true, '\n': true},
    
    // create a new line
    initialize: function(textString, textStyle, startIndex, topLeft, font, defaultStyle) {
        this.textString = textString;
        this.textStyle = textStyle;
        this.startIndex = startIndex;
        this.overallStopIndex = textString.length - 1;
        this.topLeft = topLeft;
        this.currentFont = font;
	this.alignment = 'left';
        this.defaultStyle = defaultStyle;  // currently unused 
	// Should probably call adoptStyle(defaultStyle) here
	//	this.adoptStyle(defaultStyle);
	this.spaceWidth = font.getCharWidth(' ');
        this.tabWidth = this.spaceWidth * 4;
        this.chunks = null;  //  Will be an array after compose
        reflect(this).slotAt('chunks').setInitializationExpression('null'); // added by Adam, needed for morph-saving
    },
    
	adjustAfterEdits: function(newTextString, newTextStyle, delta, Ydelta) {
		// tag: newText
		this.textString = newTextString;
		this.textStyle = newTextStyle;
		this.startIndex += delta;
		this.overallStopIndex += delta;
		if (Ydelta != 0) this.topLeft.y += Ydelta;

		// Need to run through all chunks, as well
		for (var i = 0; i < this.chunks.length; i++) this.chunks[i].adjustAfterEdits(delta, Ydelta);
	},

    lineHeight: function() {
	return this.lineHeightFactor * this.currentFont.getSize();
    },
    
    isWhiteSpace: function(c) {
	// is the character 'c' what we consider to be whitespace? (private) 
	// return this.whiteSpaceDict[c];
	return (c == ' ' || c == '\t' || c == '\r' || c == '\n');
    },
    
    isNewLine: function(c) {
	// is the character 'c' what we consider to be a newline? (private)
	return (c == '\r' || c == '\n');
    },
    
    endsWithNewLine: function() {
	// Does this line end with a newLine character?
	return this.chunks.last().isNewLine;
    },
    
    baselineY: function() {
	return this.topLeft.y + this.currentFont.getBaselineHeight();
    },

    interline: function() {
	return (this.lineHeightFactor - 1) * this.currentFont.getSize();
    },

    getCharWidthAt: function(index) {
	return this.currentFont.getCharWidth(this.textString.charAt(index));
    },

    compose: function(compositionWidth, chunkStream) {
		// tag: newText
	// compose a line of text, breaking it appropriately at compositionWidth
	// nSpaceChunks is used for alignment in adjustAfterComposition
	this.nSpaceChunks = 0; 
	var lastBounds = this.topLeft.extent(pt(0, this.currentFont.getSize())); 
	var runningStartIndex = this.startIndex;
	var nextStyleChange = (this.textStyle) ? 0 : this.textString.length;
	this.chunks = new Array();

//	console.log("this.textString = /" + this.textString + "/, len = " + this.textString.length);
	var hasStyleChanged = false;
	var lastNonWhite = null;
        for (var i=0; true; i++) {
            var c = chunkStream.nextChunk();
			if (c == null) break;
//		console.log(i.toString() + ": " + c);
			this.chunks.push(c);
//		console.log("c.startIndex = " + c.startIndex + ", nextStyleChange = " + nextStyleChange);

	    if (c.startIndex >= nextStyleChange) {
			hasStyleChanged = true;
			// Don't bother to change style at line breaks
			if (!c.isNewLine) this.adoptStyle(this.textStyle.valueAt(c.startIndex), c.startIndex); 
			nextStyleChange = c.startIndex + this.textStyle.runLengthAt(c.startIndex);
	    }
		if (c.isWhite) {  // Various whitespace chunks...
			c.bounds = lastBounds.withX(lastBounds.maxX());

			if (c.isNewLine) {
				c.bounds.width = (this.topLeft.x + compositionWidth) - c.bounds.x;
				runningStartIndex = c.getNextStartIndex();
				break;
			}
			this.nSpaceChunks ++ ;  // DI: shouldn't this only be incase of spaces (ie, not tabs)?
			if (c.isTab) {
				var tabXBoundary = c.bounds.x - this.topLeft.x;
				c.bounds.width = Math.floor((tabXBoundary + this.tabWidth) / this.tabWidth) * this.tabWidth - tabXBoundary;
			} else {
				var spaceIncrement = this.spaceWidth;
				c.bounds.width = spaceIncrement * c.length;
			}
			runningStartIndex = c.getNextStartIndex();

	} else {  // Not whitespace...
		c.allocRawNode(); 
		lastNonWhite = c;

		if (hasStyleChanged) {
			// once we notice one change, we will reapply font-size to chunk
			this.currentFont.applyTo(c);
			if (this.localColor) {
				var colorSpec = this.localColor;
				if (!(colorSpec instanceof Color)) colorSpec = Color[colorSpec]; // allow color names
				if (colorSpec instanceof Color) c.rawNode.setAttributeNS(null, "fill", String(colorSpec));
			}
		}
		var didLineBreak = c.compose(this, lastBounds.maxX(), this.topLeft.y, this.topLeft.x  + compositionWidth);
		if (didLineBreak) {  // This chunk ran beyond compositionWidth
			if (i == 0) {  // If first chunk, then have to trim it
				runningStartIndex = c.getStopIndex() + 1;
			} else {
				// Otherwise, drop it entirely, to be rendered on next line
				runningStartIndex = c.startIndex;
				this.chunks.pop();
			}
			this.nSpaceChunks-- ;  // This makes last interior space no longer interior
			break;
		}
		runningStartIndex = c.getNextStartIndex();
	}
	lastBounds = c.bounds;
	}
	this.overallStopIndex = runningStartIndex - 1;
	
	// aaa hack for morph-saving; use the annotator directly because this is called often so don't want to make a bunch of unnecessary mirrors -- Adam
	//this.chunks.makeAllCreatorSlots();
  //annotator.annotationOf(this.chunks).setCreatorSlot('chunks', this);
  // aaa this whole thing is slow, maybe we don't need it?
    },
    
    adoptStyle: function(emph, charIx) {
	var fontFamily = this.currentFont.getFamily();
	var fontSize = this.currentFont.getSize();
	var fontStyle = 'normal';
	this.localColor = null;
	this.alignment = 'left';
	Properties.forEachOwn(emph, function(p, v) {
	    if (p == "family") fontFamily = v;
	    if (p == "size")  fontSize = v;
	    if (p == "style") fontStyle = v;
	    if (p == "color") this.localColor = v;
	    if (p == "align") this.alignment = v;
	}.bind(this));
	// console.log("adoptStyle/Font.forFamily" + fontFamily + fontSize + fontStyle + "; index = " + charIx);
	this.currentFont = thisModule.Font.forFamily(fontFamily, fontSize, fontStyle);
        this.spaceWidth = this.currentFont.getCharWidth(' ');
        this.tabWidth = this.spaceWidth * 4;
    },
    
    getStopIndex: function() {
	// accessor function (maybe delete - kam)
        return this.overallStopIndex;
    },
    
    // after this line, where do we start from?
    getNextStartIndex: function() {
        return this.overallStopIndex + 1;
    },
    
    // accessor function
    getTopY: function() {
        return this.topLeft.y;
    },

    // get the bounds of the character at stringIndex
    getBounds: function(stringIndex) {
	for (var i = 0; i < this.chunks.length; i++) {
		var c = this.chunks[i];
		if (stringIndex >= c.startIndex && stringIndex < c.getNextStartIndex()) 
		return c.getBounds(this, stringIndex);
        }
        return null;
    },
    
    // find the pointer into 'textString' for a given X coordinate in character metric space
    indexForX: function(x) {
        for (var i = 0; i < this.chunks.length; i++) {
            var c = this.chunks[i];
	    if (x >= c.bounds.x && x <= c.bounds.maxX()) return c.indexForX(this, x);
        }
        return 0; // should not get here unless rightX is out of bounds
    },
    
    // return a boolean if this line contains this pointer into 'textString'
    containsThisIndex: function(index) {
        return this.startIndex <= index && index <= this.getStopIndex();
    },
testForIndex: function(index) {
	// Return -1, 0 or +1 depending on whether this index is in 
	//        a previous line, this line, or a later line
	if (index < this.startIndex) return -1;
	if (index > this.overallStopIndex) return +1;
	return 0;  
    },
testForY: function(y) {
	// Return -1, 0 or +1 depending on whether this y value is in 
	//        a previous line, this line, or a later line
	if (y < this.getTopY()) return -1;
	if (y >= (this.getTopY() + this.lineHeight())) return +1;
	return 0;  
    },



    adjustAfterComposition: function(textString, compositionWidth) {

	// Align the text after composition
	var deltaX = 0;
	var paddingX = 0;
	var spaceRemaining = 0;
	var lastIndex = this.chunks.length-1;  // Index of last character chunk
	if (this.chunks[lastIndex].isNewLine) lastIndex = Math.max(lastIndex-1, 0);

	if (this.alignment != 'left') {
	    spaceRemaining =  (this.topLeft.x + compositionWidth) - this.chunks[lastIndex].bounds.maxX();
	    if (this.alignment == 'right') deltaX = spaceRemaining;
	    if (this.alignment == 'center') deltaX = spaceRemaining / 2;
	    if (this.alignment == 'justify' && (this.overallStopIndex !=  this.textString.length-1)
		&& !(this.chunks.last().isNewLine)) {
		//  Distribute remaining space over the various space chunks
		var nSpaces = this.nSpaceChunks;
		paddingX = spaceRemaining / Math.max(1, nSpaces); 
	    }
	}
	var baselineY = this.baselineY();
        for (var i = 0; i <= lastIndex; i++) {
	    this.chunks[i].adjustAfterComposition(textString, deltaX, paddingX, baselineY);
            if (this.chunks[i].isSpaces()) deltaX += paddingX;
        }
    },
    
    render: function(textContent) {
	// render each word contained in the line
        for (var i = 0; i < this.chunks.length; i++) {
            if (this.chunks[i].rawNode && this.chunks[i].shouldRender) {
                textContent.rawNode.appendChild(this.chunks[i].rawNode);
            }
        }
    },
    
    removeRawNodes: function(textContent) {
	// remove all rawNodes held by the line
	for (var i = 0; i < this.chunks.length; i++)
		this.chunks[i].removeRawNode();
    },
    
    setTabWidth: function(w, asSpaces) {
        this.tabWidth = asSpaces ? w * this.spaceWidth : w;
    },

    toString: function() {
	// string representation
        var lString = "textString: (" + this.textString + ")" +
            " startIndex: " + this.startIndex +
            " overallStopIndex: " + this.overallStopIndex +
            " topLeft: " + Object.inspect(this.topLeft) +
            " spaceWidth: " + this.spaceWidth;
        return lString;
    }
    
});

// in the future, support multiple locales
var Locale = {

    charSet: CharSet,
    //KP: note that this depends heavily on the language, esp if it's a programming language
    selectWord: function(str, i1) { // Selection caret before char i1
        var i2 = i1 - 1;
        if (i1 > 0) { // look left for open backets
            if(str[i1-1] == "\n" || str[i1-1] == "\r") return this.findLine(str, i1, 1, str[i1-1]);
	    var i = this.charSet.leftBrackets.indexOf(str[i1-1]);
            if (str[i1 - 1] == "*" && (i1-2 < 0 || str[i1-2] != "/")) 
                i = -1; // spl check for /*
            if (i >= 0) {
                var i2 = this.matchBrackets(str, this.charSet.leftBrackets[i], this.charSet.rightBrackets[i], i1 - 1, 1);
                return [i1, i2 - 1]; 
            } 
        }
        if (i1 < str.length) { // look right for close brackets
            if(str[i1] == "\n" || str[i1] == "\r") return this.findLine(str, i1, -1, str[i1]);
            var i = this.charSet.rightBrackets.indexOf(str[i1]);
            if (str[i1]== "*" && (i1+1 >= str.length || str[i1+1] != "/")) 
                i = -1; // spl check for */
            if (i >= 0) {
                i1 = this.matchBrackets(str, this.charSet.rightBrackets[i], this.charSet.leftBrackets[i],i1,-1);
                return [i1+1, i2]; 
            } 
        }

		// is a '//' left of me?
		if (str[i1-1] === '/' && str[i1-2] === '/') {
			while (i2+1<str.length && str[i2+1] !== '\n' && str[i2+1] !== '\r') { i2++ }
			return [i1, i2];
		}

		// inside of whitespaces?
		var myI1 = i1;
		var myI2 = i2;
		while (myI1-1 >= 0 && this.isWhiteSpace(str[myI1-1])) {
			myI1 --;
		}
		while (myI2 < str.length && this.isWhiteSpace(str[myI2+1])) {
		    myI2 ++;
		}
		if (myI2-myI1 >= 1) return [myI1, myI2];
	
        var prev = (i1<str.length) ? str[i1] : "";
	while (i1-1 >= 0 && (this.charSet.alphaNum.include(str[i1-1]) || this.periodWithDigit(str[i1-1], prev))) {
            prev = str[i1-1];
	    i1 --;
        }
	while (i2+1 < str.length && (this.charSet.alphaNum.include(str[i2+1]) || this.periodWithDigit(str[i2+1], prev))) {
            prev = str[i2+1];
	    i2 ++;
	}
        return [i1, i2]; 
    },

	isWhiteSpace: function(c) {
		return c === '\t' || c === ' ';
	},

    periodWithDigit: function(c, prev) { // return true iff c is a period and prev is a digit
        if (c != ".") return false;
        return "0123456789".indexOf(prev) >= 0;
    },

    findLine: function(str, start, dir, endChar) { // start points to a CR or LF (== endChar)
        var i = start;
        while ((dir < 0) ? i - 1 >= 0 : i + 1 < str.length ) {
            i += dir;
            if (str[i] == endChar) return dir>0 ? [start, i] : [i+1, start];
        }
        return dir>0 ? [start+1, str.length-1] : [0, start];
    },

    matchBrackets: function(str, chin, chout, start, dir) { 
        var i = start;
        var depth = 1;
        while ((dir < 0) ? i - 1 >= 0 : i + 1 < str.length ) {
            i += dir;
            if (str[i] == chin && chin != chout) depth++;
            if (str[i] == chout) depth--;
            if (depth == 0) return i; 
        }
        return i; 
    }
    
};


thisModule.WrapStyle = Class.makeEnum([ 
    "Normal",  // fits text to bounds width using word wrap and sets height
    "None", // simply sets height based on line breaks only
    "Shrink" // sets both width and height based on line breaks only
]);

Morph.subclass('TextSelectionMorph', {

    documentation: "Visual representation of the text selection",
    style: {
      // changed the fill -- Adam
      fill: new lively.paint.LinearGradient([new lively.paint.Stop(0, Color.blue),
                                             new lively.paint.Stop(1, Color.blue.lighter())],
                                             lively.paint.LinearGradient.SouthNorth),
      borderWidth: 0,
      borderRadius: 1,
      textColor: Color.white // textColor added by Adam
    },
    isEpimorph: true,
    
    initialize: function($super) {
	$super(new lively.scene.Group());
	this.applyStyle({fill: null, borderWidth: 0});
	this.ignoreEvents();
    },

    // Added by Adam
    totalArea: function() {
	return this.submorphs.inject(0, function(sum, m) {
		if (m.shape.area) {
			return m.shape.area();
		} else {
			console.log("Don't know how to calculate area of " + m.shape.constructor.type);
			return m.bounds().area();
		}
	});
    },

    addRectangle: function(rect) {
	var m = this.addMorph(Morph.makeRectangle(rect));
	//m.applyStyle(this.style); // modified by Adam to make the cursor dark enough to see
	var area = this.totalArea();
	var baseColor = Color.blue;
	var color = area < 50 ? baseColor.darker() : baseColor.lighter(2);
	var style = {fill: color, borderWidth: 0, borderRadius: 1};
	m.applyStyle(style);
	m.ignoreEvents();
    },

    undraw: function() {
	this.removeAllMorphs();
    }
});

Object.subclass('lively.Text.ChunkStream', {

    documentation: "Parses a string with style into chunks of text or white space",
    
    whiteSpaceDict: {/* aaa slow? ' ': true, '\t': true, */ '\r': true, '\n': true},

    initialize: function(str, style, stringIndex) {
		this.str = str;
		this.style = style;
		this.stringIndex = stringIndex;
   },

    nextChunk: function() {
	// look at str starting at stringIndex and return the next appropriate chunk
	// Note: if style is not null, then break at style changes as well as other chunk boundaries

	if (this.stringIndex >= this.str.length) return null;

	var nextChar = this.str[this.stringIndex];
	var chunkSize = 1; // default is one character long
	if (this.whiteSpaceDict[nextChar]) {
		if (nextChar == '\r' || nextChar == '\n') {
			return new lively.Text.TextWord(this.stringIndex++).asNewLine(); }
		if (nextChar == '\t') {
			return new lively.Text.TextWord(this.stringIndex++).asTab(); }
		var chunkSize = this.chunkLengthForSpaces(this.str, this.stringIndex);
		var chunk = new lively.Text.TextWord(this.stringIndex, chunkSize).asWhite();
		this.stringIndex += chunkSize ;
		return chunk;
	}
	var chunkSize = this.chunkLengthForWord(this.str, this.stringIndex);
	if(this.style) {  // if style breaks within this chunk, shorten chunk to end at the break
		var styleSize = this.style.runLengthAt(this.stringIndex);  // length remaining in run
		if (styleSize < chunkSize) chunkSize = styleSize;
	}	
	var chunk = new lively.Text.TextWord(this.stringIndex, chunkSize);
	this.stringIndex += chunkSize;
	return chunk;
    },

chunkLengthForSpaces: function(str, index) {
	// we found a space at str[index];  return the corresponding chunk length
	// Note:  This and ...ForWord should probably be inline, and they can start at index+1
	// Further note:  Both might be faster with a regex
	// Dominant stats would be 1 space only, and typically 4-5 characters
		for (var i = index; i < str.length; i++)
			if (str[i] != ' ') return i - index;
		return i - index;
    },

chunkLengthForWord: function(str, index) {
	// we found a non-blank at str[index];  return the corresponding chunk length
	for (var i = index; i < str.length; i++)
	    if (this.whiteSpaceDict[str[i]])  return i - index;
	return i - index;
    }
});


BoxMorph.subclass('TextMorph', {
	
	documentation: "Container for Text",
	doNotSerialize: ['charsTyped', 'charsReplaced', 'delayedComposition', 'focusHalo', 'lastFindLoc', /* 'lines', aaa removed by Adam, slightly confused */ 'priorSelection', 'previousSelection', 
		'selectionRange', 'selectionPivot','typingHasBegun', 'undoSelectionRange', 'undoTextString', '_statusMorph'],

	// these are prototype variables
	fontSize:	Config.defaultFontSize	 || 12,
	fontFamily: Config.defaultFontFamily || 'Helvetica',
	textColor: Color.black,
	backgroundColor: Color.veryLightGray,
	style: { borderWidth: 1, borderColor: Color.black},
	padding: Rectangle.inset(6, 4),
	wrap: thisModule.WrapStyle.Normal,

	maxSafeSize: 200000,  // actually ran into this limit; increased it by a factor of 10 -- Adam, August 2010
	tabWidth: 4,
	tabsAsSpaces: true,
	noShallowCopyProperties: Morph.prototype.noShallowCopyProperties.concat(['textContent', 'lines', 'textSelection']),
	locale: Locale,
	acceptInput: true, // whether it accepts changes to text KP: change: interactive changes
	autoAccept: false,
	isSelecting: false, // true if last onmousedown was in character area (hit>0)
	selectionPivot: null,  // index of hit at onmousedown
	lineNumberHint: 0,
	hasKeyboardFocus: false,
	useChangeClue: false,

	formals: {
		Text: { byDefault: ""},
		Selection: { byDefault: ""},
		History: {byDefault: "----"},
		HistoryCursor: {byDefault: 0},
		DoitContext: {byDefault: null}
	},
	
	initializeTransientState: function($super) {
		$super();
		this.selectionRange = [0, -1]; // null or a pair of indices into textString
		this.priorSelection = [0, -1];	// for double-clicks
		// note selection is transient
		this.lines = null;//: TextLine[]
		
		// aaa not sure whether this is a hack or not -- Adam
		this.doNotSerialize.forEach(function(attrName) {
  		reflect(this).slotAt(attrName).setInitializationExpression('undefined');
		}.bind(this));
		reflect(this).slotAt('selectionRange').setInitializationExpression('[0, -1]'); 
		reflect(this).slotAt('priorSelection').setInitializationExpression('[0, -1]'); 
	
		if (this.isInputLine) {	 // for discussion, see beInputLine...
			this.beInputLine(this.historySize)
		}

	},

	initializePersistentState: function($super, shape) {
		$super(shape);
		this.textContent = this.addWrapper(new lively.scene.Text());
		reflect(this).slotAt('textContent').beCreator(); // added by Adam to make morph-saving work
		this.resetRendering();
		// KP: set attributes on the text elt, not on the morph, so that we can retrieve it
		this.applyStyle({fill: this.backgroundColor, borderWidth: this.borderWidth, borderColor: this.borderColor});
		this.initializeTextSelection();
	},

	initializeTextSelection: function() {
		this.textSelection = this.addMorphBack(new TextSelectionMorph());
		// The TextSelection must be beneath the Text, shift rawNode around
		this.rawNode.insertBefore(this.textSelection.rawNode, this.shape.rawNode.nextSibling);
	},

	restoreFromSubnode: function($super, importer, rawNode) {
		if ($super(importer, rawNode)) return true;
		if (rawNode.localName == "text") {
			this.textContent = new lively.scene.Text(importer, rawNode);   
  		reflect(this).slotAt('textContent').beCreator(); // added by Adam to make morph-saving work
			this.fontFamily = this.textContent.getFontFamily();
			this.fontSize = this.textContent.getFontSize();
			this.font = thisModule.Font.forFamily(this.fontFamily, this.fontSize);
			this.textColor = new Color(Importer.marker, this.textContent.getFill());
			return true;
		} 
		return false;
	},

	restorePersistentState: function($super, importer) {
		$super(importer); // FIXME legacy code, remove the whole method
		var attr = this.rawNode.getAttributeNS(null, "stored-style");
		if (attr) {
			var styleInfo = Converter.fromJSONAttribute(attr);
			this.textStyle = new RunArray(styleInfo.runs, styleInfo.values); 
		}
	},

	initialize: function($super, rect, textString, useChangeClue) {
		this.textString = textString || "";
		// rk 4/16/09 added two lines below as a bugfix for searching code with alt+w
		// in rev 2764 a changed call was added to setFill which causes an error
		this.selectionRange = [0, -1]; // null or a pair of indices into textString
		this.priorSelection = [0, -1];
		$super(rect);
		// KP: note layoutChanged will be called on addition to the tree
		// DI: ... and yet this seems necessary!
		if (this.textString instanceof thisModule.Text) {
			this.textStyle = this.textString.style;
			this.textString = this.textString.string || "";
		}
		if (this.textString === undefined) alert('initialize: ' + this);
		this.useChangeClue = useChangeClue == true;
		this.addChangeClue(useChangeClue);
		this.layoutChanged();
		return this;
	},
	
	prepareForSerialization: function($super, extraNodes, optSystemDictionary) {
		if (this.textSelection) {
			this.textSelection.remove();
			delete this.textSelection;
		}
		return $super(extraNodes, optSystemDictionary);
	},

	onDeserialize: function() {
		// the morph gets lost when it is not hung into the dom 
		// FIXME perhaps change to hide / visible mechanism 
		if (this.useChangeClue && !this.changeClue)
			this.addChangeClue(true);
	},
	
	acceptsDropping: function() {
		// using text morphs as containers feels extremly weired, especially when the fill 
		// and bounds are not visible like in the wiki
		// Is there a demo or other rules that needs that behavior? 
		// rk: I find it often convenient to enable that behavior, e.g. when composing
		// morphs for a class diagram. I think we should turn it on by default and provide
		// an easy to reach menu option to disable it
		return false
	}, 
	
	remove: function($super) {
		var hand = this.world() && this.world().firstHand();
		if (hand && hand.keyboardFocus === this)
			this.relinquishKeyboardFocus(hand);
		return $super();
	},
	
	bounds: function($super, ignoreTransients, hasBeenRendered) {
		// tag: newText
		if (this.fullBounds != null) return this.fullBounds;
		if (this.shouldNotRender) return $super(ignoreTransients);

		// Note: renderAfterReplacement calls this preemptively to set fullBounds
		//	  by calling fitText and all, but without re-rendering...
		if (!hasBeenRendered) this.resetRendering();
		this.fitText(); // adjust bounds or text for fit 
		this.drawSelection("noScroll");
		return $super(ignoreTransients);
	},

	setTextColor: function(color) {
		this.textColor = color;
		this.layoutChanged();
		this.changed();
		return this; // added by Adam
	},
	
	getTextColor: function() {
		return this.textColor;
	},

	applyStyle: function($super, spec) { // no default actions, note: use reflection instead?
		$super(spec);
		if (spec.wrapStyle !== undefined) {
			if (spec.wrapStyle in thisModule.WrapStyle) this.setWrapStyle(spec.wrapStyle);
			else console.log("unknown wrap style " + spec.wrapStyle);
		}
		if (spec.fontSize !== undefined) {
			this.setFontSize(spec.fontSize);
		}
		if (spec.textColor !== undefined) {
			this.setTextColor(spec.textColor);
		}
		
		// Added by Adam so that we can make the menu font size bigger without taking up huge amounts of space on padding.
		if (spec.padding !== undefined) {
		  this.padding = spec.padding;
		}
		
		// Added by Adam
		if (spec.fontFamily !== undefined) {
		  this.setFontFamily(spec.fontFamily);
		}
		return this;
	},

	applyStyleDeferred: function(styleSpec) {
		// tag: newText
		// Use of this method should minimize multiple renderings of text due to applyStyle
		this.shouldNotRender = true;  // suppresses attempts to render text in bounds()
		try {this.applyStyle(styleSpec); }
			catch (e) { this.shouldNotRender = false; }
		this.shouldNotRender = false;
	},
	
	makeStyleSpec: function($super, spec) {
		var spec = $super();
		if (this.wrap != TextMorph.prototype.wrap) {
			spec.wrapStyle = this.wrap;
		}
		if (this.getFontSize() !== TextMorph.prototype.fontSize) {
			spec.fontSize = this.getFontSize();
		}
		if (this.getFontFamily() !== TextMorph.prototype.fontFamily) {
			spec.fontFamily = this.getFontFamily();
		}

		if (this.textColor !== TextMorph.prototype.textColor) {
			spec.textColor = this.textColor;
		}
		return spec;
	},
	
	setWrapStyle: function(style) {
		if (!(style in thisModule.WrapStyle)) { 
			console.log("unknown style " + style + " in " + thisModule.WrapStyle);
			return; 
		}
		if (style == TextMorph.prototype.wrap) {
			delete this.wrap;
		} else {
			this.wrap = style;
		}
		return this; // added by Adam
	},
	
	beLabel: function(styleMods) {
		// Note default style is applied first, then any additional specified
		this.applyStyleDeferred({borderWidth: 0, borderColor: null, fill: null, wrapStyle: thisModule.WrapStyle.Shrink, fontSize: 12, padding: Rectangle.inset(0)});
		if (styleMods) this.applyStyleDeferred(styleMods);
		this.ignoreEvents();
		// this.isAccepting = false;
		this.layoutChanged();
		this.okToBeGrabbedBy = Functions.Null;
		return this;
	},

	beListItem: function() {
		// specify padding, otherwise selection will overlap
		this.applyStyleDeferred({borderWidth: 0, fill: null, wrapStyle: thisModule.WrapStyle.None, padding: Rectangle.inset(4, 0)});
		this.ignoreEvents();
		this.suppressHandles = true;
		this.acceptInput = false;
		this.okToBeGrabbedBy = Functions.Null;
		this.focusHaloBorderWidth = 0;
		this.drawSelection = Functions.Empty;
		return this;
	},
	
	nextHistoryEntry: function() {
		var history = this.getHistory();
		if (!history || history.length == 0) return "";
		var current = this.getHistoryCursor();
		current = (current + 1) % history.length;
		this.setHistoryCursor(current);
		return history[current];
	},
	
	previousHistoryEntry: function() {
		var history = this.getHistory();
		if (!history || history.length == 0) return "";
		var current = this.getHistoryCursor();
		current = (current + history.length - 1) % history.length;
		this.setHistoryCursor(current);
		return history[current];
	},
	
	saveHistoryEntry: function(text, historySize) {
		if (!historySize || !text) return;
		var history = this.getHistory();
		if (!history) history = [];
		history.push(text);
		history.length > historySize && history.unshift();
		this.setHistory(history);
		this.setHistoryCursor(history.length);
	},
	
	beInputLine: function(historySize) {
		this.isInputLine = true; // remeber to resetup after deserialization
		this.historySize = historySize;
		// should this behavior variation not go into a subclass (or COP layer ;-)) 
		// to make it less vulnerable for serialization? 
		this.onKeyDown = function(evt) {
			switch (evt.getKeyCode()) {
				case Event.KEY_DOWN: 
					historySize && this.setTextString(this.nextHistoryEntry());
					this.setNullSelectionAt(this.textString.length);
					evt.stop();
					return true;
				case Event.KEY_UP: 
					historySize && this.setTextString(this.previousHistoryEntry());
					this.setNullSelectionAt(this.textString.length);
					evt.stop();
					return true;
				case Event.KEY_RETURN:
					historySize && this.saveHistoryEntry(this.textString, historySize);
					this.saveContents(this.textString);
					evt.stop();
					return true;
				default:
					return Class.getPrototype(this).onKeyDown.call(this, evt);
			}
		};
		this.suppressGrabbing = true;
		this.onTextUpdate = function(newValue) {
			TextMorph.prototype.onTextUpdate.call(this, newValue);
			this.setSelectionRange(0, this.textString.length); 
		}
		return this;
	},

	beHelpBalloonFor: function(targetMorph) {
		this.relayMouseEvents(targetMorph, 
			{onMouseDown: "onMouseDown", onMouseMove: "onMouseMove", onMouseUp: "onMouseUp"});
		// some eye candy for the help
		this.linkToStyles(['helpText']);
		this.setWrapStyle(thisModule.WrapStyle.Shrink);
		this.openForDragAndDrop = false; // so it won't interfere with mouseovers
		return this;
	},

	subMenuItems: function($super, evt) {
		var items = $super(evt);
		items.unshift(["Text functions" , this.editMenuItems(evt)]);
		return items;
	},

	editMenuItems: function(evt) {
	// Add a first item for type-in if it's an iPad or similar device...
	return [
		["cut (x)", this.doCut.bind(this)],
		["copy (c)", this.doCopy.bind(this)],
		["paste (v)", this.doPaste.bind(this)],
		["replace next (m)", this.doMore.bind(this)],
		["exchange (e)", this.doExchange.bind(this)],
		["undo (z)", this.doUndo.bind(this)],
		["find (f)", this.doFind.bind(this)],
		["find next (g)", this.doFindNext.bind(this)],
		["find source (F)", this.doSearch.bind(this)],
		["do it (d)", this.doDoit.bind(this)],
		["print it (p)", this.doPrintit.bind(this)],
		["inspect it (I)", this.doInspect.bind(this)],
		["print it (p)", this.doPrintit.bind(this)],
		["accept changes (s)", this.doSave.bind(this)],
		["color (o)", this.colorSelection.bind(this)],
		["make link (u)", this.linkifySelection.bind(this)],
		["help", this.doHelp.bind(this)],

		// Typeface		
		["make italic (i)", (function(){this.emphasizeBoldItalic({style: 'italic'})}).bind(this)],
		["make bold (b)",  (function(){this.emphasizeBoldItalic({style: 'bold'})}).bind(this)],		

		["eval as JavaScript code", function() { this.boundEval(this.textString); }],
		["eval as Lively markup", function() { 
			var importer = new Importer();
			var txt = this.xml || this.textString;
			// console.log('evaluating markup ' + txt);
			var morph = importer.importFromString(txt);
			this.world().addMorph(morph);
			importer.finishImport(this.world()); }],
		["save as ...", function() { 
			this.world().prompt("save as...", function(filename) {
				if (!filename) return;
				var req = new NetRequest({model: new NetRequestReporter(), setStatus: "setRequestStatus"});
				req.put(URL.source.withFilename(filename), this.xml || this.textString);
				}.bind(this));
			}]
		]
	},

	// TextMorph composition functions
	textTopLeft: function() { 
		if (!(this.padding instanceof Rectangle)) console.log('padding is ' + this.padding);
		return this.shape.bounds().topLeft().addPt(this.padding.topLeft()); 
	},
	
	ensureRendered: function() { // created on demand and cached
		// tag: newText
		if (this.ensureTextString() == null) return null;
//		  if (!this.textContent.rawNode.firstChild)	 this.renderText(this.textTopLeft(), this.compositionWidth());
		if (!this.lines)  this.renderText(this.textTopLeft(), this.compositionWidth());
		return this.textContent; 
	},

	resetRendering: function() {
		// tag: newText
		this.textContent.replaceRawNodeChildren(null);
		this.textContent.setFill(this.textColor);
		this.font = thisModule.Font.forFamily(this.fontFamily, this.fontSize);
		this.font.applyTo(this.textContent);
		this.lines = null;
		this.lineNumberHint = 0;
	},

	renderAfterReplacement: function(replacementHints) {
		// tag: newText
		// DI:	The entire text composition scheme here should be replaced by something simpler
		// However, until that time, I have put in added logic to speed up editing in large bodies of text.
		//	We look at the lines of text as follows...
		//
		//		A:	Lines preceding the replacement, and that are unchanged
		//			Note that a preceding line can be affected if it has word-break spillover
		//		B:	Lines following A, including the replacement, and up to C
		//		C:	Lines following the replacement, and that are unchanged, except for Y-position

		if (Config.useOldText) return this.composeAfterEdits();	 // In case of emergency
		var test = false && this.textString.startsWith("P = new");	// Check out all the new logic in this case
		if (test) for (var i=0; i < this.lines.length; i++) console.log("Line " + i + " = " + [this.lines[i].startIndex, this.lines[i].getStopIndex()]);
		if (test) console.log("Last line y before = " + this.lines.last().topLeft.y);

		// The hints tell what range of the prior text got replaced, and how large was the replacement
		var selStart = replacementHints.selStart;  // JS substring convention: [1,2] means str[1] alone
		var selStop = replacementHints.selStop;
		var repLength = replacementHints.repLength;
		var repStop = selStart + repLength;
		var delta =	 repLength - (selStop+1 - selStart);  // index in string after replacement rel to before
		if (test) console.log(", selStart = " + selStart + ", selStop = " + selStop + ", repLength = " + repLength + ", repStop = " + repStop + ", delta = " + delta);

		var compositionWidth = this.compositionWidth();

		// It is assumed that this textMorph is still fully rendered for the text prior to replacement
		// Thus we can determine the lines affected by the change
		var lastLineNoOfA = Math.max(this.lineNumberForIndex(selStart) - 1, -1);  // -1 means no lines in A
		if (lastLineNoOfA >= 0 && !this.lines[lastLineNoOfA].endsWithNewLine()) lastLineNoOfA-- ;
		if (test) console.log("Replacing from " + selStart + " in line " + this.lineNumberForIndex(selStart) + " preserving lines 0 through " + lastLineNoOfA);

		var testEarlyEnd = function (lineStart) {
			//	Brilliant test looks for lines that begin at the same character as lineStart, thus indicating
			//	a line at which we can stop composing, and simply reuse the prior lines after updating
			if (lineStart <= repStop) return false;	 // Not beyond the replacement yet
			var oldLineNo = this.lineNumberForIndex(lineStart - delta);	 // --- do we need to check < 0 here?
			if (oldLineNo < 0) return false;
			var match = (this.lines[oldLineNo].startIndex + delta) == lineStart;
			if (test) console.log("At index " + lineStart + ", earlyEnd returns " + match);
			return match 
		}

		var oldFirstLine = this.lines[lastLineNoOfA+1];	 // The first line that may change
		// Note: do we need font at starting index??
		var newLines = this.composeLines(oldFirstLine.startIndex, oldFirstLine.topLeft, compositionWidth, this.font, testEarlyEnd.bind(this));
		for (var i = 0; i < newLines.length; i++) newLines[i].render(this.textContent);
		if (test) console.log("Size of lines before = " + (lastLineNoOfA+1));
		if (test) console.log("Size of new lines = " + newLines.length);
		if (test) console.log("stopIndex = " + newLines.last().getStopIndex() + ", overall last = " + (this.textString.length-1));

		var lastLineInB = newLines.last();
		if (lastLineInB && lastLineInB.getStopIndex() < this.textString.length-1) {
			//	Composition stopped before the end, presumably because of our brilliant test
			var firstLineNoInC = this.lineNumberForIndex(lastLineInB.getNextStartIndex() - delta);
			if (test) console.log("lineNumberForIndex(" + (lastLineInB.getNextStartIndex() - delta) + ") = " + firstLineNoInC); 
			var firstLineInC = this.lines[firstLineNoInC];
			var Ydelta = lastLineInB.topLeft.y + lastLineInB.lineHeight() - firstLineInC.topLeft.y;
			if (test) console.log ("lastLineInB.topLeft.y / lastLineInB.lineHeight() / firstLineInC.topLeft.y");
			if (test) console.log (lastLineInB.topLeft.y + " / " + lastLineInB.lineHeight() + " / " + firstLineInC.topLeft.y);

			//	Update the remaining old lines, adjusting indices and Y-values as well
			for (var i = firstLineNoInC; i < this.lines.length; i++)
			this.lines[i].adjustAfterEdits(this.textString, this.textStyle, delta, Ydelta);
			if (test) console.log("Size of lines after = " + (this.lines.length-firstLineNoInC));
			newLines = newLines.concat(this.lines.slice(firstLineNoInC));
			//	Release rawNodes for the deleted lines (just up to firstLineNoInC)
			for (var i = lastLineNoOfA+1; i < firstLineNoInC; i++)
			this.lines[i].removeRawNodes();
		} else {
			//	Release rawNodes for the deleted lines (all beyond lastLineNoOfA)
			for (var i = lastLineNoOfA+1; i < this.lines.length; i++)
			this.lines[i].removeRawNodes();
		}
		//	Update the textString reference in lines retained before the replacement
		for (var i = 0; i <= lastLineNoOfA; i++) 
		this.lines[i].adjustAfterEdits(this.textString, this.textStyle, 0, 0);

		this.lines = this.lines.slice(0, lastLineNoOfA+1).concat(newLines);
		this.lines.makeAllCreatorSlots(); // aaa hack for morph-saving -- Adam
		reflect(this).slotAt('lines').beCreator(); // aaa hack for morph-saving -- Adam

		if (test) for (var i=0; i < this.lines.length; i++) console.log("Line " + i + " = " + [this.lines[i].startIndex, this.lines[i].getStopIndex()]);
		if (test) console.log("Last line y after = " + this.lines.last().topLeft.y);

		this.bounds(null, true);  // Call bounds now to set fullBounds and avoid re-rendering
	},

	ensureTextString: function() { 
		// may be overrridden
		return this.textString; 
	}, 

	// return the bounding rectangle for the index-th character in textString	 
	getCharBounds: function(index) {
	  // Factored out getCharBoundsWithoutCopying, need it as an optimization. -- Adam
		// KP: note copy to avoid inadvertent modifications
	  var bounds = this.getCharBoundsWithoutCopying(index);
		if (bounds) {
		  console.log("Copying bounds");
		  return bounds.copy();
		} else {
		  return bounds;
		}
	},

	getCharBoundsWithoutCopying: function(index) {
		// tag: newText
		this.ensureRendered();
		if (!this.lines) return null;
		var line = this.lineForIndex(index);
		var bounds = line == null ? null : line.getBounds(index);
		if (bounds) { return bounds; }
		return null;
	},

	// compose the lines if necessary and then render them
	renderText: function(topLeft, compositionWidth) {
		// tag: newText
		// Note:  This seems to be a spacer for one-line texts, as in a list of texts,
		//	  not an interline spacing for lines in a paragraph.
		var defaultInterline = (lively.Text.TextLine.prototype.lineHeightFactor - 1) * this.font.getSize();

		this.lines = this.composeLines(0, topLeft.addXY(0, defaultInterline/2), compositionWidth, this.font);
		// aaa slow?   this.lines.makeAllCreatorSlots(); // aaa hack for morph-saving -- Adam
		// aaa slow?   reflect(this).slotAt('lines').beCreator(); // aaa hack for morph-saving -- Adam
		for (var i = 0; i < this.lines.length; i++) this.lines[i].render(this.textContent);
	},

	composeLines: function(initialStartIndex, initialTopLeft, compositionWidth, font, testEarlyEnd) {
		// tag: newText
		// compose and return in an array, lines in the text beginning at initialStartIndex
		//	console.log("composeLines(" + initialStartIndex + "): " + this.textString.substring(0,10) + "...");
		// if (this.textString.startsWith("funct") && initialStartIndex == 0) lively.lang.Execution.showStack();
		var lines = new Array();
		var startIndex = initialStartIndex;
		var stopIndex = this.textString.length - 1;
		var chunkStream = new lively.Text.ChunkStream(this.textString, this.textStyle, startIndex);
		var topLeft = initialTopLeft;
		while (startIndex <= stopIndex) {
			var line = new lively.Text.TextLine(this.textString, this.textStyle, 
				startIndex, topLeft, font, new TextEmphasis({}));
			line.setTabWidth(this.tabWidth, this.tabsAsSpaces);
			line.compose(compositionWidth, chunkStream);
			line.adjustAfterComposition(this.textString, compositionWidth);
			startIndex = line.getNextStartIndex();
			chunkStream.stringIndex = startIndex;
			topLeft = topLeft.addXY(0, line.lineHeight());
			lines.push(line);
			if (testEarlyEnd && testEarlyEnd(startIndex)) break
		}
		return lines;
	},

	lineNumberSearch: function(lineFunction) {
		// A linear search, starting at the same place as last time.
		if (!this.lines) return -1;
		var lineNo = this.lineNumberHint;
		if (! lineNo || lineNo < 0 || lineNo >= this.lines.length) lineNo = 0;

		while (lineNo >= 0 && lineNo < this.lines.length) {
			var test = lineFunction(this.lines[lineNo]);
			if (test == 0) {this.lineNumberHint = lineNo;  return lineNo; }
			if (test < 0) lineNo--;
			else lineNo++;
		}
		return -1;
	},

	// find what line contains the index 'stringIndex'
	lineNumberForIndex: function(stringIndex) {
		return this.lineNumberSearch( function(line) { return line.testForIndex(stringIndex); });	},

	lineForIndex: function(stringIndex) {
		return this.lines[this.lineNumberForIndex(stringIndex)];
	},

	// find what line contains the y value in character metric space
	lineNumberForY: function(y) {
		return this.lineNumberSearch( function(line) { return line.testForY(y); });	   
	},

	lineForY: function(y) {
		var i = this.lineNumberForY(y);
		if (i < 0) return null;
		return this.lines[i];
	},
	
	hit: function(x, y) {
		var line = this.lineForY(y);
		return line == null ? -1 : line.indexForX(x); 
	},

	setTabWidth: function(width, asSpaces) {
		this.tabWidth = width;
		this.tabsAsSpaces = asSpaces;
	},

	compositionWidth: function() {
		var padding = this.padding;
		if (this.wrap == thisModule.WrapStyle.Normal) return this.shape.bounds().width - padding.left() - padding.right();
		else return 9999; // Huh??
	},

	// DI: Should rename fitWidth to be composeLineWrap and fitHeight to be composeWordWrap
	fitText: function() { 
		if (this.wrap == thisModule.WrapStyle.Normal) 
			this.fitHeight();
		else 
			this.fitWidth();
		
		return this; // added by Adam
	},
	
	adjustScale: function () {
		// Experimenting to see if I can make a TextMorph that reduces its own scale
		// as it gains text. -- Adam
		var maxSpace = this._maxSpace;
		if (maxSpace) {
    	var e = this.getExtent();
  	  this.setScale(Math.max(0.4, Math.min(1, maxSpace.x / e.x, maxSpace.y / e.y)));
		}
	},

	lineHeight: function() {
		return this.font.getSize() * lively.Text.TextLine.prototype.lineHeightFactor;
	},

	fitHeight: function() { //Returns true iff height changes
		// Wrap text to bounds width, and set height from total text height
		if (!this.textString || this.textString.length <= 0) return;
		var jRect = this.getCharBoundsWithoutCopying(this.textString.length - 1);

		if (jRect == null) { 
			console.log("char bounds is null"); 
			return; 
		}

		// console.log('last char is ' + jRect.inspect() + ' for string ' + this.textString);
		var maxY = Math.max(this.lineHeight(), jRect.maxY());

		var padding	 = this.padding;
		if (this.shape.bounds().maxY() == maxY + padding.top()) 
			return; // No change in height	// *** check that this converges

		var bottomY = padding.top() + maxY;

		var oldBounds = this.shape.bounds();
		this.shape.setBounds(oldBounds.withHeight(bottomY - oldBounds.y))

		this.adjustForNewBounds();
	},

	fitWidth: function() {
		// Set morph bounds based on max text width and height

		var jRect = this.getCharBoundsWithoutCopying(0);
		if (jRect == null) { 
			// console.log("fitWidth failure on TextMorph.getCharBounds"); // commented out because it's very annoying -- Adam, June 2011
			var s = this.shape;
			s.setBounds(s.bounds().withHeight(this.lineHeight()));
			return; 
		}

		var x0 = jRect.x;
		var y0 = jRect.y;
		var maxX = jRect.maxX();  
		var maxY = jRect.maxY();

		// DI: really only need to check last char before line breaks...
		// ... and last character
		var s = this.textString;
		var iMax = s.length - 1;
		for (var i = 0; i <= iMax; i++) {
			var c = this.textString[Math.min(i+1, iMax)];
			if (i == iMax || c == "\n" || c == "\r") {
				jRect = this.getCharBoundsWithoutCopying(i);
				if (jRect == null) { console.log("null bounds at char " + i); return false; }
				if (jRect.width < 100) { // line break character gets extended to comp width
					maxX = Math.max(maxX, jRect.maxX());
					maxY = Math.max(maxY, jRect.maxY()); 
				}
			}
		}

		// if (this.innerBounds().width==(maxX-x0) && this.innerBounds().height==(maxY-y0)) return;
		// No change in width *** check convergence
		var padding = this.padding;
		var bottomRight = padding.topLeft().addXY(maxX,maxY);


		// DI: This should just say, eg, this.shape.setBottomRight(bottomRight);
		var b = this.shape.bounds();
		if (this.wrap == thisModule.WrapStyle.None) {
			this.shape.setBounds(b.withHeight(bottomRight.y - b.y));
		} else if (this.wrap == thisModule.WrapStyle.Shrink) {
			this.shape.setBounds(b.withBottomRight(bottomRight));
		}

	},

	showsSelectionWithoutFocus: Functions.False, // Overridden in, eg, Lists
	
	getTextSelection: function() {
		if (!this.textSelection) {
			this.initializeTextSelection();
		}
		return this.textSelection
	},
	
	removeTextSelection: function() {
		if (!this.textSelection) {
			return
		}
		this.textSelection.remove();
		delete this.textSelection;
	},

	selectionStyle: function() {
		// This is just a way into the lively.Text namespace; not an access to this selectionMorph
		return TextSelectionMorph.prototype.style
	},

	undrawSelection: function() {
		if (!this.textSelection) return
		this.textSelection.undraw(); 
	},

	drawSelection: function(noScroll) { // should really be called buildSelection now
		if (!this.showsSelectionWithoutFocus() && this.takesKeyboardFocus() && !this.hasKeyboardFocus) {
			return;
		}

		this.undrawSelection();
		var selection = this.getTextSelection();

		var jRect;
		if (this.selectionRange[0] > this.textString.length - 1) { // null sel at end
			jRect = this.getCharBoundsWithoutCopying(this.selectionRange[0]-1);
			if (jRect) {
				jRect = jRect.translatedBy(pt(jRect.width,0));
			}
		} else {
			jRect = this.getCharBoundsWithoutCopying(this.selectionRange[0]);
		}

		if (jRect == null) {
			if (this.textString.length > 0) {
				// console.log("text box failure in drawSelection index = " + this.selectionRange[0] + "text is: " + this.textString.substring(0, Math.min(15,this.textString.length)) + '...'); 
			}
			return;
		}

		var r1 = this.lineRect(jRect.withWidth(1));
		if (this.hasNullSelection()) {
			var r2 = r1.translatedBy(pt(-1,0)); 
		} else {
			jRect = this.getCharBoundsWithoutCopying(this.selectionRange[1]);
			if (jRect == null)	{
				return;
			}

			var r2 = this.lineRect(jRect);
			r2 = r2.translatedBy(pt(r2.width - 1, 0)).withWidth(1); 
		}

		if (this.lineNo(r2) == this.lineNo(r1)) {
			selection.addRectangle(r1.union(r2));
		} else { // Selection is on two or more lines
			var localBounds = this.shape.bounds();
			var padding = this.padding;
			r1 = r1.withBottomRight(pt(localBounds.maxX() - padding.left(), r1.maxY()));
			r2 = r2.withBottomLeft(pt(localBounds.x + padding.left(), r2.maxY()));
			selection.addRectangle(r1);
			selection.addRectangle(r2);

			if (this.lineNo(r2) != this.lineNo(r1) + 1) {
				// Selection spans 3 or more lines; fill the block between top and bottom lines
				selection.addRectangle(Rectangle.fromAny(r1.bottomRight(), r2.topLeft()));
			}
		}

		// scrolling here can cause circularity with bounds calc
		if (!noScroll) this.scrollSelectionIntoView();
	},

	lineNo: function(r) { //Returns the line number of a given rectangle
		return this.lineNumberForY(r.center().y);
	},
	
	lineRect: function(r) { //Returns a new rect aligned to text lines
		var line = this.lines[Math.min(Math.max(this.lineNo(r), 0), this.lines.length - 1)];
		return new Rectangle(r.x, line.getTopY() - line.interline()/2, r.width, line.lineHeight());
	},
	
	charOfPoint: function(localP) {	 //Sanitized hit function
		// DI: Nearly perfect now except past last char if not EOL
		// Note that hit(x,y) expects x,y to be in morph coordinates,
		// but y should have 2 subtracted from it.
		// Also getBnds(i) reports rectangles that need 2 added to their y values.
		// GetBounds(i) returns -1 above and below the text bounds, and
		// 0 right of the bounds, and leftmost character left of the bounds.
		var tl = this.textTopLeft();
		var px = Math.max(localP.x, tl.x); // ensure no returns of 0 left of bounds
		var px = Math.min(px, this.innerBounds().maxX()-1); // nor right of bounds
		var py = localP.y - 2;
		var hit = this.hit(px, py);
		var charIx = this.hit(px, py);
		var len = this.textString.length;

		// hit(x,y) returns -1 above and below box -- return 1st char or past last
		if (charIx < 0) return py < tl.y ? 0 : len;

		if (charIx == 0 && this.getCharBoundsWithoutCopying(len-1).topRight().lessPt(localP))
			return len;

		// It's a normal character hit
		// People tend to click on gaps rather than character centers...
		var cRect = this.getCharBoundsWithoutCopying(charIx);
		if (cRect != null && px > cRect.center().x) {
			return Math.min(charIx + 1, len);
		}
		return charIx;
	},
	
	// TextMorph mouse event functions 
	handlesMouseDown: function(evt) {
		// Do selecting if click is in selectable area
		if (evt.isCommandKey() || evt.isRightMouseButtonDown() || evt.isMiddleMouseButtonDown()) return false;
		var selectableArea = this.openForDragAndDrop ? this.innerBounds() : this.shape.bounds();
		return selectableArea.containsPoint(this.localize(evt.mousePoint)); 
	},

	onMouseDown: function(evt) {
		var link = this.linkUnderMouse(evt);
		if (link && !evt.isCtrlDown()) { // there has to be a way to edit links!
			console.log("follow link " + link)
			this.doLinkThing(evt, link);
			return true;
		}
		this.isSelecting = true;
		if (evt.isShiftDown()) {
			if (this.hasNullSelection())
				this.selectionPivot = this.selectionRange[0];
			this.extendSelectionEvt(evt);
		} else {
			var charIx = this.charOfPoint(this.localize(evt.mousePoint));
			this.startSelection(charIx);
		}
		this.requestKeyboardFocus(evt.hand);
		// ClipboardHack.selectPasteBuffer();
		return true; 
	},
	
	onMouseMove: function($super, evt) { 
		// console.log("mouse move " + evt.mousePoint)
		if (this.isSelecting) return this.extendSelectionEvt(evt);
		var link = this.linkUnderMouse(evt);
		// TODO refactor ito into HandleMorph
		// but this is a good place to evalutate what a mouse indicators should look like..
		if (link && this.containsPoint(evt.mousePoint)) { // there is onMouseMove after the onMouseOut
			if (evt.isCtrlDown()) {
				if (evt.hand.indicator != "edit") {
					evt.hand.indicator = "edit";
					evt.hand.lookNormal();
					evt.hand.removeIndicatorMorph();
					var morph = evt.hand.ensureIndicatorMorph();
					morph.setTextString("edit");
					morph.setTextColor(Color.red);
				}
			} else {
				if (evt.hand.indicator != link) {
					evt.hand.indicator = link;
					evt.hand.lookLinky();
					evt.hand.removeIndicatorMorph();
					var morph = evt.hand.ensureIndicatorMorph();
					morph.setTextString(link);
					morph.setExtent(pt(300,20));
					morph.setTextColor(Color.blue);
				}
			}
		} else {
			evt.hand.lookNormal();
			evt.hand.removeIndicatorMorph();
			evt.hand.indicator = undefined;			
		};
		return $super(evt);		   
	},

	onMouseOut: function($super, evt) {
		$super(evt);
		// console.log("mouse out " + evt.mousePoint)
		evt.hand.lookNormal();
		evt.hand.removeIndicatorMorph();
		evt.hand.indicator = undefined;
	},

	linkUnderMouse: function(evt) {	 
		// Return null or a link encoded in the text
		if (!this.textStyle) return null;
		var charIx = this.charOfPoint(this.localize(evt.mousePoint));
		return this.textStyle.valueAt(charIx).link;		  
	},
	
	doLinkThing: function(evt, link) { 
		// Later this should set a flag like isSelecting, so that we can highlight the 
		// link during mouseDown and then act on mouseUp.
		// For now, we just act on mouseDown
		evt.hand.lookNormal();
		evt.hand.setMouseFocus(null);
		evt.stop();	 // else weird things happen when return from this link by browser back button
		var url = URL.ensureAbsoluteURL(link);
		// add require to LKWiki.js here
		var wikiNav = Global['WikiNavigator'] && new WikiNavigator(url, null, -1 /*FIXME don't ask for the headrevision*/);
		var isExternalLink = url.hostname != document.location.hostname;
		var openInNewWindow = evt.isMetaDown();

		var followLink = function (answer) {
			Config.askBeforeQuit = false;
			if (!isExternalLink) {
				var queries = Object.extend(url.getQuery(), {date: new Date().getTime()});
				url = url.withQuery(queries);
			}
			if (openInNewWindow)
				Global.window.open(url.toString());
			else
				Global.window.location.assign(url.toString());
		};
		
		if (!Config.confirmNavigation) 
			return followLink();
		
		if (wikiNav && wikiNav.isActive() && !isExternalLink)
			wikiNav.askToSaveAndNavigateToUrl(this.world(), openInNewWindow);
		else
			this.world().confirm("Please confirm link to " + url.toString(), followLink);
	},	

	onMouseUp: function(evt) {
		this.isSelecting = false;

		// If not a repeated null selection then done after saving previous selection
		if ( (this.selectionRange[1] != this.selectionRange[0] - 1) ||
		(this.priorSelection[1] != this.priorSelection[0] - 1) ||
		(this.selectionRange[0] != this.priorSelection[0]) ) {
			this.previousSelection = this.priorSelection;
			ClipboardHack.invokeKeyboard();
			return;
		}

		// It is a null selection, repeated in the same place -- select word or range
		if (this.selectionRange[0] == 0 || this.selectionRange[0] == this.textString.length) {
			this.setSelectionRange(0, this.textString.length); 
		} else {
			this.selectionRange = this.locale.selectWord(this.textString, this.selectionRange[0]);
		}

		this.setSelection(this.getSelectionString());
		this.drawSelection(); 
			ClipboardHack.invokeKeyboard();
	},
	
	// TextMorph text selection functions

	startSelection: function(charIx) {	
		// We hit a character, so start a selection...
		// console.log('start selection @' + charIx);
		this.priorSelection = this.selectionRange;
		this.selectionPivot = charIx;
		this.setNullSelectionAt(charIx);

		// KP: was this.world().worldState.keyboardFocus = this; but that's an implicitly defined prop in Transmorph, bug?
		// KP: the following instead??
		// this.world().firstHand().setKeyboardFocus(this);
	},

	extendSelectionEvt: function(evt) { 
		var charIx = this.charOfPoint(this.localize(evt.mousePoint));
		// console.log('extend selection @' + charIx);
		if (charIx < 0) return;
		this.setSelectionRange(this.selectionPivot, charIx); 
	},
	
	selectionString: function() { // Deprecated
		return this.getSelectionString(); 
	},
	
	getSelectionString: function() {
		return this.textString.substring(this.selectionRange[0], this.selectionRange[1] + 1); 
	},
	
	getSelectionText: function() {
		return this.textStyle ? 
		this.getRichText().subtext(this.selectionRange[0], this.selectionRange[1] + 1)
		: new thisModule.Text(this.getSelectionString());
	},

	// FIXME integrate into model of TextMorph
	setRichText: function(text) {
		if (!(text instanceof lively.Text.Text)) throw dbgOn(new Error('Not text'));
		this.textStyle = text.style;
		this.setTextString(text.string);
	},
	
	getRichText: function() {
		return new thisModule.Text(this.textString, this.textStyle); 
	},

	replaceSelectionWith: function(replacement) { 
		if (! this.acceptInput) return;
		var strStyle = this.textStyle;
		var repStyle = replacement.style;
		var oldLength = this.textString.length;

		if (! this.typingHasBegun) { // save info for 'More' command
			this.charsReplaced = this.getSelectionString();
			this.lastFindLoc = this.selectionRange[0] + replacement.length;
		}

		var selStart = this.selectionRange[0];	// JS substring convention: [1,2] means str[1] alone
		var selStop = this.selectionRange[1];
		var repLength = replacement.asString().length;
		var replacementHints = {selStart: selStart, selStop: selStop, repLength: repLength};
		if (this.textString.length == 0) replacementHints = null;  // replacement logic fails in this case

		// Splice the style array if any	
		if (strStyle || repStyle) { 
			if (!strStyle) strStyle = new RunArray([oldLength],	 [new TextEmphasis({})]);
			if (!repStyle) repStyle = new RunArray([replacement.length], [strStyle.valueAt(Math.max(0, this.selectionRange[0]-1))]);
			var beforeStyle = strStyle.slice(0, selStart);
			var afterStyle = strStyle.slice(selStop+1, oldLength);
			this.textStyle = beforeStyle.concat(repStyle).concat(afterStyle);
		}		
		if (this.textStyle && this.textStyle.values.all(function(ea) {return !ea})) this.textStyle = null;

		// Splice the textString
		var before = this.textString.substring(0,selStart); 
		var after = this.textString.substring(selStop+1, oldLength);
		this.setTextString(before.concat(replacement.asString(),after), replacementHints);

		if(selStart == -1 && selStop == -1) {  // FixMe -- this shouldn't happen
			this.setSelectionRange(0,0); // symptom fix of typing into a "very empty" string
		};

		// Compute new selection, and display
		var selectionIndex = this.selectionRange[0] + replacement.length;
		this.startSelection(selectionIndex); 

		this.showChangeClue();		
	},

	setNullSelectionAt: function(charIx) { 
		this.setSelectionRange(charIx, charIx); 
	},
	
	hasNullSelection: function() { 
		return this.selectionRange[1] < this.selectionRange[0]; 
	},

	setSelectionRange: function(piv, ext) { 
		// console.log("setSelectionRange(" + piv + ", " + ext, ")")
		this.selectionRange = (ext >= piv) ? [piv, ext - 1] : [ext, piv - 1];
		this.setSelection(this.getSelectionString());
		this.drawSelection(); 
	this.typingHasBegun = false;  // New selection starts new typing
	},

	// TextMorph keyboard event functions
	takesKeyboardFocus: Functions.True,			// unlike, eg, cheapMenus
	
	setHasKeyboardFocus: function(newSetting) { 
		this.hasKeyboardFocus = newSetting;
		return newSetting;
	},
	
	onFocus: function($super, hand) { 
		$super(hand);
		this.drawSelection();
	},

	onBlur: function($super, hand) {
		$super(hand);
		if (!this.showsSelectionWithoutFocus()) this.undrawSelection();
	},

	onKeyDown: function(evt) {
		if (!this.acceptInput) return;

		// rk: With Mac OS 10.6 it's not sufficient to set the selection of the textarea
		// when doing tryClipboardAction. Hack of the hack for now: always set selection 
		// FIXME, other place Widgets, SelectionMorph>>reshape
		// ClipboardHack.selectPasteBuffer();
		
		var selecting = evt.isShiftDown();
		var selectionStopped = !this.hasNullSelection() && !selecting;
		var pos = this.getCursorPos(); // is selectionRange[0] or selectionRange[1], depends on selectionPivot
		var wordRange = evt.isMetaDown() ? this.locale.selectWord(this.textString, pos) : null;

		var textMorph = this;
		var moveCursor = function(newPos) {
			if (selecting) textMorph.extendSelection(newPos);
			else textMorph.startSelection(newPos);
			evt.stop();
			return true;
		};
		
		// A couple of Emacs key bindings that are ingrained in my fingers. -- Adam
		var shouldUseEmacsKeyBindings = true;
		if (shouldUseEmacsKeyBindings) {
			if (evt.isCtrlDown()) {
				var ch = String.fromCharCode(evt.getKeyCode());
				if      (ch === 'A') {return this.goToBeginningOfLine(evt);}
				else if (ch === 'E') {return this.goToEndOfLine(evt);}
				else if (ch === 'D') {return this.deleteForward(evt);}
			}
		}

		switch (evt.getKeyCode()) {
			case Event.KEY_HOME: { return this.goToBeginningOfLine(evt); } // extracted goToBeginningOfLine -- Adam
			case Event.KEY_END:  { return this.goToEndOfLine(      evt); } // extracted goToEndOfLine       -- Adam
			case Event.KEY_PAGEUP: {
				// go to start
				return moveCursor(0);
			}
			case Event.KEY_PAGEDOWN: {
				// go to start
				return moveCursor(this.textString.length);
			}
			case Event.KEY_LEFT: {
				if (selectionStopped) // if a selection exists but but selecting off -> jump to the beginning of the selection
					return moveCursor(this.selectionRange[0]);
				var newPos = evt.isMetaDown() && wordRange[0] != pos ? wordRange[0] : pos-1;
				newPos = Math.max(newPos, 0);
				return moveCursor(newPos);
			} 
			case Event.KEY_RIGHT: {
				if (selectionStopped) // if a selection exists but selecting off -> jump to the end of the selection
					return moveCursor(this.selectionRange[1]+1);
				newPos = evt.isMetaDown() && wordRange[1]+1 != pos ? wordRange[1]+1 : pos + 1;
				newPos = Math.min(this.textString.length, newPos);
				return moveCursor(newPos);
			}
			case Event.KEY_UP: {
				var lineNo = this.lineNumberForIndex(Math.min(pos, this.textString.length-1));
				if (lineNo <= 0) { // cannot move up
					evt.stop();
					return true;
				}
				var line = this.lines[lineNo];
				var lineIndex = pos - line.startIndex;
				var newLine = this.lines[lineNo - 1];
				var newPos = Math.min(newLine.startIndex + lineIndex, newLine.getStopIndex());
				return moveCursor(newPos);
			}
			case Event.KEY_DOWN: {
				var lineNo = this.lineNumberForIndex(pos);
				if (lineNo >= this.lines.length - 1) { // cannot move down
					evt.stop();
					return true;
				}
				var line = this.lines[lineNo];
				if (!line) {
						console.log('TextMorph finds no line ???');
						evt.stop();
						return true
				}
				var lineIndex = pos	 - line.startIndex;
				var newLine = this.lines[lineNo + 1];
				var newPos = Math.min(newLine.startIndex + lineIndex, newLine.getStopIndex());
				return moveCursor(newPos);
			}
			case Event.KEY_TAB: {
				this.replaceSelectionfromKeyboard("\t");
				evt.stop();
				return true;
			}
			case Event.KEY_BACKSPACE: { return this.deleteBackward(evt); } // extracted deleteBackward -- Adam
			case Event.KEY_DELETE:    { return this.deleteForward (evt); } // added deleteForward -- Adam
			case Event.KEY_RETURN: {
				this.replaceSelectionfromKeyboard("\n");
				evt.stop();
				return true;
			}
			case Event.KEY_ESC: {
				this.relinquishKeyboardFocus(this.world().firstHand());
				return true;
			}
		}

		
		if (ClipboardHack.tryClipboardAction(evt, this)) {
			return true;
		}

		if (evt.isCommandKey() ) {
			if (this.processCommandKeys(evt)) {
				evt.stop();
				return true;
			}
		}

		return false		
	},
      
      
      
	// A bunch of stuff extracted from onKeyDown so that I could reuse methods like goToBeginningOfLine. -- Adam
      
	eventIsSelecting: function(evt) {
		return evt.isShiftDown();
	},

	moveCursor: function(newPos, evt) {
		if (this.eventIsSelecting(evt)) this.extendSelection(newPos);
		else this.startSelection(newPos);
		evt.stop();
		return true;
        },
	
	goToBeginningOfLine: function(evt) {
		var line = this.lines[this.lineNumberForIndex(this.getCursorPos())] || this.lines.last(); //FIXME
		return this.moveCursor(line.startIndex, evt);
        },
	
	goToEndOfLine: function(evt) {
		// go to the end of the line
		var line = this.lines[this.lineNumberForIndex(this.getCursorPos())] || this.lines.last(); //FIXME
		var idx = line === this.lines.last() ? line.getStopIndex() + 1 : line.getStopIndex(); // FIXME!!!
		return this.moveCursor(idx, evt);
	},

	deleteForward: function(evt) {
		if (this.hasNullSelection()) this.selectionRange[1] = Math.max(0, this.selectionRange[0]);
		this.replaceSelectionfromKeyboard("");
		evt.stop(); // do not use for browser navigation
		return true;
	},

	deleteBackward: function(evt) {
		if (this.hasNullSelection()) this.selectionRange[0] = Math.max(-1, this.selectionRange[0]-1);
		this.replaceSelectionfromKeyboard("");
		if (this.charsTyped.length > 0) this.charsTyped = this.charsTyped.substring(0, this.charsTyped.length-1); 
		evt.stop(); // do not use for browser navigation
		return true;
	},




	onKeyPress: function(evt) {
		if (!this.acceptInput)
			return true;

		// Opera fix: evt.stop in onKeyPress does not seem to work
		var c = evt.getKeyCode()
		if (c === Event.KEY_BACKSPACE || c === Event.KEY_RETURN || c === Event.KEY_TAB) {
			evt.stop();
			return true;
		}
			
		
		if (!evt.isMetaDown()) {
			this.replaceSelectionfromKeyboard(evt.getKeyChar()); 
			evt.stop(); // done
			return true;
		}
		
		return false;
	},
	
	replaceSelectionfromKeyboard: function(replacement) {
		if (!this.acceptInput) return;		  

		if (this.typingHasBegun)  this.charsTyped += replacement;
			else  this.charsTyped = replacement;

		this.replaceSelectionWith(replacement);
		// Note:  typingHasBegun will get reset here by replaceSelection

		this.typingHasBegun = true;	 // For undo and select-all commands		
	},
	
	modifySelectedLines: function(modifyFunc) {
		// this function calls modifyFunc on each line that is selected
		// modifyFunc can somehow change the line
		// the selection grows/shrinks with the modifications
		var lines = this.getSelectionString().split('\n')
		// remember old sel because replace sets null selection
		var start = this.selectionRange[0], end = this.selectionRange[1]+1, addToSel = 0;
		for (var i = 0; i < lines.length; i++) {
			var result = modifyFunc(lines[i], i);
			var lengthDiff = result.length - lines[i].length;
			addToSel += lengthDiff;
			lines[i] = result;
		}
		var replacement = lines.join('\n');
		this.replaceSelectionWith(replacement);
		this.setSelectionRange(start, end + addToSel);
	},
	
	doCut: function() {
		TextMorph.clipboardString = this.getSelectionString(); 
		this.replaceSelectionWith("");
	},

	doCopy: function() {
		TextMorph.clipboardString = this.getSelectionString(); 
	},

	doPaste: function() {
		if (TextMorph.clipboardString) {
			var cleanString = TextMorph.clipboardString.replace(/\r\n/g, "\n");
			this.replaceSelectionfromKeyboard(cleanString);
		}
	},
	
	doSelectAll: function(fromKeyboard) {
		if (fromKeyboard && this.typingHasBegun) { // Select chars just typed
			this.setSelectionRange(this.selectionRange[0] - this.charsTyped.length, this.selectionRange[0]);
		} else { // Select All
			this.setSelectionRange(0, this.textString.length); 
		}
	},

	doMore: function() {
		if (this.charsReplaced) {
			this.searchForFind(this.charsReplaced, this.selectionRange[0]);
			if (this.getSelectionString() != this.charsReplaced) return;
			var holdChars = this.charsReplaced;	 // Save charsReplaced
			this.replaceSelectionWith(this.charsTyped); 
			this.charsReplaced = holdChars ;  // Restore charsReplaced after above
		}
	},

	doExchange: function() {
		var sel1 = this.selectionRange;
		var sel2 = this.previousSelection;

		var d = 1;	// direction current selection will move
		if (sel1[0] > sel2[0]) {var t = sel1; sel1 = sel2; sel2 = t; d = -1} // swap so sel1 is first
		if (sel1[1] >= sel2[0]) return; // ranges must not overlap

		var fullText = (this.textStyle) ? this.getRichText() : this.textString;
		var txt1 = fullText.substring(sel1[0], sel1[1]+1);
		var txt2 = fullText.substring(sel2[0], sel2[1]+1);
		var between = fullText.substring(sel1[1]+1, sel2[0]);

		var d1 = (txt2.size() + between.size());  // amount to move sel1
		var d2 = (txt1.size() + between.size());  // amount to move sel2
		var newSel = [sel1[0]+d1, sel1[1]+d1];
		var newPrev = [sel2[0]-d2, sel2[1]-d2];
		if (d < 0) { var t = newSel;  newSel = newPrev;	 newPrev = t; }
		var replacement = txt2.concat(between.concat(txt1));
		this.setSelectionRange(sel1[0], sel2[1]+1);	 // select range including both selections
		this.replaceSelectionWith(replacement);	 // replace by swapped text
		this.setSelectionRange(newSel[0], newSel[1]+1);
		this.previousSelection = newPrev;
		this.undoSelectionRange = d>0 ? sel1 : sel2;
	},

	doFind: function() {
		this.world() && this.world().prompt("Enter the text you wish to find...", 
			function(response) {
				return this.searchForFind(response, this.selectionRange[1]);
			}.bind(this),
			this.lastSearchString);
	},

	doFindNext: function() {
		if (this.lastSearchString)
		this.searchForFind(this.lastSearchString, this.lastFindLoc + this.lastSearchString.length);
	},
	
	doSearch: function() {
		var whatToSearch = this.getSelectionString();
		if (lively.Tools.SourceControl) {
			lively.Tools.SourceControl.browseReferencesTo(whatToSearch);
			return;
		};
		var msg = 'No SourceControl available.\nStart SourceControl?';
		WorldMorph.current().confirm(msg, function(answer) {
			if (!answer) return;
			require('lively.ide').toRun(function(unused, ide) {
				ide.startSourceControl().browseReferencesTo(whatToSearch);
			});
		});
	},
	
	doInspect: function() {
		console.log("do inspect")
		var s = this.pvtStringAndOffsetToEval();
		try {
			var inspectee = this.tryBoundEval(s.str, s.offset);
		} catch (e) {
			console.log("eval error in doInspect " + e)
		};
		if (inspectee) {
			try {
				new SimpleInspector(inspectee).openIn(this.world(), this.world().hands.first().getPosition())
			} catch(e) {
				this.setStatusMessage("could not open inspector on " + inspectee);
				console.log("Error during opending an inspector:"+ e);
			}
		}
	},
	
	pvtStringAndOffsetToEval: function() {
		var strToEval = this.getSelectionString(); 
		var offset = this.selectionRange[0];
		if (strToEval.length == 0) {
			strToEval = this.pvtCurrentLineString();
			offset = this.pvtCurrentLine().startIndex;
		}
		return {str: strToEval, offset: offset}
	},
	
	doDoit: function() {
		var s = this.pvtStringAndOffsetToEval();
		this.tryBoundEval(s.str, s.offset);
	},

	// eval selection or current line if selection is emtpy
	doPrintit: function() {
		var s = this.pvtStringAndOffsetToEval();
		this.tryBoundEval(s.str, s.offset, true);
		// this.replaceSelectionWith(" " + result);
		// this.setSelectionRange(prevSelection, prevSelection + result.length + 1);
	},

	doSave: function() {
		this.saveContents(this.textString); 
		this.hideChangeClue();
	},

	tryBoundEval: function (str, offset, printIt) {
		var result;
		try { 
			result = this.boundEval(str);
			if (printIt) {
				this.setNullSelectionAt(this.selectionRange[1] + 1);
				var prevSelection = this.selectionRange[0];
				var replacement = " " + result
				this.replaceSelectionWith(replacement);
				this.setSelectionRange(prevSelection, prevSelection + replacement.length);
			}
		} catch (e) {

			offset = offset || 0;
			var msg = "" + e + "\n" + 
				"Line: " + e.line + "\n" +
				(e.sourceURL ? ("URL: " + (new URL(e.sourceURL).filename()) + "\n") : "");
			if (e.stack) {
				// make the stack fit into status window
				var prefix = (new URL(Config.codeBase)).withRelativePartsResolved().toString()
				msg += e.stack.replace(new RegExp(prefix, "g"),"");
			}

			var world = WorldMorph.current();
			if (!world) {
				console.log("Error in " +this.id() + " bound eval: \n" + msg)
				return
			};

			world.setStatusMessage(
				msg,  
				Color.red, 5,
				function() {
					require('lively.Helper').toRun(function() { 
						alert('There was an errror\n' + printObject(e))
					})
				},
				{fontSize: 12, fillOpacity: 1}
			)
			if (e.expressionEndOffset) {
				// console.log("e.expressionBeginOffset " + e.expressionBeginOffset + "  offset=" + offset)
				this.setSelectionRange(e.expressionBeginOffset + offset, e.expressionEndOffset + offset);
			} else if (e.line) {
				var lineOffset = this.lineNumberForIndex(offset);
				// console.log("line: " + e.line + " offset: " + lineOffset)
				var line = this.lines[e.line + lineOffset - 1]
				if (line && line.startIndex) {
					// console.log(" set to  " + line.startIndex)
					this.setSelectionRange(line.startIndex, line.getStopIndex());
				}
			}
			this.setStatusMessage("" + e, Color.red); 
		}	
		return result;
	},

	doHelp: function() {
		WorldMorph.current().notify("Help is on the way...\n" +
		"...but not today.");
	},

	doUndo: function() {
		if (this.undoTextString) {
			var t = this.selectionRange;
			this.selectionRange = this.undoSelectionRange;
			this.undoSelectionRange = t;
			t = this.textString;
			this.setTextString(this.undoTextString);
			this.undoTextString = t;
		}
		if (this.undoTextStyle) {
			t = this.textStyle;
			this.textStyle = this.undoTextStyle;
			this.undoTextStyle = t;
		}
	},

	processCommandKeys: function(evt) {	 //: Boolean (was the command processed?)
		var key = evt.getKeyChar();
		// console.log('command ' + key);

		// ARRGH FIXME
		if (key == 'I' && evt.isShiftDown()) {
			this.doInspect(); return true; // Inspect
		};
		if (key == 'F' && evt.isShiftDown()) {
			this.doSearch(); return true; // (search in system source code), alternative for w
		};


		if (key) key = key.toLowerCase();
		switch (key) {
			case "a": { this.doSelectAll(true); return true; } // SelectAll
			case "x": { this.doCut(); return true; } // Cut
			case "c": { this.doCopy(); return true; } // Copy
			case "v": { this.doPaste(); return true; } // Paste
			case "m": { this.doMore(); return true; } // More (repeat replacement)
			case "e": { this.doExchange(); return true; } // Exchange
			case "f": { this.doFind(); return true; } // Find
			case "g": { this.doFindNext(); return true; } // Find aGain
			// case "w": { this.doSearch(); return true; } // Where (search in system source code)  // commented out because I want to close the window with cmd-w -- Adam
			case "d": { this.doDoit(); return true; } // Doit
			case "p": { this.doPrintit(); return true; } // Printit
			case "s": { this.doSave(); return true; } // Save

			// Typeface
			case "b": { this.emphasizeBoldItalic({style: 'bold'}); return true; }
			case "i": { this.emphasizeBoldItalic({style: 'italic'}); return true; }

			// Font Size
			// rk: prevents curly/square brackets on german keyboards
			// case "4": { this.emphasizeSelection({size: (this.fontSize*0.8).roundTo(1)}); return true; }
			// case "5": { this.emphasizeSelection({size: (this.fontSize*1).roundTo(1)}); return true; }
			// case "6": { this.emphasizeSelection({size: (this.fontSize*1.2).roundTo(1)}); return true; }
			// case "7": { this.emphasizeSelection({size: (this.fontSize*1.5).roundTo(1)}); return true; }
			// case "8": { this.emphasizeSelection({size: (this.fontSize*2.0).roundTo(1)}); return true; }

			// Text Alignment
			/* I don't understand why these are causing me trouble, but they are. I keep
			   hitting Cmd-r, intending to refresh the page, but instead the whole morph
			   disappears for some reason. -- Adam
			case "l": { this.emphasizeSelection({align: 'left'}); return true; }
			case "r": { this.emphasizeSelection({align: 'right'}); return true; }
			case "h": { this.emphasizeSelection({align: 'center'}); return true; }
			case "j": { this.emphasizeSelection({align: 'justify'}); return true; }
			*/

			case "u": { this.linkifySelection(evt); return true; }	// add link attribute
			case "o": { this.colorSelection(evt); return true; }  // a bit of local color

			case "z": { this.doUndo(); return true; }  // Undo
		}

		switch(evt.getKeyCode()) {
			// Font Size
			case 189/*alt+'+'*/: { this.emphasizeSelection({size: (this.fontSize*=0.8).roundTo(1)}); return true; }
			case 187/*alt+'-'*/: { this.emphasizeSelection({size: (this.fontSize*=1.2).roundTo(1)}); return true; }
			// indent/outdent selection
			case 221/*cmd+]*/: { this.indentSelection(); evt.stop(); return true }
			case 219/*cmd+]*/: { this.outdentSelection(); evt.stop(); return true }
			// comment/uncoment selection
			case 191 /*cmd+/*/: { this.addOrRemoveComment(); return true }
		}

		return false;
	},

	detectTextStyleInRange: function(range, styleName) {
		return this.textStyle.slice(range[0], range[1]).values.detect(function(ea){return ea[styleName]});
	},

	linkifySelection: function(evt) {
		var oldLink = ""
		if (this.textStyle) {
			var linkStyle = this.detectTextStyleInRange(this.selectionRange, 'link');
			if (linkStyle) {
				oldLink = linkStyle.link;
			}
		};
		this.world().prompt("Enter the link...",
				function(response) {
					/*if (!response.startsWith('http://'))
						response = URL.source.notSvnVersioned().withFilename(response).toString();*/
					this.emphasizeSelection( {color: "blue", link: response} );
				}.bind(this),oldLink);
	},

	colorSelection: function(evt) {
		var colors = ['black', 'brown', 'red', 'orange', 'yellow', 'green', 'blue', 'violet', 'gray', 'white'];
		var items = colors.map( function(c) {return [c, this, "setSelectionColor", c] }.bind(this));
		new MenuMorph(items, this).openIn(this.world(), evt.hand.position(), false, "Choose a color for this selection");
	},

	setSelectionColor: function(c, evt) {
		// Color parameter can be a string like 'red' or an actual color
		var color = c;
		if (c == 'brown') color = Color.orange.darker();
		if (c == 'violet') color = Color.magenta;
		if (c == 'gray') color = Color.darkGray;
		this.emphasizeSelection( {color: color} );
		this.requestKeyboardFocus(evt.hand);
	},
	
	indentSelection: function() {
		var tab = '\t';
		this.modifySelectedLines(function(line) { return line.length == 0 ? line : tab + line });
	},
	
	outdentSelection: function() {
		var tab = '\t', space = ' ';
		this.modifySelectedLines(function(line) {
			return (line.startsWith(space) || line.startsWith(tab)) ? line.substring(1,line.length) : line
		});
	},
	
	addOrRemoveComment: function() {
		var commentRegex = /^(\s*)(\/\/\s*)(.*)/;
		var spacesRegex = /^(\s*)(.*)/;
		var noSelection = this.hasNullSelection();

		if (noSelection) { // select the current line
			var line = this.pvtCurrentLine();
			this.startSelection(line.startIndex);
			this.extendSelection(line.getStopIndex());
		}

		this.modifySelectedLines(function(line) {
			var commented = commentRegex.test(line);
			if (commented)
				return line.replace(commentRegex, '$1$3')
			return line.replace(spacesRegex, '$1// $2')
		});
	},
	
	pvtCurrentLine: function() {
		var lineNumber =  this.lineNumberForIndex(this.selectionRange[1]);
		if (lineNumber == -1) lineNumber = 0; 
		return this.lines[lineNumber];
	},

	pvtCurrentLineString: function() {
		var line = this.pvtCurrentLine();
		return String(this.textString.substring(line.startIndex, line.getStopIndex() + 1));		 
	},
	
	// setFill: function(fill) {
	//    this.shape.setFill(fill);
	// },
});

TextMorph.addMethods({
	
	extendSelection: function(charIx) {
		if (charIx < 0) return;
		this.setSelectionRange(this.selectionPivot, charIx);
	},

	getCursorPos: function() {
		if (this.hasNullSelection())
			return this.selectionRange[0];
		if (this.selectionPivot === this.selectionRange[1]+1)
			return this.selectionRange[0]; // selection expands left
		if (this.selectionPivot === this.selectionRange[0])
			return this.selectionRange[1]+1; // selection expands right
		if (this.selectionPivot < this.selectionRange[1]+1 && this.selectionPivot > this.selectionRange[0])
			return this.selectionRange[0]; // selection pivot in middle of sel
		// console.log('Can\'t find current position in text');
		return this.selectionRange[0];
	},

});

Object.extend(TextMorph, {
	
	fromLiteral: function(literal) {
		var morph = new TextMorph(new Rectangle(0,0,0,0), literal.content || "");
		literal.textColor && morph.setTextColor(literal.textColor);
		literal.label && morph.beLabel();
		return morph;
	}


});
	
TextMorph.addMethods({ // change clue additions

	addChangeClue: function(useChangeClue) {
		if (!useChangeClue) return;
		this.changeClue = Morph.makeRectangle(1,1,5,5);
		this.changeClue.setBorderWidth(0);
		this.changeClue.setFill(Color.red);
		this.changeClue.ignoreEvents();
		this.changeClue.ignoreWhenCopying = true;
	},

	showChangeClue: function() {
		if (!this.changeClue) return;
		this.addMorph(this.changeClue);
	},

	hideChangeClue: function() {
		if (!this.changeClue) return;
		this.changeClue.remove();
	},

	hasUnsavedChanges: function() {
		// FIXME just another hack...
		return this.submorphs.include(this.changeClue);
	}
});

// TextMorph accessor functions
TextMorph.addMethods({

	emphasizeSelection: function(emph) {
		if (this.hasNullSelection()) return;
		this.emphasizeFromTo(emph, this.selectionRange[0], this.selectionRange[1]);
	},

	emphasizeBoldItalic: function(emph) {
		// Second assertion of bold or italic *undoes* that emphasis in the current selection
		if (this.hasNullSelection()) return;
		var currentEmphasis = this.getSelectionText().style.values[0];	// at first char
		if (currentEmphasis.style == null) return this.emphasizeSelection(emph);
		if (emph.style == 'bold' && currentEmphasis.style.startsWith('bold')) return this.emphasizeSelection({style: 'unbold'});
		if (emph.style == 'italic' && currentEmphasis.style.endsWith('italic')) return this.emphasizeSelection({style: 'unitalic'});
		this.emphasizeSelection(emph);
	},

	emphasizeAll: function(emph) {
		this.emphasizeFromTo(emph, 0, this.textString.length);
	},

	emphasizeFromTo: function(emph, from, to) {
		var txt = new lively.Text.Text(this.textString, this.textStyle);
		txt.emphasize(emph, from, to);
		this.textStyle = txt.style;
		this.composeAfterEdits();
	},

	pvtUpdateTextString: function(replacement, replacementHints) {
		// tag: newText
		// Note:  -delayComposition- is now ignored everyhere
		replacement = replacement || "";
		replacement 	
		if(!this.typingHasBegun) { 
			// Mark for undo, but not if continuation of type-in
			this.undoTextString = this.textString;
			this.undoSelectionRange = this.selectionRange;
			if (this.textStyle) this.undoTextStyle = this.textStyle.clone();
		}
		// DI: Might want to put the maxSafeSize test in clients
		dbgOn(!replacement.truncate);
		this.textString = replacement.truncate(this.maxSafeSize);
		this.composeAfterEdits(replacementHints);
	},
	
	composeAfterEdits: function(replacementHints) {
		// tag: newText
		var oneLiner = (this.lines == null) || (this.lines.length <= 1)

		// this.changed();	// Needed to invalidate old bounds in canvas
		// But above causes too much to happen; instead just do...
		this.invalidRect(this.innerBounds());  // much faster

		this.layoutChanged(); 

		// Note: renderAfterReplacement will call bounds pre-emptively to avoid re-rendering
		if (replacementHints) this.renderAfterReplacement(replacementHints);
			else this.lines = null;
		this.changed();	 // will cause bounds to be called, and hence re-rendering
		if (oneLiner) this.bounds();  // Force a redisplay
	},
	
	setStatusMessage: function(msg, color, delay) {
		console.log("status: " + msg)
		if (!this._statusMorph) {
			this._statusMorph = new TextMorph(pt(300,30).extentAsRectangle());
			this._statusMorph.applyStyle({borderWidth: 0, fill: Color.gray, fontSize: 16, fillOpacity: 1})
		}
		var statusMorph = this._statusMorph;
		statusMorph.textString = msg;
		this.world().addMorph(statusMorph);
		statusMorph.setTextColor(color || Color.black);
		statusMorph.ignoreEvents();
		try {
			var bounds = this.getCharBoundsWithoutCopying(this.selectionRange[0]);
			if (bounds) {
				var pos = bounds.bottomLeft();
			} else {
				pos = pt(0, 20);
			}
			statusMorph.setPosition(this.worldPoint(pos));
		} catch(e) {
			statusMorph.centerAt(this.worldPoint(this.innerBounds().center()));
			console.log("problems: " + e)
		};
		(function() { 
			// console.log("remove status")
			statusMorph.remove() }).delay(delay || 4);
	},
	
	pvtPositionInString: function(lines, line, linePos) {
		var pos = 0;
		for(var i=0; i < (line - 1); i++) {
			pos = pos + lines[i].length + 1
		}
		return pos + linePos
	},
		
	saveContents: function(contentString) {
		this.savedTextString = contentString;
		if (!this.modelPlug && !this.formalModel && !this.noEval) {
			this.tryBoundEval(contentString);
			this.world().changed(); 
			return; // Hack for browser demo
		} else if (!this.autoAccept) {
			this.setText(contentString, true);
	   }
	},

	acceptChanges: function() {	   
		this.textBeforeChanges = this.textString; 
	},
	
	boundEval: function(str) {	  
		// Evaluate the string argument in a context in which "this" may be supplied by the modelPlug
		var ctx = this.getDoitContext() || this;
		return (interactiveEval.bind(ctx))(str);
	},
	
	addOrRemoveBrackets: function(bracketIndex) {
		var left = this.locale.charSet.leftBrackets[bracketIndex];
		var right = this.locale.charSet.rightBrackets[bracketIndex];
		
		if (bracketIndex == 0) { left = "/*"; right = "*/"; }
	
		var i1 = this.selectionRange[0];
		var i2 = this.selectionRange[1];
		
		if (i1 - left.length >= 0 && this.textString.substring(i1-left.length,i1) == left &&
			i2 + right.length < this.textString.length && this.textString.substring(i2+1,i2+right.length+1) == right) {
			// selection was already in brackets -- remove them
			var before = this.textString.substring(0,i1-left.length);
			var replacement = this.textString.substring(i1,i2+1);
			var after = this.textString.substring(i2+right.length+1,this.textString.length);
			this.setTextString(before.concat(replacement,after));
			this.setSelectionRange(before.length,before.length+replacement.length); 
		} else { // enclose selection in brackets
			var before = this.textString.substring(0,i1);
			var replacement = this.textString.substring(i1,i2+1);
			var after = this.textString.substring(i2+1,this.textString.length); 
			this.setTextString(before.concat(left,replacement,right,after));
			this.setSelectionRange(before.length+left.length,before.length+left.length+replacement.length); 
		}
	},
	
	getFontFamily: function() {
		return this.font.getFamily();
	},
	
	setFontFamily: function(familyName) {
		this.fontFamily = familyName;
		this.font = thisModule.Font.forFamily(this.fontFamily, this.fontSize);
		this.layoutChanged();
		this.changed();
	},
	
	getFontSize: function() { return this.fontSize; },

	setFontSize: function(newSize) {
		if (newSize == this.fontSize && this.font)	// make sure this.font is inited
			return this; // make it return this -- Adam
		this.fontSize = newSize;
		this.font = thisModule.Font.forFamily(this.fontFamily, newSize);
		this.padding = Rectangle.inset(newSize/2 + 2, newSize/3);
		this.layoutChanged();
		this.changed();
		return this; // added by Adam
	},
	
	pvtReplaceBadControlCharactersInString: function(string) {
		var allowedControlCharacters = "\n\t\r"
		return $A(string).collect(function(ea){
			if (allowedControlCharacters.include(ea))
				return ea;
			if (ea.charCodeAt(0) < 32)	
				return '?'
			else		
				return ea }).join('')
	},

	setTextString: function(replacement, replacementHints) {
		replacement = this.pvtReplaceBadControlCharactersInString(replacement);
		if (Object.isString(replacement)) replacement = String(replacement); 
		if (this.autoAccept) this.setText(replacement);
		this.pvtUpdateTextString(replacement, replacementHints);
	},
	
	updateTextString: function(newStr) {
		this.pvtUpdateTextString(newStr);
		this.resetScrollPane(); 
	},
	
	resetScrollPane: function() {
		var sp = this.enclosingScrollPane();
		if (sp) {
			sp.scrollToTop();
		}
	},
	
	scrollSelectionIntoView: function() { 
		var sp = this.enclosingScrollPane();
		if (! sp) return;
		var selRect = this.getCharBoundsWithoutCopying(this.selectionRange[this.hasNullSelection() ? 0 : 1]);
    if (!selRect) { return; } // added by Adam, not sure it's right
    
    // added the scaling code -- Adam
    var scale = this.getScale();
    var scaledSelRect = new Rectangle(selRect.x * scale, selRect.y * scale, selRect.width * scale, selRect.height * scale);
    sp.scrollRectIntoView(scaledSelRect);
	},
	
	enclosingScrollPane: function() { 
		// Need a cleaner way to do this
		if (! (this.owner instanceof ClipMorph)) return null;
		var sp = this.owner.owner;
		if (! (sp instanceof ScrollPane)) return null;
		return sp;
	},

	onTextUpdate: function(string) {
		this.updateTextString(string);
		this.textBeforeChanges = string;
		this.hideChangeClue();
	},

	onSelectionUpdate: function(string) {
		this.searchForFind(string, 0);
	},
	
	updateView: function(aspect, controller) {
		var p = this.modelPlug;
		if (!p) return;

		if (aspect == p.getText	 || aspect == 'all') {
			this.onTextUpdate(this.getText());
		} else if (aspect == p.getSelection || aspect == 'all') {
			this.onSelectionUpdate(this.getSelection());
		}
	},
	
	onHistoryCursorUpdate: Functions.Empty,

	onHistoryUpdate: Functions.Empty,

	searchForFind: function(str, start) {
		this.requestKeyboardFocus(this.world().firstHand());
		var i1 = this.textString.indexOf(str, start);
		if (i1 < 0) i1 = this.textString.indexOf(str, 0); // wrap
		if (i1 >= 0) this.setSelectionRange(i1, i1+str.length);
		else this.setNullSelectionAt(0);
		this.lastSearchString = str;
		this.lastFindLoc = i1;
	}
	
});

Object.extend(TextMorph, {
	makeLabel: function(labelString, styleIfAny) {
		var label = new TextMorph(new Rectangle(0,0,200,100), labelString);
		label.beLabel(styleIfAny);
		return label;
	}
});

TextMorph.subclass('PrintMorph', {
    documentation: "TextMorph that converts its model value to string using toString(), and from a string using eval()",
    precision: 2,

    updateView: function(aspect, controller) {
        var p = this.modelPlug;
	if (!p) return;
        if (aspect == p.getValue || aspect == 'all') this.onValueUpdate(this.getValue());
    },

    onValueUpdate: function(value) {
	this.onTextUpdate(this.formatValue(value));
    },
    
    getValue: function() {
	if (this.formalModel && this.formalModel.getValue) return this.formalModel.getValue();
	else return this.getModelValue("getValue");
    },

    setValue: function(value) {
	if (this.formalModel && this.formalModel.setValue) 
	    return this.formalModel.setValue(value);
	else return this.setModelValue("setValue", value);
    },

    // overridable
    formatValue: function(value) {
	if (value && Object.isNumber(value.valueOf())) return String(value.toFixed(this.precision));
	else return value.toString();
    },
    
    getText: function() {
	return this.formatValue(this.getValue());
    },
    
    setText: function(newText) {
	var result = String(eval(newText));  // exceptions?
	return this.setValue(result);
    }

});

TextMorph.subclass('TestTextMorph', {
    // A class for testing TextMorph composition, especially hit, charOfPoint and getCharBounds
    // Set Config.showTextText = true, and then scale up the Pen.script by about 2x
    // It creates a rectangle at mouseDown, and then
    // while the mouse moves, it prints the index of the nearest character,
    // and adjusts the rectangle to display the bounds for that index.

    onMouseDown: function(evt) {
        this.isSelecting = true;
        this.boundsMorph = Morph.makeRectangle(0, 0, 0, 0);
	this.boundsMorph.applyStyle({fill: null, borderColor: Color.red});
        this.addMorph(this.boundsMorph);
        this.requestKeyboardFocus(evt.hand);
        this.track(evt);
        return true; 
    },
    track: function(evt) {
        var localP = this.localize(evt.mousePoint);
        var tl = this.textTopLeft();
        var px = Math.max(localP.x, tl.x); // ensure no returns of 0 left of bounds
        var px = Math.min(px, this.innerBounds().maxX());
        var py = localP.y - 2;
        var hit = this.hit(px, py);
        var charIx = this.charOfPoint(localP);
        console.log('localP = ' + localP + ' hit = ' + hit + ' charOfPoint = ' + charIx);  // display the index for the mouse point
        var jRect = this.getCharBounds(hit);
        if (jRect == null) {
            console.log("text box failure in drawSelection"); 
            return; 
        }
        console.log('rect = ' + jRect);
        this.boundsMorph.setBounds(jRect);  // show the bounds for that character
    },
    onMouseMove: function($super, evt) {  
        if (!this.isSelecting) return $super(evt);
        this.track(evt);
    },
    onMouseUp: function(evt) {
        this.isSelecting = false;
        this.boundsMorph.remove();
    }
});

BoxMorph.subclass('LabeledTextMorph', {

    documentation: "Morph that contains a small label and a TextMorph. Clips when TextMorphs grows larger than maxExtent",
    labelOffset: pt(5, 1),
    maxExtent: pt(500, 400),
    
    initialize: function($super, rect, labelString, textString, maxExtent) {
        $super(rect);
        if (maxExtent) this.maxExtent = maxExtent;
        
        /* configure the label */
        var label = new TextMorph(this.labelOffset.asRectangle(), labelString);
        label.beLabel({fontSize: 11, fill: Color.veryLightGray, padding: Rectangle.inset(1)});
        label.setBounds(label.bounds()); // set the bounds again, when padding is changed, otherwise they would be wrong
        this.addMorphFront(label);
        
        /* configure the text */
        var textPos = pt(0,label.getExtent().y/2);
        var text = new TextMorph(textPos.extent(rect.extent()), textString);
        text.applyStyle({wrapStyle: thisModule.WrapStyle.Normal, borderColor: Color.veryLightGray.darker().darker(),
                         padding: text.padding.withY(label.bounds().height / 2)});
        this.addMorphBack(text);
        text.composeAfterEdits = text.composeAfterEdits.wrap(function(proceed) {
            proceed();
            if (this.textHeight() < this.maxExtent().y) this.setToTextHeight(); // grow with the textMorph
            //else this.clipToShape();
        }.bind(this));
        
        
        /* configure this*/
        this.applyStyle({borderWidth: 0, fill: Color.veryLightGray});        
        this.label = label;
        this.text = text;
        [this, this.label, this.text].forEach(function() {
            this.suppressHandles = true;
            this.closeDnD();
        }, this);
        this.setExtent(textPos.addPt(text.getExtent())); // include the padding in own size
    },

    maxExtent: function() {
        return this.owner ? this.owner.innerBounds().extent() : this.maxExtent;
    },
    
    reshape: function($super, partName, newPoint, lastCall) {
        var priorPosition = this.getPosition();
        var priorExtent = this.getExtent();
	var result = $super(partName, newPoint, lastCall);
        if (lastCall && this.textHeight() < this.getExtent().y) this.setToTextHeight();
        var moveBy = this.getPosition().subPt(priorPosition);
        var extendBy = this.getExtent().subPt(priorExtent);
        this.label.setPosition(this.label.getPosition().addPt(moveBy));
        this.text.setPosition(this.text.getPosition().addPt(moveBy));
        this.text.setExtent(this.text.getExtent().addPt(extendBy));
	return result;
    },
    
    textHeight: function() {
        return this.label.getExtent().y/2 + this.text.getExtent().y;
    },
    
    setToTextHeight: function() {
        // FIXME minPt with maxExtent
        this.shape.setBounds(this.shape.bounds().withHeight(this.textHeight()));  
    },
     
    innerMorph: function() {
        return this.text;
    },
    
    adoptToBoundsChange: function(ownerPositionDelta, ownerExtentDelta) {
        var oldE = this.innerMorph().getExtent();
        this.innerMorph().setExtent(this.innerMorph().getExtent().addPt(ownerExtentDelta));
        var newE = this.innerMorph().getExtent();
        this.setExtent(this.getExtent().addPt(ownerExtentDelta.withY(0))); // only set width
        this.setToTextHeight();
        this.setPosition(this.getPosition().addPt(ownerPositionDelta));
    }
});

Object.subclass('RunArray', {
	// A run-coded array for storing text emphasis codes
	initialize: function(runs, vals) {
		this.runs = runs;  // An array with the length of each run
		this.values = vals;   // An array with the value at each run (an emphasis object)
		this.lastIndex = 0;  // A cache that allows streaming in linear time
		this.lastRunIndex = 0;  // Run index corresponding to lastIndex
	},

	valueAt: function(index) {
		var m = this.markAt(index);
		return this.values[m.runIndex];
	},

	runLengthAt: function(index) {
		var m = this.markAt(index);
		return this.runs[m.runIndex] - m.offset;
	},

	markAt: function(index) {
		// Returns a 'mark' with .runIndex and .offset properties
		// Cache not loaded, or past index -- start over
		var runIndex = 0;
		var offset = index;
		if (this.lastIndex && this.lastIndex <= index) {
			// Cache loaded and before index -- start there
			runIndex = this.lastRunIndex;
			offset = index-this.lastIndex;
		}
		while (runIndex < this.runs.length-1 && offset >= this.runs[runIndex]) {
			offset = offset - this.runs[runIndex];
			runIndex ++;
		}
		// OK, we're there.  Cache this state and call the function
		this.lastRunIndex = runIndex;
		this.lastIndex = index - offset;
		//console.log("index = " + index + "; runIndex = " + runIndex + "; offset = " + offset);
		//console.log("this.lastRunIndex = " + this.lastRunIndex + "; this.lastIndex  = " + this.lastIndex);
		return {runIndex: runIndex, offset: offset};
	},

	slice: function(start, beyondStop) {  // Just like Array.slice()
		var stop = beyondStop-1;
		// return the subrange from start to stop
		if (stop < start) return new RunArray([0], [null]);
		// Added "var" so that mStart and mStop and newRuns won't be globals. -- Adam
		var mStart = this.markAt(start);
		var mStop = this.markAt(stop);
		var newRuns;
		if (mStart.runIndex == mStop.runIndex) {
			newRuns = [mStop.offset - mStart.offset +1];
		} else {
			newRuns = this.runs.slice(mStart.runIndex, mStop.runIndex+1);
			newRuns[0] -= mStart.offset;
			newRuns[newRuns.length-1] = mStop.offset + 1;
		}
		return new RunArray(newRuns, this.values.slice(mStart.runIndex, mStop.runIndex + 1));
	},

	substring: function(start, beyondStop) {  // echo string protocol
		return this.slice(start, beyondStop);
	},

	concat: function(other) {  // Just like Array.concat()
		if (other.empty()) return new RunArray(this.runs, this.values);
		if (this.empty()) return new RunArray(other.runs, other.values);
		if (!this.equalValues(this.valueAt(this.length()-1),  other.valueAt(0))) {
			// DI: above test faster if use values directly
			// values differ at seam, so it's simple...
			return new RunArray(this.runs.concat(other.runs),
			this.values.concat(other.values));
		}
		var newValues = this.values.concat(other.values.slice(1));
		var newRuns = this.runs.concat(other.runs.slice(1));
		newRuns[this.runs.length-1] = this.runs[this.runs.length-1] + other.runs[0];
		return new RunArray(newRuns, newValues);
	},

	asArray: function() {
		var result = new Array(this.length());
		for (var i = 0; i<this.length(); i++) result[i] = this.valueAt(i);
		return result;
	},

	length: function() {
		var len = 0;
		this.runs.forEach(function(runLength) { len += runLength; });
		return len;
	},

	clone: function() {
		// OK to share vecause we never store into runs or values
		return new RunArray(this.runs, this.values);
	},
	empty: function() {
		return this.runs.length == 1 && this.runs[0] == 0;
	},

	mergeStyle: function(emph, start, stop) {
		// Note stop is end index, not +1 like slice
		if (start == null) return this.mergeAllStyle(emph);
		var newRun = this.slice(start, stop+1).mergeAllStyle(emph);
		if (start > 0) newRun = this.slice(0, start).concat(newRun);
		if (stop < this.length()-1) newRun = newRun.concat(this.slice(stop+1, this.length()));
		return newRun.coalesce();
	},
    
	mergeAllStyle: function(emph) {
		// Returns a new runArray with values merged with emph throughout
		var newValues = this.values.map(function(each) {return emph.merge(each); });
		// Note: this may cause == runs that should be coalesced
		// ...but we catch most of these in mergeStyle
		return new RunArray(this.runs, newValues).coalesce();
	},

	coalesce: function() {
		// Returns a copy with adjacent equal values coalesced
		// Uses extra slice to copy arrays rather than alter in place
		var runs = this.runs.slice(0);  // copy because splice will alter
		var values = this.values.slice(0);  // ditto
		var i = 0;
		while (i < runs.length-1) {
			if (this.equalValues(values[i], values[i+1]) ) {
				values.splice(i+1,1);
				var secondRun = runs[i+1];
				runs.splice(i+1,1);
				runs[i] += secondRun;
			} else i++;
		}
		return new RunArray(runs, values);
	},
    
	equalValues: function(s1, s2) {
		// values are style objs like {style: 'bold', fontSize: 14}
		if (typeof s1 == "number" && typeof s2 == "number") return s1 == s2;  // used for testing
		var match = true;
		Properties.forEachOwn(s1, function(p, v) {match = match && s2[p] == v});
		if (! match) return false;
		// Slow but sure...
		Properties.forEachOwn(s2, function(p, v) {match = match && s1[p] == v});
		return match;
	},

    toString: function() {
		return "runs = " + this.runs + ";  values = " + this.values;
    },

    toLiteral: function() {
		return {runs: this.runs.clone(), values: this.values.clone() }
    }
});

Object.extend(RunArray, {

    fromLiteral: function(literal) {
		return new RunArray(literal.runs, literal.values);
    },

	test: function(a) {
		var ra = new RunArray(a, a); // eg [3, 1, 2], [3, 1, 2]
		console.log("RunArray test for " + ra + " = " + ra.asArray());
		for (var i = 0; i < ra.length(); i++) {
			var m = ra.markAt(i);
			// console.log(i + ":  run = " + m.runIndex + ", offset = " + m.offset);
		}
		for (var i = 0; i <= ra.length(); i++) {
			// break into all possible pairs, join them, and check
			var ra1 = ra.slice(0, i);
			var ra2 = ra.slice(i, ra.length());
			var ra3 = ra1.concat(ra2);
			// console.log(i + ": " + ra1 + " || " + ra2 + " = " + ra3);
			for (var j = 0; i <= ra.length(); i++) {
				if (ra3.valueAt(j) != ra.valueAt(j)) console.log("***RunArray failing test***");
			}
		}
	}
});
//RunArray.test([3, 1, 2]);

    
Object.subclass('lively.Text.Text', {
    // Rich text comes to the Lively Kernel
	initialize: function(string, style) {
		this.string = string;
		if (style) {
			if (style instanceof TextEmphasis) this.style = new RunArray([string.length], [style]);
			else if (style instanceof RunArray) this.style = style;
			else this.style = new RunArray([string.length], [new TextEmphasis(style)]);
		} else {
			this.style = new RunArray([string.length], [new TextEmphasis({})]);
		}
	},
	emphasize: function (emph, start, stop) {
		// Modify the style of this text according to emph
		var myEmph = emph;
		if (! (emph instanceof TextEmphasis)) myEmph = new TextEmphasis(emph);
		this.style = this.style.mergeStyle(myEmph, start, stop);
		// console.log("Text.emphasized: " + this.style);
		return this;
	},
	emphasisAt: function(index) {
		return this.style.valueAt(index);
	},
	asString: function () { // Return string copy
		return this.string.substring(0);
	},
	size: function () {
		return this.string.length;
	},
	substring: function (start, stop) {
		// Return a substring with its emphasis as a Text
		return new thisModule.Text(this.string.substring(start, stop), this.style.slice(start, stop));
	},
	subtext: function (start, stop) {
		// Return a substring with its emphasis as a Text
		return new thisModule.Text(this.string.substring(start, stop), this.style.slice(start, stop));
	},
	concat: function (other) {
		// Modify the style of this text according to emph
		return new thisModule.Text(this.string.concat(other.string), this.style.concat(other.style));
	},
	toString: function() {
		return "Text for " + this.string + "<" + this.style + ">";
	},
	asMorph: function() {
		return new TextMorph(new Rectangle(0,0,200,100), this);
	},
});


Object.subclass('TextEmphasis', {
	initialize: function(obj) {
		Properties.forEachOwn(obj, function(p, v) {this[p] = v; }, this);
	},
	merge: function(other) {
		// this and other are style objs like {style: 'bold', fontSize: 14}
		// In case of overlapping properties, this shall dominate
		var result = new TextEmphasis(other);
		Properties.forEachOwn(this,
			function(p, v) {
				if (p != 'style') result[p] = v;
				else { // special handling of bold, italic
					var op = other[p];
					if (v == 'bold') result[p] = (op == 'italic' || op == 'bold-italic') ? 'bold-italic' : 'bold';
					if (v == 'italic') result[p] = (op == 'bold' || op == 'bold-italic') ? 'bold-italic' : 'italic';
					if (v == 'unbold') result[p] = (op == 'italic' || op == 'bold-italic') ? 'italic' : null;
					if (v == 'unitalic') result[p] = (op == 'bold' || op == 'bold-italic') ? 'bold' : null;
					if (result[p] == null) delete result.style
				}
			}
		); 
		return result;
	},
	toString: function() {
		var props = Properties.own(this).map(function(p) { return p + ": " + this[p]; }.bind(this));
		return "{" + props.join(", ") + "}";
	}
});



}.logCompletion("Text.js"));





