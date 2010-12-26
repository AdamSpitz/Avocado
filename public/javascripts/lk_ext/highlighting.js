transporter.module.create('lk_ext/highlighting', function(requires) {}, function(thisModule) {


thisModule.addSlots(Morph.prototype, function(add) {

  add.method('styleWhenHighlighted', function () {
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
      this.applyStyle(this.styleWhenHighlighted());
    }
  }, {category: ['highlighting']});

  add.method('beUnhighlighted', function () {
    if (this._styleBeforeHighlighting) {
      this.applyStyle(this._styleBeforeHighlighting);
      delete this._styleBeforeHighlighting;
    }
  }, {category: ['highlighting']});

  add.method('setHighlighting', function (shouldBeOn) {
    if (shouldBeOn) {
      this.beHighlighted();
    } else {
      this.beUnhighlighted();
    }
  }, {category: ['highlighting']});

});


thisModule.addSlots(WorldMorph.prototype, function(add) {

  add.method('beHighlighted', function () {
    // Don't highlight the world.;
  }, {category: ['highlighting']});

  add.method('beUnhighlighted', function () {
    // Don't highlight the world.;
  }, {category: ['highlighting']});

});


});
