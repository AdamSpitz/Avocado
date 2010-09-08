transporter.module.create('programming_environment/programming_environment', function(requires) {

requires('avocado_lib');
requires('lk_ext/core_sampler');
requires('lk_ext/poses');
requires('lk_ext/morph_factories');
requires('transporter/module_morph');
requires('transporter/snapshotter');
requires('programming_environment/category_morph');
requires('programming_environment/slot_morph');
requires('programming_environment/evaluator');
requires('programming_environment/slice_morph');
requires('programming_environment/mirror_morph');
requires('programming_environment/test_case_morph');

}, function(thisModule) {


thisModule.addSlots(lobby, function(add) {

  add.creator('avocado', {}, {category: ['avocado']});

});


thisModule.addSlots(avocado, function(add) {

  add.method('worldName', function () { return "Avocado"; }, {category: ['printing']});

  add.data('isReflectionEnabled', true, {category: ['enabling reflection']});

  add.data('debugMode', false, {category: ['debug mode']});

  add.creator('menuItemContributors', [], {category: ['menu']});

  add.method('createAnotherMorph', function (w, wBounds, i) {
    if (i <= 0) { return; }
    var t1 = new Date().getTime();
    var m = Morph.makeRectangle(wBounds.randomPoint().extent(pt(50,50)));
    var t2 = new Date().getTime();
    w.addMorph(m);
    var t3 = new Date().getTime();
    console.log("Time to create latest morph: " + (t2 - t1) + ", and to add it: " + (t3 - t2));
    setTimeout(function() {
      var t4 = new Date().getTime();
      this.createAnotherMorph(w, wBounds, i - 1);
      console.log("Time to get to timeout: " + (t4 - t3));
    }.bind(this), 0);
  });

  add.method('addGlobalCommandsTo', function (cmdList) {
    cmdList.addItem(["create new object", function(evt) {
      evt.hand.world().morphFor(reflect({})).growFromNothing(evt);
    }]);

    cmdList.addItem(["get the Global object", function(evt) {
      evt.hand.world().morphFor(reflect(Global)).grabMe(evt);
    }]);

    if (this.debugMode) {
      cmdList.addLine();

      if (organization.current === organizationUsingAnnotations) {
        cmdList.addItem(["use JSQuiche organization", function(evt) {
          organization.setCurrent(organizationChain.create(organization.named(organization.name()), organizationUsingAnnotations));
        }.bind(this)]);
      } else {
        cmdList.addItem(["stop using JSQuiche organization", function(evt) {
          organization.setCurrent(organizationUsingAnnotations);
        }.bind(this)]);
      }

      cmdList.addItem(["big-object experiment", function(evt) {
        var w = evt.hand.world();
        var m = w.morphFor(reflect(TextMorph.prototype));
	m.ensureIsInWorld(w, pt(300,200), true, false, false, function() {
	  m.expand(evt);
        });
      }.bind(this)]);

      cmdList.addItem(["many-morphs experiment", function(evt) {
        var w = evt.hand.world();
        this.createAnotherMorph(w, w.bounds(), 1000);
      }.bind(this)]);

      cmdList.addItem(["translate the world", function(evt) {
        evt.hand.world().slideBy(pt(200,100));
      }]);

      cmdList.addItem(["zoom in to the world", function(evt) {
        evt.hand.world().zoomBy(2);
      }]);

      cmdList.addItem(["zoom out from the world", function(evt) {
        evt.hand.world().zoomBy(0.5);
      }]);

      cmdList.addItem(["unscale the world", function(evt) {
        evt.hand.world().staySameSizeAndSmoothlyScaleTo(1.0);
      }]);

      var b = window.shouldNotDoAnyPeriodicalMorphUpdating;
      cmdList.addItem([(b ? "enable" : "disable") + " periodical updating", function(evt) {
        window.shouldNotDoAnyPeriodicalMorphUpdating = !b;
      }]);
    }

    this.menuItemContributors.each(function(c) {
      c.addGlobalCommandsTo(cmdList);
    });

    cmdList.addLine();

    cmdList.addItem(["get tests", function(evt) {
      // aaa - gather these automatically
      var testCases = [
        dictionary.tests,
        set.tests,
        mirror.tests,
        transporter.tests,
        objectGraphWalker.tests,
        exitValueOf.tests,
        enumerator.tests,
        range.tests,
        notifier.tests,
        stringBuffer.tests,
        String.prototype.tests,
        Array.prototype.tests,
        dependencies.tests,
        organization.tests
      ];
      var world = evt.hand.world();
      world.assumePose(world.listPoseOfMorphsFor(testCases, "test cases for avocado"));
    }]);
  }, {category: ['menu']});

  add.method('initialize', function () {
    var shouldPrintLoadOrder = false;
    if (shouldPrintLoadOrder) { transporter.printLoadOrder(); }
    
    creatorSlotMarker.annotateExternalObjects(true);
    this.categorizeBuiltInStuff();

    // make the lobby mirror morph less unwieldy, since people tend to keep lots of stuff there
    reflect(window).categorizeUncategorizedSlotsAlphabetically();
  }, {category: ['initializing']});

  add.method('categorizeBuiltInStuff', function () {
    // These lists come from a simple little HTML page that we wrote to get a list of the stuff
    // that comes built-in to the window object. Ideally we'd like to categorize *everything*.
    // For now, this at least gets a few hundred attributes out of our hair. -- Adam, August 2010

    var globalObjectCategories = [
      [['SVG'], ['SVGAElement', 'SVGAltGlyphElement', 'SVGAngle', 'SVGAnimateColorElement', 'SVGAnimateElement', 'SVGAnimateTransformElement', 'SVGAnimatedAngle', 'SVGAnimatedBoolean', 'SVGAnimatedEnumeration', 'SVGAnimatedInteger', 'SVGAnimatedLength', 'SVGAnimatedLengthList', 'SVGAnimatedNumber', 'SVGAnimatedNumberList', 'SVGAnimatedPreserveAspectRatio', 'SVGAnimatedRect', 'SVGAnimatedString', 'SVGAnimatedTransformList', 'SVGCircleElement', 'SVGClipPathElement', 'SVGColor', 'SVGCursorElement', 'SVGDefsElement', 'SVGDescElement', 'SVGDocument', 'SVGElement', 'SVGElementInstance', 'SVGElementInstanceList', 'SVGEllipseElement', 'SVGException', 'SVGFontElement', 'SVGFontFaceElement', 'SVGFontFaceFormatElement', 'SVGFontFaceNameElement', 'SVGFontFaceSrcElement', 'SVGFontFaceUriElement', 'SVGForeignObjectElement', 'SVGGElement', 'SVGGlyphElement', 'SVGGradientElement', 'SVGImageElement', 'SVGLength', 'SVGLengthList', 'SVGLineElement', 'SVGLinearGradientElement', 'SVGMarkerElement', 'SVGMaskElement', 'SVGMatrix', 'SVGMetadataElement', 'SVGMissingGlyphElement', 'SVGNumber', 'SVGNumberList', 'SVGPaint', 'SVGPathElement', 'SVGPathSeg', 'SVGPathSegArcAbs', 'SVGPathSegArcRel', 'SVGPathSegClosePath', 'SVGPathSegCurvetoCubicAbs', 'SVGPathSegCurvetoCubicRel', 'SVGPathSegCurvetoCubicSmoothAbs', 'SVGPathSegCurvetoCubicSmoothRel', 'SVGPathSegCurvetoQuadraticAbs', 'SVGPathSegCurvetoQuadraticRel', 'SVGPathSegCurvetoQuadraticSmoothAbs', 'SVGPathSegCurvetoQuadraticSmoothRel', 'SVGPathSegLinetoAbs', 'SVGPathSegLinetoHorizontalAbs', 'SVGPathSegLinetoHorizontalRel', 'SVGPathSegLinetoRel', 'SVGPathSegLinetoVerticalAbs', 'SVGPathSegLinetoVerticalRel', 'SVGPathSegList', 'SVGPathSegMovetoAbs', 'SVGPathSegMovetoRel', 'SVGPatternElement', 'SVGPoint', 'SVGPointList', 'SVGPolygonElement', 'SVGPolylineElement', 'SVGPreserveAspectRatio', 'SVGRadialGradientElement', 'SVGRect', 'SVGRectElement', 'SVGRenderingIntent', 'SVGSVGElement', 'SVGScriptElement', 'SVGSetElement', 'SVGStopElement', 'SVGStringList', 'SVGStyleElement', 'SVGSwitchElement', 'SVGSymbolElement', 'SVGTRefElement', 'SVGTSpanElement', 'SVGTextContentElement', 'SVGTextElement', 'SVGTextPathElement', 'SVGTextPositioningElement', 'SVGTitleElement', 'SVGTransform', 'SVGTransformList', 'SVGUnitTypes', 'SVGUseElement', 'SVGViewElement', 'SVGZoomEvent']],
      [['SVG from Chrome'], ['SVGComponentTransferFunctionElement', 'SVGFEBlendElement', 'SVGFEColorMatrixElement', 'SVGFEComponentTransferElement', 'SVGFECompositeElement', 'SVGFEConvolveMatrixElement', 'SVGFEDiffuseLightingElement', 'SVGFEDisplacementMapElement', 'SVGFEDistantLightElement', 'SVGFEFloodElement', 'SVGFEFuncAElement', 'SVGFEFuncBElement', 'SVGFEFuncGElement', 'SVGFEFuncRElement', 'SVGFEGaussianBlurElement', 'SVGFEImageElement', 'SVGFEMergeElement', 'SVGFEMergeNodeElement', 'SVGFEMorphologyElement', 'SVGFEOffsetElement', 'SVGFEPointLightElement', 'SVGFESpecularLightingElement', 'SVGFESpotLightElement', 'SVGFETileElement', 'SVGFETurbulenceElement', 'SVGFilterElement', 'SVGHKernElement', 'SVGVKernElement']],
      [['HTML'], ['HTMLAllCollection', 'HTMLAnchorElement', 'HTMLAppletElement', 'HTMLAreaElement', 'HTMLAudioElement', 'HTMLBRElement', 'HTMLBaseElement', 'HTMLBaseFontElement', 'HTMLBlockquoteElement', 'HTMLBodyElement', 'HTMLButtonElement', 'HTMLCanvasElement', 'HTMLCollection', 'HTMLDListElement', 'HTMLDirectoryElement', 'HTMLDivElement', 'HTMLDocument', 'HTMLElement', 'HTMLEmbedElement', 'HTMLFieldSetElement', 'HTMLFontElement', 'HTMLFormElement', 'HTMLFrameElement', 'HTMLFrameSetElement', 'HTMLHRElement', 'HTMLHeadElement', 'HTMLHeadingElement', 'HTMLHtmlElement', 'HTMLIFrameElement', 'HTMLImageElement', 'HTMLInputElement', 'HTMLIsIndexElement', 'HTMLLIElement', 'HTMLLabelElement', 'HTMLLegendElement', 'HTMLLinkElement', 'HTMLMapElement', 'HTMLMarqueeElement', 'HTMLMediaElement', 'HTMLMenuElement', 'HTMLMetaElement', 'HTMLModElement', 'HTMLOListElement', 'HTMLObjectElement', 'HTMLOptGroupElement', 'HTMLOptionElement', 'HTMLParagraphElement', 'HTMLParamElement', 'HTMLPreElement', 'HTMLQuoteElement', 'HTMLScriptElement', 'HTMLSelectElement', 'HTMLStyleElement', 'HTMLTableCaptionElement', 'HTMLTableCellElement', 'HTMLTableColElement', 'HTMLTableElement', 'HTMLTableRowElement', 'HTMLTableSectionElement', 'HTMLTextAreaElement', 'HTMLTitleElement', 'HTMLUListElement', 'HTMLVideoElement']],
      [['CSS'], ['CSSCharsetRule', 'CSSFontFaceRule', 'CSSImportRule', 'CSSMediaRule', 'CSSPageRule', 'CSSPrimitiveValue', 'CSSRule', 'CSSRuleList', 'CSSStyleDeclaration', 'CSSStyleRule', 'CSSStyleSheet', 'CSSValue', 'CSSValueList', 'CSSVariablesDeclaration', 'CSSVariablesRule']],
      [['event handlers'], ['onabort', 'onbeforeunload', 'onblur', 'oncanplay', 'oncanplaythrough', 'onchange', 'onclick', 'oncontextmenu', 'ondblclick', 'ondrag', 'ondragend', 'ondragenter', 'ondragleave', 'ondragover', 'ondragstart', 'ondrop', 'ondurationchange', 'onemptied', 'onended', 'onerror', 'onfocus', 'onhashchange', 'oninput', 'oninvalid', 'onkeydown', 'onkeypress', 'onkeyup', 'onload', 'onloadeddata', 'onloadedmetadata', 'onloadstart', 'onmessage', 'onmousedown', 'onmousemove', 'onmouseout', 'onmouseover', 'onmouseup', 'onmousewheel', 'onoffline', 'ononline', 'onpagehide', 'onpageshow', 'onpause', 'onplay', 'onplaying', 'onpopstate', 'onprogress', 'onratechange', 'onreset', 'onresize', 'onscroll', 'onsearch', 'onseeked', 'onseeking', 'onselect', 'onstalled', 'onstorage', 'onsubmit', 'onsuspend', 'ontimeupdate', 'onunload', 'onvolumechange', 'onwaiting', 'onwebkitanimationend', 'onwebkitanimationiteration', 'onwebkitanimationstart', 'onwebkittransitionend']],
      [['uncategorized built-ins'], ['Attr', 'Audio', 'BeforeLoadEvent', 'Blob', 'CDATASection', 'CanvasRenderingContext2D', 'CharacterData', 'ClientRect', 'ClientRectList', 'Clipboard', 'Comment', 'Counter', 'DOMException', 'DOMImplementation', 'DOMParser', 'Document', 'DocumentFragment', 'DocumentType', 'Element', 'Entity', 'EntityReference', 'EvalError', 'Event', 'EventException', 'EventSource', 'File', 'FileList', 'FormData', 'Image', 'ImageData', 'KeyboardEvent', 'MediaError', 'MediaList', 'MessageChannel', 'MessageEvent', 'MessagePort', 'MimeType', 'MimeTypeArray', 'MouseEvent', 'MutationEvent', 'NamedNodeMap', 'Node', 'NodeFilter', 'NodeList', 'Notation', 'Option', 'OverflowEvent', 'PageTransitionEvent', 'Plugin', 'PluginArray', 'ProcessingInstruction', 'ProgressEvent', 'RGBColor', 'Range', 'RangeError', 'RangeException', 'Rect', 'ReferenceError', 'SharedWorker', 'Storage', 'StorageEvent', 'StyleSheet', 'StyleSheetList', 'SyntaxError', 'Text', 'TextEvent', 'TextMetrics', 'TypeError', 'UIEvent', 'URIError', 'WebKitAnimationEvent', 'WebKitCSSKeyframeRule', 'WebKitCSSKeyframesRule', 'WebKitCSSMatrix', 'WebKitCSSTransformValue', 'WebKitPoint', 'WebKitTransitionEvent', 'WebSocket', 'WheelEvent', 'Worker', 'XMLDocument', 'XMLHttpRequest', 'XMLHttpRequestException', 'XMLHttpRequestUpload', 'XMLSerializer', 'XPathEvaluator', 'XPathException', 'XPathResult', 'XSLTProcessor', 'addEventListener', 'alert', 'applicationCache', 'atob', 'blur', 'btoa', 'captureEvents', 'clearInterval', 'clearTimeout', 'clientInformation', 'close', 'closed', 'confirm', 'console', 'crypto', 'defaultStatus', 'defaultstatus', 'devicePixelRatio', 'dispatchEvent', 'document', 'event', 'find', 'focus', 'frameElement', 'frames', 'getComputedStyle', 'getMatchedCSSRules', 'getSelection', 'history', 'innerHeight', 'innerWidth', 'length', 'localStorage', 'location', 'locationbar', 'menubar', 'moveBy', 'moveTo', 'name', 'navigator', 'offscreenBuffering', 'open', 'openDatabase', 'opener', 'outerHeight', 'outerWidth', 'pageXOffset', 'pageYOffset', 'parent', 'personalbar', 'postMessage', 'print', 'prompt', 'releaseEvents', 'removeEventListener', 'resizeBy', 'resizeTo', 'screen', 'screenLeft', 'screenTop', 'screenX', 'screenY', 'scroll', 'scrollBy', 'scrollTo', 'scrollX', 'scrollY', 'scrollbars', 'self', 'sessionStorage', 'setInterval', 'setTimeout', 'showModalDialog', 'status', 'statusbar', 'stop', 'styleMedia', 'toolbar', 'top', 'webkitConvertPointFromNodeToPage', 'webkitConvertPointFromPageToNode', 'window']],
      [['uncategorized built-ins from Firefox'], ['_options', 'back', 'content', 'controllers', 'disableExternalCapture', 'dump', 'enableExternalCapture', 'forward', 'fullScreen', 'getInterface', 'globalStorage', 'home', 'mozAnimationStartTime', 'mozInnerScreenX', 'mozInnerScreenY', 'mozPaintCount', 'mozRequestAnimationFrame', 'moz_indexedDB', 'netscape', 'openDialog', 'pkcs11', 'routeEvent', 'scrollByLines', 'scrollByPages', 'scrollMaxX', 'scrollMaxY', 'setResizable', 'sizeToContent', 'updateCommands']],
      [['uncategorized built-ins from Chrome'], ['BlobBuilder', 'CanvasGradient', 'CanvasPattern', 'DOMStringList', 'FileError', 'FileReader', 'HTMLMeterElement', 'HTMLProgressElement', 'SQLException', 'TimeRanges', 'TouchEvent', 'chrome', 'chromium', 'external', 'webkitNotifications', 'webkitPerformance']],
      [['Prototype'], ['$$', '$', '$A', '$F', '$H', '$R', '$break', '$continue', '$w', 'Abstract', 'Ajax', 'Class', 'Enumerable', 'Field', 'Form', 'Hash', 'Insertion', 'ObjectRange', 'PeriodicalExecuter', 'Position', 'Prototype', 'Selector', 'Template', 'Toggle', 'Try']],
	  [['MooTools'], ['$family', 'MooTools', 'addEvent', 'addEvents', 'addListener', 'cloneEvents', 'eliminate', 'fireEvent', 'getCoordinates', 'getDocument', 'getHeight', 'getLeft', 'getPosition', 'getScroll', 'getScrollHeight', 'getScrollLeft', 'getScrollSize', 'getScrollTop', 'getScrollWidth', 'getSize', 'getTop', 'getWidth', 'getWindow', 'removeEvent', 'removeEvents', 'removeListener', 'retrieve', 'store', 'uid']],
	  [['Moousture'], ['Moousture']],
	  [['JSLint'], ['JSLINT']],
	  [['lively kernel'], ['$morph', 'ClipboardHack', 'Config', 'ContextJS', 'Converter', 'CustomJSON', 'DisplayThemes', 'Functions', 'Global', 'GlobalLayers', 'LayerStack', 'LayerableObjectTrait', 'LivelyNS', 'Loader', 'ModelMigration', 'NetRequestReporterTrait', 'NodeFactory', 'NodeStyle', 'Properties', 'Strings', 'UserAgent', 'ViewTrait', 'XHTMLNS', 'XLinkNS', 'basicResize', 'classes', 'composeLayers', 'computerLayersFor', 'connect', 'cop', 'createLayer', 'currentLayers', 'dbgOn', 'disableLayer', 'disconnect', 'disconnectAll', 'enableLayer', 'ensurePartialLayer', 'equals', 'functions', 'gather', 'getCurrentContext', 'getLayerDefinitionForObject', 'getStack', 'halt', 'initialize', 'inspect', 'interactiveEval', 'layerClass', 'layerClassAndSubclasses', 'layerGetterMethod', 'layerMethod', 'layerObject', 'layerProperty', 'layerPropertyWithShadow', 'layerSetterMethod', 'lively', 'logError', 'logStack', 'makePropertyLayerAware', 'module', 'namespace', 'namespaceIdentifier', 'newDragnDropListPane', 'newListPane', 'newPrintPane', 'newRealListPane', 'newTextListPane', 'newTextPane', 'newXenoPane', 'openStackViewer', 'printError', 'printStack', 'pt', 'rect', 'require', 'resetLayerStack', 'signal', 'subNamespaces', 'updateAttributeConnection', 'using', 'withLayers', 'withoutLayers', 'constructor']],
	  [['avocado', 'bootstrap'], ['__annotation__', 'annotator', 'hackToMakeSuperWork', 'livelyBaseURL', 'lobby', 'modules', 'prototypeAttributeIsEnumerable', 'transporter', 'waitForAllCallbacks', 'currentUser', 'doneLoadingWindow', 'isDoneLoading', 'jsQuicheBaseURL', 'kernelModuleSavingScriptURL', 'logoutURL', 'startAvocadoGoogleApp', 'urlForKernelModuleName', 'wasServedFromGoogleAppEngine', 'worldHasBeenCreated']],
      [['avocado', 'miscellaneous'], ['ArrowEndpoint', 'ArrowMorph', 'ColumnMorph', 'ComboBoxMorph', 'CoreSamplerMorph', 'EvaluatorMorph', 'HorizontalDirection', 'LayoutModes', 'MessageNotifierMorph', 'RowMorph', 'RowOrColumnMorph', 'SliceMorph', 'VerticalDirection', 'abstractOrganization', 'animation', 'anonymous_module_0', 'avocado', 'booleanHolder', 'category', 'childFinder', 'command', 'creatorSlotMarker', 'dependencies', 'dictionary', 'enumerator', 'exitValueOf', 'hashTable', 'implementorsFinder', 'javascriptReservedWords', 'littleProfiler', 'mirror', 'morphFactories', 'notifier', 'objectGraphWalker', 'organization', 'organizationChain', 'organizationUsingAnnotations', 'poses', 'quickhull', 'range', 'referenceFinder', 'reflect', 'set', 'slots', 'snapshotter', 'sound', 'stringBuffer', 'testingObjectGraphWalker', 'toggler', 'valueHolder']]
	
    ];

    globalObjectCategories.forEach(function(catAndAttrs) {
      reflect(Global).annotationForWriting().categorize(catAndAttrs[0], catAndAttrs[1]);
    });

  }, {category: ['initializing']});

});


thisModule.addSlots(avocado.menuItemContributors, function(add) {

  add.data('0', morphFactories);

  add.data('1', CoreSamplerMorph);

  add.data('2', transporter);

  add.data('3', poses);

});


});
