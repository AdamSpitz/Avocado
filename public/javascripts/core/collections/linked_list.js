avocado.transporter.module.create('core/collections/linked_list', function(requires) {

}, function(thisModule) {


thisModule.addSlots(avocado, function(add) {

  add.creator('list', Object.create({}), {category: ['collections']});

  avocado.annotator.loadObjectAnnotation(avocado.list['__proto__'], {copyDownParents: [{parent: Enumerable, slotsToOmit: ['size', '__annotation__']}]}, '__proto__', avocado.list);


});


thisModule.addSlots(avocado.list, function(add) {

  add.data('_size', 0);

});


thisModule.addSlots(avocado.list['__proto__'], function(add) {

  add.creator('linkProto', Object.create({}), {category: ['links']});

  avocado.annotator.loadObjectAnnotation(avocado.list['__proto__'].linkProto['__proto__'], {}, '__proto__', avocado.list['__proto__'].linkProto);


  add.method('copyRemoveAll', function () {
  var c = Object.shallowCopy(this);
  c._rep = this._rep.copy();
  c.removeAll();
  return c;
}, {category: ['copying']});

  add.method('add', function (elem) {
  this.addLast(elem);
}, {category: ['adding']});

  add.method('removeAll', function () {
  this._size = 0;
  this._rep.removeAll();
}, {category: ['removing']});

  add.creator('tests', Object.create(avocado.testCase), {category: ['tests']});

  add.method('size', function () { return this._size; }, {category: ['accessing']});

  add.method('_each', function (f) {
  this._rep.eachLink(function(lnk) {
    f(lnk.value());
  });
}, {category: ['iterating']});

  add.method('addLast', function (elem) {
  this._size += 1;
  this._rep.addPrevLink(this.linkProto.copyWithValue(elem));
}, {category: ['adding']});

  add.method('addFirst', function (elem) {
  this._size += 1;
  this._rep.addNextLink(this.linkProto.copyWithValue(elem));
}, {category: ['adding']});

  add.method('hashCode', function () {
  return [
    avocado.hashTable.equalityComparator.hashCodeForKey(this.first()),
    avocado.hashTable.equalityComparator.hashCodeForKey(this.last()),
    avocado.hashTable.equalityComparator.hashCodeForKey(this.size())
  ].join();
}, {category: ['comparing']});

  add.method('addAll', function (c) {
  this.addAllLast(c);
}, {category: ['adding']});

  add.method('addAllLast', function (c) {
  c.each(function(elem) { this.addLast(elem); }.bind(this));
}, {category: ['adding']});

  add.method('addAllFirst', function (c) {
  c.reverseEach(function(elem) { this.addFirst(elem); }.bind(this));
}, {category: ['adding']});

  add.method('copyContaining', function (otherCollection) {
  var c = this.copyRemoveAll();
  c.addAllLast(otherCollection);
  return c;
}, {category: ['copying']});

  add.method('equals', function (other) {
  return exitValueOf(function(exit) {
    if (this === other) { return true; }
    if (this.size() !== other.size()) { return false; }
    this.simultaneousEach(other, function(e1, e2) {
      if (! avocado.hashTable.equalityComparator.keysAreEqual(e1, e2)) {
        return false;
      }
    });
    return true;
  }.bind(this));
}, {category: ['comparing']});

  add.method('simultaneousEach', function (other, f) {
  this._rep.simultaneousEachLink(other, function(lnk, otherValue) {
    f(lnk.value(), otherValue);
  });
}, {category: ['iterating']});

  add.method('first', function () {
  return this._rep.firstLink().value();
}, {category: ['accessing']});

  add.method('last', function () {
  return this._rep.lastLink().value();
}, {category: ['accessing']});

  add.method('isEmpty', function () { return this._rep.isEmpty(); }, {category: ['accessing']});

  add.method('reverseEach', function (f) {
  this._rep.reverseEachLink(function(lnk) {
    f(lnk.value());
  });
}, {category: ['iterating']});

  add.method('reverseSimultaneousEach', function (other, f) {
  this._rep.reverseSimultaneousEachLink(other, function(lnk, otherValue) {
    f(lnk.value(), otherValue);
  });
}, {category: ['iterating']});

  add.method('removeFirst', function () {
  this._size -= 1;
  return this._rep.removeFirstLink().value();
}, {category: ['removing']});

  add.method('removeLast', function () {
  this._size -= 1;
  return this._rep.removeLastLink().value();
}, {category: ['removing']});

  add.method('remove', function (elem, absentFn) {
  return this.findFirstLinkFor(elem, function(lnk) {
    lnk.remove();
    this._size -= 1;
  }.bind(this), absentFn);
}, {category: ['removing']});

  add.method('findFirstLinkFor', function (elem, presentFn, absentFn) {
  return this.findFirstLinkSatisfying(
    function(lnk) { return avocado.hashTable.equalityComparator.keysAreEqual(elem, lnk.value()); },
    presentFn,
    absentFn
  );
}, {category: ['searching']});

  add.method('findFirstLinkSatisfying', function (conditionFn, presentFn, absentFn) {
  return exitValueOf(function(exit) {
    this._rep.eachLink(function(lnk) {
      if (conditionFn(lnk)) { exit(presentFn(lnk)); }
    });
    return absentFn();
  }.bind(this));
}, {category: ['searching']});

  add.method('toString', function () {
  if (this.size() > 10) { return ""; }
  return this.toArray().join(", ");
}, {category: ['printing']});

});


thisModule.addSlots(avocado.list, function(add) {

  add.data('_rep', avocado.list['__proto__'].linkProto);

});


thisModule.addSlots(avocado.list['__proto__'].linkProto, function(add) {

  add.data('_prev', null);

  add.data('_next', null);

  add.data('_value', null);

});


thisModule.addSlots(avocado.list['__proto__'].linkProto['__proto__'], function(add) {

  add.method('copy', function () {
  return Object.shallowCopy(this);
}, {category: ['copying']});

  add.method('removeAll', function () {
  this._next = this;
  this._prev = this;
}, {category: ['removing']});

  add.method('isEmpty', function () {
  return this._next === this;
}, {category: ['accessing']});

  add.method('firstLink', function () {
  if (this.isEmpty()) { throw new Error("first is absent"); }
  return this._next;
}, {category: ['accessing']});

  add.method('lastLink', function () {
  if (this.isEmpty()) { throw new Error("first is absent"); }
  return this._prev;
}, {category: ['accessing']});

  add.method('removeFirstLink', function () {
  return this._next.remove();
}, {category: ['removing']});

  add.method('removeLastLink', function () {
  return this._prev.remove();
}, {category: ['removing']});

  add.method('remove', function () {
  if (this.isEmpty()) { throw new Error("cannot remove from an empty list"); }
  this._prev._next = this._next;
  this._next._prev = this._prev;
  return this;
}, {category: ['removing']});

  add.method('eachLink', function (f) {
  var head = this._next._prev;
  var lnk = this._next;
  while (head !== lnk) {
    var saveNextToPermitRemoving = lnk._next;
    f(lnk);
    lnk = saveNextToPermitRemoving;
  }
}, {category: ['iterating']});

  add.method('copyWithValue', function (v) {
  var c = this.copy();
  c._value = v;
  return c;
}, {category: ['copying']});

  add.method('addNextLink', function (lnk) {
  lnk._next = this._next;
  this._next._prev = lnk;
  lnk._prev = this;
  this._next = lnk;
}, {category: ['adding']});

  add.method('addPrevLink', function (lnk) {
  lnk._prev = this._prev;
  this._prev._next = lnk;
  lnk._next = this;
  this._prev = lnk;
}, {category: ['adding']});

  add.method('simultaneousEachLink', function (other, f) {
  exitValueOf(function(exit) {
    var head = this._next._prev;
    var lnk = this._next;
    other.each(function(otherValue) {
      if (head === lnk) { exit(); }
      var saveNextToPermitRemoving = lnk._next;
      f(lnk, otherValue);
      lnk = saveNextToPermitRemoving;
    });
  }.bind(this));
}, {category: ['iterating']});

  add.method('value', function () { return this._value; }, {category: ['accessing']});

  add.method('reverseEachLink', function (f) {
  var head = this._next._prev;
  var lnk = this._prev;
  while (head !== lnk) {
    var savePrevToPermitRemoving = lnk._prev;
    f(lnk);
    lnk = savePrevToPermitRemoving;
  }
}, {category: ['iterating']});

  add.method('reverseSimultaneousEachLink', function (other, f) {
  exitValueOf(function(exit) {
    var head = this._next._prev;
    var lnk = this._prev;
    other.reverseEach(function(otherValue) {
      if (head === lnk) { exit(); }
      var savePrevToPermitRemoving = lnk._prev;
      f(lnk, otherValue);
      lnk = savePrevToPermitRemoving;
    });
  }.bind(this));
}, {category: ['iterating']});

});


thisModule.addSlots(avocado.list['__proto__'].tests, function(add) {

  add.method('testBasicStuff', function () {
  var c = avocado.list.copyRemoveAll();
  this.assertEqual(0, c.size());
  this.assert(c.isEmpty());
  c.each(function(elem) {this.fail();}.bind(this));
  this.assertEqual([], c.toArray());
  
  c.add('one');
  this.assertEqual(1, c.size());
  this.assertEqual(['one'], c.toArray());

  c.addLast(2);
  c.addFirst('zero');
  this.assertEqual(3, c.size());
  this.assertEqual(['zero', 'one', 2], c.toArray());

  var c2 = avocado.list.copyContaining(['zero', 'one', 2]);
  this.assertEqual(c, c2);
  
  var s = avocado.set.copyRemoveAll();
  s.add(c);
  s.add(c2);
  this.assertEqual(1, s.size());
  this.assert(s.include(c));

  c.addAllFirst(avocado.list.copyContaining([-2, -1]));
  this.assertEqual(-2, c.first());
  this.assertEqual(2, c.last());
  this.assertEqual(5, c.size());

  this.assertEqual(-2, c.removeFirst());
  this.assertEqual(2, c.removeLast());
  this.assertEqual(3, c.size());
  c.remove('zero', function() {this.fail();}.bind(this));
  this.assertEqual(2, c.size());
  this.assertEqual([-1, 'one'], c.toArray());

  var wasAbsent = false;
  c.remove('not in there', function() {wasAbsent = true;});
  this.assert(wasAbsent);
});

});


});
