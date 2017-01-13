/*
 * globals.js
 *
 * Globals and module utilities.
 *
 * This is a module for a phantomJS script that runs in phantomjs.
 *
 * Copyright (c) 2013 - 2017 Alex Grant, LocalNerve, contributors
 * Licensed under the MIT license.
 */
/* global phantom */
/**
 * Exit phantomJS
 */
function _exit(code, msg) {
  if (code !== 0) {
    console.error(msg);
  } else {
    console.log(msg);
  }
  phantom.exit(code);
}

/**
 * Global error handler
 */
phantom.onError = function(msg, trace) {
  var msgStack = ["PhantomJS error: " + msg];
  if (trace && trace.length) {
    msgStack.push("Trace:");
    trace.forEach(function(t) {
      msgStack.push(" -> " + (t.file || t.sourceURL) + ": " + t.line + (t.function ? " (in function " + t.function +")" : ""));
    });
  }
  // Don't call _exit from here, causes strange crash w/linux rebuilt binary.
  // https://github.com/ariya/phantomjs/issues/14132
  console.log(msgStack.join("\n"));
  phantom.exit(-1);
};

module.exports = {
  exit: _exit
};
