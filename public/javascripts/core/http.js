avocado.transporter.module.create('core/http', function(requires) {

}, function(thisModule) {


thisModule.addSlots(avocado, function(add) {

  add.creator('http', {}, {category: ['HTTP']});

  add.creator('asyncRequest', {}, {category: ['HTTP']});

});


thisModule.addSlots(avocado.http, function(add) {

  add.method('paramsStringFrom', function (paramsStringOrObject) {
    if (!paramsStringOrObject) { return ""; }
    var paramsMir = reflect(paramsStringOrObject);
    if (paramsMir.isReflecteeString()) { return paramsStringOrObject; }
    return paramsMir.normalSlots().map(function(s) { return encodeURIComponent(s.name()) + "=" + encodeURIComponent(s.contents().reflectee()); }).toArray().join("&");
  }, {category: ['requests']});
  
  add.creator('jsonp', {}, {category: ['JSONP']});

});

  
thisModule.addSlots(avocado.http.jsonp, function(add) {
  
  add.data('callbacks', {}, {category: ['JSONP'], initializeTo: '{}'});

  add.creator('request', {}, {category: ['JSONP']});
  
});


thisModule.addSlots(avocado.http.jsonp.request, function(add) {
  
  add.method('create', function () {
    var c = Object.create(this);
    c.initialize.apply(c, arguments);
    return c;
  }, {category: ['creating']});
  
  add.method('initialize', function (path) {
    this._path = path;
    this.changeTimeoutSeconds(10);
  }, {category: ['creating']});
  
  add.method('changeTimeoutSeconds', function (seconds) {
    this._timeoutSeconds = seconds;
    return this;
  }, {category: ['accessing']});

  add.method('findUnusedCallbackName', function () {
    var i = 0;
    var jsonp;
    var callbackHolder = avocado.http.jsonp.callbacks;
    while (true) {
      jsonp = "jsonpCallback_" + (++i);
      if (! callbackHolder.hasOwnProperty(jsonp)) { return jsonp; }
    }
  }, {category: ['callbacks']});

  add.method('pathIncludingCallbackName', function (jsonp) {
    var p = this._path;
    if (p.include('?')) { p += '&jsonp=' + jsonp; } else { p += '?jsonp=' + jsonp; }
    p += "&t=" + new Date().getTime(); // to avoid caching;
    return p;
  }, {category: ['callbacks']});
  
  add.method('get', function (callback, errback) {
    var path = this._path;
    var callbackName = this.findUnusedCallbackName();
    var jsonp = "avocado.http.jsonp.callbacks." + callbackName;
    var jsonpFunction = avocado.http.jsonp.callbacks[callbackName] = function(json) {
      delete avocado.http.jsonp.callbacks[callbackName];
      jsonpFunction.hasReturned = true;
      callback(json);
    }
    
    var script = document.createElement('script');
    script.setAttribute('src', this.pathIncludingCallbackName(jsonp));
    document.getElementsByTagName('head')[0].appendChild(script);
    
    // I don't believe there's any way to get a proper error message if the request fails,
    // but we can at least do a timeout thing.
    if (this._timeoutSeconds) {
      setTimeout(function() {
        if (! jsonpFunction.hasReturned) {
          errback(new Error("Timeout on JSONP request").setImmediateContents([avocado.messageNotifier.create(path, Color.red, "path")]));
        }
      }, this._timeoutSeconds * 1000);
    }
  }, {category: ['sending']});
  
  add.method('map', function (f) {
    return avocado.asyncRequest.mapping(this, f);
  }, {category: ['transforming']});
  
  add.method('transform', function (f) {
    // aaa this method needs a better name
    return avocado.asyncRequest.create(this, f);
  }, {category: ['transforming']});
  
});


thisModule.addSlots(avocado.asyncRequest, function(add) {
  
  add.method('mapping', function (req, mapFn) {
    return Object.newChildOf(this, req, function(result, callback, errback) { callback(mapFn(result)); });
  }, {category: ['creating']});
  
  add.method('create', function (req, mapFnTakingCallbackAndErrback) {
    return Object.newChildOf(this, req, mapFnTakingCallbackAndErrback);
  }, {category: ['creating']});
  
  add.method('initialize', function (req, mapFnTakingCallbackAndErrback) {
    this._originalRequest = req;
    this._mapFunctionTakingCallbackAndErrback = mapFnTakingCallbackAndErrback;
  }, {category: ['creating']});
  
  add.method('get', function (callback, errback) {
    var map = this._mapFunctionTakingCallbackAndErrback;
    this._originalRequest.get(function(result) {
      map(result, callback, errback);
    }.bind(this), errback);
  }, {category: ['creating']});
  
});


});
