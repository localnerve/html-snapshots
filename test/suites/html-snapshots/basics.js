/**
 * Basic library tests.
 *
 * Copyright (c) 2013 - 2025, Alex Grant, LocalNerve, contributors
 */
const { it } = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");
const ss = require("../../../lib/html-snapshots");
const utils = require("./utils");
const optHelp = require("../../helpers/options");
const { after } = require("../../helpers/func");

// missing destructuring, will write postcard...
const {
  bogusFile,
  cleanupError,
  unexpectedSuccess,
  makeCallback
} = utils;

function basicTests (options) {
  const {
    browsers,
    puppeteerLaunchOptions
  } = options;
  return function () {
    browsers.forEach(browser => {
      it(`no arguments should fail - ${browser}`, () => {
        return new Promise((resolve ,reject) => {
          const done = makeCallback(resolve, reject);
          const twice = after(2, cleanupError.bind(null, done, 0));

          ss.run(optHelp.decorate({
            browser,
            puppeteerLaunchOptions
          }), twice)
          .then(unexpectedSuccess.bind(null, done))
          .catch(twice);
        });
      });

      it(`invalid source should fail - ${browser}`, () => {
        return new Promise((resolve, reject) => {
          const done = makeCallback(resolve, reject);
          const twice = after(2, cleanupError.bind(null, done, 0));

          ss.run(optHelp.decorate({
            source: bogusFile,
            browser,
            puppeteerLaunchOptions
          }), twice)
          .then(unexpectedSuccess.bind(null, done))
          .catch(twice);
        });
      });

      it(`should clean the output directory when specified - ${browser}`, () => {
        return new Promise((resolve, reject) => {
          const done = makeCallback(resolve, reject);
          const dir = path.join(__dirname, "./tmpdir");
          const file = path.join(dir, "somefile.txt");
          const twice = after(2, cleanupError.bind(null, done, 0));

          fs.mkdirSync(dir);
          fs.writeFileSync(file, "some data");
          assert.doesNotThrow(fs.accessSync.bind(null, dir));

          ss.run(optHelp.decorate({
            source: bogusFile,
            outputDir: dir,
            outputDirClean: true,
            browser,
            puppeteerLaunchOptions
          }), twice)
          .then(unexpectedSuccess.bind(null, done))
          .catch(twice);

          assert.throws(fs.accessSync.bind(null, dir));
        });
      });

      it(`default snapshot script should exist - ${browser}`, () =>  {
        return new Promise((resolve, reject) => {
          const done = makeCallback(resolve, reject);
          const options = { source: "./bogus/file.txt", browser, puppeteerLaunchOptions };
          const twice = after(2, cleanupError.bind(null, done, 0));

          const result = ss.run(optHelp.decorate(options), twice);

          assert.doesNotThrow(fs.accessSync.bind(null, options.snapshotScript));

          result
            .then(unexpectedSuccess.bind(null, done))
            .catch(twice);
        });
      });
    });
  };
}

module.exports = {
  testSuite: basicTests
};
