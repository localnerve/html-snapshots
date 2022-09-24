/**
 * Reused sitemap modules.
 * Used by robots, sitemap, and sitemap-index input generators.
 *
 * Copyright (c) 2013 - 2022 Alex Grant, LocalNerve, contributors
 * Licensed under the MIT license.
 */
const sitemap = require("./sitemap");
const smc = require("./sitemap-collection");
const smi = require("./sitemap-index");

module.exports = {
  sitemapCollection: { process: smc.processSitemaps.bind(null, sitemap) },
  sitemapIndex: { process: smi.sitemapIndex.bind(null, sitemap) },
  sitemap
};
