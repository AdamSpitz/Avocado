transporter.module.create('reflection/mirror', function(requires) {

requires('core/enumerator');
requires('core/lk_TestFramework');

}, function(thisModule) {


thisModule.addSlots(window, function(add) {

  add.creator('mirror', {}, {category: ['avocado', 'reflection']});

  add.method('reflect', function (o) {
    var m = Object.create(mirror);
    m.initialize(o);
    return m;
  }, {category: ['avocado', 'reflection']});

});


thisModule.addSlots(mirror, function(add) {

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
    return this.reflectee() === m.reflectee();
  }, {category: ['comparing']});

  add.method('hashCode', function () {
    // Damned JavaScript. Can I get a proper object ID hash somehow?;
    var o = this.reflectee();
    if (o === undefined) { return "a mirror on undefined"; }
    if (o === null     ) { return "a mirror on null";      }
    try {
      if (o.identityHashCode) { return o.identityHashCode(); }
    } catch (ex) {
      // don't want mirrors to crash if the object is broken
    }
    return "a mirror";
  }, {category: ['comparing']});

  add.method('reflecteeToString', function () {
    try {
      if (! this.canHaveSlots()) { return "" + this.reflectee(); }

      // Ignore the default toString because it just says [object Object] all the time and it's annoying.
      if (this.reflectee().toString === Object.prototype.toString) { return ""; } 
      
      return this.reflectee().toString();
    } catch (ex) {
      return "";
    }
  }, {category: ['naming']});

  add.method('toString', function () {
    return "on " + this.inspect();
  }, {category: ['naming']});

  add.method('nameOfLobby', function () {
    return "window";
  }, {category: ['naming']});

  add.method('inspect', function () {
    if (this.reflectee() === window) {return this.nameOfLobby();}
    if (! this.canHaveSlots()) {return Object.inspect(this.reflectee());}
    if (this.isReflecteeArray()) { return this.reflectee().length > 5 ? "an array" : "[" + this.reflectee().map(function(elem) {return reflect(elem).inspect();}).join(", ") + "]"; }
    var n = this.name();
    if (this.isReflecteeFunction()) { return n; } // the code will be visible through the *code* fake-slot
    var s = avocado.stringBuffer.create(n);
    var toString = this.reflecteeToString();
    if (typeof toString === 'string' && toString && toString.length < 40) { s.append("(").append(toString).append(")"); }
    return s.toString();
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
    if (! this.canHaveCreatorSlot()) {return Object.inspect(this.reflectee());}

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
    if (javascriptReservedWords[n]) { return false; }
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

  add.method('eachFakeSlot', function (f) {
    if (this.isReflecteeFunction()) { f(this.functionBodySlot()); }
    if (this.hasAccessibleParent()) { f(this.      parentSlot()); }
  }, {category: ['iterating']});

  add.method('functionBodySlot', function () {
    return Object.create(slots.functionBody).initialize(this);
  }, {category: ['functions']});

  add.method('parentSlot', function () {
    return Object.create(slots.parent).initialize(this);
  }, {category: ['accessing parent']});

  add.method('eachNormalSlot', function (f) {
    this.eachNormalSlotName(function(n) { f(this.slotAt(n)); }.bind(this));
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
    if (! window.prototypeAttributeIsEnumerable) {
      if (o.hasOwnProperty("prototype")) {
        f("prototype");
      }
    }
  }, {category: ['iterating']});

  add.method('normalSlotNames', function (f) {
    return avocado.enumerator.create(this, 'eachNormalSlotName');
  }, {category: ['iterating']});

  add.method('eachSlotInCategory', function (c, f) {
    this.eachNormalSlot(function(s) {
      if (c.equals(s.category())) { f(s); }
    });
  }, {category: ['iterating']});

  add.method('eachSlotNestedSomewhereUnderCategory', function (c, f) {
    this.eachNormalSlot(function(s) {
      if (s.category().isEqualToOrSubcategoryOf(c)) { f(s); }
    });
  }, {category: ['iterating']});

  add.method('eachImmediateSubcategoryOf', function (c, f) {
    var subcats = {};
    this.eachNormalSlot(function(s) {
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

  add.method('slotAt', function (n) {
    if (n === '__proto__') { return this.parentSlot(); }
    return Object.create(slots.plain).initialize(this, n.toString());
  }, {category: ['accessing slot contents']});

  add.method('primitiveContentsAt', function (n) {
    return this.reflectee()[n];
  }, {category: ['accessing slot contents']});

  add.method('primitiveSetContentsAt', function (n, o) {
    this.reflectee()[n] = o;
    return o;
  }, {category: ['accessing slot contents']});

  add.method('primitiveRemoveSlotAt', function (n) {
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
    } while (this.reflectee().hasOwnProperty(name));
    return name;
  }, {category: ['accessing slot contents']});

  add.method('reflecteeHasOwnProperty', function (n) {
    if (! this.canHaveSlots()) { return false; }
    return this.reflectee().hasOwnProperty(n);
  }, {category: ['accessing reflectee']});

  add.method('parent', function () {
    if (! this.canAccessParent()) { throw "Sorry, you can't access an object's parent in this browser. Try Firefox or Safari."; }
    if (! this.hasParent()) { throw this.name() + " does not have a parent."; }
    return reflect(this.reflectee()['__proto__']); // using [] to fool JSLint;
  }, {category: ['accessing parent']});

  add.method('canAccessParent', function () {
    return String.prototype['__proto__'] !== undefined; // using [] to fool JSLint;
  }, {category: ['accessing parent']});

  add.method('hasParent', function () { return ! (this.isReflecteeNull() || this.isReflecteeUndefined()); }, {category: ['accessing parent']});

  add.method('hasAccessibleParent', function () { return this.canAccessParent() && this.hasParent(); }, {category: ['accessing parent']});

  add.method('setParent', function (pMir) {
    if (! this.canAccessParent()) { throw "Sorry, you can't change an object's parent in this browser. Try Firefox or Safari."; }
    this.reflectee()['__proto__'] = pMir.reflectee(); // using [] to fool JSLint;
  }, {category: ['accessing parent']});

  add.method('createChild', function () {
    return reflect(Object.create(this.reflectee()));
  }, {category: ['children']});

  add.method('createSubclass', function () {
    var subclass = reflect(this.reflectee().subclass());
    subclass.slotAt('prototype').beCreator();
    return subclass;
  }, {category: ['children']});

  add.method('source', function () {
    if (! this.isReflecteeFunction()) { throw "not a function"; }
    return this.reflectee().toString();
  }, {category: ['functions']});

  add.method('expressionEvaluatingToMe', function (shouldNotUseCreatorSlotChainExpression) {
    if (! this.canHaveCreatorSlot()) { return Object.inspect(this.reflectee()); }
    if (!shouldNotUseCreatorSlotChainExpression && this.isWellKnown('probableCreatorSlot')) { return this.creatorSlotChainExpression(); }
    if (this.isReflecteeFunction()) { return this.source(); }
    if (this.isReflecteeArray()) { return "[" + this.reflectee().map(function(elem) {return reflect(elem).expressionEvaluatingToMe();}).join(", ") + "]"; }

    // aaa not thread-safe
    if (this.reflectee().__already_calculating_expressionEvaluatingToMe__) { throw "encountered circular structure"; }
    try {
      this.reflectee().__already_calculating_expressionEvaluatingToMe__ = true;

      var str = avocado.stringBuffer.create("{");
      var sep = "";
      this.eachNormalSlot(function(slot) {
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
    var size = 0;
    this.eachNormalSlot(function(s) { size += 1; });
    return size;
  }, {category: ['accessing slot contents']});

  add.method('canHaveSlots', function () {
    var o = this.reflectee();
    var t = typeof o;
    return t === 'function' || (t === 'object' && o !== null);
  }, {category: ['accessing slot contents']});

  add.method('canHaveChildren', function () {
    // aaa - Is this correct? I think maybe inheriting from arrays doesn't work so well in some browsers.
    var o = this.reflectee();
    var t = typeof o;
    return t === 'function' || (t === 'object' && o !== null);
  }, {category: ['children']});

  add.method('isReflecteeNull', function () { return this.reflectee() === null;      }, {category: ['testing']});

  add.method('isReflecteeUndefined', function () { return this.reflectee() === undefined; }, {category: ['testing']});

  add.method('isReflecteeString', function () { return typeof this.reflectee() === 'string';  }, {category: ['testing']});

  add.method('isReflecteeNumber', function () { return typeof this.reflectee() === 'number';  }, {category: ['testing']});

  add.method('isReflecteeBoolean', function () { return typeof this.reflectee() === 'boolean'; }, {category: ['testing']});

  add.method('isReflecteeArray', function () { return typeof this.reflectee() === 'object' && this.reflectee() instanceof Array; }, {category: ['testing']});

  add.method('isReflecteeFunction', function () {
    return typeof(this.reflectee()) === 'function';
  }, {category: ['testing']});

  add.method('isReflecteeSimpleMethod', function () {
    if (! this.isReflecteeFunction()) {return false;}

    var aaa_LK_slotNamesAttachedToMethods = ['declaredClass', 'methodName', 'displayName'];
    var aaa_LK_slotNamesUsedForSuperHack = ['valueOf', 'toString', 'originalFunction'];

    var hasSuper = this.reflectee().argumentNames && this.reflectee().argumentNames().first() === '$super';

    var nonTrivialSlot = Object.newChildOf(avocado.enumerator, this, 'eachNormalSlot').find(function(s) {
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

  add.method('canHaveCreatorSlot', function () {
    var o = this.reflectee();
    var t = typeof o;
    return t === 'function' || (t === 'object' && o !== null);
  }, {category: ['annotations', 'creator slot']});

  add.method('convertAnnotationCreatorSlotToRealSlot', function (s) {
    return s ? reflect(s.holder).slotAt(s.name) : null;
  }, {category: ['annotations', 'creator slot']});

  add.method('probableCreatorSlot', function () {
    if (! this.canHaveCreatorSlot()) { return null; }
    var a = this.annotation();
    if (!a) { return null; }
    return this.convertAnnotationCreatorSlotToRealSlot(a.probableCreatorSlot());
  }, {category: ['annotations', 'creator slot']});

  add.method('possibleCreatorSlots', function () {
    if (! this.canHaveCreatorSlot()) { return []; }
    var a = this.annotation();
    if (!a) { return []; }
    var ss = a.possibleCreatorSlots;
    if (!ss) { return []; }
    return ss.map(function(s) { return this.convertAnnotationCreatorSlotToRealSlot(s); }.bind(this));
  }, {category: ['annotations', 'creator slot']});

  add.method('creatorSlotChainLength', function () {
    return annotator.creatorChainLength(this.reflectee());
  }, {category: ['annotations', 'creator slot']});

  add.method('hasMultiplePossibleCreatorSlots', function () {
    if (! this.canHaveCreatorSlot()) { return false; }
    var a = this.annotation();
    if (!a) { return false; }
    var ss = a.possibleCreatorSlots;
    if (!ss) { return false; }
    return ss.length > 1;
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
    var a = this.annotation();
    if (!a) { return null; }
    return this.convertAnnotationCreatorSlotToRealSlot(a.theCreatorSlot());
  }, {category: ['annotations', 'creator slot']});

  add.method('explicitlySpecifiedCreatorSlot', function () {
    if (! this.canHaveCreatorSlot()) { return null; }
    var a = this.annotation();
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
    return organization.current.commentForReflecteeOf(this);
  }, {category: ['annotations', 'comment']});

  add.method('setComment', function (c) {
    organization.current.setCommentForReflecteeOf(this, c);
  }, {category: ['annotations', 'comment']});

  add.method('copyDownParents', function () {
    var a = this.annotation();
    if (! a) { return []; }
    return a.copyDownParents || [];
  }, {category: ['annotations', 'copy-down parents']});

  add.method('setCopyDownParents', function (cdps) {
    // aaa - Of course, we should be removing slots copied in by the previous list of copy-down parents. But never mind that for now.
    var cdpsMir = reflect(cdps);
    if (! cdpsMir.isReflecteeArray()) { throw "Must be an array; e.g. [{parent: Enumerable}]"; }
    this.annotationForWriting().copyDownParents = cdps;
    for (var i = 0; i < cdps.length; ++i) {
      if (cdps[i].parent === undefined) { throw "Each element of the array must contain a 'parent' slot pointing to the desired copy-down parent; e.g. [{parent: Enumerable}]"; }
      this.annotationForWriting().copyDownSlots(this.reflectee(), cdps[i].parent, cdps[i].slotsToOmit);
    }
  }, {category: ['annotations', 'copy-down parents']});

  add.method('setModuleRecursively', function (m) {
    this.eachNormalSlot(function(slot) { slot.setModuleRecursively(m); });
    
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
    return avocado.enumerator.create(this, 'eachNormalSlot').select(function(slot) {
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
    this.eachNormalSlot(function(s) {
      if (! s.isFromACopyDownParent()) {
        var m = s.module();
        if (! modules.include(m)) { modules.push(m); }
      }
    });
    return modules.sort();
  }, {category: ['annotations', 'module']});

  add.method('chooseSourceModule', function (caption, callback, evt) {
    var which = avocado.command.list.create();
    which.addItem(["All", function(evt) {callback({}, evt);}]);
    which.addLine();
    this.modules().map(function(m) { return m ? m.name() : '-'; }).sort().each(function(moduleName) {
      which.addItem([moduleName, function(evt) {callback(moduleName, evt);}]);
    });
    avocado.ui.showMenu(which, this, caption, evt);
  }, {category: ['user interface', 'setting modules']});

  add.method('interactivelySetModuleOfManySlots', function (evt) {
    this.chooseSourceModule("Of which slots?", function(sourceModuleName, evt) {
      var slotsToReassign = this.slotsInModuleNamed(sourceModuleName);
      transporter.chooseOrCreateAModule(evt, this.modules(), this, "To which module?", function(targetModule, evt) {
        slotsToReassign.each(function(slot) { slot.setModule(targetModule); });
      });
    }.bind(this), evt);
  }, {category: ['user interface', 'setting modules']});

  add.method('canHaveAnnotation', function () {
    return this.canHaveSlots();
  }, {category: ['annotations']});

  add.method('hasAnnotation', function () {
    return !!this.annotation();
  }, {category: ['annotations']});

  add.method('annotation', function () {
    if (this._cachedAnnotation) { return this._cachedAnnotation; }
    if (! this.canHaveAnnotation()) { return null; }
    var a = annotator.existingAnnotationOf(this.reflectee());
    if (a) { this._cachedAnnotation = a; }
    return a;
  }, {category: ['annotations']});

  add.method('annotationForWriting', function () {
    if (this._cachedAnnotation) { return this._cachedAnnotation; }
    if (! this.canHaveAnnotation()) { throw this.name() + " cannot have an annotation"; }
    var a = annotator.annotationOf(this.reflectee());
    if (a) { this._cachedAnnotation = a; }
    return a;
  }, {category: ['annotations']});

  add.method('wellKnownChildren', function () {
    return avocado.childFinder.create(this.reflectee()).go();
  }, {category: ['searching']});

  add.method('wellKnownReferences', function () {
    return avocado.referenceFinder.create(this.reflectee()).go().toArray();
  }, {category: ['searching']});

  add.method('categorizeUncategorizedSlotsAlphabetically', function () {
    var uncategorized = category.root().subcategory("uncategorized");
    this.eachNormalSlot(function(s) {
      var c = category.create(organizationUsingAnnotations.categoryForSlot(s));
      if (c.isRoot()) {
        organizationUsingAnnotations.setCategoryForSlot(s, uncategorized.subcategory((s.name()[0] || '_unnamed_').toUpperCase()).parts());
      }
    });
  }, {category: ['organizing']});

  add.creator('tests', Object.create(TestCase.prototype), {category: ['tests']});

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


thisModule.addSlots(mirror.tests, function(add) {

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
    this.assert(reflect(mirror).isWellKnown());
    this.assert(reflect(mirror.tests).isWellKnown());
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
    this.assert(reflect(Morph).isReflecteeProbablyAClass());
    this.assert(reflect(TestCase).isReflecteeProbablyAClass());
    this.assert(! reflect(null).isReflecteeProbablyAClass());
    this.assert(! reflect(3).isReflecteeProbablyAClass());
    this.assert(! reflect({}).isReflecteeProbablyAClass());
    this.assert(! reflect(TestCase.prototype).isReflecteeProbablyAClass());
    this.assert(! reflect(avocado.stringBuffer).isReflecteeProbablyAClass());
  });

  add.method('testSize', function () {
    organization.temporarilySetCurrent(organizationUsingAnnotations, function() {
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
    organization.temporarilySetCurrent(organizationUsingAnnotations, function() {
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
    organization.temporarilySetCurrent(organizationUsingAnnotations, function() {
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
    this.assert(  reflect(TestCase     ).isReflecteeFunction());
    this.assert(! reflect({}           ).isReflecteeFunction());
    this.assert(! reflect('hmm'        ).isReflecteeFunction());
    this.assert(! reflect(null         ).isReflecteeFunction());

    this.assert(  reflect(function() {     }        ).isReflecteeSimpleMethod());
    this.assert(  reflect(function() {ok();}        ).isReflecteeSimpleMethod());
    this.assert(  reflect(this.verbose              ).isReflecteeSimpleMethod(), "methods with $super still count");
    this.assert(  reflect(TestCase.prototype.verbose).isReflecteeSimpleMethod(), "LK methods still count");
    this.assert(! reflect(TestCase                  ).isReflecteeSimpleMethod());
    this.assert(! reflect({}                        ).isReflecteeSimpleMethod());
    this.assert(! reflect('hmm'                     ).isReflecteeSimpleMethod());
    this.assert(! reflect(null                      ).isReflecteeSimpleMethod());

    var functionWithASlot = function() {};
    functionWithASlot.something = 41;
    this.assert(! reflect(functionWithASlot).isReflecteeSimpleMethod());
  });

  add.method('verbose', function ($super) {
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
    this.assertEqual("a TestCase", reflect(new TestCase()).name());
    this.assertEqual("TestCase.prototype", reflect(TestCase.prototype).name());
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
    this.assertEqual("[1, 'two', 3]", reflect([1, 'two', 3]).inspect());
    this.assertEqual("transporter", reflect(transporter).inspect());
    this.assertEqual("transporter.module", reflect(transporter.module).inspect());
    this.assertEqual("window", reflect(window).inspect());
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
    this.assertEqual("Selector.operators['!=']", reflect(Selector.operators['!=']).creatorSlotChainExpression());
    
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
    this.assert(mMir.annotation() !== m2Mir.annotation(), "the annotation should not be shared");
    s.remove();
  });

  add.method('createSlot', function (mir, name, contents, cat) {
    var slot = mir.slotAt(name);
    slot.setContents(reflect(contents));
    if (cat) { slot.setCategory(category.create(cat)); }
    return slot;
  });

  add.method('checkComment', function (x, comment) {
    x.setComment(comment);
    this.assertEqual(comment, x.comment(), "Comment didn't work: " + comment);
  });

  add.method('testComments', function () {
    organization.temporarilySetCurrent(organizationUsingAnnotations, function() {
      this.checkComment(reflect({})            , "an object comment");
      this.checkComment(reflect({}).slotAt('a'), "a slot comment");
    }.bind(this));
  });

  add.method('testCategories', function () {
    organization.temporarilySetCurrent(organizationUsingAnnotations, function() {
      var o = {};
      var mir = reflect(o);
      this.createSlot(mir, 'a', 42, ['letters', 'vowels']);
      this.createSlot(mir, 'b', 42, ['letters', 'consonants']);
      this.createSlot(mir, 'c', 42, ['letters', 'consonants']);
      this.createSlot(mir, 'd', 42, ['letters', 'consonants']);
      this.createSlot(mir, 'e', 42, ['letters', 'vowels']);
      this.createSlot(mir, 'y', 42, ['letters']);
      
      var root = category.root();
      this.assertEqual('letters', avocado.enumerator.create(mir, 'eachImmediateSubcategoryOf', root).toArray().join(', '));
      this.assertEqual('letters consonants, letters vowels', avocado.enumerator.create(mir, 'eachImmediateSubcategoryOf', root.subcategory('letters')).toArray().sort().join(', '));
      this.assertEqual('', avocado.enumerator.create(mir, 'eachImmediateSubcategoryOf', root.subcategory('letters').subcategory('vowels')).toArray().sort().join(', '));
      
      this.assertEqual('', avocado.enumerator.create(mir, 'eachSlotInCategory', root).toArray().sort().join(', '));
      this.assertEqual('y slot', avocado.enumerator.create(mir, 'eachSlotInCategory', root.subcategory('letters')).toArray().sort().join(', '));
      this.assertEqual('a slot, e slot', avocado.enumerator.create(mir, 'eachSlotInCategory', root.subcategory('letters').subcategory('vowels')).toArray().sort().join(', '));
      
      this.assertEqual('b slot, c slot, d slot', avocado.enumerator.create(mir, 'eachSlotNestedSomewhereUnderCategory', root.subcategory('letters').subcategory('consonants')).toArray().sort().join(', '));
      this.assertEqual('a slot, b slot, c slot, d slot, e slot, y slot', avocado.enumerator.create(mir, 'eachSlotNestedSomewhereUnderCategory', root).toArray().sort().join(', '));
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
    console.log("Here it is: " + functionText);
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
  
  add.method('testFindingUnusedSlotNames', function() {
    var i;
    var o = {};
    var mir = reflect(o);
    this.assertEqual(0, mir.size());
    for (i = 0; i < 20; ++i) { o[mir.findUnusedSlotName()] = i; }
    this.assertEqual(20, mir.size());
    for (i = 0; i < 30; ++i) { o[mir.findUnusedSlotName("prefix_")] = i + 1000; }
    this.assertEqual(50, mir.size());
  });
  
  add.method('testCreatingMirrorsByObjectName', function() {
    this.assertIdentity(null,         mirror.forObjectNamed(['blahblahnothing'])            );
    this.assertIdentity(mirror,       mirror.forObjectNamed(['mirror'         ]).reflectee());
    this.assertIdentity(mirror.tests, mirror.forObjectNamed(['mirror', 'tests']).reflectee());
  });

});


});
