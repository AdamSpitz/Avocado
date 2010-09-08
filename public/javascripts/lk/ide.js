/*
 * Copyright (c) 2006-2009 Sun Microsystems, Inc.
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


module('lively.ide').requires('lively.Tools', 'lively.Ometa', 'lively.LKFileParser', 'lively.Helper', 'lively.ChangeSet', 'lively.bindings').toRun(function(ide, tools, omet, help) {
    
    // Modules: "+Modules" --> setModule in model
    // Modules: "-Modules" --> getModule in model
    // Modules: "Modules" --> getModule and getModule in model, onModuleUpdate required
 
    //ModulesMenu: [
    // ['test', function() { console.log('click!') }],
    // ['sub', [['test2', function() { console.log('click2!') }]]]
    // ]
 
 
// ===========================================================================
// Browser Framework
// ===========================================================================
Widget.subclass('lively.ide.BasicBrowser', {

	documentation: 'Abstract widget with three list panes and one text pane. Uses nodes to display and manipulate content.',
	initialViewExtent: pt(620, 550),
	emptyText: '-----',

	panelSpec: [
			['locationPane', newTextPane, new Rectangle(0, 0, 0.8, 0.05)],
			['codeBaseDirBtn', function(bnds) { return new ButtonMorph(bnds) }, new Rectangle(0.8, 0, 0.12, 0.05)],
			['localDirBtn', function(bnds) { return new ButtonMorph(bnds) }, new Rectangle(0.92, 0, 0.08, 0.05)],
			['Pane1', newDragnDropListPane, new Rectangle(0, 0.05, 0.3, 0.32)],
			['Pane2', newDragnDropListPane, new Rectangle(0.3, 0.05, 0.35, 0.35)],
			['Pane3', newDragnDropListPane, new Rectangle(0.65, 0.05, 0.35, 0.35)],
			['midResizer', function(bnds) { return new HorizontalDivider(bnds) }, new Rectangle(0, 0.44, 1, 0.01)],
			['sourcePane', newTextPane, new Rectangle(0, 0.45, 1, 0.49)],
			['bottomResizer', function(bnds) { return new HorizontalDivider(bnds) }, new Rectangle(0, 0.94, 1, 0.01)],
			['commentPane', newTextPane, new Rectangle(0, 0.95, 1, 0.05)]
		],

	allPaneNames: ['Pane1', 'Pane2', 'Pane3'],
	filterPlaces: ['Root', 'Pane1', 'Pane2', 'Pane3'],
	formals: ["Pane1Content", "Pane1Selection", "Pane1Menu", "Pane1Filters",
			"Pane2Content", "Pane2Selection", "Pane2Menu", "Pane2Filters",
			"Pane3Content", "Pane3Selection", "Pane3Menu", "Pane3Filters",
			"SourceString", "StatusMessage", "RootFilters"],

	commands: function() { return [] },

	initialize: function($super) {
		$super();
		var panes = this.allPaneNames;
		// create empty onUpdate functions
		panes.forEach(function(ea) {
			this['on' + ea + 'MenuUpdate'] = Functions.Null;
			this['on' + ea + 'FiltersUpdate'] = Functions.Null;
		}, this);
		this.onStatusMessageUpdate = Functions.Null;
		this.onRootFiltersUpdate = Functions.Null;

		//create a model and relay for connecting the additional components later on
		var model = Record.newPlainInstance((function(){
			return this.formals.inject({}, function(spec, ea){spec[ea]=null; return spec})}.bind(this))());
		var spec = {SourceString: "SourceString", StatusMessage: "StatusMessage", RootFilters: "RootFilters"};
		panes.forEach(function(ea) {
			spec[ea + 'Content'] = ea + 'Content';
			spec[ea + 'Selection'] = ea + 'Selection';
			spec[ea + 'Menu'] = ea + 'Menu';
			spec[ea + 'Filters'] = ea + 'Filters';
		});
		this.relayToModel(model, spec);
		this.filterPlaces.forEach(function(ea) {  /*identity filter*/	
			this['set' + ea + 'Filters']([new lively.ide.NodeFilter()]);
		}, this);

		this.buttonCommands = [];
	},
 
	locationInput: function() { return this.panel.locationPane && this.panel.locationPane.innerMorph() },
	
	sourceInput: function() { return this.panel.sourcePane.innerMorph() },
	
    buildView: function (extent) {
 
		extent = extent || this.initialViewExtent;

        this.start();
 
		var panel = new lively.ide.BrowserPanel(extent);
        PanelMorph.makePanedPanel(extent, this.panelSpec, panel);

		this.panel = panel;
        var model = this.getModel();
        var browser = this;
 
        function setupListPanes(paneName) {
            var morph = panel[paneName];
            morph.connectModel(model.newRelay({List:        ("-" + paneName + "Content"),
                                               Selection:   (      paneName + 'Selection'),
                                               Menu:        ("-" + paneName + "Menu")}), true);
            morph.withAllSubmorphsDo(function() {            
                this.onMouseOver = function(evt) { browser.showButtons(evt, morph, paneName) };
                this.onMouseDown = this.onMouseDown.wrap(function(proceed, evt) {
					browser.showButtons(evt, morph, paneName);
                    proceed(evt);
                });
                this.onMouseOut = function(evt) { browser.hideButtons(evt, morph, paneName) };
            })
        }
 
        this.allPaneNames.each(function(ea) { setupListPanes(ea) });
 
		this.setupSourceInput();
		this.setupLocationInput();
 
		//panel.statusPane.connectModel(model.newRelay({Text: "-StatusMessage"}));
		this.buildCommandButtons(panel);
 		this.setupResizers(panel);

		panel.ownerWidget = this;
        return panel;
    },

	setupSourceInput: function() {
		this.sourceInput().maxSafeSize = 2e6;
		// this.sourceInput().styleClass = ['codePane'];
	    this.panel.sourcePane.connectModel(this.getModel().newRelay({Text: "SourceString"}));
	},
	
	setupLocationInput: function() {
		if (!this.locationInput()) return;
		this.locationInput().beInputLine();
		this.locationInput().noEval = true;
	},
	
	setupResizers: function() {
		var panel = this.panel;
		
		// for compatibility to old pages -- FIXME remove
		if (!panel.bottomResizer || !panel.midResizer) return 
		
		// resizer in the middle resiszes top panes, buttons and source pane
		this.allPaneNames.collect(function(name) {
			panel.midResizer.addScalingAbove(panel[name]);
		});
		panel.midResizer.addScalingBelow(panel.sourcePane)

		// buttons
		panel.submorphs.forEach(function(m) {
			if (m.constructor == ButtonMorph)
				panel.midResizer.addFixed(m);
		})

		// bottom resizer divides code and comment pane
		panel.bottomResizer.addScalingAbove(panel.sourcePane)
		panel.bottomResizer.addScalingBelow(panel.commentPane)
	},
	
	buildCommandButtons: function(morph) {
		var cmds = this.commands()
			.collect(function(ea) { return new ea(this) }, this)
			.select(function(ea) { return ea.wantsButton() });
		if (cmds.length === 0) return;

		var height = Math.round(morph.getExtent().y * 0.04);
		var width = morph.getExtent().x / cmds.length
		var y = morph.getExtent().y * 0.44 - height;

		var btns = cmds.forEach(function(cmd, i) {
			var btn = new ButtonMorph(new Rectangle(i*width, y, width, height));
			btn.setLabel(cmd.asString());
			var btnModel = {
				action: function(val) { if (!val) cmd.trigger(); btn.setLabel(cmd.asString()); },
				/*UGLY hack, btn has no real model*/
				setIsActive: function(val) { btn.onIsActiveUpdate(val) },
				getIsActive: function(val) { return cmd.isActive() }
			};
			btn.connectModel({model: btnModel, setValue: 'action', setIsActive: 'setIsActive', getIsActive: 'getIsActive'});
			cmd.button = btn;
			morph.addMorph(btn);
			btnModel.setIsActive(cmd.isActive());
		})
		this.buttonCommands = cmds;
	},

    showButtons: function(evt, pane, paneName) {
        var browser = this;
        var node = browser['get' + paneName + 'Selection']();
        if (!node) return;
 
        var btnSpecs = node.buttonSpecs();
        if (btnSpecs.length === 0) return;
 
        // get or create the buttons
        var offsetX = pane.bounds().left();
        var height = 15;
        var width = (pane.getExtent().x) / btnSpecs.length
        var y = pane.bounds().bottom() /*- height*/;
 
        panel = pane.owner;
 
        var btns = range(0, btnSpecs.length-1).collect(function(i) {
            var existingBtn = panel.submorphs.detect(function(subM) { return subM.label && subM.label.textString === btnSpecs[i].label })
            return existingBtn ? existingBtn : new ButtonMorph(new Rectangle(offsetX + i*width, y, width, height));
        })
 
        // configure the buttons
        btnSpecs.each(function(ea, i) {
            var btnSetValueWrapper = {action: function(value) {
                // if (value) return
                ea.action.apply(browser['get' + paneName + 'Selection']());
                btns.without(btns[i]).each(function(ea) { ea.changeAppearanceFor(false) });
                browser['set' + paneName + 'Selection'](browser['get' + paneName + 'Selection'](), true);
            }};
            btns[i].connectModel({model: btnSetValueWrapper, setValue: 'action'});
            btns[i].toggle = true;
            btns[i].setLabel(ea.label);
            btns[i]['is' + paneName + 'BrowserButton'] = true;
            panel.addMorph(btns[i]);

			// resize/move buttons using the divider, rest of it is in setupResizers
			browser.panel.midResizer.addFixed(btns[i]);
        })
    },
 
    hideButtons: function(evt, morph, paneName, force) {
        if (evt && morph.shape.containsPoint(morph.localize(evt.point()))) return;
        if (!force && this['get' + paneName + 'Selection']() !== null) return;
        var btnHolder = morph.owner;
        var btns = btnHolder.submorphs.select(function(ea) { return ea['is' + paneName + 'BrowserButton'] });
        //btns.each(function(ea) { ea.remove() })
        // var btns = morph.submorphs.select(function(ea) { return ea.isBrowserButton });
        // if (btns.any(function(ea) { return ea.shape.containsPoint(ea.localize(evt.point())) }))
        //     return
        // btns.each(function(ea) { ea.remove() })
    },
    
	mySourceControl: function() {
		var ctrl = lively.Tools.SourceControl;
		if (!ctrl) throw new Error('Browser has no SourceControl!');
		return ctrl;
	},

    start: function() {
        this.setPane1Content(this.childsFilteredAndAsListItems(this.rootNode(), this.getRootFilters()));
		this.mySourceControl().registerBrowser(this);
    },

    rootNode: function() {
        throw dbgOn(new Error('To be implemented from subclass'));
    },
 
	selectedNode: function() {
		return this.getPane3Selection() || this.getPane2Selection() || this.getPane1Selection();
	},

	selectNode: function(node) {
		var paneName = this.paneNameOfNode(node);
		if (!paneName) return;
		this.inPaneSelectNodeNamed(paneName, node.asString());
	},

	allNodes: function() {
		return this.allPaneNames.collect(function(ea) { return this.nodesInPane(ea) }, this).flatten();
	},

    siblingsFor: function(node) {
        var siblings = this.allPaneNames
             .collect(function(ea) { return this.nodesInPane(ea) }, this)
             .detect(function(ea) { return ea.include(node) });
        if (!siblings) return [];
        return siblings.without(node);
    },



    nodesInPane: function(paneName) { // panes have listItems, no nodes
             var listItems = this['get' + paneName + 'Content']();
             if (!listItems) return [];
             if (!listItems.collect) {
    			console.log('Weird bug: listItems: ' + listItems + ' has no collect in pane ' + paneName);
    			return [];
    		}
            return listItems.collect(function(ea) { return ea.value })    
    },
