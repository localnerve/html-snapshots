/*
 * verbose.js
 *
 * Adds handlers to WebPage module to produce additional output for debugging.
 *
 * This is a module for a phantomJS script that runs in phantomjs.
 *
 * Copyright (c) 2013 - 2017 Alex Grant, LocalNerve, contributors
 * Licensed under the MIT license.
 */
/* global window */
var system = require("system");

/**
 * Decorate the given WebPage with handlers to produce verbose output.
 * Source:
 * https://newspaint.wordpress.com/2013/04/25/getting-to-the-bottom-of-why-a-phantomjs-page-load-fails/
 */
function verbose (page) {

  page.onResourceError = function(resourceError) {
      system.stderr.writeLine('= onResourceError()');
      system.stderr.writeLine('  - unable to load url: "' + resourceError.url + '"');
      system.stderr.writeLine('  - error code: ' + resourceError.errorCode + ', description: ' + resourceError.errorString );
  };

  page.onError = function(msg, trace) {
      system.stderr.writeLine('= onError()');
      var msgStack = ['  ERROR: ' + msg];
      if (trace) {
          msgStack.push('  TRACE:');
          trace.forEach(function(t) {
              msgStack.push('    -> ' + t.file + ': ' + t.line + (t.function ? ' (in function "' + t.function + '")' : ''));
          });
      }
      system.stderr.writeLine(msgStack.join('\n'));
  };

  page.onResourceRequested = function (request) {
      system.stderr.writeLine('= onResourceRequested()');
      system.stderr.writeLine('  request: ' + JSON.stringify(request, undefined, 4));
  };

  page.onResourceReceived = function(response) {
      system.stderr.writeLine('= onResourceReceived()' );
      system.stderr.writeLine('  id: ' + response.id + ', stage: "' + response.stage + '", response: ' + JSON.stringify(response));
  };

  page.onLoadStarted = function() {
      system.stderr.writeLine('= onLoadStarted()');
      var currentUrl = page.evaluate(function() {
          return window.location.href;
      });
      system.stderr.writeLine('  leaving url: ' + currentUrl);
  };

  page.onNavigationRequested = function(url, type, willNavigate, main) {
      system.stderr.writeLine('= onNavigationRequested');
      system.stderr.writeLine('  destination_url: ' + url);
      system.stderr.writeLine('  type (cause): ' + type);
      system.stderr.writeLine('  will navigate: ' + willNavigate);
      system.stderr.writeLine('  from page\'s main frame: ' + main);
  };

  page.onLoadFinished = function(status) {
      system.stderr.writeLine('= onLoadFinished()');
      system.stderr.writeLine('  status: ' + status);
  };
}

module.exports = verbose;
