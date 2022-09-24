/**
 * Library tests focused on the processLimit option.
 *
 * Copyright (c) 2013 - 2022, Alex Grant, LocalNerve, contributors
 */
/* global it */
const assert = require("assert");
const rimraf = require("rimraf").sync;
const utils = require("./utils");
const optHelp = require("../../helpers/options");
const ss = require("../../../lib/html-snapshots");
const robotsTests = require("./robots");

const {
  timeout,
  outputDir,
  cleanup,
  killSpawnedProcesses,
  countSpawnedProcesses,
  unexpectedError,
  multiError,
  checkActualFiles  
} = utils;

const urls = robotsTests.urlCount;

function processLimitTests (options) {
  const { port, localRobotsFile: inputFile } = options;
  const pollInterval = 50;
  let phantomCount = 0;
  let timer;

  function completeTest (done, processLimit, e, files) {
    const countError = phantomCount ?
      new Error(`${phantomCount} exceeded processLimit ${processLimit}`) :
      undefined;

    clearInterval(timer);

    if (files) {
      checkActualFiles(files).then(() => {
        cleanup(done, multiError(e, countError));
      });
    } else {
      cleanup(done, multiError(e, countError));
    }
  }

  return function () {
    it("should limit as expected", function (done) {
      const processLimit = urls - 1;
      const complete = completeTest.bind(null, done, processLimit);

      if (process.platform === "win32") {
        assert.ok(true, "Skipping posix compliant tests for processLimit");
        done();
      } else {
        rimraf(outputDir);

        killSpawnedProcesses(function (err) {
          const options = {
            source: inputFile,
            hostname: "localhost",
            selector: "#dynamic-content",
            outputDirClean: true,
            outputDir,
            timeout,
            processLimit,
            port
          };

          if (err) {
            return done(err);
          }

          ss.run(optHelp.decorate(options))
            .then(() => {
              complete();
            })
            .catch(e => {
              complete(e || unexpectedError, e.notCompleted);
            });

          timer = setInterval(() => {
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
      const processLimit = 1;
      const complete = completeTest.bind(null, done, processLimit);

      if (process.platform === "win32") {
        assert.ok(true, "Skipping posix compliant tests for processLimit");
        done();
      } else {
        rimraf(outputDir);

        killSpawnedProcesses(function (err) {
          const options = {
            source: inputFile,
            hostname: "localhost",
            selector: "#dynamic-content",
            outputDirClean: true,
            outputDir,
            timeout,
            processLimit,
            port
          };

          if (err) {
            return done(err);
          }

          ss.run(optHelp.decorate(options))
            .then(() => {
              complete();
            })
            .catch(e => {
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
  testSuite: processLimitTests
};
