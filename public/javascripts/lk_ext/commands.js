transporter.module.create('lk_ext/commands', function(requires) {}, function(thisModule) {


thisModule.addSlots(avocado, function(add) {

  add.creator('command', {}, {category: ['ui']});

});


thisModule.addSlots(avocado.command, function(add) {

  add.creator('list', {});

});


thisModule.addSlots(avocado.command.list, function(add) {

  add.method('create', function (cs) {
    return Object.newChildOf(this, cs);
  });

  add.method('initialize', function (cs) {
    this._commands = cs || [];
  });

  add.method('size', function () {
    return this._commands.size();
  });

  add.method('eachCommand', function (f) {
    this._commands.each(function(c) { if (c) { f(c); } });
  });

  add.method('addItem', function (c) {
    // for compatibility with MenuMorph
    if (reflect(c).isReflecteeArray()) {
      c = {label: c[0], go: c[1]};
    }

    this._commands.push(c);
  });

  add.method('addLine', function (c) {
    if (this._commands.length === 0 || this._commands[this._commands.length - 1] === null) { return; }
    this._commands.push(null);
  });

  add.method('addSection', function (cs) {
    if (cs.size() > 0) {
      this.addLine();
      cs.each(this.addItem.bind(this));
    }
  });

  add.method('addItemsToMenu', function (menu, morph) {
    for (var i = 0, n = this._commands.length; i < n; ++i) {
      var c = this._commands[i];
      if (c) {
        var label = typeof(c.label) === 'function' ? c.label(morph) : c.label;
        menu.addItem([label, c.go.bind(c)]);
      } else {
        if (i !== n - 1) { // no point if it's the last one
          menu.addLine();
        }
      }
    }
  });

});


thisModule.addSlots(SelectionMorph.prototype, function(add) {

  add.method('inspect', function () {
    if (!this.selectedMorphs || this.selectedMorphs.length === 0) { return "nothing here"; }
    
    var morphsByClass = avocado.dictionary.copyRemoveAll();
    this.selectedMorphs.each(function(m) {
      morphsByClass.getOrIfAbsentPut(m.constructor, function() {return [];}).push(m);
    });

    var buf = avocado.stringBuffer.create();
    var sep = "";
    morphsByClass.eachKeyAndValue(function(c, ms) {
      buf.append(sep).append(ms.length.toString()).append(" ").append(reflect ? reflect(c).name() : c.type).append(ms.length === 1 ? "" : "s");
      sep = ", ";
    });
    return buf.toString();
  });

  add.method('addCommandsTo', function (cmdList) {
    if (! this.selectedMorphs) { return; }

    var morphsByCommandType = avocado.dictionary.copyRemoveAll();
    this.selectedMorphs.each(function(m) {
      var cmdList = m.commands();
      if (cmdList) {
        cmdList.eachCommand(function(c) {
          if (c.pluralLabel) {
            morphsByCommandType.getOrIfAbsentPut(c.pluralLabel, function() {return [];}).push({morph: m, command: c});
          }
        });
      }
    });

    morphsByCommandType.keys().sort().each(function(pluralLabel) {
      var morphsAndCommands = morphsByCommandType.get(pluralLabel);
      cmdList.addItem({label: pluralLabel, go: function(evt) {
        var pluralGo = morphsAndCommands[0].command.pluralGo;
        if (pluralGo) {
          pluralGo(morphsAndCommands, evt);
        } else {
          // By default, just do each one in sequence.
          morphsAndCommands.each(function(morphAndCommand) {
            morphAndCommand.command.go(evt);
          });
        }
      }});
    });
  }, {category: ['menu']});

});


});
