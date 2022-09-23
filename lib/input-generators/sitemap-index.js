/**
 * sitemap-index.js
 *
 * An input generator for html-snapshots that uses a sitemap index xml file.
 * Creates the snapshot arguments driven from multiple sitemap.xml urls.
 *
 * Copyright (c) 2013 - 2022 Alex Grant, LocalNerve, contributors
 * Licensed under the MIT license.
 */

const xml2js = require("xml2js");
const common = require("../common");
const { sitemap: sm, sitemapIndex: smi } = require("../common/sitemap");
const base = require("./_base");

// The default options
const defaults = Object.freeze({
  source: "./sitemap-index.xml",
  sitemapPolicy: false,
  // Truthy, directs sitemapIndex sitemap file storage for sitemapPolicy purpose.
  sitemapOutputDir: "_sitemaps_"
});

// This module's export object
const sitemapIndex = {
  /**
   * Generate the input arguments for snapshots from a robots.txt file.
   * Each input argument generated calls the listener passing the input object.
   *
   * @param {Object} options - Sitemap index options.
   * @param {Function} listener - Callback to receive each input.
   * @returns {Promise} Resolves to undefined on completion.
   */
  run: (options, listener) => {
    const opts = Object.assign({}, base.defaults(defaults), options);

    return base.run(opts, generateInput, listener);
  }
};

/**
 * Parse a sitemap index document
 * For each qualifying sitemap element, download, parse the sitemap.
 * Stops processing if an error occurs.
 *
 * @param {Object} options - Sitemap options.
 * @param {Boolean} options.sitemapPolicy - True if sitemap policy should be used.
 * @param {String} document - xml document string.
 * @param {Function} callback - A completion callback.
 */
function parse (options, document, callback) {
  xml2js.parseString(document, {
    trim: true,
    normalizeTags: true,
    normalize: true
  }, (err, result) => {
    if (!err) {
      smi.process(options, result)
        .then(() => callback())
        .catch(callback);
    } else {
      callback(err);
    }
  });
}

/**
 * generateInput
 *
 * Called back by base.run to generate the input for this input type.
 * This can return true on error for true async. An async error is supplied to listener
 * in this case via _abort.
 *
 * @param {Object} options - Sitemap options.
 * @param {String} options.source - Sitemap URL or file path.
 */
function generateInput (options) {
  const retrieve = common.isUrl(options.source) ? sm.getUrl : sm.getFile;
  return retrieve(options, parse)
    .catch(err => {
      options._abort(err);
    })
    .then(() => {
      base.EOI(sitemapIndex);
    });
}

module.exports = sitemapIndex;
