transporter.module.create('core/value_holder', function(requires) {}, function(thisModule) {


thisModule.addSlots(lobby, function(add) {

  add.creator('valueHolder', {}, {category: ['core']}, {comment: 'Stores a value and notifies you when someone changes it.'});

  add.creator('booleanHolder', Object.create(valueHolder), {category: ['core']}, {comment: 'A valueHolder for booleans.'});

});


thisModule.addSlots(booleanHolder, function(add) {

  add.method('isChecked', function () { return this.getValue();     });

  add.method('setChecked', function (b, evt) { return this.setValue(b, evt);    });

  add.method('toggle', function (evt) { return this.setValue(! this.getValue(), evt); });

  add.method('areValuesDifferent', function (v1, v2) { return (!!v1) !== (!!v2); });

});


thisModule.addSlots(valueHolder, function(add) {

  add.method('containing', function (v) {
    var c = Object.create(this);
    c.notifier = Object.newChildOf(notifier, this);
    c.setValue(v);
    return c;
  });

  add.method('getValue', function () { return this.value; });

  add.method('setValue', function (v, evt) {
    var oldValue = this.value;
    var changed = this.areValuesDifferent(oldValue, v);
    this.value = v;
    if (changed) {this.notifier.notifyAllObservers(evt);}
    return v;
  });

  add.method('areValuesDifferent', function (v1, v2) {
    return v1 !== v2;
  });

  add.method('addObserver', function (o) {
      this.notifier.addObserver(o);
      return this;
  });

});


});
