/**
 * Library tests focused on the phantomjsOptions option.
 *
 * Copyright (c) 2013 - 2025, Alex Grant, LocalNerve, contributors
 */
const { it } = require("node:test");
const path = require("node:path");
const fs = require("node:fs");
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
  checkActualFiles,
  makeCallback
} = utils;

const browser = "phantomjs";
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
      browser,
      phantomjsOptions: `--cookies-file=${cookiesFile}`
    }
    return {
      ...defaultOptions,
      ...newOptions
    };
  }

  return function () {
    it ("should work on first vanilla full invocation, no checks", () => {
      return new Promise((resolve, reject) => {
        const done = makeCallback(resolve, reject);
        const options = createOptions({});

        fs.rmSync(outputBase, { recursive: true, force: true });

        ss.run(optHelp.decorate(options))
          .then(() => {
            cleanup(browser, done);
          }).catch(e => {
            checkActualFiles(e.notCompleted)
              .then(() => {
                cleanup(browser, done, e || unexpectedError);
              });
          });
      });
    });

    it("should work with one string option", () => {
      return new Promise((resolve, reject) => {
        const done = makeCallback(resolve, reject);
        const options = createOptions({});

        fs.rmSync(outputBase, { recursive: true, force: true });

        ss.run(optHelp.decorate(options), (err, completed) => {
          if (err) {
            console.log(`@@@ error = ${err}, completed=${completed.join(",")}`);
          }
        })
          .then(async () => {
            let assertionError;
            try {
              await new Promise(res => setTimeout(res, 500));
              await fs.promises.access(cookiesFile);
            } catch (e) {
              assertionError = e;
            }
            cleanup(browser, done, assertionError);
          })
          .catch(e => {
            checkActualFiles(e.notCompleted)
              .then(function () {
                cleanup(browser, done, e || unexpectedError);
              });
          });
      });
    });

    it("should work with multiple options, test one", () => {
      return new Promise((resolve, reject) => {
        const done = makeCallback(resolve, reject);
        const options = createOptions({
          selector: "#inline-image",
          phantomjsOptions: [
            `--cookies-file=${cookiesFile}`,
            "--load-images=true"
          ]
        });

        fs.rmSync(outputBase, { recursive: true, force: true });

        ss.run(optHelp.decorate(options), (err, completed) => {
          if (err) {
            console.log(`@@@ error = ${err}, completed=${completed.join(",")}`);
          }
        })
          .then(async () => {
            let assertionError;
            try {
              await new Promise(res => setTimeout(res, 500));
              await fs.promises.access(cookiesFile);
            } catch (e) {
              assertionError = e;
            }
            cleanup(browser, done, assertionError);
          })
          .catch(e => {
            checkActualFiles(e.notCompleted)
              .then(() => {
                cleanup(browser, done, e || unexpectedError);
              });
          });
      });
    });

    it("should work with multiple options, test two", () => {
      return new Promise((resolve, reject) => {
        const done = makeCallback(resolve, reject);
        const options = createOptions({
          selector: "#inline-image",
          timeout: 5000, // this should fail, so don't wait too long.
          phantomjsOptions: [
            `--cookies-file=${cookiesFile}`,
            "--load-images=false"
          ]
        });

        fs.rmSync(outputBase, { recursive: true, force: true });

        ss.run(optHelp.decorate(options))
          .then(unexpectedSuccess.bind(null, browser, done))
          .catch(err => {
            let assertionError;
            try {
              resHelp.mustBeError(err);
            } catch (e) {
              assertionError = e;
            }
            cleanup(browser, done, assertionError);
          });
      });
    });
    // most of these tests use no options, so not testing that again here
  };
}

module.exports = {
  testSuite: phantomjsOptionsTests
};
