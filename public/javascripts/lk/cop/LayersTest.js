/*
 * Copyright (c) 2009-2010 Hasso-Plattner-Institut
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

module('cop.LayersTest').requires('cop.Layers', 'lively.TestFramework', 'cop.CopBenchmark').toRun(function(thisModule) {


// COP Example from: Hirschfeld, Costanza, Nierstrasz. 2008. Context-oriented Programming. JOT)
var copExample = function() { 


createLayer("AddressLayer");
createLayer("EmploymentLayer");

Object.subclass('cop.example.Person', {
	
	initialize: function(newName, newAddress, newEmployer) {
		this.name = newName;
		this.address = newAddress;
		this.employer = newEmployer;
	},
	
	print: function() {
		return "Name: " + this.name;
	},
	
	AddressLayer$print: function(proceed) {
		return proceed() + "; Address: " + this.address;
	},
	
	EmploymentLayer$print: function(proceed) {
		return proceed() + "; [Employer] " + this.employer.print();
	},
	
	toString: function() {
		return "Person: " + this.name;
	}

}); 


Object.subclass('cop.example.Employer', {
	
	initialize: function(newName, newAddress) {
		this.name = newName;
		this.address = newAddress;
	},
	
	print: function() {
		return "Name: " + this.name;
	},
	
	toString: function() {
		return "Employer: " + this.name;
	}
});

layerClass(AddressLayer, cop.example.Employer, {
	print: function(proceed) {
		return proceed() + "; Address: " + this.address;
	}
});

};

createLayer("DummyLayer");
createLayer("DummyLayer2");
createLayer("DummyLayer3");


Object.subclass('cop.example.DummyClass', {
	initialize: function() {
		this.e = "Hello";
		this.m = "Hello";
		this.execution = [] 
	},
	f: function(a, b) {
		this.execution.push("d.f");
		// console.log("execute default f(" + a, ", " + b + ")");
		return 0; 
	},
	DummyLayer$f: function(proceed, a, n) {
		this.execution.push("ld.f");
		//console.log("execute dummy layer f(" + a, ", " + b + ")");
		return proceed() + 100;
	},
	
	DummyLayer2$f: function(proceed, a, n) {
		this.execution.push("ld2.f");
		return proceed() + 1000;
	},
	
	get DummyLayer$e(proceed) {
		//console.log("get e in DummyLayer procceed=" + proceed);
		return this._DummyLayer_e;
	},
	set DummyLayer$e($proceed, v) {
		// console.log("set e in DummyLayer to " + v);
		this._DummyLayer_e = v;
	},
	get DummyLayer$m(proceed) {
		// console.log("get m in DummyLayer procceed=" + proceed);
		if (!proceed) return; // ocasionally called from the system, without providing 
		return proceed() + " World";

	},
	h: function() {
		// console.log("h");
		return 2;
	},
	DummyLayer$h: function(proceed) {
		// console.log("D$h old(" + proceed() +")");
		return 3;
	},
	DummyLayer3$h: function(proceed) {
		// console.log("D3$h old(" + proceed() +")");
		return 4;
	},
	
	DummyLayer$newMethod: function() {
		return "totally new"
	},
	
	m1: function() {
		return 1;	
	},

	DummyLayer$m1: function() {
		return 7;	
	},


	m2: function() {
		return "m2";	
	},

	DummyLayer$m2: function(proceed) {
		return "D$m2," + proceed();	
	},

	
	fooo: function() {
		return "base";
	},
	
	DummyLayer$newFoo: function(proceed) {
		return "newFoo";
	},
	
	say: function(a) {
		return "Say: " + a
	},
});


cop.example.DummyClass.subclass('cop.example.DummySubclass', {
	
	f2: function() {
		return 3;
	},
	
	DummyLayer$f2: function() {
		return 4;
	},

	m1: function() {
		return 10;
	},

	DummyLayer$m1: function(proceed) {
		return proceed() + 1;
	},	
	
	DummyLayer$fooo: function(proceed) {
		var proc =  proceed();
		return proc+"-layer-"+this.newFoo();	
	},
		
	toString: function() {
		return "[a DummySubclass]"
	},
	
	m2: function() {
		return "S$m2"
	}
	
});

cop.example.DummyClass.subclass('cop.example.SecondDummySubclass', {
	
	DummyLayer$m1: function(proceed) {
		return proceed() + 100;
	},

});



TestCase.subclass('cop.tests.CopExampleTest', {
	
	testCopExample: function() {
		copExample();
		
		var name = "Hans Peter";
		var address = "Am Kiez 49, 123 Berlin";
		var employer_name = "Doener AG";
		var employer_address = "An der Ecke, 124 Berlin";
		var employer = new cop.example.Employer(employer_name, employer_address);
		var person = new cop.example.Person(name, address, employer);
				
		this.assertEqual(person.print(), "Name: " + name, "toString without a layer is broken");

		withLayers([Global.AddressLayer], function() {
			this.assertEqual(person.print(), "Name: " + name + "; Address: " + address, "toString with address layer is broken");
		}.bind(this));

		withLayers([Global.EmploymentLayer], function() {
			this.assertEqual(person.print(), "Name: " + name + "; [Employer] Name: " + employer_name, "toString with employment layer is broken");
		}.bind(this));

		withLayers([Global.AddressLayer, Global.EmploymentLayer], function() { 
			this.assertEqual(person.print(), "Name: " + name +  "; Address: " + address +
				"; [Employer] Name: " + employer_name + "; Address: " + employer_address, 
				"toString with employment layer is broken");
		}.bind(this));			
	}
	
});

var currentTest = undefined;

TestCase.subclass('cop.tests.LayerTest', {


	setUp: function() {
		this.execution  = [];
		currentTest = this;
		this.oldGlobalLayers = GlobalLayers;
		GlobalLayers = []; // ok, when we are testing layers, there should be no other layers active in the system (to make thinks easier)
		resetLayerStack();
	},
	
	tearDown: function() {
		GlobalLayers = this.oldGlobalLayers;
		resetLayerStack();
	},

	makeObject1: function() {
		this.object1 = {
			myString: "I am an object",
			f: function(a, b) {
				currentTest.execution.push("d.f");
				// console.log("execute default f(" + a, ", " + b + ")");
				return 0;
			},
			g: function() {
				currentTest.execution.push("d.g");
				// console.log("execute default g");
				return "Hello";
			},
			print: function() {
				return this.myString;
			},
			toString: function() {
				return "object1"
			}
			
		};
	},
	
	makeHtmlLayer: function() {
		var layer = {};
		ensurePartialLayer(layer, this.object1)["print"] =  function(p) {
			return "<b>"+ p() + "</b>"; 
		};
		layer.toString = function() {return "Layer HTML";};
		this.htmlLayer = layer;
	},
	

	makeLayer1: function() {
		this.layer1 = {};
		layerObject(this.layer1, this.object1, {
			f: function(proceed, a, b) {
				currentTest.execution.push("l1.f");
				console.log("execute layer1 function for f");
				return proceed(a, b) + a;
			}
		});
		this.layer1.toString = function() {return "Layer L1";};
	},

	makeLayer2: function() {
		this.layer2 = {};
		layerObject(this.layer2, this.object1, {
			f: function(proceed, a, b) {
				currentTest.execution.push("l2.f");
				// console.log("execute layer2 function for f");
				return proceed(a, b) + b; 
			},
			g: function(proceed) {
				currentTest.execution.push("l2.g");
				// console.log("execute default g");
				return proceed() + " World";
			}
		});
		this.layer2.toString = function() {return "Layer L2"};
	},

	makeEmptyLayer: function() {
		this.emptyLayer = {};
		this.emptyLayer.toString = function() {return "Empty Layer"};
	},

	makeLayer3: function() {
		this.layer3 = {};
		layerObject(this.layer3, this.object1, {
			f: function(proceed, a, b) {
				currentTest.execution.push("l3.f");
				// console.log("execute layer3 function for f");
				return proceed() * 10; 
			}
		});
		this.layer3.toString = function() {return "Layer L3"};
	},

	testCreateLayer: function() {
		createLayer("DummyLayer2");
		this.assert(Global.DummyLayer2);
		this.assert(Global.DummyLayer2.toString(), "DummyLayer2");
	},

	testCurrentLayers: function() {
		this.makeObject1();
		this.makeLayer1();
		withLayers([this.layer1], function() {
			this.assert(this.layer1, "no this.layer1");
			this.assert(currentLayers().first(), "currentLayers failed");
		}.bind(this));
	},

    testOneLayer: function() {
  		this.makeObject1();
  		this.makeLayer1();
		this.assertEqual(this.object1.f(2,3), 0, "default result of f() failed");
		ContextJS.makeFunctionLayerAware(this.object1,"f");
		this.assertEqual(this.object1.f(2,3), 0, "default result of f() with layer aware failed");
		withLayers([this.layer1], function() {
			var r = this.object1.f(2,3);
			this.assertEqual(r, 2, "result of f() failed");
			this.assertEqual(currentTest.execution.toString(), [ "d.f", "d.f", "l1.f", "d.f"]);
		}.bind(this));

  	},
  
	testTwoLayers: function() {
  		this.makeObject1();
  		this.makeLayer1();
  		this.makeLayer2();
		withLayers([this.layer1, this.layer2], function() {
			this.assertEqual(this.object1.f(3,4), 7, "result of f() failed");
			this.assertEqual(currentTest.execution.toString(), ["l2.f", "l1.f", "d.f"]);
		}.bind(this));
  	},

	testTwoLayerInverse: function() {
  		this.makeObject1();
  		this.makeLayer1();
  		this.makeLayer2();
		withLayers([this.layer2, this.layer1], function() {
			ContextJS.makeFunctionLayerAware(this.object1,"f");
			this.object1.f();
			this.assertEqual(currentTest.execution.toString(), ["l1.f", "l2.f", "d.f"]);
		}.bind(this));
  	},

	testThreeLayers: function() {
  		this.makeObject1();
  		this.makeLayer1();
  		this.makeLayer2();
  		this.makeLayer3();
		withLayers([this.layer1, this.layer2, this.layer3], function() {
			ContextJS.makeFunctionLayerAware(this.object1,"f");
			ContextJS.makeFunctionLayerAware(this.object1,"g");
			this.object1.f();
			var r = this.object1.g();
			this.assertEqual(r, "Hello World", "result of g() is wrong");
			this.assertEqual(currentTest.execution.toString(), ["l3.f", "l2.f","l1.f", "d.f", "l2.g", "d.g"]);
		}.bind(this));
  	},

	testTwoLayersAndEmpty: function() {
  		this.makeObject1();
  		this.makeEmptyLayer();
  		this.makeLayer1();
  		this.makeLayer2();
		withLayers([this.layer1, this.emptyLayer, this.layer2], function() {
			this.object1.f();
			this.assertEqual(currentTest.execution.toString(), ["l2.f","l1.f", "d.f"]);
		}.bind(this));

  	},
	
	testHTMLLayerExample: function() {
  		this.makeObject1();
  		this.makeHtmlLayer();
		ContextJS.makeFunctionLayerAware(this.object1,"print");		
		withLayers([this.htmlLayer], function() {
			this.assertEqual(this.object1.print(), "<b>"+this.object1.myString + "</b>", "html print does not work")		
		}.bind(this));
	},

	testLayerClass: function() {
		var layer1 = {};
		layerClass(layer1, cop.example.DummyClass, {
			f: function(proceed, a, b) {
				this.execution.push("l1.f");
				// console.log("execute layer1 function for f");
				return proceed() + a; 
			},
		});
		var object1 = new cop.example.DummyClass();
		ContextJS.makeFunctionLayerAware(cop.example.DummyClass.prototype,"f");
		
		this.assertEqual(object1.f(2,3), 0, "default result of f() with layer aware failed");
		withLayers([layer1], function() {
			var r = object1.f(2,3);
			this.assertEqual(r, 2, "result of f() failed");
			this.assertEqual(object1.execution.toString(), ["d.f", "l1.f", "d.f"]);
		}.bind(this))
  	},

	testNestedLayerInClass: function() {
		var o = new cop.example.DummyClass();
		withLayers([DummyLayer], function() {
			this.assertEqual(o.h(), 3, "outer layer broken");
			withLayers([DummyLayer3], function() {
				// console.log("Layers: " + currentLayers());
				// currentLayers().each(function(ea){
				// 	var p = ea[cop.example.DummyClass.prototype];
				// 	if (p) {
				// 		console.log("" + ea + ".h : " + p.h)
				// 	}})
				this.assertEqual(o.h(), 4, "inner layer broken");
			}.bind(this))
		}.bind(this));
		// console.log("LOG: " + o.log)
		
  	},

	testLayerObject: function() {
		var layer1 = {};
		this.makeObject1();
		layerObject(layer1, this.object1, {
			f: function(proceed, a, b) {
				currentTest.execution.push("l1.f");
				// console.log("execute layer1 function for f");
				return proceed() + a; 
			},
		});
		withLayers([layer1], function() {
			var r = this.object1.f(2);
			this.assertEqual(r, 2, "result of f() failed");
			this.assertEqual(currentTest.execution.toString(), ["l1.f", "d.f"]);
		}.bind(this));
  	},

	// How to lookup objects in layers
	testObjectAsDictionaryKeys: function() {
		// it seems that the string value is used as the "key" in dictionary lookups
		a = {name: "foo", toString: function() {return this.name}};
		b = {name: "bar", toString: function() {return this.name}};
		d = {};
		d[a] = 1;
		d[b] = 2;
		this.assertEqual(d[a], 1, "objects as keys are broken")
	},
	
	testLayerObjectsInOneLayer: function() {
		var layer = {};
		var o1 = {f: function() {return 1}};
		var o2 = {f: function() {return 2}};
		layerObject(layer, o1, {
			f: function() {
				return 3 
			},
		});
		layerObject(layer, o2, {
			f: function() {
				return 4 
			},
		});
		withLayers([layer], function() {
			this.assertEqual(o1.f(), 3, "result of o1.f() failed");
			this.assertEqual(o2.f(), 4, "result of o2.f() failed");
		}.bind(this));		
	},

	testLayerMethod: function() {
		var object1 = {f: function() {return 0}, g: function() {}};
		var layer1 = {};
		
		layerMethod(layer1, object1, "f", function(proceed){
			return proceed() + 1});
			
		this.assert(getLayerDefinitionForObject(layer1, object1).f, "f did not get stored");	
		
		layerMethod(layer1, object1, "g", function(proceed){});
	
		this.assert(getLayerDefinitionForObject(layer1, object1).f, "f did not get stored");	
		this.assert(getLayerDefinitionForObject(layer1, object1).g, "g did not get stored");	
	},

	testLayerInClass: function() {
		var o = new cop.example.DummyClass();
		this.assert(!o['DummyLayer$f'], "layer code ended up in class");
		this.assert(getLayerDefinitionForObject(DummyLayer, cop.example.DummyClass.prototype).f, "f did not end up in DummyLayer");
		this.assert(getLayerDefinitionForObject(DummyLayer, cop.example.DummyClass.prototype), "DummyLayer2 has no partial class");
		this.assert(getLayerDefinitionForObject(DummyLayer, cop.example.DummyClass.prototype).h, "DummyLayer2 has no method for h");
	},

	testLayerActivation: function() {
		var layer1 = {};
		var oldLength = currentLayers().length;
		withLayers([layer1], function() {
			this.assertEqual(currentLayers().length, oldLength + 1, "layer1 is not actived");
		}.bind(this));
		this.assertEqual(currentLayers().length, oldLength, "layer1 is not deactived");
  	},

	testNestedLayerActivation: function() {
		var layer1 = {};
		var layer2 = {};
		this.assertEqual(currentLayers().length, 0, "there are active layers where there shouldn't be ")
		withLayers([layer1], function() {
			this.assertEqual(currentLayers().length, 1, "layer1 is not active");
			withLayers([layer2], function() {
				this.assertEqual(currentLayers().length, 2, "layer2 is not active");
			}.bind(this));
			this.assertEqual(currentLayers().length, 1, "layer2 is not deactivated");
		}.bind(this));
		this.assertEqual(currentLayers().length, 0, "layer1 is not deactivated");
  	},

	testNestedLayerDeactivationAndActivation: function() {
		var layer1 = {toString: function(){return "l1"}};
		var layer2 = {toString: function(){return "l2"}};
		var layer3 = {toString: function(){return "l3"}};
		withLayers([layer1, layer2, layer3], function() {
			withoutLayers([layer2], function() {
				this.assertEqual(currentLayers().toString(), ["l1","l3"].toString());
				withLayers([layer2], function() {
					this.assertEqual(currentLayers().toString(), ["l1","l3","l2"].toString());
				}.bind(this));
			}.bind(this));
		}.bind(this));
  	},

	testDuplicateLayerActivation: function() {
		var layer1 = {};
		withLayers([layer1], function() {
			withLayers([layer1], function() {
				this.assertEqual(currentLayers().length, 1, "layer1 activated twice");
			}.bind(this));
			this.assertEqual(currentLayers().length, 1, "layer1 is deactivated");
		}.bind(this));
  	},

	testLayerDeactivation: function() {
		var layer1 = {};
		var layer2 = {};
		withLayers([layer1, layer2], function() {
			withoutLayers([layer2], function() {
				this.assertEqual(currentLayers().length, 1, "layer2 is not deactiveated");
			}.bind(this));
			this.assertEqual(currentLayers().length, 2, "layer2 is not reactivated");
		}.bind(this));
  	},

	testErrorInLayeredActivation: function() {
		var layer1 = {}
		this.makeObject1();
		layerObject(layer1, this.object1, {
			f: function(proceed) {
				throw {testError: true}
			},
		});
		try {
			withLayers([layer1], function() {
				this.object1.f();
			}.bind(this));
		} catch (e) {
			if (!e.testError) throw e;
			this.assertEqual(currentLayers().length, 0, "layer1 is still active");
			
		}
  	},

	testErrorInLayeredDeactivation: function() {
		var layer1 = {};
		this.makeObject1();
		layerObject(layer1, this.object1, {
			f: function(proceed) {
				throw {testError: true};
			},
		});
		withLayers([layer1], function() {
			try {
				withoutLayers([layer1], function() {
					this.assertEqual(currentLayers().length, 0, "layer1 deactivation is not active");
					this.object1.f();
				}.bind(this));
			} catch (e) {
				if (!e.testError) throw e;			
			};
			this.assertEqual(currentLayers().length, 1, "layer1 deactivation is still active");
		}.bind(this));
  	},


	testComposeLayers: function() {
		var layer1 = {toString: function(){return "l1"}};
		var layer2 = {toString: function(){return "l2"}};
		var layer3 = {toString: function(){return "l3"}};
		
		var stack = [{}];
		this.assertEqual(composeLayers(stack.clone()).toString(), [].toString());
		this.assertEqual(composeLayers([{}, {withLayers: [layer1]}]).toString(), ["l1"].toString());
		this.assertEqual(composeLayers([{}, {withLayers: [layer1]},{withLayers: [layer2, layer3]} ]).toString(), ["l1","l2","l3"].toString());
  	},

	testComposeLayersWithWithoutLayers: function() {
		var layer1 = {toString: function(){return "l1"}};
		var layer2 = {toString: function(){return "l2"}};
		var layer3 = {toString: function(){return "l3"}};
		
		var stack = [{}];
		this.assertEqual(composeLayers([{}, {withLayers: [layer1, layer2, layer3]},{withoutLayers: [layer2]}]).toString(), ["l1","l3"].toString());
		
  	},
	
	testThisReferenceInLayeredMethod: function(){
		var layer1 = {}
		this.makeObject1();
		var thisObject = this.object1;
		var testCase = this;
		var result = false;
		layerObject(layer1, this.object1, {
			f: function(proceed) {
				result = thisObject === this;
			},
		});
		withLayers([layer1], function() {
			this.object1.f();
		}.bind(this));
		this.assert(result, "this is not object1 in layer");
	},

	testGlabalLayers: function() {
		var layer1 = {name: "Layer1"};
		var layer2 = {name: "Layer2"};
		enableLayer(layer1);
		enableLayer(layer2);
		this.assertIdentity(GlobalLayers[0], layer1, "layer1 not global");
		this.assertIdentity(GlobalLayers[1], layer2, "layer2 not global");
		disableLayer(layer1);
		this.assertIdentity(GlobalLayers[0], layer2, "layer1 not removed from global");
		disableLayer(layer2);
		this.assertIdentity(GlobalLayers.length, 0, "global layers still active");
	},

	testEnableDisableLayer: function() {
		var layer1 = {name: "Layer1"};
		enableLayer(layer1);
		this.assertEqual(currentLayers().length, 1, "layer 1 is not enabled");
		// console.log("current layers: " + currentLayers())
		disableLayer(layer1);
		this.assert(!LayerStack.last().composition, "there is a cached composition!");
		this.assertEqual(currentLayers().length, 0, "layer 1 is not disabeled");
	},
	

	testEnableLayersInContext: function() {
		var layer1 = {name: "Layer1"};
		var layer2 = {name: "Layer2"};
		withLayers([layer2], function() {
			enableLayer(layer1);
			this.assertEqual(currentLayers().length, 2, "layer 2 is not enabled");			
		}.bind(this));
		this.assertEqual(currentLayers().length, 1, "layer 1 is not enabled");
		disableLayer(layer1);
	},
	
	testEnableLayersInContextAgain: function() {
		var layer1 = {name: "Layer1"};
		withLayers([layer1], function() {
			enableLayer(layer1);
			this.assertEqual(currentLayers().length, 1, "layer 1 enabled twice?");			
		}.bind(this));
		this.assertEqual(currentLayers().length, 1, "layer 1 is not enabled");
	},
	
	testLayerSubclass: function() {
		var o = new cop.example.DummySubclass();
		
		this.assert(o.f2.isLayerAware, "function is not layer aware when subclassing not directly from object")

	},
	
	testNewMethodOnlyInLayer: function() {
		var o = new cop.example.DummyClass();
		withLayers([DummyLayer], function() {
			this.assert(o.newMethod, "new method is not there");
			this.assertEqual(o.newMethod(), "totally new","layered newMethod() is wrong");

		}.bind(this));
  	},


	testLayerMethodInSubclass: function() {
		var o = new cop.example.DummySubclass();
		this.assertEqual(o.m1(), 10, "subclassing is broken")
		withLayers([DummyLayer], function() {
			this.assertEqual(o.m1(), 11, "layer in subclass is broken")		
		}.bind(this));
  	},
  	
  	testLayerMethodInSecondSubclass: function() {
		var o = new cop.example.SecondDummySubclass();
		this.assertEqual(o.m1(), 1, "base is broken")
		withLayers([DummyLayer], function() {
			this.assertEqual(o.m1(), 101, "layer in second subclass is broken")		
		}.bind(this));
  	},
  	
  	testSetWithLayers: function() {
  		var o = new cop.example.DummySubclass();
  		this.assertEqual(o.fooo(), "base", "base is broken");	
  		withLayers([DummyLayer], function() {
  			this.assertEqual(o.fooo(), "base-layer-newFoo", "SecondDummySubclass is broken");		
  		}.bind(this));
  	},

  	testExecuteLayeredBehaviorOfSuperclass: function() {
  		var o = new cop.example.DummySubclass();
   		withLayers([DummyLayer], function() {
  			this.assertEqual(o.newFoo(), "newFoo", "newFoo is broken");		
  		}.bind(this));
  	},


  	testDoNotOverideLayeredMethodInSubclass: function() {
  		var o = new cop.example.DummyClass();
   		withLayers([DummyLayer], function() {
  			this.assertEqual(o.m2(), "D$m2,m2", "installing wrappers on base class broken");		
  		}.bind(this));

  		var s = new cop.example.DummySubclass();
   		withLayers([DummyLayer], function() {
  			this.assertEqual(s.m2(), "S$m2", "not installing wrappers on subclassing broken`");		
  		}.bind(this));
  	},
});

TestCase.subclass('cop.tests.AdaptArgumentsInLayer', {
	testAdaptArgumentsInLayer: function() {
		var o = {say: function(a) {return "Say: " +a}};
		var l = {toString: function() {return "L"}};
		layerObject(l,o, { say: function(proceed, a) {return proceed(a + " World") + "!"}})
		this.assertEqual(o.say("Hello"), "Say: Hello", "test is broken");	
		withLayers([l], function() {
			console.group("SayHello");
			var result = o.say("Hello")
			console.groupEnd("SayHello");
			this.assertEqual(result, "Say: Hello World!", "adapting arguments is broken");		
		}.bind(this));
	},
})

TestCase.subclass('cop.tests.LayerTestCase', {
	setUp: function() {
		this.tmpClassName = 'TmpDummyClass';
		this.tmpSubclassName = 'TmpDummySubclass';
		this.tmpLayerName = 'TmpDummyLayer';
		this.tmpLayer2Name = 'TmpDummyLayer2';

		Object.subclass(this.tmpClassName, {});
		Global[this.tmpClassName].subclass(this.tmpSubclassName, {});
		createLayer(this.tmpLayerName);
		createLayer(this.tmpLayer2Name);
	},
		
	dummyClass: function() {
		return Global[this.tmpClassName];
	},
	
	dummySubclass: function() {
		return Global[this.tmpSubclassName];
	},

	dummyLayer: function() {
		return Global[this.tmpLayerName];
	},

	dummyLayer2: function() {
		return Global[this.tmpLayer2Name];
	},
	
	tearDown: function() {
		console.log("tear down classes....")
		Global[this.tmpSubclassName] = undefined;
		Global[this.tmpClassName] = undefined;	
		Global[this.tmpLayerName] = undefined;	
		Global[this.tmpLayer2Name] = undefined;	
	}
});

cop.tests.LayerTestCase.subclass('cop.tests.LayerSubclassingTest', {

	testSetup: function() {
		this.assert(this.dummyClass());
		this.assert(this.dummySubclass());
		this.assert(this.dummyLayer());
	},	

	testLayerClassAndSubclasses: function() {
		this.dummyClass().addMethods({
			m1: function(){return "m1"},
		});
	
		this.dummySubclass().addMethods({
			m1: function(){return "S$m1"},
			m2: function(){return "S$m2"},
		});
	
		layerClassAndSubclasses(this.dummyLayer(), this.dummyClass(), {
			m1: function(proceed) {return "L$m1,"+proceed()}
		});
		
		this.assert(this.dummySubclass().prototype.m1.isLayerAware,  "overriden m1 is not layer aware")
		this.assert(!this.dummySubclass().prototype.m2.isLayerAware,  "overriden m2 is layer aware, but it should't")

		var o = new (this.dummyClass())();
		this.assertEqual(o.m1(), "m1", "base m1 broken");
		withLayers([this.dummyLayer()], function() {
			this.assertEqual(o.m1(), "L$m1,m1", "layered m1 broken");
		}.bind(this))
		
		var s = new (this.dummySubclass())();
		this.assertEqual(s.m1(), "S$m1", "base S$m1 broken");
		withLayers([this.dummyLayer()], function() {
			this.assertEqual(s.m1(), "L$m1,S$m1", "layered S$m1 broken");
		}.bind(this))	
	},
	
	testLayerClassAndSubclassesWithSuper: function() {
		this.dummyClass().addMethods({
			m1: function(){return "m1"},
		});
	
		this.dummySubclass().addMethods({
			m1: function($super){return "S$m1a " + $super() + " S$m1b"}
		});
	
		layerClassAndSubclasses(this.dummyLayer(), this.dummyClass(), {
			m1: function(proceed) {return "L$m1a "+proceed() + " L$m1b" }
		});
		
		var o = new (this.dummyClass())();
		withLayers([this.dummyLayer()], function() {
			this.assertEqual(o.m1(), "L$m1a m1 L$m1b", "layered m1 broken");
		}.bind(this))
		
		var s = new (this.dummySubclass())();
		this.assertEqual(s.m1(), "S$m1a m1 S$m1b", "base S$m1 broken");
		withLayers([this.dummyLayer()], function() {
			this.assertEqual(s.m1(), "L$m1a S$m1a L$m1a m1 L$m1b S$m1b L$m1b", "layered S$m1 broken");
		}.bind(this))	
	},
	
	
	testMultipleLayerDefintions: function() {
		this.dummyClass().addMethods({
			m1: function(){return "m1"},
		});
	
		this.dummySubclass().addMethods({
			m1: function(){return "S$m1"},
		});
	
		layerClassAndSubclasses(this.dummyLayer(), this.dummyClass(), {
			m1: function(proceed) {return "L$m1,"+proceed()}
		});

		layerClassAndSubclasses(this.dummyLayer2(), this.dummySubclass(), {
			m1: function(proceed) {return "L$m1,"+proceed()}
		});
				
		var s = new (this.dummySubclass())();
		withLayers([this.dummyLayer()], function() {
			this.assertEqual(s.m1(), "L$m1,S$m1", "layered S$m1 broken");
		}.bind(this))	
	},
});

LayerExamples = {
	logSetPostionInMorph: function() {
		Morph.addMethods(LayerableObjectTrait);
		Morph.prototype.lookupLayersIn = ["owner"];
		WindowMorph.prototype.lookupLayersIn = [""];
		HandMorph.prototype.lookupLayersIn = [""];
	
		createLayer("LogPostionLayer");
		layerClass(LogPostionLayer, Morph, {
			setPosition: function(proceed, pos) { 
				console.log(this + "setPosition(" + pos +")")
				return proceed(pos);
			}
		});
	}
}

// LayerExamples.logSetPostionInMorph()
// WorldMorph.current().setWithLayers([LogPostionLayer]);


/*
 * Test for Getter and Setter Functionality
 * (Supportet in Mozilla, WebKit et al)
 *
 */
