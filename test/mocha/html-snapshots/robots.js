/**
 * Library tests that use robots.
 */
/* global module, require, it */
var path = require("path");
var rimraf = require("rimraf").sync;
var _ = require("lodash");
var optHelp = require("../../helpers/options");
var ss = require("../../../lib/html-snapshots");
var utils = require("./utils");

// missing destructuring, will write postcard...
var timeout = utils.timeout;
var outputDir = utils.outputDir;
var cleanup = utils.cleanup;
var cleanupSuccess = utils.cleanupSuccess;
var cleanupError = utils.cleanupError;
var testSuccess = utils.testSuccess;
var bogusFile = utils.bogusFile;
var unexpectedSuccess = utils.unexpectedSuccess;
var checkActualFiles = utils.checkActualFiles;

// Robots constants
var inputFile = path.join(__dirname, "./test_robots.txt");
var urls = 3; // must match test_robots.txt

/**
 * The robots test suite.
 */
function robotsTests (options) {
  var port = options.port;

  return function () {
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
          checkActualFiles(e.notCompleted)
            .then(function () {
              cleanup(done, e);
            });
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
          checkActualFiles(e.notCompleted)
            .then(function () {
              cleanup(done, e);
            });
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
  };
}

module.exports = {
  testSuite: robotsTests,
  inputFile: inputFile,
  urlCount: urls
};
