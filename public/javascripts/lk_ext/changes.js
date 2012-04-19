WorldMorph.addMethods({
  onMouseDown: function($super, evt) {
    // Added by Adam, Feb. 2008, because sometimes it's useful
    // to have no keyboard focus (so that, for example, I can
    // hit Cmd-t to open a new tab).
    //
    // NOTE: I once tried making this line say setKeyboardFocus(this),
    // and for some reason Style Editors broke. (They're probably
    // not the only thing that broke, but that was the thing I
    // noticed.) I have no idea why, but it's not important right
    // now, so I'm letting it go. -- Adam, Nov. 2010
    evt.hand.setKeyboardFocus(null);
    
    this.removeAllPartialCommandMorphs();

    if (this.shouldSlideIfClickedAtEdge) { this.slideIfClickedAtEdge(evt); }

    return $super(evt);
  },
  
  worldPointCorrespondingToScreenPoint: function (p) {
    return p;
  }
});

Object.extend(Morph, {
  suppressAllHandlesForever: function() {
    Object.extend(Morph.prototype, {checkForControlPointNear: function(evt) {return false;}});
  },
});

PasteUpMorph.addMethods({
    onMouseDown: function PasteUpMorph$onMouseDown($super, evt) {  //default behavior is to grab a submorph
      $super(evt);
      var m = this.morphToReceiveEvent(evt, null, true); // Modified to checkForDnD -- Adam, August 2008
      if (Config.usePieMenus) {
        if (m.handlesMouseDown(evt)) return false;
        m.showPieMenu(evt, m);
        return true;
      }
      if (m == null) {
        if (evt.isLeftMouseButtonDown()) { // Added the isLeftMouseButtonDown check, 'cause I like it better that way. -- Adam, Jan. 2009
          if (! UserAgent.isTouch) { // don't want SelectionMorphs on touch-screens -- Adam
            this.makeSelection(evt);
          }
          return true;
        } else {
          return false;
        }
      } else if (!evt.isForContextMenu() && !evt.isForMorphMenu()) { // Changed from a simple isCommandKey check. -- Adam, Jan. 2009
        if (m === this.world()) {
          if (! UserAgent.isTouch) { // don't want SelectionMorphs on touch-screens -- Adam
            this.makeSelection(evt);
          }
          return true;
        } else if (m.handlesMouseDown(evt)) {
          return false;
        }
      }
      evt.hand.grabMorph(m, evt);
      return true;
    },
});

Morph.addMethods({
  getOwner: function() { return this.owner; },

  getShape: function() { return this.shape; },
  
  eachSubmorph: function(f) {
    for (var i = 0, n = this.submorphs.length; i < n; ++i) {
      f(this.submorphs[i]);
    }
  },

  topmostOwnerBesidesTheWorldAndTheHand: function () {
    var m = this;
    while (m.owner && ! (m.owner instanceof WorldMorph) && ! (m.owner instanceof HandMorph)) {
      m = m.owner;
    }
    return m;
  },
  
  // for compatibility with 3D
  setTopLeftPosition:    function(p      ) { return this.setTopLeftPositionXY(p.x, p.y); },
  setTopLeftPositionXY:  function(x, y   ) { return this.setPositionXY(x, y); },
  setTopLeftPositionXYZ: function(x, y, z) { return this.setTopLeftPositionXY(x, y); },
  
  getOriginAAAHack: function() { return pt(0,0); }, // aaa for compatibility with 3D, but it's a bug, I need to just fix it
  
  rotateToFaceTheCamera: function() {}, // nothing necessary here, just for compatibility with 3D
  
  getHorizontalScale: function () { return this.scalePoint.x; },
  getVerticalScale:   function () { return this.scalePoint.y; },
  setHorizontalScale: function (s) { this.setScalePoint(pt(s, this.scalePoint.y)); return this; },
  setVerticalScale:   function (s) { this.setScalePoint(pt(this.scalePoint.x, s)); return this; },
});

