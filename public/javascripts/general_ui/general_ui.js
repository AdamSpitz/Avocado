avocado.transporter.module.create('general_ui/general_ui', function(requires) {

requires('general_ui/models');
requires('general_ui/tree_node');
requires('general_ui/applications');
requires('general_ui/message_notifier');
requires('general_ui/one_morph_per_object');
requires('general_ui/layout');
requires('general_ui/styles');
requires('general_ui/refreshing_content');
requires('general_ui/table_layout');
requires('general_ui/animation');
requires('general_ui/commands');
requires('general_ui/events');
requires('general_ui/placeholder_morph');
requires('general_ui/input_focus');
requires('general_ui/wheel_menus');
requires('general_ui/grabbing');
requires('general_ui/morph_titles');
requires('general_ui/highlighting');
requires('general_ui/invisibility');
requires('general_ui/morph_structure');
requires('general_ui/scaling');
requires('general_ui/poses');
requires('general_ui/toggler');
requires('general_ui/arrows');
requires('general_ui/history_morph');
requires('general_ui/string_buffer_morph');
requires('general_ui/scripting');
requires('general_ui/active_sentence');
requires('general_ui/similar_objects');

}, function(thisModule) {


thisModule.addSlots(avocado.generalUI, function(add) {

  add.data('shouldEnableMouseFreeMenuExperiment', true);

  add.method('grab', function (obj, evt, callback) {
    var m = this.worldFor(evt).morphFor(obj);
    m.grabMe(evt, callback);
    return m;
  });

  add.method('growFromNothing', function (obj, evt) {
    var m = this.worldFor(evt).morphFor(obj);
    m.grabMe(evt);
    return m;
  });

  add.method('navigateTo', function (obj, callback, evt) {
    var m = this.worldFor(evt).morphFor(obj);
    m.navigateToMe(evt, callback);
    return m;
  });

  add.method('showCentered', function (obj, callback, evt) {
    var w = this.worldFor(evt);
    var m = w.morphFor(obj);
    m.showInCenterOfUsersFieldOfVision(w, function() {
      if (callback) { callback(m); }
    });
  });

  add.method('showCenteredAndNavigateTo', function (obj, callback, evt) {
    this.showCentered(obj, function () {
      this.justChanged(obj, function() {
        this.navigateTo(obj, function() {
          var world = this.worldFor(evt);
          world.firstHand().setKeyboardFocus(null); // aaa this is annoying, make it unnecessary
          if (callback) { setTimeout(callback, 0); }
        }.bind(this));
      }.bind(this));
    }.bind(this));
  });

  add.method('prompt', function (msg, callback, defaultValue, evtOrMorph) {
    return this.worldFor(evtOrMorph).prompt(msg, function(value) {
      if (value === null) { return null; }
      return callback(value);
    }, defaultValue);
  });

  add.method('confirm', function (message, callback, evtOrMorph) {
    return this.worldFor(evtOrMorph).confirm(message, callback);
  });

  add.method('poseManager', function (evt) {
    return this.worldFor(evt).poseManager();
  });

  add.method('showObjects', function (objs, name, evt) {
    var pm = this.poseManager(evt);
    pm.assumePose(pm.listPoseOfMorphsFor(objs, name));
  });

  add.method('showErrorsThatOccurDuring', function (f, evt) {
    var allErrors = [];
    var errorMessage = "";
    f(function(msg, errors) {
      errorMessage += msg + "\n";
      (errors || [msg]).each(function(e) { allErrors.push(e); });
    });
    if (allErrors.length > 0) {
      this.showErrors(errorMessage, allErrors, evt);
    }
    return allErrors;
  });

  add.method('showErrors', function (msg, errors, evt) {
    var objectsToShow = [];
    errors.each(function(err) {
      if (err.objectsToShow) {
        err.objectsToShow.each(function(o) {
          if (! objectsToShow.include(o)) {
            objectsToShow.push(o);
          }
        });
      } else {
        objectsToShow.push(err);
      }
    });
    this.showObjects(objectsToShow, "errors", evt);
    this.showError(msg, evt);
  });

  add.method('showMessage', function (msg, evt) {
    this.worldFor(evt).showMessage(msg);
  });

  add.method('ensureVisible', function (obj, evt) {
    var m = this.worldFor(evt).morphFor(obj);
    if (m.ensureVisible) { m.ensureVisible(); }
  });

  add.method('transferUIState', function (oldObj, newObj, evt) {
    var world = this.worldFor(evt);
    var oldMorph = world.existingMorphFor(oldObj);
    if (oldMorph) {
      var newMorph = world.morphFor(newObj);
      oldMorph.transferUIStateTo(newMorph);
      world.forgetAboutExistingMorphFor(oldObj, oldMorph);
      return newMorph;
    } else {
      return null;
    }
  });

  add.method('justChanged', function (obj, callback, evt) {
    var ui = this;
    setTimeout(function() {
      var m = ui.worldFor(evt).existingMorphFor(obj);
      if (m) { m.refreshContentIfOnScreenOfMeAndSubmorphs(); }
      if (callback) { callback(m); }
    }, 0);
  });

  add.method('justChangedContent', function (obj, evt) {
    // aaa - I don't like that this method and justChanged are different.
    var m = this.worldFor(evt).morphFor(obj);
    m.refreshContentOfMeAndSubmorphs();
    m.justChangedContent();
  });

  add.method('setInputFocus', function (obj, evt) {
    var w = this.worldFor(evt);
    var m = w.existingMorphFor(obj);
    var h = (evt ? evt.hand : null) || w.firstHand();
    if (m) { m.takeInputFocus(h); }
  });

  add.method('showMessageIfErrorDuring', function (f, evt) {
    return avocado.messageNotifier.showIfErrorDuring(f, evt);
  });

  add.method('showMessageIfWarningDuring', function (f, evt) {
    return avocado.messageNotifier.showIfErrorDuring(f, evt, new Color(1.0, 0.55, 0.0));
  });

  add.method('showError', function (err, evt) {
    avocado.messageNotifier.showError(err, evt);
  });

  add.method('showMenu', function (cmdList, target, caption, evt) {
    var world = this.worldFor(evt);
    var targetMorph = world.existingMorphFor(target) || world;
    var menu = cmdList.createMenu(targetMorph);
    menu.openIn(world, (evt || Event.createFake()).point(), false, caption);
  });

  add.method('createSpacer', function () {
    return avocado.table.newRowMorph().beInvisible().beSpaceFilling();
  });

});


});
