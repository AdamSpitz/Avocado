avocado.transporter.module.create('bootstrap_lk', function(requires) {}, function(thisModule) {


thisModule.addSlots(avocado.transporter, function(add) {
  
  add.creator('livelyKernelInitializer', {}, {category: ['user interface', 'lively kernel']});
  
  add.data('userInterfaceInitializer', avocado.transporter.livelyKernelInitializer, {category: ['user interface']});

});


thisModule.addSlots(avocado.transporter.livelyKernelInitializer, function(add) {

  add.method('loadUserInterface', function (callWhenDone) {
    avocado.transporter.callWhenDoneLoadingLivelyKernelCode = callWhenDone;
    if (document.body) {
      this.createCanvasIfNone();
      this.loadLivelyKernelCodeIfReadyAndTheWindowIsLoaded();
    } else {
      if (this._debugmode) {
        console.log("document.body doesn't exist yet; setting window.onload."); // aaa - I have a feeling that this doesn't work, though, at least in some browsers. -- Adam, Nov. 2010
      }
      var that = this;
      window.onload = function() { that.createCanvasIfNone(); };
      this.loadLivelyKernelCodeIfReadyAndTheWindowIsLoaded();
    }
  }, {category: ['bootstrapping']});
  
  add.method('doneLoadingWindow', function () {
    this.loadLivelyKernelCodeIfReadyAndTheWindowIsLoaded();
  }, {category: ['bootstrapping']});
  
  add.method('loadTopLevelEnvironment', function (callWhenDone) {
    
    var whichOne;
    if (window.isInCodeOrganizingMode) { whichOne = "lk_programming_environment/code_organizer";          }
    else if (window.isInRunMode)       { whichOne = "lk_programming_environment/runtime_environment";     }
    else                               { whichOne = "lk_programming_environment/programming_environment"; window.isInProgrammingEnvironmentMode = true; }
    
    avocado.transporter.fileInIfWanted(whichOne, function() {
      var topLevelEnvironment;
      if (window.isInCodeOrganizingMode) { topLevelEnvironment = jsQuiche; }
      else if (window.isInRunMode)       { topLevelEnvironment = avocado.runtime; }
      else                               { topLevelEnvironment = avocado.livelyKernelUI.programmingEnvironment; }

      topLevelEnvironment.loadAsTopLevelEnvironment();
      
      if (callWhenDone) { callWhenDone(); }
    });
  }, {category: ['bootstrapping']});

  add.method('doneLoadingAllAvocadoCode', function () {
    avocado.ui = avocado.livelyKernelUI;
  }, {category: ['bootstrapping']});
    
  add.method('createCanvasIfNone', function () {
    var canvas = document.getElementById("canvas");
    if (! canvas) {
      // Put the canvas inside a div, because for some reason FireFox isn't calculating
      // offsetLeft and offsetTop for the canvas itself. Also, allow people to specify
      // an 'avocadoDiv' element so they can control where Avocado goes on the page.
      var avocadoDiv = document.getElementById('avocadoDiv');
      if (! avocadoDiv) {
        avocadoDiv = document.createElement('div');
        document.body.appendChild(avocadoDiv);
      }
      
      canvas = document.createElementNS("http://www.w3.org/2000/svg", 'svg');
      canvas.setAttribute('id', 'canvas');
      canvas.setAttribute('width',  avocadoDiv.offsetWidth  || window.document.documentElement.clientWidth || '800'); // aaa used to say 100% but that caused some weird bug that I don't understand -- Adam, June 2011
      canvas.setAttribute('height', avocadoDiv.offsetHeight || window.document.documentElement.clientHeight * 0.99 || '620'); // 0.99 to avoid scroll bars
      canvas.setAttribute('xmlns', "http://www.w3.org/2000/svg");
      canvas.setAttribute('xmlns:lively', "http://www.experimentalstuff.com/Lively");
      canvas.setAttribute('xmlns:xlink', "http://www.w3.org/1999/xlink");
      canvas.setAttribute('xmlns:xhtml', "http://www.w3.org/1999/xhtml");
      canvas.setAttribute('xml:space', "preserve");
      canvas.setAttribute('zoomAndPan', "disable");

      var title = document.createElement('title');
      title.appendChild(document.createTextNode('Lively canvas'));
      canvas.appendChild(title);
      
      avocadoDiv.appendChild(canvas);
    }
    return canvas;
  }, {category: ['bootstrapping']});

  add.method('loadLivelyKernelCodeIfReadyAndTheWindowIsLoaded', function () {
    if (avocado.transporter.callWhenDoneLoadingLivelyKernelCode && (document.body || avocado.transporter.whatHasAlreadyBeenLoaded.isDoneLoadingWindow)) {
      this.loadLivelyKernelCode(avocado.transporter.callWhenDoneLoadingLivelyKernelCode);
    }
  }, {category: ['bootstrapping']});

  add.method('loadLivelyKernelCode', function (callWhenDone) {
    this.createCanvasIfNone();
    
    // Loading LK modules dynamically, in the same order that they are loaded in the xhtml file.   
    avocado.transporter.loadExternal(
      ["prototype/prototype",
       "lk/defaultconfig",
       "local-LK-config",
       "lk/Base",
       "lk/scene",
       "lk/Core",
       "lk/Text",
       "lk/Widgets",
       "lk/Network",
       "lk/Data",
       "lk/Storage",
       "lk/bindings",
       "lk/Tools",
       "jslint"
      ], callWhenDone
    );
  }, {category: ['bootstrapping']});

  add.method('createAvocadoWorld', function () {
    Morph.prototype.suppressBalloonHelp = true; // balloons keep staying up when they shouldn't. Suppress until fixed.
    //Morph.suppressAllHandlesForever();  //disable handles if not doing much UI construction; probably annoying.
    
    var canvas = this.createCanvasIfNone();
    
  	DisplayThemes['lively'].world.fill = Color.white;
  	
    var world = new WorldMorph(canvas);
    world.displayOnCanvas(canvas);
    modules.init.markAsUnchanged(); // because displayOnCanvas sets the creator slot of the world
    if (navigator.appName == 'Opera') { window.onresize(); }
    if (avocado.transporter.shouldLog) { console.log("The world should be visible now."); }
    // this.initializeGestures(world); // aaa disable loading of mootools for now, since we're not using moosture
    return world;
  }, {category: ['bootstrapping']});

  add.method('initializeGestures', function (world) {
    //Moosture gesture experiments
    var gstr = new Moousture.ReducedLevenMatcher({reduceConsistency: 1});
    var probe = new (UserAgent.isTouch ? Moousture.iPhoneProbe : Moousture.MouseProbe)(world); //$(document));
    var recorder = new Moousture.Recorder({maxSteps: 20, minSteps: 8, matcher: gstr});
    var monitor = new Moousture.Monitor(20, 1);
    //CCW circle motion vectors
    //gstr.addGesture([3,2,1,0,7,6,5,4], ccwCircle);
    //Make a triangle
    function triMov(error){
      if (error * 10 >= 8) { return; }
      world.showContextMenu(Event.createFake());
    }

    gstr.addGesture([7, 1, 7, 1], triMov);
    //Zig zag swipe vectors
    //gstr.addGesture([4, 0, 4, 0], swipeMouse);
    
    //var swipeProbe = new Moousture.iPhoneProbe(world.rawNode);
    //var swipeMonitor = new Moousture.Monitor(20, 1);
    //var swipeMatcher = new Moousture.ReducedLevenMatcher({reduceConsistency: 4});
    //var swipeRecorder = new Moousture.Recorder({maxSteps: 50, minSteps: 2, matcher: swipeMatcher});
    
    //swipeMatcher.addGesture([0], rightSwipe);
    //swipeMatcher.addGesture([4], leftSwipe);
    
    monitor.start(probe, recorder);
    //swipeMonitor.start(swipeProbe, swipeRecorder);
  }, {category: ['bootstrapping']});
  
});


});
