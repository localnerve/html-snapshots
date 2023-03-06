/**
 * Library tests focused on the phantomjsOptions option.
 *
 * Copyright (c) 2013 - 2023, Alex Grant, LocalNerve, contributors
 */
/* global beforeEach, describe, it */

const path = require("path");
const fs = require("fs");
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
  checkActualFiles
} = utils;

function snapshotScriptTests (options) {
  const {
    localRobotsFile: inputFile,
    port,
    browsers
  } = options;

  return function () {
    const removeScriptsConfig = {
      name: "removeScripts",
      option: {
        script: "removeScripts"
      },
      browser: "phantomjs",
      prove: (completed, done) => {
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
    };
    const customFilterConfig = {
      name: "customFilter",
      option: {
        script: "customFilter",
        module: path.join(__dirname, "myFilter.js")
      },
      browser: "phantomjs",
      prove: (completed, done) => {
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
    
    describe("should succeed for scripts", function () {
      let testNumber = 0, snapshotScriptTest;
      const scriptNames = snapshotScriptTests.map(test => test.name);

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
          browser: snapshotScriptTest.browser,
          outputDir,
          port
        };

        fs.rmSync(outputDir, { recursive: true, force: true });

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

      scriptNames.forEach((scriptName, i) => {
        it(`snapshot script ${scriptName}, ${snapshotScriptTests[i].browser}`, function (done) {
          setTimeout(snapshotScriptTestDefinition, 3000, done);
        });
      });
    });

    describe("should fail for scripts", function () {
      function createOptions (newOptions) {
        const defaultOptions = {
          source: inputFile,
          hostname: "localhost",
          selector: "#dynamic-content",
          outputDirClean: true,
          snapshotScript: bogusFile,
          timeout: 2000,
          outputDir,
          port
        };
        return {
          ...defaultOptions,
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
          browser: "phantomjs",
          snapshotScript: {
            script: "customFilter",
            module: bogusFile
          }
        }
      }];
      const driverOptions = browsers.map(browser => {
        return testOptions.map(test => {
          test.options.browser = browser;
          return JSON.parse(JSON.stringify(test));
        });
      }).flat();

      driverOptions.forEach(driver => {
        it(driver.name, function (done) {
          const options = createOptions(driver.options);
          const twice = after(2, cleanupError.bind(null, done, 0));
          ss.run(optHelp.decorate(options), twice)
            .then(unexpectedSuccess.bind(null, done))
            .catch(twice);
        });
      });
    });
  };
}

module.exports = {
  testSuite: snapshotScriptTests
};