Morph.addMethods({
  
  overallScaleTakingUsersPositionIntoAccount: function() {
    return this.overallScale();
  },
  
    aboutToReceiveDrop: function(m) {
      // children can override
      
      if (this._layout && this._layout.aboutToReceiveDrop) {
        this._layout.aboutToReceiveDrop(m);
      }
    },
    
    aboutToBeDroppedOn: function(receiver) {
      // children can override
      
      return true; // to indicate that the receiver morph should handle the drop
    },
    
  
    checkForDoubleClick: function(evt) {
      if (evt.isDoubleClick()) {
        return this.onDoubleClick(evt);
      } else {
        return false;
      }
    },

    onDoubleClick: function(evt) {
      if (this._eventHandler && this._eventHandler.onDoubleClick) {
        return this._eventHandler.onDoubleClick(this, evt);
      } else if (window.avocado && avocado.defaultDoubleClickHandler) {
        return avocado.defaultDoubleClickHandler(this, evt);
      } else if (UserAgent.isTouch) {
        return this.showContextMenu(evt);
      } else {
        return false;
      }
    },

    handlesDoubleClick: function(evt) {
      if (this._eventHandler && this._eventHandler.onDoubleClick) { return true; }
      if (window.avocado && avocado.defaultDoubleClickHandler) { return true; }
      if (UserAgent.isTouch) { return true; }
      return false;
    },

    // Copied and adapted from PasteUpMorph - it's convenient to be able to allow any morph to do selecting. -- Adam, June 2011
  	makeSelection: function(evt) {	//default behavior is to grab a submorph
  		if (this.currentSelection != null) this.currentSelection.removeOnlyIt();

      var p = this.localizePointFrom(evt.point(), this.world());
  		var m = new SelectionMorph(p.asRectangle(), this);
  		this.currentSelection = m;

  		this.addMorph(m);
  		var handle = new HandleMorph(pt(0,0), lively.scene.Rectangle, evt.hand, m, "bottomRight");
  		handle.setExtent(pt(0, 0));
      handle.focusHaloBorderWidth = 0; // added by Adam; the halo looks weird
  		handle.mode = 'reshape';
  		m.addMorph(handle);
  		evt.hand.setMouseFocus(handle);
  		evt.hand.setKeyboardFocus(handle);
  	},
  	
  	shouldAllowSelecting: function() {
  	  return this._shouldAllowSelecting;
  	},
});

Object.extend(Event.prototype, {
  isDoubleClick: function() {
    var previous = this.hand.lastMouseDownEvent;
    return previous && this.timeStamp && previous.timeStamp && this.timeStamp - previous.timeStamp < 400; // aaa magic number
  }
});

HandMorph.addMethods({
    dropMorphsOn: function(receiver) {
        if (receiver !== this.world()) this.unbundleCarriedSelection();
        if (this.logDnD) console.log("%s dropping %s on %s", this, this.topSubmorph(), receiver);
        this.carriedMorphsDo( function(m) {
            var shouldLetTheReceiverHandleIt = m.aboutToBeDroppedOn(receiver); // Added by Adam
            if (shouldLetTheReceiverHandleIt) {
              receiver.aboutToReceiveDrop(m); // Added by Adam
              m.dropMeOnMorph(receiver);
              this.showAsUngrabbed(m);
              receiver.justReceivedDrop(m, this); // Added by Adam
            }
        });
        this.removeAllMorphs(); // remove any shadows or halos
    },

    // Copied-and-pasted the bottom half of grabMorph. Needed for
    // stuff that should be able to be explicitly grabbed, but
    // not through the default "just click to pick it up" mechanism. -- Adam
    grabMorphWithoutAskingPermission: function(grabbedMorph, evt) {
        if (this.keyboardFocus && grabbedMorph !== this.keyboardFocus) {
            this.keyboardFocus.relinquishKeyboardFocus(this);
        }
        // console.log('grabbing %s', grabbedMorph);
        // Save info for cancelling grab or drop [also need indexInOwner?]
        // But for now we simply drop on world, so this isn't needed
        this.grabInfo = [grabbedMorph.owner, grabbedMorph.position()];
        if (this.logDnD) console.log('%s grabbing %s', this, grabbedMorph);
        this.addMorphAsGrabbed(grabbedMorph);
        // grabbedMorph.updateOwner();
        this.changed(); //for drop shadow
    },

    grabMorph: function(grabbedMorph, evt) {
        if (evt.isShiftDown() || (grabbedMorph.owner && grabbedMorph.owner.copySubmorphsOnGrab == true)) {
            if (!grabbedMorph.okToDuplicate()) return;
            grabbedMorph.copyToHand(this);
            return;
        }
        if (evt.isForMorphMenu()) {
            grabbedMorph.showMorphMenu(evt);
            return;
        }
        if (evt.isForContextMenu()) { // Changed from a simple isCommandKey check. -- Adam, Jan. 2009
            grabbedMorph.showContextMenu(evt);
            return;
        }
        // Give grabbed morph a chance to, eg, spawn a copy or other referent
        grabbedMorph = grabbedMorph.okToBeGrabbedBy(evt);
        if (!grabbedMorph) return;
        
        // A morph with a whooshOuttaHereTimer is supposed to whoosh away after a short while, unless the user touches it. -- Adam
        if (grabbedMorph.whooshOuttaHereTimer) { clearTimeout(grabbedMorph.whooshOuttaHereTimer); }

        // aaa - I think this is not what we want. openForDragAndDrop should mean
        // that the morph is open for arbitrary embedding, but even if it's not,
        // we may want to grab a morph for some other reason. Use suppressGrabbing
        // if you want to disable grabbing a morph altogether. I think. -- Adam, Apr. 2011
        // if (grabbedMorph.owner && !grabbedMorph.owner.openForDragAndDrop) return;

        if (this.keyboardFocus && grabbedMorph !== this.keyboardFocus) {
            this.keyboardFocus.relinquishKeyboardFocus(this);
        }
        // console.log('grabbing %s', grabbedMorph);
        // Save info for cancelling grab or drop [also need indexInOwner?]
        // But for now we simply drop on world, so this isn't needed
        this.grabInfo = [grabbedMorph.owner, grabbedMorph.position()];
        if (this.logDnD) console.log('%s grabbing %s', this, grabbedMorph);
        this.addMorphAsGrabbed(grabbedMorph);
        // grabbedMorph.updateOwner();
        this.changed(); //for drop shadow
    }
});

