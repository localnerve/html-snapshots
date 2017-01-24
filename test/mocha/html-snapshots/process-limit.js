/**
 * Library tests focused on the processLimit option.
 */
/* global module, require, process, clearInterval, setInterval, it */
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
var multiError = utils.multiError;
var checkActualFiles = utils.checkActualFiles;

var urls = robotsTests.urlCount;
var inputFile = robotsTests.inputFile;

function processLimitTests (options) {
  var port = options.port;
  var pollInterval = 50;
  var phantomCount = 0;
  var timer;

  function completeTest (done, processLimit, e, files) {
    var countError = phantomCount ?
      new Error(phantomCount + " exceeded processLimit " + processLimit) :
      undefined;

    clearInterval(timer);

    if (files) {
      checkActualFiles(files).then(function () {
        cleanup(done, multiError(e, countError));
      });
    } else {
      cleanup(done, multiError(e, countError));
    }
  }

  return function () {
    it("should limit as expected", function (done) {
      var processLimit = urls - 1;
      var complete = completeTest.bind(null, done, processLimit);

      if (process.platform === "win32") {
        assert.ok(true, "Skipping posix compliant tests for processLimit");
        done();
      } else {
        rimraf(outputDir);

        killSpawnedProcesses(function (err) {
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

          if (err) {
            return done(err);
          }

          ss.run(optHelp.decorate(options))
            .then(function () {
              complete();
            })
            .catch(function (e) {
              complete(e || unexpectedError, e.notCompleted);
            });

          timer = setInterval(function () {
            countSpawnedProcesses(function (count) {
              // console.log("@@@ DEBUG @@@ phantom count: "+count);
              if (count > processLimit) {
                phantomCount = count;
                clearInterval(timer);
              }
            });
          }, pollInterval);
        });
      }
    });

    it("should limit to just one process", function (done) {
      var processLimit = 1;
      var complete = completeTest.bind(null, done, processLimit);

      if (process.platform === "win32") {
        assert.ok(true, "Skipping posix compliant tests for processLimit");
        done();
      } else {
        rimraf(outputDir);

        killSpawnedProcesses(function (err) {
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

          if (err) {
            return done(err);
          }

          ss.run(optHelp.decorate(options))
            .then(function () {
              complete();
            })
            .catch(function (e) {
              complete(e || unexpectedError, e.notCompleted);
            });

          timer = setInterval(function () {
            countSpawnedProcesses(function (count) {
              // console.log("@@@ DEBUG @@@ phantom count: "+count);
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
