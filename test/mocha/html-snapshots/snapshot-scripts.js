/**
 * Library tests focused on the phantomjsOptions option.
 *
 * Copyright (c) 2013 - 2022, Alex Grant, LocalNerve, contributors
 */
/* global beforeEach, describe, it */

const path = require("path");
const fs = require("fs");
const _ = require("lodash");
const rimraf = require("rimraf").sync;
const utils = require("./utils");
const optHelp = require("../../helpers/options");
const ss = require("../../../lib/html-snapshots");

const {
  timeout,
  outputDir,
  cleanup,
  bogusFile,
  cleanupError,
  unexpectedSuccess,
  checkActualFiles
} = utils;

function snapshotScriptTests (options) {
  const { localRobotsFile: inputFile, port } = options;

  return function () {
    const snapshotScriptTests = [
      {
        name: "removeScripts",
        option: {
          script: "removeScripts"
        },
        prove: function (completed, done) {
          // console.log("@@@ removeScripts prove @@@");
          let content, err;
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
          let content, err;
          for (let i = 0; i < completed.length; i++) {
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
      let testNumber = 0, snapshotScriptTest;
      const scriptNames = [
        snapshotScriptTests[testNumber].name,
        snapshotScriptTests[testNumber + 1].name
        //, testNumber + 2, etc
      ];

      beforeEach(function () {
        snapshotScriptTest = snapshotScriptTests[testNumber++];
      });

      function snapshotScriptTestDefinition (done) {
        const options = {
          source: inputFile,
          hostname: "localhost",
          selector: "#dynamic-content",
          outputDirClean: true,
          timeout: timeout,
          snapshotScript: snapshotScriptTest.option,
          outputDir,
          port
        };

        rimraf(outputDir);

        ss.run(optHelp.decorate(options))
          .then(completed => {
            snapshotScriptTest.prove(completed, e => {
              cleanup(done, e);
            });
          })
          .catch(err => {
            checkActualFiles(err.notCompleted)
              .then(() => {
                cleanup(done, err);
              });
          });
      }

      scriptNames.forEach(scriptName => {
        it(`snapshot script ${scriptName}`, function (done) {
          setTimeout(snapshotScriptTestDefinition, 3000, done);
        });
      });
    });

    it("should fail if a bogus script string is supplied", function (done) {
      const options = {
        source: inputFile,
        hostname: "localhost",
        selector: "#dynamic-content",
        outputDirClean: true,
        snapshotScript: bogusFile,
        timeout: 2000,
        outputDir,
        port
      };
      const twice = _.after(2, cleanupError.bind(null, done, 0));

      ss.run(optHelp.decorate(options), twice)
        .then(unexpectedSuccess.bind(null, done))
        .catch(twice);
    });

    it("should fail if a bogus script object is supplied", function(done) {
      const options = {
        source: inputFile,
        hostname: "localhost",
        selector: "#dynamic-content",
        outputDirClean: true,
        snapshotScript: {
          script: bogusFile
        },
        timeout: 2000,
        outputDir,
        port
      };
      const twice = _.after(2, cleanupError.bind(null, done, 0));

      ss.run(optHelp.decorate(options), twice)
        .then(unexpectedSuccess.bind(null, done))
        .catch(twice);
    });

    it("should fail if a customFilter is defined but no module", function(done) {
      const options = {
        source: inputFile,
        hostname: "localhost",
        selector: "#dynamic-content",
        outputDirClean: true,
        snapshotScript: {
          script: "customFilter"
        },
        timeout: 2000,
        outputDir,
        port
      };
      const twice = _.after(2, cleanupError.bind(null, done, 0));

      ss.run(optHelp.decorate(options), twice)
        .then(unexpectedSuccess.bind(null, done))
        .catch(twice);
    });

    it("should fail if a customFilter is defined and bogus module", function(done) {
      const options = {
        source: inputFile,
        hostname: "localhost",
        selector: "#dynamic-content",
        outputDirClean: true,
        snapshotScript: {
          script: "customFilter",
          module: bogusFile
        },
        timeout: 2000,
        outputDir,
        port
      };
      const twice = _.after(2, cleanupError.bind(null, done, 0));

      ss.run(optHelp.decorate(options), twice)
        .then(unexpectedSuccess.bind(null, done))
        .catch(twice);
    });
  };
}

module.exports = {
  testSuite: snapshotScriptTests
};
