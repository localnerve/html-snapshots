/*
 * cli.js
 *
 * Handles phantomjs command line interface.
 * Reads the command line arguments and returns options.
 *
 * This is a module for a phantomJS script that runs in phantomjs.
 *
 * Copyright (c) 2013 - 2017 Alex Grant, LocalNerve, contributors
 * Licensed under the MIT license.
 */

var system = require("system");
var globals = require("./globals");

module.exports = {

  /**
   * command line argument handling for selector based snapshot scripts
   *  args: PHANTOM_SCRIPT OUTPUTFILE URL SELECTOR [TIMEOUT INTERVAL USEJQUERY FILTER]
   */
  selector: function () {

    var options = {};
    var defaults = {

      // outputFile (required)
      // The file to write the snapshot to
      // encoding is the same as served from url
      outputFile: "snapshot.html",

      // url (required)
      // The url to produce the snapshot from
      url: "http://localhost/",

      // selector (required)
      // The selector to wait for before taking the snapshot
      // When the selector is visible, this defines document readiness
      selector: "body",

      // timeout (optional)
      // The maximum amount of time (ms) to wait before giving up on the snapshot
      timeout: 10000,

      // checkInterval (optional)
      // The frequency (ms) to check for document readiness
      checkInterval: 250,

      // useJQuery (optional)
      // flag to indicate use jQuery selector or not. jQuery must already exist in page.
      useJQuery: false,

      // verbose (optional)
      // flag to indicate verbose output is desired.
      verbose: false

      // module (optional)
      // An external module to load
      // (default undefined)
    };

    if (system.args.length < 4) {
      globals.exit(3, "phantomjs script '"+system.args[0]+"' expected these arguments: OUTPUTFILE URL SELECTOR [TIMEOUT INTERVAL JQUERY MODULE]");
    } else {

      options.outputFile = system.args[1];
      options.url = system.args[2];
      options.selector = system.args[3];
      if (system.args[4]) {
        options.timeout = parseInt(system.args[4], 10);
      }
      if (system.args[5]) {
        options.checkInterval = parseInt(system.args[5], 10);
      }
      if (system.args[6]) {
        var useJQuery = system.args[6].toLowerCase();
        options.useJQuery =
          (useJQuery === "true" || useJQuery === "yes" || useJQuery === "1");
      }
      if (system.args[7]) {
        var verbose = system.args[7].toLowerCase();
        options.verbose =
          (verbose === "true" || verbose === "yes" || verbose === "1");
      }
      if (system.args[8] && system.args[8] !== "undefined") {
        options.module = system.args[8];
      }

      // ensure defaults, replaces false with false in two cases (useJQuery, verbose)
      Object.keys(defaults).forEach(function(prop) {
        if (!options[prop]) {
          options[prop] = defaults[prop];
        }
      });
    }

    return options;

  }
};
