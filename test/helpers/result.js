/**
 * Asserts error is error.
 *
 * Copyright (c) 2013 - 2020, Alex Grant, LocalNerve, contributors
 */
var assert = require("assert");

/**
 * NodeJS v8 ifError throws if value is truthy
 * NodeJS v10 ifError throws if value is NOT undefined or null.
 * So to cover both, added falsy check.
 *
 * @param {*} err 
 */
function notFalsy (err) {
  return !!err;
}

function mustBeError (err) {
  assert.throws(
    function () {
      notFalsy(err) && assert.ifError(err);
    },
    function (err) {
      return !!err;
    }
  );
}

module.exports = {
  mustBeError: mustBeError
};