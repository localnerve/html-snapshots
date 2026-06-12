/**
 * Library tests focused on the processLimit option.
 *
 * Copyright (c) 2013 - 2025, Alex Grant, LocalNerve, contributors
 */
const { it } = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
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
  checkActualFiles,
  makeCallback
} = utils;

const urls = robotsTests.urlCount;

function processLimitTests (options) {
  const {
    port,
    localRobotsFile: inputFile,
    browsers,
    puppeteerLaunchOptions
  } = options;
  const testOptions = {
    timeout: process.env.CI ? 60000 : 45000
  };
  const pollInterval = 50;
  let processCount = 0;
  let timer;

  function completeTest (browser, done, processLimit, e, files) {
    const countError = processCount ?
      new Error(`${processCount} exceeded processLimit ${processLimit}`) :
      undefined;

    clearInterval(timer);

    if (files) {
      checkActualFiles(files).then(() => {
        cleanup(browser, done, multiError(e, countError));
      });
    } else {
      cleanup(browser, done, multiError(e, countError));
    }
  }

  return () => {
    browsers.forEach(browser => {
      it(`should limit as expected - ${browser}`, testOptions, () => {
        return new Promise((resolve, reject) => {
          const done = makeCallback(resolve, reject);
          const processLimit = urls - 1;
          const complete = completeTest.bind(null, browser, done, processLimit);

          if (process.platform === "win32") {
            assert.ok(true, "Skipping posix compliant tests for processLimit");
            done();
          } else {
            fs.rmSync(outputDir, { recursive: true, force: true });

            killSpawnedProcesses(browser, err => {
              const options = {
                source: inputFile,
                hostname: "localhost",
                selector: "#dynamic-content",
                outputDirClean: true,
                outputDir,
                timeout,
                processLimit,
                port,
                browser,
                puppeteerLaunchOptions
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
                countSpawnedProcesses(browser, count => {
                  if (count > processLimit) {
                    processCount = count;
                    clearInterval(timer);
                  }
                });
              }, pollInterval);
            });
          }
        });
      });

      it(`should limit to just one process - ${browser}`, testOptions, () => {
        return new Promise((resolve, reject) => {
          const done = makeCallback(resolve, reject);
          const processLimit = 1;
          const complete = completeTest.bind(null, browser, done, processLimit);

          if (process.platform === "win32") {
            assert.ok(true, "Skipping posix compliant tests for processLimit");
            done();
          } else {
            fs.rmSync(outputDir, { recursive: true, force: true });

            killSpawnedProcesses(browser, err => {
              const options = {
                source: inputFile,
                hostname: "localhost",
                selector: "#dynamic-content",
                outputDirClean: true,
                outputDir,
                timeout,
                processLimit,
                port,
                browser,
                puppeteerLaunchOptions
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
                countSpawnedProcesses(browser, count => {
                  if (count > processLimit) {
                    processCount = count;
                    clearInterval(timer);
                  }
                });
              }, pollInterval);
            });
          }
        });
      });
    });
  };
}

module.exports = {
  testSuite: processLimitTests
};
