/*
 * textfile.js
 *
 * An input generator for html-snapshots that uses a simple text file
 *   with the host relative page urls, one per line.
 *
 * Copyright (c) 2013 - 2021 Alex Grant, LocalNerve, contributors
 * Licensed under the MIT license.
 */

const fs = require("fs");
const base = require("./_base");
const common = require("../common");
const nodeCall = require("../common/node");

// The default options
const defaults = Object.freeze({
  source: "./line.txt",
  hostname: "localhost"
});

const textfile = {
  /**
   * Generate the input arguments for snapshots from a simple, line oriented
   * text file.
   *
   * @param {Object} options - Text file options.
   * @param {Function} listener - Callback to receive each input.
   * @returns {Promise} Resolves to undefined on completion.
   */
  run: function (options, listener) {
    const opts = Object.assign({}, base.defaults(defaults), options);

    return base.run(opts, generateInput, listener);
  }
};

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
    .catch(err => {
      options._abort(err);
    })
    .then(data => {
      if (data) {
        let error;
        data.toString().split('\n').every(line => {
          const page = line.replace(/^\s+|\s+$/g, "");

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

module.exports = textfile;
