/**
 * exists.js
 *
 * Robust exists check for snapshot files.
 * Empirically, I found that either one of these NodeJS checks can fail,
 * but both don't. This is a workaround.
 *
 * Copyright (c) 2013 - 2017, Alex Grant, LocalNerve, contributors
 * Licensed under the MIT license.
 */

var fs = require("fs");
var nodeCall = require("../common/node");

/**
 * Check if a path exists.
 *
 * @param {String} path - The full path to the file to check.
 * @param {Object} [options] - fileExists options.
 * @param {Boolean} [options.returnFile] - If true, resolve to input filename on
 * success. Otherwise, resolve to boolean. Defaults to false (boolean).
 * @returns {Promise} Resolves to true (or file) if exists, false otherwise.
 */
function pathExists (path, options) {
  options = options || {
    returnFile: false
  };

  // Defaults to F_OK
  return nodeCall(fs.access, path)
    .then(function () {
      return options.returnFile ? path : true;
    })
    .catch(function () {
      if (fs.existsSync(path)) {
        return options.returnFile ? path : true;
      }
      return false;
    });
}

module.exports = pathExists;
