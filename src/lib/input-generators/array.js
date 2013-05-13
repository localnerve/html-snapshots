/*
 * array.js
 *
 * An input generator for html-snapshots that uses a javascript array 
 *   to generate snapshot input from the host relative page urls.
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

var emitter = new events.EventEmitter();

/**
 * Generate the snapshot arguments from an array of pages.
 */
function generateInput(options) {

  var result = true;

  if (options.source && toString.call(options.source) == "[object Array]") {

    for (var i = 0; i < options.source.length; i++) {
      var url, snapshotPage = "/index.html", page = options.source[i];

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
    }
  } else {
    result = false;
  }

  return result;
}

module.exports = {

  /**
   * run
   * Generate the input arguments for snapshots from an array
   */
  run: function(options, listener) {
    emitter.removeAllListeners("input");
    emitter.on("input", listener);
    return base.run(options, generateInput);
  }
};