/*
 * options.js
 *
 * A test helper to decorate html-snapshots options
 * 
 * phantomjs
 * If a global phantomjs is defined, decorates html-snapshots options to specify that global
 * In some test environments (travis), local phantomjs will not install if a global is found.
 */

var spawn = require("child_process").spawn;

function decorateGlobal (options) {
    options.phantomjs = "phantomjs";
    return options;
}

function decorateLocal(options) {
  // local is the default
  return options;
}

var cp = spawn("phantomjs", ["--version"]);
cp.on("error", function(err) {
  module.exports.decorate = decorateLocal;
});

module.exports = {
  decorate: decorateGlobal
};