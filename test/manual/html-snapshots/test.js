#!/usr/bin/env node

var ss = require("../../../lib/html-snapshots");
var result = ss.run({
  //input: "robots",
  source: "http://ns1.localnerve.com/robots.txt",
  protocol: "http",
  hostname: "ns1.localnerve.com",
  outputDirClean: true,
  outputDir: "./tmp/snapshots",
  selector: function(url) { return "#dynamic-content"; },
  processLimit: 1
});
