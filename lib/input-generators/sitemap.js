/**
 * sitemap.js
 *
 * An input generator for html-snapshots that uses a sitemap.xml file.
 * Creates the snapshot arguments driven from sitemap.xml urls.
 *
 * Copyright (c) 2013 - 2017 Alex Grant, LocalNerve, contributors
 * Licensed under the MIT license.
 */
"use strict";

var common = require("../common");
var nodeCall = require("../common/node");
var smLib = require("../common/sitemap");
var base = require("./_base");

// The default options
var defaults = Object.freeze({
  source: "./sitemap.xml",
  sitemapPolicy: false
});

var sitemap;

/**
 * generateInput
 *
 * Called back by base.run to generate the input for this input type.
 * This can return true on error for true async. An async error is supplied to listener
 * in this case via _abort.
 *
 * @param {Object} options - Sitemap options.
 * @param {String} options.source - URL or file path to sitemap.xml.
 * @param {Function} options._abort - Abort function to stop async notifier.
 * @returns {Promise} Resolves to undefined on completion.
 */
function generateInput (options) {
  return nodeCall(
    common.isUrl(options.source) ? smLib.getUrl : smLib.getFile,
    options,
    smLib.parse
  )
    .catch(function (err) {
      options._abort(err);
    })
    .then(function () {
      base.EOI(sitemap);
    });
}

sitemap = module.exports = {
  /**
   * Generate the input arguments for snapshots from a robots.txt file.
   * Each input argument generated calls the listener passing the input object.
   *
   * @param {Object} options - Sitemap options.
   * @param {Function} listener - Callback to receive each input.
   * @returns {Promise} Resolves to undefined on completion.
   */
  run: function (options, listener) {
    var opts = Object.assign({}, base.defaults(defaults), options);

    return base.run(opts, generateInput, listener);
  }
};
