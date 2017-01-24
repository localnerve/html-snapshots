/**
 * Library tests focused on the useJQuery option.
 */
/* global module, require, process, clearInterval, setTimeout, it */
var assert = require("assert");
var path = require("path");
var _ = require("lodash");
var utils = require("./utils");
var optHelp = require("../../helpers/options");
var ss = require("../../../lib/html-snapshots");

// missing destructuring, will write postcard...
var timeout = utils.timeout;
var outputDir = utils.outputDir;
var cleanup = utils.cleanup;
var cleanupError = utils.cleanupError;
var unexpectedError = utils.unexpectedError;
var unexpectedSuccess = utils.unexpectedSuccess;
var checkActualFiles = utils.checkActualFiles;

var useJQOutputDir = path.resolve(outputDir, "..", "useJQuery");

function useJQueryTests (options) {
  var port = options.port;

  return function () {
    it("should succeed if useJQuery=false, jQuery NOT loaded, dynamic element",
    function (done) {
      var options = {
        input: "array",
        source: [ "http://localhost:"+port+"/nojq" ],
        selector: ".nojq-dynamic", // nojq-dynamic is created onload
        //selector: "#pocs1",
        outputDir: useJQOutputDir,
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
          var assertionError;
          try {
            assert.equal(completed.length, 1);
            assert.equal(completed[0], path.join(useJQOutputDir, "nojq", "index.html"));
          } catch (e) {
            assertionError = e;
          }
          cleanup(done, assertionError);
        })
        .catch(function (e) {
          checkActualFiles(e.notCompleted)
            .then(function () {
              cleanup(done, e || unexpectedError);
            });
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
          var assertionError;
          try {
            assert.equal(completed.length, 1);
            assert.equal(completed[0], path.join(outputDir, "index.html"));
          } catch (e) {
            assertionError = e;
          }
          cleanup(done, assertionError);
        })
        .catch(function (e) {
          checkActualFiles(e.notCompleted)
            .then(function () {
              cleanup(done, e || unexpectedError);
            });
        });
    });

    it("should fail if useJQuery is true and no jQuery loads in target page",
    function (done) {
      var options = {
        input: "array",
        source: [ "http://localhost:"+port+"/nojq" ],
        selector: "#pocs1",
        outputDir: useJQOutputDir,
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
        outputDir: useJQOutputDir,
        outputDirClean: true,
        timeout: 5000,
        useJQuery: true
      };
      var twice = _.after(2, cleanupError.bind(null, done, 0));

      ss.run(optHelp.decorate(options), twice)
        .then(unexpectedSuccess.bind(null, done))
        .catch(twice);
    });

    // most of these tests use useJQuery false and jQuery loads in target page,
    // so not testing that combo that should always succeed as long as the
    // selector is not dependent on jQuery.
  };
}

module.exports = {
  testSuite: useJQueryTests
};
