#!/usr/bin/ruby

Dir.chdir('public/javascripts')

def preamble
  puts("if (! window.hasOwnProperty('avocado')) { window.avocado = {}; }")
  puts("avocado.isLoadingStatically = true;")
  puts
end

def postscript
end

def newModule(name)
  puts("transporter.module.onLoadCallbacks[#{name.inspect}] = function() {};") unless name == 'bootstrap'
  puts(File.read("#{name}.js"))
  puts
end

def externalScript(name)
  puts("transporter.module.onLoadCallbacks[#{name.inspect}] = function() {};")
  puts(File.read("#{name}.js"))
  puts("transporter.module.onLoadCallbacks[#{name.inspect}] = 'done';")
  puts
end

def doIt(code)
  puts(code)
end

preamble();

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
newModule('core/lk_TestFramework');
newModule('transporter/object_graph_walker');
doIt('transporter.putUnownedSlotsInInitModule();');
newModule('reflection/annotation');
newModule('core/math');
externalScript('lk_ext/fixes');
externalScript('lk_ext/changes');
externalScript('lk_ext/change_notification');
externalScript('lk_ext/menus');
newModule('lk_ext/applications');
externalScript('lk_ext/refreshing_content');
externalScript('lk_ext/grabbing');
newModule('lk_ext/transporting_morphs');
externalScript('lk_ext/text_morph_variations');
newModule('lk_ext/one_morph_per_object');
externalScript('lk_ext/shortcuts');
externalScript('lk_ext/check_box');
newModule('lk_ext/toggler');
newModule('lk_ext/layout');
newModule('lk_ext/rows_and_columns');
newModule('lk_ext/combo_box');
newModule('lk_ext/collection_morph');
externalScript('lk_ext/expander');
newModule('lk_ext/highlighting');
newModule('lk_ext/morph_factories');
newModule('lk_ext/message_notifier');
newModule('core/exit');
newModule('core/commands');
newModule('lk_ext/commands');
newModule('lk_ext/arrows');
newModule('lk_ext/core_sampler');
newModule('lk_ext/world_navigation');
newModule('core/hash_table');
newModule('core/range');
newModule('core/notifier');
newModule('lk_ext/edit_mode');
newModule('core/enumerator');
newModule('reflection/mirror');
newModule('reflection/slot');
newModule('core/string_buffer');
newModule('core/sound');
newModule('core/dependencies');
newModule('core/linked_list');
newModule('core/value_holder');
newModule('core/string_extensions');
newModule('core/little_profiler');
newModule('core/core');
newModule('reflection/category');
newModule('reflection/organization');
newModule('reflection/reflection');
newModule('transporter/transporter');
newModule('core/poses');
newModule('lk_ext/poses');
newModule('core/quickhull');
newModule('core/animation_math');
newModule('lk_ext/animation');
newModule('lk_ext/scatter');
newModule('lk_ext/lk_ext');
newModule('avocado_lib');
doIt('transporter.doneLoadingAvocadoLib();');
newModule('programming_environment/categorize_libraries');
newModule('lk_programming_environment/module_morph');
newModule('transporter/snapshotter');
newModule('lk_programming_environment/slot_morph');
newModule('lk_programming_environment/evaluator_morph');
newModule('lk_programming_environment/test_case_morph');
newModule('lk_ext/search_results_morph');
newModule('lk_programming_environment/category_morph');
newModule('lk_programming_environment/mirror_morph');
externalScript('narcissus/jsparse');
newModule('programming_environment/pretty_printer');
newModule('programming_environment/searching');
newModule('lk_programming_environment/searching');
newModule('lk_programming_environment/programming_environment');
doIt('transporter.doneLoadingAllOfAvocado();');

# end of auto-generated code

postscript();