TestCase.subclass('cop.tests.GetterAndSetterTest', {
	
	testGetterInObject: function() {
		var o = { get b() { return 4}};
		this.assertEqual(o.b, 4, "getter method is not supported");
	},
	
	testDefineGetter: function() {
		var o = {};
		o.__defineGetter__("b", function(){return 4});
		this.assertEqual(o.b, 4, "__defineGetter__ is not supported");
	},

	testDefineSetter: function() {
		var o = {a: 0};
		o.__defineSetter__("b", function(p){this.a = p});
		o.b = 4;
		this.assertEqual(o.a, 4, "__defineSetter__ is not supported");
	},

	testLookupGetter: function() {
		var o = {};
		var f1 = function(){return 4};
		o.__defineGetter__("b", f1);
		var f2 = o.__lookupGetter__("b");
		this.assertEqual(f1, f2, "__lookupGetter__ is not supported");
	},

	testLookupSetter: function() {
		var o = {};
		var f1 = function(p){};
		o.__defineSetter__("b", f1);
		var f2 = o.__lookupSetter__("b");
		this.assertEqual(f1, f2, "__lookupGetter__ is not supported");
	},	

	testSubclassWithGetterAndSetter: function() {
		var o = new cop.tests.GetterAndSetterTestDummy();
		this.assertEqual(o.b, 4, "subclass getter broken");
		o.c = 5;		
		this.assertEqual(o.a, 10, "subclass setter broken");
	},

	testOverideWithGetterInClass: function() {
		var o = new cop.tests.GetterAndSetterTestDummy();
		o.d = 7
		this.assertEqual(o.d, 14, "subclass getter broken");
	},

});


