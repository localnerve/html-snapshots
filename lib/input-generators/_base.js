/**
 * _base.js
 *
 * The common, base functionality of an input generator.
 *
 * Copyright (c) 2013 - 2017 Alex Grant, LocalNerve, contributors
 * Licensed under the MIT license.
 */
"use strict";

var events = require("events");
var path = require("path");
var urlm = require("url");
var _ = require("lodash");
var common = require("../common");

var emitter = new events.EventEmitter();

// Defaults for this module
var defaults = {
  protocol: "http",
  hostname: "localhost",
  port: undefined,
  auth: undefined,
  outputPath: undefined,
  outputDir: "./snapshots",
  selector: "body",
  timeout: 10000,
  checkInterval: 250,
  useJQuery: false,
  phantomjsOptions: ""
};

/**
 * Normalize the given object to a function.
 *
 * If the input is a function, return it as is.
 * If the input is undefined, then a passthru function is generated.
 * If the input is NOT an Object, then a function returns that value.
 * If the input is an Object, then a function receives a key and
 *   returns the property value if it exists, otherwise return the __default value.
 *   If a passthru is requested, the key is returned when no __default is found.
 *
 * @param {Any} obj - Some input to be represented by a function.
 * @returns {Function} A function to represent the given input.
 */
function normalize (obj) {
  var result = obj;
  if (typeof obj !== "function") {
    if (typeof obj !== "undefined") {
      if (Object.prototype.toString.call(obj) !== "[object Object]") {
        result = (function (value) { return function () { return value; }; }(obj));
      } else {
        result = (function (o) { return function (key, passthru) {
          if (o[key] === void 0) {
            return o.__default || (passthru ? key : undefined);
          } else {
            return o[key];
          }
        }; }(obj));
      }
    } else {
      result = function (passthru) { return passthru; };
    }
  }
  return result;
}

/**
 * If a normalized option was overriden, but a default still undefined, supply one.
 * The result could still be undefined, but only if the default is undefined.
 *
 * If calling the normalized option with no args is undefined, supply missing default.
 *
 * @param {Object} options - Input generator options.
 * @param {String} name - The name of the property to supply missing default for.
 */
function supplyMissingDefault (options, name) {
  if (options[name]() === void 0) {
    options[name] = _.wrap(options[name], function(func, key) {
      var res = func(key);
      return res === void 0 ? defaults[name] : res;
    });
  }
}

/**
 * Prepare options for use by an input generator.
 *
 * @param {Object} [options] - Options with or without defaults.
 */
function prepOptions (options) {
  // ensure defaults are represented
  common.ensure(options, defaults);

  // normalize certain arguments if they are not functions.
  //   outputPath is a special case
  var perPageOptions = [
    "selector", "timeout", "useJQuery", "phantomjsOptions"
  ];

  for (var i = 0; i < perPageOptions.length; i++) {
    options[perPageOptions[i]] = normalize( options[perPageOptions[i]] );
    supplyMissingDefault(options, perPageOptions[i]);
  }
}

/**
 * Get an output path for a page.
 *
 * Parse a given page as a url and return its corresponding outputPath.
 * If parse is an object, parse.url will be a reference to the url parse.
 * Returns false if no output path found.
 *
 * @param {Object} options - output path options.
 * @param {Function} options.outputPath - Derives the outputPath from page.
 * @param {String} page - The url to the page resource.
 * @param {Object} [parse] - Supply to get page (url) parse output in prop `url`.
 * @returns {String} The 'path' part of the file output path.
 */
function getOutputPath (options, page, parse) {
  var pagePart = urlm.parse(page),
      // if outputPath was normalized with an object, let the key passthru
      outputPath = options.outputPath(page, true);

  // check for bad output path
  if (!outputPath) {
    return false;
  }

  // if the outputPath is really still a url, fix it to path+hash
  if (common.isUrl(outputPath)) {
    outputPath = pagePart.path + (pagePart.hash ? pagePart.hash : "");
  }

  // if the caller wants the url parse output, return it
  if (parse) {
    parse.url = pagePart;
  }

  return outputPath;
}

