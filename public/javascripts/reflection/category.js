transporter.module.create('reflection/category', function(requires) {}, function(thisModule) {


thisModule.addSlots(window, function(add) {

  add.creator('category', {}, {category: ['avocado', 'reflection']});

});


thisModule.addSlots(category, function(add) {

  add.creator('ofAParticularMirror', {}, {category: ['prototypes']});

  add.method('create', function (parts) {
    return Object.newChildOf(this, parts);
  }, {category: ['creating']});

  add.method('initialize', function (parts) {
    this._parts = parts;
    // aaa HACK why are we getting an undefined in the first place? And why only in JSQuiche, not the regular Avocado?
    for (var i = 0, n = parts.length; i < n; ++i) { if (parts[i] === undefined) { parts[i] = "undefined"; } }
  }, {category: ['creating']});

  add.method('root', function () { return category.create([]); }, {category: ['creating']});

  add.method('parts', function () {
    return this._parts;
  }, {category: ['accessing']});

  add.method('copy', function () {
    return category.create(this.parts().map(function(p) { return p; }));
  }, {category: ['copying']});

  add.method('supercategory', function () {
    return category.create(this._parts.slice(0, this._parts.length - 1));
  }, {category: ['related categories']});

  add.method('subcategory', function (subcatName) {
    return category.create(this._parts.concat([subcatName]));
  }, {category: ['related categories']});

  add.method('supernode', function () {
    return this.supercategory();
  }, {category: ['related categories']});

  add.method('subnode', function (subnodeName) {
    return this.subcategory(subnodeName);
  }, {category: ['related categories']});
  
  add.method('ofMirror', function (mir) {
    return category.ofAParticularMirror.create(mir, this);
  }, {category: ['related categories']});

  add.method('concat', function (otherCat) {
    return category.create(this._parts.concat(otherCat.parts()));
  }, {category: ['related categories']});

  add.method('withoutFirstParts', function (n) {
    return category.create(this._parts.slice(n));
  }, {category: ['related categories']});

  add.method('sortOrder', function () { return this.isRoot() ? '' : this.lastPart().toUpperCase(); }, {category: ['sorting']});
  
  add.method('toString', function () { return this.fullName(); }, {category: ['printing']});

  add.method('fullName', function () {
    return this._parts.join(" ");
  }, {category: ['accessing']});

  add.method('part', function (i) {
    if (this.isRoot()) { return ""; }
    return this._parts[i];
  }, {category: ['accessing']});

  add.method('lastPart', function () {
    return this.part(this._parts.length - 1);
  }, {category: ['accessing']});

  add.method('setLastPart', function (newName) {
    if (this.isRoot()) { throw "Cannot rename the root category"; }
    this._parts[this._parts.length - 1] = newName;
  }, {category: ['accessing']});

  add.method('isRoot', function () {
    return this._parts.length === 0;
  }, {category: ['testing']});

  add.method('equals', function (c) {
    if (this.parts().length !== c.parts().length) { return false; }
    return this.isEqualToOrSubcategoryOf(c);
  }, {category: ['comparing']});
  
  add.method('hashCode', function () {
    return this.parts().map(function(p) { return p.hashCode(); }).join();
  }, {category: ['comparing']});

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

  add.method('removeSlots', function (mir) {
    mir.eachSlotNestedSomewhereUnderCategory(this, function(slot) {
      slot.remove();
    }.bind(this));
  }, {category: ['removing']});

});


thisModule.addSlots(category.ofAParticularMirror, function(add) {

  add.method('create', function (mir, cat) {
    return Object.newChildOf(this, mir, cat);
  }, {category: ['creating']});

  add.method('initialize', function (mir, cat) {
    this._mirror = mir;
    this._category = cat;
  }, {category: ['creating']});

  add.method('mirror', function () { return this._mirror; }, {category: ['accessing']});

  add.method('category', function () { return this._category; }, {category: ['accessing']});

  add.method('fullName', function () { return this._category.fullName(); }, {category: ['accessing']});
  
  add.method('toString', function () { return this.fullName(); }, {category: ['printing']});

  add.method('parts', function () { return this._category.parts(); }, {category: ['accessing']});

  add.method('isRoot', function () { return this._category.isRoot(); }, {category: ['testing']});

  add.method('sortOrder', function () { return this._category.sortOrder(); }, {category: ['sorting']});

  add.method('equals', function (c) {
    if (c === null || typeof(c) === 'undefined') { return false; }
    if (typeof(c.mirror)   !== 'function') { return false; }
    if (typeof(c.category) !== 'function') { return false; }
    return this.mirror().equals(c.mirror()) && this.category().equals(c.category());
  }, {category: ['comparing']});
  
  add.method('hashCode', function () {
    return this.mirror().hashCode() && this.category().hashCode();
  }, {category: ['comparing']});
  
  add.method('supercategory', function () {
    return this._category.supercategory().ofMirror(this._mirror);
  }, {category: ['related categories']});
  
  add.method('subcategory', function (name) {
    return this._category.subcategory(name).ofMirror(this._mirror);
  }, {category: ['related categories']});

  add.method('supernode', function () {
    return this.supercategory();
  }, {category: ['related categories']});

  add.method('subnode', function (name) {
    return this.subcategory(name);
  }, {category: ['related categories']});
  
  add.method('ofMirror', function (mir) {
    if (mir.equals(this._mirror)) { return this; }
    return this.category().ofMirror(mir);
  }, {category: ['related categories']});

  add.method('concat', function (otherCat) {
    return this.category().concat(otherCat).ofMirror(this.mirror());
  }, {category: ['related categories']});

  add.method('sortOrder', function () { return this.category().sortOrder(); }, {category: ['sorting']});
  
  add.method('eachSlot', function (f) {
    if (this.category().isRoot()) {
      this.mirror().eachFakeSlot(f);
    }
    this.mirror().eachSlotInCategory(this.category(), f);
  }, {category: ['iterating']});

  add.method('eachNormalSlotInMeAndSubcategories', function (f) {
    this.mirror().eachSlotNestedSomewhereUnderCategory(this.category(), f);
  }, {category: ['iterating']});

  add.method('rename', function (newName) {
    var c = this.category();
    var oldCat = c.copy();
    var oldCatPrefixParts = oldCat.parts().map(function(p) {return p;});
    var slotCount = 0;
    this.eachNormalSlotInMeAndSubcategories(function(s) {
      slotCount += 1;
      var newCatParts = s.category().parts().map(function(p) {return p;});
      
      // Just for the sake of sanity, let's check to make sure this slot really is in this category.
      for (var i = 0; i < oldCatPrefixParts.length; ++i) {
        if (newCatParts[i] !== oldCatPrefixParts[i]) {
          throw new Error("Assertion failure: renaming a category, but trying to recategorize a slot that's not in that category. ('" + newCatParts[i] + "' !== '" + oldCatPrefixParts[i] + "')");
        }
      }

      newCatParts[oldCatPrefixParts.length - 1] = newName;
      var newCat = category.create(newCatParts);
      //console.log("Changing the category of " + s.name() + " from " + oldCat + " to " + newCat);
      s.setCategory(newCat);
    });
    c.setLastPart(newName);
    return {oldCat: oldCat, newCat: c, numberOfRenamedSlots: slotCount};
  }, {category: ['renaming']});

  add.method('modules', function () {
    var modules = [];
    this.eachNormalSlotInMeAndSubcategories(function(s) {
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
    return avocado.enumerator.create(this, 'eachSlot').sortBy(function(s) { return s.sortOrder(); });
  }, {category: ['user interface']});

  add.method('canBeAddedToCategory', function () { return true; }, {category: ['testing']});

  add.method('eachImmediateSubnode', function (f) {
    this.mirror().eachImmediateSubcategoryOf(this.category(), f);
  }, {category: ['iterating']});

  add.method('copyInto', function (target) {
    if (this.isRoot()) { throw new Error("Cannot use copyInto on the root category; maybe you meant to use copyContentsInto?"); }
    return this.copyContentsInto(target.subcategory(this.category().lastPart()));
  }, {category: ['copying']});

  add.method('copyContentsInto', function (target) {
    var numPartsToLopOffTheBeginning = this.category().parts().length;

    this.eachNormalSlotInMeAndSubcategories(function(slot) {
      slot.copyTo(target.concat(slot.category().withoutFirstParts(numPartsToLopOffTheBeginning)));
    });
    return target;
  }, {category: ['copying']});
  
  add.method('dragAndDropCommands', function () {
    var cmdList = avocado.command.list.create();
    cmdList.addItem(avocado.command.create("add slot or category", function(evt, slotOrCat) {
      return slotOrCat.copyInto(this);
    }.bind(this)).setArgumentSpecs([avocado.command.argumentSpec.create('slotOrCat').onlyAccepts(function(o) {
      return o && typeof(o.canBeAddedToCategory) === 'function' && o.canBeAddedToCategory();
    })]));
    return cmdList;
  }, {category: ['user interface', 'drag and drop']});

  add.method('automaticallyChooseDefaultNameAndAddNewSlot', function (initialContentsMir) {
    return this.mirror().automaticallyChooseDefaultNameAndAddNewSlot(initialContentsMir, this.category());
  }, {category: ['user interface', 'slots']});

});


});
