/*
 * globals.js
 * 
 * Globals and module utilities.
 *
 * This is a module for a phantomJS script that runs in phantomjs. 
 *
 * Copyright (c) 2013, 2014, Alex Grant, LocalNerve, contributors
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
  _exit(-1, msgStack.join("\n"));
};

module.exports = {
  exit: _exit
};