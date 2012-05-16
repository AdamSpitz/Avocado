avocado.transporter.module.create('core/naming', function(requires) {

}, function(thisModule) {


thisModule.addSlots(avocado, function(add) {

  add.creator('namingScheme', {}, {category: ['naming']});

});


thisModule.addSlots(avocado.namingScheme, function(add) {

  add.method('enclosingObjectInContext', function (context) {
    if (context) {
      if (typeof(context.enclosingObjectHavingANameInScheme) === 'function') {
        return context.enclosingObjectHavingANameInScheme(this);
      }
    }
    return null;
  });

  add.method('nameInContext', function (obj, context) {
    var enclosingObject = this.enclosingObjectInContext(context);
    return obj.nameWithinEnclosingObject(enclosingObject);
  });

});


});
