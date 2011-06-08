avocado.transporter.module.create('core/identity_hash', function(requires) {

}, function(thisModule) {


thisModule.addSlots(avocado, function(add) {

  add.method('identityHashFor', function (o) {
    // Why, oh why doesn't JavaScript have a proper built-in identity-hash mechanism?;
    try {
      if (o === undefined) { return "undefined"; }
      if (o === null     ) { return "null";      }
      var t = typeof(o);
      if (t === 'string') { return o; }
      if (t === 'number') { return o.toString(); }
      if (t === 'boolean') { return o.toString(); }
      if (typeof(o.identityHashCode) === 'function') { return o.identityHashCode(); }
      return avocado.annotator.oidOf(o).toString();
    } catch (ex) {
      // don't want to crash if the object is broken
    }
    return "broken identity hash";
  }, {category: ['hashing']});

});


});
