#!/usr/bin/ruby

Dir.chdir('public/javascripts')

File.chmod(0666, *Dir["*.js"])
["core", "lk_ext", "lk_programming_environment", "programming_environment", "projects", "reflection", "transporter"].each do |dirName|
  File.chmod(0777, dirName)
  File.chmod(0666, *Dir["#{dirName}/*.js"])
end
