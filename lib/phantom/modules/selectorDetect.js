/*
 * selectorDetect.js
 *
 * Produce a single snapshot for a web page when a given selector is detected.
 *
 * This is a module for a phantomJS script that runs in phantomjs. 
 *
 * Copyright (c) 2013, 2014, Alex Grant, LocalNerve, contributors
 * Licensed under the MIT license.
 */

// Get the start time immediately since we're already in a PhantomJS process instance
// The spawner is already counting down (with allowances)...
var start = new Date().getTime();

/**
 * Dependencies, phantomjs
 */
var page = require("webpage").create();
var fs = require("fs");
var globals = require("./globals");

/**
 * waitFor
 *
 * Heavily borrowed from phantomJS 'waitFor' example
 */
function waitFor(testFx, onReady, onTimeout, timeout, checkInterval) {
  var condition = false,
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
 * Applies an optional output filter to the html content.
 * 
 */
function snapshot(options, detector, filter) {
  filter = filter || function(content) { return content; }; 

  console.log("Creating snapshot for "+options.url+"...");

  // https://github.com/ariya/phantomjs/issues/10930
  page.customHeaders = {
    "Accept-Encoding": "identity"
  };  

  // create the snapshot
  page.open(options.url, function (status) {
    if (status !== "success") {
      // if phantomJS could not load the page, so end right now
      globals.exit(2, "Unable to load page " + options.url);
    } else {
      // phantomJS loaded the page, so wait for it to be ready
      waitFor(

        // The test to determine readiness
        function() {
          return page.evaluate(detector, {
            selector: options.selector,
            url: options.url
          });
        },

        // The onReady callback
        function(time) {          
          fs.write(options.outputFile, filter(page.content), "w");
          globals.exit(0, "snapshot for "+options.url+" finished in "+time+" ms\n  written to "+options.outputFile);
        },

        // The onTimeout callback
        function() {
          globals.exit(1, "timed out waiting for "+options.selector+" to become visible for "+options.url);
        },

        options.timeout,
        options.checkInterval

      );
    }
  });
}

module.exports = snapshot;