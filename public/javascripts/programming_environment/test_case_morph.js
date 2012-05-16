avocado.transporter.module.create('programming_environment/test_case_morph', function(requires) {

requires('general_ui/table_layout');
requires('core/testFramework');

}, function(thisModule) {


thisModule.addSlots(avocado.testCase, function(add) {

  add.method('newMorph', function () {
    var m = avocado.treeNode.newMorphFor(this, this.defaultMorphStyle);
    m.typeName = 'test case';
    m.refreshContentOfMeAndSubmorphs();
    m.startPeriodicallyUpdating();
    return m;
  }, {category: ['user interface']});

  add.creator('defaultMorphStyle', Object.create(avocado.table.boxStyle), {category: ['user interface']});

  add.method('updateStyleOfMorph', function (m, result) {
    result = result || m._model.result(); // allow the result to be passed in, so we can use this to update related morphs that don't actually have a _model
    if (result && result.hasFinished()) {
      if (result.anyFailed()) {
        m.setFillBase(avocado.testCase.singleResult.failedMorphStyle.fillBase);
      } else {
        m.setFillBase(avocado.testCase.singleResult.defaultMorphStyle.fillBase);
      }
    } else {
      m.setFillBase(avocado.testCase.defaultMorphStyle.fillBase);
    }
  }, {category: ['user interface']});

  add.method('shouldPutHeaderOnLeftInsteadOfTop', function () {
    // just for fun, to see if this works OK
    return false;
  }, {category: ['user interface']});

  add.method('contentsPanelExtent', function () {
    if (this.shouldPutHeaderOnLeftInsteadOfTop()) {
      return pt(30, 20);
    } else {
      return avocado.treeNode.defaultExtent();
    }
  }, {category: ['user interface']});

});


thisModule.addSlots(avocado.testCase.defaultMorphStyle, function(add) {

  add.data('fillBase', new Color(0.5, 0.5, 0.5));

});


thisModule.addSlots(avocado.testCase.suite, function(add) {

  add.method('newMorph', function () {
    var m = avocado.treeNode.newMorphFor(this, this.defaultMorphStyle);
    m.typeName = 'test suite';
    
    
    // aaa - just an experiment
    if (this._shouldBeDisplayedAsOneLongRow) {
      var cp = avocado.treeNode.actualContentsPanelForMorph(m);
      cp.layout().cleaningUpPoseFor = function (contentMorphs) {
        return this._morph.poseManager().rowPose(contentMorphs);
      };
    }
    
    
    m.refreshContentOfMeAndSubmorphs();
    m.startPeriodicallyUpdating();
    return m;
  }, {category: ['user interface']});

  add.creator('defaultMorphStyle', Object.create(avocado.table.boxStyle), {category: ['user interface']});

  add.method('contentsPanelExtent', function () {
    if (this._shouldBeDisplayedAsOneLongRow) {
      return pt(200, 6);
    } else {
      return avocado.treeNode.defaultExtent();
    }
  }, {category: ['user interface']});

  add.method('updateStyleOfMorph', function (m) {
    avocado.testCase.updateStyleOfMorph(m);
  }, {category: ['user interface']});

});


thisModule.addSlots(avocado.testCase.suite.defaultMorphStyle, function(add) {

  add.data('fillBase', new Color(0.5, 0.5, 0.5));

});


thisModule.addSlots(avocado.testCase.resultHistory, function(add) {

  add.method('newMorph', function () {
    var m = avocado.table.newColumnMorph().setModel(this);
    m.applyStyle(this.defaultMorphStyle);
    
    m._headerRow = avocado.table.createSpaceFillingRowMorph([m.findOrCreateTitleLabel()], avocado.treeNode.headerRowPadding).enableEvents(); // aaa DO NOT enableEvents(), not sure what to do, but needed to make links work
    //m._immediateContentsMorph = avocado.ui.currentWorld().morphFor(this.immediateContents()).setFill(null);
    m._immediateContentsMorph = avocado.table.newTableMorph().setFill(null);
    m._immediateContentsMorph.setPotentialContentMorphsFunction(function () {
      return this.immediateContents().map(function(t) { return t ? avocado.ui.currentWorld().morphFor(t) : avocado.ui.newMorph().beInvisible(); });
    }.bind(this));
    m._immediateContentsMorph.layout().setDesiredSpace(pt(800, null));
    m._immediateContentsMorph.doIWantToLeaveAPlaceholderWhenRemoving = function (m) { return true; };
    m._immediateContentsMorph.layout()._overrideSubmorphLayoutModes = pt(null, avocado.LayoutModes.SpaceFill);
    
    this._interestingTestsModel  = this.createInterestingEntriesList();
    var interestingTestsContainer = m._morphForViewingThingsInMoreDetail = avocado.ui.currentWorld().morphFor(this._interestingTestsModel);
    var interestingTestsHeaderRow = avocado.table.createSpaceFillingRowMorph([interestingTestsContainer.findOrCreateTitleLabel()], Object.extend(Object.create(avocado.treeNode.headerRowPadding), {top: 15})).enableEvents(); // aaa DO NOT enableEvents(), not sure what to do, but needed to make links work
    
    var selectedTests = avocado.groupOfSimilarObjects.create([]); // .beVertical();
    this._reallyInterestingTestsModel = this.createInterestingEntriesList();
    this._reallyInterestingTestsModel.titleModel().setContent(avocado.testCase.subset.create(this, null, "selected", avocado.enumerator.create(selectedTests, 'eachObject')));
    m._reallyInterestingTestsContainer = interestingTestsContainer._morphForViewingThingsInMoreDetail = avocado.ui.currentWorld().morphFor(selectedTests);
    m._reallyInterestingTestsContainer.layout().doNotCenter();
    //m._reallyInterestingTestsContainer.layout()._overrideSubmorphLayoutModes = pt(avocado.LayoutModes.SpaceFill, avocado.LayoutModes.SpaceFill);
    m._reallyInterestingTestsTitleLabel = this._reallyInterestingTestsModel.titleModel().newMorph();
    m._reallyInterestingTestsHeaderRow  = avocado.table.createSpaceFillingRowMorph([m._reallyInterestingTestsTitleLabel], Object.extend(Object.create(avocado.treeNode.headerRowPadding), {top: 15})).enableEvents(); // aaa DO NOT enableEvents(), not sure what to do, but needed to make links work
    
    m._layout.setCells([m._headerRow, m._immediateContentsMorph, interestingTestsHeaderRow, ScrollPane.containing(interestingTestsContainer, pt(800, 400)), /* doesn't actually say anything useful yet: m._reallyInterestingTestsHeaderRow, */ ScrollPane.containing(m._reallyInterestingTestsContainer, pt(800, 400))]);
    
    return m;
  }, {category: ['user interface']});

  add.creator('defaultMorphStyle', Object.create(avocado.table.boxStyle), {category: ['user interface']});

  add.method('showInterestingSubset', function (evt, subset, linkNode) {
    var world = avocado.ui.worldFor(evt);
    var historyMorph = world.morphFor(this);
    
    if (historyMorph._selectedSummaryLinkNode) { historyMorph._selectedSummaryLinkNode.setAttribute("class", "summaryLink"); }
    historyMorph._selectedSummaryLinkNode = linkNode;
    historyMorph._selectedSummaryLinkNode.setAttribute("class", "highlightedSummaryLink");
    
    var morphsToShow = subset.tests().toArray().map(function(entry) { return world.morphFor(entry); });
    historyMorph.pullMorphsCloser(morphsToShow, subset);
  }, {category: ['user interface']});

});


thisModule.addSlots(avocado.testCase.resultHistory.defaultMorphStyle, function(add) {

  add.data('fillBase', new Color(0.8, 0.8, 0.8));

});


thisModule.addSlots(avocado.testCase.resultHistory.interestingEntriesProto, function(add) {

  add.method('newMorph', function () {
    var m = avocado.ui.newMorph(avocado.ui.shapeFactory.newRectangle(new Rectangle(0, 0, 600, 400))).beInvisible().beShrinkWrapping();
    m.setModel(this);

    /*
    Let's try a tree pose instead.
    var pose = avocado.poses.list.create("interesting entries").setPadding(pt(10, 10)).setDesiredPoserScale(1);
    pose.setDirection(avocado.directions.horizontal).setMaxExtent(function() { return m.getExtent().withY(null); });
    */
    var parentOf = function(m) { var p = m._model.parent && m._model.parent(); return p ? avocado.ui.currentWorld().morphFor(p) : null; };
    var childrenOf = function(m) { return m._model.children ? m._model.children().map(function(childTest) { return avocado.ui.currentWorld().morphFor(childTest); }) : []; };
    var pose = avocado.poses.tree.create("interesting entries", [], parentOf, childrenOf).setPadding(pt(10, 10)).setDesiredPoserScale(1);
    
    pose.doNotAnticipateAtStart().doNotWiggleAtEnd().whenDoneSetExtentToEncompassWholePose();
    m.setLayout(Object.newChildOf(avocado.poses.layout, pose));
    
    m.doIWantToLeaveAPlaceholderWhenRemoving = function (sm) { return false; };
    return m;
  }, {category: ['user interface']});

});


thisModule.addSlots(avocado.testCase.singleResult, function(add) {

  add.method('newMorph', function () {
    return avocado.messageNotifier.create(this.toString(), Color.gray).newMorph().setModel(this);
  }, {category: ['user interface']});

  add.method('updateStyleOfMorph', function (m) {
    avocado.testCase.updateStyleOfMorph(m);
  }, {category: ['user interface']});

  add.creator('defaultMorphStyle', {}, {category: ['user interface']});

  add.creator('failedMorphStyle', {}, {category: ['user interface']});

});


thisModule.addSlots(avocado.testCase.singleResult.defaultMorphStyle, function(add) {

  add.data('fillBase', new Color(0, 0.8, 0.6));

});


thisModule.addSlots(avocado.testCase.singleResult.failedMorphStyle, function(add) {

  add.data('fillBase', new Color(0.8, 0.3, 0));

});


});
