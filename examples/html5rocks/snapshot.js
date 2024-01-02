/*
 * Snapshot multiple pages using arrays.
 * Copyright (c) 2013 - 2024, Alex Grant, LocalNerve, contributors
 *
 * Use an array to snapshot specific urls.
 * Use per-page selectors.
 * Use per-page output paths.
 * Remove all script tags from output.
 * Use javascript arrays.
 */
const path = require("path");
const util = require("util");
const htmlSnapshots = require("html-snapshots");

// a data structure with snapshot input
const sites = [
  {
    label: "web.dev",
    url: "https://web.dev",
    selector: "web-subscribe .wrapper"
  },
  {
    label: "updates.html5rocks",
    url: "https://developer.chrome.com/blog/",
    selector: ".blog-grid"
  }
];

htmlSnapshots.run({
  // input source is the array of urls to snapshot
  input: "array",
  source: sites.map(site => site.url),

  // setup and manage the output
  outputDir: path.join(__dirname, "./tmp"),
  outputDirClean: true,

  // per url output paths, { url: outputpath [, url: outputpath] }
  outputPath: sites.reduce((prev, curr) => {
    prev[curr.url] = curr.label; // use the label to differentiate '/index.html' from both sites
    return prev;
  }, {}),

  // per url selectors, { url: selector [, url: selector] }
  selector: sites.reduce((prev, curr) => {
    prev[curr.url] = curr.selector;
    return prev;
  }, {}),

  // remove all script tags from the output
  snapshotScript: {
    script: "removeScripts"
  }
})
.then(completed => {
  console.log("completed snapshots:");
  console.log(util.inspect(completed));
})
.catch(console.error);
