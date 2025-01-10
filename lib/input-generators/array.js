/*
 * array.js
 *
 * An input generator for html-snapshots that uses a javascript array
 *   to generate snapshot input from the host relative page urls.
 *
 * Copyright (c) 2013 - 2025 Alex Grant, LocalNerve, contributors
 * Licensed under the MIT license.
 */

const urlm = require("url");
const common = require("../common");
const base = require("./_base");

const array = {
  /**
   * Generate the input arguments for snapshots from an array.
   *
   * @param {Object} options - Array generator options.
   * @param {Function} listener - Callback to receive each input.
   * @returns {Promise} Resolves to undefined on completion.
   */
  run: function (options, listener) {
    return base.run(options, generateInput, listener);
  }
};

/**
 * Generate the snapshot arguments from an array of pages.
 * Stops processing if one fails.
 *
 * @param {Object} options - input generator options object.
 * @param {String} options.source - Array of urls.
 * @param {Function} options._abort - Called to abort the output watcher.
 * @returns {Promise} Resolves to undefined on success.
 */
function generateInput (options) {
  const result = new Promise((resolve, reject) => {
    if (Array.isArray(options.source)) {
      const all = options.source.every(sourceUrl => {
        const url = urlm.parse(sourceUrl);
        const opts = Object.assign({}, options, {
          protocol: url.protocol,
          auth: url.auth,
          hostname: url.hostname,
          port: url.port
        });

        if (!base.input(opts, sourceUrl)) {
          reject(
            common.prependMsgToErr(base.generatorError(), sourceUrl, true)
          );
          return false;
        }

        return true;
      });

      if (all) {
        resolve();
      }
    } else {
      reject(new Error("options.source must be an array"));
    }
  });

  return result
    .catch(error => {
      options._abort(error);
    })
    .then(() => {
      base.EOI(array);
    });
}

module.exports = array;
