
var ss = require("../../../lib/html-snapshots");
var result = ss.run({
  //input: "robots",
  source: "http://enigmatic-refuge-9006.herokuapp.com/robots.txt",
  hostname: "enigmatic-refuge-9006.herokuapp.com",
  outputDirClean: true,
  outputDir: "./tmp/snapshots",
  selector: ".page-content",
  processLimit: 1,
  timeout: 12000
});
