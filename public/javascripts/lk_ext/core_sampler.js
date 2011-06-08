avocado.transporter.module.create('lk_ext/core_sampler', function(requires) {

requires('lk_ext/rows_and_columns');

}, function(thisModule) {


thisModule.addSlots(avocado, function(add) {

  add.method('CoreSamplerMorph', function CoreSamplerMorph() { Class.initializer.apply(this, arguments); }, {category: ['ui']});

});


thisModule.addSlots(avocado.CoreSamplerMorph, function(add) {

  add.data('superclass', avocado.ColumnMorph);

  add.data('type', 'avocado.CoreSamplerMorph');

  add.creator('prototype', Object.create(avocado.ColumnMorph.prototype));

});


thisModule.addSlots(avocado.CoreSamplerMorph.prototype, function(add) {

  add.data('constructor', avocado.CoreSamplerMorph);

  add.method('initialize', function ($super) {
    $super();
    this.setFill(lively.paint.defaultFillWithColor(Color.gray.darker()));
    this.setPadding(10);
    this.closeDnD();

    var crosshairCenter = pt(-40,-40);
    var radius = 10;
    var connectorLength = 40 - (radius / Math.sqrt(2));
    this._connector = Morph.makeLine([pt(0,0), pt(-connectorLength, -connectorLength)], 4, Color.black).ignoreEvents();
    this._connector.shouldNotBePartOfRowOrColumn = true;
    this.addMorph(this._connector);

    this._circle = Morph.makeCircle(crosshairCenter.copy(), 10, 1, Color.black).ignoreEvents();
    this._circle.setFill(null);
    this._circle.shouldNotBePartOfRowOrColumn = true;
    this.addMorph(this._circle);

    this._crosshairLine1 = Morph.makeLine([pt(-radius, 0), pt(radius, 0)], 1, Color.black).ignoreEvents();
    this._crosshairLine2 = Morph.makeLine([pt(0, -radius), pt(0, radius)], 1, Color.black).ignoreEvents();
    this._crosshairLine1.shouldNotBePartOfRowOrColumn = true;
    this._crosshairLine2.shouldNotBePartOfRowOrColumn = true;
    this.addMorphAt(this._crosshairLine1, crosshairCenter.addXY(-radius, 0));
    this.addMorphAt(this._crosshairLine2, crosshairCenter.addXY(0, -radius));

    this._crosshairMorphs = [this._circle, this._crosshairLine1, this._crosshairLine2];

    this._placeholderForWhenEmpty = new Morph(new lively.scene.Rectangle(pt(0,0).extent(pt(40,30))));
    this._placeholderForWhenEmpty.setFill(null);
    this._placeholderForWhenEmpty.ignoreEvents();

    this.refreshContent();
    this.startPeriodicallyUpdating();
  }, {category: ['creating']});

  add.method('refreshContent', function () {
    var w = this.world();
    if (w) {
      var p = this.worldPoint(this._circle.bounds().center());
      var evt = Event.createFake();
      evt.mousePoint = p;
      var topmostMorph = w.morphToReceiveEvent(evt);
      if (topmostMorph) {
        //console.log("Core sampler found morph " + reflect(topmostMorph).name());
        var morphs = topmostMorph.ownerChain().reverse(); // topmostMorph should be first
        var morphSummaries = [];
        w.eachMorphAt(p, function(m) {
          if (! this._crosshairMorphs.include(m)) {
            var summary = avocado.RowMorph.createSpaceFilling([TextMorph.createLabel(reflect(m).name())]).enableEvents();
            summary.grabsShouldFallThrough = true;
            summary.contextMenu = m.morphMenu.bind(m);
            morphSummaries.push(summary);
          }
        }.bind(this));
        if (morphSummaries.size() > 0) {
          this.setRows(morphSummaries);
        } else {
          this.setRows([this._placeholderForWhenEmpty]);
        }
      } else {
        this.setRows([this._placeholderForWhenEmpty]);
      }
    } else {
      this.setRows([this._placeholderForWhenEmpty]);
    }
  }, {category: ['updating']});

  add.method('dropMeOnMorph', function ($super, receiver) {
    $super(receiver);
    this.refreshContentOfMeAndSubmorphs(); // because I'm impatient;
  }, {category: ['drag and drop']});

  add.data('suppressHandles', true, {category: ['handles']});

});


thisModule.addSlots(Morph.prototype, function(add) {

  add.method('eachMorphAt', function (p, iterator) {
    if (!this.fullContainsWorldPoint(p)) return;
    
    for (var i = this.submorphs.length - 1; i >= 0; --i) {
      this.submorphs[i].eachMorphAt(p, iterator);
    }
    
    // Check if it's really in this morph (not just fullBounds)
    if (this.containsWorldPoint(p)) {
      iterator(this);
    }
  }, {category: ['drilling']});

});


});
