transporter.module.create('lk_ext/highlighting', function(requires) {}, function(thisModule) {


thisModule.addSlots(Morph.prototype, function(add) {

  add.method('beHighlighted', function () {
    if (!this._baseFill) {
      this._baseFill = this.getFill();
      if (!this._baseFill) {
        this.setFill(Color.white);
        this.setFillOpacity(0.7);
      } else {
        this.setFill(this._baseFill.mixedWith(Color.white, 0.7));
      }
    }
  }, {category: ['highlighting']});

  add.method('beUnhighlighted', function () {
    if (this._baseFill !== undefined) {
      this.setFill(this._baseFill);
      this._baseFill = undefined;
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
