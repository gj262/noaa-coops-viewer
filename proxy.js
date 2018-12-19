#!/usr/bin/env node

// A rather simple proxy to serve assets locally and send
// API calls elsewhere.

function USAGE (arg) {
  if (arg) {
    console.log('Invalid arg: ' + arg)
  }
  /* eslint no-multi-str: 0 */
  console.log(
    'USAGE: ./proxy.js\n\
\t--proxy=<remote api                [default: https://tidesandcurrents.noaa.gov]>\n\
\t--dir=<dir for static assets       [default: dist]>\n\
\t--port=<local port to listen on    [default: 9090]>\n\
\t--cache=<dir to save api responses [default: noaa-cache]>\n\
'
  )
  process.exit()
}

var options = {
  proxy: process.env.HOST || 'https://tidesandcurrents.noaa.gov',
  dir: process.env.DIR || 'dist',
  port: process.env.PORT || 9090,
  cache: process.env.CACHE || 'noaa-cache'
}

var grokOption = function (option) {
  var match = new RegExp('-?-' + option + '=?(.*)').exec(arg)
  if (match) {
    options[option] = match[1] || process.argv.shift()
    return true
  }
  return false
}

process.argv.shift()
process.argv.shift()
var arg = process.argv.shift()
while (arg) {
  if (/-h/.test(arg)) {
    USAGE()
  }
  if (!['proxy', 'dir', 'port'].some(grokOption)) {
    USAGE(arg)
  }
  arg = process.argv.shift()
}

var express = require('express')
var app = express()
var proxy = require('express-http-proxy')
var fs = require('fs')
var path = require('path')
var temp = require('temp')
var sanitize = require('sanitize-filename')
var Moment = require('moment')

// Allow connections to self signed certs
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

try {
  var cache = fs.statSync(options.cache)
} catch (e) {
  if (e.code === 'ENOENT') {
    fs.mkdir(options.cache)
  }
}
if (cache && !cache.isDirectory()) {
  throw new Error(
    `The cache directory (${options.cache}) exists but is not a directory`
  )
}

app.all('/api/*', function (req, res, next) {
  console.log('Got an API call')
  if (isInCache(req.originalUrl)) {
    console.log('Using cached data for ' + req.originalUrl)
    respondWithCachedData(req.originalUrl, res)
  } else {
    next()
  }
})

app.use(
  /\/api/,
  proxy(options.proxy, {
    proxyReqPathResolver: function (req) {
      console.log(
        'Proxying ' + req.originalUrl + ' to ' + options.proxy + req.originalUrl
      )
      return req.originalUrl
    },
    userResDecorator: function (proxyRes, proxyResData, userReq, userRes) {
      if (!isInCache(userReq.originalUrl) && shouldCache(userReq.originalUrl)) {
        console.log('Caching ' + userReq.originalUrl)
        addToCache(userReq.originalUrl, proxyResData)
      }
      return proxyResData
    }
  })
)

function cachePath (url) {
  return path.join(options.cache, sanitize(url, '_'))
}

function isInCache (url) {
  var cachepath = cachePath(url)
  try {
    fs.statSync(cachepath)
  } catch (e) {
    if (e.code === 'ENOENT') {
      return false
    }
    throw e
  }
  return true
}

function shouldCache (url) {
  // Don't cache the current year
  // Look a day behind and ahead to avoid time difference issues with browser and proxy
  var yesterdayYear = Moment()
    .subtract(1, 'd')
    .year()
  var tomorrowYear = Moment()
    .add(1, 'd')
    .year()
  console.log(`Excluding years ${yesterdayYear} and ${tomorrowYear} from cache`)
  if (
    url.indexOf(`begin_date=${yesterdayYear}`) !== -1 ||
    url.indexOf(`begin_date=${tomorrowYear}`) !== -1
  ) {
    console.log(`Not caching ${url}`)
    return false
  }
  return true
}

function addToCache (url, data) {
  var tmppath = temp.path({ dir: options.cache, suffix: '.tmp' })
  fs.writeFileSync(tmppath, data)
  fs.rename(tmppath, cachePath(url))
}

function respondWithCachedData (url, res) {
  var data = fs.readFileSync(cachePath(url))
  res.set('Content-Type', 'text/json')
  res.send(data)
}

app.use(express.static(path.join(__dirname, '/', options.dir)))

app.listen(options.port)
