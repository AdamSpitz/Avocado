transporter.module.create('core/string_buffer', function(requires) {

}, function(thisModule) {


thisModule.addSlots(avocado, function(add) {

  add.creator('stringBuffer', {}, {category: ['core']}, {comment: 'Lets you append a whole bunch of strings and then join them all at once, so you don\'t get quadratic behavior.'});

});


thisModule.addSlots(avocado.stringBuffer, function(add) {

  add.method('create', function (initialString) {
    return Object.newChildOf(this, initialString);
  }, {category: ['creating']});

  add.method('initialize', function (initialString) {
    this.buffer = [];
    if (initialString !== undefined && initialString !== null) {this.append(initialString);}
  }, {category: ['creating']});

  add.method('append', function (string) {
    this.buffer.push(string);
    return this;
  }, {category: ['adding']});

  add.method('prepend', function (string) {
    this.buffer.unshift(string);
    return this;
  }, {category: ['adding']});

  add.method('toString', function () {
    return this.buffer.join("");
  }, {category: ['converting']});

  add.method('concat', function (other1, other2) {
    var newOne = this.create();
    newOne.buffer = this.buffer.concat(other1.buffer, other2 ? other2.buffer : undefined);
    return newOne;
  }, {category: ['concatenating']});

  add.creator('tests', Object.create(avocado.testCase), {category: ['tests']});

});


thisModule.addSlots(avocado.stringBuffer.tests, function(add) {

  add.method('testStuff', function (initialString) {
    var s = avocado.stringBuffer.create('The');
    this.assertEqual('The', s.toString());
    s.append(' quick').append(' brown fox');
    this.assertEqual('The quick brown fox', s.toString());
  });

});


});
