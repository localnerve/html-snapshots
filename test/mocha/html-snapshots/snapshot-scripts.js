/**
 * Library tests focused on the phantomjsOptions option.
 */
/* global module, require, beforeEach, describe, it */
// var assert = require("assert");
var path = require("path");
var fs = require("fs");
var _ = require("lodash");
var rimraf = require("rimraf").sync;
var utils = require("./utils");
var optHelp = require("../../helpers/options");
var ss = require("../../../lib/html-snapshots");
var inputFile = require("./robots").inputFile;

// missing destructuring, will write postcard...
var timeout = utils.timeout;
var outputDir = utils.outputDir;
var cleanup = utils.cleanup;
var bogusFile = utils.bogusFile;
var cleanupError = utils.cleanupError;
var unexpectedSuccess = utils.unexpectedSuccess;
var checkActualFiles = utils.checkActualFiles;

function snapshotScriptTests (options) {
  var port = options.port;

  return function () {
    var snapshotScriptTests = [
      {
        name: "removeScripts",
        option: {
          script: "removeScripts"
        },
        prove: function (completed, done) {
          // console.log("@@@ removeScripts prove @@@");
          var content, err;
          for (var i = 0; i < completed.length; i++) {
            content = fs.readFileSync(completed[i], { encoding: "utf8" });
            if (/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi.test(content)) {
              err = new Error("removeScripts failed. Script tag found in "+completed[i]);
              break;
            }
          }
          done(err);
        }
      },
      {
        name: "customFilter",
        option: {
          script: "customFilter",
          module: path.join(__dirname, "myFilter.js")
        },
        prove: function (completed, done) {
          // console.log("@@@ customFilter prove @@@");
          var content, err;
          for (var i = 0; i < completed.length; i++) {
            // console.log("@@@ readFile "+completed[i]);
            content = fs.readFileSync(completed[i], { encoding: "utf8" });
            // this is dependent on myFilter.js adding someattrZZQy anywhere
            if (content.indexOf("someattrZZQy") < 0) {
              err = new Error("customFilter snapshotScript failed. Special sequence not found in "+completed[i]);
              break;
            }
          }
          done(err);
        }
      }
    ];

    describe("should succeed for scripts", function () {
      var testNumber = 0, snapshotScriptTest, scriptNames = [
        snapshotScriptTests[testNumber].name,
        snapshotScriptTests[testNumber + 1].name
        //, testNumber + 2, etc
      ];

      beforeEach(function () {
        snapshotScriptTest = snapshotScriptTests[testNumber++];
      });

      function snapshotScriptTestDefinition (done) {
        var options = {
          source: inputFile,
          hostname: "localhost",
          port: port,
          selector: "#dynamic-content",
          outputDir: outputDir,
          outputDirClean: true,
          timeout: timeout,
          snapshotScript: snapshotScriptTest.option
        };

        rimraf(outputDir);

        ss.run(optHelp.decorate(options))
          .then(function (completed) {
            snapshotScriptTest.prove(completed, function (e) {
              cleanup(done, e);
            });
          })
          .catch(function (err) {
            checkActualFiles(err.notCompleted)
              .then(function () {
                cleanup(done, err);
              });
          });
      }

      scriptNames.forEach(function (scriptName) {
        it("snapshot script "+scriptName, function (done) {
          setTimeout(snapshotScriptTestDefinition, 3000, done);
        });
      });
    });

    it("should fail if a bogus script string is supplied", function (done) {
      var options = {
        source: inputFile,
        hostname: "localhost",
        port: port,
        selector: "#dynamic-content",
        outputDir: outputDir,
        outputDirClean: true,
        snapshotScript: bogusFile,
        timeout: 2000
      };
      var twice = _.after(2, cleanupError.bind(null, done, 0));

      ss.run(optHelp.decorate(options), twice)
        .then(unexpectedSuccess.bind(null, done))
        .catch(twice);
    });

    it("should fail if a bogus script object is supplied", function(done) {
      var options = {
        source: inputFile,
        hostname: "localhost",
        port: port,
        selector: "#dynamic-content",
        outputDir: outputDir,
        outputDirClean: true,
        snapshotScript: {
          script: bogusFile
        },
        timeout: 2000
      };
      var twice = _.after(2, cleanupError.bind(null, done, 0));

      ss.run(optHelp.decorate(options), twice)
        .then(unexpectedSuccess.bind(null, done))
        .catch(twice);
    });

    it("should fail if a customFilter is defined but no module", function(done) {
      var options = {
        source: inputFile,
        hostname: "localhost",
        port: port,
        selector: "#dynamic-content",
        outputDir: outputDir,
        outputDirClean: true,
        snapshotScript: {
          script: "customFilter"
        },
        timeout: 2000
      };
      var twice = _.after(2, cleanupError.bind(null, done, 0));

      ss.run(optHelp.decorate(options), twice)
        .then(unexpectedSuccess.bind(null, done))
        .catch(twice);
    });

    it("should fail if a customFilter is defined and bogus module", function(done) {
      var options = {
        source: inputFile,
        hostname: "localhost",
        port: port,
        selector: "#dynamic-content",
        outputDir: outputDir,
        outputDirClean: true,
        snapshotScript: {
          script: "customFilter",
          module: bogusFile
        },
        timeout: 2000
      };
      var twice = _.after(2, cleanupError.bind(null, done, 0));

      ss.run(optHelp.decorate(options), twice)
        .then(unexpectedSuccess.bind(null, done))
        .catch(twice);
    });
  };
}

module.exports = {
  testSuite: snapshotScriptTests
};