Object.subclass("cop.tests.GetterAndSetterTestDummy", {
	initialize: function() {
		this.a = 3;
		this.d = 5;
	},
	get b() {
		return this.a + 1;
	},
	set c(p) {
		this.a = p * 2;
	},
	get d() {
		return this._d * 2
	},
	set d(v) {
		this._d = v
	},	
});


createLayer("MyTestLayer1");
createLayer("MyTestLayer2");

Object.subclass('cop.tests.MyClass', {
	initialize: function() {
		this.a = 7;
	},
	get MyTestLayer1$a(proceed) {
		// console.log("get MyLayer1 a");
		return this._MyLayer_a;
	},
	set MyTestLayer1$a(proceed, v) {
		// console.log("set MyLayer1 a");
		this._MyLayer_a = v;
	},
	get MyTestLayer2$a(proceed) {
		// console.log("get MyLayer2 a");
		return this._MyLayer2_a;
	},
	set MyTestLayer2$a(proceed, v) {
		// console.log("set MyLayer3 a");
		this._MyLayer2_a = v;
	},
});

TestCase.subclass('cop.tests.LayerStateTest', {

	testMakePropertyLayerAware: function() {
		var o = {a: 3};
		makePropertyLayerAware(o,"a");
		
		this.assertEqual(o.a, 3, "getter is broken");
		o.a = 4;
		this.assertEqual(o.a, 4, "setter is broken");

		this.assert(o.__lookupGetter__("a"), "o has not getter for a");
		this.assert(o.__lookupGetter__("a").isLayerAware, "o.a getter is not layerAware");

		this.assert(o.__lookupSetter__("a"), "o has not setter for a");
		this.assert(o.__lookupSetter__("a").isLayerAware, "o.a setter is not layerAware");

		
	},
	
	testLayerGetter: function() {
		var o = {a: 5};
		//var o = {get a(){return 5}};
		var layer1 = {};
		this.assertEqual(o.a, 5, "property access is broken");
		layerObject(layer1, o, {
			get a() {
				return 10;
			},		
		});
		var self = this;
		var layer2 = {};
		withLayers([layer1], function() {
			self.assertEqual(o.a, 10, "layer getter broken");
			withLayers([layer2], function() {
				self.assertEqual(o.a, 10, "with empty innner layer getter broken");
			});
		});
		self.assertEqual(o.a, 5, "layer getter broken after activation");
	},
	
	testLayerGetterAndSetter: function() {
		var o = {a: 5};
		var layer1 = {};
		this.assertEqual(o.a, 5, "property access is broken");

		var l1_value = 10;
		layerObject(layer1, o, {
			get a() {
				return l1_value;
			},
			set a(proceed, value) {
				l1_value = value;
			}		
		});
		this.assert(getLayerDefinitionForObject(layer1,o).__lookupSetter__("a"), "layer1 hast no setter for a");
		this.assert(o.__lookupSetter__("a").isLayerAware, "o.a setter is not layerAware");
		
		withLayers([layer1], function() {
			this.assertEqual(o.a, 10, "layer getter broken");
			o.a = 20;
			this.assertEqual(l1_value, 20, "layer setter broken");
		}.bind(this));
	},

	testLayerStateInTwoObjects: function() {
		var o1 = new cop.example.DummyClass();
		var o2 = new cop.example.DummyClass();
		var layer1 = {};
		layerClass(layer1, cop.example.DummyClass, {
			get a() {
				return this.l1_value;
			},
			set a(proceed, value) {
				this.l1_value = value;
			},		
		});
		withLayers([layer1], function() {
			o1.a = 20;
			o2.a = 30;
			this.assertEqual(o1.a, 20, "layer state in two objects broken");
			this.assertEqual(o2.a, 30, "layer state in two objects broken 2");
		}.bind(this));
	},



	testGetterAndSetterClassInLayer: function() {
		var o = new cop.example.DummyClass();
		o.toString = function(){return "[o]"};
		var o2 = new cop.example.DummyClass();
		o2.toString= function(){return "[o2]"};
		var layer1 = {};
		layerClass(layer1, cop.example.DummyClass, {
			get a() {
				return 10;
			},		
		});
		o.a = 5; // initialize works only after layer installation
		o2.a = 7; // initialize works only after layer installation
		this.assert(cop.example.DummyClass.prototype.__lookupGetter__("a"), "DummyClass has no getter for a");
		this.assert(o.__lookupGetter__("a"), "o.a has no getter");
		
		this.assertEqual(o.a, 5, "layer getter broken after initialization");
		withLayers([layer1], function() {
			this.assertEqual(o.a, 10, "layer getter broken");
		}.bind(this));
		this.assertEqual(o.a, 5, "layer getter broken after activation");
		this.assertEqual(o2.a, 7, "layer getter broken after activation for o2");
	},

	testGetterLayerInClass: function() {
		var o = new cop.example.DummyClass();
		this.assert(o.__lookupGetter__("e"), "o.e has no getter");
		this.assertEqual(o.e, "Hello", "layer getter broken after initialization");
		withLayers([DummyLayer], function() {
			o.e = "World"
			this.assertEqual(o.e, "World", "layer getter broken");		
		}.bind(this));
		this.assertEqual(o.e, "Hello", "layer getter broken after activation");
		withLayers([DummyLayer], function() {
			this.assertEqual(o.e, "World", "layer does not remember state");		
		}.bind(this));

	},
	
	testGetterProceed: function() {
		var o = new cop.example.DummyClass();
		withLayers([DummyLayer], function() {
			this.assertEqual(o.m, "Hello World", "layer getter broken");		
		}.bind(this));
	},
	
	testLayerInstallation: function() {
		this.assert(getLayerDefinitionForObject(DummyLayer, cop.example.DummyClass.prototype).__lookupGetter__("e"), "no getter in partial class");
		this.assert(cop.example.DummyClass.prototype.__lookupGetter__("e"), "no getter in class");
	},
	
	testLayerPropertyWithShadow: function() {
		var o = {};
		var layer1 = {};
		layerPropertyWithShadow(layer1, o, "a");
		o.a = 5;
		withLayers([layer1], function() {
			o.a = 10;
			this.assertEqual(o.a, 10, "shadow broken");
		}.bind(this));
		this.assertEqual(o.a, 5, "shadow breaks base");
		withLayers([layer1], function() {
			this.assertEqual(o.a, 10, "shadow broken 2");
		}.bind(this));
	},
	
	testLayerClassPropertyWithShadow: function() {
		var o = new cop.example.DummyClass();
		layerPropertyWithShadow(DummyLayer, o, "a");
		o.a = 5;
		withLayers([DummyLayer], function() {
			o.a = 10;
			this.assertEqual(o.a, 10, "shadow broken");
		}.bind(this));
		this.assertEqual(o.a, 5, "shadow breaks base");
		withLayers([DummyLayer], function() {
			this.assertEqual(o.a, 10, "shadow broken 2");
		}.bind(this));
	},
	
	testLayerPropertyWithShadowFallsBack: function() {
		var o = {};
		var layer1 = {};
		layerPropertyWithShadow(layer1, o, "a");
		o.a = 5;
		withLayers([layer1], function() {
			this.assertEqual(o.a, 5, "fallback is broken");
		}.bind(this));
	},
	
	testNestedStateAccess: function() {
		o = new cop.tests.MyClass();
		withLayers([MyTestLayer1], function() {
			o.a = 9;
			withLayers([MyTestLayer2], function() {
				o.a = 10;
			}.bind(this));
		}.bind(this));
		var self = this;
		withLayers([MyTestLayer1], function() {
			this.assertEqual(o.a, 9, "outer layer broken")
			withLayers([MyTestLayer2], function() {
				this.assertEqual(o.a, 10, "inner layer broken")
			}.bind(this));
		}.bind(this));		
	},
	
});

