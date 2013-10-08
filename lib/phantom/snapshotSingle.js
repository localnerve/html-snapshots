/*
 * snapshotSingle.js
 *
 * Produce a single snapshot for a web page.
 *
 * This is a phantomJS script that runs in phantomjs.
 *
 * Copyright (c) 2013, Alex Grant, LocalNerve, contributors
 * Licensed under the MIT license.
 */

/**
 * Dependencies, phantomjs
 */
var page = require("webpage").create();
var fs = require("fs");
var system = require("system");

// Runtime options
var defaults = {

  // outputFile (required)
  // The file to write the snapshot to
  // encoding is the same as served from url
  outputFile: "snapshot.html",

  // url (required)
  // The url to produce the snapshot from
  // The page must use jQuery/Zepto
  url: "http://localhost/",

  // selector (required)
  // The selector to wait for before taking the snapshot
  // When the selector is visible, this defines document readiness
  selector: "body",

  // timeout (optional)
  // The maximum amount of time (ms) to wait before giving up on the snapshot
  timeout: 3000,

  // checkInterval (optional)
  // The frequency (ms) to check for document readiness
  checkInterval: 250
};

/**
 * Exit phantomJS
 *
 */
function _exit(code, msg) {
  if (code !== 0)
    console.error(msg);
  else
    console.log(msg);
  phantom.exit(code);
}

/**
 * waitFor
 *
 * Heavily borrowed from phantomJS 'waitFor' example
 */
function waitFor(testFx, onReady, onTimeout, start, timeout, checkInterval) {  
  condition = false,
  interval = setInterval(function() {
    if ( (new Date().getTime() - start < timeout) && !condition ) {
      // If not timeout yet and condition not yet fulfilled
      condition = testFx();
    } else {
      clearInterval(interval); // Stop this interval
      if ( !condition ) {
        // If condition still not fulfilled (timeout but condition is 'false')
        onTimeout();
      } else {
        // Condition fulfilled (timeout and/or condition is 'true')
        onReady((new Date().getTime() - start));
      }
    }
  }, checkInterval);
}

/**
 * snapshot
 *
 * Opens the page and waits for the selector to become visible. Then takes the html snapshot.
 */
function snapshot(options) {
  options = options || {};

  // ensure defaults
  for (var prop in defaults) {
    if (!options[prop])
      options[prop] = defaults[prop];
  }

  // https://github.com/ariya/phantomjs/issues/10930
  page.customHeaders = {
    "Accept-Encoding": "identity"
  };

  var start = new Date().getTime();

  // create the snapshot
  page.open(options.url, function (status) {
    if (status !== "success") {
      // if phantomJS could not load the page, so end right now
      _exit(2, "Unable to load page " + options.url);
    } else {
      // phantomJS loaded the page, so wait for it to be ready
      waitFor(

        // The test to determine readiness
        function() {
          return page.evaluate(function(options){
            if (typeof $ !== "undefined") {
              // the definition of document readiness
              return $(options.selector).is(":visible");
            } else {
              console.log("jQuery/Zepto not found yet on page " + options.url);
              return false; // keep waiting for jQuery/Zepto to load
            }
          }, {selector: options.selector, url: options.url});
        },

        // The onReady callback
        function(time) {
          fs.write(options.outputFile, page.content, "w");
          _exit(0, "snapshot for "+options.url+" finished in "+time+" ms\n  written to "+options.outputFile);
        },

        // The onTimeout callback
        function() {
          _exit(1, "timed out waiting for "+options.selector+" to become visible for "+options.url);
        },

        start,
        options.timeout,
        options.checkInterval

      );
    }
  });
}

//
// main
//
if (system.args.length < 4) {
  _exit(3, "Usage: phantomjs PHANTOM_SCRIPT OUTPUTFILE URL SELECTOR [TIMEOUT] [INTERVAL]");
} else {
  var options = {
    outputFile: system.args[1],
    url: system.args[2],
    selector: system.args[3]
  };
  if (system.args[4]) {
    options.timeout = parseInt(system.args[4], 10);
  }
  if (system.args[5]) {
    options.checkInterval = parseInt(system.args[5], 10);
  }

  console.log("Creating snapshot for "+options.url+"...");
  snapshot(options);
}