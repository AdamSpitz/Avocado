transporter.module.create('core/string_extensions', function(requires) {}, function(thisModule) {


thisModule.addSlots(String.prototype, function(add) {

  add.method('capitalize', function () {
     return this.replace( /(^|\s)([a-z])/g , function(m, p1, p2) { return p1+p2.toUpperCase(); } );
  });

  add.method('startsWithVowel', function () {
    return (/^[AEIOUaeiou]/).exec(this);
  });

  add.method('prependAOrAn', function () {
    return this.startsWithVowel() ? "an " + this : "a " + this;
  });

  add.method('withoutSuffix', function (suffix) {
    return this.endsWith(suffix) ? this.substr(0, this.length - suffix.length) : this;
  });

  add.creator('tests', Object.create(avocado.testCase), {category: ['tests']});

});


thisModule.addSlots(String.prototype.tests, function(add) {

  add.method('testPrependAOrAn', function () {
    this.assertEqual('an aardvark',      'aardvark'     .prependAOrAn());
    this.assertEqual('a potato',         'potato'       .prependAOrAn());
    this.assertEqual('an Ugly Aardvark', 'Ugly Aardvark'.prependAOrAn());
    this.assertEqual('a Kumquat',        'Kumquat'      .prependAOrAn());
  });

  add.method('testWithoutSuffix', function () {
    this.assertEqual('argle', 'arglebargle'.withoutSuffix('bargle'));
    this.assertEqual('argleb', 'arglebargle'.withoutSuffix('argle'));
    this.assertEqual('arglebargle', 'arglebargle'.withoutSuffix('cargle'));
  });

  add.method('testCapitalize', function () {
    this.assertEqual('Argle', 'argle'.capitalize());
    this.assertEqual('Argle', 'Argle'.capitalize());
    this.assertEqual('ArgleBargle', 'argleBargle'.capitalize());
    this.assertEqual('Argle Bargle', 'argle bargle'.capitalize());
    this.assertEqual('  \t\n ', '  \t\n '.capitalize());
  });

});


});
