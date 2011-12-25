avocado.transporter.module.create('general_ui/table_layout', function(requires) {

}, function(thisModule) {


thisModule.addSlots(avocado, function(add) {

  add.creator('directions', {}, {category: ['ui', 'rows and columns']});

  add.creator('tableContents', {}, {category: ['ui', 'rows and columns']});

  add.creator('tableLayout', {}, {category: ['ui', 'rows and columns']});

});


thisModule.addSlots(avocado.directions, function(add) {

  add.creator('abstractDirection', {});

  add.creator('vertical', Object.create(avocado.directions.abstractDirection));

  add.creator('horizontal', Object.create(avocado.directions.abstractDirection));

});


thisModule.addSlots(avocado.directions.vertical, function(add) {

  add.data('sideways', avocado.directions.horizontal);

  add.method('toString', function () { return 'vertical'; });

  add.method('externallySpecifiedFreeSpaceSideways', function (m) {return m.externallySpecifiedFreeWidth;});

  add.method('specifyFreeSpaceSideways', function (m, s) {m.externallySpecifiedFreeWidth = s;});

  add.method('dimensionOfRect', function (r) {return r.height;});

  add.method('coord', function (p) {return p.y;});

  add.method('setCoord', function (p, y) {p.y = y;});

  add.method('padding1', function (padding) {return padding.top;});

  add.method('padding2', function (padding) {return padding.bottom;});

  add.method('point', function (f, s) {return pt(s, f);});

  add.method('layoutModeOf', function (m) {return m.verticalLayoutMode;});

  add.method('setLayoutModeOf', function (m, mode) {m.verticalLayoutMode = mode;});

});


thisModule.addSlots(avocado.directions.horizontal, function(add) {

  add.data('sideways', avocado.directions.vertical);

  add.method('toString', function () { return 'horizontal'; });

  add.method('externallySpecifiedFreeSpaceSideways', function (m) {return m.externallySpecifiedFreeHeight;});

  add.method('specifyFreeSpaceSideways', function (m, s) {m.externallySpecifiedFreeHeight = s;});

  add.method('dimensionOfRect', function (r) {return r.width;});

  add.method('coord', function (p) {return p.x;});

  add.method('setCoord', function (p, x) {p.x = x;});

  add.method('padding1', function (padding) {return padding.left;});

  add.method('padding2', function (padding) {return padding.right;});

  add.method('point', function (f, s) {return pt(f, s);});

  add.method('layoutModeOf', function (m) {return m.horizontalLayoutMode;});

  add.method('setLayoutModeOf', function (m, mode) {m.horizontalLayoutMode = mode;});

});


thisModule.addSlots(avocado.tableContents, function(add) {

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
    return avocado.tableContents.create([], this._direction1);
  }, {category: ['creating']});

  add.method('copyWithLines', function (primaryLines) {
    return avocado.tableContents.create(primaryLines, this._direction1);
  }, {category: ['creating']});

  add.method('copyWithSoleLine', function (solePrimaryLine) {
    return avocado.tableContents.create([solePrimaryLine], this._direction1);
  }, {category: ['creating']});

  add.method('copy', function () {
    return this.copyWithLines(this._data.map(function(line) { return line.map(function(elem) { return elem; }); }));
  }, {category: ['copying']});

  add.method('duplicate', function (copier) {
    return this.copy(copier);
  }, {category: ['copying']});

  add.method('copyAndAddElement', function (extraElement) {
    var c = this.copy();
    if (! c.primaryLines().last()) { c.primaryLines().push([]); }
    c.primaryLines().last().push(extraElement);
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
      var newRowOrCol = [];
      rowOrCol.each(function(x) {
        if (selectFn(x)) {
          newRowOrCol.push(mapFn(x));
        }
      });
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

});


thisModule.addSlots(avocado.tableLayout, function(add) {
  
  add.method('initialize', function (tableMorph) {
    this._tableMorph = tableMorph;
  }, {category: ['creating']});
  
  add.method('getExtent', function () {
    return this._tableMorph.getExtent();
  }, {category: ['accessing the table morph']});
  
  add.method('getScale', function () {
    return this._tableMorph.getScale();
  }, {category: ['accessing the table morph']});
  
  add.method('setScale', function (s) {
    this._tableMorph.setScale(s);
  }, {category: ['accessing the table morph']});
  
  add.method('getPadding', function () {
    return this._tableMorph.padding;
  }, {category: ['accessing the table morph']});
  
  add.method('tableContent', function () {
    return this._tableMorph._tableContent;
  }, {category: ['accessing the table morph']});
  
  add.method('shouldPrintDebugInfo', function () {
    return this._tableMorph._debugMyLayout;
  }, {category: ['accessing the table morph']});
  
  add.method('layoutModes', function () {
    // aaa make the TableMorph itself store them as a Point?
    return pt(this._tableMorph.horizontalLayoutMode, this._tableMorph.verticalLayoutMode);
  }, {category: ['accessing the table morph']});

  add.method('setPadding', function (p) {
    if (typeof p === 'number') {
      this._tableMorph.padding = {left: p, right: p, top: p, bottom: p, between: {x: p, y: p}};
    } else {
      this._tableMorph.padding = p;
    }
    return this;
  }, {category: ['padding']});

  add.method('eachDirection', function (f) {
    f(avocado.directions.horizontal);
    f(avocado.directions.vertical);
  }, {category: ['directions']});

  add.method('adjustForRigidityAndScale', function (e) {
    var e2 = this.adjustForRigidity(e);
    return e2.scaleBy(this.currentOrDesiredScaleGivenExtent(e2));
  }, {category: ['layout']});

  add.method('adjustForRigidity', function (e) {
    var currentExtent = this.getExtent();
    var layoutModes = this.layoutModes();
    return pt(layoutModes.x === avocado.LayoutModes.Rigid ? Math.max(e.x, currentExtent.x) : e.x,
              layoutModes.y === avocado.LayoutModes.Rigid ? Math.max(e.y, currentExtent.y) : e.y);
  }, {category: ['layout']});

  add.method('currentOrDesiredScaleGivenExtent', function (e) {
    var desiredSpace = this._desiredSpaceToScaleTo;
    if (desiredSpace) {
      var hs = null;
      var vs = null;
      if (desiredSpace.x && e.x) { hs = desiredSpace.x / e.x; }
      if (desiredSpace.y && e.y) { vs = desiredSpace.y / e.y; }
      if (hs !== null && vs !== null) { return Math.min(hs, vs); }
      if (hs === null && vs !== null) { return vs; }
      if (hs !== null && vs === null) { return hs; }
    }
    return this.getScale();
  }, {category: ['layout']});

  add.method('internalMinimumExtent', function () {
    if (! this._tableMorph._cachedMinimumExtent) {
      this._tableMorph._cachedMinimumExtent = this.calculateOverallMinimumExtent(this.calculateMinimumExtentsForRowsAndColumns());
    }
    return this._tableMorph._cachedMinimumExtent;
  }, {category: ['layout', 'minimum extent']});

  add.method('calculateMinimumExtentsForRowsAndColumns', function () {
    var layoutInfo = pt([], []);
    this.eachDirection(function(dir) {
      var rs = dir.coord(layoutInfo);
      rs.spaceFillingCount = 0;
      this.tableContent().eachLineInDirection(dir, function(line) {
        var r = this.calculateMinimumExtentFor(line, dir);
        rs.push(r);
        if (r.canFillSpace) { rs.spaceFillingCount += 1; }
      }.bind(this));
    }.bind(this));
    return layoutInfo;
  }, {category: ['layout']});

  add.method('calculateMinimumExtentFor', function (morphs, direction) {
    var r = { biggestSideways: 0, canFillSpace: false };
    
    if (this.shouldPrintDebugInfo()) { console.log("calculateMinimumExtentFor " + morphs.size() + " morphs in direction " + direction); }
    morphs.each(function(m) {
      if (m) {
        var mMinExt = m.minimumExtent();
        var mMinSideways = direction.sideways.coord(mMinExt);
        if (this.shouldPrintDebugInfo()) { console.log("minimumExtent() for " + m.inspect() + " in direction " + direction.sideways + " is " + mMinSideways); }
        r.biggestSideways = Math.max(r.biggestSideways, mMinSideways);

        // How should we do this? Should the row be space-filling if *any* morph in it
        // is space-filling, or if *all* of them are, or what? Try any for now. -- Adam
        if (direction.sideways.layoutModeOf(m) === avocado.LayoutModes.SpaceFill) { r.canFillSpace = true; }
      }
    }.bind(this));
    
    return r;
  }, {category: ['layout', 'minimum extent']});

  add.method('calculateOverallMinimumExtent', function (layoutInfoForRowsAndColumns) {
    var overallMinExt = pt(0, 0);
    
    this.eachDirection(function(dir) {
      var infoForThisDirection = dir.coord(layoutInfoForRowsAndColumns);
      
      var totalLineSizes = infoForThisDirection.inject(0, function(sum, r) {
        return sum + r.biggestSideways;
      });
      
      var padding = this.getPadding();
      var totalPadding = dir.sideways.padding1(padding) +
                         dir.sideways.padding2(padding) +
                         (dir.sideways.coord(padding.between) * (infoForThisDirection.length - 1));

      if (this.shouldPrintDebugInfo()) { console.log("In calculateOverallMinimumExtent, direction " + dir + ", totalLineSizes is " + totalLineSizes + " and totalPadding is " + totalPadding + " for a total of " + (totalLineSizes + totalPadding)); }
      dir.sideways.setCoord(overallMinExt, totalLineSizes + totalPadding);
    }.bind(this));
    
    // keep it around, we'll need it when rejiggering the layout
    overallMinExt.layoutInfoForRowsAndColumns = layoutInfoForRowsAndColumns;
    if (this.shouldPrintDebugInfo()) { console.log("overallMinExt: " + overallMinExt); }
    
    return overallMinExt;
  }, {category: ['layout', 'minimum extent']});

  add.method('calculateSpaceToUseOutOf', function (availableSpace, thisExtent) {
    var availableSpaceToUse = pt(null, null);
    
    var layoutModes = this.layoutModes()
    if (layoutModes.x === avocado.LayoutModes.ShrinkWrap) { availableSpaceToUse.x =          this.internalMinimumExtent().x;                }
    if (layoutModes.x === avocado.LayoutModes.Rigid     ) { availableSpaceToUse.x = Math.max(this.internalMinimumExtent().x, thisExtent.x); }
    if (layoutModes.y === avocado.LayoutModes.ShrinkWrap) { availableSpaceToUse.y =          this.internalMinimumExtent().y;                }
    if (layoutModes.y === avocado.LayoutModes.Rigid     ) { availableSpaceToUse.y = Math.max(this.internalMinimumExtent().y, thisExtent.y); }
    
    var scale = this.currentOrDesiredScaleGivenExtent(availableSpaceToUse);
    if (scale !== this.getScale()) { this.setScale(scale); }
    
    if (availableSpaceToUse.x === null) { availableSpaceToUse.x = availableSpace.x / scale; }
    if (availableSpaceToUse.y === null) { availableSpaceToUse.y = availableSpace.y / scale; }
    
    if (this.shouldPrintDebugInfo()) { console.log(this._tableMorph.inspect() + ": availableSpace: " + availableSpace + ", availableSpaceToUse: " + availableSpaceToUse + ", this.getScale(): " + this.getScale() + ", this.internalMinimumExtent(): " + this.internalMinimumExtent() + ", thisExtent: " + thisExtent); }
    return availableSpaceToUse;
  }, {category: ['layout']});

  add.method('rejigger', function (availableSpace) {
    if (this.shouldPrintDebugInfo()) { console.log("About to rejigger the layout, availableSpace is " + availableSpace); }
    var thisExtent = this.getExtent();
    var availableSpaceToUse = this.calculateSpaceToUseOutOf(availableSpace, thisExtent);
    if (this.shouldPrintDebugInfo()) { console.log("availableSpaceToUse is " + availableSpaceToUse); }
    if (this.isAlreadyLaidOutInSpace(availableSpaceToUse)) {
      availableSpaceToUse = thisExtent;
    } else {
      this._tableMorph._spaceUsedLastTime = availableSpaceToUse;

      var extraSpaceUsage = this.decideWhatToDoWithExtraSpace(availableSpaceToUse);
      var actualCoordsAndSizes = this.calculateActualCoordinatesAndSizes(extraSpaceUsage);
      this.setMorphPositionsAndSizes(actualCoordsAndSizes);
      this._tableMorph.setExtentIfChanged(availableSpaceToUse);

      this._tableMorph._layoutIsStillValid = true;
    }
    return availableSpaceToUse.scaleBy(this.getScale());
  }, {category: ['layout']});

  add.method('isAlreadyLaidOutInSpace', function (s) {
    if (this._tableMorph._layoutIsStillValid && this._tableMorph._spaceUsedLastTime && this._tableMorph._spaceUsedLastTime.eqPt(s)) {
      if (this.shouldPrintDebugInfo()) {
        console.log("No need to lay out " + this._tableMorph.inspect() + ", since it's already laid out in the appropriate amount of space: " + s);
      }
      return true;
    } else {
      if (this.shouldPrintDebugInfo()) {
        console.log("Gonna have to lay out " + this._tableMorph.inspect() + ", since _spaceUsedLastTime is " + this._tableMorph._spaceUsedLastTime + " but s is " + s);
      }
      return false;
    }
  }, {category: ['layout']});

  add.method('decideWhatToDoWithExtraSpace', function (availableSpaceToUse) {
    var r = { padding: this.getPadding(), extraSpacePerSpaceFillingChild: pt(0,0) };
    var extraSpace = availableSpaceToUse.subPt(this._tableMorph._cachedMinimumExtent);
    this.eachDirection(function(dir) {
      var info = dir.coord(this._tableMorph._cachedMinimumExtent.layoutInfoForRowsAndColumns);
      var extra = dir.sideways.coord(extraSpace);
      if (info.spaceFillingCount === 0) {
        // Nobody wants it; just put in extra padding.
        var numberOfBetweenPads = info.size() - 1;
        if (numberOfBetweenPads > 0) {
          if (r.padding === this.getPadding()) { r.padding = Object.clone(r.padding); r.padding.between = Object.clone(r.padding.between); }
          dir.sideways.setCoord(r.padding.between, dir.sideways.coord(r.padding.between) + (extra / numberOfBetweenPads));
        }
      } else {
        // Divvy it up among those who want it.
        dir.sideways.setCoord(r.extraSpacePerSpaceFillingChild, extra / info.spaceFillingCount);
      }
    }.bind(this));
    return r;
  }, {category: ['layout']});

  add.method('calculateActualCoordinatesAndSizes', function (extraSpaceUsage) {
    var actualCoordsAndSizes = pt([], []);
    this.eachDirection(function(dir) {
      var info = dir.coord(this._tableMorph._cachedMinimumExtent.layoutInfoForRowsAndColumns);
      var paddingBeforeNextLine = dir.sideways.padding1(extraSpaceUsage.padding);
      var actuals = dir.coord(actualCoordsAndSizes);
      var f = 0;
      info.each(function(x) {
        f += paddingBeforeNextLine;
        var availableSidewaysSpaceToPassOnToThisLine = x.biggestSideways;
        if (x.canFillSpace) {
          availableSidewaysSpaceToPassOnToThisLine += dir.sideways.coord(extraSpaceUsage.extraSpacePerSpaceFillingChild);
        }
        actuals.push({ coordinate: f, space: availableSidewaysSpaceToPassOnToThisLine });
        f += availableSidewaysSpaceToPassOnToThisLine;
        paddingBeforeNextLine = dir.sideways.coord(extraSpaceUsage.padding.between);
      }.bind(this));
    }.bind(this));
    return actualCoordsAndSizes;
  }, {category: ['layout']});

  add.method('setMorphPositionsAndSizes', function (actualCoordsAndSizes) {
    var direction = this.tableContent()._direction2;
    this.tableContent().primaryLines().each(function(line, i) {
      line.each(function(m, j) {
        var actualsForThisMorph = direction.point(direction.sideways.coord(actualCoordsAndSizes)[j], direction.coord(actualCoordsAndSizes)[i]);
        var availableSpaceToPassOnToThisChild = pt(actualsForThisMorph.x.space, actualsForThisMorph.y.space);

        var mScaledExtent = m.rejiggerTheLayout(availableSpaceToPassOnToThisChild);
        if (this.shouldPrintDebugInfo()) { console.log("mScaledExtent is " + mScaledExtent); }
        var unusedSidewaysSpace = direction.sideways.coord(availableSpaceToPassOnToThisChild) - direction.sideways.coord(mScaledExtent);
        
        // Uglified slightly to avoid creating the Point object; it's actually getting significant. -- Adam
        var f = direction         .coord(actualsForThisMorph).coordinate;
        var s = direction.sideways.coord(actualsForThisMorph).coordinate + (unusedSidewaysSpace / 2);
        var x, y;
        if (direction === avocado.directions.horizontal) {
          x = f; y = s;
        } else {
          x = s; y = f;
        }
        m.setPositionXY(x, y);
        if (this.shouldPrintDebugInfo()) { console.log("Added " + m.inspect() + " at " + x + ", " + y); }
      }.bind(this));
    }.bind(this));
  }, {category: ['layout']});
  
});


});
