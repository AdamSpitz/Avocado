transporter.module.create('projects/projects', function(requires) {}, function(thisModule) {
  

thisModule.addSlots(avocado, function(add) {
  
  add.creator('project', {}, {category: ['projects']});
  
});
  

thisModule.addSlots(avocado.project, function(add) {
  
  add.method('current', function () {
    return this._current || (this._current = this.create("This project"));
  }, {category: ['current one']});
  
  add.method('create', function (name) {
    return Object.newChildOf(this, name);
  }, {category: ['creating']});
  
  add.method('initialize', function (name) {
    this.setName(name);
  }, {category: ['creating']});
  
  add.method('name', function () { return this._name; }, {category: ['accessing']});
  
  add.method('setName', function (n) { this._name = n; }, {category: ['accessing']});
  
  add.method('module', function () { return modules.thisProject; }, {category: ['accessing']});
  
  add.method('inspect', function () { return this.name(); }, {category: ['printing']});
  
  add.method('save', function () {
    throw new Error("Time to implement project-saving!");
  }, {category: ['saving']});

  add.method('buttonCommands', function () {
    return avocado.command.list.create(this, [
      avocado.command.create('Save', this.save)
    ]);
  }, {category: ['user interface', 'commands']});
  
});


});
