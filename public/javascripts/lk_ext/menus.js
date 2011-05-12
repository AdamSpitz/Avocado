Morph.addMethods({
  showMorphMenu: function(evt) {
    // Disable the reflective stuff in deployed apps. -- Adam
    var isReflectionEnabled = false;
    WorldMorph.current().applications().each(function(app) { if (app.isReflectionEnabled) { isReflectionEnabled = true; }; });
    if (!isReflectionEnabled) { return; }

    var menu = this.morphMenu(evt);
    menu.openIn(this.world(), evt.point(), false, (Object.inspect(this) || "").truncate()); // added || "" -- Adam
  },

  showContextMenu: function(evt) {
    var menu = this.contextMenu(evt);
    if (!menu) { return; }
    
    // should be a clear difference between a morph menu and a context menu
    var baseColor = Color.black;
    if (menu.listStyle) {
      menu.listStyle = Object.create(menu.listStyle);
      menu.listStyle.borderColor = baseColor;
      menu.listStyle.fill        = baseColor.lighter(5);
    }
    if (menu.textStyle) {
      menu.textStyle = Object.create(menu.textStyle);
      menu.textStyle.textColor   = baseColor;
    }
    
    menu.openIn(this.world(), evt.point(), false, (Object.inspect(this) || "").truncate()); // added || "" -- Adam
  },

  contextMenu: function (evt) {
    var cs = this.commands();
    if (!cs || cs.size() === 0) { return null; }
    return cs.createMenu(this);
  },

  commands: function () {
    if (this._model && typeof(this._model.commands) === 'function') {
      return this._model.commands().wrapForMorph(this);
    }
    return null;
  },

  dragAndDropCommands: function () {
    if (this._model && typeof(this._model.dragAndDropCommands) === 'function') {
      var cmdList = this._model.dragAndDropCommands();
      if (cmdList) {
        return cmdList.wrapForMorph(this);
      }
    }
    return null;
  }
});

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
