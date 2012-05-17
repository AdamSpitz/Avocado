avocado.transporter.module.create('core/dom_stuff', function(requires) {

}, function(thisModule) {


thisModule.addSlots(avocado, function(add) {

  add.creator('DOMStuff', {}, {category: ['DOM stuff']});

});


thisModule.addSlots(avocado.DOMStuff, function(add) {

  add.method('isDOMNode', function (o) {
    // http://stackoverflow.com/questions/384286/javascript-isdom-how-do-you-check-if-a-javascript-object-is-a-dom-object
    try {
      if (!o) { return false; }
      
      if (typeof Node === "object" && o instanceof Node) { return true; }
      if (typeof o === "object" && typeof o.nodeType === "number" && typeof o.nodeName === "string") { return true; }
    } catch (ex) {
      // Firefox sometimes throws an exception here. Don't know why.
    }
    return false;
  });

  add.method('isDOMElement', function (o) {
    try {
      if (!o) { return false; }
      
      if (typeof HTMLElement       === "object" && o instanceof HTMLElement          ) { return true; }
      if (typeof HTMLIFrameElement === "object" && o instanceof HTMLIFrameElement    ) { return true; }
      if (typeof o === "object" && o.nodeType === 1 && typeof o.nodeName === "string") { return true; }
    } catch (ex) {
      // Firefox sometimes throws an exception here. Don't know why.
    }
    return false;
  });

});


thisModule.addSlots(Node.prototype, function(add) {

  add.method('removeAllChildren', function () {
    if (this.hasChildNodes()) {
      while (this.childNodes.length > 0) {
        this.removeChild(this.firstChild);
      }
    }
    return this;
  }, {category: ['removing']});

  add.method('copy', function () {
    // aaa - There's probably a better way to do this. Heck, I'm not even completely sure this works right in all cases. -- Adam
    var thisNodeAsString = new XMLSerializer().serializeToString(this);
    return new DOMParser().parseFromString(thisNodeAsString, "text/xml").documentElement;
  }, {category: ['copying']});

  add.method('storeStringWithoutChildren', function () {
    return this.copy().removeAllChildren().storeStringIncludingChildren();
  }, {category: ['printing']});

  add.method('storeStringIncludingChildren', function () {
    return [
      'document.importNode(new DOMParser().parseFromString(',
      new XMLSerializer().serializeToString(this).inspect(),
      ', "text/xml").documentElement, false)'
    ].join('');
  }, {category: ['printing']});

});


});
