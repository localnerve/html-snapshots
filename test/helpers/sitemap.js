/*
 * helper to add dynamic url nodes to a test sitemap
 */
var smLib = require("sitemap");
var urlLib = require("url");
var fs = require("fs");
var _ = require("underscore");

/**
 * The sitemap element enum
 */
var smElement = {
  all: 0,
  lastMod: 1,
  changeFreq: 2
};

/**
 * `current` is a boolean that indicates if the policy should be current
 * `missing` can be 0, 1, or 2. 
 *    0 means no missing policy elements
 *    1 means lastmod policy element is missing
 *    2 means changefreq policy element is missing
 */
function lastmodChangeFreq(current, missing) {
  var now = new Date();
  var nowDate = now.getFullYear()+"-"+(now.getMonth()+1)+"-"+now.getDate();
  return _.extend({},
      missing !== smElement.lastMod ? { lastmod: current ? nowDate : "2013-01-01"} : {},
      missing !== smElement.changeFreq ? { changefreq: "weekly" } : {}
  );
}

/**
 * Builds a sitemap with localhost urls and stores it at `path`.
 * Creates the sitemap with `urls`, `current` of which will be current by policy
 * `missing` can be 0, 1, or 2. 
 *    0 means no missing policy elements
 *    1 means lastmod policy element is missing
 *    2 means changefreq policy element is missing
 * All urls are given the priority of 0.5
 */
function buildSitemapWithPolicy(path, urls, current, missing, cb) {
  var sm = smLib.createSitemap({
    hostname: urlLib.format({
      protocol: "http",
      hostname: "localhost",
      port: 80
    }),
    cacheTime: 0
  });

  sm.urls = urls.map(function(url, index) {
    return _.extend({ url: url, prority: 0.5 },
      lastmodChangeFreq(index < current, missing)
    );
  });

  sm.toXML(function(xml) {
    fs.writeFileSync(path, xml, { encoding: "utf8" });
    cb();
  });
}

module.exports = {
  buildSitemapWithPolicy: buildSitemapWithPolicy,
  smElement: smElement
};