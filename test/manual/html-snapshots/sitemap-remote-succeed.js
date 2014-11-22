var path = require("path");
var ss = require("../../../lib/html-snapshots");
var result = ss.run({
  input: "sitemap",
  source: "http://wpspa-transitional.herokuapp.com/sitemap.xml",
  sitemapPolicy: true,
  protocol: "http",
  outputDirClean: true,
  outputDir: path.join(__dirname, "./tmp/snapshots"),
  selector: "#contact-form",
  processLimit: 4,
  timeout: 20000
}, function(err, results) {
  console.log("err = "+err);
  console.log("results = "+results);
});

console.log("first result = "+result);