/**
 * index.js
 *
 * Input generator factory
 * Create an input generator that produces snapshots arguments
 *
 * Copyright (c) 2013 - 2016 Alex Grant, LocalNerve, contributors
 * Licensed under the MIT license.
 */
"use strict";

module.exports = {
  /**
   * create
   * Creates the input generator based on the input string, which must match a
   * js file in this directory.
   * So, if input === "robots", then executes require("./robots");
   * Unsupported input generator types return a "null" generator.
   */
  create: function (input) {

    var result = { run: function () { return []; }, __null: true },
        hasInput = typeof input === "string",
        file = hasInput && "./" + input,
        isGenerator = hasInput && input.charAt(0) !== '_' && input !== "index";

    try {
      if (hasInput && isGenerator) {
        result = require(file);
      }
    } catch (e) {
      /* return the "null" generator on error */
    }

    return result;
  },

  /**
   * If the generator has __null defined, then its bogus
   */
  isNull: function (generator) {
    return generator.__null !== void 0;
  }
};
