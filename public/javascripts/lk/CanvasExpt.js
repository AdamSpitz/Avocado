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

//
//	To run The Lively Kernel in a Canvas Element, start your browser at expt.xhtml
//
//  Yet To do: 
//	Fix damage rect of hand -- keeps registering damage when no move
//		also, eg, keeps registering damage rect of ticking star after grab/release
//			this effect is cleared by leaving world, so extra ticking??
//		this is a pre-existing condition revealed by damage display
//	Possibly related: spinning star changes speed after a few world changes
//
//	Morphs dragged through worm-holes get coords offset by current location
//	Simple example morphs world needs to be rebuilt, since serialized form not available
//	And, er, of course we need to replace XML serialization be, eg, JSON etc.
//
//	Performance - cache color strings, gradient objects

Morph.addMethods({  // Damage propagation
    changed: function() { // Means we have to redraw due to altered content
	if(this.owner) this.owner.invalidRect(this.bounds());
     },
    invalidRect: function(rect) { // rect is in local coordinates
	// owner == null is presumably caught by WorldMorph's override
	if(this.owner) this.owner.invalidRect(this.getTransform().transformRectToRect(rect)); }
});

Morph.addMethods({  // Canvas Display
    fullDrawOn: function(graphicContext, clipRect) {
	// Display this morph and all of its submorphs (back to front)
	if (! this.isVisible() || !(clipRect.intersects(this.bounds()))) return;
        var bnds = this.innerBounds();
	graphicContext.save();
	graphicContext.translate(this.origin.x, this.origin.y);
	if (this.rotation != 0) graphicContext.rotate(this.rotation);
	var s = this.scalePoint;
	if (s.x != 1 || s.y != 1) graphicContext.scale(s.x, s.y);
	this.drawOn(graphicContext, bnds);
	this.drawSubmorphsOn(graphicContext, clipRect)
	graphicContext.restore(); },
    drawOn: function(graphicContext, bnds) {
	if (this.isClipMorph) {  // Check for clipping behavior
		this.shape.setPath(graphicContext, bnds);
		graphicContext.clip(); }
	this.shape.drawOn(graphicContext, bnds);
	},
    drawSubmorphsOn: function(graphicContext, clipRect) {
	// Display all submorphs, back to front
	if(this.submorphs == null || this.submorphs.length == 0) return;
	var subClip = this.getTransform().createInverse().transformRectToRect(clipRect);
	for(var i=0; i<this.submorphs.length; i++)
		this.submorphs[i].fullDrawOn(graphicContext, subClip);
	}
});

TextMorph.addMethods({  // Canvas Display
    drawOn: function(graphicContext, bnds) {
	this.shape.drawOn(graphicContext, bnds.outsetByRect(this.padding));
	},
    drawSubmorphsOn: function($super, graphicContext, clipRect) {
	// First display the submorphs (including selection), then the text
	$super(graphicContext, clipRect);
	var subClip = this.getTransform().createInverse().transformRectToRect(clipRect);
	this.drawTextOn(graphicContext, subClip); },
    fontString: function(font) {
	var fontString = "";
		if (font.style.indexOf("bold") >= 0) fontString += "bold ";
		if (font.style.indexOf("italic") >= 0) fontString += "italic ";
	fontString += (font.size*0.75).toString() + "pt " + font.family;
	//console.log ("fontString = " + fontString);
	return fontString; },
    drawTextOn: function(ctx, clipRect) {
	if (!ctx.fillText) return;
	if (this.lines == null) return;

	var bnds = this.innerBounds();
	ctx.textBaseline = 'top';
	ctx.fillStyle = this.shape.canvasFillFor(this.textColor);
	var currentFont = this.font;
	ctx.font = this.fontString(this.font);

	// Only display lines in the damage region
	// DI: this loop should be TextLine.drawOn(ctx, clipRect)
	var firstLine = this.lineNumberForY(clipRect.y);
	if (firstLine < 0) firstLine = 0;
	var lastLine = this.lineNumberForY(clipRect.maxY());
	if (lastLine < 0) lastLine = this.lines.length-1;
	for (var i=firstLine; i<=lastLine; i++) {
		var line = this.lines[i];
		var str = line.textString;
		for (var j=0; j<line.chunks.length; j++) {
			var word = line.chunks[j];
			var slice = str.slice(word.startIndex,word.stopIndex+1);
			if (!word.isWhite) {
				if (word.font && word.font !== currentFont) {
					currentFont = word.font;
					ctx.font = this.fontString(currentFont);
				}
				ctx.fillText(slice, word.bounds.x, word.bounds.y-2);  // *** why -2? Fix me
			}
		}
	}
	}
});

