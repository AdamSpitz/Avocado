avocado.transporter.module.create('general_ui/scripting', function(requires) {

}, function(thisModule) {


thisModule.addSlots(avocado, function(add) {

  add.creator('morphScripter', {}, {category: ['ui', 'scripting']});

});


thisModule.addSlots(avocado.morphScripter, function(add) {

  add.method('create', function (morph) {
    return Object.newChildOf(this, morph);
  }, {category: ['creating']});

  add.method('initialize', function (morph) {
    this._morph = morph;
  }, {category: ['creating']});

  add.method('forwardBy', function (n) {
  	var heading = this._morph.getRotation() - (Math.PI / 2);
    this._morph.translateBy(Point.polar(n, heading));
  }, {category: ['moving']});

  add.method('turnBy', function (degrees) {
    this._morph.rotateBy(degrees.toRadians());
  }, {category: ['moving']});

});


});
