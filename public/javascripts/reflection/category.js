transporter.module.create('reflection/category', function(requires) {}, function(thisModule) {


thisModule.addSlots(window, function(add) {

  add.creator('category', {}, {category: ['avocado', 'reflection']});

});


thisModule.addSlots(category, function(add) {

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
  }, {category: ['accessing']});

  add.method('supercategory', function () {
    return category.create(this._parts.slice(0, this._parts.length - 1));
  }, {category: ['creating']});

  add.method('subcategory', function (subcatName) {
    return category.create(this._parts.concat([subcatName]));
  }, {category: ['creating']});

  add.method('concat', function (otherCat) {
    return category.create(this._parts.concat(otherCat.parts()));
  }, {category: ['creating']});

  add.method('withoutFirstParts', function (n) {
    return category.create(this._parts.slice(n));
  }, {category: ['creating']});

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

  add.method('copyInto', function (sourceMir, targetMir, targetCat) {
    if (this.isRoot()) { throw new Error("Cannot use copyInto on the root category; maybe you meant to use copyContentsInto?"); }
    return this.copyContentsInto(sourceMir, targetMir, (targetCat || category.root()).subcategory(this.lastPart()));
  }, {category: ['copying']});

  add.method('copyContentsInto', function (sourceMir, targetMir, targetCat) {
    targetCat = targetCat || category.root();
    var numPartsToLopOffTheBeginning = this.parts().length;

    sourceMir.eachSlotNestedSomewhereUnderCategory(this, function(slot) {
      slot.copyTo(targetMir, targetCat.concat(slot.category().withoutFirstParts(numPartsToLopOffTheBeginning)));
    });
    return targetCat;
  }, {category: ['copying']});

  add.method('removeSlots', function (mir) {
    mir.eachSlotNestedSomewhereUnderCategory(this, function(slot) {
      slot.remove();
    }.bind(this));
  }, {category: ['removing']});

});


});
