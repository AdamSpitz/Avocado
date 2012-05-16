avocado.transporter.module.create('core/dependencies', function(requires) {

}, function(thisModule) {


thisModule.addSlots(avocado, function(add) {

  add.creator('dependencies', {}, {category: ['collections']});

});


thisModule.addSlots(avocado.dependencies, function(add) {

  add.method('copyRemoveAll', function () {
    return Object.newChildOf(this);
  }, {category: ['creating']});

  add.method('initialize', function () {
    this._dependeesByDepender = avocado.dictionary.copyRemoveAll();
    this._dependersByDependee = avocado.dictionary.copyRemoveAll();
  }, {category: ['creating']});

  add.method('dependeesByDepender', function () {
    return this._dependeesByDepender;
  }, {category: ['accessing']});

  add.method('dependersByDependee', function () {
    return this._dependersByDependee;
  }, {category: ['accessing']});

  add.method('dependeesOf', function (depender) {
    return this.dependeesByDepender().get(depender) || [];
  }, {category: ['accessing']});

  add.method('dependersOf', function (dependee) {
    return this.dependersByDependee().get(dependee) || [];
  }, {category: ['accessing']});

  add.method('addDependency', function (depender, dependee) {
    if (depender.equals(dependee)) { return; }
    this.dependeesByDepender().getOrIfAbsentPut(depender, function() { return avocado.set.copyRemoveAll(); }).add(dependee);
    this.dependersByDependee().getOrIfAbsentPut(dependee, function() { return avocado.set.copyRemoveAll(); }).add(depender);
  }, {category: ['adding']});

  add.method('removeDependency', function (depender, dependee, isOKIfItDoesntExist) {
    if (depender.equals(dependee)) { return; }
    var dependees = this.dependeesByDepender().get(depender);
    var dependers = this.dependersByDependee().get(dependee);
    if (! isOKIfItDoesntExist) {
      if (! dependees.includes(dependee) || ! dependers.includes(depender)) {
        throw new Error("Trying to remove a dependency that doesn't exist");
      }
    }
    dependees.remove(dependee);
    dependers.remove(depender);
  }, {category: ['removing']});

  add.method('eachDependency', function (f) {
    this.dependeesByDepender().eachKeyAndValue(function(depender, dependees) {
      dependees.each(function(dependee) {
        f(depender, dependee);
      });
    });
  }, {category: ['iterating']});

  add.method('removeDependee', function (dependee) {
    var dependers = this.dependersByDependee().removeKey(dependee);
    if (! dependers) { return; }
    dependers.each(function(depender) { this.dependeesByDepender().get(depender).remove(dependee); }.bind(this));
  }, {category: ['removing']});

  add.creator('tests', Object.create(avocado.testCase), {category: ['tests']});

  add.method('printToConsole', function () {
    this.eachDependency(function(depender, dependee) {
      console.log("" + depender + " -> " + dependee);
    });
  }, {category: ['printing']});

});


thisModule.addSlots(avocado.dependencies.tests, function(add) {

  add.method('testStuff', function () {
    var deps = avocado.dependencies.copyRemoveAll();
    deps.addDependency(4, 2);
    deps.addDependency(6, 2);
    deps.addDependency(6, 3);
    deps.addDependency(8, 4);
    // aaa - should really move the ordering stuff to the dependencies object itself;
  });

});


});