TextMorph.addMethods({
  getText: function()  {return this.textString;},
  setText: function(t) {if (this.textString !== t) {this.updateTextString(t); this.layoutChanged(); this.changed();}},

  // Just wondering whether I can set a TextMorph to be bold/italic and have it stay that way no matter what text I give it.
  setEmphasis: function(emph) {
    var txt = new lively.Text.Text(this.textString, this.textStyle);
    txt.emphasize(emph, 0, this.textString.length);
    this.textStyle = txt.style;
    this.composeAfterEdits();
    return this;
  },
  
  updateStyle: function($super) {
    $super();
    if (avocado.shouldHideTextSmallerThan) {
      var overallFontSize = this.getFontSize() * this.overallScale();

      var tooSmall = overallFontSize < avocado.shouldHideTextSmallerThan;
      if (tooSmall && !this._textColorToUseWhenNotHidden) {
        this._textColorToUseWhenNotHidden = this.getTextColor();
        this.setTextColor(null);
      } else if (!tooSmall && this._textColorToUseWhenNotHidden) {
        this.setTextColor(this._textColorToUseWhenNotHidden);
        delete this._textColorToUseWhenNotHidden;
      }
    }
  }
});
    
Class.newInitializer = function(name) {
  // this hack ensures that class instances have a name
  var c = eval(Class.initializerTemplate.replace(/CLASS/g, name) + ";" + name);
  
  // Put it in a category so that it doesn't clutter up the window object. -- Adam
  if (window.avocado && avocado.annotator && name.startsWith('anonymous_')) {
    avocado.annotator.annotationOf(window).setSlotAnnotation(name, {category: ['anonymous classes']});
  }

  return c;
};

