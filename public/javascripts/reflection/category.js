transporter.module.create('reflection/category', function(requires) {}, function(thisModule) {


thisModule.addSlots(avocado, function(add) {

  add.creator('category', {}, {category: ['reflection']});

});


thisModule.addSlots(avocado.category, function(add) {

  add.creator('ofAParticularMirror', {}, {category: ['prototypes']});

});


thisModule.addSlots(avocado.category.ofAParticularMirror, function(add) {

  add.method('create', function (mir, parts) {
    return Object.newChildOf(this, mir, parts);
  }, {category: ['creating']});

  add.method('initialize', function (mir, parts) {
    this._mirror = mir;
    this._parts = parts;
    // aaa HACK why are we getting an undefined in the first place? And why only in JSQuiche, not the regular Avocado?
    for (var i = 0, n = parts.length; i < n; ++i) { if (parts[i] === undefined) { parts[i] = "undefined"; } }
  }, {category: ['creating']});

  add.method('mirror', function () { return this._mirror; }, {category: ['accessing']});

  add.method('toString', function () { return this.fullName(); }, {category: ['printing']});

  add.method('fullName', function () { return this._parts.join(" "); }, {category: ['accessing']});

  add.method('sortOrder', function () { return this.isRoot() ? '' : this.lastPart().toUpperCase(); }, {category: ['sorting']});

  add.method('part', function (i) {
    if (this.isRoot()) { return ""; }
    return this._parts[i];
  }, {category: ['accessing']});

  add.method('parts', function () { return this._parts; }, {category: ['accessing']});

  add.method('isRoot', function () { return this._parts.length === 0; }, {category: ['testing']});

  add.method('copy', function () {
    return avocado.category.ofAParticularMirror.create(this.mirror(), this.parts().map(function(p) { return p; }));
  }, {category: ['copying']});

  add.method('equals', function (c) {
    if (!c) { return false; }
    if (typeof(c.mirror) !== 'function') { return false; }
    if (typeof(c.parts) !== 'function') { return false; }
    if (! this.mirror().equals(c.mirror())) { return false; }
    if (this.parts().length !== c.parts().length) { return false; }
    return this.isEqualToOrSubcategoryOf(c);
  }, {category: ['comparing']});

  add.method('hashCode', function () {
    return this.mirror().hashCode() + this.parts().map(function(p) { return p.hashCode(); }).join();
  }, {category: ['comparing']});

  add.method('supercategory', function () {
    return this.otherCategoryOfSameMirror(this._parts.slice(0, this._parts.length - 1));
  }, {category: ['related categories']});

  add.method('subcategory', function (subcatName) {
    return this.otherCategoryOfSameMirror(this._parts.concat([subcatName]));
  }, {category: ['related categories']});

  add.method('supernode', function () {
    return this.supercategory();
  }, {category: ['related categories']});

  add.method('subnode', function (name) {
    return this.subcategory(name);
  }, {category: ['related categories']});

  add.method('ofMirror', function (mir) {
    if (mir.equals(this._mirror)) { return this; }
    return avocado.category.ofAParticularMirror.create(mir, this.parts());
  }, {category: ['related categories']});

  add.method('otherCategoryOfSameMirror', function (otherCatParts) {
    return avocado.category.ofAParticularMirror.create(this.mirror(), otherCatParts)
  }, {category: ['related categories']});

  add.method('concat', function (otherCat) {
    return this.otherCategoryOfSameMirror(this._parts.concat(otherCat.parts()));
  }, {category: ['related categories']});

  add.method('withoutFirstParts', function (n) {
    return this.otherCategoryOfSameMirror(this._parts.slice(n));
  }, {category: ['related categories']});

  add.method('lastPart', function () {
    return this.part(this._parts.length - 1);
  }, {category: ['accessing']});

  add.method('setLastPart', function (newName) {
    if (this.isRoot()) { throw "Cannot rename the root category"; }
    this._parts = this._parts.clone();
    this._parts[this._parts.length - 1] = newName;
  }, {category: ['accessing']});

  add.method('isImmediateSubcategoryOf', function (c) {
    if (this.parts().length !== c.parts().length + 1) { return false; }
    return this.isEqualToOrSubcategoryOf(c);
  }, {category: ['comparing']});

  add.method('isSubcategoryOf', function (c) {
    if (this.parts().length <= c.parts().length) { return false; }
    return this.isEqualToOrSubcategoryOf(c);
  }, {category: ['comparing']});

  add.method('isEqualToOrSubcategoryOf', function (c) {
    if (this.parts().length < c.parts().length) { return false; }
    for (var i = 0; i < c.parts().length; i += 1) {
      if (this.parts()[i] !== c.parts()[i]) { return false; }
    }
    return true;
  }, {category: ['comparing']});

  add.method('eachSlot', function (f) {
    if (this.isRoot()) {
      this.mirror().eachFakeSlot(f);
    }
    this.mirror().slotsInCategory(this).each(f);
  }, {category: ['iterating']});

  add.method('slots', function () {
    return avocado.enumerator.create(this, 'eachSlot');
  }, {category: ['accessing']});

  add.method('normalSlotsInMeAndSubcategories', function () {
    return this.mirror().slotsNestedSomewhereUnderCategory(this);
  }, {category: ['accessing']});

  add.method('rename', function (newName) {
    var oldCat = this.copy();
    var oldCatPrefixParts = oldCat.parts().map(function(p) {return p;});
    var slotCount = 0;
    this.normalSlotsInMeAndSubcategories().each(function(s) {
      slotCount += 1;
      var newCatParts = s.category().parts().map(function(p) {return p;});
      
      // Just for the sake of sanity, let's check to make sure this slot really is in this category.
      for (var i = 0; i < oldCatPrefixParts.length; ++i) {
        if (newCatParts[i] !== oldCatPrefixParts[i]) {
          throw new Error("Assertion failure: renaming a category, but trying to recategorize a slot that's not in that category. ('" + newCatParts[i] + "' !== '" + oldCatPrefixParts[i] + "')");
        }
      }

      newCatParts[oldCatPrefixParts.length - 1] = newName;
      var newCat = this.otherCategoryOfSameMirror(newCatParts);
      //console.log("Changing the category of " + s.name() + " from " + oldCat + " to " + newCat);
      s.setCategory(newCat);
    }.bind(this));
    this.setLastPart(newName);
    return {oldCat: oldCat, newCat: this, numberOfRenamedSlots: slotCount};
  }, {category: ['renaming']});

  add.method('modules', function () {
    var modules = [];
    this.normalSlotsInMeAndSubcategories().each(function(s) {
      if (! s.isFromACopyDownParent()) {
        var m = s.module();
        if (! modules.include(m)) { modules.push(m); }
      }
    });
    return modules.sort();
  }, {category: ['modules']});

  add.method('contentsSummaryString', function () {
    var modules = this.modules();
    var n = modules.length;
    if (n === 0) { return ""; }
    if (n >=  5) { return n + " modules"; }
    var s = avocado.stringBuffer.create(n === 1 ? "Module:  " : "Modules:  ");
    var sep = "";
    modules.map(function(m) { return m ? m.lastPartOfName() : '-'; }).sort().each(function(name) {
      s.append(sep).append(name);
      sep = ", ";
    });
    return s.toString();
  }, {category: ['user interface']});

  add.method('requiresContentsSummary', function () {
    if (window.isInCodeOrganizingMode) { return false; }
    return this.isRoot() || this.contentsSummaryString() !== this.supernode().contentsSummaryString();
  }, {category: ['user interface']});

  add.method('nonNodeContents', function () {
    return this.slots().sortBy(function(s) { return s.sortOrder(); });
  }, {category: ['user interface']});

  add.method('canBeAddedToCategory', function () { return true; }, {category: ['testing']});

  add.method('eachImmediateSubnode', function (f) {
    this.mirror().eachImmediateSubcategoryOf(this, f);
  }, {category: ['iterating']});

  add.method('removeSlots', function () {
    this.mirror().slotsNestedSomewhereUnderCategory(this).each(function(slot) {
      slot.remove();
    });
  }, {category: ['removing']});

  add.method('copyInto', function (target) {
    if (this.isRoot()) { throw new Error("Cannot use copyInto on the root category; maybe you meant to use copyContentsInto?"); }
    return this.copyContentsInto(target.subcategory(this.lastPart()));
  }, {category: ['copying']});

  add.method('copyContentsInto', function (target) {
    var numPartsToLopOffTheBeginning = this.parts().length;

    this.normalSlotsInMeAndSubcategories().each(function(slot) {
      slot.copyTo(target.concat(slot.category().withoutFirstParts(numPartsToLopOffTheBeginning)));
    });
    return target;
  }, {category: ['copying']});

  add.method('dragAndDropCommands', function () {
    var cmdList = avocado.command.list.create(this);
    cmdList.addItem(avocado.command.create("add slot or category", function(evt, slotOrCat) {
      return slotOrCat.copyInto(this);
    }).setArgumentSpecs([avocado.command.argumentSpec.create('slotOrCat').onlyAccepts(function(o) {
      return o && typeof(o.canBeAddedToCategory) === 'function' && o.canBeAddedToCategory();
    })]));
    return cmdList;
  }, {category: ['user interface', 'drag and drop']});

  add.method('automaticallyChooseDefaultNameAndAddNewSlot', function (initialContentsMir) {
    return this.mirror().automaticallyChooseDefaultNameAndAddNewSlot(initialContentsMir, this);
  }, {category: ['user interface', 'slots']});

});


});
