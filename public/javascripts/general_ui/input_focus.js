avocado.transporter.module.create('general_ui/input_focus', function(requires) {

requires('general_ui/basic_morph_mixins');

}, function(thisModule) {


thisModule.addSlots(avocado.morphMixins.Morph, function(add) {

  add.method('takeInputFocus', function (hand, shouldGoBackwards) {
    var m = shouldGoBackwards ? this._firstSubmorphToReceiveInputFocusBackwards : this._firstSubmorphToReceiveInputFocusForwards;
    if (m) {
      if (typeof(m) === 'function') { m = m(); }
      if (m) { m.takeInputFocus(hand, shouldGoBackwards); }
    } else {
      var evt = Event.createFake(hand);
      if (typeof(this.prepareForUserInput) === 'function') { this.prepareForUserInput(evt); }
      evt.hand.setKeyboardFocus(this);
    }
  }, {category: ['input focus']});

  add.method('passOnInputFocus', function (hand, shouldGoBackwards) {
    var m = shouldGoBackwards ? this._nextMorphToReceiveInputFocusBackwards : this._nextMorphToReceiveInputFocusForwards;
    if (m) {
      if (typeof(m) === 'function') { m = m(); }
      if (m) { m.takeInputFocus(hand, shouldGoBackwards); }
    } else {
      m = shouldGoBackwards ? this._isFirstMorphInInputFocusOrderFor : this._isLastMorphInInputFocusOrderFor;
      if (m) {
        if (typeof(m) === 'function') { m = m(); }
        if (m) { m.passOnInputFocus(hand, shouldGoBackwards); }
      } else {
        // Actually, maybe it's better to just leave this morph with the input focus if it doesn't know where to pass it on to.
        // this.releaseInputFocus(hand);
      }
    }
  }, {category: ['input focus']});

  add.method('releaseInputFocus', function (hand) {
    hand = hand || avocado.ui.currentWorld().firstHand();
    if (hand.getMouseFocus()    === this) { hand.setMouseFocus(null); }
    if (hand.getKeyboardFocus() === this) { hand.setKeyboardFocus(null); }
  }, {category: ['input focus']});

  add.method('setOrderForInputFocus', function (morphs) {
    var first, last;
    morphs.forEach(function(m) {
      if (last) {
        last._nextMorphToReceiveInputFocusForwards = m;
        m._nextMorphToReceiveInputFocusBackwards = last;
      }
      if (! first) { first = m; }
      last = m;
    });
    
    if (first) { first._isFirstMorphInInputFocusOrderFor = this; this._firstSubmorphToReceiveInputFocusForwards  = first; }
    if (last ) {  last._isLastMorphInInputFocusOrderFor  = this; this._firstSubmorphToReceiveInputFocusBackwards = last;  }
    
    return this;
  }, {category: ['input focus']});

});


});