Morph.addMethods({
	  pickMeUpLeavingPlaceholderIfNecessary: function(evt) {
	    this.becomeDirectSubmorphOfWorld(evt.hand.world());
  	  this.pickMeUp(evt);
	  },
	  
	  shouldBeEasilyGrabbable: function() {
	    if (avocado.shouldMorphsOnlyBeEasilyGrabbableIfTheyExplicitlySaySo) {
  	    if (this._model && typeof(this._model.shouldBeEasilyGrabbable) === 'function') {
  	      return this._model.shouldBeEasilyGrabbable();
  	    }
  	    return false;
	    } else {
	      return !this.isWorld;
	    }
    },

	  pullCloser: function(evt, callback, desiredScale) {
	    var world = evt.hand.world();
	    this.becomeDirectSubmorphOfWorld(world);
	    var space = this.getExtent().scaleBy(this.getScale());
	    var worldExtent = world.getExtent();
	    desiredScale = desiredScale || this.getScale() * Math.max(1, Math.min(worldExtent.x / space.x, worldExtent.y / space.y) * 0.5);
	    // console.log("this.getExtent(): " + this.getExtent() + ", this.getScale(): " + this.getScale() + ", world.getExtent(): " + world.getExtent() + ", world.getScale(): " + world.getScale());
  	  this.stayCenteredAndSmoothlyScaleTo(desiredScale, pt(0,0), function() {
    	  if (callback) { callback(); }
  	  }.bind(this));
    },
    
	  grabAndPullMe: function(evt, callback) {
	    this.pullCloser(evt, function() {
    	  this.grabMeWithoutZoomingAroundFirst(evt);
    	  if (callback) { callback(); }
  	  }.bind(this));
	  },

	  grabAndPullMeOrPutMeBack: function(evt, callback) {
      if (this._placeholderMorphIJustCameFrom) {
        this._placeholderMorphIJustCameFrom.layout().putOriginalMorphBack(callback);
      } else {
        this.grabAndPullMe(evt, callback);
      }
	  },
    
  	debugInspect: function() {
  	  var tos = this.toString();
  	  return "a " + this.constructor.type + (tos ? "(" + tos + ")" : "");
  	},

    useBackgroundImage: function(url) {
      if (!this._image) {
        var extent = this.getExtent();
    		this._image = new lively.scene.Image(url, extent.x, extent.y);
    		this._image.rawNode.setAttribute("preserveAspectRatio", "none");
    		this.addNonMorph(this._image.rawNode);
    		/*
    		How do I make it stay in the back?
    		this._image = new ImageMorph(pt(0,0).extent(extent), url);
    		this._image.ignoreEvents();
    		this._image.image.rawNode.setAttribute("preserveAspectRatio", "none");
    		this.addMorphBack(this._image);
    		*/
      } else {
        var extent = this.getExtent();
        this._image.setWidth (extent.x);
        this._image.setHeight(extent.y);
        //this._image.setExtent(extent);
      }
    },
});

avocado.morphWithAModel = {
  prompter: {
    prompt: function (caption, context, evt, callback) {
      evt.hand.world().showMessage("Must pick up a target object first.", Color.red); // aaa let the user just click on the target
    }
  },
  
  doesTypeMatch: function (obj) {
    return obj && typeof(obj._model) !== 'undefined' && obj instanceof Morph;
  }
};

Morph.addMethods({
  setHelpText: function(t) {
    this.getHelpText = function() { return t; };
    return this;
  }
});


Morph.addMethods({
  changeNotifier: function() {
    // aaa - A hack to allow someone to ask to be notified when a particular morph
    // changes. Useful for arrows - we can make sure to update the arrow the instant
    // its endpoint moves.
    return this._changeNotifier || (this._changeNotifier = avocado.notifier.on(this));
  }
});


Morph.addMethods({
  animatedAddMorphCentered: function(m, callWhenDone) {
    this.animatedAddMorphCenteredAt(m, this.getExtent().scaleBy(0.5), callWhenDone);
  },
  
  animatedAddMorphCenteredAt: function(m, centerPt, callWhenDone) {
    this.animatedAddMorphAt(m, centerPt.subPt(m.getExtent().scaleBy(0.5)), callWhenDone);
  },
  
  addMorphCentered: function(m) {
    this.addMorphCenteredAt(m, this.getExtent().scaleBy(0.5));
  },

  addMorphCenteredAt: function(m, centerPt) {
    this.addMorphAt(m, centerPt.subPt(m.getExtent().scaleBy(0.5)));
  },
});


Morph.addMethods({
  handIsOverMe: function (hand) {
    return this.shape.containsPoint(this.localize(hand.getPosition()));
  },
  
  submorphThatHandIsOver: function (hand) {
    for (var i = 0, n = this.submorphs.length; i < n; ++i) {
      var m = this.submorphs[i];
      if (m.handIsOverMe(hand)) { return m; }
    }
    return null;
  },
});


Morph.addMethods({
  setExtentIfChanged: function (newExtent) {
    if (! newExtent.eqPt(this.getExtent())) {
      this.setExtent(newExtent);
      //this.smoothlyResizeTo(newExtent); // aaa - doesn't quite work right yet
    }
  }
});

