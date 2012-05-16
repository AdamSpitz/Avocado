avocado.transporter.module.create('general_ui/similar_objects', function(requires) {

}, function(thisModule) {


thisModule.addSlots(avocado, function(add) {

  add.creator('groupOfSimilarObjects', {}, {category: ['user interface']});

});


thisModule.addSlots(avocado.groupOfSimilarObjects, function(add) {

  add.method('create', function () {
    var g = Object.create(this);
    g.initialize.apply(g, arguments);
    return g;
  }, {category: ['creating']});

  add.method('initialize', function (objects, commonProperties) {
    this._objects = objects;
    this._commonProperties = commonProperties;
  }, {category: ['creating']});

  add.method('toString', function () {
    return "Group of somethings";
  }, {category: ['printing']});

  add.method('eachObject', function (f) {
    this._objects.forEach(f);
  }, {category: ['iterating']});

  add.method('disableHeader', function () {
    this._disableHeader = true;
    return this;
  }, {category: ['header']});

  add.method('enableHeader', function () {
    this._disableHeader = false;
    return this;
  }, {category: ['header']});

  add.method('disableObjectNames', function () {
    this._disableObjectNames = true;
    return this;
  }, {category: ['header']});

  add.method('enableObjectNames', function () {
    this._disableObjectNames = false;
    return this;
  }, {category: ['header']});

  add.method('beVertical', function () {
    this._shouldTableBeVertical = true;
    return this;
  }, {category: ['direction']});

  add.method('beHorizontal', function () {
    this._shouldTableBeVertical = false;
    return this;
  }, {category: ['direction']});

  add.method('newMorph', function () {
    var morph = avocado.ui.newMorph().useTableLayout(this._shouldTableBeVertical ? avocado.table.contents.columnPrototype : avocado.table.contents.rowPrototype);
    morph.setModel(this).applyStyle(this.defaultMorphStyle);
    morph.setPotentialContentMorphsFunction(function() {
      var commonProperties = this._commonProperties;
      if (!commonProperties) {
        var setOfCommonProperties = avocado.set.copyRemoveAll();
        // aaa - this'll be slow for big lists of objects; maybe allow the option of just using the first one?
        this._objects.forEach(function(o) {
          o.propertiesToShow().forEach(function(p) { setOfCommonProperties.add(p); });
        });
        commonProperties = setOfCommonProperties.toArray().sort();
      }
      
      var cells = [];
      if (! this._disableHeader) {
        var header = [];
        if (! this._disableObjectNames) { header.push(avocado.label.newMorphFor("")); }
        commonProperties.forEach(function(p) { header.push(avocado.label.create(p).setEmphasis(avocado.label.emphasiseses.bold).newMorph()); }); 
        cells.push(header);
      }
      var world = avocado.ui.currentWorld();
      this._objects.forEach(function(o) {
        var line = [];
        var objectName = o && o.namingScheme ? o.namingScheme.nameInContext(o, morph) : "" + o;
        if (! this._disableObjectNames) { line.push(avocado.label.create(objectName).setEmphasis(avocado.label.emphasiseses.bold).newMorph()); }
        commonProperties.forEach(function(p) {
          var v;
          if (typeof(o.valueOfProperty) === 'function') {
            v = o.valueOfProperty(p);
          } else {
            v = o[p].call(o);
          }
          
          var valueMorph;
          if (typeof(v) === 'string') {
            valueMorph = avocado.label.newMorphFor(v);
          } else if (v && v.isMorph) {
            valueMorph = v;
          } else {
            valueMorph = world.morphFor(v);
          }
          // aaa - I like the idea, but this doesn't end up looking quite right.
          // if (typeof(o.updateStyleOfMorph) === 'function') { o.updateStyleOfMorph(valueMorph); }
          line.push(valueMorph);
        });
        cells.push(line);
      }.bind(this));
      return avocado.table.contents.create(cells, this._shouldTableBeVertical ? avocado.directions.vertical : avocado.directions.horizontal);
    }.bind(this));
    morph.refreshContentOfMeAndSubmorphs();
    return morph;
  }, {category: ['user interface']});

  add.creator('defaultMorphStyle', {}, {category: ['user interface']});

});


thisModule.addSlots(avocado.groupOfSimilarObjects.defaultMorphStyle, function(add) {

  add.data('fill', null);

});


});
