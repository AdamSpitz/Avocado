avocado.transporter.module.create('general_ui/morph_titles', function(requires) {

requires('general_ui/basic_morph_mixins');

}, function(thisModule) {


thisModule.addSlots(avocado.morphMixins.Morph, function(add) {

  add.method('createNameLabel', function () {
    // can't use "bind" because we can't transport closures, so instead use ownerWithAModel
    var label = avocado.label.newMorphFor({
      initialText: this.nameUsingContextualInfoIfPossible(),
      calculateNewText: function() {
        var o = this.ownerWithAModel();
        return o ? o.nameUsingContextualInfoIfPossible() : "";
      }
    });
    
    var emph = this.titleEmphasis();
    if (emph) { label.setEmphasis(emph); }
    
    return label;
  }, {category: ['title']});

  add.method('nameUsingContextualInfoIfPossible', function (optionalContext) {
		try {
		  var context = optionalContext || this;
      if (this._model && this._model.namingScheme) {
        return this._model.namingScheme.nameInContext(this._model, context);
      }
      return this.inspect();
		} catch (err) {
			return "#<naming error: " + err + ">";
		}
	}, {category: ['title']});

  add.method('createTitleLabel', function () {
    var a = this.titleAccessors();
    if (a) {
      this._titleLabelMorph = avocado.infrequentlyEditedText.newMorphFor(a, "rename", this.titleEmphasis());
    } else {
      var m = this.titleModel();
      if (m) {
        this._titleLabelMorph = avocado.ui.currentWorld().morphFor(m);
      } else {
       this._titleLabelMorph = this.createNameLabel();
      }
    }
    return this._titleLabelMorph;
  }, {category: ['title']});

  add.method('titleEmphasis', function () {
    if (this._model && typeof(this._model.titleEmphasis) === 'function') { return this._model.titleEmphasis(); }
    return null;
  }, {category: ['title']});

  add.method('titleAccessors', function () {
    if (this._model && typeof(this._model.titleAccessors) === 'function') { return this._model.titleAccessors(); }
    return null;
  }, {category: ['title']});

  add.method('titleModel', function () {
    if (this._model && typeof(this._model.titleModel) === 'function') { return this._model.titleModel(); }
    return null;
  }, {category: ['title']});

  add.method('findTitleLabel', function () {
    return this._titleLabelMorph;
  }, {category: ['title']});

  add.method('findOrCreateTitleLabel', function () {
    return this.findTitleLabel() || this.createTitleLabel();
  }, {category: ['title']});

  add.method('addTitleEditingCommandsTo', function (cmdList) {
    var titleLabel = this.findTitleLabel();
    if (titleLabel && typeof(titleLabel.editingCommands) === 'function') {
      cmdList.addAllCommands(titleLabel.editingCommands());
    }
  }, {category: ['title']});

});


});
