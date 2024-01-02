/**
 * Tests unique to the puppeteer browser.
 * 
 * Copyright (c) 2013 - 2024, Alex Grant, LocalNerve, contributors
 */
/* global it */
const optHelp = require("../../helpers/options");
const ss = require("../../../lib/html-snapshots");
const {
  outputDir,
  cleanupSuccess,
  testSuccess
} = require("./utils");

function puppeteerTests (options) {
  const {
    port
  } = options;

  return function () {

    it("should launch debugger when requested", function (done) {
      const options = {
        source: [
          `http://localhost:${port}/contact`
        ],
        outputDir,
        timeout: 5000,
        debug: {
          flag: true,
          slowMo: 50
        }
      };

      const success = testSuccess.bind(null, cleanupSuccess.bind(null, done));

      // TODO: check for headless: false chrome invocation
      ss.run(optHelp.decorate(options))
        .then(success)
        .catch(done);
    });
  };
}

module.exports = {
  testSuite: puppeteerTests
};
