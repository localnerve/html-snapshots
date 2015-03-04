/* global describe, it, before */
var assert = require("assert");
var path = require("path");
var fs = require("fs");
var spawn = require('child_process').spawn;
var rimraf = require("rimraf").sync;
var ss = require("../../../lib/html-snapshots");
var optHelp = require("../../helpers/options");
var resHelp = require("../../helpers/result");
var server = require("../../server");
var port = 8034;

describe("html-snapshots", function() {

  var inputFile = path.join(__dirname, "./test_robots.txt");
  var spawnedProcessPattern = "^phantomjs$";
  var urls = 3; // must match test_robots.txt
  var bogusFile = "./bogus/file.txt";

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

  function cleanup(done, arg) {
    if (process.platform === "win32") {
      setTimeout(done, 3000, arg);
    } else {
      killSpawnedProcesses(function() {
        done(arg);
      });
    }
  }

  describe("library", function() {
    this.timeout(30000);

    before(function() {
      server.start(path.join(__dirname, "./server"), port);
    });

    describe("sync runs", function() {

      it("no arguments should return false", function(done) {
        assert.equal(false, ss.run(optHelp.decorate({})));
        cleanup(done);
      });

      it("invalid source should return false", function(done) {
        assert.equal(false, ss.run(optHelp.decorate({ source: bogusFile })));
        cleanup(done);
      });

      it("should clean the output directory when specified", function(done) {
        var dir = path.join(__dirname, "./tmpdir");
        var file = path.join(dir, "somefile.txt");
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir);
        }
        fs.writeFileSync(file, "some data");
        assert.equal(true, fs.existsSync(dir));
        var result = ss.run(optHelp.decorate({ source: bogusFile, outputDir: dir, outputDirClean: true }));
        assert.equal(true, (fs.existsSync(dir) || fs.existsSync(file))===false && result===false);
        cleanup(done);
      });

      it("default snapshot script should exist", function(done) {
        var options = { source: "./bogus/file.txt" };
        var result = ss.run(optHelp.decorate(options));
        assert.equal(true, fs.existsSync(options.snapshotScript) && result===false);
        cleanup(done);
      });
    });

    describe("async runs", function() {

      it("should all fail with bad phantomjs process to spawn", function(done) {
        var options = {
          source: inputFile,
          hostname: "localhost",
          port: port,
          selector: "#dynamic-content",
          outputDir: path.join(__dirname, "./tmp/sync/snapshots"),
          outputDirClean: true,
          phantomjs: bogusFile,
          timeout: 1000
        };
        var result = ss.run(options, function(err, snapshots) {
          // here is where the error should be
          resHelp.mustBeError(err);
          cleanup(done);
        });
        assert.equal(true, result);
      });

      it("should all succeed, no output dir pre-exists", function(done) {
        rimraf(path.join(__dirname, "./tmp/snapshots"));
        var options = {
          source: inputFile,
          hostname: "localhost",
          port: port,
          selector: "#dynamic-content",
          outputDir: path.join(__dirname, "./tmp/snapshots"),
          outputDirClean: true,
          timeout: 6000
        };
        var result = ss.run(optHelp.decorate(options), function(err) {
          cleanup(done, err);
        });
        assert.equal(true, result);
      });

      it("should all succeed, output dir does pre-exist", function(done) {
        var options = {
          source: inputFile,
          hostname: "localhost",
          port: port,
          selector: "#dynamic-content",
          outputDir: path.join(__dirname, "./tmp/snapshots"),
          outputDirClean: true,
          timeout: 6000
        };
        var result = ss.run(optHelp.decorate(options), function(err) {
          cleanup(done, err);
        });
        assert.equal(true, result);
      });

      it("should all fail, bad remote sitemap", function(done) {
        var options = {
          input: "sitemap",
          source: "http://localhost:"+port+"/index.html",
          port: port,
          selector: "#dynamic-content",
          outputDir: path.join(__dirname, "./tmp/snapshots"),
          outputDirClean: true,
          timeout: 6000
        };
        var result = ss.run(optHelp.decorate(options), function(err) {
          // here is where the error should be
          resHelp.mustBeError(err);
          cleanup(done);
        });
        assert.equal(true, result); // run returns true because it isn't discovered until later
      });

      it("should all fail, bad remote robots", function(done) {
        var options = {
          input: "robots",
          source: "http://localhost:"+port+"/index.html",
          port: port,
          selector: "#dynamic-content",
          outputDir: path.join(__dirname, "./tmp/snapshots"),
          outputDirClean: true,
          timeout: 6000
        };
        var result = ss.run(optHelp.decorate(options), function(err) {
          // here is where the error should be
          resHelp.mustBeError(err);
          cleanup(done);
        });
        assert.equal(true, result); // run returns true because it isn't discovered until later
      });

      it("should all fail, non-existent selector", function(done) {
        var options = {
          source: inputFile,
          hostname: "localhost",
          port: port,
          selector: "#dynamic-content-notexist",
          outputDir: path.join(__dirname, "./tmp/snapshots"),
          outputDirClean: true,
          timeout: 6000
        };
        var result = ss.run(optHelp.decorate(options), function(err) {
          resHelp.mustBeError(err);
          cleanup(done);
        });
        assert.equal(true, result);
      });

      it("should fail one snapshot, one non-existent selector", function(done) {
          var options = {
            source: inputFile,
            hostname: "localhost",
            port: port,
            selector: { "__default": "#dynamic-content", "/": "#dynamic-content-notexist" },
            outputDir: path.join(__dirname, "./tmp/snapshots"),
            outputDirClean: true,
            timeout: 6000
          };
          var result = ss.run(optHelp.decorate(options), function(err) {
            resHelp.mustBeError(err);
            cleanup(done);
          });
          assert.equal(true, result);
      });

      it("should limit process as expected", function(done) {
        if (process.platform === "win32") {
          assert.ok(true, "Skipping posix compliant tests for processLimit");
          done();
        } else {
          var processLimit = urls - 1;
          var pollDone = false;
          var pollInterval = 500;
          var phantomCount = 0;

          rimraf(path.join(__dirname, "./tmp/snapshots"));

          killSpawnedProcesses(function() {
            var options = {
              source: inputFile,
              hostname: "localhost",
              port: port,
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
          });
        }
      });

      it("should limit process to just one process", function(done) {
        if (process.platform === "win32") {
          assert.ok(true, "Skipping posix compliant tests for processLimit");
          done();
        } else {        
          var processLimit = 1;
          var pollDone = false;
          var pollInterval = 500;
          var phantomCount = 0;

          rimraf(path.join(__dirname, "./tmp/snapshots"));

          killSpawnedProcesses(function() {
            var options = {
              source: inputFile,
              hostname: "localhost",
              port: port,
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
          });
        }
      });
    });  

    describe("useJQuery option behaviors", function() {

      var subdir = "useJQuery";

      it("should fail if useJQuery is true and no jQuery loads in target page", function(done) {
          var options = {
            input: "array",
            source: [ "http://localhost:"+port+"/nojq" ],
            selector: "#pocs1",
            outputDir: path.join(__dirname, "./tmp/"+subdir),
            outputDirClean: true,
            timeout: 5000,
            useJQuery: true
          };
          var result = ss.run(optHelp.decorate(options), function(err) {
            resHelp.mustBeError(err);
            cleanup(done);
          });
          assert.equal(true, result);
      });

      it("should fail if useJQuery is false, no jQuery loads in page, BUT the element is not visible", function(done){
          var options = {
            input: "array",
            source: [ "http://localhost:"+port+"/nojq" ],
            selector: ".nojq-notvisible",
            outputDir: path.join(__dirname, "./tmp/"+subdir),
            outputDirClean: true,
            timeout: 5000,
            useJQuery: true
          };
          var result = ss.run(optHelp.decorate(options), function(err) {
            resHelp.mustBeError(err);
            cleanup(done);
          });
          assert.equal(true, result);
      });

      it("should succeed if useJQuery=false, jQuery NOT loaded, dynamic element", function(done) {
          var outputDir = path.join(__dirname, "./tmp/"+subdir);

          var options = {
            input: "array",
            source: [ "http://localhost:"+port+"/nojq" ],
            selector: ".nojq-dynamic", // nojq-dynamic is created onload
            //selector: "#pocs1",
            outputDir: outputDir,
            outputDirClean: true,
            timeout: 5000,
            useJQuery: false
          };
          var result = ss.run(optHelp.decorate(options), function(err, completed) {
            assert.ifError(err);
            assert.equal(completed.length, 1);
            assert.equal(completed[0], outputDir+"/nojq/index.html");
            cleanup(done, err);
          });
          assert.equal(true, result);
      });

      it("should succeed if useJQuery=true, jQuery loaded", function(done) {
          var outputDir = path.join(__dirname, "./tmp/snapshots");

          var options = {
            input: "array",
            source: [ "http://localhost:"+port+"/" ],
            selector: "#dynamic-content",
            outputDir: outputDir,
            outputDirClean: true,
            timeout: 5000,
            useJQuery: true
          };
          var result = ss.run(optHelp.decorate(options), function(err, completed) {
            //console.log("completed:\n"+require("util").inspect(completed));
            assert.ifError(err);
            assert.equal(completed.length, 1);
            assert.equal(completed[0], outputDir+"/index.html");
            cleanup(done);
          });
          assert.equal(true, result);
      });

      // most of these tests use useJQuery false and jQuery loads in target page, so not testing that combo
      // that should always succeed as long as the selector is not dependent on jQuery.
    });

    describe("phantomjsOptions behaviors", function() {

      it("should work with one string option", function(done) {
        var outputBase = path.join(__dirname, "./tmp/");
        var cookiesFile = path.join(outputBase, "cookies.txt");
        var outputDir = path.join(outputBase, "snapshots");

        rimraf(outputBase);

        var options = {
          input: "array",
          source: [ "http://localhost:"+port+"/pjsopts" ],
          outputDir: outputDir,
          outputDirClean: false,
          selector: ".content-complete",
          timeout: 5000,
          phantomjsOptions: "--cookies-file="+cookiesFile
        };
        var result = ss.run(optHelp.decorate(options), function(err, completed) {
          assert.ifError(err);
          assert.equal(true, fs.existsSync(cookiesFile), "cookie file in phantomjsOptions not found");
          cleanup(done);
        });
        assert.equal(true, result);
      });

      it("should work with multiple options, test one", function(done) {
        var outputBase = path.join(__dirname, "./tmp/");
        var cookiesFile = path.join(outputBase, "cookies.txt");
        var outputDir = path.join(outputBase, "snapshots");

        rimraf(outputBase);

        var options = {
          input: "array",
          source: [ "http://localhost:"+port+"/pjsopts" ],
          outputDir: outputDir,
          outputDirClean: false,
          selector: "#inline-image",
          timeout: 5000,
          phantomjsOptions: [
            "--cookies-file="+cookiesFile,
            "--load-images=true"
          ]
        };
        var result = ss.run(optHelp.decorate(options), function(err, completed) {
          assert.ifError(err);
          assert.equal(true, fs.existsSync(cookiesFile), "cookie file in phantomjsOptions not found");          
          cleanup(done);
        });
        assert.equal(true, result);
      });

      it("should work with multiple options, test two", function(done) {
        var outputBase = path.join(__dirname, "./tmp/");
        var cookiesFile = path.join(outputBase, "cookies.txt");
        var outputDir = path.join(outputBase, "snapshots");

        rimraf(outputBase);

        var options = {
          input: "array",
          source: [ "http://localhost:"+port+"/pjsopts" ],
          outputDir: outputDir,
          outputDirClean: false,
          selector: "#inline-image",
          timeout: 5000,
          phantomjsOptions: [
            "--cookies-file="+cookiesFile,
            "--load-images=false"
          ]
        };
        var result = ss.run(optHelp.decorate(options), function(err, completed) {
          resHelp.mustBeError(err);
          assert.equal(true, fs.existsSync(cookiesFile), "cookie file in phantomjsOptions not found");          
          cleanup(done);
        });
        assert.equal(true, result);
      });

      // most of these tests use no options, so not testing that again here
    });

    describe("additional snapshot scripts", function() {

      var snapshotScriptTests = [
        {
          name: "removeScripts",
          option: {
            script: "removeScripts"
          },
          prove: function(completed, done) {
            var content, err;
            for (var i = 0; i < completed.length; i++) {
              content = fs.readFileSync(completed[i], { encoding: "utf8" });
              if (/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi.test(content)) {
                err = "removeScripts failed. Script tag found in "+completed[i];
                break;
              }
            }
            done(err);
          }
        },
        {
          name: "customFilter",
          option: {
            script: "customFilter",
            module: path.join(__dirname, "myFilter.js")
          },
          prove: function(completed, done) {
            var content, err;
            for (var i = 0; i < completed.length; i++) {
              content = fs.readFileSync(completed[i], { encoding: "utf8" });
              // this is dependent on myFilter.js adding someattrZZQy anywhere
              if (content.indexOf("someattrZZQy") < 0) {
                err = "customFilter snapshotScript failed. Special sequence not found in "+completed[i];
                break;
              }
            }
            done(err);
          }
        }
      ];

      it("should fail if a bogus script string is supplied", function(done) {
        var options = {
          source: inputFile,
          hostname: "localhost",
          port: port,
          selector: "#dynamic-content",          
          outputDir: path.join(__dirname, "./tmp/snapshots"),
          outputDirClean: true,
          snapshotScript: bogusFile,
          timeout: 2000
        };
        var result = ss.run(optHelp.decorate(options), function(err) {
          resHelp.mustBeError(err);
          cleanup(done);
        });
        assert.equal(true, result); // run returns true because it isn't discovered until later
      });

      it("should fail if a bogus script object is supplied", function(done) {
        var options = {
          source: inputFile,
          hostname: "localhost",
          port: port,
          selector: "#dynamic-content",          
          outputDir: path.join(__dirname, "./tmp/snapshots"),
          outputDirClean: true,
          snapshotScript: {
            script: bogusFile
          },
          timeout: 2000
        };
        var result = ss.run(optHelp.decorate(options), function(err) {
          resHelp.mustBeError(err);
          cleanup(done);
        });
        assert.equal(true, result); // run returns true because it isn't discovered until later
      });

      it("should fail if a customFilter is defined but no module", function(done) {
        var options = {
          source: inputFile,
          hostname: "localhost",
          port: port,
          selector: "#dynamic-content",          
          outputDir: path.join(__dirname, "./tmp/snapshots"),
          outputDirClean: true,
          snapshotScript: {
            script: "customFilter"
          },
          timeout: 2000
        };
        var result = ss.run(optHelp.decorate(options), function(err) {
          resHelp.mustBeError(err);
          cleanup(done);
        });
        assert.equal(true, result); // run returns true because it isn't discovered until later
      });

      it("should fail if a customFilter is defined and bogus module", function(done) {
        var options = {
          source: inputFile,
          hostname: "localhost",
          port: port,
          selector: "#dynamic-content",          
          outputDir: path.join(__dirname, "./tmp/snapshots"),
          outputDirClean: true,
          snapshotScript: {
            script: "customFilter",
            module: bogusFile
          },
          timeout: 2000
        };
        var result = ss.run(optHelp.decorate(options), function(err) {
          resHelp.mustBeError(err);
          cleanup(done);
        });
        assert.equal(true, result); // run returns true because it isn't discovered until later
      });

      snapshotScriptTests.forEach(function(snapshotScriptTest) {
        it("should succeed for snapshot script "+snapshotScriptTest.name, function(done) {          
          var result,
          outputDir = path.join(__dirname, "./tmp/snapshots"),
          options = {
            source: inputFile,
            hostname: "localhost",
            port: port,
            selector: "#dynamic-content",
            outputDir: outputDir,
            outputDirClean: true,
            snapshotScript: snapshotScriptTest.option
          };
          
          rimraf(outputDir);

          result = ss.run(optHelp.decorate(options), function(err, completed) {
            if (!err) {
              snapshotScriptTest.prove(completed, function(e) {
                cleanup(done, e);
              });
            } else {
              cleanup(done, err);
            }
          });
          assert.equal(true, result);
        });
      });

    });

  });
});