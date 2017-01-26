/*
 * Snapshot an example website.
 * Copyright (c) 2013 - 2017, Alex Grant, LocalNerve, contributors
 *
 * Use sitemap.xml to snapshot an entire site.
 * Use the verbose option to debug the loading of one of the pages.
 */
var htmlSnapshots = require("html-snapshots");

var origin = "http://enigmatic-refuge-9006.herokuapp.com:80";

var pageToDebug = origin + "/sample-page";

// Make the verbose option as an object keyed with the page to debug.
var verboseOption = {
  __default: false
};
verboseOption[pageToDebug] = true;

htmlSnapshots.run({
  input: "sitemap",
  source: origin + "/sitemap.xml",
  outputDir: require("path").join(__dirname, "./tmp"),
  outputDirClean: true,
  selector: ".page-content",
  timeout: 15000,
  processLimit: 1, // to clarify output
  verbose: verboseOption
})
.then(function (completed) {
  console.log("completed snapshots:");
  console.log(require("util").inspect(completed));
})
.catch(function (err) {
  console.error(err);
});
