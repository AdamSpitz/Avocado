transporter.module.create('lk_ext/commands', function(requires) {
  
requires('core/commands');
  
}, function(thisModule) {


thisModule.addSlots(avocado.command, function(add) {

  add.method('newMorph', function (optionalLabelMorph) {
    var m = ButtonMorph.createButton(optionalLabelMorph || this.label, this.functionToRun(), 2);
    
    var ht = this.helpText();
    if (typeof(ht) === 'function') {
      m.getHelpText = ht;
    } else if (typeof(ht) === 'string') {
      m.setHelpText(ht);
    }
    
    var af = this.applicabilityFunction();
    if (af) {
      m = Morph.createOptionalMorph(m, af);
      m.refreshContent();
    }
    
    return m;
  }, {category: ['user interface']});

  add.method('wrapForMorph', function (morph) {
    var c = Object.create(this);
    
    if (this._argumentSpecs) {
      c.setArgumentSpecs(this._argumentSpecs.map(function(spec) { return spec.wrapForMorph(morph); }))
    }
    
    var oldFunctionToRun = c.functionToRun();
    c.setFunction(function() {
      var rcvr = this; // aaa - shouldn't be this, we should have a way of actually specifying the receiver
      var args = $A(arguments);
      // first arg is the event
      var result = oldFunctionToRun.apply(rcvr, args.map(function(o, i) { return i === 0 ? o : (o instanceof Morph ? o._model : o); }));
      args.each(function(arg) { if (arg._shouldDisappearAfterCommandIsFinished) { arg.remove(); }});
      return result;
    });

    return c;
  }, {category: ['user interface']});

});


thisModule.addSlots(avocado.command.argumentSpec, function(add) {
  
  add.method('wrapForMorph', function (morph) {
    var argSpecForModelCommand = this;
    return avocado.command.argumentSpec.create(this._name).onlyAccepts(function(arg) {
      return (arg instanceof Morph) && (! arg._shouldOnlyBeDroppedOnThisParticularMorph || arg._shouldOnlyBeDroppedOnThisParticularMorph === morph) && argSpecForModelCommand.canAccept(arg._model);
    });
  }, {category: ['user interface']});

});


thisModule.addSlots(avocado.command.list, function(add) {

  add.method('wrapForMorph', function (morph) {
    return avocado.command.list.create(this._commands.map(function(c) { return c ? c.wrapForMorph(morph) : null; }))
  }, {category: ['user interface']});

  add.method('addItemsToMenu', function (menu, target) {
    var i = 0;
    var n = this._commands.length;
    this._commands.each(function(c) {
      if (c) {
        if (typeof(c.isApplicable) !== 'function' || c.isApplicable()) {
          var label = typeof(c.label) === 'function' ? c.label(target) : c.label;
          if (c.subcommands()) {
            menu.addItem([label, c.subcommands()]);
          } else {
            menu.addItem([label, function() { c.go.apply(c, arguments); }]);
          }
        }
      } else {
        if (i !== n - 1) { // no point if it's the last one
          menu.addLine();
        }
      }
      i += 1;
    }.bind(this));
  }, {category: ['converting']});

});


thisModule.addSlots(Morph.prototype, function(add) {
  
  add.method('eachAssociatedObject', function (f) {
    // Children can override.
    if (typeof(this._model) !== 'undefined') { f(this._model); }
  }, {category: ['associated objects']});
  
  add.method('associatedObjectSatisfying', function (criterion) {
    return exitValueOf(function(exit) {
      this.eachAssociatedObject(function(o) {
        if (!criterion || criterion(o)) { exit(o); }
      });
      return null;
    }.bind(this));
  }, {category: ['associated objects']});
  
});


});
