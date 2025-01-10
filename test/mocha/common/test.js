/**
 * Common module tests.
 *
 * Copyright (c) 2013 - 2025, Alex Grant, LocalNerve, contributors
 */
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
      assert.equal(result, true);
    });

    it("should not detect a file", function () {
      var result = common.isUrl(path.join(__dirname, __filename));
      assert.equal(result, false);
    });

    it("should not detect an object", function () {
      var result = common.isUrl({ url: "bogus" });
      assert.equal(result, false);
    });
  });

  describe("isObject", function () {

    it("should detect a simple object", function () {
      const result = common.isObject({});
      assert.equal(result, true);
    });

    it("should fail for null", function () {
      const result = common.isObject(null);
      assert.equal(result, false);
    });

    it("should fail for function object", function () {
      const result = common.isObject(function () {});
      assert.equal(result, false);
    });
  });

  describe("isFunction", function () {

    it("should detect a simple function", function () {
      const result = common.isFunction(function(){});
      assert.equal(result, true);
    });

    it("should fail for an object", function () {
      const result = common.isFunction({});
      assert.equal(result, false);
    });

    it("should fail for null", function () {
      const result = common.isFunction(null);
      assert.equal(result, false);
    });
  });

  describe("once", function () {

    it("should only run a function once", function () {
      let counter = 0;
      const subject = () => { counter++; };
      const oncer = common.once(subject);
      oncer();
      oncer();
      oncer();
      assert.equal(counter, 1);
    });

    it("should not run a function if not called", function () {
      let counter = 0;
      const subject = () => { counter++; };
      common.once(subject);
      assert.equal(counter, 0);
    });

    it("should preserve this if bound", function () {
      const context = {
        count: 0,
        fn () {
          this.count++;
        }
      };
      const oncer = common.once(context.fn.bind(context));
      oncer();
      oncer();
      oncer();
      assert.equal(context.count, 1);
    });

    it("should have tear-off instances of onceWrapper that act independently", function () {
      const contextOne = {
        count: 0,
        fn () {
          this.count++;
        }
      };
      const contextTwo = {
        count: 0,
        fn () {
          this.count++;
        }
      };
      assert.equal(contextOne.count, 0);
      const oneOnce = common.once(contextOne.fn.bind(contextOne));
      const twoOnce = common.once(contextTwo.fn.bind(contextTwo));
      oneOnce();
      oneOnce();
      oneOnce();
      assert.equal(contextOne.count, 1);
      assert.equal(contextTwo.count, 0);
      twoOnce();
      twoOnce();
      twoOnce();
      assert.equal(contextTwo.count, 1);
    });
  });

  describe("head", function () {

    it("should get the first element of an array", function () {
      const target = 'one';
      const ar = [target, 'two'];
      const result = common.head(ar);
      assert.equal(result, target);
    });

    it("should return undefined if empty array", function () {
      const ar = [];
      const result = common.head(ar);
      assert.equal(result, undefined);
    });

    it("should return undefined if given undefined", function () {
      let ar;
      const result = common.head(ar);
      assert.equal(result, undefined);
    })
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
