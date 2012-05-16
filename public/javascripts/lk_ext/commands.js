avocado.transporter.module.create('lk_ext/commands', function(requires) {

requires('general_ui/commands');
requires('general_ui/wheel_menus');

}, function(thisModule) {


thisModule.addSlots(avocado.command, function(add) {

  add.method('newMorph', function (optionalLabelMorph, optionalPadding, optionalLabelPos) {
    var m = ButtonMorph.createButton(optionalLabelMorph || this.label, this.go.bind(this), typeof(optionalPadding) === 'number' ? optionalPadding : 2, optionalLabelPos);
    
    var ht = this.helpText();
    if (typeof(ht) === 'function') {
      m.getHelpText = ht;
    } else if (typeof(ht) === 'string') {
      m.setHelpText(ht);
    }
    
    var af = this.applicabilityFunction();
    if (af) {
      m = avocado.table.createOptionalMorph(m, af);
      m.refreshContent();
    }
    
    return m;
  }, {category: ['user interface']});

});


thisModule.addSlots(avocado.command.list, function(add) {

  add.data('shouldUseWheelMenus', true);

  add.method('defaultMenuClass', function () {
    return this.shouldUseWheelMenus ? avocado.wheelMenu : MenuMorph;
  }, {category: ['converting']});

  add.method('menuClassThatCanHandleAnUnlimitedNumberOfItems', function () {
    return MenuMorph;
  }, {category: ['converting']});

});


thisModule.addSlots(MenuMorph, function(add) {

  add.method('createMenuMorph', function (items, target) {
    return new this(items, target);
  }, {category: ['creating']});

  add.method('itemsForCommands', function (commands) {
    return commands.map(function(c) {
      if (!c) {
        return null;
      } else if (c instanceof Array) {
        return c;
      } else if (c.subcommands()) {
        return [c.labelString(), MenuMorph.itemsForCommands(c.subcommands())];
      } else {
        return [c.labelString(), function() { c.go.apply(c, arguments); }];
      }
    });
  }, {category: ['converting']});

});


thisModule.addSlots(avocado.command.partial, function(add) {

  add.method('newMorph', function () {
    return avocado.treeNode.newMorphFor(this, undefined, 0.1);
  }, {category: ['user interface']});

});


});
