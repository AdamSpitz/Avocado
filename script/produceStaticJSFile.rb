#!/usr/bin/ruby

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

Dir.chdir('public/javascripts')
preamble();
ARGF.each {|line| eval(line) }
postscript();