lively.scene.Image.addMethods({
    // monkey patch
    loadImage: function(href, width, height) {
	this.rawNode = Global.document.createElement("img");
	width && this.rawNode.setAttribute("width", width);
	height && this.rawNode.setAttribute("height", height);
	this.rawNode.setAttribute("src", href);
	return this.rawNode;
    }
    
});
    
ImageMorph.addMethods({  // Canvas Display

    drawOn: function(graphicContext, bnds) {
	var rawImage = this.image.rawNode;
	if (rawImage && rawImage.tagName === 'img') {
	    // console.log(rawImage.width, bnds.width, rawImage.height, bnds.height);
	    try {
		graphicContext.drawImage(rawImage, bnds.x, bnds.y, 
					 Math.min(rawImage.width, bnds.width), Math.min(rawImage.height, bnds.height));
	    } catch (e) {
		console.log('whoops, ' + e);
	    }
	}
    }
});

ClipMorph.addMethods({  // Canvas Display
	// Note also the conditional clause in Morph.drawOn()
    invalidRect: function($super, rect) { // limit damage report to clipped region
	$super(rect.intersection(this.innerBounds()));
	}
});

WorldMorph.addMethods({  // World
    invalidRect: function(rect) {
	if (!this.damageManager) this.damageManager = new DamageManager();
	this.damageManager.recordInvalidRect(rect); },
    fullDrawOn: function($super, ctx, clipRect) {
	$super(ctx, clipRect);
	var hands = this.hands;
	for(var i=hands.length-1; i>=0; i--) { hands[i].fullDrawOn(ctx, clipRect); } },
    repaintCanvas: function() {
	// --- Here is where we display the world on the canvas ---
	// This is called after World.doOneCycle, and Hand.handleEvent
	// set this.showDamageRectangles to true to see damage rectangles in action
	if (this !== WorldMorph.current()) { // Might happen if doOneCycle in inactive world
		console.log('inactive world');
		return; }
	var canvas = document.getElementById('lively.canvas');
	if (!canvas || !canvas.getContext) return;
	var ctx = canvas.getContext("2d");
	ctx.fillStyle = 'black'; ctx.fillRect (10, 10, 10, 10);
	ctx.font = "bold italic 9pt Helvetica";  // our current default
	if (ctx.fillText) ctx.fillText("Canvas Test", 30, 20);  // test
	ctx.strokeStyle = 'black';
	
	if (!this.damageManager) this.damageManager = new DamageManager();  // init
	damageRects = this.damageManager.invalidRects;
	this.damageManager.resetInvalidRects();

	if (this.showDamageRectangles) {
		// Complete redisplay needed to clear prior damage rects
		canvas.width = canvas.width; // erase canvas
		this.fullDrawOn(ctx, this.bounds());
	} else {
		// Redisplay only damaged regions
		for(var i=0; i<damageRects.length; i++) {
			var dr = damageRects[i].expandBy(1);
			ctx.save();
			// Note clipping routines only like integer coordinates...
			dr = rect(dr.topLeft().roundTo(1), dr.bottomRight().roundTo(1));
			lively.scene.Shape.prototype.setPath(ctx, dr);
			ctx.clip();
			this.fullDrawOn(ctx, dr);
			ctx.restore(); }
	}
	if (this.showDamageRectangles) {
		// Draw boxes around each damaged region
		ctx.strokeStyle = 'blue';
		for(var i=0; i<damageRects.length; i++) {
			var dr = damageRects[i];
			ctx.strokeRect(dr.x, dr.y, dr.width, dr.height); }
	}
	},
    displayOnCanvas: WorldMorph.prototype.displayOnCanvas.wrap(function(originalFunc, arg) {
	originalFunc(arg);
	var canvas = document.getElementById('lively.canvas');
	if (!canvas || !canvas.getContext) return;
	var ctx = canvas.getContext("2d");
	this.fullDrawOn(ctx, this.innerBounds());
	}),
    doOneCycle: WorldMorph.prototype.doOneCycle.wrap(function(originalFunc, arg) {
	originalFunc(arg);
	this.repaintCanvas();
	})
});

