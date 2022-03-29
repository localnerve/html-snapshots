/**
 * exists.js
 *
 * Robust exists check for snapshot files.
 * Empirically, I found that either one of these NodeJS checks can fail,
 * but both don't. This is a workaround.
 *
 * Copyright (c) 2013 - 2022, Alex Grant, LocalNerve, contributors
 * Licensed under the MIT license.
 */

const fs = require("fs").promises;

/**
 * Check if a path exists.
 *
 * @param {String} path - The full path to the file to check.
 * @param {Object} [options] - fileExists options.
 * @param {Boolean} [options.returnFile] - If true, resolve to input filename on
 * success. Otherwise, resolve to boolean. Defaults to false (boolean).
 * @returns {Promise} Resolves to true (or file) if exists, false otherwise.
 */
function pathExists (path, { returnFile=false }={ returnFile: false }) {
  return fs.access(path)
    .then(() => returnFile ? path : true)
    .catch(() => false);
}

module.exports = pathExists;
