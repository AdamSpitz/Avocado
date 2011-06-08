avocado.transporter.module.create('core/sound', function(requires) {

}, function(thisModule) {


thisModule.addSlots(avocado, function(add) {

  add.creator('sound', {}, {category: ['sound']}, {comment: 'Uses the HTML5 <audio> tag to play sound files.'});

});


thisModule.addSlots(avocado.sound, function(add) {

  add.method('fromFile', function (path) {
    return Object.newChildOf(this, path);
  }, {category: ['creating']});

  add.method('initialize', function (path) {
    this._audioElement = document.createElement('audio');
    this._audioElement.setAttribute('src', path);
  }, {category: ['creating']});

  add.method('play', function () { this._audioElement.play();             }, {category: ['playing']});

  add.method('pause', function () { this._audioElement.play();             }, {category: ['playing']});

  add.method('volume', function () { return this._audioElement.volume;      }, {category: ['volume']});

  add.method('setVolume', function (v) { this._audioElement.volume      = v;    }, {category: ['volume']});

  add.method('currentTime', function (t) { return this._audioElement.currentTime; }, {category: ['seeking']});

  add.method('setCurrentTime', function (t) { this._audioElement.currentTime = t;    }, {category: ['seeking']});

  add.method('load', function (callback) {
    this._audioElement.addEventListener("load", callback, true);
    this._audioElement.load();
  }, {category: ['playing']});

});


});
