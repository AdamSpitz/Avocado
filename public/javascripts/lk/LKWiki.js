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


module('lively.LKWiki').requires().toRun(function(ownModule) {

URL.common.localWiki = URL.proxy.withFilename('wiki/');

// FIXME cleanup!!! Use WikiNetworkAnalyzer and WikiWorldProxies
Widget.subclass('WikiNavigator', {
    
    repoUrl: function() {
            // FIXME: assertion: */proxy/wiki is used as the repository
            // if URL.source.getDirectory() is http://localhost/livelyBranch/proxy/wiki/test/
            // the regexp outputs ["http://localhost/livelyBranch/proxy/wiki/test/", "http://localhost/livelyBranch/proxy/wiki"]
            
			if (Config.wikiRepoUrl)
				return Config.wikiRepoUrl;

			if (!URL.source.toString().include("wiki")) return URL.source.getDirectory().toString(); 
			var match = /(.*wiki).*/.exec(URL.source.getDirectory().toString());
			if (match) {
            	return match[1];
			} else {
				return undefined
			}
    },
   
    initialize: function($super, url, world, rev) {
		$super(null);
		if (!world) world = WorldMorph.current();
		this.world = world;
		url = new URL(url).notSvnVersioned().withoutQuery();
		this.svnResource = new SVNResource(this.repoUrl(), Record.newPlainInstance({URL: url.toString(), HeadRevision: null, Metadata: null}));
		if (!rev) {
			this.svnResource.fetchHeadRevision(true);
			rev = this.svnResource.getHeadRevision();
		}
		this.model = Record.newPlainInstance({Versions: [], Version: null, URL: url, OriginalRevision: rev});
		this.model.addObserver(this, {Version: "!Version"});
		
		return this;
	},
	
	buildView: function(extent) {
	    var panel = PanelMorph.makePanedPanel(extent, [
			['saveContentButton', function(initialBounds){return new ButtonMorph(initialBounds)}, new Rectangle(0.05, 0.2, 0.1, 0.35)],
			['deletePageButton', function(initialBounds){return new ButtonMorph(initialBounds)}, new Rectangle(0.05, 0.55, 0.1, 0.25)],
			//['lockButton', function(initialBounds){return new ButtonMorph(initialBounds)}, new Rectangle(0.05, 0.5, 0.1, 0.3)],
			['registerButton', function(initialBounds){return new ButtonMorph(initialBounds)}, new Rectangle(0.85, 0.2, 0.1, 0.3)],
			['loginButton', function(initialBounds){return new ButtonMorph(initialBounds)}, new Rectangle(0.85, 0.5, 0.1, 0.3)],
			['versionList', newTextListPane, new Rectangle(0.15, 0.2, 0.7, 0.6)],
		]);

        // delete panel when moving the mouse away from it
        panel.onMouseOut = panel.onMouseOut.wrap(function(proceed, evt) {
			if (this.submorphs.any(function(ea) { return ea.fullContainsWorldPoint(evt.point()) })) return;
			this.remove();
        });

		var self = this;
		var btnAction = function(func) {
			return {setValue: 'btn', model: {btn: function(btnVal) { if (!btnVal) func.apply(self) }}}
		};

		var saveContentButton = panel.saveContentButton;
		saveContentButton.setLabel("Save");
		saveContentButton.connectModel(btnAction(this.saveWorld));

		var registerButton = panel.registerButton;
		registerButton.setLabel("Register");
		registerButton.connectModel(btnAction(function() {
			console.log(this);
			panel.remove(); new UserRegistrationDialog().open();
		}));

		var loginButton = panel.loginButton;
		loginButton.setLabel("Login");
		loginButton.connectModel(btnAction(function() {panel.remove(); this.login()}));

		var deletePageButton = panel.deletePageButton;
		deletePageButton.setLabel("Delete");
		deletePageButton.connectModel(btnAction(function() { this.askToDeleteCurrentWorld() }));
		/*
		var lockButton = panel.lockButton;
		lockButton.setLabel("Lock");
		//saveContentButton.connectModel({model: this, setValue: "saveWorld"});
		*/
		
/*****/
        var versionList = panel.versionList;
		versionList.applyStyle({borderWidth:1, borderColor:Color.black})
        // FIXME This is for value conversion. Much better is using conversion method support of relay (see below)
        var convertSVNMetadataToStrings = function(data) { return data.collect(function(ea) { return ea.toString() }) };
        versionList.innerMorph().setList = versionList.innerMorph().setList.wrap(function(proceed, values) {
            console.log("wrapped setList");
            proceed(convertSVNMetadataToStrings(values));
        });    
        versionList.innerMorph().onListUpdate = versionList.innerMorph().onListUpdate.wrap(function(proceed, values) {
            console.log("wrapped onListUpdate");
            proceed(convertSVNMetadataToStrings(values));
        });
        versionList.connectModel(this.model.newRelay({List: "Versions", Selection: "Version"}), true /* kickstart if morph was deleted*/);
        //When using conversion methods this.model.setVersions no longer triggers the onListUpdate... why?
        // Relay.create({List: {mode: '', name: 'Versions', from: Number, to: String}})
        // var relay = Relay.newInstance({
        //         List: {name: 'Versions', mode: '',
        //                 to: function(list) { console.log("to conv setVersions triggered!"); return ['list']; },
        //                 from: function(list) { console.log("from conv of setVersions triggered!"); return list; }},
        //         Selection: {name: 'Version', mode: '', to: String}},
        //         this.model);
        //         versionList.connectModel(relay, true /* kickstart if morph was deleted*/);
/*****/
        this.findVersions();
		this.panel = panel;
		return panel;
	},
	
	prepareForSaving: function() {
	    if (this.panel) this.panel.remove();
        // remove all control btns.... remove this when all pages updated
		var w = WorldMorph.current();
        var btns = w.submorphs.select(function(ea) { return ea.constructor == TextMorph });
        btns.forEach(function(ea) {
			if (ea.textContent && ea.textContent.rawNode.textContent == 'Wiki control')
 				ea.remove();
		});
		w.removeHand(w.firstHand());
	},
	
	afterSaving: function() {
		WorldMorph.current().addHand(new HandMorph(true));
	},
	
	doSave: function(doNotOverwrite, optUrl) { // ok, clean this whole thing up!!!!
		this.prepareForSaving();
		var worldDoc = Exporter.shrinkWrapMorph(WorldMorph.current()); // why not this.world()?
		var myRevision = doNotOverwrite ? this.model.getOriginalRevision() : null;
		var status;
		if (optUrl) { // save page elsewhere
			var svnR = new SVNResource(
				this.repoUrl(),
				Record.newPlainInstance({URL: optUrl.toString(), HeadRevision: null, Metadata: null}));
			status = svnR.store(worldDoc, true).getStatus();
		} else {
			status = this.svnResource.store(worldDoc, true, null, myRevision).getStatus();
		}
		this.afterSaving();
		return status;
	},

	interactiveSaveWorld: function(optUrl) {
		var world = WorldMorph.current();
		var url = optUrl || this.model.getURL();
		var anotherSave = function() {
			var status = this.doSave(true, optUrl);
			console.log(Strings.format('%s saving world at %s to wiki',
				status.isSuccess() ? "Success" : "Failure", url.toString()));
			WikiNavigator.enableWikiNavigator(true, this.model.getURL());
			if (status.code() === 412) this.askToOverwrite(url);
		}.bind(this);
		if (this.worldExists(optUrl))
			world.confirm(url.toString() + ' already exists! Overwrite?', anotherSave);
		else
			anotherSave();
	},
	
	saveWorld: function() {
	    var status = this.doSave(true);
		var msg = ' saving world at ' + this.model.getURL().toString() + '. Status: ' + status.code();
    	if (status.isSuccess()) {
    	    console.log('Success' + msg);
            this.navigateToUrl();
    	} else {
    	    console.log('Failure' + msg);
			WikiNavigator.enableWikiNavigator(true, this.model.getURL());
			if (status.code() === 412) this.askToOverwrite(null, true);
    	}
	},
	
	askToOverwrite: function(optUrl, gotoUrl) {
		WorldMorph.current().confirm('A newer version of the world was created by another user. Overwrite?', function() {
			var status = this.doSave(false, optUrl);
			console.log(status.code());
			if (status.isSuccess() && gotoUrl)
				this.navigateToUrl(optUrl);
		}.bind(this));
	},
	askToNavigateToUrl: function(url, openInNewWindow) {
		WorldMorph.current().confirm('Navigate to ' + url.toString() + '?', function(response) {
			if (!response) return;
			this.navigateToUrl(url, openInNewWindow);
		}.bind(this));
	},


	
	askToSaveAndNavigateToUrl: function(world, openInNewWindow) {    
	if (!Config.confirmNavigation) {this.navigateToUrl(null, openInNewWindow); return; }  // No other browsers confirm clickaway

	var msg = 'Go to ' + this.model.getURL() + ' ?';
	var worldExists = this.worldExists();
	var label1 = worldExists ? 'Save and follow link' : 'Save, create, follow link';
	var label2 = worldExists ? 'Just follow link' : 'Create and follow link';
        
	var model = Record.newPlainInstance({
                 Button1: null, Button2: null, Message: msg, LabelButton1: label1, LabelButton2: label2 });
             model.addObserver({
                 onButton1Update: function(value) {
                     if (!value) return;
                     if (WikiNavigator.current && WikiNavigator.current.doSave().isSuccess()) {
                         if (!worldExists) this.doSave(); // create other world
                         this.navigateToUrl(null, openInNewWindow);
                         return; // Alibi
                     }
                     world.alert('World cannot be saved. Did not follow link.');
                 }.bind(this),
                 onButton2Update: function(value) {
                     if (!value) return;
                     if (!worldExists)
                        if (!this.doSave().isSuccess()) return;
                     this.navigateToUrl(null, openInNewWindow)
                 }.bind(this)});
             var dialog = new WikiLinkDialog(model.newRelay({
                 Button1: "+Button1", Button2: "+Button2", Message: "-Message",
                 LabelButton1: "-LabelButton1", LabelButton2: "-LabelButton2"}));
             dialog.openIn(world, world.positionForNewMorph());
			return dialog;
    },
	    
	navigateToUrl: function(url, openInNewWindow) {
	    Config.askBeforeQuit = false;
		if (!url) url = this.model.getURL();
		url = url.toString() + '?' + new Date().getTime();
		if (openInNewWindow)
			Global.window.open(url)
		else
			Global.window.location.assign(url);
	},
	
	onVersionUpdate: function(versionString) {
	    // FIXME ... looking for correct version ... better with conversion methods
	    var selectedVersion = this.model.getVersions().detect(function(ea) { return ea.toString() == versionString});
	    var svnres = this.svnResource;
	    svnres.withBaselineUriDo(selectedVersion.rev, function() {
	        console.log("visiting: " + svnres.getURL());
	        // FIXME use navigateToUrl
            Config.askBeforeQuit = false;
            window.location.assign(svnres.getURL());
	    });
	    
	},
	
	findVersions: function() {
	    if (this.model.getVersions().length == 0) this.model.setVersions(['Please wait, fetching version infos...']);
		if (!this.svnResource.wasWrapped) {
			this.svnResource.wasWrapped = true;
			this.svnResource.formalModel.addObserver({onHeadRevisionUpdate: function(headRevision) {
				if (!headRevision) return;
				this.svnResource.fetchMetadata(false, null, headRevision);
			}.bind(this)});
			this.svnResource.formalModel.addObserver({onMetadataUpdate: function() {
				this.model.setVersions(this.svnResource.getMetadata());
			}.bind(this)});
		};
	    this.svnResource.fetchHeadRevision();
	},

// -------------
	registerUser: function(username, pwd, name, email, successCb, failureCb) {
	// This functions uses the trac installation at livelykernel.sunlabs.com to create
	// a new user account on the server. This happens in two steps:
	// 1. a GET request from http://livelykernel.sunlabs.com/index.fcgi/register is made.
	// This is necessary to get a session id and a form token from trac (required for next step).
	// 2. a POST request with the user data, the session id, and the form token is made (the correct
	// setup of the header is important) to run a cgi script on the server which calls the htpasswd command
	var pwdConfirm = pwd;
	var url = new URL('http://livelykernel.sunlabs.com/index.fcgi/register');
	var getReq = new NetRequest({
		setStatus: "register",
		model: {
			register: function() {
				var header = getReq.transport.getResponseHeader('Set-Cookie');
				var formToken = header.match(/.*trac_form_token=([0-9a-z]+);.*/)[1]
				var session = header.match(/.*trac_session=([0-9a-z]+);.*/)[1];

				var postReq = new NetRequest({
					setStatus: "result",
					model: {
						result: function() {
							postReq.getResponseText().match(/.*Another account with that name already exists.*/) ?
							failureCb && failureCb() : successCb && successCb() }
						}
				});

				postReq.setRequestHeaders({
					"Cookie": 'trac_form_token=' + formToken + '; trac_session=' + session,
					'Cache-Control': 'max-age=0',
					'Content-Type': 'application/x-www-form-urlencoded',
					'Accept': 'text/xml,application/xml,application/xhtml+xml,text/html;q=0.9,text/plain;q=0.8,image/png,*/*;q=0.5'
				});		

				var postData = Strings.format('__FORM_TOKEN=%s&action=create&user=%s&password=%s&password_confirm=%s&name=%s&email=%s',
				formToken, username, pwd, pwdConfirm, name, email)
				postReq.post(url, postData);
			}
		}});

		getReq.setRequestHeaders({"Cookie": '' }); // Cookie must be empty to get new session and form token from trac
		getReq.get(url);
	},

	login: function() {
		// Just do a write, if the server allow authenticated users write access,
		// a browser login popup should appear
		new NetRequest().put(this.model.getURL().withFilename('auth'));
	},
// -------------
		
	createWikiNavigatorButton: function() {
		var btn =  new TextMorph(new Rectangle(0,0,80,50), 'Wiki control');
		var self = this;
		btn.suppressHandles = true;
		btn.handlesMouseDown = Functions.True;
		btn.onMouseDown = function(evt) {
			var navMorph = self.buildView(pt(800,105));
			self.world.addMorph(navMorph);
			navMorph.setPosition(pt(0, 0))
		};
		btn.positionInLowerLeftCorner = function() { btn.setPosition(pt(0, 0)) };
		this.btn = btn;
	},
	
	isActive: function() {
		if (Config.wikiRepoUrl)
			return true;
	    // just look if url seems to point to a wiki file
        return this.model.getURL().toString().include("wiki");
	},
	
    worldExists: function(optURL) {
		var url = optURL || this.model.getURL();
        return new NetRequest().beSync().get(url).getStatus().isSuccess();
    },

	askToDeleteCurrentWorld: function() {
		WorldMorph.current().confirm('Delete ' + this.model.getURL().toString() + '?', function(response) {
			if (!response) return;
			this.deleteCurrentWorld();
		}.bind(this));
	},
	
	deleteCurrentWorld: function() { return this.deleteWorld(this.model.getURL()) },
	
	deleteWorld: function(url) { return this.svnResource.del().getStatus() },

});

Object.extend(WikiNavigator, {
    enableWikiNavigator: function(force, optUrl) {
		var old = WikiNavigator.current;
        if (!force && old) return;
		// if (old && old.btn) old.btn.remove();
		WorldMorph.current().submorphs.select(function(ea) { return ea.textString == 'Wiki control' }).invoke('remove') // FIXME
		var url = optUrl || URL.source;
		var nav = old ?
			new WikiNavigator(url, old.world, old.model.getOriginalRevision()) :
			new WikiNavigator(url);
        if (!nav.isActive()) return;
        nav.createWikiNavigatorButton();
        WorldMorph.current().addMorph(nav.btn);
        nav.btn.startStepping(1000, "positionInLowerLeftCorner");
        WikiNavigator.current = nav;
    },
	fileNameToURL: function(fileName) {
		if (!fileName) return null;
		if (!fileName.endsWith('.xhtml')) 
	    	fileName += ".xhtml";
		return URL.source.withFilename(fileName);
	},
	test: function(urlString) {
		WikiNavigator.enableWikiNavigator(true, new URL(urlString));
		return WikiNavigator.current;
	},
});

Dialog.subclass('WikiLinkDialog', {

    formals: ["-LabelButton1", "-LabelButton2", "+Button1", "+Button2", "-Message"],
    initialViewExtent: pt(350, 90),
    
    openIn: function($super, world, position) {
	    var view = $super(world, position);
        world.firstHand().setKeyboardFocus(view.targetMorph.submorphs[1]);
	    return view;
    },
    
    cancelled: function(value, source) {
        this.removeTopLevel();
    },
    
    confirmed1: function(value, source) {
        this.removeTopLevel();
	    if (value == true) this.setButton1(true);
    },
    
    confirmed2: function(value, source) {
        this.removeTopLevel();
	    if (value == true) this.setButton2(true);
    },
    
    buildView: function(extent, model) {
        var panel = new PanelMorph(extent);
        this.panel = panel;
        panel.linkToStyles(["panel"]);

        var r = new Rectangle(this.inset, this.inset, extent.x - 2*this.inset, 30);
        this.label = panel.addMorph(new TextMorph(r, this.getMessage()).beLabel());
        var indent = extent.x - 135 - 120 - 60 - 3*this.inset;
        var height = r.maxY() + this.inset;
        
        r = new Rectangle(r.x + indent, height, 135, 30);
        var confirm1Button = panel.addMorph(new ButtonMorph(r)).setLabel(this.getLabelButton1());
        confirm1Button.connectModel({model: this, setValue: "confirmed1"});
        
        r = new Rectangle(r.x + confirm1Button.getExtent().x + this.inset, height, 120, 30);
        var confirm2Button = panel.addMorph(new ButtonMorph(r)).setLabel(this.getLabelButton2());
        confirm2Button.connectModel({model: this, setValue: "confirmed2"});

        r = new Rectangle(r.maxX() + this.inset, height, 55, 30);
        var noButton = panel.addMorph(new ButtonMorph(r)).setLabel("Cancel");
        noButton.connectModel({model: this, setValue: "cancelled"});
        return panel;
    }

});

Object.subclass('WikiPatcher', {
    
    documentation: 'Wiki pages which do not run with the current source code can be fixed with this object.\n\
                    It will rewrite te failing xhtml so that it uses compatible source code again.',
    
    findLinks: /(xlink\:href\=)"(.*?)(\w+\.js)"/g,
    
    initialize: function(repoUrl) {
        this.repoUrl = repoUrl;
    },
    
    patchFile: function(fileName, optRevision) {
        var dir = new FileDirectory(this.repoUrl);
        var rev = optRevision || this.findFirstRevision(fileName);
        var unpatchedSrc = dir.fileContent(fileName);
        var patchedSrc = this.patchSrc(unpatchedSrc, rev);
        dir.writeFileNamed(fileName, patchedSrc);
    },
    
    unpatchFile: function(fileName) {
        var dir = new FileDirectory(this.repoUrl);
        var patchedSrc = dir.fileContent(fileName);
        var unpatchedSrc = this.unpatchSrc(patchedSrc);
        dir.writeFileNamed(fileName, unpatchedSrc);
    },
    
    findFirstRevision: function(fileName) {
        var url = this.repoUrl.toString();
        var fullUrl = url + fileName;
        var res = new SVNResource(url, Record.newPlainInstance({URL: fullUrl, Metadata: null, HeadRevision: null}));
        res.fetchMetadata(true, null);
    	timestamp = res.getMetadata().last();
    	var rev = timestamp.toString().match(/.*Revision (.*)/)[1];
        return Number(rev);
    },
    
    patchSrc: function(src, revision) {
        return src.replace(this.findLinks, '$1"' + this.repoUrl.toString() + '!svn/bc/' + revision + '/' + '$3"');
    },
    
    unpatchSrc: function(src) {
        return src.replace(this.findLinks, '$1"$3"');
    },
});

PanelMorph.subclass('LatestWikiChangesListPanel', {

	documentation: 'Just a hack for deserializing my widget',

	urlString: URL.source.getDirectory().toString(),
	
	onDeserialize: function($super) {
	//	$super();
        // FIXME
		var widget = new LatestWikiChangesList(new URL(this.urlString));
        this.owner.targetMorph = this.owner.addMorph(widget.buildView(this.getExtent()));
        this.owner.targetMorph.setPosition(this.getPosition());
        this.remove();
		widget.searchForNewestFiles();
    }

});

Widget.subclass('LatestWikiChangesList', {

    viewTitle: "Latest changes",

    initialViewExtent: pt(280, 210),

	formals: ["URL", "DirectoryContent", "Filter", "VersionList", "VersionSelection"],

	defaultFilter: /^.*xhtml$/,

	maxListLength: 50,

	initialize: function(url) {
		var model = Record.newPlainInstance({URL: url, DirectoryContent: [], Filter: this.defaultFilter, VersionList: [], VersionSelection: null});
		this.relayToModel(model, {URL: "-URL", DirectoryContent: "DirectoryContent", Filter: "Filter", VersionList: "VersionList", VersionSelection: "VersionSelection"});
	},

	buildView: function(extent) {
		var panel;
		panel = new LatestWikiChangesListPanel(extent);
		panel = PanelMorph.makePanedPanel(extent, [
			['refreshButton', function(initialBounds){return new ButtonMorph(initialBounds)}, new Rectangle(0, 0, 0.5, 0.1)],
			['filterButton', function(initialBounds){return new ButtonMorph(initialBounds)}, new Rectangle(0.5, 0, 0.5, 0.1)],
			['versionList', newRealListPane, new Rectangle(0, 0.1, 1, 0.9)]
		], panel);

		var m;
		var model = this.getModel();
		
		m = panel.refreshButton;
		m.setLabel("Refresh");
		m.buttonAction(this.refresh, this);

		m = panel.filterButton;
		m.setLabel("Filename filter");
		m.buttonAction('filterDialog', this);

		m = panel.versionList;
		m.connectModel(model.newRelay({List: "-VersionList", Selection: "+VersionSelection"}));

		panel.urlString = this.getURL().toString(); // FIXME For serialization
		
		return panel;
	},

	notify: function(msg) { // to let the user now what's goin on
			this.setVersionList([msg]);
	},

	versionListHasOnlyNotifications: function() {
		var l = this.getVersionList();
		if (l.length !== 1) return false;
		return !l.first().isListItem // notifications are just strings...
	},

	searchForNewestFiles: function() {
		this.notify('Please wait, fetching data');
		var request = new NetRequest({model: this,  setResponseXML: 'onDirectoryContentUpdate'})
		request.propfind(this.getURL().toString(), 'infinity')
	},
	
	onDirectoryContentUpdate: function(propfindXML) {
		this.notify('Please wait, extracting version infos');

		// extract
		var rawNodes = new Query("/D:multistatus/D:response").findAll(propfindXML.documentElement);
		var baseUrl = this.getURL();
		var colItems = rawNodes.map(function(rawNode) { return new lively.Storage.CollectionItem(rawNode, baseUrl) });

		// filter and sort
		colItems = colItems.select(function(ea) { return ea.shortName().match(this.getFilter()) }, this);
		var	list = colItems
			.collect(function(ea) { return this.createListItemFor(ea) }, this)
			.sort(function(a,b) { return b.value.versionInfo.rev - a.value.versionInfo.rev })
			.slice(0, this.maxListLength);

		this.setVersionList(list);
	},
	
	createListItemFor: function(colItem) {
		var versionInfo = colItem.asSVNVersionInfo();
		return {
			isListItem: true,
			string: colItem.shortName() + ' (' + versionInfo.rev + ' -- ' + versionInfo.author + ')',
			value: {
				colItem: colItem,
				versionInfo: versionInfo,
				urlString: colItem.toURL().toString()
			}
		};
	},
	
	refresh: function() {
		this.searchForNewestFiles();
	},
	
	filterDialog: function() {
		var world = WorldMorph.current();
		var cb = function(input) {
			var regexp;
			try { regexp = eval(input) } catch(e) {};
			if (!(regexp instanceof RegExp)) {
				world.prompt('Invalid regular expression!', cb, input);
				return;
			}
			this.setFilter(regexp);
			this.searchForNewestFiles();
		}.bind(this);
		world.prompt('Change the regular expression', cb, this.getFilter().toString());
	},

	onFilterUpdate: Functions.Null,
	
	onVersionSelectionUpdate: function(listItem) {
		if (WikiNavigator && WikiNavigator.current) {
			WikiNavigator.current.askToNavigateToUrl(listItem.urlString, true);
			return;
		}
		console.warn('No WikiNavigator active');
	},
	
	onVersionListUpdate: Functions.Null,

});
Dialog.subclass('UserRegistrationDialog', {

	formals: ["+Username", "+Password", "+PasswordConfirmed", "+Fullname", "+Email", "-Cancelled", "-Confirmed"],
    initialViewExtent: pt(350, 150),

    initialize: function($super, plug) {
		if (!plug) {
			var model = Record.newPlainInstance({Username: null, Password: null, PasswordConfirmed: null, Fullname: null, Email: null, Cancelled: null, Confirmed: null});
			plug = Relay.newInstance({Cancelled: '-Cancelled', Confirmed: '-Confirmed'}, model);
		}
		$super(plug);
    },

    openIn: function($super, world, position) {
	    var view = $super(world, position);
        world.firstHand().setKeyboardFocus(view.targetMorph.submorphs[1]);
	    return view;
    },
    
    buildView: function(extent, model) {
        var panel = new PanelMorph(extent);
        this.panel = panel;
        panel.linkToStyles(["panel"]);

		var height = 20;
		var mid = extent.x/2;
		var startPos = pt(this.inset, this.inset);

		this.buildLabelAndTextInput('Username:', 'Username', startPos, mid, height);
		startPos = startPos.addXY(0, height + this.inset);
		this.buildLabelAndTextInput('Password:', 'Password', startPos, mid, height);
		startPos = startPos.addXY(0, height + this.inset);
		//this.buildLabelAndTextInput('Repeat Password:', 'PasswordConfirmed', startPos, mid, height);
		//startPos = startPos.addXY(0, height + this.inset);
		this.buildLabelAndTextInput('email:', 'Email', startPos, mid, height);
		startPos = startPos.addXY(0, height + this.inset*2);

		var r = new Rectangle(mid - 55 - this.inset/2, startPos.y, 55, 30);
        var yesButton = panel.addMorph(new ButtonMorph(r)).setLabel("Confirm");
        yesButton.connectModel(this.getModel().newRelay({Value: 'Confirmed'}));

		r = new Rectangle(mid + this.inset/2, startPos.y, 55, 30);
        var noButton = panel.addMorph(new ButtonMorph(r)).setLabel("Cancel");
        noButton.connectModel(this.getModel().newRelay({Value: 'Cancelled'}));
        
        return panel;
    },

buildLabelAndTextInput: function(label, modelField, startPos, mid, height) {
		var r = new Rectangle(startPos.x, startPos.y, mid, height);
		this.panel.addMorph(new TextMorph(r, label).beLabel());

		r = new Rectangle(mid, startPos.y, mid-this.inset, height);
		var input = this.panel.addMorph(new TextMorph(r));
		input.autoAccept = true;
		input.connectModel(this.getModel().newRelay({Text: modelField}));
},
onCancelledUpdate: function(val) {
	if (val) return; // Btn down
	this.removeTopLevel();
},
onConfirmedUpdate: function(val) {
	if (val) return; // Btn down
	var w = WorldMorph.current();
	if (!WikiNavigator || !WikiNavigator.current) {
		w.alert('We are not in the wiki!');
		this.removeTopLevel();
		return;
	}
	var m = this.getModel();
	if (!m.getUsername() || !m.getPassword()) {
		w.alert('Enter username and password!');
		return;
	}
	WikiNavigator.current.registerUser(m.getUsername(), m.getPassword(), m.getFullname(), m.getEmail(),
		function() {w.alert('Successfully registered as ' + m.getUsername())},
		function() {w.alert('User ' + m.getUsername() + ' already exists!')}
	);
	console.log('test');
},


});
Object.subclass('WikiNetworkAnalyzer', {

	initialize: function(wikiURL) {
		this.url = wikiURL;
		this.worldProxies = [];
		this.updateLoopId = null;
	},

getWorldProxies: function() { return this.worldProxies },

findOrCreateProxy: function(url/*, force*/ /*to be compatible with existing data*/) {
	//if (!url.toString().endsWith('xhtml') && !force) return null;
	var wp = this.worldProxies.detect(function(proxy) { return proxy.getURL().toString() == url.toString() });
	if (wp) return wp;
	wp = new WikiWorldProxy(url, this.url);
	this.worldProxies.push(wp);
	return wp;
},
makeSVNResource: function(url) {
	return new SVNResource(this.url,
		Record.newPlainInstance({URL: url.toString(), HeadRevision: null, Metadata: null}));
},

fetchProxies: function(startRev, endRev, optCb) {
	if (!endRev)
		endRev = this.getWorldProxies().inject(0, function(rev, ea) {
		    if (ea.getVersions().length == 0) return rev;
			return Math.max(rev, ea.getVersions().first().rev);
		});
	// -------
	var r = this.makeSVNResource(this.url, this.url);
	var analyzer = this;
	r.getModel().addObserver({onHeadRevisionUpdate: function(headRevision) {
		if (!headRevision) return;
		if (headRevision == endRev) return;
		console.log('Looking for new versions between revs: ' + headRevision + '-' + (endRev+1));
		r.fetchMetadata(false, {"Depth":1} /*not working?*/, headRevision, endRev + 1, 1/*own depth*/);
	}});
	r.getModel().addObserver({onMetadataUpdate: function(metadata) {
		analyzer.scanLogAndCreateProxies(metadata);
		optCb && optCb();
	}});
	r.setRequestStatus = Functions.Null;
	if (startRev)
		r.setHeadRevision(startRev)
	else
		r.fetchHeadRevision();
},


scanLogAndCreateProxies: function(versionInfos) {
	var dict = versionInfos.inject({}, function(urlDict, ea) {
		if (!ea.url) return urlDict;
		if (!urlDict[ea.url]) urlDict[ea.url] = [];
		urlDict[ea.url].push(ea);
		return urlDict;
	});

	for (url in dict) {
		var wp = this.findOrCreateProxy(new URL(url));
		var newVersions = dict[url];
		/*if (wp.getVersions().length == 0 && newVersions.length == 0)
			continue;
		if (wp.getVersions().length == newVersions.length &&
			wp.getVersions().first().rev == newVersions.first().rev)
				continue;*/
		// console.log(wp.getVersions().first().rev + ' vs. ' + newVersions.first().rev);
		if (wp.getVersions().length == 0) {
			wp.setVersions(newVersions);
			continue;
		}
		if (newVersions.last().rev > wp.getVersions().first().rev) {
			wp.setVersions(newVersions.concat(wp.getVersions()));
			continue;
		}
		newVersions = newVersions.inject(wp.getVersions(), function(all, ea) {
			if (all.detect(function(existing) { return existing.rev == ea.rev }))
				return all;
			return [ea].concat(all);
		});
		newVersions = newVersions.sort(function(a,b) { return b.rev-a.rev });
		wp.setVersions(newVersions);
	}
},

fetchVersionsOfWorld: function(worldProxy) {
	var r = this.makeSVNResource(worldProxy.getURL());
	r.getModel().addObserver({onHeadRevisionUpdate: function(headRevision) {
		if (!headRevision) return;
		r.fetchMetadata(false, null, headRevision);
	}});
	r.getModel().addObserver({onMetadataUpdate: function() {
		worldProxy.setVersions(r.getMetadata());
	}});
	r.setRequestStatus = Functions.Null;
    r.fetchHeadRevision();
},

fetchFileList: function(callback) {
	var url = this.url;
	var self = this;
	var model = Record.newPlainInstance({DirectoryList: [], RootNode: url});
	model.addObserver(
		{onDirectoryListUpdate: function(urls) {
			urls = urls
				//.collect(function(ea) { url.withFilename(ea.shortName()) })
				.select(function(ea) { return ea.isLeaf() });
			var proxies = urls.collect(function(ea) { return self.findOrCreateProxy(ea) });
			callback && callback(urls, proxies);
			}},
		{DirectoryList: '!DirectoryList'});
	var fetcher = new lively.Storage.WebFile(model);
	fetcher.fetchContent(url);
},

// ------------ move to worldproxy ----------------------
extractLinksFromDocument: function(doc) {
	return new LinkExtractor().extractLinksFromDocument(doc);
},

findOrCreateProxiesForLinksIn: function(worldDocument) {
	return this.extractLinksFromDocument(worldDocument).inject([], function(all, linkUrl) {
		var proxy = this.findOrCreateProxy(linkUrl);
		if (proxy) all.push(proxy);
		return all;
	}, this);
},

fetchLinksOfWorld: function(worldProxy, optCb /*not needed anymore?!*/) {
		var r = new Resource(Record.newPlainInstance({URL: worldProxy.getURL().toString(), ContentDocument: null}));
	r.getModel().addObserver({onContentDocumentUpdate: function(doc) {
		if (!doc) { console.log('No doc??!'); return; }
		worldProxy.setExisting(true);
		this.addLinksOfWorld(worldProxy, doc);
		optCb && optCb(this);
	}.bind(this)});
	r.setRequestStatus = function(status) { if (status.code() >= 300) worldProxy.setExisting(false); }; // ignore errors
	r.fetch();
},
addLinksOfWorld: function(worldProxy, worldDoc) {
	if (!this.worldProxies.include(worldProxy)) this.worldProxies.push(worldProxy);
	worldProxy.setLinks(this.findOrCreateProxiesForLinksIn(worldDoc));
},
toExpression: function() {
	// it is enough to serialize the proxies, I don't have state
	return this.getWorldProxies().inject('', function(expression, ea) { return expression + '\n' + ea.toExpression() });
},
writeStateToFile: function() {
	var url = URL.source.withFilename('CachedWorldMetaData');
	new NetRequest().put(url, this.toExpression());
},
readStateFromFile: function(optCb) {
	var url = URL.source.withFilename('CachedWorldMetaData');
	var r = new NetRequest({
		setStatus: "read",
		model: {read: function() {
			if (r.getStatus().code() < 400) {
				console.log('Sucessfully read CachedWorldMetaData');
				eval(r.getResponseText());
			};
			optCb && optCb()
		}}});
	r.get(url);
},
stopUpdateLoop: function() {
	if (!this.updateLoopId) {
		console.log('No updateLoopId found. Doing nothing.');
		return
	}
	console.log('Stopping update loop for ' + this.url.toString());
	Global.window.clearInterval(this.updateLoopId);
},





});

Object.extend(WikiNetworkAnalyzer, {
	forRepo: function(repoUrl) {
		var instance;
		if (WikiNetworkAnalyzer.instances) {
			instance = WikiNetworkAnalyzer.instances.detect(function(ea) {
				return ea.url.toString() == repoUrl.toString()
			});
			if (instance) return instance;
			instance = new WikiNetworkAnalyzer(repoUrl);
			WikiNetworkAnalyzer.instances.push(instance)
			return instance;
		}
		instance = new WikiNetworkAnalyzer(repoUrl);
		WikiNetworkAnalyzer.instances = [instance];
		return  instance;
	},
startUp: function(url) {
	var a = WikiNetworkAnalyzer.forRepo(url);
	var afterReading = function() {
		WikiWorldNodeMorph.lookForNewFiles(null, url);
		NodeMorph.all().forEach(function(ea) { ea.manuallyUpdateVersions() });
		(function() { WikiNetworkAnalyzer.startUpdateLoop(url); }).delay(0);
	}
	a.readStateFromFile(afterReading);
},

	startUpdateLoop: function(repoUrl) {
		// FIXME use SchedulableAction!
		console.log('Updating for news from wiki...');
		var analyzer = WikiNetworkAnalyzer.forRepo(repoUrl);
		analyzer.updateLoopId = Global.window.setInterval(
			function() {WikiNetworkAnalyzer.updateOnce(analyzer)}, 1000*6);
	},
	
	updateOnce: function(analyzer) {
		var worldCount = analyzer.getWorldProxies().length;
		// look for new versions in repo, create proxies if a new world was created
		// and update existing proxies
		var cb = function() {
			if (analyzer.getWorldProxies().length == worldCount) return;
			WikiWorldNodeMorph.lookForNewFiles(analyzer.getWorldProxies().slice(worldCount), analyzer.url);
		}
		analyzer.fetchProxies(null, null, cb);		
	}
});

Object.subclass('LinkExtractor', {

	documentation: 'Extracts Link URLs from a document',

	urlQuery: new Query("/descendant::*[@family='URL']"),
	attributeQuery: new Query('//*[@name="textStyle"]'),

extractLinksFromDocument: function(doc) {
	/*var strings = this.textQuery.findAll(doc).inject([], function(all, ea) {
		return all.concat(this.extractLinksFromString(ea));
	}, this);*/
	strings = this.attributeQuery.findAll(doc).inject([], function(all, ea) {
		return all.concat(this.extractLinksFromField(ea));
	}, this);
	strings = strings.concat(this.urlQuery.findAll(doc).collect(function(ea) {
		return this.extractLinkFromUrlNode(ea);
	}, this));
	var urls = strings.uniq().inject([], function(all, string) {
		try {
			var url = URL.ensureAbsoluteURL(string);
		} catch(e) {
			console.log('Couldn\'t create URL from ' + string);
			return urls;
		}
		if (this.url)
			if (!url.toString().startsWith(this.url.toString())) return all;
		if (url.isLeaf()) all.push(url);
		return all;
	}, this);		
	//console.log('Extracted: ' + urls);
	return urls;
},
extractLinkFromUrlNode: function(node) {
	return Class.forName('URL').fromLiteral(JSON.unserialize(node.textContent)).toString();
},
extractLinksFromField: function(field) {
	var regExFindAllLinks = /\"link\"\:\"[^\"]+\"/g;
	var regExExtractLink = /\"link\":\"([^\"]+)\"/;
	var fieldText = field.textContent;
	var linkProperties = fieldText.match(regExFindAllLinks);
	if (!linkProperties) return [];
	return linkProperties.collect(function(ea) { return ea.match(regExExtractLink)[1] });
},

});

Widget.subclass('WikiWorldProxy', {
formals: ["URL", "RepoURL", "Links", "Existing", "Versions"],
initialize: function(url, repourl) {
	var model = Record.newPlainInstance({URL: url, RepoURL: repourl, Links: [], Existing: true /*always be optimistic*/, Versions: []});
	this.relayToModel(model, {URL: "URL", RepoURL: "RepoURL", Links: "Links", Existing: "Existing", Versions: "Versions"});
},
makeSVNResource: function() {
	return new SVNResource(this.getRepoURL(),
		Record.newPlainInstance({
			URL: this.getURL().toString(),
			ContentDocument: null,
			HeadRevision: null,
			Metadata: null}));
},
getDocument: function() {
	var r = this.makeSVNResource();
	r.fetch(true);
	return r.getContentDocument();
},


findLinksToOtherWorlds: function() {
	var analyzer = WikiNetworkAnalyzer.forRepo(this.getRepoURL());
	analyzer.fetchLinksOfWorld(this);
},
findVersions: function() {
	var analyzer = WikiNetworkAnalyzer.forRepo(this.getRepoURL());
	analyzer.fetchVersionsOfWorld(this);
},
onLinksUpdate: function(links) {},
onExistingUpdate: function(exists) {},
onVersionsUpdate: function(versions) {},
getNamesOfLinkedWorlds: function(worldProxies) {
	return this.getLinks().collect(function(ea) { return ea.localName() });
},
getChangeSet: function() {
	var doc = this.getDocument();
	var worldElement = new Query('/descendant::*[@type="WorldMorph"]').findFirst(doc);
	return ChangeSet.fromWorld(worldElement);
},
getDocumentOfChangeSet: function(cs) {
	// in Webkit a ChangeSet still has an ownerDocument, in Safari not
	var codeElem = cs.getXMLElement();
    if (Exporter.stringify(codeElem.ownerDocument) !== '' &&
			codeElem.ownerDocument.getElementById('canvas')) // brittle test...
		return codeElem.ownerDocument;
    var doc = this.getDocument();
	// add current code element to doc
	var oldCodeElem = doc.getElementsByTagName('code')[0]; //cs.nodeQuery.findFirst(doc);
	if (!oldCodeElem)
		throw dbgOn(new Error('Cannot find code element in document. World has no ChangeSet?'))
	oldCodeElem.parentElement.replaceChild(
		doc.importNode(codeElem, true), oldCodeElem);
	return doc;
},

writeChangeSet: function(cs) {
	var doc = this.getDocumentOfChangeSet(cs);
	var content = Exporter.stringify(doc);
	var r = this.makeSVNResource();
	console.log('Writing ' + cs.getDefinition());
	r.store(content);
},

isDeleted: function() {
	var versions = this.getVersions();
	if (versions.length == 0)
		return false; //hmmm?
	var latest = this.getVersions().first();
	if (!latest.change) // no change  attribute there, we cannot be sure
		return false;
	return latest.change.endsWith('deleted');
},

localName: function() {
	if (!this.getURL())
		return 'No URL for WorldProxy!';
	return this.getURL().filename();
},
toString: function() {
	return Strings.format("#<WikiWorldProxy:%s>", this.localName());
},
id: function() {
	return this.getURL().toString();
},
toExpression: function() {
	var urls = this.getLinks().collect(function(ea) { return ea.getURL().toString() });
	return Strings.format('var a = WikiNetworkAnalyzer.forRepo(%s);' +
		'var wp = a.findOrCreateProxy(%s);' +
		'wp.setExisting(%s); wp.setVersions(%s);' + 
		'wp.setLinks(%s.collect(function(ea) {return a.findOrCreateProxy(new URL(ea)) }));' +
		'wp;',
		toExpression(this.getRepoURL()),
		toExpression(this.getURL()),
		toExpression(this.getExisting()),
		toExpression(this.getVersions()),
		toExpression(urls));
},

});

NodeMorph.subclass('WikiWorldNodeMorph', {

	initialize: function($super, url, optNewTime) {
		$super(new Rectangle(0,0, 20,20));
		this.url = url;
		var name = this.getWikiWorldProxy().localName();
		if (name.endsWith('.xhtml'))
			name = name.substr(0, name.length-'.xhtml'.length);
		this.addLabel(name);
		this.shouldCreateLinks = !this.isSpecialWorld();
		this.lastUpdated = 0;
		// ----
        var oldBorderColor = this.label.getBorderColor();
        this.label.applyStyle({borderColor: Color.green, borderWidth: 2});
        (function showNormal() { this.label.applyStyle({borderColor: oldBorderColor})}.bind(this)).delay(optNewTime || 60);
        //---- setup connection to proxy
        this.manuallyUpdateLinks();
	},

	onDeserialize: function($super) {
		$super();
		//this.initUpdateLinks();
	},
	
	isSpecialWorld: function() {
		return this.url.filename().startsWith('rk-wikiVis');
	},
	
	getWikiWorldProxy: function() {
		if (this.wikiWorldProxy)
			return this.wikiWorldProxy;
		var repoUrl = this.url.getDirectory();
		this.wikiWorldProxy = WikiNetworkAnalyzer.forRepo(repoUrl).findOrCreateProxy(this.url, true);
		this.wikiWorldProxy.getModel().addObserver(this, {Links: "!Links", Existing: "!Existing", Versions: "!Versions"});
		return this.wikiWorldProxy;
	},
initUpdateLinks: function() {
	this.lastUpdated = new Date();
	this.getWikiWorldProxy().findLinksToOtherWorlds();
	//this.getWikiWorldProxy().findVersions();
},

onLinksUpdate: function(linkProxies) {
	this.addNewLinks(linkProxies);
	this.removeOldLinks(linkProxies);
},
onExistingUpdate: function(exists) {
	if (!this.label) return;
    if (!exists)
     this.label.applyStyle({fill: Color.yellow, fillOpacity: 0.5, fontSize: 8});
    else
     this.label.applyStyle({fill: Color.white, fillOpacity: 1, fontSize: 9});
},
onVersionsUpdate: function(versions) {
    // if (versions.length == 0 && this.url.hostname == this.getWikiWorldProxy().getRepoURL().hostname)
    //     this.onExistingUpdate(false);
    // else
    //     this.onExistingUpdate(true);
	if (versions.length == 0) return;
	if (versions.first().change.endsWith('deleted')) {
		if (this.connectedNodes().length = 0) this.remove();
		this.getWikiWorldProxy().setExisting(false);
		return;
	}
	if (versions.length > 0 && versions.first().rev != this.lastUpdatedRev) {
		this.lastUpdatedRev = versions.first().rev;
		this.initUpdateLinks(); // hmmm
	}
	if (!this.label || versions.length == 0) return;
	var newStyle = {};
	if (versions.length > 100) 
		newStyle.fontSize = 14;
	else if (versions.length > 50)
		newStyle.fontSize = 12;
	else if (versions.length > 20)
		newStyle.fontSize = 11;
	else if (versions.length > 8)
		newStyle.fontSize = 10;
	else
		newStyle.fontSize = 9;
		
	var oneDay = 1000*60*60*24;
	var timeDiff = new Date() - versions.first().date;
	this.myTimeDiff = timeDiff/oneDay;
	/*if (timeDiff < oneDay)
		newStyle.textColor = Color.black;
	else if (timeDiff < oneDay*3)
		newStyle.textColor = Color.gray.darker(3);
	else if (timeDiff < oneDay*7)
		newStyle.textColor = Color.gray.darker(2);
	else //if (timeDiff < oneDay*14)
		newStyle.textColor = Color.gray.darker();*/
	var days = 60;
	if (timeDiff > days*oneDay) {
		newStyle.fill = NodeStyle.node.fill;
	} else {
		var saturation = timeDiff/(days*oneDay);
		newStyle.fill = new Color(1,saturation,saturation);
	}
		
	this.label.applyStyle(newStyle);
},
manuallyUpdateLinks: function() {
	this.onLinksUpdate(this.getWikiWorldProxy().getLinks());
},
manuallyUpdateVersions: function() {
	this.onVersionsUpdate(this.getWikiWorldProxy().getVersions());
},


addNewLinks: function(linkProxies) {
	if (!this.shouldCreateLinks) return;
	linkProxies.forEach(function(ea) {
		if (ea === this.getWikiWorldProxy())
			return;
		var node = this.findNodeForProxy(ea);
		if (!node) {
			node = WikiWorldNodeMorph.create(ea.getURL());
		}
		if (this.isConnectedTo(node)) {
			this.ensureConnectionToNodeIsVisible(node);
			return;
		}
		this.connectTo(node);
	}, this);
},
removeOldLinks: function(currentLinkProxies) {
	this.connectedNodes().forEach(function(node) {
		if (!node.url) return;
		if (currentLinkProxies.detect(function(proxy) { return proxy.getURL().toString() == node.url.toString() }))
			return; // proxy found, everything ok
		this.disconnect(node);
	}, this);
},
findNodeForProxy: function(proxy) {
	return this.findNodeMorphs().detect(function(ea) {
		return ea.getWikiWorldProxy && ea.getWikiWorldProxy() === proxy
	})
},

// makeStep: function($super) {
//  $super();
//  // if (this.energy == 0) {
//  //  this.lastUpdated = new Date(); // so that when energy is increased not all notes fetch new ones at once
//  //  return;
//  // }
//  // if (!this.lastUpdated || new Date() - this.lastUpdated > this.newUpdateIn) {
//  //  this.newUpdateIn = 2*60*1000 /*2 min*/ + Math.floor(Math.random()*1000*60) /*varies 1 min*/
//  //  this.initUpdateLinks();
//  // }
// },

connectTo: function($super, otherNode) {
    var con = $super(otherNode);
    
    var oldColor = con.getBorderColor()
    con.setCustomColor(Color.red);
	(function showNormal() {con.setCustomColor(oldColor)}).delay(40);
	
    return con;
},

getHelpText: function() {
	var text = this.getWikiWorldProxy().localName();
	var versions = this.getWikiWorldProxy().getVersions();
	var url = this.getWikiWorldProxy().getURL();
	if (versions && versions.length > 0) {
		text += Strings.format('\nlast author: %s\nlast edit: %s (%s)\n%s versions\n%s',
			versions.first().author, versions.first().date, versions.first().change, versions.length, url);
	} else {
		text += '\n' + url;
	}
		
	return text;
},
});

Object.extend(WikiWorldNodeMorph, {
	create: function(url) {
		var w = WorldMorph.current();
		var exisiting = w.submorphs.detect(function(ea) {
			return ea instanceof WikiWorldNodeMorph && ea.url.toString() == url.toString()
		});
		if (exisiting) return exisiting;
		var m = new WikiWorldNodeMorph(url, 40);
		m.openInWorld();
		m.startSteppingScripts(300, true);
		m.setPosition(WorldMorph.current().bounds().randomPoint());
		m.manuallyUpdateVersions();
		m.continouslyTryToPlaceNearConnectedNodes();
		return m;
	},
	lookForNewFiles: function(optProxies, repourl) {
		repourl = repourl || new URL('http://livelykernel.sunlabs.com/repository/lively-wiki/');
		var proxies = optProxies || WikiNetworkAnalyzer.forRepo(repourl).getWorldProxies();
		console.log('lookForNewFiles: ' + proxies.length + ' proxies');
		for (var i = 0; i < proxies.length; i++) {
			var ea = proxies[i];
			var versions = ea.getVersions();
			if (versions.length == 0) continue; // why are there proxies with zero versions??
			if (versions.first().change.endsWith('deleted')) // FIXME, as Version directly
				continue;
			var filename = ea.getURL().filename();

			if (filename.endsWith('.js') ||
					 			filename.endsWith('.txt') ||
					 			filename.endsWith('.htpasswd') ||
					filename.endsWith('.htaccess') ||
					 			filename.endsWith('.lkml') ||
					filename.endsWith('.jsp') ||
					filename.startsWith('._') ||
					 			filename == 'auth' || filename == 'logout' ||
					filename == 'CachedWorldMetaData' ||
					filename == 'Makefile' ||
					ea.getURL().hostname != repourl.hostname)
					 			    continue;
			//console.log('Create for ' + ea.getURL());
			WikiWorldNodeMorph.create(ea.getURL());
			//(function() {WikiWorldNodeMorph.create(ea.getURL())}).delay(Math.floor(Math.random()*40));
		};
		// 		(function() {WikiWorldNodeMorph.create(ea)}).delay(Math.floor(Math.random()*180));
		// WikiNetworkAnalyzer.forRepo(repourl).fetchFileList(cb);
	},
});

}) // end of module