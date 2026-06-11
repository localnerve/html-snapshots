/**
 * Library tests focused on the playwrightLaunchOptions option.
 *
 * Copyright (c) 2013 - 2025, Alex Grant, LocalNerve, contributors
 */
const { it } = require("node:test");
const assert = require("node:assert");
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

const browser = "playwright";
const playwrightOutputBase = path.resolve(outputDir, "..", "playwright");

function playwrightOptionsTests (options) {
  const {
    port
  } = options;

  function createOptions (newOptions) {
    const defaultOptions = {
      input: "array",
      source: [ `http://localhost:${port}/contact` ],
      outputDir: playwrightOutputBase,
      outputDirClean: false,
      selector: "#dynamic-content",
      timeout,
      browser,
      playwrightLaunchOptions: {}
    };
    return {
      ...defaultOptions,
      ...newOptions
    };
  }

  return function () {
    it("should work with default playwright launch options (chromium)", () => {
      return new Promise((resolve, reject) => {
        const done = makeCallback(resolve, reject);
        const options = createOptions({});

        fs.rmSync(playwrightOutputBase, { recursive: true, force: true });

        ss.run(optHelp.decorate(options))
          .then(completed => {
            let assertionError;
            try {
              assert.equal(Array.isArray(completed), true);
              assert.equal(completed.length > 0, true);
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

    it("should work with playwrightLaunchOptions as a single object", () => {
      return new Promise((resolve, reject) => {
        const done = makeCallback(resolve, reject);
        const options = createOptions({
          playwrightLaunchOptions: {
            args: ["--no-sandbox"]
          }
        });

        fs.rmSync(playwrightOutputBase, { recursive: true, force: true });

        ss.run(optHelp.decorate(options))
          .then(completed => {
            let assertionError;
            try {
              assert.equal(Array.isArray(completed), true);
              assert.equal(completed.length > 0, true);
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

    it("should work with playwrightLaunchOptions containing browserType chromium", () => {
      return new Promise((resolve, reject) => {
        const done = makeCallback(resolve, reject);
        const options = createOptions({
          playwrightLaunchOptions: {
            browserType: "chromium"
          }
        });

        fs.rmSync(playwrightOutputBase, { recursive: true, force: true });

        ss.run(optHelp.decorate(options))
          .then(completed => {
            let assertionError;
            try {
              assert.equal(Array.isArray(completed), true);
              assert.equal(completed.length > 0, true);
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

    it("should work with playwrightLaunchOptions containing browserType firefox", () => {
      return new Promise((resolve, reject) => {
        const done = makeCallback(resolve, reject);
        const options = createOptions({
          playwrightLaunchOptions: {
            browserType: "firefox"
          }
        });

        fs.rmSync(playwrightOutputBase, { recursive: true, force: true });

        ss.run(optHelp.decorate(options))
          .then(completed => {
            let assertionError;
            try {
              assert.equal(Array.isArray(completed), true);
              assert.equal(completed.length > 0, true);
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

    it("should work with playwrightLaunchOptions as a function per url", () => {
      return new Promise((resolve, reject) => {
        const done = makeCallback(resolve, reject);
        const options = createOptions({
          source: [ `http://localhost:${port}/contact`, `http://localhost:${port}/` ],
          playwrightLaunchOptions: url => {
            if (url && url.includes("/contact")) {
              return { browserType: "chromium" };
            }
            return {};
          }
        });

        fs.rmSync(playwrightOutputBase, { recursive: true, force: true });

        ss.run(optHelp.decorate(options))
          .then(completed => {
            let assertionError;
            try {
              assert.equal(Array.isArray(completed), true);
              assert.equal(completed.length > 0, true);
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

    it("should work with playwrightLaunchOptions as an object per url", () => {
      return new Promise((resolve, reject) => {
        const done = makeCallback(resolve, reject);
        const options = createOptions({
          source: [ `http://localhost:${port}/contact`, `http://localhost:${port}/` ],
          playwrightLaunchOptions: {
            "http://localhost:PORT/contact": { browserType: "chromium" },
            "__default": {}
          }
        });

        // Replace PORT placeholder with actual port
        const contactKey = `http://localhost:${port}/contact`;
        options.playwrightLaunchOptions[contactKey] = { browserType: "chromium" };
        delete options.playwrightLaunchOptions["http://localhost:PORT/contact"];

        fs.rmSync(playwrightOutputBase, { recursive: true, force: true });

        ss.run(optHelp.decorate(options))
          .then(completed => {
            let assertionError;
            try {
              assert.equal(Array.isArray(completed), true);
              assert.equal(completed.length > 0, true);
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

    it("should fail with unsupported browserType", () => {
      return new Promise((resolve, reject) => {
        const done = makeCallback(resolve, reject);
        const options = createOptions({
          playwrightLaunchOptions: {
            browserType: "safari"
          },
          timeout: 5000
        });

        fs.rmSync(playwrightOutputBase, { recursive: true, force: true });

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

    it("should work with debug options and playwright", () => {
      return new Promise((resolve, reject) => {
        const done = makeCallback(resolve, reject);
        const options = createOptions({
          source: [ `http://localhost:${port}/contact` ],
          debug: {
            flag: true,
            slowMo: 50
          },
          playwrightLaunchOptions: {}
        });

        fs.rmSync(playwrightOutputBase, { recursive: true, force: true });

        ss.run(optHelp.decorate(options))
          .then(completed => {
            let assertionError;
            try {
              assert.equal(Array.isArray(completed), true);
              assert.equal(completed.length > 0, true);
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

    it("should work with playwrightLaunchOptions headless false", () => {
      return new Promise((resolve, reject) => {
        const done = makeCallback(resolve, reject);
        const options = createOptions({
          source: [ `http://localhost:${port}/contact` ],
          playwrightLaunchOptions: {
            headless: false
          }
        });

        fs.rmSync(playwrightOutputBase, { recursive: true, force: true });

        ss.run(optHelp.decorate(options))
          .then(completed => {
            let assertionError;
            try {
              assert.equal(Array.isArray(completed), true);
              assert.equal(completed.length > 0, true);
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

    // most of these tests use no options, so not testing that again here
  };
}

module.exports = {
  testSuite: playwrightOptionsTests
};