LayerableObject.subclass("DummyLayerableObject", {
	
	initialize: function() {
		this.otherObject = new DummyOtherObject();
		this.myObject = new DummyOtherObject();
		this.myObject.owner = this;
	},
	
	f: function() {
		return 3
	},
		
	DummyLayer$f: function(proceed) {
		return 4
	},

	k1: function() {
		return this.otherObject.k();
	},
	
	k2: function() {
		return this.myObject.k();
	},
	
	DummyLayer$thisRef: function(proceed) {
		return this
	}
});

LayerableObject.subclass("DummyOtherObject", {
	
	lookupLayersIn: ["owner"],
	
	initialize: function() {
		this.count_dummy_k = 0;
	},
	
	
	k: function() {
		return 5
	},
	
	DummyLayer$k: function(proceed) {
		proceed();
		this.count_dummy_k = this.count_dummy_k + 1;
		return 7
	},

});

TestCase.subclass('cop.tests.LayerObjectActivationTest', {
	
	setUp: function() {
		this.o = new DummyLayerableObject();
	},
	
	
	testSetAndGetActiveLayers: function() {	
		this.o.setWithLayers([DummyLayer]);
		var layers = this.o.getActivatedLayers();
		this.assert(layers, "no layers active")		
	},
	
	testDummyObjectDefault: function() {	
		this.assertEqual(this.o.f(), 3, " default fails");
		withLayers([DummyLayer], function() {
			this.assertEqual(this.o.f(), 4, " dynamic layer activation is broken");			
		}.bind(this));
	},
	
	testSetLayersForObject: function() {
		this.o.setWithLayers([DummyLayer]);		
		this.assertIdentity(this.o.getActivatedLayers()[0], DummyLayer, "layer not set");
		this.assertEqual(this.o.f(), 4, " layered object broken");	
	},
	
	testLayerIsNotActivatedInOtherObject: function() {
		this.o.setWithLayers([DummyLayer]);
		this.assertEqual(this.o.k1(), 5, " layer is activated in other object?")
	},

	testLayerIsActivatedInMyObject: function() {
		this.o.setWithLayers([DummyLayer]);
		this.assertEqual(this.o.k2(), 7, " layer is not activated in my object")
	},
	
	
	testStateActivationAndWithLayers: function() {
		this.o.setWithLayers([DummyLayer]);
		withLayers([DummyLayer], function() {
			this.assertEqual(this.o.k2(), 7, " layer is not activated in my object")
			this.assertEqual(this.o.myObject.count_dummy_k, 1, " layered method is excuted wrong number")
		}.bind(this));
	},
	
	testStateActivationAndWithoutLayers: function() {
		this.o.setWithLayers([DummyLayer]);
		withoutLayers([DummyLayer], function() {
			this.assertEqual(this.o.k2(), 5, " layer is not deactivated in my object")
		}.bind(this));
	},

	testStateActivationAndObjectDeclaredWithoutLayers: function() {
		this.o.setWithLayers([DummyLayer]);
		this.o.myObject.setWithoutLayers([DummyLayer]);
		this.assertEqual(this.o.k2(), 5, " layer is not deactivated in my object")
	},

	testThisReference: function() {
		this.o.setWithLayers([DummyLayer]);
		this.assertIdentity(this.o.thisRef(), this.o, " 'this' reference is broken")		
	},
	
	testDoubleActivation: function() {
		this.o.setWithLayers([DummyLayer]);
		this.o.myObject.setWithLayers([DummyLayer]);
		this.assertEqual(this.o.myObject.getActivatedLayers().length, 1);
	},

	testCycleInOwnerChain: function() {
		this.o.myObject.owner = this.o.myObject
		try {
			this.assertEqual(this.o.myObject.getActivatedLayers().length, 0);
		} catch (e) {
			this.assertEqual(e.toString(), "Error: cycle in getActivatedLayers");
			return
		};
		this.assert(false, "no error was thrown")
	}


	
});

