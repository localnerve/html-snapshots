var assert = require("assert");
var path = require("path");
var fs = require("fs");
var mkdirp = require("mkdirp");
var common = require("../../../lib/common");

describe("common", function(){

  describe("ensure", function(){

    it("should return the options if no defaults specified", function(){
      var options = { one: "one", two: "two", three: "three" };
      var result = common.ensure(options);
      assert.equal(result.toString(), options.toString());
    });

    it("should return the result options", function(){
      var defaults = { one: "two", two: "three", three: "four" };
      var options = { one: "one", two: "two", three: "three" };
      var result = common.ensure(options, defaults);
      assert.equal(result.toString(), options.toString());
    });

    it("should not copy defaults when specified in options", function(){
      var defaults = { one: "two", two: "three", three: "four" };
      var options = { one: "one", two: "two", three: "three" };
      common.ensure(options, defaults);
      assert.equal("one", options.one);
      assert.equal("two", options.two);
      assert.equal("three", options.three);
    });

    it("should copy defaults when not specified in options", function(){
      var defaults = { one: "two", two: "three", three: "four" };
      var options = { one: "one", two: "two" };
      common.ensure(options, defaults);
      assert.equal("one", options.one);
      assert.equal("two", options.two);
      assert.equal("four", options.three);
    });
  });

  describe("extend", function(){

    it("should return the options if no sources specified", function(){
      var options = { one: "one", two: "two", three: "three" };
      var result = common.extend(options);
      assert.equal(result.toString(), options.toString());
    });

    it("should leave options untouched if empty source specified", function(){
      var options = { one: "one", two: "two", three: "three" };
      var result = common.extend(options, {});
      assert.equal(result.toString(), options.toString());
    });

    it("should overwrite destination properties", function(){
      var defaults = { one: "two", two: "three", three: "four" };
      var options = { one: "one", two: "two", three: "three" };
      var result = common.extend(defaults, options);
      assert.equal(result.toString(), options.toString());
    });

    it("should overwrite and mix destination properties", function(){
      var defaults = { one: "two", two: "three", four: "four" };
      var options = { one: "one", two: "two", three: "three" };
      var result = common.extend(defaults, options);
      assert.equal(options.toString(), { one: "one", two: "two", three: "three" }.toString());
      assert.equal(result.toString(), { one: "one", two: "two", three: "three", four: "four" }.toString());
    });

    it("should mix a new destination", function(){
      var defaults = { one: "two", two: "three", four: "four" };
      var options = { one: "one", two: "two", three: "three" };
      var result = common.extend({}, defaults, options);
      assert.equal({ one: "two", two: "three", four: "four" }.toString(), defaults.toString());
      assert.equal({ one: "one", two: "two", three: "three" }.toString(), options.toString());
      assert.equal(result.toString(), { one: "one", two: "two", three: "three", four: "four" }.toString());
    });

  });

  describe("isUrl", function(){

    it("should detect an http url", function(){
      var result = common.isUrl("http://whatever.com/");
      assert.equal(true, result);
    });

    it("should not detect a file", function(){
      var result = common.isUrl(path.join(__dirname, __filename));
      assert.equal(false, result);
    });
  });

  describe("deleteFolderRecursive", function(){
    var dir = "./does/not/exist";

    it("should work if no directory exists", function(){
      assert.equal(false, fs.existsSync(dir));
      common.deleteFolderRecursive(dir);
      assert.equal(false, fs.existsSync(dir));
    });

    it("should work on relative path", function(){
      assert.equal(false, fs.existsSync(dir));
      mkdirp.sync(dir);
      assert.equal(true, fs.existsSync(dir));
      common.deleteFolderRecursive(dir);
      assert.equal(false, fs.existsSync(dir));
      var doesNot = dir.replace("exist", "");
      fs.rmdirSync(doesNot);
      fs.rmdirSync(path.join(".", doesNot.replace("not", "")));
    });

    it("should work on a absolute path", function(){
      var absDir = path.join(__dirname, dir);
      assert.equal(false, fs.existsSync(absDir));
      mkdirp.sync(absDir);
      assert.equal(true, fs.existsSync(absDir));
      common.deleteFolderRecursive(absDir);
      assert.equal(false, fs.existsSync(absDir));
    });

    it("should leave the path intact except the target folder", function(){
      var doesNot = path.join(__dirname, dir).replace("exist", "");
      assert.equal(true, fs.existsSync(doesNot));
    });
  });
});