/*
 * Snapshot an example website.
 * Copyright (c) 2013 - 2017, Alex Grant, LocalNerve, contributors
 *
 * Use sitemap.xml to snapshot an entire site.
 * Use a customFilter to update the output before the snapshots are written.
 */
var path = require("path");
var util = require("util");
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
})
.then(function (completed) {
  console.log("completed snapshots:");
  console.log(util.inspect(completed));
})
.catch(function (err) {
  console.error(err);
});
