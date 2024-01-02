/**
 * sitemap-index.js
 * 
 * Generates the urls for a sitemap-index.
 * 
 * Copyright (c) 2013 - 2024 Alex Grant, LocalNerve, contributors
 * Licensed under the MIT license.
 */
const smc = require("./sitemap-collection");

/**
 * Create a collection of sitemap urls to process by policy, form sitemapIndexOptions.
 *
 * @param {Object} smLib - Sitemap module
 * @param {Object} options - sitemap index options
 * @param {Boolean} options.sitemapPolicy - True if sitemap policy should be used.
 * @param {Object} parseResult - xml2js sax parse result object
 * @returns {Object} The sitemapUrls collection and sitemapIndexOptions
 */
function sitemapIndexUrls (smLib, options, parseResult) {
  const sitemapUrls = [];
  const sitemapIndexOptions = {
    ...options,
    ...{ outputPath: undefined }
  };

  // Check if we should process each sitemap in the index.
  parseResult.sitemapindex?.sitemap?.forEach(
    sitemapNode => {
      // optionally ignore current sitemaps by sitemap policy
      const shouldProcess = !options.sitemapPolicy ||
        !smLib.stillCurrent(sitemapNode, sitemapIndexOptions);

      if (shouldProcess) {
        // if sitemap index is malformed, just blow up
        sitemapUrls.push(sitemapNode.loc[0]);
      }
    }
  );

  return {
    sitemapUrls,
    sitemapIndexOptions
  };
}

/**
 * Collect sitemap urls from a sitemap index file for processing.
 *
 * @param {Object} smLib - sitemap module
 * @param {Object} options - sitemapIndex options
 * @param {Object} parseResult - xml2js sax parse result object
 * @returns {Promise} resolves when all sitemaps are processed, reject as soon as one fails
 */
function sitemapIndex (smLib, options, parseResult) {
  const {
    sitemapUrls,
    sitemapIndexOptions
  } = sitemapIndexUrls(smLib, options, parseResult);
  return smc.processSitemaps(smLib, options, sitemapUrls, sitemapIndexOptions);
}

module.exports = {
  sitemapIndex
};
