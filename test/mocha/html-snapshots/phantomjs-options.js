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
          assert.equal(true, fs.existsSync(cookiesFile), "cookie file in phantomjsOptions not found");
          cleanup(done);
        })
        .catch(function (e) {
          cleanup(done, e || unexpectedError);
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
          assert.equal(true, fs.existsSync(cookiesFile), "cookie file in phantomjsOptions not found");
          cleanup(done);
        })
        .catch(function (e) {
          cleanup(done, e || unexpectedError);
        });
    });

    it("should work with multiple options, test two", function (done) {
      var options = {
        input: "array",
        source: [ "http://localhost:"+port+"/pjsopts" ],
        outputDir: outputDir,
        outputDirClean: false,
        selector: "#inline-image",
        timeout: timeout,
        phantomjsOptions: [
          "--cookies-file="+cookiesFile,
          "--load-images=false"
        ]
      };

      rimraf(outputBase);

      function completionHandler (err) {
        resHelp.mustBeError(err);
        // maybe this is true, but why should this be true?
        // assert.equal(true, fs.existsSync(cookiesFile), "cookie file in phantomjsOptions not found");
      }

      ss.run(optHelp.decorate(options), completionHandler)
        .then(unexpectedSuccess.bind(null, done))
        .catch(function (e) {
          completionHandler(e);
          cleanup(done);
        });
    });

    // most of these tests use no options, so not testing that again here
  };
}

module.exports = {
  testSuite: phantomjsOptionsTests
};
