avocado.transporter.module.create('programming_environment/category_morph', function(requires) {

requires('reflection/reflection');
requires('general_ui/tree_node');

}, function(thisModule) {


thisModule.addSlots(avocado.category.ofAParticularMirror, function(add) {

  add.method('newMorph', function () {
    return new avocado.treeNode.newMorphFor(this, undefined, 1, this.isRoot());
  }, {category: ['user interface']});

  add.method('existingMorph', function () {
    return avocado.ui.currentWorld().existingMorphFor(this);
  }, {category: ['user interface']});

  add.creator('nonZoomingStyle', Object.create(avocado.treeNode.nonZoomingStyle), {category: ['user interface', 'styles']});

  add.creator('zoomingStyle', Object.create(avocado.treeNode.zoomingStyle), {category: ['user interface', 'styles']});

  add.data('isImmutableForMorphIdentity', true, {category: ['user interface']});

  add.method('shouldContentsPanelUseZooming', function () { return !!avocado.ui.shouldMirrorsUseZooming; }, {category: ['user interface']});

  add.method('shouldUseZooming', function () { return !!avocado.ui.shouldMirrorsUseZooming; }, {category: ['user interface']});

  add.method('copyForGrabbing', function () {
    return this.copyToNewHolder();
  }, {category: ['user interface']});

  add.data('shouldCopyToNewHolderWhenDroppedOnWorld', true, {category: ['user interface']});

  add.method('titleAccessors', function () {
    return avocado.accessors.forMethods(this, 'lastPart');
  }, {category: ['user interface', 'title']});

  add.method('titleEmphasis', function () {
    return avocado.label.emphasiseses.italic;
  }, {category: ['user interface', 'title']});

  add.method('aaa_unused_createContentsSummaryMorph', function () {
    var summaryLabel = avocado.label.newMorphFor(function() {return this.ownerWithAModel()._model.contentsSummaryString();});
    // summaryLabel.setFontSize(summaryLabel.getFontSize() - 1); // aaa - why does this create a little space at the beginning of the label?
    
    // aaa - I get weird 100000-wide behaviour when I try to use just the label instead of wrapping it with a row. I'd like to know why.
    // summaryLabel.setLayoutModes({horizontalLayoutMode: avocado.LayoutModes.SpaceFill});
    // return summaryLabel;
    
    return avocado.table.createSpaceFillingRowMorph([summaryLabel], {left: 0, right: 0, top: 0, bottom: 2, between: {x: 0, y: 0}}).setScale(this.shouldUseZooming() ? 0.5 : 1.0);
  }, {category: ['user interface', 'creating']});

  add.method('addUICommandsTo', function (cmdList, morph) {
    if (this.mirror().canHaveSlots()) {
      if (!this.isRoot()) {
        var isModifiable = ! window.isInCodeOrganizingMode;

        cmdList.addItem(avocado.command.create(isModifiable ? "copy" : "move", function(evt) { this.grabCopy(evt); }, morph));

        if (isModifiable) {
          cmdList.addItem(avocado.command.create("move", function(evt) {
            this.grabCopy(evt);
            this._model.removeSlots();
            avocado.ui.justChanged(this._model.mirror());
          }, morph));
        }
      }
    }
  }, {category: ['user interface', 'commands']});

});


thisModule.addSlots(avocado.category.ofAParticularMirror.nonZoomingStyle, function(add) {

  add.data('horizontalLayoutMode', avocado.LayoutModes.SpaceFill);

  add.data('openForDragAndDrop', false);

  add.data('suppressGrabbing', false);

  add.data('grabsShouldFallThrough', true);

  add.data('fillBase', null);

});


thisModule.addSlots(avocado.category.ofAParticularMirror.zoomingStyle, function(add) {

  add.data('openForDragAndDrop', false);

  add.data('suppressGrabbing', false);

  add.data('grabsShouldFallThrough', true, {comment: 'Otherwise it\'s just too easy to accidentally mess up an object.'});

  add.data('fillBase', new Color(0.8, 0.8, 0.8));

});


});
