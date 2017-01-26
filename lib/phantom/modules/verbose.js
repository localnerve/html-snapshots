/*
 * verbose.js
 *
 * Adds handlers to WebPage module to produce additional output for debugging.
 */
var system = require("system");

/**
 * Decorate the given WebPage with handlers to produce verbose output.
 */
function verbose (page) {

  page.onError = function (msg, trace) {
    system.stderr.writeLine('= onError()');
    var msgStack = ['  - Error: ' + msg];
    if (trace) {
      msgStack.push('  - Trace:');
      trace.forEach(function (t) {
        msgStack.push('    -> '+ t.file + ': ' + t.line);
      });
    }
    system.stderr.writeLine(msgStack.join('\n'));
  }

  page.onResourceError = function (resourceError) {
    system.stderr.writeLine("= onResourceError()");
    system.stderr.writeLine("  - unable to load url: '" +resourceError.url+"'");
    system.stderr.writeLine(
      "  - error (" + resourceError.errorCode + "): " + resourceError.errorString
    );
  }

}

module.exports = verbose;
