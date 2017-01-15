/*
 * options.js
 *
 * A test helper to decorate html-snapshots options
 *
 * phantomjs
 * If a global phantomjs is defined, decorates html-snapshots options to specify that global
 * In some test environments (travis), local phantomjs will not install if a global is found.
 */
var assert = require("assert");

// @0.12.0, on Travis-ci phantomjs2 WILL install local WITH the older global.
// So reverting back to decorateLocal only.
// THIS COULD CHANGE... stay on top.

// abort is now required, so if one not supplied, supply a default.
function fillAbort (options) {
  if (!options._abort) {
    options._abort = function (err) {
      assert.fail("test", "failed", err.toString(), "");
    }
  }
}
/*
var spawn = require("child_process").spawn;

function decorateGlobal (options) {
    options.phantomjs = "phantomjs";
    return options;
}
*/
function decorateLocal(options) {
  // local is the default
  fillAbort(options);
  return options;
}

/*
var cp = spawn("phantomjs", ["--version"]);
cp.on("error", function(err) {
  module.exports.decorate = decorateLocal;
});

module.exports = {
  decorate: decorateGlobal
};
*/

module.exports = {
  decorate: decorateLocal
};
