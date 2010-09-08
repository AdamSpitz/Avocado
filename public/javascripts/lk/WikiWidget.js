module('lively.WikiWidget').requires('lively.Ometa','lively.WikiParser').toRun(function() {

PanelMorph.subclass('WikiWidgetPanel', {

	onDeserialize: function() {
    // dbgOn(true)
		var widget = new WikiWidget();
		this.owner.targetMorph = this.owner.addMorph(widget.buildView(this.getExtent()));
		this.owner.targetMorph.setPosition(this.getPosition());
		this.owner.titleBar.contentMorph.applyStyle({fill: Color.white, borderWidth: 0.1, borderColor: Color.black});

		var wikiMarkup = this.storedEditContent;
		if (!wikiMarkup) console.warn('Deserializing WikiWidget: No wiki markup found!' )
		widget.setEditContent(wikiMarkup || '');

		var inner = this.body.submorphs[0].innerMorph();
		if (inner.constructor == ContainerMorph) {
			console.log('Deserializing WikiWidget: ReadMode');
			this.body.submorphs.forEach(function(ea) {
				ea.remove();
				widget.getBody().addMorph(ea);
				}, this)
			widget.enableReadMode();
		} else if (inner.constructor == TextMorph && !wikiMarkup) {
			console.log('Deserializing WikiWidget: EditMode');
			wikiMarkup = inner.textString;
		}

		this.remove();      
	}
});

Widget.subclass('WikiWidget', {
  viewTitle: "",
  initialViewExtent: pt(400, 550),
  useLightFrame: true,
  formals: ["EditContent"],
  initialize: function() {
    var model = Record.newPlainInstance({EditContent: ''});
    this.relayToModel(model, {EditContent: "EditContent"});
  },
  start: function() {
    this.enableEditMode();
  },
  buildView: function(extent) {
    var panel = new WikiWidgetPanel(extent);
    panel = PanelMorph.makePanedPanel(extent, [
      ['readModeButton', function(bnds){return new ButtonMorph(bnds)}, new Rectangle(0.8, 0, 0.1, 0.03)],
      ['editModeButton', function(bnds){return new ButtonMorph(bnds)}, new Rectangle(0.9, 0, 0.1, 0.03)],
      ['body', function(bnds){return new ContainerMorph(bnds)}, new Rectangle(0, 0.05, 1, 0.95)]
      ], panel);

      var m;
      var model = this.getModel();

      m = panel.readModeButton;
      m.setLabel('Read');
      m.buttonAction(this.enableReadMode, this);
      m.applyStyle({fill: Color.white, borderRadius: 0})

      m = panel.editModeButton;
      m.setLabel('Edit');
      m.buttonAction(this.enableEditMode, this);
      m.applyStyle({fill: Color.white, borderRadius: 0})

      m = panel.body;
      m.applyStyle({fill: null /*Color.red/*null*/, borderWidth: 0});

      panel.applyStyle({fill: Color.white, borderWidth: 0.1, borderColor: Color.black});
      //panel.suppressHandles = false;
      this.panel = panel;
      this.panel.widget = this;

      this.start();
      return panel;
  },
  enableEditMode: function() {
    this.deleteBodyMorphs();
    var bounds = this.getBody().getExtent().subPt(pt(2,2)).extentAsRectangle();
    var editMorph = new TextMorph(bounds, this.getEditContent(), true /*Change clue*/);
    editMorph.closeDnD(); editMorph.suppressHandles = true;
    editMorph.connectModel(this.getModel().newRelay({Text: "EditContent"}));
    var scroll = this.createScrollMorphFor(editMorph, bounds);
    this.getBody().addMorph(scroll);
  },
  enableReadMode: function() {
    this.deleteBodyMorphs();
    var bounds = this.getBody().getExtent().subPt(pt(2,2)).extentAsRectangle();
    var box = new ContainerMorph(bounds);
    box.applyStyle({fill: Color.white});
    box.ignoreEvents();//box.closeDnD(); //box.suppressHandles = true;

    this.getBody().addMorph(this.createScrollMorphFor(box, bounds));

    var morphs = this.editContentsToMorphs();
    if (!morphs) return;
    var yPos = 0;
    morphs.forEach(function(ea) {
      box.addMorph(ea);
      ea.setExtent(pt(bounds.width, ea.getExtent.y));
      ea.setPosition(pt(0,yPos));
      //ea.ignoreEvents();
      yPos += ea.getExtent().y;
      }, this)

      box.owner.owner.getScrollBar().applyStyle({fill: Color.white, borderWidth: 0});
    },
    getBody: function() { return this.panel.body },
    onEditContentUpdate: function(newContent) {
      this.panel.storedEditContent = newContent;
    },
    deleteBodyMorphs: function() {
      this.getBody().submorphs.invoke('remove');
    },
    editContentsToMorphs: function() {
      var markup = this.getEditContent().replace(/\r/g, '\n')
      var result;
      var time = Functions.timeToRun(function() {
        result = OMetaSupport.matchAllWithGrammar(WikiParser, 'wikiTextDescription', markup);
      });
      if (!result) return null;
      console.log('#morphs: ' + result.length + ' time: ' + time);
      return result;
    },
    openIn: function($super, world, optLoc) {
      //	return $super(world, optLoc);
      var view = this.buildView(this.getInitialViewExtent(world), this.getModel());
      view.ownerWidget = this; // for remembering the widget during serialization...
      var window = world.addFramedMorph(view, this.getViewTitle(), optLoc, this.useLightFrame);
      window.titleBar.contentMorph.applyStyle({fill: Color.white, borderWidth: 0.1, borderColor: Color.black});
      return window;
      //	if (optLoc) view.setPosition(optLoc);
      //	return world.addMorph(view);
    },
    createScrollMorphFor: function(innerMorph, bounds) {
      var m = new ScrollPane(innerMorph, bounds);
      m.closeDnD();
      innerMorph.closeDnD();
      m.getScrollBar().slider.applyStyle({fill: Color.gray.lighter(), borderWidth: 0.2});
      m.getScrollBar().applyStyle({fill: Color.white, borderWidth: 0});
      return m;
    },


  });

})