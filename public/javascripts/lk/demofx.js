using().module('lively.demofx').run(function() {	

    Morph.subclass('lively.demofx.FXMorph', {
	content: {},
	initialize: function($super, model, optContent) {
	    // passing this as second argument wil mean that all the linked literals
	    // with the $var name will be instance fields 
	    $super(using(lively.scene, lively.paint, lively.data).model(model).link(optContent || this.content, this));
	}
    });

    using().run(function() {
    const size = 8;
	
    lively.demofx.FXMorph.subclass('lively.demofx.CloseButton', {
	formals: ["_Color"],
	content: {
	    $:"Group",
	    content: [
		{$:"Rectangle",
                 x: 0, //{$:"Bind", eval: "g.layoutBounds.minX"},
                 y: 0, //{$:"Bind", eval:  "g.layoutBounds.minY"},
                 width: size, //{$:"Bind", eval: "g.layoutBounds.width"},
                 height: size //{$:"Bind", eval " g.layoutBounds.height"},
                 //fill: null
                },
		{ $:"Group",
		  $var: "g",
		  content: [
                      {$:"Line", StartX: 0, StartY: 0, EndX: size, EndY: size,
                       stroke: {$:"Bind", to: "_Color"},
                       strokeWidth: 3,
                       strokeLineCap: lively.scene.LineCaps.Round
                      },
		      
                      {$:"Line", StartX: 0, StartY: size, EndX: size, EndY: 0,
                       stroke: {$:"Bind", to: "_Color"},
                       strokeWidth: 3,
                       strokeLineCap: lively.scene.LineCaps.Round
                       //strokeLineCap: StrokeLineCap.ROUND
                      }
		  ]
		}
	    ]
	},
	
	onMouseOver: function() {
	    this.set_Color(Color.white);
	},

	onMouseOut: function() {
	    this.set_Color(Color.rgb(153, 153, 153));
	}
	
    });
    });

    using().run(function() { // scoping 
    var thumbWidth = 20;
    var thumbHeight = 12;
    const minimum = 0.0;
    const maximum = 1.0;

    lively.demofx.FXMorph.subclass('lively.demofx.SliderThumb', {
	formals: ["_ThumbValue",  // private
		  "AdjValue", 
		  "Width", 
		  "_Value"
		 ],
	
	content: {
	    $:"Group", 
	    transforms: [{$:"Translate", X: {$:"Bind", to: "_ThumbValue" }, Y: -2}],
	    content:[
		{$:"Rectangle",
		 width: thumbWidth,
		 height: thumbHeight,
		 arcWidth: 7,
		 fill: {$:"LinearGradient", 
			stops: [
			    {$:"Stop", offset: 0.0,  color: Color.rgb(107, 107, 107) },
			    {$:"Stop", offset: 0.55, color: Color.black },
			    {$:"Stop", offset: 0.7,  color: Color.rgb( 75,  75,  75) },
			    {$:"Stop", offset: 1.0,  color: Color.rgb( 23,  23,  23) }
			]},
		 stroke: {$:"LinearGradient",
			  stops: [
                              {$:"Stop", offset: 0.0, color: Color.rgb(  3,   3,   3) },
                              {$:"Stop", offset: 1.0, color: Color.rgb( 82,  82,  82) }
			  ]
			 },
		 strokeWidth: 1
		},
		{$:"Polygon", 
		 transforms: [{$:"Translate", X: (thumbWidth/2 - 3.8), Y: thumbHeight/2}],
		 points: [pt(0, 0), pt(3, -3), pt(3, 3)],
		 fill: Color.white
		},
		{$:"Polygon",
		 transforms: [{$:"Translate", X: thumbWidth/2 + 1.8, Y: thumbHeight/2}],
		 points: [pt(3, 0), pt(0, -3), pt(0, 3)],
		 fill: Color.white
		}
	    ]},
	
	initialize: function($super, model) {
	    $super(model);
	    this.connectModel(model);
	    model.addObserver(this);
	},
	
	handlesMouseDown: Functions.True,
		
	onMouseDown: function(evt) {
	    this.origValue = this.getAdjValue(); 
	    this.hitPoint = this.localize(evt.point());
	},
	
	onMouseMove: function(evt) {
	    if (!evt.mouseButtonPressed) return;
	    var drag = this.localize(evt.point()).subPt(this.hitPoint);
	    var v = this.origValue + (drag.x / this.getWidth());
	    if (v < 0) {
		v = 0;
	    } else if (v > 1) {
		v = 1;
	    }
	    // FIXME reference to minimum/maximum
	    this.set_Value(minimum + (v * (maximum-minimum)));

	    this.layoutChanged(); // FIXME this should happen elsewhere, reflects the fact that setting Value
	    // will update the thumb position (thumb being rendered as a Group) but the parent won't notice
	},

	on_ValueUpdate: function(value) {
	    var minimum = 0.0;
	    var maximum = 1.0;
	    var adjValue = (value - minimum)/(maximum - minimum);
	    this.setAdjValue(adjValue);
	},

	onAdjValueUpdate: function(adjValue) {
	    var thumbValue = adjValue * this.getWidth() - thumbWidth/2;
	    this.set_ThumbValue(thumbValue);
	},
	
	onWidthUpdate: function(width) {
	    this.set_ThumbValue(this.getAdjValue() * width - thumbWidth/2);
	},

	on_ThumbValueUpdate: function(value) {
	    //console.log('thumb value ' + value);
	}
    });
    });

    Morph.subclass('lively.demofx.Slider', {
	formals: ["Width"],
	content: {
	    $:"Group",
	    content: [
		{$:"Rectangle", 
		 width: {$:"Bind", to: "Width"},
		 height: 8,
		 arcWidth: 10,
		 //                 arcHeight: 10
		 fill: {$:"LinearGradient",
			startX: 0,
			startY: 0,
			endX: 0,
			endY: 1,
			stops: [
                            {$:"Stop", offset: 0.0, color: Color.rgb(172, 172, 172) },
                            {$:"Stop", offset: 0.6, color: Color.rgb(115, 115, 115) },
                            {$:"Stop", offset: 1.0, color: Color.rgb(124, 124, 124) }
			]
		       },
		 stroke: {$:"LinearGradient",
			  startX: 0,
			  startY: 0,
			  endX: 0,
			  endY: 1,
			  stops: [
                              {$:"Stop", offset: 0.0, color: Color.rgb( 15,  15,  15) },
                              {$:"Stop", offset: 1.0, color: Color.rgb(224, 224, 224) }
			   ]
			 }
		}
	    ]},
	initialize: function($super, model, optExtension) {
	    //$super(using(lively.scene, lively.paint, lively.data).model(model).link(this.content));
	    $super(using(lively.scene, lively.paint, lively.data).model(model).extend(this.content, optExtension || {}));
	    this.addMorph(new lively.demofx.SliderThumb(model));
	}
	
    });

    Object.extend(lively.demofx.Slider, {
	fromLiteral: function(literal, model) {
	    var morph = new lively.demofx.Slider(model);
	    if (literal.transforms) { 
		morph.setTransforms(literal.transforms);
	    }
	    return morph;
	}
    });

    
    const width = 600 - 20;//(6 * (82 + 10)) + 20;    
    const canvasWidth = width-10;
    const canvasHeight = 333 + 40;
    
    lively.demofx.FXMorph.subclass('lively.demofx.Canvas', {
	formals: ["Image",  // public
		  "_CanvasX", // private to class
		  "_CanvasY",   // private to class
		  "ImageRotation" // external, not strictly necessary?
		 ],
	content: {
	    $:"Group", 
            clip: {$:"Rectangle", /*smooth: false,*/ width: canvasWidth, height: canvasHeight + 1 },
            content: [
		{$:"Rectangle",
		 width: canvasWidth,
		 height: canvasHeight,
		 fill: {$:"LinearGradient", startX: 0, startY: 0, endX: 0, endY: 1,
			stops: [ {$:"Stop", offset: 0.1, color: Color.black },
				 {$:"Stop", offset: 1.0, color: Color.rgb(193, 193, 193) } ]}
		},
		
		// note that the whole group could be replaced by a single ImageMorph, but it is convenient 
		// to declare transforms like this:
		{$:"Group",
		 //cache: true,
		 transforms: [{$:"Translate", X: {$:"Bind", to: "_CanvasX"}, Y: {$:"Bind", to: "_CanvasY"}},
			      {$:"Translate", X: canvasWidth/2, Y: canvasHeight/2},
			      {$:"Rotate", Angle: {$:"Bind", to: "ImageRotation"}},
			      {$:"Translate", X: -canvasWidth/2, Y: -canvasHeight/2}],
		 // use following when anchor angle is correctly supported
		 //{$:"Rotate", Angle: {$:"Bind", to: "ImageRotation"}, X: canvasWidth/2, Y: canvasHeight/2}],
		 // very dirty, mixing scene graph with morphs, parent doesnt know that it has a submorph
		 // plus, the array will be notified of changes, but we'd like the enclosing Group to be notified
		 $var: "imageContainer",
		 content: [{$:"Bind",  to: "Image"} ] 
		},
		
		{$:"Rectangle", 
		 width: canvasWidth,
		 height: 2,
		 fill: Color.rgb(103, 103, 103)
		},
		{$:"Rectangle",
		 y: canvasHeight,
		 width: canvasWidth,
		 height: 1,
		 fill: Color.rgb(240, 240, 240)
		}
            ]
	},

	onImageUpdate: function(imageMorph) {
	    // FIXME dirty dealings to make up for Bind's unablility to update content automatically
	    this.imageContainer.removeAll();
	    this.imageContainer.add(imageMorph);
	    this.set_CanvasX((canvasWidth - imageMorph.image.getWidth())/2);
	    this.set_CanvasY((canvasHeight- imageMorph.image.getHeight())/2);
	    this.layoutChanged();
	}
	
    });

    using().run(function() {
    const knobWidth = 25;
    const minimum = 0.0;
    const maximum = 1.0;

    lively.demofx.FXMorph.subclass('lively.demofx.Knob',  {
	formals: ["_KnobValue",  // private to morph
		  "ImageRotation", // public
		  "KnobWidth",
		  "_KnobHandleLength"
		 ],
	content: {
	    $:"Group", 
	    content: [
		{$:"Ellipse", 
		 radius: {$:"Bind", to: "KnobWidth"},
		 fill: {$:"LinearGradient", 
			stops: [
			    {$:"Stop", offset: 0.0, color: Color.rgb(172, 172, 172) },
			    {$:"Stop", offset: 0.5, color: Color.rgb(115, 115, 115) },
			    {$:"Stop", offset: 1.0, color: Color.rgb(130, 130, 130) },
			] },
		 stroke: {$:"LinearGradient",
			  stops: [
			      {$:"Stop",  offset: 0.0, color: Color.rgb( 69,  69,  69) },
			      {$:"Stop",  offset: 1.0, color: Color.rgb(224, 224, 224) },
			  ] },
		 strokeWidth: 2
		},
		
		{$:"Ellipse", centerX: 0.5, centerY: 0.5, radius: 5 },
		
		{$:"Line", EndX: {$:"Bind", to: "_KnobHandleLength"}, EndY : 0,
		 transforms: [{$:"Rotate", Angle: {$:"Bind", to: "_KnobValue"}}],
		 stroke: Color.white,
		 strokeWidth: 2.5
		},
		
		{$:"Line", EndX: {$:"Bind", to: "_KnobHandleLength"}, EndY: 0,
		 transforms: [{$:"Rotate", Angle: {$:"Bind", to: "_KnobValue"}}],
		 stroke: {$:"LinearGradient",
			  stops: [{$:"Stop", offset: 0.0, color: Color.rgb( 40,  40,  40)},
				  {$:"Stop", offset: 1.0, color: Color.rgb(102, 102, 102)}]
			 }
		}
	    ]
	},

	handlesMouseDown: Functions.True,
	
	onMouseDown: function(evt) {
	    this.origValue = this.getImageRotation();
	    this.hitPoint = this.localize(evt.point());
	},
	
	onMouseMove: function(evt) {
	    if (!evt.mouseButtonPressed) return;
	    var drag = this.localize(evt.point()).subPt(this.hitPoint);
	    var v = this.origValue + (drag.x / this.getKnobWidth());
	    //console.log('drag ' + [drag, v, this.origValue]);
	    /*if (v < 0) {
		    v = 0;
		} else if (v > 1) {
		    v = 1;
		}*/
	    
	    // FIXME reference to minimum/maximum
	    var newValue = (minimum + (v * (maximum-minimum)))*180;
	    this.setImageRotation(newValue % 360);
	    this.layoutChanged(); // FIXME this should happen elsewhere, reflects the fact that setting Value
	    // will update the thumb position (thumb being rendered as a Group) but the parent won't notice
	},

	onImageRotationUpdate: function(value) {
	    this.set_KnobValue(0 - value);
	},

	onKnobWidthUpdate: function(value) {
	    this.set_KnobHandleLength(value/2 + 2);
	}

    });
    });
 
    
    using().run(function() {
	const width = 100;
	const height = 20;

    lively.demofx.FXMorph.subclass('lively.demofx.Button',  {
	formals: ["GlowColor", "GlowOpacity", "Action"],
	content: {
	    $:"Group",
	    content: [
		{$:"Rectangle",
                 //cursor: Cursor.HAND
                 width: width,
                 height: height,
                 fill: {$:"LinearGradient",
			startX: 0,
			startY: 0,
			endX: 0,
			endY: 1,
			stops: [
                            {$:"Stop", offset: 0.0, color: Color.rgb( 65,  65,  65) },
                            {$:"Stop", offset: 0.4, color: Color.rgb(  1,   1,   1) },
                            {$:"Stop", offset: 0.8, color: Color.rgb( 21,  21,  21) },
                            {$:"Stop", offset: 1.0, color: Color.rgb(  4,   4,   4) }
                        ]
                       },
                 stroke: {$:"LinearGradient", startX: 0, startY: 0, endX: 0, endY: 1,
                          stops: [
                              {$:"Stop", offset: 0.0, color: Color.rgb(  5,   5,   5) },
                              {$:"Stop", offset: 1.0, color: Color.rgb( 85,  85,  85) },
                          ]
			 } ,
		 /// FIXME fade/in/out behavior here
		 
		},
                {$:"Rectangle",
		 $var: "rect",  // this.rect will be bound to this value
                 x: 1,
                 y: 1,
                 width: width - 1,
                 height: height - 1,
		 fillOpacity: {$:"Bind", to: "GlowOpacity"},
                 fill: {$:"Bind", to: "GlowColor"}
                }
	    ]
	},
	
	handlesMouseDown: Functions.True,
	suppressHandles: true,

	onMouseUp: function(evt) {
	    var action = this.getAction();
	    console.log('action ' + action);
	    if (action) action.run(evt);
	},

	onMouseOver: function() {
	    this.setGlowColor(new Color(0.5, 0.5, 0.5, 0.5));
	    this.setGlowOpacity(0.5);
	},

	onMouseOut: function() {
	    this.setGlowColor(Color.black);
	    this.setGlowOpacity(0);
	},
	
	initialize: function($super, model, labelText) {
	    $super(model);
	    var label = new TextMorph(new Rectangle(0, 0, 0, 0), labelText);
	    label.beLabel();
	    label.setTextColor(Color.white);
	    label.setFontSize(11);
	    this.addMorph(label);
	    label.align(label.bounds().center(), this.shape.bounds().center());
	    label.translateBy(pt(0, -3)); // ouch
	},

	onActionUpdate: Functions.Null,
	
    });

    });


    var targetImage = new ImageMorph(new Rectangle(0, 0, 500, 333), 
	URL.source.withFilename('Resources/demofx/flower.jpg').toString(), true);

    var canvasModel = Record.newPlainInstance({Image: targetImage, 
	ImageRotation: 0, _CanvasX: 0, _CanvasY: 0, _KnobValue: 0, KnobWidth: 25, 
	_KnobHandleLength: (25/2 + 2),// FIXME: note explicit calculation
	SelectedPreview: null }); 

    const twidth = 82;
    const theight = 71;
    const selColor =  Color.white;
    const topColor = new Color(0.3, 0.3, 0.3);

    using().run(function() {
	
    lively.demofx.FXMorph.subclass('lively.demofx.Preview',  {
	formals: ["_Selected", "ThumbImage", "_BorderColor"],
	suppressHandles: true,
	
	content: {
	    $:"Group",
            //blocksMouse: true
            //cursor: Cursor.HAND
	    
            content: [
		{$:"Group",
		 //cache: true,
		 clip: {$:"Rectangle", /*smooth: false*/ width: twidth, height: theight },
                 content: [
		     {$:"Group", 
/*		      transforms: [{$:"Translate", 
				    //X: {$:"Bind", eval: "(twidth - control.thumbImage.layoutBounds.width) / 2 - control.thumbImage.layoutBounds.minX"}, Y: 0}
				    X: 0, Y: 0} ], */
		      content: [{$:"Bind", to: "ThumbImage", /*debugString: 'here'*/}] 
		     },
		     {$:"Rectangle",
                      y: theight * 0.72,
                      width: twidth,
                      height: theight * 0.28,
                      fill: new Color(0, 0, 0),
		      fillOpacity: 0.7,
                      stroke: Color.black
		     }
		     /* simulated by a real morph
		     {$:"Text",
		      $var:"text",
                      translateX: 0, // bind (twidth - text.layoutBounds.width) / 2 - text.layoutBounds.minX
                        translateY: 0. //bind rect.layoutBounds.minY + (rect.layoutBounds.height / 2) + 4
                      //font: Font { size: 10 }
                      //content: label
                      fill: Color.white
                    }*/
		 ]},

		{$:"Rectangle",
		 width: twidth,
		 height: theight,
		 fill: null,
                 stroke: {$:"Bind", to: "_BorderColor"}
                },

                {$:"Polygon",
                 Visible: {$:"Bind", to: "_Selected", kickstart: true},
		 transforms: [{$:"Translate", X:twidth / 2, Y: -7}],
                 points: [pt(0, 0), pt(5, 5), pt(-5, 5)],
                 fill: Color.rgb(190, 190, 190)
                },
                {$:"Polygon",
                 Visible: {$:"Bind", to: "_Selected" , kickstart: true},
		 transforms:[{$:"Translate", X:twidth / 2, Y: theight + 3}],
                 points: [pt(-5, 0), pt(5, 0), pt(0, 5)],
                 fill: Color.rgb(190, 190, 190)
                }
	    ]
	},

	onThumbImageUpdate: function(img) {
	    console.log('patching owner to ' + img);
	    img.owner = this; // ouch FIXME
	},
	
	onMouseOver: function(evt) {
	    this.set_BorderColor(selColor);
	},

	onMouseOut: function(evt) {
	    if (!this.get_Selected())
    		this.set_BorderColor(topColor);
	},

	handlesMouseDown: Functions.True,
	
	onMouseDown: function(evt) {
	    //console.log('selected ' + this.getThumbImage() + ": " + this.getThumbImage().image.getURL());
	    var url = this.getThumbImage().image.getURL();
	    var image = new ImageMorph(new Rectangle(0, 0, 500, 333), url, true);
	    image.setFillOpacity(0);
	    this.set_Selected(true);
	    // FIXME FIXME FIXME: breach of encapsulattion
	    canvasModel.setImage(image);
	    canvasModel.setSelectedPreview(this);
	},

	initialize: function($super, model, labelText) {
	    $super(model);
	    this.label = new TextMorph(new Rectangle(0,0,0,0), labelText).beLabel();
	    this.label.beLabel();
	    this.label.setWrapStyle(lively.Text.WrapStyle.Shrink);
	    this.label.setFontSize(10);
	    this.label.setTextColor(Color.gray);
	    this.addMorph(this.label);
	    this.label.align(this.label.bounds().bottomCenter(), this.bounds().bottomCenter());
	    canvasModel.addObserver(this, {SelectedPreview: "!SelectedPreview"});
	},

	on_SelectedUpdate: function(value) {
	    // only needed because of the relays

	},

	onSelectedPreviewUpdate: function(value) {
	    if (value !== this) {
		this.set_Selected(false);
    		this.set_BorderColor(topColor);
	    }
	}
	
    });

    });


    false && using().test(function() {
	// more structural experiments
	var LabeledSliderBlueprint = {
	    $:"Morph",
	    shape: {$:"Rectangle", width: {$:"Bind", to: "Width"}, height: 20},
	    formals: ["Padding", "Width"],
	    submorphs: [
		{$:"TextMorph", textColor: Color.white, content: "Hello", label: true},
		{$:"Slider", 
		 transforms: [{$:"Translate", X: {$:"Bind", to:"Padding"}, Y: 0}],
		 width: {$:"Bind", to: "Width"}
		}
	    ]
	};
	
	var testModel = Record.newPlainInstance({Padding: 100, Width: 300, _ThumbValue: 0, _Value: 0, AdjValue: 0, "Text": "Foo"});
	var m = WorldMorph.current().addMorph(using(lively.scene, lively.paint, lively.data, lively.demofx, Global).model(testModel).link(LabeledSliderBlueprint));
	m.setPosition(WorldMorph.current().bounds().center());
    });

    /*********************************************/
    // application code


    var sliderModel = Record.newPlainInstance({_Value: 0, Width: 150, AdjValue: 0, _ThumbValue: 0, 
	LabelValue: "Radius +0.00"});
    
    var theEffect = new lively.scene.GaussianBlurEffect(0.001, "myfilter");
    //theEffect.applyTo(targetImage); // FIXME, apply to whatever is canvasModel.getImage()

    canvasModel.addObserver({
	onImageUpdate: function(image) {
	    console.log('applying effect to ' + image); //FIXME: only when effect active!
	    theEffect.applyTo(image);
	}
    });


    sliderModel.addObserver({
	onAdjValueUpdate: function(value) {
	    var radius = value*10 || 0.01;
	    theEffect.setRadius(radius);
	    sliderModel.setLabelValue("Radius +" + radius.toFixed(2));
	}
    });
    
    var stage = new BoxMorph(new Rectangle(230, 30, canvasWidth + 10, canvasHeight + 22));

    stage.setFill(using(lively.paint).link({
        $:"LinearGradient",
        startX: 0,
        startY: 0,
        endX: 0,
        endY: 1,
        stops: [
            {$:"Stop", offset: 0.0,  color: Color.rgb(126, 127, 134) },
            {$:"Stop", offset: 0.01, color: Color.rgb( 26,  26,  26) },
            {$:"Stop", offset: 0.65, color: Color.black },
            {$:"Stop", offset: 1.0,  color: Color.rgb(107, 107, 107) }
        ]
    }));


    var closeModel = Record.newPlainInstance({ _Color: Color.rgb(153, 153, 153) });
    var closeMorph = stage.addMorph(Object.extend(new lively.demofx.CloseButton(closeModel), {
	suppressHandles: true,
	handlesMouseDown: Functions.True,
	onMouseUp: function() {
	    stage.remove();
	}
    }));
    closeMorph.connectModel(closeModel.newRelay({_Color: "+_Color"}), true);
    closeMorph.align(closeMorph.bounds().topRight(), stage.shape.bounds().topRight());
    closeMorph.translateBy(pt(-10, 7));

    var canvasMorph = stage.addMorph(new lively.demofx.Canvas(canvasModel));
    canvasMorph.align(canvasMorph.bounds().topRight(), closeMorph.bounds().bottomRight());
    canvasMorph.translateBy(pt(5, 5));
    canvasMorph.connectModel(canvasModel.newRelay({Image: "Image", 
						   _CanvasX: "+_CanvasX", _CanvasY: "+_CanvasY"}), 
			     true);
    
    
    WorldMorph.current().addMorph(stage);

    function makePreview(effect, name, shortName) {
	var factor = 0.17;
	var thumbImage = new ImageMorph(new Rectangle(0, 0, 500*factor, 333*factor),
	    URL.source.withFilename('Resources/demofx/' + shortName).toString(), true);
	thumbImage.setFillOpacity(0);
	var previewModel = Record.newPlainInstance({_Selected: false, 
	    ThumbImage: thumbImage, _BorderColor: topColor});
	var previewMorph = new lively.demofx.Preview(previewModel, name);
	previewMorph.connectModel(previewModel.newRelay({
	    _Selected: "_Selected",
	    ThumbImage: "ThumbImage", 
	    _BorderColor: "+_BorderColor"}), true);
	if (effect) effect.applyTo(previewModel.getThumbImage());
	previewMorph.margin = Rectangle.inset(5, 0, 5, 0);
	return previewMorph;
    }

    var firstRow = {$:"Group",
	content: [
            {$:"Group",
             transforms: [{$:"Translate", X: 0, Y: {$:"Bind", to: "FirstRowStartY"}}],
	     content: [
                 {$:"Rectangle", width: width, height: theight + 21,
                  fill: {$:"LinearGradient", startX: 0, startY: 0, endX: 0, endY: 1,
                         stops: [
                             {$:"Stop", offset: 0.0,  color: Color.rgb(107, 107, 107) },
                             {$:"Stop", offset: 0.95, color: Color.black }
                         ]
			}
                 },
                 //firstRowPreviews (these are morphs)
             ]
            }
	]};

    var rowModel = Record.newPlainInstance({FirstRowStartY: 3, SecondRowStartY: 3});
    var rowMorph = new lively.demofx.FXMorph(rowModel, firstRow);
    rowMorph.layoutManager = new HorizontalLayout();
    rowMorph.padding = Rectangle.inset(0, 5, 0, 5);
    stage.addMorph(rowMorph);
    rowMorph.align(rowMorph.bounds().topCenter(), canvasMorph.bounds().bottomCenter());


    var effectNames = ["Blend", "Blur", "Motion Blur", "Bloom", "Glow", "Color Adjust"];
    var shortFileNames = ["flower-blend.png", 
	"flower.jpg", 
	"flower-motion-blur.png",
	"flower-bloom.png", "flower-glow.png", "flower-color-adjust.png"];
    
    var blendPreview = makePreview(null, effectNames[0], shortFileNames[0]);
    rowMorph.addMorph(blendPreview);

    for (var i = 1; i < 6; i++) {
	var effect = null;
	if (i == 1) effect = new lively.scene.GaussianBlurEffect(i, "effect" + i);
	else if (i == 0) effect = new lively.scene.BlendEffect(1, "effect0");
	else effect = null;
	//URL.source.withFilename('Resources/demofx/water.jpg').toString())
	//var preview2	= makePreview(new lively.scene.ColorAdjustEffect("previewColorAdjust"));
	//var preview2 = makePreview(new lively.scene.SaturateEffect("preview2", 0.4));
	rowMorph.addMorph(makePreview(effect, effectNames[i], shortFileNames[i]));

    }

    var controlPlate = new BoxMorph(new Rectangle(0, 0, canvasWidth, 40));
    controlPlate.setFill(using(lively.paint).link(
        {$:"LinearGradient",
         startX: 0,
         startY: 0,
         endX: 0,
         endY: 1,
         stops: [ {$:"Stop", offset: 0.0,  color: Color.rgb(102, 102, 102) },
                  {$:"Stop", offset: 0.5,  color: Color.rgb(148, 148, 148) },
                  {$:"Stop", offset: 1.0,  color: Color.rgb(102, 102, 102) },
                ]
        }));
    
    stage.addMorph(controlPlate);
    controlPlate.align(controlPlate.bounds().topCenter(), rowMorph.bounds().bottomCenter());
    
    var label = controlPlate.addMorph(new TextMorph(new Rectangle(0,0,0,0)).beLabel());
    label.setTextColor(Color.white);
    label.connectModel(sliderModel.newRelay({Text: "LabelValue"}), true);
    label.align(label.bounds().leftCenter(), controlPlate.shape.bounds().leftCenter());
    label.translateBy(pt(10, 0));
    
    var sliderMorph = controlPlate.addMorph(new lively.demofx.Slider(sliderModel));
    sliderMorph.align(sliderMorph.bounds().leftCenter(), label.bounds().rightCenter());
    sliderMorph.translateBy(pt(20, 0));

     // second row
    var secondRow = {$:"Group",
	content: [
            {$:"Group",
             transforms: [{$:"Translate", X: 0, Y: {$:"Bind", to: "SecondRowStartY"}}],
	     content: [
                 {$:"Rectangle",
                  width: width,
                  height: theight + 21,
                  fill: {$:"LinearGradient",
                         startX: 0, startY: 0, endX: 0, endY: 1,
                         stops: [
                             {$:"Stop", offset: 0.0,  color: Color.rgb(107, 107, 107) },
                             {$:"Stop", offset: 0.95, color: Color.black },
                         ]
			}
                 },
		 
                 {$:"Rectangle",
                  x: 0,
                  y: -1,
                  width: width,
                  height: 1,
		  stroke: null,
                  fill: Color.rgb(177, 177, 177)
                 },
                 {$:"Rectangle",
                  x: 0,
                  y: 0,
                  width: width,
                  height: 1,
                  fill: Color.rgb(80, 80, 80),
                 }

                 //secondRowPreviews (these are morphs)
             ]
            }
	]};

    rowMorph = new lively.demofx.FXMorph(rowModel, secondRow);
    rowMorph.layoutManager = new HorizontalLayout();
    rowMorph.padding = Rectangle.inset(0, 5, 0, 5);
    
    stage.addMorph(rowMorph);
    rowMorph.align(rowMorph.bounds().topCenter(), controlPlate.bounds().bottomCenter());


    effectNames = ["Drop Shadow", "Inner Shadow", "Perspective", "Lighting", "Sepia Tone", "Reflection"];
    shortFileNames = ["flower-drop-shadow.png", "flower-inner-shadow.png", "flower-perspective.png",
		      "flower-lighting.png", "flower-sepia-tone.png", "flower-reflection.png"];

    for (var i = 0; i < 6; i++) {
	rowMorph.addMorph(makePreview(effect, effectNames[i], shortFileNames[i]));
    }


    lively.demofx.FXMorph.subclass('lively.demofx.Footer', {
	content: {$:"Group",
		  content: [
		      {$:"Path", 
		       elements: [
                           {$:"MoveTo", x: 0, y: 0 },
                           {$:"LineTo", x: width, y: 0 },
                           {$:"LineTo", x: width, y: 27 },
                           {$:"QuadCurveTo", x: width - 3, y: 33, controlX: width, controlY: 33 },
			   {$:"QuadCurveTo", x: 3, y: 33, controlX: width / 2, controlY: 100 },
                           {$:"QuadCurveTo", x: 0, y: 30, controlX: 0, controlY: 33 }
		       ]
		      }
		  ]
		 }
    });

    var footer = stage.addMorph(new lively.demofx.Footer());
    footer.align(footer.bounds().topCenter(), rowMorph.bounds().bottomCenter());

    
    var button1Model = Record.newPlainInstance({GlowColor: null, GlowOpacity: 0});
    var button1 = new lively.demofx.Button(button1Model, "Open Image 1");
    button1.connectModel(button1Model.newRelay({GlowColor: "+GlowColor", GlowOpacity: "+GlowOpacity"}));
    footer.addMorph(button1);
    button1.align(button1.bounds().topLeft(), footer.shape.bounds().topLeft());
    button1.translateBy(pt(20, 3));


    var button2Model = Record.newPlainInstance({GlowColor: null, GlowOpacity: 0});
    var button2 = new lively.demofx.Button(button2Model, "Open Image 2");
    button2.connectModel(button2Model.newRelay({GlowColor: "+GlowColor", GlowOpacity: "+GlowOpacity"}));
    footer.addMorph(button2);
    button2.align(button2.bounds().topLeft(), button1.bounds().topRight());
    button2.translateBy(pt(20, 0));

    var removeEffect = {
	run: function() {
	    console.log('remove effect ' + theEffect);
	    canvasModel.getImage().removeTrait("filter");
	}
    }

    var removeButtonModel = Record.newPlainInstance({GlowColor: null, GlowOpacity: 0, Action: removeEffect});
    var removeButton = new lively.demofx.Button(removeButtonModel, "Remove Effect");
    removeButton.connectModel(removeButtonModel.newRelay({
	Action: "-Action",
	GlowColor: "+GlowColor", 
	GlowOpacity: "+GlowOpacity"}));
    footer.addMorph(removeButton);
    removeButton.align(removeButton.bounds().topRight(), footer.shape.bounds().topRight());
    removeButton.translateBy(pt(-20, 3));

    var saveButtonModel = Record.newPlainInstance({GlowColor: null, GlowOpacity: 0});
    var saveButton = new lively.demofx.Button(saveButtonModel, "Save Image");
    saveButton.connectModel(saveButtonModel.newRelay({GlowColor: "+GlowColor", GlowOpacity: "+GlowOpacity"}));
    footer.addMorph(saveButton);
    saveButton.align(saveButton.bounds().topRight(), removeButton.bounds().topLeft());
    saveButton.translateBy(pt(-20, 0));

    var knobMorph = footer.addMorph(new lively.demofx.Knob(canvasModel));
    knobMorph.align(knobMorph.bounds().topCenter(), footer.shape.bounds().topCenter());
    knobMorph.translateBy(pt(0, 5));
    knobMorph.connectModel(canvasModel.newRelay({_KnobValue: "+_KnobValue", 
						 KnobWidth: "-KnobWidth",
						 ImageRotation: "ImageRotation"}));

 
}.logErrors());
