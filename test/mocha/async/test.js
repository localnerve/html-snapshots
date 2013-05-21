var assert = require("assert");
var fs = require("fs");
var path = require("path");
var common = require("../../../lib/common");
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
          timeout = 100;

      common.deleteFolderRecursive(dir);

      notifier.start(dir, done);

      assert.equal(true, fs.existsSync(dir));

      for (var i in files) {
        notifier.add(files[i], timeout);
      }

      assert.equal(files.length, notifier.fileCount());
      assert.equal(true, notifier.isStarted());

      createFiles(files);
    });

    it("should be able to start and watch files get created, remove one from the list", function(done){
      var notifier = new async.Notifier();
      var dir = path.join(__dirname, "./files"),
          files = [dir+"/one", dir+"/two", dir+"/three"],
          timeout = 100;

      common.deleteFolderRecursive(dir);

      notifier.start(dir, done);

      assert.equal(true, fs.existsSync(dir));

      for (var i in files) {
        notifier.add(files[i], timeout);
      }

      notifier.remove(files[2]);

      assert.equal(files.length-1, notifier.fileCount());
      assert.equal(true, notifier.isStarted());

      createFiles(files);
    });

    it("should be able to start and watch files get created, one doesn't get created", function(done){
      var notifier = new async.Notifier();
      var dir = path.join(__dirname, "./files"),
          files = [dir+"/one", dir+"/two", dir+"/three"],
          timeout = 100;

      common.deleteFolderRecursive(dir);

      notifier.start(dir, function(nonErr){
        assert.equal(nonErr, false);
        done();
      });

      assert.equal(true, fs.existsSync(dir));

      for (var i in files) {
        notifier.add(files[i], timeout);
      }

      assert.equal(files.length, notifier.fileCount());
      assert.equal(true, notifier.isStarted());

      files.splice(1, 1);
      createFiles(files);
    });

    it("should be able to start and watch files get created, none get created", function(done){
      var notifier = new async.Notifier();
      var dir = path.join(__dirname, "./files"),
          files = [dir+"/one", dir+"/two", dir+"/three"],
          timeout = 100;

      common.deleteFolderRecursive(dir);

      notifier.start(dir, function(nonErr){
        assert.equal(nonErr, false);
        done();
      });

      assert.equal(true, fs.existsSync(dir));

      for (var i in files) {
        notifier.add(files[i], timeout);
      }

      assert.equal(files.length, notifier.fileCount());
      assert.equal(true, notifier.isStarted());
    });

  });
});