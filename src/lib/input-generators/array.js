/*
 * array.js
 *
 * An input generator for html-snapshots that uses a javascript array 
 *   to generate snapshot input from the host relative page urls.
 * 
 * Copyright (c) 2013, Alex Grant, LocalNerve, contributors
 * Licensed under the MIT license.
 * 
 */
var base = require("./_base");

/**
 * Generate the snapshot arguments from an array of pages.
 */
function generateInput(options) {

  var result = true;

  if (options.source && toString.call(options.source) == "[object Array]") {

    for (var i = 0; i < options.source.length; i++) {
      var page = options.source[i];
      base.input(options, page);
    }
  } else {
    result = false;
  }

  return result;
}

module.exports = {

  /**
   * run
   * Generate the input arguments for snapshots from an array
   */
  run: function(options, listener) {
    base.listener(listener);
    return base.run(options, generateInput);
  }
};