var assert = require("assert");
var path = require("path");
var fs = require("fs");
var ss = require("../../../lib/html-snapshots");

describe("html-snapshots", function() {

  describe("library", function(){
    this.timeout(10000);
    var inputFile = path.join(__dirname, "./test_robots.txt");

    it("no arguments should return false", function(){
      assert.equal(false, ss.run());
    });

    it("invalid source should return false", function(){
      assert.equal(false, ss.run({ source: "./bogus/file.txt" }));
    });

    it("should clean the output directory when specified", function(){
      var dir = path.join(__dirname, "./tmpdir");
      var file = path.join(dir, "somefile.txt");
      fs.mkdirSync(dir);
      fs.writeFileSync(file, "some data");
      assert.equal(true, fs.existsSync(dir));
      var result = ss.run({ source: "./bogus/file.txt", outputDir: dir, outputDirClean: true });
      assert.equal(true, (fs.existsSync(dir) || fs.existsSync(file))===false && result===false);
    });

    it("snapshot script should exist", function(){
      var options = { source: "./bogus/file.txt" };
      var result = ss.run(options);
      assert.equal(true, fs.existsSync(options.snapshotScript) && result===false);
    });

    // environment dependent, also depends on inputFile
    it("real run", function(){
      var options = {
        source: inputFile,
        hostname: "northstar.local",
        selector: "#dynamic-content",
        outputDir: path.join(__dirname, "./tmp/snapshots"),
        outputDirClean: true
      };
      var result = ss.run(options);
      assert.equal(true, result);
    });
  });

});