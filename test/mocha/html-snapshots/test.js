/* global describe, it, before, beforeEach */
var assert = require("assert");
var path = require("path");
var fs = require("fs");
var spawn = require('child_process').spawn;
var rimraf = require("rimraf").sync;
var _ = require("lodash");
var ss = require("../../../lib/html-snapshots");
var optHelp = require("../../helpers/options");
var resHelp = require("../../helpers/result");
var server = require("../../server");
var port = 8034;

describe("html-snapshots", function() {
  var unexpectedError = new Error("unexpected error flow");
  var inputFile = path.join(__dirname, "./test_robots.txt");
  var outputDir = path.join(__dirname, "./tmp/snapshots");
  var spawnedProcessPattern = "^phantomjs$";
  var urls = 3; // must match test_robots.txt
  var bogusFile = "./bogus/file.txt";
  var timeout = 12000;

  // Count actual phantomjs processes in play, requires pgrep
  function countSpawnedProcesses(cb) {
    var pgrep;
    // std mac pgrep doesn't have a count option. How stupid is that?
    if (process.platform === "darwin") {
      var wc = spawn("wc", ["-l"]);
      pgrep = spawn("pgrep", [spawnedProcessPattern]);
      pgrep.stdout.on("data", function (data) {
        wc.stdin.write(data);
      });
      wc.stdout.on("data", cb);
    } else {
      pgrep = spawn("pgrep", [spawnedProcessPattern, "-c"]);
      pgrep.stdout.on("data", cb);
    }
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
      setImmediate(function () {
        killSpawnedProcesses(function() {
          done(arg);
        });
      });
    }
  }

  /**
   * Verify received error and cleanup running processes.
   * @param {Function} done - The finalization callback.
   * @param {Number} count - The number of expected completed results.
   * @param {String|Object} err - The error.
   */
  function cleanupError (done, count, err, completed) {
    resHelp.mustBeError(err);
    if (completed) {
      assert.equal(count, completed.length);
    }
    assert.equal(Object.prototype.toString.call(err), "[object Error]", "error should be class Error");
    assert.notEqual(typeof err.completed, "undefined", "error.completed should be defined");
    // console.log("@@@ error", err);
    cleanup(done);
  }

  function cleanupSuccess (done, err, completed) {
    // echo for test log clarity
    // console.log('@@@ result: ' + err +', '+require('util').inspect(completed, {depth:null}));
    assert.notEqual(typeof completed, "undefined", "completed should be defined");
    cleanup(done, err);
  }

  function testSuccess (cb, completed) {
    assert.equal(Array.isArray(completed), true);
    assert.equal(completed.length > 0, true);
    cb(undefined, completed);
  }

  function unexpectedSuccess (cb) {
    var errMsg = "unexpected success";
    assert.fail("run", "succeed", errMsg, "should not");
    cleanup(cb, new Error(errMsg));
  }

  describe("library", function () {
    this.timeout(30000);

    before(function (done) {
      server.start(path.join(__dirname, "./server"), port, done);
    });

    describe("run basics", function () {
      it("no arguments should fail", function (done) {
        var twice = _.after(2, cleanupError.bind(null, done, 0));

        ss.run(optHelp.decorate({}), twice)
          .then(function () {
            assert.fail("run", "succeed", "", "should not");
          })
          .catch(twice);
      });

      it("invalid source should return false", function (done) {
        var twice = _.after(2, cleanupError.bind(null, done, 0));

        ss.run(optHelp.decorate({ source: bogusFile }), twice)
          .then(function () {
            assert.fail("run", "succeed", "", "should not");
          })
          .catch(twice);
      });

      it("should clean the output directory when specified", function (done) {
        var dir = path.join(__dirname, "./tmpdir");
        var file = path.join(dir, "somefile.txt");
        var twice = _.after(2, cleanupError.bind(null, done, 0));

        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir);
        }
        fs.writeFileSync(file, "some data");
        assert.equal(true, fs.existsSync(dir));

        ss.run(optHelp.decorate({
          source: bogusFile,
          outputDir: dir,
          outputDirClean: true
        }), twice)
          .then(function () {
            assert.fail("run", "succeed", "unexpected success", "should not");
          })
          .catch(twice);

        assert.equal(false, (fs.existsSync(dir) || fs.existsSync(file)));
      });

      it("default snapshot script should exist", function (done) {
        var options = { source: "./bogus/file.txt" };
        var twice = _.after(2, cleanupError.bind(null, done, 0));

        var result = ss.run(optHelp.decorate(options), twice);

        assert.equal(true, fs.existsSync(options.snapshotScript));

        result
          .then(function () {
            assert.fail("run", "succeed", "unexpected success", "should not");
          })
          .catch(twice);
      });
    });

    describe("async runs", function () {
      it("should all succeed, no output dir pre-exists", function (done) {
        var options = {
          source: inputFile,
          hostname: "localhost",
          port: port,
          selector: "#dynamic-content",
          outputDir: outputDir,
          outputDirClean: true,
          timeout: timeout
        };
        var twice = _.after(2, cleanupSuccess.bind(null, done));

        rimraf(outputDir);

        ss.run(optHelp.decorate(options), twice)
          .then(testSuccess.bind(null, twice))
          .catch(function (e) {
            cleanup(done, e);
          });
      });

      it("should all succeed, output dir does pre-exist", function (done) {
        var options = {
          source: inputFile,
          hostname: "localhost",
          port: port,
          selector: "#dynamic-content",
          outputDir: outputDir,
          outputDirClean: true,
          timeout: timeout
        };
        var twice = _.after(2, cleanupSuccess.bind(null, done));

        ss.run(optHelp.decorate(options), twice)
          .then(testSuccess.bind(null, twice))
          .catch(function (e) {
            cleanup(done, e);
          });
      });

      it("should all fail with bad phantomjs process to spawn",
      function (done) {
        var options = {
          source: inputFile,
          hostname: "localhost",
          port: port,
          selector: "#dynamic-content",
          outputDir: outputDir,
          outputDirClean: true,
          phantomjs: bogusFile,
          timeout: 1000
        };
        var twice = _.after(2, cleanupError.bind(null, done, 0));

        ss.run(options, twice)
          .then(unexpectedSuccess.bind(null, done))
          .catch(twice);
      });

      it("should all fail, bad remote sitemap", function (done) {
        var options = {
          input: "sitemap",
          source: "http://localhost:"+port+"/index.html",
          port: port,
          selector: "#dynamic-content",
          outputDir: outputDir,
          outputDirClean: true,
          timeout: 6000
        };
        var twice = _.after(2, cleanupError.bind(null, done, 0));

        ss.run(optHelp.decorate(options), twice)
          .then(unexpectedSuccess.bind(null, done))
          .catch(twice);
      });

      it("should all fail, bad remote robots", function (done) {
        var options = {
          input: "robots",
          source: "http://localhost:"+port+"/index.html",
          port: port,
          selector: "#dynamic-content",
          outputDir: outputDir,
          outputDirClean: true,
          timeout: 6000
        };
        var twice = _.after(2, cleanupError.bind(null, done, 0));

        ss.run(optHelp.decorate(options), twice)
          .then(unexpectedSuccess.bind(null, done))
          .catch(twice);
      });

      it("should all fail, non-existent selector", function (done) {
        var options = {
          source: inputFile,
          hostname: "localhost",
          port: port,
          selector: "#dynamic-content-notexist",
          outputDir: outputDir,
          outputDirClean: true,
          timeout: 6000
        };
        var twice = _.after(2, cleanupError.bind(null, done, 0));

        ss.run(optHelp.decorate(options), twice)
          .then(unexpectedSuccess.bind(null, done))
          .catch(twice);
      });

      it("should fail one snapshot, one non-existent selector",
      function (done) {
        var options = {
          source: inputFile,
          hostname: "localhost",
          port: port,
          selector: { "__default": "#dynamic-content", "/": "#dynamic-content-notexist" },
          outputDir: outputDir,
          outputDirClean: true,
          timeout: 6000
        };
        var twice = _.after(2, cleanupError.bind(null, done, urls - 1));

        ss.run(optHelp.decorate(options), twice)
          .then(unexpectedSuccess.bind(null, done))
          .catch(twice);
      });

      it("should limit process as expected", function (done) {
        if (process.platform === "win32") {
          assert.ok(true, "Skipping posix compliant tests for processLimit");
          done();
        } else {
          var processLimit = urls - 1;
          var pollDone = false;
          var pollInterval = 500;
          var phantomCount = 0;
          var timer;

          rimraf(outputDir);

          killSpawnedProcesses(function () {
            var options = {
              source: inputFile,
              hostname: "localhost",
              port: port,
              selector: "#dynamic-content",
              outputDir: outputDir,
              outputDirClean: true,
              timeout: timeout,
              processLimit: processLimit
            };

            ss.run(optHelp.decorate(options), function () {
              clearInterval(timer);
              cleanup(done, phantomCount ?
                new Error(phantomCount+" exceeded processLimit "+processLimit) :
                undefined
              );
              pollDone = true;
            })
              .catch(function (e) {
                if (!pollDone) {
                  cleanup(done, e || unexpectedError);
                }
              });

            timer = setInterval(function () {
              if (pollDone) {
                clearInterval(timer);
              } else {
                countSpawnedProcesses(function (count) {
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

      it("time spacer for process limit", function (done) {
        setTimeout(function () {
          cleanup(done);
        }, 3000);
      });

      it("should limit process to just one process", function (done) {
        if (process.platform === "win32") {
          assert.ok(true, "Skipping posix compliant tests for processLimit");
          done();
        } else {
          var processLimit = 1;
          var pollDone = false;
          var pollInterval = 500;
          var phantomCount = 0;
          var timer;

          rimraf(outputDir);

          killSpawnedProcesses(function () {
            var options = {
              source: inputFile,
              hostname: "localhost",
              port: port,
              selector: "#dynamic-content",
              outputDir: outputDir,
              outputDirClean: true,
              timeout: timeout,
              processLimit: processLimit
            };

            ss.run(optHelp.decorate(options), function () {
              clearInterval(timer);
              cleanup(done, phantomCount ?
                new Error(phantomCount+" exceeded processLimit "+processLimit) :
                undefined
              );
              pollDone = true;
            })
              .catch(function (e) {
                if (!pollDone) {
                  cleanup(done, e || unexpectedError);
                }
              });

            timer = setInterval(function () {
              if (pollDone) {
                clearInterval(timer);
              } else {
                countSpawnedProcesses(function (count) {
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

    describe("useJQuery option behaviors", function () {
      var subdir = "useJQuery";

      it("should fail if useJQuery is true and no jQuery loads in target page",
      function (done) {
        var options = {
          input: "array",
          source: [ "http://localhost:"+port+"/nojq" ],
          selector: "#pocs1",
          outputDir: path.join(__dirname, "./tmp/"+subdir),
          outputDirClean: true,
          timeout: 5000,
          useJQuery: true
        };
        var twice = _.after(2, cleanupError.bind(null, done, 0));

        ss.run(optHelp.decorate(options), twice)
          .then(unexpectedSuccess.bind(null, done))
          .catch(twice);
      });

      it("should fail if useJQuery is false, no jQuery loads in page, BUT the element is not visible",
      function (done) {
        var options = {
          input: "array",
          source: [ "http://localhost:"+port+"/nojq" ],
          selector: ".nojq-notvisible",
          outputDir: path.join(__dirname, "./tmp/"+subdir),
          outputDirClean: true,
          timeout: 5000,
          useJQuery: true
        };
        var twice = _.after(2, cleanupError.bind(null, done, 0));

        ss.run(optHelp.decorate(options), twice)
          .then(unexpectedSuccess.bind(null, done))
          .catch(twice);
      });

      it("should succeed if useJQuery=false, jQuery NOT loaded, dynamic element",
      function (done) {
        var outputDir = path.join(__dirname, "./tmp/"+subdir);

        var options = {
          input: "array",
          source: [ "http://localhost:"+port+"/nojq" ],
          selector: ".nojq-dynamic", // nojq-dynamic is created onload
          //selector: "#pocs1",
          outputDir: outputDir,
          outputDirClean: true,
          timeout: timeout,
          useJQuery: false
        };

        ss.run(optHelp.decorate(options), function (err, completed) {
          if (err) {
            console.log('@@@ error = '+err+", completed="+completed.join(','));
          }
        })
          .then(function (completed) {
            assert.equal(completed.length, 1);
            assert.equal(completed[0], path.join(outputDir, "nojq", "index.html"));
            cleanup(done);
          })
          .catch(function (e) {
            cleanup(done, e || unexpectedError);
          });
      });

      it("should succeed if useJQuery=true, jQuery loaded", function (done) {
        var options = {
          input: "array",
          source: [ "http://localhost:"+port+"/" ],
          selector: "#dynamic-content",
          outputDir: outputDir,
          outputDirClean: true,
          timeout: timeout,
          useJQuery: true
        };

        ss.run(optHelp.decorate(options), function (err, completed) {
          if (err) {
            console.log('@@@ error = '+err+", completed="+completed.join(','));
          }
        })
          .then(function (completed) {
            assert.equal(completed.length, 1);
            assert.equal(completed[0], path.join(outputDir, "index.html"));
            cleanup(done);
          })
          .catch(function (e) {
            cleanup(done, e || unexpectedError);
          });
      });

      // most of these tests use useJQuery false and jQuery loads in target page, so not testing that combo
      // that should always succeed as long as the selector is not dependent on jQuery.
    });

    describe("phantomjsOptions behaviors", function () {

      it("should work with one string option", function (done) {
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
          timeout: timeout,
          phantomjsOptions: "--cookies-file="+cookiesFile
        };

        ss.run(optHelp.decorate(options), function (err, completed) {
          if (err) {
            console.log('@@@ error = '+err+", completed="+completed.join(','));
          }
        })
          .then(function () {
            assert.equal(true, fs.existsSync(cookiesFile), "cookie file in phantomjsOptions not found");
            cleanup(done);
          })
          .catch(function (e) {
            cleanup(done, e || unexpectedError);
          });
      });

      it("should work with multiple options, test one", function (done) {
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
          timeout: timeout,
          phantomjsOptions: [
            "--cookies-file="+cookiesFile,
            "--load-images=true"
          ]
        };

        ss.run(optHelp.decorate(options), function (err, completed) {
          if (err) {
            console.log('@@@ error = '+err+", completed="+completed.join(','));
          }
        })
          .then(function () {
            assert.equal(true, fs.existsSync(cookiesFile), "cookie file in phantomjsOptions not found");
            cleanup(done);
          })
          .catch(function (e) {
            cleanup(done, e || unexpectedError);
          });
      });

      it("should work with multiple options, test two", function (done) {
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
          timeout: timeout,
          phantomjsOptions: [
            "--cookies-file="+cookiesFile,
            "--load-images=false"
          ]
        };

        function completionHandler (err) {
          resHelp.mustBeError(err);
          // maybe this is true, but why should this be true?
          // assert.equal(true, fs.existsSync(cookiesFile), "cookie file in phantomjsOptions not found");
        }

        ss.run(optHelp.decorate(options), completionHandler)
          .then(unexpectedSuccess.bind(null, done))
          .catch(function (e) {
            completionHandler(e);
            cleanup(done);
          });
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
          prove: function (completed, done) {
            // console.log("@@@ removeScripts prove @@@");
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
          prove: function (completed, done) {
            // console.log("@@@ customFilter prove @@@");
            var content, err;
            for (var i = 0; i < completed.length; i++) {
              // console.log("@@@ readFile "+completed[i]);
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

      it("should fail if a bogus script string is supplied", function (done) {
        var options = {
          source: inputFile,
          hostname: "localhost",
          port: port,
          selector: "#dynamic-content",
          outputDir: outputDir,
          outputDirClean: true,
          snapshotScript: bogusFile,
          timeout: 2000
        };
        var twice = _.after(2, cleanupError.bind(null, done, 0));

        ss.run(optHelp.decorate(options), twice)
          .then(unexpectedSuccess.bind(null, done))
          .catch(twice);
      });

      it("should fail if a bogus script object is supplied", function(done) {
        var options = {
          source: inputFile,
          hostname: "localhost",
          port: port,
          selector: "#dynamic-content",
          outputDir: outputDir,
          outputDirClean: true,
          snapshotScript: {
            script: bogusFile
          },
          timeout: 2000
        };
        var twice = _.after(2, cleanupError.bind(null, done, 0));

        ss.run(optHelp.decorate(options), twice)
          .then(unexpectedSuccess.bind(null, done))
          .catch(twice);
      });

      it("should fail if a customFilter is defined but no module", function(done) {
        var options = {
          source: inputFile,
          hostname: "localhost",
          port: port,
          selector: "#dynamic-content",
          outputDir: outputDir,
          outputDirClean: true,
          snapshotScript: {
            script: "customFilter"
          },
          timeout: 2000
        };
        var twice = _.after(2, cleanupError.bind(null, done, 0));

        ss.run(optHelp.decorate(options), twice)
          .then(unexpectedSuccess.bind(null, done))
          .catch(twice);
      });

      it("should fail if a customFilter is defined and bogus module", function(done) {
        var options = {
          source: inputFile,
          hostname: "localhost",
          port: port,
          selector: "#dynamic-content",
          outputDir: outputDir,
          outputDirClean: true,
          snapshotScript: {
            script: "customFilter",
            module: bogusFile
          },
          timeout: 2000
        };
        var twice = _.after(2, cleanupError.bind(null, done, 0));

        ss.run(optHelp.decorate(options), twice)
          .then(unexpectedSuccess.bind(null, done))
          .catch(twice);
      });

      describe("should succeed for scripts", function () {
        var testNumber = 0, snapshotScriptTest, scriptNames = [
          snapshotScriptTests[testNumber].name,
          snapshotScriptTests[testNumber + 1].name
          //, testNumber + 2, etc
        ];

        beforeEach(function () {
          snapshotScriptTest = snapshotScriptTests[testNumber++];
        });

        function snapshotScriptTestDefinition (done) {
          var options = {
            source: inputFile,
            hostname: "localhost",
            port: port,
            selector: "#dynamic-content",
            outputDir: outputDir,
            outputDirClean: true,
            timeout: 30000,
            snapshotScript: snapshotScriptTest.option
          };

          rimraf(outputDir);

          ss.run(optHelp.decorate(options), function (err, completed) {
            if (!err) {
              snapshotScriptTest.prove(completed, function (e) {
                cleanup(done, e);
              });
            } else {
              // this still fails occasionally.
              console.log('@@@ error = '+err+", completed="+completed.join(','));
              cleanup(done, err);
            }
          }).catch(function () {
            /* eat it */
          });
        }

        scriptNames.forEach(function (scriptName) {
          it("snapshot script "+scriptName, snapshotScriptTestDefinition);
        });
      });
    });
  });
});
