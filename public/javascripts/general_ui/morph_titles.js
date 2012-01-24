avocado.transporter.module.create('general_ui/morph_titles', function(requires) {

requires('general_ui/basic_morph_mixins');

}, function(thisModule) {


thisModule.addSlots(avocado.morphMixins.Morph, function(add) {

  add.method('createNameLabel', function() {
    // can't use "bind" because we can't transport closures, so instead use ownerWithAModel
    return avocado.label.create({
      initialText: this.nameUsingContextualInfoIfPossible(),
      calculateNewText: function() {
        var o = this.ownerWithAModel();
        return o ? o.nameUsingContextualInfoIfPossible() : "";
      }
    }).newMorph();
  }, {category: ['title']});

	add.method('nameUsingContextualInfoIfPossible', function() {
		try {
      if (this._model && this._model.namingScheme) {
        return this._model.namingScheme.nameInContext(this._model, this);
      }
      return this.inspect();
		} catch (err) {
			return "#<naming error: " + err + ">";
		}
	}, {category: ['title']});

  add.method('createTitleLabel', function () {
    var titleAccessors = this.titleAccessors();
    if (titleAccessors) {
      this._titleLabelMorph = avocado.infrequentlyEditedText.newMorphFor(titleAccessors, "rename", this.titleEmphasis());
      return this._titleLabelMorph;
    }
    return null;
  }, {category: ['title']});
  
  add.method('titleEmphasis', function () {
    if (this._model && typeof(this._model.titleEmphasis) === 'function') { return this._model.titleEmphasis(); }
    return null;
  }, {category: ['title']});

  add.method('titleAccessors', function () {
    if (this._model && typeof(this._model.titleAccessors) === 'function') { return this._model.titleAccessors(); }
    return null;
  }, {category: ['title']});
  
  add.method('findTitleLabel', function () {
    return this._titleLabelMorph;
  }, {category: ['title']});
  
  add.method('addTitleEditingCommandsTo', function (cmdList) {
    var titleLabel = this.findTitleLabel();
    if (titleLabel && typeof(titleLabel.editingCommands) === 'function') {
      cmdList.addAllCommands(titleLabel.editingCommands());
    }
  }, {category: ['title']});

});


});
