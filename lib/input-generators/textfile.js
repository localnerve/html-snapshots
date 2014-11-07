/*
 * textfile.js
 *
 * An input generator for html-snapshots that uses a simple text file 
 *   with the host relative page urls, one per line.
 *
 * Copyright (c) 2013, 2014, Alex Grant, LocalNerve, contributors
 * Licensed under the MIT license.
 * 
 */
var fs = require("fs");
var base = require("./_base");

// The default options
var defaults = {
  source: "./line.txt",
  hostname: "localhost"
};

var textfile;

/**
 * Generate the snapshot arguments from a line oriented text file.
 * Each line contains a single url we need a snapshot for.
 */
function generateInput(options) {

  var result = true;

  if (!fs.existsSync(options.source)) {
    result = false;
    console.error("Could not find input file: "+options.source);
  }
  else {
    fs.readFileSync(options.source).toString().split('\n').forEach(function (line) {
      var page = line.replace(/^\s+|\s+$/g, "");

      if (!base.input(options, page)) {
        result = false;
      }
    });
  }

  base.EOI(textfile);
  return result;
}

textfile = module.exports = {

  /**
   * run
   * Generate the input arguments for snapshots from a simple, line oriented text file
   */
  run: function(options, listener) {
    base.listener(listener);
    base.defaults(defaults);
    return base.run(options, generateInput);
  }
};