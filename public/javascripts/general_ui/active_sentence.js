avocado.transporter.module.create('general_ui/active_sentence', function(requires) {

requires('general_ui/layout');

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
    this.setParts(parts);
  }, {category: ['creating']});
  
  add.method('setParts', function (parts) {
    this._parts = parts;
    return this;
  }, {category: ['accessing']});

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
        var partTextNode = document.createTextNode(partString);
        if (typeof(part.doAction) === 'function') {
          var link = document.createElement("a");
          link.appendChild(partTextNode);
          link.onclick = function(evt) { part.doAction(new Event(evt).setHand(avocado.ui.currentWorld().firstHand())); };
          link.href = "#";
          parentNode.appendChild(link);
        } else {
          parentNode.appendChild(partTextNode);
        }
      }
    }.bind(this));
  }, {category: ['HTML']});
  
  add.method('newMorph', function () {
    var htmlMorph = avocado.html.newMorphWithBounds(new Rectangle(0, 0, 400, 200)).setModel(this).applyStyle(this.htmlMorphStyle);
    this.setContentsOfHTMLMorph(htmlMorph);
    return htmlMorph;
  }, {category: ['user interface']});
  
  add.method('setContentsOfHTMLMorph', function (htmlMorph) {
    var div = document.createElement("div");
    if (this._aaa_hack_style) { div.style.cssText = this._aaa_hack_style; }
    this.createHTMLNodesIn(div);
    
    var bodyNode = htmlMorph.layout().bodyNode();
    while (bodyNode.hasChildNodes()) { bodyNode.removeChild(bodyNode.firstChild); }
    bodyNode.appendChild(div);
    
    if (this._aaa_hack_desiredScale) { htmlMorph.setScale(this._aaa_hack_desiredScale); }
  }, {category: ['user interface']});
  
  add.creator('htmlMorphStyle', {}, {category: ['user interface']});
  
});


thisModule.addSlots(avocado.activeSentence.htmlMorphStyle, function(add) {
  
  add.data('fill', null);
  
  add.data('suppressGrabbing', true);
  
  add.data('openForDragAndDrop', false);
  
  add.data('horizontalLayoutMode', avocado.LayoutModes.SpaceFill);

  add.data('verticalLayoutMode', avocado.LayoutModes.ShrinkWrap);

});


});
