#!/usr/bin/env node

var path = require("path");
var ss = require("../../../lib/html-snapshots");
var result = ss.run({
  source: path.join(__dirname, "robots.txt"),
  hostname: "test.local",
  outputDirClean: true,
  outputDir: path.join(__dirname, "./tmp/snapshots"),
  selector: "#contact-form",
  timeout: 5000,
  processLimit: 2,  
  //snapshotScript: path.join(__dirname, "../../../lib/phantom/removeScripts.js")
  snapshotScript: {
    script: "customFilter",
    module: path.join(__dirname, "myFilter.js")
  }
});
