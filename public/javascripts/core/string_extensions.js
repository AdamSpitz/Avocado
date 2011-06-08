avocado.transporter.module.create('core/string_extensions', function(requires) {

}, function(thisModule) {


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

  add.method('replaceAt', function (i, n, s) {
    return this.substr(0, i).concat(s, this.substr(i + n));
  });

  add.method('attemptToInsertALineBreak', function () {
    // Hack. Really not sure this is gonna work, or be worth it. :) But try it and see.
    var middle = this.length / 2;
    var i1 = this.indexOf(' ', middle);
    var i2 = this.lastIndexOf(' ', middle);
    var i = (Math.abs(middle - i1) > Math.abs(middle - i2)) ? i2 : i1;
    if (i < 0) { return this.substring(0); } // I have ABSOLUTELY NO IDEA why the call to substring is necessary; VM bug in Chrome?
    return this.replaceAt(i, 1, '\n');
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

  add.method('testReplaceAt', function () {
    this.assertEqual('arxle', 'argle'.replaceAt(2, 1, 'x'));
    this.assertEqual('xngle', 'argle'.replaceAt(0, 2, 'xn'));
  });

  add.method('testInsertingLineBreaks', function () {
    this.assertEqual('abcdef', 'abcdef'.attemptToInsertALineBreak());
    this.assertEqual('abc\ndef', 'abc def'.attemptToInsertALineBreak());
    this.assertEqual('ab\ncdef', 'ab cdef'.attemptToInsertALineBreak());
    this.assertEqual('ab cd\nef', 'ab cd ef'.attemptToInsertALineBreak());
  });

});


});
