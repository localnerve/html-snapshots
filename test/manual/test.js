#!/usr/bin/env node

var ss = require("../../lib/html-snapshots");
var result = ss.run({
  //inputGenerator: "robots",
  inputFile: "./ro.txt",
  //protocol: "http",
  hostname: "northstar.local",
  snapshotDirClean: true,
  snapshotDir: "./tmp/snapshots",
  selector: function(url) { return "#dynamic-content"; }//,
  //timeout: function(url) { return 5000; },
  //selector: "#dynamic-content",
  //timeout: 5000,
  //checkInterval: 250,
  //snapshotScript: "../lib/phantom/snapshotSingle.js",
  //phantomjs: "phantomjs",
  //waitForAll: 110000
});

console.log("END");
console.log("results = "+result);
return result;