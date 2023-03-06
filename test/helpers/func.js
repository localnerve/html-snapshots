/**
 * function helper utilities.
 * 
 * Copyright (c) 2013 - 2023, Alex Grant, LocalNerve, contributors
 */

/**
 * Invokes a function after the given N number of calls.
 *   eg. 2 results in a call on the second invocation.
 *
 * @param {Number} n - The number of invocations after which to call
 * @param {Function} func - The function to call
 * @returns {Function} The wrapped function
 */
function after (n, func) {
  if (typeof n !== "number") {
    throw new TypeError("'after' first argument must be a number");
  }
  if (typeof func !== "function") {
    throw new TypeError("'after' second argument must be function");
  }
  n = parseInt(n, 10) || 0;
  return function () {
    if (--n < 1) {
      return func.apply(this, arguments);
    }
  };
}

module.exports = {
  after
};