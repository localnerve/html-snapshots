/*
 * Simple page snapshots example.
 * Copyright (c) 2013 - 2017, Alex Grant, LocalNerve, contributors
 *
 * Use array input to snapshot individual pages.
 * Promise resolution.
 */
var htmlSnapshots = require("html-snapshots");

// where the snapshots go
var outputDir = require("path").join(__dirname, "./tmp");

// The urls to snapshot, along with the selector to wait for (for each):
var pages = {
  "https://google.com": "body",
  "https://google.com/finance": "#market-news-stream"
};

// Do it:
htmlSnapshots.run({
  input: "array",
  source: Object.keys(pages),
  outputDir: outputDir,
  outputDirClean: true,
  selector: pages
})
.then(function (completed) {
  console.log("completed snapshots:");
  console.log(require("util").inspect(completed));
})
.catch(function (err) {
  console.error("failure", err);
});
