
module('lively.Presentation').requires().toRun(function() {

Morph.subclass("lively.Presentation.PageMorph", {
	initialize: function($super, bounds) {
		$super(new lively.scene.Rectangle(bounds));
		this.setFill(Color.white);
		this.setBorderColor(Color.white);
	},
	
	okToBeGrabbedBy: Functions.Null,
	
	morphMenu: function($super, evt) { 
		var menu = $super(evt);
		
		menu.addItem(["fullscreen", function() {
			this.toggleFullScreen();
		}.bind(this)]);
		return menu;
	},
	
	toggleFullScreen: function() {
		
		if (!this.oldPosition) {
			this.oldPosition = this.getPosition();
			this.oldWorldFill = WorldMorph.current().getFill();
			var ratio =  WorldMorph.current().getExtent().y / this.getExtent().y;
			if (ratio > 0 && ratio < 100) {
				this.setScale(ratio);
				this.setPosition(pt((WorldMorph.current().getExtent().x - this.bounds().extent().x) / 2, 0));
				WorldMorph.current().setFill(Color.white);
			}
		} else {
			this.setScale(1);
			this.setPosition(this.oldPosition);
			WorldMorph.current().setFill(this.oldWorldFill);
			this.oldPosition = null;	
			this.oldWorldFill = null
		}
	},
	
	handlesMouseDown: Functions.True,
	
	onMouseDown: function ($super, evt) {
		$super(evt);
		this.makeSelection(evt); 		
        return true;
    },
		
	makeSelection: function(evt) {  //default behavior is to grab a submorph
        if (this.currentSelection != null) this.currentSelection.removeOnlyIt();
        var m = new SelectionMorph(this.localize(evt.point()).asRectangle());
        this.addMorph(m);
        this.currentSelection = m;
        var handle = new HandleMorph(pt(0,0), lively.scene.Rectangle, evt.hand, m, "bottomRight");
		handle.setExtent(pt(0, 0));
		handle.mode = 'reshape';
        m.addMorph(handle);
        evt.hand.setMouseFocus(handle);
		// evt.hand.setKeyboardFocus(handle);
    },
	
})

});

