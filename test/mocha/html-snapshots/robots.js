/**
 * Library tests that use robots.
 *
 * Copyright (c) 2013 - 2024, Alex Grant, LocalNerve, contributors
 */
/* global it */
const fs = require("fs");
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
  bogusFile,
  unexpectedSuccess,
  checkActualFiles  
} = utils;

const urls = 3; // must match url # in robots files test fixtures.

/**
 * The robots test suite.
 */
function robotsTests (options) {
  const {
    port,
    localRobotsFile,
    browsers
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
        port
      };
      return {
        ...options,
        ...newOptions
      };
    }
    browsers.forEach(browser => {
      inputFiles.forEach(inputFile => {
        it(`should succeed, no output dir pre-exists, ${browser}, ${inputFile}`, function (done) {
          const options = createOptions({
            source: inputFile,
            browser
          });

          const twice = after(2, cleanupSuccess.bind(null, done));

          fs.rmSync(outputDir, { recursive: true, force: true });

          ss.run(optHelp.decorate(options), twice)
            .then(testSuccess.bind(null, twice))
            .catch(e => {
              checkActualFiles(e.notCompleted)
                .then(() => {
                  cleanup(done, e);
                });
            });
        });

        it(`should succeed, output dir does pre-exist, ${browser}, ${inputFile}`, function (done) {
          const options = createOptions({
            source: inputFile,
            browser
          });

          const twice = after(2, cleanupSuccess.bind(null, done));

          ss.run(optHelp.decorate(options), twice)
            .then(testSuccess.bind(null, twice))
            .catch(e => {
              checkActualFiles(e.notCompleted)
                .then(() => {
                  cleanup(done, e);
                });
            });
        });

        it(`should fail with bad phantomjs process to spawn, succeed otherwise, ${browser}, ${inputFile}`,
          function (done) {
          const options = createOptions({
            source: inputFile,
            browser,
            phantomjs: bogusFile,
            timeout: 1000
          });

          if (browser === "phantomjs") {
            const twice = after(2, cleanupError.bind(null, done, 0));

            ss.run(options, twice)
              .then(unexpectedSuccess.bind(null, done))
              .catch(twice);
          } else {
            options.timeout = utils.timeout;
            const twice = after(2, cleanupSuccess.bind(null, done));

            ss.run(optHelp.decorate(options), twice)
            .then(testSuccess.bind(null, twice))
            .catch(e => {
              checkActualFiles(e.notCompleted)
                .then(() => {
                  cleanup(done, e);
                });
            });
          }
        });

        it(`should fail, bad remote robots, ${browser}, ${inputFile}`, function (done) {
          const options = createOptions({
            input: "robots",
            source: `http://localhost:${port}/index.html`,
            timeout: 5000,
            browser
          });

          const twice = after(2, cleanupError.bind(null, done, 0));

          ss.run(optHelp.decorate(options), twice)
            .then(unexpectedSuccess.bind(null, done))
            .catch(twice);
        });

        it(`should fail, non-existent selector, ${browser}, ${inputFile}`, function (done) {
          const options = createOptions({
            source: inputFile,
            selector: "#dynamic-content-notexist",
            timeout: 5000,
            browser
          });

          const twice = after(2, cleanupError.bind(null, done, 0));

          ss.run(optHelp.decorate(options), twice)
            .then(unexpectedSuccess.bind(null, done))
            .catch(twice);
        });

        it(`should fail one snapshot, one non-existent selector, ${browser}, ${inputFile}`, function (done) {
          let exceptionUrl = "/";
          if (common.isUrl(inputFile)) {
            // assume the origin of the inputFile is the same as the contents of the remote urls within it.
            const url = new URL(inputFile);
            const isSitemap = url.pathname.includes('sitemap');
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

          const twice = after(2, cleanupError.bind(null, done, urls - 1));

          ss.run(optHelp.decorate(options), twice)
            .then(unexpectedSuccess.bind(null, done))
            .catch(twice);
        });
      });
    });
  };
}

module.exports = {
  testSuite: robotsTests,
  urlCount: urls
};
