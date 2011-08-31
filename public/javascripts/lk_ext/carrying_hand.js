avocado.transporter.module.create('lk_ext/carrying_hand', function(requires) {

requires("core/hash_table");

}, function(thisModule) {


thisModule.addSlots(avocado, function(add) {

  add.method('CarryingHandMorph', function CarryingHandMorph() { Class.initializer.apply(this, arguments); }, {category: ['ui']});

});


thisModule.addSlots(avocado.CarryingHandMorph, function(add) {

  add.data('superclass', Morph);

  add.data('type', 'avocado.CarryingHandMorph');

  add.method('forWorld', function (w) {
    if (w.carryingHand) { return w.carryingHand; }
    w.carryingHand = new this(w);
    return w.carryingHand;
  });

  add.creator('prototype', Object.create(Morph.prototype));

});


thisModule.addSlots(avocado.CarryingHandMorph.prototype, function(add) {

  add.data('constructor', avocado.CarryingHandMorph);

  add.method('initialize', function ($super, w) {
    $super(new lively.scene.Ellipse(pt(0,0), 70));
    this._world = w;
    this.applyStyle(this.defaultStyle);
    this._originalPositions = Object.newChildOf(avocado.dictionary, avocado.dictionary.identityComparator);
  }, {category: ['creating']});

  add.creator('defaultStyle', {}, {category: ['styles']});

  add.data('shouldStickToScreen', true, {category: ['showing']});

  add.method('ensureVisible', function (callWhenDone) {
    if (this.owner) {
      if (callWhenDone) { callWhenDone(); }
    } else {
      this.setFillOpacity(0);
      this.setScale(1 / this._world.getScale());
      this._world.addMorphAt(this, pt(0,0));
      this.smoothlyFadeTo(0.1);
      if (callWhenDone) { callWhenDone(); }
    }
  }, {category: ['showing']});

  add.method('hideIfEmpty', function (callWhenDone) {
    if (this.submorphs.length > 0) {
      if (callWhenDone) { callWhenDone(); }
    } else {
      this.smoothlyFadeTo(0, function() { this.remove(); }.bind(this));
      if (callWhenDone) { callWhenDone(); }
    }
  }, {category: ['showing']});

  add.method('carriedMorph', function () {
    return this.submorphs[0];
  }, {category: ['accessing']});

  add.method('applicableCommandForDroppingOn', function (targetMorph) {
    var carriedMorph = this.carriedMorph();
    if (!carriedMorph) { return null; }
    return targetMorph.applicableCommandForDropping(carriedMorph);
  }, {category: ['accessing']});

  add.method('rememberOriginalPositionOf', function (m) {
    this._originalPositions.put(m, { owner: m.owner, position: m.getPosition(), scale: m.getScale() });
  }, {category: ['original positions']});

  add.method('putBackInOriginalPosition', function (m, evt, callWhenDone) {
    var originalInfo = this._originalPositions.removeKey(m);
    var originalWorldPos = originalInfo.owner.worldPoint(originalInfo.position);
    originalWorldPos.desiredScale = originalInfo.owner.overallScale(this._world) * originalInfo.scale;
    m.ensureIsInWorld(this._world, originalWorldPos, true, false, false, function() {
      originalInfo.owner.addMorphAt(m, originalInfo.position);
	    this.hideIfEmpty();
      if (callWhenDone) { callWhenDone(); }
    }.bind(this));
  }, {category: ['original positions']});
  
  add.method('pickUp', function (m, evt, callWhenDone) {
    this.ensureVisible(function() {
      this.rememberOriginalPositionOf(m);
      var extent = m.getExtent();
      var desiredSize = pt(80,80);
      var scales = pt(desiredSize.x / extent.x, desiredSize.y / extent.y);
      var desiredScale = Math.min(scales.x, scales.y);
      var finalSize = extent.scaleBy(desiredScale);
      var desiredPos = this.origin.subPt(finalSize.scaleBy(0.5));
      desiredPos.desiredScale = desiredScale;
      m.ensureIsInWorld(this._world, desiredPos, true, false, false, function() {
        this.addMorphAt(m, finalSize.scaleBy(-0.5));
        if (callWhenDone) { callWhenDone(); }
      }.bind(this));
    }.bind(this));
  }, {category: ['picking up and dropping']});

  add.method('dropOn', function (targetMorph, evt, callWhenDone) {
    var carriedMorph = this.carriedMorph();
    if (!carriedMorph) { throw new Error("No morph to drop"); }
    var c = targetMorph.applicableCommandForDropping(carriedMorph);
    if (!c) { throw new Error("Cannot drop " + carriedMorph + " on " + targetMorph); }
    
    var desiredPos = evt.point().subPt(carriedMorph.getExtent().scaleBy(0.5));
    desiredPos.desiredScale = 1;
    carriedMorph.ensureIsInWorld(this._world, desiredPos, true, false, false, function() {
	    c.go(evt, carriedMorph);
	    this.hideIfEmpty();
      if (callWhenDone) { callWhenDone(); }
    }.bind(this));
  }, {category: ['picking up and dropping']});

});


thisModule.addSlots(avocado.CarryingHandMorph.prototype.defaultStyle, function(add) {

  add.data('grabsShouldFallThrough', true);

  add.data('openForDragAndDrop', false);

  add.data('suppressGrabbing', true);

  add.data('suppressHandles', true);

  add.data('fill', new Color(0, 0, 0));

});


});
