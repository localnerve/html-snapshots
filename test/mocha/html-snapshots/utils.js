/**
 * html-snapshots test utilities and constants.
 */
/* global require, process, Promise */
var path = require("path");
var _ = require("lodash");
var spawn = require('child_process').spawn;
var assert = require("assert");
var combineErrors = require("combine-errors");
var resHelp = require("../../helpers/result");
var pathExists = require("../../../lib/async/exists");

// Constants
var unexpectedError = new Error("unexpected error flow");
var outputDir = path.join(__dirname, "./tmp/snapshots");
var spawnedProcessPattern = "^phantomjs$";
var bogusFile = "./bogus/file.txt";
var timeout = 40000;

function checkActualFiles (files) {
  return Promise.all(files.map(function (file) {
    return pathExists(file)
      .then(function (result) {
        if (result) {
          console.log('@@@ actually exists:' + file);
        }
        return result;
      });
  }));
}

function multiError () {
  var errors = Array.prototype.slice.call(arguments);

  errors = errors.filter(function (error) {
    return !!error;
  });

  if (errors.length > 0) {
    errors = combineErrors(errors);
  } else {
    errors = undefined;
  }

  return errors;
}

// Count actual phantomjs processes in play, requires pgrep
function countSpawnedProcesses (cb) {
  var wc, pgrep;
  // std mac pgrep doesn't have a count option. How stupid is that?
  if (process.platform === "darwin") {
    wc = spawn("wc", ["-l"]);
    pgrep = spawn("pgrep", [spawnedProcessPattern]);
    pgrep.stdout.on("data", function (data) {
      wc.stdin.write(data);
    });
    pgrep.stdout.on("end", function () {
      wc.stdin.end();
    });
    wc.stdout.on("data", cb);
  } else {
    pgrep = spawn("pgrep", [spawnedProcessPattern, "-c"]);
    pgrep.stdout.on("data", cb);
  }
}

// Clear any lingering phantomjs processes in play
function killSpawnedProcesses (cb) {
  var pkill = spawn("pkill", [spawnedProcessPattern]);
  var guardedCb = _.once(cb);

  pkill.on("exit", function () {
    guardedCb();
  });
  pkill.on("error", function () {
    guardedCb(new Error("failed to kill phantomjs processes"));
  });
}

// Complete a test and kill any spawned processes.
function cleanup (done, arg) {
  if (process.platform === "win32") {
    setTimeout(done, 1000, arg);
  } else {
    setImmediate(function () {
      killSpawnedProcesses(function (err) {
        done(multiError(err, arg));
      });
    });
  }
}

/**
 * Verify received error and cleanup running processes.
 * @param {Function} done - The finalization callback.
 * @param {Number} count - The number of expected completed results.
 * @param {String|Object} err - The error.
 */
function cleanupError (done, count, err, completed) {
  var assertionError;

  try {
    resHelp.mustBeError(err);
    if (completed) {
      assert.equal(count, completed.length);
    }
    assert.ok(err instanceof Error, "should be instanceof Error");
    assert.notEqual(typeof err.completed, "undefined", "error.completed should be defined");
  } catch (e) {
    assertionError = e;
  }

  cleanup(done, assertionError);
}

function cleanupSuccess (done, err, completed) {
  var assertionError;

  try {
    assert.notEqual(typeof completed, "undefined", "completed should be defined");
  } catch (e) {
    assertionError = e;
  }

  cleanup(done, multiError(err, assertionError));
}

function testSuccess (cb, completed) {
  var assertionError;

  try {
    assert.equal(Array.isArray(completed), true);
    assert.equal(completed.length > 0, true);
  } catch (e) {
    assertionError = e;
  }

  cb(assertionError, completed);
}

function unexpectedSuccess (cb) {
  cleanup(cb, new Error("unexpected success"));
}

module.exports = {
  countSpawnedProcesses: countSpawnedProcesses,
  killSpawnedProcesses: killSpawnedProcesses,
  cleanup: cleanup,
  cleanupError: cleanupError,
  cleanupSuccess: cleanupSuccess,
  testSuccess: testSuccess,
  unexpectedSuccess: unexpectedSuccess,
  unexpectedError: unexpectedError,
  outputDir: outputDir,
  bogusFile: bogusFile,
  multiError: multiError,
  checkActualFiles: checkActualFiles,
  timeout: timeout
};