Morph.addMethods({
  replaceMorph: function(m, newSubmorph) {
    // Let the layout take care of it if it wants to.
    if (this._layout && this._layout.replaceMorph) { return this._layout.replaceMorph(m, newSubmorph); }
    
    // This method is kind of a combination of addMorphFrontOrBack and removeMorph. -- Adam
    
		var index = this.submorphs.indexOf(m);
		if (index < 0) {
			m.owner !== this && console.log("%s has owner %s that is not %s?", m, m.owner, this);
			return null;
		}

		if (newSubmorph.owner) {
			var tfm = newSubmorph.transformForNewOwner(this);
			newSubmorph.owner.removeMorph(newSubmorph); // KP: note not m.remove(), we don't want to stop stepping behavior
			newSubmorph.setTransform(tfm); 
			// FIXME transform is out of date
			// morph.setTransform(tfm); 
			// m.layoutChanged(); 
		} 
		
		var position = m.getPosition();
		m.replaceRawNode(newSubmorph.rawNode);
		var spliced = this.submorphs.spliceAndAdjustCreatorSlots(index, 1, newSubmorph); // aaa fileout hack -- Adam
		if (spliced instanceof Array) spliced = spliced[0];
		if (m !== spliced) {
			console.log("invariant violated removing %s, spliced %s", m, spliced);
		}
		
		// cleanup, move to ?
		// Gotta make sure to leave the replaced morph at the right scale, so that if we then add it back to the world it'll look right. -- Adam
		var mScale = m.overallScale(this.world());
		m.owner = null;
		m.setScale(mScale);
		m.setHasKeyboardFocus(false);
		this.layoutManager.removeMorph(this, m);

		newSubmorph.owner = this;
		newSubmorph.changed();
		newSubmorph.layoutChanged();
		
		this.layoutChanged();
		
		newSubmorph.setPosition(position);
  },
});


Object.extend(lively.scene.Rectangle, {
  createWithIrrelevantExtent: function () {
    // This is a small hack. Sometimes we just want a default shape and we don't really
    // care what it is because it's going to be changed immediately anyways.
    // But LK doesn't let us create a Morph without a shape.
    return new this(new Rectangle(0, 0, 10, 10));
  }
});


Object.extend(HandMorph.prototype, {
  shouldNotBePartOfRowOrColumn: true
});


Object.extend(HandleMorph.prototype, {
  shouldNotBePartOfRowOrColumn: true
});


ButtonMorph.addMethods({
  pushMe: function() {
    this.getModel().setValue(false);
  }
});


ImageMorph.addMethods({
  beLabel: function() {
    this.applyStyle(this.labelStyle);
    return this;
  },
  
  labelStyle: {
    fill: null,
    suppressGrabbing: true,
    shouldIgnoreEvents: true,
    openForDragAndDrop: false
  },
  
  keepAspectRatioAndResizeToAtMost: function(desiredExtent) {
    var originalImageSize = this.originalImageSize(this.getURL());
    var yIfWeUseTheDesiredX = desiredExtent.x * originalImageSize.y / originalImageSize.x;
    var xIfWeUseTheDesiredY = desiredExtent.y * originalImageSize.x / originalImageSize.y;
    if (yIfWeUseTheDesiredX > desiredExtent.y) {
      this.setExtent(pt(xIfWeUseTheDesiredY, desiredExtent.y));
    } else {
      this.setExtent(pt(desiredExtent.x, yIfWeUseTheDesiredX));
    }
    return this;
  }
});

SelectionMorph.addMethods({
  inspect: function () {
    return avocado.command.list.descriptionOfGroup(this.selectedMorphs);
  },

  commands: function () {
    var cmdList = avocado.command.list.create();
    cmdList.addItemsFromGroup(this.selectedMorphs);
    return cmdList;
  }
});

Object.extend(lively.scene.Rectangle.prototype, {
  area: function() { return this.bounds().area(); }
});

Object.extend(lively.paint.Gradient.prototype, {
  // Copied over from Color.
  
	darker: function(recursion) { 
		if (recursion == 0) 
			return this;
		var result = this.mixedWith(Color.black, 0.5);
		return recursion > 1  ? result.darker(recursion - 1) : result;
	},

	lighter: function(recursion) { 
		if (recursion == 0) 
			return this;
		var result = this.mixedWith(Color.white, 0.5);
		return recursion > 1 ? result.lighter(recursion - 1) : result;
	},

	mixedWith: function(color, proportion) {
		var result = this.copyRemoveAll();
		for (var i = 0; i < this.stops.length; ++i) {
			result.addStop(this.stops[i].offset(), this.stops[i].color().mixedWith(color, proportion));
		}
		return result;
	}
});

Object.extend(lively.paint.LinearGradient.prototype, {
    copyRemoveAll: function() {
        return new this.constructor([], this.vector);
    }
});

Object.extend(lively.paint.RadialGradient.prototype, {
    copyRemoveAll: function() {
        return new this.constructor([], this.focus());
    },
    
    focus: function() {
        return pt(this.getTrait('fx'), this.getTrait('fy'));
    }
});


Object.extend(FileDirectory.prototype, {
  newMorph: function () {
    return avocado.treeNode.newMorphFor(this);
  }
});