selectionInPane: function(pane) {
	return this['get'+pane+'Selection'](); 
},

    
    filterChildNodesOf: function(node, filters) {
    	return filters.inject(node.childNodes(), function(nodes, filter) {
    		return filter.apply(nodes)
    	});
    },
    
    childsFilteredAndAsListItems: function(node, filters) {
    	return 	this.filterChildNodesOf(node, filters || []).collect(function(ea) { return ea.asListItem() });
    },

    installFilter: function(filter, paneName) {
		var getter = 'get' + paneName + 'Filters';
		var setter = 'set' + paneName + 'Filters';
    	this[setter](this[getter]().concat([filter]).uniq());
    },
    uninstallFilters: function(testFunc, paneName) {
    	// testFunc returns true if the filter should be removed
		var getter = 'get' + paneName + 'Filters';
		var setter = 'set' + paneName + 'Filters';
    	this[setter](this[getter]().reject(testFunc));
    },

    
    
	paneNameOfNode: function(node) {
    	return this.allPaneNames.detect(function(ea) { return this.nodesInPane(ea).include(node) }, this);
	},
 
 	inPaneSelectNodeNamed: function(paneName,  nodeName) {
			var nodes = this['get' + paneName + 'Content']();
			if (!nodes) return null;
			var wanted = nodes.detect(function(ea) { return ea && ea.string && ea.string.include(nodeName) });
			if (!wanted) return null;
			var list = this.panel[paneName].innerMorph();
			var i = list.itemList.indexOf(wanted);
			list.selectLineAt(i, true /*should update*/);
			return wanted;
	},
	
    onPane1SelectionUpdate: function(node) {
	
		this.panel['Pane2'] && this.panel['Pane2'].innerMorph().clearFilter(); // FIXME, lis filter, not a browser filter!
		
        this.setPane2Selection(null, true);
        this.setPane2Content([this.emptyText]);
        if (!node) {
            this.hideButtons(null, this.panel.Pane1, 'Pane1')
            return
        };
		this.setPane2Content(this.childsFilteredAndAsListItems(node, this.getPane1Filters()));
       	this.setSourceString(node.sourceString());
		this.updateTitle();

        this.setPane1Menu(this.commandMenuSpec('Pane1').concat(node.menuSpec()));
		this.setPane2Menu(this.commandMenuSpec('Pane2'));
		this.setPane3Menu(this.commandMenuSpec('Pane3'));

		this.buttonCommands.forEach(function(cmd) { cmd.button.setIsActive(cmd.isActive()) })
    },
 
    onPane2SelectionUpdate: function(node) {
	
		this.panel['Pane3'] && this.panel['Pane3'].innerMorph().clearFilter(); // FIXME, lis filter, not a browser filter!
	
        this.setPane3Selection(null);
        this.setPane3Content([this.emptyText]);        
        if (!node) {
            this.hideButtons(null, this.panel.Pane2, 'Pane2')
            return
        }
        this.setPane3Content(this.childsFilteredAndAsListItems(node, this.getPane2Filters()));
        this.setSourceString(node.sourceString());
		this.updateTitle();

		this.setPane2Menu(this.commandMenuSpec('Pane2').concat(node.menuSpec()));
		this.setPane3Menu(this.commandMenuSpec('Pane3'));

		this.buttonCommands.forEach(function(cmd) { cmd.button.setIsActive(cmd.isActive()) })
    },
 
    onPane3SelectionUpdate: function(node) {
        if (!node) {
            this.hideButtons(null, this.panel.Pane3, 'Pane3')
            return
        }
        this.setSourceString(node.sourceString());
		this.updateTitle();

		this.setPane3Menu(this.commandMenuSpec('Pane3').concat(node.menuSpec()));

		this.buttonCommands.forEach(function(cmd) { cmd.button.setIsActive(cmd.isActive()) })
    },
 
    onSourceStringUpdate: function(methodString, source) {
        if (!methodString || methodString == this.emptyText) return;
        if (this.selectedNode().sourceString() == methodString &&
			source !== this.panel.sourcePane.innerMorph())
				return;
        this.selectedNode().newSource(methodString);
        this.nodeChanged(this.selectedNode());
    },

    hasUnsavedChanges: function() {
        return this.panel.sourcePane.innerMorph().hasUnsavedChanges();
    },
onPane1ContentUpdate: function() {
},
onPane2ContentUpdate: function() {
},

onPane3ContentUpdate: function(items, source) {
 if (source !== this.panel.Pane3.innerMorph())
     return;
 // handle drag and drop of items
 console.log('Got ' + items);
},


    
	allChanged: function(keepUnsavedChanges, changedNode) {
		// optimization: if no node looks like the changed node in my browser do nothing
		if (changedNode && this.allNodes().every(function(ea) {return !changedNode.hasSimilarTarget(ea)}))
			return;
	      // FIXME remove duplication
        var oldN1 = this.getPane1Selection();
        var oldN2 = this.getPane2Selection();
        var oldN3 = this.getPane3Selection();

		var src = keepUnsavedChanges &&
						this.hasUnsavedChanges() &&
						this.panel.sourcePane.innerMorph().textString;

		if (this.hasUnsavedChanges())
			this.setSourceString(this.emptyText);
					
		var revertStateOfPane = function(paneName, oldNode) {
			if (!oldNode) return;
			var nodes = this.nodesInPane(paneName);
			var newNode = nodes.detect(function(ea) {
			    return ea && ea.target && (ea.target == oldNode.target || (ea.target.eq && ea.target.eq(oldNode.target)))
			});
			if (!newNode)
				newNode = nodes.detect(function(ea) {return ea && ea.asString() === oldNode.asString()});
            this['set' + paneName + 'Selection'](newNode, true);
		}.bind(this);
		
		this.start(); // select rootNode and generate new subnodes

		revertStateOfPane('Pane1', oldN1);
		revertStateOfPane('Pane2', oldN2);
		revertStateOfPane('Pane3', oldN3);

		if (!src) return;
		//this.setSourceString(src);
		var text = this.panel.sourcePane.innerMorph();
		text.textString = src; text.changed()
		text.showChangeClue(); // FIXME
	},

    nodeChanged: function(node) {
        // currently update everything, this isn't really necessary
  		this.allChanged();
    },
 
	textChanged: function(node) {
		// be careful -- this can lead to overwritten source code
		this.selectNode(node);
		// this.setSourceString(node.sourceString());
	},
    
	signalNewSource: function(changedNode) {
		this.mySourceControl().updateBrowsers(this, changedNode);
	},

	updateTitle: function() {
		var window = this.panel.owner;
		if (!window) return;
		var n1 = this.getPane1Selection();
        var n2 = this.getPane2Selection();
        var n3 = this.getPane3Selection();
		var title = '';
		if (n1) title += n1.asString();
		if (n2) title += ':' + n2.asString();
		if (n3) title += ':' + n3.asString();
		window.setTitle(title);
	},

	commandMenuSpec: function(pane) {
		var result = this.commands()
			.collect(function(ea) { return new ea(this) }, this)
			.select(function(ea) { return ea.wantsMenu() && ea.isActive(pane) })
			.inject([], function(all, ea) { return all.concat(ea.trigger()) });
		if (result.length > 0)
			result.push(['-------']);
		return result;
	},

	setStatusMessage: function(msg, color, delay) {
		var s = this.panel.sourcePane;	
		if (!this._statusMorph) {
			this._statusMorph = new TextMorph(pt(300,30).extentAsRectangle());
			this._statusMorph.applyStyle({borderWidth: 0})
		}
		var statusMorph = this._statusMorph;
		statusMorph.textString = msg;
		s.addMorph(statusMorph);
		statusMorph.setTextColor(color || Color.black);
		statusMorph.centerAt(s.innerBounds().center());
		(function() { statusMorph.remove() }).delay(delay || 2);
	},



});
PanelMorph.subclass('lively.ide.BrowserPanel', {

	documentation: 'Hack for deserializing my browser widget',

	onDeserialize: function($super) {
		var widget = new this.ownerWidget.constructor();
		if (widget instanceof lively.ide.WikiCodeBrowser) return; // FIXME deserialize wiki browser
		var selection = this.getSelectionSpec();
		if (this.targetURL) widget.targetURL = this.targetURL;
		this.owner.targetMorph = this.owner.addMorph(widget.buildView(this.getExtent()));
		this.owner.targetMorph.setPosition(this.getPosition());
		this.remove();
		this.resetSelection(selection, widget);
    },

	getPane: function(pane) { return this[pane] && this[pane].innerMorph() },
	
	getSelectionTextOfPane: function(pane) {
		var pane = this.getPane(pane);
		if (!pane) return null;
		var index = pane.selectedLineNo;
		if (index === undefined) return null;
		var textItem = pane.submorphs[index];
		return textItem && textItem.textString;
	},

	getSelectionSpec: function() {
		var basicPaneName = 'Pane', spec = {}, i = 1;
		while (1) {
			var paneName = basicPaneName + i;
			var sel = this.getSelectionTextOfPane(paneName);
			if (!sel) return spec;
			spec[paneName] = sel;
			i++;
		}			
	},
	
	resetSelection: function(selectionSpec, widget) {
		for (var paneName in selectionSpec)
			widget.inPaneSelectNodeNamed(paneName, selectionSpec[paneName]);
	},
});
 
Object.subclass('lively.ide.BrowserNode', {

	documentation: 'Abstract node, defining the node interface',

	initialize: function(target, browser, parent) {
		this.target = target;
		this.browser = browser;
		this.parent = parent;
	},

	siblingNodes: function() {
		if (!(this.browser instanceof ide.SystemBrowser)) throw dbgOn(new Error('No browser when tried siblingNodes'));
		return this.browser.siblingsFor(this);
	},

	parent: function() {
		return this.parent;
	},

	childNodes: function() {
		return []
	},

	asString: function() {
		return 'no name for node of type ' + this.constructor.type;
	},

	asListItem: function() {
		//FIXME make class listitem
		var node = this;
		return {
			isListItem: true,
			string: this.asString(),
			value: this,
			onDrop: function(item) { node.onDrop( item && item.value) },	//convert to node
			onDrag: function() { node.onDrag() },
		};
	},

	sourceString: function() {
		return this.browser.emptyText
	},

	hasSimilarTarget: function(other) {
		if (!other)
			return false;
		var myString = this.asString();
		var otherString = other.asString();
		return myString.length >= otherString.length ?
		myString.include(otherString) :
		otherString.include(myString);
	},

	newSource: function(newSource) {
		var errorOccurred = false;
		var failureOccurred = false;
		var msg = 'Saving ' + this.target.getName() + '...\n';

		// save source
		try {
			if (this.saveSource(newSource, tools.SourceControl)) {
				msg += 'Successfully saved';
			} else {
				msg += 'Couldn\'t save';
				failureOccurred = true;
			} 
		} catch(e) {
			dbgOn(true)
			msg += 'Error while saving: ' + e;
			errorOccurred = true;
		}

		msg += '\n';
		
		// eval source
		try {
			if (this.evalSource(newSource)) {
				msg += 'Successfully evaluated ' + this.target.getName();
			} else {
				msg += 'Eval disabled for ' + this.target.getName();
				failureOccurred = true;
			}
		} catch(e) {
			msg += 'Error evaluating ' + e;
			errorOccurred = true;
		}
		var color = errorOccurred ? Color.red : (failureOccurred ? Color.black : Color.green);
		var delay = errorOccurred ? 5 : null;
		this.statusMessage(msg, color, delay);
		this.browser.signalNewSource(this);
	},
 
    evalSource: function(newSource) {
        return false;
    },
 
    saveSource: function(newSource, sourceControl) {
        return false;
    },
 
    buttonSpecs: function() {
        return []
    },
 
    menuSpec: function() {
        return [];
    },
    
    statusMessage: function(string, optColor, optDelay) {
		console.log('Browser statusMessage: ' + string);
        this.browser && this.browser.setStatusMessage(string, optColor, optDelay);
    },
    
    signalChange: function() {
        this.browser.nodeChanged(this);
    },

	signalTextChange: function() {
        this.browser.textChanged(this);
    },
    
onDrag: function() {
    console.log(this.asString() + 'was dragged');
},
onDrop: function(nodeDroppedOntoOrNull) {
    console.log(this.asString() + 'was dropped');
},
handleDrop: function(nodeDroppedOntoMe) {
	// for double dispatch
	return false;
},

 
});

Object.subclass('lively.ide.BrowserCommand', {

	initialize: function(browser) {
		this.browser = browser;
	},

	wantsButton: function() {
		return false;
	},

	wantsMenu: function() {
		return false;
	},

	isActive: function() {
		return false;
	},

	asString: function() {
		return 'unnamed command'
	},

	trigger: function() {}

});

Object.subclass('lively.ide.NodeFilter', {
	apply: function(nodes) { return nodes }
});

