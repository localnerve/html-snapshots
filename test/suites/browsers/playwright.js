/**
 * Tests that target the playwright script specifically.
 * 
 * Copyright (c) 2013 - 2025, Alex Grant, LocalNerve, contributors
 */
const { before, after, it } = require("node:test");
const assert = require("node:assert");
const path = require("node:path");
const fs = require("node:fs");
const spawn = require("node:child_process").spawn;
const createServer = require("../../server");

const outputDir = path.join(__dirname, "tmp");
const port = 9341;
const successTimeout = 20000;

function playwrightTests () {
  const snapshotScript = path.resolve(__dirname, "../../../lib/playwright/index.js");
  const outputFile = path.join(outputDir, "snapshot.html");

  /**
   * Launch the playwright script as a process.
   *
   * @param {Array} args - array of playwright args
   */
  function spawnPlaywright (args, done) {
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
    let server;

    before(async () => {
      server = createServer();
      await server.start(path.join(__dirname, "./server"), port);
    });

    after(async () => {
      await server.stop();
    })
    
    it("should succeed with minimal args", { timeout: successTimeout }, () => {
      fs.rmSync(outputDir, { recursive: true, force: true });

      new Promise (resolve => {
        spawnPlaywright([
          outputFile,
          `http://localhost:${port}/`,
          "body"
        ], resolve);
      });
    });

    it("should succeed with stringified playwrightLaunchOptions", { timeout: successTimeout }, () => {
      fs.rmSync(outputDir, { recursive: true, force: true });

      // override the debug options to prove stringified launch opts worked.
      const playwrightLaunchOptions = {
        headless: true,
        devTools: false,
        args: [
          "--no-sandbox"
        ]
      };

      return new Promise(resolve => {
        spawnPlaywright([
          outputFile,
          `http://localhost:${port}/`,
          "body",
          successTimeout - parseInt(successTimeout * 0.1, 10),
          "false",
          "true",
          10,
          JSON.stringify(playwrightLaunchOptions)
        ], resolve);
      });
    });

    it("should fail if insufficient input args", () => {
      fs.rmSync(outputDir, { recursive: true, force: true });
      
      return new Promise((resolve, reject) => {
        spawnPlaywright([
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
        spawnPlaywright([
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
        spawnPlaywright([
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
  testSuite: playwrightTests
};