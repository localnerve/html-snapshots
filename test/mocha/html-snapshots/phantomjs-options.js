/**
 * Library tests focused on the phantomjsOptions option.
 */
/* global module, require, it */
var assert = require("assert");
var path = require("path");
var fs = require("fs");
var rimraf = require("rimraf").sync;
var utils = require("./utils");
var optHelp = require("../../helpers/options");
var resHelp = require("../../helpers/result");
var ss = require("../../../lib/html-snapshots");

// missing destructuring, will write postcard...
var timeout = utils.timeout;
var outputDir = utils.outputDir;
var cleanup = utils.cleanup;
var unexpectedError = utils.unexpectedError;
var unexpectedSuccess = utils.unexpectedSuccess;
var checkActualFiles = utils.checkActualFiles;

var outputBase = path.resolve(outputDir, "..");
var cookiesFile = path.join(outputBase, "cookies.txt");

function phantomjsOptionsTests (options) {
  var port = options.port;

  return function () {
    it("should work with one string option", function (done) {
      var options = {
        input: "array",
        source: [ "http://localhost:"+port+"/pjsopts" ],
        outputDir: outputDir,
        outputDirClean: false,
        selector: ".content-complete",
        timeout: timeout,
        phantomjsOptions: "--cookies-file="+cookiesFile
      };

      rimraf(outputBase);

      ss.run(optHelp.decorate(options), function (err, completed) {
        if (err) {
          console.log('@@@ error = '+err+", completed="+completed.join(','));
        }
      })
        .then(function () {
          var assertionError;
          try {
            assert.equal(true, fs.existsSync(cookiesFile), "cookie file in phantomjsOptions not found");
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

    it("should work with multiple options, test one", function (done) {
      var options = {
        input: "array",
        source: [ "http://localhost:"+port+"/pjsopts" ],
        outputDir: outputDir,
        outputDirClean: false,
        selector: "#inline-image",
        timeout: timeout,
        phantomjsOptions: [
          "--cookies-file="+cookiesFile,
          "--load-images=true"
        ]
      };

      rimraf(outputBase);

      ss.run(optHelp.decorate(options), function (err, completed) {
        if (err) {
          console.log('@@@ error = '+err+", completed="+completed.join(','));
        }
      })
        .then(function () {
          var assertionError;
          try {
            assert.equal(true, fs.existsSync(cookiesFile), "cookie file in phantomjsOptions not found");
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

    it("should work with multiple options, test two", function (done) {
      var options = {
        input: "array",
        source: [ "http://localhost:"+port+"/pjsopts" ],
        outputDir: outputDir,
        outputDirClean: false,
        selector: "#inline-image",
        timeout: 5000, // this should fail, so don't wait too long.
        phantomjsOptions: [
          "--cookies-file="+cookiesFile,
          "--load-images=false"
        ]
      };

      rimraf(outputBase);

      ss.run(optHelp.decorate(options))
        .then(unexpectedSuccess.bind(null, done))
        .catch(function (err) {
          var assertionError;
          try {
            resHelp.mustBeError(err);
          } catch (e) {
            assertionError = e;
          }
          cleanup(done, assertionError);
        });
    });

    // most of these tests use no options, so not testing that again here
  };
}

module.exports = {
  testSuite: phantomjsOptionsTests
};