lively.ide.NodeFilter.subclass('lively.ide.SortFilter', {
	apply: function(nodes) {
		return nodes.sort(function(a,b) {
			if (a.asString().toLowerCase() < b.asString().toLowerCase()) return -1;
			if (a.asString().toLowerCase() > b.asString().toLowerCase()) return 1;
			return 0;
		});
	}
});

lively.ide.NodeFilter.subclass('lively.ide.NodeTypeFilter', {

	documentation: 'allows only nodes of the specified class',
	isNodeTypeFilter: true,

	initialize: function(attrsThatShouldBeTrue) {
		this.attributes = attrsThatShouldBeTrue;
	},	

	apply: function(nodes) {
		var attrs = this.attributes;
		if (!attrs) {
			console.log('nodeTypeFilter has no attributes!!!');
			return nodes;
		}
		return nodes.select(function(node) {
			return attrs.any(function(attr) { return node[attr] });
		});
	}
});

Object.extend(lively.ide.NodeTypeFilter, {
defaultInstance: function() {
	return new lively.ide.NodeTypeFilter(['isClassNode', 'isGrammarNode', 'isChangeNode']);
},
});

 
// ===========================================================================
// Browsing js files and OMeta
// ===========================================================================
ide.BasicBrowser.subclass('lively.ide.SystemBrowser', {

	documentation: 'Browser for source code parsed from js files',
	viewTitle: "SystemBrowser",
	isSystemBrowser: true,

	initialize: function($super) {
		$super();
		this.installFilter(lively.ide.NodeTypeFilter.defaultInstance(), 'Pane1');
		this.installFilter(new lively.ide.SortFilter(), 'Root');
		this.evaluate = true;
		this.targetURL = null;
	},

	setupLocationInput: function($super) {
		$super();
		connect(this, 'targetURL', this.locationInput(), 'setTextString', function(value) { return value.toString() })
		connect(this.locationInput(), 'savedTextString', this, 'setTargetURL', function(value) { return new URL(value) })
		this.targetURL = this.targetURL // hrmpf

		this.panel.codeBaseDirBtn.setLabel('codebase');
		connect(this.panel.codeBaseDirBtn, 'fire', this, 'setTargetURL', function() { return URL.codeBase.withFilename('lively/') })
		this.panel.localDirBtn.setLabel('local');
		connect(this.panel.localDirBtn, 'fire', this, 'setTargetURL', function() { return URL.source.getDirectory() })
	},
	
	getTargetURL: function() {
		if (!this.targetURL) this.targetURL = this.sourceDatabase().codeBaseURL;
		return this.targetURL;
	},
	
	setTargetURL: function(url) {
		var prevURL = this.targetURL;
		if (!url.toString().endsWith('/'))
			url = new URL(url.toString() + '/');
		try {
			this.targetURL = url;
			this.rootNode().locationChanged();
			this.allChanged();
		} catch(e) {
			console.log('couldn\'t set new URL ' + url + ' because ' + e);
			this.targetURL = prevURL;
			this.locationInput().setTextString(prevURL.toString());
			return
		}
		this.panel.targetURL = url; // FIXME for persistence
		console.log('new url: ' + url);
	},
	
	rootNode: function() {
		ide.startSourceControl();
		if (!this._rootNode)
			this._rootNode = new ide.SourceControlNode(tools.SourceControl, this, null);
		return this._rootNode;
	},

	commands: function() {
		// lively.ide.BrowserCommand.allSubclasses().collect(function(ea) { return ea.type}).join(',\n')
		return [
		// lively.ide.BrowseWorldCommand,
		lively.ide.AddNewFileCommand,
		lively.ide.AllModulesLoadCommand,
		lively.ide.ShowLineNumbersCommand,
		lively.ide.RefreshCommand,
		lively.ide.EvaluateCommand,
		lively.ide.SortCommand,
		lively.ide.ViewSourceCommand]
	},


	sourceDatabase: function() {
		return this.rootNode().target;
	},

});
 
Object.extend(lively.ide.SystemBrowser, {
 
	browse: function(module, klass, method) {
	    var browser = new ide.SystemBrowser();
		browser.openIn(WorldMorph.current());
 
		var srcCtrl = ide.startSourceControl();
		srcCtrl.addModule(module);
 
		browser.nodeChanged(null); // FIXME
		
		browser.inPaneSelectNodeNamed('Pane1', module);
		browser.inPaneSelectNodeNamed('Pane2', klass);
		browser.inPaneSelectNodeNamed('Pane3', method);
 
		return browser;
	}
	
});

ide.BasicBrowser.subclass('lively.ide.LocalCodeBrowser', {

	documentation: 'Browser for the local ChangeSet',
	viewTitle: "LocalCodeBrowser",
	allPaneNames: ['Pane1', 'Pane2'],

	panelSpec: [
	//['locationPane', newTextPane, new Rectangle(0, 0, 1, 0.05)],
	['Pane1', newDragnDropListPane, new Rectangle(0, 0, 0.5, 0.4)],
	['Pane2', newDragnDropListPane, new Rectangle(0.5, 0, 0.5, 0.4)],
	['midResizer', function(b) { return new HorizontalDivider(b) }, new Rectangle(0, 0.44, 1, 0.01)],
	['sourcePane', newTextPane, new Rectangle(0, 0.45, 1, 0.49)],
	['bottomResizer', function(b) { return new HorizontalDivider(b) }, new Rectangle(0, 0.94, 1, 0.01)],
	['commentPane', newTextPane, new Rectangle(0, 0.95, 1, 0.05)]
],

	initialize: function($super, optWorldProxy) {
		$super();
		this.worldProxy = optWorldProxy;
		this.changeSet = (optWorldProxy && optWorldProxy.getChangeSet()) ||
		ChangeSet.current();
		this.evaluate = true;
	},

	rootNode: function() {
		ide.startSourceControl();
		if (!this._rootNode)
			this._rootNode = this.changeSet.asNode(this);
		return this._rootNode;
	},

	commands: function() {
		return [lively.ide.BrowseWorldCommand,
		lively.ide.SaveChangesCommand,
		lively.ide.RefreshCommand,
		lively.ide.EvaluateCommand,
		lively.ide.SortCommand,
		lively.ide.ChangeSetMenuCommand,
		lively.ide.ClassChangeMenuCommand]
	},

});

ide.BasicBrowser.subclass('lively.ide.WikiCodeBrowser', {

	documentation: 'Browser for the local ChangeSet',
	viewTitle: "WikiCodeBrowser",

	panelSpec: [
		['Pane1', newDragnDropListPane, new Rectangle(0, 0, 0.3, 0.45)],
		['Pane2', newDragnDropListPane, new Rectangle(0.3, 0, 0.35, 0.45)],
		['Pane3', newDragnDropListPane, new Rectangle(0.65, 0, 0.35, 0.45)],
		['sourcePane', newTextPane, new Rectangle(0, 0.5, 1, 0.5)],
	],

	initialize: function($super, wikiUrl) {
		$super();
		this.wikiUrl = wikiUrl;
		this.evaluate = true;
	},

	rootNode: function() {
		ide.startSourceControl();
		if (!this._rootNode)
			this._rootNode = new lively.ide.WikiCodeNode(WikiNetworkAnalyzer.forRepo(this.wikiUrl), this, null);
		return this._rootNode;
	},

	commands: function() {
		return [lively.ide.BrowseWorldCommand,
		lively.ide.RefreshCommand,
		lively.ide.EvaluateCommand,
		lively.ide.SortCommand,
		lively.ide.ChangeSetMenuCommand,
		lively.ide.ClassChangeMenuCommand]
	},

});
 
ide.BrowserNode.subclass('lively.ide.SourceControlNode', {

	documentation: 'The root node of the SystemBrowser. Represents a URL',

	initialize: function($super, target, browser, parent) {
		$super(target, browser, parent);
		this.allFiles = [];
	},
	
	addFile: function(file) { this.allFiles.push(file) },
	
	removeFile: function(file) { this.allFiles = this.allFiles.without(file) },
	
	locationChanged: function() {
		try {
			this.allFiles = this.target.interestingLKFileNames(this.browser.getTargetURL());
		} catch(e) {
			// can happen when browser in a serialized world that is moved tries to relativize a URL
			console.error('Cannot get files for code browser ' + e)
			this.allFiles = [];
		}
	},
	
	childNodes: function() {
		// js files + OMeta files (.txt) + lkml files + ChangeSet current
		//if (this._childNodes) return this._childNodes; // optimization
		var nodes = [];
		var srcDb = this.target;
		var b = this.browser;
		if (this.allFiles.length == 0) this.locationChanged();
		for (var i = 0; i < this.allFiles.length; i++) {
			var fn = this.allFiles[i];
			if (fn.endsWith('.js')) {
				nodes.push(new ide.CompleteFileFragmentNode(srcDb.rootFragmentForModule(fn), b, this, fn));
			} else if (fn.endsWith('.ometa')) {
				nodes.push(new ide.CompleteOmetaFragmentNode(srcDb.rootFragmentForModule(fn), b, this, fn));
			} else if (fn.endsWith('.lkml')) {
				nodes.push(new ide.ChangeSetNode(ChangeSet.fromFile(fn, srcDb.getCachedText(fn)), b, this));
			} else if (fn.endsWith('.st')) {
				require('lively.SmalltalkParserSupport').toRun(function() {
					nodes.push(new StBrowserFileNode(srcDb.rootFragmentForModule(fn), b, this, fn));
				}.bind(this))
			}
		};
		nodes.push(ChangeSet.current().asNode(b)); // add local changes
		this._childNodes = nodes;
		return nodes;
	},
});

ide.BrowserNode.subclass('lively.ide.WikiCodeNode', {
    
	documentation: 'The rootNode which gets the code from worlds of a wiki',

	initialize: function($super, target, browser, parent) {
		"console.assert(target instanceof WikiNetworkAnalyzer);"
		$super(target, browser, parent);
		this.worldsWereFetched = false;
    },
    childNodes: function() {
		if (this._childNodes)
			return this._childNodes;
		if (!this.worldsWereFetched)
			this.updateWithWorlds();
		var nodes = [];
		nodes.push(ChangeSet.current().asNode(this.browser));
		var proxies = this.target.getWorldProxies().select(function(ea) {
			return ea.localName().endsWith('xhtml')
		});
		nodes = nodes.concat(
			proxies.collect(function(ea) {
				return new lively.ide.RemoteChangeSetNode(null, this.browser, this, ea);
		}, this));
		this._childNodes = nodes;
		return nodes;
	},

	updateWithWorlds: function(fileList) {
		this.worldsWereFetched = true;
		this._childNodes = null;
		this.target.fetchFileList(function() {
			this._childNodes = null;
			this.signalChange();
		}.bind(this));
	},
	
});
 
ide.BrowserNode.subclass('lively.ide.FileFragmentNode', {

	sourceString: function() {
		if (!this.target)
			return 'entity not loaded';
		this.savedSource = this.target.getSourceCode();
		return this.savedSource;
	},

	asString: function() {
		var name = this.target.name || this.sourceString().truncate(22).replace('\n', '') + '(' + this.type + ')';
		if (this.showLines()) name += ' (' + this.target.startLine() + '-' + this.target.stopLine() + ')';
		return name;
	},

	showLines: function() {
		return this.browser.showLines;
	},

	saveSource: function($super, newSource, sourceControl) {
		this.target.putSourceCode(newSource);
		this.savedSource = this.target.getSourceCode(); // assume that users sees newSource after that
		return true;
	},

	menuSpec: function($super) {
		var spec = $super();
		var node = this;
		spec.push(['add sibling below', function() {
			var world = WorldMorph.current();
			world.prompt('Enter source code', function(input) {
				node.target.addSibling(input);
				node.browser.allChanged();
			});
		}]);
		spec.push(['remove', function() {
			node.target.remove();
			node.browser.allChanged() }]);
		return spec;
	},

	getSourceControl: function() {
		if (this.target.getSourceControl)
			return this.target.getSourceControl();
		return tools.SourceControl;
	},

	onDrop: function(other) {
		if (!other) return;
		console.log(' Moving ' + this.target + ' to ' + other.target);
		if (other.handleDrop(this))
			this.target.remove();
		else
		this.target.moveTo(other.target.stopIndex+1);
		this.signalChange();
	},

	onDrag: function() {
		// onDrop does all the work
	},

});

