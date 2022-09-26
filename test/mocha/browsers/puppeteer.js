/**
 * Tests that target the puppeteer script specifically.
 * 
 * Copyright (c) 2013 - 2022, Alex Grant, LocalNerve, contributors
 */
/* global before, it */
const assert = require("assert");
const path = require("path");
const rimraf = require("rimraf").sync;
const spawn = require("child_process").spawn;
const server = require("../../server");

const outputDir = path.join(__dirname, "tmp");
const port = 9340;

function puppeteerTests () {
  const snapshotScript = path.resolve(__dirname, '../../../lib/puppeteer/index.js');
  const outputFile = path.join(outputDir, "snapshot.html");

  /**
   * Launch the puppeteer script as a process.
   *
   * @param {Array} args - array of puppeteer args
   */
  function spawnPuppeteer (args, done) {
    const cp = spawn(
      snapshotScript,
      args
      , { cwd: process.cwd(), stdio: "inherit", detached: true }
    );
    
    cp.on("exit", code => {
      if (code !== 0) {
        return done(new Error(`error exit code: ${code}`));
      }
      done();
    });
  }

  return function () {
    before(function() {
      server.start(path.join(__dirname, "./server"), port);
    });
    
    it("should succeed with minimal args", function (done) {
      this.timeout(5000);

      rimraf(outputDir);

      spawnPuppeteer([
        outputFile,
        `http://localhost:${port}/`,
        "body"
      ], done);
    });

    it("should fail if insufficient input args", function (done) {
      rimraf(outputDir);
      
      spawnPuppeteer([
        outputFile,
        "http://someurl.domain/path/resource"
      ], e => {
        const msg = "expected process error";
        assert.ok(e, msg);
        done(e ? undefined : new Error(msg));
      });
    });

    it("should fail with bad url", function (done) {
      rimraf(outputDir);

      spawnPuppeteer([
        outputFile,
        "http://nonexistent.domain/path/resource",
        "body",
        1000
      ], e => {
        const msg = "expected process error";
        assert.ok(e, msg);
        done(e ? undefined : new Error(msg));
      });
    });

    it("should launch debugging", function (done) {
      const timeout = 5000;
      this.timeout(timeout);

      rimraf(outputDir);

      spawnPuppeteer([
        outputFile,
        `http://localhost:${port}/`,
        "body",
        timeout - 1000,
        "false",
        "true",
        10
      ], done);
    });
  };
}

module.exports = {
  testSuite: puppeteerTests
};