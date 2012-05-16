#!/usr/bin/ruby

def makeWritable(dirName)
  File.chmod(0777, dirName)
  File.chmod(0666, *Dir["#{dirName}/*.js"])
end

Dir.chdir('public/javascripts')
makeWritable(".")

File.chmod(0666, *Dir["*.js"])
["core", "core/collections", "db", "demo", "general_ui", "lk_ext", "lk_programming_environment", "programming_environment", "projects", "reflection", "transporter"].each do |dirName|
  makeWritable(dirName)
end
