transporter.module.create('lk_ext/rows_and_columns', function(requires) {

requires('lk_ext/layout');

}, function(thisModule) {


thisModule.addSlots(avocado, function(add) {

  add.method('TableMorph', function TableMorph() { Class.initializer.apply(this, arguments); }, {category: ['ui', 'rows and columns']});

  add.method('RowMorph', function RowMorph() { Class.initializer.apply(this, arguments); }, {category: ['ui', 'rows and columns']});

  add.method('ColumnMorph', function ColumnMorph() { Class.initializer.apply(this, arguments); }, {category: ['ui', 'rows and columns']});

  add.creator('directions', {}, {category: ['ui', 'rows and columns']});

  add.creator('tableContents', {}, {category: ['ui', 'rows and columns']});

});


thisModule.addSlots(avocado.directions, function(add) {

  add.creator('abstractDirection', {});

  add.creator('vertical', Object.create(avocado.directions.abstractDirection));

  add.creator('horizontal', Object.create(avocado.directions.abstractDirection));

});


thisModule.addSlots(avocado.TableMorph, function(add) {

  add.data('superclass', Morph);

  add.data('type', 'avocado.TableMorph');

  add.creator('boxStyle', {});

  add.creator('prototype', Object.create(Morph.prototype));

});


thisModule.addSlots(avocado.TableMorph.boxStyle, function(add) {

  add.data('padding', {top: 2, bottom: 2, left: 4, right: 4, between: {x: 3, y: 3}}, {initializeTo: '{top: 2, bottom: 2, left: 4, right: 4, between: {x: 3, y: 3}}'});

  add.data('borderRadius', 10);

  add.data('openForDragAndDrop', false);

});


thisModule.addSlots(avocado.RowMorph, function(add) {

  add.data('superclass', avocado.TableMorph);

  add.data('type', 'avocado.RowMorph');

  add.method('createSpaceFilling', function (content, padding) {
    var m = new this().beInvisible();
    var direction = avocado.directions.horizontal;
    if (padding !== undefined) { m.setPadding(padding); }
    direction.setLayoutModeOf(m, avocado.LayoutModes.SpaceFill);
    
    if (typeof(content) === 'function') {
      m.potentialContent = function() { return avocado.tableContents.create([content()], direction.sideways); };
      m.refreshContent();
    } else {
      // default to left-justifying the contents
      if (content.all(function(c) {return direction.layoutModeOf(c) !== avocado.LayoutModes.SpaceFill;})) {
        content = content.concat([Morph.createSpacer()]);
      }
      m.replaceContentWith(avocado.tableContents.create([content], direction.sideways));
    }
    
    return m;
  });

  add.creator('prototype', Object.create(avocado.TableMorph.prototype));

});


thisModule.addSlots(avocado.ColumnMorph, function(add) {

  add.data('superclass', avocado.TableMorph);

  add.data('type', 'avocado.ColumnMorph');

  add.creator('prototype', Object.create(avocado.TableMorph.prototype));

});


thisModule.addSlots(avocado.TableMorph.prototype, function(add) {

  add.data('constructor', avocado.TableMorph);

  add.data('_tableContent', avocado.tableContents);

  add.method('initialize', function ($super) {
    this.horizontalLayoutMode = avocado.LayoutModes.ShrinkWrap;
    this.verticalLayoutMode = avocado.LayoutModes.ShrinkWrap;
    $super(new lively.scene.Rectangle(pt(0, 0).extent(pt(10, 10))));
  }, {category: ['creating']});

  add.data('padding', {left: 10, right: 10, top: 10, bottom: 10, between: {x: 10, y: 10}}, {category: ['layout'], initializeTo: '{left: 10, right: 10, top: 10, bottom: 10, between: {x: 10, y: 10}}'});

  add.method('setPadding', function (p) {
    if (typeof p === 'number') {
      this.padding = {left: p, right: p, top: p, bottom: p, between: {x: p, y: p}};
    } else {
      this.padding = p;
    }
    return this;
  }, {category: ['layout']});

  add.method('applyStyle', function ($super, specs) {
		for (var i = 0; i < arguments.length; ++i) {
			var spec = arguments[i];
			if (!spec) { return; }
  	  if (typeof(spec.padding) !== 'undefined') { this.setPadding(spec.padding); }
		}
	  return $super.apply(this, arguments);
  }, {category: ['styles']});

  add.method('eachDirection', function (f) {
    f(avocado.directions.horizontal);
    f(avocado.directions.vertical);
  }, {category: ['layout']});

  add.method('minimumExtent', function () {
    if (! this._cachedMinimumExtent) {
      this._cachedMinimumExtent = this.calculateOverallMinimumExtent(this.calculateMinimumExtentsForRowsAndColumns());
    }
    return this.adjustForRigidityAndScale(this._cachedMinimumExtent);
  }, {category: ['layout']});

  add.method('adjustForRigidityAndScale', function (e) {
    var e2 = this.adjustForRigidity(e);
    return e2.scaleBy(this.currentOrDesiredScaleGivenExtent(e2));
  }, {category: ['layout']});

  add.method('adjustForRigidity', function (e) {
    var currentExtent = this.getExtent();
    return pt(this.horizontalLayoutMode === avocado.LayoutModes.Rigid ? Math.max(e.x, currentExtent.x) : e.x,
              this.  verticalLayoutMode === avocado.LayoutModes.Rigid ? Math.max(e.y, currentExtent.y) : e.y);
  }, {category: ['layout']});

  add.method('currentOrDesiredScaleGivenExtent', function (e) {
    if (this._desiredSpaceToScaleTo) {
      if      (this._desiredSpaceToScaleTo.x && e.x) { return this._desiredSpaceToScaleTo.x / e.x; }
      else if (this._desiredSpaceToScaleTo.y && e.y) { return this._desiredSpaceToScaleTo.y / e.y; }
    }
    return this.getScale();
  }, {category: ['layout']});

  add.method('calculateMinimumExtentsForRowsAndColumns', function () {
    var layoutInfo = pt([], []);
    this.eachDirection(function(dir) {
      var rs = dir.coord(layoutInfo);
      rs.spaceFillingCount = 0;
      this._tableContent.eachLineInDirection(dir, function(line) {
        var r = this.calculateMinimumExtentFor(line, dir);
        rs.push(r);
        if (r.canFillSpace) { rs.spaceFillingCount += 1; }
      }.bind(this));
    }.bind(this));
    return layoutInfo;
  }, {category: ['layout']});

  add.method('calculateMinimumExtentFor', function (morphs, direction) {
    var r = { biggestSideways: 0, canFillSpace: false };
    
    if (this._debugMyLayout) { console.log("calculateMinimumExtentFor " + morphs.size() + " morphs in direction " + direction); }
    morphs.each(function(m) {
      if (m) {
        var mMinExt = m.minimumExtent();
        var mMinSideways = direction.sideways.coord(mMinExt);
        if (this._debugMyLayout) { console.log("minimumExtent() for " + m.inspect() + " in direction " + direction.sideways + " is " + mMinSideways); }
        r.biggestSideways = Math.max(r.biggestSideways, mMinSideways);

        // How should we do this? Should the row be space-filling if *any* morph in it
        // is space-filling, or if *all* of them are, or what? Try any for now. -- Adam
        if (direction.sideways.layoutModeOf(m) === avocado.LayoutModes.SpaceFill) { r.canFillSpace = true; }
      }
    }.bind(this));
    
    return r;
  }, {category: ['layout']});

  add.method('calculateOverallMinimumExtent', function (layoutInfoForRowsAndColumns) {
    var overallMinExt = pt(0, 0);
    
    this.eachDirection(function(dir) {
      var infoForThisDirection = dir.coord(layoutInfoForRowsAndColumns);
      
      var totalLineSizes = infoForThisDirection.inject(0, function(sum, r) {
        return sum + r.biggestSideways;
      });
      
      var totalPadding = dir.sideways.padding1(this.padding) +
                         dir.sideways.padding2(this.padding) +
                         (dir.sideways.coord(this.padding.between) * (infoForThisDirection.length - 1));

      if (this._debugMyLayout) { console.log("In calculateOverallMinimumExtent, direction " + dir + ", totalLineSizes is " + totalLineSizes + " and totalPadding is " + totalPadding + " for a total of " + (totalLineSizes + totalPadding)); }
      dir.sideways.setCoord(overallMinExt, totalLineSizes + totalPadding);
    }.bind(this));
    
    // keep it around, we'll need it when rejiggering the layout
    overallMinExt.layoutInfoForRowsAndColumns = layoutInfoForRowsAndColumns;
    if (this._debugMyLayout) { console.log("overallMinExt: " + overallMinExt); }
    
    return overallMinExt;
  }, {category: ['layout']});

  add.method('rejiggerTheLayout', function (availableSpace) {
    var thisExtent = this.getExtent();
    var availableSpaceToUse = this.calculateSpaceToUseOutOf(availableSpace, thisExtent);
    if (this.isAlreadyLaidOutInSpace(availableSpaceToUse)) {
      availableSpaceToUse = thisExtent;
    } else {
      this._spaceUsedLastTime = availableSpaceToUse;

      var extraSpaceUsage = this.decideWhatToDoWithExtraSpace(availableSpaceToUse);
      var actualCoordsAndSizes = this.calculateActualCoordinatesAndSizes(extraSpaceUsage);
      this.setMorphPositionsAndSizes(actualCoordsAndSizes);
      this.setExtentIfChanged(availableSpaceToUse);

      this._layoutIsStillValid = true;
    }
    return availableSpaceToUse.scaleBy(this.getScale());
  }, {category: ['layout']});

  add.method('calculateSpaceToUseOutOf', function (availableSpace, thisExtent) {
    var availableSpaceToUse = pt(null, null);
    
    if (this.horizontalLayoutMode === avocado.LayoutModes.ShrinkWrap) { availableSpaceToUse.x =          this._cachedMinimumExtent.x;                }
    if (this.horizontalLayoutMode === avocado.LayoutModes.Rigid     ) { availableSpaceToUse.x = Math.max(this._cachedMinimumExtent.x, thisExtent.x); }
    if (this.  verticalLayoutMode === avocado.LayoutModes.ShrinkWrap) { availableSpaceToUse.y =          this._cachedMinimumExtent.y;                }
    if (this.  verticalLayoutMode === avocado.LayoutModes.Rigid     ) { availableSpaceToUse.y = Math.max(this._cachedMinimumExtent.y, thisExtent.y); }
    
    var scale = this.currentOrDesiredScaleGivenExtent(availableSpaceToUse);
    if (scale !== this.getScale()) { this.setScale(scale); }
    
    if (availableSpaceToUse.x === null) { availableSpaceToUse.x = availableSpace.x / scale; }
    if (availableSpaceToUse.y === null) { availableSpaceToUse.y = availableSpace.y / scale; }
    
    if (this._debugMyLayout) { console.log(this.inspect() + ": availableSpace: " + availableSpace + ", availableSpaceToUse: " + availableSpaceToUse + ", this.getScale(): " + this.getScale() + ", this._cachedMinimumExtent: " + this._cachedMinimumExtent + ", thisExtent: " + thisExtent); }
    return availableSpaceToUse;
  }, {category: ['layout']});

  add.method('isAlreadyLaidOutInSpace', function (s) {
    if (this._layoutIsStillValid && this._spaceUsedLastTime && this._spaceUsedLastTime.eqPt(s)) {
      if (this._debugMyLayout) {
        console.log("No need to lay out " + this.inspect() + ", since it's already laid out in the appropriate amount of space: " + s);
      }
      return true;
    } else {
      if (this._debugMyLayout) {
        console.log("Gonna have to lay out " + this.inspect() + ", since _spaceUsedLastTime is " + this._spaceUsedLastTime + " but s is " + s);
      }
      return false;
    }
  }, {category: ['layout']});

  add.method('decideWhatToDoWithExtraSpace', function (availableSpaceToUse) {
    var r = { padding: this.padding, extraSpacePerSpaceFillingChild: pt(0,0) };
    var extraSpace = availableSpaceToUse.subPt(this._cachedMinimumExtent);
    this.eachDirection(function(dir) {
      var info = dir.coord(this._cachedMinimumExtent.layoutInfoForRowsAndColumns);
      var extra = dir.sideways.coord(extraSpace);
      if (info.spaceFillingCount === 0) {
        // Nobody wants it; just put in extra padding.
        var numberOfBetweenPads = info.size() - 1;
        if (numberOfBetweenPads > 0) {
          if (r.padding === this.padding) { r.padding = Object.clone(r.padding); r.padding.between = Object.clone(r.padding.between); }
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
      var info = dir.coord(this._cachedMinimumExtent.layoutInfoForRowsAndColumns);
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
    var direction = this._tableContent._direction2;
    this._tableContent.primaryLines().each(function(line, i) {
      line.each(function(m, j) {
        var actualsForThisMorph = direction.point(direction.sideways.coord(actualCoordsAndSizes)[j], direction.coord(actualCoordsAndSizes)[i]);
        var availableSpaceToPassOnToThisChild = pt(actualsForThisMorph.x.space, actualsForThisMorph.y.space);

        var mScaledExtent = m.rejiggerTheLayout(availableSpaceToPassOnToThisChild);
        if (this._debugMyLayout) { console.log("mScaledExtent is " + mScaledExtent); }
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
        if (this._debugMyLayout) { console.log("Added " + m.inspect() + " at " + x + ", " + y); }
      }.bind(this));
    }.bind(this));
  }, {category: ['layout']});

  add.method('setExtentIfChanged', function (newExtent) {
    if (this._debugMyLayout) { console.log("Gonna set extent to: " + newExtent); }
    if (! newExtent.eqPt(this.getExtent())) {
      this.setExtent(newExtent);
      //this.smoothlyResizeTo(newExtent); // aaa - doesn't quite work right yet
    }
  }, {category: ['layout']});

  add.method('addMorph', function ($super, m, shouldNotForceLayoutRejiggering) {
    $super(m);
    if (!shouldNotForceLayoutRejiggering && !m.shouldNotBePartOfRowOrColumn) {
      this.forceLayoutRejiggering();
    }
  }, {category: ['adding and removing']});

  add.method('removeMorph', function ($super, m, shouldNotForceLayoutRejiggering) {
    $super(m);
    if (!shouldNotForceLayoutRejiggering && !m.shouldNotBePartOfRowOrColumn) {
      this.forceLayoutRejiggering();
    }
  }, {category: ['adding and removing']});

  add.method('replaceMorph', function (m, newSubmorph) {
    if (!this._tableContent) { throw new Error("How do I do replaceMorph if there's no _tableContent?"); }
    
    this._tableContent.replaceElement(m, newSubmorph);
    this.setSubmorphsFromTableContent();
    this.forceLayoutRejiggering();
  }, {category: ['adding and removing']});

  add.method('eachThingy', function (f) {
    for (var i = 0, n = this.submorphs.length; i < n; ++i) {
      var m = this.submorphs[i];
      if (! m.shouldNotBePartOfRowOrColumn) {f(m);}
    }
  }, {category: ['iterating']});

  add.method('thingies', function (f) {
    return avocado.enumerator.create(this, 'eachThingy');
  }, {category: ['iterating']});

  add.method('replaceContentWith', function (newContent) {
    if (this._tableContent && this._tableContent.equals(newContent)) { return; }
    if (this._debugMyLayout) { console.log("About to replaceContentWith " + newContent.primaryLines().size() + " lines in direction " + newContent._direction2); }
    this._tableContent = newContent;
    reflect(this).slotAt('_tableContent').beCreator();
    this.setSubmorphsFromTableContent();
    this.forceLayoutRejiggering();
  }, {category: ['adding and removing']});

  add.method('setSubmorphsFromTableContent', function () {
    var nonThingies = [];
    for (var i = 0, n = this.submorphs.length; i < n; ++i) { var m = this.submorphs[i]; if (! m.shouldNotBePartOfRowOrColumn) { nonThingies.push(m); }}
    for (var i = 0, n =    nonThingies.length; i < n; ++i) { this.removeMorph(nonThingies[i], true); }
    this._tableContent.eachElement(function(m) { this.addMorph(m, true); }.bind(this));
  }, {category: ['adding and removing']});

  add.method('refreshContent', function ($super) {
    $super();
    if (typeof(this.potentialContent) === 'function') {
      var potentialContent = this.potentialContent();
      var actualContent = potentialContent.selectThenMap(function(morphOrToggler) {
        return ! morphOrToggler.shouldNotBeShown();
      }, function(morphOrToggler) {
        return morphOrToggler.actualMorphToShow();
      });
      this.replaceContentWith(actualContent);
    }
  }, {category: ['adding and removing']});

  add.method('setPotentialContent', function (c) {
    this.potentialContent = function() { return c; };
  }, {category: ['adding and removing']});

  add.method('setRows', function (ms) {
    this.replaceContentWith(avocado.tableContents.createWithColumns([ms]));
  });

  add.method('setPotentialRows', function (ms) {
    this.setPotentialContent(avocado.tableContents.createWithColumns([ms]));
  });

  add.method('setColumns', function (ms) {
    this.replaceContentWith(avocado.tableContents.createWithRows([ms]));
  });

  add.method('setPotentialColumns', function (ms) {
    this.setPotentialContent(avocado.tableContents.createWithRows([ms]));
  });

  add.method('addRow', function (m) {
    if (this._tableContent && this._tableContent.primaryLines().length > 0) {
      this.makeSurePrimaryDirectionIs(avocado.directions.horizontal);
      var newContent = this._tableContent.copy();
      newContent.primaryLines().last().push(m);
      this.replaceContentWith(newContent);
    } else {
      this.setRows([m]);
    }
  });

  add.method('removeRow', function (m) {
    this.makeSurePrimaryDirectionIs(avocado.directions.horizontal);
    this.setRows(this._tableContent.primaryLine(0).reject(function(mm) { return m === mm; }));
  });

  add.method('addColumn', function (m) {
    if (this._tableContent && this._tableContent.primaryLines().length > 0) {
      this.makeSurePrimaryDirectionIs(avocado.directions.vertical);
      var newContent = this._tableContent.copy();
      newContent.primaryLines().last().push(m);
      this.replaceContentWith(newContent);
    } else {
      this.setColumns([m]);
    }
  });

  add.method('removeColumn', function (m) {
    this.makeSurePrimaryDirectionIs(avocado.directions.vertical);
    this.setColumns(this._tableContent.primaryLines(0).reject(function(mm) { return m === mm; }));
  });

  add.method('addCell', function (m) {
    if (! this._tableContent) { return this.addColumn(m); }
    if (this._tableContent._direction1 === avocado.directions.vertical) { return this.addColumn(m); }
    return this.addRow(m);
  });

  add.method('makeSurePrimaryDirectionIs', function (dir) {
    if (this._tableContent && this._tableContent._direction1 !== dir) {
      // We could actually implement this, it wouldn't be so hard.
      throw new Error("Expected primary direction to be " + dir + ", but instead it was " + this._tableContent._direction1);
    }
  });

  add.method('reshape', function ($super, partName, newPoint, lastCall) {
    // aaa - This should probably just be in Morph.
    // aaa - Still doesn't work right if you reshape an internal guy.
    var r = $super(partName, newPoint, lastCall);
    this.horizontalLayoutMode = this.verticalLayoutMode = avocado.LayoutModes.Rigid;
    this.minimumExtentMayHaveChanged();
    return r;
  }, {category: ['layout']});

  add.data('suppressHandles', true, {category: ['handles']});

  add.method('beInvisible', function () {
    return this.applyStyle(this.invisibleStyle);
  }, {category: ['shortcuts']});

  add.creator('invisibleStyle', {}, {category: ['styles']});

});


thisModule.addSlots(avocado.TableMorph.prototype.invisibleStyle, function(add) {

  add.data('padding', 0);

  add.data('borderWidth', 0);

  add.data('fill', null);

  add.data('suppressGrabbing', true);

  add.data('shouldIgnoreEvents', true);

  add.data('openForDragAndDrop', false);

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

  add.method('create', function (a, dir1) {
    return Object.newChildOf(this, a, dir1);
  }, {category: ['creating']});

  add.data('_direction1', avocado.directions.vertical);

  add.data('_direction2', avocado.directions.horizontal);

  add.data('_data', [], {initializeTo: '[]'});

  add.method('initialize', function (a, dir1) {
    if (! reflect(a).isReflecteeArray()) { throw "Why ain't the data an array?"; }
    a.each(function(r) {
      if (! reflect(r).isReflecteeArray()) { throw "Why ain't the row or column an array? " + r; }
    });
    this._data = a;
    reflect(this).slotAt('_data').beCreator();
    reflect(this._data).eachIndexableSlot(function(s) { s.beCreator(); });
    this._direction1 = dir1;
    this._direction2 = dir1.sideways;
  }, {category: ['creating']});

  add.method('copyRemoveAll', function () {
    return avocado.tableContents.create([], this._direction1);
  }, {category: ['creating']});

  add.method('copy', function () {
    return avocado.tableContents.create(this._data.map(function(line) { return line.map(function(elem) { return elem; }); }), this._direction1);
  }, {category: ['copying']});

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
    this._data.spliceAndAdjustCreatorSlots(i, 0, line);
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
      c._data.push(newRowOrCol);
    });
    return c;
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


thisModule.addSlots(avocado.ColumnMorph.prototype, function(add) {

  add.data('constructor', avocado.ColumnMorph);

  add.data('direction', avocado.directions.vertical);

});


thisModule.addSlots(avocado.RowMorph.prototype, function(add) {

  add.data('constructor', avocado.RowMorph);

  add.data('direction', avocado.directions.horizontal);

});


thisModule.addSlots(Morph.prototype, function(add) {

  add.method('shouldNotBeShown', function () { return false; });

  add.method('actualMorphToShow', function () { return this; });

});


thisModule.addSlots(HandMorph.prototype, function(add) {

  add.data('shouldNotBePartOfRowOrColumn', true);

});


thisModule.addSlots(HandleMorph.prototype, function(add) {

  add.data('shouldNotBePartOfRowOrColumn', true);

});


});
