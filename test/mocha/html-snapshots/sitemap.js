/**
 * Library tests that use sitemap.
 *
 * Copyright (c) 2013 - 2023, Alex Grant, LocalNerve, contributors
 */
/* global it */
const assert = require("assert");
const path = require("path");
const optHelp = require("../../helpers/options");
const { after } = require("../../helpers/func");
const ss = require("../../../lib/html-snapshots");
const utils = require("./utils");

// missing destructuring, will write postcard...
const {
  outputDir,
  cleanup,
  cleanupError,
  cleanupSuccess,
  unexpectedSuccess,
  testSuccess,
  checkActualFiles
} = utils;

// Sitemap constants
const inputFile = path.join(__dirname, "./test_sitemap.xml");
const urls = 3; // must match public/page_sitemap.xml

function sitemapTests (options) {
  const {
    port,
    browsers
  } = options;

  return function () {
    function createOptions(newOptions) {
      const defaultOptions = {
        input: "sitemap",
        source: `http://localhost:${port}/index.html`,
        selector: "#dynamic-content",
        outputDirClean: true,
        timeout: 4000,
        outputDir,
        port
      };
      return {
        ...defaultOptions,
        ...newOptions
      };
    }

    browsers.forEach(browser => {
      it(`should all fail, bad remote sitemap - ${browser}`, function (done) {
        const options = createOptions({
          browser
        });

        const twice = after(2, cleanupError.bind(null, done, 0));

        ss.run(optHelp.decorate(options), twice)
          .then(unexpectedSuccess.bind(null, done))
          .catch(twice);
      });

      it("TODO: write more failure tests", function (done) {
        assert.ok(true, "TODO");
        done();
      });

      it(`should succeed simple case - ${browser}`, function (done) {
        const options = createOptions({
          source: `http://localhost:${port}/public/page-sitemap.xml`,
          browser
        });
        
        const twice = after(2, cleanupSuccess.bind(null, done));
        const success = (err, completed) => {
          assert.equal(completed.length, urls);
          testSuccess(twice, completed);
        };

        ss.run(optHelp.decorate(options), success)
          .then(success.bind(null, undefined))
          .catch(e => {
            checkActualFiles(e.notCompleted)
              .then(() => {
                cleanup(done, e);
              });
          });
      });

      it("TODO: write more success tests", function (done) {
        assert.ok(true, "TODO");
        done();
      });
    });
  };
}

module.exports = {
  testSuite: sitemapTests,
  inputFile: inputFile,
  urlCount: urls
};
