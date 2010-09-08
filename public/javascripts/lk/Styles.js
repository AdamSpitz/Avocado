/*
 * Copyright (c) 2008-2010 Hasso-Plattner-Institute
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

module('lively.Styles').requires('lively.Widgets').toRun(function() {

if (!Global.DisplayThemes)
	Global.DisplayThemes = {};
	
DisplayThemes['primitive'] = using(lively.paint).link({ 
 	// Primitive look and feel -- flat fills and no rounding or translucency
	styleName: 'primitive',
	titleBar: {
		borderRadius: 0, 
		borderWidth: 2, 
		bordercolor: Color.black,
		fill: Color.neutral.gray.lighter() 
	},
	slider: { 
		borderColor: Color.black, 
		borderWidth: 1, 
		fill: Color.neutral.gray.lighter() 
	},
	button: {
		borderColor: Color.black, 
		borderWidth: 1, 
		borderRadius: 0,
		fill: Color.lightGray 
	},
	widgetPanel: {
		borderColor: Color.red,
		borderWidth: 2,
		borderRadius: 0,
		fill: Color.blue.lighter()
	},
	clock:		 {
		borderColor: Color.black, 
		borderWidth: 1,
		fill: {$:"RadialGradient", 
			stops: [{$:"Stop", offset: 0, color: Color.yellow.lighter(2)}, 
					{$:"Stop", offset: 1, color: Color.yellow}]}
	},
	panel: { 
		fill: Color.primary.blue.lighter(2),
		borderWidth: 2,
		borderColor: Color.black
	},
	link: { 
		borderColor: Color.green, 
		borderWidth: 1, 
		fill: Color.blue
	},
	helpText: {
		borderRadius: 15, 
		fill: Color.primary.yellow.lighter(3), 
		fillOpacity: .8
	},
	fabrik: { 
		borderColor: Color.red, 
		borderWidth: 2, 
		borderRadius: 0, 
		fill: Color.blue.lighter(), 
		opacity: 1
	},
	world: {
		fill: Color.white,
	}
});

DisplayThemes['turquoise'] = using(lively.paint).link({ 
	// Like turquoise, black and silver jewelry, [or other artistic style]
	styleName: 'turquoise',
	titleBar: { 
		borderRadius: 8, 
		borderWidth: 2, 
		bordercolor: Color.black,
		fill: {$:"LinearGradient", 
			stops: [{$:"Stop", offset: 0, color: Color.turquoise},
					{$:"Stop", offset: 1, color: Color.turquoise.lighter(3)}]}
	},
	slider: { 
		borderColor: Color.black, 
		borderWidth: 1, 
		fill: {$:"LinearGradient", 
			stops: [{$:"Stop", offset:0, color: Color.turquoise.lighter(2)},
					{$:"Stop", offset:1, color: Color.turquoise}]}
	},
	button: { 
		borderColor: Color.neutral.gray.darker(), 
		borderWidth: 2, 
		borderRadius: 8,
		fill: {$:"RadialGradient", 
			stops: [{$:"Stop", offset: 0, color: Color.turquoise.lighter()},
					{$:"Stop", offset: 1, color: Color.turquoise}]}
	},
	widgetPanel: { 
		borderColor: Color.neutral.gray.darker(), 
		borderWidth: 4,
		fill: Color.turquoise.lighter(3), 
		borderRadius: 16
	},
	clock: { 
		borderColor: Color.black, 
		borderWidth: 1,
		fill: {$:"RadialGradient", 
			stops: [{$:"Stop", offset: 0, color: Color.turquoise.lighter(2)},
					{$:"Stop", offset: 1, color: Color.turquoise}]}
	},
	panel: {
		fill: Color.primary.blue.lighter(2), 
		borderWidth: 2, 
		borderColor: Color.black
	},
	link: { 
		borderColor: Color.green, 
		borderWidth: 1, 
		fill: Color.blue
	},
	helpText: { 
		borderRadius: 15, 
		fill: Color.primary.yellow.lighter(3), 
		fillOpacity: .8
	},
	fabrik: { 
		borderColor: Color.neutral.gray.darker(), 
		borderWidth: 4,
		fill: Color.turquoise.lighter(3), 
		borderRadius: 16
	},
	world: {
		fill: Color.white,
	}
})

DisplayThemes['hpi'] = using(lively.paint).link({
	styleName: 'hpi',
	raisedBorder: { // conenience grouping
		//borderWidth: 2,
		borderColor: {$:"LinearGradient", 
			stops: [{$:"Stop", offset: 0, color: Color.lightGray}, 
					{$:"Stop", offset: 1, color: Color.darkGray.darker(3)}],
			vector: lively.paint.LinearGradient.SouthEast
		}
	},
	titleBar: { 
		borderRadius: 8, 
		borderWidth: 2, 
		bordercolor: Color.darkGray,
		fill: {$:"LinearGradient", 
			stops: [{$:"Stop", offset: 0.0, color: Color.gray.mixedWith(Color.black, 0.8)},
					{$:"Stop", offset: 1.0, color: Color.gray.lighter()}], 
			vector: lively.paint.LinearGradient.SouthNorth 
		}
	},
	slider: { 
		borderColor: Color.darkGray, 
		borderWidth: 1, 
		fill: {$: "LinearGradient", 
			stops: [{$:"Stop", offset: 0, color: Color.gray.lighter(2)},
					{$:"Stop", offset: 1, color: Color.gray}]
		}
	},
	button: { 
		borderColor: Color.neutral.gray, 
		borderWidth: 0.4, 
		borderRadius: 6,
		fill: {$:"LinearGradient", 
			stops: [{$:"Stop", offset:0, color:Color.gray.mixedWith(Color.black, 0.7)}, 
					{$:"Stop", offset:1, color: Color.gray.lighter()}],
			vector: lively.paint.LinearGradient.SouthNorth }
	},
	widgetPanel: { 
		borderColor: Color.gray.darker(), 
		borderWidth: 4, 
		borderRadius: 16,
		fill: Color.gray.lighter(), 
		opacity: 0.4
	},
	clock: { 
		borderColor: Color.black, borderWidth: 4,
		fill: {$:"RadialGradient", 
			stops: [{$:"Stop", offset: 0, color:Color.gray.lighter(2)}, 
					{$:"Stop", offset: 1, color:Color.gray.lighter()} ]}
	},
	panel: {
		fill: Color.gray.lighter(2), 
		borderWidth: 2, 
		borderColor: Color.darkGray.darker()
	},
	link: {
		borderColor: Color.green, 
		borderWidth: 1, 
		fill: Color.gray
	},
	helpText: { 
		borderRadius: 15, 
		fill: Color.primary.yellow.lighter(3), 
		fillOpacity: .8
	},
	fabrik: {
		borderColor: Color.gray.darker(), 
		borderWidth: 1.0 , 
		borderRadius: 2,
		fill: Color.gray, 
		opacity: 1
	},

	world: {
		fill: Color.white, 
	},
	codePane: {
		//fontFamily: 'Courier'
		fontColor: Color.red,
	}
})



});