avocado.transporter.module.create('general_ui/table_layout', function(requires) {

requires('reflection/reflection');
requires('core/table');
requires('general_ui/basic_morph_mixins');
requires('general_ui/layout');

}, function(thisModule) {


thisModule.addSlots(avocado.table, function(add) {

  add.creator('layout', {}, {category: ['user interface']});

  add.method('newColumnMorph', function () {
    return avocado.ui.newMorph().useTableLayout(avocado.table.contents.columnPrototype);
  }, {category: ['user interface']});

  add.method('newRowMorph', function () {
    return avocado.ui.newMorph().useTableLayout(avocado.table.contents.rowPrototype);
  }, {category: ['user interface']});

  add.method('newTableMorph', function () {
    return this.newColumnMorph();
  }, {category: ['user interface']});

  add.method('createSpaceFillingRowMorph', function (content, padding) {
    var m = this.newRowMorph().beInvisible();
    var direction = avocado.directions.horizontal;
    if (padding !== undefined) { m.layout().setPadding(padding); }
    direction.setLayoutModeOf(m, avocado.LayoutModes.SpaceFill);
    
    if (typeof(content) === 'function') {
      m.setPotentialContentMorphsFunction(function() { return avocado.table.contents.create([content()], direction.sideways); });
      m.refreshContent();
    } else {
      // default to left-justifying the contents
      if (content.all(function(c) {return direction.layoutModeOf(c) !== avocado.LayoutModes.SpaceFill;})) {
        content = content.concat([avocado.ui.createSpacer()]);
      }
      m.replaceContentWith(avocado.table.contents.create([content], direction.sideways));
    }
    
    return m;
  }, {category: ['user interface']});

  add.creator('boxStyle', {}, {category: ['user interface']});

  add.method('createEitherOrMorph', function (morphs, functionReturningTheIndexOfTheOneToShow) {
    // aaa - callers that are TableMorphs already and just need two choices should just use the new enhanced morphToggler, don't need to wrap it in this RowMorph anymore
    var r = avocado.table.newRowMorph().beInvisible();
    r.typeName = 'either-or morph';
    var togglers = morphs.map(function(m) { return avocado.morphToggler.create(null, m); });
    r.layout().setPotentialCells(togglers);
    r.refreshContent = avocado.makeSuperWork(r, "refreshContent", function($super) {
      var i = functionReturningTheIndexOfTheOneToShow();
      var evt = Event.createFake();
      togglers.each(function(t, ti) {
        t.setValue(i === ti, evt);
      });
      return $super();
    });
    return r;
  }, {category: ['shortcuts']});

  add.method('createOptionalMorph', function (m, condition, layoutModes) {
    var om = this.createEitherOrMorph([m, avocado.table.newRowMorph().beInvisible()], function() { return condition() ? 0 : 1; });
    om.typeName = 'optional morph';
    om.horizontalLayoutMode = (layoutModes || m).horizontalLayoutMode;
    om.verticalLayoutMode   = (layoutModes || m).verticalLayoutMode;
    return om;
  }, {category: ['shortcuts']});

  add.method('wrapToTakeUpConstantWidth', function (width, morph) {
    return this.wrapToTakeUpConstantSpace(pt(width, null), morph);
  }, {category: ['shortcuts']});

  add.method('wrapToTakeUpConstantHeight', function (height, morph) {
    return this.wrapToTakeUpConstantSpace(pt(null, height), morph);
  }, {category: ['shortcuts']});

  add.method('wrapToTakeUpConstantSpace', function (space, morph) {
    var wrapper = avocado.table.newRowMorph().beInvisible();
    wrapper.layout().setDesiredSpace(space);
    wrapper.layout().setCells([morph]);
    return wrapper;
  }, {category: ['shortcuts']});

});


thisModule.addSlots(avocado.table.layout, function(add) {

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

  add.method('tableContent', function () {
    return this._tableContent;
  }, {category: ['accessing']});

  add.method('setTableContent', function (c) {
    this._tableContent = c;
    // aaa - several hacks piled on top of each other
    if (!avocado.shouldBreakCreatorSlotsInOrderToImprovePerformance && c !== avocado.table.contents.rowPrototype && c !== avocado.table.contents.columnPrototype && !reflect(c).explicitlySpecifiedCreatorSlot()) {
      reflect(this).slotAt('_tableContent').beCreator();
    }
    return this;
  }, {category: ['accessing']});

  add.method('shouldPrintDebugInfo', function () {
    return this._tableMorph._debugMyLayout;
  }, {category: ['accessing the table morph']});

  add.method('layoutModes', function () {
    // aaa make the TableMorph itself store them as a Point?
    return pt(this._tableMorph.horizontalLayoutMode, this._tableMorph.verticalLayoutMode);
  }, {category: ['accessing the table morph']});

  add.method('replaceContentWith', function (newContent) {
    if (this.tableContent() && this.tableContent().equals(newContent)) { return; }
    this.setTableContent(newContent);
    this.setSubmorphsFromTableContent();
  }, {category: ['adding and removing']});

  add.method('replaceMorph', function (m, newSubmorph) {
		// Gotta make sure to leave the replaced morph at the right scale, so that if we then add it back to the world it'll look right. -- Adam
		var mScale = m.overallScale(this._tableMorph.world());
		
    this.tableContent().replaceElement(m, newSubmorph);
    this.setSubmorphsFromTableContent();
    
		m.setScale(mScale);
  }, {category: ['adding and removing']});

  add.method('setCells', function (ms) {
    this.replaceContentWith(this.tableContent().copyWithSoleLine(ms));
  }, {category: ['adding and removing']});

  add.method('setPotentialCells', function (ms) {
    this._tableMorph.setPotentialContentMorphs(this.tableContent().copyWithSoleLine(ms));
  }, {category: ['adding and removing']});

  add.method('addCell', function (m) {
    this.replaceContentWith(this.tableContent().copyAndAddElement(m));
  }, {category: ['adding and removing']});

  add.method('removeCell', function (m) {
    this.replaceContentWith(this.tableContent().copyAndRemoveElement(m));
  }, {category: ['adding and removing']});

  add.method('setSubmorphsFromTableContent', function () {
    if (this._submorphReplacementBatcherUpper && this._submorphReplacementBatcherUpper.isRunning()) {
      this._submorphReplacementBatcherUpper.batchUp();
      return;
    }
    
    // console.log("Running setSubmorphsFromTableContent on " + (this._tableMorph.toString() || avocado.identityHashFor(this._tableMorph)));
    this._tableMorph.replaceMorphs(this._tableMorph.submorphsParticipatingInLayout(), this.tableContent().elements());
  }, {category: ['adding and removing']});

  add.method('submorphReplacementBatcherUpper', function () {
    if (! this._submorphReplacementBatcherUpper) {
      this._submorphReplacementBatcherUpper = avocado.batcherUpper.create(this, function() {
        this._context.setSubmorphsFromTableContent();
      });
    }
    return this._submorphReplacementBatcherUpper;
  }, {category: ['layout']});

  add.method('getPadding', function () {
    return this._padding;
  }, {category: ['padding']});

  add.method('setPadding', function (p) {
    if (typeof p === 'number') {
      this._padding = {left: p, right: p, top: p, bottom: p, between: {x: p, y: p}};
    } else {
      this._padding = p;
    }
    return this;
  }, {category: ['padding']});

  add.data('_padding', {left: 10, right: 10, top: 10, bottom: 10, between: {x: 10, y: 10}}, {category: ['padding'], initializeTo: '{left: 10, right: 10, top: 10, bottom: 10, between: {x: 10, y: 10}}'});

  add.method('applyStyle', function (spec) {
	  if (typeof(spec.padding) !== 'undefined') { this.setPadding(spec.padding); }
  }, {category: ['styles']});

  add.method('adjustStyleSpec', function (spec) {
    if (typeof(this._padding) !== 'undefined') { spec.padding = this._padding; }
  }, {category: ['styles']});

  add.method('eachDirection', function (f) {
    f(avocado.directions.horizontal);
    f(avocado.directions.vertical);
  }, {category: ['directions']});

  add.method('isAffectedBy', function (operation, morph) {
    return ! morph.shouldNotBePartOfRowOrColumn;
  }, {category: ['layout']});

  add.method('possiblyDoSomethingBecauseASubmorphMinimumExtentHasChanged', function (tableMorph) {
    return tableMorph.minimumExtentMayHaveChanged();
  }, {category: ['layout']});

  add.method('minimumExtent', function () {
    return this.adjustForRigidityAndScale(this.internalMinimumExtent());
  }, {category: ['layout', 'minimum extent']});

  add.method('adjustForRigidityAndScale', function (e) {
    var e2 = this.adjustForRigidity(e);
    return e2.scaleBy(this.currentOrDesiredScaleGivenExtent(e2));
  }, {category: ['layout']});

  add.method('adjustForRigidity', function (e) {
    // Code uglified just a bit to avoid creating unnecessary Point objects; it's turning out to be significant. -- Adam
    var rigidX = this._tableMorph.horizontalLayoutMode === avocado.LayoutModes.Rigid;
    var rigidY = this._tableMorph.  verticalLayoutMode === avocado.LayoutModes.Rigid;
    if (rigidX || rigidY) {
      var currentExtent = this.getExtent();
      return pt(rigidX ? Math.max(e.x, currentExtent.x) : e.x,
                rigidY ? Math.max(e.y, currentExtent.y) : e.y);
    } else {
      return e;
    }
  }, {category: ['layout']});

  add.method('setDesiredSpace', function (space) {
    this._desiredSpaceToScaleTo = space;
    return this;
  }, {category: ['layout']});

  add.method('doNotCenter', function () {
    this._shouldNotCenterSideways = true;
    return this;
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
      var layoutInfoForRowsAndColumns = this.calculateMinimumExtentsForRowsAndColumns();
      this._tableMorph._cachedMinimumExtent = this.calculateOverallMinimumExtent(layoutInfoForRowsAndColumns);
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

  add.method('rejigger', function (tableMorph, availableSpace) {
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
      
      // aaa - Just reversed these two lines, because in 3D-land setMorphPositionsAndSizes needs to have the extent set already. Will that cause grief?
      this._tableMorph.setExtentIfChanged(availableSpaceToUse);
      this.setMorphPositionsAndSizes(actualCoordsAndSizes);

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
    this._actualCoordsAndSizes = actualCoordsAndSizes;
    var direction = this.tableContent()._direction2;
    var origin = this._tableMorph.getOriginAAAHack(); // necessary because in 3D-land the origin is in the centre, but I don't understand why it's not working in LK-land
    this.tableContent().primaryLines().each(function(line, i) {
      line.each(function(m, j) {
        var actualsForThisMorph = direction.point(direction.sideways.coord(actualCoordsAndSizes)[j], direction.coord(actualCoordsAndSizes)[i]);
        var availableSpaceToPassOnToThisChild = pt(actualsForThisMorph.x.space, actualsForThisMorph.y.space);
        
        if (this._overrideSubmorphLayoutModes) {
          if (!m._previousLayoutModes) { m._previousLayoutModes = m.layoutModes(); }
          m.setLayoutModes(this._overrideSubmorphLayoutModes);
        }
        
        var mScaledExtent = m.rejiggerTheLayout(availableSpaceToPassOnToThisChild);
        if (this.shouldPrintDebugInfo()) { console.log("mScaledExtent is " + mScaledExtent); }
        
        // Uglified slightly to avoid creating the Point object; it's actually getting significant. -- Adam
        var f = direction         .coord(actualsForThisMorph).coordinate;
        var s = direction.sideways.coord(actualsForThisMorph).coordinate;
        
        if (!this._shouldNotCenterSideways) {
          var unusedSidewaysSpace = direction.sideways.coord(availableSpaceToPassOnToThisChild) - direction.sideways.coord(mScaledExtent);
          s = s + (unusedSidewaysSpace / 2);
        }
        
        var x, y;
        if (direction === avocado.directions.horizontal) {
          x = f; y = s;
        } else {
          x = s; y = f;
        }
        m.setTopLeftPosition(origin.moveDownAndRightBy(x, y));
        if (this.shouldPrintDebugInfo()) { console.log("Added " + m.inspect() + " at " + x + ", " + y); }
      }.bind(this));
    }.bind(this));
  }, {category: ['layout']});

  add.method('positionOfPrimaryLine', function (i) {
    var direction = this.tableContent()._direction2;
    var actualsForThisMorph = direction.point(direction.sideways.coord(this._actualCoordsAndSizes)[0], direction.coord(this._actualCoordsAndSizes)[i]);
    var p = pt(actualsForThisMorph.x.coordinate, actualsForThisMorph.y.coordinate);
    return p;
  }, {category: ['layout']});

});


thisModule.addSlots(avocado.table.boxStyle, function(add) {

  add.data('padding', {top: 2, bottom: 2, left: 4, right: 4, between: {x: 3, y: 3}}, {initializeTo: '{top: 2, bottom: 2, left: 4, right: 4, between: {x: 3, y: 3}}'});

  add.data('borderRadius', 10);

  add.data('openForDragAndDrop', false);

});


thisModule.addSlots(avocado.directions.vertical, function(add) {

  add.method('externallySpecifiedFreeSpaceSideways', function (m) {return m.externallySpecifiedFreeWidth;});

  add.method('specifyFreeSpaceSideways', function (m, s) {m.externallySpecifiedFreeWidth = s;});

  add.method('dimensionOfRect', function (r) {return r.height;});

  add.method('padding1', function (padding) {return padding.top;});

  add.method('padding2', function (padding) {return padding.bottom;});

  add.method('layoutModeOf', function (m) {return m.verticalLayoutMode;});

  add.method('setLayoutModeOf', function (m, mode) {m.verticalLayoutMode = mode;});

});


thisModule.addSlots(avocado.directions.horizontal, function(add) {

  add.method('externallySpecifiedFreeSpaceSideways', function (m) {return m.externallySpecifiedFreeHeight;});

  add.method('specifyFreeSpaceSideways', function (m, s) {m.externallySpecifiedFreeHeight = s;});

  add.method('dimensionOfRect', function (r) {return r.width;});

  add.method('padding1', function (padding) {return padding.left;});

  add.method('padding2', function (padding) {return padding.right;});

  add.method('layoutModeOf', function (m) {return m.horizontalLayoutMode;});

  add.method('setLayoutModeOf', function (m, mode) {m.horizontalLayoutMode = mode;});

});


thisModule.addSlots(avocado.table.contents, function(add) {

  add.data('rowPrototype', avocado.table.contents.create([], avocado.directions.vertical), {initializeTo: 'avocado.table.contents.create([], avocado.directions.vertical)'});

  add.data('columnPrototype', avocado.table.contents.create([], avocado.directions.horizontal), {initializeTo: 'avocado.table.contents.create([], avocado.directions.horizontal)'});

  add.method('newMorph', function () {
    var world = avocado.ui.currentWorld();
    var morphsTable = this.map(function(model) { return world.morphFor(model); });
    var m = avocado.table.newTableMorph();
    if (this._desiredSpaceToScaleTo) { m.layout().setDesiredSpace(this._desiredSpaceToScaleTo); } // aaa hack, the model shouldn't know about this UI stuff
    m.replaceContentWith(morphsTable);
    m.applyStyle(avocado.table.boxStyle);
    return m;
  }, {category: ['user interface']});

});


thisModule.addSlots(avocado.morphMixins.Morph, function(add) {

  add.method('useTableLayout', function (tableContent) {
    this.horizontalLayoutMode = avocado.LayoutModes.ShrinkWrap;
    this.  verticalLayoutMode = avocado.LayoutModes.ShrinkWrap;
    this.suppressHandles = true; // aaa - handles don't work right with tables yet
    this.setLayout(Object.newChildOf(avocado.table.layout, this).setTableContent(tableContent));
    return this;
  }, {category: ['layout']});

});


});
