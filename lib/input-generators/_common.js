/**
 * _common.js
 *
 * The common, base functionality of an input generator.
 *
 * Copyright (c) 2013, Alex Grant, LocalNerve, contributors
 * Licensed under the MIT license.
 * 
 */

var common = require("../common");

var defaults = {
  protocol: "http",
  hostname: "localhost",
  snapshotDir: "./snapshots",
  selector: function(url) { return "body"; }, // definitely override this
  timeout: function(url) { return 5000; },
  checkInterval: 250
};

module.exports = {

  run: function(options, generator) {
    options = options || {};

    // ensure defaults are represented
    common.ensure(options, defaults);

    // fix selector and timeout arguments if they are not functions.
    if (typeof options.selector !== "function")
      options.selector = (function(selector) { return function() { return selector; }; })(options.selector);
    if (typeof options.timeout !== "function")
      options.timeout = (function(timeout) { return function() { return timeout; }; })(options.timeout);

    return generator(options);
  },

  /**
   * add specific items to the defaults
   */
  defaults: function(specific) {
    return common.extend(defaults, specific);
  }
};