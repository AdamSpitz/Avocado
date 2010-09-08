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


module('lively.ChangeSet').requires().toRun(function() {
// ===========================================================================
// Change/ChangeSet and lkml handling
// ===========================================================================
Object.subclass('Change', {

	documentation: 'Wraps around XML elements which represent code entities',

	initialize: function(xmlElement) {
		this.xmlElement = xmlElement;
	},

	eq: function(other) {
		if (!other) return false;
		if (this.constructor != other.constructor) return false;
		if (this == other) return true;
		return this.getXMLElement().isEqualNode(other.getXMLElement());
	},


	getXMLElement: function() {
		return this.xmlElement;
	},
	
	setXMLElement: function(newElement) {
		var p = this.getXMLElement().parentNode;
		var oldElement = this.getXMLElement()
		if (!p) return;
		if (p.ownerDocument)
			newElement = p.ownerDocument.adoptNode(newElement);
		p.insertBefore(newElement, oldElement);
		p.removeChild(oldElement);
		this.xmlElement = newElement;
	},


	getParser: function() {
		return new AnotherCodeMarkupParser();
	},

	getAttributeNamed: function(name, optXmlElement) {
		var element = optXmlElement || this.xmlElement;
		var attr = element.getAttributeNS(null, name);
		// if (!attr) console.warn("no " + name + " for" + Exporter.stringify(element));
		return attr;
	},

	setAttributeNamed: function(name, value) {
		var element = this.xmlElement;
		var attr = element.setAttributeNS(null, name, value);
	},

	getName: function() {
		return this.getAttributeNamed('name');
	},

	setName: function(newName) {
		this.getXMLElement().setAttributeNS(null, 'name', newName);
	},


	getDefinition: function() {
		return this.xmlElement.textContent;
	},

	setDefinition: function(src) {
		this.xmlElement.textContent = ''; // fix for old change elements that were not using CDATA
		var cdata = this.getOrCreateCDATANode();
		cdata.data = src;
	},

	getOrCreateCDATANode: function() {
		var e = this.getXMLElement();
		var cdataType = e.CDATA_SECTION_NODE;
		for (var i = 0; i < e.childNodes.length; i++)
			if (e.childNodes[i].nodeType == cdataType)
				return e.childNodes[i]
		var cdata = NodeFactory.createCDATA();
		this.getXMLElement().appendChild(cdata);
		return cdata;
	},

	disableAutomaticEval: function() {
		this.getXMLElement().setAttributeNS(null, 'automaticEval', 'false');
	},
	enableAutomaticEval: function() {
		this.getXMLElement().setAttributeNS(null, 'automaticEval', 'true');
	},
	automaticEvalEnabled: function() {
		return this.getAttributeNamed('automaticEval') != 'false';
	},

	addSubElement: function(change, insertBeforeChange) {
		var doc = this.xmlElement.ownerDocument;
		var newElem = doc ? doc.importNode(change.getXMLElement(), true) : change.getXMLElement();
		if (insertBeforeChange)
			this.xmlElement.insertBefore(newElem, insertBeforeChange.getXMLElement())
		else
			this.xmlElement.appendChild(newElem);
		change.xmlElement = newElem;
		return change;
	},

	addSubElements: function(elems) { elems.forEach(function(ea) { this.addSubElement(ea) }, this) },

	remove: function() {
		var elem = this.xmlElement;
		if (!elem.parentNode) return;
		elem.parentNode.removeChild(elem);
	},

	subElements: function() {
		return [];
	},

	subElementNamed: function(name) {
		var elems = this.subElements();
		for (var i = 0; i < elems.length; i++)
			if (elems[i].getName() == name) return elems[i];
	},

	parent: function() { return  new ClassChange(this.getXMLElement().parentNode) },

	evaluate: function() {
		throw dbgOn(new Error('Overwrite me'));
	},

    toString: function() {
		var message = this.constructor.type + ' named ' + this.getName();
		message += ' -- subelems: ' + this.subElements().length;
		return message;
	},

    inspect: function() {
    	try { return this.toString() } catch (err) { return "#<inspect error: " + err + ">" }
	},
	
	asJs: function() {
		throw new Error('Subclass resbonsibility -- not implemented in ' + this.constructor.type);
	}

});

// Let Change act as a FileFragment for use in browser
Change.addMethods({

	flattened: function() {
        return this.subElements().inject([this], function(all, ea) { return all.concat(ea.flattened()) });
    },
	getSourceCode: function() { return this.getDefinition() },
	getSourceCodeWithoutSubElements: function() {
	// duplication! ide.FileFragment.prototype.getSourceCodeWithoutSubElements
		var completeSrc = this.getSourceCode();
		return this.subElements().inject(completeSrc, function(src, ea) {
			var elemSrc = ea.getSourceCode();
			var start = src.indexOf(elemSrc);
			var end = elemSrc.length-1 + start;
			return src.substring(0,start) + src.substring(end+1);
		});
    },
	putSourceCode: function() { throw new Error('Not yet, sorry!') },
	getSourceControl: null/*ide.FileFragment.prototype.getSourceControl*/,
	sourceCodeWithout: function(childFrag) {
	// duplication! ide.FileFragment.prototype.sourceCodeWithout
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
	getFileString: function() { throw new Error('Not yet, sorry!') },
});

Change.subclass('ChangeSet', {

	initialize: function(optName) {
		// Keep track of an ordered list of Changes
		this.xmlElement = null;
		this.name = optName || '';
	},

	initializeFromWorldNode: function(node) {
		if (!this.reconstructFrom(node))
			this.addHookTo(node);
		return this;
	},

	initializeFromFile: function(fileName, fileString) {
		if (!fileString) fileString = new FileDirectory(new URL(Config.codeBase) || URL.source).fileContent(fileName);
		var doc = new DOMParser().parseFromString(fileString, "text/xml");
		if (!this.reconstructFrom(doc))
			throw dbgOn(new Error('Couldn\'t create ChangeSet from ' + fileName));
		return this;
	},

	reconstructFrom: function(node) {
		if (!node) return false;
		var codeNodes = node.getElementsByTagName('code');
		if (codeNodes.length == 0) return false;
		if (codeNodes.length > 1) console.warn('multiple code nodes in ' + node);
		this.xmlElement = codeNodes[0];
		return true;
	},

	addHookTo: function(node) {
		if (!node)
			throw dbgOn(new Error('Couldn\'t add ChangeSet'));
		defNode = node.tagName == 'defs' ? node : this.findOrCreateDefNodeOfWorld(node);
		this.xmlElement = LivelyNS.create("code");
		defNode.appendChild(this.xmlElement);
	},
	
	findOrCreateDefNodeOfWorld: function(doc) {
		var defNode = new Query('.//*[@type="WorldMorph"]/*[local-name()="defs"]').findFirst(doc);
		if (!defNode) {
			var worldNode = doc.getAttribute('type') == 'WorldMorph' ?
			doc : new Query('.//*[@type="WorldMorph"]').findFirst(doc);
			if (!worldNode) dbgOn(true);
			defNode = NodeFactory.create('defs');
			worldNode.appendChild(defNode); // null Namespace?
		}
		return defNode;
	},

	addChange: function(change) {
		this.addSubElement(change);
	},

	subElements: function() {
		var parser = new AnotherCodeMarkupParser();
		return $A(this.xmlElement.childNodes)
		.collect(function(ea) { return parser.createChange(ea) })
		.reject(function(ea) { return !ea });
	},

	evaluate: function() {
		this.subElements().forEach(function(item) { item.evaluate() });
	},

	removeChangeNamed: function(name) {
		var change = this.subElementNamed(name);
		if (!change) return null;
		change.remove();
		return change;
	},

	removeChangeAt: function(i) {
		var changes = this.subElements();
		if (!(i in changes)) return null;
		var change = changes[i];
		change.remove();
		return change;
	},

	remove: function() {
		this.subElements().invoke('remove');
	},

	addOrChangeElementNamed: function(name, source) {
		var prev = this.subElementNamed(name);
		if (prev) { prev.setDefinition(source); return }
		this.addChange(DoitChange.create(source, name));
	},

});


Change.subclass('ClassChange', {

	isClassChange: true,

	getSuperclassName: function() {
		return this.getAttributeNamed('super');
	},

	subElements: function() {
		// memorize?
		var parser = this.getParser();
		return $A(this.xmlElement.childNodes)
			.collect(function(ea) { return parser.createChange(ea) })
			.reject(function(ea) { return !ea })
	},

	getProtoChanges: function() {
		return this.subElements().select(function(ea) { return ea.isProtoChange });
	},

	getStaticChanges: function() {
		return this.subElements().select(function(ea) { return ea.isStaticChange });
	},

	evaluate: function() {
		var superClassName = this.getSuperclassName();
		if (!Class.forName(superClassName))
			throw new Error('Could not find class ' + superClassName);
		var className = this.getName();
		if (Class.forName(className))
			console.warn('Class ' + className + ' already defined! Evaluating class change regardless');
		var src = Strings.format('%s.subclass(\'%s\')', superClassName, className);
		var klass = eval(src);
		this.getStaticChanges().concat(this.getProtoChanges()).forEach(function(ea) { ea.evaluate() });
		return klass;
	},
	
	asJs: function() {
		var subElementString = '';
		if (this.subElements().length > 0)
			subElementString = '\n\n' + this.subElements().invoke('asJs').join('\n\n') + '\n\n';
		return Strings.format('%s.subclass(\'%s\', {%s});',
			this.getSuperclassName(), this.getName(), subElementString);
	},

});

Object.extend(ClassChange, {

	isResponsibleFor: function(xmlElement) { return xmlElement.tagName === 'class' },

	create: function(name, superClassName) {
		var element = LivelyNS.create('class');
		element.setAttributeNS(null, 'name', name);
		element.setAttributeNS(null, 'super', superClassName);
		var change = new ClassChange(element);
		change.enableAutomaticEval();
		return change;
	},

});

Change.subclass('ProtoChange', {

	isProtoChange: true,

	evaluate: function() {
		var className = this.getClassName();
		var klass = Class.forName(className);
		if (!klass) new Error('Could not find class of proto change ' + this.getName());
		var src = Strings.format('%s.addMethods({%s: %s})', className, this.getName(), this.getDefinition());
		eval(src);
		return klass.prototype[this.getName()];
	},

	getClassName: function() {
		return this.getAttributeNamed('className')
			|| this.getAttributeNamed('name', this.xmlElement.parentNode);
	},

	asJs: function() { // FIXME duplication with StaticChange
		var body = this.getDefinition();
		// body = body.replace(/\s+(.*)/, '$1');
		return this.getName() + ': ' + body + ',';
	},

});


Object.extend(ProtoChange, {

	isResponsibleFor: function(xmlElement) { return xmlElement.tagName === 'proto' },

	create: function(name, source, optClassName) {
		var element = LivelyNS.create('proto');
		element.setAttributeNS(null, 'name', name);
		if (optClassName) element.setAttributeNS(null, 'className', optClassName);
		var change = new ProtoChange(element);
		change.setDefinition(source || '');
		change.enableAutomaticEval();
		return change;
	},

});

Change.subclass('StaticChange', {

	isStaticChange: true,

	getClassName: function() { // duplication with protoChange
		return this.getAttributeNamed('name', this.xmlElement.parentNode);
	},

	evaluate: function() {
		var className = this.getClassName();
		var klass = Class.forName(className);
		if (!klass) throw dbgOn(new Error('Could not find class of static change' + this.getName()));
		var src = Strings.format('Object.extend(%s, {%s: %s})', className, this.getName(), this.getDefinition());
		eval(src);
		return klass[this.getName()];
	},
	
	asJs: function() { // FIXME duplication with ProtoChange
		var body = this.getDefinition();
		// body = body.replace(/\s+(.*)/, '$1');
		return this.getName() + ': ' + body + ',';
	},

});

Object.extend(StaticChange, {

	isResponsibleFor: function(xmlElement) { return xmlElement.tagName === 'static' },

	create: function(name, source, optClassName) { // duplication with proto!!!
		var element = LivelyNS.create('static');
		element.setAttributeNS(null, 'name', name);
		if (optClassName) element.setAttributeNS(null, 'className', optClassName);
		var change = new ProtoChange(element);
		change.setDefinition(source);
		change.enableAutomaticEval();
		return change;
	},

});

Change.subclass('DoitChange', {

	isDoitChange: true,

	evaluate: function() {
		var result;
		try {
			result = eval(this.getDefinition())
		} catch(e) {
			dbgOn(true);
			console.log('Error evaluating ' + this.getName() + ': ' + e);
			return undefined;
		}
		return result;
	},

});

Object.extend(DoitChange, {

	isResponsibleFor: function(xmlElement) { return xmlElement.tagName === 'doit' },

	create: function(source, optName) {
		var element = LivelyNS.create('doit');
		element.setAttributeNS(null, 'name', optName || 'aDoit');
		var doit = new DoitChange(element);
		doit.setDefinition(source || '');
		doit.enableAutomaticEval();
		return doit;
	},

});

Object.subclass('AnotherCodeMarkupParser', {

	initialize: function() {
		this.files = {};
	},

	changeClasses: Change.allSubclasses().without(ChangeSet),

	createChange: function(xmlElement) {
		if (xmlElement.nodeType == NodeFactory.TextType() || xmlElement.nodeType == NodeFactory.CDATAType())
			return null;
		var klass;
		for (var i = 0; i < this.changeClasses.length; i++)
			if (this.changeClasses[i].isResponsibleFor(xmlElement))
				klass = this.changeClasses[i];
		if (!klass) { debugger; console.warn(
				'Found no Change class for ' + Exporter.stringify(xmlElement).replace(/\n|\r/, ' ') +
				'tag name: ' + xmlElement.tagName);
			return null;
		}
		return new klass(xmlElement);
	},

	getDocumentOf: function(url) { /*helper*/
		if (Object.isString(url)) url = new URL(url);
		var existing = this.files[url.toString()];
		if (existing) return existing;
		var resource = new Resource(Record.newPlainInstance({URL: url.toString(), ContentText: null, ContentDocument: null}), "application/xml");
		resource.fetch(true);
		var doc = resource.getContentDocument();
		if (doc) return doc;
		return new DOMParser().parseFromString(resource.getContentText(), "application/xml");
	},

});

//
// extensions for world load support
//
Change.addMethods({
	isInitializer: Functions.False,
	isWorldRequirementsList: Functions.False,
})

DoitChange.addMethods({
	isInitializer: function() { return this.getName() === Change.initializerName },
	isWorldRequirementsList: function() { return  this.getName() === Change.worldRequirementsListName },
})

Object.extend(Change, {
	initializerName: 'initializer',
	worldRequirementsListName: 'local requirements',
});

ChangeSet.addMethods({
	
	getInitializer: function() {
		var elems = this.subElements();
		for (var i = 0; i < elems.length; i++)
			if (elems[i].isInitializer()) return elems[i];
	},
	
	getWorldRequirementsList: function() {
		var elems = this.subElements();
		for (var i = 0; i < elems.length; i++)
			if (elems[i].isWorldRequirementsList()) return elems[i];
	},
	
	ensureHasInitializeScript: function() {
		if (this.getInitializer()) return;
		var content = '// this script is evaluated on world load';
		this.addOrChangeElementNamed(Change.initializerName, content);
	},
	
	ensureHasWorldRequirements: function() {
		if (this.getWorldRequirementsList()) return;
		var content = '// An array of module names that is loaded on world load\n[]';
		this.addSubElement(
			DoitChange.create(content, Change.worldRequirementsListName),
			this.getInitializer()); // insert before initializer
	},
	
	evaluateAllButInitializer: function() {
		var changes = this.subElements();
		for (var i = 0; i < changes.length; i++) {
			var change = changes[i];
			if (!change.isWorldRequirementsList() &&
				!change.isInitializer() &&
				change.automaticEvalEnabled())
					change.evaluate();
		}
	},
	
	evaluateInitializer: function() {
		this.getInitializer().evaluate();
	},
	
	evaluateWorldRequirements: function() {
		var list = this.getWorldRequirementsList().evaluate();
		if (list) {
			Config.modulesBeforeWorldLoad = Config.modulesBeforeWorldLoad.concat(list);
		}
	},
	
	ensureCompatibility: function() {
		var ps = this.subElementNamed('postscript');
		if (!ps) return;
		ps.setName(Change.initializerName);
	},
	
	addWorldRequirement: function(moduleName) {
		var list = this.getWorldRequirementsList().evaluate();
		if (!list.include(moduleName))
			list.push(moduleName);
		this.getWorldRequirementsList().setDefinition(JSON.serialize(list))
	},
	
})

Object.extend(ChangeSet, {

	fromWorld: function(worldOrNode) {
		var node = worldOrNode instanceof WorldMorph ?
			worldOrNode.getDefsNode() :
			worldOrNode;
		var cs = new ChangeSet('Local code').initializeFromWorldNode(node);
		cs.ensureCompatibility();
		cs.ensureHasInitializeScript();
		cs.ensureHasWorldRequirements();
		return cs;
	},

	fromFile: function(fileName, fileString) {
		return new ChangeSet(fileName).initializeFromFile(fileName, fileString);
	},

	current: function() {
		// Return the changeSet associated with the current world
		var worldOrNode = WorldMorph.current() || new Importer().canvasContent(Global.document)[0];
		return ChangeSet.fromWorld(worldOrNode);
	}

});


}); // end of module