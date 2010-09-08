// aaa - A hack to allow someone to ask to be notified when a particular morph
// changes. Useful for arrows - we can make sure to update the arrow the instant
// its endpoint moves.

Morph.addMethods({
    changed: function() {
        // Note most morphs don't need this in SVG, but text needs the
        // call on bounds() to trigger layout on new bounds
        if(this.owner) this.owner.invalidRect(this.bounds());
        
        if (this._changeNotifier) { this._changeNotifier.notifyAllObservers(); } // Added by Adam
    },

    changeNotifier: function() { return this._changeNotifier || (this._changeNotifier = notifier.on(this)); },
});
