/*
 * Copyright (c) 2006-2009 Sun Microsystems, Inc.
 *
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.

 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

/**
 * Main.js.  System startup and demo loading.
 */

module('lively.Main').requires().toRun(function() {

Object.extend(Global, {
	onload: function main() { // window.onload
		// the delay here is a workaround to give FF 2.0 the time to update
		// the DOM to reflect the geometry of objects on the screen, which is
		// needed to figure out font geometry. Apparently the update happens
		// after control returns to the caller of JS
		function main() { new lively.Main.Loader().systemStart() };
		main.logCompletion("main").delay(Config.mainDelay);
		// alternative? window.addEventListener("DOMContentLoaded", main, false);
	},	
});

Object.subclass('lively.Main.Loader', {

	configPatches: function() {
		// Class browser visibility can be overridden with Config.browserAnyway
		Config.showBrowser = !Config.skipMostExamples || Config.browserAnyway;
	},

	debuggingExtras: function() {
		// Name the methods for showStack
		if (Config.tallyLOC && lively.lang.Execution.tallyLOC) lively.lang.Execution.tallyLOC();
		// Name the methods for showStack
		if (Config.debugExtras) lively.lang.Execution.installStackTracers();
	},

	clipboardHack: function() {
		if (!Config.suppressClipboardHack) ClipboardHack.ensurePasteBuffer();
	},

	replaceWindowMorphIfNotExisiting: function() {
		// This stub allows us to run without Widgets.js
		if(!WindowMorph) { WindowMorph = function() {} }
	},

	documentHasSerializedMorphs: function(doc) {
	    var nodes = doc.getElementsByTagName("g");
		return nodes && nodes.length > 0;
		// nodes[0].getAttribute("type") == "WorldMorph"; // world is not always serialized
	},

	setupCounter: function(doc) {
		var maxCount = new Query('//*[@id]').findAll(doc).inject(0, function(max, ea) {
			function getNumber(id) { return Number(id.split(':')[0]) }
			var no =  getNumber(ea.getAttribute('id')) || 0
			return Math.max(max, no);
		});
		lively.data.Wrapper.prototype.newId(maxCount);
	},

	browserSpecificFixes: function() {
		if (Global.navigator.appName == 'Opera')
			window.onresize();
	},

	showWikiNavigator: function() {
		require('lively.LKWiki').toRun(function() {
			console.log('starting WikiNavigator');
			WikiNavigator.enableWikiNavigator();
		});
	},

	systemStart: function() {
		console.group("World loading");

		// -----------------
		this.configPatches();
		this.debuggingExtras();
		this.clipboardHack();
		this.replaceWindowMorphIfNotExisiting()
		// ------------------------

	    var world = null;
	    var canvas = Global.document.getElementById("canvas");
		var loader = this;


	    if (canvas.height && canvas.height.baseVal && canvas.height.baseVal.value < 200) {
	        // a forced value, some browsers have problems with height=100%
	        canvas.setAttribute("height", "800");
	    }
	    var importer = new Importer();

		Event.prepareEventSystem();

		if (loader.documentHasSerializedMorphs(document)) {
			loader.setupCounter(document);
	        require(Config.modulesBeforeChanges).toRun(function() {
				var changes = !Config.skipChanges && ChangeSet.fromWorld(document.documentElement);
				changes && changes.evaluateWorldRequirements();
				require(Config.modulesBeforeWorldLoad).toRun(function() {
					changes && changes.evaluateAllButInitializer();
					require(Config.modulesOnWorldLoad).toRun(function() {
						world = importer.loadWorldContents(document);
			            world.displayOnCanvas(canvas);
			            console.log("world is " + world);
						changes && changes.evaluateInitializer();

			            if (Config.showWikiNavigator) loader.showWikiNavigator();

						console.groupEnd("World loading");
					})
				})
	        })
	    } else {
			// Create an empty world
			require(Config.modulesBeforeChanges.concat(Config.modulesBeforeWorldLoad).concat(Config.modulesOnWorldLoad)).toRun(function() {
				world = new WorldMorph(canvas);
				world.displayOnCanvas(canvas);

				console.log("created empty world");
				console.groupEnd("World loading");

				loader.browserSpecificFixes();

				if(Config.useShadowMorphs) HandMorph.prototype.useShadowMorphs = true;

				if (!Config.skipAllExamples)
					new lively.Main.ExampleLoader().populateWorldWithExamples(world);

			})
	    }

	},
});


// uses demo flags from defaultconfig.js and localconfig.js
Object.subclass('lively.Main.ExampleLoader', {

	showStar: function(world) {
		if (Config.showStar) {  // Make a star
			var makeStarVertices = function(r,center,startAngle) {
				var vertices = [];
				var nVerts = 10;
				for (var i=0; i <= nVerts; i++) {
					var a = startAngle + (2*Math.PI/nVerts*i);
					var p = Point.polar(r,a);
					if (i%2 == 0) p = p.scaleBy(0.39);
					vertices.push(p.addPt(center));
				}
				return vertices;
			}

			widget = Morph.makePolygon(makeStarVertices(50,pt(0,0),0), 1, Color.black, Color.yellow);
			widget.setPosition(pt(125, 275));
			world.addMorph(widget);

			if (Config.showStar && Config.spinningStar) {  // Make the star spin as a test of stepping
				widget.startStepping(60, "rotateBy", 0.1);
				if (world !== WorldMorph.current()) world.suspendAllActiveScripts();
			}
		}
	},

	showSampleMorphs: function(world) {
		if (Config.showSampleMorphs) {
			var colors = Color.wheel(4);
			var loc = pt(150, 450);
			var widgetExtent = pt(70, 30);
			var dy = pt(0,50);
			var dx = pt(120,0);

			// Create a sample rectangle
			widget = Morph.makeRectangle(loc, widgetExtent);
			widget.setFill(colors[0]);
			world.addMorph(widget);

			// Create a sample ellipse
			widget = Morph.makeEllipse(loc.addPt(dx).extent(widgetExtent), 1, Color.black, colors[1]);
			world.addMorph(widget);

			// Create a sample line
			loc = loc.addPt(dy);
			widget = Morph.makeLine([pt(0,0), pt(70,0)], 2, Color.black);
			widget.setPosition(loc.addXY(0,15));
			world.addMorph(widget);

			// Create a sample polygon
			widget = Morph.makePolygon([pt(0,0),pt(70,0),pt(40,30)], 1, Color.black, colors[2]);
			world.addMorph(widget);
			widget.setPosition(loc.addPt(dx));
			loc = loc.addPt(dy);

			// Create sample text morphs
			if (Config.showTextSamples) {
				widget = new TextMorph(loc.extent(pt(100,50)),"Big Text"); // big text
				world.addMorph(widget.applyStyle({fontSize: 20, textColor: Color.blue}));

				widget = new TextMorph(loc.addPt(dx).extent(pt(140,50)),"Unbordered"); // unbordered text
				world.addMorph(widget.applyStyle({fontSize: 20, borderWidth: 0, fill: null}));
			}
		}
	},

    populateSlideWorld: function(world) {
		if(Config.showWebStack) {
			var loc = pt(100, 80);
			var captions = [
			"               JavaScript",
			"                 Widgets",
			"      HTML, CSS, DOM, etc.",
			"                Browser",
			"    OS: Network, Graphics, ..."
			];
			for (var i = 0; i < captions.length; i++) { // add boxed text
				var txt = new TextMorph(loc.extent(pt(300, 50)), captions[i]);
				txt.applyStyle({fontSize: 20, fill: Color.hsb(70*i,0.7,0.8)});
				loc = loc.addXY(0,35);
				world.addMorph(txt);
			}
		}

		this.showStar(world);
		this.showSampleMorphs(world);
	},

	makeSlideWorld: function(world) {
		var link = new LinkMorph(null, pt(60, 400));
		// KP: note that element deletion interferes with iteration, so
		// we make an array first and then remove
		link.myWorld.submorphs.clone().forEach(function(m) {
			if (m instanceof LinkMorph) return;
			m.remove();
		});
		this.populateSlideWorld(link.myWorld)
		return link;
	},

	showClock: function(world) {
		require('lively.Examples').toRun(function() {
			var widget = new ClockMorph(pt(80, 100), 50);
			world.addMorph(widget);
			widget.startSteppingScripts();
		});

	},

	showEngine: function(world) {
		require('lively.Examples').toRun(function() {
			EngineMorph.makeEngine(world, pt(230, 30))
		});
	},

	showAsteroids: function(world) {
		require('lively.Examples').toRun(function(unsused, examplesModule) {
			using(examplesModule.asteroids).run(function(app) {
				var gameMorph = app.makeGameMorph(pt(500, 360).extent(pt(600, 300)));
				world.addMorph(new WindowMorph(gameMorph, 'Asteroids!'));
				app.initialize();
				gameMorph.runAsteroidsGame();
				gameMorph.owner.collapse();
			});
		});
	},

	showSunLogo: function(world) {
		// Sample icon morph with a fisheye effect 'on'
		// maybe the icons should have a rectangle shaped images (unlike here)
		// var icon = new ImageMorph(new Rectangle(30, 330, 80, 50), "http://logos.sun.com/images/SunSample.gif");
		new NetImporter().loadElement("Definitions.svg", "SunLogo");
		var icon = new ImageMorph(new Rectangle(60, 580, 100, 45), "#SunLogo", true);
		icon.image.scaleBy(0.15);
		icon.setFill(null); // no background
		icon.toggleFisheye();
		world.addMorph(icon);
	},

	showSun3DLogo: function(world) {
		require('lively.Examples').toRun(function(unused, examplesModule) {
			world.addFramedMorph(new examplesModule.Sun3DMorph(pt(200, 200)),
			'Sun 3D Logo', pt(570, 100));
		});
	},

	showWeather: function(world) {
		require('lively.Examples').toRun(function() {
			// Maybe the icons should have rectangular images (unlike here)
			var weather = new WeatherWidget().openIn(world, pt(685, 165));
			world.topSubmorph().rotateBy(-0.2);
		});
	},

	showStocks: function(world) {
		require('lively.Examples').toRun(function() {
			var stockWidget = new StockWidget();
			stockWidget.openIn(world, pt(350, 500));
		});
	},

	showTesterRunnerForDevelopment: function() {
		var requirements = Config.loadTests.collect(function(ea) { return 'Tests.' + ea});
		if (requirements.length === 0) requirements.push('lively.TestFramework');
		require(requirements).toRun(function(currentModule) {
			TestRunner.openIn();
			console.log('Tests loaded: .............................  ' + TestCase.allSubclasses().length);
		});
	},

	showLivelyConsole: function(world) {
		if (!window.console.consumers) return
        var consoleWidget = new ConsoleWidget(50).openIn(world, pt(0,0));
		consoleWidget.setPosition(pt(0, world.viewport().height - consoleWidget.bounds().height + 20 /*magic number*/));
	},
	
	showFabrikComponents: function() {
		if (Config.showFabrikComponentBox)
			require('lively.Fabrik').toRun(function() { Fabrik.openComponentBox() });
		if (Config.showFahrenheitCelsiusExample)
			require('lively.Fabrik').toRun(function() { Fabrik.openFahrenheitCelsiusExample() });
		if (Config.showTextListExample)
			require('lively.Fabrik').toRun(function() { Fabrik.openFabrikTextListExample() });
		if (Config.openFabrikBrowserExample)
			require('lively.Fabrik').toRun(function() { Fabrik.openFabrikBrowserExample() });
		if (Config.showFabrikWebRequestExample)
			require('lively.Fabrik').toRun(function() { Fabrik.openFabrikWebRequestExample() });
		if (Config.showFabrikWeatherWidgetExample)
			require('lively.Fabrik').toRun(function() { Fabrik.openFabrikWeatherWidgetExample() });
	},

	showTileScripting: function() {
		require('lively.TileScripting').toRun(function(unused, tsModule) { tsModule.TileBox.open() });
	},

	showToolDock: function() {
		require('lively.Helper').toRun(function(unused, helper) { new helper.ToolDock().startUp(); })
	},

	showInnerWorld: function(world) {
		var lm1 = new LinkMorph(null, pt(60, 460));
		world.addMorph(lm1);
		lm1.addLabel("More complex sample widgets");

		lm1.myWorld.onEnter = function() {
			if (this.enterCount > 0) return;

			require('lively.WebPIM').toRun(function() {
				PIM = new WebPIM().openIn(lm1.myWorld, pt(200, 110));
			});


			if (Config.showRSSReader() && Config.showNetworkExamples) {
				require('lively.Examples').toRun(function() {
					console.log('initializing RSS reader');
					new FeedWidget("http://news.cnet.com/2547-1_3-0-5.xml").openIn(lm1.myWorld, pt(725, 120));
				});
			}

			if (Config.showCanvasScape()) {
				require('lively.Examples').toRun(function(unused, examplesModule) {
					lm1.myWorld.addMorph(new WindowMorph(new examplesModule.canvascape.CanvasScapeMorph(new Rectangle(20,50,800,300)), 'CanvasScape')).collapse();
				});
			}

			if (!Config.skipMostExamples && Config.showMap) {
				require('lively.Examples').toRun(function(unused, exampleModule) {
					var tile = exampleModule.maps.tileExtent;
					var map = new MapFrameMorph(new Rectangle(0, 0, 2*tile.x, 2*tile.y), true);
					map.setScale(0.7);
					map.setPosition(pt(160, 250));
					lm1.myWorld.addMorph(map);
				});
			}

			// Add sample curve stuff
			if (Config.showCurveExample) {
				var g = lively.scene;
				// bezier blob
				var shape = new g.Path([
					new g.MoveTo(true, 0,  0),
					new g.CurveTo(true, 50, 0),
					new g.CurveTo(true, 50, 50),
					new g.CurveTo(true, 0, 50),
					new g.CurveTo(true, 0, 0)
					]);
				var widget = widget = new Morph(shape);
				widget.applyStyle({fill: Color.red, borderWidth: 3, borderColor: Color.black});
				this.addMorph(widget);

				// rectangle with rounded corners
				var shape = new g.Path([
					new g.MoveTo(true, 10,  0),
					new g.CurveTo(true, 60, 0),
					new g.CurveTo(true, 70, 10),
					new g.CurveTo(true, 70, 40),
					new g.CurveTo(true, 60, 50),
					new g.CurveTo(true, 10, 50),
					new g.CurveTo(true, 0, 40),
					new g.CurveTo(true, 0, 10),
					new g.CurveTo(true, 10, 0),
					]);

				// for (var i = 2; i<=8; i+=2) {
				//     // this will work too
				//     // shape2[i].radius = pt(10,10); shape2[i].type = "arc";
				//     shape2[i].radius = 10; shape2[i].type = "arc";
				// }
				widget = new Morph(shape);
				widget.applyStyle({fill: Color.green, borderWidth: 2, borderColor: Color.red});
				this.addMorph(widget);
			}

			if (Config.showBitmap) {
				var width = 800;
				var height = 500;
				var url = "http://maps.google.com/mapdata?"+
				"Point=b&Point.latitude_e6=61500000&Point.longitude_e6=-3191200000&Point.iconid=15&"+
				"Point=e&Point=b&Point.latitude_e6=61500000&Point.longitude_e6=-3191200600&Point.iconid=16&"+
				"Point=e&latitude_e6=61500000&longitude_e6=-3191200000&zm=8000&w=" +
				width + "&h=" + height + "&cc=US&min_priority=2";
				this.addMorphBack(new WindowMorph(new ImageMorph(new Rectangle(50, 10, width, height), url, true), 'Tampere'));
			}

			if (Config.showSquiggle())
				require('lively.Examples').toRun(function() {
					lm1.myWorld.addFramedMorph(new SquiggleMorph(pt(300, 300)), 'Freehand', pt(560, 380));
				});

			if (Config.showVideo())
				require('lively.Helper').toRun(function() { new VideoMorph().openExample(lm1.myWorld) });

		} // lm1.myWorld.onEnter	
	},

	showSlideWorld: function(world) {
		// load from slideWorld
		// Make a slide for "turning web programming upside down"
		if (Config.loadSerializedSubworlds) {
			var importer = new NetImporter();
			importer.onWorldLoad = function(slideWorld, er) {
				var link = world.addMorph(new LinkMorph(slideWorld, pt(60, 400)));
				link.addLabel("Simple example morphs");
			}
			importer.loadMarkup(URL.source.withFilename("slide.xhtml"));

		} else {
			var link = this.makeSlideWorld(world);
			link.addLabel("Simple example morphs");
			world.addMorph(link);
		}
	},

	showDeveloperWorld: function(world) {
		var devWorld = new LinkMorph(null, pt(60, 520));
		world.addMorph(devWorld);
		devWorld.addLabel("Development Tools");

		if (Config.showBrowser) new SimpleBrowser().openIn(devWorld.myWorld, pt(20, 20));

		if (Config.showTester)
			require('lively.Examples').toRun(function() { new TestWidget().openIn(devWorld.myWorld, pt(835, 450)) });


		if (!Config.skipMostExamples && !UserAgent.isTouch) new ObjectBrowser().openIn(devWorld.myWorld, pt(50, 100));

		// Sample executable script pane
		if (Config.showPenScript) {
			require('lively.Tools').toRun(function() {
				var parser = new CodeMarkupParser(new URL(Config.codeBase).withFilename('Pen.lkml'));
				parser.onComplete = function() {
					var widget;
					if (Config.showTestText) widget = new TestTextMorph(pt(50,30).extent(pt(250,50)), Pen.script);
					else widget = new TextMorph(pt(50,30).extent(pt(250,50)), Pen.script);
					widget.align(widget.bounds().bottomRight(), world.bounds().topRight().addPt(pt(-150,100)));
					if (Config.showHilbertFun) Pen.hilbertFun(devWorld.myWorld, widget.bounds().bottomLeft().addXY(180,80));
					devWorld.myWorld.addMorph(widget);
					if (Config.tryFasteroids)
					require('lively.Contributions').toRun(function() {
						lively.Contributions.installFasteroids(world, new Rectangle(150, 100, 600, 400));
					});
				}
				parser.parse();
			});
		}

		if (Config.showWebStore()) {
			var store = new FileBrowser();
			store.openIn(Config.webStoreInMain ? WorldMorph.current() : devWorld.myWorld, pt(460, 120));
		}

		if (Config.showDOMBrowser) {
			var browser = new DOMBrowser();
			console.log('showing DOMBrowser!');
			browser.openIn(Config.webStoreInMain ? WorldMorph.current() : devWorld.myWorld, pt(260, 120));
		}

		if (Config.showTwoPaneObjectBrowser) {
			var browser = new TwoPaneObjectBrowser();
			console.log('showing TwoPaneBrowser!');
			browser.openIn(Config.webStoreInMain ? WorldMorph.current() : devWorld.myWorld, pt(160, 150));
		}

		if (Config.showGridDemo)
			require('lively.GridLayout').toRun(function() {
				alert('demo!!');
				GridLayoutMorph.demo(devWorld.myWorld, pt(90,450));
			});

		if (Config.showTesterRunner) {
			// require('lively/TestFramework.js').toRun(function(currentModule) {
				//     // Just show a few of our various tests
				//     var tests = ['Tests/FabrikTest.js', 'Tests/TestFrameworkTests.js']
				//     currentModule.requires(tests).toRun(function() {
					//         TestRunner.openIn(devWorld.myWorld, pt(500, 100))
					//     });
					// });
		}
	},

	showPhoneWorld: function(world) {
		require('lively.phone').toRun(function() {
			var phoneWorld = new LinkMorph(null, pt(60, 320));
			world.addMorph(phoneWorld);
			phoneWorld.addLabel("Telephone Demo");
			Global.phoneDemo(phoneWorld.myWorld, pt(250,180), 150);
		})
	},

	showFabrikWorld: function(world) {
		require('lively.Fabrik').toRun(function() {
			var fabrikWorld = new LinkMorph(null, pt(60, 330));
			world.addMorph(fabrikWorld);
			fabrikWorld.addLabel("Visual programming with Fabrik");
			fabrikWorld.myWorld.onEnter = function() {
				if (this.enterCount > 0) return;
				Global.Fabrik.openFabrikBrowserExample(fabrikWorld.myWorld, pt(70,245));
				Global.Fabrik.openFahrenheitCelsiusExample(fabrikWorld.myWorld, pt(100,20));
				Global.Fabrik.openComponentBox(fabrikWorld.myWorld, pt(620,100));
				Global.Fabrik.openFabrikWebRequestExample(fabrikWorld.myWorld, pt(400,445));
			};
		});
	},

	// Populate the world with sample objects, widgets and applications
	populateWorldWithExamples: function(world) {

		if (Config.showOnlySimpleMorphs) {
			// Simply put basic shapes in world and nothing else (for testing)
			this.populateSlideWorld(world);
			// If Tools.js is loaded, and Config.debugExtras == true
			//   then the following call will print a trace of populateSlideWorld
			//   to the console...
			// lively.lang.Execution.trace(function() {populateSlideWorld(world) });
			return;
		}

		var widget;

		if (Config.showClock) this.showClock(world)
		if (Config.showEngine()) this.showEngine(world);
		if (Config.showAsteroids()) this.showAsteroids(world);
		if (false) this.showSunLogo(world); // Do not show the Sun logo; it's a registered trademark
		if (false) this.showSun3DLogo(world); // Do not show the Sun logo;  it's a registered trademark
		if (Config.showWeather() && Config.showNetworkExamples) this.showWeather(world);
		if (Config.showStocks() && Config.showNetworkExamples) this.showStocks(world);

		if (Config.showTesterRunnerForDevelopment) this.showTesterRunnerForDevelopment()

		this.showFabrikComponents();

		if (Config.activateTileScripting) this.showTileScripting();
		if (Config.showToolDock) this.showToolDock();

		if (Config.showInnerWorld) this.showInnerWorld(world);
		if (Config.showSlideWorld) this.showSlideWorld(world);
		if (Config.showDeveloperWorld) this.showDeveloperWorld(world);
		if (Config.showPhoneWorld) this.showPhoneWorld(world);

	    if (Config.showLivelyConsole) this.showLivelyConsole(world);

		if (Config.testTracing) lively.lang.Execution.testTrace();

		return world;
	},

});

}); // end of module