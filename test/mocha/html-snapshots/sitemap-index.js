/**
 * Library tests that use sitemap-index.
 *
 * Copyright (c) 2013 - 2022, Alex Grant, LocalNerve, contributors
 */
/* global it */
const assert = require("assert");
const path = require("path");
const optHelp = require("../../helpers/options");
const ss = require("../../../lib/html-snapshots");
const utils = require("./utils");

const {
  outputDir,
  timeout,
  unexpectedError,
  unexpectedSuccess,
  cleanup,
  checkActualFiles
} = utils;

// Sitemap-index constants
const sitemapIndexFile = "test_sitemap_index.xml";
const inputFile = path.join(__dirname, "./", sitemapIndexFile);
const urls = 3; // must match the unqiue # of urls in all the sitemap files referenced in sitemap-index.

function getClass (obj) {
  const string = Object.prototype.toString.call(obj);
  const m = /\[object ([^\]]+)/.exec(string);
  return m && m[1];
}

function sitemapIndexTests (options) {
  const port = options.port;

  return function () {
    it("should succeed for typical sitemap-index usage", function (done) {
      const options = {
        source: `http://localhost:${port}/${sitemapIndexFile}`,
        input: "sitemap-index",
        selector: "#dynamic-content",
        outputDirClean: true,
        outputDir,
        timeout
      };

      ss.run(optHelp.decorate(options))
        .then(function (completed) {
          let assertionError;
          try {
            assert.equal(getClass(completed), "Array");
            assert.equal(completed.length, urls);
          } catch (e) {
            assertionError = e;
          }
          cleanup(done, assertionError);
        })
        .catch(err => {
          checkActualFiles(err.notCompleted)
            .then(() => {
              cleanup(done, err || unexpectedError);
            });
        });
    });

    it("should fail fast for bad sitemap url", function (done) {
      const sitemapIndexFile3 = path.basename(sitemapIndexFile, ".xml") + "-3" +
        path.extname(sitemapIndexFile);
        const options = {
          source: `http://localhost:${port}/${sitemapIndexFile3}`,
          input: "sitemap-index",
          selector: "#dynamic-content",
          outputDirClean: true,
          outputDir,
          timeout
        };

        ss.run(optHelp.decorate(options))
          .then(unexpectedSuccess)
          .catch(err => {
            let assertionError;
            try {
              assert.equal(getClass(err.notCompleted), "Array");
              // fails fast:
              assert.equal(err.notCompleted.length, 0);
            } catch (e) {
              assertionError = e;
            }
            cleanup(done, assertionError);
          });
    });

    it("should eventually fail for bad page url", function (done) {
      const eventually = 1000;
      const sitemapIndexFile2 = path.basename(sitemapIndexFile, ".xml") + "-2" +
        path.extname(sitemapIndexFile);
      const options = {
        source: `http://localhost:${port}/${sitemapIndexFile2}`,
        input: "sitemap-index",
        selector: "#dynamic-content",
        outputDirClean: true,
        timeout: {
          "http://localhost:8040/services/bad": eventually,
          __default: timeout
        },
        outputDir
      };

      ss.run(optHelp.decorate(options))
        .then(unexpectedSuccess)
        .catch(err => {
          let assertionError;
          try {
            assert.equal(getClass(err.completed), "Array");
            assert.equal(err.completed.length, urls - 1);
            assert.equal(getClass(err.notCompleted), "Array");
            assert.equal(err.notCompleted.length, 1);
          } catch (e) {
            assertionError = e;
          }
          cleanup(done, assertionError);
        });
    });
  };
}

module.exports = {
  testSuite: sitemapIndexTests,
  urlCount: urls,
  inputFile
};
