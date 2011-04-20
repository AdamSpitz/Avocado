transporter.module.create('lk_programming_environment/project_morph', function(requires) {

requires('lk_ext/shortcuts');
requires('lk_ext/rows_and_columns');
requires('lk_ext/check_box');
requires('projects/projects');

}, function(thisModule) {


thisModule.addSlots(avocado.project, function(add) {

  add.method('newMorph', function () {
    var m = avocado.TableMorph.newColumn().setModel(this).applyStyle(this.defaultMorphStyle);
    m.typeName = 'project';
    var headerRow = avocado.TableMorph.newRow().beInvisible().setPadding(3);
    var project = this;
    
    var changeIndicator = TextMorph.createLabel(function() {
      return project.modificationFlag().hasThisOneOrChildrenChanged() ? ' has changed ' : '';
    });
    changeIndicator.setTextColor(Color.green.darker());

    var columns = [m.createNameLabel()];
    columns.push(changeIndicator);
    this.buttonCommands().commands().each(function(c) { columns.push(c.newMorph()); });
    columns.push(m.createDismissButton());
    headerRow.setColumns(columns);
    
    /* Why isn't this working?
    var privacyRow = avocado.TableMorph.newRow().beInvisible().setPadding({between: {x: 3}});
    var privacyLabel = TextMorph.createLabel("Private: ");
    var privacyCheckbox = new CheckBoxMorph();
    privacyRow.setColumns([privacyLabel, privacyCheckbox]);
    privacyCheckbox.notifier.addObserver(function(a, b, c) {
      console.log("Clicked the checkbox: " + a + ", " + b + ", " + c);
    });
    */
    
    m.setRows([headerRow]);

    project.module().whenChangedNotify(m.refreshContentIfOnScreenOfMeAndSubmorphs.bind(m));
    m.startPeriodicallyUpdating();
    return m;
  }, {category: ['user interface']});

  add.creator('defaultMorphStyle', Object.create(avocado.TableMorph.boxStyle), {category: ['user interface']});

});


thisModule.addSlots(avocado.project.defaultMorphStyle, function(add) {

  add.data('fill', new lively.paint.LinearGradient([new lively.paint.Stop(0, new Color(0.7019607843137254, 0.6, 0.7019607843137254)), new lively.paint.Stop(1, new Color(0.8, 0.7019607843137254, 0.8))], lively.paint.LinearGradient.SouthNorth));

});


});
