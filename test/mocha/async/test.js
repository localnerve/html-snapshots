var assert = require("assert");
var fs = require("fs");
var path = require("path");
var mkdirp = require("mkdirp");
var rimraf = require("rimraf").sync;
var async = require("../../../lib/async");

describe("async", function(){

  describe("Notifier", function(){

    function createFiles(files) {
      var fd;
      for (var i in files) {
        fd = fs.openSync(files[i], 'w');
        fs.closeSync(fd);
      }
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

      var start;
      notifier.start(timeout / pollCount, function(nonErr, filesDone) {
        // make sure this wasn't called because of a timeout/failure
        assert.equal(true, (Date.now() - start) < (timeout+notifier.padTimeoutFloor()));
        
        // compare filesDone to input files
        if (typeof nonErr === "undefined") {
          files.sort();
          filesDone.sort();
          assert.deepEqual(files, filesDone);

          // audit paths
          //console.log("filesDone paths:");
          //for (var k=0; k < filesDone.length; k++) {
          //  console.log(filesDone);
          //}
        }

        done(nonErr);
      }, mockInput);

      mkdirp.sync(dir);
      assert.equal(true, fs.existsSync(dir));

      for (var i in files) {
        notifier.add(files[i], timeout);
      }

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

      var start;
      notifier.start(timeout / pollCount, function(nonErr, filesDone) {
        // make sure this wasn't called because of a timeout/failure
        assert.equal(true, (Date.now() - start) < (timeout+notifier.padTimeoutFloor()));

        // compare filesDone to input files
        if (typeof nonErr === "undefined") {
          filesToDo.sort();
          filesDone.sort();
          assert.deepEqual(filesToDo, filesDone);
        }

        done(nonErr);
      }, mockInput);

      mkdirp.sync(dir);
      assert.equal(true, fs.existsSync(dir));

      for (var i in files) {
        notifier.add(files[i], timeout);
      }

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

      var start;
      notifier.start(timeout / pollCount, function(nonErr, filesDone) {
        // make sure this was called because of a failure
        assert.equal(true, (Date.now() - start) > (timeout+notifier.padTimeoutFloor()));
        // make sure this was a failure
        assert.strictEqual(nonErr, false);

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

      for (var i in files) {
        notifier.add(files[i], timeout);
      }

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

      var start;
      notifier.start(timeout / pollCount, function(nonErr, filesDone){
        assert.equal(true, (Date.now() - start) > (timeout+notifier.padTimeoutFloor()));
        assert.strictEqual(nonErr, false);
        assert.equal(0, filesDone.length);
        done();
      }, mockInput);

      mkdirp.sync(dir);
      assert.equal(true, fs.existsSync(dir));

      for (var i in files) {
        notifier.add(files[i], timeout);
      }

      assert.equal(files.length, notifier.fileCount());
      assert.equal(true, notifier.isStarted());
      start = Date.now();
    });

    it("should fail if no callback supplied", function() {
      var notifier = new async.Notifier();
      var dir = path.join(__dirname, "./files"),
          files = [dir+"/one", dir+"/two", dir+"/three"],
          timeout = 100;

      var result = notifier.start(1, {}, mockInput);

      assert.equal(result, false);
      assert.equal(0, notifier.fileCount());
      assert.equal(false, notifier.isStarted());
    });

    it("should fail if negative poll interval supplied", function() {
      var notifier = new async.Notifier();
      var dir = path.join(__dirname, "./files"),
          files = [dir+"/one", dir+"/two", dir+"/three"],
          timeout = 100;

      var result = notifier.start(-1, function(nonErr){
        assert.fail(nonErr, false, "should never have been called", "?");
      }, mockInput);

      assert.equal(result, false);
      assert.equal(0, notifier.fileCount());
      assert.equal(false, notifier.isStarted());
    });

    it("should fail if zero poll interval supplied", function() {
      var notifier = new async.Notifier();
      var dir = path.join(__dirname, "./files"),
          files = [dir+"/one", dir+"/two", dir+"/three"],
          timeout = 100;

      var result = notifier.start(0, function(nonErr){
        assert.fail(nonErr, false, "should never have been called", "?");
      }, mockInput);

      assert.equal(result, false);
      assert.equal(0, notifier.fileCount());
      assert.equal(false, notifier.isStarted());
    });

    it("should fail if no input generator is supplied", function() {
      var notifier = new async.Notifier();
      var dir = path.join(__dirname, "./files"),
          files = [dir+"/one", dir+"/two", dir+"/three"],
          timeout = 100;

      var result = notifier.start(250, function(nonErr){
        assert.fail(nonErr, false, "should never have been called", "?");
      });

      assert.equal(result, false);
      assert.equal(0, notifier.fileCount());
      assert.equal(false, notifier.isStarted());
    });
  });
});