ide.FileFragmentNode.subclass('lively.ide.CompleteFileFragmentNode', { // should be module node
 
	maxStringLength: 10000,

    initialize: function($super, target, browser, parent, moduleName) {
        $super(target, browser, parent);
        this.moduleName = moduleName;
		this.showAll = false;
    },
 
    childNodes: function() {
        var browser = this.browser;
        var completeFileFragment = this.target;
        if (!completeFileFragment) return [];
		var typeToClass = function(type) {
			if (type === 'klassDef' || type === 'klassExtensionDef')
				return ide.ClassFragmentNode;
			if (type === 'functionDef')
				return ide.FunctionFragmentNode;
			return ide.ObjectFragmentNode;
		}
		return this.target.subElements(2)
		  .select(function(ea) { return ['klassDef','klassExtensionDef','functionDef','objectDef', 'propertyDef'].include(ea.type) })
		  .collect(function(ea) { return new (typeToClass(ea.type))(ea, browser) })
    },
 
    buttonSpecs: function() {
		var b = this.browser;
		var pane = b.paneNameOfNode(this);
		if (!pane) return [];
		var f = b['get'+pane+'Filters']().detect(function(ea) { return ea.isNodeTypeFilter });
		if (!f) {
			f = lively.ide.NodeTypeFilter.defaultInstance();
			b.installFilter(f, pane);
			console.log('installing filter.......');
		}
		var configFilter = function(attrs) {f.attributes = attrs}
        return [{label: 'classes', action: configFilter.curry(['isClassNode', 'isGrammarNode', 'isChangeNode'])},
                    {label: 'functions', action: configFilter.curry(['isFunctionNode'])},
                    {label: 'objects', action: configFilter.curry(['isObjectNode'])}];
    },
    
    sourceString: function($super) {
		this.loadModule();
        //if (!this.target) return '';
		var src = $super();
		if (src.length > this.maxStringLength && !this.showAll) return '';
        return src;
    },
    
    asString: function() {
		var name = this.moduleName;
		name = name.substring(name.lastIndexOf('/') + 1, name.length);
		if (!this.target) return name + ' (not parsed)';
		if (!this.showLines()) return name;
		return name + ' (' + this.target.startLine() + '-' + this.target.stopLine() + ')';
    },

	loadModule: function() {
		if (this.target) return;
		this.target = tools.SourceControl.addModule(this.moduleName).ast();
		this.signalChange();
	},
    
	menuSpec: function($super) {
		var menu = [];
   		if (!this.target) return menu;
		var browser = this.browser;
		var node = this;
		menu.unshift(['load', function() {
			try { node.target.getFileString() } catch (e) { WorldMorph.current().notify('Error: ' + e)} }]);
		menu.unshift(['open ChangeList viewer', function() {
			new ChangeList(node.moduleName, null, node.target.flattened()).openIn(WorldMorph.current()) }]);
		menu.unshift(['reparse', function() {
    		node.getSourceControl().reparseModule(node.moduleName, true);
    		node.signalChange() }]);
		menu.unshift(['toggle showAll', function() {
    		node.showAll = !node.showAll;
    		node.signalTextChange() }]);
		menu.unshift(['remove', function() {
			browser.sourceDatabase().removeFile(node.moduleName);
			browser.rootNode().removeFile(node.moduleName);
			browser.allChanged()}]);
	return menu;
},

    
});

ide.CompleteFileFragmentNode.subclass('lively.ide.CompleteOmetaFragmentNode', {

	menuSpec: function($super) {
		var menu = $super();
    	var fileName = this.moduleName;
    	if (!this.target) return menu;
		var world = WorldMorph.current();
		menu.unshift(['Translate grammar', function() {
			world.prompt(
				'File name of translated grammar?',
				function(input) {
					if (!input.endsWith('.js')) input += '.js';
					world.prompt(
						'Additional requirements (comma separated)?',
						function(requirementsString) {
							var requirments = requirementsString ? requirementsString.split(',') : null;
							OMetaSupport.translateAndWrite(fileName, input, requirments) }
					);	
				},
				fileName.slice(0, fileName.indexOf('.'))
			) }]);
    		return menu;
	},

	childNodes: function() {
		var fileDef = this.target;
		if (!fileDef) return [];
		var browser = this.browser;
		var ometaNodes = fileDef.subElements()
			.select(function(ea) { return ea.type === 'ometaDef'})
			.collect(function(ea) { return new ide.OMetaGrammarNode(ea, browser, this) });
/***/
ometaNodes.forEach(function(ea) { console.log(ea.target.name) });
/***/
		var rest = fileDef.subElements()
			.select(function(ea) { return !fileDef.subElements().include(ea) })
			.collect(function(ea) { return new ide.ObjectFragmentNode(ea, browser, this) });
		return ometaNodes.concat(rest);
    },

	evalSource: function(newSource) {
		var def = OMetaSupport.translateToJs(newSource);
		if (!def) throw(dbgOn(new Error('Cannot translate!')));
		try {
			eval(def);
		} catch (er) {
			console.log("error evaluating: " + er);
			throw(er)
		}
		console.log('Successfully evaluated OMeta definition');
        return true;
    },

});

ide.FileFragmentNode.subclass('lively.ide.OMetaGrammarNode', {

	isGrammarNode: true,
	
	childNodes: function() {
		var def = this.target;
		var browser = this.browser;
		return this.target.subElements()
			.collect(function(ea) { return new ide.OMetaRuleNode(ea, browser, this) });
	},

	evalSource: lively.ide.CompleteOmetaFragmentNode.prototype.evalSource,

});

ide.FileFragmentNode.subclass('lively.ide.OMetaRuleNode', {

isMemberNode: true,

evalSource: function(newSource) {
	var def = this.target.buildNewFileString(newSource);
	lively.ide.CompleteOmetaFragmentNode.prototype.evalSource(def);
	return true;
},

});

ide.FileFragmentNode.subclass('lively.ide.ClassFragmentNode', {
 
  isClassNode: true,
  
    childNodes: function() {
        var classFragment = this.target;
        var browser = this.browser;
        return classFragment.subElements()
            .select(function(ea) { return ea.type === 'propertyDef' })
            // .sort(function(a,b) { if (!a.name || !b.name) return -999; return a.name.charCodeAt(0)-b.name.charCodeAt(0) })
            .collect(function(ea) { return new ide.ClassElemFragmentNode(ea, browser, this) });
    },

	menuSpec: function($super) {
		var menu = $super();
		var fragment = this.target;
		var index = fragment.name ? fragment.name.lastIndexOf('.') : -1;
		// don't search for complete namespace name, just its last part
		var searchName = index === -1 ? fragment.name : fragment.name.substring(index+1);
		// menu.unshift(['add to current ChangeSet', function() {
		// 	WorldMorph.current().confirm('Add methods?', function(addMethods) {
		// 		var cs = ChangeSet.current();
		// 		var classChange = new 
		// 	});
		// }]);
		menu.unshift(['references', function() {
			var list = tools.SourceControl
				.searchFor(searchName)
				.without(fragment)
			var title = 'references of' + fragment.name;
			new ChangeList(title, null, list, searchName).openIn(WorldMorph.current()) }]);
		return menu;
	},

handleDrop: function(nodeDroppedOntoMe) {
	if (!(nodeDroppedOntoMe instanceof lively.ide.ClassElemFragmentNode))
		return false;
	console.log('Adding' + nodeDroppedOntoMe.asString() + ' to ' + this.asString());
	if (this.target.subElements().length == 0) {
		console.log('FIXME: adding nodes to empty classes!');
		return
	}
	this.target.subElements().last().addSibling(nodeDroppedOntoMe.target.getSourceCode());
	return true;
},

	evalSource: function(newSource) {
		try {
			eval(newSource);
		} catch (er) {
			console.log("error evaluating class:" + er);
			throw(er)
		}
		console.log('Successfully evaluated class');
        return true;
    },

});
 
ide.FileFragmentNode.subclass('lively.ide.ObjectFragmentNode', {

	isObjectNode: true,
	
    childNodes: function() {
        if (!this.target.subElements()) return [];
        // FIXME duplication with ClassFragmentNode
        var obj = this.target;
        var browser = this.browser;
        return obj.subElements()
            .select(function(ea) { return ea.type === 'propertyDef' })
            // .sort(function(a,b) { if (!a.name || !b.name) return -999; return a.name.charCodeAt(0)-b.name.charCodeAt(0) })
            .collect(function(ea) { return new ide.ClassElemFragmentNode(ea, browser, this) });
    },

	menuSpec: ide.ClassFragmentNode.prototype.menuSpec, // FIXME
 
})
 
ide.FileFragmentNode.subclass('lively.ide.ClassElemFragmentNode', {

    isMemberNode: true,
    
	menuSpec: function($super) {
		var menu = $super();
		var fragment = this.target;
		var searchName = fragment.name;
		return [
    		['senders', function() {
					var list = tools.SourceControl
						.searchFor(searchName)
						.select(function(ea) {
							if (!ea.name || !ea.name.include(searchName)) return true;
							var src = ea.getSourceCodeWithoutSubElements();
							return src.indexOf(searchName) !== src.lastIndexOf(searchName)
					}); // we don't want pure implementors, but implementors which are also senders should appear
					var title = 'senders of' + searchName;
					new ChangeList(title, null, list, searchName).openIn(WorldMorph.current()) }],
			['implementors', function() {
					var list = tools.SourceControl
						.searchFor(searchName)
						.without(fragment)
						.select(function(ea) { return ea.name === searchName });
					var title = 'implementers of' + searchName;
					new ChangeList(title, null, list, searchName).openIn(WorldMorph.current()) }]
    	].concat(menu);
	},
sourceString: function($super) {
	var src = $super();
	var view = this.browser.viewAs;
	if (!view) return src;
	if (view != 'javascript' && view != 'smalltalk')
		return 'unknown source view';
	var browserNode = this;
	var result = 'loading Smalltalk module, click again on list item';
	require('lively.SmalltalkParser').toRun(function() {
		var jsSrc = '{' + src + '}' // as literal object
		var jsAst = OMetaSupport.matchAllWithGrammar(BSOMetaJSParser, "topLevel", jsSrc, true);
	  jsAst = jsAst[1][1] // access the binding, not the json object nor sequence node
		var stAst = OMetaSupport.matchWithGrammar(JS2StConverter, "trans", jsAst, true);
		result = view == 'javascript' ? stAst.toJavaScript() : stAst.toSmalltalk();
	});
	return result
},


	evalSource: function(newSource) {
		if (!this.browser.evaluate) return false;
		var ownerName = this.target.className || this.target.findOwnerFragment().name;
		if (!Class.forName(ownerName)) {
			console.log('Didn\'t found class/object');
			return false
		}
		var methodName = this.target.name;
		var methodString = this.target.getSourceCode();
		var def;
		if (this.target.isStatic())
			def = 'Object.extend(' + ownerName + ', {\n' + methodString +'\n});';
		else
			def = ownerName + ".addMethods({\n" + methodString +'\n});';
		// console.log('Eval: ' + def);
		try {
			eval(def);
		} catch (er) {
			console.log("error evaluating method " + methodString + ': ' + er);
			throw(er)
		}
		console.log('Successfully evaluated #' + methodName);
        return true;
    },

asString: function($super) {
	var string = $super();
	if (this.target.isStatic instanceof Function)
		string +=  this.target.isStatic() ? ' (static)' : ' (proto)';
	return string;
},
});
 
ide.FileFragmentNode.subclass('lively.ide.FunctionFragmentNode', {

	isFunctionNode: true,
	
	menuSpec: ide.ClassElemFragmentNode.prototype.menuSpec, // FIXME

});

ide.BrowserNode.subclass('lively.ide.ChangeNode', {

	documentation: 'Abstract node for Changes/ChangeSet nodes',

	isChangeNode: true,

	asString: function() {
		return this.target.getName() + (this.target.automaticEvalEnabled() ? '' : ' (disabled)');
	},

	menuSpec: function() {
		var spec = [];
		var n = this;
		var t = n.target;
		spec.push(['remove', function() {
			t.remove();
			n.browser.allChanged() }]);
		if (t.automaticEvalEnabled())	
			spec.push(['disable evaluation at startup', function() {
				t.disableAutomaticEval(); n.signalChange(); }]);
		else
			spec.push(['enable evaluation at startup', function() {
				t.enableAutomaticEval(); n.signalChange(); }]);
		return spec;
	},
	sourceString: function() {
		return this.target.asJs();
	},

	saveSource: function(newSource) {
		var fragment = new JsParser().parseNonFile(newSource);
		var change = fragment.asChange();
		this.target.setXMLElement(change.getXMLElement());
		this.savedSource = this.target.asJs();
		return true;
	},
	
	evalSource: function(newSource) {
		if (!this.browser.evaluate) return false;
		/*if (this.target.getDefinition() !== newSource)
		throw dbgOn(new Error('Inconsistency while evaluating and saving?'));*/
		this.target.evaluate();
		return true
	},
	
	onDrop: function(other) {
		if (!other) return;
		console.log(' Moving ' + this.target + ' to ' + other.target);
		this.target.remove();
		other.handleDrop(this);
		this.signalChange();
	},
	onDrag: function() {
		// onDrop does all the work
	},
	handleDrop: function(nodeDroppedOntoMe) {
		if (!(nodeDroppedOntoMe instanceof lively.ide.ChangeNode))
			return false;
		this.target.addSubElement(nodeDroppedOntoMe.target);
		return true;
	},

});

