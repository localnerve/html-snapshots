/**
 * Library tests that use robots.
 */
/* global require, module, it */
var assert = require("assert");
var path = require("path");
var optHelp = require("../../helpers/options");
var ss = require("../../../lib/html-snapshots");
var utils = require("./utils");

// missing destructuring, will write postcard...
var outputDir = utils.outputDir;
var timeout = utils.timeout;
var unexpectedError = utils.unexpectedError;
var unexpectedSuccess = utils.unexpectedSuccess;
var cleanup = utils.cleanup;
var checkActualFiles = utils.checkActualFiles;

// Sitemap-index constants
var sitemapIndexFile = "test_sitemap_index.xml";
var inputFile = path.join(__dirname, "./", sitemapIndexFile);
var urls = 3; // must match the unqiue # of urls in all the sitemap files referenced in sitemap-index.

function getClass (obj) {
  var string = Object.prototype.toString.call(obj);
  var m = /\[object ([^\]]+)/.exec(string);
  return m && m[1];
}

function sitemapIndexTests (options) {
  var port = options.port;

  return function () {
    it("should succeed for typical sitemap-index usage", function (done) {
      var options = {
        source: "http://localhost:"+port+"/"+sitemapIndexFile,
        input: "sitemap-index",
        selector: "#dynamic-content",
        outputDir: outputDir,
        outputDirClean: true,
        timeout: timeout
      };

      ss.run(optHelp.decorate(options))
        .then(function (completed) {
          var assertionError;
          try {
            assert.equal(getClass(completed), "Array");
            assert.equal(completed.length, urls);
          } catch (e) {
            assertionError = e;
          }
          cleanup(done, assertionError);
        })
        .catch(function (err) {
          checkActualFiles(err.notCompleted)
            .then(function () {
              cleanup(done, err || unexpectedError);
            });
        });
    });

    it("should fail fast for bad sitemap url", function (done) {
      var sitemapIndexFile3 = path.basename(sitemapIndexFile, ".xml") + "-3" +
        path.extname(sitemapIndexFile);
        var options = {
          source: "http://localhost:" + port + "/" + sitemapIndexFile3,
          input: "sitemap-index",
          selector: "#dynamic-content",
          outputDir: outputDir,
          outputDirClean: true,
          timeout: timeout
        };

        ss.run(optHelp.decorate(options))
          .then(unexpectedSuccess)
          .catch(function (err) {
            var assertionError;
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
      var eventually = 1000;
      var sitemapIndexFile2 = path.basename(sitemapIndexFile, ".xml") + "-2" +
        path.extname(sitemapIndexFile);
      var options = {
        source: "http://localhost:" + port + "/" + sitemapIndexFile2,
        input: "sitemap-index",
        selector: "#dynamic-content",
        outputDir: outputDir,
        outputDirClean: true,
        timeout: {
          "http://localhost:8040/services/bad": eventually,
          __default: timeout
        }
      };

      ss.run(optHelp.decorate(options))
        .then(unexpectedSuccess)
        .catch(function (err) {
          var assertionError;
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
  inputFile: inputFile,
  urlCount: urls
};
