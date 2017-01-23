/*
 * Process limit snapshots example.
 * Copyright (c) 2013 - 2017, Alex Grant, LocalNerve, contributors
 *
 * Uses robots.txt to drive website snapshot.
 * Limits the number of browser processes to 1 (1 at a time).
 */
var htmlSnapshots = require("html-snapshots");

// where the snapshots go
var outputDir = require("path").join(__dirname, "./tmp");

// The hostname of the website
var hostname = "enigmatic-refuge-9006.herokuapp.com";

// Do it:
htmlSnapshots.run({
  source: "http://" + hostname + "/robots.txt",
  hostname: hostname,
  outputDir: outputDir,
  outputDirClean: true,
  selector: ".page-content",
  timeout: 15000,
  processLimit: 1 // no parallel fetch, one browser process at a time
})
.then(function (completed) {
  console.log("completed snapshots:");
  console.log(require("util").inspect(completed));
})
.catch(function (err) {
  console.error(err);
});
