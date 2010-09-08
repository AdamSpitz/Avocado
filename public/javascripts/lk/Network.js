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
 * Network.js.  Networking capabilities.
 *
 * Note: In a browser-based implementation of our system,
 * most of the necessary networking functionality is 
 * inherited from the browser.  
 */

module('lively.Network').requires().toRun(function(thisModule) {
	
Object.subclass('URL', {
    splitter: new RegExp('(http:|https:|file:)' + '(//[^/:]*(:[0-9]+)?)?' + '(/.*)?'),
    pathSplitter: new RegExp("([^\\?#]*)(\\?[^#]*)?(#.*)?"),
    
	initialize: function(/*...*/) { // same field names as window.location
		dbgOn(!arguments[0]);
		if (Object.isString(arguments[0].valueOf())) {
			var urlString = arguments[0];
			var result = urlString.match(this.splitter);
			if (!result) throw new Error("malformed URL string '" + urlString + "'");
			this.protocol = result[1]; 
			if (!result[1]) 
				throw new Error("bad url " + urlString + ", " + result);
			this.hostname = result[2] && result[2].substring(2).split(':')[0]; // skip the leading slashes and remove port
			this.port = result[3] && parseInt(result[3].substring(1)); // skip the colon

			var fullpath = result[4];
			if (fullpath) {
				result = fullpath.match(this.pathSplitter);
				this.pathname = result[1];
				this.search = result[2];
				this.hash = result[3];
			} else {
				this.pathname = "/";
				this.search = "";
				this.hash = "";
			}
		} else { // spec is either an URL or window.location
			var spec = arguments[0];
			this.protocol = spec.protocol || "http";
			this.port = spec.port;
			this.hostname = spec.hostname;
			this.pathname = spec.pathname || "";
			if (spec.search !== undefined) this.search = spec.search;
			if (spec.hash !== undefined) this.hash = spec.hash;
		}
	},
    
	inspect: function() {
		return JSON.serialize(this);
	},
    
	toString: function() {
		return this.protocol + "//" + this.hostname + (this.port ? ":" + this.port : "") + this.fullPath();
	},

	fullPath: function() {
		return this.pathname + (this.search || "") + (this.hash || "");
	},
    
	isLeaf: function() {
		return !this.fullPath().endsWith('/');
	},
    
	// POSIX style
	dirname: function() {
		var p = this.pathname;
		var slash = p.endsWith('/') ? p.lastIndexOf('/', p.length - 2) : p.lastIndexOf('/');
		return p.substring(0, slash + 1);
	},

	filename: function() {
		var p = this.pathname;
		var slash = p.endsWith('/') ? p.lastIndexOf('/', p.length - 2) : p.lastIndexOf('/');
		return p.substring(slash + 1);
	},

	normalizedHostname: function() {
		return this.hostname.replace(/^www\.(.*)/, '$1');
	},
	
	getDirectory: function() {
		return this.withPath(this.dirname());
	},

	withPath: function(path) { 
		var result = path.match(this.pathSplitter);
		if (!result) return null;
		return new URL({protocol: this.protocol, port: this.port, hostname: this.hostname, pathname: 
			result[1], search: result[2], hash: result[3] });
	},

	withRelativePath: function(pathString) {
		if (pathString.startsWith('/')) {
			if (this.pathname.endsWith('/'))
				pathString = pathString.substring(1);
		} else {
			if (!this.pathname.endsWith('/'))
				pathString = "/" + pathString;
		}
		return this.withPath(this.pathname + pathString);
	},
    
	withFilename: function(filename) {
		if (filename == "./" || filename == ".") // a bit of normalization, not foolproof
		filename = "";
		var dirPart = this.isLeaf() ? this.dirname() : this.fullPath();
		return new URL({protocol: this.protocol, port: this.port, 
			hostname: this.hostname, pathname: dirPart + filename});
	},

	toQueryString: function(record) {
		var results = [];
		Properties.forEachOwn(record, function(p, value) {
			results.push(encodeURIComponent(p) + "=" + encodeURIComponent(String(value)));
		});
		return results.join('&');
	},

	withQuery: function(record) {
		return new URL({protocol: this.protocol, port: this.port, hostname: this.hostname, pathname: this.pathname,
			search: "?" + this.toQueryString(record), hash: this.hash});
	},
    
	withoutQuery: function() {
		return new URL({protocol: this.protocol, port: this.port, hostname: this.hostname, pathname: this.pathname});
	},

	getQuery: function() {
		var s = this.toString();
		if (!s.include("?"))
			return {};
		return s.toQueryParams();
	},
	
	eq: function(url) {
		if (!url) return false;
		return url.protocol == this.protocol && url.port == this.port && url.normalizedHostname() == this.url.normalizedHostname()
			&& url.pathname == this.pathname && url.search == this.search && url.hash == this.hash;
	},

	relativePathFrom: function(origin) {
		if (!this.pathname.startsWith(origin.pathname)  || origin.normalizedHostname() != this.normalizedHostname())
			throw new Error('bad origin ' + origin + ' vs ' + this);
		return this.pathname.substring(origin.pathname.length);
	},

	svnWorkspacePath: function() {
		// heuristics to figure out the Subversion path
		var path = this.pathname;
		// note that the trunk/branches/tags convention is only a convention
		var index = path.lastIndexOf('trunk');
		if (index < 0) index = path.lastIndexOf('branches');
		if (index < 0) index = path.lastIndexOf('tags');
		if (index < 0) return null;
		return path.substring(index);
	},

	svnVersioned: function(repo, revision) {
		var relative = this.relativePathFrom(repo);
		return repo.withPath(repo.pathname + "!svn/bc/" + revision + "/" + relative);
	},
    
	notSvnVersioned: function() {
		// concatenates the two ends of the url
		// "http://localhost/livelyBranch/proxy/wiki/!svn/bc/187/test/index.xhtml"
		// --> "http://localhost/livelyBranch/proxy/wiki/index.xhtml"
		return this.withPath(this.fullPath().replace(/(.*)!svn\/bc\/[0-9]+\/(.*)/, '$1$2'));
	},

	toLiteral: function() {
		// URLs are literal
		return Object.clone(this);
	},
    
	toExpression: function() {
		// this does not work with the new prototype.js (rev 2808) anymore
		// return 'new URL(JSON.unserialize(\'' + JSON.serialize(this) + '\'))';
		return Strings.format('new URL({protocol: "%s", hostname: "%s", pathname: "%s"})',
			this.protocol, this.hostname, this.pathname);
	},

	withRelativePartsResolved: function() {
		var urlString = this.toString();
		var result = urlString;
		do {
			urlString = result;
			result = urlString.replace(/\/[^\/]+\/\.\./g, '')
			result = result.replace(/([^:])[\/]+/g, '$1/')
		} while(result != urlString)
		return new URL(result)
	},

});

// create URLs often needed
Object.extend(URL, {

	source: new URL(document.documentURI),

	codeBase: new URL(Config.codeBase).withRelativePartsResolved(),
})

Object.extend(URL, {
	proxy: (function() {
		if (!Config.proxyURL) {
			if (URL.source.protocol.startsWith("file")) 
				console.log("loading from localhost, proxying won't work");
			return URL.source.withFilename("proxy/");
		} else {
			var str = Config.proxyURL;
			if (!str.endsWith('/')) str += '/';
			return new URL(str);
		}
	})(),	
});

Object.extend(URL, {
	// FIXME: better names?
	common: {
		wiki:   URL.proxy.withFilename('lively-wiki/'),
		repository: URL.proxy.withFilename('lively-kernel/'),
		project: URL.proxy.withFilename('lively-project/'),  // currently lively-kernel.org
		domain: new URL(Global.document.location.protocol + '//' + Global.document.location.host)
	},
});

Object.extend(URL, {
	
	create: function(string) { return new URL(string) },

	ensureAbsoluteURL: function(urlString) {
		return /^http.*/.test(urlString) ?
		new URL(urlString) :
		URL.source.notSvnVersioned().getDirectory().withRelativePath(urlString);
	},

	fromLiteral: function(literal) { return new URL(literal) },

	makeProxied: function makeProxied(url) {
		url = url instanceof URL ? url : new URL(url);
		var px = this.proxy;
		if (!px) return url;
		if (px.normalizedHostname() != url.normalizedHostname()) // FIXME  protocol?
			return px.withFilename(url.hostname + url.fullPath());
		if (px.port != url.port)
			return px.withFilename(url.hostname + "/" + url.port + url.fullPath());
		if (px.hostname != url.hostname) // one has prefix www, the other not
			return new URL({
				protocol: url.protocol,
				port: url.port,
				hostname: px.hostname, // arghhh
				pathname: url.pathname,
				search: url.search,
				hash: url.hash
			})
		return url;
	},

});


Object.subclass('NetRequestStatus', {
	documentation: "nice parsed status information, returned by NetRequest.getStatus when request done",

	initialize: function(method, url, transport) {
		this.method = method;
		this.url = url;
		this.transport = transport;
		this.exception = null;
	},

	isSuccess: function() {
		var code = this.transport.status;
		return code >= 200 && code < 300;
	},

	setException: function(e) {
		this.exception = e;
	},

	toString: function() {
		return Strings.format("#<NetRequestStatus{%s,%s,%s}>", this.method, this.url, this.exception || this.transport.status);
	},

	requestString: function() {
		return this.method + " " + decodeURIComponent(this.url);
	},

	code: function() {
		return this.transport.status;
	},

	getResponseHeader: function(name) {
		return this.transport.getResponseHeader(name);
	}

});


View.subclass('NetRequest', {
	documentation: "a view that writes the contents of an http request into the model",

	// see XMLHttpRequest documentation for the following:
	Unsent: 0,
	Opened: 1,
	HeadersReceived: 2,
	Loading: 3,
	Done: 4,

	formals: ["+Status",  // Updated once, when request is {Done} with the value returned from 'getStatus'.
		"+ReadyState", // Updated on every state transition of the request.
		"+ResponseXML", // Updated at most once, when request state is {Done}, with the parsed XML document retrieved.
		"+ResponseText", // Updated at most once, when request state is {Done}, with the text content retrieved.
		"StreamContent",
		"Progress",
	],

	initialize: function($super, modelPlug) {
		this.transport = new XMLHttpRequest();
		this.requestNetworkAccess();
		this.transport.onreadystatechange = this.onReadyStateChange.bind(this);
		// FIXME onprogress leads to strange 101 errors when no internet connection available
		// this.transport.onprogress = this.onProgress.bind(this);
		// if (!UserAgent.isTouch) // FIXME crashes Mobile Safari
		// 	this.transport.upload.onprogress = this.onProgress.bind(this);
		this.isSync = false;
		this.requestHeaders = {};
		$super(modelPlug)
	},

	requestNetworkAccess: function() {
		if (Global.netscape && Global.location.protocol == "file:") {       
			try {
				netscape.security.PrivilegeManager.enablePrivilege("UniversalBrowserRead");
				console.log("requested browser read privilege");
				return true;
			} catch (er) {
				console.log("no privilege granted: " + er);
				return false;
			}
		}
	},

	beSync: function() {
		this.isSync = true;
		return this;
	},

	onReadyStateChange: function() {
		this.setReadyState(this.getReadyState());
		if (this.getReadyState() === this.Loading) { // For comet networking
			this.setStatus(this.getStatus());
			if (this.transport.responseText) {
				var allContent = this.getResponseText();
				var newStart = this._streamContentLength ? this._streamContentLength : 0;
				var newContent = allContent.substring(newStart);
				newContent = /^([^\n\r]*)/.exec(newContent)[1]; // remove line breaks
				this.setStreamContent(newContent);
				this._streamContentLength = allContent.length;
			}
				
		}
		if (this.getReadyState() === this.Done) {
			this.setStatus(this.getStatus());
			if (this.transport.responseText) 
				this.setResponseText(this.getResponseText());
			if (this.transport.responseXML) 
				this.setResponseXML(this.getResponseXML());
			this.disconnectModel(); // autodisconnect?
		}
	},

	onProgress: function(progress) { this.setProgress(progress) },
	
	setRequestHeaders: function(record) {
		Properties.forEachOwn(record, function(prop, value) {
			this.requestHeaders[prop] = value;
		}, this);
	},

	setContentType: function(string) {
		// valid before send but after open?
		this.requestHeaders["Content-Type"] = string;
	},

	getReadyState: function() {
		return this.transport.readyState;
	},

	getResponseText: function() {
		return this.transport.responseText || "";
	},

	getResponseXML: function() {
		return this.transport.responseXML || "";
	},

	getStatus: function() {
		return new NetRequestStatus(this.method, this.url, this.transport);
	},

	request: function(method, url, content) {
		try {
			this.url = url;
			this.method = method.toUpperCase();	    
			this.transport.open(this.method, url.toString(), !this.isSync);
			Properties.forEachOwn(this.requestHeaders, function(p, value) {
				this.transport.setRequestHeader(p, value);
				}, this);
			this.transport.send(content || '');
			return this;
		} catch (er) {
			var status = this.getStatus();
			status.setException(er);
			this.setStatus(status);
			throw er;
		}
	},

	get: function(url) {
		return this.request("GET", URL.makeProxied(url), null);
	},

	put: function(url, content) {
		return this.request("PUT", URL.makeProxied(url), content);
	},

	post: function(url, content) {
		return this.request("POST", URL.makeProxied(url), content);
	},

	propfind: function(url, depth, content) {
		this.setContentType("text/xml"); // complain if it's set to something else?
		if (depth != 0 && depth != 1)
			depth = "infinity";
		this.setRequestHeaders({ "Depth" : depth });
		return this.request("PROPFIND", URL.makeProxied(url), content);
	},

	report: function(url, content) {
		return this.request("REPORT", URL.makeProxied(url), content);
	},

	mkcol: function(url, content) {
		return this.request("MKCOL", URL.makeProxied(url), content);
	},

	del: function(url) {
		return this.request("DELETE", URL.makeProxied(url));
	},

	copy: function(url, destUrl, overwrite) {
		this.setRequestHeaders({ "Destination" : destUrl.toString() });
		if (overwrite) this.setRequestHeaders({ "Overwrite" : 'T' });
		return this.request("COPY", URL.makeProxied(url));
	},

	lock: function(url, owner) {
		this.setRequestHeaders({Timeout: 'Infinite, Second-30'});
		var content = Strings.format('<?xml version="1.0" encoding="utf-8" ?> \n\
		<D:lockinfo xmlns:D=\'DAV:\'> \n\
		<D:lockscope><D:exclusive/></D:lockscope> \n\
		<D:locktype><D:write/></D:locktype> \n\
		<D:owner>%s</D:owner> \n\
		</D:lockinfo>', owner || 'unknown user');
		return this.request("LOCK", URL.makeProxied(url), content);
	},
	
	unlock: function(url, lockToken, force) {
		if (force) {
			var req = new NetRequest().beSync().propfind(url);
			var xml = req.getResponseXML() || stringToXML(req.getResponseText());
			var q = new Query('/descendant::*/D:lockdiscovery/descendant::*/D:locktoken/D:href');
			var tokenElement = q.findFirst(xml);
			if (!tokenElement) // no lock token, assume that resource isn't locked
			return req;
			lockToken = tokenElement.textContent;
		}
		this.setRequestHeaders({'Lock-Token': '<' + lockToken + '>'});
		return this.request("UNLOCK", URL.makeProxied(url));
	},


	toString: function() {
		return "#<NetRequest{"+ this.method + " " + this.url + "}>";
	},

});


// extend your objects with this trait if you don't want to deal with error reporting yourself.
NetRequestReporterTrait = {
	setRequestStatus: function(status) {
		// update the model if there is one
		if (this.getModel && this.getModel() && this.getModel().setRequestStatus)
			this.getModel().setRequestStatus(status);
		
		var world = WorldMorph.current();
		// some formatting for alerting. could be moved elsewhere
		var request = status.requestString();
		var tooLong = 80;
		if (request.length > tooLong) {
			var arr = [];
			for (var i = 0; i < request.length; i += tooLong) {
				arr.push(request.substring(i, i + tooLong));
			}
			request = arr.join("..\n");
		}
		// error reporting
		if (status.exception) {
			world.alert("exception " + status.exception + " accessing\n" + request);
		} else if (status.code() >= 300) {
			if (status.code() == 301) {
				// FIXME reissue request? need the 'Location' response header for it
				world.alert("HTTP/301: Moved to " + status.getResponseHeader("Location") + "\non " + request);
			} else if (status.code() == 401) {
				world.alert("not authorized to access\n" + request); 
				// should try to authorize
			} else if (status.code() == 412) {
				console.log("the resource was changed elsewhere\n" + request);
			} else if (status.code() == 423) {
				world.alert("the resource is locked\n" + request);
			} else {
				world.alert("failure to\n" + request + "\ncode " + status.code());
			}
		} else  console.log("status " + status.code() + " on " + status.requestString());
	}
};

// convenience base class with built in handling of errors
Object.subclass('NetRequestReporter', NetRequestReporterTrait);

Importer.subclass('NetImporter', NetRequestReporterTrait, {
	onCodeLoad: function(error) {
		if (error) WorldMorph.current().alert("eval got error " + error);
	},

	pvtLoadCode: function(responseText) {
		try {
			eval(responseText); 
		} catch (er) {
			this.onCodeLoad(er);
			return;
		}
		this.onCodeLoad(null);
	},

	loadCode: function(url, isSync) {
		var req = new NetRequest({model: this, setResponseText: "pvtLoadCode", setStatus: "setRequestStatus"});
		if (isSync) req.beSync();
		req.get(url);
	},

	onWorldLoad: function(world, error) {
		if (error) WorldMorph.current().alert("doc got error " + error);
	},

	pvtLoadMarkup: function(doc) {
		var world;
		try {
			world = this.loadWorldContents(doc);
		} catch (er) {
			this.onWorldLoad(null, er);
			return;
		}
		this.onWorldLoad(world, null);
	},

	loadMarkup: function(url, isSync) {
		var req = new NetRequest({model: this, setStatus: "setRequestStatus", setResponseXML: "pvtLoadMarkup"});
		if (isSync) req.beSync();
		req.get(url);
	},

	loadElement: function(filename, id) {
		var result;
		this.processResult = function(doc) {
			var elt = doc.getElementById(id);
			if (elt) {
				var canvas = document.getElementById("canvas"); // note, no error handling
				var defs = canvas.getElementsByTagName("defs")[0];
				result = defs.appendChild(document.importNode(elt, true));
			}
		}
		var url = URL.source.withFilename(filename);
		new NetRequest({model: this, setStatus: "setRequestStatus", setResponseXML: "processResult"}).beSync().get(url);
		return result;
	}

});


View.subclass('Resource', NetRequestReporterTrait, {
	documentation: "a remote document that can be fetched, stored and queried for metadata",
	// FIXME: should probably encapsulate content type

	formals: ["ContentDocument", //:XML
		"ContentText", //:String
		"URL", // :URL
		"RequestStatus", // :NetRequestStatus
		"Progress",
	],

	initialize: function(plug, contentType) {
		this.contentType  = contentType;
		this.connectModel(plug);
	},

	deserialize: Functions.Empty, // stateless besides the model and content type

	toString: function() {
		return "#<Resource{" + this.getURL() + "}>";
	},

	removeNetRequestReporterTrait: function() {
		delete this.setRequestStatus;
		this.setRequestStatus = function(status) {
			if (this.getModel && this.getModel() && this.getModel().setRequestStatus)
				this.getModel().setRequestStatus(status);
		}.bind(this);
	},
	
	updateView: function(aspect, source) {
		var p = this.modelPlug;
		if (!p) return;
		switch (aspect) {
			case p.getURL:
			this.onURLUpdate(this.getURL()); // request headers?
			break;
		}
	},

	onURLUpdate: function(url) {
		return this.fetch(url);
	},

	fetch: function(sync, optRequestHeaders) {
		// fetch the document content itself
		var req = new NetRequest(Relay.newInstance({
			ResponseXML: "+ContentDocument", 
			ResponseText: "+ContentText", 
			Status: "+RequestStatus",
			Progress: "+Progress"}, this));
		if (sync) req.beSync();
		if (this.contentType) req.setContentType(this.contentType);
		if (optRequestHeaders) req.setRequestHeaders(optRequestHeaders);
		req.get(this.getURL());
		return req;
	},

	fetchProperties: function(destModel, optSync, optRequestHeaders) {
		// fetch the metadata
		destModel = destModel || this.getModel().newRelay({Properties: "ContentDocument", PropertiesString: "ContentText", URL: "URL", Progress: 'Progress'});
		var req = new NetRequest(Relay.newInstance({ ResponseXML: "Document", Status: "+RequestStatus", Progress: '+Progress'}, 
			Object.extend(new NetRequestReporter(), {
				// FIXME replace with relay
				setDocument: function(doc) {
					destModel.setProperties(doc);
				}
			})));
		if (optSync) req.beSync();
		if (this.contentType) req.setContentType(this.contentType);
		if (optRequestHeaders) req.setRequestHeaders(optRequestHeaders);
		req.propfind(this.getURL(), 1);
		return req;
	},

	store: function(content, optSync, optRequestHeaders) {
		// FIXME: check document type
		if (Global.Document && content instanceof Document) {
			content = Exporter.stringify(content);
		} else if (Global.Node && content instanceof Node) {
			content = Exporter.stringify(content);
		}
		var req = new NetRequest(Relay.newInstance({Status: "+RequestStatus", Progress: '+Progress'}, this));
		if (optSync) req.beSync();
		if (this.contentType) req.setContentType(this.contentType);
		if (optRequestHeaders) req.setRequestHeaders(optRequestHeaders);
		req.put(this.getURL(), content);
		return req;
	},

	findAll: function(query, defaultValue) {
		var content = this.getContentDocument();
		if (!content) return defaultValue;
		return query.findAll(content.documentElement, defaultValue);
	},


	fetchHeadRevision: function(destModel) {
		var req = new NetRequest(Relay.newInstance({ResponseXML: "+Document", Status: "+RequestStatus", Progress: '+Progress'}, 
		Object.extend(new NetRequestReporter(), { 
			setDocument: function(xml) {
				if (!xml) return;
				/* The response contains the properties of the specified file or directory,
				e.g. the revision (= version-name) */
				var revisionNode = xml.getElementsByTagName('version-name')[0];
				if (!revisionNode) 
					return;
				var number = Number(revisionNode.textContent);
				destModel.setHeadRevision(number);
			}
		})));

		req.propfind(this.getURL(), 1);
		return req;
	},

	logReportTemplate: '<S:log-report xmlns:S="svn:">' + 
		'<S:start-revision>%s</S:start-revision>' +
		'<S:end-revision>%s</S:end-revision>' +
		'<S:all-revprops/>' +
		'<S:path/>' +
		'</S:log-report>',

	fetchVersionHistory: function(mostRecentRev, leastRecentRev, destModel) {
		var req = new NetRequest(Relay.newInstance({ResponseXML: "+Document", Status: "+RequestStatus", Progress: '+Progress'},
		Object.extend(new NetRequestReporter(), {
			setDocument: function(doc) {
				destModel.setRevisionHistory(doc);
			}
		})));

		req.report(this.getURL(), 
		Strings.format(this.logReportTemplate, mostRecentRev, leastRecentRev));
		return req;
	}

});

Resource.subclass('SVNResource', {

	formals: Resource.prototype.formals.concat(['Metadata', 'HeadRevision']),

	initialize: function($super, repoUrl, plug, contentType) {
		this.repoUrl = repoUrl.toString();
		$super(plug, contentType);
	},

	getLocalUrl: function() {
		return this.getURL().slice(this.repoUrl.length + (this.repoUrl.endsWith('/') ? 0 : 1));
	},

	fetchHeadRevision: function(optSync) {
		this.setHeadRevision(null); // maybe there is a new one
		var req = new NetRequest({
			model: this,
			setResponseXML: "pvtSetHeadRevFromDoc",
			setStatus: "setRequestStatus",
			setProgress: 'setProgress'
		});
		if (optSync) req.beSync();
		req.propfind(this.getURL(), 1);
		return req;
	},

	fetch: function($super, optSync, optRequestHeaders, rev) {
		var req;
		if (rev) {
			this.withBaselineUriDo(rev, function() {
				req = $super(optSync, optRequestHeaders);
			});
		} else {
			req = $super(optSync, optRequestHeaders);
		};
		return req;
	},
	
	store: function($super, content, optSync, optRequestHeaders, optHeadRev) {
		// if optHeadRev is not undefined than the store will only succeed
		// if the head revision of the resource is really optHeadRev
		if (optHeadRev) {
			var headers = optRequestHeaders ? optRequestHeaders : {};
			//determine local path of resource
			//var local = new URL(this.getURL()).relativePathFrom(new URL(this.repoUrl));
			var local = this.getURL().toString().substring(this.repoUrl.toString().length);
			local = local.slice(1); // remove leading slash
			var ifHeader = Strings.format('(["%s//%s"])', optHeadRev, local);
			console.log('Creating if header: ' + ifHeader);
			Object.extend(headers, {'If': ifHeader});
		}
		return $super(content, optSync, headers);
	},
	
	del: function(sync, optRequestHeaders) {
		var req = new NetRequest(Relay.newInstance({
			Status: "+RequestStatus",
			Progress: '+Progress'
		}, this));
		if (sync) req.beSync();
		if (optRequestHeaders) req.setRequestHeaders(optRequestHeaders);
		req.del(this.getURL());
		return req;
	},

	fetchProperties: function($super, destModel, optSync, optRequestHeaders, rev) {
		var req;
		//Record.newPlainInstance({ Properties: null, PropertiesString: "", URL: this.getURL()});
		if (rev) {
			this.withBaselineUriDo(rev, function() {
				req = $super(destModel, optSync, optRequestHeaders);
			});
		} else {
			req = $super(destModel, optSync, optRequestHeaders);
		};
		return req;
	},

	fetchMetadata: function(optSync, optRequestHeaders, startRev, endRev, reportDepth) {
		// get the whole history if startRev is undefined
		// FIXME: in this case the getHeadRevision will be called synchronous
		if (!startRev) {
			this.fetchHeadRevision(true);
			startRev = this.getHeadRevision();
		}
		this.reportDepth = reportDepth; // FISXME quick hack, needed in 'pvtScanLog...'
		var req = new NetRequest({
			model: this,
			setResponseXML: "pvtScanLogReportForVersionInfos",
			setStatus: "setRequestStatus",
			setProgress: 'setProgress'
		});
		if (optSync) req.beSync();
		if (optRequestHeaders) req.setRequestHeaders(optRequestHeaders);
		req.report(this.getURL(), this.pvtRequestMetadataXML(startRev, endRev));
		return req;
	},

	pvtSetHeadRevFromDoc: function(xml) {
		if (!xml) return;
		/* The response contains the properties of the specified file or directory,
		e.g. the revision (= version-name) */
		var revisionNode = xml.getElementsByTagName('version-name')[0];
		if (!revisionNode) return;
		this.setHeadRevision(Number(revisionNode.textContent));
	},

	pvtScanLogReportForVersionInfos: function(logReport) {
		// FIXME Refactor: method object?
		var depth = this.reportDepth;
		var logItemQ = new Query('//S:log-item');
		var versionInfos = [];
		//var repoUrl = new URL(this.repoUrl);
		var repoUrl = this.repoUrl;
		logItemQ.findAll(logReport).forEach(function(logElement) {
			var spec = {};
			$A(logElement.childNodes).forEach(function(logProp) {
				switch(logProp.tagName) {
					case 'D:version-name':
						spec.rev = Number(logProp.textContent); break;
					case 'D:creator-displayname':
						spec.author = logProp.textContent; break;
					case 'S:date':
						spec.date = logProp.textContent; break;
					case 'S:added-path':
					case 'S:modified-path':
					case 'S:deleted-path':
					case 'S:replaced-path':
						var relPath = logProp.textContent;
						if (depth && relPath.split('/').length-1 > depth)
							return;
						//relPath = relPath.slice(1); // remove trailing /
						if (repoUrl.endsWith(relPath))
							spec.url = repoUrl; // hmmm???
						else
						spec.url = repoUrl.toString() + relPath.slice(1); 
						// console.log('Created spec.url:' + spec.url);
						if (spec.change != null) {// was set before... assume only one change per rev
							//	console.warn('multiple changes for one revision of ' + spec.url);
							spec.url = null;
							return;
						}
						spec.change = logProp.tagName.split('-').first();
						break;
					default:
				}
			});
			if (!spec.url) return;
			spec.url = new URL(spec.url);
			versionInfos.push(new SVNVersionInfo(spec));
		});
		// newest version first
		versionInfos = versionInfos.sort(function(a,b) { return b.rev - a.rev });
		this.setMetadata(versionInfos);
	},
	
	pvtScanLogReportForVersionInfosTrace: function(logReport) {
		lively.lang.Execution.trace(this.pvtScanLogReportForVersionInfos.curry(logReport).bind(this));
	},

	pvtRequestMetadataXML: function(startRev, endRev) {
		return Strings.format(
			'<S:log-report xmlns:S="svn:" xmlns:D="DAV:">' + 
			'<S:start-revision>%s</S:start-revision>' +
			'<S:end-revision>%s</S:end-revision>' +
			'<S:discover-changed-paths/>' +
			'<S:path></S:path>' +
			'<S:all-revprops/>' +
			'</S:log-report>', startRev, endRev || 0);
	},

	withBaselineUriDo: function(rev, doFunc) {
		var tempUrl = this.getURL();
		this.setURL(this.repoUrl + '/!svn/bc/' + rev + '/' + this.getLocalUrl());
		doFunc();
		this.setURL(tempUrl);
	},
});

Object.subclass('SVNVersionInfo', {

	documentation: 'This object wraps svn infos from report or propfind requests',

	initialize: function(spec) {
		// possible properties of spec:
		// rev, date, author, url, change, content
		for (name in spec) {
			var val = spec[name];
			if (name == 'date') {
				if (Object.isString(val)) {
					this.date = this.parseUTCDateString(val);
				} else if (val instanceof Date) {
					this.date = val;
				}
			} else {
				this[name] = val;
			}
		}
		if (!this.author)
			this.author = '(no author)';
		if (!this.date)
			this.date = new Date();
	},

	parseUTCDateString: function(dateString) {
		var yearElems = dateString.slice(0,10).split('-').collect(function(ea) {return Number(ea)});
		var timeElems = dateString.slice(11,19).split(':').collect(function(ea) {return Number(ea)});
		return new Date(yearElems[0], yearElems[1]-1, yearElems[2], timeElems[0], timeElems[1], timeElems[2])
	},

	toString: function() {
		// does not work when evaluate {new SVNVersionInfo() + ""} although toStrings() works fine. *grmph*
		// string = Strings.format('%s, %s, %s, Revision %s',
		//     this.author, this.date.toTimeString(), this.date.toDateString(), this.rev);
		// string = new String(string);
		// string.orig = this;
		return Strings.format('%s, %s, %s, Revision %s',
			this.author, this.date.toTimeString(), this.date.toDateString(), this.rev);
	},
	
	toExpression: function() {
		return Strings.format('new SVNVersionInfo({rev: %s, url: %s, date: %s, author: %s, change: %s})',
		this.rev, toExpression(this.url), toExpression(this.date),
		toExpression(this.author), toExpression(this.change));
	},
	
});


// TODO will be merged with Resource
// TODO make async?
// deprecated
Object.subclass('FileDirectory', {

	initialize: function(url) {
		this.url = url.isLeaf() ? url.getDirectory() : url;
		this.writeAsync = false;
	},

	fileContent: function(localname, revision, contentType) {
		var url = this.url.withFilename(localname);
		var resource = new SVNResource(this.url.toString(), Record.newPlainInstance({URL: url.toString(), ContentText: null}));
		resource.contentType = contentType;
		resource.fetch(true, null, revision);
		return resource.getContentText();
	},

	filesAndDirs: function(revision) {
		var webfile = new lively.Storage.WebFile(Record.newPlainInstance({DirectoryList: [], RootNode: this.url}));
		webfile.fetchContent(this.url, true);
		return webfile.getModel().getDirectoryList();
	},

	files: function(optRev) {
		return this.filesAndDirs(optRev).select(function(ea) { return ea.isLeaf() });
	},

	filenames: function(optRev) {
		return this.files(optRev).collect(function(ea) { return ea.filename() } );
	},

	subdirectories: function(optRev) {
		// remove the first, its the url of the current directory
		var result = this.filesAndDirs(optRev).reject(function(ea) { return ea.isLeaf() });
		result.shift();
		return result;
	},

	subdirectoryNames: function(optRev) {
		return this.subdirectories(optRev).collect(function(ea) { return ea.filename() } );
	},

	fileOrDirectoryExists: function(localname) {
		return new NetRequest().beSync().get(this.url.withFilename(localname)).transport.status != 404;
	},

	writeFileNamed: function(localname, content, contentType) {
		var url = this.url.withFilename(localname);
		var resource = new Resource(Record.newPlainInstance({URL: url}));
		resource.contentType = contentType;
		if(this.writeAsync)
			return resource.store(content, false);
		else
		return resource.store(content, true).getStatus().isSuccess();
	},

	createDirectory: function(localname) {
		return new NetRequest().beSync().mkcol(this.url.withFilename(localname)).getStatus().isSuccess();
	},

	deleteFileNamed: function(localname) {
		return new NetRequest().beSync().del(this.url.withFilename(localname)).getStatus().isSuccess();       
	},

	// Move to somewhere else? Not directory specific...
	copyFile: function(srcUrl, destUrl) {
		return new NetRequest().beSync().copy(srcUrl, destUrl, true /*overwrite*/).getStatus().isSuccess();
	},

	copyFileNamed: function(srcFileName, optRev, destUrl, optNewFileName, contentType) {
		console.log('Copy file ' + srcFileName);
		if (!optNewFileName) optNewFileName = srcFileName;
		var otherDir = new FileDirectory(destUrl);
		otherDir.writeFileNamed(optNewFileName, this.fileContent(srcFileName, optRev, contentType), contentType);
	},

	copyAllFiles: function(destUrl, selectFunc, optRev) {
		var filesToCopy = selectFunc ? this.filenames().select(selectFunc) : this.filenames();
		filesToCopy.each(function(ea) { this.copyFileNamed(ea, optRev, destUrl) }, this);
	},

	copySubdirectory: function(subDirName, newDirName, toUrlOrFileDir, recursively, selectFunc) {
		if (!newDirName) newDirName = subDirName;
		if (!this.subdirectoryNames().include(subDirName)) {
			console.log(this.url.toString() + ' has no subdirectory ' + subDirName);
			return;
		}

		var foreignDir = toUrlOrFileDir.constructor === this.constructor ? toUrlOrFileDir : new this.constructor(toUrlOrFileDir);
		var toUrl = foreignDir.url;
		if (!foreignDir.fileOrDirectoryExists(newDirName)) foreignDir.createDirectory(newDirName);
		var subDir = new this.constructor(this.url.withFilename(subDirName));

		subDir.copyAllFiles(toUrl.withFilename(newDirName), selectFunc);
		subDir.copyAllSubdirectories(toUrl.withFilename(newDirName), recursively, selectFunc);
	},

	copyAllSubdirectories: function(toUrl, recursively, selectFunc) {
		console.log('copying subdirs to url:' + toUrl + ' recursively: ' + recursively + ' selectFunc: ' + selectFunc);
		var dirsToCopy = selectFunc ? this.subdirectoryNames().select(selectFunc) : this.subdirectoryNames();

		dirsToCopy.each(function(ea) { this.copySubdirectory(ea, ea, toUrl, recursively, selectFunc) }, this);
	},

});

Object.extend(FileDirectory, {
	getContent: function(url) {
		url = new URL(url);
		var dir = new FileDirectory(url.getDirectory());
		return dir.fileContent(url.filename());
	},
	setContent: function(url, content) {
		url = new URL(url);
		var dir = new FileDirectory(url.getDirectory());
		return dir.writeFileNamed(url.filename(), content || '');
	},
});

Object.subclass('WebResource', {

	initialize: function(url) {
		this._url = new URL(url);
		this.beSync();
	},

	getURL: function() { return this._url },

	getName: function() { return this.getURL().filename() },

	isSync: function() { return this._isSync },
	
	beSync: function() { this._isSync = true; return this },

	beAsync: function() { this._isSync = false; return this },

	forceUncached: function() {
		this._url = this.getURL().withQuery({time: new Date().getTime()});
		return this;
	},

	// deprecated
	getContent: function(rev, contentType) {
		var resource = new SVNResource(
			this.getURL().toString(),
			Record.newPlainInstance({URL: this.getURL().toString(), ContentText: null}));
		if (contentType)
			resource.contentType = contentType;
		resource.fetch(true, null, rev);
		return resource.getContentText();
	},

	// deprecated
	getDocument: function(rev, contentType) {
		var resource = new SVNResource(
			this.getURL().toString(),
			Record.newPlainInstance({URL: this.getURL().toString(), ContentDocument: null}));
		if (contentType)
			resource.contentType = contentType;
		resource.fetch(true, null, rev);
		return resource.getContentDocument();
	},

	// deprecated
	setContent: function(content, contentType) {
		var resource = new Resource(Record.newPlainInstance({URL: this.getURL().toString()}));
		if (contentType) resource.contentType = contentType;
		resource.store(content, this.isSync());
	},

	// deprecated
	exists: function(optCb) {
		if (this.isSync())
			return new NetRequest().beSync().get(this.getURL()).transport.status < 400;
		var model = {
			setStatus: function(status) { optCb && optCb(status.code < 400) }
		}
		return new NetRequest({model: model, setStatus: "setStatus"}).get(this.getURL());
	},

	isCollection: function() { return !this.getURL().isLeaf() },

	copyTo: function(url) {
		var otherResource = new WebResource(url);
		otherResource.create();
		new NetRequest().copy(this.getURL(), url, true /*overwrite*/);
		return otherResource;
	},

	subElements: function(depth) {
		if (!depth) depth = 1;
		var req = new NetRequest(Record.newPlainInstance({ResponseXML: null, Status: null}));
		req.beSync();
		req.propfind(this.getURL(), depth);
		// FIXME: resolve prefix "D" to something meaningful?
		if (!req.getStatus().isSuccess())
			throw new Error('Cannot access subElements of ' + this.getURL());
		var nodes = new Query("/D:multistatus/D:response").findAll(req.getResponseXML().documentElement)
		nodes.shift(); // remove first since it points to this WebResource
		var result = [];
		for (var i = 0; i < nodes.length; i++) {
			var url = new Query('D:href').findFirst(nodes[i]).textContent;
			if (!/!svn/.test(url)) // ignore svn dirs
				result.push(new WebResource(this.getURL().withPath(url)))
		}
		return result;
	},

	// subCollections: function(depth) {
	// 	return this.subElements(depth).select(function(ea) { return ea.isCollection() });
	// },
	// 
	// subDocuments: function(depth) {
	// 	return this.subElements(depth).select(function(ea) { return !ea.isCollection() });
	// },

	create: function() {
		if (!this.isCollection()) { this.setContent(''); return }
		new NetRequest().beSync().mkcol(this.getURL());
	},

	del: function() {
		new NetRequest().beSync().del(this.getURL());
	},

	toString: function() { return 'WebResource(' + this.getURL() + ')' },
	
});


// make WebResource async
WebResource.addMethods({

	connections: ['status', 'content', 'contentDocument', 'isExisting', 'subCollections', 'subDocuments', 'progress', 'readystate'],

	reset: function() {
		this.status = null;
		this.content = null;
		this.contentDocument = null;
		this.isExisting = null;
		this.subResources = null;
	},

	createResource: function() {
		var self = this;
		var resource = new SVNResource(
			this.getURL().toString(),
			{
				model: {
					getURL: function() { return self.getURL().toString() },
					setRequestStatus: function(reqStatus) { self.status = reqStatus; self.isExisting = reqStatus.isSuccess() },
					setContentText: function(string) { self.content = string },
					setContentDocument: function(doc) { self.contentDocument = doc },
					setProgress: function(progress) { self.progress = progress },
				},
				getURL: 'getURL',
				setRequestStatus: 'setRequestStatus',
				setContentText: 'setContentText',
				setContentDocument: 'setContentDocument',
				setProgress: 'setProgress',
			});
		resource.removeNetRequestReporterTrait();
		return resource
	},

	createNetRequest: function() {
		var self = this;
		var request = new NetRequest({
				model: {
					setStatus: function(reqStatus) { self.status = reqStatus; self.isExisting = reqStatus.isSuccess() },
					setResponseText: function(string) { self.content = string },
					setResponseXML: function(doc) { self.contentDocument = doc },
					setReadyState: function(readyState) { self.readystate = readyState },
					setProgress: function(progress) { self.progress = progress },
					setStreamContent: function(content) { self.content = content },
				},
				setStatus: 'setStatus',
				setResponseText: 'setResponseText',
				setResponseXML: 'setResponseXML',
				setReadyState: 'setReadyState',
				setProgress: 'setProgress',
				setStreamContent: 'setStreamContent',
		});
		if (this.isSync())
			request.beSync();
		return request;
	},

	get: function(rev, contentType) {
		var resource = this.createResource();
		if (contentType)
			resource.contentType = contentType;
		resource.fetch(this.isSync(), null, rev);
		return this
	},

	put: function(content, contentType) {
		if ((Global.Document && content instanceof Document) || (Global.Node && content instanceof Node)) {
			content = Exporter.stringify(content);
		}
		this.content = content;
		var resource = this.createResource();
		if (contentType)
			resource.contentType = contentType;
		resource.store(content, this.isSync());
		return this;
	},

	del: function() {
		var request = this.createNetRequest();
		request.del(this.getURL());
		return this;
	},

	post: function(content, contentType) {
		this.content = content;
		var request = this.createNetRequest();
		if (contentType)
			request.setContentType(contentType);
		request.post(this.getURL(), content);
		return this;
	},
	
	exists: function() {
		// for async use this.get().isExisting directly
		return this.beSync().get().isExisting
	},

	copyTo: function(url) {
		var otherResource = new WebResource(url);
		this.isSync() ? otherResource.beSync() : otherResource.beAsync();
		connect(this, 'content', otherResource, 'put', {removeAfterUpdate: true});
		this.get();
		return otherResource; // better return this for consistency?
	},

	getSubElements: function(depth) {
		if (!depth) depth = 1;
		var req = this.createNetRequest();
		connect(this, 'contentDocument', this, 'pvtProcessPropfind', {removeAfterUpdate: true});
		req.propfind(this.getURL(), depth);
		return this;
	},
	
	pvtProcessPropfind: function(doc) {
		if (!this.status.isSuccess())
			throw new Error('Cannot access subElements of ' + this.getURL());
		// FIXME: resolve prefix "D" to something meaningful?
		var nodes = new Query("/D:multistatus/D:response").findAll(doc.documentElement)
		nodes.shift(); // remove first since it points to this WebResource
		var result = [];
		for (var i = 0; i < nodes.length; i++) {
			var url = new Query('D:href').findFirst(nodes[i]).textContent;
			if (!/!svn/.test(url)) // ignore svn dirs
				result.push(new WebResource(this.getURL().withPath(url)))
		}
		this.subCollections = result.select(function(ea) { return ea.isCollection() });
		this.subDocuments = result.select(function(ea) { return !ea.isCollection() });
	},

});


console.log('loaded Network.js');


}); // end of module