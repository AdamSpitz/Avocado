ButtonMorph.subclass("ExpanderMorph", {
  initialize: function($super, expandee) {
    var s = this.defaultSideLength();
    $super(pt(0, 0).extent(pt(s, s))); // aaa - should fix ButtonMorph so that its initial shape doesn't have to be a rectangle
    var model = avocado.booleanHolder.containing(false);
    this.connectModel({model: model, getValue: "isChecked", setValue: "setChecked"});
    if (expandee) { model.notifier.addObserver(function() {this.updateExpandedness();}.bind(expandee)); }
    return this;
  },

  toggle: true,
  styleClass: ['button', 'expander'],

  focusHaloBorderWidth: 0, // I don't like the halo

  defaultSideLength: function() { return 12 * (Config.fatFingers ? 2 : 1); },

  getHelpText: function() { return (this.isExpanded() ? 'Collapse' : 'Expand') + ' me'; },

  verticesForValue: function(value) {
    var s = this.defaultSideLength();
    return value ? [pt(0,0), pt(s,0), pt(s/2, s), pt(0,0)] : [pt(0,0), pt(s, s/2), pt(0,s), pt(0,0)];
  },

  changeAppearanceFor: function($super, value) {
	var fill = this.getFill();
    var baseColor = fill ? ((fill instanceof lively.paint.Gradient) ? fill.stops[0].color() : fill) : null;
    var direction = value ? lively.paint.LinearGradient.SouthNorth : lively.paint.LinearGradient.WestEast;
    var stops = [new lively.paint.Stop(0, baseColor          ),
                 new lively.paint.Stop(1, baseColor.lighter())];
    var gradient = new lively.paint.LinearGradient(stops, direction);
    if (this.shape.setVertices) {
      this.shape.setVertices(this.verticesForValue(value));
    } else {
      var oldStyle = this.makeStyleSpec();
      this.setShape(new lively.scene.Polygon(this.verticesForValue(false)));
      this.applyStyle(oldStyle); // workaround for ButtonMorphs having to start off being a rectangle
    }
    this.setFill(gradient);
    // $super(value); // Messes things up, I think. -- Adam
  },

   isExpanded: function( ) {return !!this.getModel().getValue();},
       expand: function( ) {this.setExpanded(true );},
     collapse: function( ) {this.setExpanded(false);},
  setExpanded: function(b) {if (this.isExpanded() !== !!b) {this.setValue(!!b); this.updateView("all");}},

  constructUIStateMemento: function () {
    return this.isExpanded();
  },

  assumeUIState: function (uiState, evt) {
    this.setExpanded(uiState);
  }
});

// Not sure I like this, but for now I think I want expanders to look different from regular buttons.
DisplayThemes['lively'].expander = {fill: Color.blue};
