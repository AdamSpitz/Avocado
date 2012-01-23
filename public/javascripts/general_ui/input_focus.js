avocado.transporter.module.create('general_ui/input_focus', function(requires) {

requires('general_ui/basic_morph_mixins');

}, function(thisModule) {


thisModule.addSlots(avocado.morphMixins.Morph, function(add) {

  add.method('takeInputFocus', function (hand, shouldGoBackwards) {
    var m = shouldGoBackwards ? this._firstSubmorphToReceiveInputFocusBackwards : this._firstSubmorphToReceiveInputFocusForwards;
    if (m) {
      if (typeof(m) === 'function') { m = m(); }
      m.takeInputFocus(hand, shouldGoBackwards);
    } else {
      hand = hand || avocado.ui.currentWorld().firstHand();
      hand.setMouseFocus(this);
      hand.setKeyboardFocus(this);
    }
  }, {category: ['input focus']});

  add.method('passOnInputFocus', function (hand, shouldGoBackwards) {
    var m = shouldGoBackwards ? this._nextMorphToReceiveInputFocusBackwards : this._nextMorphToReceiveInputFocusForwards;
    if (m) {
      if (typeof(m) === 'function') { m = m(); }
      m.takeInputFocus(hand, shouldGoBackwards);
    } else {
      m = shouldGoBackwards ? this._isFirstMorphInInputFocusOrderFor : this._isLastMorphInInputFocusOrderFor;
      if (m) {
        if (typeof(m) === 'function') { m = m(); }
        m.passOnInputFocus(hand, shouldGoBackwards);
      } else {
        this.releaseInputFocus(hand);
      }
    }
  }, {category: ['input focus']});

  add.method('releaseInputFocus', function (hand) {
    hand = hand || avocado.ui.currentWorld().firstHand();
    hand.setMouseFocus(null);
    hand.setKeyboardFocus(null);
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
