
var ss = require("../../../lib/html-snapshots");
var result = ss.run({
  input: "sitemap",
  source: "http://ns1.localnerve.com/sitemap.xml",
  sitemapPolicy: true,
  protocol: "http",
  outputDirClean: true,
  outputDir: "./tmp/snapshots",
  selector: "#dynamic-content"
}, function(err, results) {
  console.log("err = "+err);
  console.log("results = "+results);
});