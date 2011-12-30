avocado.transporter.module.create('lk_programming_environment/project_morph', function(requires) {

requires('lk_ext/shortcuts');
requires('general_ui/table_layout');
requires('lk_ext/check_box');
requires('projects/projects');

}, function(thisModule) {


thisModule.addSlots(avocado.project, function(add) {

  add.method('newMorph', function () {
    var m = avocado.table.newColumnMorph().setModel(this).applyStyle(this.defaultMorphStyle);
    m.typeName = 'project';
    var headerRow = avocado.table.newRowMorph().beInvisible().applyStyle({padding: 3});
    
    var changeIndicator = TextMorph.createLabel(function() {
      var project = this.ownerWithAModel()._model;
      return project.modificationFlag().hasThisOneOrChildrenChanged() ? ' has changed ' : '';
    });
    changeIndicator.setTextColor(Color.green.darker());

    var columns = [m.createNameLabel()];
    // columns.push(changeIndicator); // aaa just leave this out for now because it's not working right
    headerRow.layout().setCells(columns);
    
    /* Why isn't this working?
    var privacyRow = avocado.table.newRowMorph().beInvisible().applyStyle({padding: {between: {x: 3}}});
    var privacyLabel = TextMorph.createLabel("Private: ");
    var privacyCheckbox = new avocado.CheckBoxMorph();
    privacyRow.layout().setCells([privacyLabel, privacyCheckbox]);
    privacyCheckbox.notifier.addObserver(function(a, b, c) {
      console.log("Clicked the checkbox: " + a + ", " + b + ", " + c);
    });
    */
    
    m.layout().setCells([headerRow]);

    this.module().whenChangedNotify(m.refreshContentIfOnScreenOfMeAndSubmorphs.bind(m));
    m.startPeriodicallyUpdating();
    return m;
  }, {category: ['user interface']});

  add.creator('defaultMorphStyle', Object.create(avocado.table.boxStyle), {category: ['user interface']});

});


thisModule.addSlots(avocado.project.defaultMorphStyle, function(add) {

  add.data('fill', new lively.paint.LinearGradient([new lively.paint.Stop(0, new Color(0.7019607843137254, 0.6, 0.7019607843137254)), new lively.paint.Stop(1, new Color(0.8, 0.7019607843137254, 0.8))], lively.paint.LinearGradient.SouthNorth));

});


});
