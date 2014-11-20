var ss = require("../../../lib/html-snapshots");
var result = ss.run({
  source: "http://www.localnerve.com/robots.txt",
  hostname: "www.localnerve.com",
  outputDirClean: true,
  outputDir: "./tmp/snapshots",
  selector: "body",
  processLimit: 4,
  timeout: 8000
});
