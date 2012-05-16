avocado.transporter.module.create('general_ui/wheel_layout', function(requires) {

requires('general_ui/basic_morph_mixins');

}, function(thisModule) {


thisModule.addSlots(avocado, function(add) {

  add.creator('wheelLayout', {}, {category: ['user interface']});

});


thisModule.addSlots(avocado.wheelLayout, function(add) {

  add.data('displayName', 'wheelLayout');

  add.method('initialize', function (morph) {
    this._morph = morph;
  }, {category: ['creating']});

  add.data('_innerRadius', 30, {category: ['geometry']});

  add.data('_outerRadius', 100, {category: ['geometry']});

  add.method('innerRadius', function () {
    return this._innerRadius;
  }, {category: ['accessing']});

  add.method('outerRadius', function () {
    return this._outerRadius;
  }, {category: ['accessing']});

  add.method('eachPosition', function (f) {
		var r = (this.innerRadius() + this.outerRadius()) * 0.575;
		var n = avocado.wheelMenu.maximumNumberOfCommands;
		for (var i = 0; i < n; ++i) {
      var p = pt(0,0);
	    if (i !== 0) {
		    var theta = ((i - 3) / (n - 1)) * (2 * Math.PI);
	      p = p.addPt(Point.polar(r * ((i % 2 === 0) ? 1 : 0.84), theta));
	    }
      f(p, i);
		}
  }, {category: ['geometry']});

  add.method('applyStyle', function (spec) {
  }, {category: ['styles']});

  add.method('adjustStyleSpec', function (spec) {
  }, {category: ['styles']});

  add.method('isAffectedBy', function (operation, morph) {
    return true;
  }, {category: ['layout']});

  add.method('createPieceShape', function (commandIndex) {
    if (commandIndex === 0) {
      // aaa LK-specific
  		return avocado.ui.shapeFactory.newCircle(pt(0, 0), this.innerRadius());
    } else {
      var thetaA = ((commandIndex - 3.5) / 8) * (2 * Math.PI);
      var thetaC = ((commandIndex - 2.5) / 8) * (2 * Math.PI);
  		return avocado.ui.shapeFactory.newPieWedge(thetaA, thetaC, this.innerRadius(), this.outerRadius() * 0.95);
    }
  }, {category: ['layout']});

  add.method('centerOfPiece', function (commandIndex) {
    if (commandIndex === 0) { return pt(0, 0); }
    return Point.polar((this.innerRadius() + this.outerRadius()) / 2, ((commandIndex - 3) / 8) * (2 * Math.PI));
  }, {category: ['layout']});

});


thisModule.addSlots(avocado.morphMixins.Morph, function(add) {

  add.method('useWheelLayout', function () {
    this.setLayout(Object.newChildOf(avocado.wheelLayout, this));
    return this;
  }, {category: ['layout']});

});


});
