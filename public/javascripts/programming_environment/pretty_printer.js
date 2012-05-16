avocado.transporter.module.create('programming_environment/pretty_printer', function(requires) {

requires('narcissus/jsparse');
requires('core/testFramework');
requires('reflection/mirror');

}, function(thisModule) {


thisModule.addSlots(avocado, function(add) {

  add.creator('prettyPrinter', {}, {category: ['manipulating code'], comment: 'Not usable yet. Just an experiment I was trying. -- Adam'});

});


thisModule.addSlots(avocado.prettyPrinter, function(add) {

  add.method('create', function (node, options) {
    return Object.newChildOf(this, node, options);
  }, {category: ['creating']});

  add.method('initialize', function (node, options) {
    this._rootNode = node;
    this._buffer = avocado.stringBuffer.create();
    this._indentationLevel = options.indentationLevel || 0;
    this._spacesPerIndent = 2;
    this.prettyPrint(node);
  }, {category: ['creating']});

  add.creator('tests', Object.create(avocado.testCase), {category: ['tests']});

  add.method('result', function () {
    return this._buffer.toString();
  }, {category: ['accessing']});

  add.method('prettyPrint', function (node) {
    var i;
    // console.log("prettyPrint encountered node type: " + tokens[node.type]);
    
    var nodeTypes = jsParse.nodeTypes; // aaa get them out of the global namespace
    
    switch(node.type) {
    case nodeTypes.SCRIPT:
      for (i = 0; i < node.length; ++i) {
        if (i > 0) { this.newLine(); }
        this.prettyPrint(node[i]);
      }
      break;
    case nodeTypes.BLOCK:
      this._buffer.append("{");
      if (node.length === 0) {
      } else if (node.length === 1) {
        this._buffer.append(" ");
        this.prettyPrint(node[0]);
        this._buffer.append(" ");
      } else {
        this.indent();
        this.newLine();
        for (i = 0; i < node.length; ++i) {
          this.prettyPrint(node[i]);
          if (i === node.length - 1) { this.unindent(); }
          this.newLine();
        }
      }
      this._buffer.append("}");
      break;
    case nodeTypes.VAR:
      this._buffer.append("var ");
      for (i = 0; i < node.length; ++i) {
        if (i > 0) { this._buffer.append(", "); }
        this.prettyPrint(node[i]);
      }
      this._buffer.append(";");
      break;
    case nodeTypes.SEMICOLON:
      this.prettyPrint(node.expression);
      this._buffer.append(";");
      break;
    case nodeTypes.IDENTIFIER:
      this._buffer.append(node.value);
      if (node.initializer) {
        this._buffer.append(" = ");
        this.prettyPrint(node.initializer);
      }
      break;
    case nodeTypes.THIS:
    case nodeTypes.NULL:
    //case nodeTypes.UNDEFINED:
    case nodeTypes.TRUE:
    case nodeTypes.FALSE:
    case nodeTypes.NUMBER:
    case nodeTypes.REGEXP:
      this._buffer.append(node.value);
      break;
    case nodeTypes.STRING:
      var rightKindOfQuote = node.tokenizer.source[node.start];
      this._buffer.append(rightKindOfQuote).append(node.value).append(rightKindOfQuote);
      break;
    case nodeTypes.OBJECT_INIT:
      this._buffer.append("{");
      for (i = 0; i < node.length; ++i) {
        if (i > 0) { this._buffer.append(", "); }
        this.prettyPrint(node[i]);
      }
      this._buffer.append("}");
      break;
    case nodeTypes.PROPERTY_INIT:
      this.prettyPrint(node[0]);
      this._buffer.append(": ");
      this.prettyPrint(node[1]);
      break;
    case nodeTypes.ARRAY_INIT:
      this._buffer.append("[");
      for (i = 0; i < node.length; ++i) {
        if (i > 0) { this._buffer.append(", "); }
        this.prettyPrint(node[i]);
      }
      this._buffer.append("]");
      break;
    case nodeTypes.ASSIGN:
      this.prettyPrint(node[0]);
      this._buffer.append(" = ");
      this.prettyPrint(node[1]);
      break;
    case nodeTypes.GROUP:
      if (node.value !== '(') { throw new Error("Unknown type of group: not open-paren"); }
      this._buffer.append("(");
      if (node.length !== 1) { throw new Error("Unknown type of group: not just one member"); }
      this.prettyPrint(node[0]);
      this._buffer.append(")");
      break;
    case nodeTypes.CALL:
      this.prettyPrint(node[0]);
      this._buffer.append("(");
      this.prettyPrint(node[1]);
      this._buffer.append(")");
      break;
    case nodeTypes.DELETE:
      this._buffer.append("delete ");
      this.prettyPrint(node[0]);
      break;
    case nodeTypes.BREAK:
      this._buffer.append("break;");
      break;
    case nodeTypes.NEW:
      this._buffer.append("new ");
      this.prettyPrint(node[0]);
      break;
    case nodeTypes.NEW_WITH_ARGS:
      this._buffer.append("new ");
      this.prettyPrint(node[0]);
      this._buffer.append("(");
      this.prettyPrint(node[1]);
      this._buffer.append(")");
      break;
    case nodeTypes.DOT:
      this.prettyPrint(node[0]);
      this._buffer.append(".");
      this.prettyPrint(node[1]);
      break;
    case nodeTypes.LIST:
      for (i = 0; i < node.length; ++i) {
        if (i > 0) { this._buffer.append(", "); }
        this.prettyPrint(node[i]);
      }
      break;
    case nodeTypes.INDEX:
      this.prettyPrint(node[0]);
      this._buffer.append("[");
      this.prettyPrint(node[1]);
      this._buffer.append("]");
      break;
    case nodeTypes.FUNCTION:
      if (node.functionForm === jsParse.functionForms.EXPRESSED_FORM || node.functionForm === jsParse.functionForms.DECLARED_FORM) {
        this._buffer.append("function ");
        if (node.name) { this._buffer.append(node.name); }
        this._buffer.append("(");
        for (i = 0; i < node.params.length; ++i) {
          if (i > 0) { this._buffer.append(", "); }
          this._buffer.append(node.params[i]);
        }
        this._buffer.append(") {");
        switch (node.body.length) {
        case 0:
          this.prettyPrint(node.body);
          break;
        case 1:
          this._buffer.append(" ");
          this.prettyPrint(node.body);
          this._buffer.append(" ");
          break;
        default:
          this.indentDuring(function() {
            this.newLine();
            this.prettyPrint(node.body);
          }.bind(this));
          this.newLine();
        }
        this._buffer.append("}");
        break;
      }
      avocado.ui.grab(reflect(node));
      throw new Error("prettyPrinter encountered unknown FUNCTION type: " + node.functionForm);
    case nodeTypes.IF:
      this._buffer.append("if (");
      this.prettyPrint(node.condition);
      this._buffer.append(") ");
      this.prettyPrint(node.thenPart);
      if (node.elsePart) {
        this._buffer.append(" else ");
        this.prettyPrint(node.elsePart);
      }
      break;
    case nodeTypes.FOR:
      this._buffer.append("for (");
      this.prettyPrint(node.setup);
      // hack - sometimes the setup is an expression, sometimes it's a var statement; is there a clean way to do this? -- Adam
      if (node.setup.type !== nodeTypes.VAR) { this._buffer.append(";"); }
      this._buffer.append(" ");
      this.prettyPrint(node.condition);
      this._buffer.append("; ");
      this.prettyPrint(node.update);
      this._buffer.append(") ");
      this.prettyPrint(node.body);
      break;
    case nodeTypes.WHILE:
      this._buffer.append("while (");
      this.prettyPrint(node.condition);
      this._buffer.append(") ");
      this.prettyPrint(node.body);
      break;
    case nodeTypes.DO:
      this._buffer.append("do ");
      this.prettyPrint(node.body);
      this._buffer.append(" while (");
      this.prettyPrint(node.condition);
      this._buffer.append(");");
      break;
    case nodeTypes.FOR_IN:
      this._buffer.append("for (");
      if (node.varDecl) { this._buffer.append("var "); }
      this.prettyPrint(node.iterator);
      this._buffer.append(" in ");
      this.prettyPrint(node.object);
      this._buffer.append(") ");
      this.prettyPrint(node.body);
      break;
    case nodeTypes.TRY:
      this._buffer.append("try ");
      this.prettyPrint(node.tryBlock);
      node.catchClauses.each(function(catchClause) {
        this._buffer.append(" catch (").append(catchClause.varName).append(") ");
        this.prettyPrint(catchClause.block);
      }.bind(this));
      if (node.finallyBlock) {
        this._buffer.append(" finally ");
        this.prettyPrint(node.finallyBlock);
      }
      break;
    case nodeTypes.WITH:
      this._buffer.append("with (");
      this.prettyPrint(node.object);
      this._buffer.append(") ");
      this.prettyPrint(node.body);
      break;
    case nodeTypes.SWITCH:
      this._buffer.append("switch (");
      this.prettyPrint(node.discriminant);
      this._buffer.append(") {");
      this.newLine();
      for (i = 0; i < node.cases.length; ++i) {
        var c = node.cases[i];
        if (i === node.defaultIndex) {
          this._buffer.append("default");
        } else {
          this._buffer.append("case ");
          this.prettyPrint(c.caseLabel);
        }
        this._buffer.append(":");
        this.indent();
        c.statements.each(function(s) {
          this.newLine();
          this.prettyPrint(s);
        }.bind(this));
        this.unindent();
        this.newLine();
      }
      this._buffer.append("}");
      break;
    case nodeTypes.RETURN:
      if (typeof(node.value) === 'object') {
        this._buffer.append("return ");
        this.prettyPrint(node.value);
        this._buffer.append(";");
      } else {
        this._buffer.append("return;");
      }
      break;
    case nodeTypes.THROW:
      this._buffer.append("throw ");
      this.prettyPrint(node.exception);
      this._buffer.append(";");
      break;
    case nodeTypes.TYPEOF:
      this._buffer.append("typeof");
      // I sometimes write typeof(3), sometimes typeof 3.
      if (node[0].type !== nodeTypes.GROUP) { this._buffer.append(" "); }
      this.prettyPrint(node[0]);
      break;
    case nodeTypes.NOT:
      this._buffer.append("!");
      this.prettyPrint(node[0]);
      break;
    case nodeTypes.UNARY_MINUS:
      this._buffer.append("-");
      this.prettyPrint(node[0]);
      break;
    case nodeTypes.INCREMENT:
    case nodeTypes.DECREMENT:
      if (node.postfix) {
        this.prettyPrint(node[0]);
        this._buffer.append(node.value);
      } else {
        this._buffer.append(node.value);
        this.prettyPrint(node[0]);
      }
      break;
    case nodeTypes.OR:
    case nodeTypes.AND:
    case nodeTypes.BITWISE_OR:
    case nodeTypes.BITWISE_XOR:
    case nodeTypes.BITWISE_AND:
    case nodeTypes.EQ: case nodeTypes.NE: case nodeTypes.STRICT_EQ: case nodeTypes.STRICT_NE:
    case nodeTypes.LT: case nodeTypes.LE: case nodeTypes.GE: case nodeTypes.GT:
    case nodeTypes.INSTANCEOF:
    case nodeTypes.LSH: case nodeTypes.RSH: case nodeTypes.URSH:
    case nodeTypes.PLUS: case nodeTypes.MINUS:
    case nodeTypes.MUL: case nodeTypes.DIV: case nodeTypes.MOD:
      this.prettyPrint(node[0]);
      this._buffer.append(" ").append(node.value).append(" ");
      this.prettyPrint(node[1]);
      break;
    case nodeTypes.HOOK:
      this.prettyPrint(node[0]);
      this._buffer.append(" ? ");
      this.prettyPrint(node[1]);
      this._buffer.append(" : ");
      this.prettyPrint(node[2]);
      break;
    default:
      avocado.ui.grab(reflect(node));
      var errorMsg = "prettyPrinter encountered unknown node type: " + jsParse.tokens[node.type];
      console.log(errorMsg);
      throw new Error(errorMsg);
    }
  }, {category: ['formatting']});

  add.method('newLine', function () {
    this._buffer.append("\n");
    for (var i = 0; i < this._indentationLevel; ++i) { this._buffer.append(" "); }
  }, {category: ['formatting']});

  add.method('indentDuring', function (f) {
    this.indent();
    try {
      return f();
    } finally {
      this.unindent();
    }
  }, {category: ['formatting']});

  add.method('indent', function (f) {
    this._indentationLevel += this._spacesPerIndent;
  }, {category: ['formatting']});

  add.method('unindent', function (f) {
    this._indentationLevel -= this._spacesPerIndent;
  }, {category: ['formatting']});

});


thisModule.addSlots(avocado.prettyPrinter.tests, function(add) {

  add.method('functionToFormat1', function () {
    var nothing = function () {};
    var f = function (a) { return a + 4; };
    callAFunction(f, 42);
    var obj = {a: 4, b: 5};
    obj.a;
    f.callAMethod(3, obj);
  });

  add.method('functionToFormat2', function () {
    f = this;
    var arr = obj.a < 3 ? [1, 2, 'three'] : null;
    if (true) {
      lalala();
      return;
    }
    if (false) { bleh(); } else { blah(); }
  });

  add.method('functionToFormat3', function () {
    for (var i = 0; i < n; i++) {
      throw new Error("blah blah");
      ++i;
      --i;
      i--;
    }
    for (i = -2; i < n; i++) { something(); }
    new f['three'];
    delete f.pleh;
    f.match(/abc/g);
    return 'lalala';
  });

  add.method('functionToFormat4', function () {
    function localFunc() { argle(); }
    if (typeof(3) === typeof 4) { return 'good'; }
    with (window) { eval('"something"'); }
    try {
      one();
      two();
    } catch (ex) {
      nothing();
      doStuff();
    } finally {
      yeah();
      for (n in o) { alsoGreat(); }
      for (var n in o) { great(); }
    }
  });

  add.method('functionToFormat5', function () {
    while (true) { doSomething(); }
    do {
      one();
      two();
    } while (x < 4);
    switch (x) {
    case 3:
      blah();
      break;
    default:
      noodle();
    }
  });

  add.method('checkFunction', function (f) {
    // Gotta start with indentationLevel 2 because that's how we write all the
    // code in the source files here. -- Adam
    this.assertEqual(f.toString(), reflect(f).prettyPrint({indentationLevel: 2}));
  });

  add.method('test1', function () {
    this.checkFunction(this.functionToFormat1);
  });

  add.method('test2', function () {
    this.checkFunction(this.functionToFormat2);
  });

  add.method('test3', function () {
    this.checkFunction(this.functionToFormat3);
  });

  add.method('test4', function () {
    this.checkFunction(this.functionToFormat4);
  });

  add.method('test5', function () {
    this.checkFunction(this.functionToFormat5);
  });

});


thisModule.addSlots(avocado.mirror, function(add) {

  add.method('prettyPrint', function (options) {
    var expr = this.expressionEvaluatingToMe(true);
    var stmt = avocado.stringBuffer.create('var ___contents___ = (').append(expr).append(');').toString();
    // need the assignment and the semicolon so that the parser doesn't gripe about not having a function name
    var rootNode = jsParse.parse(stmt);
    var contentsNode = rootNode[0][0].initializer[0]; // bypass the nodes for the __contents__ statement
    return avocado.prettyPrinter.create(contentsNode, options).result();
  }, {category: ['pretty printing']});

});


});
