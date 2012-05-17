avocado.transporter.module.create('lk_ext/transporting_morphs', function(requires) {

requires('core/dom_stuff');

}, function(thisModule) {


thisModule.addSlots(modules['lk_ext/transporting_morphs'], function(add) {

  add.method('postFileIn', function () {
    var annotator = avocado.annotator;
    var g = lively.paint.LinearGradient;
    annotator.annotationOf(g.NorthSouth).setCreatorSlot('NorthSouth', g);
    annotator.annotationOf(g.SouthNorth).setCreatorSlot('SouthNorth', g);
    annotator.annotationOf(g.EastWest  ).setCreatorSlot('EastWest',   g);
    annotator.annotationOf(g.WestEast  ).setCreatorSlot('WestEast',   g);
    annotator.annotationOf(g.SouthWest ).setCreatorSlot('SouthWest',  g);
    annotator.annotationOf(g.SouthEast ).setCreatorSlot('SouthEast',  g);
  });

});


thisModule.addSlots(Morph.prototype, function(add) {

  add.method('postFileIn', function () {
    /* I think this should be unnecessary now that we're saving the nodes right.
    if (this.shape) {
      this.initializePersistentState(this.shape);
    }

    if (this.owner) {
      this.owner.addMorphAt(this, this.getPosition());
    }
    */

    // aaa - hack for TTT demo; this is the wrong place for this.
    if (this.worldMenuContributors) {
      var w = this.world();
      this.worldMenuContributors().each(function(c) {
        w.applicationList().addApplication(c);
      }.bind(this));
    }
  }, {category: ['transporting']});

  add.method('shouldNotBeTransported', function () {
    // Children can override.
    return false;
  }, {category: ['transporting']});

  add.method('basicMorphPropertiesStoreString', function () {
    // useful for creating storeStrings
    return ["{ owner: " + reflect(this.owner).creatorSlotChainExpression() + ", position: ", this.getPosition().storeString(), " }"].join("");
  }, {category: ['transporting']});

  add.method('setBasicMorphProperties', function (info) {
    // useful for creating storeStrings
    this.owner = info.owner;
    this.setPosition(info.position);
    return this;
  }, {category: ['transporting']});

});


thisModule.addSlots(lively.scene.Node.prototype, function(add) {

  add.method('postFileIn', function () {
    // aaa - hack, not sure why the fill node isn't getting filed in right
    if (this._fill) {
      this.setFill(this._fill);
    }
  }, {category: ['transporting']});

});


thisModule.addSlots(Color.prototype, function(add) {

  add.method('storeString', function () {
    return ['new Color(', this.r, ', ', this.g, ', ', this.b, ')'].join('');
  }, {category: ['transporting']});

});


thisModule.addSlots(TextEmphasis.prototype, function(add) {

  add.method('storeString', function () {
		var props = reflect(this).normalSlots().toArray().map(function(s) { return s.name() + ": " + Object.inspect(s.contents().reflectee()); });
    return ['new TextEmphasis({', props.join(", "), '})'].join('');
  }, {category: ['transporting']});

});


thisModule.addSlots(Text.prototype, function(add) {

  add.method('storeString', function () {
    return ['document.createTextNode(', this.textContent.inspect(), ')'].join('');
  }, {category: ['transporting']});

});


thisModule.addSlots(lively.paint.LinearGradient.prototype, function(add) {

  add.method('storeString', function () {
    return ["new lively.paint.LinearGradient([",
            this.stops.map(function(s) {return s.storeString();}).join(", "),
            "], ",
            reflect(this.vector).creatorSlotChainExpression(),
            ")"
            ].join("");
  }, {category: ['transporting']});

});


thisModule.addSlots(lively.paint.RadialGradient.prototype, function(add) {

  add.method('storeString', function () {
    return ["new lively.paint.RadialGradient([",
            this.stops.map(function(s) {return s.storeString();}).join(", "),
            "])"
            ].join("");
  }, {category: ['transporting']});

});


thisModule.addSlots(lively.paint.Stop.prototype, function(add) {

  add.method('storeString', function () {
    return ['new lively.paint.Stop(', this.offset(), ', ', this.color().storeString(), ')'].join('');
  }, {category: ['transporting']});

});


thisModule.addSlots(lively.scene.Similitude.prototype, function(add) {

  add.method('storeString', function () {
    return ['new lively.scene.Similitude({a: ', this.a, ', b: ', this.b, ', c: ', this.c, ', d: ', this.d, ', e: ', this.e, ', f: ', this.f, '})'].join('');
  }, {category: ['transporting']});

});


thisModule.addSlots(lively.Text.Font.prototype, function(add) {

  add.method('storeString', function () {
    return ['new lively.Text.Font(', this.family.inspect(), ', ', this.size, ', ', this.style.inspect(), ')'].join('');
  }, {category: ['transporting']});

});


});
