avocado.transporter.module.create('general_ui/highlighting', function(requires) {

requires('general_ui/basic_morph_mixins');

}, function(thisModule) {


thisModule.addSlots(avocado.morphMixins.Morph, function(add) {

  add.method('styleWhenHighlighted', function () {
    if (this._stylist) { return this._stylist.styleWhenHighlighted(this); }
    
    if (! this._styleBeforeHighlighting.fill) {
      return {
        fill: Color.white,
        fillOpacity: 0.7
      };
    } else {
      return {
        fill: this._styleBeforeHighlighting.fill.mixedWith(Color.white, 0.7)
      };
    }
  }, {category: ['highlighting']});

  add.method('beHighlighted', function () {
    if (!this._styleBeforeHighlighting) {
      this._styleBeforeHighlighting = this.makeStyleSpec();
      var newStyle = this.styleWhenHighlighted();
      this.applyStyle(newStyle);
    }
  }, {category: ['highlighting']});

  add.method('beUnhighlighted', function () {
    if (this._styleBeforeHighlighting) {
      this.applyStyle(this._styleBeforeHighlighting);
      delete this._styleBeforeHighlighting;
    }
  }, {category: ['highlighting']});

  add.method('isHighlighted', function () {
    return !! this._styleBeforeHighlighting;
  }, {category: ['highlighting']});

  add.method('setHighlighting', function (shouldBeOn) {
    if (shouldBeOn) {
      this.beHighlighted();
    } else {
      this.beUnhighlighted();
    }
  }, {category: ['highlighting']});

});


thisModule.addSlots(avocado.morphMixins.WorldMorph, function(add) {

  add.method('beHighlighted', function () {
    // Don't highlight the world.;
  }, {category: ['highlighting']});

  add.method('beUnhighlighted', function () {
    // Don't highlight the world.;
  }, {category: ['highlighting']});

});


});
