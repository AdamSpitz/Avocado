#!/usr/bin/ruby

Dir.chdir('public/javascripts')

def newModule(name)
  puts("transporter.module.onLoadCallbacks[#{name.inspect}] = function() {};") unless name == 'bootstrap'
  puts(File.read("#{name}.js"))
end

def externalScript(name)
  puts("transporter.module.onLoadCallbacks[#{name.inspect}] = function() {};")
  puts(File.read("#{name}.js"))
  puts("transporter.module.onLoadCallbacks[#{name.inspect}] = 'done';")
end

def doIt(code)
  puts(code)
end


# This code produced from bootstrap.js; search for shouldPrintLoadOrder.

newModule('bootstrap');
doIt('transporter.initializeRepositories();');
externalScript('prototype/prototype');
externalScript('lk/JSON');
externalScript('lk/defaultconfig');
externalScript('local-LK-config');
externalScript('lk/Base');
externalScript('lk/scene');
externalScript('lk/Core');
externalScript('lk/Text');
externalScript('lk/Widgets');
externalScript('lk/Network');
externalScript('lk/Data');
externalScript('lk/Storage');
externalScript('lk/bindings');
externalScript('lk/Tools');
externalScript('lk/TestFramework');
externalScript('lk/TouchSupport');
externalScript('lk/cop/Layers');
externalScript('moousture/mootools-1.2.4-core-nc');
externalScript('moousture/Moousture');
externalScript('moousture/iPhoneProbe');
externalScript('jslint');
externalScript('core/lk_TestFramework');
newModule('transporter/object_graph_walker');
doIt('transporter.putUnownedSlotsInInitModule();');
externalScript('core/exit');
newModule('core/hash_table');
newModule('core/notifier');
newModule('core/range');
newModule('core/enumerator');
newModule('core/dependencies');
externalScript('core/little_profiler');
newModule('core/string_extensions');
newModule('core/string_buffer');
newModule('core/value_holder');
newModule('core/core');
newModule('reflection/mirror');
externalScript('lk_ext/changes');
newModule('reflection/slot');
externalScript('lk_ext/change_notification');
externalScript('lk_ext/math');
externalScript('lk_ext/fixes');
newModule('lk_ext/commands');
externalScript('lk_ext/grabbing');
externalScript('lk_ext/menus');
externalScript('lk_ext/refreshing_content');
newModule('lk_ext/applications');
newModule('lk_ext/highlighting');
newModule('lk_ext/transporting_morphs');
newModule('lk_ext/one_morph_per_object');
externalScript('lk_ext/text_morph_variations');
externalScript('lk_ext/check_box');
externalScript('lk_ext/shortcuts');
externalScript('lk_ext/layout');
newModule('lk_ext/rows_and_columns');
newModule('lk_ext/combo_box');
externalScript('lk_ext/layout');
newModule('lk_ext/animation');
newModule('lk_ext/toggler');
newModule('lk_ext/scatter');
newModule('lk_ext/quickhull');
newModule('lk_ext/poses');
newModule('lk_ext/arrows');
externalScript('lk_ext/expander');
newModule('lk_ext/sound');
newModule('lk_ext/message_notifier');
newModule('lk_ext/morph_factories');
newModule('lk_ext/world_navigation');
newModule('lk_ext/core_sampler');
newModule('lk_ext/edit_mode');
newModule('lk_ext/lk_ext');
newModule('reflection/category');
newModule('reflection/organization');
newModule('reflection/reflection');
newModule('transporter/transporter');
newModule('avocado_lib');
doIt('transporter.doneLoadingAvocadoLib();');
newModule('programming_environment/category_morph');
newModule('programming_environment/evaluator');
newModule('transporter/snapshotter');
newModule('programming_environment/slot_morph');
newModule('programming_environment/slice_morph');
newModule('programming_environment/mirror_morph');
newModule('programming_environment/test_case_morph');
newModule('transporter/module_morph');
newModule('programming_environment/programming_environment');
doIt('transporter.doneLoadingAllOfAvocado();');
