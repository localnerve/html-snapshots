/**
 * Library tests focused on the processLimit option.
 */
/* global module, require, process, clearInterval, setTimeout, it, Promise */
var assert = require("assert");
var rimraf = require("rimraf").sync;
var utils = require("./utils");
var optHelp = require("../../helpers/options");
var ss = require("../../../lib/html-snapshots");
var robotsTests = require("./robots");

// @@@
var fs = require("fs");
var F_OK = (fs.constants && fs.constants.F_OK) || fs.F_OK;
var nodeCall = require("../../../common/node");
// @@@

// missing destructuring, will write postcard...
var timeout = utils.timeout;
var outputDir = utils.outputDir;
var cleanup = utils.cleanup;
var killSpawnedProcesses = utils.killSpawnedProcesses;
var countSpawnedProcesses = utils.countSpawnedProcesses;
var unexpectedError = utils.unexpectedError;
var multiError = utils.multiError;

var urls = robotsTests.urlCount;
var inputFile = robotsTests.inputFile;

// @@@
function checkActualFiles (files) {
  return Promise.all(files.map(function (file) {
    return nodeCall(fs.access, file, F_OK)
      .then(function () {
        console.log('@@@ exists:' + file);
        return true;
      })
      .catch(function () {
        console.log('@@@ NOT exists:' + file);
        return false;
      });
  }));
}
// @@@

function processLimitTests (options) {
  var port = options.port;

  return function () {
    it("should limit as expected", function (done) {
      var processLimit = urls - 1;
      var pollInterval = 500;
      var phantomCount = 0;
      var timer;

      function complete (e) {
        var countError = phantomCount ?
          new Error(phantomCount + " exceeded processLimit " + processLimit) :
          undefined;

        clearInterval(timer);

        checkActualFiles.then(function () {
          cleanup(done, multiError(e, countError));
        });
      }

      if (process.platform === "win32") {
        assert.ok(true, "Skipping posix compliant tests for processLimit");
        done();
      } else {
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

          ss.run(optHelp.decorate(options))
            .then(function () {
              complete();
            })
            .catch(function (e) {
              complete(e || unexpectedError);
            });

          timer = setInterval(function () {
              countSpawnedProcesses(function (count) {
                //console.log("@@@ DEBUG @@@ phantom count: "+count);
                if (count > processLimit) {
                  phantomCount = count;
                  clearInterval(timer);
                }
              });
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
      var processLimit = 1;
      var pollInterval = 500;
      var phantomCount = 0;
      var timer;

      function complete (e) {
        var countError = phantomCount ?
          new Error(phantomCount + " exceeded processLimit " + processLimit) :
          undefined;

        clearInterval(timer);

        checkActualFiles.then(function () {
          cleanup(done, multiError(e, countError));
        });
      }

      if (process.platform === "win32") {
        assert.ok(true, "Skipping posix compliant tests for processLimit");
        done();
      } else {
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

          ss.run(optHelp.decorate(options))
            .then(function () {
              complete();
            })
            .catch(function (e) {
              complete(e || unexpectedError);
            });

          timer = setInterval(function () {
            countSpawnedProcesses(function (count) {
              //console.log("@@@ DEBUG @@@ phantom count: "+count);
              if (count > processLimit) {
                phantomCount = count;
                clearInterval(timer);
              }
            });
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
