avocado.transporter.module.create('lk_ext/tags', function(requires) {

}, function(thisModule) {


thisModule.addSlots(avocado, function(add) {

  add.creator('tag', {}, {category: ['user interface']});

});


thisModule.addSlots(avocado.tag, function(add) {
  
  add.method('createForModelsSatisfying', function (criterion) {
    return Object.newChildOf(this, criterion);
  }, {category: ['creating']});
  
  add.method('initialize', function (criterion) {
    this._criterion = criterion;
  }, {category: ['creating']});
  
  add.method('matches', function (o) {
    return this._criterion(o);
  }, {category: ['matching']});
  
  add.method('Morph', function Morph() { Class.initializer.apply(this, arguments); }, {category: ['ui']});
  
});


thisModule.addSlots(avocado.tag.Morph, function(add) {

  add.data('superclass', Morph);

  add.data('type', 'avocado.tag.Morph');

  add.creator('prototype', Object.create(Morph.prototype));

});


thisModule.addSlots(avocado.tag.Morph.prototype, function(add) {

  add.data('constructor', avocado.tag.Morph);

  add.method('initialize', function ($super, tag, fill) {
    $super(new lively.scene.Ellipse(pt(0,0), 10));
    this._model = tag;
    this.setFill(fill);
  }, {category: ['creating']});

  add.data('shouldNotBePartOfRowOrColumn', true);
  
});


thisModule.addSlots(Morph.prototype, function(add) {

  add.method('tagColorsByType', function () {
    if (! this._tagColorsByType) {
      this._tagColorsByType = avocado.dictionary.copyRemoveAll(avocado.dictionary.identityComparator);
    }
    return this._tagColorsByType;
  }, {category: ['tagging']});
  
  add.method('addTagType', function (tagType, color) {
    this.tagColorsByType().put(tagType, color || Color.random());
    this.tagSubmorphsWithTag(tagType);
  }, {category: ['tagging']});
  
  add.method('tagSubmorphsWithTag', function (tagType) {
    var color = this.tagColorsByType().get(tagType);
    this.submorphs.forEach(function(m) {
      if (m._model && tagType.matches(m._model)) {
        var tm = new avocado.tag.Morph(tagType, color);
        m.addMorphAt(tm, pt(5,5));
      }
    });
  }, {category: ['tagging']});

});


});
