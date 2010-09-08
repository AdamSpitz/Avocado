transporter.module.create('core/string_extensions', function(requires) {}, function(thisModule) {


thisModule.addSlots(String.prototype, function(add) {

  add.method('startsWithVowel', function () {
    return (/^[AEIOUaeiou]/).exec(this);
  });

  add.method('prependAOrAn', function () {
    return this.startsWithVowel() ? "an " + this : "a " + this;
  });

  add.method('withoutSuffix', function (suffix) {
    return this.endsWith(suffix) ? this.substr(0, this.length - suffix.length) : this;
  });

  add.creator('tests', Object.create(TestCase.prototype), {category: ['tests']});

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

});


});
