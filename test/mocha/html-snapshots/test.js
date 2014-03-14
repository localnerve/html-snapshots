var assert = require("assert");
var path = require("path");
var fs = require("fs");
var spawn = require('child_process').spawn;
var rimraf = require("rimraf").sync;
var ss = require("../../../lib/html-snapshots");
var optHelp = require("../../helpers/options");
var server = require("../../server");
var port = 8034;

describe("html-snapshots", function() {

  describe("library", function(){
    this.timeout(30000);

    var inputFile = path.join(__dirname, "./test_robots.txt");
    var spawnedProcessPattern = "^phantomjs$";
    var urls = 3; // must match test_robots.txt

    // Count actual phantomjs processes in play, requires pgrep
    function countSpawnedProcesses(cb) {
      var pgrep = spawn("pgrep", [spawnedProcessPattern, "-c"]);
      pgrep.stdout.on("data", cb);
    }

    // Clear any lingering phantomjs processes in play
    function killSpawnedProcesses(cb) {
      var pkill = spawn("pkill", [spawnedProcessPattern]);
      pkill.on("exit", cb);
    }

    it("no arguments should return false", function(){
      assert.equal(false, ss.run(optHelp.decorate({})));
    });

    it("invalid source should return false", function(){
      assert.equal(false, ss.run(optHelp.decorate({ source: "./bogus/file.txt" })));
    });

    it("should clean the output directory when specified", function(){
      var dir = path.join(__dirname, "./tmpdir");
      var file = path.join(dir, "somefile.txt");
      if (!fs.existsSync(dir))
        fs.mkdirSync(dir);
      fs.writeFileSync(file, "some data");
      assert.equal(true, fs.existsSync(dir));
      var result = ss.run(optHelp.decorate({ source: "./bogus/file.txt", outputDir: dir, outputDirClean: true }));
      assert.equal(true, (fs.existsSync(dir) || fs.existsSync(file))===false && result===false);
    });

    it("snapshot script should exist", function(){
      var options = { source: "./bogus/file.txt" };
      var result = ss.run(optHelp.decorate(options));
      assert.equal(true, fs.existsSync(options.snapshotScript) && result===false);
    });
    
    // environment dependent, also depends on inputFile and server files
    it("run sync, local robots file, local webserver", function(done){
      var counter = { count: 0 };
      var ourport = port; // first one
      server.start(path.join(__dirname, "./server"), ourport, (function(counter){
        return function() {
          counter.count++;
          if (counter.count===urls) {
            setTimeout(done, 10000);
          }
        };
      })(counter));
      var options = {
        source: inputFile,
        hostname: "localhost",
        port: ourport,
        selector: "#dynamic-content",
        outputDir: path.join(__dirname, "./tmp/sync/snapshots"),
        outputDirClean: true
      };
      var result = ss.run(optHelp.decorate(options));
      assert.equal(true, result);
    });

    it("run async, all snapshots should succeed, no output dir pre-exists", function(done){
      rimraf(path.join(__dirname, "./tmp/snapshots"));
      var ourport = ++port;
      server.start(path.join(__dirname, "./server"), ourport);
      var options = {
        source: inputFile,
        hostname: "localhost",
        port: ourport,
        selector: "#dynamic-content",
        outputDir: path.join(__dirname, "./tmp/snapshots"),
        outputDirClean: true,
        timeout: 6000
      };
      var result = ss.run(optHelp.decorate(options), function(err) {
        setTimeout(done, 2000, err); // settle down
      });
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
      var result = ss.run(optHelp.decorate(options), function(err) {
        setTimeout(done, 500, err); // settle down
      });
      assert.equal(true, result);
    });

    it("run async, all snapshots should succeed, bad remote sitemap", function(done){
      var ourport = ++port;
      server.start(path.join(__dirname, "./server"), ourport);
      var options = {
        input: "sitemap",
        source: "http://localhost:"+ourport+"/index.html",
        port: ourport,
        selector: "#dynamic-content",
        outputDir: path.join(__dirname, "./tmp/snapshots"),
        outputDirClean: true,
        timeout: 6000
      };
      var result = ss.run(optHelp.decorate(options), function(err) {
        // here is where the error should be
        assert.notStrictEqual(typeof err, "undefined");
        setTimeout(done, 500); // settle down
      });
      assert.equal(true, result); // run returns true because it isn't discovered until later
    });

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
      var result = ss.run(optHelp.decorate(options), function(err) {
        assert.notStrictEqual(typeof err, "undefined");
        setTimeout(done, 1000); // settle down
      });
      assert.equal(true, result);
    });

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
        var result = ss.run(optHelp.decorate(options), function(err) {
          assert.notStrictEqual(typeof err, "undefined");
          setTimeout(done, 1000); // settle down
        });
        assert.equal(true, result);
    });

    it("run async, should limit process as expected", function(done) {
      var processLimit = urls - 1;
      var pollDone = false;
      var pollInterval = 500;
      var phantomCount = 0;

      var ourport = ++port;
      server.start(path.join(__dirname, "./server"), ourport);

      rimraf(path.join(__dirname, "./tmp/snapshots"));

      killSpawnedProcesses(function() {
        
        var options = {
          source: inputFile,
          hostname: "localhost",
          port: ourport,
          selector: "#dynamic-content",
          outputDir: path.join(__dirname, "./tmp/snapshots"),
          outputDirClean: true,
          timeout: 6000,
          processLimit: processLimit
        };
        var result = ss.run(optHelp.decorate(options), function(err) {
          done(phantomCount ?
            new Error(phantomCount+" exceeded processLimit "+processLimit) :
            undefined
          );
          pollDone = true;
        });
        assert.equal(true, result);

        if (process.platform === "win32") {
          console.error("Skipping posix compliant tests for processLimit");
        } else {

          var timer = setInterval(function() {
            if (pollDone) {
              clearInterval(timer);
            } else {
              countSpawnedProcesses(function(count) {
                //console.log("@@@ DEBUG @@@ phantom count: "+count);
                if (count > processLimit) {
                  phantomCount = count;
                  clearInterval(timer);
                }
              });
            }
          }, pollInterval);
        }
      });
    });

    it("run async, should limit process to just one process", function(done) {
      var processLimit = 1;
      var pollDone = false;
      var pollInterval = 500;
      var phantomCount = 0;

      var ourport = ++port;
      server.start(path.join(__dirname, "./server"), ourport);

      rimraf(path.join(__dirname, "./tmp/snapshots"));

      killSpawnedProcesses(function() {
        
        var options = {
          source: inputFile,
          hostname: "localhost",
          port: ourport,
          selector: "#dynamic-content",
          outputDir: path.join(__dirname, "./tmp/snapshots"),
          outputDirClean: true,
          timeout: 6000,
          processLimit: processLimit
        };
        var result = ss.run(optHelp.decorate(options), function(err) {
          done(phantomCount ?
            new Error(phantomCount+" exceeded processLimit "+processLimit) :
            undefined
          );
          pollDone = true;
        });
        assert.equal(true, result);

        if (process.platform === "win32") {
          console.error("Skipping posix compliant tests for processLimit");
        } else {

          var timer = setInterval(function() {
            if (pollDone) {
              clearInterval(timer);
            } else {
              countSpawnedProcesses(function(count) {
                //console.log("@@@ DEBUG @@@ phantom count: "+count);
                if (count > processLimit) {
                  phantomCount = count;
                  clearInterval(timer);
                }
              });
            }
          }, pollInterval);
        }
      });
    });
    
  });
});