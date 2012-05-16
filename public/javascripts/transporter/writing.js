avocado.transporter.module.create('transporter/writing', function(requires) {

}, function(thisModule) {


thisModule.addSlots(avocado.transporter.module, function(add) {

  add.creator('filerOuters', {}, {category: ['transporting']});

  add.method('codeToFileOut', function (filerOuter) {
    if (this.preFileInFunctionName) {
      filerOuter.writePreFileInFunction(this.preFileInFunctionName);
    }
    
    filerOuter.writeModule(this.name(), this._requirements, function() {
      filerOuter.fileOutSlots(this.slotsInOrderForFilingOut());
    }.bind(this));

    return filerOuter.fullText();
  }, {category: ['transporting']});

  add.method('codeOfMockFileOut', function () {
    return this.codeToFileOut(Object.newChildOf(this.filerOuters.mock)).toString();
  }, {category: ['transporting']});

  add.method('fileOutAndReportErrors', function (evt, repo, filerOuterProto) {
    avocado.transporter.fileOutPlural([{moduleVersion: this.currentVersion()}], evt, repo, filerOuterProto);
  }, {category: ['user interface', 'commands', 'filing out']});

  add.method('fileOutWithoutAnnotations', function (evt) {
    this.fileOutAndReportErrors(evt, null, avocado.transporter.module.filerOuters.annotationless);
  }, {category: ['user interface', 'commands', 'filing out']});

  add.method('printToConsole', function (evt) {
    this.fileOutAndReportErrors(evt, avocado.transporter.repositories.console, avocado.transporter.module.filerOuters.annotationless);
  }, {category: ['user interface', 'commands', 'filing out']});

  add.method('emailTheSource', function (evt) {
    this.fileOutAndReportErrors(evt, this.repository().copyWithSavingScript(avocado.transporter.emailingScriptURL));
  }, {category: ['user interface', 'commands', 'filing out']});

});


thisModule.addSlots(avocado.transporter.module.filerOuters, function(add) {

  add.creator('general', {}, {category: ['transporting']});

});


thisModule.addSlots(avocado.transporter.module.filerOuters.general, function(add) {

  add.method('create', function () {
    var o = Object.create(this);
    o.initialize.apply(o, arguments);
    return o;
  }, {category: ['creating']});

  add.method('initialize', function () {
    this._buffer = avocado.stringBuffer.create();
    this._currentHolder = null;
    this._currentHolderExpr = null;
    this._errors = [];
  }, {category: ['creating']});

  add.method('fullText', function () {
    return this._buffer.toString();
  }, {category: ['accessing']});

  add.method('fileOutSlots', function (slots) {
    slots.each(function(s) {
      try {
        if (s.isCycleBreaker) { throw new Error("Haven't finished implementing cycle-breaking yet. Need to file out a cycle-breaker."); }
        if (s.wasReplacedByCycleBreakers) { throw new Error("Haven't finished implementing cycle-breaking yet. Need to file out a slot that was replaced by a cycle-breaker."); }
        var h = s.holder();
        this.nextSlotIsIn(h, s);
        var info = s.transportableInfo();
        this.rememberNestedObjectInfoIfNecessary(s, info); // aaa HACK
        this.fileOutSlotWithInfo(info);
      } catch (ex) {
        this.errors().push(ex);
      }
    }.bind(this));
    this.doneWithThisObject();
  }, {category: ['writing']});

  add.method('rememberNestedObjectInfoIfNecessary', function (slot, info) {
    // children can override;
  }, {category: ['writing']});

  add.method('fileOutSlotWithInfo', function (info) {
    var slotAnno = info.rawAnnotation;
    var slotAnnoExpr = slotAnno ? reflect(slotAnno).expressionEvaluatingToMe() : '{}';
    var objectAnnoExpr = info.isCreator && info.contentsRawAnnotation ? reflect(info.contentsRawAnnotation).expressionEvaluatingToMe() : null;
    
    // The fileout looks a bit prettier if we don't bother showing ", {}, {}" all over the place.
    var optionalArgs = "";
    if (objectAnnoExpr && objectAnnoExpr !== '{}') {
      optionalArgs = ", " + objectAnnoExpr + optionalArgs;
    }
    if (optionalArgs !== '' || (slotAnnoExpr && slotAnnoExpr !== '{}')) {
      optionalArgs = ", " + slotAnnoExpr + optionalArgs;
    }

    this.writeSlot(info, optionalArgs);

    // aaa - hack: some browsers won't let you set __proto__ so we have to treat it specially.
    if (info.parentCreatorSlotChainExpression) {
      this.writeParentAnnotation(info);
    }
  }, {category: ['transporting']});

  add.method('setCurrentHolder', function (holder) {
    this._currentHolder = holder;
    this._currentHolderExpr = holder.creatorSlotChainExpression();
  }, {category: ['writing']});

  add.method('nextSlotIsIn', function (holder, slot) {
    if (!this._currentHolder || ! holder.equals(this._currentHolder)) {
      this.doneWithThisObject();
      avocado.transporter.reasonsForNeedingCreatorPath.recordIfExceptionDuring(function() {
        this.setCurrentHolder(holder);
      }.bind(this), avocado.transporter.reasonsForNeedingCreatorPath.objectContainsSlotInTheModule.create(slot));
      this.writeObjectStarter();
    }
  }, {category: ['writing']});

  add.method('doneWithThisObject', function () {
    if (this._currentHolder) {
      this.writeObjectEnder();
      this._currentHolder = null;
      this._currentHolderExpr = null;
    }
  }, {category: ['writing']});

  add.method('errors', function () {
    return this._errors;
  }, {category: ['error handling']});

  add.method('writePreFileInFunction', function (fnName) {
    // This is basically just a hack to let us file out the bootstrap module.
    var f = window[fnName];
    this._buffer.append("window.").append(fnName).append(" = ").append(f.toString()).append(";\n");
    this._buffer.append(fnName).append("();\n\n\n\n");
  }, {category: ['writing']});

});


thisModule.addSlots(avocado.transporter.module.filerOuters, function(add) {

  add.creator('normal', Object.create(avocado.transporter.module.filerOuters.general), {category: ['transporting']});

});


thisModule.addSlots(avocado.transporter.module.filerOuters.normal, function(add) {

  add.method('writeModule', function (name, reqs, bodyBlock) {
    //this._buffer.append("//@ sourceURL=").append(name).append(".js    so that the debugger shows the right file name when we load it using eval\n\n");
    this._buffer.append("avocado.transporter.module.create(").append(name.inspect()).append(", function(requires) {\n\n");
    
    if (reqs && reqs.length > 0) {
      reqs.each(function(req) {
        this._buffer.append("requires(").append(req.inspect()).append(");\n");
      }.bind(this));
      this._buffer.append("\n");
    }

    this._buffer.append("}, function(thisModule) {\n\n\n");

    bodyBlock();

    this._buffer.append("});\n");
  }, {category: ['writing']});

  add.method('writeObjectStarter', function () {
    this._buffer.append("thisModule.addSlots(").append(this._currentHolderExpr).append(", function(add) {\n\n");
  }, {category: ['writing']});

  add.method('writeObjectEnder', function () {
    this._buffer.append("});\n\n\n");
  }, {category: ['writing']});

  add.method('writeSlot', function (info, optionalArgs) {
    this._buffer.append("  add.").append(info.creationMethod).append("('").append(info.name).append("', ").append(info.contentsExpr);
    this._buffer.append(optionalArgs);
    this._buffer.append(");\n\n");
  }, {category: ['writing']});

  add.method('writeParentAnnotation', function (info) {
    var objectAnnoExpr = info.parentRawAnnotation ? reflect(info.parentRawAnnotation).expressionEvaluatingToMe() : 'null';
    
    this._buffer.append("  avocado.annotator.loadObjectAnnotation(");
    this._buffer.append(info.parentCreatorSlotChainExpression);
    this._buffer.append(", ").append(objectAnnoExpr);
    this._buffer.append(", ").append(info.parentSlotName.inspect());
    this._buffer.append(", ").append(info.parentHolderCreatorSlotChainExpression);
    this._buffer.append(");\n\n");
    
    /* aaa - Hmm, maybe it's OK for parent slots to have annotations, now that I have this hack?
    var slotAnnoExpr = info.parentRawSlotAnnotation ? reflect(info.parentRawSlotAnnotation).expressionEvaluatingToMe() : null;
    if (slotAnnoExpr) {
      this._buffer.append("  Object.extend(avocado.annotator.annotationOf(");
      this._buffer.append(info.parentHolderCreatorSlotChainExpression);
      this._buffer.append(").slotAnnotation(").append(info.parentSlotName.inspect());
      this._buffer.append("), ").append(slotAnnoExpr).append(");\n");
    }
    */
    
    this._buffer.append("\n");
  }, {category: ['writing']});

});


thisModule.addSlots(avocado.transporter.module.filerOuters, function(add) {

  add.creator('justBody', Object.create(avocado.transporter.module.filerOuters.normal), {category: ['transporting']});

});


thisModule.addSlots(avocado.transporter.module.filerOuters.justBody, function(add) {

  add.method('writeModule', function (name, reqs, bodyBlock) {
    this._buffer.append("function(thisModule) {\n\n\n");

    bodyBlock();

    this._buffer.append("}");
  }, {category: ['writing']});

});


thisModule.addSlots(avocado.transporter.module.filerOuters, function(add) {

  add.creator('annotationless', Object.create(avocado.transporter.module.filerOuters.general), {category: ['transporting']});

});


thisModule.addSlots(avocado.transporter.module.filerOuters.annotationless, function(add) {

  add.method('writeModule', function (name, reqs, bodyBlock) {
    this._buffer.append("if (typeof(window.modules) === 'object') { modules[").append(name.inspect()).append("] = {}; }\n\n");
    bodyBlock();
  }, {category: ['writing']});

  add.method('writeObjectStarter', function () {
    // I don't like having to depend on an 'extend' method. Either we
    // define 'extend' as a local function at the start of the file, or
    // we just keep writing out the name of the object over and over.
    // Let's try the latter for now; it actually kinda looks cleaner. -- Adam
    // this._buffer.append("Object.extend(").append(this._currentHolderExpr).append(", {\n\n");
  }, {category: ['writing']});

  add.method('writeObjectEnder', function () {
    // this._buffer.append("});\n\n\n");
    this._buffer.append("\n\n");
  }, {category: ['writing']});

  add.method('writeSlot', function (info, optionalArgs) {
    this._buffer.append(this._currentHolderExpr).append(".").append(info.name).append(" = ").append(info.contentsExpr).append(";\n\n");
  }, {category: ['writing']});

  add.method('writeParentAnnotation', function (info) {
    // nothing to do here, I think;
  }, {category: ['writing']});

});


thisModule.addSlots(avocado.transporter.module.filerOuters, function(add) {

  add.creator('json', Object.create(avocado.transporter.module.filerOuters.general), {category: ['transporting']});

});


thisModule.addSlots(avocado.transporter.module.filerOuters.json, function(add) {

  add.method('initialize', function ($super, db) {
    $super();
    this._db = db;
    this._indention = 0;
  }, {category: ['creating']});

  add.method('writeModule', function (name, reqs, bodyBlock) {
    throw new Error("Can we do modules with the JSON filer outer?");
  }, {category: ['writing']});

  add.method('indent', function () {
    for (var i = 0; i < this._indention; ++i) { this._buffer.append("  "); }
  }, {category: ['writing']});

  add.method('rememberNestedObjectInfoIfNecessary', function (slot, info) {
    // aaa - hack for nested objects, since JSON isn't flexible about the order - gotta
    // do sub-objects right there in the middle of the container object.
    if (info.isCreator) {
      info.slotsOfNestedObject = slot.contents().normalSlots();
    }
  }, {category: ['writing']});

  add.method('writeObjectStarter', function () {
    this._buffer.append(this._currentHolder.isReflecteeArray() ? "[" : "{");
    this._indention += 1;
    this._slotSeparator = "";
  }, {category: ['writing']});

  add.method('writeObjectEnder', function () {
    this._indention -= 1;
    this._buffer.append("\n");
    this.indent();
    this._buffer.append(this._currentHolder.isReflecteeArray() ? "]" : "}");
  }, {category: ['writing']});

  add.method('setCurrentHolder', function (holder) {
    this._currentHolder = holder;
    // don't actually need this._currentHolderExpr, and trying to get the holder's
    // creatorSlotChainExpression will cause an error if we're doing the __creatorPath thing. -- Adam;
  }, {category: ['writing']});

  add.method('temporarilySwitchHolder', function (f) {
    var currentHolder = this._currentHolder;
    this._currentHolder = null;
    var result = f();
    this.doneWithThisObject();
    this._currentHolder = currentHolder;
    return result;
  }, {category: ['writing']});

  add.method('writeSlot', function (info, optionalArgs) {
    this._buffer.append(this._slotSeparator).append("\n");
    this.indent();
    
    var slotName = info.name;
    if (this._currentHolder.isReflecteeArray()) {
      if (parseInt(slotName, 10).toString() !== slotName) {
        throw new Error("Trying to file out an array that has a slot named " + slotName);
      }
    } else {
      var slotNameToWrite = slotName;
      if (slotNameToWrite[0] === '_' && !info.isHardWired) { slotNameToWrite = 'underscoreReplacement' + slotNameToWrite; }
      if (info.isReferenceToWellKnownObjectThatIsCreatedElsewhere) { slotNameToWrite = slotNameToWrite + "__creatorPath"; }
      if (info.remoteReference) { slotNameToWrite = slotNameToWrite + "__id"; }
      this._buffer.append(slotNameToWrite.inspect(true)).append(": ");
    }
    
    if (info.isCreator) {
      this.temporarilySwitchHolder(function() {
        this.fileOutSlots(info.slotsOfNestedObject);
      }.bind(this));
    } else if (info.isReferenceToWellKnownObjectThatIsCreatedElsewhere) {
      this.temporarilySwitchHolder(function() {
        this.fileOutSlots(reflect(info.isReferenceToWellKnownObjectThatIsCreatedElsewhere).normalSlots());
      }.bind(this));
    } else if (info.remoteReference) {
      var ref = info.remoteReference;
      if (! (ref.realm() && typeof(ref.id()) !== 'undefined')) { throw new Error("Trying to file out a remote reference, but not sure where it lives. The object is " + ref.object()); }
      if (ref.realm() === this._db) {
        this._buffer.append(("" + ref.id()).inspect(true));
      } else {
        throw new Error("Not implemented yet: how do we file out a remote ref to an object in a whole nother DB?");
      }
    } else {
      // JSON only accepts double-quotes.
      // aaa - Should probably do something to avoid the "eval".
      if (info.contentsExpr[0] === "'" && info.contentsExpr[info.contentsExpr.length - 1] === "'") {
        info.contentsExpr = eval(info.contentsExpr).inspect(true);
      }
      
      this._buffer.append(info.contentsExpr);
    }
    this._slotSeparator = ",";
  }, {category: ['writing']});

  add.method('writeParentAnnotation', function (info) {
    // nothing to do here, I think;
  }, {category: ['writing']});

});


thisModule.addSlots(avocado.transporter.module.filerOuters, function(add) {

  add.creator('mock', Object.create(avocado.transporter.module.filerOuters.general), {category: ['transporting']});

});


thisModule.addSlots(avocado.transporter.module.filerOuters.mock, function(add) {

  add.method('writeModule', function (name, reqs, bodyBlock) {
    this._buffer.append("start module ").append(name).append("\n");
    bodyBlock();
  }, {category: ['writing']});

  add.method('writeObjectStarter', function () {
    this._buffer.append("  start object ").append(this._currentHolderExpr).append("\n");
  }, {category: ['writing']});

  add.method('writeObjectEnder', function () {
    this._buffer.append("  end object ").append(this._currentHolderExpr).append("\n");
  }, {category: ['writing']});

  add.method('writeSlot', function (info, optionalArgs) {
    this._buffer.append("    slot ").append(info.name).append(": ").append(info.contentsExpr).append("\n");
  }, {category: ['writing']});

  add.method('writeParentAnnotation', function (info) {
    this._buffer.append("    parent slot ").append(info.parentCreatorSlotChainExpression).append("\n");
  }, {category: ['writing']});

});


});
