#!/usr/bin/env node

var path = require("path");

var ss = require("../../../lib/html-snapshots");
var result = ss.run({
  input: "sitemap",
  source: path.join(__dirname, "sitemap.xml"),
  hostname: "northstar.local",
  outputDirClean: true,
  outputDir: path.join(__dirname, "./tmp/snapshots"),
  outputPath: {
    "http://northstar.local/services/faq?arg=one": "services/faq/arg/one"
  },
  selector: "#dynamic-content"
}, function(nonError) {
	console.log("got called back with: "+nonError);
});
