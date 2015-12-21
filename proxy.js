#!/usr/bin/env node

// A rather simple proxy to serve assets locally and send
// API calls elsewhere.

function USAGE(arg) {
  if (arg) {
    console.log('Invalid arg: ' + arg);
  }
  /*eslint no-multi-str: 0*/
  console.log('USAGE: ./proxy.js\n\
\t--proxy=<remote api                [default: http://tidesandcurrents.noaa.gov]>\n\
\t--dir=<local dir for static assets [default: dist]>\n\
\t--port=<local port to listen on    [default: 9090]>\n\
');
  process.exit();
}

var options = {
  proxy: process.env.HOST  || 'http://tidesandcurrents.noaa.gov',
  dir:   process.env.DIR   || 'dist',
  port:  process.env.PORT  || 9090
};

var grokOption = function (option) {
  var match = new RegExp('\-?\-' + option + '\=?(.*)').exec(arg);
  if (match) {
    options[option] = match[1] || process.argv.shift();
    return true;
  }
  return false;
};

process.argv.shift();
process.argv.shift();
var arg = process.argv.shift();
while (arg) {
  if (/\-h/.test(arg)) {
    USAGE();
  }
  if (!['proxy', 'dir', 'port'].some(grokOption)) {
    USAGE(arg);
  }
  arg = process.argv.shift();
}

var express = require('express');
var app = express();
var proxy = require('express-http-proxy');

// Allow connections to self signed certs
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

var cache = {};

app.all('/api/*', function(req, res, next) {
  console.log('Got an API call')
  if (req.originalUrl in cache) {
    console.log('Using cached data for ' + req.originalUrl)
    var hit = cache[req.originalUrl]
    res.set('Content-Type', hit['Content-Type'])
    res.set('Content-Encoding', hit['Content-Encoding'])
    res.send(hit.data)
  }
  else {
    next()
  }
})

app.use(/\/api/, proxy(options.proxy, {
  forwardPath: function(req, res) {
    console.log('Proxying ' + req.originalUrl + ' to ' + options.proxy + req.originalUrl);
    return req.originalUrl;
  },
  intercept: function(rsp, data, req, res, callback) {
    if (!(req.originalUrl in cache)) {
      console.log('Caching ' + req.originalUrl)
      cache[req.originalUrl] = {
        data: data,
        'Content-Type': res.get('Content-Type'),
        'Content-Encoding': res.get('Content-Encoding')
      }
    }
    callback(null, data)
  }
}));

app.use(express.static(__dirname + '/' + options.dir));

app.listen(options.port);
