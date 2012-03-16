avocado.transporter.module.create('general_ui/active_sentence', function(requires) {

}, function(thisModule) {


thisModule.addSlots(avocado, function(add) {
  
  add.creator('activeSentence', {}, {category: ['user interface']});
  
});


thisModule.addSlots(avocado.activeSentence, function(add) {
  
  add.method('create', function () {
    var s = Object.create(this);
    s.initialize.apply(s, arguments);
    return s;
  }, {category: ['creating']});
  
  add.method('initialize', function (parts) {
    this._parts = parts;
  }, {category: ['creating']});

  add.method('createHTMLNodesIn', function (parentNode) {
    this._parts.forEach(function(part, i) {
      var t = typeof(part);
      var partString;
      var isActive = false;
      if (t === 'function') {
        partString = part();
      } else if (t === 'string') {
        partString = part;
      } else {
        isActive = true;
        partString = "" + part.getValue();
      }
      
      if (! isActive) {
        parentNode.appendChild(document.createTextNode(partString));
      } else {
        var link = document.createElement("a");
        link.appendChild(document.createTextNode(partString));
        link.href = "http://example.com";
        parentNode.appendChild(link);
      }
    }.bind(this));
  }, {category: ['HTML']});
  
  add.method('newMorph', function () {
    var htmlMorph = new XenoMorph(new Rectangle(0, 0, 200, 200));
    htmlMorph.applyStyle(this.htmlMorphStyle);
    htmlMorph.mouseHandler = MouseHandlerForDoingTheDefaultThing.prototype; // needed to make normal HTML events work, like clicking on links
    
    var body = document.createElement("body");
    body.setAttribute("xmlns", "http://www.w3.org/1999/xhtml");
    var div = document.createElement("div");
    this.createHTMLNodesIn(div);
    body.appendChild(div);
    htmlMorph.foRawNode.appendChild(body);
    return htmlMorph;
    
    // Wrap it in a row morph so that it can be picked up and dragged around.
    /*
    var rowMorph = avocado.table.newRowMorph().applyStyle(this.wrapperMorphStyle);
    rowMorph.layout().setCells([htmlMorph]);
    return rowMorph;
    */
  }, {category: ['user interface']});
  
  add.creator('htmlMorphStyle', {}, {category: ['user interface']});
  
  add.creator('wrapperMorphStyle', {}, {category: ['user interface']});
  
});


thisModule.addSlots(avocado.activeSentence.htmlMorphStyle, function(add) {
  
  add.data('fill', null);
  
  add.data('suppressGrabbing', true);
  
  add.data('openForDragAndDrop', false);

});


thisModule.addSlots(avocado.activeSentence.wrapperMorphStyle, function(add) {
  
  add.data('fill', new Color(0.9, 0.9, 0.9));

});


});
