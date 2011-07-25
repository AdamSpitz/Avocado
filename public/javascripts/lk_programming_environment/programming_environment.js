avocado.transporter.module.create('lk_programming_environment/programming_environment', function(requires) {

requires('avocado_lib');
requires('lk_ext/core_sampler');
requires('lk_ext/poses');
requires('lk_ext/tags');
requires('lk_ext/morph_factories');
requires('transporter/snapshotter');
requires('programming_environment/categorize_libraries');
requires('programming_environment/pretty_printer');
requires('lk_programming_environment/module_morph');
requires('lk_programming_environment/mirror_morph');
requires('lk_programming_environment/vocabulary_morph');
requires('lk_programming_environment/process_morph');
requires('lk_programming_environment/evaluator_morph');
requires('lk_programming_environment/searching');
requires('lk_programming_environment/test_case_morph');
requires('lk_programming_environment/db_morph');
requires('lk_programming_environment/project_morph');
requires('db/couch');
requires('demo/person');

}, function(thisModule) {


thisModule.addSlots(modules['lk_programming_environment/programming_environment'], function(add) {

  add.method('postFileIn', function () {
    avocado.categorizeGlobals();

    // make the window's mirror morph less unwieldy, since people tend to keep lots of stuff there
    reflect(window).categorizeUncategorizedSlotsAlphabetically();
    
    avocado.theApplication = avocado;
    
    if (avocado.world) {
      avocado.world.addApplication(avocado);
    }
  });

});


thisModule.addSlots(avocado, function(add) {

  add.method('worldName', function () { return "Avocado"; }, {category: ['printing']});

  add.data('isReflectionEnabled', true, {category: ['enabling reflection']});

  add.data('isZoomingEnabled', true, {category: ['zooming']});

  add.data('shouldMirrorsUseZooming', true, {category: ['zooming']});

  add.data('debugMode', false, {category: ['debug mode']});

  add.creator('menuItemContributors', [], {category: ['menu']});

  add.method('createAnotherMorph', function (w, wBounds, i) {
    if (i <= 0) { return; }
    var t1 = new Date().getTime();
    var m = Morph.makeRectangle(wBounds.randomPoint().extent(pt(50,50)));
    var t2 = new Date().getTime();
    w.addMorph(m);
    var t3 = new Date().getTime();
    console.log("Time to create latest morph: " + (t2 - t1) + ", and to add it: " + (t3 - t2));
    setTimeout(function() {
      var t4 = new Date().getTime();
      this.createAnotherMorph(w, wBounds, i - 1);
      console.log("Time to get to timeout: " + (t4 - t3));
    }.bind(this), 0);
  });
  
  add.creator('zoomingUIExample', {});

  add.method('addGlobalCommandsTo', function (cmdList) {
    cmdList.addLine();
    
    cmdList.addItem(["create new object", function(evt) {
      avocado.ui.growFromNothing(reflect({}), evt);
    }]);

    cmdList.addItem(["get the window object", function(evt) {
      avocado.ui.grab(reflect(window), evt);
    }]);

    if (this.debugMode) {
      cmdList.addLine();

      cmdList.addItem({label: "get person object", go: function(evt) {
        var mir = reflect(avocado.person.example);
        avocado.ui.grab(mir, evt)
      }.bind(this)});

      cmdList.addItem({label: "get container morph", go: function(evt) {
        var m = new avocado.ContainerMorph();
        evt.hand.world().addMorphAt(m, pt(100,100));
        m.contentsPanel().addMorphAt(reflect({a: 1, b: 'two'}).morph().refreshContentOfMeAndSubmorphs(), pt(30,30));
        m.contentsPanel().addMorphAt(reflect({a: 'one', b: 2}).morph().refreshContentOfMeAndSubmorphs(), pt(40,40));
        m.contentsPanel().addMorphAt(reflect({c: 'three', d: false}).morph().refreshContentOfMeAndSubmorphs(), pt(40,40));
      }.bind(this)});

      cmdList.addItem({label: "get zoomingUIExample", go: function(evt) {
        var mir = reflect(this.zoomingUIExample);
        avocado.ui.grab(mir, evt)
      }.bind(this)});

      cmdList.addItem({label: "scatter 1-50", go: function(evt) {
        var morphs = [];
        for (var i = 1; i <= 50; ++i) { morphs.push(reflect(i).morph()); }
        WorldMorph.current().scatter(morphs);
      }.bind(this)});

      cmdList.addItem({label: "group by remainders mod 5", go: function(evt) {
        var w = evt.hand.world();
        var posersByGroupID = avocado.dictionary.copyRemoveAll();
        w.submorphs.forEach(function(m) {
          var poseName = "Other";
          if ((m instanceof avocado.mirror.Morph) && m.mirror().isReflecteeNumber()) {
            poseName = (m.mirror().primitiveReflectee() % 5).toString() + " mod 5";
          }
          var posers = posersByGroupID.getOrIfAbsentPut(poseName, function() { return []; });
          posers.push(m);
        });
        
        var poses = [];
        posersByGroupID.eachKeyAndValue(function(poseName, posers) {
          poses.push(w.poseManager().cleaningUpPose(posers, poseName.toString()));
        });
        poses.sort();
        
        var compositePose = w.poseManager().cleaningUpPose(poses).beSquarish();
        w.poseManager().assumePose(compositePose);
      }.bind(this)});

      cmdList.addItem({label: "tag mod 2,3,5", go: function(evt) {
        var cloud = avocado.tag.cloud.create("numbers mod 2, 3, 5", [2, 3, 5].map(function(modulus) {
          return avocado.tag.create("numbers divsible by " + modulus, function(model) {
            if (!model.reflectee) { return false; }
            if (!model.isReflecteeNumber()) { return false; }
            return model.reflectee() % modulus === 0;
          });
        }), avocado.range.create(1, 50).map(function(i) { return reflect(i); }));
        cloud.tagAllMorphsInWorld(evt.hand.world());
        // cloud.newMorph().grabMe(evt);
      }.bind(this)});

      cmdList.addItem({label: "walk annotations", go: function(evt) {
        var walker = avocado.objectGraphWalker.visitors.annotationWalker.create().createWalker();
        walker.go();
        reflect(walker).morph().grabMe(evt);
      }.bind(this)});

      cmdList.addItem({label: "a collection morph", go: function(evt) {
        [1, 2, 3].newMorph(['toString', 'sqrt'], function(o) { return typeof(o) === 'number'; }).grabMe(evt);
      }.bind(this)});

      // useful for testing TableMorph
      cmdList.addItem({label: "senders of exitValueOf", go: function(evt) {
        avocado.ui.grab(avocado.searchResultsPresenter.create(avocado.senders.finder.create("exitValueOf"), evt)).redo();
      }.bind(this)});

      if (avocado.organization.current === avocado.organizationUsingAnnotations) {
        cmdList.addItem(["use JSQuiche organization", function(evt) {
          avocado.organization.setCurrent(avocado.organizationChain.create(avocado.organization.named(avocado.organization.name()), avocado.organizationUsingAnnotations));
        }.bind(this)]);
      } else {
        cmdList.addItem(["stop using JSQuiche organization", function(evt) {
          avocado.organization.setCurrent(avocado.organizationUsingAnnotations);
        }.bind(this)]);
      }

      cmdList.addItem(["big-object experiment", function(evt) {
        var w = evt.hand.world();
        var m = w.morphFor(reflect(TextMorph.prototype));
        m.ensureIsInWorld(w, pt(300,200), true, false, false, function() {
          m.expander().expand(evt);
        });
      }.bind(this)]);

      cmdList.addItem(["many-morphs experiment", function(evt) {
        var w = evt.hand.world();
        this.createAnotherMorph(w, w.bounds(), 1000);
      }.bind(this)]);

      var b = window.shouldNotDoAnyPeriodicalMorphUpdating;
      cmdList.addItem([(b ? "enable" : "disable") + " periodical updating", function(evt) {
        window.shouldNotDoAnyPeriodicalMorphUpdating = !b;
      }]);
    }

    this.menuItemContributors.each(function(c) {
      c.addGlobalCommandsTo(cmdList);
    });

  }, {category: ['menu']});

});


thisModule.addSlots(avocado.zoomingUIExample, function(add) {
  
  add.data('a', 1);
  
  add.data('b', 'two');
  
  add.data('c', 333);
  
  add.method('d', function(x) {
    return x + 4;
  });
  
  add.method('e', function(x) {
    return x + 5;
  }, {category: ['argle']});
  
  add.method('f', function(x) {
    return x + 6;
  }, {category: ['argle']});
  
  add.method('g', function(x) {
    return x + 7;
  }, {category: ['argle']});
  
  add.method('h', function(x) {
    return x + 8;
  }, {category: ['noodle']});
  
  add.method('i', function(x) {
    return x + 9;
  }, {category: ['noodle']});
  
  add.method('j', function(x) {
    return x + 10;
  }, {category: ['noodle']});
  
  add.method('k', function(x) {
    return x + 11;
  }, {category: ['noodle']});
  
  add.method('l', function(x) {
    return x + 12;
  });
  
  add.method('m', function(x) {
    return x + 13;
  });
  
  add.method('n', function(x) {
    return x + 14;
  });
  
  add.method('o', function(x) {
    return x + 15;
  });
  
  add.method('p', function(x) {
    return x + 16;
  });
  
});


thisModule.addSlots(avocado.menuItemContributors, function(add) {

  add.data('0', avocado.morphFactories);

  add.data('1', avocado.transporter);

  add.data('2', avocado.project);

  add.data('3', avocado.poses);

  add.data('4', avocado.testCase);

});


});
