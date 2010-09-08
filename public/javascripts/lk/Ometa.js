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


module('lively.Ometa').requires('ometa.ometa-base', 'ometa.lk-parser-extensions').toRun(function() {
                                           
/*
    An Ometa Workspace like http://www.cs.ucla.edu/~awarth/ometa/.
    Uses Alessandro Warth OMeta-js 2 to evalute text. 
*/

OMetaSupport = {
    
	ometaGrammarDir: new URL(Config.codeBase),  

    fromFile: function(fileName) {
        var src = OMetaSupport.fileContent(fileName);
        var grammar = OMetaSupport.ometaEval(src);
        return grammar;
    },
    
    translateAndWrite: function(sourceFileName, destFileName, additionalRequirements) {
	var requirementsString = additionalRequirements ? ',\'' + additionalRequirements.join('\',\'') + '\'' : '';
	var str = Strings.format('module(\'%s\').requires(\'ometa.parser\'%s).toRun(function() {\n%s\n});',
		destFileName,
		requirementsString,
		OMetaSupport.translateToJs(OMetaSupport.fileContent(sourceFileName)));
	OMetaSupport.writeGrammar(destFileName, str)
	WorldMorph.current().setStatusMessage(
		Strings.format('Successfully compiled OMeta grammar %s to %s',sourceFileName, destFileName),
		Color.green, 3);
    },
    
    ometaEval: function(src) {
        var jsSrc = OMetaSupport.translateToJs(src);
        return eval(jsSrc);
    },
    
    translateToJs: function(src) {
        var ometaSrc = OMetaSupport.matchAllWithGrammar(LKOMetaJSParser, "topLevel", src);
        if (!ometaSrc) throw new Error('Problem in translateToJs: Cannot create OMeta Ast from source');
        var jsSrc = OMetaSupport.matchWithGrammar(LKOMetaJSTranslator, "trans", ometaSrc);
        return jsSrc;
    },
    
    matchAllWithGrammar: function(grammar, rule, src, errorHandling) {
		// errorHandling can be undefined or a callback or true (own error handle is used)
		var errorFunc;
		if (!errorHandling) errorFunc = OMetaSupport.handleErrorDebug;
		else if (errorHandling instanceof Function) errorFunc = errorHandling
		else errorFunc = OMetaSupport.handleErrorDebug;
        return grammar.matchAll(src, rule, null, errorFunc.curry(src, rule));
    },
    
    matchWithGrammar: function(grammar, rule, src, errorHandling) {
		// errorHandling can be undefined or a callback or true (own error handle is used)
		var errorFunc;
		if (!errorHandling) errorFunc = OMetaSupport.handleErrorDebug;
		else if (errorHandling instanceof Function) errorFunc = errorHandling
		else errorFunc = OMetaSupport.handleErrorDebug;
		return grammar.match(src, rule, null, errorFunc.curry(src, rule));
    },
    
    handleErrorDebug: function(src, rule, grammarInstance, errorIndex) {
        var charsBefore = 500;
        var charsAfter = 250;
        console.log('OMeta Error -- ' + rule);
        var startIndex = Math.max(0, errorIndex - charsBefore);
        var stopIndex = Math.min(src.length, errorIndex + charsAfter);

		//console.log('Last twenty Rules: ' + grammarInstance._ruleStack && grammarInstance._ruleStack.slice(grammarInstance._ruleStack.length-20));
		if (src.constructor === Array) {
			console.log(src = '[' + src.toString() + ']');
		} else {
			console.log(src.substring(startIndex, errorIndex) + '<--Error-->' + src.substring(errorIndex, stopIndex));
		}
    },
    
    handleError: function(src, rule, grammarInstance, errorIndex) {},
    
    fileContent: function(fileName) {
        var url = URL.codeBase.withFilename(fileName);
		return new WebResource(url).getContent();
    },

	writeGrammar: function(fileName, src) {
        var url = URL.codeBase.withFilename(fileName);
		return new WebResource(url).setContent(src);
	},    
};

Widget.subclass('OmetaWorkspace', {
    
    defaultViewExtent: pt(400,250),
    
    buildView: function() {
        var panel =  PanelMorph.makePanedPanel(this.defaultViewExtent, [
                ['textPane', function (initialBounds){return new TextMorph(initialBounds)}, new Rectangle(0, 0, 1, 0.0)]]);
        panel.textPane.setExtent(this.defaultViewExtent);
        // override the standart eval function in this instance to evaluate Ometa Source instead of JavaScript
        panel.textPane.tryBoundEval = function (str) {
        	var result;
        	try { result = OMetaSupport.ometaEval(str); }
        	catch (e) { // this.world().alert("exception " + e);
        	    console.log('error evaling ometa: ' + e) };
        	return result;
         };
        return panel;
    }
    
});

/*
 * A sample OMeta Workspace with the simple interpreter from the OMeta-js Tutorial
 */
OmetaWorkspace.openOmetaWorkspace = function() {
    var w = new OmetaWorkspace(); 
	w.openIn(WorldMorph.current(), pt(540, 20));
	w.panel.textPane.setTextString("ometa Calc {  \n\
      digit    = super(#digit):d          -> digitValue(d),\n\
      number   = number:n digit:d         -> (n * 10 + d) \n\
               | digit,\n\
      addExpr  = addExpr:x '+' mulExpr:y  -> (x + y) \n\
               | addExpr:x '-' mulExpr:y  -> (x - y) \n\
               | mulExpr,\n\
      mulExpr  = mulExpr:x '*' primExpr:y -> (x * y)\n\
               | mulExpr:x '/' primExpr:y -> (x / y)\n\
               | primExpr,\n\
      primExpr = '(' expr:x ')'           -> x\n\
               | number,\n\
      expr     = addExpr\n\
    }\n\
    \n\
    Calc.matchAll('6*(4+3)', 'expr')");	
	return w
};

// Interface for using the parser. It would be better to extend the parser directly...

lively.Text.createText = function(str, style) {
    return new lively.Text.Text(str, style);
};

});