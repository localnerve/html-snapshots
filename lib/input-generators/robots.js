/*
 * robots.js
 *
 * An input generator for html-snapshots that uses a simple robots.txt file.
 * Creates the snapshot arguments driven from robots.txt "Allow: ".
 * Does not support wildcards.
 * If you need wildcards, use the sitemap input generator.
 *
 * Copyright (c) 2013 - 2017 Alex Grant, LocalNerve, contributors
 * Licensed under the MIT license.
 */
"use strict";

var fs = require("fs");
var request = require("request");
var common = require("../common");
var nodeCall = require("../common/node");
var base = require("./_base");

// The default options
var defaults = Object.freeze({
  source: "./robots.txt",
  hostname: "localhost"
});

var robots;

/**
 * Generate input for one line of a simple robots.txt file
 * Does not support wildcards.
 */
function oneline (line, options) {
  var key = "Allow: ",
      index = line.indexOf(key);

  if (index !== -1) {
    var page = line.substr(index + key.length).replace(/^\s+|\s+$/g, "");
    return page.indexOf("*") === -1 && base.input(options, page);
  }

  return true;
}

/**
 * Retrieves robots.txt from url and parses it.
 *
 * @param {Object} options - Robots.txt options
 * @param {String} options.source - The URL to a robots.txt
 * @param {Function} options.timeout - Returns the robots.txt request timeout.
 * @param {Function} callback - A completion callback.
 */
function getRobotsUrl (options, callback) {
  request({
    url: options.source,
    timeout: options.timeout()
  }, function (err, res, body) {
    var error = err || common.checkResponse(res, "text/plain");

    if (error) {
      callback(common.prependMsgToErr(error, options.source, true));
    } else {
      body.toString().split('\n').every(function(line) {
        // Process the line input, but break if base.input returns false.
        // For now, this can only happen if no outputDir is defined,
        //   which is a fatal bad option problem and will happen immediately.
        if (!oneline(line, options)) {
          error = common.prependMsgToErr(base.generatorError(), line, true);
          return false;
        }
        return true;
      });

      callback(error);
    }
  });
}

/**
 * Reads the robots.txt file and parses it.
 */
function getRobotsFile (options, callback) {
  fs.readFile(options.source, function (err, data) {
    if (!err) {
      data.toString().split('\n').every(function (line) {
        // Process the line input, but break if base.input returns false.
        // For now, this can only happen if no outputDir is defined,
        //   which is a fatal bad option problem and will happen immediately.
        if (!oneline(line, options)) {
          err = common.prependMsgToErr(base.generatorError(), line, true);
          return false;
        }
        return true;
      });
    }

    callback(err);
  });
}

/**
 * Generate the snapshot arguments from a robots.txt file.
 * Each line that has "Allow:" contains a url we need a snapshot for.
 * This can return true on error for true async. An async error is supplied to listener
 * in this case via _abort.
 *
 * @param {Object} options - input generator options object.
 * @param {String} options.source - A url or file path.
 * @param {Function} options._abort - Abort function to stop the async notifier.
 * @returns {Promise} Resolves to undefined on completion.
 */
function generateInput (options) {
  return nodeCall(
    common.isUrl(options.source) ? getRobotsUrl : getRobotsFile,
    options
  )
    .catch(function (err) {
      options._abort(err);
    })
    .then(function () {
      base.EOI(robots);
    });
}

robots = module.exports = {
  /**
   * Generate the input arguments for snapshots from a robots.txt file
   * Each input argument generated calls the listener passing the input object.
   *
   * @param {Object} options - Robots options.
   * @param {Function} listener - Callback to receive each input.
   * @returns {Promise} Resolves to undefined on completion.
   */
  run: function (options, listener) {
    var opts = Object.assign({}, base.defaults(defaults), options);

    return base.run(opts, generateInput, listener);
  }
};
