avocado.transporter.module.create('lk_programming_environment/project_morph', function(requires) {

requires('general_ui/table_layout');
requires('lk_ext/check_box');
requires('projects/projects');

}, function(thisModule) {


thisModule.addSlots(avocado.project, function(add) {

  add.method('newMorph', function () {
    var m = avocado.table.newColumnMorph().setModel(this).applyStyle(this.defaultMorphStyle);
    m.typeName = 'project';
    var headerRow = avocado.table.newRowMorph().beInvisible().applyStyle({padding: 3});
    
    var changeIndicator = avocado.label.newMorphFor(function() {
      var project = this.ownerWithAModel()._model;
      return project.modificationFlag().hasThisOneOrChildrenChanged() ? ' has changed ' : '';
    });
    changeIndicator.setTextColor(Color.green.darker());

    var columns = [m.createNameLabel()];
    // columns.push(changeIndicator); // aaa just leave this out for now because it's not working right
    headerRow.layout().setCells(columns);
    
    /* Why isn't this working?
    var privacyRow = avocado.table.newRowMorph().beInvisible().applyStyle({padding: {between: {x: 3}}});
    var privacyLabel = avocado.label.newMorphFor("Private: ");
    var privacyCheckbox = new avocado.CheckBoxMorph();
    privacyRow.layout().setCells([privacyLabel, privacyCheckbox]);
    privacyCheckbox.notifier().addObserver(function(a, b, c) {
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

  add.data('fillBase', new Color(0.7, 0.6, 0.7));

});


});
