/* global describe, it */
var assert = require("assert");
var fs = require("fs");
var path = require("path");
var mkdirp = require("mkdirp");
var rimraf = require("rimraf").sync;
var async = require("../../../lib/async");
var asyncLib = require("async");

describe("async", function(){

  describe("Notifier", function(){

    function createFiles(files) {
      var fd;
      files.forEach(function(file) {
        fd = fs.openSync(file, 'w');
        fs.closeSync(fd);
      });
    }

    // create a worker for asyncLib.queue
    function worker(file, timeout) {
      return function(cb) {
        setTimeout(function() {
          fs.close(fs.openSync(file, 'w'), cb);
        }, timeout);
      };
    }

    var mockInput = {
      EOI: function() { return true; }
    };

    it("should be able to call add and remove to effect the files (without starting)", function(done){
      var notifier = new async.Notifier();
      var timeout = 100;
      notifier.add("one", timeout);
      notifier.add("two", timeout);
      notifier.add("three", timeout);
      notifier.remove("two");

      assert.equal(false, notifier.isStarted());
      assert.equal(2, notifier.fileCount());
      assert.equal(true, notifier.exists("one"));
      assert.equal(false, notifier.exists("two"));
      assert.equal(true, notifier.exists("three"));

      setTimeout((function(done){
        return function() {
          assert.equal(0, notifier.fileCount());
          done();
        };
      })(done), 500);
    });

    it("should be able to start and watch files get created", function(done){
      var notifier = new async.Notifier();
      var dir = path.join(__dirname, "./files"),
          files = [dir+"/one", dir+"/two", dir+"/three"],
          pollCount = 4,
          timeout = 100;

      rimraf(dir);

      // take the worker queue out of the equation
      notifier.qEmpty();

      var start;
      notifier.start(timeout / pollCount, function(err, filesDone) {
        // make sure this wasn't called because of a timeout/failure
        assert.equal(true, (Date.now() - start) < (timeout+notifier.padTimeoutFloor()));
        
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
      }, mockInput);

      mkdirp.sync(dir);
      assert.equal(true, fs.existsSync(dir));

      files.forEach(function(file) {
        notifier.add(file, timeout);
      });

      assert.equal(files.length, notifier.fileCount());
      assert.equal(true, notifier.isStarted());

      start = Date.now();
      createFiles(files);
    });

    it("should be able to start and watch files get created, remove one from the list", function(done){
      var notifier = new async.Notifier();
      var dir = path.join(__dirname, "./files"),
          filesToDo = [],
          files = [dir+"/one", dir+"/two", dir+"/three"],
          pollCount = 4,
          timeout = 100;

      rimraf(dir);

      // take the worker queue out of the equation
      notifier.qEmpty();

      var start;
      notifier.start(timeout / pollCount, function(err, filesDone) {
        // make sure this wasn't called because of a timeout/failure
        assert.equal(true, (Date.now() - start) < (timeout+notifier.padTimeoutFloor()));

        // compare filesDone to input files
        if (typeof err === "undefined") {
          filesToDo.sort();
          filesDone.sort();
          assert.deepEqual(filesToDo, filesDone);
        }

        done(err);
      }, mockInput);

      mkdirp.sync(dir);
      assert.equal(true, fs.existsSync(dir));

      files.forEach(function(file) {
        notifier.add(file, timeout);
      });

      notifier.remove(files[2]);
      filesToDo.push(files[0], files[1]);

      assert.equal(files.length-1, notifier.fileCount());
      assert.equal(true, notifier.isStarted());

      start = Date.now();
      createFiles(files);
    });

    it("should be able to start and watch files get created, one doesn't get created", function(done){
      var notifier = new async.Notifier();
      var dir = path.join(__dirname, "./files"),
          files = [dir+"/one", dir+"/two", dir+"/three"],
          filesToDo = files.slice(),
          pollCount = 4,
          timeout = 100;

      rimraf(dir);

      // take the worker queue out of the equation
      notifier.qEmpty();

      var start;
      notifier.start(timeout / pollCount, function(err, filesDone) {
        // make sure this was called because of a failure
        assert.equal(true, (Date.now() - start) > (timeout+notifier.padTimeoutFloor()));
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
      }, mockInput);

      mkdirp.sync(dir);
      assert.equal(true, fs.existsSync(dir));

      files.forEach(function(file) {
        notifier.add(file, timeout);
      });

      assert.equal(files.length, notifier.fileCount());
      assert.equal(true, notifier.isStarted());

      files.splice(1, 1); // remove the second element

      start = Date.now();
      createFiles(files);
    });

    it("should be able to start and watch files get created, none get created", function(done){
      var notifier = new async.Notifier();
      var dir = path.join(__dirname, "./files"),
          files = [dir+"/one", dir+"/two", dir+"/three"],
          pollCount = 4,
          timeout = 100;

      rimraf(dir);

      // take the worker queue out of the equation
      notifier.qEmpty();
      
      var start;
      notifier.start(timeout / pollCount, function(err, filesDone){
        assert.equal(true, (Date.now() - start) > (timeout+notifier.padTimeoutFloor()));
        assert.notStrictEqual(typeof err, "undefined");
        assert.equal(0, filesDone.length);
        done();
      }, mockInput);

      mkdirp.sync(dir);
      assert.equal(true, fs.existsSync(dir));

      files.forEach(function(file) {
        notifier.add(file, timeout);
      });

      assert.equal(files.length, notifier.fileCount());
      assert.equal(true, notifier.isStarted());
      start = Date.now();
    });

    it("should fail if no callback supplied", function() {
      var notifier = new async.Notifier();

      var result = notifier.start(1, {}, mockInput);

      assert.equal(result, false);
      assert.equal(0, notifier.fileCount());
      assert.equal(false, notifier.isStarted());
    });

    it("should fail if negative poll interval supplied", function() {
      var notifier = new async.Notifier();

      var result = notifier.start(-1, function(err){
        assert.fail(err, "[not undefined]", "should never have been called", "?");
      }, mockInput);

      assert.equal(result, false);
      assert.equal(0, notifier.fileCount());
      assert.equal(false, notifier.isStarted());
    });

    it("should fail if zero poll interval supplied", function() {
      var notifier = new async.Notifier();

      var result = notifier.start(0, function(err){
        assert.fail(err, "[not undefined]", "should never have been called", "?");
      }, mockInput);

      assert.equal(result, false);
      assert.equal(0, notifier.fileCount());
      assert.equal(false, notifier.isStarted());
    });

    it("should fail if no input generator is supplied", function() {
      var notifier = new async.Notifier();

      var result = notifier.start(250, function(err){
        assert.fail(err, "[not undefined]", "should never have been called", "?");
      });

      assert.equal(result, false);
      assert.equal(0, notifier.fileCount());
      assert.equal(false, notifier.isStarted());
    });

    it("should abort if requested, no files done yet", function(done) {
      var notifier = new async.Notifier();
      var dir = path.join(__dirname, "./files"),
          files = [dir+"/one", dir+"/two", dir+"/three"],
          pollCount = 4,
          timeout = 400,
          abortFailure = "abortFailure";

      rimraf(dir);

      var start;
      notifier.start(timeout / pollCount, function(err, filesDone) {
        // make sure this was a failure
        assert.notStrictEqual(typeof err, "undefined");

        // make sure we got the expected err
        assert.equal(err, abortFailure);

        // and that no files were done
        assert.equal(filesDone.length, 0);

        done();
      }, mockInput);

      mkdirp.sync(dir);
      assert.equal(true, fs.existsSync(dir));

      files.forEach(function(file) {
        notifier.add(file, timeout);
      });

      assert.equal(files.length, notifier.fileCount());
      assert.equal(true, notifier.isStarted());

      start = Date.now();

      notifier.abort({ length: function() { return 0; } }, abortFailure);
    });

    it("should abort if requested, all but one file processed", function(done) {
      var notifier = new async.Notifier();
      var dir = path.join(__dirname, "./files"),
          files = [dir+"/one", dir+"/two", dir+"/three"],
          filesToDo = files.slice(),
          pollCount = 8,
          timeout = 400,
          abortFailure = "abortFailure";

      rimraf(dir);

      var start;
      notifier.start(timeout / pollCount, function(err, filesDone) {
        // make sure this was a failure
        assert.notStrictEqual(typeof err, "undefined");

        // make sure we got the expected err
        assert.equal(err, abortFailure);

        // and that one file was not done
        assert.equal(filesToDo.length - 1, filesDone.length);

        done();
      }, mockInput);

      mkdirp.sync(dir);
      assert.equal(true, fs.existsSync(dir));

      files.forEach(function(file) {
        notifier.add(file, timeout);
      });

      assert.equal(files.length, notifier.fileCount());
      assert.equal(true, notifier.isStarted());

      files.splice(1, 1); // remove the second element

      start = Date.now();
      createFiles(files);
      
      // fake out async.queue here. In reality, q.length() would be 1 normally,
      //   but it will never become empty since async.queue doesn't run in this test.
      setTimeout(function() {
        notifier.abort({ length: function() { return 0; } }, abortFailure);
      }, 100);
    });

    it("should abort if requested, all but one file processed, real async", function(done) {
      var notifier = new async.Notifier();
      var dir = path.join(__dirname, "./files"),
          files = [dir+"/one", dir+"/two", dir+"/three"],
          pollCount = 8,
          timeout = 400,
          abortFailure = "abortFailure";

      rimraf(dir);

      var start;
      notifier.start(timeout / pollCount, function(err, filesDone) {
        // make sure this was a failure
        assert.notStrictEqual(typeof err, "undefined");

        // make sure we got the expected err
        assert.equal(err, abortFailure);

        // and that one file was not done
        assert.equal(files.length - 2, filesDone.length);

        done();
      }, mockInput);

      mkdirp.sync(dir);
      assert.equal(true, fs.existsSync(dir));

      // create a worker queue, attach qEmpty
      var q = asyncLib.queue(function(task, callback) {
        task(callback);
      }, 1);
      q.empty = notifier.qEmpty;

      // simulate input activity
      files.forEach(function(file) {
        notifier.add(file, timeout);
      });

      assert.equal(files.length, notifier.fileCount());
      assert.equal(true, notifier.isStarted());

      // simulate work - files.length workers taking workerTime to complete.
      var workerTime = 40;
      start = Date.now();
      files.forEach(function(file) {
        q.push(worker(file, workerTime));
      });
      
      // call abort in the middle of the second to last worker
      // so files.length - 2 workers should have completed since q.concurrent === 1
      setTimeout(function() {
        notifier.abort(q, abortFailure);
      },
        (workerTime * (files.length-1)) - (workerTime/2)
      );
    });
  });
});