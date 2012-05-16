avocado.transporter.module.create('core/batcher_upper', function(requires) {

}, function(thisModule) {


thisModule.addSlots(avocado, function(add) {

  add.creator('batcherUpper', {}, {category: ['core']});

});


thisModule.addSlots(avocado.batcherUpper, function(add) {

  add.method('create', function () {
    var b = Object.create(this);
    b.initialize.apply(b, arguments);
    return b;
  }, {category: ['creating']});

  add.method('initialize', function (context, finalFn, accumulatorFn, clearFn) {
    this._context = context;
    this._finalAction = finalFn;
    this._accumulateParameters = accumulatorFn;
    this._clearParams = clearFn;
    this.clear();
  }, {category: ['creating']});

  add.method('batchUp', function (params) {
    if (this._isRunning) {
      this._hasBeenCalled = true;
      if (this._accumulateParameters) { this._accumulateParameters(params); }
    }
  }, {category: ['batching up']});

  add.method('start', function () {
    this._isRunning = true;
    return this;
  }, {category: ['batching up']});

  add.method('stop', function () {
    this._isRunning = false;
    if (this._hasBeenCalled) {
      this._finalAction();
      this.clear();
    }
    return this;
  }, {category: ['batching up']});

  add.method('clear', function () {
    this._hasBeenCalled = false;
    if (this._clearParams) { this._clearParams(); }
  }, {category: ['batching up']});

  add.method('runDuring', function (f) {
    this.start();
    try {
      f();
    } finally {
      this.stop();
    }
  }, {category: ['batching up']});

  add.method('isRunning', function () {
    return this._isRunning;
  }, {category: ['testing']});

});


});
