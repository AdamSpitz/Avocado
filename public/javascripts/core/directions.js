avocado.transporter.module.create('core/directions', function(requires) {

}, function(thisModule) {


thisModule.addSlots(avocado, function(add) {

  add.creator('directions', {}, {category: ['collections', 'tables']});

});


thisModule.addSlots(avocado.directions, function(add) {

  add.creator('abstractDirection', {});

  add.creator('vertical', Object.create(avocado.directions.abstractDirection));

  add.creator('horizontal', Object.create(avocado.directions.abstractDirection));

});


thisModule.addSlots(avocado.directions.vertical, function(add) {

  add.data('sideways', avocado.directions.horizontal);

  add.method('toString', function () { return 'vertical'; });

  add.method('coord', function (p) {return p.y;});

  add.method('setCoord', function (p, y) {p.y = y;});

  add.method('point', function (f, s) {return pt(s, f);});

  add.method('copyAndSetCoord', function (p, y) { return pt(p.x, y); });

});


thisModule.addSlots(avocado.directions.horizontal, function(add) {

  add.data('sideways', avocado.directions.vertical);

  add.method('toString', function () { return 'horizontal'; });

  add.method('coord', function (p) {return p.x;});

  add.method('setCoord', function (p, x) {p.x = x;});

  add.method('point', function (f, s) {return pt(f, s);});

  add.method('copyAndSetCoord', function (p, x) { return pt(x, p.y); });

});


});
