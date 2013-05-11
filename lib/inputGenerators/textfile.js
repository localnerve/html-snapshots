/*
 * textfile.js
 *
 * An input generator for html-snapshots that uses a simple text file 
 *   with the host relative page urls, one per line.
 *
 * Copyright (c) 2013, Alex Grant, LocalNerve, contributors
 * Licensed under the MIT license.
 * 
 */
var fs = require("fs");
var path = require("path");

// The default options
var defaults = {
  inputGenerator: "textfile",
  inputFile: "./line.txt",
  protocol: "http",
  hostname: "localhost",
  snapshotDir: "./snapshots",
  selector: function(url) { return "body"; }, // definitely override this
  timeout: function(url) { return 5000; },
  checkInterval: 250
};

/**
 * Generate the snapshot arguments from a line oriented text file.
 * Each line contains a single url we need a snapshot for.
 */
function generateInput(options) {

  var args = [];

  if (!fs.existsSync(options.inputFile))
    console.error("Could not find input file: "+options.inputFile);
  else {
    fs.readFileSync(options.inputFile).toString().split('\n').forEach(function (line) {
      var url, page = line.replace(/^\s+|\s+$/g, ""),
          snapshotPage = "/index.html";

      if (page !== "/")
        snapshotPage = path.join(page, snapshotPage);

      url = options.protocol + "://" + options.hostname + page;

      args.push({
        outputFile: path.join(options.snapshotDir, snapshotPage),
        url: url,
        selector: options.selector(url),
        timeout: options.timeout(url),
        checkInterval: options.checkInterval
      });
    });
  }

  return args;
}

module.exports = {

  /**
   * run
   * Generate the input arguments for snapshots from a simple, line oriented text file
   */
  run: function(options) {
    options = options || {};

    // ensure defaults are represented
    for (var prop in defaults) {
      if (!options[prop])
        options[prop] = defaults[prop];
    }

    // fix selector and timeout arguments if they are not functions.
    if (typeof options.selector !== "function")
      options.selector = (function(selector) { return function() { return selector; }; })(options.selector);
    if (typeof options.timeout !== "function")
      options.timeout = (function(timeout) { return function() { return timeout; }; })(options.timeout);

    return generateInput(options);
  },

  /**
   * defaults
   * Expose the default options hash for this input generator
   */
  defaults: defaults

};