avocado.transporter.module.create('general_ui/models', function(requires) {

requires('general_ui/basic_morph_mixins');

}, function(thisModule) {


thisModule.addSlots(avocado.morphMixins.Morph, function(add) {

  add.method('setModel', function (m) {
    this._model = m;
    return this;
  }, {category: ['models']});

  add.method('inspect', function () {
		try {
      if (this._model && typeof(this._model.inspect) === 'function') { return this._model.inspect(); } // added by Adam
			return this.toString();
		} catch (err) {
			return "#<inspect error: " + err + ">";
		}
  }, {category: ['printing']});

  add.method('toString', function () {
    var t = this.findTitleLabel();
    if (t && t.getText) { return t.getText(); }
    if (this._model) { return this._model.toString(); }
    if (this.typeName) { return "a " + this.typeName; }
    if (this._layout && this._layout.morphDescription) { return this._layout.morphDescription(this); }
    return ""; // the default behaviour is annoying - makes morph mirrors very wide;
  }, {category: ['printing']});

  add.method('enclosingObjectHavingANameInScheme', function (namingScheme) {
	  var m = this.getOwner();
	  while (m) {
	    if (m._model && m._model.namingScheme) {
	      if (m._model.namingScheme === namingScheme) { return m._model; }
	    }
	    m = m.getOwner();
	  }
	  return null;
  }, {category: ['printing']});

});


});
