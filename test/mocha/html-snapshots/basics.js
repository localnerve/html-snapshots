/**
 * Basic library tests.
 *
 * Copyright (c) 2013 - 2021, Alex Grant, LocalNerve, contributors
 */
/* global it */
var assert = require("assert");
var _ = require("lodash");
var fs = require("fs");
var path = require("path");
var ss = require("../../../lib/html-snapshots");
var utils = require("./utils");
var optHelp = require("../../helpers/options");

// missing destructuring, will write postcard...
var bogusFile = utils.bogusFile;
var cleanupError = utils.cleanupError;
var unexpectedSuccess = utils.unexpectedSuccess;

function basicTests () {
  return function () {
    it("no arguments should fail", function (done) {
      var twice = _.after(2, cleanupError.bind(null, done, 0));

      ss.run(optHelp.decorate({}), twice)
       .then(unexpectedSuccess.bind(null, done))
       .catch(twice);
    });

    it("invalid source should fail", function (done) {
      var twice = _.after(2, cleanupError.bind(null, done, 0));

      ss.run(optHelp.decorate({ source: bogusFile }), twice)
       .then(unexpectedSuccess.bind(null, done))
       .catch(twice);
    });

    it("should clean the output directory when specified", function (done) {
      var dir = path.join(__dirname, "./tmpdir");
      var file = path.join(dir, "somefile.txt");
      var twice = _.after(2, cleanupError.bind(null, done, 0));

      fs.mkdirSync(dir);
      fs.writeFileSync(file, "some data");
      assert.doesNotThrow(fs.accessSync.bind(null, dir));

      ss.run(optHelp.decorate({
       source: bogusFile,
       outputDir: dir,
       outputDirClean: true
      }), twice)
       .then(unexpectedSuccess.bind(null, done))
       .catch(twice);

      assert.throws(fs.accessSync.bind(null, dir));
    });

    it("default snapshot script should exist", function (done) {
      var options = { source: "./bogus/file.txt" };
      var twice = _.after(2, cleanupError.bind(null, done, 0));

      var result = ss.run(optHelp.decorate(options), twice);

      assert.doesNotThrow(fs.accessSync.bind(null, options.snapshotScript));

      result
       .then(unexpectedSuccess.bind(null, done))
       .catch(twice);
    });
  };
}

module.exports = {
  testSuite: basicTests
};
