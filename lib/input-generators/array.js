/*
 * array.js
 *
 * An input generator for html-snapshots that uses a javascript array
 *   to generate snapshot input from the host relative page urls.
 *
 * Copyright (c) 2013 - 2016 Alex Grant, LocalNerve, contributors
 * Licensed under the MIT license.
 */
/* global Promise */
'use strict';

var urlm = require("url");
var base = require("./_base");

var array;

/**
 * Generate the snapshot arguments from an array of pages.
 * Stops processing if one fails.
 *
 * @param {Object} options - input generator options object.
 * @param {String} options.source - Array of urls.
 * @param {Function} options._abort - Called to abort the output watcher.
 */
function generateInput (options) {
  var result = new Promise(function (resolve, reject) {
    if (Array.isArray(options.source)) {
      options.source.every(function (sourceUrl) {
        var url = urlm.parse(sourceUrl);

        var opts = Object.assign({}, options, {
          protocol: url.protocol,
          auth: url.auth,
          hostname: url.hostname,
          port: url.port
        });

        if (!base.input(opts, sourceUrl)) {
          reject("failed to process input for " + sourceUrl);
          return false;
        }

        return true;
      });

      resolve();
    }
    reject("options.source must be an array");
  });

  return result
    .catch(function (error) {
      options._abort(error);
    })
    .then(function () {
      base.EOI(array);
    });
}

array = module.exports = {
  /**
   * run
   * Generate the input arguments for snapshots from an array
   */
  run: function(options, listener) {
    base.listener(listener);
    return base.run(options, generateInput);
  }
};
