avocado.transporter.module.create('lk_programming_environment/programming_environment', function(requires) {

requires('programming_environment/programming_environment');
requires('lk_ext/lk_ext');
requires('lk_ext/core_sampler');
requires('lk_ext/poses');
requires('lk_ext/tags');
requires('lk_ext/morph_factories');
requires('lk_programming_environment/vocabulary_morph');
requires('lk_programming_environment/process_morph');
requires('lk_programming_environment/db_morph');
requires('lk_programming_environment/project_morph');
requires('projects/projects');

}, function(thisModule) {


thisModule.addSlots(avocado.livelyKernelUI, function(add) {

  add.creator('programmingEnvironment', Object.create(avocado.programmingEnvironment), {category: ['loading']});

});


thisModule.addSlots(avocado.livelyKernelUI.programmingEnvironment, function(add) {

  add.method('loadAsTopLevelEnvironment', function ($super) {
    $super();
    
    avocado.livelyKernelUI.isZoomingEnabled = true;
    avocado.livelyKernelUI.shouldMirrorsUseZooming = false;
    avocado.livelyKernelUI.debugMode = false;
    
    // aaa - figure out a way to do this creator-slot stuff without wrecking performance of the zooming UI
    avocado.shouldBreakCreatorSlotsInOrderToImprovePerformance = false;
    
    avocado.menuItemContributors = this.menuItemContributors;
  });

  add.creator('menuItemContributors', [], {category: ['menu']});

  add.method('addUISpecificDebugModeGlobalCommandsTo', function (cmdList) {

    cmdList.addItem(["get an HTML/Canvas morph", function(evt) {
      var m = new XenoMorph(new Rectangle(0, 0, 400, 600));

      var body = document.createElement("body");
      body.setAttribute("xmlns", "http://www.w3.org/1999/xhtml");
      var div = document.createElement("div");
      //div.appendChild(document.createTextNode("The quick brown fox jumps over the lazy dog."));






			var canvas = document.createElementNS("http://www.w3.org/1999/xhtml", "canvas");
			canvas.width  = 475;
			canvas.height = 230;
    	div.appendChild(canvas);
			
			var ctx = canvas.getContext("2d");
			var x=0, y=20;
			var pix = [], dotCount = 50;
			
			//initialize array of dots
			(function init(){
			    for (var i = 0; i < dotCount; ++i) {
			        pix.push({x: canvas.width * Math.random(), y: 20 + Math.random() * canvas.height});
		      }
			}());
			
			//moving dots loop
			(function loop(){
		    if (m.world()) {
			    var mPos = m.worldPoint(pt(0,0));
			    console.log("mPos: " + mPos);
			    ctx.save();
			    ctx.globalCompositeOperation = 'source-in';
			    ctx.fillStyle = "rgba(0,0,0,0.4)";
			    ctx.fillRect(mPos.x, mPos.y, canvas.width, canvas.height);
			    ctx.restore();
			    for (var i = 0; i < dotCount; ++i) {
			        ctx.fillRect(mPos.x + ((pix[i].x += Math.random()) % canvas.width), mPos.y + ((pix[i].y += (Math.random())) % canvas.height), 2, 2);
			    }
		    }
		    setTimeout(loop, 1000 / 60)
			}());






      body.appendChild(div);
      m.foRawNode.appendChild(body);

      m.grabMe(evt);
    }]);

    cmdList.addItem(["get a textarea morph", function(evt) {
      var m = new XenoMorph(new Rectangle(0, 0, 400, 600));

      var ta = document.createElement("textarea");
      m.foRawNode.appendChild(ta);
      m.handlesMouseDown = Functions.True;
      m.handlesMouseUp = Functions.True;
      m.okToBeGrabbedBy = Functions.False;

      m.grabMe(evt);
    }]);

    cmdList.addItem(["get a line graph", function(evt) {
      var g = avocado.lineGraph.create([[1, 3, 2, 4, 3, 5, 2]]);
      avocado.ui.grab(g, evt).startPeriodicallyUpdating();
      setInterval(function() { g.lines().first().addValue(Math.random() * 10); }, 1000);
    }]);

    cmdList.addItem(["get a command object", function(evt) {
      var c = avocado.command.create('doStuff', function(evt) {
        evt.hand.world().showMessage("Doing stuff!");
      }).setArgumentSpecs([
        avocado.command.argumentSpec.create('bool').onlyAcceptsType(avocado.types.bool)
      ]);
      avocado.ui.grab(c.createPartialCommand(), evt);
    }]);

    cmdList.addItem({label: "make morph chooser", go: function(evt) {
      var w = evt.hand.world();
      var mc = new avocado.MorphChooser(avocado.types.morph.onModelOfType(avocado.types.string), function(m) { w.showMessage(m._model); });
      w.scatter(["argle", 1, true, "bargle"].map(function(o) { return w.morphFor(o); }));
      mc.grabMeWithoutZoomingAroundFirst(evt);
    }});

    cmdList.addItem({label: "get person object", go: function(evt) {
      var mir = reflect(avocado.person.example);
      avocado.ui.grab(mir, evt)
    }});

    cmdList.addItem({label: "scatter 1-50", go: function(evt) {
      var morphs = [];
      for (var i = 1; i <= 50; ++i) { morphs.push(evt.hand.world().morphFor(reflect(i))); }
      WorldMorph.current().scatter(morphs);
    }});

    cmdList.addItem({label: "group by remainders mod 5", go: function(evt) {
      var w = evt.hand.world();
      var posersByGroupID = avocado.dictionary.copyRemoveAll();
      w.eachSubmorph(function(m) {
        var poseName = "Other";
        if (m.isMirrorMorph && m.mirror().isReflecteeNumber()) {
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
    }});

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
    }});

    cmdList.addItem({label: "walk annotations", go: function(evt) {
      var walker = avocado.objectGraphWalker.visitors.annotationWalker.create().createWalker();
      walker.go();
      evt.hand.world().morphFor(reflect(walker)).grabMe(evt);
    }});

    cmdList.addItem({label: "a collection morph", go: function(evt) {
      [1, 2, 3].newMorph(['toString', 'sqrt'], function(o) { return typeof(o) === 'number'; }).grabMe(evt);
    }});

    // useful for testing TableMorph
    cmdList.addItem({label: "senders of exitValueOf", go: function(evt) {
      avocado.ui.grab(avocado.searchResultsPresenter.create(avocado.senders.finder.create("exitValueOf"), evt)).redo();
    }});

    if (avocado.organization.current === avocado.organizationUsingAnnotations) {
      cmdList.addItem(["use JSQuiche organization", function(evt) {
        avocado.organization.setCurrent(avocado.organizationChain.create(avocado.organization.named(avocado.organization.name()), avocado.organizationUsingAnnotations));
      }]);
    } else {
      cmdList.addItem(["stop using JSQuiche organization", function(evt) {
        avocado.organization.setCurrent(avocado.organizationUsingAnnotations);
      }]);
    }

    var b = window.shouldNotDoAnyPeriodicalMorphUpdating;
    cmdList.addItem([(b ? "enable" : "disable") + " periodical updating", function(evt) {
      window.shouldNotDoAnyPeriodicalMorphUpdating = !b;
    }]);

  }, {category: ['menu']});

  add.method('initializeWorld', function (world) {
    // Just a place where I can keep some code that's useful for debugging whatever I'm working on.


    /* // Trying to fix that stupid moveOriginBy bug, the one where it doesn't work for images.
    var tn = avocado.treeNode.create("Stuff", ["Argle", "Bargle"]);
    var tnm = world.morphFor(tn);
    tnm.setScale(4);
    tnm.useBackgroundImage("images/cork_board.jpg");
    world.addMorphAt(tnm, pt(500, 300));
    tnm.refreshContentOfMeAndSubmorphs();
    tnm.moveOriginBy(pt(60, 30));
    */
    
    /*
    avocado.shouldHideTextSmallerThan = 7;
    //var suiteProto = avocado.testCase.suite.forTestingAvocado();
    var suiteProto = avocado.testCase.suite.createForAppropriatelyPrefixedMethodsOf(avocado.mirror.tests);
    var suite = suiteProto.copy().makeUpSomeRandomResults(0.1);
    var history = suite.makeUpARandomResultHistory(2, 0.05, 0.05);
    var historyMorph = world.morphFor(history).applyStyle({suppressGrabbing: true, fill: null});
    world.addMorphAt(historyMorph, pt(20, 20));
    historyMorph.refreshContentOfMeAndSubmorphs();
  
    setTimeout(function() {
      history.makeUpAnotherRowOfRandomResults(0.05, 0.05, 5000, function() {
        avocado.ui.justChanged(history);
      });
    }, 5000);
    */
    
    /*
    avocado.ui.enableHTMLTextMorphExperiment = true;
    var slot = avocado.valueHolder.containing("Noodle face").setName("Kumquat").setType(avocado.types.longString);
    var slotMorph = world.morphFor(slot); //avocado.slots.userInterface.createTypeSpecificInputMorphForSlot(slot);
    world.addMorphAt(slotMorph, pt(300, 50));
    */
    
    /*
    var p = document.createElement("p");
    p.innerHTML = "The quick brown fox jumps over the lazy friggin' dog.\nYeah!\nAwesome!\nI think it's doing the shrink-wrap layout stuff. Very cool.".replace(/\n/g, "<br/>");
    var html = avocado.html.create(p);
    var htmlMorph = world.morphFor(html);
    htmlMorph.setFill(new Color(0.9, 0.9, 0.9));
    htmlMorph.setExtent(pt(300, 300));
    world.addMorphAt(htmlMorph, pt(100, 100));
    htmlMorph.forceLayoutRejiggering();
    */
    
    // avocado.ui.grab(avocado.searchResultsPresenter.create(avocado.senders.finder.create("exitValueOf"))).redo();
  }, {category: ['world initialization']});
    
});


thisModule.addSlots(avocado.livelyKernelUI.programmingEnvironment.menuItemContributors, function(add) {

  add.data('0', avocado.reflectionMenuContributor);

  add.data('1', avocado.morphFactories);

  add.data('2', avocado.transporter);

  add.data('3', avocado.project);

  add.data('4', avocado.poses);

  add.data('5', avocado.testCase);

});


});
