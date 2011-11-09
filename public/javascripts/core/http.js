avocado.transporter.module.create('core/http', function(requires) {

}, function(thisModule) {


thisModule.addSlots(avocado, function(add) {

  add.creator('http', {}, {category: ['HTTP']});

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

  add.method('findUnusedCallbackName', function () {
    var i = 0;
    var jsonp;
    var callbackHolder = this.callbacks;
    while (true) {
      jsonp = "jsonpCallback_" + (++i);
      if (! callbackHolder.hasOwnProperty(jsonp)) { return jsonp; }
    }
  }, {category: ['JSONP']});
  
  add.method('get', function (path, callback, errback, timeout) {
    var callbackName = this.findUnusedCallbackName();
    var jsonp = "avocado.http.jsonp.callbacks." + callbackName;
    var jsonpFunction = avocado.http.jsonp.callbacks[callbackName] = function(json) {
      delete avocado.http.jsonp.callbacks[callbackName];
      jsonpFunction.hasReturned = true;
      callback(json);
    }
    
    var pathIncludingJSONPStuff = path;
    if (pathIncludingJSONPStuff.include('?')) { pathIncludingJSONPStuff += '&jsonp=' + jsonp; } else { pathIncludingJSONPStuff += '?jsonp=' + jsonp; }
    pathIncludingJSONPStuff += "&t=" + new Date().getTime(); // to avoid caching;
     
    var script = document.createElement('script');
    script.setAttribute('src', pathIncludingJSONPStuff);
    document.getElementsByTagName('head')[0].appendChild(script);
    
    // I don't believe there's any way to get a proper error message if the request fails,
    // but we can at least do a timeout thing.
    if (typeof(timeout) === 'undefined') { timeout = 10; }
    if (timeout) {
      setTimeout(function() {
        if (! jsonpFunction.hasReturned) {
          errback("Timeout on JSONP request to " + path);
        }
      }, timeout * 1000);
    }
  }, {category: ['JSONP']});
  
});


});
