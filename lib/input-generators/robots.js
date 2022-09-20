/*
 * robots.js
 *
 * An input generator for html-snapshots that uses a simple robots.txt file.
 * Creates the snapshot arguments driven from robots.txt "Allow: ".
 * Does not support wildcards.
 * If you need wildcards, use the sitemap input generator.
 *
 * Copyright (c) 2013 - 2022 Alex Grant, LocalNerve, contributors
 * Licensed under the MIT license.
 */

const fs = require("fs").promises;
const common = require("../common");
const base = require("./_base");

// The default options
const defaults = Object.freeze({
  source: "./robots.txt",
  hostname: "localhost"
});

const robots = {
  /**
   * Generate the input arguments for snapshots from a robots.txt file
   * Each input argument generated calls the listener passing the input object.
   *
   * @param {Object} options - Robots options.
   * @param {Function} listener - Callback to receive each input.
   * @returns {Promise} Resolves to undefined on completion.
   */
  run: function (options, listener) {
    const opts = Object.assign({}, base.defaults(defaults), options);

    return base.run(opts, generateInput, listener);
  }
};

/**
 * Generate input for one line of a simple robots.txt file
 * Does not support wildcards.
 */
function oneline (line, options) {
  const key = "Allow: ",
      index = line.indexOf(key);

  if (index !== -1) {
    const page = line.substr(index + key.length).replace(/^\s+|\s+$/g, "");
    return page.indexOf("*") === -1 && base.input(options, page);
  }

  return true;
}

/**
 * Retrieves robots.txt from url and parses it.
 *
 * @param {Object} options - Robots.txt options
 * @param {String} options.source - The URL to a robots.txt
 * @param {Function} options.timeout - Returns the robots.txt request timeout.
 * @returns {Promise} resolves to undefined.
 */
async function getRobotsUrl (options) {
  const { default:got } = await import("got");
  return got({
    url: options.source,
    timeout: {
      request: options.timeout()
    }
  }).then(res => {
    let error = common.checkResponse(res, "text/plain");
    if (error) {
      throw new Error(error);
    }
    const body = res.body;
    body.toString().split('\n').every(line => {
      // Process the line input, but break if base.input returns false.
      // For now, this can only happen if no outputDir is defined,
      //   which is a fatal bad option problem and will happen immediately.
      if (!oneline(line, options)) {
        error = common.prependMsgToErr(base.generatorError(), line, true);
        return false;
      }
      return true;
    });
    if (error) {
      throw new Error(error);
    }
  }).catch(err => {
    throw new Error(common.prependMsgToErr(err, options.source, true));
  });
}

/**
 * Reads the robots.txt file and parses it.
 * 
 * @param {Object} options - Robots.txt options
 */
function getRobotsFile (options) {
  return fs.readFile(options.source).then(data => {
    let error;
    
    data.toString().split('\n').every(line => {
      // Process the line input, but break if base.input returns false.
      // For now, this can only happen if no outputDir is defined,
      //   which is a fatal bad option problem and will happen immediately.
      if (!oneline(line, options)) {
        error = common.prependMsgToErr(base.generatorError(), line, true);
        return false;
      }
      return true;
    });
    
    if (error) {
      throw new Error(error);
    }
  });
}

/**
 * Generate the snapshot arguments from a robots.txt file.
 * Each line that has "Allow:" contains a url we need a snapshot for.
 * This can return true on error for true async. An async error is supplied to listener
 * in this case via _abort.
 *
 * @param {Object} options - input generator options object.
 * @param {String} options.source - A url or file path.
 * @param {Function} options._abort - Abort function to stop the async notifier.
 * @returns {Promise} Resolves to undefined on completion.
 */
function generateInput (options) {
  const retrieve = common.isUrl(options.source) ? getRobotsUrl : getRobotsFile;
  return retrieve(options)
    .catch(err => {
      options._abort(err);
    })
    .then(() => {
      base.EOI(robots);
    });
}

module.exports = robots;
