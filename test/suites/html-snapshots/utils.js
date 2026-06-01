/**
 * html-snapshots test debug utilities and constants.
 *
 * Copyright (c) 2013 - 2025, Alex Grant, LocalNerve, contributors
 */
const path = require("node:path");
const fs = require("node:fs");
const { execFile } = require("node:child_process");
const assert = require("node:assert");
const resHelp = require("../../helpers/result");
const pathExists = require("../../../lib/async/exists");

// Constants
const unexpectedError = new Error("unexpected error flow");
const outputDir = path.join(__dirname, "./tmp/snapshots");
const bogusFile = "./bogus/file.txt";
const timeout = 20000;

function dumpTree (p) {
  fs.readdirSync(p).forEach(file => {
    const curPath = path.join(p, path.sep, file);
    const stats = fs.statSync(curPath);

    if (stats.isDirectory()) {
      dumpTree(curPath);
    } else if (stats.isFile(curPath)) {
      console.log("@@@ exists: " + curPath);
    }
  });
}

function checkActualFiles (files) {
  let shortFile, outputRoot;

  if (files.length > 0) {
    shortFile = outputDir;
    /*
    shortFile = files.reduce(function (prev, curr) {
      if (curr.length < prev.length) {
        prev = curr;
      }
      return prev;
    }, files[0]);
    */
    let exists = false; // toggle to dumpTree
    outputRoot = path.dirname(shortFile);
    try {
      fs.statSync(outputRoot).isDirectory();
    }
    catch {
      console.log("@@@ outputRoot not exist", outputRoot);
    }
    if (exists) {
      dumpTree(outputRoot);
    }
  }

  return Promise.all(files.map(file => {
    return pathExists(file)
      .then(result => {
        if (result) {
          console.log("@@@ actually exists:" + file);
        }
        return result;
      });
  }));
}

function multiError (...errors) {
  errors = errors.filter(error => 
    (error instanceof Error) || (error instanceof AggregateError)
  ).map(error =>
    (error instanceof AggregateError) ? error.errors : error
  ).flat();

  if (errors.length === 0) return undefined;
  if (errors.length === 1) return errors[0];
  return new AggregateError(errors);
}

// ---------------------------------------------------------------------------
// Process detection
// ---------------------------------------------------------------------------

/**
 * Return the chromium/chrome executable name used by Puppeteer on this
 * platform so we can match it in `ps` output.
 */
function chromiumPattern () {
  // Puppeteer on macOS unpacks "Chromium" or "Google Chrome for Testing";
  // on Linux the binary is typically "chrome" or "chromium".
  if (process.platform === "darwin") {
    return "(Chromium|chrome|Google Chrome for Testing)";
  }
  return "(chrome|chromium|Chromium)";
}

/**
 * Build a `ps` command that lists every process whose PPID is (directly or
 * transitively) a descendant of the current process, returning only the
 * `comm` (command basename) column.
 *
 * We deliberately stay with `ps` rather than `pgrep` because:
 *  - `ps` exists and behaves consistently on both Linux and macOS
 *  - we can filter on PPID rather than just name, avoiding false matches
 *    against unrelated Node processes on the same machine
 */
function psDescendants (cb) {
  // List pid, ppid, and comm for all processes so we can walk the tree.
  // `-A` (all processes) is POSIX-portable; `-o` selects columns.
  execFile("ps", ["-A", "-o", "pid=,ppid=,comm="], (err, stdout) => {
    if (err) return cb(err, []);

    const rows = stdout.trim().split("\n").map(line => {
      const parts = line.trim().split(/\s+/);
      return {
        pid: parseInt(parts[0], 10),
        ppid: parseInt(parts[1], 10),
        comm: parts.slice(2).join(" ")  // comm may contain spaces on macOS
      };
    });

    // Collect the full set of descendant PIDs via BFS from our own PID.
    const ours = new Set([process.pid]);
    let changed = true;
    while (changed) {
      changed = false;
      for (const row of rows) {
        if (!ours.has(row.pid) && ours.has(row.ppid)) {
          ours.add(row.pid);
          changed = true;
        }
      }
    }

    // Return only the descendant rows (excluding the test runner itself).
    const descendants = rows.filter(r => ours.has(r.pid) && r.pid !== process.pid);
    cb(null, descendants);
  });
}

/**
 * Count spawned web-renderer processes currently alive under this test runner.
 *
 * For PhantomJS:  matches the `phantomjs` binary name directly.
 * For Puppeteer:  matches Chromium/Chrome binaries in our process subtree.
 *                 We intentionally exclude Node children so the test runner
 *                 and its worker threads don't pollute the count.
 *
 * Calls cb(err, count) — count is always a plain Number.
 *
 * @param {"phantomjs"|"puppeteer"} browser
 * @param {function(Error|null, number): void} cb
 */
