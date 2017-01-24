/*
 * textfile.js
 *
 * An input generator for html-snapshots that uses a simple text file
 *   with the host relative page urls, one per line.
 *
 * Copyright (c) 2013 - 2017 Alex Grant, LocalNerve, contributors
 * Licensed under the MIT license.
 */
"use strict";

var fs = require("fs");
var base = require("./_base");
var common = require("../common");
var nodeCall = require("../common/node");

// The default options
var defaults = Object.freeze({
  source: "./line.txt",
  hostname: "localhost"
});

var textfile;

/**
 * Generate the snapshot arguments from a line oriented text file.
 * Each line contains a single url we need a snapshot for.
 *
 * @param {Object} options - input generator options object.
 * @param {String} options.source - path to the local input file.
 * @returns {Promise} resolves when complete.
 */
function generateInput (options) {
  return nodeCall(
    fs.readFile,
    options.source
  )
    .catch(function (err) {
      options._abort(err);
    })
    .then(function (data) {
      var error;

      if (data) {
        data.toString().split('\n').every(function (line) {
          var page = line.replace(/^\s+|\s+$/g, "");

          if (!base.input(options, page)) {
            error = common.prependMsgToErr(base.generatorError(), page, true);
            return false;
          }
          return true;
        });

        if (error) {
          console.error(error);
          options._abort(error);
        }
      }

      base.EOI(textfile);
    });
}

textfile = module.exports = {
  /**
   * Generate the input arguments for snapshots from a simple, line oriented
   * text file.
   *
   * @param {Object} options - Text file options.
   * @param {Function} listener - Callback to receive each input.
   * @returns {Promise} Resolves to undefined on completion.
   */
  run: function (options, listener) {
    var opts = Object.assign({}, base.defaults(defaults), options);

    return base.run(opts, generateInput, listener);
  }
};
