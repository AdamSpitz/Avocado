ButtonMorph.subclass("CheckBoxMorph", {
  initialize: function($super, booleanHolder, extent, m) {
    this._model = booleanHolder || avocado.booleanHolder.containing(false);
    if (!extent) {extent = pt(15,15);}
    this.checkedMorph = m || this.createXShapedMorph(extent);
    this.checkedMorph.handlesMouseDown = function() { return true; };
    this.checkedMorph.relayMouseEvents(this, {onMouseDown: "onMouseDown", onMouseMove: "onMouseMove", onMouseUp: "onMouseUp"});
    $super(pt(0,0).extent(extent));
    this.setFill(Color.white);
    this.setFillOpacity(0.2);
    this.connectModel({model: this._model, getValue: "isChecked", setValue: "setChecked"});
    this.notifier = this._model.notifier;

    this.refreshContentOfMeAndSubmorphs();
    return this;
  },

  toggle: true,

  createXShapedMorph: function(extent) {
    return TextMorph.createLabel("X", pt(0,0), extent);
  },
  
    getValue: function( ) {return this.getModel().getValue( );},
    setValue: function(b) {return this.getModel().setValue(b);},

   isChecked: function( ) {return this.getModel().getValue( );},
  setChecked: function(b) {return this.getModel().setValue(b);},

  changeAppearanceFor: function(v) {
    if (v) {
      if (this.checkedMorph.owner !== this) {
        this.withoutAnimationAddMorphCentered(this.checkedMorph);
      }
    } else {
      if (this.checkedMorph.owner === this) {
        this.removeMorph(this.checkedMorph);
      }
    }
  },
  
  refreshContent: function() {
    this.changeAppearanceFor(this.isChecked());
  }
});

Object.extend(CheckBoxMorph, {
  createWithImage: function(imageURL, size) {
    var image = new ImageMorph(size.extentAsRectangle(), imageURL);
    image.setFill(null);
    var button = new this(size, image);
    button.setFill(null);
    return button;
  }
});
