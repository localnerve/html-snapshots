/*
 * options.js
 *
 * Copyright (c) 2013 - 2025, Alex Grant, LocalNerve, contributors
 * 
 * A test helper to decorate html-snapshots options
 *
 */
const assert = require("assert");

// abort is now required, so if one not supplied, supply a default.
function fillAbort (options) {
  if (!options._abort) {
    options._abort = function (err) {
      const msg = `[options._abort] called: ${err.toString()}`;
      console.log(`@@@ ${msg}`);
      assert.fail(msg);
    }
  }
}

function decorateLocal(options) {
  // local is the default
  fillAbort(options);
  return options;
}

module.exports = {
  decorate: decorateLocal
};
