/* global describe, it */
var assert = require("assert");
var nodeCall = require("../../../lib/common/node");

describe("node", function () {
  var resolveTo = "hello world";
  var firstArg = "one",
    secondArg = "two",
    thirdArg = "three";

  function test (first, second) {
    var result;

    try {
      assert.equal(first, second);
    } catch (e) {
      result = e;
    }

    return result;
  }

  function noArgs (cb) {
    cb(null, resolveTo);
  }

  function oneArg (one, cb) {
    cb(test(one, firstArg), resolveTo);
  }

  function twoArgs (one, two, cb) {
    var first = test(one, firstArg);
    var second = test(two, secondArg);
    cb(first || second, resolveTo);
  }

  function threeArgs (one, two, three, cb) {
    var first = test(one, firstArg);
    var second = test(two, secondArg);
    var third = test(three, thirdArg);
    cb(first || second || third, resolveTo);
  }

  function errorFn (cb) {
    cb(new Error("my error message"));
  }

  it("should return a promise that resolves with no arguments", function (done) {
    nodeCall(noArgs)
      .then(function (value) {
        done(test(value, resolveTo));
      })
      .catch(done);
  });

  it("should return a promise that resolves with one arguments", function (done) {
    nodeCall(oneArg, firstArg)
      .then(function (value) {
        done(test(value, resolveTo));
      })
      .catch(done);
  });

  it("should return a promise that resolves with two arguments", function (done) {
    nodeCall(twoArgs, firstArg, secondArg)
      .then(function (value) {
        done(test(value, resolveTo));
      })
      .catch(done);
  });

  it("should return a promise that resolves with three arguments", function (done) {
    nodeCall(threeArgs, firstArg, secondArg, thirdArg)
      .then(function (value) {
        done(test(value, resolveTo));
      })
      .catch(done);
  });

  it("should return a promise that resolves to error", function (done) {
    nodeCall(errorFn)
      .then(function () {
        done(new Error("Unexpected success. Should have been error"));
      })
      .catch(function (err) {
        try {
          assert.ok(err instanceof Error);
        } catch (e) {
          done(e);
          return;
        }
        done();
      });
  });
});
