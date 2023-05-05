/**
 * Tests that target the puppeteer script specifically.
 * 
 * Copyright (c) 2013 - 2023, Alex Grant, LocalNerve, contributors
 */
/* global before, it */
const assert = require("assert");
const path = require("path");
const fs = require("fs");
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
      this.timeout(10000);

      fs.rmSync(outputDir, { recursive: true, force: true });

      spawnPuppeteer([
        outputFile,
        `http://localhost:${port}/`,
        "body"
      ], done);
    });

    it("should succeed with stringified puppeteerLaunchOptions", function (done) {
      this.timeout(4000);
      fs.rmSync(outputDir, { recursive: true, force: true });

      // override the debug options to prove stringified launch opts worked.
      const puppeteerLaunchOptions = {
        headless: true,
        devTools: false
      };

      spawnPuppeteer([
        outputFile,
        `http://localhost:${port}/`,
        "body",
        4000,
        "false",
        "true",
        10,
        JSON.stringify(puppeteerLaunchOptions)
      ], done);
    });

    it("should fail if insufficient input args", function (done) {
      fs.rmSync(outputDir, { recursive: true, force: true });
      
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
      fs.rmSync(outputDir, { recursive: true, force: true });

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

      fs.rmSync(outputDir, { recursive: true, force: true });

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