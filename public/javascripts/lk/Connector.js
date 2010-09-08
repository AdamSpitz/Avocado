module('lively.Connector').requires('cop.Layers', 'lively.Helper').toRun(function() {

createLayer("ConnectorMorphLayer");
createLayer("NodeMorphLayer");

layerClass(NodeMorphLayer, Morph, {
	
	isPropertyOnIgnoreList: function(proceed, prop) {
		if (prop == "delayUpdateConnectors")
			return true;
		return proceed(prop)
	},
	
	changed: function(proceed, part) {
		proceed(part);
		this.triggerUpdateConnectors();	 
	},

	// Manual Async Event Handling
	triggerUpdateConnectors: function() {
		if (!this.delayUpdateConnectors) {
			this.delayUpdateConnectors = true;
			Global.setTimeout(this.updateConnectors.bind(this), 0);
		}
	},

	getConnectorMorphs: function() {
		if(this.connectorMorphs) {
			return this.connectorMorphs.select(function(ea) { return ea && ea.updateConnection})
		}
		return []
	},
	
	updateConnectors: function() {
		try {
			this.getConnectorMorphs().each(function(ea) {
				ea.updateConnection();
			});
		} finally {
			// ensure that, a bug in the update process does not break the triggering of new updates
			this.delayUpdateConnectors = false; 
		}
	},

	connectLineMorph: function(proceed, line) {
		// console.log("connect line morph " + line);
		if(!this.connectorMorphs)
			this.connectorMorphs = [];
		if(!this.connectorMorphs.include(line))
			this.connectorMorphs.push(line); 
	},

	deconnectLineMorph: function(proceed, line) {
		if(!this.connectorMorphs)
			return;
		this.connectorMorphs = this.connectorMorphs.reject(function(ea){return ea === line;});
	}
});

layerClass(ConnectorMorphLayer, HandleMorph, {

	onMouseUp: function(proceed, evt) {
		var morph = this.findMorphUnderMe();
		var line = this.owner;
		// console.log("handle mouse up on " + morph)
		this.connectToMorph(morph);		
		var result = proceed(evt);
		line.updateConnection();
		// RESEARCH: the layer is not active any more... because the proceed set owner to nil
		return result;
	},

	onMouseMove: function(proceed, evt) {
		var result = proceed(evt);
		// Fabrik connectors intercepted the setVertices in the shape
		// but instance wrappers are fragile but shapes have no "owner" references
		if (this.owner)
			this.owner.updateArrow();
		return result;
	},

	connectToMorph: function(proceed, newMorph) {
		if (newMorph)
			newMorph.setWithLayers([NodeMorphLayer]);
		if (this.isStartHandle()) {
			// console.log("I am a start handle!");
			if (this.owner.startMorph) {
				this.owner.startMorph.deconnectLineMorph(this.owner);
			}
			this.owner.startMorph = newMorph;
		}
		if (this.isEndHandle() ) {
			// console.log("I am an end handle!");
			if (this.owner.endMorph) {
				this.owner.endMorph.deconnectLineMorph(this.owner);
			}
			this.owner.endMorph = newMorph;
		}

		if (newMorph) {
			newMorph.connectLineMorph(this.owner);
			// console.log("connect to new morph " + newMorph)
			this.owner.updateConnection();
		}			
	},

	isStartHandle: function() {
		return this.partName == 0;
	},

	isEndHandle: function() {
		return this.partName == (this.owner.shape.vertices().length - 1);
	},

	get openForDragAndDrop() {
		return false;
	},

	findMorphUnderMe: function(){	
		var evt = newFakeMouseEvent(this.getGlobalPosition());
		var result;
		withLayers([FindMorphLayer], function(){
			result = this.world().morphToGrabOrReceive(evt, this, true);
		}.bind(this));
		if (result instanceof WorldMorph)
			return undefined;
		return result;
	},

	getGlobalPosition: function() {
		if (!this.owner)
			return this.getPosition();
		return this.owner.getGlobalTransform().transformPoint(this.getPosition());
	}
});

layerClass(ConnectorMorphLayer, Morph, {
	
	setupConnector: function() {
		var lineColor = Color.black;
		this.arrowHead = new ArrowHeadMorph(1, lineColor, lineColor);
		this.addMorph(this.arrowHead);
		this.updateArrow()
	},

	setVertices: function(proceed, verts) {
  		proceed(verts);
		this.updateArrow();
	},

  	updateArrow: function() {
		if (!this.arrowHead)
			return;
        var v = this.shape.vertices();
        var toPos = v[v.length-1];
        var fromPos = v[v.length-2];
        this.arrowHead.pointFromTo(fromPos, toPos);
   	},

	get openForDragAndDrop() {
		return false;
	},

	updateConnection: function () {
		// console.log("updateConnection");
		var world = this.world();
		if (!this.world) return; // because of localize...
				
		if (this.startMorph) {
			var obj1 = this.startMorph;
			var bb1 = obj1.getGlobalTransform().transformRectToRect(obj1.shape.bounds());
		} else {
			var bb1 = rect(this.getGlobalStartPos(),this.getGlobalStartPos());
		}
		if (this.endMorph) {
			var obj2 = this.endMorph;
			var bb2 = obj2.getGlobalTransform().transformRectToRect(obj2.shape.bounds());
		} else {
			var bb2 = rect(this.getGlobalEndPos(),this.getGlobalEndPos());
		}

		var line = this;

		// copied and adpated from graffle Raphael 1.2.1 - JavaScript Vector Library
	    var p = [{x: bb1.x + bb1.width / 2, y: bb1.y - 1},
	        {x: bb1.x + bb1.width / 2, y: bb1.y + bb1.height + 1},
	        {x: bb1.x - 1, y: bb1.y + bb1.height / 2},
	        {x: bb1.x + bb1.width + 1, y: bb1.y + bb1.height / 2},
	        {x: bb2.x + bb2.width / 2, y: bb2.y - 1},
	        {x: bb2.x + bb2.width / 2, y: bb2.y + bb2.height + 1},
	        {x: bb2.x - 1, y: bb2.y + bb2.height / 2},
	        {x: bb2.x + bb2.width + 1, y: bb2.y + bb2.height / 2}];
	    var d = {}, dis = [];
	    for (var i = 0; i < 4; i++) {
	        for (var j = 4; j < 8; j++) {
	            var dx = Math.abs(p[i].x - p[j].x),
	                dy = Math.abs(p[i].y - p[j].y);
	            if ((i == j - 4) || (((i != 3 && j != 6) || 
					p[i].x < p[j].x) && ((i != 2 && j != 7) || p[i].x > p[j].x) && ((i != 0 && j != 5) || 
					p[i].y > p[j].y) && ((i != 1 && j != 4) || p[i].y < p[j].y))) {
	    	            dis.push(dx + dy);
	     	           d[dis[dis.length - 1]] = [i, j];
	            }
	        }
	    }
	    if (dis.length == 0) {
	        var res = [0, 4];
	    } else {
	        var res = d[Math.min.apply(Math, dis)];
	    }
	    var x1 = p[res[0]].x,
	        y1 = p[res[0]].y,
	        x4 = p[res[1]].x,
	        y4 = p[res[1]].y,
	        dx = Math.max(Math.abs(x1 - x4) / 2, 10),
	        dy = Math.max(Math.abs(y1 - y4) / 2, 10),
	        x2 = [x1, x1, x1 - dx, x1 + dx][res[0]].toFixed(3),
	        y2 = [y1 - dy, y1 + dy, y1, y1][res[0]].toFixed(3),
	        x3 = [0, 0, 0, 0, x4, x4, x4 - dx, x4 + dx][res[1]].toFixed(3),
	        y3 = [0, 0, 0, 0, y1 + dy, y1 - dy, y4, y4][res[1]].toFixed(3);

	    var path = ["M", x1.toFixed(3), y1.toFixed(3), 
					"C", x2, y2, x3, y3, x4.toFixed(3), y4.toFixed(3)].join(",");

		if (obj1)
			line.setGlobalStartPos(pt(x1, y1));
			// p2 and p3 are helper points...
		if (obj2)
			line.setGlobalEndPos(pt(x4, y4));
	},

	makeHandle: function(proceed, position, partName, evt) {
		if (partName < 0)
			return null; // no ellipses...
		return proceed(position, partName, evt);
	},

	getStartPos: function() { 
		return this.shape.vertices().first();
	},
	
	getEndPos: function() { 
		return this.shape.vertices().last();
	},
	
	setStartPos: function(proceed, p) {
		var v = this.shape.vertices(); 
		v[0] = p; 
		this.setVertices(v);
	},
	
	setEndPos: function(proceed, p) {
		var v = this.shape.vertices(); 
		v[v.length-1] = p; 
		this.setVertices(v);
	},
	
	localize: function(proceed, p) {
		if (!this.world())
			return p;
		else
			return proceed(p)
	},

	setGlobalStartPos: function(proceed, p) {
		// console.log("set start pos " + p);
		
		this.setStartPos(this.localize(p));
	},

	setGlobalEndPos: function(proceed, p) {
		// console.log("line " + this + " set end pos " + p );
		
		this.setEndPos(this.localize(p));
		
	},

	getGlobalStartPos: function(proceed, p) {
		return this.worldPoint(this.getStartPos());
	},

	getGlobalEndPos: function(proceed, p) {
		return this.worldPoint(this.getEndPos());
	}
});

createLayer("FindMorphLayer");

/**
 *  Little Helper Layer to allow TextMorphs to be used as valid connector points
 *  even if they don't want to be dragged or dropped
 *  TODO: seperated the find Morph from event and drag and drop behavior
 */
layerClass(FindMorphLayer, TextMorph, {
	acceptsDropping: function(){
		return true
	}
})


// make morphs instance-specifically and structurally layerable
Object.extend(Morph.prototype, LayerableObjectTrait);
Morph.prototype.lookupLayersIn = ["owner"];

Morph.makeConnector = function(startPoint, endPoint) {
	endPoint = endPoint || startPoint;
	var m = Morph.makeLine([pt(-1,-1), pt(0,0)], 1, Color.black);
	m.setWithLayers([ConnectorMorphLayer]);
	m.setupConnector();
	m.setGlobalStartPos(startPoint);
	m.setGlobalEndPos(endPoint);
	m.updateArrow()
	return m
}

}); // module Connector
