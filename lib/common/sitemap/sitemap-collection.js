/**
 * sitemap-index.js (common functions)
 * 
 * Copyright (c) 2013 - 2022 Alex Grant, LocalNerve, contributors
 * Licensed under the MIT license.
 */
const fs = require("fs");
const pathLib = require("path");
const common = require("../index");
const base = require("../../input-generators/_base");

/**
 * Make sure path exists so a sitemap write can succeed.
 *
 * @param {String} outputPath - File path and name.
 * @param {Function} callback - Completion callback.
 */
 function prepareWrite (outputPath, callback) {
  const path = pathLib.parse(outputPath);
  const dir = pathLib.join(path.root, path.dir);
  fs.mkdir(dir, { recursive: true }, err => {
    callback(err);
  });
}

/**
 * Parse a sitemap, generate input, and optionally update the local file
 * for sitemapPolicy purposes.
 * This writes the sitemap files out EVEN IF sitemapPolicy is false.
 * The thinking is that it's better/cheaper to do this b/c if sitemapPolicy is
 * enabled later, then there is something to compare against, for more savings.
 *
 * @param {Object} options - Sitemap options.
 * @param {Object} options.__sitemapIndex - Sitemap Index options.
 * @param {String} document - xml document string.
 * @param {Function} callback - A completion callback.
 */
function processSitemap (smLib, options, document, callback) {
  smLib.parse(options, document, err => {
    const sitemapIndexOpts = options.__sitemapIndex;
    const outputPath = base.outputFile(sitemapIndexOpts, options.source);

    if (!err && sitemapIndexOpts.sitemapOutputDir) {
      prepareWrite(outputPath, err => {
        if (!err) {
          fs.writeFile(outputPath, document, callback);
        } else {
          callback(common.prependMsgToErr(err, outputPath, true));
        }
      });
    } else {
      callback(err);
    }
  });
}

/**
 * Get and process a sitemaps collection.
 * 
 * @param {Object} smLib - Sitemap common module.
 * @param {Object} options - Sitemap options.
 * @param {Array} sitemapUrls - collection of sitemap urls to process.
 * @param {Object} [sitemapIndexOptions] - Sitemap index options.
 * @returns {Promise} resolves when all sitemaps are processed, reject as soon as one fails
 */
function processSitemaps (smLib, options, sitemapUrls, sitemapIndexOptions) {
  // Edge case message for clarity
  if (sitemapUrls.length === 0) {
    console.log("[*] No sitemaps qualified for processing");
    return Promise.resolve([]);
  }

  const smiOptions = sitemapIndexOptions || {
    ...options,
    ...{ outputPath: undefined }
  };

  // Get all the sitemaps, parse them, and generate input for each
  return Promise.all(sitemapUrls.map(sitemapUrl => {
    const sitemapOptions = Object.assign({}, options, {
      source: sitemapUrl,
      input: "sitemap",
      sitemapOutputDir: false,
      __sitemapIndex: smiOptions
    });

    console.log(`[+] Loading the sitemap: '${sitemapUrl}'`);

    return smLib.getUrl(sitemapOptions, processSitemap.bind(null, smLib));
  }));
}

module.exports = {
  processSitemaps
};
