avocado.transporter.module.create('general_ui/placeholder_morph', function(requires) {

requires('general_ui/basic_morph_mixins');

}, function(thisModule) {


thisModule.addSlots(avocado, function(add) {

  add.creator('placeholder', {});

});


thisModule.addSlots(avocado.placeholder, function(add) {

  add.method('newPlaceholderMorphForMorph', function (originalMorphOrFn) {
    var placeholderMorph = avocado.ui.newMorph(avocado.ui.shapeFactory.newRectangle(pt(0,0).extent(avocado.treeNode.defaultExtent())));
    placeholderMorph.setLayout(Object.newChildOf(avocado.placeholder.layout, placeholderMorph, originalMorphOrFn));
    placeholderMorph.setEventHandler(avocado.placeholder.eventHandler);
    return placeholderMorph;
  }, {category: ['user interface']});

  add.method('newPlaceholderMorphForSlot', function (slot) {
    var m = avocado.placeholder.newPlaceholderMorphForMorph(function() { return avocado.ui.currentWorld().morphFor(slot.contents()); });
    m._arrow = avocado.arrow.newMorphFor(slot, m, null);
    return m;
  }, {category: ['user interface']});

  add.creator('defaultStyle', {}, {category: ['styles']});

  add.creator('layout', {}, {category: ['user interface']}, {comment: 'This doesn\'t really seem like a "layout", but I\'m not sure what it is.'});

  add.creator('eventHandler', {}, {category: ['user interface']});

});


thisModule.addSlots(avocado.placeholder.defaultStyle, function(add) {

  add.data('fillOpacity', 0.2);

  add.data('openForDragAndDrop', false);

  add.data('suppressGrabbing', true);

  add.data('suppressHandles', true);

  add.data('grabsShouldFallThrough', false, {comment: 'Otherwise clicking on it doesn\'t work.'});

  add.data('textColor', new Color(0.5, 0.5, 0.5));

});


thisModule.addSlots(avocado.placeholder.layout, function(add) {

  add.method('initialize', function (placeholderMorph, originalMorphOrFn) {
    this._placeholderMorph = placeholderMorph;
    this._originalMorphOrFn = originalMorphOrFn;
    this._labelMorph = avocado.label.newMorphFor("").setTextColor(avocado.placeholder.defaultStyle.textColor);
    this.refreshContent();
  }, {category: ['creating']});

  add.method('refreshContent', function () {
    var originalMorph = this.originalMorph();
    this._placeholderMorph.setShape(originalMorph.getShape().copy());
		this._placeholderMorph.applyStyle(originalMorph.makeStyleSpec());
    this._placeholderMorph.applyStyle(avocado.placeholder.defaultStyle);
    this._labelMorph.setText(originalMorph.nameUsingContextualInfoIfPossible(this._placeholderMorph));
    this._labelMorph.updateStyle();
    this._placeholderMorph.addMorphCentered(this._labelMorph);
    this._placeholderMorph.minimumExtentMayHaveChanged();
  }, {category: ['updating']});

  add.method('applyStyle', function () {
  }, {category: ['styles']});

  add.method('isAffectedBy', function (operation, morph) {
    return true;
  }, {category: ['styles']});

  add.method('morphDescription', function (morph) {
    return "a placeholder";
  }, {category: ['printing']});

  add.method('minimumExtent', function () {
    var h = this._placeholderMorph.horizontalLayoutMode;
    var v = this._placeholderMorph.  verticalLayoutMode;
    var e = this._placeholderMorph.getExtent();
    if (/* h === avocado.LayoutModes.ShrinkWrap || */ h === avocado.LayoutModes.SpaceFill) { e = e.withX(this._labelMorph.getExtent().x + 10); }
    if (/* v === avocado.LayoutModes.ShrinkWrap || */ v === avocado.LayoutModes.SpaceFill) { e = e.withY(this._labelMorph.getExtent().y + 10); }
    this._placeholderMorph._cachedMinimumExtent = e;
    return e.scaleBy(this._placeholderMorph.getScale());
  }, {category: ['layout']});

  add.method('originalMorph', function () {
    var m = typeof(this._originalMorphOrFn) === 'function' ? this._originalMorphOrFn() : this._originalMorphOrFn;
    m.refreshContentOfMeAndSubmorphsIfNeverRefreshedBefore();
    return m;
  }, {category: ['accessing']});

  add.method('relatedMorphs', function () { return [this.originalMorph()]; }, {category: ['related morphs']});

  add.data('isPlaceholder', true, {category: ['testing']});

  add.method('putOriginalMorphBack', function (callWhenDone) {
    if (this._puttingOriginalMorphBack) { return; }
	  this._puttingOriginalMorphBack = true;
	  var originalMorph = this.originalMorph();
    this._placeholderMorph.getOwner().animatedReplaceMorph(this._placeholderMorph, originalMorph, function() {
      delete originalMorph._placeholderMorphIJustCameFrom;
      originalMorph.refreshContentOfMeAndSubmorphs();
      delete this._puttingOriginalMorphBack;
      if (callWhenDone) { callWhenDone(this._placeholderMorph); }
    }.bind(this));
  }, {category: ['putting in place']});

  add.method('putOriginalMorphBackWithoutAnimation', function () {
	  var originalMorph = this.originalMorph();
    this._placeholderMorph.getOwner().replaceMorph(this._placeholderMorph, originalMorph);
    delete originalMorph._placeholderMorphIJustCameFrom;
    originalMorph.refreshContentOfMeAndSubmorphs();
  }, {category: ['putting in place']});

  add.method('putInPlaceOfOriginalMorph', function () {
	  var originalMorph = this.originalMorph();
    originalMorph.getOwner().replaceMorph(originalMorph, this._placeholderMorph);
    originalMorph._placeholderMorphIJustCameFrom = this._placeholderMorph;
  }, {category: ['putting in place']});

  add.method('addExtraMorphMenuItemsTo', function (cmdList) {
    if (this._placeholderMorph._arrow) { this._placeholderMorph._arrow._layout.addArrowGrabbingCommandTo(cmdList); }
    cmdList.addItem(avocado.command.create('bring it here', function(evt) { this.putOriginalMorphBack(); }, this));
    cmdList.addItem(avocado.command.create('take me there', function(evt) { this.originalMorph().navigateToMe(evt); }, this));
  }, {category: ['commands']});

});


thisModule.addSlots(avocado.placeholder.eventHandler, function(add) {

  add.method('onMouseDown', function (morph, evt) {
	  if (morph._arrow) {
		  morph._arrow.layout().toggleVisibility();
	  }
	});

  add.method('onDoubleClick', function (morph, evt) {
	  morph.layout().originalMorph().navigateToMe(evt);
	  return true;
	});

});


thisModule.addSlots(avocado.morphMixins.Morph, function(add) {

  add.method('doIOrMyOwnersWantToLeaveAPlaceholderWhenRemovingMe', function () {
    return this.doIOrMyOwnersWantToLeaveAPlaceholderWhenRemoving(this);
  }, {category: ['placeholders']});

  add.method('doIOrMyOwnersWantToLeaveAPlaceholderWhenRemoving', function (m) {
    if (this.doIWantToLeaveAPlaceholderWhenRemoving(m)) { return this; }
    return this.getOwner() && this.getOwner().doIOrMyOwnersWantToLeaveAPlaceholderWhenRemoving(m);
  }, {category: ['placeholders']});

  add.method('doIWantToLeaveAPlaceholderWhenRemoving', function (m) {
    // can override in children
    return null;
  }, {category: ['placeholders']});

  add.method('hasPlaceholderToGoBackTo', function () {
    return !!this._placeholderMorphIJustCameFrom;
  }, {category: ['placeholders']});

  add.method('goBackToPlaceholder', function (callWhenDone) {
    this._placeholderMorphIJustCameFrom.layout().putOriginalMorphBack(callWhenDone);
  }, {category: ['placeholders']});

});


});
