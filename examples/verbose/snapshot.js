/*
 * Snapshot an example website.
 * Copyright (c) 2013 - 2022, Alex Grant, LocalNerve, contributors
 *
 * Use sitemap.xml to snapshot an entire site.
 * Use the verbose option to debug the loading of one of the pages.
 */
const htmlSnapshots = require("html-snapshots");

const origin = "https://www.sitemaps.org";
const pageToDebug = `${origin}/en_GB/`;

// Make the verbose option as an object keyed with the page to debug.
const verboseOption = {
  __default: false,
  [pageToDebug]: true
};

htmlSnapshots.run({
  input: "sitemap",
  source: `${origin}/sitemap.xml`,
  outputDir: require("path").join(__dirname, "./tmp"),
  outputDirClean: true,
  selector: "#mainContent",
  timeout: 10000,
  processLimit: 1, // to clarify output
  verbose: verboseOption
})
.then(completed => {
  console.log("completed snapshots:");
  console.log(require("util").inspect(completed));
})
.catch(console.error);
