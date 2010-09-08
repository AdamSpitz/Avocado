// Nothing clever, just a little object for helping me see what's going on in a method.

var littleProfiler = {

  named: function(name) {
    return Object.newChildOf(this, name);
  },

  initialize: function(name) {
    this._name = name;
    this._times = [];
    this.recordTime();
  },

  recordTime: function() {
    this._times.push(new Date().getTime());
  },

  totalTime: function() {
    return this._times.last() - this._times.first();
  },

  printTimes: function() {
    this.recordTime();
    var s = stringBuffer.create("Profile of ").append(this._name).append(": total time ").append(this.totalTime());
    s.append(", in-between times: ");
    sep = "";
    for (var i = 0; i < this._times.length - 1; ++i) {
      s.append(sep).append(this._times[i+1] - this._times[i]);
      sep = ", ";
    }
    console.log(s.toString());
  },
};
