Event.addMethods({
  preventDefault: function() {
    this.rawEvent.preventDefault();
    this.rawEvent.returnValue = false; // Added because I think it might help on Windows, though I'm really not sure. -- Adam, 2008
  }
});

WorldMorph.addMethods({
  prompt: function(message, callback, defaultInput) {
    // aaa: LK actually has a prompt dialog thing, except it seems (as of Feb. 2009) to be broken.
    // I doubt it's hard to fix, but for now I don't wanna get distracted by it. -- Adam
    callback.call(Global, window.prompt(message, defaultInput));
  }
});
