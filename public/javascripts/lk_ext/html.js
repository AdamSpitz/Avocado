avocado.transporter.module.create('lk_ext/html', function(requires) {

}, function(thisModule) {


thisModule.addSlots(avocado, function(add) {

  add.creator('html', {}, {category: ['user interface']});

});


thisModule.addSlots(avocado.html, function(add) {

  add.creator('layout', {});

  add.method('create', function () {
    var h = Object.create(this);
    h.initialize.apply(h, arguments);
    return h;
  }, {category: ['creating']});

  add.method('initialize', function (contents) {
    this._contents = contents;
  }, {category: ['creating']});

  add.method('setInitialBounds', function (b) {
    this._initialBounds = b;
    return this;
  }, {category: ['user interface']});

  add.method('setMaxExtent', function (e) {
    this._maxExtent = e;
    return this;
  }, {category: ['user interface']});

  add.method('newMorph', function () {
    return this.newMorphWithBounds(this._initialBounds || new Rectangle(0, 0, 200, 50), this._maxExtent, this, this._contents);
  }, {category: ['user interface']});

  add.method('newMorphWithBounds', function (initialBounds, maxExtent, model, contents) {
    var htmlMorph = avocado.ui.newMorph(avocado.ui.shapeFactory.newRectangle(initialBounds));
    htmlMorph.setFill(null);
    htmlMorph.setLayout(Object.newChildOf(avocado.html.layout, htmlMorph, initialBounds));
    htmlMorph.mouseHandler = MouseHandlerForDoingTheDefaultThing.prototype; // needed to make normal HTML events work, like clicking on links
    htmlMorph.setLayoutModes({horizontalLayoutMode: avocado.LayoutModes.Rigid, verticalLayoutMode: avocado.LayoutModes.ShrinkWrap});

    if (model) { htmlMorph.setModel(model); }
    if (contents) { htmlMorph.layout().bodyNode().appendChild(contents); }
    
    if (maxExtent) {
      return ScrollPane.containing(htmlMorph, maxExtent);
    } else {
      return htmlMorph;
    }
  }, {category: ['user interface']});

});


thisModule.addSlots(avocado.html.layout, function(add) {

  add.method('initialize', function (morph, initialBounds) {
    this._morph = morph;
    this._initialBounds = initialBounds;
    
    var bounds = this._initialBounds;
    morph.foRawNode = NodeFactory.createNS(Namespace.SVG, "foreignObject", {x: bounds.x, y: bounds.y, width: bounds.width, height: bounds.height});
    morph.addNonMorph(morph.foRawNode);
    morph.adjustForNewBounds();
    
    this._bodyNode = document.createElement("body");
    this._bodyNode.setAttribute("xmlns", "http://www.w3.org/1999/xhtml");
    morph.foRawNode.appendChild(this._bodyNode);
  }, {category: ['initializing']});

  add.method('adjustForNewBounds', function (morph) {
    var foreignObjectNode = morph.foRawNode;
    var bounds = morph.shape.bounds();
    foreignObjectNode.setAttributeNS(null, "x",      bounds.x     );
    foreignObjectNode.setAttributeNS(null, "y",      bounds.y     );
    foreignObjectNode.setAttributeNS(null, "width",  bounds.width );
    foreignObjectNode.setAttributeNS(null, "height", bounds.height);
		foreignObjectNode.x      = bounds.x;
		foreignObjectNode.y      = bounds.y;
		foreignObjectNode.width  = bounds.width;
		foreignObjectNode.height = bounds.height;
  }, {category: ['layout']});

  add.method('bodyNode', function () {
    return this._bodyNode;
  }, {category: ['accessing']});

  add.method('foreignObjectNode', function () {
    return this._morph.foRawNode;
  }, {category: ['accessing']});

  add.method('minimumExtent', function () {
    var e = this._morph.getExtent();
    var h = this._morph.horizontalLayoutMode;
    var v = this._morph.  verticalLayoutMode;
    //aaa blecch why is this causing so much trouble?
    //if (h === avocado.LayoutModes.ShrinkWrap || h === avocado.LayoutModes.SpaceFill) { e = e.withX(this.bodyNode().offsetWidth ); }
    if (v === avocado.LayoutModes.ShrinkWrap || v === avocado.LayoutModes.SpaceFill) { e = e.withY(this.bodyNode().offsetHeight); }
    if (e.y === 0) {
      e = e.withY(23);
      // The problem seems to be happening when the node isn't actually part of the document yet. I think.
      // So for now, let's just default it to the height of one line of text.
      // Maybe the right solution is to temporarily add it to the document (but maybe hidden), just so we can determine the height? I dunno.
      /*
      var n = this.foreignObjectNode();
      while (n && n !== document.body) { n = n.parentNode; }
      if (!n) { debugger; }
      */
    }
    this._morph._cachedMinimumExtent = e;
    return e.scaleBy(this._morph.getScale());
  }, {category: ['layout']});

  add.method('rejigger', function (htmlMorph, availableSpace) {
    var r = htmlMorph.rejiggerJustMyLayout(availableSpace);
    htmlMorph.adjustForNewBounds();
    return r;
  }, {category: ['layout']});

  add.method('justSetLayoutModes', function (morph) {
    if (morph.horizontalLayoutMode === avocado.LayoutModes.Rigid && morph.verticalLayoutMode === avocado.LayoutModes.ShrinkWrap) {
      // aaa - maybe nothing is necessary here?
    } else {
      //console.log("aaa finish implementing justSetLayoutModes for HTML morphs");
    }
  }, {category: ['layout']});

  add.method('refreshContent', function (morph) {
    if (typeof(morph._model.setContentsOfHTMLMorph) === 'function') {
      morph._model.setContentsOfHTMLMorph(morph);
    }
  }, {category: ['content']});

});


});
