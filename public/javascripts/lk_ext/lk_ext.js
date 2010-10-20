transporter.module.create('lk_ext/lk_ext', function(requires) {

requires('core/math');
requires('lk_ext/fixes');
requires('lk_ext/changes');
requires('lk_ext/change_notification');
requires('lk_ext/menus');
requires('lk_ext/applications');
requires('lk_ext/grabbing');
requires('lk_ext/highlighting');
requires('lk_ext/refreshing_content');
requires('lk_ext/transporting_morphs');
requires('lk_ext/one_morph_per_object');
requires('lk_ext/text_morph_variations');
requires('lk_ext/shortcuts');
requires('lk_ext/check_box');
requires('lk_ext/combo_box');
requires('lk_ext/toggler');
requires('lk_ext/layout');
requires('lk_ext/rows_and_columns');
requires('lk_ext/animation');
requires('lk_ext/scatter');
requires('lk_ext/expander');
requires('lk_ext/message_notifier');
requires('lk_ext/arrows');
requires('lk_ext/poses');
requires('lk_ext/morph_factories');
requires('lk_ext/core_sampler');
requires('lk_ext/edit_mode');
requires('lk_ext/world_navigation');

}, function(thisModule) {

  
thisModule.addSlots(avocado, function(add) {
  
  add.creator('ui', {}, {category: ['user interface'], comment: 'An extra layer of indirection, in case we want to switch to a non-LK UI someday.\n\nDefinitely not complete yet. -- Adam, Oct. 2010'});
  
});


thisModule.addSlots(avocado.ui, function(add) {
  
  add.method('worldFor', function(evtOrMorph) {
    if (evtOrMorph) {
      if (typeof(evtOrMorph.world) === 'function') {
        return evtOrMorph.world();
      } else if (typeof(evtOrMorph.hand) === 'object') {
        return evtOrMorph.hand.world();
      }
    }
    return WorldMorph.current();
  });
  
  add.method('prompt', function(msg, callback, defaultValue, evtOrMorph) {
    return this.worldFor(evtOrMorph).prompt(msg, function(value) {
      if (value === null) { return null; }
      return callback(value);
    }, defaultValue);
  });
  
  add.method('confirm', function(message, callback, evtOrMorph) {
    return this.worldFor(evtOrMorph).confirm(message, callback);
  });
  
  add.method('grab', function(obj, evt) {
    var m = this.worldFor(evt).morphFor(obj);
    m.grabMe(evt);
    return m;
  });
  
  add.method('showObjects', function(objs, name, evt) {
    var w = this.worldFor(evt);
    w.assumePose(w.listPoseOfMorphsFor(objs, name));
  });
  
  add.method('showNextTo', function(objToBeNextTo, objToShow, evt) {
    // This is maybe a bit too much abstraction. But let's try it for now. Un-abstract
    // it if this function starts needing a million arguments. -- Adam, Oct. 2010
    var w = this.worldFor(evt);
    var morphToBeNextTo = w.morphFor(objToBeNextTo);
    w.morphFor(objToShow).ensureIsInWorld(w, morphToBeNextTo.worldPoint(pt(morphToBeNextTo.getExtent().x + 50, 0)), true, true, true);
  });
  
  add.method('showMessageIfErrorDuring', function(f, evt) {
    return avocado.MessageNotifierMorph.showIfErrorDuring(f, evt);
  });
  
  add.method('showMessageIfWarningDuring', function(f, evt) {
    return avocado.MessageNotifierMorph.showIfErrorDuring(f, evt, new Color(1.0, 0.55, 0.0));
  });
  
  add.method('showError', function(err, evt) {
    avocado.MessageNotifierMorph.showError(msg, evt);
  });
  
  add.method('showMenu', function(cmdList, target, caption, evt) {
    var menu = MenuMorph.fromCommandList(cmdList, target);
    var world = this.worldFor(evt);
    menu.openIn(world, evt.point(), false, caption);
  });
  
});


});
