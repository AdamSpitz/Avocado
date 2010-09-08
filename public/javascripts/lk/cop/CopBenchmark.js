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

module('cop.CopBenchmark').requires('cop.Layers', 'lively.TestFramework').toRun(function(thisModule) {

CopBenchmark = {};

CopBenchmark.MAXSIZE = 1000000000
CopBenchmark.TARGETTIME = 100

benchmakeBlock = function(name, unrolledOps, func) {
	var MAXSIZE = CopBenchmark.MAXSIZE || 100000000;
	var TARGETTIME = CopBenchmark.TARGETTIME || 1000; // 1000
	unrolledOps = unrolledOps || 1;
	
	var time = 0.0;
	var size = 100; 
	var ops = 0;
	var obj = new cop.benchmark.BenchClass();
	while(time < TARGETTIME && size < MAXSIZE) {
		// console.log("execute func: " + time + " " + size)
		func(1, obj);
		var time1 = new Date().getTime();
		func(size, obj);
		var time2 = new Date().getTime();
		time = time2 - time1;
		ops = (unrolledOps * size);
		size *= 2;
	};
	var result = name +"	" + ops + "	" + time + "	" + Math.round(ops / time) + "\n"
	CopBenchmark.result = CopBenchmark.result.concat(result);
	CopBenchmark.printEachResult(result);
}

createLayer("L1");
createLayer("L2");
createLayer("L3");
createLayer("L4");
createLayer("L5");
createLayer("L6");
createLayer("L7");
createLayer("L8");
createLayer("L9");
createLayer("L10");


Object.subclass('cop.benchmark.BenchClass', {

	initialize: function() {
		this.counter_00= 0;
		this.counter_01= 0;
		this.counter_02= 0;
		this.counter_03= 0;
		this.counter_04= 0;
		this.counter_05= 0;
		this.counter_06= 0;
		this.counter_07= 0;
		this.counter_08= 0;
		this.counter_09= 0;
		this.counter_10= 0;
	},

	noLayer_01: function() {	
		this.counter_01++;
	},

	noLayer_02: function() {	
		this.counter_01++; this.counter_02++;
	},

	noLayer_03: function() {	
		this.counter_01++; this.counter_02++; this.counter_03++;
	},

	noLayer_04: function() {	
		this.counter_01++; this.counter_02++; this.counter_03++; this.counter_04++;
	},

	noLayer_05: function() {	
		this.counter_01++; this.counter_02++; this.counter_03++; this.counter_04++; this.counter_05++;
	},

	noLayer_06: function() {	
		this.counter_01++; this.counter_02++; this.counter_03++; this.counter_04++; this.counter_05++; this.counter_06++;
	},

	noLayer_07: function() {	
		this.counter_01++; this.counter_02++; this.counter_03++; this.counter_04++; this.counter_05++; this.counter_06++; this.counter_07++;
	},

	noLayer_08: function(){	
		this.counter_01++; this.counter_02++; this.counter_03++; this.counter_04++; this.counter_05++; this.counter_06++; this.counter_07++; this.counter_08++;
	},

	noLayer_09: function(){	
		this.counter_01++; this.counter_02++; this.counter_03++; this.counter_04++; this.counter_05++; this.counter_06++; this.counter_07++; this.counter_08++; this.counter_09++;
	},

	noLayer_10: function(){	
		this.counter_01++; this.counter_02++; this.counter_03++; this.counter_04++; this.counter_05++; this.counter_06++; 
		this.counter_07++; this.counter_08++; this.counter_09++; this.counter_10++;
	},

	countWithoutLayers: function(context){
		if(context.layer1) {	
			this.counter_01++; 
		};
		if(context.layer2) {	
			this.counter_02++; 
		};
		if(context.layer3) {
			this.counter_03++; 
		};
		if(context.layer4) {
			this.counter_04++; 
		};
		if(context.layer5) {
			this.counter_05++; 
		};
		if(context.layer6) {
			this.counter_06++;
		};
		if(context.layer7) { 
			this.counter_07++; 
		};
		if(context.layer8) {
			this.counter_08++; 
		};
		if(context.layer9) {
			this.counter_09++; 
		};
		if(context.layer10) {
			this.counter_10++;
		};
	},

	countWithLayers: function() {	
		this.counter_00++;
	},

	L1$countWithLayers: function(proceed) {	
		this.counter_01++;
		proceed()
	},
	
	L2$countWithLayers: function(proceed) {	
		this.counter_02++;
		proceed()
	},
	
	L3$countWithLayers: function(proceed) {	
		this.counter_03++;
		proceed()
	},
	
	L4$countWithLayers: function(proceed) {	
		this.counter_04++;
		proceed()
	},
	
	L5$countWithLayers: function(proceed) {	
		this.counter_05++;
		proceed()
	},
	
	L6$countWithLayers: function(proceed) {	
		this.counter_06++;
		proceed()
	},
	
	L7$countWithLayers: function(proceed) {	
		this.counter_07++;
		proceed()
	},
	
	L8$countWithLayers: function(proceed) {	
		this.counter_08++;
		proceed()
	},
	L9$countWithLayers: function(proceed) {	
		this.counter_09++;
		proceed()
	},
	L10$countWithLayers: function(proceed) {	
		this.counter_10++;
		proceed()
	}
});




generateBechmarkFunction = function(bechmarkCode) {
	result = "var f = function(size, obj) { " +
		"for(var i = 0; i < size; i++) {"
	for (var i=0; i < 16; i++) {
		result += bechmarkCode + "	" 
	};	
	result +="} }; f";
	console.log(result)
	return eval(result)
}

/* Benchmarks */


addLayerBenchmarks0 = function() {
	var standartRunWithContext = function(name, context) {
		benchmakeBlock(name, 16, function(size, obj) {
			for(var i = 0; i < size; i++) {			
				obj.countWithoutLayers(context);
				obj.countWithoutLayers(context);
				obj.countWithoutLayers(context);
				obj.countWithoutLayers(context);
				obj.countWithoutLayers(context);
				obj.countWithoutLayers(context);
				obj.countWithoutLayers(context);
				obj.countWithoutLayers(context);
				obj.countWithoutLayers(context);
				obj.countWithoutLayers(context);
				obj.countWithoutLayers(context);
				obj.countWithoutLayers(context);
				obj.countWithoutLayers(context);
				obj.countWithoutLayers(context);
				obj.countWithoutLayers(context);
				obj.countWithoutLayers(context); 
			}
		})
	};
	
	CopBenchmark.benchnarksToRun = CopBenchmark.benchnarksToRun.concat([
	{name: "ContextJS:Method:Standard:0, ", run: function(name) {
		standartRunWithContext(name, {})
	}},
	{name: "ContextJS:Method:Standard:1, ", run: function(name) {
		standartRunWithContext(name, {layer1: true})
	}},
	{name: "ContextJS:Method:Standard:2, ", run: function(name) {
		standartRunWithContext(name, {layer1: true, layer2: true })
	}},
	{name: "ContextJS:Method:Standard:3, ", run: function(name) {
		standartRunWithContext(name, {layer1: true, layer2: true, layer3: true })
	}},
	{name: "ContextJS:Method:Standard:4, ", run: function(name) {
		standartRunWithContext(name, {layer1: true, layer2: true, layer3: true, layer4: true })
	}},
	{name: "ContextJS:Method:Standard:5, ", run: function(name) {
		standartRunWithContext(name, {layer1: true, layer2: true, layer3: true, layer4: true, layer5: true })
	}},
	{name: "ContextJS:Method:Standard:6, ", run: function(name) {
		standartRunWithContext(name, {layer1: true, layer2: true, layer3: true, layer4: true, layer5: true, layer6: true })
	}},
	{name: "ContextJS:Method:Standard:7, ", run: function(name) {
		standartRunWithContext(name, {layer1: true, layer2: true, layer3: true, layer4: true, layer5: true, layer6: true, layer7: true })
	}},
	{name: "ContextJS:Method:Standard:8, ", run: function(name) {
		standartRunWithContext(name, {layer1: true, layer2: true, layer3: true, layer4: true, layer5: true, layer6: true, layer7: true, layer8: true })
	}},
	{name: "ContextJS:Method:Standard:9, ", run: function(name) {
		standartRunWithContext(name, {layer1: true, layer2: true, layer3: true, layer4: true, layer5: true, layer6: true, layer7: true, layer8: true, layer9: true })
	}},
	{name: "ContextJS:Method:Standard:10, ", run: function(name) {
		standartRunWithContext(name, {layer1: true, layer2: true, layer3: true, layer4: true, layer5: true, layer6: true, layer7: true, layer8: true, layer9: true, layer10: true  })
	}},
	])
};

addLayerBenchmarks1 = function() {

	CopBenchmark.benchnarksToRun = CopBenchmark.benchnarksToRun.concat([
	{name: "ContextJS:Method:NoLayer_01", run: function(name) {
		benchmakeBlock(name, 16, function(size, obj) {
			for(var i = 0; i < size; i++) {		
				obj.noLayer_01();	
				obj.noLayer_01();	
				obj.noLayer_01();	
				obj.noLayer_01();	
				obj.noLayer_01();	
				obj.noLayer_01();	
				obj.noLayer_01();	
				obj.noLayer_01();	
				obj.noLayer_01();	
				obj.noLayer_01();	
				obj.noLayer_01();	
				obj.noLayer_01();	
				obj.noLayer_01();	
				obj.noLayer_01();	
				obj.noLayer_01();	
				obj.noLayer_01();		
			}})
		}	
	},
	{name: "ContextJS:Method:NoLayer_02", run: function(name) {
		benchmakeBlock(name, 16, function(size, obj) {
			for(var i = 0; i < size; i++) {		
				obj.noLayer_02();	
				obj.noLayer_02();	
				obj.noLayer_02();	
				obj.noLayer_02();	
				obj.noLayer_02();	
				obj.noLayer_02();	
				obj.noLayer_02();	
				obj.noLayer_02();	
				obj.noLayer_02();	
				obj.noLayer_02();	
				obj.noLayer_02();	
				obj.noLayer_02();	
				obj.noLayer_02();	
				obj.noLayer_02();	
				obj.noLayer_02();	
				obj.noLayer_02();		
				}})
			}
		},
	{name: "ContextJS:Method:NoLayer_03", run: function(name) {
		benchmakeBlock(name, 16, function(size, obj) {
			for(var i = 0; i < size; i++) {		
				obj.noLayer_03();	
				obj.noLayer_03();	
				obj.noLayer_03();	
				obj.noLayer_03();	
				obj.noLayer_03();	
				obj.noLayer_03();	
				obj.noLayer_03();	
				obj.noLayer_03();	
				obj.noLayer_03();	
				obj.noLayer_03();	
				obj.noLayer_03();	
				obj.noLayer_03();	
				obj.noLayer_03();	
				obj.noLayer_03();	
				obj.noLayer_03();	
				obj.noLayer_03();		
			}})
		}
		},
	{name: "ContextJS:Method:NoLayer_04", run: function(name) {
		benchmakeBlock(name, 16, function(size, obj) {
			for(var i = 0; i < size; i++) {		
				obj.noLayer_04();	
				obj.noLayer_04();	
				obj.noLayer_04();	
				obj.noLayer_04();	
				obj.noLayer_04();	
				obj.noLayer_04();	
				obj.noLayer_04();	
				obj.noLayer_04();	
				obj.noLayer_04();	
				obj.noLayer_04();	
				obj.noLayer_04();	
				obj.noLayer_04();	
				obj.noLayer_04();	
				obj.noLayer_04();	
				obj.noLayer_04();	
				obj.noLayer_04();		
			}})
		}
	},

	{name: "ContextJS:Method:NoLayer_05", run: function(name) {
		benchmakeBlock(name, 16, function(size, obj) {
			for(var i = 0; i < size; i++) {		
				obj.noLayer_05();	
				obj.noLayer_05();	
				obj.noLayer_05();	
				obj.noLayer_05();	
				obj.noLayer_05();	
				obj.noLayer_05();	
				obj.noLayer_05();	
				obj.noLayer_05();	
				obj.noLayer_05();	
				obj.noLayer_05();	
				obj.noLayer_05();	
				obj.noLayer_05();	
				obj.noLayer_05();	
				obj.noLayer_05();	
				obj.noLayer_05();	
				obj.noLayer_05();		
			}})
			}
	},
	{name: "ContextJS:Method:NoLayer_06", run: function(name) {
		benchmakeBlock(name, 16, function(size, obj) {
			for(var i = 0; i < size; i++) {		
				obj.noLayer_06();	
				obj.noLayer_06();	
				obj.noLayer_06();	
				obj.noLayer_06();	
				obj.noLayer_06();	
				obj.noLayer_06();	
				obj.noLayer_06();	
				obj.noLayer_06();	
				obj.noLayer_06();	
				obj.noLayer_06();	
				obj.noLayer_06();	
				obj.noLayer_06();	
				obj.noLayer_06();	
				obj.noLayer_06();	
				obj.noLayer_06();	
				obj.noLayer_06();		
			}})
		}
	},

	{name: "ContextJS:Method:NoLayer_07", run: function(name) {
		benchmakeBlock(name, 16, function(size, obj) {
			for(var i = 0; i < size; i++) {		
				obj.noLayer_07();	
				obj.noLayer_07();	
				obj.noLayer_07();	
				obj.noLayer_07();	
				obj.noLayer_07();	
				obj.noLayer_07();	
				obj.noLayer_07();	
				obj.noLayer_07();	
				obj.noLayer_07();	
				obj.noLayer_07();	
				obj.noLayer_07();	
				obj.noLayer_07();	
				obj.noLayer_07();	
				obj.noLayer_07();	
				obj.noLayer_07();	
				obj.noLayer_07();		
			}})
		}
		},

	{name: "ContextJS:Method:NoLayer_08", run: function(name) {
		benchmakeBlock(name, 16, function(size, obj) {
			for(var i = 0; i < size; i++) {		
				obj.noLayer_08();	
				obj.noLayer_08();	
				obj.noLayer_08();	
				obj.noLayer_08();	
				obj.noLayer_08();	
				obj.noLayer_08();	
				obj.noLayer_08();	
				obj.noLayer_08();	
				obj.noLayer_08();	
				obj.noLayer_08();	
				obj.noLayer_08();	
				obj.noLayer_08();	
				obj.noLayer_08();	
				obj.noLayer_08();	
				obj.noLayer_08();	
				obj.noLayer_08();		
			}})
		}
		},

	{name: "ContextJS:Method:NoLayer_09", run: function(name) {
		benchmakeBlock(name, 16, function(size, obj) {
			for(var i = 0; i < size; i++) {		
				obj.noLayer_09();	
				obj.noLayer_09();	
				obj.noLayer_09();	
				obj.noLayer_09();	
				obj.noLayer_09();	
				obj.noLayer_09();	
				obj.noLayer_09();	
				obj.noLayer_09();	
				obj.noLayer_09();	
				obj.noLayer_09();	
				obj.noLayer_09();	
				obj.noLayer_09();	
				obj.noLayer_09();	
				obj.noLayer_09();	
				obj.noLayer_09();	
				obj.noLayer_01();		
			}})
		}
		},

	{name: "ContextJS:Method:NoLayer_10", run: function(name) {
		benchmakeBlock(name, 16, function(size, obj) {
			for(var i = 0; i < size; i++) {		
				obj.noLayer_10();	
				obj.noLayer_10();	
				obj.noLayer_10();	
				obj.noLayer_10();	
				obj.noLayer_10();	
				obj.noLayer_10();	
				obj.noLayer_10();	
				obj.noLayer_10();	
				obj.noLayer_10();	
				obj.noLayer_10();	
				obj.noLayer_10();	
				obj.noLayer_10();	
				obj.noLayer_10();	
				obj.noLayer_10();	
				obj.noLayer_10();	
				obj.noLayer_10();		
			}})
		}
	},
	])
};



addLayerBenchmarks2 = function() {
	CopBenchmark.benchnarksToRun = CopBenchmark.benchnarksToRun.concat([
	{name: "ContextJS:Method:WithLayer:0 ", run: function(name) {
		benchmakeBlock(name, 16, function(size, obj) {
			for(var i = 0; i < size; i++) {		
				obj.countWithLayers();	
				obj.countWithLayers();	
				obj.countWithLayers();	
				obj.countWithLayers();	
				obj.countWithLayers();	
				obj.countWithLayers();	
				obj.countWithLayers();	
				obj.countWithLayers();	
				obj.countWithLayers();	
				obj.countWithLayers();	
				obj.countWithLayers();	
				obj.countWithLayers();	
				obj.countWithLayers();	
				obj.countWithLayers();	
				obj.countWithLayers();	
				obj.countWithLayers();				
			}})
		}
		},

	{name: "ContextJS:Method:WithLayer:1 ", run: function(name) {
		withLayers([L1], function() {
			benchmakeBlock(name, 16, function(size, obj) {
				for(var i = 0; i < size; i++) {		
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();				
				}
			});
		})}
	},

	{name: "ContextJS:Method:WithLayer:2 ", run: function(name) {
		withLayers([L1, L2], function() {
			benchmakeBlock(name, 16, function(size, obj) {
				for(var i = 0; i < size; i++) {		
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();				
				}
			});
		})}
	},

	{name: "ContextJS:Method:WithLayer:3 ", run: function(name) {
		withLayers([L1, L2, L3], function() {
			benchmakeBlock(name, 16, function(size, obj) {
				for(var i = 0; i < size; i++) {		
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();				
				}
			});
		})}
	},

	{name: "ContextJS:Method:WithLayer:4 ", run: function(name) {
		withLayers([L1, L2, L3, L4], function() {
			benchmakeBlock(name, 16, function(size, obj) {
				for(var i = 0; i < size; i++) {		
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();				
				}
			});
		})}
	},

	{name: "ContextJS:Method:WithLayer:5 ", run: function(name) {
		withLayers([L1, L2, L3, L4, L5], function() {
			benchmakeBlock(name, 16, function(size, obj) {
				for(var i = 0; i < size; i++) {		
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();				
				}
			});
		})}
	},

	{name: "ContextJS:Method:WithLayer:6 ", run: function(name) {
		withLayers([L1, L2, L3, L4, L5, L6], function() {
			benchmakeBlock(name, 16, function(size, obj) {
				for(var i = 0; i < size; i++) {		
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();				
				}
			});
		})}
	},

	{name: "ContextJS:Method:WithLayer:7 ", run: function(name) {
		withLayers([L1, L2, L3, L4, L5, L6, L7], function() {
			benchmakeBlock(name, 16, function(size, obj) {
				for(var i = 0; i < size; i++) {		
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();				
				}
			});
		})}
	},

	{name: "ContextJS:Method:WithLayer:8 ", run: function(name) {
		withLayers([L1, L2, L3, L4, L5, L6, L7, L8], function() {
			benchmakeBlock(name, 16, function(size, obj) {
				for(var i = 0; i < size; i++) {		
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();				
				}
			});
		})}
	},

	{name: "ContextJS:Method:WithLayer:9 ", run: function(name) {
		withLayers([L1, L2, L3, L4, L5, L6, L7, L8, L9], function() {
			benchmakeBlock(name, 16, function(size, obj) {
				for(var i = 0; i < size; i++) {		
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();				
				}
			});
		})}
	},

	{name: "ContextJS:Method:WithLayer:10 ", run: function(name) {
		withLayers([L1, L2, L3, L4, L5, L6, L7, L8, L9, L10], function() {
			benchmakeBlock(name, 16, function(size, obj) {
				for(var i = 0; i < size; i++) {		
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();				
				}
			});
		})}
	},
	])
};

Object.subclass('cop.benchmark.C1', {
	initialize: function() {
		this.counter_01= 0;
		this.counter_02= 0;
		this.counter_03= 0;
		this.counter_04= 0;
		this.counter_05= 0;
	},
	
	m1: function() {this.counter_00++;},
	m2: function() {this.counter_00++;},
	m3: function() {this.counter_00++;},
	m4: function() {this.counter_00++;},
	m5: function() {this.counter_00++;},

	L1$m1: function() {this.counter_01++;},
	L1$m2: function() {this.counter_01++;},
	L1$m3: function() {this.counter_01++;},
	L1$m4: function() {this.counter_01++;},
	L1$m5: function() {this.counter_01++;},

	L2$m1: function() {this.counter_02++;},
	L2$m2: function() {this.counter_02++;},
	L2$m3: function() {this.counter_02++;},
	L2$m4: function() {this.counter_02++;},
	L2$m5: function() {this.counter_02++;},

	L3$m1: function() {this.counter_03++;},
	L3$m2: function() {this.counter_03++;},
	L3$m3: function() {this.counter_03++;},
	L3$m4: function() {this.counter_03++;},
	L3$m5: function() {this.counter_03++;},

	L4$m1: function() {this.counter_04++;},
	L4$m2: function() {this.counter_04++;},
	L4$m3: function() {this.counter_04++;},
	L4$m4: function() {this.counter_04++;},
	L4$m5: function() {this.counter_04++;},

	L5$m1: function() {this.counter_05++;},
	L5$m2: function() {this.counter_05++;},
	L5$m3: function() {this.counter_05++;},
	L5$m4: function() {this.counter_05++;},
	L5$m5: function() {this.counter_05++;},
});

addLayerBenchmarks3 = function() {
	var o1 = new cop.benchmark.C1();

	CopBenchmark.benchnarksToRun = CopBenchmark.benchnarksToRun.concat([
	{name: "ContextJS:ActivateLayer:0 ", run: function(name) {
		benchmakeBlock(name, 1, function(size, obj) {
			for(var i = 0; i < size; i++) {
				o1.m1();
				o1.m2();
				o1.m3();
				o1.m4();
				o1.m5();
			}})
		}
	},
	{name: "ContextJS:ActivateLayer:1 ", run: function(name) {
		benchmakeBlock(name, 1, function(size, obj) {
			for(var i = 0; i < size; i++) {
				withLayers([L1], function() {
					o1.m1();
					o1.m2();
					o1.m3();
					o1.m4();
					o1.m5();
				});	
			}})
		}
	},
	{name: "ContextJS:ActivateLayer:2 ", run: function(name) {
		benchmakeBlock(name, 1, function(size, obj) {
			for(var i = 0; i < size; i++) {
				withLayers([L1], function() {
					o1.m1();
					withLayers([L2], function() {
						o1.m2();
						o1.m3();
						o1.m4();
						o1.m5();
					});		
				});		
			}})
		}
	},
	{name: "ContextJS:ActivateLayer:3 ", run: function(name) {
		benchmakeBlock(name, 1, function(size, obj) {
			for(var i = 0; i < size; i++) {
				withLayers([L1], function() {
					o1.m1();
					withLayers([L2], function() {
						o1.m2();
						withLayers([L3], function() {
							o1.m3();
							o1.m4();
							o1.m5();
						});
					});		
				});		
			}})
		}
	},
	{name: "ContextJS:ActivateLayer:4 ", run: function(name) {
		benchmakeBlock(name, 1, function(size, obj) {
			for(var i = 0; i < size; i++) {
				withLayers([L1], function() {
					o1.m1();
					withLayers([L2], function() {
						o1.m2();
						withLayers([L3], function() {
							o1.m3();
							withLayers([L4], function() {
								o1.m4();
								o1.m5();
							});
						});
					});		
				});		
			}})
		}
	},
	{name: "ContextJS:ActivateLayer:5 ", run: function(name) {
		benchmakeBlock(name, 1, function(size, obj) {
			for(var i = 0; i < size; i++) {
				withLayers([L1], function() {
					o1.m1();
					withLayers([L2], function() {
						o1.m2();
						withLayers([L3], function() {
							o1.m3();
							withLayers([L4], function() {
								o1.m4();
								withLayers([L5], function() {
									o1.m5();
								});
							});
						});
					});		
				});		
			}})
		}
	},
	])
};

addLayerBenchmarks4 = function() {
	var o1 = new cop.benchmark.C1();

	CopBenchmark.benchnarksToRun = CopBenchmark.benchnarksToRun.concat([
	{name: "ContextJS:ActivateLayerFlat:0 ", run: function(name) {
		benchmakeBlock(name, 1, function(size, obj) {
			for(var i = 0; i < size; i++) {
				o1.m1();
				o1.m2();
				o1.m3();
				o1.m4();
				o1.m5();
			}})
		}
	},
	{name: "ContextJS:ActivateLayerFlat:1 ", run: function(name) {
		benchmakeBlock(name, 1, function(size, obj) {
			for(var i = 0; i < size; i++) {
				withLayers([L1], function() {
					o1.m1();
					o1.m2();
					o1.m3();
					o1.m4();
					o1.m5();
				});
			}})
		}
	},
	{name: "ContextJS:ActivateLayerFlat:2 ", run: function(name) {
		benchmakeBlock(name, 1, function(size, obj) {
			for(var i = 0; i < size; i++) {
				withLayers([L1, L2], function() {
					o1.m1();
					o1.m2();
					o1.m3();
					o1.m4();
					o1.m5();
				});
			}})
		}
	},
	{name: "ContextJS:ActivateLayerFlat:3 ", run: function(name) {
		benchmakeBlock(name, 1, function(size, obj) {
			for(var i = 0; i < size; i++) {
				withLayers([L1, L2, L3], function() {
					o1.m1();
					o1.m2();
					o1.m3();
					o1.m4();
					o1.m5();
				});
			}})
		}
	},
	{name: "ContextJS:ActivateLayerFlat:4 ", run: function(name) {
		benchmakeBlock(name, 1, function(size, obj) {
			for(var i = 0; i < size; i++) {
				withLayers([L1, L2, L3, L4], function() {
					o1.m1();
					o1.m2();
					o1.m3();
					o1.m4();
					o1.m5();
				});
			}})
		}
	},
	{name: "ContextJS:ActivateLayerFlat:5 ", run: function(name) {
		benchmakeBlock(name, 1, function(size, obj) {
			for(var i = 0; i < size; i++) {
				withLayers([L1, L2, L3, L4, L5], function() {
					o1.m1();
					o1.m2();
					o1.m3();
					o1.m4();
					o1.m5();
				});
			}})
		}
	},
	])
};

Object.subclass("cop.benchmark.WrappBenchTest", {
	intialize: function() {
		this.counter_01 = 0;
		this.counter_02 = 0
	},
	
	m1: function() {
		this.counter_01++;
	},
})

addWrapperBenchmarks = function() {
	var o1 = new cop.benchmark.WrappBenchTest();
	var o2 = new cop.benchmark.WrappBenchTest();
	o2.m1 = function() {this.counter_02++;}

	var o3 = new cop.benchmark.WrappBenchTest();
	var oldFunc = o3.m1;
	o3.m1 = function() {
		oldFunc.call();
		this.counter_02++;
	};

	var o4 = new cop.benchmark.WrappBenchTest();
	o4.m1 = o4.m1.wrap(function(proceed) {
		proceed();
		this.counter_02++;		
	});

	var o5 = new cop.benchmark.WrappBenchTest();
	o5.m1 = function(a,b,c) {
		this.counter_01++;		
		var args = $A(arguments);
		args.shift();
		return args
	};

	CopBenchmark.benchnarksToRun = CopBenchmark.benchnarksToRun.concat([
	{name: "WrapperBenchmark:Default ", run: function(name) {
		benchmakeBlock(name, 16, function(size, obj) {
			for(var i = 0; i < size; i++) {
				o1.m1();
				o1.m1();
				o1.m1();
				o1.m1();
				o1.m1();
				o1.m1();
				o1.m1();
				o1.m1();
				o1.m1();
				o1.m1();
				o1.m1();
				o1.m1();
				o1.m1();
				o1.m1();
				o1.m1();
				o1.m1();
			}})
		}
	},
	{name: "WrapperBenchmark:InstanceSpecific ", run: function(name) {
		benchmakeBlock(name, 16, function(size, obj) {
			for(var i = 0; i < size; i++) {
				o2.m1();
				o2.m1();				
				o2.m1();				
				o2.m1();				
				o2.m1();				
				o2.m1();				
				o2.m1();				
				o2.m1();				
				o2.m1();				
				o2.m1();				
				o2.m1();				
				o2.m1();				
				o2.m1();				
				o2.m1();				
				o2.m1();				
				o2.m1();
			}})
		}
	},
	{name: "WrapperBenchmark:ManualWrap", run: function(name) {
		benchmakeBlock(name, 16, function(size, obj) {
			for(var i = 0; i < size; i++) {
				o3.m1();
				o3.m1();
				o3.m1();
				o3.m1();
				o3.m1();
				o3.m1();
				o3.m1();
				o3.m1();
				o3.m1();
				o3.m1();
				o3.m1();
				o3.m1();
				o3.m1();
				o3.m1();
				o3.m1();
				o3.m1();
			}})
		}
	},
	{name: "WrapperBenchmark:Wrap", run: function(name) {
		benchmakeBlock(name, 16, function(size, obj) {
			for(var i = 0; i < size; i++) {
				o4.m1();
				o4.m1();
				o4.m1();
				o4.m1();
				o4.m1();
				o4.m1();
				o4.m1();
				o4.m1();
				o4.m1();
				o4.m1();
				o4.m1();
				o4.m1();
				o4.m1();
				o4.m1();
				o4.m1();
				o4.m1();
			}})
		}
	},
	{name: "WrapperBenchmark:ArgsToArray", run: function(name) {
		benchmakeBlock(name, 16, function(size, obj) {
			for(var i = 0; i < size; i++) {
				o5.m1(1,2,'Hello World');
				o5.m1(1,2,'Hello World');
				o5.m1(1,2,'Hello World');
				o5.m1(1,2,'Hello World');
				o5.m1(1,2,'Hello World');
				o5.m1(1,2,'Hello World');
				o5.m1(1,2,'Hello World');
				o5.m1(1,2,'Hello World');
				o5.m1(1,2,'Hello World');
				o5.m1(1,2,'Hello World');
				o5.m1(1,2,'Hello World');
				o5.m1(1,2,'Hello World');
				o5.m1(1,2,'Hello World');
				o5.m1(1,2,'Hello World');
				o5.m1(1,2,'Hello World');
				o5.m1(1,2,'Hello World');
			}})
		}
	},
	])
};

CopBenchmark.printEachResult = function(result) {
	console.log(result);
};

CopBenchmark.printResults = function() {
	console.log("Results:");
	console.log(CopBenchmark.result);
};

CopBenchmark.runDelayed = function runDelayed() {
    var benchmark = CopBenchmark.benchnarksToRun.shift();
    if (!benchmark) {
		CopBenchmark.printResults();
      	return
    };
	// console.log("run " + benchmark.name)
	benchmark.run(benchmark.name)
	Global.setTimeout(runDelayed, 10);
};

CopBenchmark.runBenchmark = function runDelayed() {
	CopBenchmark.result= "name	ops	time	ops / time\n";
	CopBenchmark.benchnarksToRun = [];
	addLayerBenchmarks0();
	addLayerBenchmarks1();
	addLayerBenchmarks2();
	addLayerBenchmarks3();
	addLayerBenchmarks4();
	addWrapperBenchmarks();
	CopBenchmark.runDelayed();
};



});
console.log("loaded LayersTest.js");