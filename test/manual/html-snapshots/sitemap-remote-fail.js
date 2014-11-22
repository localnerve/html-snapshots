var path = require("path");
var ss = require("../../../lib/html-snapshots");
var result = ss.run({
  input: "sitemap",
  source: "http://wpspa-transitional.herokuapp.com/sitemap-test-not.xml",
  sitemapPolicy: true,
  outputDirClean: true,
  outputDir: path.join(__dirname, "./tmp/snapshots"),
  selector: "#contact-form",
  processLimit: 4,
  timeout: 10000
}, function(err, results) {
  console.log("err = "+err);
  console.log("results = "+results);
});

console.log("first result = "+result);