/**
 * Driver for html-snapshots library tests.
 *
 * Copyright (c) 2013 - 2025, Alex Grant, LocalNerve, contributors
 */
const { describe, before, after } = require("node:test");
const path = require("node:path");
const enableDestroy = require("server-destroy");

const { makeCallback } = require("./utils");

const basics = require("./basics");
const robots = require("./robots");
const sitemap = require("./sitemap");
const sitemapIndex = require("./sitemap-index");
const processLimit = require("./process-limit");
const useJQuery = require("./use-jquery");
const snapshotScripts = require("./snapshot-scripts");
const phantomJSOptions = require("./phantomjs-options");
const puppeteer = require("./puppeteer");

const localRobotsFile = path.join(__dirname, "./test_robots.txt");

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
  const server = require("../../server");

  return function () {
    let httpServer;

    before(() => {
      return new Promise((resolve, reject) => {
        const done = makeCallback(resolve, reject);
        server.start(path.join(__dirname, "./server"), port, (err, srv) => {
          if (err) {
            return done(err);
          }

          httpServer = srv;
          enableDestroy(httpServer);
          done();
        });
      });
    });

    after(() => {
      return new Promise(res => {
        httpServer.destroy(() => {
          setTimeout(res, 2000);
        });
      });
    });

    describe("tests", testSuiteFactory({
      port,
      localRobotsFile,
      browsers: ["phantomjs", "puppeteer"],
      puppeteerLaunchOptions: {
        args: [
          "--no-sandbox"
        ]
      }
    }));
  };
}

//{ timeout: timeout * robots.urlCount - 1 }
describe("html-snapshots", () =>  {

  describe("run basics", serverContext(basics.testSuite, 8034));

  describe(
    "phantomjsOptions option", serverContext(phantomJSOptions.testSuite, 8035)
  );

  describe(
    "puppeteer specific tests", serverContext(puppeteer.testSuite, 8042)
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
