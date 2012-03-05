avocado.transporter.module.create('general_ui/slides', function(requires) {

}, function(thisModule) {


thisModule.addSlots(avocado, function(add) {
  
  add.creator('signpost', {}, {category: ['signposts']});
  
});


thisModule.addSlots(avocado.signpost, function(add) {
  
  add.method('create', function () {
    var c = Object.create(this);
    c.initialize.apply(c, arguments);
    return c;
  }, {category: ['creating']});

  add.method('initialize', function (description) {
    this._description = description;
    this._links = [];
  }, {category: ['creating']});

  add.method('description', function () {
    return this._description || "";
  }, {category: ['accessing']});

  add.method('toString', function () {
    return this.description();
  }, {category: ['printing']});

  add.method('inspect', function () {
    return this.toString();
  }, {category: ['printing']});

  add.method('links', function () {
    return this._links;
  }, {category: ['accessing']});

  add.method('addLink', function (link) {
    this.links().push(link);
    var m = this.existingMorph();
    if (m) { this.addLinkButton(m, link); }
    return this;
  }, {category: ['accessing']});

  add.method('comesAfter', function (prev) {
    this.addLink({name: "Previous", target: prev, label: '<-', position: function(button, morph) { return pt(5, 5); }});
    prev.addLink({name: "Next",     target: this, label: '->', position: function(button, morph) { return pt(morph.getExtent().x - button.getExtent().x - 5, 5); }});
    return this;
  }, {category: ['linking']});

  add.method('existingMorph', function () {
    return avocado.ui.currentWorld().existingMorphFor(this);
  }, {category: ['user interface']});

  add.method('createMorph', function () {
    var m = avocado.ui.newMorph(avocado.ui.shapeFactory.newRectangle(pt(0,0).extent(pt(800, 600))));
    m.applyStyle(this.defaultStyle);
    return m;
  }, {category: ['user interface']});

  add.method('beModelOfMorph', function (morph, world) {
    morph._model = this;
    this.addNavigationMorphsTo(morph);
    (world || avocado.ui.currentWorld()).rememberMorphFor(this, morph);
    return morph;
  }, {category: ['user interface']});
  
  add.method('addTitleLabelTo', function (morph) {
    var titleLabel = avocado.label.newMorphFor(this.description());
    titleLabel.setFontSize(48);
    titleLabel.fitText();
    titleLabel.enableEvents();
    titleLabel.suppressGrabbing = true;
    //titleLabel.grabsShouldFallThrough = true;
    titleLabel.handlesMouseDown = Functions.True;
  	titleLabel.onMouseDown = function(evt) { if (this.checkForDoubleClick(evt)) { return true; } return false; };
    titleLabel.onDoubleClick = function(evt) { morph.navigateToMe(evt); return true; };
    morph.addMorphAt(titleLabel, pt((morph.getExtent().x - titleLabel.getExtent().x) / 2, 10));
    morph._titleLabel = titleLabel;
    return this;
  }, {category: ['user interface']});
  
  add.method('addNavigationMorphsTo', function (morph) {
    this.addTitleLabelTo(morph);
    
    this.links().forEach(function(link) { this.addLinkButton(morph, link); }.bind(this));
  }, {category: ['user interface']});
  
  add.method('addLinkButton', function (morph, link) {
    var button = this.createLinkButton(link.label, link.target);
    morph.addMorphAt(button, link.position(button, morph));
  }, {category: ['user interface']});

  add.method('createLinkButton', function (contents, target) {
    return avocado.command.create(contents, function(evt) { avocado.ui.navigateTo(target, null, evt); }).newMorph().applyStyle(this.linkButtonStyle);
  }, {category: ['user interface']});
  
  add.creator('defaultStyle', {}, {category: ['user interface']});
  
  add.creator('linkButtonStyle', {}, {category: ['user interface']});
  
});


thisModule.addSlots(avocado.signpost.defaultStyle, function(add) {
  
  add.data('fillOpacity', 0);
  
  add.data('shouldIgnoreEvents', true);
  
});


thisModule.addSlots(avocado.signpost.linkButtonStyle, function(add) {
  
  add.data('fillOpacity', 0.2);
  
});


});
