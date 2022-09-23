/**
 * Library tests that use robots.
 *
 * Copyright (c) 2013 - 2022, Alex Grant, LocalNerve, contributors
 */
/* global it */
const rimraf = require("rimraf").sync;
const _ = require("lodash");
const common = require("../../../lib/common");
const optHelp = require("../../helpers/options");
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
  const { port, localRobotsFile } = options;

  // Robots.txt fixtures
  const inputFiles = [
    localRobotsFile,
    `http://localhost:${port}/test_robots.txt`,
    `http://localhost:${port}/test_robots_sitemap.txt`
  ];

  return function () {
    inputFiles.forEach(inputFile => {
      it(`should succeed, no output dir pre-exists, ${inputFile}`, function (done) {
        const options = {
          source: inputFile,
          hostname: "localhost",
          selector: "#dynamic-content",
          outputDirClean: true,
          outputDir,
          timeout,
          port
        };
        const twice = _.after(2, cleanupSuccess.bind(null, done));

        rimraf(outputDir);

        ss.run(optHelp.decorate(options), twice)
          .then(testSuccess.bind(null, twice))
          .catch(e => {
            checkActualFiles(e.notCompleted)
              .then(() => {
                cleanup(done, e);
              });
          });
      });

      it(`should succeed, output dir does pre-exist, ${inputFile}`, function (done) {
        const options = {
          source: inputFile,
          hostname: "localhost",
          selector: "#dynamic-content",
          outputDirClean: true,
          outputDir,
          timeout,
          port
        };
        const twice = _.after(2, cleanupSuccess.bind(null, done));

        ss.run(optHelp.decorate(options), twice)
          .then(testSuccess.bind(null, twice))
          .catch(e => {
            checkActualFiles(e.notCompleted)
              .then(() => {
                cleanup(done, e);
              });
          });
      });

      it(`should fail with bad phantomjs process to spawn, ${inputFile}`,
        function (done) {
        const options = {
          source: inputFile,
          hostname: "localhost",
          selector: "#dynamic-content",
          outputDirClean: true,
          phantomjs: bogusFile,
          timeout: 1000,
          outputDir,
          port
        };
        const twice = _.after(2, cleanupError.bind(null, done, 0));

        ss.run(options, twice)
          .then(unexpectedSuccess.bind(null, done))
          .catch(twice);
      });

      it(`should fail, bad remote robots, ${inputFile}`, function (done) {
        const options = {
          input: "robots",
          source: `http://localhost:${port}/index.html`,
          selector: "#dynamic-content",
          outputDirClean: true,
          timeout: 6000,
          outputDir,
          port
        };
        const twice = _.after(2, cleanupError.bind(null, done, 0));

        ss.run(optHelp.decorate(options), twice)
          .then(unexpectedSuccess.bind(null, done))
          .catch(twice);
      });

      it(`should fail, non-existent selector, ${inputFile}`, function (done) {
        const options = {
          source: inputFile,
          hostname: "localhost",
          selector: "#dynamic-content-notexist",
          outputDirClean: true,
          timeout: 6000,
          outputDir,
          port
        };
        const twice = _.after(2, cleanupError.bind(null, done, 0));

        ss.run(optHelp.decorate(options), twice)
          .then(unexpectedSuccess.bind(null, done))
          .catch(twice);
      });

      it(`should fail one snapshot, one non-existent selector, ${inputFile}`, function (done) {
        let exceptionUrl = "/";
        if (common.isUrl(inputFile)) {
          // assume the origin of the inputFile is the same as the contents of the remote urls within it.
          const url = new URL(inputFile);
          const isSitemap = url.pathname.includes('sitemap');
          if (isSitemap) {
            exceptionUrl = `${url.origin}${exceptionUrl}`;
          }
        }
        const options = {
          source: inputFile,
          hostname: "localhost",
          selector: {
            "__default": "#dynamic-content",
            [exceptionUrl]: "#dynamic-content-notexist"
          },
          outputDirClean: true,
          timeout: 6000,
          outputDir,
          port
        };
        const twice = _.after(2, cleanupError.bind(null, done, urls - 1));

        ss.run(optHelp.decorate(options), twice)
          .then(unexpectedSuccess.bind(null, done))
          .catch(twice);
      });
    });
  };
}

module.exports = {
  testSuite: robotsTests,
  urlCount: urls
};
