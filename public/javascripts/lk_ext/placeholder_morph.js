transporter.module.create('lk_ext/placeholder_morph', function(requires) {}, function(thisModule) {


thisModule.addSlots(avocado, function(add) {

  add.method('PlaceholderMorph', function PlaceholderMorph() { Class.initializer.apply(this, arguments); }, {category: ['ui']});

});


thisModule.addSlots(avocado.PlaceholderMorph, function(add) {

  add.data('superclass', Morph);

  add.creator('prototype', Object.create(Morph.prototype));

  add.data('type', 'avocado.PlaceholderMorph');

});


thisModule.addSlots(avocado.PlaceholderMorph.prototype, function(add) {

  add.data('constructor', avocado.PlaceholderMorph);

  add.method('initialize', function ($super, originalMorph) {
    $super(originalMorph.shape.copy());
		this.applyStyle(originalMorph.makeStyleSpec());
    this.applyStyle(this.defaultStyle);
    this._originalMorph = originalMorph;
    this._labelMorph = TextMorph.createLabel(originalMorph.inspect());
    this._labelMorph.setTextColor(this.defaultStyle.textColor);
    this.addMorphCentered(this._labelMorph);
  }, {category: ['creating']});
  
  add.creator('defaultStyle', {}, {category: ['styles']});
  
  add.method('commands', function () {
    var cmdList = avocado.command.list.create(this);
    cmdList.addItem({label: 'come back!', go: this.putOriginalMorphBack});
    return cmdList;
  }, {category: ['commands']});
  
  add.method('putOriginalMorphBack', function (callWhenDone) {
    if (this._puttingOriginalMorphBack) { return; }
	  this._puttingOriginalMorphBack = true;
    this.owner.animatedReplaceMorph(this, this._originalMorph, function() {
      delete this._puttingOriginalMorphBack;
      if (callWhenDone) { callWhenDone(this); }
    }.bind(this));
  }, {category: ['putting in place']});
  
  add.method('putInPlaceOfOriginalMorph', function (callWhenDone) {
    this._originalMorph.owner.replaceMorph(this._originalMorph, this);
    if (callWhenDone) { callWhenDone(this._originalMorph); }
  }, {category: ['putting in place']});

	add.method('onMouseDown', function($super, evt) {
	  this.putOriginalMorphBack();
	  return $super(evt);
	}, {category: ['event handling']});

	add.method('handlesMouseDown', function(evt) {
	  return true;
	}, {category: ['event handling']});

});


thisModule.addSlots(avocado.PlaceholderMorph.prototype.defaultStyle, function(add) {
  
  add.data('fill', Color.black);

  add.data('fillOpacity', 0.1);
  
  add.data('openForDragAndDrop', false);
  
  add.data('suppressGrabbing', true);
  
  add.data('grabsShouldFallThrough', false, {comment: 'Otherwise clicking on it doesn\'t work.'});
  
  add.data('textColor', new Color(0.5, 0.5, 0.5));
  
});


});
