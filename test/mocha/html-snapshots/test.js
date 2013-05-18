var assert = require("assert");
var path = require("path");
var fs = require("fs");
var ss = require("../../../lib/html-snapshots");
var server = require("../../server");
var port = 8034;

describe("html-snapshots", function() {

  describe("library", function(){
    this.timeout(30000);
    var inputFile = path.join(__dirname, "./test_robots.txt");

    /**
     * Utility to recursively delete a folder
     */
    function deleteFolderRecursive(p) {
      if(fs.existsSync(p)) {
        fs.readdirSync(p).forEach(function(file,index){
          var curPath = path.join(p,"/" + file);
          if(fs.statSync(curPath).isDirectory()) { // recurse
            deleteFolderRecursive(curPath);
          } else { // delete file
            fs.unlinkSync(curPath);
          }
        });
        fs.rmdirSync(p);
      }
    }

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

    var urls = 3;
    // environment dependent, also depends on inputFile and server files
    it("real run, local robots file, local webserver", function(done){
      var counter = { count: 0 };
      var ourport = port; // first one
      server.start(path.join(__dirname, "./server"), ourport, (function(counter){
        return function() {
          counter.count++;
          if (counter.count===urls) {
            done();
          }
        };
      })(counter));
      var options = {
        source: inputFile,
        hostname: "localhost",
        port: ourport,
        selector: "#dynamic-content",
        outputDir: path.join(__dirname, "./tmp/snapshots"),
        outputDirClean: true
      };
      var result = ss.run(options);
      assert.equal(true, result);
    });

    it("run async, all snapshots should succeed, no output dir pre-exists", function(done){
      deleteFolderRecursive(path.join(__dirname, "./tmp/snapshots"));
      var ourport = ++port;
      server.start(path.join(__dirname, "./server"), ourport);
      var options = {
        source: inputFile,
        hostname: "localhost",
        port: ourport,
        selector: "#dynamic-content",
        outputDir: path.join(__dirname, "./tmp/snapshots"),
        outputDirClean: true
      };
      var result = ss.run(options, done);
      assert.equal(true, result);
    });

    it("run async, all snapshots should succeed, output dir does pre-exist", function(done){
      var ourport = ++port;
      server.start(path.join(__dirname, "./server"), ourport);
      var options = {
        source: inputFile,
        hostname: "localhost",
        port: ourport,
        selector: "#dynamic-content",
        outputDir: path.join(__dirname, "./tmp/snapshots"),
        outputDirClean: true
      };
      var result = ss.run(options, done);
      assert.equal(true, result);
    });

/*
    it("run asnyc, all snapshots should fail", function(done){
      var ourport = ++port;
      server.start(path.join(__dirname, "./server"), ourport);
      var options = {
        source: inputFile,
        hostname: "localhost",
        port: ourport,
        selector: "#dynamic-content-notexist",
        outputDir: path.join(__dirname, "./tmp/snapshots"),
        outputDirClean: true
      };
      var result = ss.run(options, function(nonerr) {
        assert.equal(false, nonerr);
        setTimeout(done, 500);
      });
      assert.equal(true, result);
    });
*/
    it("run async, one snapshot should fail", function(done){
        var ourport = ++port;
        server.start(path.join(__dirname, "./server"), ourport);
        var options = {
          source: inputFile,
          hostname: "localhost",
          port: ourport,
          selector: { "__default": "#dynamic-content", "/": "#dynamic-content-notexist" },
          outputDir: path.join(__dirname, "./tmp/snapshots"),
          outputDirClean: true
        };
        var result = ss.run(options, function(nonerr) {
          assert.equal(false, nonerr);
          setTimeout(done, 500);
        });
        assert.equal(true, result);
    });

  });
});