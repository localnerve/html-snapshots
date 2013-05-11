/**
 * input/create.js
 *
 * Create an input generator that produces snapshots arguments
 *
 * Copyright (c) 2013, Alex Grant, LocalNerve, contributors
 * Licensed under the MIT license.
 */
/**
 * Dependencies
 */
var fs = require("fs");
var path = require("path");

/**
 * create
 * Creates the input generator based on the input string, which must match a file.js in this directory.
 * So, if input === "robots", then executes require("./robots");
 * Unsupported input generators return undefined.
 *
 * All input generators export a run method and defaults hash that expresses its default arguments.
 */
module.exports = {

  /**
   * create
   * Creates the input generator based on the input string, which must match a js file in this directory.
   * So, if input === "robots", then executes require("./robots");
   * Unsupported input generator types return a "null" generator.
   */
  create: function(input) {

    var result = { run: function(){ return []; }, defaults: {}, __null: true },
        file = "."+path.sep+input;

    if (fs.existsSync(path.join(__dirname, file+".js")) && file !== "_common")
      result = require(file);

    return result;
  },

  /**
   * If the generator has __null defined, then its bogus
   */
  isNull: function(generator) {
    return generator.__null !== void 0;
  }
};