// ===========================================================================
// Browsing ChangeSets
// ===========================================================================
ide.ChangeNode.subclass('lively.ide.ChangeSetNode', {

    childNodes: function() {
		return this.target.subElements().collect(function(ea) { return ea.asNode(this.browser)}, this);
	},
    
    sourceString: function($super) {
		return '';
    },
    
    asString: function() {
		return this.target.name;
	},

});

ide.ChangeNode.subclass('lively.ide.ChangeSetClassNode', {

	isClassNode: true,
	
	childNodes: function() {
		return this.target.subElements().collect(function(ea) { return ea.asNode(this.browser)}, this);
	}, 
	
	asString: function($super) {
		return $super() + ' [class]';
	},
});

ide.ChangeNode.subclass('lively.ide.ChangeSetClassElemNode', {

	handleDrop: function(nodeDroppedOntoMe) {
		if (!(nodeDroppedOntoMe instanceof lively.ide.ChangeSetClassElemNode))
			return false;
		this.target.parent().addSubElement(nodeDroppedOntoMe.target, this.target);
		return true;
	},

	asString: function() {
		return this.target.getName() + (this.target.isStaticChange ? ' [static]' : ' [proto]');
	},

});

ide.ChangeNode.subclass('lively.ide.ChangeSetDoitNode', {
	
	sourceString: function() {
		return this.target.getDefinition();
	},

	saveSource: function(newSource) {
		this.target.setDefinition(newSource);
		this.savedSource = this.target.getDefinition();
        return true;
    },

	menuSpec: function($super) {
		var spec = $super();
		var n = this;
		var t = n.target;
		spec.unshift(['set name', function() {
			WorldMorph.current().prompt(
				'Set doit name',
				function(input) { t.setName(input);	n.signalChange(); },
				t.getName())
 			}]);
		return spec;
	},

	asString: function($super) {
		return $super() + ' [doit]';
	},
	
	evalSource: function($super, source) {
		var result = $super(source);
		// FIXME move elsewhere....!!!! own subclass?
		if (result && this.target.isWorldRequirementsList) {
			var list = this.target.evaluate();
			if (!Object.isArray(list)) return result;
			list.forEach(function(moduleName) {
				module(moduleName).load();
				console.log('loading ' + moduleName);
			})
		}
		return result;
	},
	
});
ide.ChangeSetNode.subclass('lively.ide.RemoteChangeSetNode', {

	initialize: function($super, target, browser, parent, worldProxy) {
		// target will become a ChangeSet when world is loaded but can now be undefined
        $super(target, browser, parent);
        this.worldProxy = worldProxy;
    },
childNodes: function($super) {
		if (!this.target)
			this.worldProxyFetchChangeSet();
		return $super();
	},


    sourceString: function($super) {
		if (!this.target)
			this.worldProxyFetchChangeSet();
		return $super();
    },
    
    asString: function() {
		return this.worldProxy.localName() + (this.target == null ? ' (not loaded)' :  '');
	},
buttonSpecs: function() { return [] },

menuSpec: function($super) {
		var spec = [];
		var node = this;
		spec.push(['push changes back', function() {
			node.pushChangesBack();
		}]);
		return $super().concat(spec);
	},


	worldProxyFetchChangeSet: function() {
		this.target = this.worldProxy.getChangeSet();
		this.signalChange();
	},
pushChangesBack: function() {
	this.worldProxy.writeChangeSet(this.target);
},

});

/* Double dispatch Change classes to browser nodes */
ChangeSet.addMethods({
	asNode: function(browser, parent) { return new lively.ide.ChangeSetNode(this, browser, parent) }
});
ClassChange.addMethods({
	asNode: function(browser, parent) { return new ide.ChangeSetClassNode(this, browser, parent) }
});
ProtoChange.addMethods({
	asNode: function(browser, parent) { return new ide.ChangeSetClassElemNode(this, browser, parent) }
});
StaticChange.addMethods({
	asNode: function(browser, parent) { return new ide.ChangeSetClassElemNode(this, browser, parent) }
});
DoitChange.addMethods({
	asNode: function(browser, parent) { return new ide.ChangeSetDoitNode(this, browser, parent) }
});


ide.BrowserCommand.subclass('lively.ide.AllModulesLoadCommand', {

	isActive: Functions.True,

	wantsButton: Functions.True,

	asString: function() { return 'Load all' },

	trigger: function() { 
		var srcCtrl = tools.SourceControl;
		var browser = this.browser;
		var progressBar = WorldMorph.current().addProgressBar();
		var files = srcCtrl.interestingLKFileNames(browser.getTargetURL());
		files.forEachShowingProgress(
			progressBar,
			function(ea) { srcCtrl.addModule(ea) },
			Functions.K, // label func
			function() { progressBar.remove(); browser.allChanged() }); 
	},
});

ide.BrowserCommand.subclass('lively.ide.ShowLineNumbersCommand', {
	
	isActive: Functions.True,

	wantsButton: Functions.True,

	asString: function() { return 'LineNo' },

	trigger: function() {
		this.browser.showLines = !this.browser.showLines;
		this.browser.allChanged();
	}

});

ide.BrowserCommand.subclass('lively.ide.RefreshCommand', {

	isActive: Functions.True,

	wantsButton: Functions.True,

	asString: function() { return 'Refresh' },

	trigger: function() {
		this.browser.allChanged();
	}

});

ide.BrowserCommand.subclass('lively.ide.EvaluateCommand', {

	isActive: Functions.True,

	wantsButton: Functions.True,

	asString: function() {
		if (this.browser.evaluate) return 'Eval on';
		return 'Eval off'
	},

	trigger: function() {
		this.browser.evaluate = !this.browser.evaluate;
	}

});
ide.BrowserCommand.subclass('lively.ide.ChangesGotoChangeSetCommand', {

	isActive: Functions.True,

	wantsButton: function() {
		return false;//true;
	},

	asString: function() {
		if (this.browser.changesGotoChangeSet) return 'To ChangeSet';
		return 'To files'
	},

	trigger: function() {
		this.browser.changesGotoChangeSet = !this.browser.changesGotoChangeSet;
	}

});

ide.BrowserCommand.subclass('lively.ide.SortCommand', {

	filter: new lively.ide.SortFilter(),

	isActive: Functions.True,

	wantsButton: Functions.True,

	asString: function() {
		if (this.browserIsSorting()) return 'Unsort';
		return 'Sort'
	},

	trigger: function() {
		var filter = this.filter;
		var b = this.browser;
		var isSorting = this.browserIsSorting()
		b.filterPlaces.forEach(function(ea) {
			isSorting ?
				b.uninstallFilters(function(f) { return f === filter }, ea) :
				b.installFilter(filter, ea);
		});
		b.allChanged();
	},

	browserIsSorting: function() {
		return this.browser.getPane1Filters().include(this.filter);
	},

});

