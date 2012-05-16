avocado.transporter.module.create('lk_ext/collection_morph', function(requires) {

requires('general_ui/table_layout');
requires('lk_ext/shortcuts');

}, function(thisModule) {


thisModule.addSlots(Array.prototype, function(add) {

  add.method('newMorph', function (columnsToShow, dropCriteria) {
    return new avocado.CollectionMorph(this, columnsToShow, dropCriteria);
  }, {category: ['user interface']});

});


thisModule.addSlots(avocado, function(add) {

  add.method('CollectionMorph', function CollectionMorph() { Class.initializer.apply(this, arguments); }, {category: ['ui']});

});


thisModule.addSlots(avocado.CollectionMorph, function(add) {

  add.data('displayName', 'CollectionMorph');

  add.data('superclass', Morph);

  add.data('type', 'avocado.CollectionMorph');

  add.creator('prototype', Object.create(Morph.prototype));

});


thisModule.addSlots(avocado.CollectionMorph.prototype, function(add) {

  add.data('constructor', avocado.CollectionMorph);

  add.method('initialize', function ($super, collection, columnsToShow, dropCriteria) {
    $super(lively.scene.Rectangle.createWithIrrelevantExtent());
    this._collection = collection;
    this._columnsToShow = (columnsToShow || [{name: 'Name', valueOf: function(o) { return Object.inspect(o); }}]).map(function(c) {
      if (typeof(c) === 'string') {
        return {
          name: c,
          valueOf: function(o) {
            var f = o[c];
            if (typeof(f) !== 'function') { throw "Unknown function: " + c; }
            return f.call(o);
          }
        };
      } else if (typeof(c.valueOf) === 'string') {
        return Object.extend(Object.shallowCopy(c), {
          valueOf: function(o) {
            var f = o[c.valueOf];
            if (typeof(f) !== 'function') { throw "Unknown function: " + c.valueOf; }
            return f.call(o);
          }
        });
      } else {
        return c;
      }
    });
    this._dropCriteria = dropCriteria;
    
    this.applyStyle(this.defaultStyle);
    
    this._headerRow = this._columnsToShow.map(function(c) { return this.headerMorphFor(c.name); }.bind(this));
    this.refreshContent();
  }, {category: ['creating']});

  add.creator('defaultStyle', {}, {category: ['styles']});

  add.method('headerMorphFor', function (name) {
    var m = ButtonMorph.createButton(name, function(evt) {}, 1);
    return m;
  }, {category: ['content']});

  add.method('cellMorphFor', function (o) {
    var s = "";
    if (o !== null && typeof(o) !== 'undefined') { s = o.toString(); }
    var m = avocado.label.newMorphFor(s);
    return m;
  }, {category: ['content']});

  add.method('rowOfCellMorphsFor', function (o) {
    return this._columnsToShow.map(function(col) {
      var v;
      try {
        v = col.valueOf(o);
      } catch (ex) {
        v = 'Error: ' + ex;
      }
      return this.cellMorphFor(v);
    }.bind(this));
  }, {category: ['content']});

  add.method('potentialContentMorphs', function () {
    return avocado.table.contents.createWithRows([this._headerRow].concat(this._collection.map(function(o) {
      return this.rowOfCellMorphsFor(o);
    }.bind(this))));
  }, {category: ['content']});

  add.method('acceptsDropping', function (m) {
    return m.associatedObjectSatisfying(this._dropCriteria) !== null;
  }, {category: ['drag and drop']});

  add.method('showPotentialDrops', function (potentialDrops, evt) {
    this._potentialDropInsertionIndex = this.determineIndexForPotentialDrops(evt);
    var content = this.potentialContentMorphs();
    for (var j = potentialDrops.length - 1; j >= 0; --j) {
      var o = potentialDrops[j].associatedObjectSatisfying(this._dropCriteria);
      var row = this.rowOfCellMorphsFor(o);
      row.each(function(m) { m.setFill(Color.neutral.gray); m.setFillOpacity(0.3); });
      content.insertPrimaryLine(row, this._potentialDropInsertionIndex + 1);
    }
    this.replaceContentWith(content);
  }, {category: ['drag and drop']});

  add.method('determineIndexForPotentialDrops', function (evt) {
    if (! this.insertionIndexMatters()) { return this._collection.size(); }
    
    var p = this.localize(evt.point());
    var morphs = this.submorphsParticipatingInLayout().toArray();
    var numCols = this._columnsToShow.size();
    for (var i = 1; i * numCols < morphs.length; i += 1) {
      var m = morphs[i * numCols];
      if (m && m.getPosition().y >= p.y) { break; }
    }
    return i - 1;
  }, {category: ['drag and drop']});

  add.method('hidePotentialDrops', function (evt) {
    delete this._potentialDropInsertionIndex;
    this.refreshContent();
  }, {category: ['drag and drop']});

  add.method('justReceivedDrop', function (m, hand) {
    var o = m.associatedObjectSatisfying(this._dropCriteria);
    if (o === null) { return; }
    if (this.insertionIndexMatters() && typeof(this._potentialDropInsertionIndex) === 'number') {
      this._collection.splice(this._potentialDropInsertionIndex, 0, o);
    } else {
      this._collection.add(o);
    }
    this.refreshContent();
    
    this.world().addMorphAt(m, hand.getPosition());
		var previousOwner    = hand.grabInfo[0];
		var previousPosition = hand.grabInfo[1];
		m.ensureIsInWorld(previousOwner.world(), previousPosition, true, false, false, function() {
			previousOwner.addMorph(m);
		});
  }, {category: ['drag and drop']});

  add.method('insertionIndexMatters', function () {
    return this._collection.canInsert || reflect(this._collection).isReflecteeArray();
  }, {category: ['testing']});

  add.data('padding', {top: 2, bottom: 2, left: 4, right: 4, between: {x: 3, y: 3}}, {initializeTo: '{top: 2, bottom: 2, left: 4, right: 4, between: {x: 3, y: 3}}'});

  add.data('fillBase', new Color(1, 0.8, 0.5));

  add.data('borderRadius', 10);

  add.data('openForDragAndDrop', false);

});


});
