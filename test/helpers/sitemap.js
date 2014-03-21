/*
 * helper to add dynamic url nodes to a test sitemap
 */
var smLib = require("sitemap-xml");
var urlLib = require("url");
var fs = require("fs");
var _ = require("underscore");
var base = require("../../lib/input-generators/_base");

/**
 * The sitemap element enum
 * Indicates which optional sitemap policy elements are missing.
 *    0 means no policy elements are missing
 *    1 means lastmod policy element is missing
 *    2 means changefreq policy element is missing
 *    3 means all policy elements missing
 */
var smElement = {
  none: 0,
  lastMod: 1,
  changeFreq: 2,
  all: 3
};

/**
 * `current` is a boolean that indicates if the policy should be current
 * `missing` can be smElement value.
 *
 * If lastmod is not missing
 *   if current, it is now, else 1/1/2013
 * If changefreq is not missing
 *   it is always "weekly"
 */
function lastmodChangeFreq(current, missing) {
  var now = new Date();
  var nowDate = now.getFullYear()+"-"+(now.getMonth()+1)+"-"+now.getDate();
  return _.extend({},
      (missing & smElement.lastMod) ? {} : { lastmod: current ? nowDate : "2013-01-01" },
      (missing & smElement.changeFreq) ? {} : { changefreq: "weekly" }
  );
}

/**
 * Builds a sitemap with localhost urls and stores it at `path`.
 * Creates the sitemap with `urls`, `current` of which will be current by policy
 * `missing` can be smElement value. 
 * All urls are given the priority of 0.5
 */
function buildSitemapWithPolicy(path, urls, current, missing, cb) {
  var sm = smLib();

  // map given paths to url sitemap nodes
  var urlNodes = urls.map(function(url, index) {
    return _.extend({
        loc: urlLib.format({
          protocol: "http",
          host: "localhost",
          pathname: url
        }),
        priority: "0.5"
      },
      lastmodChangeFreq(index < current, missing)
    );
  });

  //fs.unlinkSync(path);
  var writeStream = fs.createWriteStream(path, { encoding: "utf8" });
  writeStream.on("finish", cb);

  sm.pipe(writeStream);
  urlNodes.forEach(function(urlNode) {
    sm.write(urlNode);
  });
  sm.end();
}

/**
 * Make html output files for a given url set.
 * The `urlset` is an array of objects that are: { loc: <url>, lastmod: <Date> }
 * This mocks output from a previous run and sets a,mtimes for the files.
 */
function makeOutputFiles(options, urlset) {
  var html = "<!doctype html><html><head><title>test</title></head><body><h1>Hello World</h1><p>This is a test</p</body>";
  var outputPath;

  urlset.forEach(function(urlObj) {
    filePath = base.outputFile(options, urlObj.loc);
    fs.writeFileSync(filePath, html, { encoding: "utf8"});
    fs.utimesSync(filePath, urlObj.lastmod, urlObj.lastmod);
  });
}

module.exports = {
  buildSitemapWithPolicy: buildSitemapWithPolicy,
  smElement: smElement
};