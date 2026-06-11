/**
 * Library tests that use robots.
 *
 * Copyright (c) 2013 - 2025, Alex Grant, LocalNerve, contributors
 */
const { it } = require("node:test");
const fs = require("node:fs");
const common = require("../../../lib/common");
const optHelp = require("../../helpers/options");
const { after } = require("../../helpers/func");
const ss = require("../../../lib/html-snapshots");
const utils = require("./utils");

const {
  timeout,
  outputDir,
  cleanup,
  cleanupSuccess,
  cleanupError,
  testSuccess,
  unexpectedSuccess,
  checkActualFiles,
  makeCallback
} = utils;

const urls = 3; // must match url # in robots files test fixtures.

/**
 * The robots test suite.
 */
function robotsTests (options) {
  const {
    port,
    localRobotsFile,
    browsers,
    puppeteerLaunchOptions
   } = options;

  // Robots.txt fixtures
  const inputFiles = [
    localRobotsFile,
    `http://localhost:${port}/test_robots.txt`,
    `http://localhost:${port}/test_robots_sitemap.txt`
  ];

  return function () {
    function createOptions (newOptions) {
      const options = {
        hostname: "localhost",
        selector: "#dynamic-content",
        outputDirClean: true,
        outputDir,
        timeout,
        port,
        puppeteerLaunchOptions
      };
      return {
        ...options,
        ...newOptions
      };
    }
    browsers.forEach(browser => {
      inputFiles.forEach(inputFile => {
        it(`should succeed, no output dir pre-exists, ${browser}, ${inputFile}`, () => {
          return new Promise((resolve, reject) => {
            const done = makeCallback(resolve, reject);
            const options = createOptions({
              source: inputFile,
              browser
            });

            const twice = after(2, cleanupSuccess.bind(null, browser, done));

            fs.rmSync(outputDir, { recursive: true, force: true });

            ss.run(optHelp.decorate(options), twice)
              .then(testSuccess.bind(null, twice))
              .catch(e => {
                checkActualFiles(e.notCompleted)
                  .then(() => {
                    cleanup(browser, done, e);
                  });
              });
          });
        });

        it(`should succeed, output dir does pre-exist, ${browser}, ${inputFile}`, () => {
          return new Promise((resolve, reject) => {
            const done = makeCallback(resolve, reject);
            const options = createOptions({
              source: inputFile,
              browser
            });

            const twice = after(2, cleanupSuccess.bind(null, browser, done));

            ss.run(optHelp.decorate(options), twice)
              .then(testSuccess.bind(null, twice))
              .catch(e => {
                checkActualFiles(e.notCompleted)
                  .then(() => {
                    cleanup(browser, done, e);
                  });
              });
          });
        });

        it(`should fail, bad remote robots, ${browser}, ${inputFile}`, () => {
          return new Promise((resolve, reject) => {
            const done = makeCallback(resolve, reject);
            const options = createOptions({
              input: "robots",
              source: `http://localhost:${port}/index.html`,
              timeout: 5000,
              browser
            });

            const twice = after(2, cleanupError.bind(null, browser, done, 0));

            ss.run(optHelp.decorate(options), twice)
              .then(unexpectedSuccess.bind(null, browser, done))
              .catch(twice);
          });
        });

        it(`should fail, non-existent selector, ${browser}, ${inputFile}`, () => {
          return new Promise((resolve, reject) => {
            const done = makeCallback(resolve, reject);
            const options = createOptions({
              source: inputFile,
              selector: "#dynamic-content-notexist",
              timeout: 5000,
              browser
            });

            const twice = after(2, cleanupError.bind(null, browser, done, 0));

            ss.run(optHelp.decorate(options), twice)
              .then(unexpectedSuccess.bind(null, browser, done))
              .catch(twice);
          });
        });

        it(`should fail one snapshot, one non-existent selector, ${browser}, ${inputFile}`, () => {
          return new Promise((resolve, reject) => {
            const done = makeCallback(resolve, reject);
            let exceptionUrl = "/";
            if (common.isUrl(inputFile)) {
              // assume the origin of the inputFile is the same as the contents of the remote urls within it.
              const url = new URL(inputFile);
              const isSitemap = url.pathname.includes("sitemap");
              if (isSitemap) {
                exceptionUrl = `${url.origin}${exceptionUrl}`;
              }
            }
            const options = createOptions({
              source: inputFile,
              selector: {
                "__default": "#dynamic-content",
                [exceptionUrl]: "#dynamic-content-notexist"
              },
              timeout: 5000,
              browser
            });

            const twice = after(2, cleanupError.bind(null, browser, done, urls - 1));

            ss.run(optHelp.decorate(options), twice)
              .then(unexpectedSuccess.bind(null, browser, done))
              .catch(twice);
          });
        });
      });
    });
  };
}

module.exports = {
  testSuite: robotsTests,
  urlCount: urls
};