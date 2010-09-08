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
 * Storage.js.  Storage system implementation.
 */

module('lively.Storage').requires().toRun(function(module) {


BoxMorph.subclass('PackageMorph', {
    documentation: "Visual representation for a serialized morph",
    style: { borderWidth: 3, borderColor: Color.black,
	     fill: new lively.paint.RadialGradient([new lively.paint.Stop(0, Color.primary.orange), 
						    new lively.paint.Stop(0.3, Color.primary.orange.lighter()),
						    new lively.paint.Stop(1, Color.primary.orange)]), 
	     borderRadius: 6
	   },
    openForDragAndDrop: false,
    suppressHandles: true,
    size: 40,
    
    initialize: function($super, targetMorph) {
	var size = this.size;
	$super(pt(size, size).extentAsRectangle());
        var exporter = new Exporter(targetMorph);
	var helpers = exporter.extendForSerialization();
	if (!this.defs)  
	    this.defs = this.rawNode.insertBefore(NodeFactory.create("defs"), this.rawNode.firstChild);
        this.serialized = this.defs.appendChild(targetMorph.rawNode.cloneNode(true));
	exporter.removeHelperNodes(helpers);
	this.helpText = "Packaged " + targetMorph.getType() + ".\nSelect unpackage from menu to deserialize contents.";
	var delta = this.getBorderWidth()/2;
	var lines = [ 
	    [pt(delta, size/2), pt(size - delta, size/2)],
	    [pt(size/2, delta), pt(size/2, size - delta)] 
	];
	lines.forEach(function(vertices) {
	    var m = new Morph(new lively.scene.Polyline(vertices));
	    m.applyStyle({borderWidth: 3, borderColor: Color.black});
	    m.ignoreEvents();
	    this.addMorph(m);
	}, this);
    },

    getHelpText: function() {
	return this.helpText;
    },
    
    openIn: function(world, loc) {
        world.addMorphAt(this, loc);
    },
    
	morphMenu: function($super, evt) { 
		var menu = $super(evt);
		menu.replaceItemNamed("package", ["unpackage", function(evt) { 
			this.unpackageAt(this.getPosition()); 
		}]);
		menu.replaceItemNamed("show Lively markup", ["show packaged Lively markup", function(evt) {
			this.world().addTextWindow({
				content: Exporter.stringify(this.serialized),
				title: "XML dump",
				position: this.world().positionForNewMorph(null, this)
			});
		}]);
		menu.replaceItemNamed("publish packaged ...", ["save packaged morph as ... ", function() { 
			var node = this.serialized;
			this.world().prompt("save packaged morph as (.xhtml)", function(filename) { 
				filename && Exporter.saveNodeToFile(node, filename) })
		}]);
		return menu;
	},

    unpackageAt: function(loc) {
	if (!this.serialized) {
	    console.log("no morph to unpackage");
	    return;
	}
	var importer = new Importer();
	// var targetMorph = importer.importWrapperFromString(Exporter.stringify(this.serialized));
	var targetMorph = importer.importWrapperFromNode(this.serialized);
	if (targetMorph instanceof WorldMorph) {
	    this.world().addMorph(new LinkMorph(targetMorph, loc));
	    for (var i = 0; i < targetMorph.submorphs.length; i++) {
		var m = targetMorph.submorphs[i];
		if (m instanceof LinkMorph) { 
		    // is it so obvious ? should we mark the link world to the external word?
		    m.myWorld = this.world();
		}
	    }
	    importer.finishImport(targetMorph);
	} else {
	    this.world().addMorphAt(targetMorph, loc);
	    importer.finishImport(this.world());
	}
	this.remove();
    },

    restoreFromSubnode: function($super, importer, node) {
	if (!$super(importer, node)) {
	    if (node.parentNode && node.parentNode.localName == "defs" && node.localName == "g") {
		this.serialized = node;
		console.log("package located " + node);
		return true;
	    } else return false;
	} else return true;
    }
});


lively.data.Wrapper.subclass('lively.Storage.CollectionItem', {
    documentation: "Wrapper around information returned from WebDAV's PROPFIND",

    nameQ: new Query("D:href"),
    propertiesQ: new Query("D:propstat"),
    
    initialize: function(raw, baseUrl) {
        this.rawNode = raw; 
	this.baseUrl = baseUrl;
    },
    
    name: function() {
	// FIXME: resolve prefix "D" to something meaningful?
	var result = this.nameQ.findFirst(this.rawNode);
	if (!result) {
	    console.log("query failed " + Exporter.stringify(this.rawNode));
	    return "?";
	} else 
	    return decodeURIComponent(result.textContent);
    },

    toURL: function() {
		// this doesn't return a correct url when used with proxy, see toURL2
		return this.baseUrl.withPath(this.name());
    },

    toURL2: function() {
		this.baseUrl.withFilename(z.shortName());
    },

    toString: function() {
	return "#<" + this.getType() + "," + this.toURL() + ">";
    },

    shortName: function() {
	var n = this.name();
	var slash = n.endsWith('/') ? n.lastIndexOf('/', n.length - 2) : n.lastIndexOf('/');
	return n.substring(slash + 1);
    },
    
    properties: function() {
	return this.propertiesQ.findAll(this.rawNode).pluck('textContent').join('\n');
    },

	asSVNVersionInfo: function() {
		var r = this.rawNode;
		// FIXME cleanup --> SVNResource>>pvtSetMetadataDoc
		// rk 2/22/10: the namespace tag lp1 is required by Firefox
		var prefix = UserAgent.fireFoxVersion ? 'lp1:' : '';

		var versionTag = r.getElementsByTagName(prefix + 'version-name')[0];
		var rev = versionTag ? Number(versionTag.textContent) : 0;

		var dateTag = r.getElementsByTagName(prefix + 'getlastmodified')[0];
		var date = new Date(dateTag ? dateTag.textContent : 'Mon, 01 Jan 1900 00:00:00 GMT');

		var authorTag = r.getElementsByTagName(prefix + 'creator-displayname')[0];
		var author = authorTag ? authorTag.textContent : 'anonymous';

		return new SVNVersionInfo({rev: rev, date: date, author: author});
	},
});


View.subclass('lively.Storage.WebFile', NetRequestReporterTrait, { 
    documentation: "Read/Write file",     // merge with Resource?
    formals: ["-File", "Content", "+CollectionItems", "+DirectoryList", "-RootNode"],

    initialize: function($super, plug) {
	$super(plug);
	this.lastFile = null;
    },

    deserialize: function() {
	// empty, no state should be needed, other than the modelPlug
    },


    toString: function() {
	return "#<" + this.getType() + "," + this.getFile() + ">";
    },

    startFetchingFile: function() {
		if (this.modelPlug)
			this.updateView(this.modelPlug.getFile, this);
    },

    updateView: function(aspect, source) { // setContent, getContent, getFile
	var p = this.getModel();
	if (!p) return;
	switch (aspect) {
	case p.getFile:
	    var file = this.getFile();
	    if (file)
		this.fetchContent(file);
	    break;
	case p.getContent:
	    var file = this.lastFile; // this.getFile();
	    console.log("saving " + file + " source " + source);
	    if (file)
		this.saveFileContent(file, this.getModelValue('getContent'));
	    break;
	}
    },
    
    fetchContent: function(url, optSync) {
	this.lastFile = url; // FIXME, should be connected to a variable
	if (url.isLeaf()) {
	    var req = new NetRequest({model: this,  // this is not a full model
		setResponseText: "pvtSetFileContent", 
		setStatus: "setRequestStatus"});
	    if (Config.suppressWebStoreCaching)
		req.setRequestHeaders({"Cache-Control": "no-cache"});
	    if (optSync) req.beSync();
	    req.get(url);
	} else {
	    var req = new NetRequest({model: this, setResponseXML: "pvtSetDirectoryContent", 
		setStatus: "setRequestStatus"});
	    if (optSync) req.beSync();
            // initialize getting the content
	    req.propfind(url, 1);
	}
    },


    pvtSetDirectoryContent: function(responseXML) {
	var result = new Query("/D:multistatus/D:response").findAll(responseXML.documentElement);
	var baseUrl = this.getModelValue("getRootNode");
	var colItems = result.map(function(rawNode) { return new module.CollectionItem(rawNode, baseUrl) });
	this.setModelValue("setCollectionItems", colItems);
	var files = colItems.map(function(ea) { return ea.toURL(); });
	files = this.arrangeFiles(files);
	this.setModelValue("setDirectoryList", files);
    },

    saveFileContent: function(url, content) {
	new Resource(Record.newPlainInstance({URL: url})).store(content);
    },

    pvtSetFileContent: function(responseText) {
	this.setModelValue("setContent", responseText);
    },

    arrangeFiles: function(fullList) {
	var dirs = [];
	var second = [];
	var last = [];
	// little reorg to show the more relevant stuff first.
	for (var i = 0; i < fullList.length; i++) {
	    var n = fullList[i];
	    if (n.filename().endsWith('/')) {
		dirs.push(n);
	    } else if (n.filename().indexOf(".#") == -1) {
		second.push(n);
	    } else {
		last.push(n);
	    }
	}
	return dirs.concat(second).concat(last);
    }
    
});



Widget.subclass('TwoPaneBrowser', { // move to Widgets.js sometime

    pins: ["-RootNode", "TopNode", 
	   "UpperNodeList" , "UpperNodeNameList", "SelectedUpperNode", "SelectedUpperNodeName", "-UpperNodeListMenu", 
	   "LowerNodeList", "LowerNodeNameList", "SelectedLowerNode", "SelectedLowerNodeName", "-LowerNodeListMenu", 
	   "+LowerNodeDeletionConfirmation", "-LowerNodeDeletionRequest"],
	   
    initialize: function(rootNode, lowerFetcher, upperFetcher) {
	// this got a bit out of hand
	var model = new SyntheticModel(["RootNode", //: Node, constant
	    "TopNode", //:Node the node whose contents are viewed in the left pane
	    
	    "UpperNodeList",  //:Node[]
	    "UpperNodeNameList", // :String[]
	    "SelectedUpperNode", //:Node
	    "SelectedUpperNodeName", //: String
	    "SelectedUpperNodeContents", //:String
	    "UpperNodeListMenu", 

	    "LowerNodeList",   // :Node[]
	    "LowerNodeNameList", // :String[]
	    "SelectedLowerNode",  // :Node
	    "SelectedLowerNodeName", //:String
	    "SelectedLowerNodeContents", // : String
	    "LowerNodeListMenu",

	    "LowerNodeDeletionRequest", 
	    "LowerNodeDeletionConfirmation"]);
	

	this.connectModel(model.makePlugSpecFromPins(this.pins));
	
	model.setRootNode(rootNode);
	model.setUpperNodeList([rootNode]);
	model.setUpperNodeNameList([this.SELFLINK]);
	model.setTopNode(rootNode);

	this.lowerFetcher = lowerFetcher;
	lowerFetcher.connectModel({model: model, 
				   getRootNode: "getRootNode",
				   getContent: "getSelectedLowerNodeContents",
				   setContent: "setSelectedLowerNodeContents",
				   setDirectoryList: "setLowerNodeList"});

	this.upperFetcher = upperFetcher;
	upperFetcher.connectModel({model: model, 
				   getRootNode: "getRootNode", 
				   getContent: "getSelectedUpperNodeContents",
				   setContent: "setSelectedUpperNodeContents",
				   setDirectoryList: "setUpperNodeList"});

    },

    UPLINK: "<up>",
    SELFLINK: "<top>",
    
    getSelectedLowerNode: function() {
	return this.getModelValue("getSelectedLowerNode");
    },
    
    setSelectedLowerNode: function(url) {
	console.log("setting selected lower to " + url);
	this.setModelValue("setSelectedLowerNode", url);
    },
    
    getSelectedUpperNode: function() {
	return this.getModelValue("getSelectedUpperNode");
    },

    setSelectedUpperNode: function(url) {
	console.log("setting selected upper to " + url);
	return this.setModelValue("setSelectedUpperNode", url);
    },

    clearLowerNodes: function() {
	this.setModelValue("setLowerNodeList", []);
	this.setModelValue("setLowerNodeNameList", []);
	this.setSelectedLowerNode(null);
	this.setModelValue("setSelectedLowerNodeName", null);
	this.setModelValue("setSelectedLowerNodeContents", "");
    },

    getRootNode: function() {
	return this.getModelValue("getRootNode");
    },
    
    getTopNode: function() {
	return this.getModelValue("getTopNode");
    },

    handleUpperNodeSelection: function(upperName) {
	if (!upperName) return;
	if (upperName == this.UPLINK) { 
	    if (this.nodeEqual(this.getTopNode(), this.getRootNode())) {
		// console.log("we are at root, do nothing");
		return;
	    } else {
		var newTop = this.retrieveParentNode(this.getTopNode());
		this.setModelValue("setTopNode", newTop); 
		console.log("walking up to " + newTop);
		
		// copy left pane to right pane 
		this.setModelValue("setLowerNodeList", this.getModelValue("getUpperNodeList")); 
		this.setModelValue("setLowerNodeNameList", this.getModelValue("getUpperNodeNameList"));
		this.setModelValue("setSelectedLowerNodeName", upperName);
		this.setSelectedUpperNode(null);
		this.upperFetcher.fetchContent(newTop);
	    } 
	} else {
	    var newUpper = upperName == this.SELFLINK ? 
		this.getRootNode() : this.deriveChildNode(this.getTopNode(), upperName);
	    this.setSelectedUpperNode(newUpper);
	    this.lowerFetcher.fetchContent(newUpper);
	}
    },

    handleLowerNameSelection: function(lowerName) {
	if (!lowerName) return;
	var selectedUpper = this.getSelectedUpperNode();
	var newNode = (lowerName == this.UPLINK) ? selectedUpper : this.deriveChildNode(selectedUpper, lowerName);
	if (this.isLeafNode(newNode)) {
	    this.setSelectedLowerNode(newNode);
	} else {
	    this.setModelValue("setTopNode", selectedUpper);
	    this.setModelValue("setUpperNodeList", this.getModelValue("getLowerNodeList"));
	    this.setModelValue("setUpperNodeNameList", this.getModelValue("getLowerNodeNameList"));
	    // the above will cause the list to set selection, to a new upper name, which will 
	    // cause the corresp. upper node to be loaded 
	    this.setModelValue("setSelectedUpperNodeName", lowerName); 
	    this.setSelectedUpperNode(newNode);
	    this.setSelectedLowerNode(null);
	    if (lowerName == this.UPLINK) {
		this.clearLowerNodes();
		return;
	    } 
	} 
	this.lowerFetcher.fetchContent(newNode);
    },

    updateView: function(aspect, source) {
	var p = this.modelPlug;
	if (!p) return;
	switch (aspect) {
	case p.getSelectedUpperNodeName:
	    this.handleUpperNodeSelection(this.getModelValue("getSelectedUpperNodeName"));
	    break;

	case p.getSelectedLowerNodeName:
	    this.handleLowerNameSelection(this.getModelValue("getSelectedLowerNodeName"));
	    break;
	    
	case p.getLowerNodeList: 
	    this.setModelValue("setLowerNodeNameList", 
			       this.nodesToNames(this.getModelValue("getLowerNodeList"), 
						 this.getSelectedUpperNode()));
	    break;
	    
	case p.getUpperNodeList: 
	    this.setModelValue("setUpperNodeNameList", 
			       this.nodesToNames(this.getModelValue("getUpperNodeList"), 
						 this.getTopNode()));
	    break;

	case p.getLowerNodeDeletionRequest:
	    this.removeNode(this.getSelectedLowerNode());
	    break;
	}
    },

    removeNode: function(node) {
	console.log("implement remove node?");
    },
    
    buildView: function(extent, model) {
        var panel = PanelMorph.makePanedPanel(extent, [
            ['leftPane', newTextListPane, new Rectangle(0, 0, 0.5, 0.6)],
            ['rightPane', newTextListPane, new Rectangle(0.5, 0, 0.5, 0.6)],
            ['bottomPane', newTextPane, new Rectangle(0, 0.6, 1, 0.4)]
        ]);
        panel.leftPane.connectModel({model: model,
				     getList: "getUpperNodeNameList",
				     getMenu: "getUpperNodeListMenu",
				     setSelection: "setSelectedUpperNodeName", 
				     getSelection: "getSelectedUpperNodeName"});

        var m = panel.rightPane;
        m.connectModel({model: model, getList: "getLowerNodeNameList", setSelection: "setSelectedLowerNodeName", 
			getDeletionConfirmation: "getLowerNodeDeletionConfirmation",
			setDeletionRequest: "setLowerNodeDeletionRequest",
			getMenu: "getLowerNodeListMenu"});
	
	
        panel.bottomPane.connectModel({model: model, 
				       getText: "getSelectedLowerNodeContents", 
				       setText: "setSelectedLowerNodeContents"});
	
	// kickstart
	var im = panel.leftPane.innerMorph();
	im.updateView(im.modelPlug.getList, im);
        return panel;
    },

    getViewTitle: function() {
	var title = new PrintMorph(new Rectangle(0, 0, 150, 15), 'Browser ').beLabel();
	title.formatValue = function(value) { return String(value).truncate(50) }; // don't inspect URLs, just toString() them.
	title.connectModel({model: this.getModel(), getValue: "getTopNode"});
	// kickstart
	title.updateView(title.modelPlug.getValue);
	return title;
    }

});


TwoPaneBrowser.subclass('FileBrowser', {

    initialize: function($super, rootNode) {
	if (!rootNode) rootNode = URL.source.getDirectory();
	$super(rootNode, new module.WebFile(), new module.WebFile());
	var model = this.getModel();
	var browser = this;

	function addSvnItems(url, items) {
	    var svnPath = url.svnWorkspacePath();
	    if (!svnPath) return;
	    items.push(["repository info", function(evt) {
		var m = Record.newPlainInstance({Info: "fetching info"});
		var s = new Subversion();
		s.connectModel(m.newRelay({ServerResponse: "+Info"}));
		var txt = this.world().addTextWindow({
		    acceptInput: false,
		    title: "info " + url,
		    position: evt.point()
		});
		m.addObserver(txt, { Info: "!Text" });
		s.info(svnPath);
	    }]);
	    items.push(["repository diff", function(evt) {
		var m = new SyntheticModel(["Diff"]);
		this.world().addTextWindow({acceptInput: false,
					    plug: {model: m, getText: "getDiff"},
					    title: "diff " + url,
					    position: evt.point() });
		new Subversion({model: m, setServerResponse: "setDiff"}).diff(svnPath);
			       
	    }]);
	    items.push(["repository commit", function(evt) {
		var world = this.world();
		world.prompt("Enter commit message", function(message) {
		    if (!message) {
			// FIXME: pop an alert if message empty
			console.log("cancelled commit");
			return;
		    }
		    var m = new SyntheticModel(["CommitStatus"]);
		    this.world().addTextWindow({acceptInput: false,
						title: "commit " + url, 
						plug: {model: m, getText: "getCommitStatus"}, 
						position: evt.point() });
		    new Subversion({model: m, setServerResponse: "setCommitStatus"}).commit(svnPath, message);
		});
	    }]);
	    items.push(["repository log", function(evt) {
		var world = this.world();
		var url = URL.common.repository.withRelativePath(svnPath);

		var model = Record.newPlainInstance({
		    HeadRevision: 0, 
		    RevisionHistory: null, 
		    ReportDocument: null, 
		    LogItems: null, 
		    URL: url});
		
		var res = new Resource(model.newRelay({URL: "-URL", ContentDocument: "+ReportDocument"}));
		
		var q = new Query("//S:log-item", model.newRelay({ContextNode: "-RevisionHistory",
								  Results: "+LogItems"}));
		
		model.addObserver({  //app logic is here
		    onHeadRevisionUpdate: function(rev) {
			res.fetchVersionHistory(rev, 0, model);
		    },
		    
		    onLogItemsUpdate: function(items) {
			var content = items.map(function(node) { 
			    var creator = node.getElementsByTagName("creator-displayname")[0].textContent;
			    var date = node.getElementsByTagName("date")[0].textContent;
			    var comment = node.getElementsByTagName("comment")[0].textContent;
			    return Strings.format("On %s by %s: %s", date, creator, comment);
			});
			var world = WorldMorph.current();
			
			world.addTextListWindow({ 
			    extent: pt(500, 300), 
			    content: content,
			    title: "log history for " + url.filename(),
			    plug: Record.newPlainInstance({
				List: content,
				Menu: [['show head revision', function() {
				    world.alert('head revision ' + model.getHeadRevision())
				}]]
			    }).newRelay({List: "-List", Menu: "-Menu"})
			});
		    }
		});
		
		res.fetchHeadRevision(model);
		
	    }]);


	    
	}
	function addWebDAVItems(url, items) { 
	    items.push(["get WebDAV info", function(evt) {
		var m = Record.newPlainInstance({ Properties: null, PropertiesString: "", URL: url});
		m.addObserver({  // ad-hoc observer, convenient data conversion
		    onPropertiesUpdate: function(doc) { 
			m.setPropertiesString(Exporter.stringify(doc));
		    }
		});
		
		var txt = this.world().addTextWindow({acceptInput: false,
		    title: url,
		    position: evt.point() });
		txt.connectModel(m.newRelay({Text : "-PropertiesString"}));
		
		var res = new Resource(m);
		// resource would try to use its own synthetic model, which is useless
		res.fetchProperties(m);
		
	    }]);
	    
	}

	model.getUpperNodeListMenu =  function() { // cheating: non stereotypical model
	    var model = this;
	    var selected = model.getSelectedUpperNode();
	    if (!selected) return [];
	    
	    var items = [
		["make subdirectory", function(evt) {
		    var dir = browser.retrieveParentNode(selected);
		    this.world().prompt("new directory name", function(response) {
			if (!response) return;
			var newdir = dir.withFilename(response);
			//console.log("current dir is " + newdir);
			var req = new NetRequest({model: model, setStatus: "setRequestStatus"});
			req.mkcol(newdir);
			// FIXME: reload subnodes
		    });
		}]
	    ];
	    addWebDAVItems(selected, items);
	    addSvnItems(selected, items);
	    return items;
	};

	model.getLowerNodeListMenu =  function() { // cheating: non stereotypical model
	    var items = [];
	    var url = this.getSelectedLowerNode();
	    if (!url) 
		return [];
	    var fileName = url.toString();
	    var model = this;

	    var items = [
		['edit in separate window', function(evt) {
		    this.world().addTextWindow({
			content: "Fetching " + url + "...",
			plug: {model: model, getText: "getSelectedLowerNodeContents", setText: "setSelectedLowerNodeContents"},
			title: url.toString(),
			position: evt.point()
		    });
		    var webfile = new module.WebFile({
			model: model, 
			getFile: "getSelectedLowerNode", 
			setContent: "setSelectedLowerNodeContents",
			getContent: "getSelectedLowerNodeContents" 
		    });
		    webfile.startFetchingFile();
		}],
		["get XPath query morph", browser, "onMenuAddQueryMorph", url],
		["get modification time (temp)", browser, "onMenuShowModificationTime", url] // will go away
	    ];
	    addWebDAVItems(url, items);
	    addSvnItems(url, items);

	    // FIXME if not trunk, diff with trunk here.
	    var shortName = url.filename();
	    if (shortName.endsWith(".xhtml")) {
		items.push(["load into current world", function(evt) {
		    new NetRequest({model: new NetImporter(), setResponseXML: "loadWorldContentsInCurrent", 
				    setStatus: "setRequestStatus"}).get(url);
		}]);
		
		items.push(["load into new linked world", function(evt) {
		    new NetRequest({model: new NetImporter(), setResponseXML: "loadWorldInSubworld",
				    setStatus: "setRequestStatus"}).get(url);
		}]);
		
	    } else if (shortName.endsWith(".js")) {
		items.push(["evaluate as Javascript", function(evt) {
		    var importer = NetImporter();
		    importer.onCodeLoad = function(error) {
			if (error) evt.hand.world().alert("eval got error " + error);
		    }
		    importer.loadCode(url); 
		}]);
	    } else if (FileBrowser.prototype.isGraphicFile(url)) {
		// FIXME tell the browser not to load the contents.
		items.push(["load image", function(evt) {
		    var img = new ImageMorph(rect(pt(0,0), pt(500*2, 380*2)), fileName);
		    evt.hand.world().addFramedMorph(img, shortName, evt.point());
		}]);
	    }
	    
	    if (lively.Tools.SourceControl) {
		var fileName = url.filename();
		items.unshift(['open a changeList browser', function(evt) {
                    var chgList = lively.Tools.SourceControl.changeListForFileNamed(fileName);
		    new ChangeList(fileName, null, chgList).openIn(this.world()); 
		}]);
	    }
	    return items; 
	};

    },
    
    isGraphicFile: function(url) {
	var shortName = url.filename();
	// not extensive
	return (shortName.endsWith(".jpg") || shortName.endsWith(".PNG") || shortName.endsWith(".png"));
    },


    onMenuAddQueryMorph: function(url, evt) {
	var req = new NetRequest().beSync();
	var doc = req.propfind(url, 1).getResponseXML(); // FIXME: make async
	var m = new XPathQueryMorph(new Rectangle(0, 0, 500, 200), doc.documentElement);
	evt.hand.world().addFramedMorph(m, url.toString(), evt.point());
    },

    onMenuShowModificationTime: function(url, evt) {
	// to be removed
	var model = new SyntheticModel(["InspectedNode", "ModTime"]);
	var res = new Resource({model: model, setContentDocument: "setInspectedNode" });
	var query = new Query("/D:multistatus/D:response/D:propstat/D:prop/D:getlastmodified", 
	    {model: model, getContextNode: "getInspectedNode", setResults: "setModTime"});
	res.fetchProperties(model, true);
	evt.hand.world().alert('result is ' + Exporter.stringifyArray(model.getModTime(), '\n'));
    },
    
    removeNode: function(url) {
	var model = this.getModel();
	if (!url.isLeaf()) {
	    WorldMorph.current().alert("will not erase directory " + url);
	    model.setLowerNodeDeletionConfirmation(false);
	    return;
	}
	
        WorldMorph.current().confirm("delete resource " + url, function(result) {
	    if (result) {
		var eraser = { 
		    setRequestStatus: function(status) { 
			if (status.isSuccess()) 
			    model.setLowerNodeDeletionConfirmation(true);
			NetRequestReporterTrait.setRequestStatus.call(this, status);
		    }
		};
		new NetRequest({model: eraser, setStatus: "setRequestStatus"}).del(url);
	    } else console.log("cancelled removal of " + url);
	});
    },


    retrieveParentNode: function(node) {
	return node.getDirectory();
    },

    nodesToNames: function(nodes, parent) {
	var UPLINK = this.UPLINK;
	// FIXME: this may depend too much on correct normalization, which we don't quite do.
	return nodes.map(function(node) { return node.eq(parent) ?  UPLINK : node.filename()});
    },

    isLeafNode: function(node) {
	return node.isLeaf();
    },
    
    deriveChildNode: function(parentNode, childName)  {
	return parentNode.withFilename(childName);
    },

    nodeEqual: function(n1, n2) {
	return n1.eq(n2);
    }

	
});


View.subclass('lively.Storage.DOMFetcher', {

    initialize: function($super, plug) {
	$super(plug);
	this.lastNode = null;
    },

    updateView: function(aspect, source) { // setContent, getContent, getFile
	var p = this.modelPlug;
	if (!p) return;
	switch (aspect) {
	case p.getContent:
	    var file = this.lastNode; // this.getFile();
	    console.log("!not saving " + file + " source " + source);
	    break;
	}
    },
    
    fetchContent: function(node) {
	console.log("fetching " + node);
	this.lastNode = node; // FIXME, should be connected to a variable
	var nodes = [];
	for (var n = node.firstChild; n != null; n = n.nextSibling)
	    nodes.push(n);
	this.setModelValue("setDirectoryList", nodes);
	
	var info;
	if (node.nodeType !== Node.ELEMENT_NODE) {
	    info = node.textContent;
	} else {
	    info = "tagName=" + node.tagName;
	    
	    if (node.attributes) {
		var attributes = [];
		for (var i = 0; i < node.attributes.length; i++)  {
		    var a = node.attributes[i];
		    info += "\n" + a.name + "=" + a.value;
		}
	    }
	}
	this.setModelValue("setContent", info);
    }

});


TwoPaneBrowser.subclass('DOMBrowser', {

    // indexed by Node.nodeType
    nodeTypes: [ "", "Node", "Attribute", "Text", "CData", "EntityReference", "Entity", "ProcessingInstruction", 
		 "Comment", "Document", "DocumentType", "DocumentFragment", "Notation"],

    initialize: function($super, element) {
	$super(element || document.documentElement, new module.DOMFetcher(), new module.DOMFetcher());
    },

    nodesToNames: function(nodes, parent) {
	// FIXME: this may depend too much on correct normalization, which we don't quite do.
	var result = [];
	var nodeTypes = this.nodeTypes;
	function printNode(n) {
	    var id = n.getAttribute && n.getAttribute("id");
	    var t = n.getAttributeNS && LivelyNS.getType(n);
	    return (n.nodeType == Node.ELEMENT_NODE ? n.tagName : nodeTypes[n.nodeType]) 
		+ (id ? ":" + id : "") + (t ? ":" + t : "");
	}
	
	for (var i = 0; i < nodes.length; i++) {
	    result[i] = String(i) + ":" + printNode(nodes[i]);
	}
	result.unshift(this.UPLINK);
	return result;
    },

    retrieveParentNode: function(node) {
	return node.parentNode;
    },

    isLeafNode: function(node) {
	return !node || node.firstChild == null;
    },

    deriveChildNode: function(parentNode, childName)  {
	var index = parseInt(childName.substring(0, childName.indexOf(':')));
	if (isNaN(index))
	    return parentNode;
	else 
	    return parentNode && parentNode.childNodes.item(index);
    },

    nodeEqual: function(n1, n2) {
	return n1 === n2;
    }
    
});


// move elsewhere
View.subclass('ObjectFetcher', {

    initialize: function($super, plug) {
	$super(plug);
	this.lastNode = null;
    },

    updateView: function(aspect, source) { // setContent, getContent, getFile
	var p = this.modelPlug;
	if (!p) return;
	switch (aspect) {
	case p.getContent:
	    var file = this.lastNode; // this.getFile();
	    console.log("!not saving " + file + " source " + source);
	    break;
	}
    },
    
    fetchContent: function(node) {
	console.log("fetching properties of " + node);
	this.lastNode = node; // FIXME, should be connected to a variable
	// console.log("properties are " + Properties.all(node));
	var values = Properties.own(node).map(function(name) { return node[name]; });
	this.setModelValue("setDirectoryList", values);
	this.setModelValue("setContent", Object.inspect(node));
    }

});



TwoPaneBrowser.subclass('TwoPaneObjectBrowser', {
    // clearly not quite finished

    initialize: function($super) {
	$super(WorldMorph.current(), new ObjectFetcher(), new ObjectFetcher());
    },

    nodesToNames: function(nodes, parent) {
	var props = Properties.own(parent);
	var names = [];
	// FIXME! ouch quadratic
	for (var i = 0; i < nodes.length; i++) 
	    for (var j = 0; j < props.length; j++) {
		if (parent[props[j]] === nodes[i] && nodes[i])
		    names[i] = props[j];
	    }
	names.unshift(this.UPLINK);
	
	return names;
    },


    retrieveParentNode: function(node) {
	return this.getRootNode(); // ???
    },

    isLeafNode: function(node) {
	return Properties.own(node).length == 0;
    },

    deriveChildNode: function(parentNode, childName)  {
	return parentNode[childName];
    },

    nodeEqual: function(n1, n2) {
	return n1 === n2;
    }
    
});


// deprecated?
View.subclass('Subversion',  NetRequestReporterTrait, {
    documentation: "A simple subversion client",
    
    pins:["ServerResponse"],

    initialize: function($super, plug) {
	$super(plug);
	this.server = new URL(URL.source);
	this.server.port = Config.personalServerPort; 
	this.server.search = undefined;
	this.server.pathname = "/trunk/source/server/svn.sjs";
	this.setModelValue("setServerResponse", "");
    },

    diff: function(repoPath) {
	var req = new NetRequest(Relay.newInstance({Status: "+RequestStatus", ResponseText: "+SubversionResponse"}, this));
	this.setModelValue("setServerResponse", "");
	req.get(this.server.withQuery({command: "diff " + (repoPath || "")}));
    },

    info: function(repoPath) {
	var req = new NetRequest(Relay.newInstance({Status: "+RequestStatus", ResponseText: "+SubversionResponse"}, this));
	// use space as argument separator!
	return req.get(this.server.withQuery({command: "info " + (repoPath|| "")}));
    },
    
    commit: function(repoPath, message) {
	var req = new NetRequest(Relay.newInstance({Status: "+RequestStatus", ResponseText: "+SubversionResponse"}, this));
	// use space as argument separator!
	return req.get(this.server.withQuery({command: "commit " + (repoPath || "") + ' -m "' + message + '"'}));
    },

    setSubversionResponse: function(txt) {	
	this.setModelValue("setServerResponse", txt);
    }

});

console.log('Storage.js');


}); // end of module

