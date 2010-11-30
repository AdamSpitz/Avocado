Morph.addMethods({
  showMorphMenu: function(evt) {
    // Disable the reflective stuff in deployed apps. -- Adam
    var isReflectionEnabled = false;
    WorldMorph.current().applications().each(function(app) { if (app.isReflectionEnabled) { isReflectionEnabled = true; }; });
    if (!isReflectionEnabled) { return; }

    var menu = this.morphMenu(evt);
    menu.openIn(this.world(), evt.point(), false, Object.inspect(this).truncate());
  },

  showContextMenu: function(evt) {
    var menu = this.contextMenu(evt);
    if (!menu) { return; }
    var baseColor = Color.black; // should be a clear difference between a morph menu and a context menu
    menu.listStyle = Object.create(menu.listStyle);
    menu.textStyle = Object.create(menu.textStyle);
    menu.listStyle.borderColor = baseColor;
    menu.listStyle.fill        = baseColor.lighter(5);
    menu.textStyle.textColor   = baseColor;
    menu.openIn(this.world(), evt.point(), false, Object.inspect(this).truncate());
  },

  contextMenu: function (evt) {
    var cs = this.commands();
    if (!cs || cs.size() === 0) { return null; }
    return MenuMorph.fromCommandList(cs, this);
  },

  commands: function () {
    if (this._model && typeof(this._model.commands) === 'function') {
      return this._model.commands().wrapForMorph(this);
    }
    return null;
  },

  dragAndDropCommands: function () {
    if (this._model && typeof(this._model.dragAndDropCommands) === 'function') {
      return this._model.dragAndDropCommands().wrapForMorph(this);
    }
    return null;
  }
});

Event.addMethods({
  isForContextMenu:    function() { return this.isCtrlDown()   || this.isRightMouseButtonDown();  },
  isForMorphMenu:      function() { return this.isCommandKey() || this.isMiddleMouseButtonDown(); }
});

MenuMorph.addMethods({
  addSection: function(newItems) {
    if (newItems.size() > 0) {
      if (this.items.size() > 0) {this.addLine();}
      newItems.each(function(item) {this.addItem(item);}.bind(this));
    }
  }
});

Object.extend(MenuMorph, {
  fromCommandList: function(cmdList, morph) {
    var menu = new MenuMorph([], morph);
    cmdList.addItemsToMenu(menu, morph);
    return menu;
  }
});