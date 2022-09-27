/**
 * Library tests focused on the phantomjsOptions option.
 *
 * Copyright (c) 2013 - 2022, Alex Grant, LocalNerve, contributors
 */
/* global it */
const path = require("path");
const fs = require("fs");
const rimraf = require("rimraf").sync;
const utils = require("./utils");
const optHelp = require("../../helpers/options");
const resHelp = require("../../helpers/result");
const ss = require("../../../lib/html-snapshots");

const {
  timeout,
  outputDir,
  cleanup,
  unexpectedError,
  unexpectedSuccess,
  checkActualFiles
} = utils;

const outputBase = path.resolve(outputDir, "..");
const cookiesFile = path.join(outputBase, "cookies.txt");

function phantomjsOptionsTests (options) {
  const {
    port
  } = options;

  function createOptions (newOptions) {
    const defaultOptions = {
      input: "array",
      source: [ `http://localhost:${port}/pjsopts` ],
      outputDir,
      outputDirClean: false,
      selector: ".content-complete",
      timeout,
      browser: "phantomjs",
      phantomjsOptions: `--cookies-file=${cookiesFile}`
    }
    return {
      ...defaultOptions,
      ...newOptions
    };
  }

  return function () {
    it ("should work on first vanilla full invocation, no checks", function (done) {
      const options = createOptions({});

      rimraf(outputBase);

      ss.run(optHelp.decorate(options))
        .then(() => {
          cleanup(done);
        }).catch(e => {
          checkActualFiles(e.notCompleted)
            .then(() => {
              cleanup(done, e || unexpectedError);
            });
        });
    });

    it("should work with one string option", function (done) {
      const options = createOptions({});

      rimraf(outputBase);

      ss.run(optHelp.decorate(options), (err, completed) => {
        if (err) {
          console.log(`@@@ error = ${err}, completed=${completed.join(',')}`);
        }
      })
        .then(() => {
          let assertionError;
          try {
            fs.accessSync(cookiesFile);
          } catch (e) {
            assertionError = e;
          }
          cleanup(done, assertionError);
        })
        .catch(e => {
          checkActualFiles(e.notCompleted)
            .then(function () {
              cleanup(done, e || unexpectedError);
            });
        });
    });

    it("should work with multiple options, test one", function (done) {
      const options = createOptions({
        selector: "#inline-image",
        phantomjsOptions: [
          `--cookies-file=${cookiesFile}`,
          "--load-images=true"
        ]
      });

      rimraf(outputBase);

      ss.run(optHelp.decorate(options), (err, completed) => {
        if (err) {
          console.log(`@@@ error = ${err}, completed=${completed.join(',')}`);
        }
      })
        .then(() => {
          let assertionError;
          try {
            fs.accessSync(cookiesFile);
          } catch (e) {
            assertionError = e;
          }
          cleanup(done, assertionError);
        })
        .catch(e => {
          checkActualFiles(e.notCompleted)
            .then(() => {
              cleanup(done, e || unexpectedError);
            });
        });
    });

    it("should work with multiple options, test two", function (done) {
      const options = createOptions({
        selector: "#inline-image",
        timeout: 5000, // this should fail, so don't wait too long.
        phantomjsOptions: [
          `--cookies-file=${cookiesFile}`,
          "--load-images=false"
        ]
      });

      rimraf(outputBase);

      ss.run(optHelp.decorate(options))
        .then(unexpectedSuccess.bind(null, done))
        .catch(err => {
          let assertionError;
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
