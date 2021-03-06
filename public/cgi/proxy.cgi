#!/usr/bin/env ruby
require 'net/http'
require 'uri'

def parseParams(paramsString)
  params = {}
  for keyAndValue in paramsString.split("&")
    k, v = keyAndValue.split("=").map {|s| URI.decode(s) }
    # $debugFile.puts "#{k} is #{v}"
    params[k] = v
  end
  params
end

# File.open("#{ENV['HOME']}/avocadoProxyDebugOutput.txt", "w") do |debugFile|

# $debugFile = debugFile

begin
  
  puts "Content-Type: application/json"
  puts


  requestMethod = ENV["REQUEST_METHOD"]
  # puts "<p>request method: #{requestMethod}</p>"

  body = nil
  params = nil
  queryString = ENV["QUERY_STRING"]
  if requestMethod == 'GET'
    # puts "<h2>Query string</h2>"
    params = parseParams(queryString)
  else
    params = parseParams(STDIN.gets)
    body = STDIN.read
  end

  urlString = params['url']
  uri = URI.parse(urlString)
  # debugFile.puts "Sending #{requestMethod} to #{uri.host} : #{uri.port} #{uri.request_uri}"
  response = Net::HTTP.start(uri.host, uri.port) do |http|
    headers = {'Content-Type' => 'application/json'}
    http.send_request(requestMethod, uri.request_uri, body, headers)
  end

  puts response.body

end

# end
