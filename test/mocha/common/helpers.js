/**
 * Helpers tests.
 *
 * Copyright (c) 2013 - 2023, Alex Grant, LocalNerve, contributors
 */
/* global describe, it */
const assert = require("assert");
const { after } = require("../../helpers/func");
const resHelper = require("../../helpers/result");

describe("helpers", function() {

  describe("func", function () {
    
    describe("after", function () {

      it("should fail if bad number arg", function (done) {
        this.timeout(200);
        try {
          after('', function(){});
        } catch (e) {
          done();
        }
      });

      it("should fail if bad func arg", function (done) {
        this.timeout(200);
        try {
          after(0, undefined);
        } catch (e) {
          done();
        }
      });

      it("should call immediately if NaN", function (done) {
        this.timeout(200);
        try {
          const end = after(NaN, done);
          end();
        } catch (e) {
          done(e);
        }
      });

      it("should call immediately if one", function (done) {
        this.timeout(200);
        const end = after(1, done);
        end();
      });

      it("should not call if only one with two limit", function (done) {
        this.timeout(250);

        const end = after(2, () => {
          done(new Error("should not have called ever"));
        });
        end();

        setTimeout(done, 200);
      });

      it("should call after second if two and keep calling after that", function (done) {
        this.timeout(200);
        let count = 0;
        const end = after(2, () => {
          count++;
          if (count === 2) {
            done();
          }
        });
        end();
        end();
        end();
      });
    });
  });

  describe("result", function() {

    describe("mustBeError", function() {

      it("should succeed if get Error", function() {
        resHelper.mustBeError(new Error());
      });

      it("should succeed if get String", function() {
        resHelper.mustBeError("test error");
      });

      it("should fail if null string", function() {
        let err;
        try {
          resHelper.mustBeError("");
        } catch(e) {
          err = e;
        }
        assert.notStrictEqual(typeof err, "undefined");
      });

      it("should fail if false", function() {
        let err;
        try {
          resHelper.mustBeError(false);
        } catch(e) {
          err = e;
        }
        assert.notStrictEqual(typeof err, "undefined");
      });

      it("should fail if undefined", function() {
        let err;
        try {
          resHelper.mustBeError();
        } catch(e) {
          err = e;
        }
        assert.notStrictEqual(typeof err, "undefined");
      });

      it("should fail if NaN", function() {
        let err;
        try {
          resHelper.mustBeError(NaN);
        } catch(e) {
          err = e;
        }
        assert.notStrictEqual(typeof err, "undefined");
      });

      it("should fail if 0", function() {
        let err;
        try {
          resHelper.mustBeError(0);
        } catch(e) {
          err = e;
        }
        assert.notStrictEqual(typeof err, "undefined");
      });

      it("should fail if null", function() {
        let err;
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