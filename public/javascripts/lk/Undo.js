/*
 * Copyright (c) 2008-2010 Software Architecture Group, Hasso Plattner Institute 
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

module("lively.Undo").requires('cop.Layers','lively.Text').toRun(function() {

Object.subclass("UndoHistory", {
	initialize: function() {
		this.undoStack = [];
		this.redoStack = [];
	},

	addCommand: function(cmd) {
		this.undoStack.push(cmd);
		this.redoStack = []; // redo stack is invalid now
	},

	undo: function() {
		if (!this.hasUndoableCommand()) 
			return;
		var cmd = this.undoStack.pop();
		cmd.undo();
		this.redoStack.push(cmd);
	},

	redo: function() {
		if (!this.hasRedoableCommand()) 
			return;
		var cmd = this.redoStack.pop();
		cmd.redo();
		this.undoStack.push(cmd);
	},

	hasUndoableCommand: function() {
		return this.undoStack.length > 0
	},

	hasRedoableCommand: function() {
		return this.redoStack.length > 0
	},

});

Object.subclass("UndoableCommand", {

	undo: function() {},

	redo: function() {},
});

UndoableCommand.subclass("ReplaceTextCommand", {
	initialize: function(morph, index, oldText, newText) {
		this.morph = morph;
		this.index = index;
		this.oldText = oldText;
		this.newText = newText;
	},

	undo: function() {
		// console.log("undo from " + this.index + " to " + this.newText.size())
		withoutLayers([UndoLayer], function() {
			this.morph.setSelectionRange(this.index, this.index + this.newText.size());
			this.morph.replaceSelectionWith(this.oldText);
		}.bind(this))
	},	
	redo: function() {
		withoutLayers([UndoLayer], function() {
			this.morph.setSelectionRange(this.index, this.index + this.oldText.size());
			this.morph.replaceSelectionWith(this.newText);
			var pos = this.index + this.newText.size();
			this.morph.setSelectionRange(pos, pos);
		}.bind(this))
	},	
});

createLayer("UndoLayer")
layerClass(UndoLayer, TextMorph, {

	getUndoHistory: function() {
		if (!this.undoHistory)
			this.undoHistory = new UndoHistory();
		return this.undoHistory
	},

	processCommandKeys: function(proceed, evt) {
		var key = evt.getKeyChar();
		if (key) key = key.toLowerCase();
		if (key == 'z' && evt.isShiftDown()) {
			this.doRedo(); return true;
		};
		return proceed(evt)
	},

	doRedo: function(proceed) {
		var undoHistory = this.getUndoHistory();
		if (undoHistory) {
			return undoHistory.redo()
		}
	},

	doUndo: function(proceed) {
		var undoHistory = this.getUndoHistory();
		if (undoHistory) {
			return undoHistory.undo()
		} else {
			return proceed()
		}
	},
	textSliceFromTo: function(proceed, from, to) {
		var string =  this.textString.substring(from, to + 1);
		if (this.textStyle) {
			var style = this.textStyle.slice(from, to + 1);
		}
		return new lively.Text.Text(string, style);
	},	

	replaceSelectionWith: function(proceed, replacement) {
		var undoHistory = this.getUndoHistory();
		if (undoHistory) {
			var from = this.selectionRange[0];
			var to = this.selectionRange[1];
			var oldText = this.textSliceFromTo(from, to);
			var cmd = new ReplaceTextCommand(this, from, oldText, replacement)
			undoHistory.addCommand(cmd);
		};
		withoutLayers([UndoLayer], function(){
			return proceed(replacement);
		})
	},

	emphasizeFromTo: function(proceed, emph, from, to) {
		var undoHistory = this.getUndoHistory();
		var oldText = this.textSliceFromTo(from, to);
		withoutLayers([UndoLayer], function(){
			proceed(emph, from, to);
		})
		var newText = this.textSliceFromTo(from, to);
		if (undoHistory) {

			var cmd = new ReplaceTextCommand(this, from, oldText, newText)
			this.getUndoHistory().addCommand(cmd);
		}
 	},

	setTextString: function(proceed, string) {
		var undoHistory = this.getUndoHistory();
		if (undoHistory) {
			var from = 0;
			var to = this.textString.size() - 1;
			var oldText = this.textSliceFromTo(from, to);
			var cmd = new ReplaceTextCommand(this, from, oldText, string)
			undoHistory.addCommand(cmd);
		};
		withoutLayers([UndoLayer], function(){
			proceed(string);
		})
 	},
});
enableLayer(UndoLayer);
})