function countSpawnedProcesses (browser, cb) {
  psDescendants((err, descendants) => {
    if (err) return cb(err, 0);

    let pattern;
    if (browser === "phantomjs") {
      pattern = /^phantomjs$/i;
    } else {
      // Puppeteer: count top-level Chromium launcher processes only.
      // Exclude --type=* renderer/gpu/utility subprocesses to avoid
      // multiplying the count by Chromium's internal process model.
      pattern = new RegExp(chromiumPattern(), "i");
    }

    const count = descendants.filter(r => pattern.test(r.comm)).length;
    cb(null, count);
  });
}

/**
 * Kill all spawned web-renderer processes that are children of this process.
 * Waits 2 s after killing to let the OS reclaim PIDs before a new test starts.
 *
 * @param {"phantomjs"|"puppeteer"} browser
 * @param {function(Error|null): void} cb
 */
function killSpawnedProcesses (browser, cb) {
  psDescendants((err, descendants) => {
    if (err) return cb(err);

    let pattern;
    if (browser === "phantomjs") {
      pattern = /^phantomjs$/i;
    } else {
      pattern = new RegExp(chromiumPattern(), "i");
    }

    const targets = descendants
      .filter(r => pattern.test(r.comm))
      .map(r => r.pid);

    if (targets.length === 0) {
      return cb();
    }

    // Send SIGTERM to each target; ignore ESRCH (already gone).
    for (const pid of targets) {
      try { process.kill(pid, "SIGTERM"); } catch { /* already dead */ }
    }

    cb();
  });
}

// ---------------------------------------------------------------------------
/*
// Count actual phantomjs processes in play, requires pgrep
function countSpawnedProcesses (cb) {
  let wc, pgrep;
  // std mac pgrep doesn't have a count option. How stupid is that?
  if (process.platform === "darwin") {
    wc = spawn("wc", ["-l"]);
    pgrep = spawn("pgrep", [spawnedProcessPattern]);
    pgrep.stdout.on("data", data => {
      wc.stdin.write(data);
    });
    pgrep.stdout.on("end", () => {
      wc.stdin.end();
    });
    wc.stdout.on("data", cb);
  } else {
    pgrep = spawn("pgrep", [spawnedProcessPattern, "-c"]);
    pgrep.stdout.on("data", cb);
  }
}

// Clear any lingering browser processes in play
function killSpawnedProcesses (cb) {
  const pkill = spawn("pkill", [spawnedProcessPattern]);
  const guardedCb = common.once(cb);

  pkill.on("exit", () => {
    setTimeout(guardedCb, 2000);
  });
  pkill.on("error", () => {
    guardedCb(new Error("failed to kill browser processes"));
  });
}
*/

// Complete a test and kill any spawned processes.
function cleanup (browser, done, arg) {
  if (process.platform === "win32") {
    setTimeout(done, 10, arg);
  } else {
    setImmediate(() => {
      killSpawnedProcesses(browser, err => {
        done(multiError(err, arg));
      });
    });
  }
}

/**
 * Verify received error and cleanup running processes.
 * @param {String} browser - The browser type string.
 * @param {Function} done - The finalization callback.
 * @param {Number} count - The number of expected completed results.
 * @param {String|Object} err - The error.
 */
function cleanupError (browser, done, count, err, completed) {
  let assertionError;

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

  cleanup(browser, done, assertionError);
}

function cleanupSuccess (browser, done, err, completed) {
  let assertionError;

  try {
    assert.notEqual(typeof completed, "undefined", "completed should be defined");
  } catch (e) {
    assertionError = e;
  }

  cleanup(browser, done, multiError(err, assertionError));
}

function testSuccess (cb, completed) {
  let assertionError;

  try {
    assert.equal(Array.isArray(completed), true);
    assert.equal(completed.length > 0, true);
  } catch (e) {
    assertionError = e;
  }

  cb(assertionError, completed);
}

function unexpectedSuccess (browser, cb) {
  cleanup(browser, cb, new Error("unexpected success"));
}

function makeCallback (resolve, reject) {
  return e => {
    if (e) return reject(e);
    resolve();
  }
}

module.exports = {
  countSpawnedProcesses,
  killSpawnedProcesses,
  cleanup,
  cleanupError,
  cleanupSuccess,
  testSuccess,
  unexpectedSuccess,
  unexpectedError,
  outputDir,
  bogusFile,
  multiError,
  makeCallback,
  checkActualFiles,
  timeout
};
