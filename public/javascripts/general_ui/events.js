avocado.transporter.module.create('general_ui/events', function(requires) {

requires('general_ui/basic_morph_mixins');

}, function(thisModule) {


thisModule.addSlots(avocado.morphMixins.MorphOrWorld, function(add) {

  add.method('runAvocadoEventHandler', function (handlerMethodName, evt) {
    if (this._eventHandler) {
      if (typeof(this._eventHandler.isEnabled) !== 'function' || this._eventHandler.isEnabled(this, evt)) {
        var handlerMethod = this._eventHandler[handlerMethodName];
        if (typeof(handlerMethod) === 'function') {
          return handlerMethod.call(this._eventHandler, this, evt);
        }
      }
    }
    return false;
  }, {category: ['events']});

  add.method('setEventHandler', function (h) {
    this._eventHandler = h;
    return this;
  }, {category: ['events']});

});


thisModule.addSlots(avocado, function(add) {

  add.creator('eventHandlers', {}, {category: ['user interface']});

});


thisModule.addSlots(avocado.eventHandlers, function(add) {

  add.creator('general', {});

  add.creator('composite', Object.create(avocado.eventHandlers.general));

  add.creator('default', Object.create(avocado.eventHandlers.general));

  add.method('grabAndPullOrPutBackIfPossible', function (morph, evt) {
    if (morph.hasPlaceholderToGoBackTo()) {
      morph.goBackToPlaceholder();
      return true;
    } else if (morph.shouldBeEasilyGrabbable()) {
      morph.grabAndPullMe(evt);
      return true;
    } else {
      return false;
    }
  }, {category: ['miscellaneous functions']});

});


thisModule.addSlots(avocado.eventHandlers.general, function(add) {

  add.method('create', function () {
    var c = Object.create(this);
    c.initialize.apply(c, arguments);
    return c;
  }, {category: ['creating']});
  
});


thisModule.addSlots(avocado.eventHandlers.composite, function(add) {

  add.method('initialize', function (handlers) {
    this._eventHandlers = handlers;
  }, {category: ['creating']});

  add.method('handleEvent', function (handlerMethodName, morph, evt) {
    this._eventHandlers.forEach(function(h) {
      if (typeof(h.isEnabled) !== 'function' || h.isEnabled(morph, evt)) {
        var handlerMethod = h[handlerMethodName];
        if (typeof(handlerMethod) === 'function') { handlerMethod.call(h, morph, evt); }
      }
    });
  });

  add.method('onMouseDown', function (morph, evt) {
    return this.handleEvent('onMouseDown', morph, evt);
  });

  add.method('onMouseUp', function (morph, evt) {
    return this.handleEvent('onMouseUp', morph, evt);
  });

  add.method('onMouseMove', function (morph, evt) {
    return this.handleEvent('onMouseMove', morph, evt);
  });

  add.method('onMouseOver', function (morph, evt) {
    return this.handleEvent('onMouseOver', morph, evt);
  });

  add.method('onMouseOut', function (morph, evt) {
    return this.handleEvent('onMouseOut', morph, evt);
  });

  add.method('onTouchStart', function (morph, evt) {
    return this.handleEvent('onTouchStart', morph, evt);
  });

  add.method('onTouchEnd', function (morph, evt) {
    return this.handleEvent('onTouchEnd', morph, evt);
  });

  add.method('onTouchMove', function (morph, evt) {
    return this.handleEvent('onTouchMove', morph, evt);
  });

  add.method('onTouchCancel', function (morph, evt) {
    return this.handleEvent('onTouchCancel', morph, evt);
  });

  add.method('onTouchOver', function (morph, evt) {
    return this.handleEvent('onTouchOver', morph, evt);
  });

  add.method('onTouchOut', function (morph, evt) {
    return this.handleEvent('onTouchOut', morph, evt);
  });

  add.method('onKeyDown', function (morph, evt) {
    return this.handleEvent('onKeyDown', morph, evt);
  });

  add.method('onKeyUp', function (morph, evt) {
    return this.handleEvent('onKeyUp', morph, evt);
  });

  add.method('onKeyPress', function (morph, evt) {
    return this.handleEvent('onKeyPress', morph, evt);
  });

});


});
