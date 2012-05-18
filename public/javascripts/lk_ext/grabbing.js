Morph.addMethods({
	
	  applicableCommandForDropping: function(morph) { 
	    var cmdList = this.dragAndDropCommands();
  	  if (cmdList) {
  	    var args = [morph];
  	    var applicableCmd = cmdList.itemSuchThat(function(c) { return c.canAcceptArguments(args); });
  	    return applicableCmd;
  	  }
  	  return null;
    },

  	acceptsDropping: function(morph) {
  	  // More general drag-and-drop mechanism, added by Adam.
  	  var c = this.applicableCommandForDropping(morph);
  	  if (c) { return true; }

  		return this.openForDragAndDrop && !(morph instanceof WindowMorph);
  	},

    particularlyWantsToBeDroppedOn: function (m) {
      // I'm not sure I like this mechanism, but I want it for things like MorphChoosers,
      // which should be able to be dropped on anything - the target thing shouldn't
      // need to know anything about it. -- Adam, Nov. 2011
      return false;
    },

    okToBeDroppedOn: function(m) {
      return m && (m.acceptsDropping(this) || this.particularlyWantsToBeDroppedOn(m));
    },
  
    okToReceiveDrop: function(m) {
      return m && m.okToBeDroppedOn(this);
    },
  
    justReceivedDrop: function(morph, hand) {
  	  var c = this.applicableCommandForDropping(morph);
  	  if (c) {
  	    c.go(Event.createFake(), morph); // aaa - can't we get a real event?
  	    if (morph.owner === this && ! this.openForDragAndDrop && hand.grabInfo) { // aaa - not sure this.openForDragAndDrop makes sense here
					var previousOwner    = hand.grabInfo[0];
					var previousPosition = hand.grabInfo[1];
					var world = previousOwner.world();
					if (world) {
  					morph.ensureIsInWorld(world, previousPosition, true, true, false, function() {
  						previousOwner.addMorph(morph);
  					});
					}
	      }
  	  } else if (this.openForDragAndDrop) {
  	    // fine
	    } else {
        throw new Error("for drag-and-drop, children should implement either dragAndDropCommands or justReceivedDrop");
      }
      
      if (this._layout && this._layout.justReceivedDrop) {
        this._layout.justReceivedDrop(morph, hand);
      }
    },

    morphToGrabOrReceive: function(evt, droppingMorph, checkForDnD) {
        // If checkForDnD is false, return the morph to receive this mouse event (or null)
        // If checkForDnD is true, return the morph to grab from a mouse down event (or null)
        // If droppingMorph is not null, then check that this is a willing recipient (else null)

        //if (droppingMorph) {console.log(this.inspect() + ">>morphToGrabOrReceive starting");}

        if (this.owner) { // added by Adam; otherwise we have problems with world-scaling; the world should contain everything.
          if (!this.fullContainsWorldPoint(evt.mousePoint)) return null; // not contained anywhere
        }
        
        // First check all the submorphs, front first
        for (var i = this.submorphs.length - 1; i >= 0; i--) {
            var hit = this.submorphs[i].morphToGrabOrReceive(evt, droppingMorph, checkForDnD);
            if (hit != null) {
              //if (droppingMorph) {console.log(this.inspect() + ">>morphToGrabOrReceive hit: " + hit.inspect());}
                return hit;  // hit a submorph
            }
        }

        // Check if it's really in this morph (not just fullBounds)
        if (!this.containsWorldPoint(evt.mousePoint)) return null;

        // If no DnD check, then we have a hit (unless no handler in which case a miss)
        if (!checkForDnD) {
          if (this.mouseHandler && (!this.grabsShouldFallThrough || !evt.isForGrabbing() || this.shouldAllowSelecting())) { // Modified to check grabsShouldFallThrough and isForGrabbing. -- Adam, March 2010;  and shouldAllowSelecting() -- Adam, June 2011
            //if (droppingMorph) {console.log(this.inspect() + ">>morphToGrabOrReceive has a mouseHandler");}
            return this;
          } else {
            return null;
          }
        }

        // On drops, check that this is a willing recipient
        if (droppingMorph != null) {
          if (this.okToReceiveDrop(droppingMorph)) {
            //if (droppingMorph) {console.log(this.inspect() + ">>morphToGrabOrReceive accepts the droppingMorph");}
            return this;
          } else {
            return null;
          }
        } else {
            // On grabs, can't pick up the world or morphs that handle mousedown
            // DI:  I think the world is adequately checked for now elsewhere
            // else return (!evt.isCommandKey() && this === this.world()) ? null : this;
            return this.okToBeGrabbedBy(evt) ? this : null; // Modified to check okToBeGrabbedBy(evt) -- Adam, August 2008;  
        }

    },

  grabMe: function(evt, callWhenDone) {
    this.scaleAndGrabMe(1 / avocado.ui.worldFor(evt).getScale(), true, evt, callWhenDone);
  },

  scaleAndGrabMe: function(desiredScale, shouldAnticipateAtStart, evt, callWhenDone) {
    evt = evt || Event.createFake(); // just for convenience; I call this method from evaluators pretty often

    var shouldDoCoolAnimations = true;

    // don't use evt because it'll bring up the menu if evt.isForContextMenu(), etc.
    var eventForFinalGrab = Event.createFake(evt.hand);

    if (shouldDoCoolAnimations) {
      var world = avocado.ui.worldFor(evt);
      
      var desiredPos = function() {return evt.hand.position().subPt(this.getExtent().scaleBy((desiredScale || this.overallScale(world)) * 0.5));}.bind(this);
      desiredPos.desiredScale = desiredScale;  // aaa - Not sure at all that this is a good idea. But it might be.
      this.ensureIsInWorld(world, desiredPos, true, shouldAnticipateAtStart, false, function() {
        this.grabMeWithoutZoomingAroundFirst(eventForFinalGrab);
        if (callWhenDone) { callWhenDone(this); }
      }.bind(this));
    } else {
      this.grabMeWithoutZoomingAroundFirst(eventForFinalGrab); 
      if (callWhenDone) { callWhenDone(this); }
    }
  },

  grabMeWithoutZoomingAroundFirst: function(evt) {
    // Had to do this to make the morph be right under the hand, and to get the drop shadows right.
    this.addCenteredAt(evt.hand.position(), evt.hand.world());
    this.refreshContentOfMeAndSubmorphs(); // aaa - not sure this is a good idea, but maybe; it makes sure that a mirror will be updated as soon as it's visible, for one thing.
    evt.hand.grabMorph(this, evt);
  },

  addCenteredAt: function(centerPos, newOwner) {
    var desiredPos = centerPos.subPt(this.getExtent().scaleBy(this.getScale() * 0.5));
    newOwner.addMorphAt(this, desiredPos);
  },

  growFromNothing: function(evt, callWhenDone) {
    var desiredScale = 1;
    this.setScale(desiredScale * 0.01);
    this.grabMeWithoutZoomingAroundFirst(evt);
    this.stayCenteredAndSmoothlyScaleTo(desiredScale, pt(0,0), function() {
      if (this.owner === evt.hand) { // might have been dropped while growing
        evt.hand.showAsGrabbed(this); // to make the drop shadow look right
      }
      if (callWhenDone) { callWhenDone(); }
    }.bind(this));
  },

  growFromNothingAt: function(p, callWhenDone) {
    var desiredScale = 1;
    this.setScale(desiredScale * 0.01);
    this.setPosition(p);
    this.stayCenteredAndSmoothlyScaleTo(desiredScale, p, callWhenDone);
  }

});


WorldMorph.addMethods({

  acceptsDropping: function (m) {
    return true;
  },

  justReceivedDrop: function (m) {
    if (this.okToReceiveDrop(m)) {
      m.wasJustDroppedOnWorld(this);
    }
  }

});


Event.addMethods({
  isForGrabbing: function() {
    return this.type !== 'MouseMove' && this.type !== 'TouchMove' && !this.isForMorphMenu() && !this.isForContextMenu();
  }
});

