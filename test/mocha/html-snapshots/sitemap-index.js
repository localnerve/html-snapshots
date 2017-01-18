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
var cleanup = utils.cleanup;

// Sitemap-index constants
var sitemapIndexFile = "test_sitemap_index.xml";
var inputFile = path.join(__dirname, "./", sitemapIndexFile);
var urls = 3; // must match the unqiue # of urls in all the sitemap files referenced in sitemap-index.

function sitemapIndexTests (options) {
  var port = options.port;

  return function () {
    it("TODO: write sitemap-index failure tests", function (done) {
      assert.ok(true, "TODO");
      done();
    });

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
          assert.equal(Object.prototype.toString.call(completed), "[object Array]");
          assert.equal(completed.length, urls);
          cleanup(done);
        })
        .catch(function (err) {
          cleanup(done, err || unexpectedError);
        });
    });
  };
}

module.exports = {
  testSuite: sitemapIndexTests,
  inputFile: inputFile,
  urlCount: urls
}
