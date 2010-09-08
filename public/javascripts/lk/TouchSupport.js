module('lively.TouchSupport').requires('cop.Layers').toRun(function() {

if (!UserAgent.isTouch) return;

Event.touchEvents = ["touchstart", "touchmove", "touchend", "touchcancel"];
Event.gestureEvents = ["gesturestart", "gesturechange", "gestureend"];
Event.basicInputEvents = Event.basicInputEvents.concat(Event.touchEvents, Event.gestureEvents);
		
Event.addMethods({

	capitalizer: Object.extend(Event.prototype.capitalizer, {
		// let's map the touch events to mouse events for now
		touchstart: 'MouseDown', touchmove: 'MouseMove', touchend: 'MouseUp', touchcancel: 'TouchCancel', gesturestart: 'GestureStart', gesturechange: 'GestureChange', gestureend: 'GestureEnd',
		// touchstart: 'TouchStart', touchmove: 'TouchMove', touchend: 'TouchEnd', touchcancel: 'TouchCancel',
	}),

	isLeftMouseButtonDown: function() {
		return this.rawEvent.button === 0 || this.isTouchEvent();
	},
		
	isTouchEvent: function() {
		return Event.touchEvents.include(this.rawEvent.type);
	},
	
	prepareMousePoint: function() {
		if (this.isMouseEvent()) {
			this.addMousePoint(this.rawEvent)
			return;
		}
		if (this.isTouchEvent()) {
			var touch = this.changedTouches()[0];
			if (!touch) {
				console.warn('Cannot setup touch event because cannot find touch!');
				return
			}
			this.addMousePoint(touch);
		}
	},

	isGesture: function() { return this.touches().length > 1 },
	
	// see http://www.sitepen.com/blog/2008/07/10/touching-and-gesturing-on-the-iphone/
	touches: function() { return this.rawEvent.touches },
	targetTouches: function() { return this.rawEvent.targetTouches },
	changedTouches: function() { return this.rawEvent.changedTouches },
	
});

// overwrite default behavior
createLayer('TouchSupportLayer')
layerClass(TouchSupportLayer, HandMorph, {

	handleEvent: function(proceed, rawEvt) {
		
		if (false) { // not yet
			var evt = new Event(rawEvt);
			evt.hand = this;
			if (evt.type.startsWith('Touch')) {
				this.handleTouch(evt);
				evt.stopPropagation();
				return
			} else if (rawEvt.type.startsWith('gesture')) {
			  console.log("handleEvent, evt.type is " + evt.type + ", rawEvt.type is " + rawEvt.type); // Added by Adam
			} else {
			  console.log("handleEvent, evt.type is " + evt.type + ", rawEvt.type is " + rawEvt.type); // Added by Adam
			}
		}
		
		if (rawEvt.type.startsWith('touch')) {
		  if (rawEvt.changedTouches.length > 1) {
		    return;
		  }
		} else if (rawEvt.type.startsWith('gesture')) {
		  // console.log("handleEvent, rawEvt.type is " + rawEvt.type + ", rawEvt.target is " + Object.inspect(rawEvt.target) + ", rawEvt.scale is " + rawEvt.scale + ", rawEvt.rotation is " + rawEvt.rotation); // Added by Adam
		  
		  // aaa - OK, the multitouch gesture stuff isn't working yet, forget it for now.
		  return;
		}

		// do default event dispatch
		var evt = proceed(rawEvt);

		//console.log("about to do default event stuff, evt.type is " + evt.type + ", rawEvt.type is " + rawEvt.type + ", target is " + Object.inspect(reflect(rawEvt.target)));

		if (!evt.isTouchEvent()) return

		// dirty hack to invoke the soft keyboard
		// console.log(evt.type)
		if (evt.hand.mouseFocus && evt.hand.mouseFocus.constructor == TextMorph) 
			return

		if (rawEvt.changedTouches.length > 1) {
			console.log('Multi touch!!!')
			return
		}

		// User Config.touchBeMouse?
		evt.preventDefault();
		
	},

});

enableLayer(TouchSupportLayer)



Morph.addMethods({
	// not used yet
	onTouchStart: Morph.prototype.onMouseDown,
	onTouchMove: Morph.prototype.onMouseMove,
	onTouchEnd: Morph.prototype.onMouseUp,
	onTouchCancel: Functions.Null,
});


// not yet
HandMorph.addMethods({
	
	handleTouch: function(evt) {
		
		if (evt.isGesture()) {
			console.log('Gestures not yet supported');
			return;
		}
		
		this.lastMouseEvent = evt; 

		// evt.mousePoint is the position if the touch that started the event
		this.setPosition(evt.mousePoint);

		evt.preventDefault(); // Added by Adam, don't want dragging to scroll the browser window.
		
		try {
			this['handle' + evt.type](evt);
		} catch (e) {
			console.warn('Touch event error: ' + e);
		}
		
		return true;
	},

// ----- the following methods are required when we don't want to map touch events to existing mouse events ----------
// Uncommented them all. -- Adam
	handleTouchMove: function(evt) {
		this.updateGrabHalo();
		
		if (evt.mousePoint.dist(this.lastMouseDownPoint) > 10)
			this.hasMovedSignificantly = true;
		
		if (this.mouseFocus) { // if mouseFocus is set, events go to that morph
			this.mouseFocus.captureMouseEvent(evt, true);
			return true;
		} 
		
		var world = this.owner;
		if (world) {
			var receiver = world.morphToReceiveEvent(evt);
			if (this.checkMouseOverAndOut(receiver, evt)) {	 // mouseOverMorph has changed...
				if (!receiver || !receiver.canvas()) return false;	// prevent errors after world-switch
				// Note if onMouseOver sets focus, it will get onMouseMove
				if (this.mouseFocus) this.mouseFocus.captureMouseEvent(evt, true);
				else if (!evt.hand.hasSubmorphs()) world.captureMouseEvent(evt, false);
			} else if (receiver) {
			  // gestureHandler stuff added by Adam, want to use Moousture for gestures
			  if (receiver.gestureHandler) {
			    receiver.gestureHandler(evt.rawEvent);
			  } else {
			    receiver.captureMouseEvent(evt, false);
			  }
			}
		}
		return true
	},
	
	handleTouchStart: function(evt) {
		console.log(evt.type);
		
		this.mouseButtonPressed = true // we pretend...
		this.setBorderWidth(2);
		evt.setButtonPressedAndPriorPoint(true, this.lastMouseEvent ? this.lastMouseEvent.mousePoint : null);
		
		if (this.mouseFocus != null) {
			//console.log('mosuefocus has ' + this.mouseFocus)
			this.mouseFocus.captureMouseEvent(evt, true);
			this.lastMouseDownPoint = evt.mousePoint;
			return true
		}

		//console.log('no mouse focus')

		var world = this.owner;
		if (!world) return false;

		this.lastMouseDownPoint = evt.mousePoint;
		this.lastMouseDownEvent = evt;
		this.hasMovedSignificantly = false;
		
		if (this.hasSubmorphs()) {
			// If laden, then drop on mouse up or down
			var m = this.topSubmorph();
			var receiver = world.morphToGrabOrReceiveDroppingMorph(evt, m);
			// For now, failed drops go to world; later maybe put them back?
			this.dropMorphsOn(receiver || world);
			return true
		}
		
		//console.log('world captures event')
		world.captureMouseEvent(evt, false);
		return true
		
	},
	
	handleTouchEnd: function(evt) {
		this.mouseButtonPressed = false;
		this.setBorderWidth(1);
		evt.setButtonPressedAndPriorPoint(false, this.lastMouseEvent ? this.lastMouseEvent.mousePoint : null);
		
		if (this.mouseFocus != null) {
			this.mouseFocus.captureMouseEvent(evt, true);
			return true
		}
		
		var world = this.owner;
		if (!world) return false;
		
		if (this.hasSubmorphs() && this.hasMovedSignificantly) {
			// If laden, then drop on mouse up or down
			var m = this.topSubmorph();
			var receiver = world.morphToGrabOrReceiveDroppingMorph(evt, m);
			// For now, failed drops go to world; later maybe put them back?
			this.dropMorphsOn(receiver || world);
		}
		
		return true
	},
	handleTouchCancel: function(evt) {},
});


}) // end of module
