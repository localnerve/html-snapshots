/**
 * Library tests that use robots.
 */
/* global require, module, it */
var assert = require("assert");
var path = require("path");
var _ = require("lodash");
var optHelp = require("../../helpers/options");
var ss = require("../../../lib/html-snapshots");
var utils = require("./utils");

// missing destructuring, will write postcard...
var outputDir = utils.outputDir;
var cleanupError = utils.cleanupError;
var unexpectedSuccess = utils.unexpectedSuccess;

// Sitemap constants
var inputFile = path.join(__dirname, "./test_sitemap.xml");
var urls = 3; // must match test_sitemap.xml

function sitemapTests (options) {
  var port = options.port;

  return function () {
    it("should all fail, bad remote sitemap", function (done) {
      var options = {
        input: "sitemap",
        source: "http://localhost:"+port+"/index.html",
        port: port,
        selector: "#dynamic-content",
        outputDir: outputDir,
        outputDirClean: true,
        timeout: 6000
      };
      var twice = _.after(2, cleanupError.bind(null, done, 0));

      ss.run(optHelp.decorate(options), twice)
        .then(unexpectedSuccess.bind(null, done))
        .catch(twice);
    });

    it("TODO: write failure tests", function (done) {
      assert.ok(true, "TODO");
      done();
    });

    it("TODO: write success tests", function (done) {
      assert.ok(true, "TODO");
      done();
    })
  };
}

module.exports = {
  testSuite: sitemapTests,
  inputFile: inputFile,
  urlCount: urls
};
