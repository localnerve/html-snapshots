#!/usr/bin/env node

var ss = require("../../../lib/html-snapshots");
var result = ss.run({
  input: "sitemap",
  source: "http://ntrsctn.com/sitemap.xml",
  outputDirClean: true,
  outputDir: "./tmp/snapshots",
  selector: "body[data-status=ready]",
  timeout: 25000
});