TestCase.subclass('cop.tests.ActiveLayersTest', {

	testOverrideActiveLayers: function() {
		var self = this;
		var o = new cop.example.DummyClass();
		o.activeLayers= function() {return []} 
		withLayers([DummyLayer], function(){
			self.assertEqual(o.f(), 0, "layer is still active")
		})			
	},
	testOverrideActiveLayersWithAdditionalLayer: function() {
		var self = this;
		// object overrides the layer composition
		var o = new cop.example.DummyClass();
		o.activeLayers= function($super) {
			return $super().concat([DummyLayer2]) 
		} 
		withLayers([DummyLayer], function() {
			self.assertEqual(o.f(), 1100, "active layers failed")
		})			
	},
	
});


cop.tests.LayerTestCase.subclass('cop.tests.LayerActivationRestrictionTest', {
	
	setUp: function($super) {
		$super();
		this.dummyClass().addMethods({m1:function(){return "m1"}});
		this.dummyClass().addMethods(LayerableObjectTrait);
		this.dummyClass().prototype.lookupLayersIn = ["owner"];
		layerClass(this.dummyLayer(), this.dummyClass(), {m1:function(p){return "L$m1," + p()}});

		this.o1 = new (this.dummyClass())();
		this.o2 = new (this.dummyClass())();
		this.o3 = new (this.dummyClass())();
		
		this.o2.owner = this.o1;
		this.o3.owner = this.o2;		
	},
	
	testRestrictWithLayerSelectFunction: function() {
		this.assertEqual(this.o2.m1(),"m1", "base broken");
		this.o1.setWithLayers([this.dummyLayer()]);
		this.assertEqual(this.o2.m1(),"L$m1,m1", "state layer activation broken");
		
		this.dummyLayer().selectAfterComposition = function(object, composition) {
			return object === this.o2
		}.bind(this);
		this.assertEqual(this.o2.m1(),"L$m1,m1", "to much restriction");
		this.assertEqual(this.o3.m1(),"m1", "restriction does not work");
	},
	
	tearDown: function($super) {
		$super()
	}
});


});

console.log("loaded LayersTest.js");
