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


/**
 * Simple grid layout morph (as yet unfinished):
 * this morph owns the position and extent of all its children
 * rows and column indexes start at "1"
 * A constraint object consist of:
 * row, rows, col, cols, align, pad
 * - align contains one or more of "n", "e", "s", "w" to indicate
 *   which sides of its cell the widget sticks to.
 * - pad is a point containing the minimum padding from the border
 * Stuff to add later:
 * - set minimum sizes for rows/columns
 * - allow colum/row sizes to be linked e.g. equal size columns
 * - show grid lines for debugging and GUI builder
 */

console.log("start gridlayout.js");
module('lively.GridLayout').requires().toRun(function(thisModule) {

LayoutManager.subclass('GridLayoutManager', {
    setExtent: function(target, newExtent) {
	// one of our morphs wants to change size
	// It should call layoutChanged() so we can pick up the change and do a layout
	console.log('extent on ' + target);
	if (target.requestExtent && target.requestExtent.eqPt(newExtent)) {
	    return;
	}
	if (!target.iMeanIt) {
	    target.requestExtent = newExtent;
	    target.owner && (target.owner.needLayout = true);
	    target.layoutChanged();
	}

    },
    
    setPosition: function($super, target, newPosition) {
	if (target.iMeanIt) {
	    // console.log(this.myName + ": setPosition " + this.bounds() +"->"+ newPosition);
	    $super(target, newPosition);
	    // this.translateBy(newPosition.subPt(this.getPosition()));
	} else {
	    console.log("Deny: " + target.bounds() + "->" + newPosition);
	}
    },
    
    setBounds: function($super, target, newBounds) {
	$super(target, newBounds);
	target.setExtent(newBounds.extent());
    },

    layoutChanged: function(target) {
	    // console.log(this.myName + " layout changed");
	if (!target.realExtent || !target.realExtent.eqPt(target.bounds(true).extent())) {
	    // XXX BOGUS for texts
	    target instanceof GridLayoutMorph ||target.setExtent(target.bounds(true).extent());
	    // console.log(this.myName + " Changed size with out calling setExtent");
	}
    }

 });



BoxMorph.subclass('GridLayoutMorph', {
    
    gridLineSpec: {
	borderWidth: 0, borderColor: Color.black, fill: Color.red, fillOpacity: 0.4, strokeOpacity: 0,
    },
    
    style: { fill: Color.grey, borderWidth: 1, borderColor: Color.black },
    
    layoutManager: new GridLayoutManager(),

    initialize: function($super, position) {
	console.log("GridLayout started");
	this.rows = [0];	// use 0 index for top/left edge
	this.cols = [0];
	this.minCell = pt(0,0);	// minimum cell size
	this.nextRow=1;		// use as default if not provided in constraints
	this.nextCol=1;
	if (!position) position = pt(0,0);
	$super(position.extent(pt(20, 20)));
    },

    // set constraints and layout handler

    addMorph: function($super, morph, cst) {
	if (morph.isEpimorph) {
	    console.log("Ignore handle morph");
	    return $super(morph);
	}
	
	// we were dropped on , do something useful (what?)
	
	if (morph.owner instanceof HandMorph) {
	    var p=this.localize(morph.owner.position());
	    var cell = this.getCell(p);
	    // cell taken don't accept drop
	    console.log("DnD at " + p + " -> " + cell);
	    if (cell && this.morphAt(cell)) {
		console.log("  cell taken by " + this.morphAt(cell)  + " punt");
		return this.addMorphFrontOrBack(morph, true);
	    }
	    cst = {row: cell.y, col: cell.x};
	}
	morph.cst = this.validateConstraints(cst);
	console.log(this.myName +" adding: " + morph + " ("+morph.cst.row+","+morph.cst.col+" " +morph.cst.cols+"x"+morph.cst.rows+")");
	
	// add alignment options, depending on where the click was ?
	
    	morph.realMorphMenu=morph.morphMenu;
    	morph.morphMenu=function(evt) { 
	    var menu = morph.realMorphMenu(evt);
	    menu.addLine();
	    var theta = morph.localize(evt.mousePoint).subPt(morph.relativize(morph.bounds().center())).theta().toDegrees();
	    var cp=["w", "n", "e", "s"][(Math.round(theta*4/360)+2)%4];
	    menu.addItem(["toggle " + cp, morph.owner.toggleAlign.curry(morph, cp)]);
	    return menu;
	};
	morph.layoutManager = this.layoutManager;
	console.log('extended ' + morph + ' with ' + this + ' layoutManager');
	
	// no-one should call setBounds directly, but just in case
	
        $super(morph);
	this.needLayout=true;
	this.layoutChanged();
	return morph;
    },
    
    layoutChanged: function($super) {
	// one of our submorphs changed: we might need to do something
	this.scheduleUpdate();
	$super();
    }, 
    
    // remove all the properties we added to this morph
    removeMorph: function($super, m) {
	console.log("removing morph: " + m);
	if ($super(m)) {
	    if (m.cst) {
		delete m.cst;	// we might want to keep this 
		this.needLayout=true;
		this.layoutChanged();
	    }
	    if (m.realMorphMenu) {
		m.morphMenu = m.realMorphMenu;
		delete m.setExtent;
	    }
	    delete m.requestExtent;
	    delete m.iMeanIt;
	    delete m.layoutManager; // use the default inherited from prototype
	    // delete m.morphMenu;
	}
    },
    
    // make sure our constraint object is valid
    
    validateConstraints: function(constraints) {
        var c = constraints;
	if (!c) {
	    // if we were dropped, figure out where to pub me! (XXX)
	    c = {};
	}
	if (c.row && c.row>0) {
	    this.nextCol = 1;
	    this.nextRow = c.row;
	} else {
	    c.row = this.nextRow;
	}
	if (c.col && c.col > 0) {
	    this.nextCol = c.col + 1;
	} else {
	    c.col = this.nextCol;
	    this.nextCol++;
	}
	c.rows = Math.max(c.rows || 1, 1);
	c.cols = Math.max(c.cols || 1, 1);
	c.align = c.align || "c";
	c.pad = c.pad || pt(0,0);
	console.log(c.row + "," + c.col + " (" + c.cols + "x" + c.rows + ") " + c.align);
	return c;
    },
    
    // adjust the constraints of a morph (not much error checking)
    
    moveMorph: function(m, c) {
	for (var i in c) {
	    m.cst[i] = c[i];
	}
	this.needLayout = true;
	this.layoutChanged();
    },
    
    // increment the default next row
    
    setRow: function(row) {
	this.nextRow = Math.max(1, row || this.nextRow + 1);
    },
    
    // call this anytime we need to relayout the grid
    // It should go into the main event loop
    
    scheduleUpdate: function() {
	if (this.updateScheduled) return;  // already scheduled
	this.updateScheduled = new SchedulableAction(this, "update", null, 0);
	WorldMorph.current().scheduleForLater(this.updateScheduled, 0, true);  // zero delay runs on next cycle
    },
    
    update: function() {
	// console.log("updating layouts for: " + this.myName);
	if (this.needLayout) {
	    this.needLayout = false;	// tell owner to do a relayout
	    this.computeGrid();
	    this.doLayout();
	} else {
	    // console.log("  layout would be the same, skipping");
	}
	delete this.updateScheduled;
    },
    
    // figure out where the cell boundaries go
    // fill in this.rows and this.cols
    // XXX this currently does way more work than it needs to
    
    computeGrid: function() {
	var morphs = [];
	for (var i=0; i < this.submorphs.length; i++) {
	    var m = this.submorphs[i];
	    if (m.cst) {
		m.requestExtent = m.requestExtent || m.bounds(true).extent();
		morphs.push(m);
	    }
	}
	
	// compute rows then cols (should be combined)
	
	morphs.sort(function(a,b) {
	    return (a.cst.row+a.cst.rows) - (b.cst.row+b.cst.rows);
	});
	
	var end;
	for (var i in this.rows) this.rows[i] = 0; // temporary
	for (var i=0; i<morphs.length; i++) {
	    var m = morphs[i];
	    var c = m.cst;
	    var start = c.row - 1;
	    end = start + c.rows;
	    
	    this.rows[end] = Math.max(this.rows[end]||0, (this.rows[start]||0) + m.requestExtent.y + 2*c.pad.y);
	    if (isNaN(this.rows[end])) alert('yea ' + [this.rows[start], m.requestExtent.y, c.pad.y]);
	    
	}
	
	// make sure rows are big enough (temp)
	for(var i=1, incr=0;i<this.rows.length;i++) {
	    var d = this.minCell.y - (this.rows[i]-this.rows[i-1]);
	    if (d > incr) incr = d;
	    if (isNaN(this.rows[i])) this.rows[i] = 0;
	    this.rows[i] += incr;

	}
	
	var maxY = this.rows[end];
	this.rows.length=end+1;
	
	// now the columns
	
	morphs.sort(function(a,b) {
	    return (a.cst.col+a.cst.cols) - (b.cst.col+b.cst.cols);
	});
	
	for (var i in this.cols) this.cols[i] = 0; // temporary
	for (var i=0; i<morphs.length; i++) {
	    var c = morphs[i].cst;
	    var start = c.col - 1;
	    end = start + c.cols;
	    this.cols[end] = Math.max(this.cols[end]||0,
				      (this.cols[start]||0) + morphs[i].requestExtent.x + 2*c.pad.x);
	}
	
	// make sure cols are big enough (temp)
	for(var i=1, incr=0;i<this.cols.length;i++) {
	    var d = this.minCell.x - (this.cols[i]-this.cols[i-1]);
	    if (d>0) incr = d;
	    this.cols[i] += incr;
	}
	var maxX = this.cols[end];
	this.cols.length=end+1;
	
	// this is really simple for now
	
	if (this.showGrid) {
	    this.showGridLines(false);
	    // this is a hack to get around a layout update bug.
	    // setTimeout(this.showGridLines.bind(this, true), 60);
	    this.showGridLines(true);
	}
	
	var newExt = pt(maxX, maxY);
	console.log((this.myName||this) + " computed Grid cols=[" + this.cols + "] rows=[" + this.rows + "] ext=" + newExt);
	
	// Allow the size to be bigger than required, but not smaller.
	// If a dimension is bigger, apportion the extra space equally to all
	// rows(cols) that have at least one morph whose align is "ns"("ew").  If
	// no morph is expandable, then center the layout in the grid.
	// Later
	
	this.setExtent(newExt);
    }, 
    
    // fit the morphs in the grid
    
    doLayout: function() {
	// console.log(this.myName + " doLayout cols=" + this.cols + " rows=" + this.rows);
	for (var i=0; i<this.submorphs.length; i++) {
	    var m = this.submorphs[i];
	    if (m.cst) {
		var c = m.cst;
		var r = new Rectangle(this.cols[c.col-1], this.rows[c.row-1],
		    this.cols[c.col+c.cols-1] - this.cols[c.col-1],
		    this.rows[c.row+c.rows-1] - this.rows[c.row-1]);
		var o = m.bounds(true);
		r = this.adjustRect(m.requestExtent || o.extent(), r, c);
		if (!(r.x==o.x && r.y==o.y && r.width==o.width &&
		      r.height==o.height)) {
		    m.iMeanIt=true;
		    m.setBounds(r);
		    delete m.iMeanIt;
		}
	    }
	}
    },
    
    // this should be a method on Rectangles
    // ext: our morph exent (x,y)
    // r: our cell boundaries
    // c: our constraints
    // the result will be rect (for now)
    
    adjustRect: function(ext, r, c) {
	var align=c.align;
	if (align.indexOf("n")>=0 && align.indexOf("s")>=0) {
	    r.height -= 2*c.pad.y;
	    r.y += c.pad.y;
	} else if (align.indexOf("n")>=0) {
	    r.y += c.pad.y;
	    r.height = ext.y;
	} else if (align.indexOf("s")>=0) {
	    r.y = (r.y+r.height) - (ext.y + c.pad.y);
	    r.height = ext.y;
	} else { // center
	    r.y += (r.height-ext.y)/2;
	    r.height = ext.y;
	}
	
	if (align.indexOf("w")>=0 && align.indexOf("e")>=0) {
	    // use r values
	} else if (align.indexOf("w")>=0) {
	    r.width = ext.x;
	    r.x += c.pad.x;
	} else if (align.indexOf("e")>=0) {
	    r.x  = (r.x + r.width) - (ext.x + c.pad.x);;
	    r.width = ext.x;
	} else {
	    r.x += (r.width-ext.x)/2; r.width = ext.x;
	}
	return r;
    },
    
    // convert an x,y location into a row/col number
    // (this should be replaced by a pre-computed binary search)
    
    getCell: function(p) {
	var row;
	var col;
	for(col=0;col<this.cols.length;col++) if (p.x < this.cols[col]) break;
	for(row=0;row<this.rows.length;row++) if (p.y < this.rows[row]) break;
	// should we return null if off grid?
	if (col<1 || row<1 || col>this.cols.length || row>this.rows.length) {
	    return null;
	} else {
	    return pt(col, row);
	}
    },
    
    // return first morph in cell (pos=col,row)
    
    morphAt: function(pos) {
	if (!pos) return null;
	for (var i=0; i<this.submorphs.length; i++) {
	    var c = this.submorphs[i].cst;
	    if (c && c.col <= pos.x && c.row <= pos.y &&
		(c.col+c.cols) > pos.x && (c.row+c.rows) > pos.y) {
		return this.submorphs[i];
	    }
	}
	return null;
    },
    
    toggleGridLines: function() {
	this.showGridLines(this.showGrid ? false : true);
    },
    
    toggleMinCells: function() {
	if (this.minCell.x == 0) {
	    this.minCell = pt(25,25);
	} else {
	    this.minCell = pt(0,0);
	}
	if (!this.showGrid) {
	    this.showGridLines(true); 
	}
	this.needLayout = true;
	this.scheduleUpdate();
    },
    
    showGridLines: function(on) {
	if (on && !this.showGrid) {
	    this.showGrid=true;
	    this.makeGridLines();
	} else if (this.showGrid) {
	    if (this.colLine) {
		for(var i=0; i<this.colLine.length;i++) {
		    this.removeMorph(this.colLine[i]);
		}
		delete this.colLine;
	    }
	    if (this.rowLine) {
		for(var i=0; i<this.rowLine.length;i++) {
		    this.removeMorph(this.rowLine[i]);
		}
		delete this.rowLine;
	    }
	    delete this.showGrid;
	}
    },
    
    makeGridLines: function() {
	console.log("making grid lines");
	
	var ext = this.bounds(true).extent();
	this.rowLine = new Array();
	this.colLine = new Array();
	for(var i=0; i<this.rows.length; i++) {
	    var w = new GridLineMorph(new Rectangle(0,this.rows[i]-1,ext.x,2));
	    w.applyStyle(this.gridLineSpec);
	    w.row = i;
	    this.rowLine[i] = w;
	    this.addMorphFrontOrBack(w, true);
	}
	for (var i=0; i<this.cols.length; i++) {
	    var w = new GridLineMorph(new Rectangle(this.cols[i]-1,0,2,ext.y));
	    w.applyStyle(this.gridLineSpec);
	    w.col = i;
	    this.colLine[i] = w;
	    this.addMorphFrontOrBack(w, true);
	}
    },
    
    // insert a row or column (combine me!)
    
    insertRowBefore: function(pos) {
	for (var i=0; i<this.owner.submorphs.length; i++) {
	    var c = this.submorphs[i].cst;
	    if (!c) continue;
	    if (c.row >= pos) {
		c.row++;
	    } else if (c.row+c.rows-1 > pos) {
		c.rows++;
	    }
	}
	this.needLayout = true;
	this.scheduleUpdate();
    },
    
    insertColBefore: function(pos) {
	for (var i=0; i<this.owner.submorphs.length; i++) {
	    var c = this.submorphs[i].cst;
	    if (!c) continue;
	    if (c.col >= pos) {
		c.col++;
	    } else if (c.col+c.cols-1 > pos) {
		c.cols++;
	    }
	}
	this.needLayout = true;
	this.scheduleUpdate();
    },
    
    deleteRow: function(pos) {
	if (this.owner.rows < 2) return;
	for (var i=0; i<this.owner.submorphs.length; i++) {
	    var c = this.submorphs[i].cst;
	    if (!c) continue;
	    if (c.row >= pos) {
		c.row--
	    } else if (c.row+c.rows-1 > pos) {
		c.rows--;
	    }
	}
	this.rows.length--;
	this.needLayout = true;
	this.scheduleUpdate();
    },
    
    deleteCol: function(pos) {
	if (this.owner.cols < 2) return;
	for (var i=0; i<this.owner.submorphs.length; i++) {
	    var c = this.submorphs[i].cst;
	    if (!c) continue;
	    if (c.col >= pos) {
		c.col--
	    } else if (c.col+c.cols-1 > pos) {
		c.cols--;
	    }
	}
	this.cols.length--;
	this.needLayout = true;
	this.scheduleUpdate();
    },
    
    // toggle an alignment bit
    // This argues for keeping the alignment state as a 4 bit vector
    
    toggleAlign: function(morph, toggle) {
	// console.log("Toggle");
	var c = morph.cst;
	var o = morph.owner; // we could use this XXX
	if (!c) return;
	var result = o.bits2Align(
	    o.align2Bits(toggle) ^ o.align2Bits(c.align));
	// we should just return the alignment
	morph.cst.align=result;
	o.needLayout = true;
	o.scheduleUpdate();
	return result;
    },
    
    // convert an alignment into a bit vector: "wesn"

    align2Bits: function(s) {
	var bits=0;
	s.replace(/[^nsew]/g,"").split("").forEach(function(c) {
	    bits |= "0ns3e567w".indexOf(c);
	});
	return bits;
    },

    alignMap: ["c", "n", "s", "ns", "e", "ne", "se", "nse", "w", "nw", "sw", "nsw", "ew", "new", "sew", "nsew"],

    bits2Align: function(bits) {
	var align =  this.alignMap[bits&0xF];
	return align;
    },

    morphMenu: function($super, evt) { 
        var menu = $super(evt);
        menu.addLine();
        menu.addItem(["grid lines " + (this.showGrid?"off":"on"), this.toggleGridLines]);
	var label = this.minCell.x == 0 ? "expand grid" : "un-expand grid";
        menu.addItem([label, this.toggleMinCells]);
        return menu;
    }
});

    // These are our grid lines
    
BoxMorph.subclass("GridLineMorph", {
    style: {borderWidth: 2},
    initialize: function($super, pos) {
	this.pos = pos;
	this.npos = new Rectangle(pos.x-1, pos.y-1, pos.width+2, pos.height+2);
	this.isEpimorph = true;
	this.openForDragAndDrop=false;
	this.suppressHandles=true;
	this.focusHaloBorderWidth=0;
	$super(pos);
    },
    
    handlesMouseDown: function(evt) { return true; },
    
    onMouseOver: function(evt) {
	this.setExtent(this.npos.extent());
	this.setPosition(this.npos.topLeft());
    },
    
    onMouseOut: function(evt) {
	this.setBounds(this.pos);
    },
    
    morphMenu: function($super, evt) { 
	var menu = $super(evt);
	menu.addLine();
	var what = this.row ? "row" : "column";
	menu.addItem(["insert " + what, this.addCell]);
	if ((this.row && this.row>0) || (this.col && this.col>0)) {
	    menu.addItem(["remove line", this.rmCell]);
	}
	return menu;
    },
    
    // either col or row will be defined
    
    addCell: function() {
	if (this.row) this.owner.insertRowBefore(this.row+1);
	if (this.col) this.owner.insertColBefore(this.col+1);
    }, 
    
    rmCell: function() {
	if (this.row) this.owner.deleteRow(this.row);
	if (this.col) this.owner.deleteCol(this.col);
    }
});
	
console.log("end gridlayout.js");
	
GridLayoutMorph.demo = function(world, position) {
    console.log("sample GridLayout");
    world = world || WorldMorph.current();
    position = position || world.bounds().center();
    
    HandMorph.logDnD=true;
    var l1 = new TextMorph(new Rectangle(0,0,100,20), "Grid Demo");
    var l2 = new TextMorph(new Rectangle(0,0,100,20), "a random label");
    var b = new TextMorph(new Rectangle(0,0,100, 20) ,"Please help fix me");
    
    var grid = new GridLayoutMorph(position);
    grid.myName = "main grid";
    l1.myName="1";
    l2.myName="2";
    b.myName="text";
    grid.setFillOpacity(.3);
    grid.setBorderWidth(0);
    grid.addMorph(l1, {row: 1, col: 1});
    grid.addMorph(l2, {row: 2, col: 2});
    grid.addMorph(b, {row: 4, cols: 2, pad: {x: 0, y: 5}});

    
    var g2 = new GridLayoutMorph();
    g2.myName="sub-grid";
    g2.setBorderWidth(0);
    g2.setFillOpacity(.1);
    g2.setFill(Color.red)
    
    var square = new Rectangle(0,0,30,30);
    // make 3 squares in a sub grid
    for(var i=1;i<4;i++) {
	var c = {row: 1, col: 1, align: "c", pad: {x: 15, y: 15}};
	c.col=i;
	var z = Morph.makeRectangle(square);
	g2.addMorph(z,c);
	z.myName="sq-" + i;
    }
    // make a rectangle that moves to all its alignment positions
    var r = Morph.makeRectangle(0,0,15,15);
    r.setFill(Color.red);
    r.myName = "red";
    r.alignments = ["c", "n", "s", "e", "w", "nw", "se", "ne", "sw",
		    "c", "new", "ew", "sew", "nse", "ns", "nsw", "nsew"];
    r.alignCount=0;
    r.nextAlign=function() {
	var a = new Object;
	a.align = this.alignments[this.alignCount];
	console.log("align: " + a.align);
	this.owner.moveMorph(this, a);
	this.alignCount = (this.alignCount+1)%this.alignments.length;
    };
    
    g2.addMorph(r,{col:2, row:1, pad: {x:5,y:5}});
    grid.addMorph(g2, {row:3, cols:2, pad: {x:2, y:2}});
    world.addMorph(grid);
    
    g2.gridLineSpec.fill=Color.black;
    
    // uncomment this to play with alignments
   // r.startStepping(700, "nextAlign");

    return grid;
}
    
console.log("end griddemo");
});