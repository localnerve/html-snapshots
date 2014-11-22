var path = require("path");
var ss = require("../../../lib/html-snapshots");
var result = ss.run({
  source: "http://google.com/robots.txt",
  hostname: "google.com",
  outputDirClean: true,
  outputDir: path.join(__dirname, "./tmp/google"),
  selector: "body",
  processLimit: 6,
  timeout: 12000
});
