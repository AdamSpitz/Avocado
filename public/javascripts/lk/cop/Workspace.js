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

module("cop.Workspace").requires(["lively.Text", "cop.Layers", "lively.Undo"]).toRun(function() {

Object.extend(Morph.prototype, LayerableObjectTrait);
Morph.prototype.lookupLayersIn = ["owner"];

createLayer("WorkspaceLayer");
layerClass(WorkspaceLayer, TextMorph, {

	toggleEvalOnWorldLoad: function() {
		this.evalOnWorldLoad = ! this.evalOnWorldLoad; 
	},

	morphMenu: function(proceed, evt) {
		var menu = proceed(evt);
		if (menu) {
			menu.addItem([
				(this.evalOnWorldLoad ? "disable" : "enable") + " eval on world load",   this, 
				'toggleEvalOnWorldLoad']);
		}
		return menu
	},

	onDeserialize: function(proceed) {
		proceed();
		if (this.evalOnWorldLoad) {
			// console.log("eval workspace is " + this.evalOnWorldLoad + ":"+ this.textString );
			this.tryBoundEval(this.textString);
		}
	},
})

// Static Instrumentatioan
createLayer("WorkspaceControlLayer");
layerClass(WorkspaceControlLayer, WindowMorph, {

	isWorkspaceLayerEnabled: function() {
			var layers = this.getWithLayers();
			return layers && layers.include(WorkspaceLayer);
	},

	toggleWorkspace: function() {
		console.log("this= " + this);
		if (this.isWorkspaceLayerEnabled()) {
			console.log("disable workspace for " + this); 
			this.setWithLayers([]);
		} else {
			console.log("enable workspace for " + this);
			this.setWithLayers([WorkspaceLayer, UndoLayer]);
			// RESEARCH: here we need to signal the new LayerActivation for interested objects...
		}
	},


	askForNewTitle: function() {
		var self = this;
		WorldMorph.current().prompt('new name', function(input) {
			self.setTitle(input)
		})
		
	},

	morphMenu: function(proceed, evt) {
		console.log("morph menu : ")
		var menu = proceed(evt);
		if (menu) {
			menu.addItem([
				"change title",   this, 
				'askForNewTitle']);

			menu.addItem([
				(this.isWorkspaceLayerEnabled() ? "disable" : "enable") +
				" workspace",   this, 
				'toggleWorkspace']);
		}
		return menu
	}
});

layerClass(WorkspaceControlLayer, WorldMorph, {
	askForWorldTitle: function(){
		var self = this;
		this.prompt('new world title', function(input) {
			document.title = input;
		})
	},

	morphMenu: function(proceed, evt) {
		var menu = proceed(evt);
		if (menu) {
			menu.addItem([
				"change title",   this, 'askForWorldTitle']);

		}
		return menu
	}
});

layerClass(WorkspaceControlLayer, WorldMorph, {
	askForWorldTitle: function(){
		var self = this;
		this.prompt('new world title', function(input) {
			document.title = input;
		})
	},

	morphMenu: function(proceed, evt) {
		var menu = proceed(evt);
		if (menu) {
			menu.addItem([
				"change title",   this, 'askForWorldTitle']);

		}
		return menu
	},

	complexMorphsSubMenuItems: function(proceed, evt) {
		var menu = proceed(evt);
		menu.push(["Workspace", function(evt) { 
			var pane = WorldMorph.current().addTextWindow("Editable text"); 
			pane.owner.toggleWorkspace();
			var textMorph = pane.submorphs[0].submorphs[0];
			textMorph.setFontFamily('Courier');
		}])
		return menu
	}
});






enableLayer(WorkspaceControlLayer);

})

