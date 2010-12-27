transporter.module.create('reflection/mirror', function(requires) {

requires('core/enumerator');
requires('core/identity_hash');
requires('core/testFramework');

}, function(thisModule) {


thisModule.addSlots(avocado, function(add) {

  add.creator('mirror', {}, {category: ['reflection']});

});


thisModule.addSlots(window, function(add) {

  add.method('reflect', function (o) {
    var m = Object.create(avocado.mirror);
    m.initialize(o);
    return m;
  }, {category: ['avocado', 'reflection']});

});


thisModule.addSlots(avocado.mirror, function(add) {

  add.method('initialize', function (o) {
    this._reflectee = o;
  }, {category: ['creating']});

  add.method('forObjectNamed', function (chainNames) {
    var obj = window;
    for (var i = 0; i < chainNames.length; ++i) {
      var slotName = chainNames[i];
      obj = obj[slotName];
      if (obj === undefined || obj === null) { return null; }
    }
    return reflect(obj);
  }, {category: ['creating']});

  add.method('reflectee', function () { return this._reflectee; }, {category: ['accessing reflectee']});

  add.method('equals', function (m) {
    if (!m) { return false; }
    if (this.reflectee !== m.reflectee) { return false; }
    return this.reflectee() === m.reflectee();
  }, {category: ['comparing']});

  add.method('hashCode', function () {
    try {
      return avocado.identityHashFor(this.reflectee());
    } catch (ex) {
      return "broken identity hash";
    }
  }, {category: ['comparing']});

  add.method('reflecteeToString', function () {
    try {
      var o = this.reflectee();
      if (! this.canHaveSlots()) { return "" + o; }

      // Ignore the default toString because it just says [object Object] all the time and it's annoying.
      if (o.toString === Object.prototype.toString) { return ""; } 
      
      return o.toString();
    } catch (ex) {
      return "";
    }
  }, {category: ['naming']});

  add.method('toString', function () {
    return "on " + this.inspect();
  }, {category: ['naming']});

  add.method('isRootOfGlobalNamespace', function () {
    return this.reflectee() === window;
  }, {category: ['naming']});

  add.method('primitiveReflectee', function () {
    return this.reflectee();
  }, {category: ['accessing']});
    
  add.method('inspect', function () {
    if (this.isRootOfGlobalNamespace()) {return "window";}
    if (! this.canHaveSlots()) {return Object.inspect(this.primitiveReflectee());}
    var n = this.name();
    if (this.isReflecteeFunction()) { return n; } // the code will be visible through the *code* fake-slot
    var s = [n];
    var maxToStringLength = 40;
    var toString;
    if (this.isReflecteeArray()) {
      var len = this.reflecteeLength();
      toString = len.toString() + " elements";
      if (len <= 5) {
        var firstElems = "[" + avocado.range.create(0, len).map(function(i) { return this.contentsAt(i).inspect(); }.bind(this)).join(", ") + "]";
        if (firstElems.length < maxToStringLength) { toString = firstElems; }
      }
    } else {
      toString = this.reflecteeToString();
    }
    if (typeof toString === 'string' && toString && toString.length < maxToStringLength) {
      s.push("(", toString, ")");
    }
    return s.join("");
  }, {category: ['naming']});

  add.method('convertCreatorSlotChainToString', function (chain) {
    if (chain.length === 0) {return "";}
    var isThePrototype = chain[0].contents().equals(this);
    var s = avocado.stringBuffer.create(isThePrototype ? "" : chain[chain.length - 1].name().startsWithVowel() ? "an " : "a ");

    var sep = "";
    for (var i = chain.length - 1; i >= 0; i -= 1) {
      var n = chain[i].name();
      // HACK - Recognize class-like patterns and show names like "a WobulatorMorph" rather than "a WobulatorMorph.prototype",
      // because, well, that's really annoying. Not sure this is the right way to fix this. But the reality is that in JS code
      // it'll probably be common to have both class-like and prototype-like inheritance and naming patterns.
      if ((n !== 'prototype' && n !== '__proto__') || (i === 0 && (isThePrototype || chain.length === 1))) {
        s.append(sep).append(n);
      }
      sep = ".";
    }
    return s.toString();
  }, {category: ['naming']});

  add.method('name', function () {
    if (! this.canHaveCreatorSlot()) {return Object.inspect(this.primitiveReflectee());}

    var chain = this.creatorSlotChainOfMeOrAnAncestor('probableCreatorSlot');

    // aaa - Not sure whether this is a hack or not. I don't like that we end up with morphs
    // named, for example, "WorldMorph.current.submorphs.3". So use the parent's chain instead.
    if (chain && chain.length > 0 && chain[0].isArrayIndex() && this.hasAccessibleParent()) {
      chain = this.parent().creatorSlotChainOfMeOrAnAncestor('probableCreatorSlot');
    }

    if (chain) {
      return this.convertCreatorSlotChainToString(chain);
    } else {
      return this.isReflecteeFunction() ? "a function" : this.isReflecteeArray() ? "an array" : "an object";
    }
  }, {category: ['naming']});

  add.method('hasMultiplePossibleNames', function () {
    // Someday we could have a mechanism for remembering arbitrary names.
    return this.hasMultiplePossibleCreatorSlots();
  }, {category: ['naming']});

  add.method('isWellKnown', function (kindOfCreatorSlot) {
    var chain = this.creatorSlotChain(kindOfCreatorSlot);
    return chain && (chain.length === 0 || chain[0].contents().equals(this));
  }, {category: ['testing']});

  add.method('isReflecteeProbablyAClass', function () {
    // Let's see whether this is a good enough test for now.
    var r = this.reflectee();
    if (r === Object || r === String || r === Function || r === Boolean || r === Array || r === Number) { return true; }
    if (this.isReflecteeFunction() && this.reflecteeHasOwnProperty('superclass')) { return true; }
    return false;
  }, {category: ['testing']});

  add.method('canSlotNameBeUsedAsJavascriptToken', function (n) {
    if (avocado.javascript.reservedWords[n]) { return false; }
    // aaa - What about Unicode?
    return /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(n);
  }, {category: ['testing']});

  add.method('creatorSlotChainExpression', function (kindOfCreatorSlot) {
    if (! this.canHaveCreatorSlot()) {throw this.inspect() + " cannot have a creator slot chain.";}

    var chain = this.creatorSlotChain(kindOfCreatorSlot || 'probableCreatorSlot');
    if (! chain) {
      var err = new Error(this.name() + " does not have a creator slot chain");
      err.mirrorWithoutCreatorPath = this;
      throw err;
    }
    if (chain.length === 0) {return "window";}

    var s = avocado.stringBuffer.create();
    var sep = "";
    if (this.canSlotNameBeUsedAsJavascriptToken(chain[chain.length - 1].name())) {
      // don't need to say "window"
    } else {
      s.append("window");
      sep = ".";
    }
    
    for (var i = chain.length - 1; i >= 0; i -= 1) {
      var n = chain[i].name();
      if (this.canSlotNameBeUsedAsJavascriptToken(n)) {
        s.append(sep).append(n);
      } else {
        s.append('[').append(n.inspect()).append(']');
      }
      sep = ".";
    }
    return s.toString();
  }, {category: ['annotations', 'creator slot']});

  add.method('creatorSlotChain', function (kindOfCreatorSlot) {
    if (! this.canHaveCreatorSlot()) {return null;}

    var chain = [];
    var windowMir = reflect(window);
    var mir = this;
    var cs;
    kindOfCreatorSlot = kindOfCreatorSlot || 'explicitlySpecifiedCreatorSlot';

    for (var i = 0; true; ++i) {
      if (mir.equals(windowMir)) { return chain; }
      cs = mir[kindOfCreatorSlot].call(mir);
      if (! cs) { return null; }
      if (! cs.contents().equals(mir)) { return null; } // probably obsolete or something
      chain.push(cs);
      if (i >= 100) {
        console.log("WARNING: Really long (" + i + " so far) chain of creator slots; giving up because it's probably a loop. " +
                    "Here it is so far, starting from the end: " + chain.map(function(s) { return s.name(); }).join(", "));
        return null;
      }
      mir = cs.holder();
    }
  }, {category: ['annotations', 'creator slot']});

  add.method('creatorSlotChainOfMeOrAnAncestor', function (kindOfCreatorSlot) {
    var mir = this;
    while (true) {
      var chain = mir.creatorSlotChain(kindOfCreatorSlot);
      if (chain) { return chain; }
      if (! mir.hasAccessibleParent()) { return null; }
      mir = mir.parent();
    }
  }, {category: ['annotations', 'creator slot']});

  add.method('eachSlot', function (f) {
    this.eachFakeSlot(f);
    this.eachNormalSlot(f);
  }, {category: ['iterating']});

  add.method('slots', function () {
    return avocado.enumerator.create(this, 'eachSlot');
  }, {category: ['accessing']});

  add.method('eachFakeSlot', function (f) {
    if (this.isReflecteeFunction()) { f(this.functionBodySlot()); }
    if (this.hasAccessibleParent()) { f(this.      parentSlot()); }
  }, {category: ['iterating']});

  add.method('functionBodySlot', function () {
    return Object.create(avocado.slots.functionBody).initialize(this);
  }, {category: ['functions']});

  add.method('parentSlot', function () {
    return Object.create(avocado.slots.parent).initialize(this);
  }, {category: ['accessing parent']});

  add.method('eachNormalSlot', function (f) {
    this.normalSlotNames().each(function(n) { f(this.slotAt(n)); }.bind(this));
  }, {category: ['iterating']});

  add.method('normalSlots', function () {
    return this.normalSlotNames().map(function(n) { return this.slotAt(n); }.bind(this));
  }, {category: ['iterating']});

  add.method('eachNormalSlotName', function (f) {
    if (! this.canHaveSlots()) {return;}
    var o = this.reflectee();
    for (var name in o) {
      if (o.hasOwnProperty(name)) {
        if (name !== '__annotation__') { // shh! pretend it's not there.
          f(name);
        }
      }
    }

    // Workaround for Chrome bug. -- Adam
    if (! avocado.javascript.prototypeAttributeIsEnumerable) {
      if (typeof(o.hasOwnProperty) === 'function') { // another bizarre bug
        if (o.hasOwnProperty("prototype")) {
          f("prototype");
        }
      }
    }
  }, {category: ['iterating']});

  add.method('normalSlotNames', function () {
    return avocado.enumerator.create(this, 'eachNormalSlotName');
  }, {category: ['iterating']});
  
  add.method('category', function (parts) {
    // aaa shouldn't need this test after I'm done refactoring to eliminate the stupid raw category objects
    return avocado.category.ofAParticularMirror.create(this, parts.parts ? parts.parts() : parts);
  }, {category: ['categories']});
  
  add.method('rootCategory', function () {
    return this.category([]);
  }, {category: ['categories']});

  add.method('slotsInCategory', function (c) {
    return this.normalSlots().select(function(s) { return c.equals(s.category()); });
  }, {category: ['iterating']});

  add.method('slotsNestedSomewhereUnderCategory', function (c) {
    return this.normalSlots().select(function(s) { return s.category().isEqualToOrSubcategoryOf(c); });
  }, {category: ['iterating']});

  add.method('eachImmediateSubcategoryOf', function (c, f) {
    var subcats = {};
    this.normalSlots().each(function(s) {
      var sc = s.category();
      if (sc.isSubcategoryOf(c)) {
        var subcatName = sc.part(c.parts().length);
        if (! subcats.hasOwnProperty(subcatName)) {
          subcats[subcatName] = c.subcategory(subcatName);
        }
      }
    });

    for (var name in subcats) {
      if (subcats.hasOwnProperty(name)) {
        f(subcats[name]);
      }
    }
  }, {category: ['iterating']});

  add.method('immediateSubcategoriesOf', function (c) {
    return avocado.enumerator.create(this, 'eachImmediateSubcategoryOf', c);
  }, {category: ['iterating']});

  add.method('slotAt', function (n) {
    if (n === '__proto__') { return this.parentSlot(); }
    return Object.create(avocado.slots.plain).initialize(this, n.toString());
  }, {category: ['accessing slot contents']});

  add.method('contentsAt', function (n) {
    return reflect(this.primitiveContentsAt(n));
  }, {category: ['accessing slot contents']});

  add.method('setContentsAt', function (n, mir) {
    return this.primitiveSetContentsAt(n, mir.reflectee());
  }, {category: ['accessing slot contents']});

  add.method('primitiveContentsAt', function (n) {
    return this.reflectee()[n];
  }, {category: ['accessing slot contents']});

  add.method('primitiveSetContentsAt', function (n, o) {
    this.reflectee()[n] = o;
    return o;
  }, {category: ['accessing slot contents']});

  add.method('removeSlotAt', function (n) {
    delete this.reflectee()[n];
  }, {category: ['accessing slot contents']});

  add.method('findUnusedSlotName', function (prefix) {
    if (! this.canHaveSlots()) { throw this.name() + " cannot have slots"; }
    var pre = prefix || "slot";
    var i = 0;
    var name;
    do {
      i += 1;
      name = pre + i;
    } while (this.reflecteeHasOwnProperty(name));
    return name;
  }, {category: ['accessing slot contents']});

  add.method('reflecteeHasOwnProperty', function (n) {
    if (! this.canHaveSlots()) { return false; }
    return this.reflecteeObjectHasOwnProperty(n);
  }, {category: ['accessing reflectee']});

  add.method('reflecteeObjectHasOwnProperty', function (n) {
    return this.reflectee().hasOwnProperty(n);
  }, {category: ['accessing reflectee']});

  add.method('parent', function () {
    if (! this.canAccessParent()) { throw "Sorry, you can't access an object's parent in this browser. Try Firefox or Safari."; }
    if (! this.hasParent()) { throw this.name() + " does not have a parent."; }
    return this.contentsAt('__proto__');
  }, {category: ['accessing parent']});

  add.method('parentOrNull', function () {
    if (! this.canAccessParent()) { return null; }
    if (! this.hasParent()) { return null; }
    return this.contentsAt('__proto__');
  }, {category: ['accessing parent']});

  add.method('eachAncestorIncludingMeButNotIncludingNull', function (f) {
    var m = this;
    while (m) {
      f(m);
      m = m.parentOrNull();
      if (m && m.isReflecteeNull()) { m = null; }
    }
  }, {category: ['accessing parent']});

  add.method('meAndAncestors', function () {
    return avocado.enumerator.create(this, 'eachAncestorIncludingMeButNotIncludingNull');
  }, {category: ['accessing parent']});

  add.method('canAccessParent', function () {
    return String.prototype['__proto__'] !== undefined; // using [] to fool JSLint;
  }, {category: ['accessing parent']});

  add.method('hasParent', function () { return ! (this.isReflecteeNull() || this.isReflecteeUndefined()); }, {category: ['accessing parent']});

  add.method('hasAccessibleParent', function () { return this.canAccessParent() && this.hasParent(); }, {category: ['accessing parent']});

  add.method('setParent', function (pMir) {
    if (! this.canAccessParent()) { throw "Sorry, you can't change an object's parent in this browser. Try Firefox or Safari."; }
    this.setContentsAt('__proto__', pMir);
  }, {category: ['accessing parent']});

  add.method('createChild', function () {
    return reflect(Object.create(this.reflectee()));
  }, {category: ['children']});

  add.method('createSubclass', function () {
    var subclass = reflect(this.reflectee().subclass());
    subclass.slotAt('prototype').beCreator();
    return subclass;
  }, {category: ['children']});

  add.method('interposeNewParent', function () {
    var p = this.parent().createChild();
    this.setParent(p);
    this.parentSlot().beCreator();
    return p;
  }, {category: ['children']});

  add.method('addData', function (slotName, slotContents) {
    var s = this.slotAt(slotName);
    s.setContents(reflect(slotContents));
    return s;
  }, {category: ['shortcuts']});

  add.method('addCreator', function (slotName, slotContents) {
    var s = this.addData(slotName, slotContents);
    s.beCreator();
    return s;
  }, {category: ['shortcuts']});

  add.method('addMethod', function (slotName, slotContents) {
    this.addCreator(slotName, slotContents);
  }, {category: ['shortcuts']});

  add.method('source', function () {
    if (! this.isReflecteeFunction()) { throw "not a function"; }
    return this.reflecteeToString();
  }, {category: ['functions']});

  add.method('expressionEvaluatingToMe', function (shouldNotUseCreatorSlotChainExpression) {
    if (! this.canHaveCreatorSlot()) { return Object.inspect(this.reflectee()); }
    if (!shouldNotUseCreatorSlotChainExpression && this.isWellKnown('probableCreatorSlot')) { return this.creatorSlotChainExpression(); }
    if (this.isReflecteeFunction()) { return this.source(); }
    if (this.isReflecteeArray()) { return "[" + avocado.range.create(0, this.reflecteeLength()).map(function(i) {return this.contentsAt(i).expressionEvaluatingToMe();}.bind(this)).join(", ") + "]"; }

    // aaa not thread-safe
    if (this.reflectee().__already_calculating_expressionEvaluatingToMe__) { throw "encountered circular structure"; }
    try {
      this.reflectee().__already_calculating_expressionEvaluatingToMe__ = true;

      var str = avocado.stringBuffer.create("{");
      var sep = "";
      this.normalSlots().each(function(slot) {
        if (slot.name() !== '__already_calculating_expressionEvaluatingToMe__') {
          str.append(sep).append(slot.name()).append(": ").append(slot.contents().expressionEvaluatingToMe());
          sep = ", ";
        }
      });
      str.append("}");
    } finally {
      delete this.reflectee().__already_calculating_expressionEvaluatingToMe__;
    }

    return str.toString();

    // aaa - try something like Self's 1 _AsObject, except of course in JS it'll have to be a hack;
  }, {category: ['naming']});

  add.method('reflecteeStoreString', function () {
    if (! this.canHaveSlots()) { return null; }
    var o = this.reflectee();
    if (typeof(o.storeString) === 'function') {
      if (typeof(o.storeStringNeeds) !== 'function' || o !== o.storeStringNeeds()) {
        return o.storeString();
      }
    }
    return null;
  }, {category: ['transporting']});

  add.method('size', function () {
    return this.normalSlots().size();
  }, {category: ['accessing slot contents']});

  add.method('reflecteeType', function () {
    return typeof(this.reflectee());
  }, {category: ['accessing']});
  
  add.method('canHaveSlots', function () {
    var t = this.reflecteeType();
    return t === 'function' || (t === 'object' && ! this.isReflecteeNull());
  }, {category: ['accessing slot contents']});

  add.method('canHaveChildren', function () {
    // aaa - Is this correct? I think maybe inheriting from arrays doesn't work so well in some browsers.
    var o = this.reflectee();
    var t = typeof o;
    return t === 'function' || (t === 'object' && o !== null);
  }, {category: ['children']});

  add.method('isReflecteeNull', function () { return this.reflectee() === null;      }, {category: ['testing']});

  add.method('isReflecteeUndefined', function () { return this.reflecteeType() === 'undefined'; }, {category: ['testing']});

  add.method('isReflecteeString', function () { return this.reflecteeType() === 'string';  }, {category: ['testing']});

  add.method('isReflecteeNumber', function () { return this.reflecteeType() === 'number';  }, {category: ['testing']});

  add.method('isReflecteeBoolean', function () { return this.reflecteeType() === 'boolean'; }, {category: ['testing']});

  add.method('isReflecteeArray', function () { return this.reflecteeType() === 'object' && this.reflectee() instanceof Array; }, {category: ['testing']});

  add.method('isReflecteeFunction', function () {
    return this.reflecteeType() === 'function';
  }, {category: ['testing']});

  add.method('isReflecteeSimpleMethod', function () {
    if (! this.isReflecteeFunction()) {return false;}

    var aaa_LK_slotNamesAttachedToMethods = ['declaredClass', 'methodName', 'displayName', '_creatorSlotHolder'];
    var aaa_LK_slotNamesUsedForSuperHack = ['valueOf', 'toString', 'originalFunction'];

    var hasSuper = this.reflectee().argumentNames && this.reflectee().argumentNames().first() === '$super';

    var nonTrivialSlot = this.normalSlots().find(function(s) {
      if (            aaa_LK_slotNamesAttachedToMethods.include(s.name())) {return false;}
      if (hasSuper && aaa_LK_slotNamesUsedForSuperHack .include(s.name())) {return false;}
        
      // Firefox seems to have a 'prototype' slot on every function (whereas Safari is lazier about it). I think.
      if (s.name() === 'prototype') {
        var proto = s.contents();
        return ! (proto.size() === 0 && proto.parent().reflectee() === Object.prototype);
      }
      
      return true;
    });
    return ! nonTrivialSlot;
  }, {category: ['testing']});
  
  add.method('reflecteeLength', function () {
    return this.primitiveContentsAt('length');
  }, {category: ['arrays']});
  
  add.method('oppositeBoolean', function () {
    if (! this.isReflecteeBoolean()) { throw new Error("not a boolean"); }
    return ! this.reflectee();
  }, {category: ['booleans']});

  add.method('canHaveCreatorSlot', function () {
    var t = this.reflecteeType();
    return t === 'function' || (t === 'object' && ! this.isReflecteeNull());
  }, {category: ['annotations', 'creator slot']});

  add.method('convertAnnotationCreatorSlotToRealSlot', function (s) {
    return s ? reflect(s.holder).slotAt(s.name) : null;
  }, {category: ['annotations', 'creator slot']});

  add.method('probableCreatorSlot', function () {
    if (! this.canHaveCreatorSlot()) { return null; }
    var a = this.annotationForReading();
    if (!a) { return null; }
    return this.convertAnnotationCreatorSlotToRealSlot(a.probableCreatorSlot());
  }, {category: ['annotations', 'creator slot']});

  add.method('possibleCreatorSlots', function () {
    if (! this.canHaveCreatorSlot()) { return []; }
    var a = this.annotationForReading();
    if (!a) { return []; }
    return a.arrayOfPossibleCreatorSlots().map(function(s) { return this.convertAnnotationCreatorSlotToRealSlot(s); }.bind(this));
  }, {category: ['annotations', 'creator slot']});

  add.method('creatorSlotChainLength', function () {
    return avocado.annotator.creatorChainLength(this.reflectee());
  }, {category: ['annotations', 'creator slot']});

  add.method('hasMultiplePossibleCreatorSlots', function () {
    if (! this.canHaveCreatorSlot()) { return false; }
    var a = this.annotationForReading();
    if (!a) { return false; }
    return a.numberOfPossibleCreatorSlots() > 1;
  }, {category: ['annotations', 'creator slot']});

  add.method('possibleCreatorSlotsSortedByLikelihood', function () {
    var explicitOne = this.explicitlySpecifiedCreatorSlot();
    
    return this.possibleCreatorSlots().sortBy(function(s) {
      if (explicitOne && explicitOne.equals(s)) { return -1; }
      var chainLength = s.holder().creatorSlotChainLength();
      if (typeof(chainLength) !== 'number') { return 1000000; }
      return chainLength;
    });
  }, {category: ['annotations', 'creator slot']});

  add.method('theCreatorSlot', function () {
    if (! this.canHaveCreatorSlot()) { return null; }
    var a = this.annotationForReading();
    if (!a) { return null; }
    return this.convertAnnotationCreatorSlotToRealSlot(a.theCreatorSlot());
  }, {category: ['annotations', 'creator slot']});

  add.method('explicitlySpecifiedCreatorSlot', function () {
    if (! this.canHaveCreatorSlot()) { return null; }
    var a = this.annotationForReading();
    if (! a) { return null; }
    return this.convertAnnotationCreatorSlotToRealSlot(a.explicitlySpecifiedCreatorSlot());
  }, {category: ['annotations', 'creator slot']});

  add.method('setCreatorSlot', function (s) {
    if (s) {
      this.hackToMakeSureArrayIndexablesGetFiledOut(s);
      this.annotationForWriting().setCreatorSlot(s.name(), s.holder().reflectee());
    } else {
      this.annotationForWriting().setCreatorSlot(undefined, undefined);
    }
  }, {category: ['annotations', 'creator slot']});

  add.method('addPossibleCreatorSlot', function (s) {
    this.hackToMakeSureArrayIndexablesGetFiledOut(s);
    this.annotationForWriting().addPossibleCreatorSlot(s.name(), s.holder().reflectee());
  }, {category: ['annotations', 'creator slot']});

  add.method('hackToMakeSureArrayIndexablesGetFiledOut', function (s) {
    if (this.isReflecteeArray()) {
      var module = s.module();
      if (module) { module.objectsThatMightContainSlotsInMe().push(this.reflectee()); }
    }
  }, {category: ['annotations', 'creator slot']});

  add.method('comment', function () {
    return avocado.organization.current.commentForReflecteeOf(this);
  }, {category: ['annotations', 'comment']});

  add.method('setComment', function (c) {
    avocado.organization.current.setCommentForReflecteeOf(this, c);
  }, {category: ['annotations', 'comment']});

  add.method('copyDownParents', function () {
    var a = this.annotationForReading();
    if (! a) { return []; }
    return a.copyDownParents || [];
  }, {category: ['annotations', 'copy-down parents']});

  add.method('setCopyDownParents', function (cdps) {
    this.markCreatorModuleAsChanged();
    // aaa - Of course, we should be removing slots copied in by the previous list of copy-down parents. But never mind that for now.
    var cdpsMir = reflect(cdps);
    if (! cdpsMir.isReflecteeArray()) { throw "Must be an array; e.g. [{parent: Enumerable}]"; }
    var a = this.annotationForWriting();
    a.copyDownParents = cdps;
    a.copyDownSlotsFromAllCopyDownParents(this.reflectee());
  }, {category: ['annotations', 'copy-down parents']});

  add.method('markCreatorModuleAsChanged', function () {
    var cs = this.theCreatorSlot();
    if (cs) { cs.markModuleAsChanged(); }
  }, {category: ['annotations', 'module']});

  add.method('setModuleRecursively', function (m) {
    this.normalSlots().each(function(slot) { slot.setModuleRecursively(m); });
    
    var ps = this.parentSlot();
    var p = ps.contents();
    if (ps.equals(p.theCreatorSlot())) {
      p.setModuleRecursively(m);
    }
  }, {category: ['annotations', 'module']});

  add.method('slotsInModuleNamed', function (moduleName) {
    // Pass in '-' or null if you want unowned slots.
    // Pass in something like {} if you want all non-copied-down slots.
    var wantUnowned = moduleName === '-' || !moduleName;
    var wantAll = !wantUnowned && typeof(moduleName) !== 'string';
    return this.normalSlots().select(function(slot) {
      if (! slot.isFromACopyDownParent()) {
        var m = slot.module();
        if (wantAll || (!m && wantUnowned) || (m && m.name() === moduleName)) {
          return true;
        }
      }
      return false;
    }); 
  }, {category: ['annotations', 'module']});

  add.method('modules', function () {
    var modules = [];
    this.normalSlots().each(function(s) {
      if (! s.isFromACopyDownParent()) {
        var m = s.module();
        if (! modules.include(m)) { modules.push(m); }
      }
    });
    return modules.sort();
  }, {category: ['annotations', 'module']});

  add.method('getParent', function (evt) {
    avocado.ui.grab(this.parent(), evt);
  }, {category: ['menu']});

  add.method('chooseSourceModule', function (caption, callback, evt) {
    var which = avocado.command.list.create();
    which.addItem(["All", function(evt) {callback({}, evt);}]);
    which.addLine();
    this.modules().map(function(m) { return m ? m.name() : '-'; }).sort().each(function(moduleName) {
      which.addItem([moduleName, function(evt) {callback(moduleName, evt);}]);
    });
    avocado.ui.showMenu(which, this, caption, evt);
  }, {category: ['user interface', 'setting modules']});

  add.method('likelyModules', function () {
    return this.modules();
  }, {category: ['user interface', 'setting modules']});

  add.creator('sourceModulePrompter', {}, {category: ['user interface', 'setting modules']});

  add.method('chooseAmongPossibleCreatorSlotChains', function (callback, evt) {
    var akaMenu = avocado.command.list.create();
    this.possibleCreatorSlotsSortedByLikelihood().each(function(s) {
      var chain = s.creatorSlotChainEndingWithMe('theCreatorSlot');
      if (chain) {
        var chainName = this.convertCreatorSlotChainToString(chain);
        akaMenu.addItem([chainName, function(evt) {
          s.beCreator();
          avocado.ui.justChanged(this, evt);
          if (callback) { callback(); }
        }.bind(this)]);
      }
    }.bind(this));
    avocado.ui.showMenu(akaMenu, this, "Other possible names:", evt);
  }, {category: ['user interface', 'creator slots']});

  add.method('automaticallyChooseDefaultNameAndAddNewSlot', function (initialContentsMir, cat) {
    var name = this.findUnusedSlotName(initialContentsMir.isReflecteeFunction() ? "function" : "attribute");
    var s = this.slotAt(name);
    s.setContents(initialContentsMir);
    if (cat) { s.setCategory(cat); }
    if (initialContentsMir.isReflecteeFunction()) { s.beCreator(); }
    return s;
  }, {category: ['user interface', 'slots']});

  add.method('shouldAllowModification', function () {
    return !window.isInCodeOrganizingMode;
  }, {category: ['user interface']});

  add.method('commands', function () {
    var cmdList = avocado.command.list.create(this);

    if (this.canHaveAnnotation()) {
      cmdList.addLine();

      if (this.shouldAllowModification()) {
        cmdList.addItem(avocado.command.create("set module", function(evt, slotsToReassign, targetModule) {
          slotsToReassign.each(function(slot) { slot.setModule(targetModule); });
        }).setArgumentSpecs([
          avocado.command.argumentSpec.create("Of which slots?").onlyAcceptsType(avocado.types.collection.of(avocado.slots['abstract'])).setPrompter(avocado.mirror.sourceModulePrompter),
          avocado.command.argumentSpec.create("To which module?").onlyAcceptsType(transporter.module)
        ]));
      }
    }

    cmdList.addLine();

    cmdList.addItem(["find", [
      avocado.command.create("well-known references", function(evt) {
        avocado.ui.grab(avocado.searchResultsPresenter.create(avocado.referenceFinder.create(this.reflectee()), evt)).redo();
      }, this),
      avocado.command.create("well-known children", function(evt) {
        avocado.ui.showObjects(this.wellKnownChildren().map(reflect), "well-known children of " + this.name(), evt);
      }, this)
    ]]);
    
    cmdList.addItem();
    
    return cmdList;
  }, {category: ['user interface', 'commands']});

  add.method('canHaveAnnotation', function () {
    return this.canHaveSlots();
  }, {category: ['annotations']});

  add.method('hasAnnotation', function () {
    return !!this.annotationForReading();
  }, {category: ['annotations']});

  add.method('annotationForReading', function () {
    if (this._cachedAnnotation) { return this._cachedAnnotation; }
    if (! this.canHaveAnnotation()) { return null; }
    var a = this.getExistingAnnotation();
    if (a) { this._cachedAnnotation = a; }
    return a;
  }, {category: ['annotations']});

  add.method('getExistingAnnotation', function () {
    return avocado.annotator.existingAnnotationOf(this.reflectee());
  }, {category: ['annotations']});

  add.method('annotationForWriting', function () {
    if (this._cachedAnnotation) { return this._cachedAnnotation; }
    if (! this.canHaveAnnotation()) { throw this.name() + " cannot have an annotation"; }
    var a = avocado.annotator.annotationOf(this.reflectee());
    if (a) { this._cachedAnnotation = a; }
    return a;
  }, {category: ['annotations']});

  add.method('functionFromCodeString', function (__codeToRun__) {
    // Damned JS doesn't return the result of the last statement in a function,
    // so gotta try this a couple of ways. First see if the code is an expression,
    // then see if it's a sequence of statements. (Could do this more elegantly if
    // we had a JS parser handy, but for now we don't.)
    
    // first, get rid of any trailing semicolons (in case it's a single expression with a semicolon at the end)
    while (true) {
      __codeToRun__ = __codeToRun__.strip();
      if (! __codeToRun__.endsWith(';')) { break; }
      __codeToRun__ = __codeToRun__.substr(0, __codeToRun__.length - 1);
    }
    
    var __functionToRun__;
    try {
      // Try it as an expression first.
      __functionToRun__ = eval("//@ sourceURL=evaluator\n(function __evaluator__() { return (" + __codeToRun__ + "); })");
    } catch (e) {
      // Try it as a list of statements.
      // Also, put a 'return' after the last semicolon, to return the result of the last statement.
      // Oh, and make sure to put parentheses around the last statement, because if there's a 'return'
      // followed by a newline, JS's semicolon insertion "feature" will just assume that it doesn't
      // need to look at the stuff after the newline.
      var __lastSemicolon__ = __codeToRun__.lastIndexOf(';');
      __codeToRun__ = __codeToRun__.substr(0, __lastSemicolon__ + 1) + ' return (' + __codeToRun__.substr(__lastSemicolon__ + 1) + ')';
      __functionToRun__ = eval("//@ sourceURL=evaluator\n(function __evaluator__() { " + __codeToRun__ + " })");
    }
    
    return __functionToRun__;
  }, {category: ['evaluating']});

  add.method('evalCodeString', function (__codeToRun__) {
    return this.callFunction(this.functionFromCodeString(__codeToRun__));
  }, {category: ['evaluating']});

  add.method('callFunction', function (__functionToRun__) {
    return __functionToRun__.call(this.reflectee());
  }, {category: ['evaluating']});

  add.method('wellKnownChildren', function () {
    return avocado.childFinder.create(this.reflectee()).go();
  }, {category: ['searching']});

  add.method('wellKnownReferences', function () {
    return avocado.referenceFinder.create(this.reflectee()).go().toArray();
  }, {category: ['searching']});

  add.method('categorizeUncategorizedSlotsAlphabetically', function () {
    avocado.organizationUsingAnnotations.alphabeticallyCategorizeUncategorizedSlotsOf(this);
  }, {category: ['organizing']});

  add.creator('tests', Object.create(avocado.testCase), {category: ['tests']});

});


thisModule.addSlots(avocado.mirror.sourceModulePrompter, function(add) {

  add.method('prompt', function (caption, context, evt, callback) {
    context.chooseSourceModule(caption, function(sourceModuleName) {
      callback(context.slotsInModuleNamed(sourceModuleName));
    }, evt);
  }, {category: ['prompting']});

});


thisModule.addSlots(Array.prototype, function(add) {

  add.method('makeCreatorSlots', function (start, end) {
    var thisMir = reflect(this);
    for (var i = start; i < end; ++i) {
      // Only make the indexable slot be the creator if the object
      // doesn't already have a creator. (Not sure this is what we
      // want in all cases, but for now it is.)
      var mir = reflect(this[i]);
      var cs = mir.theCreatorSlot();
      if (! cs || ! cs.contents().equals(mir)) {
        thisMir.slotAt(i).beCreator();
      }
    }
  }, {category: ['reflection', 'creator slots']});

  add.method('unmakeCreatorSlots', function (start, end) {
    var thisMir = reflect(this);
    for (var i = start; i < end; ++i) {
      var o = this[i];
      if (o && !o.aaa_doesNotNeedACreatorSlot) {
        var s = thisMir.slotAt(i);
        var contents = s.contents();
        if (s.equals(contents.theCreatorSlot())) {
          contents.setCreatorSlot(null);
        }
      }
    }
  }, {category: ['reflection', 'creator slots']});

  add.method('adjustCreatorSlots', function (start, end, shiftAmount) {
    if (shiftAmount === 0) { return; }
    if (shiftAmount === undefined) { shiftAmount = 1; }
    var thisMir = reflect(this);
    for (var i = start; i < end; ++i) {
      if (thisMir.slotAt(i - shiftAmount).equals(reflect(this[i]).theCreatorSlot())) {
        thisMir.slotAt(i).beCreator();
      }
    }
  }, {category: ['reflection', 'creator slots']});

  add.method('unshiftAndAdjustCreatorSlots', function (newElem) {
    this.unshift(newElem);
    if (newElem && !newElem.aaa_doesNotNeedACreatorSlot) {
      this.makeCreatorSlots(0, 1);
      this.adjustCreatorSlots(1, this.length);
    }
  }, {category: ['reflection', 'creator slots']});

  add.method('pushAndAdjustCreatorSlots', function (newElem) {
    this.push(newElem);
    if (newElem && !newElem.aaa_doesNotNeedACreatorSlot) {
      this.makeCreatorSlots(this.length - 1, this.length);
    }
  }, {category: ['reflection', 'creator slots']});

  add.method('spliceAndAdjustCreatorSlots', function () {
    var index = arguments[0];
    var howMany = arguments[1];
    this.unmakeCreatorSlots(index, index + howMany);
    var result = this.splice.apply(this, arguments);
    var args = $A(arguments);
    args.shift();
    args.shift();
    this.makeCreatorSlots(index, index + args.length);
    this.adjustCreatorSlots(index + args.length, this.length, args.length - howMany);
    return result;
  }, {category: ['reflection', 'creator slots']});

});


thisModule.addSlots(avocado.mirror.tests, function(add) {

  add.method('testEquality', function () {
    this.assertEqual(reflect(3), reflect(3), "number mirror");
    this.assertEqual(reflect(null), reflect(null), "null mirror");
    this.assertEqual(reflect("noodle"), reflect("noodle"), "string mirror");

    this.assert(! reflect(3).equals(reflect(4)), "number mirror inequality");
    this.assert(! reflect({}).equals(reflect({})), "object mirror inequality");
    this.assert(! reflect(3).equals(reflect({})), "object/number mirror inequality");
    this.assert(! reflect("noodle").equals(reflect("needle")), "string mirror inequality");
    this.assert(! reflect(null).equals(reflect(undefined)), "null/undefined mirror inequality");
  });

  add.method('checkCanHaveSlots', function (mir) {
    var obj = mir.reflectee();
    if (mir.canHaveSlots()) {
      obj.blah = 42;
      this.assert(obj.blah === 42);
    } else {
      var threw;
      try {
        obj.blah = 42;
      } catch (ex) {
        threw = ex;
      }
      if (threw) {
        // fine
      } else {
        this.assert(obj.blah === undefined, "JS doesn't complain when you assign to slots on numbers or strings; it just doesn't do anything");
      }
    }
  });

  add.method('testCanHaveSlots', function () {
    this.checkCanHaveSlots(reflect(null));
    this.checkCanHaveSlots(reflect(undefined));
    this.checkCanHaveSlots(reflect(42));
    this.checkCanHaveSlots(reflect(true));
    this.checkCanHaveSlots(reflect('null'));
    this.checkCanHaveSlots(reflect({}));
    this.checkCanHaveSlots(reflect([]));
    this.checkCanHaveSlots(reflect(function() {}));
  });

  add.method('testIsWellKnown', function () {
    this.assert(reflect(avocado.mirror).isWellKnown());
    this.assert(reflect(avocado.mirror.tests).isWellKnown());
    this.assert(! reflect({}).isWellKnown());

    // Try an object that has a creator slot, but isn't actually connected to
    // the window object by a whole chain of creator slots.
    window.argle = {bargle: {}};
    reflect(argle).slotAt('bargle').beCreator();
    this.assert(! reflect(argle).isWellKnown());
    this.assert(! reflect(argle.bargle).isWellKnown());
    delete window.argle;
  });

  add.method('testIsReflecteeProbablyAClass', function () {
    this.assert(reflect(Object).isReflecteeProbablyAClass());
    this.assert(reflect(Boolean).isReflecteeProbablyAClass());
    this.assert(! reflect(null).isReflecteeProbablyAClass());
    this.assert(! reflect(3).isReflecteeProbablyAClass());
    this.assert(! reflect({}).isReflecteeProbablyAClass());
    this.assert(! reflect(avocado.testCase).isReflecteeProbablyAClass());
    this.assert(! reflect(avocado.stringBuffer).isReflecteeProbablyAClass());
  });

  add.method('testSize', function () {
    avocado.organization.temporarilySetCurrent(avocado.organizationUsingAnnotations, function() {
      var mir = reflect({});
      this.assertEqual(0, mir.size());
      mir.setComment("Set a comment so that there's an annotation.");
      this.assertEqual(0, mir.size(), "annotation doesn't count");
      mir.slotAt('argle').setContents(reflect('whatever'));
      this.assertEqual(1, mir.size());
      mir.slotAt('bargle').setContents(reflect('bleh'));
      this.assertEqual(2, mir.size());
      mir.slotAt('argle').remove();
      this.assertEqual(1, mir.size());
    }.bind(this));
  });

  add.method('testRemovingSlots', function () {
    avocado.organization.temporarilySetCurrent(avocado.organizationUsingAnnotations, function() {
      var obj = {};
      var mir = reflect(obj);
      mir.slotAt('argle').setContents(reflect('whatever'));
      this.assertEqual("whatever", obj.argle);
      mir.slotAt('argle').setComment("make sure there's a slot annotation");
      this.assert(mir.slotAt('argle').annotationIfAny());
      mir.slotAt('argle').remove();
      this.assertEqual(undefined, obj.argle);
      this.assert(! mir.slotAt('argle').annotationIfAny());
    }.bind(this));
  });

  add.method('testRenamingSlots', function () {
    avocado.organization.temporarilySetCurrent(avocado.organizationUsingAnnotations, function() {
      var obj = {};
      var mir = reflect(obj);
      
      mir.slotAt('argle').setContents(reflect('whatever'));
      mir.slotAt('argle').setComment("the comment");
      this.assertEqual("whatever", obj.argle);
      this.assertEqual("the comment", mir.slotAt('argle').comment());
      
      mir.slotAt('argle').rename('bargle');
      this.assertEqual(undefined,  obj. argle);
      this.assertEqual(undefined, obj.argle);
      this.assertEqual("whatever", obj.bargle);
      this.assertEqual("",            mir.slotAt( 'argle').comment());
      this.assertEqual("the comment", mir.slotAt('bargle').comment());
      this.assert(! mir.slotAt( 'argle').annotationIfAny());
      this.assert(  mir.slotAt('bargle').annotationIfAny());
    }.bind(this));
  });

  add.method('testTypeTesting', function () {
    this.assert(  reflect(null     ).isReflecteeNull());
    this.assert(! reflect(undefined).isReflecteeNull());
    this.assert(! reflect(false    ).isReflecteeNull());
    this.assert(! reflect(''       ).isReflecteeNull());

    this.assert(  reflect(undefined).isReflecteeUndefined());
    this.assert(! reflect(null     ).isReflecteeUndefined());
    this.assert(! reflect(false    ).isReflecteeUndefined());
    this.assert(! reflect(0        ).isReflecteeUndefined());

    this.assert(  reflect(3   ).isReflecteeNumber());
    this.assert(  reflect(NaN ).isReflecteeNumber());
    this.assert(! reflect(null).isReflecteeNumber());
    this.assert(! reflect('3' ).isReflecteeNumber());

    this.assert(  reflect('3' ).isReflecteeString());
    this.assert(! reflect(null).isReflecteeString());
    this.assert(! reflect(3   ).isReflecteeString());
    this.assert(! reflect({}  ).isReflecteeString());

    this.assert(  reflect(true     ).isReflecteeBoolean());
    this.assert(  reflect(false    ).isReflecteeBoolean());
    this.assert(! reflect(null     ).isReflecteeBoolean());
    this.assert(! reflect(undefined).isReflecteeBoolean());
    this.assert(! reflect(3        ).isReflecteeBoolean());
    this.assert(! reflect({}       ).isReflecteeBoolean());

    this.assert(  reflect([]           ).isReflecteeArray());
    this.assert(  reflect([3]          ).isReflecteeArray());
    this.assert(! reflect({lalala: 54} ).isReflecteeArray());
    this.assert(! reflect('hmm'        ).isReflecteeArray());
    this.assert(! reflect(function() {}).isReflecteeArray());
    this.assert(! reflect(null         ).isReflecteeArray());
    this.assert(! reflect(3            ).isReflecteeArray());
    this.assert(! reflect(true         ).isReflecteeArray());

    this.assert(  reflect(function() {}).isReflecteeFunction());
    this.assert(  reflect(exitValueOf  ).isReflecteeFunction());
    this.assert(! reflect({}           ).isReflecteeFunction());
    this.assert(! reflect('hmm'        ).isReflecteeFunction());
    this.assert(! reflect(null         ).isReflecteeFunction());

    this.assert(  reflect(function() {     }        ).isReflecteeSimpleMethod());
    this.assert(  reflect(function() {ok();}        ).isReflecteeSimpleMethod());
    this.assert(  reflect(this.setUp                ).isReflecteeSimpleMethod(), "methods with $super still count");
    this.assert(! reflect(exitValueOf               ).isReflecteeSimpleMethod());
    this.assert(! reflect({}                        ).isReflecteeSimpleMethod());
    this.assert(! reflect('hmm'                     ).isReflecteeSimpleMethod());
    this.assert(! reflect(null                      ).isReflecteeSimpleMethod());

    var functionWithASlot = function() {};
    functionWithASlot.something = 41;
    this.assert(! reflect(functionWithASlot).isReflecteeSimpleMethod());
  });

  add.method('setUp', function ($super) {
    // This method is just here so that I can make sure that methods that
    // call $super still respond with true to isReflecteeSimpleMethod().
    return $super();
  });

  add.method('createNestedClasses', function (f) {
    Object.subclass("Argle", {});
    Object.subclass("Argle.prototype.Bargle", {});
    reflect(window).slotAt( 'Argle').beCreator();
    reflect(Argle).slotAt('prototype').beCreator();
    reflect(Argle.prototype).slotAt('Bargle').beCreator();
    reflect(Argle.prototype.Bargle).slotAt('prototype').beCreator();
    try {
      f();
    } finally {
      reflect(window).slotAt('Argle').remove();
    }
  });

  add.method('testNaming', function () {
    this.assertEqual("3", reflect(3).name());
    this.assertEqual("null", reflect(null).name());
    this.assertEqual("undefined", reflect(undefined).name());
    this.assertEqual("'lalala'", reflect("lalala").name());
    this.assertEqual("a Function", reflect(function() {}).name());
    this.assertEqual("an Object", reflect({}).name());
    this.assertEqual("an Array", reflect([1, 'two', 3]).name());
    this.assertEqual("transporter", reflect(transporter).name());
    this.assertEqual("transporter.module", reflect(transporter.module).name());
    this.assertEqual("", reflect(window).name()); // aaa - maybe just fix this to say 'window'?;
    
    this.createNestedClasses(function() {
      this.assertEqual("an Argle.Bargle", reflect(new Argle.prototype.Bargle()).name());
    }.bind(this));
  });

  add.method('testInspect', function () {
    this.assertEqual("3", reflect(3).inspect());
    this.assertEqual("null", reflect(null).inspect());
    this.assertEqual("undefined", reflect(undefined).inspect());
    this.assertEqual("'lalala'", reflect("lalala").inspect());
    this.assertEqual("a Function", reflect(function() {}).inspect());
    this.assertEqual("an Object", reflect({}).inspect());
    this.assertEqual("an Array([1, 'two', 3])", reflect([1, 'two', 3]).inspect());
    this.assertEqual("transporter", reflect(transporter).inspect());
    this.assertEqual("transporter.module", reflect(transporter.module).inspect());
    this.assertEqual("window", reflect(window).inspect());
    
    var mirWithBadCreatorSlot = reflect({});
    mirWithBadCreatorSlot.setCreatorSlot(reflect(window).slotAt('doesntExist'));
    this.assertEqual("an Object", mirWithBadCreatorSlot.inspect());
  });

  add.method('testCreatorSlotChainExpression', function () {
    this.assertThrowsException(function() { reflect(3).creatorSlotChainExpression(); });
    this.assertThrowsException(function() { reflect(null).creatorSlotChainExpression(); });
    this.assertThrowsException(function() { reflect(undefined).creatorSlotChainExpression(); });
    this.assertThrowsException(function() { reflect("lalala").creatorSlotChainExpression(); });
    this.assertThrowsException(function() { reflect(function() {}).creatorSlotChainExpression(); });
    this.assertThrowsException(function() { reflect({}).creatorSlotChainExpression(); });
    this.assertThrowsException(function() { reflect([1, 'two', 3]).creatorSlotChainExpression(); });
    this.assertEqual("transporter", reflect(transporter).creatorSlotChainExpression());
    this.assertEqual("transporter.module", reflect(transporter.module).creatorSlotChainExpression());
    this.assertEqual("window", reflect(window).creatorSlotChainExpression());
    
    avocado['!=!'] = {};
    reflect(avocado).slotAt(['!=!']).beCreator();
    this.assertEqual("avocado['!=!']", reflect(avocado['!=!']).creatorSlotChainExpression());
    
    this.createNestedClasses(function() {
      this.assertEqual("Argle.prototype.Bargle.prototype", reflect(Argle.prototype.Bargle.prototype).creatorSlotChainExpression());
    }.bind(this));
  });

  add.method('testMorphDuplication', function () {
    // aaa - at first I thought this was a mirror bug, but it wasn't, so this test should maybe live elsewhere
    var s = reflect(window).slotAt('argleBargleMorph');
    var mMir = reflect(Morph.makeRectangle(pt(100,200), pt(60, 30)));
    s.setContents(mMir);
    s.beCreator();
    var m2Mir = reflect(mMir.reflectee().duplicate());
    this.assert(mMir.annotationForReading() !== m2Mir.annotationForReading(), "the annotation should not be shared");
    s.remove();
  });

  add.method('createSlot', function (mir, name, contents, catParts) {
    var slot = mir.slotAt(name);
    slot.setContents(reflect(contents));
    if (catParts) { slot.setCategory(mir.category(catParts)); }
    return slot;
  });

  add.method('checkComment', function (x, comment) {
    x.setComment(comment);
    this.assertEqual(comment, x.comment(), "Comment didn't work: " + comment);
  });

  add.method('testComments', function () {
    avocado.organization.temporarilySetCurrent(avocado.organizationUsingAnnotations, function() {
      this.checkComment(reflect({})            , "an object comment");
      this.checkComment(reflect({}).slotAt('a'), "a slot comment");
    }.bind(this));
  });

  add.method('testCategories', function () {
    avocado.organization.temporarilySetCurrent(avocado.organizationUsingAnnotations, function() {
      var o = {};
      var mir = reflect(o);
      this.createSlot(mir, 'a', 42, ['letters', 'vowels']);
      this.createSlot(mir, 'b', 43, ['letters', 'consonants']);
      this.createSlot(mir, 'c', 44, ['letters', 'consonants']);
      this.createSlot(mir, 'd', 45, ['letters', 'consonants']);
      this.createSlot(mir, 'e', 46, ['letters', 'vowels']);
      this.createSlot(mir, 'y', 47, ['letters']);
      
      var root = mir.rootCategory();
      this.assertEqual('letters', mir.immediateSubcategoriesOf(root).toArray().join(', '));
      this.assertEqual('letters consonants, letters vowels', mir.immediateSubcategoriesOf(root.subcategory('letters')).sort().join(', '));
      this.assertEqual('', mir.immediateSubcategoriesOf(root.subcategory('letters').subcategory('vowels')).sort().join(', '));
      
      this.assertEqual('', mir.slotsInCategory(root).sort().join(', '));
      this.assertEqual('y', mir.slotsInCategory(root.subcategory('letters')).sort().join(', '));
      this.assertEqual('a, e', mir.slotsInCategory(root.subcategory('letters').subcategory('vowels')).sort().join(', '));
      
      this.assertEqual('b, c, d', mir.slotsNestedSomewhereUnderCategory(root.subcategory('letters').subcategory('consonants')).sort().join(', '));
      this.assertEqual('a, b, c, d, e, y', mir.slotsNestedSomewhereUnderCategory(root).sort().join(', '));
      
      var o2 = {};
      var mir2 = reflect(o2);
      mir.category(['letters']).copyInto(mir2.category(['glyphs']));
      this.assertEqual(42, o2.a);
      this.assertEqual(mir2.category(['glyphs', 'letters', 'vowels']), mir2.slotAt('a').category());
      
      mir.category(['letters', 'vowels']).copyInto(mir2.rootCategory());
      this.assertEqual(42, o2.a);
      this.assertEqual(mir2.category(['vowels']), mir2.slotAt('a').category());
      
      mir.rootCategory().copyContentsInto(mir2.category(['stuff']));
      this.assertEqual(42, o2.a);
      this.assertEqual(mir2.category(['stuff', 'letters', 'vowels']), mir2.slotAt('a').category());
    }.bind(this));
  });

  add.method('testExpressionEvaluatingToMe', function () {
    this.assertEqual('3', reflect(3).expressionEvaluatingToMe());
    this.assertEqual('null', reflect(null).expressionEvaluatingToMe());
    this.assertEqual('false', reflect(false).expressionEvaluatingToMe());
    this.assertEqual("'pleh'", reflect('pleh').expressionEvaluatingToMe());
    this.assertEqual("[1, 2, 'three']", reflect([1, 2, 'three']).expressionEvaluatingToMe());
    
    // Don't wanna test the text directly because different browsers print the function slightly differently.
    var functionText = reflect(function(a) { return a + 4; }).expressionEvaluatingToMe();
    var recreatedFunction = eval("(" + functionText + ")");
    this.assertEqual(19, recreatedFunction(15));

    this.assertEqual('3', reflect(3).expressionEvaluatingToMe(true));
    this.assertEqual('null', reflect(null).expressionEvaluatingToMe(true));
    this.assertEqual('false', reflect(false).expressionEvaluatingToMe(true));

    window.argle = {bargle: 42};
    this.assertEqual('{bargle: 42}',    reflect(argle).expressionEvaluatingToMe());
    reflect(window).slotAt('argle').beCreator();
    this.assertEqual('argle',           reflect(argle).expressionEvaluatingToMe());
    this.assertEqual('{bargle: 42}',    reflect(argle).expressionEvaluatingToMe(true));
    delete window.argle;
  });

  add.method('testCopyDownParents', function () {
    var mirA = reflect({a: 1, aa: 11});
    this.assertEqual(2, mirA.size());
    var mirB = reflect({b: 2, bb: 22, bbb: 222});
    var mirC = reflect({c: 3, bleh: 'bleh!'});
    mirB.slotAt('b').setCategory(mirB.category(['categories should be copied down']));
    mirA.setCopyDownParents([{parent: mirB.reflectee()}, {parent: mirC.reflectee(), slotsToOmit: ['bleh']}]);
    this.assertEqual(3, mirB.size());
    this.assertEqual(2, mirC.size());
    this.assertEqual(6, mirA.size());
    this.assertEqual(1,   mirA.reflectee().a  );
    this.assertEqual(11,  mirA.reflectee().aa );
    this.assertEqual(2,   mirA.reflectee().b  );
    this.assertEqual(22,  mirA.reflectee().bb );
    this.assertEqual(222, mirA.reflectee().bbb);
    this.assertEqual(3,   mirA.reflectee().c  );

    this.assertEqual(null,                      mirA.slotAt('a'  ).copyDownParentThatIAmFrom());
    this.assertEqual(null,                      mirA.slotAt('aa' ).copyDownParentThatIAmFrom());
    this.assertEqual(mirA.copyDownParents()[0], mirA.slotAt('b'  ).copyDownParentThatIAmFrom());
    this.assertEqual(mirA.copyDownParents()[0], mirA.slotAt('bb' ).copyDownParentThatIAmFrom());
    this.assertEqual(mirA.copyDownParents()[0], mirA.slotAt('bbb').copyDownParentThatIAmFrom());
    this.assertEqual(mirA.copyDownParents()[1], mirA.slotAt('c'  ).copyDownParentThatIAmFrom());
    
    this.assertEqual(mirA.category(['categories should be copied down']).parts(), mirA.slotAt('b').category().parts());
  });

  add.method('testIndexableCreatorSlots', function () {
    var a = [], aMir = reflect(a);
    var oA = {}, oB = {}, oC = {}, oD = {}, oE = {}, oX = {};
    a.pushAndAdjustCreatorSlots(oX);
    this.assertEqual(aMir.slotAt('0'), reflect(oX).theCreatorSlot());
    a.pushAndAdjustCreatorSlots(oE);
    this.assertEqual(aMir.slotAt('0'), reflect(oX).theCreatorSlot());
    this.assertEqual(aMir.slotAt('1'), reflect(oE).theCreatorSlot());
    a.unshiftAndAdjustCreatorSlots(oA);
    this.assertEqual(aMir.slotAt('0'), reflect(oA).theCreatorSlot());
    this.assertEqual(aMir.slotAt('1'), reflect(oX).theCreatorSlot());
    this.assertEqual(aMir.slotAt('2'), reflect(oE).theCreatorSlot());
    this.assertEqual([oX], a.spliceAndAdjustCreatorSlots(1, 1, oB, oC, oD));
    this.assertEqual(aMir.slotAt('0'), reflect(oA).theCreatorSlot());
    this.assertEqual(aMir.slotAt('1'), reflect(oB).theCreatorSlot());
    this.assertEqual(aMir.slotAt('2'), reflect(oC).theCreatorSlot());
    this.assertEqual(aMir.slotAt('3'), reflect(oD).theCreatorSlot());
    this.assertEqual(aMir.slotAt('4'), reflect(oE).theCreatorSlot());
    this.assert(! reflect(oX).theCreatorSlot());

    this.assertEqual(reflect(avocado).slotAt('dictionary'), reflect(avocado.dictionary).theCreatorSlot());
    a.pushAndAdjustCreatorSlots(avocado.dictionary); // a well-known object shouldn't have its creator slot changed
    this.assertEqual(reflect(avocado).slotAt('dictionary'), reflect(avocado.dictionary).theCreatorSlot());
  });

  add.method('testGettingSlotsByModule', function () {
    var o = {};
    var p = {copiedDown1: 'copiedDown1', copiedDown2: 'copiedDown2'};
    var m1 = transporter.module.named('temp_mod_1');
    var m2 = transporter.module.named('temp_mod_2');
    var m3 = transporter.module.named('temp_mod_3');
    var mir  = reflect(o);
    var pMir = reflect(p);
    mir.setCopyDownParents([{parent: p}]);
    pMir.slotAt('copiedDown1').setModule(m3);
    var s1 = this.createSlot(mir, 'a', 1);
    var s2 = this.createSlot(mir, 'b', 2);
    var s3 = this.createSlot(mir, 'c', 3);
    var s4 = this.createSlot(mir, 'd', 4);
    var s5 = this.createSlot(mir, 'e', 5);
    this.assertEqual([null], mir.modules());
    this.assertEqual([s1, s2, s3, s4, s5], mir.slotsInModuleNamed({}          ).sort());
    this.assertEqual([s1, s2, s3, s4, s5], mir.slotsInModuleNamed(null        ).sort());
    this.assertEqual([                  ], mir.slotsInModuleNamed('temp_mod_1').sort());
    this.assertEqual([                  ], mir.slotsInModuleNamed('temp_mod_2').sort());
    this.assertEqual([                  ], mir.slotsInModuleNamed('temp_mod_3').sort());
    s3.setModule(m1);
    s5.setModule(m1);
    s2.setModule(m2);
    this.assertEqual([null, m1, m2], mir.modules());
    this.assertEqual([s1, s2, s3, s4, s5], mir.slotsInModuleNamed({}          ).sort());
    this.assertEqual([s1,         s4    ], mir.slotsInModuleNamed(null        ).sort());
    this.assertEqual([        s3,     s5], mir.slotsInModuleNamed('temp_mod_1').sort());
    this.assertEqual([    s2            ], mir.slotsInModuleNamed('temp_mod_2').sort());
    this.assertEqual([                  ], mir.slotsInModuleNamed('temp_mod_3').sort());
    m1.uninstall();
    m2.uninstall();
    m3.uninstall();
  });

  add.method('testSettingModuleRecursively', function () {
    var m = transporter.module.named('temp_mod');
    var cdp = {copiedDown: true};
    var p = {c: 3};
    var o = Object.create(p);
    Object.extend(o, {a: 1, b: 2, x: {xa: 'one', xb: 'two'}, y: {ya: 'un'}});
    
    reflect(o).setCopyDownParents([{parent: cdp}]);
    reflect(o).slotAt('x').beCreator();
    reflect(o).parentSlot().beCreator();
    reflect(o).setModuleRecursively(m);
    
    // Slots accessible through creator slots should be included.
    // Copied-down slots should not be included.
    this.assertEqual('a, b, c, x, xa, xb, y', m.slots().map(function(s) { return s.name(); }).sort().join(', '));
    
    m.uninstall();
  });

  add.method('testFindingUnusedSlotNames', function () {
    var i;
    var o = {};
    var mir = reflect(o);
    this.assertEqual(0, mir.size());
    for (i = 0; i < 20; ++i) { o[mir.findUnusedSlotName()] = i; }
    this.assertEqual(20, mir.size());
    for (i = 0; i < 30; ++i) { o[mir.findUnusedSlotName("prefix_")] = i + 1000; }
    this.assertEqual(50, mir.size());
  });

  add.method('testCreatingMirrorsByObjectName', function () {
    this.assertIdentity(null,                 avocado.mirror.forObjectNamed(['blahblahnothing'           ])            );
    this.assertIdentity(avocado,              avocado.mirror.forObjectNamed(['avocado'                   ]).reflectee());
    this.assertIdentity(avocado.mirror,       avocado.mirror.forObjectNamed(['avocado', 'mirror'         ]).reflectee());
    this.assertIdentity(avocado.mirror.tests, avocado.mirror.forObjectNamed(['avocado', 'mirror', 'tests']).reflectee());
  });

  add.method('testHashing', function () {
    var d = avocado.dictionary.copyRemoveAll();
    var o1 = {};
    var o2 = {};
    d.put(reflect(3), 'three');
    d.put(reflect(false), 'false');
    d.put(reflect(null), 'null');
    d.put(reflect(undefined), 'undefined');
    d.put(reflect(o1), 'an object');
    d.put(reflect(o2), 'another object');
    this.assertIdentity('three', d.get(reflect(3)));
    this.assertIdentity('false', d.get(reflect(false)));
    this.assertIdentity('null', d.get(reflect(null)));
    this.assertIdentity('undefined', d.get(reflect(undefined)));
    this.assertIdentity('an object', d.get(reflect(o1)));
    this.assertIdentity('another object', d.get(reflect(o2)));
  });

});


});
