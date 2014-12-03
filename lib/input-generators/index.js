/**
 * index.js
 * 
 * Input generator factory
 * Create an input generator that produces snapshots arguments
 *
 * Copyright (c) 2013, 2014, Alex Grant, LocalNerve, contributors
 * Licensed under the MIT license.
 */
/**
 * Dependencies
 */
var fs = require("fs");
var path = require("path");

module.exports = {

  /**
   * create
   * Creates the input generator based on the input string, which must match a js file in this directory.
   * So, if input === "robots", then executes require("./robots");
   * Unsupported input generator types return a "null" generator.
   */
  create: function(input) {

    var result = { run: function(){ return []; }, __null: true },
        file = "./"+input;

    if (typeof input !== "undefined" && fs.existsSync(path.join(__dirname, file+".js")) &&
        input.charAt(0) !== '_' && input !== "index") {
      result = require(file);
    }

    return result;
  },

  /**
   * If the generator has __null defined, then its bogus
   */
  isNull: function(generator) {
    return generator.__null !== void 0;
  }
};