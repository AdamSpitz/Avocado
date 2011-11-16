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
  
  add.creator('request', {}, {category: ['XHR']});

});


thisModule.addSlots(avocado.http.request, function(add) {
  
  add.method('create', function () {
    var c = Object.create(this);
    c.initialize.apply(c, arguments);
    return c;
  }, {category: ['creating']});
  
  add.method('initialize', function (path) {
    this._path = path;
  }, {category: ['creating']});
  
  add.method('params', function () {
    return this._params || {};
  }, {category: ['accessing']});
  
  add.method('setParams', function (params) {
    this._params = params;
    return this;
  }, {category: ['accessing']});
  
  add.method('params', function () {
    return avocado.http.paramsStringFrom(this.params())
  }, {category: ['accessing']});
  
  add.method('beSynchronous', function (params) {
    this._isSynchronous = true;
    return this;
  }, {category: ['accessing']});
  
  add.method('beAsynchronous', function (params) {
    this._isSynchronous = false;
    return this;
  }, {category: ['accessing']});
  
  add.method('setIsAsynchronous', function (b) {
    this._isSynchronous = !b;
    return this;
  }, {category: ['accessing']});
  
  add.method('setIsSynchronous', function (b) {
    this._isSynchronous = !!b;
    return this;
  }, {category: ['accessing']});
  
  add.method('httpMethod', function () {
    return this._httpMethod || "GET";
  }, {category: ['accessing']});
  
  add.method('setHTTPMethod', function (httpMethod) {
    this._httpMethod = httpMethod;
    return this;
  }, {category: ['accessing']});
  
  add.method('headers', function () {
    return this._headers || {};
  }, {category: ['accessing']});
  
  add.method('setHeaders', function (headers) {
    this._headers = headers;
    return this;
  }, {category: ['accessing']});
  
  add.method('eachHeader', function (f) {
    var headers =  this.headers()
  	for (var headerName in headers) {
  	  if (headers.hasOwnProperty(headerName)) {
  	    f(headerName, headers[headerName]);
  	  }
  	}
  	if (this.httpMethod() === "POST") {
    	f("Content-type", "application/x-www-form-urlencoded");
  	}
  }, {category: ['accessing']});
  
  add.method('body', function () {
    if (this.httpMethod() === "POST") {
      return this.paramsString();
    } else {
      return undefined;
    }
  }, {category: ['accessing']});
  
  add.method('url', function () {
    if (this.httpMethod() === "GET") {
      return this._path;
    } else {
      return this._path + "?" + this.paramsString();
    }
  }, {category: ['accessing']});
  
  add.method('send', function (callback, errback, partback) {
  	var req = new XMLHttpRequest();
  	req.open(this.httpMethod(), this.url(), ! this._isSynchronous);
  	this.eachHeader(function(name, value) { req.setRequestHeader(name, value); });

    var index = 0;
    req.onreadystatechange = function () {
      if (req.readyState === 3) {
        if (req.status == 200) {
          var rtlen = req.responseText.length;
          if (index < rtlen) {
            var nextPartOfResponseText = req.responseText.substring(index);
            partback(nextPartOfResponseText);
            index = rtlen;
          }
        }
      } else if (req.readyState === 4) {
        if (req.status == 200) {
          callback(req.responseText);
        } else {
          errback("HTTP status: " + req.status);
        }
      }
    }
    
  	req.send(this.body());
  }, {category: ['sending']});

  add.method('get', function (callback, errback, partback) {
    // For compatibility with other kinds of asynchronousRequests.
    return this.send(callback, errback, partback);
  }, {category: ['sending']});
  
  add.method('map', function (f) {
    return avocado.asyncRequest.mapping(this, f);
  }, {category: ['transforming']});
  
  add.method('transform', function (f, e, p) {
    // aaa this method needs a better name
    return avocado.asyncRequest.create(this, f, e, p);
  }, {category: ['transforming']});
  
  add.method('logPartialResultsToBuffer', function (buffer) {
    return avocado.asyncRequest.mappingPartialResults(function(nextPart) {
      if (buffer) { buffer.append(nextPart); }
      return nextPart;
    });
  }, {category: ['transforming']});
  
  add.method('expectJSON', function () {
    return this.map(function(responseText) { return JSON.parse(responseText); });
  }, {category: ['transforming']});
  
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
    return this.create(req, function(result, callback, errback, partback) { callback(mapFn(result)); }, null, null);
  }, {category: ['creating']});
  
  add.method('mappingPartialResults', function (req, mapFn) {
    return this.create(req, null, null, function(partialResult, callback, errback, partback) { partback(mapFn(partialResult)); });
  }, {category: ['creating']});
  
  add.method('create', function () {
    var c = Object.create(this);
    c.initialize.apply(c, arguments);
    return c;
  }, {category: ['creating']});
  
  add.method('initialize', function (req, callbackTransformer, errbackTransformer, partbackTransformer) {
    this._originalRequest = req;
    this._callbackTransformer = callbackTransformer;
    this._errbackTransformer = errbackTransformer;
    this._partbackTransformer = partbackTransformer;
  }, {category: ['creating']});
  
  add.method('get', function (callback, errback, partback) {
    var callbackTransformer = this._callbackTransformer;
    var errbackTransformer = this._errbackTransformer;
    var partbackTransformer = this._partbackTransformer;
    this._originalRequest.get(function(result) {
      callbackTransformer ? callbackTransformer(result, callback, errback, partback) : (callback ? callback(result) : null);
    }, function(err) {
       errbackTransformer ?  errbackTransformer(err, callback, errback, partback) :  (errback ? errback(err) : null);
    }, function(partialResult) {
      partbackTransformer ? partbackTransformer(partialResult, callback, errback, partback) : (partback ? partback(partialResult) : null);
    });
  }, {category: ['creating']});
  
  add.method('map', function (f) {
    return avocado.asyncRequest.mapping(this, f);
  }, {category: ['transforming']});
  
  add.method('transform', function (f) {
    // aaa this method needs a better name
    return avocado.asyncRequest.create(this, f);
  }, {category: ['transforming']});
  
});


});