lively.ide.BrowserCommand.subclass('lively.ide.AddNewFileCommand', {

	isActive: Functions.True,

	wantsButton: Functions.True,

	asString: function() { return 'Add module' },

	trigger: function() {
		var world = WorldMorph.current();
		var browser = this.browser;
		var createFileIfAbsent = function(filename) {
			if (!filename.endsWith('.js')) filename += '.js';
			var dir = new FileDirectory(browser.getTargetURL());
			if (dir.fileOrDirectoryExists(filename)) {
				world.notify('File ' + filename + ' already exists!');
			} else {
				var fnWithoutJs = filename.substring(0, filename.indexOf('.'));
				var moduleBase = browser.getTargetURL().withRelativePartsResolved().relativePathFrom(URL.codeBase);
				var moduleName = moduleBase.toString().replace(/\//g, '.') + fnWithoutJs;
				dir.writeFileNamed(
					filename,
					Strings.format('module(\'%s\').requires().toRun(function() {\n\n// Enter your code here\n\n}) // end of module',
						moduleName));
				browser.rootNode().locationChanged();
				browser.allChanged();
				browser.inPaneSelectNodeNamed('Pane1', filename);
			}
		};
		world.prompt('Enter filename (something like foo or foo.js)', createFileIfAbsent);
	},

	
});

lively.ide.BrowserCommand.subclass('lively.ide.BrowseWorldCommand', {

	isActive: Functions.True,

	wantsButton: Functions.True,

	asString: function() { return 'Browse world...' },

	trigger: function() {
		var w = WorldMorph.current();
		w.prompt('Enter URL for World', function(url) {
			require('lively.LKWiki').toRun(function() {
				url = new URL(url);
				var proxy = new WikiWorldProxy(url, url.getDirectory());
				new lively.ide.LocalCodeBrowser(proxy).open();				
			})
		});
	},

});

lively.ide.BrowserCommand.subclass('lively.ide.ViewSourceCommand', {

	isActive: function() { return this.browser.selectedNode() && this.browser.selectedNode().isMemberNode },

	wantsButton: Functions.True,

	asString: function() { return 'View as...' },

	trigger: function() {
	var browser = this.browser;
	var world = WorldMorph.current();
	var spec = [
		{caption: 'default', value: undefined},
		{caption: 'javascript', value: 'javascript'},
		{caption: 'smalltalk', value: 'smalltalk'}];
	var items = spec.collect(function(ea) {
	  return [ea.caption,function(evt) {
				browser.viewAs = ea.value;
				browser.selectedNode().signalTextChange() }]
	});
	var menu = new MenuMorph(items);
	menu.openIn(world,world.firstHand().getPosition());
},

});
lively.ide.BrowserCommand.subclass('lively.ide.SaveChangesCommand', {

	wantsButton: Functions.True,

	isActive: Functions.True,

	asString: function() {
		return 'Push changes back';
	},

	trigger: function() {
		var b = this.browser;
		var w = WorldMorph.current()
		if (!(b instanceof lively.ide.LocalCodeBrowser)) {
			console.log('Save changes not yet implemented for ' + b);
			return;
		}	
		if (!b.worldProxy) {
			w.setStatusMessage('Browser has no WorldProxy -- cannot save!', Color.red, 5);
			return;
		}
		b.worldProxy.writeChangeSet(b.changeSet);
		w.setStatusMessage('Successfully stored world', Color.green);
	},

});
ide.BrowserCommand.subclass('lively.ide.ChangeSetMenuCommand', {

	wantsMenu: Functions.True,

	isActive: function(pane) {
		return this.browser.selectionInPane('Pane1') instanceof lively.ide.ChangeSetNode && pane == 'Pane2' ||
			this.browser instanceof lively.ide.LocalCodeBrowser && pane == 'Pane1';
	},


	trigger: function() {
		var cmd = this;
		return [['add class', cmd.addClass.bind(this)], ['add doit', cmd.addDoit.bind(this)]];
	},
getChangeSet: function() {
	if (this.browser.selectionInPane('Pane1') instanceof lively.ide.ChangeSetNode)
		return this.browser.selectionInPane('Pane1').target;
	if (this.browser instanceof lively.ide.LocalCodeBrowser)
		return this.browser.changeSet;
	throw new Error('Do not know which ChangeSet to choose for command');
},

addClass: function() {
	var b = this.browser;
	var w = WorldMorph.current();
	var cs = this.getChangeSet();

	var createChange = function(className, superClassName) {
		try {
			var change = ClassChange.create(className, superClassName);
			cs.addSubElement(change);
			if (b.evaluate) change.evaluate();
			b.allChanged();
		} catch(e) {
			if (change) change.remove();
			w.alert('Error when creating class:\n' + e);
		}
	}

	w.prompt('Enter class name', function(n1) {
		w.prompt('Enter super class name', function(n2) {
			createChange(n1, n2);
		}, 'Object')			
	});
},
addDoit: function() {
	var b = this.browser;
	var node = this;

	var createChange = function() {
		try {
			var change = DoitChange.create('// empty doit');
			node.getChangeSet().addSubElement(change);
			if (b.evaluate) change.evaluate();
			b.allChanged();
		} catch(e) {
			if (change) change.remove();
			w.alert('Error when creating foit:\n' + e);
		}
	}
	createChange();
},


});
lively.ide.BrowserCommand.subclass('lively.ide.ClassChangeMenuCommand', {

	wantsMenu: Functions.True,

	isActive: function(pane) {
		var sel = this.browser.selectedNode();
		var paneOfSel = this.browser.paneNameOfNode(sel);
		var paneNoOfSel = Number(paneOfSel.substring('Pane'.length));
		var nextPane = 'Pane' + (paneNoOfSel+1);
		return  sel instanceof lively.ide.ChangeSetClassNode && pane == nextPane ||
			sel instanceof lively.ide.ChangeSetClassElemNode && pane == paneOfSel;
	},


	trigger: function() {
		var cmd = this;
		return [['add method', cmd.addMethod.bind(this)]];
	},
addMethod: function() {
	var b = this.browser;
	var w = WorldMorph.current();
	 classChange = b.selectedNode().target instanceof ClassChange ?
			b.selectedNode().target : b.selectedNode().target.parent();

	var createChange = function(methodName) {
		var change = ProtoChange.create(methodName, 'function() {}');
		classChange.addSubElement(change);
		if (b.evaluate)
			change.evaluate();
		b.allChanged();
	}

	w.prompt('Enter method name', function(n1) {
		createChange(n1);
	});
},

});


// ===========================================================================
// Another File Parser - uses mostly OMeta for parsing LK sources
// ===========================================================================
Object.subclass('CodeParser', {

	documentation: 'Extended FileParser. Scans source code and extracts SourceCodeDescriptors for ' +
                   'classes, objects, functions, methods. Uses OMeta.',

	ometaRules: [],

	grammarFile: 'LKFileParser.txt',

	initialize: function(forceNewCompile) {
		var prototype = forceNewCompile || !Global['LKFileParser'] ?
			OMetaSupport.fromFile(this.grammarFile) :
			LKFileParser;
		this.ometaParser = Object.delegated(prototype, {_owner: this});
    },

	giveHint: Functions.Null,

	/* parsing */
    prepareParsing: function(src, config) {
        this.src = src;
        this.lines = src.split(/[\n\r]/);
        this.changeList = [];
        
        this.ptr = (config && config.ptr) || 0;
        this.fileName = (config && config.fileName) || null;
    },

	callOMeta: function(rule, src) {
        if (!this.ometaParser) throw dbgOn(new Error('No OMeta parser for parsing file sources!'));
        var errorDescr;
        var errorHandler;
        errorHandler = function(src, rule, grammarInstance, errorIndex) {
         var restLength = src.length - this.ptr
         errorDescr = new ide.ParseErrorFileFragment(src, null, 'errorDef', 0, restLength-1);
         if (this.debugMode)
             OMetaSupport.handleErrorDebug(src, rule, grammarInstance, errorIndex);
        }.bind(this);
        var result = OMetaSupport.matchAllWithGrammar(this.ometaParser, rule, src || this.src, errorHandler);
		return result ? result : errorDescr;
    },

	parseWithOMeta: function(hint) {
        var partToParse = this.src.substring(this.ptr, this.src.length);
        var descr;
        if (hint) descr = this.callOMeta(hint, partToParse);

        if (!descr || descr.isError)
            this.ometaRules
				.without(hint)
				.detect(function(rule) {
					descr = this.callOMeta(rule, partToParse);
					return descr && !descr.isError
				}, this);
        
        if (descr === undefined)
            throw dbgOn(new Error('Could not parse src at ' + this.ptr));
        if (descr.stopIndex === undefined)
            throw dbgOn(new Error('Parse result has an error ' + JSON.serialize(descr) + 'ptr:' + this.ptr));
            
        var tmpPtr = this.ptr;
        this.ptr += descr.stopIndex + 1;
        this.fixIndicesAndMore(descr, tmpPtr);
        return descr;
    },

	parseSource: function(src, optConfig /* FIXME */) {
		if (!src) return [];
		// this is the main parse loop
        var msParseStart;
        var msStart = new Date().getTime();
        this.overheadTime = 0;
        
        this.prepareParsing(src, optConfig);
        var descr;
        
        while (this.ptr < this.src.length) {
            if (this.debugMode) msParseStart = new Date().getTime();
            
            this.currentLine = this.lines[this.currentLineNo()-1];
            var tmpPtr = this.ptr;
 
			descr = this.parseNextPart();
            dbgOn(!descr);
            
            if (this.ptr <= tmpPtr)
				this.couldNotGoForward(descr);

            if (this.debugMode) {
                var msNow = new Date().getTime();
                var duration = msNow-msParseStart;
                console.log(Strings.format('Parsed line %s to %s (%s:%s) after %ss (%sms)%s',
                    this.findLineNo(this.lines, descr.startIndex),
                    this.findLineNo(this.lines, descr.stopIndex),
                    descr.type, descr.name,
                    (msNow-msStart)/1000, duration, (duration > 100 ? '!!!!!!!!!!' : '')));
            }
            descr = null;
        }
        
        if (this.specialDescr && this.specialDescr.length > 0 &&  (!this.specialDescr.last().subElements().last().isError || !this.changeList.last().isError))
            console.warn('Couldn\'t find end of ' + this.specialDescr.last().type);
            //throw dbgOn(new Error('Couldn\'t find end of ' + specialDescr.last().type));
        
        console.log('Finished parsing in ' + (new Date().getTime()-msStart)/1000 + ' s');
        // console.log('Overhead:................................' + this.overheadTime/1000 + 's');
 
        return this.changeList;
    },
parseNonFile: function(source) {
	var result = this.parseSource(source).first();
	this.doForAllDescriptors(result, function(d) { d._fallbackSrc = source });
	return result;
},


	couldNotGoForward: function(descr, specialDescr) {
		//dbgOn(true);
		console.warn('Could not go forward before line ' + this.findLineNo(this.lines, this.ptr));
		var errorDescr = new ide.ParseErrorFileFragment(this.src, null, 'errorDef', this.ptr, this.src.length-1, this.fileName);
		var lastAdded = this.changeList.last();
		var responsible = lastAdded.flattened().detect(function(ea) { return ea.subElements(1) && ea.subElements(1).include(descr) });
		if (responsible) {
		  responsible._subElements.pop();
		  responsible._subElements.push(errorDescr);
		} else if (lastAdded === descr) {
		  responsible = this.changeList;
		  responsible.pop();
		  responsible.push(errorDescr);
		} else {
		  throw new Error('Couldn\'t find last added descriptor');
		}
		this.ptr = errorDescr.stopIndex + 1;
	},

	/* line finders */
	currentLineNo: function() {
        return this.findLineNo(this.lines, this.ptr);
    },
    
    findLineNo: function(lines, ptr) {
         // var ms = new Date().getTime();
        // what a mess, i want ordinary non local returns!
        ptr += 1;
        try {
        lines.inject(0, function(charsUntilNow, line, i) {
            charsUntilNow += line.length + 1;
            if (ptr <= charsUntilNow) throw {_theLineNo: i+1};
            return charsUntilNow;
        });
        } catch(e) {
            // this.overheadTime += new Date().getTime() - ms;
            
            if (e._theLineNo !== undefined) return e._theLineNo;
            throw e
        }
        
        // this.overheadTime += new Date().getTime() - ms;
        
        return null
    },
    
    ptrOfLine: function(lines, lineNo) {
        lineNo = lineNo - 1; // zero index
        var ptr = 0;
        try {
            lines.inject(0, function(charsUntilNow, line, i) {
            if (lineNo === i) throw {_ptr: charsUntilNow};
            charsUntilNow += line.length + 1;            
            return charsUntilNow;
        });
        } catch(e) {
            if (e._ptr !== undefined) return e._ptr;
            throw e
        }
        return null
    },

	/* descriptor modification */
	doForAllDescriptors: function(descr, action) {
        action.call(this, descr);
        if (!descr.subElements()) return;
        descr.subElements().forEach(function(ea) { this.doForAllDescriptors(ea, action) }, this);
    },
    
    fixIndicesAndMore: function(descr, startPos) {
        // var ms = new Date().getTime();
        // ----------
        this.doForAllDescriptors(descr, function(d) {
            d.startIndex += startPos;
            d.stopIndex += startPos;
            d.fileName = this.fileName;
        });
        // ----------------
        // this.overheadTime += new Date().getTime() - ms;
    },

	 /* loading */
    sourceFromUrl: function(url) {
        if (!tools.SourceControl) tools.SourceControl = new SourceDatabase();
        return tools.SourceControl.getCachedText(url.filename());        
    },
    
    //FIXME cleanup
    parseFileFromUrl: function(url) {
        var src = this.sourceFromUrl(url);
        var result = this.parseSource(src);
        
        var flattened = [];
        result.forEach(function(ea) {
            this.doForAllDescriptors(ea, function(d) { flattened.push(d) });
        }, this);
        
        flattened.forEach(function(ea) {
            ea.fileName = url.filename();
        });
        
        return flattened;
    },

});

CodeParser.subclass('JsParser', {
    
    debugMode: false,

    ometaRules: [/*'blankLine',*/ 'comment',
               'klassDef', 'objectDef', 'klassExtensionDef', 'propertyDef',
               'functionDef', 'unknown'],
    
    parseClass: function() {
        return this.callOMeta("klassDef");
    },
    
    parseModuleBegin: function() {
        var match = this.currentLine.match(/^\s*module\([\'\"](.*)[\'\"]\)\.requires\(.*toRun\(.*$/);
        if (!match) return null;
		if (this.debugMode)
			console.log('Found module start in line ' +  this.currentLineNo());
        var descr = new ide.FileFragment(match[1], 'moduleDef', this.ptr, null, this.fileName);
        this.ptr += match[0].length + 1;
        return descr;
    },
    
    parseUsingBegin: function() {
        var match = this.currentLine.match(/^\s*using\((.*)\)\.run\(.*$/);
        if (!match) return null;
		if (this.debugMode)
			console.log('Found using start in line ' +  this.currentLineNo());
        var descr = new ide.FileFragment(match[1], 'usingDef', this.ptr, null, this.fileName);
        this.ptr += match[0].length + 1;
        return descr;
    },
    
    parseModuleOrUsingEnd: function(specialDescr) {
        if (!specialDescr) return null;
        var match = this.currentLine.match(/^\s*\}.*?\)[\;]?.*$/);
        if (!match) return null;
		if (this.debugMode) {
			if (specialDescr.type === 'moduleDef')
				console.log('Found module end in line ' +  this.currentLineNo());
			if (specialDescr.type === 'usingDef')
				console.log('Found using end in line ' +  this.currentLineNo());
		}
        specialDescr.stopIndex = this.ptr + match[0].length - 1;
        this.ptr = specialDescr.stopIndex + 1;
        // FIXME hack
        if (this.src[this.ptr] == '\n') {
            specialDescr.stopIndex += 1;
            this.ptr += 1;
        }
        return specialDescr;
    },

    giveHint: function() {
        if (/^[\s]*([\w\.]+)\.subclass\([\'\"]([\w\.]+)[\'\"]/.test(this.currentLine))
            return 'klassDef';
        // if (/^[\s]*([\w]+)\:[\s]+function/.test(this.currentLine))
        //     return 'protoDef';
        // if (/^[\s]*([\w]+)\:/.test(this.currentLine))
        //     return 'protoDef';
        // if (/^[\s]*function[\s]+([\w]+)[\s]*\(.*\)[\s]*\{.*/.test(this.currentLine)
        //         || /^[\s]*var[\s]+([\w]+)[\s]*\=[\s]*function\(.*\)[\s]*\{.*/.test(this.currentLine))
        //             return 'functionDef';
        if (/^[\s]*Object\.extend.*$/.test(this.currentLine) || /^.*\.addMethods\(.*$/.test(this.currentLine))
                return 'klassExtensionDef';
        // if (/^[\s]*\(function.*/.test(this.currentLine))
        //         return 'funcitonDef';
        return null;
    },

	parseNextPart: function() {
		var descr;
		if (!this.specialDescriptors) this.specialDescriptors = [];
		
		if (descr = this.parseUsingBegin() || this.parseModuleBegin()) { // FIXME nested module/using
			if (this.specialDescriptors.length > 0) this.specialDescriptors.last().subElements().push(descr);
			else this.changeList.push(descr);
			this.specialDescriptors.push(descr)
			return descr;
		};

		if (descr = this.parseModuleOrUsingEnd(this.specialDescriptors.last())) {
		    this.specialDescriptors.pop();
			return descr;
		};

		if (descr = this.parseWithOMeta(this.giveHint())) {
			if (this.specialDescriptors.length > 0) this.specialDescriptors.last().subElements().push(descr);
			else this.changeList.push(descr);
			return descr;
		}
		
		throw new Error('Could not parse ' + this.currentLine + ' ...');
	}
	
});
 
Object.extend(JsParser, {

    parseAndShowFileFromURL: function(url) {
        var chgList = new JsParser().parseFileFromUrl(new URL(url));
        new ChangeList(fileName, null, chgList).openIn(WorldMorph.current()); 
    }
    
});

CodeParser.subclass('OMetaParser', {

	debugMode: true,

	ometaRules: ['ometaDef', 'unknown'],

	parseNextPart: function() {
		var descr = this.parseWithOMeta(this.giveHint());
		if (descr)
			return this.changeList.push(descr);
		throw new Error('Could not parse ' + this.currentLine + ' ...');
	}
	
	
});

Object.subclass('lively.ide.ModuleWrapper', {

	documentation: 'Compatibility layer around normal modules for SourceCodeDatabase and other tools. Will probably merged with normal modules in the future.',
	
	initialize: function(moduleName, type) {
		if (!moduleName || !type)
			throw new Error('Cannot create ModuleWrapper without moduleName or type!');
		if (!['js', 'ometa', 'lkml', 'st'].include(type))
			throw new Error('Unknown type ' + type + ' for ModuleWrapper ' + moduleName);
		this._moduleName = moduleName;
		this._type = type; // can be js, ometa, lkml, st
		this._ast = null;
		this._cachedSource = null;
	},
	
	type: function() { return this._type },
	
	ast: function() { return this._ast },
	
	moduleName: function() { return this._moduleName },
	
	fileURL: function() {
		return URL.codeBase.withFilename(this.fileName());
	},
	
	fileName: function() {
		return this.moduleName().replace(/\./g, '/') + '.' + this.type();
	},
	
	getSourceUncached: function() {
		this._cachedSource = new WebResource(this.fileURL()).getContent() || '';
		return this._cachedSource;
	},
	
	setCachedSource: function(source) { this._cachedSource = source },
	
	getSource: function() {
		return this._cachedSource ? this._cachedSource : this.getSourceUncached();
	},
	
	setSource: function(source, beSync) {
		this.setCachedSource(source);
		new WebResource(this.fileURL()).setContent(source);
	},
	
	retrieveSourceAndParse: function(optSourceDB) {
		return this._ast = this.parse(this.getSource(), optSourceDB);
	},
	
	parse: function(source, optSourceDB) {
		if (source === undefined)
			throw dbgOn(new Error('ModuleWrapper ' + this.moduleName() + ' needs source to parse!'));
		var root;
		if (this.type() == 'js') {
			root = this.parseJs(source);
		} else if (this.type() == 'ometa') {
			root = this.parseOmeta(source);
		} else if (this.type() == 'lkml') {
			root = this.parseLkml(source);
		} else if (this.type() == 'st') {
			root = this.parseSt(source);
		} else { 
			throw dbgOn(new Error('Don\'t know how to parse ' + this.type + ' of ' + this.moduleName()))
		}
		root.flattened().forEach(function(ea) { ea.sourceControl = optSourceDB })
		return root;
	},

	parseJs: function(source) {
		var fileFragments = new JsParser().parseSource(source, {fileName: this.fileName()});
        var root;
        var firstRealFragment = fileFragments.detect(function(ea) { return ea.type !== 'comment' });
        if (firstRealFragment && firstRealFragment.type === 'moduleDef')
            root = firstRealFragment;
        else
            root = new lively.ide.FileFragment(
				this.fileName(), 'completeFileDef', 0, source ? source.length-1 : 0,
				this.fileName(), fileFragments, this);
        return root;
	},

	parseOmeta: function(source) {
		var fileFragments = new OMetaParser().parseSource(source, {fileName: this.fileName()});
		var root = new lively.ide.FileFragment(
			this.fileName(), 'ometaGrammar', 0, source.length-1, this.fileName(), fileFragments, this);
		return root;
	},

	parseLkml: function(source) {
		return ChangeSet.fromFile(this.fileName(), source);
	},
	
	parseSt: function(source) {
		if (!Global['SmalltalkParser']) return null;
		var ast = OMetaSupport.matchAllWithGrammar(SmalltalkParser, "smalltalkClasses", source, true);
		if (!ast) {
		  console.warn('Couldn\'t parse ' + this.fileName());
		  return null;
		}
		ast.setFileName(this.fileName());
		return ast;
	},
	
	remove: function() {
		new WebResource(this.fileURL()).del();
	},
	
});

Object.extend(lively.ide.ModuleWrapper, {
	
	forFile: function(fn) {
		var type = fn.substring(fn.lastIndexOf('.') + 1, fn.length);
		var moduleName = fn;
		moduleName = moduleName.substring(0, moduleName.lastIndexOf('.'));
		moduleName = moduleName.replace(/\//g, '.');
		return new lively.ide.ModuleWrapper(moduleName, type);
	},
	
});
// ===========================================================================
// Keeps track of parsed sources
// ===========================================================================
SourceDatabase.subclass('AnotherSourceDatabase', {
    
	initialize: function($super) {
		this.editHistory = {};
		this.modules = {};
		this.registeredBrowsers = [];
	},

	ensureRealModuleName: function(moduleName) { // for migration to new module names
		if (moduleName.endsWith('.js'))
			throw dbgOn(new Error('Old module name usage: ' + moduleName));
	},

	rootFragmentForModule: function(fileName) {
		if (!Object.isString(fileName))
			throw dbgOn(new Error('Don\'t know what to do with ' + fileName));
		var moduleWrapper = this.findModuleWrapperForFileName(fileName);
		var root = moduleWrapper && moduleWrapper.ast();
		// if (!root)
		// 	throw dbgOn(new Error('Cannot find parsed source for ' + fileName));
		return root;
	},

	allModules: function() { return Object.values(this.modules) },
	
	findModuleWrapperForFileName: function(fileName) {
		return this.allModules().detect(function(ea) { return ea.fileName() == fileName })
	},
	
	createModuleWrapperForFileName: function(fileName) {
		return lively.ide.ModuleWrapper.forFile(fileName);
	},
	
	addModule: function(fileName, source) {
		var moduleWrapper = this.findModuleWrapperForFileName(fileName);
		if (moduleWrapper) return moduleWrapper;
		var moduleWrapper = this.createModuleWrapperForFileName(fileName);
		if (source) moduleWrapper.setCachedSource(source);
		moduleWrapper.retrieveSourceAndParse(this);
		return this.modules[fileName] = moduleWrapper;
	},

	reparseModule: function(fileName, readAgain) {
		if (readAgain)
			delete this.modules[fileName];
		var moduleWrapper = this.findModuleWrapperForFileName(fileName)
		if (moduleWrapper) {
			moduleWrapper.retrieveSourceAndParse(this);
			return moduleWrapper;
		}
		return this.addModule(fileName);
	},

	parseCompleteFile: function(fileName, newFileString) {
		var moduleWrapper = this.findModuleWrapperForFileName(fileName)
		if (!moduleWrapper)
			throw dbgOn(new Error('Cannot parse for ' + fileName + ' because module is not in SourceControl'));
		var root = newFileString ? moduleWrapper.parse(newFileString, this) : moduleWrapper.retrieveSourceAndParse(this);
		return root;
	},
	
	putSourceCodeFor: function(fileFragment, newFileString) {
		this.putSourceCodeForFile(fileFragment.fileName, newFileString);
	},

	putSourceCodeForFile: function(fileName, content) {
		if (!fileName)
			throw dbgOn(new Error('No filename when tryinh to put source'));
		var moduleWrapper = this.findModuleWrapperForFileName(fileName) || this.createModuleWrapperForFileName(fileName);
		content = content.replace(/\r/gi, '\n');  // change all CRs to LFs
		console.log("Saving " + fileName + "...");
		moduleWrapper.setSource(content);
		console.log("... " + content.length + " bytes saved.");
	},
    
    getCachedText: function(fileName) { // Return full text of the named file
		var moduleWrapper = this.findModuleWrapperForFileName(fileName);
		if (!moduleWrapper)
			// throw dbgOn(new Error('Cannot retrieve source code for ' + fileName + ' because module is not in SourceControl'));
			return '';
		return moduleWrapper.getSource();
    },

	searchFor: function(str) {
		// search modules
		var roots = Object.values(lively.Tools.SourceControl.modules).collect(function(ea) { return ea.ast() });
		var allFragments = roots.inject([], function(all, ea) { return all.concat(ea.flattened().uniq()) });

		// search local code	
		allFragments = allFragments.concat(ChangeSet.current().flattened());

		return allFragments.select(function(ea) {
			return ea.getSourceCodeWithoutSubElements().include(str)
		});

	},

	scanLKFiles: function($super, beSync) {
		var ms = new Date().getTime();
		this.interestingLKFileNames(URL.codeBase.withFilename('lively/')).each(function(fileName) {
			this.addModule(fileName, fileString);
		}, this);
		console.log('Altogether: ' + (new Date().getTime()-ms)/1000 + ' s');
	},
    
	allFiles: function() {
		if (!this._allFiles)
			this._allFiles = this.interestingLKFileNames(this.codeBaseURL).uniq();
		return this._allFiles;
	},

	// browser stuff
	registerBrowser: function(browser) {
		if (this.registeredBrowsers.include(browser)) return;
		this.registeredBrowsers.push(browser);
	},
	
	unregisterBrowser: function(browser) {
		this.registeredBrowsers = this.registeredBrowsers.without(browser);
	},
	
	updateBrowsers: function(changedBrowser, changedNode) {
		var msStart = new Date().getTime();
		this.registeredBrowsers.without(changedBrowser).forEach(function(ea) { ea.allChanged(true, changedNode) });
		console.log('updated ' + this.registeredBrowsers.length + ' browsers in ' + (new Date().getTime()-msStart)/1000 + 's')
	},
	
	update: function() {
		this._allFiles = null;
	},
	
	addFile: function(filename) {
		this._allFiles.push(filename);
	},
	
	removeFile: function(fileName) {
		var moduleWrapper = this.findModuleWrapperForFileName(fileName);
		if (!moduleWrapper) {
			console.log('Trying to remove ' + fileName + ' bot no module found?');
			return;
		}
		moduleWrapper.remove();
	},

	switchCodeBase: function(newCodeBaseURL) {
		this.codeBaseURL = new URL(newCodeBaseURL.withRelativePartsResolved());
		this._allFiles = new WebResource(newCodeBaseURL).getSubElements().subDocuments.collect(function(ea) { return ea.getName() });
	},
	
	prepareForMockModule: function(fileName, src) { // This is just used for testing!!!
		this.modules[fileName] = lively.ide.ModuleWrapper.forFile(fileName);
		this.modules[fileName].setCachedSource(src);
		this.putSourceCodeFor = function(fileFragment, newFileString) {
			this.modules[fileName].setCachedSource(newFileString)
		}.bind(this);
		var root = this.reparseModule(fileName).ast();
		root.flattened().forEach(function(ea) { ea.sourceControl = this }, this);
		return root
	}
});
 
// see also lively.Tools.startSourceControl
ide.startSourceControl = function() {
    if (tools.SourceControl instanceof AnotherSourceDatabase)
		return tools.SourceControl;
    tools.SourceControl = new AnotherSourceDatabase();
	return tools.SourceControl;
};

// ===========================================================================
// FileFragments, another SourceCodeDescriptor
// ===========================================================================
Object.subclass('lively.ide.FileFragment', {

	initialize: function(name, type, startIndex, stopIndex, fileName, subElems, srcCtrl) {
		this.name = name;
		this.type = type;
		this.startIndex = startIndex;
		this.stopIndex = stopIndex;
		this.fileName = fileName;
		this._subElements = subElems || [];
		this.sourceControl = srcCtrl;
	},
	eq: function(other) {
		if (this == other) return true;
		if (this.constructor != other.constructor) return false;
		return this.name == other.name &&
		this.startIndex == other.startIndex &&
		this.stopIndex == other.stopIndex &&
		this.type == other.type &&
		this.fileName == other.fileName &&
		this.getSourceCode() == other.getSourceCode();
	},

	subElements: function(depth) {
		if (!depth || depth === 1)
			return this._subElements; 
		return this._subElements.inject(this._subElements, function(all, ea) { return all.concat(ea.subElements(depth-1)) });
	},

	fragmentsOfOwnFile: function() {
		return this.getSourceControl().rootFragmentForModule(this.fileName)
			.flattened()
			.reject(function(ea) { return ea.eq(this) }, this);
	},

	findOwnerFragment: function() {
		if (!this.fileName) throw dbgOn(new Error('no fileName for fragment ' + this));
		var self = this;

		var moduleWrapper = this.getSourceControl().findModuleWrapperForFileName(this.fileName)
		if (!moduleWrapper)
			throw new Error('SourceControl doesn\'t have my module: ' + this.fileName)
			
		return moduleWrapper.ast().flattened().detect(function(ea) {
			return ea.subElements().any(function(subElem) { return self.eq(subElem) });
		});
	},

	flattened: function() {
		return this.subElements().inject([this], function(all, ea) { return all.concat(ea.flattened()) });
	},

	checkConsistency: function() {
		this.fragmentsOfOwnFile().forEach(function(ea) { // Just a quick check if fragments are ok...
			if (this.flattened().any(function(ea) {return ea.eq(this)}, this)) return;
			if ((this.startIndex < ea.startIndex && ea.startIndex < this.stopIndex)
				|| (this.startIndex < ea.stopIndex && ea.stopIndex < this.stopIndex))
			throw new Error('Malformed fragment: ' + ea.name + ' ' + ea.type);
		}, this);
	},

	getSourceCode: function() {
		return this.getFileString().substring(this.startIndex, this.stopIndex+1);
	},

	getSourceCodeWithoutSubElements: function() {
		var completeSrc = this.getSourceCode();
		return this.subElements().inject(completeSrc, function(src, ea) {
			var elemSrc = ea.getSourceCode();
			var start = src.indexOf(elemSrc);
			var end = elemSrc.length-1 + start;
			return src.substring(0,start) + src.substring(end+1);
		});
	},

	putSourceCode: function(newString) {
		if (!this.fileName) throw dbgOn(new Error('No filename for descriptor ' + this.name));

		var newMe = this.reparseAndCheck(newString);
		if (!newMe) return null;

		var newFileString = this.buildNewFileString(newString);
		this.getSourceControl().putSourceCodeFor(this, newFileString);

		this.updateIndices(newString, newMe);
		return newMe;
	},

	buildNewFileString: function(newString) {
		var fileString = this.getFileString();
		var beforeString = fileString.substring(0, this.startIndex);
		var afterString = fileString.substring(this.stopIndex+1);
		var newFileString = beforeString.concat(newString, afterString);
		return newFileString;
	},

	reparse: function(newSource) {
		var newFileString = this.buildNewFileString(newSource);
		newFileString = newFileString.slice(0,this.startIndex + newSource.length)

		if (this.type === 'moduleDef' || this.type === 'completeFileDef' || this.type === 'ometaGrammar')
			return this.sourceControl.parseCompleteFile(this.fileName, newFileString);

		// FIXME time to cleanup!!!
		var parser = (this.type === 'ometaDef' || this.type === 'ometaRuleDef') ?
		new OMetaParser() :
		new JsParser();

		parser.ptr = this.startIndex;
		parser.src = newFileString;
		parser.lines = newFileString.split(/[\n\r]/);
		parser.fileName = this.fileName;

		var newFragment = parser.parseWithOMeta(this.type);
		if (newFragment)
			newFragment.flattened().forEach(function(ea) { ea.sourceControl = this.sourceControl }, this);
		return newFragment;
	},

	reparseAndCheck: function(newString) {
		var newMe = this.reparse(newString);

		if (!newMe) dbgOn(true);

		if (newMe && this.startIndex !== newMe.startIndex)
			throw dbgOn(new Error("Inconsistency when reparsing fragment " + this.name + ' ' + this.type));
		if (newMe && (this.type == 'completeFileDef' || this.type == 'moduleDef')
		&& (newMe.type == 'completeFileDef' || newMe.type == 'moduleDef')) {
			this.type = newMe.type; // Exception to the not-change-type-rule -- better impl via subclassing
		}
		if (!newMe || newMe.type !== this.type) {
			newMe.flattened().forEach(function(ea) { ea.sourceControl = this.sourceControl }, this);
			var msg = Strings.format('Error occured during parsing.\n%s (%s) was parsed as %s. End line: %s.\nChanges are NOT saved.\nRemove the error and try again.',
			this.name, this.type, newMe.type, newMe.stopLine());
			console.warn(msg);
			WorldMorph.current().alert(msg);
			return null;
		}

		return newMe;
	},


	updateIndices: function(newSource, newMe) {
		this.checkConsistency();

		var prevStop = this.stopIndex;
		var newStop = newMe.stopIndex;
		var delta = newStop - prevStop;

		this.stopIndex = newStop;    // self

		// update fragments which follow after this or where this is a part of
		this.fragmentsOfOwnFile().each(function(ea) {
			if (ea.stopIndex < prevStop) return;
			ea.stopIndex += delta;
			if (ea.startIndex <= prevStop) return;
			ea.startIndex += delta;
		});

		this.name = newMe.name; // for renaming
		this._subElements = newMe.subElements();
	},

	getSourceControl: function() {
		var ctrl = this.sourceControl || tools.SourceControl;
		if (!ctrl) throw dbgOn(new Error('No sourcecontrol !! '));
		if (!(ctrl instanceof AnotherSourceDatabase)) throw dbgOn(new Error('Using old source control, could lead to errors...'));
		return ctrl;
	},

	sourceCodeWithout: function(childFrag) {
		if (!this.flattened().any(function(ea) {return ea.eq(childFrag)}))
			throw dbgOn(new Error('Fragment' + childFrag + ' isn\'t in my (' + this + ') subelements!'));
		var mySource = this.getSourceCode();
		var childSource = childFrag.getSourceCode();
		var start = childFrag.startIndex - this.startIndex;
		if (start === -1) throw dbgOn(new Error('Cannot find source of ' + childFrag));
		var end = start + childSource.length;
		var newSource = mySource.slice(0, start) + mySource.slice(end);
		return newSource;
	},

	remove: function() {
		var owner = this.findOwnerFragment();
		if (!owner) throw dbgOn(new Error('Cannot find owner of fragment ' + this));
		var newSource = owner.sourceCodeWithout(this);
		owner._subElements = owner.subElements().reject(function(ea) {return ea.eq(this)}, this)
		owner.putSourceCode(newSource);
	},
	
	moveTo: function(index) {
		console.log('Moving from ' + this.startIndex + ' to ' + index)
		var mySrc = this.getSourceCode();
		var myOwner = this.findOwnerFragment();
		step1 = myOwner.sourceCodeWithout(this);
		myOwner = myOwner.putSourceCode(step1);
		//-------
		if (index > this.startIndex)
			index -= mySrc.length;
		this.startIndex = index; this.stopIndex = index + mySrc.length - 1;
		//-------
		var target = myOwner.fragmentsOfOwnFile().detect(function(ea) {
			return ea.startIndex <= index && ea.stopIndex >= index });
		var targetSrc = target.getSourceCode();
		var local = index - target.startIndex;
		step2 = targetSrc.slice(0,local) + mySrc + targetSrc.slice(local, targetSrc.length);
		target.putSourceCode(step2);
		return this;
	},

	getFileString: function() {
		if (!this.fileName && this._fallbackSrc)
			return this._fallbackSrc;
		if (!this.fileName) throw dbgOn(new Error('No filename for descriptor ' + this.name));
		return  this.getSourceControl().getCachedText(this.fileName);
	},

	newChangeList: function() {
		throw dbgOn(new Error('Not yet!'));
	},

	startLine: function() {
		// FIXME!!!
		return JsParser.prototype.findLineNo(this.getFileString().split(/[\n\r]/), this.startIndex);
	},

	stopLine: function() {
		// FIXME!!!
		return JsParser.prototype.findLineNo(this.getFileString().split(/[\n\r]/), this.stopIndex);
	},
	
	isStatic: function() { // makes only sense for propertyDefs
		return this._isStatic; // FIXME
	},

	toString: function() {
		return Strings.format('%s: %s (%s-%s in %s, starting at line %s, %s subElements)',
		this.type, this.name, this.startIndex, this.stopIndex, this.fileName, this.startLine(), this.subElements().length);
	},

	inspect: function() {
		try { return this.toString() } catch (err) { return "#<inspect error: " + err + ">" }
	},
prevElement: function() {
	var siblingsAndMe = this.withSiblings();
	if (!siblingsAndMe) return null;
	var idx = siblingsAndMe.indexOf(this);
	return siblingsAndMe[idx - 1];
},
withSiblings: function() {
	var owner = this.findOwnerFragment();
	if (!owner) return null;
	return owner.subElements();
},
getComment: function() {
	var prev = this.prevElement();
	if (!prev || prev.type != 'comment') return null;
	var src = prev.getSourceCode();
	// if there multiple comments take the last one
	src = src.split(/\n[\n]+/).last();
	return src;
},




});

ide.FileFragment.addMethods({

	browseIt: function() {
		var browser = new ide.SystemBrowser();
		browser.openIn(WorldMorph.current());
		// FIXME ... subclassing
		if (this.type === 'klassDef') {
			browser.inPaneSelectNodeNamed('Pane1', this.fileName);
			browser.inPaneSelectNodeNamed('Pane2', this.name);
		} else if (this.type === 'propertyDef') {
			browser.inPaneSelectNodeNamed('Pane1', this.fileName);
			browser.inPaneSelectNodeNamed('Pane2', this.className);
			browser.inPaneSelectNodeNamed('Pane3', this.name);
		}
		return browser;
	},

	addSibling: function(newSrc) {
		if (!this.getSourceCode().endsWith('\n'))
			newSrc = '\n' + newSrc;
		if (!newSrc.endsWith('\n'))
			newSrc += '\n';
		var owner = this.findOwnerFragment();
		var ownerSrc = owner.getSourceCode();
		var stopIndexInOwner = this.stopIndex - owner.startIndex;
		var newOwnerSrc = ownerSrc.slice(0, stopIndexInOwner+1) + newSrc + ownerSrc.slice(stopIndexInOwner+1);
		var newOwner = owner.putSourceCode(newOwnerSrc);
		var sibling = newOwner.subElements().detect(function(ea) { return ea.startIndex == this.stopIndex+1 }, this);
		return sibling;
	},
});

ide.FileFragment.addMethods({

	getName: function() {
		return this.name;
	},

	asChange: function() {
		// FIXMEEEEE!!! subclassing! Unified hierarchy
		var change;
		console.log(Strings.format('Converting %s (%s) to change', this.type, this.getSourceCode()));
		if (this.type === 'klassDef') {
			change = ClassChange.create(this.getName(), this.superclassName);
			this.subElements().forEach(function(ea) { change.addSubElement(ea.asChange()) });
		} else if (this.type === 'propertyDef' && !this.isStatic()) {
			var src = this.getSourceCode().match(/[a-zA-Z0-9]+:\s+((\s|.)*)/)[1];
			if (src.endsWith(','))
				src = src.substr(0,src.length-1);
			change = ProtoChange.create(this.getName(), src, this.className);
		}
		if (change) return change;
		throw dbgOn(new Error(this.type + ' is not yet supported to be converted to a Change'));
	},

	saveAsChange: function(newSrc) { // similar to putSourceCode but creates change instead of modifying src
		var newMe = this.reparseAndCheck(newSrc);
		if (!newMe) return null;
		return newMe.asChange();
	},

});

ide.FileFragment.subclass('lively.ide.ParseErrorFileFragment', {

	isError: true,

	initialize: function($super, fileString, name, type, startI, stopI, fileName, subElems, srcCtrl) {
		$super(name, type, startI, stopI, fileName, subElems, srcCtrl);
		this.fileString = fileString;
    },

	getFileString: function() {
        return this.fileString
    },
});

});