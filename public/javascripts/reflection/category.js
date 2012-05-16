avocado.transporter.module.create('reflection/category', function(requires) {

}, function(thisModule) {


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

  add.method('holder', function () { return this._mirror; }, {category: ['accessing']});

  add.method('category', function () { return this; }, {category: ['accessing']});

  add.method('toString', function () { return this.fullName(); }, {category: ['printing']});

  add.method('immediateName', function () { return this.lastPart(); }, {category: ['printing']});

  add.method('fullName', function () { return this._parts.join(" "); }, {category: ['printing']});

  add.method('sortOrder', function () { return this.isRoot() ? '' : this.lastPart().toLowerCase(); }, {category: ['sorting']});

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

  add.method('ownerObject', function () {
    return this.isRoot() ? null : this.supercategory();
  }, {category: ['related categories']});

  add.method('ofMirror', function (mir) {
    if (mir.equals(this._mirror)) { return this; }
    return avocado.category.ofAParticularMirror.create(mir, this.parts());
  }, {category: ['related categories']});

  add.method('otherCategoryOfSameMirror', function (otherCatParts) {
    return avocado.category.ofAParticularMirror.create(this.mirror(), otherCatParts);
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
    return this.rename(newName);
  }, {category: ['accessing']});

  add.method('addSubcategory', function () {
    var c = this.subcategory("");
    this.mirror().annotationForWriting().getCategoryCache(c.parts()); // this should make sure the category "exists"
    avocado.ui.currentWorld().morphFor(c).wasJustAdded();
    return c;
  }, {category: ['categories']});

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

  add.method('possiblyStaleEachSlot', function (f) {
    if (this.isRoot()) {
      this.mirror().eachFakeSlot(f);
    }
    this.mirror().possiblyStaleSlotsInCategory(this).each(f);
  }, {category: ['iterating']});

  add.method('possiblyStaleSlots', function () {
    return avocado.enumerator.create(this, 'possiblyStaleEachSlot');
  }, {category: ['accessing']});

  add.method('possiblyStaleNormalSlotsInMeAndSubcategories', function () {
    return this.mirror().possiblyStaleSlotsNestedSomewhereUnderCategory(this);
  }, {category: ['accessing']});

  add.method('rename', function (newName) {
    if (this.isRoot()) { throw "Cannot rename the root category"; }
    
    var oldCat = this.copy();
    var oldCatPrefixParts = oldCat.parts().map(function(p) {return p;});
    var slotCount = 0;
    this.possiblyStaleNormalSlotsInMeAndSubcategories().each(function(s) {
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

    this._parts = this._parts.clone();
    this._parts[this._parts.length - 1] = newName;

    this.mirror().annotationForWriting().getCategoryCache(  this.parts()); // this should make sure the new category "exists"
    this.mirror().annotationForWriting().getCategoryCache(oldCat.parts()).removeMe();
    this.mirror().justRenamedCategory(oldCat, this, slotCount === 0);
    return this;
  }, {category: ['renaming']});

  add.method('getModuleAssignedToMeImplicitly', function () {
    return this.mirror().getModuleAssignedToMeImplicitly();
  }, {category: ['modules']});

  add.method('modules', function () {
    var modules = [];
    var implicitModule = this.getModuleAssignedToMeImplicitly();
    this.possiblyStaleNormalSlotsInMeAndSubcategories().each(function(s) {
      if (! s.isFromACopyDownParent()) {
        var m = s.getModuleAssignedToMeExplicitly();
        if (!m) { m = implicitModule; }
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

  add.method('immediateContents', function () {
    return avocado.compositeCollection.create([
      this.mirror().immediateSubcategoriesOf(this),
      this.possiblyStaleSlots().sortBy(function(s) { return s.sortOrder(); })
    ]);
  }, {category: ['iterating']});

  add.method('canBeAddedToCategory', function (cat) {
    if (window.isInCodeOrganizingMode) {
      return this.possiblyStaleNormalSlotsInMeAndSubcategories().all(function(s) { return s.canBeAddedToCategory(cat); });
    } else {
      return true;
    }
  }, {category: ['testing']});

  add.method('removeSlots', function () {
    this.possiblyStaleNormalSlotsInMeAndSubcategories().each(function(slot) {
      slot.remove();
    });
  }, {category: ['removing']});

  add.method('copyToNewHolder', function () {
    return this.copyInto(reflect({}).rootCategory());
  }, {category: ['copying']});

  add.method('copyInto', function (target) {
    var targetSubcat = this.isRoot() ? target : target.subcategory(this.lastPart());
    return this.copyContentsInto(targetSubcat);
  }, {category: ['copying']});

  add.method('copyContentsInto', function (target) {
    var numPartsToLopOffTheBeginning = this.parts().length;

    this.possiblyStaleNormalSlotsInMeAndSubcategories().each(function(slot) {
      slot.copyTo(target.concat(slot.category().withoutFirstParts(numPartsToLopOffTheBeginning)));
    });
    return target;
  }, {category: ['copying']});

  add.method('commands', function () {
    var cmdList = avocado.command.list.create();
    var addCommands = [];
    if (this.mirror().canHaveSlots()) {
      if (! window.isInCodeOrganizingMode) {
        addCommands.push(avocado.command.create("function",  function(evt) { this.automaticallyChooseDefaultNameAndAddNewSlot(reflect(function() {})); }, this));
        addCommands.push(avocado.command.create("attribute", function(evt) { this.automaticallyChooseDefaultNameAndAddNewSlot(reflect(null         )); }, this));
      }
      addCommands.push(avocado.command.create("category", function(evt) { this.addSubcategory(evt); }, this));
      cmdList.addItem(["add...", addCommands]);
    }
    return cmdList;
  }, {category: ['user interface', 'commands']});

  add.method('dragAndDropCommands', function () {
    var cmdList = avocado.command.list.create(this);
    var thisCategory = this; // aaa - need to make the argSpecs use the context when calling the _acceptanceFunction
    cmdList.addItem(avocado.command.create("add slot or category", function(evt, slotOrCat) {
      var newSlotOrCat = this.equals(slotOrCat.category()) ? slotOrCat : slotOrCat.copyInto(this);
      avocado.ui.ensureVisible(newSlotOrCat, evt);
      return newSlotOrCat;
    }).setArgumentSpecs([avocado.command.argumentSpec.create('slotOrCat').onlyAccepts(function(o) {
      return o && typeof(o.canBeAddedToCategory) === 'function' && o.canBeAddedToCategory(thisCategory);
    })]));
    return cmdList;
  }, {category: ['user interface', 'drag and drop']});

  add.method('automaticallyChooseDefaultNameAndAddNewSlot', function (initialContentsMir) {
    return this.mirror().automaticallyChooseDefaultNameAndAddNewSlot(initialContentsMir, this);
  }, {category: ['user interface', 'slots']});

});


});
