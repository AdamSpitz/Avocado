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
  
  add.data('jsonpCallbacks', {}, {category: ['JSONP'], initializeTo: '{}'});

  add.method('findUnusedNameForJSONP', function () {
    var i = 0;
    var jsonp;
    var callbackHolder = this.jsonpCallbacks;
    while (true) {
      jsonp = "jsonpCallback_" + (++i);
      if (! callbackHolder.hasOwnProperty(jsonp)) { return jsonp; }
    }
  }, {category: ['JSONP']});
  
  add.method('jsonpGet', function (path, callback) {
    var callbackName = this.findUnusedNameForJSONP();
    var jsonp = "avocado.http.jsonpCallbacks." + callbackName;
    avocado.http.jsonpCallbacks[callbackName] = function(json) { delete avocado.http.jsonpCallbacks[callbackName]; callback(json); }
    
    if (path.include('?')) { path += '&jsonp=' + jsonp; } else { path += '?jsonp=' + jsonp; }
    
    var script = document.createElement('script');
    script.setAttribute('src', path);
    document.getElementsByTagName('head')[0].appendChild(script);
  }, {category: ['JSONP']});
  
});


});
