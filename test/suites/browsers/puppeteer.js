/**
 * Tests that target the puppeteer script specifically.
 * 
 * Copyright (c) 2013 - 2025, Alex Grant, LocalNerve, contributors
 */
const { before, it } = require("node:test");
const assert = require("node:assert");
const path = require("node:path");
const fs = require("node:fs");
const spawn = require("node:child_process").spawn;
const server = require("../../server");

const outputDir = path.join(__dirname, "tmp");
const port = 9340;
const successTimeout = 20000;

function puppeteerTests () {
  const snapshotScript = path.resolve(__dirname, "../../../lib/puppeteer/index.js");
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
    before(() => {
      server.start(path.join(__dirname, "./server"), port);
    });
    
    it("should succeed with minimal args", { timeout: successTimeout }, () => {
      fs.rmSync(outputDir, { recursive: true, force: true });

      new Promise (resolve => {
        spawnPuppeteer([
          outputFile,
          `http://localhost:${port}/`,
          "body"
        ], resolve);
      });
    });

    it("should succeed with stringified puppeteerLaunchOptions", { timeout: successTimeout }, () => {
      fs.rmSync(outputDir, { recursive: true, force: true });

      // override the debug options to prove stringified launch opts worked.
      const puppeteerLaunchOptions = {
        headless: true,
        devTools: false,
        args: [
          "--no-sandbox"
        ]
      };

      return new Promise(resolve => {
        spawnPuppeteer([
          outputFile,
          `http://localhost:${port}/`,
          "body",
          successTimeout - parseInt(successTimeout * 0.1, 10),
          "false",
          "true",
          10,
          JSON.stringify(puppeteerLaunchOptions)
        ], resolve);
      });
    });

    it("should fail if insufficient input args", () => {
      fs.rmSync(outputDir, { recursive: true, force: true });
      
      return new Promise((resolve, reject) => {
        spawnPuppeteer([
          outputFile,
          "http://someurl.domain/path/resource"
        ], e => {
          const msg = "expected process error";
          assert.ok(e, msg);
          e ? resolve() : reject(new Error(msg));
        });
      });
    });

    it("should fail with bad url", () => {
      fs.rmSync(outputDir, { recursive: true, force: true });

      new Promise((resolve, reject) => {
        spawnPuppeteer([
          outputFile,
          "http://nonexistent.domain/path/resource",
          "body",
          1000
        ], e => {
          const msg = "expected process error";
          assert.ok(e, msg);
          e ? resolve() : reject(new Error(msg));
        });
      });
    });

    it("should launch debugging", { timeout: successTimeout }, () => {
      const timeout = successTimeout;

      fs.rmSync(outputDir, { recursive: true, force: true });

      new Promise(resolve => {
        spawnPuppeteer([
          outputFile,
          `http://localhost:${port}/`,
          "body",
          timeout - parseInt(timeout * 0.1, 10),
          "false",
          "true",
          10
        ], resolve);
      });
    });

  };
}

module.exports = {
  testSuite: puppeteerTests
};