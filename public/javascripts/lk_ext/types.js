avocado.transporter.module.create('lk_ext/types', function(requires) {

requires('general_ui/types');

}, function(thisModule) {


thisModule.addSlots(avocado.types.bool, function(add) {

  add.method('createInputMorph', function (slot) {
    return new avocado.CheckBoxMorph(slot);
  }, {category: ['input']});

});


thisModule.addSlots(avocado.types.longString, function(add) {

  add.method('createInputMorph', function (slot) {
    if (! avocado.ui.enableHTMLTextMorphExperiment) {
      var tm = avocado.frequentlyEditedText.newMorphFor(slot);
      tm.setScale(0.3);
      tm.setFill(null);
      tm.applyStyle({horizontalLayoutMode: avocado.LayoutModes.SpaceFill, verticalLayoutMode: avocado.LayoutModes.SpaceFill});
      return ScrollPane.containing(tm, avocado.treeNode.defaultExtent());
    } else {
      var htmlMorph = new XenoMorph(new Rectangle(0, 0, 300, 205)).setScale(0.5).setFill(null).ignoreAllExceptDefaultEvents();

      htmlMorph.setLayout({
        minimumExtent: function() {
          // aaa how do I find out how much space the HTML actually takes up?
          var e = this.getExtent();
          this._cachedMinimumExtent = e;
          return e.scaleBy(this.getScale());
        }.bind(htmlMorph),

        rejigger: function(availableSpace) {
          var r = this.rejiggerJustMyLayout(availableSpace);
          this.adjustForNewBounds();
          return r;
        }.bind(htmlMorph),
      });

      var body = document.createElement("body");
      body.setAttribute("xmlns", "http://www.w3.org/1999/xhtml");
      var div = document.createElement("div");

      var textArea = document.createElement("textarea");
      textArea.style.width  = "100%";
      textArea.rows = 15;
      div.appendChild(textArea);
      
      htmlMorph.refreshContent = function () {
        while (textArea.hasChildNodes()) { textArea.removeChild(textArea.lastChild); }
        textArea.appendChild(document.createTextNode(slot.get()));
      };

      body.appendChild(div);
      htmlMorph.foRawNode.appendChild(body);
      return htmlMorph;
    }
  }, {category: ['input']});

});


thisModule.addSlots(avocado.types.enumeration.prompterProto, function(add) {

  add.method('prompt', function (caption, context, evt, callback) {
    avocado.ComboBoxMorph.prompt("Which?", "Choose", "Cancel", this._possibilities, this._possibilities.first(), callback);
  });

});


});
