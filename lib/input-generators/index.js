/**
 * index.js
 *
 * Input generator factory
 * Create an input generator that produces snapshots arguments
 *
 * Copyright (c) 2013 - 2017 Alex Grant, LocalNerve, contributors
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
   *
   * @param {String} input - The name of the input generator to create.
   * @returns {Object} The input generator, a null generator on error.
   */
  create: function (input) {
    var result = {
      run: function () {
        return [];
      },
      __null: true
    },
    hasInput;

    if (input) {
      input = (""+input).replace(" ", "").toLowerCase();
      hasInput = input && input.charAt(0) !== '_' && input !== "index";
    }

    try {
      if (hasInput) {
        result = require( "./" + input);
      }
    } catch (e) {
      console.error("Input generator load failed '" + input + "'", e)
      /* return the "null" generator on error */
    }

    return result;
  },

  /**
   * Determine if an input generator is null (bogus).
   * If the generator has __null defined, then its bogus.
   *
   * @param {Object} generator - An input generator.
   * @returns {Boolean} True if the given generator is bogus, false otherwise.
   */
  isNull: function (generator) {
    return generator.__null !== void 0;
  }
};
