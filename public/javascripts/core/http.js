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
  
});


});
