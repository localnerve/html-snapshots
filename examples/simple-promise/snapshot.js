/*
 * Simple page snapshots example.
 * Copyright (c) 2013 - 2024, Alex Grant, LocalNerve, contributors
 *
 * Use array input to snapshot individual pages.
 */
const htmlSnapshots = require("html-snapshots");

// where the snapshots go
const outputDir = require("path").join(__dirname, "./tmp");

// The urls to snapshot, along with the selector to wait for (for each):
const pages = {
  "https://google.com": "body",
  "https://google.com/books": "#oc-search-description"
};

// Do it:
htmlSnapshots.run({
  input: "array",
  source: Object.keys(pages),
  outputDir,
  outputDirClean: true,
  selector: pages
})
.then(completed => {
  console.log("completed snapshots:");
  console.log(require("util").inspect(completed));
})
.catch(console.error);
