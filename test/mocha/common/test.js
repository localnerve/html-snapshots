var assert = require("assert");
var path = require("path");
var fs = require("fs");
var mkdirp = require("mkdirp");
var rimraf = require("rimraf").sync;
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
});