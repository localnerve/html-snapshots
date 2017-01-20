/* global describe, it */
var assert = require("assert");
var path = require("path");
var common = require("../../../lib/common");

describe("common", function () {

  describe("ensure", function () {

    it("should return the options if no defaults specified", function () {
      var options = { one: "one", two: "two", three: "three" };
      var result = common.ensure(options);
      assert.equal(result.toString(), options.toString());
    });

    it("should return the result options", function () {
      var defaults = { one: "two", two: "three", three: "four" };
      var options = { one: "one", two: "two", three: "three" };
      var result = common.ensure(options, defaults);
      assert.equal(result.toString(), options.toString());
    });

    it("should not copy defaults when specified in options", function () {
      var defaults = { one: "two", two: "three", three: "four" };
      var options = { one: "one", two: "two", three: "three" };
      common.ensure(options, defaults);
      assert.equal("one", options.one);
      assert.equal("two", options.two);
      assert.equal("three", options.three);
    });

    it("should copy defaults when not specified in options", function () {
      var defaults = { one: "two", two: "three", three: "four" };
      var options = { one: "one", two: "two" };
      common.ensure(options, defaults);
      assert.equal("one", options.one);
      assert.equal("two", options.two);
      assert.equal("four", options.three);
    });
  });

  describe("isUrl", function () {

    it("should detect an http url", function () {
      var result = common.isUrl("http://whatever.com/");
      assert.equal(true, result);
    });

    it("should not detect a file", function () {
      var result = common.isUrl(path.join(__dirname, __filename));
      assert.equal(false, result);
    });

    it("should not detect an object", function () {
      var result = common.isUrl({ url: "bogus" });
      assert.equal(false, result);
    });
  });

  describe("prependMsgToErr", function () {

    it("should return undefined if given falsy error", function () {
      var result = common.prependMsgToErr(undefined, "message", true);

      assert.equal(result, undefined);
    });

    it("should return same error if given error and no message", function () {
      // These need to have the same message.
      var error = new Error("my test error");
      var input = new Error("my test error");

      var result = common.prependMsgToErr(input);

      assert.deepEqual(result, error);
    });

    it("should quote the message when asked", function () {
      var msg = "my message";
      var result = common.prependMsgToErr(new Error("my test error"), msg, true);

      assert.equal(result.message.indexOf("'"+msg+"'") > -1, true);
    });

    it("should not quote a message when asked", function () {
      var msg = "my message";
      var result = common.prependMsgToErr(new Error("my test error"), msg);

      assert.equal(result.message.indexOf("'"+msg+"'") === -1, true);
      assert.equal(result.message.indexOf(msg) > -1, true);
    });

    it("should make an error if string was given", function () {
      var input = "my test error";
      var msg = "my message";
      var result = common.prependMsgToErr(input, msg, true);

      assert.equal(result instanceof Error, true);
      assert.equal(result.message.indexOf("'"+msg+"'") > -1, true);
    });

    it("should prepend message to error", function () {
      var msg = "my message";
      var errMsg = "my test error";
      var result = common.prependMsgToErr(new Error(errMsg), msg);

      var resultMessage = result.message.split(": ");

      assert.equal(resultMessage.length > 1, true);
      assert.equal(resultMessage[0], msg);
      assert.equal(resultMessage[1], errMsg);
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
