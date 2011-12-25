avocado.transporter.module.create('lk_ext/rows_and_columns', function(requires) {

requires('general_ui/table_layout');
requires('lk_ext/layout');

}, function(thisModule) {


thisModule.addSlots(avocado, function(add) {

  add.method('TableMorph', function TableMorph() { Class.initializer.apply(this, arguments); }, {category: ['ui', 'rows and columns']});

});


thisModule.addSlots(avocado.TableMorph, function(add) {

  add.data('superclass', Morph);

  add.data('type', 'avocado.TableMorph');

  add.creator('boxStyle', {});

  add.creator('prototype', Object.create(Morph.prototype));
  
  add.method('newColumn', function () { return new avocado.TableMorph(avocado.tableContents.columnPrototype); });

  add.method('newRow', function () { return new avocado.TableMorph(avocado.tableContents.rowPrototype); });

  add.method('createSpaceFillingRow', function (content, padding) {
    var m = this.newRow().beInvisible();
    var direction = avocado.directions.horizontal;
    if (padding !== undefined) { m.setPadding(padding); }
    direction.setLayoutModeOf(m, avocado.LayoutModes.SpaceFill);
    
    if (typeof(content) === 'function') {
      m.setPotentialContentMorphsFunction(function() { return avocado.tableContents.create([content()], direction.sideways); });
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

});


thisModule.addSlots(avocado.TableMorph.boxStyle, function(add) {

  add.data('padding', {top: 2, bottom: 2, left: 4, right: 4, between: {x: 3, y: 3}}, {initializeTo: '{top: 2, bottom: 2, left: 4, right: 4, between: {x: 3, y: 3}}'});

  add.data('borderRadius', 10);

  add.data('openForDragAndDrop', false);

});


thisModule.addSlots(avocado.TableMorph.prototype, function(add) {

  add.data('constructor', avocado.TableMorph);

  add.data('_tableContent', avocado.tableContents);

  add.method('initialize', function ($super, tableContent) {
    this.horizontalLayoutMode = avocado.LayoutModes.ShrinkWrap;
    this.verticalLayoutMode = avocado.LayoutModes.ShrinkWrap;
    this._layout = Object.newChildOf(avocado.tableLayout, this);
    if (tableContent) { this._tableContent = tableContent; }
    $super(new lively.scene.Rectangle(pt(0, 0).extent(pt(10, 10))));
  }, {category: ['creating']});

  add.data('padding', {left: 10, right: 10, top: 10, bottom: 10, between: {x: 10, y: 10}}, {category: ['layout'], initializeTo: '{left: 10, right: 10, top: 10, bottom: 10, between: {x: 10, y: 10}}'});
  
  add.method('layout', function () {
    return this._layout;
  }, {category: ['layout']});

  add.method('setPadding', function (p) {
    this._layout.setPadding(p);
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

  add.method('minimumExtent', function () {
    return this._layout.adjustForRigidityAndScale(this._layout.internalMinimumExtent());
  }, {category: ['layout']});

  add.method('possiblyDoSomethingBecauseASubmorphMinimumExtentHasChanged', function () {
    return this.minimumExtentMayHaveChanged();
  }, {category: ['layout']});

  add.method('rejiggerTheLayout', function (availableSpace) {
    return this._layout.rejigger(availableSpace);
  }, {category: ['layout']});

  add.method('setExtentIfChanged', function (newExtent) {
    if (this._layout.shouldPrintDebugInfo()) { console.log("Gonna set extent to: " + newExtent); }
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
    
		// Gotta make sure to leave the replaced morph at the right scale, so that if we then add it back to the world it'll look right. -- Adam
		var mScale = m.overallScale(this.world());
		
    this._tableContent.replaceElement(m, newSubmorph);
    this.setSubmorphsFromTableContent();
    
		m.setScale(mScale);
		
    this.forceLayoutRejiggering();
  }, {category: ['adding and removing']});

  add.method('eachCell', function (f) {
    for (var i = 0, n = this.submorphs.length; i < n; ++i) {
      var m = this.submorphs[i];
      if (! m.shouldNotBePartOfRowOrColumn) {f(m);}
    }
  }, {category: ['iterating']});

  add.method('cells', function (f) {
    return avocado.enumerator.create(this, 'eachCell');
  }, {category: ['iterating']});

  add.method('replaceContentWith', function (newContent) {
    if (this._tableContent && this._tableContent.equals(newContent)) { return; }
    if (this._layout.shouldPrintDebugInfo()) { console.log("About to replaceContentWith " + newContent.primaryLines().size() + " lines in direction " + newContent._direction2); }
    this._tableContent = newContent;
    reflect(this).slotAt('_tableContent').beCreator();
    this.setSubmorphsFromTableContent();
    this.forceLayoutRejiggering();
  }, {category: ['adding and removing']});

  add.method('setSubmorphsFromTableContent', function () {
    var nonCells = [];
    for (var i = 0, n = this.submorphs.length; i < n; ++i) { var m = this.submorphs[i]; if (! m.shouldNotBePartOfRowOrColumn) { nonCells.push(m); }}
    for (var i = 0, n =       nonCells.length; i < n; ++i) { this.removeMorph(nonCells[i], true); }
    this._tableContent.eachElement(function(m) { this.addMorph(m, true); }.bind(this));
  }, {category: ['adding and removing']});

  add.method('refreshContent', function ($super) {
    $super();
    var recalculatedActualContentMorphs = this.recalculateActualContentMorphs();
    if (recalculatedActualContentMorphs) {
      this.replaceContentWith(recalculatedActualContentMorphs);
    }
  }, {category: ['updating']});

  add.method('recalculateActualContentMorphs', function () {
    // aaa - duplicated in AutoScalingMorph
    var context = this;
    var layoutModesForContentMorphs = this._layoutModesForContentMorphs;
    if (typeof(this.potentialContentMorphs) === 'function') {
      var potentialContentMorphs = this.potentialContentMorphs();
      var actualContentMorphs = potentialContentMorphs.selectThenMap(function(morphOrToggler) {
        return !!morphOrToggler.actualMorphToShow(context);
      }, function(morphOrToggler) {
        var actualMorph = morphOrToggler.actualMorphToShow(context);
        if (layoutModesForContentMorphs) { actualMorph.setLayoutModes(layoutModesForContentMorphs); }
        return actualMorph;
      });
      return actualContentMorphs;
    } else {
      return null;
    }
  }, {category: ['updating']});

  add.method('setPotentialContentMorphs', function (content) {
    // aaa - duplicated in AutoScalingMorph
    this.setPotentialContentMorphsFunction(function() { return content; });
  }, {category: ['updating']});

  add.method('setPotentialContentMorphsFunction', function (contentFunction) {
    // aaa - duplicated in AutoScalingMorph
    this.potentialContentMorphs = contentFunction;
  }, {category: ['updating']});

  add.method('potentialContentsCount', function () {
    // aaa - this is kind of a hack - should really just be one clear intensional mechanism and one clear extensional one.
    return this.recalculateContentModels ? this.recalculateContentModels().size() : (this.potentialContentMorphs ? this.potentialContentMorphs().primaryLines().size() : this.submorphs.length);
  });

  add.method('setCells', function (ms) {
    this.replaceContentWith(this._tableContent.copyWithSoleLine(ms));
  }, {category: ['adding and removing']});

  add.method('setPotentialCells', function (ms) {
    this.setPotentialContentMorphs(this._tableContent.copyWithSoleLine(ms));
  }, {category: ['adding and removing']});

  add.method('addCell', function (m) {
    this.replaceContentWith(this._tableContent.copyAndAddElement(m));
  }, {category: ['adding and removing']});

  add.method('removeCell', function (m) {
    this.replaceContentWith(this._tableContent.copyAndRemoveElement(m));
  }, {category: ['adding and removing']});

  add.method('makeContentMorphsHaveLayoutModes', function (layoutModes) {
    // aaa - kind of a hack, but better than having it directly in the TreeNodeMorph code
    this._layoutModesForContentMorphs = layoutModes;
    return this;
  }, {category: ['layout']});

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


thisModule.addSlots(avocado.tableContents, function(add) {
  
  add.data('rowPrototype', avocado.tableContents.create([], avocado.directions.vertical), {initializeTo: 'avocado.tableContents.create([], avocado.directions.vertical)'});
  
  add.data('columnPrototype', avocado.tableContents.create([], avocado.directions.horizontal), {initializeTo: 'avocado.tableContents.create([], avocado.directions.horizontal)'});
  
  add.method('newMorph', function () {
    var world = WorldMorph.current();
    var morphsTable = this.map(function(model) { return world.morphFor(model); });
    var m = new avocado.TableMorph();
    m.replaceContentWith(morphsTable);
    m.shape.roundEdgesBy(10);
    m.closeDnD();
    return m;
  }, {category: ['user interface']});
  
});


thisModule.addSlots(HandMorph.prototype, function(add) {

  add.data('shouldNotBePartOfRowOrColumn', true);

});


thisModule.addSlots(HandleMorph.prototype, function(add) {

  add.data('shouldNotBePartOfRowOrColumn', true);

});


});
