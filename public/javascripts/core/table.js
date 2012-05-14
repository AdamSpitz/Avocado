avocado.transporter.module.create('core/table', function(requires) {

requires('core/directions');

}, function(thisModule) {


thisModule.addSlots(avocado, function(add) {

  add.creator('table', {}, {category: ['collections', 'tables']});

});


thisModule.addSlots(avocado.table, function(add) {

  add.creator('contents', {});

});


thisModule.addSlots(avocado.table.contents, function(add) {

  add.method('createWithRows', function (a) {
    return this.create(a, avocado.directions.vertical);
  }, {category: ['creating']});

  add.method('createWithColumns', function (a) {
    return this.create(a, avocado.directions.horizontal);
  }, {category: ['creating']});

  add.method('createWithRow', function (elements) {
    return this.createWithRows([elements]);
  }, {category: ['creating']});

  add.method('createWithColumn', function (elements) {
    return this.createWithColumns([elements]);
  }, {category: ['creating']});

  add.method('create', function (a, dir1) {
    return Object.newChildOf(this, a, dir1);
  }, {category: ['creating']});

  add.data('_direction1', avocado.directions.vertical);

  add.data('_direction2', avocado.directions.horizontal);

  add.data('_data', [], {initializeTo: '[]'});

  add.method('initialize', function (a, dir1) {
    this._data = a;
    if (! avocado.shouldBreakCreatorSlotsInOrderToImprovePerformance) {
      reflect(this).slotAt('_data').beCreator();
      this._data.makeAllCreatorSlots();
      this._data.forEach(function(line) { line.makeAllCreatorSlots(); });
    }
    this._direction1 = dir1;
    this._direction2 = dir1.sideways;
  }, {category: ['creating']});

  add.method('copyRemoveAll', function () {
    return avocado.table.contents.create([], this._direction1);
  }, {category: ['creating']});

  add.method('copyWithLines', function (primaryLines) {
    return avocado.table.contents.create(primaryLines, this._direction1);
  }, {category: ['creating']});

  add.method('copyWithSoleLine', function (solePrimaryLine) {
    return avocado.table.contents.create([solePrimaryLine], this._direction1);
  }, {category: ['creating']});

  add.method('copy', function () {
    return this.copyWithLines(this._data.map(function(line) { return line.map(function(elem) { return elem; }); }));
  }, {category: ['copying']});

  add.method('duplicate', function (copier) {
    return this.copy(copier);
  }, {category: ['copying']});

  add.method('copyAndAddElement', function (extraElement) {
    var c = this.copy();
    c.addElement(extraElement);
    return c;
  }, {category: ['creating']});

  add.method('copyAndRemoveElement', function (e) {
    var newData = this._data.map(function(primaryLine) { return primaryLine.reject(function(ee) { return e === ee; }); });
    return this.copyWithLines(newData);
  }, {category: ['creating']});

  add.method('equals', function (other) {
    if (this._direction1 !== other._direction1) { return false; }
    if (this._data.length !== other._data.length) { return false; }
    for (var i = 0, n = this._data.length; i < n; ++i) {
      if (! this.areArraysEqual(this._data[i], other._data[i])) {
        return false;
      }
    }
    return true;
  }, {category: ['comparing']});

  add.method('areArraysEqual', function (a1, a2) {
    if (a1.length !== a2.length) { return false; }
    for (var i = 0, n = a1.length; i < n; ++i) {
      if (a1[i] !== a2[i]) { return false; }
    }
    return true;
  }, {category: ['comparing']});

  add.method('hashCode', function (other) {
    var h = [this._direction1];
    // aaa - maybe just loop over the first few, not all of them
    this.eachElement(function(x) { h.push(avocado.hashTable.identityComparator.hashCodeForKey(x)); })
    return h.join("");
  }, {category: ['comparing']});

  add.method('elements', function () {
    return avocado.enumerator.create(this, 'eachElement');
  }, {category: ['iterating']});

  add.method('eachElement', function (f) {
    this._data.each(function(rowOrCol) {
      rowOrCol.each(f);
    });
  }, {category: ['iterating']});

  add.method('eachRow', function (f) {
    this.eachLineInDirection(avocado.directions.horizontal, f);
  }, {category: ['iterating']});

  add.method('eachColumn', function (f) {
    this.eachLineInDirection(avocado.directions.vertical, f);
  }, {category: ['iterating']});

  add.method('eachLineInDirection', function (dir, f) {
    if (dir === this._direction2) {
      this.eachPrimaryLine(f);
    } else if (dir === this._direction1) {
      this.eachSecondaryLine(f);
    } else {
      throw new Error("eachLineInDirection(" + dir + ")???");
    }
  }, {category: ['iterating']});

  add.method('eachPrimaryLine', function (f) {
    this._data.each(f);
  }, {category: ['iterating']});

  add.method('primaryLines', function () {
    return this._data;
  }, {category: ['accessing']});

  add.method('primaryLine', function (i) {
    return this._data[i];
  }, {category: ['iterating']});

  add.method('setData', function (d) {
    this._data = d;
    return this;
  }, {category: ['accessing']});

  add.method('setPrimaryLines', function (d) {
    return this.setData(d);
  }, {category: ['accessing']});

  add.method('setSoleLine', function (line) {
    return this.setPrimaryLines([line]);
  }, {category: ['accessing']});

  add.method('eachSecondaryLine', function (f) {
    for (var i = 0, n = this.lengthOfLongestPrimaryLine(); i < n; ++i) {
      f(this.secondaryLine(i));
    }
  }, {category: ['iterating']});

  add.method('secondaryLine', function (i) {
    return avocado.enumerator.create(this, 'eachElementInSecondaryLine', i);
  }, {category: ['iterating']});

  add.method('secondaryLines', function () {
    return avocado.enumerator.create(this, 'eachSecondaryLine');
  }, {category: ['accessing']});

  add.method('eachElementInSecondaryLine', function (i, f) {
    this.primaryLines().each(function(line) {
      f(line.length > i ? line[i] : null);
    });
  }, {category: ['iterating']});

  add.method('lengthOfLongestPrimaryLine', function () {
    var n = 0;
    this.primaryLines().each(function(line) {
      n = Math.max(n, line.length);
    });
    return n;
  }, {category: ['accessing']});

  add.method('insertPrimaryLine', function (line, i) {
    if (! avocado.shouldBreakCreatorSlotsInOrderToImprovePerformance) {
      line.makeAllCreatorSlots();
      this._data.spliceAndAdjustCreatorSlots(i, 0, line);
    } else {
      this._data.splice(i, 0, line);
    }
  }, {category: ['inserting']});

  add.method('selectThenMap', function (selectFn, mapFn) {
    var c = this.copyRemoveAll();
    this._data.each(function(rowOrCol) {
      var rowOrColArray = rowOrCol.toArray();
      var newRowOrCol = [];
      // using a for loop because sometimes I have sparse arrays and forEach skips over the "missing" elements
      for (var i = 0; i < rowOrColArray.length; ++i) {
        var x = rowOrColArray[i];
        if (selectFn(x)) {
          newRowOrCol.push(mapFn(x));
        }
      }
      if (! avocado.shouldBreakCreatorSlotsInOrderToImprovePerformance) {
        newRowOrCol.makeAllCreatorSlots();
        c._data.pushAndAdjustCreatorSlots(newRowOrCol);
      } else {
        c._data.push(newRowOrCol);
      }
    });
    return c;
  }, {category: ['transforming']});

  add.method('map', function (mapFn) {
    return this.selectThenMap(function() { return true; }, mapFn);
  }, {category: ['transforming']});

  add.method('replaceElement', function (currentElement, newElement) {
    this._data.each(function(rowOrCol) {
      for (var i = 0, n = rowOrCol.length; i < n; ++i) {
        var e = rowOrCol[i];
        if (e === currentElement) { rowOrCol[i] = newElement; }
      }
    });
  }, {category: ['transforming']});

  add.method('addElement', function (e) {
    if (! this.primaryLines().last()) { this.primaryLines().push([]); }
    this.primaryLines().last().push(e);
    return this;
  }, {category: ['transforming']});

  add.method('removeElement', function (e) {
    this._data = this._data.map(function(primaryLine) { return primaryLine.reject(function(ee) { return e === ee; }); });
    return this;
  }, {category: ['transforming']});

});


});
