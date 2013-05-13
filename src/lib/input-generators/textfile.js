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
var urlm = require("url");
var events = require("events");
var base = require("./_base");

// The default options
var defaults = {
  source: "./line.txt"
};

var emitter = new events.EventEmitter();

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
      var url, page = line.replace(/^\s+|\s+$/g, ""),
          snapshotPage = "/index.html";

      if (page !== "/")
        snapshotPage = path.join(page, snapshotPage);

      url = urlm.format({
            protocol: options.protocol,
            auth: options.auth,
            hostname: options.hostname,
            port: options.port,
            pathname: page//,
            //search: options.queryString,
            //hash: options.hash
          });

      emitter.emit("input", {
        outputFile: path.join(options.outputDir, snapshotPage),
        url: url,
        selector: options.selector(url),
        timeout: options.timeout(url),
        checkInterval: options.checkInterval
      });
    });
  }

  return result;
}

module.exports = {

  /**
   * run
   * Generate the input arguments for snapshots from a simple, line oriented text file
   */
  run: function(options, listener) {
    emitter.removeAllListeners("input");
    emitter.on("input", listener);
    base.defaults(defaults);
    return base.run(options, generateInput);
  }
};