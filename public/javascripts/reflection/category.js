transporter.module.create('reflection/category', function(requires) {}, function(thisModule) {


thisModule.addSlots(lobby, function(add) {

  add.creator('category', {}, {category: ['reflection']});

});


thisModule.addSlots(category, function(add) {

  add.method('create', function (parts) {
    return Object.newChildOf(this, parts);
  }, {category: ['creating']});

  add.method('initialize', function (parts) {
    this._parts = parts;
  }, {category: ['creating']});

  add.method('root', function () { return category.create([]); }, {category: ['creating']});

  add.method('parts', function () {
    return this._parts;
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

  add.method('copySlots', function (sourceMir, targetMir, targetCat) {
    targetCat = targetCat || category.root();
    var numPartsToLopOffTheBeginning = this.parts().length - 1;
    if (numPartsToLopOffTheBeginning < 0) { throw "something is wrong - can't copy the root category"; } // aaa - wait, why not?

    sourceMir.eachSlotNestedSomewhereUnderCategory(this, function(slot) {
      var newSlot = slot.copyTo(targetMir);
      var newCategory = targetCat.concat(slot.category().withoutFirstParts(numPartsToLopOffTheBeginning));
      newSlot.setCategory(newCategory);
    }.bind(this));
    return targetCat.concat(this.withoutFirstParts(numPartsToLopOffTheBeginning));
  }, {category: ['copying']});

  add.method('removeSlots', function (mir) {
    mir.eachSlotNestedSomewhereUnderCategory(this, function(slot) {
      slot.remove();
    }.bind(this));
  }, {category: ['removing']});

});


});
