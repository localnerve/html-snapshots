/**
 * Driver for html-snapshots library tests.
 *
 * Copyright (c) 2013 - 2025, Alex Grant, LocalNerve, contributors
 */
const { describe, before, after } = require("node:test");
const path = require("node:path");
const createServer = require("../../server");
const basics = require("./basics");
const robots = require("./robots");
const sitemap = require("./sitemap");
const sitemapIndex = require("./sitemap-index");
const processLimit = require("./process-limit");
const snapshotScripts = require("./snapshot-scripts");
const playwrightOptions = require("./playwright-options");
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

  return function () {
    let server;

    before(async () => {
      server = createServer();
      await server.start(path.join(__dirname, "./server"), port);
    });

    after(async () => {
      await server.stop();
    });

    describe("tests", {
      concurrency: 1
    }, testSuiteFactory({
      port,
      localRobotsFile,
      browsers: ["playwright", "puppeteer"],
      puppeteerLaunchOptions: {
        args: [
          "--no-sandbox"
        ]
      }
    }));
  };
}

//{ timeout: utils.timeout * robots.urlCount - 1 }
describe("html-snapshots", {
  isolation: "none"
}, () =>  {

  describe("run basics", serverContext(basics.testSuite, 8034));

  describe(
    "playwrightLaunchOptions option", serverContext(playwrightOptions.testSuite, 8035)
  );

  describe(
    "puppeteer specific tests", serverContext(puppeteer.testSuite, 8042)
  );

  describe(
    "additional snapshot scripts", serverContext(snapshotScripts.testSuite, 8036)
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

  describe.skip(
    "processLimit option", serverContext(processLimit.testSuite, 8041)
  );
});
