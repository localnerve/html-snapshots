/**
 * _common.js
 *
 * The common, base functionality of an input generator.
 *
 * Copyright (c) 2013, Alex Grant, LocalNerve, contributors
 * Licensed under the MIT license.
 * 
 */

 var defaults = {
  protocol: "http",
  hostname: "localhost",
  snapshotDir: "./snapshots",
  selector: function(url) { return "body"; }, // definitely override this
  timeout: function(url) { return 5000; },
  checkInterval: 250
};

modules.exports = {

  run: function(options) {
    options = options || {};

    // ensure defaults are represented
    for (var prop in defaults) {
      if (!options[prop])
        options[prop] = defaults[prop];
    }

    // fix selector and timeout arguments if they are not functions.
    if (typeof options.selector !== "function")
      options.selector = (function(selector) { return function() { return selector; }; })(options.selector);
    if (typeof options.timeout !== "function")
      options.timeout = (function(timeout) { return function() { return timeout; }; })(options.timeout);

    return generateInput(options);
  },

  defaults: defaults
};