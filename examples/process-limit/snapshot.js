/*
 * Process limit snapshots example.
 * Copyright (c) 2013 - 2023, Alex Grant, LocalNerve, contributors
 *
 * Uses robots.txt to drive website snapshot.
 * Limits the number of browser processes to 1 (1 at a time).
 */
const htmlSnapshots = require("html-snapshots");

// where the snapshots go
const outputDir = require("path").join(__dirname, "./tmp");

// The hostname of the website
const hostname = "nodejs.org";

// Do it:
htmlSnapshots.run({
  source: `https://${hostname}/robots.txt`,
  hostname: hostname,
  outputDir: outputDir,
  outputDirClean: true,
  selector: "body",
  timeout: 9000,
  processLimit: 1 // no parallel fetch, one browser process at a time
})
.then(completed => {
  console.log("completed snapshots:");
  console.log(require("util").inspect(completed));
})
.catch(console.error);
