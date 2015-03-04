/* global describe, it */
var assert = require("assert");
var resHelper = require("../../helpers/result");

describe("helpers", function() {

  describe("result", function() {

    describe("mustBeError", function() {

      it("should succeed if get Error", function() {
        resHelper.mustBeError(new Error());
      });

      it("should succeed if get String", function() {
        resHelper.mustBeError("test error");
      });

      it("should fail if null string", function() {
        var err;
        try {
          resHelper.mustBeError("");
        } catch(e) {
          err = e;
        }
        assert.notStrictEqual(typeof err, "undefined");
      });

      it("should fail if false", function() {
        var err;
        try {
          resHelper.mustBeError(false);
        } catch(e) {
          err = e;
        }
        assert.notStrictEqual(typeof err, "undefined");
      });

      it("should fail if undefined", function() {
        var err;
        try {
          resHelper.mustBeError();
        } catch(e) {
          err = e;
        }
        assert.notStrictEqual(typeof err, "undefined");
      });

      it("should fail if NaN", function() {
        var err;
        try {
          resHelper.mustBeError(NaN);
        } catch(e) {
          err = e;
        }
        assert.notStrictEqual(typeof err, "undefined");
      });

      it("should fail if 0", function() {
        var err;
        try {
          resHelper.mustBeError(0);
        } catch(e) {
          err = e;
        }
        assert.notStrictEqual(typeof err, "undefined");
      });

      it("should fail if null", function() {
        var err;
        try {
          resHelper.mustBeError(null);
        } catch(e) {
          err = e;
        }
        assert.notStrictEqual(typeof err, "undefined");
      });
    });

  });

});