var ss = require("../../../lib/html-snapshots");
var result = ss.run({
  source: "http://wpspa-transitional.herokuapp.com/robots.txt",
  hostname: "wpspa-transitional.herokuapp.com",
  outputDirClean: true,
  outputDir: "./tmp/snapshots",
  selector: "#contact-form",
  processLimit: 4,
  timeout: 12000
});
