/*
 * helper to add dynamic url nodes to a test sitemap
 */
var smLib = require("sitemap-xml");
var urlLib = require("url");
var fs = require("fs");
var pathLib = require("path");
var _ = require("lodash");
var mkdirp = require("mkdirp").sync;
var base = require("../../lib/input-generators/_base");

var now = new Date();
var outofDate = "2013-05-01T00:00:00.000Z";

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
  var nowDate = now.getFullYear()+"-"+(now.getMonth()+1)+"-"+now.getDate();
  return _.extend({},
      (missing & smElement.lastMod) ? {} : { lastmod: current ? nowDate : outofDate },
      (missing & smElement.changeFreq) ? {} : { changefreq: "weekly" }
  );
}

/**
 * format a urlset.url.loc from a url path
 */
function makeLoc(url) {
  return urlLib.format({
    protocol: "http",
    host: "localhost",
    pathname: url
  });
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
        loc: makeLoc(url),
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
  var filePath, outputDir;

  urlset.forEach(function(urlObj) {
    filePath = base.outputFile(options, urlObj.loc);
    outputDir = pathLib.dirname(filePath);

    if (!fs.existsSync()) {
      mkdirp(outputDir);
    }

    fs.writeFileSync(filePath, html, { encoding: "utf8"});
    fs.utimesSync(filePath, urlObj.lastmod, urlObj.lastmod);
  });
}

/**
 * Mock pre-existing output files for comparisons.
 */
function buildTestFiles(options, urls, current) {

  makeOutputFiles(options, urls.map(function(url, index) {
    return {
      loc: makeLoc(url),
      // always make the out of date file a little older than the outofDate sitemap
      lastmod: index < current ? now : new Date(Date.parse(outofDate) - 10000)
    };
  }));
}

module.exports = {
  smElement: smElement,
  buildSitemapWithPolicy: buildSitemapWithPolicy,
  buildTestFiles: buildTestFiles
};