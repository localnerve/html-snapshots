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
var base = require("./_common");

// The default options
var defaults = {
  inputFile: "./line.txt"
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
    base.defaults(defaults);
    return base.run(options, generateInput);
  }
};