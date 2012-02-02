avocado.transporter.module.create('lk_ext/placeholder_morph', function(requires) {

}, function(thisModule) {


thisModule.addSlots(avocado, function(add) {
  
  add.creator('placeholder', {});

  add.method('PlaceholderMorph', function PlaceholderMorph() { Class.initializer.apply(this, arguments); }, {category: ['ui']});

});


thisModule.addSlots(avocado.placeholder, function(add) {
  
  add.method('create', function () {
    var p = Object.create(this);
    p.initialize.apply(p, arguments);
    return p;
  }, {category: ['creating']});

  add.method('initialize', function (o) {
    this._realObject = o;
  }, {category: ['creating']});

  add.method('toString', function () {
    return this._realObject.toString();
  }, {category: ['printing']});
  
  add.method('newMorph', function () {
    return new avocado.PlaceholderMorph(WorldMorph.current().morphFor(this._realObject)).setModel(this);
  }, {category: ['user interface']});
  
});


thisModule.addSlots(avocado.PlaceholderMorph, function(add) {

  add.data('superclass', Morph);

  add.data('type', 'avocado.PlaceholderMorph');

  add.creator('prototype', Object.create(Morph.prototype));

});


thisModule.addSlots(avocado.PlaceholderMorph.prototype, function(add) {

  add.data('constructor', avocado.PlaceholderMorph);

  add.method('initialize', function ($super, originalMorphOrFn) {
    $super(avocado.ui.shapeFactory.newRectangle(pt(0,0).extent(pt(150,100))));
    this._originalMorphOrFn = originalMorphOrFn;
    this._labelMorph = avocado.label.newMorphFor("");
    this._labelMorph.setTextColor(this.defaultStyle.textColor);
    this.refreshContent();
  }, {category: ['creating']});

  add.creator('defaultStyle', {}, {category: ['styles']});

  add.method('originalMorph', function () {
    var m = typeof(this._originalMorphOrFn) === 'function' ? this._originalMorphOrFn() : this._originalMorphOrFn;
    m.refreshContentOfMeAndSubmorphsIfNeverRefreshedBefore();
    return m;
  }, {category: ['accessing']});
  
  add.method('relatedMorphs', function () { return [this.originalMorph()]; });
  
  add.method('toString', function () {
    return "placeholder for " + this.originalMorph();
  }, {category: ['printing']});
  
  add.method('refreshContent', function () {
    var originalMorph = this.originalMorph();
    this.setShape(originalMorph.shape.copy());
		this.applyStyle(originalMorph.makeStyleSpec());
    this.applyStyle(this.defaultStyle);
    this._labelMorph.setText(originalMorph.inspect());
    this.addMorphCentered(this._labelMorph);
    this.minimumExtentMayHaveChanged();
  }, {category: ['updating']});

  add.method('commands', function () {
    var cmdList = avocado.command.list.create(this);
    cmdList.addItem(avocado.command.create('come back!', function(evt) { this.putOriginalMorphBack(); }));
    return cmdList;
  }, {category: ['commands']});

  add.method('putOriginalMorphBack', function (callWhenDone) {
    if (this._puttingOriginalMorphBack) { return; }
	  this._puttingOriginalMorphBack = true;
	  var originalMorph = this.originalMorph();
    this.owner.animatedReplaceMorph(this, originalMorph, function() {
      delete originalMorph._placeholderMorphIJustCameFrom;
      originalMorph.refreshContentOfMeAndSubmorphs();
      delete this._puttingOriginalMorphBack;
      if (callWhenDone) { callWhenDone(this); }
    }.bind(this));
  }, {category: ['putting in place']});

  add.method('putOriginalMorphBackWithoutAnimation', function () {
	  var originalMorph = this.originalMorph();
    this.owner.replaceMorph(this, originalMorph);
    delete originalMorph._placeholderMorphIJustCameFrom;
    originalMorph.refreshContentOfMeAndSubmorphs();
  }, {category: ['putting in place']});

  add.method('putInPlaceOfOriginalMorph', function () {
	  var originalMorph = this.originalMorph();
    originalMorph.owner.replaceMorph(originalMorph, this);
    originalMorph._placeholderMorphIJustCameFrom = this;
  }, {category: ['putting in place']});

  add.method('onMouseDown', function ($super, evt) {
		if (this.checkForDoubleClick(evt)) {
		  return true;
		} else {
		  this.arrow._layout.toggleVisibility();
		}
	}, {category: ['event handling']});

  add.method('onDoubleClick', function (evt) {
	  this.putOriginalMorphBack();
	  return true;
	}, {category: ['event handling']});

  add.method('handlesMouseDown', function (evt) {
	  return true;
	}, {category: ['event handling']});

});


thisModule.addSlots(avocado.PlaceholderMorph.prototype.defaultStyle, function(add) {

  add.data('fillOpacity', 0.2);

  add.data('openForDragAndDrop', false);

  add.data('suppressGrabbing', true);

  add.data('suppressHandles', true);

  add.data('grabsShouldFallThrough', false, {comment: 'Otherwise clicking on it doesn\'t work.'});

  add.data('textColor', new Color(0.5, 0.5, 0.5));

});


thisModule.addSlots(Morph.prototype, function(add) {

  add.method('doIOrMyOwnersWantToLeaveAPlaceholderWhenRemovingMe', function () {
    return this.doIOrMyOwnersWantToLeaveAPlaceholderWhenRemoving(this);
  }, {category: ['placeholders']});

  add.method('doIOrMyOwnersWantToLeaveAPlaceholderWhenRemoving', function (m) {
    if (this.doIWantToLeaveAPlaceholderWhenRemoving(m)) { return true; }
    return this.owner && this.owner.doIOrMyOwnersWantToLeaveAPlaceholderWhenRemoving(m);
  }, {category: ['placeholders']});

  add.method('doIWantToLeaveAPlaceholderWhenRemoving', function (m) {
    // can override in children
    return false;
  }, {category: ['placeholders']});

});


});
