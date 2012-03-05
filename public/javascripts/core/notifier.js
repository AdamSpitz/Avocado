avocado.transporter.module.create('core/notifier', function(requires) {

requires('core/collections/hash_table');

}, function(thisModule) {


thisModule.addSlots(avocado, function(add) {

  add.creator('notifier', {}, {category: ['core']}, {comment: 'Keeps track of a list of observers and notifies them when requested.'});

});


thisModule.addSlots(avocado.notifier, function(add) {

  add.method('on', function (s) {
    return Object.newChildOf(this, s);
  });

  add.method('initialize', function (s) {
    this.subject = s;
    this.observers = Object.newChildOf(avocado.set, avocado.set.identityComparator);
  });

  add.method('addObserver', function (o) {
    this.observers.add(o);
  });

  add.method('removeObserver', function (o) {
    this.observers.remove(o);
  });

  add.method('notifyAllObservers', function (arg) {
    var s = this.subject;
    this.observers.each(function(o) {o(s, arg);});
  });

  add.creator('tests', Object.create(avocado.testCase), {category: ['tests']});

});


thisModule.addSlots(avocado.notifier.tests, function(add) {

  add.method('testStuff', function (o) {
    var n = avocado.notifier.on(3);
    var sum = 0;
    n.notifyAllObservers(1);
    n.addObserver(function(s, arg) { sum += (arg * s); });
    n.notifyAllObservers(2);
    this.assertEqual(6, sum);
    n.notifyAllObservers(3);
    this.assertEqual(15, sum);
    n.addObserver(function(s, arg) { sum += (arg - s); });
    n.notifyAllObservers(4);
    this.assertEqual(28, sum);
  });

});


});