HandMorph.addMethods({  // Canvas Display
    registerForEvents: function(morph) {
        Event.basicInputEvents.forEach(function(name) { 
            morph.rawNode.addEventListener(name, this, this.handleOnCapture);}, this);
	// Register for events from the 2D canvas as well
	var canvas = document.getElementById('lively.canvas');
	if(morph === this || canvas == null) return;
	Event.basicInputEvents.forEach(function(name) { 
            canvas.addEventListener(name, this, this.handleOnCapture);}, this);
    },
    unregisterForEvents: function(morph) {
        Event.basicInputEvents.forEach(function(name) { 
            morph.rawNode.removeEventListener(name, this, this.handleOnCapture);}, this);
	// Unregister for events from the 2D canvas as well
	var canvas = document.getElementById('lively.canvas');
	if(morph === this || canvas == null) return;
	Event.basicInputEvents.forEach(function(name) { 
            canvas.removeEventListener(name, this, this.handleOnCapture);}, this);
    },
    handleEvent: HandMorph.prototype.handleEvent.wrap(function(originalFunc, arg) {
	var result = originalFunc(arg);
	var w = this.world()
	if (w) w.repaintCanvas();
	return result;
    })
});

Object.subclass('DamageManager', {  // Damage repair
    initialize: function() {
	this.invalidRects = [];
	},
    recordInvalidRect: function(rect) { 
	if(this.invalidRects.length == 0) {this.invalidRects = [rect]; return; }
	for(var i=0; i<this.invalidRects.length; i++) { // merge with an intersecting rect
		var irect = this.invalidRects[i];
		if(irect.intersects(rect)) { this.invalidRects[i] = irect.union(rect); return; } }
	for(var i=0; i<this.invalidRects.length; i++) { // merge with a nearby rect
		var irect = this.invalidRects[i];
		if(irect.dist(rect) < 50) { this.invalidRects[i] = irect.union(rect); return; } }
	this.invalidRects.push(rect); },  // add it as a separate rect
    resetInvalidRects: function() { this.invalidRects = []; }});

lively.scene.Shape.addMethods({  // Graphic Shapes
    drawOn: function(graphicContext, bnds) {
	// Display this shape
	var pathSet = false;
	if (this.getFill()) { // Fill first, then stroke
		var alpha = this.getFillOpacity();
		if (alpha != 1) graphicContext.globalAlpha = alpha;
		graphicContext.fillStyle = this.canvasFillFor(this.getFill(), graphicContext, bnds);
		this.drawFillOn(graphicContext, bnds);
		pathSet = true; }
	if (this.getStroke() && this.getStrokeWidth() > 0) {
		var alpha = this.getStrokeOpacity();
		if (alpha != 1) graphicContext.globalAlpha = alpha;
		graphicContext.strokeStyle = this.canvasFillFor(this.getStroke(), graphicContext, bnds);
		graphicContext.lineWidth = this.getStrokeWidth();
		this.drawStrokeOn(graphicContext, bnds, pathSet); }
	},
    drawFillOn: function(graphicContext, bnds) {
	this.setPath(graphicContext, bnds);
	graphicContext.fill();
	},
    drawStrokeOn: function(graphicContext, bnds, pathSet) {
	if (! pathSet) this.setPath(graphicContext, bnds);
	graphicContext.stroke();
	},
    canvasFillFor: function(ourFill, graphicContext, bnds) {
	if (ourFill == null) return null;
	if (ourFill instanceof Color) return ourFill.toString();
	var grad = null;
	if (ourFill instanceof lively.paint.LinearGradient) {
		cv = bnds.scaleByRect(ourFill.vector || lively.paint.LinearGradient.NorthSouth);
		grad = graphicContext.createLinearGradient(cv.x, cv.y, cv.maxX(), cv.maxY());
		}
	if (ourFill instanceof lively.paint.RadialGradient) {
		var c = bnds.center();
		var c0 = c.scaleBy(0.7).addPt(bnds.topLeft().scaleBy(0.3));
		grad = graphicContext.createRadialGradient(c0.x, c0.y, 0, c.x, c.y, bnds.width/2);
		}
	if (grad) {
		var stops = ourFill.stops;
		for (var i=0; i<stops.length; i++) {
			grad.addColorStop(stops[i].offset(), this.canvasFillFor(stops[i].color())); }
		return grad;
		}
	return null;
	},
    setPath: function(graphicContext, bnds) { // Rectangular default my be overridden
	graphicContext.beginPath();
	graphicContext.moveTo(bnds.x, bnds.y);
	graphicContext.lineTo(bnds.maxX(), bnds.y);
	graphicContext.lineTo(bnds.maxX(), bnds.maxY());
	graphicContext.lineTo(bnds.x, bnds.maxY());
	graphicContext.closePath();
	}
});

