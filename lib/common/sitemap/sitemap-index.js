/**
 * sitemap-index-urls.js
 * 
 * Generates the urls for a sitemap-index.
 * 
 * Copyright (c) 2013 - 2022 Alex Grant, LocalNerve, contributors
 * Licensed under the MIT license.
 */
const _ = require("lodash");
const smc = require("./sitemap-collection");

function sitemapIndexUrls (smLib, options, parseResult) {
  const sitemapUrls = [];
  const sitemapIndexOptions = Object.assign({}, options, {
    outputPath: undefined
  });

  // Check if we should process each sitemap in the index.
  _.forEach(
    // if the sitemap index is malformed, just blow up
    parseResult.sitemapindex.sitemap,
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

function sitemapIndex (smLib, options, parseResult) {
  const {
    sitemapUrls,
    sitemapIndexOptions
  } = sitemapIndexUrls(smLib, options, parseResult);
  return smc.processSitemaps(smLib, options, sitemapIndexOptions, sitemapUrls);
}

module.exports = {
  sitemapIndex
};
