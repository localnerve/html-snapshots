/*
 * Snapshot an example website
 * 
 * Use sitemap.xml to snapshot the entire site.
 * Use a customFilter to update the output before the snapshots are written.
 * 
 */
var path = require("path");
var util = require("util");
var assert = require("assert");
var htmlSnapshots = require("html-snapshots");

htmlSnapshots.run({
  input: "sitemap",
  source: "http://enigmatic-refuge-9006.herokuapp.com/sitemap.xml",
  outputDir: path.join(__dirname, "./tmp"),
  outputDirClean: true,
  selector: ".page-content",
  snapshotScript: {
    script: "customFilter",
    module: path.join(__dirname, "myFilter.js")
  },
  timeout: 15000
}, function(err, completed) {  

  console.log("completed snapshots:");
  console.log(util.inspect(completed));

  // throw if there was an error
  assert.ifError(err);
});