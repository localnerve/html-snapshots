/**
 * Library tests focused on the snapshotScript option.
 *
 * Copyright (c) 2013 - 2025, Alex Grant, LocalNerve, contributors
 */
const { describe, it, beforeEach } = require("node:test");
const path = require("node:path");
const fs = require("node:fs");
const utils = require("./utils");
const optHelp = require("../../helpers/options");
const { after } = require("../../helpers/func");
const ss = require("../../../lib/html-snapshots");

const {
  timeout,
  outputDir,
  cleanup,
  bogusFile,
  cleanupError,
  unexpectedSuccess,
  checkActualFiles,
  makeCallback
} = utils;

function snapshotScriptTests (options) {
  const {
    localRobotsFile: inputFile,
    port,
    browsers,
    puppeteerLaunchOptions
  } = options;

  return function () {
    const removeScriptsConfig = {
      name: "removeScripts",
      option: {
        script: "removeScripts"
      },
      prove: (completed, done) => {
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
    };
    const customFilterConfig = {
      name: "customFilter",
      option: {
        script: "customFilter",
        module: path.join(__dirname, "myFilter.js")
      },
      prove: (completed, done) => {
        let content, err;
        for (let i = 0; i < completed.length; i++) {
          content = fs.readFileSync(completed[i], { encoding: "utf8" });
          // this is dependent on myFilter.js adding someattrZZQy anywhere
          if (content.indexOf("someattrZZQy") < 0) {
            err = new Error("customFilter snapshotScript failed. Special sequence not found in "+completed[i]);
            break;
          }
        }
        done(err);
      }
    };
    const snapshotScriptTests = [];
    browsers.forEach(browser => {
      snapshotScriptTests.push({
        ...removeScriptsConfig,
        ...{
          name: `${removeScriptsConfig.name}-${browser}`,
          browser
        }
      });
      snapshotScriptTests.push({
        ...customFilterConfig,
        ...{
          name: `${customFilterConfig.name}-${browser}`,
          browser
        }
      });
    });
    
    describe("should succeed for scripts", () =>  {
      let testNumber = 0, snapshotScriptTest;
      const scriptNames = snapshotScriptTests.map(test => test.name);

      beforeEach(() => {
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
          browser: snapshotScriptTest.browser,
          outputDir,
          port,
          puppeteerLaunchOptions
        };

        fs.rmSync(outputDir, { recursive: true, force: true });

        ss.run(optHelp.decorate(options))
          .then(completed => {
            snapshotScriptTest.prove(completed, e => {
              cleanup(snapshotScriptTest.browser, done, e);
            });
          })
          .catch(err => {
            checkActualFiles(err.notCompleted)
              .then(() => {
                cleanup(snapshotScriptTest.browser, done, err);
              });
          });
      }

      scriptNames.forEach((scriptName, i) => {
        it(`snapshot script ${scriptName}, ${snapshotScriptTests[i].browser}`, () => {
          return new Promise((resolve, reject) => {
            const done = makeCallback(resolve, reject);
            snapshotScriptTestDefinition(done);
          });
        });
      });
    });

    describe("should fail for scripts", () => {
      function createOptions (newOptions) {
        const defaultOptions = {
          source: inputFile,
          hostname: "localhost",
          selector: "#dynamic-content",
          outputDirClean: true,
          snapshotScript: bogusFile,
          timeout: 2000,
          outputDir,
          port,
          puppeteerLaunchOptions
        };
        return {
          ...defaultOptions,
          ...{ browser: "puppeteer" }, // for explicit test reference, below
          ...newOptions
        };
      }

      const testOptions = [{
        name: "should fail if a bogus script string is supplied",
        options: {
          snapshotScript: bogusFile
        }
      }, {
        name: "should fail if a bogus script object is supplied",
        options: {
          snapshotScript: {
            script: bogusFile
          }
        }
      }, {
        name: "should fail if a customFilter is defined but no module",
        options: {
          snapshotScript: {
            script: "customFilter"
          }
        }
      }, {
        name: "should fail if a customFilter is defined and bogus module",
        options: {
          snapshotScript: {
            script: "customFilter",
            module: bogusFile
          }
        }
      }];
      const driverOptions = browsers.map(browser => {
        return testOptions.map(test => {
          test.options.browser = browser;
          test.name += ` - ${browser}`;
          return JSON.parse(JSON.stringify(test));
        });
      }).flat();

      driverOptions.forEach(driver => {
        it(driver.name, () => {
          return new Promise((resolve, reject) => {
            const done = makeCallback(resolve, reject);
            const options = createOptions(driver.options);
            const twice = after(2, cleanupError.bind(null, options.browser, done, 0));
            ss.run(optHelp.decorate(options), twice)
              .then(unexpectedSuccess.bind(null, options.browser, done))
              .catch(twice);
          });
        });
      });
    });
  };
}

module.exports = {
  testSuite: snapshotScriptTests
};