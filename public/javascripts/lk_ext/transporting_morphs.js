transporter.module.create('lk_ext/transporting_morphs', function(requires) {}, function(thisModule) {


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
    if (this.shape) {
      this.initializePersistentState(this.shape);
    }

    if (this.owner) {
      this.owner.addMorphAt(this, this.getPosition());
    }

    // aaa - hack for TTT demo; this is the wrong place for this.
    if (this.worldMenuContributors) {
      var w = this.world();
      this.worldMenuContributors().each(function(c) {
        w.addApplication(c);
      }.bind(this));
    }
  }, {category: ['transporting']});

});


thisModule.addSlots(Node.prototype, function(add) {

  add.method('storeString', function () {
    var encoded = Exporter.stringify(this);
    var s = avocado.stringBuffer.create('document.importNode(new DOMParser().parseFromString(');
    s.append(encoded.inspect()).append(', "text/xml").documentElement, false)');
    return s.toString();
  }, {category: ['transporting']});

});


thisModule.addSlots(Point.prototype, function(add) {

  add.method('storeString', function () {
    return ['new Point(', this.x, ', ', this.y, ')'].join('');
  }, {category: ['transporting']});

  add.method('storeStringNeeds', function () {
    return Point.prototype;
  }, {category: ['transporting']});

});


thisModule.addSlots(Rectangle.prototype, function(add) {

  add.method('storeString', function () {
    return ['new Rectangle(', this.x, ', ', this.y, ', ', this.width, ', ', this.height, ')'].join('');
  }, {category: ['transporting']});

  add.method('storeStringNeeds', function () {
    return Rectangle.prototype;
  }, {category: ['transporting']});

});


thisModule.addSlots(Color.prototype, function(add) {

  add.method('storeString', function () {
    return ['new Color(', this.r, ', ', this.g, ', ', this.b, ')'].join('');
  }, {category: ['transporting']});

  add.method('storeStringNeeds', function () {
    return Color.prototype;
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

  add.method('storeStringNeeds', function () {
    return lively.paint.LinearGradient.prototype;
  }, {category: ['transporting']});

});


thisModule.addSlots(lively.paint.Stop.prototype, function(add) {

  add.method('storeString', function () {
    return ['new lively.paint.Stop(', this.offset(), ', ', this.color().storeString(), ')'].join('');
  }, {category: ['transporting']});

  add.method('storeStringNeeds', function () {
    return lively.paint.Stop.prototype;
  }, {category: ['transporting']});

});


thisModule.addSlots(lively.scene.Similitude.prototype, function(add) {

  add.method('storeString', function () {
    return ['new lively.scene.Similitude({a: ', this.a, ', b: ', this.b, ', c: ', this.c, ', d: ', this.d, ', e: ', this.e, ', f: ', this.f, '})'].join('');
  }, {category: ['transporting']});

  add.method('storeStringNeeds', function () {
    return lively.scene.Similitude.prototype;
  }, {category: ['transporting']});

});


});
