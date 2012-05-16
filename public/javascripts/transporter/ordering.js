avocado.transporter.module.create('transporter/ordering', function(requires) {

}, function(thisModule) {


thisModule.addSlots(avocado.transporter.module, function(add) {

  add.creator('slotOrderizer', {}, {category: ['transporting']});

  add.method('slotsInOrderForFilingOut', function (f) {
    return Object.newChildOf(this.slotOrderizer, this).calculateDependencies().determineOrder();
  }, {category: ['transporting']});

});


thisModule.addSlots(avocado.transporter.module.slotOrderizer, function(add) {

  add.method('initialize', function (m) {
    this._module = m;
  }, {category: ['creating']});

  add.method('calculateDependencies', function () {
    this.calculateSlotDependencies();
    this._remainingSlotsByMirror = this.buildDictionaryOfRemainingSlotsByMirror();
    this.recalculateObjectDependencies();
    return this;
  }, {category: ['dependencies']});

  add.method('buildDictionaryOfRemainingSlotsByMirror', function () {
    var d = avocado.dictionary.copyRemoveAll();
    this._module.eachSlot(function(s) {
      var holder = s.holder();
      var slots = d.getOrIfAbsentPut(holder, function() { return avocado.set.copyRemoveAll(); });
      slots.add(s);
      if (s.equals(s.contents().theCreatorSlot())) { slots.add(s.contents().parentSlot()); }
      // aaa what about the parent's parent?
    });
    return d;
  }, {category: ['dependencies']});

  add.method('beInDebugMode', function () {
    this._debugMode = true;
    return this;
  });

  add.method('addSlotDependenciesFor', function (s) {
      var contents = s.contents();
      var contentsCreatorSlot = contents.theCreatorSlot();
      if (s.equals(contentsCreatorSlot)) {
        var parentSlot = contents.parentSlot();
        this.addSlotDependenciesFor(parentSlot);
        var parentCreatorSlot = parentSlot.contents().theCreatorSlot();
        if (parentCreatorSlot && parentCreatorSlot.isIncludedInModule(this._module)) {
          this._slotDeps.contentDeps.addDependency(s, parentSlot);
        }
        // aaa what about the parent's parent?
        
        var cdps = contents.copyDownParents();
        cdps.each(function(cdp) {
          var copyDownParent = reflect(cdp.parent);
          var slotsToOmit = avocado.annotator.adjustSlotsToOmit(cdp.slotsToOmit);
          var copyDownParentCreatorSlot = copyDownParent.theCreatorSlot();
          if (copyDownParentCreatorSlot && copyDownParentCreatorSlot.isIncludedInModule(this._module)) {
            this._slotDeps.contentDeps.addDependency(s, copyDownParentCreatorSlot);
          }

          // aaa - For now, make every slot in the copy-down parent exist before the child,
          // because we don't yet have a mechanism to update the copy-down children on
          // the fly as the copy-down parent changes.
          this._module.slotsInMirror(copyDownParent).each(function(slotInCopyDownParent) {
            if (! slotsToOmit.include(slotInCopyDownParent.name())) {
              this._slotDeps.contentDeps.addDependency(s, slotInCopyDownParent);
            }
          }.bind(this));

        }.bind(this));
              
        this._module.slotsInMirror(contents).each(function(slotInContents) {
          this._slotDeps.holderDeps.addDependency(slotInContents, s);
        }.bind(this));
      } else if (! s.initializationExpression()) {
        if (contentsCreatorSlot && contentsCreatorSlot.isIncludedInModule(this._module)) {
          // Need to walk back along the chain and look for storeStrings - if the contents object is part
          // of some larger object that has a storeString, we want to depend on that one (since that's the
          // one that actually creates the object we're referring to).
          var contentsCreatorSlotChain = contents.creatorSlotChain('probableCreatorSlot');
          var creatorSlotToDependOn = contentsCreatorSlot;
          contentsCreatorSlotChain.forEach(function(creatorSlotInChain) { if (creatorSlotInChain.contents().reflecteeStoreString()) { creatorSlotToDependOn = creatorSlotInChain; } });
          this._slotDeps.contentDeps.addDependency(s, creatorSlotToDependOn);
        }
      }
  }, {category: ['dependencies']});

  add.method('calculateSlotDependencies', function () {
    this._slotDeps = {  holderDeps: avocado.dependencies.copyRemoveAll(),
                       contentDeps: avocado.dependencies.copyRemoveAll() };
    
    this._module.slots().each(function(s) { this.addSlotDependenciesFor(s); }.bind(this));
    
    if (this._debugMode) { this.printDependencies(); }
  }, {category: ['dependencies'], comment: 'If Javascript could do "become", this would be unnecessary, since we could just put in a placeholder and then swap it for the real object later.'});

  add.method('printDependencies', function () {
    console.log("Holder dependencies:");
    this._slotDeps.holderDeps.printToConsole();
    console.log("Content dependencies:");
    this._slotDeps.contentDeps.printToConsole();
  }, {category: ['printing']});

  add.method('recalculateObjectDependencies', function () {
    this._objDeps = avocado.dependencies.copyRemoveAll();

    this._slotDeps.holderDeps.eachDependency(function(depender, dependee) {
      this._objDeps.addDependency(depender.holder(), dependee.holder());
    }.bind(this));

    this._slotDeps.contentDeps.eachDependency(function(depender, dependee) {
      this._objDeps.addDependency(depender.holder(), dependee.holder());
    }.bind(this));
  }, {category: ['dependencies']});

  add.method('chooseAMirrorWithThisManyDependees', function (n) {
    return exitValueOf(function(exit) {
      this._remainingSlotsByMirror.eachKeyAndValue(function(mir, slots) {
        if (slots.size() === 0) { throw new Error("Assertion failure: we were supposed to remove the mirror from the dictionary if it had no slots left"); }
        if (this._objDeps.dependeesOf(mir).size() === n) { exit(mir); }
      }.bind(this));
      return null;
    }.bind(this));
  }, {category: ['dependencies']});

  add.method('chooseASlotWithThisManyDependees', function (n, slotsToChooseFrom) {
    if (slotsToChooseFrom) {
      return slotsToChooseFrom.find(function(s) {
        return this._slotDeps.holderDeps.dependeesOf(s).size() === 0 && this._slotDeps.contentDeps.dependeesOf(s).size() === 0;
      }.bind(this));
    } else {
      // choose any remaining slot
      return exitValueOf(function(exit) {
        this._remainingSlotsByMirror.eachKeyAndValue(function(mir, slots) {
          var s = this.chooseASlotWithThisManyDependees(n, slots);
          if (s) { exit(s); }
        }.bind(this));
        return null;
      }.bind(this));
    }
  }, {category: ['dependencies']});

  add.method('chooseSlotToTryToBreakCycle', function () {
    return exitValueOf(function(exit) {
      this._remainingSlotsByMirror.eachKeyAndValue(function(mir, slots) {
        var s = slots.find(function(s) {
          var dependees = this._slotDeps.contentDeps.dependeesOf(s);
          if (this._debugMode) { console.log(s + " depends on " + dependees.toArray().map(function(d) { return d.fullName(); }).join(" and ")); }
          return dependees.size() === 0;
        }.bind(this));
        if (s) { exit(s); }
      }.bind(this));
      return null;
    }.bind(this));
  }, {category: ['dependencies']});

  add.method('rememberCycleBreakerSlot', function (cycleBreakerSlot, originalSlot) {
    console.log("Created cycle-breaker slot for " + originalSlot + ": " + cycleBreakerSlot);
    this._remainingSlotsByMirror.getOrIfAbsentPut(this._cycleBreakersMir, function() {return avocado.set.copyRemoveAll();}).add(cycleBreakerSlot);
    this._cycleBreakersByOriginalSlot.getOrIfAbsentPut(originalSlot, function() {return [];}).push(cycleBreakerSlot);
  }, {category: ['dependencies']});

  add.method('insertCycleBreakerSlot', function () {
    // aaa - This code hasn't been properly tested; I don't trust it yet.
    var slot = this.chooseSlotToTryToBreakCycle();
    if (!slot) {
      var err = new Error("there is a cycle in the slot dependency graph; could not find a slot to use as a cycle-breaker");
      var remainingSlots = this.allRemainingSlots().toArray();
      var deps = remainingSlots.map(function(s) { return this._slotDeps.contentDeps.dependeesOf(s); }.bind(this));
      err.objectsToShow = [avocado.searchResultsPresenter.createForSlots(remainingSlots, "Slots containing cycle"), reflect(deps)];
      console.log("There is a cycle in the slot dependency graph; could not find a slot to use as a cycle-breaker.\n" +
                  "Remaining slots: " + remainingSlots.map(function(s) { return s.fullName(); }).join(", ") + "\n" + 
                  "Dependees: " + deps.map(function(dependees) { return dependees.map(function(dependee) { return dependee.fullName(); }).join(", "); }).join("; "));
      throw err;
    }
    var cycleBreakerSlot = slot.copyTo(this._cycleBreakersMir.rootCategory()).rename(this._cycleBreakersMir.findUnusedSlotName('breaker'));
    var initExpr = slot.initializationExpression();
    if (initExpr) { cycleBreakerSlot.setInitializationExpression(initExpr); }
    this._slotDeps.contentDeps.   addDependency(slot, cycleBreakerSlot);
    this._slotDeps.contentDeps.dependersOf(slot).each(function(depender) {
      this._slotDeps.contentDeps.removeDependency(depender, slot);
      this._slotDeps.contentDeps.   addDependency(depender, cycleBreakerSlot);
      if (this._debugMode) { console.log(depender + " no longer depends on " + slot + ", but on " + cycleBreakerSlot + " instead"); }
    }.bind(this));
    this.rememberCycleBreakerSlot(cycleBreakerSlot, slot);
    this.recalculateObjectDependencies();
  }, {category: ['dependencies']});

  add.method('allRemainingSlots', function () {
    var ss = avocado.set.copyRemoveAll();
    this._remainingSlotsByMirror.eachKeyAndValue(function(mir, slots) {
      slots.each(function(s) { ss.add(s); });
    });
    return ss;
  }, {category: ['accessing']});

  add.method('allSlotsInDependencyLists', function () {
    var ss = avocado.set.copyRemoveAll();
    [this._slotDeps.contentDeps, this._slotDeps.holderDeps].forEach(function(deps) {
      deps.eachDependency(function(depender, dependee) {
        ss.add(depender);
        ss.add(dependee);
      });
    });
    return ss;
  }, {category: ['accessing']});

  add.method('determineOrder', function () {
    if (this._debugMode && false) { // aaa - This seems like it might be broken, it's giving me error messages when I think it shouldn't.
      this._remainingSlotsByMirror.eachKeyAndValue(function(mir, slots) {
        console.log(mir.name() + " contains slots: " + slots);
      });
      
      var remaining = this.allRemainingSlots();
      var inDepLists = this.allSlotsInDependencyLists();
      inDepLists.each(function(s) {
        if (! remaining.include(s)) {
          avocado.ui.grab(s.holder());

          var reason = "I have no idea why";
          if (! s.holder().isWellKnown('probableCreatorSlot')) {
            reason = "its holder is not well-known";
          } else if (! s.isIncludedInModule(this._module)) {
            reason = "it's not included in the " + this._module.name() + " module";
          }

          throw new Error("Found a slot in the dependency lists that isn't in the list of slots to file out, because " + reason + ": " + s.fullName());
        }
      }.bind(this));
    }
    
    this._slotsInOrder = [];
    this._cycleBreakersMir = reflect({});
    this._cycleBreakersByOriginalSlot = avocado.dictionary.copyRemoveAll();

    while (! this._remainingSlotsByMirror.isEmpty()) {
      var nextMirrorToFileOut = this.chooseAMirrorWithThisManyDependees(0);
      if (nextMirrorToFileOut) {
        if (this._debugMode) { console.log("Choosing mirror " + nextMirrorToFileOut + " because it has no dependees."); }
        this.nextObjectIs(nextMirrorToFileOut);
      } else {
        var nextSlotToFileOut = this.chooseASlotWithThisManyDependees(0);
        if (nextSlotToFileOut) {
          if (this._debugMode) { console.log("There is no mirror with no dependees; choosing slot " + nextSlotToFileOut + " because it has no dependees."); }
          this.nextSlotIs(nextSlotToFileOut, true);
        } else {
          this.insertCycleBreakerSlot();
        }
      }
    }
    return this._slotsInOrder;
  }, {category: ['transporting']});

  add.method('nextObjectIs', function (nextMirrorToFileOut) {
    var slots = this._remainingSlotsByMirror.get(nextMirrorToFileOut);
    while (! slots.isEmpty()) {
      var nextSlotToFileOut = this.chooseASlotWithThisManyDependees(0, slots);
      if (nextSlotToFileOut) {
        this.nextSlotIs(nextSlotToFileOut, false);
      } else {
        throw "there is a cycle in the slot dependency graph within an object; breaking the cycle is not implemented yet";
      }
    }
    this._objDeps.removeDependee(nextMirrorToFileOut);
  }, {category: ['transporting']});

  add.method('nextSlotIs', function (s, shouldUpdateObjDeps) {
    if (this._debugMode) { console.log("Next slot is " + s.fullName()); }
    var holder;
    if (s.isParent()) {
      // __proto__ slots need to be in there to make the dependency graph come out right, but shouldn't
      // actually be included in the final ordering; an object's __proto__ is actually done with the
      // object's creator slot. (Necessary in order to support browsers that don't allow __proto__ to be
      // set directly.)
      holder = s.holder().theCreatorSlot().holder();
    } else {
      this._slotsInOrder.push(s);
      holder = s.holder();
    }
    var slots = this._remainingSlotsByMirror.get(holder);
    slots.remove(s);
    if (slots.isEmpty()) { this._remainingSlotsByMirror.removeKey(holder); }
    this._slotDeps. holderDeps.removeDependee(s);
    this._slotDeps.contentDeps.removeDependee(s);
    if (shouldUpdateObjDeps) { this.recalculateObjectDependencies(); }
    
    // aaa - hack: mark the slot as being a cycle-breaker so that the filer-outer
    // can do the right thing.
    if (holder.equals(this._cycleBreakersMir)) {
      s.isCycleBreaker = true;
    }
    var cbs = this._cycleBreakersByOriginalSlot.get(s);
    if (cbs) {
      s.wasReplacedByCycleBreakers = cbs;
    }
  }, {category: ['transporting']});

});


});
