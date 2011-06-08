avocado.transporter.module.create('core/little_profiler', function(requires) {

}, function(thisModule) {


thisModule.addSlots(avocado, function(add) {

  add.creator('littleProfiler', {}, {category: ['profiling']}, {comment: 'Nothing clever, just a little object for helping to see where the time is going in a method.'});

});


thisModule.addSlots(avocado.littleProfiler, function(add) {

  add.method('named', function (name) {
    return Object.newChildOf(this, name);
  });

  add.method('initialize', function (name) {
    this._name = name;
    this._times = [];
    this.recordTime();
  });

  add.method('recordTime', function () {
    this._times.push(new Date().getTime());
  });

  add.method('totalTime', function () {
    return this._times.last() - this._times.first();
  });

  add.method('printTimes', function () {
    this.recordTime();
    var s = avocado.stringBuffer.create("Profile of ").append(this._name).append(": total time ").append(this.totalTime());
    s.append(", in-between times: ");
    sep = "";
    for (var i = 0; i < this._times.length - 1; ++i) {
      s.append(sep).append(this._times[i+1] - this._times[i]);
      sep = ", ";
    }
    console.log(s.toString());
  });

});


});
