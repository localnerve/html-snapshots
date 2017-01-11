/*
 * robots.js
 *
 * An input generator for html-snapshots that uses a simple robots.txt file.
 * Creates the snapshot arguments driven from robots.txt "Allow: ".
 * Does not support wildcards.
 * If you need wildcards, use the sitemap input generator.
 *
 * Copyright (c) 2013 - 2016 Alex Grant, LocalNerve, contributors
 * Licensed under the MIT license.
 */
'use strict';

var fs = require("fs");
var request = require("request");
var common = require("../common");
var nodeCall = require("../common/node");
var base = require("./_base");

// The default options
var defaults = {
  source: "./robots.txt",
  hostname: "localhost"
};

var robots;

/**
 * Process one line of a simple robots.txt file
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
 */
function getRobotsUrl (options, callback) {
  request({
    url: options.source,
    timeout: options.timeout() // get the default timeout
  }, function(err, res, body) {
    var error = err || common.checkResponse(res, "text/plain");

    if (error) {
      callback("'"+options.source+"' error: "+error);
    } else {

      body.toString().split('\n').every(function(line) {
        // Process the line input, but break if base.input returns false.
        // For now, this can only happen if no outputDir is defined,
        //   which is a fatal bad option problem and will happen immediately.
        if (!oneline(line, options)) {
          error = "error creating input for '"+line+"'";
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
          err = "error creating input for '"+line+"'";
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
 * @returns {Promise}
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
   * run
   * Generate the input arguments for snapshots from a robots.txt file
   * Each input argument generated calls the listener passing the input object.
   */
  run: function (options, listener) {
    base.listener(listener);
    base.defaults(defaults);
    return base.run(options, generateInput);
  }
};
