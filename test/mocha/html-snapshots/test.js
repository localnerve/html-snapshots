/**
 * Driver for html-snapshots library tests
 */
/* global describe, before, after */
var path = require("path");
var enableDestroy = require("server-destroy");

var timeout = require("./utils").timeout;

var basics = require("./basics");
var robots = require("./robots");
var sitemap = require("./sitemap");
var sitemapIndex = require("./sitemap-index");
var processLimit = require("./process-limit");
var useJQuery = require("./use-jquery");
var snapshotScripts = require("./snapshot-scripts");
var phantomJSOptions = require("./phantomjs-options");

/**
 * Create a test context with a new server on a port.
 * Why? Managing the resources (sockets) closely makes a real difference
 * on test services like Travis.
 *
 * @param {Function} testSuiteFactory - The test suite.
 * @param {Number} port - The server port.
 * @returns {Function} A test context with server management.
 */
function serverContext (testSuiteFactory, port) {
  var server = require("../../server");

  return function () {
    var httpServer;

    before(function (done) {
      server.start(path.join(__dirname, "./server"), port,
      function (err, srv) {
        if (err) {
          return done(err);
        }

        httpServer = srv;
        enableDestroy(httpServer);
        done();
      });
    });

    after(function (done) {
      httpServer.destroy(function () {
        setTimeout(done, 2000);
      });
    });

    describe("tests", testSuiteFactory({
      port: port
    }));
  };
}

describe("html-snapshots", function () {

  this.timeout(timeout * robots.urlCount - 1);

  describe("run basics", serverContext(basics.testSuite, 8034));

  describe(
    "phantomjsOptions option", serverContext(phantomJSOptions.testSuite, 8035)
  );

  describe(
    "additional snapshot scripts", serverContext(snapshotScripts.testSuite, 8036)
  );

  describe(
    "useJQuery option", serverContext(useJQuery.testSuite, 8037)
  );

  describe(
    "robots", serverContext(robots.testSuite, 8038)
  );

  describe(
    // If you change the port, change the test fixtures, too.
    "sitemap", serverContext(sitemap.testSuite, 8039)
  );

  describe(
    // If you change the port, change the test fixutres, too.
    "sitemap-index", serverContext(sitemapIndex.testSuite, 8040)
  );

  describe(
    "processLimit option", serverContext(processLimit.testSuite, 8041)
  );
});
