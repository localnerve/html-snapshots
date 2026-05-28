/**
 * Async module tests.
 *
 * Copyright (c) 2013 - 2025, Alex Grant, LocalNerve, contributors
 */
const { describe, beforeEach, afterEach, it } = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");
const asyncLib = require("async");
const asyncLocal = require("../../../lib/async/index.js");
const { makeCallback } = require("../html-snapshots/utils.js");

const Notifier = asyncLocal.Notifier;

describe("async", () => {

  describe("Notifier", { concurrency: 1 }, () => {
    let notifier;

    function createFiles (files) {
      let fd;
      files.forEach(function (file) {
        fd = fs.openSync(file, "w");
        fs.closeSync(fd);
      });
    }

    // create a worker for asyncLib.queue
    function worker(file, timeout) {
      return function (cb) {
        setTimeout(function () {
          fs.close(fs.openSync(file, "w"), cb);
        }, timeout);
      };
    }

    var mockInput = {
      EOI: () => true
    };

    beforeEach(() => {
      notifier = new Notifier();
    });

    afterEach(() => {
      notifier._closeWatcher();
    });

    it("should throw if started more than once", () => {
      notifier.start(1000, {}, () => {});

      return new Promise(resolve => {
        assert.throws(() => {
          notifier.start(100, {}, () => {});
        }, err => {
          assert.ok(err instanceof Error);
          resolve();
        });
      });
    });

    it("should throw if add called before start", () => {
      return new Promise (resolve => {
        assert.throws(() => {
          notifier.add();
        }, err => {
          assert.ok(err instanceof Error);
          resolve();
        });
      });
    });

    it("should be able to start and watch files get created", () => {
      const dir = path.join(__dirname, "./files"),
        files = [dir+"/one", dir+"/two", dir+"/three"],
        pollCount = 4,
        timeout = 100;
      
      return new Promise((resolve, reject) => {
        const done = makeCallback(resolve, reject);
        let start;

        fs.rmSync(dir, { recursive: true, force: true });

        // take the worker queue out of the equation
        notifier.qEmpty();

        notifier.start(timeout / pollCount, mockInput, (err, filesDone) => {
          // make sure this wasn't called because of a timeout/failure
          assert.equal(true, (Date.now() - start) < (timeout+asyncLocal.TIMEOUT_PAD_FLOOR));

          // compare filesDone to input files
          if (typeof err === "undefined") {
            files.sort();
            filesDone.sort();
            assert.deepEqual(files, filesDone);

            // audit paths
            //console.log("filesDone paths:");
            //for (var k=0; k < filesDone.length; k++) {
            //  console.log(filesDone);
            //}
          }

          done(err);
        });

        fs.mkdirSync(dir, { recursive: true });
        assert.doesNotThrow(fs.accessSync.bind(null, dir));

        files.forEach(file => {
          notifier.add(file, timeout);
        });

        assert.equal(files.length, notifier._fileCount());
        assert.equal(true, notifier.isStarted());

        start = Date.now();
        createFiles(files);
      });
    });

    it("should be able to start and watch files get created, remove one from the list", () => {
      const dir = path.join(__dirname, "./files"),
        filesToDo = [],
        files = [dir+"/one", dir+"/two", dir+"/three"],
        pollCount = 4,
        timeout = 100;

      return new Promise((resolve, reject) => {
        const done = makeCallback(resolve, reject);
        let start;

        fs.rmSync(dir, { recursive: true, force: true });

        // take the worker queue out of the equation
        notifier.qEmpty();

        notifier.start(timeout / pollCount, mockInput, (err, filesDone) => {
          // make sure this wasn't called because of a timeout/failure
          assert.equal(true, (Date.now() - start) < (timeout+asyncLocal.TIMEOUT_PAD_FLOOR));

          // compare filesDone to input files
          if (typeof err === "undefined") {
            filesToDo.sort();
            filesDone.sort();
            assert.deepEqual(filesToDo, filesDone);
          }

          done(err);
        });

        fs.mkdirSync(dir, { recursive: true });
        assert.doesNotThrow(fs.accessSync.bind(null, dir));

        files.forEach(file => {
          notifier.add(file, timeout);
        });

        notifier.remove(files[2]);
        filesToDo.push(files[0], files[1]);

        assert.equal(files.length-1, notifier._fileCount());
        assert.equal(true, notifier.isStarted());

        start = Date.now();
        createFiles(files);
      });
    });

    it("should be able to start and watch files get created, one doesn't get created", () => {
      const dir = path.join(__dirname, "./files"),
        files = [dir+"/one", dir+"/two", dir+"/three"],
        filesToDo = files.slice(),
        pollCount = 4,
        timeout = 100;
      
      return new Promise((resolve, reject) => {
        const done = makeCallback(resolve, reject);
        let start;

        fs.rmSync(dir, { recursive: true, force: true });

        // take the worker queue out of the equation
        notifier.qEmpty();

        notifier.start(timeout / pollCount, mockInput, (err, filesDone) => {
          // make sure this was called because of a failure
          assert.equal(true, (Date.now() - start) > (timeout+asyncLocal.TIMEOUT_PAD_FLOOR));
          // make sure this was a failure
          assert.notStrictEqual(typeof err, "undefined");

          // compare filesDone to intended filesToDo - should be different
          filesToDo.sort();
          filesDone.sort();
          assert.notDeepEqual(filesToDo, filesDone);

          // compare filesDone to files - should be the same
          files.sort();
          assert.deepEqual(files, filesDone);

          done();
        });

        fs.mkdirSync(dir, { recursive: true });
        assert.doesNotThrow(fs.accessSync.bind(null, dir));

        files.forEach(file => {
          notifier.add(file, timeout);
        });

        assert.equal(files.length, notifier._fileCount());
        assert.equal(true, notifier.isStarted());

        files.splice(1, 1); // remove the second element

        start = Date.now();
        createFiles(files);
      });
    });

    it("should be able to start and watch files get created, none get created", () => {
      const dir = path.join(__dirname, "./files"),
        files = [dir+"/one", dir+"/two", dir+"/three"],
        pollCount = 4,
        timeout = 100;
      
      return new Promise((resolve, reject) => {
        const done = makeCallback(resolve, reject);
        let start;

        fs.rmSync(dir, { recursive: true, force: true });

        // take the worker queue out of the equation
        notifier.qEmpty();

        notifier.start(timeout / pollCount, mockInput, (err, filesDone) => {
          let assertionError;
          try {
            assert.equal(true, (Date.now() - start) > (timeout+asyncLocal.TIMEOUT_PAD_FLOOR));
            assert.notStrictEqual(typeof err, "undefined");
            assert.equal(0, filesDone.length);
          } catch (e) {
            assertionError = e;
          }
          done(assertionError);
        });

        fs.mkdirSync(dir, { recursive: true });
        assert.doesNotThrow(fs.accessSync.bind(null, dir));

        files.forEach(file => {
          notifier.add(file, timeout);
        });

        assert.equal(files.length, notifier._fileCount());
        assert.equal(true, notifier.isStarted());
        start = Date.now();
      });
    });

    it("should fail if no callback supplied", () => {
      const result = notifier.start(1, mockInput);

      assert.equal(result, false);
      assert.equal(0, notifier._fileCount());
      assert.equal(false, notifier.isStarted());
    });

    it("should fail if negative poll interval supplied", () => {
      const result = notifier.start(-1, mockInput, err => {
        assert.fail(err, "[not undefined]", "should never have been called", "?");
      });

      assert.equal(result, false);
      assert.equal(0, notifier._fileCount());
      assert.equal(false, notifier.isStarted());
    });

    it("should fail if zero poll interval supplied", () => {
      const result = notifier.start(0, mockInput, err => {
        assert.fail(err, "[not undefined]", "should never have been called", "?");
      });

      assert.equal(result, false);
      assert.equal(0, notifier._fileCount());
      assert.equal(false, notifier.isStarted());
    });

    it("should fail if no input generator is supplied", () => {
      const result = notifier.start(250, undefined, err => {
        assert.fail(err, "[not undefined]", "should never have been called", "?");
      });

      assert.equal(result, false);
      assert.equal(0, notifier._fileCount());
      assert.equal(false, notifier.isStarted());
    });

    it("should abort if requested, no files done yet", () => {
      const dir = path.join(__dirname, "./files"),
        files = [dir+"/one", dir+"/two", dir+"/three"],
        pollCount = 4,
        timeout = 400,
        abortFailure = new Error("abortFailure");

      return new Promise((resolve, reject) => {
        const done = makeCallback(resolve, reject);

        fs.rmSync(dir, { recursive: true, force: true });

        notifier.start(timeout / pollCount, mockInput, (err, filesDone) => {
          // make sure this was a failure
          assert.notStrictEqual(typeof err, "undefined");

          // make sure we got the expected err
          assert.equal(err, abortFailure);

          // and that no files were done
          assert.equal(filesDone.length, 0);

          done();
        });

        fs.mkdirSync(dir, { recursive: true });
        assert.doesNotThrow(fs.accessSync.bind(null, dir));

        files.forEach(file => {
          notifier.add(file, timeout);
        });

        assert.equal(files.length, notifier._fileCount());
        assert.equal(true, notifier.isStarted());

        notifier.abort({ length: () => 0 }, abortFailure);
      });
    });

    it("should abort if requested, all but one file processed", () => {
      const dir = path.join(__dirname, "./files"),
        files = [dir+"/one", dir+"/two", dir+"/three"],
        filesToDo = files.slice(),
        pollCount = 8,
        timeout = 400,
        abortFailure = new Error("abortFailure");

      return new Promise((resolve, reject) => {
        const done = makeCallback(resolve, reject);

        fs.rmSync(dir, { recursive: true, force: true });

        notifier.start(timeout / pollCount, mockInput, (err, filesDone) => {
          // make sure this was a failure
          assert.notStrictEqual(typeof err, "undefined");

          // make sure we got the expected err
          assert.equal(err, abortFailure);

          // and that one file was not done
          assert.equal(filesToDo.length - 1, filesDone.length);

          done();
        });

        fs.mkdirSync(dir, { recursive: true });
        assert.doesNotThrow(fs.accessSync.bind(null, dir));

        files.forEach(file => {
          notifier.add(file, timeout);
        });

        assert.equal(files.length, notifier._fileCount());
        assert.equal(true, notifier.isStarted());

        files.splice(1, 1); // remove the second element

        createFiles(files);

        // fake out async.queue here. In reality, q.length() would be 1 normally,
        //   but it will never become empty since async.queue doesn't run in this test.
        setTimeout(() => {
          notifier.abort({ length: () => 0 }, abortFailure);
        }, 100);
      });
    });

    it("should abort if requested, all but one file processed, real async", () => {
      const dir = path.join(__dirname, "./files"),
        files = [dir+"/one", dir+"/two", dir+"/three"],
        pollCount = 8,
        timeout = 400,
        abortFailure = new Error("abortFailure");

      return new Promise((resolve, reject) => {
        const done = makeCallback(resolve, reject);

        fs.rmSync(dir, { recursive: true, force: true });

        notifier.start(timeout / pollCount, mockInput, (err, filesDone) => {
          // make sure this was a failure
          assert.notStrictEqual(typeof err, "undefined");

          // make sure we got the expected err
          assert.equal(err, abortFailure);

          // and that one file was not done
          assert.equal(files.length - 2, filesDone.length);

          done();
        });

        fs.mkdirSync(dir, { recursive: true });
        assert.doesNotThrow(fs.accessSync.bind(null, dir));

        // create a worker queue, attach qEmpty
        const q = asyncLib.queue((task, callback) => {
          task(callback);
        }, 1);
        q.empty(notifier.qEmpty.bind(notifier));

        // simulate input activity
        files.forEach(file => {
          notifier.add(file, timeout);
        });

        assert.equal(files.length, notifier._fileCount());
        assert.equal(true, notifier.isStarted());

        // simulate work - files.length workers taking workerTime to complete.
        const workerTime = 40;

        files.forEach(file => {
          q.push(worker(file, workerTime));
        });

        // call abort in the middle of the second to last worker
        // so files.length - 2 workers should have completed since q.concurrent === 1
        setTimeout(() => {
          notifier.abort(q, abortFailure);
        },
          (workerTime * (files.length-1)) - (workerTime/2)
        );
      });
    });
  });
});
