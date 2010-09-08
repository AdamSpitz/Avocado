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
 * Data.js.  Data manipulation (mostly XML).
 */

module('lively.Data').requires().toRun(function(thisModule) {
	
View.subclass('Query',  {
    documentation: "Wrapper around XPath evaluation",

    xpe: Global.XPathEvaluator ? new XPathEvaluator() : (console.log('XPath not available') || null),
    
    formals: ["+Results", // Node[]
	   "-ContextNode", // where to evaluate
	  ],

    initialize: function(expression, optPlug) {
	//if (!this.xpe) throw new Error("XPath not available");
	this.contextNode = null;
	this.expression = expression;
	if (optPlug) this.connectModel(optPlug);
    },


    establishContext: function(node) {
	var ctx = node.ownerDocument ? node.ownerDocument.documentElement : node.documentElement;
	if (ctx !== this.contextNode) {
	    this.contextNode = ctx;
	    this.nsResolver = this.xpe.createNSResolver(ctx);
	}
    },

    updateView: function(aspect, controller) {
	var p = this.modelPlug;
	if (!p) return;
	switch (aspect) {
	case p.getContextNode:
	    this.onContextNodeUpdate(this.getContextNode());
	    break;
	}
    },
    
    onContextNodeUpdate: function(node) {
	if (node instanceof Document) node = node.documentElement;
	var result = this.findAll(node, null);
	this.setResults(result);
    },


    findAll: function(node, defaultValue) {
	this.establishContext(node);
	var result = this.xpe.evaluate(this.expression, node, this.nsResolver, XPathResult.ANY_TYPE, null);
	var accumulator = [];
	var res = null;
	while (res = result.iterateNext()) accumulator.push(res);
	return accumulator.length > 0 || defaultValue === undefined ? accumulator : defaultValue;
    },


    findFirst: function(node) {
	this.establishContext(node);
	var result = this.xpe.evaluate(this.expression, node, this.nsResolver, XPathResult.ANY_TYPE, null);
	return result.iterateNext();
    }

});

TextMorph.subclass('XPathQueryMorph', {
    documentation: "TextMorph with an associated contextNode, evals result in evaluating XPath queries",
    
    initialize: function($super, bounds, contextNode) {
	$super(bounds, "");
	this.contextNode = contextNode;
    },

    boundEval: function(str) {    
	var xq = new Query(str);
	return Exporter.stringifyArray(xq.findAll(this.contextNode, []), '\n');
    }

});


/// RSS Feed support (will be rewritten)

lively.data.Wrapper.subclass('FeedChannel', {
    documentation: "Convenience wrapper around RSS Feed Channel XML nodes",

    titleQ: new Query("title"),
    itemQ: new Query("item"),

    initialize: function(rawNode) {
	this.rawNode = rawNode;
        this.items = [];
        var results = this.itemQ.findAll(rawNode);
	
        for (var i = 0; i < results.length; i++) {
            this.items.push(new FeedItem(results[i]));
        }
    },

    title: function() {
	return this.titleQ.findFirst(this.rawNode).textContent;
    }
    
});

lively.data.Wrapper.subclass('FeedItem', {
    documentation: "Convenience wrapper around individual RSS feed items",
    titleQ: new Query("title"),
    descriptionQ: new Query("description"),
    linkQ: new Query("link"),

    initialize: function(rawNode) {
	this.rawNode = rawNode;
    },
    
    title: function() {
	return this.titleQ.findFirst(this.rawNode).textContent;
    },

    description: function() {
	return this.descriptionQ.findFirst(this.rawNode).textContent;
    },

    link: function() {
	return this.linkQ.findFirst(this.rawNode).textContent;
    },
    
});

View.subclass('Feed', NetRequestReporterTrait, {

    // FIXME: merge into Resource
    formals: ["-URL", "+FeedChannels"],
    channelQuery: new Query("/rss/channel"),

    updateView: function(aspect, source) { // model vars: getURL, setFeedChannels
        var p = this.modelPlug;
	if (!p) return;
	switch (aspect) {
	case p.getURL:
	    this.onURLChange(this.getURL());
	    break;
	}
    },

    onURLChange: function(newValue) {
	this.request(newValue);
    },
    
    deserialize: Functions.Empty,

    kickstart: function() {
	if (this.formalModel) this.onURLChange(this.getURL());
	else if (this.modelPlug) this.updateView(this.modelPlug.getURL, this);
    },
    
    setRawFeedContents: function(responseXML) {
	this.setFeedChannels(this.parseChannels(responseXML));
    },
    
    request: function(url) {
        var hourAgo = new Date((new Date()).getTime() - 1000*60*60);
	var req = new NetRequest(Relay.newInstance({ ResponseXML: "+RawFeedContents", Status: "+RequestStatus"}, this));
	req.setContentType('text/xml');
	req.setRequestHeaders({ "If-Modified-Since": hourAgo.toString() });
	console.log("feed requesting " + url);
	req.get(url);
    },

    parseChannels: function(elt) {
	var results = this.channelQuery.findAll(elt);
        var channels = [];
        for (var i = 0; i < results.length; i++) {
	    channels.push(new FeedChannel(results[i]));
        }
	return channels;
    }

});


}); // end of module