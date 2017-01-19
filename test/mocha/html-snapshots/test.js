/**
 * Driver for html-snapshots library tests
 */
/* global describe, before */
var path = require("path");
var utils = require("./utils");
var server = require("../../server");

var basics = require("./basics");
var robots = require("./robots");
var sitemap = require("./sitemap");
var sitemapIndex = require("./sitemap-index");
var processLimit = require("./process-limit");
var useJQuery = require("./use-jquery");
var snapshotScripts = require("./snapshot-scripts");
var phantomJSOptions = require("./phantomjs-options");

var port = 8034;

describe("html-snapshots", function () {
  describe("library", function () {
    this.timeout(utils.timeout * (robots.urlCount - 1));

    before(function (done) {
      server.start(path.join(__dirname, "./server"), port, done);
    });

    describe("run basics", basics.testSuite({
      port: port
    }));

    describe("robots", robots.testSuite({
      port: port
    }));

    describe("sitemap", sitemap.testSuite({
      port: port
    }));

    describe("sitemap-index", sitemapIndex.testSuite({
      port: port
    }));

    describe("processLimit option", processLimit.testSuite({
      port: port
    }));

    describe("useJQuery option", useJQuery.testSuite({
      port: port
    }));

    describe("phantomjsOptions option", phantomJSOptions.testSuite({
      port: port
    }));

    describe("additional snapshot scripts", snapshotScripts.testSuite({
      port: port
    }));
  });
});
