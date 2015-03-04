/* global describe, it */
var assert = require("assert");
var path = require("path");
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

    it("should not detect an object", function() {
      var result = common.isUrl({ url: "bogus" });
      assert.equal(false, result);
    });
  });

  describe("checkResponse", function () {

    it("should reject a non 200 response", function() {
      var result = common.checkResponse({ statusCode: 206 }, "doesntmatter");
      assert.notEqual(false, result);
    });

    it("should reject for missing content type", function() {
      var result = common.checkResponse({
        statusCode: 200,
        headers: {}
      }, "any");
      assert.notEqual(false, result);
    });

    it("should reject for bad content type, single", function() {
      var result = common.checkResponse({
        statusCode: 200,
        headers: {
          "content-type": "text/plain"
        }
      }, "text/xml");
      assert.notEqual(false, result);
    });

    it("should reject for bad content type, multiple", function() {
      var result = common.checkResponse({
        statusCode: 200,
        headers: {
          "content-type": "text/plain"
        }
      }, ["text/xml", "application/xml"]);
      assert.notEqual(false, result);
    });

    it("should accept for good content type, single", function() {
      var contentType = "text/plain";
      var result = common.checkResponse({
        statusCode: 200,
        headers: {
          "content-type": contentType
        }
      }, contentType);
      assert.equal(false, result);
    });

    it("should accept for good content type, multiple, first", function() {
      var contentType = "text/xml";
      var result = common.checkResponse({
        statusCode: 200,
        headers: {
          "content-type": contentType
        }
      }, [contentType, "application/xml"]);
      assert.equal(false, result);
    });

    it("should accept for good content type, multiple, last", function() {
      var contentType = "text/xml";
      var result = common.checkResponse({
        statusCode: 200,
        headers: {
          "content-type": contentType
        }
      }, ["application/xml", contentType]);
      assert.equal(false, result);
    });
  });
});