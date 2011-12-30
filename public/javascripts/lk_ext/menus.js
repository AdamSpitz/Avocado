Event.addMethods({
  isForContextMenu:    function() { return (this.isLeftMouseButtonDown() && this.isCtrlDown())   || this.isRightMouseButtonDown() || this.isAltDown();  },
  isForMorphMenu:      function() { return (this.isLeftMouseButtonDown() && this.isCommandKey()) || this.isMiddleMouseButtonDown(); }
});

MenuMorph.addMethods({
  addSection: function(newItems) {
    if (newItems.size() > 0) {
      if (this.items.size() > 0) {this.addLine();}
      newItems.each(function(item) {this.addItem(item);}.bind(this));
    }
  }
});

PieMenuMorph.addMethods({
  addItem: function(item) {
    if (item) {
      this.items.push(item);
    } else {
      this.addLine();
    }
  },
  
  addLine: function() {
    // nothing to do here
  },
  
  openIn: function(parentMorph, loc, remainOnScreen, captionIfAny) { 
    // aaa - What's the right way to create a common interface between MenuMorph and PieMenuMorph?
    var evt = Event.createFake();
    evt.mousePoint = loc;
    this.open(evt);
  }
});