lively.scene.Rectangle.addMethods({  // Graphic Shapes
	initialize: function($super, rect) {
		$super();
		this.rawNode = NodeFactory.create("rect");
		this.setBounds(rect || new Rectangle(0, 0, 0, 0));
		return this;
    },
	drawFillOn: function($super, graphicContext, bnds) {
	if (this.getBorderRadius()!=0) $super(graphicContext, bnds);
	else graphicContext.fillRect(bnds.x, bnds.y, bnds.width, bnds.height);
	},
    drawStrokeOn: function($super, graphicContext, bnds, pathSet) {
	if (this.getBorderRadius()!=0) $super(graphicContext, bnds);
	else graphicContext.strokeRect(bnds.x, bnds.y, bnds.width, bnds.height);
	},
    setPath: function($super, graphicContext, bnds) { // Rectangular default my be overridden
	var r = this.getBorderRadius();
	if (r == 0) return $super(graphicContext, bnds);
	var dx = pt(r, 0), dy = pt(0, r), pi2 = Math.PI/2, p = null;
	graphicContext.beginPath();
	p = bnds.topLeft().addPt(dx); graphicContext.moveTo(p.x, p.y);
	p = bnds.topRight().subPt(dx); graphicContext.lineTo(p.x, p.y);
	c = p.addPt(dy); graphicContext.arc(c.x, c.y, r, pi2*3, pi2*0, false);
	p = bnds.bottomRight().subPt(dy); graphicContext.lineTo(p.x, p.y);
	c = p.subPt(dx); graphicContext.arc(c.x, c.y, r, pi2*0, pi2*1, false);
	p = bnds.bottomLeft().addPt(dx); graphicContext.lineTo(p.x, p.y);
	c = p.subPt(dy); graphicContext.arc(c.x, c.y, r, pi2*1, pi2*2, false);
	p = bnds.topLeft().addPt(dy); graphicContext.lineTo(p.x, p.y);
	c = p.addPt(dx); graphicContext.arc(c.x, c.y, r, pi2*2, pi2*3, false);
	graphicContext.closePath();
	}
});

lively.scene.Polygon.addMethods({  // Graphic Shapes
    setPath: function(graphicContext, bnds) {
	// Same as Polyline, except pat is clossed at end
	var verts = this.vertices();
	graphicContext.beginPath();
	graphicContext.moveTo(verts[0].x, verts[0].y);
	for (var i=1; i<verts.length; i++) graphicContext.lineTo(verts[i].x, verts[i].y);
	graphicContext.closePath();
	}
});

lively.scene.Polyline.addMethods({  // Graphic Shapes
    setPath: function(graphicContext, bnds) {
	var verts = this.vertices();
	graphicContext.beginPath();
	graphicContext.moveTo(verts[0].x, verts[0].y);
	for (var i=1; i<verts.length; i++) graphicContext.lineTo(verts[i].x, verts[i].y);
	}
});

lively.scene.Ellipse.addMethods({  // Ellipse as four quadratic Beziers
    setPath: function(graphicContext, bnds) {
        var aX = bnds.x, aY = bnds.y,
		hB = (bnds.width / 2) * .5522848,
		vB = (bnds.height / 2) * .5522848,
		eX = aX + bnds.width,
		eY = aY + bnds.height,
		mX = aX + bnds.width / 2,
		mY = aY + bnds.height / 2;
	graphicContext.beginPath();
        graphicContext.moveTo(aX, mY);
        graphicContext.bezierCurveTo(aX, mY - vB, mX - hB, aY, mX, aY);
        graphicContext.bezierCurveTo(mX + hB, aY, eX, mY - vB, eX, mY);
        graphicContext.bezierCurveTo(eX, mY + vB, mX + hB, eY, mX, eY);
        graphicContext.bezierCurveTo(mX - hB, eY, aX, mY + vB, aX, mY);
        graphicContext.closePath();
    }
});

// Currently both Firefox and Webkit need these to run in cavas
Config.useTransformAPI = false;
Config.useGetTransformToElement = false;
Config.loadSerializedSubworlds = false;  //  Needed since canvas has no SVG deserializer


console.log("CanvasExpt.js completed.");

