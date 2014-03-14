var path = require("path");

var ss = require("../../../lib/html-snapshots");
var result = ss.run({
  source: "http://ns1.localnerve.com/robots.txt",
  hostname: "ns1.localnerve.com",
  outputDirClean: true,
  outputDir: path.join(__dirname, "./tmp/snapshots"),
/*  outputPath: {
    "http://northstar.local/services/faq?arg=one": "services/faq/arg/one"
  },*/
  selector: "#dynamic-content"
}, function(err, results) {
	console.log("err = "+err);
  console.log("snapshots = "+results);
  console.log("result = "+result);
});
console.log("first result = "+result);