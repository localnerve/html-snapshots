#!/usr/bin/env node

var ss = require("../../../../lib/html-snapshots");
var result = ss.run({
  source: "http://www.google.de/robots.txt",
  protocol: "https",
  hostname: "www.google.de",
  outputDirClean: true,
  outputDir: "./snapshots",
  snapshotScript: "./mysnapshotscript.js"
});
