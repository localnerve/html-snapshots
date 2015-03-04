/*
 * array.js
 *
 * An input generator for html-snapshots that uses a javascript array 
 *   to generate snapshot input from the host relative page urls.
 * 
 * Copyright (c) 2013, 2014, Alex Grant, LocalNerve, contributors
 * Licensed under the MIT license.
 * 
 */
var urlm = require("url");
var _ = require("lodash");
var base = require("./_base");

var array;

/**
 * Generate the snapshot arguments from an array of pages.
 */
function generateInput(options) {

  var result = true;

  if (_.isArray(options.source)) {

    for (var i = 0; i < options.source.length; i++) {
      var url = urlm.parse(options.source[i]);
      var opts = _.extend({}, options, {
        protocol: url.protocol,
        auth: url.auth,
        hostname: url.hostname,
        port: url.port
        });
      if (!base.input(opts, options.source[i])) {
        result = false;
      }
    }
  } else {
    result = false;
  }

  base.EOI(array);
  return result;
}

array = module.exports = {

  /**
   * run
   * Generate the input arguments for snapshots from an array
   */
  run: function(options, listener) {
    base.listener(listener);
    return base.run(options, generateInput);
  }
};