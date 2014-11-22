/**
 * _base.js
 *
 * The common, base functionality of an input generator.
 *
 * Copyright (c) 2013, 2014, Alex Grant, LocalNerve, contributors
 * Licensed under the MIT license.
 * 
 */

var common = require("../common");
var _ = require("underscore");
var events = require("events");
var path = require("path");
var urlm = require("url");

var emitter = new events.EventEmitter();

// defaults for this module
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
  useJQuery: false
};

// normalize the given object to a function
// if the input is undefined, then a passthru function is generated.
// if the input is a scalar, then a function returns that scalar.
// if the input is an object, then a function receives a key and returns the property value if it exists, otherwise return the key (passthru).
function normalize(obj) {
  var result = obj;
  if (typeof obj !== "function") {
    if (typeof obj !== "undefined") {
      if (typeof obj !== "object") {
        result = (function(value) { return function() { return value; }; }(obj));
      } else {
        result = (function(o) { return function(key) {
          if (o[key] === void 0) {
            return o.__default || key;
          } else {
            return o[key];
          }
        }; }(obj));
      }
    } else {
      result = function(passthru) { return passthru; };
    }
  }
  return result;
}

// parse a given page as a url and return its corresponding outputPath
// if parse is an object, parse.url will be a reference to the url parse
function getOutputPath(options, page, parse) {
  var pagePart = urlm.parse(page),
      outputPath = options.outputPath(page);

  // check if there is any output path
  if (outputPath === void 0) {
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

// using the options, map the given page to an output path.
function mapOutputFile(options, page, parse) {
  if (!_.isFunction(options.outputPath))
    options.outputPath = normalize(options.outputPath);

  var outputPath = getOutputPath(options, page, parse);

  return ( outputPath && path.join(options.outputDir, outputPath, "index.html") ) || false;
}

// consumed by input generators
module.exports = {

  /**
   * add specific items to the defaults
   * call first or second
   * not required if the generator has no defaults
   */
  defaults: function(specific) {
    return _.extend(defaults, specific);
  },

  /**
   * attach the listener
   * call first or second
   */
  listener: function(listener) {
    emitter.removeAllListeners("input");
    emitter.on("input", listener);
  },

  /**
   * run the generator
   * supply the input generator function
   * call second
   */
  run: function(options, generator) {
    options = options || {};

    // ensure defaults are represented
    common.ensure(options, defaults);

    // normalize certain arguments if they are not functions.
    options.selector = normalize(options.selector);
    options.timeout = normalize(options.timeout);
    options.outputPath = normalize(options.outputPath);
    options.useJQuery = normalize(options.useJQuery);

    // invoke the input generator
    return generator(options);
  },

  /**
   * generate the input
   * emit the event that contains the input hash
   * call third
   */
  input: function(options, page) {
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
        __page: page
      });

    }

    return outputFile;
  },

  /**
   * signal the end of input
   *  to be called at end of input
   * call fourth or last
   */
  EOI: function(generator) {
    generator.EOI = function() { return true; };
  },

  /**
   * expose output file mapping function utility
   */
  outputFile: mapOutputFile

};