/**
 * Using the options, map the given page to an output path.
 *
 * @param {Object} options - The input generator options.
 * @param {String} options.outputDir - The output directory root path.
 * @param {String} [options.outputPath] - optional function or object to map pages to outputPaths.
 * @param {String} [options.sitemapOutputDir] - optional root path for sitemaps within outputDir.
 * @returns {String|Boolean} The full path to the output file or false on failure.
 */
function mapOutputFile (options, page, parse) {
  if (!_.isFunction(options.outputPath)) {
    options.outputPath = normalize(options.outputPath);
  }

  var outputPath = getOutputPath(options, page, parse);
  var outputDir = options.outputDir;
  var fileName = "index.html";

  if (options.sitemapOutputDir) {
    outputDir = path.join(options.outputDir, options.sitemapOutputDir);
    fileName = "";
  }

  return ( outputPath && path.join(outputDir, outputPath, fileName) ) || false;
}

/*
 * Interface consumed by input generators
 *
 * Consumption pattern call order:
 * <Setup Phase>
 *   [defaults]
 *   listener
 * <Start Processing>
 *   run
 * <For each page>
 *   input
 * <End Processing>
 *   EOI
 */
module.exports = {

  /**
   * Add specific items to the defaults.
   * Not required if the generator has no defaults itself.
   *
   * @param {Object} specific - Input generator specific defaults.
   * @return {Object} The fully mixed defaults.
   */
  defaults: function (specific) {
    return Object.assign({}, defaults, specific);
  },

  /**
   * Attach the listener to "input" events.
   *
   * @param {Function} listener - The callback that receives each input generated.
   */
  listener: function (listener) {
    emitter.removeAllListeners("input");
    emitter.on("input", listener);
  },

  /**
   * Run the input generator.
   *
   * @param {Object} options - Input generator options.
   * @param {Function} generator - The input generator to run.
   * @returns {Promise} The promise returned by the input generator.
   */
  run: function (options, generator) {
    options = options || {};
    prepOptions(options);
    return generator(options);
  },

  /**
   * Generate the input
   * Emit the event that contains the input hash
   *
   * @param {Object} options - input generator options.
   * @param {String} options.protocol - https?
   * @param {String} options.auth - user:pass for old style urls.
   * @param {String} options.hostname - The hostname part of the url.
   * @param {Number} options.port - The port part of the url.
   * @param {Function} options.selector - Produces a selector given a page url.
   * @param {Function} options.timeout - Produces a timeout given a page url.
   * @param {Number} options.checkInterval - The millisecond resolute poll interval.
   * @param {Function} options.userJQuery - Produces a jquery bool given a page url.
   * @param {Function} options.phantomjsOptions - Produces phantomjs options given a page url.
   * @param {String} page - The url to the page resource.
   * @returns {String} The full output file path.
   */
  input: function (options, page) {
    var parse = {};
    var outputFile = mapOutputFile(options, page, parse);

    if (outputFile) {

      emitter.emit("input", {
        outputFile: outputFile,
        // make the url
        url: urlm.format({
                protocol: options.protocol,
                auth: options.auth,
                hostname: options.hostname,
                port: options.port,
                pathname: parse.url.pathname,
                search: parse.url.search,
                hash: parse.url.hash
              }),
        // map the input page to a selector
        selector: options.selector(page),
        // map the input page to a timeout
        timeout: options.timeout(page),
        checkInterval: options.checkInterval,
        // map the input page to a useJQuery flag
        useJQuery: options.useJQuery(page),
        // map the input page to phantomJS options
        phantomjsOptions: options.phantomjsOptions(page),
        // useful for testing, debugging
        __page: page
      });

    }

    return outputFile;
  },

  /**
   * Signal the end of input
   *
   * @param {Object} generator - The input generator.
   */
  EOI: function (generator) {
    generator.EOI = function () { return true; };
  },

  /**
   * Expose the output file mapping utility function.
   *
   * @see mapOutputFile.
   */
  outputFile: mapOutputFile

};
