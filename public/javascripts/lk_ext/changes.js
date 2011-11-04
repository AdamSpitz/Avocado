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
  }
});

Object.extend(Morph, {
  suppressAllHandlesForever: function() {
    Object.extend(Morph.prototype, {checkForControlPointNear: function(evt) {return false;}});
  }
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
            } else if (m.handlesMouseDown(evt)) return false;
        }
        evt.hand.grabMorph(m, evt);
        return true;
    },
});

Morph.addMethods({
    aboutToReceiveDrop: function(m) {
      // children can override
      
      if (this._shouldScaleSubmorphsToFit) {
  			m.scaleBy(1 / m.transformForNewOwner(this).getScale());
      }
    },
    
    aboutToBeDroppedOn: function(receiver) {
      // children can override
      
      return true; // to indicate that the receiver morph should handle the drop
    },
    
  
    checkForDoubleClick: function(evt) {
      var currentTime = new Date().getTime(); // Use evt.timeStamp? I just tried that and it didn't seem to work.
      if (this.timeOfMostRecentDoubleClickCheck != null && currentTime - this.timeOfMostRecentDoubleClickCheck < 400) { // aaa magic number
        this.timeOfMostRecentDoubleClickCheck = null;
        this.onDoubleClick(evt);
        return true;
      } else {
        this.timeOfMostRecentDoubleClickCheck = currentTime;
        return false;
      }
    },

    onDoubleClick: function(evt) {
      if (UserAgent.isTouch) {
        this.showContextMenu(evt);
      }
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
  		handle.mode = 'reshape';
  		m.addMorph(handle);
  		evt.hand.setMouseFocus(handle);
  		evt.hand.setKeyboardFocus(handle);
  	},
  	
  	shouldAllowSelecting: function() {
  	  return this._shouldAllowSelecting;
  	},
    
    eachSubmorphRecursively: function(f) {
      this.submorphs.forEach(function(m) {
        f(m);
        m.eachSubmorphRecursively(f);
      });
    },
    
    submorphsRecursively: function() {
      return avocado.enumerator.create(this, 'eachSubmorphRecursively');
    },
    
    ownerChainIncludes: function(m) {
      var o = this.owner;
      while (o) {
        if (o === m) { return true; }
        o = o.owner;
      }
      return false;
    },
    
    eachOwnerRecursively: function(f) {
      var o = this.owner;
      while (o) {
        f(o);
        o = o.owner;
      }
    },
    
    ownersRecursively: function() {
      return avocado.enumerator.create(this, 'eachOwnerRecursively');
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
	  
    morphMenu: function(evt) {
        var carryingHand = avocado.CarryingHandMorph.forWorld(this.world());
        var dropCmd = carryingHand.applicableCommandForDroppingOn(this);
        var handEmpty = !carryingHand.carriedMorph();
        var disablePickUpAndDropExperiment = false;
        var items = [
            disablePickUpAndDropExperiment ?
              ["grab", this.pickMeUpLeavingPlaceholderIfNecessary.curry(evt)] // need the placeholders -- Adam  // not needed now that we have "pick up"
              : dropCmd ? ["drop",    function() { carryingHand.dropOn(this, evt); }.bind(this)]
                        : handEmpty ? ["pick up", function() { carryingHand.pickUp(this, evt); }.bind(this)]
                                    : ["",        function() { }],
            ["remove", function() { this.startZoomingOuttaHere(); }.bind(this)], // so much cooler this way -- Adam
            this.okToDuplicate() ? ["duplicate", this.copyToHand.curry(evt.hand)] : null,
            ["zoom to me", this.navigateToMe.curry(evt)], // Added by Adam
            // ["drill", this.showOwnerChain.curry(evt)], // not needed now that we have core samplers. -- Adam
            // ["drag", this.dragMe.curry(evt)], // This menu has too much stuff in it. -- Adam
            this.isInEditMode() ? ["turn off edit mode", function() { this.switchEditModeOff(); }.bind(this)]
                                : ["turn on edit mode" , function() { this.switchEditModeOn (); }.bind(this)],
            ["edit style", function() { new StylePanel(this).open()}],
            ["inspect...",
             [
               this._model ? ["object",       function(evt) { this.world().morphFor(reflect(this._model)).grabMe(evt); }] : ["", function() {}],
               ["morph", function(evt) { this.world().morphFor(reflect(this)).grabMe(evt); }], // OK, I just couldn't resist. -- Adam
             ]
            ],
            /* Meh, I'm not using this right now, and I need the space in the menu. -- Adam
            ["script me", function(evt) {
              var mir = reflect(avocado.morphScripter.create(this));
              var mirMorph = this.world().morphFor(mir);
              mirMorph.openEvaluator(evt);
              mirMorph.grabMe(evt);
            }], // simple scripting interface -- Adam
            */
            /* No browser, mirrors are enough, plus this menu has too much stuff in it. -- Adam
            ["show class in browser", function(evt) { var browser = new SimpleBrowser(this);
                                              browser.openIn(this.world(), evt.point());
                                              browser.getModel().setClassName(this.getType());
            }]
            */
        ];

        if (this.getModel() instanceof SyntheticModel)
            items.push( ["show Model dump", this.addModelInspector.curry(this)]);

        var cmdList = avocado.command.list.create(this, items);
        cmdList.addItem(["tagging...", this.taggingCommands()]);
        
        cmdList.addLine();
        cmdList.addItems(this.subMenuItems(evt));
        var menu = cmdList.createMenu(this);
    		menu.commandStyle = menu.morphCommandStyle;
        return menu;
    },
    
    setModel: function(m) {
      this._model = m;
      return this;
    },

  	inspect: function() {
  		try {
        if (this._model && typeof(this._model.inspect) === 'function') { return this._model.inspect(); } // added by Adam
  			return this.toString();
  		} catch (err) {
  			return "#<inspect error: " + err + ">";
  		}
  	},
  	
  	debugInspect: function() {
  	  var tos = this.toString();
  	  return "a " + this.constructor.type + (tos ? "(" + tos + ")" : "");
  	},

    toString: function() {
      return ""; // the default behaviour is annoying - makes morph mirrors very wide
    },

  	nameUsingContextualInfoIfPossible: function() {
  		try {
        if (this._model && this._model.namingScheme) {
          return this._model.namingScheme.nameInContext(this._model, this);
        }
        return this.inspect();
  		} catch (err) {
  			return "#<naming error: " + err + ">";
  		}
  	},
  	
  	enclosingObjectHavingANameInScheme: function(namingScheme) {
  	  var m = this.owner;
  	  while (m) {
  	    if (m._model && m._model.namingScheme) {
  	      if (m._model.namingScheme === namingScheme) { return m._model; }
  	    }
  	    m = m.owner;
  	  }
  	  return null;
  	},
  	
  	setFillIfNecessary: function(paint) {
  	  // aaa - maybe this could just be part of setFill?
  	  if (paint !== this._fill) {
  	    this.setFill(paint);
	    }
  	  return this;
  	}
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
  isSameTypeAs: function(m) {
    return m && m['__proto__'] === this['__proto__'];
  },
  
  ownerSatisfying: function(condition) {
    if (!this.owner) { return null; }
    if (condition(this.owner)) { return this.owner; }
    return this.owner.ownerSatisfying(condition);
  },
  
  ownerWithAModel: function() {
    if (typeof(this._model) !== 'undefined') { return this; }
    return this.ownerSatisfying(function(m) { return typeof(m._model) !== 'undefined'; });
  },
  
  outermostOwner: function() {
    var m = this;
    while (m) {
      var o = m.owner;
      if (!o || o instanceof WorldMorph) { return m; }
      m = o;
    }
    throw new Error("Should never get here.");
  }
});


Morph.addMethods({
  addMorphCentered: function(m, callWhenDone) {
    this.animatedAddMorphAt(m, this.getExtent().subPt(m.getExtent()).scaleBy(0.5), callWhenDone);
  },
  
  // really should fix the names of these two functions; without animation should be the default -- Adam
  withoutAnimationAddMorphCentered: function(m, callWhenDone) {
    var p = this.getExtent().subPt(m.getExtent()).scaleBy(0.5);
    // console.log("this.getExtent(): " + this.getExtent() + ", m.getExtent(): " + m.getExtent() + ", p: " + p);
    this.addMorphAt(m, p);
  },
});


Morph.addMethods({
  ownerLocalize: function(pt) {
		if (! this.owner) { return pt; }
    return this.owner.localize(pt);
  },
  
  handIsOverMe: function (hand) {
    return this.shape.containsPoint(this.localize(hand.getPosition()));
  }
});


WorldMorph.addMethods({
  ownerLocalize: function(pt) {
		if (pt == null) console.log('null pt in ownerLocalize');   
		return pt.matrixTransform(this.getTransform());
  }
});


Morph.addMethods({
  replaceMorph: function(m, newSubmorph) {
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
