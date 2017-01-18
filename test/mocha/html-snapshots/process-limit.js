/**
 * Library tests focused on the processLimit option.
 */
/* global module, require, process, clearInterval, setTimeout, it */
var assert = require("assert");
var rimraf = require("rimraf").sync;
var utils = require("./utils");
var optHelp = require("../../helpers/options");
var ss = require("../../../lib/html-snapshots");
var robotsTests = require("./robots");

// missing destructuring, will write postcard...
var timeout = utils.timeout;
var outputDir = utils.outputDir;
var cleanup = utils.cleanup;
var killSpawnedProcesses = utils.killSpawnedProcesses;
var countSpawnedProcesses = utils.countSpawnedProcesses;
var unexpectedError = utils.unexpectedError;

var urls = robotsTests.urlCount;
var inputFile = robotsTests.inputFile;

function processLimitTests (options) {
  var port = options.port;

  return function () {
    it("should limit as expected", function (done) {
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

    it("should limit to just one process", function (done) {
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
  };
}

module.exports = {
  testSuite: processLimitTests,
  inputFile: inputFile,
  urlCount: urls
};
