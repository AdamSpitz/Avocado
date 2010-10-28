transporter.module.create('core/core', function(requires) {

requires('core/commands');
requires('core/exit');
requires('core/enumerator');
requires('core/range');
requires('core/hash_table');
requires('core/notifier');
requires('core/string_buffer');
requires('core/string_extensions');
requires('core/value_holder');
requires('core/dependencies');
requires('core/little_profiler');
requires('core/math');
requires('core/sound');
requires('core/linked_list');

}, function(thisModule) {


});
