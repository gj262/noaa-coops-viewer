// Wraps node's debug module for use as a configurable logger.
// https://github.com/visionmedia/debug

// To get correct line numbers in console output this file is bundled
// with the node debug module into public/js/logging.js. In Chrome
// console you will need to 'blackbox' this script to get it to print
// line numbers w.r.t. the point where the debug() call is made.

// Each JS file should have a debug definition defined relating to its
// path. e.g. var debug = window.debug('components/graph/diagram');

// Enabling debug output is achieved through the developer console with:
// window.debug.enable('path/to/file,path/to/another,-path/to/something)
// '-' being used to exclude paths.
// '*' wildcards are supported.

// 'blackboxing' and enabled debug files are persistent across browser
// reloads and restarts.

window.debug = require('debug')
