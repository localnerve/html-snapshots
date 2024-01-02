/*
 * Snapshot an example website.
 * Copyright (c) 2013 - 2024, Alex Grant, LocalNerve, contributors
 *
 * Use sitemap.xml to snapshot an entire site.
 * Use a customFilter to update the output before the snapshots are written.
 */
const path = require("path");
const util = require("util");
const htmlSnapshots = require("html-snapshots");

htmlSnapshots.run({
  input: "sitemap",
  source: "https://sitemaps.org/sitemap.xml",
  outputDir: path.join(__dirname, "./tmp"),
  outputDirClean: true,
  selector: "#mainContent",
  snapshotScript: {
    script: "customFilter",
    module: path.join(__dirname, "myFilter.js")
  },
  timeout: 10000
})
.then(completed => {
  console.log("completed snapshots:");
  console.log(util.inspect(completed));
})
.catch(console.error);
