avocado.transporter.module.create('general_ui/input_focus', function(requires) {

requires('general_ui/basic_morph_mixins');

}, function(thisModule) {


thisModule.addSlots(avocado.morphMixins.Morph, function(add) {

  add.method('takeMouseAndKeyboardFocus', function (hand) {
    hand = hand || avocado.ui.currentWorld().firstHand();
    hand.setMouseFocus(this);
    hand.setKeyboardFocus(this);
  }, {category: ['events']});

  add.method('releaseMouseAndKeyboardFocus', function (hand) {
    hand = hand || avocado.ui.currentWorld().firstHand();
    hand.setMouseFocus(null);
    hand.setKeyboardFocus(null);
  }, {category: ['events']});
  
});


});
