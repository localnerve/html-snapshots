/**
 * Helpers tests.
 *
 * Copyright (c) 2013 - 2025, Alex Grant, LocalNerve, contributors
 */
const { describe, it } = require("node:test");
const assert = require("node:assert");
const { after } = require("../../helpers/func");
const resHelper = require("../../helpers/result");

describe("helpers", () => {
  describe("func", () => {
    describe("after", () => {
      it("should fail if bad number arg", { timeout: 200 }, () => {
        return new Promise(resolve => {
          try {
            after("", () => {});
          } catch {
            resolve();
          }
        });
      });

      it("should fail if bad func arg", { timeout: 200 }, () => {
        return new Promise(resolve => {
          try {
            after(0, undefined);
          } catch {
            resolve();
          }
        });
      });

      it("should call immediately if NaN", { timeout: 200 }, () => {
        return new Promise((resolve, reject) => {
          try {
            const end = after(NaN, resolve);
            end();
          } catch (e) {
            reject(e);
          }
        });
      });

      it("should call immediately if one", { timeout: 200 }, () => {
        return new Promise(resolve => {
          const end = after(1, resolve);
          end();
        });
      });

      it("should not call if only one with two limit", { timeout: 250 }, () => {
        return new Promise((resolve, reject) => {
          const end = after(2, () => {
            reject(new Error("should not have called ever"));
          });
          end();

          setTimeout(resolve, 200);
        });
      });

      it("should call after second if two and keep calling after that", { timeout: 200 }, () => {
        return new Promise(resolve => {
          let count = 0;
          const end = after(2, () => {
            count++;
            if (count === 2) {
              resolve();
            }
          });
          end();
          end();
          end();
        });
      });
    });
  });

  describe("result", () => {
    describe("mustBeError", () => {
      it("should succeed if get Error", () => {
        resHelper.mustBeError(new Error());
      });

      it("should succeed if get String", () => {
        resHelper.mustBeError("test error");
      });

      it("should fail if null string", () => {
        let err;
        try {
          resHelper.mustBeError("");
        } catch(e) {
          err = e;
        }
        assert.notStrictEqual(typeof err, "undefined");
      });

      it("should fail if false", () => {
        let err;
        try {
          resHelper.mustBeError(false);
        } catch(e) {
          err = e;
        }
        assert.notStrictEqual(typeof err, "undefined");
      });

      it("should fail if undefined", () => {
        let err;
        try {
          resHelper.mustBeError();
        } catch(e) {
          err = e;
        }
        assert.notStrictEqual(typeof err, "undefined");
      });

      it("should fail if NaN", () => {
        let err;
        try {
          resHelper.mustBeError(NaN);
        } catch(e) {
          err = e;
        }
        assert.notStrictEqual(typeof err, "undefined");
      });

      it("should fail if 0", () => {
        let err;
        try {
          resHelper.mustBeError(0);
        } catch(e) {
          err = e;
        }
        assert.notStrictEqual(typeof err, "undefined");
      });

      it("should fail if null", () => {
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