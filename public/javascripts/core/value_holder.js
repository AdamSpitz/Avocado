avocado.transporter.module.create('core/value_holder', function(requires) {

}, function(thisModule) {


thisModule.addSlots(avocado, function(add) {

  add.creator('generalValueHolder', {}, {category: ['core']});

});


thisModule.addSlots(avocado.generalValueHolder, function(add) {

  add.method('notifier', function () {
    return this._notifier || (this._notifier = Object.newChildOf(avocado.notifier, this));
  }, {category: ['observing']});

  add.method('addObserver', function (o) {
    this.notifier().addObserver(o);
    return this;
  }, {category: ['observing']});

});


thisModule.addSlots(avocado, function(add) {

  add.creator('valueHolder', Object.create(avocado.generalValueHolder), {category: ['core']}, {comment: 'Stores a value and notifies you when someone changes it.'});

});


thisModule.addSlots(avocado.valueHolder, function(add) {

  add.method('containing', function (v) {
    return Object.newChildOf(this, v);
  }, {category: ['creating']});

  add.method('initialize', function (v) {
    this.setValue(v);
  }, {category: ['creating']});

  add.method('getValue', function () {
    return this._value;
  }, {category: ['value']});

  add.method('setValue', function (v, evt) {
    var changed = this.justSetValue(v);
    if (changed && this._notifier) {this._notifier.notifyAllObservers(evt);}
    return v;
  }, {category: ['value']});

  add.method('justSetValue', function (v) {
    if (! this.checkType(v)) {
      throw new Error("Type mismatch for " + this.name() + ": " + v);
    }
    
    var oldValue = this._value;
    var changed = this.areValuesDifferent(oldValue, v);
    this._value = v;
    return changed;
  }, {category: ['value']});

  add.method('get', function () {
    return this.getValue.apply(this, arguments);
  }, {category: ['compatibility with accessors']});

  add.method('set', function (v) {
    return this.setValue.apply(this, arguments);
  }, {category: ['compatibility with accessors']});

  add.method('canGet', function () {
    return true;
  }, {category: ['testing']});

  add.method('canSet', function () {
    return true;
  }, {category: ['testing']});

  add.method('areValuesDifferent', function (v1, v2) {
    return v1 !== v2;
  }, {category: ['testing']});

  add.method('name', function () {
    return this._name || "";
  }, {category: ['naming']});

  add.method('setName', function (n) {
    this._name = n;
    return this;
  }, {category: ['naming']});

  add.method('readableName', function () {
    return this.name();
  }, {category: ['naming']});

  add.method('title', function () {
    return this.readableName();
  }, {category: ['naming']});

  add.method('toString', function () {
    return this.readableName();
  }, {category: ['naming']});

  add.method('type', function () {
    return this._type;
  }, {category: ['types']});

  add.method('setType', function (t) {
    this._type = t;
    return this;
  }, {category: ['types']});

  add.method('checkType', function (value) {
    if (! this._type) { return true; }
    if (typeof(this._type.doesTypeMatch) !== 'function') { return true; }
    return this._type.doesTypeMatch(value);
  }, {category: ['types']});

  add.method('commands', function () {
    var cmdList = avocado.command.list.create();
    return cmdList;
  }, {category: ['commands']});

});


thisModule.addSlots(avocado, function(add) {

  add.creator('booleanHolder', Object.create(avocado.valueHolder), {category: ['core']}, {comment: 'A valueHolder for booleans.'});

});


thisModule.addSlots(avocado.booleanHolder, function(add) {

  add.method('isChecked', function () { return this.getValue();     });

  add.method('setChecked', function (b, evt) { return this.setValue(b, evt);    });

  add.method('toggle', function (evt) { return this.setValue(! this.getValue(), evt); });

  add.method('areValuesDifferent', function (v1, v2) { return (!!v1) !== (!!v2); });

});


});
