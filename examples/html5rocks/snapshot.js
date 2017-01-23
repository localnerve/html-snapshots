/*
 * Snapshot multiple pages using arrays.
 * Copyright (c) 2013 - 2017, Alex Grant, LocalNerve, contributors
 *
 * Use an array to snapshot specific urls.
 * Use per-page selectors.
 * Use per-page output paths.
 * Remove all script tags from output.
 * Use javascript arrays.
 */
var path = require("path");
var util = require("util");
var assert = require("assert");
var htmlSnapshots = require("html-snapshots");

// a data structure with snapshot input
var sites = [
  {
    label: "html5rocks",
    url: "http://html5rocks.com",
    selector: ".latest-articles"
  },
  {
    label: "updates.html5rocks",
    url: "https://developers.google.com/web/updates/",
    selector: ".devsite-landing-row-item"
  }
];

htmlSnapshots.run({
  // input source is the array of urls to snapshot
  input: "array",
  source: sites.map(function(site) { return site.url; }),

  // setup and manage the output
  outputDir: path.join(__dirname, "./tmp"),
  outputDirClean: true,

  // per url output paths, { url: outputpath [, url: outputpath] }
  outputPath: sites.reduce(function(prev, curr) {
    prev[curr.url] = curr.label; // use the label to differentiate '/index.html' from both sites
    return prev;
  }, {}),

  // per url selectors, { url: selector [, url: selector] }
  selector: sites.reduce(function(prev, curr) {
    prev[curr.url] = curr.selector;
    return prev;
  }, {}),

  // remove all script tags from the output
  snapshotScript: {
    script: "removeScripts"
  },

  // handle ssl for updates.html5rocks only
  phantomjsOptions: {
    // key must match url exactly
    "https://developers.google.com/web/updates/": ["--ssl-protocol=any", "--ignore-ssl-errors=true"]
  }
})
.then(function (completed) {
  console.log("completed snapshots:");
  console.log(util.inspect(completed));
})
.catch(function (err) {
  console.error(err);
});
