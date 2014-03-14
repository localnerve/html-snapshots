// to be run in node manually

// start the wpspa server first...

var ss = require("../../../lib/html-snapshots");
var result = ss.run({
  input: "array",
  source: ["http://localhost:9001/", "http://localhost:9001/sample-page", "http://localhost:9001/page-two"],
  port: 9001,
  outputDirClean: true,
  outputDir: "./tmp/snapshots",
  selector: {
    "http://localhost:9001/": "#content .multiple-posts",
    "__default": "#content .grid-row"
  },
  timeout: 10000
}, function(err, results) {
  console.log("err = "+err);
  console.log("snapshots = "+results);
  console.log("result = "+result);
});
console.log("first result = "+result);