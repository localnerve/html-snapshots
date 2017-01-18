/**
 * html-snapshots test utilities and constants.
 */
/* global require, process */
var path = require("path");
var spawn = require('child_process').spawn;
var assert = require("assert");
var resHelp = require("../../helpers/result");

// Constants
var unexpectedError = new Error("unexpected error flow");
var outputDir = path.join(__dirname, "./tmp/snapshots");
var spawnedProcessPattern = "^phantomjs$";
var bogusFile = "./bogus/file.txt";
var timeout = 20000;

// Count actual phantomjs processes in play, requires pgrep
function countSpawnedProcesses (cb) {
  var pgrep;
  // std mac pgrep doesn't have a count option. How stupid is that?
  if (process.platform === "darwin") {
    var wc = spawn("wc", ["-l"]);
    pgrep = spawn("pgrep", [spawnedProcessPattern]);
    pgrep.stdout.on("data", function (data) {
      wc.stdin.write(data);
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
  pkill.on("exit", cb);
}

// Complete a test and kill any spawned processes.
function cleanup (done, arg) {
  if (process.platform === "win32") {
    setTimeout(done, 3000, arg);
  } else {
    setImmediate(function () {
      killSpawnedProcesses(function() {
        done(arg);
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
  resHelp.mustBeError(err);
  if (completed) {
    assert.equal(count, completed.length);
  }
  assert.equal(Object.prototype.toString.call(err), "[object Error]", "error should be class Error");
  assert.notEqual(typeof err.completed, "undefined", "error.completed should be defined");
  // console.log("@@@ error", err);
  cleanup(done);
}

function cleanupSuccess (done, err, completed) {
  // echo for test log clarity
  // console.log('@@@ result: ' + err +', '+require('util').inspect(completed, {depth:null}));
  assert.notEqual(typeof completed, "undefined", "completed should be defined");
  cleanup(done, err);
}

function testSuccess (cb, completed) {
  assert.equal(Array.isArray(completed), true);
  assert.equal(completed.length > 0, true);
  cb(undefined, completed);
}

function unexpectedSuccess (cb) {
  var errMsg = "unexpected success";
  assert.fail("run", "succeed", errMsg, "should not");
  cleanup(cb, new Error(errMsg));
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
  timeout: timeout
};
