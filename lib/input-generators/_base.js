/**
 * _base.js
 *
 * The common, base functionality of an input generator.
 *
 * Copyright (c) 2013, 2014, Alex Grant, LocalNerve, contributors
 * Licensed under the MIT license.
 * 
 */
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

/* 
 * Normalize the given object to a function.
 *
 * If the input is a function, return it as is.
 * If the input is undefined, then a passthru function is generated.
 * If the input is NOT an Object, then a function returns that value.
 * If the input is an Object, then a function receives a key and 
 *   returns the property value if it exists, otherwise return the __default value.
 *   If a passthru is requested, the key is returned when no __default is found.
 */
function normalize(obj) {
  var result = obj;
  if (typeof obj !== "function") {
    if (typeof obj !== "undefined") {
      if (Object.prototype.toString.call(obj) !== "[object Object]") {
        result = (function(value) { return function() { return value; }; }(obj));
      } else {
        result = (function(o) { return function(key, passthru) {
          if (o[key] === void 0) {            
            return o.__default || (passthru ? key : undefined);
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

/**
 * If a normalized option was overriden, but a default still undefined, supply one.
 * The result could still be undefined, but only if the default is undefined.
 *
 * If calling the normalized option with no args is undefined, supply missing default.
 */
function supplyMissingDefault(options, name) {
  if (options[name]() === void 0) {
    options[name] = _.wrap(options[name], function(func, key) {
      var res = func(key);
      return res === void 0 ? defaults[name] : res;
    });
  }
}

/*
 * Get an output path for a page.
 *
 * Parse a given page as a url and return its corresponding outputPath.
 * If parse is an object, parse.url will be a reference to the url parse.
 * Returns false if no output path found.
 */
function getOutputPath(options, page, parse) {
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

/*
 * Using the options, map the given page to an output path.
 */
function mapOutputFile(options, page, parse) {
  if (!_.isFunction(options.outputPath)) {
    options.outputPath = normalize(options.outputPath);
  }

  var outputPath = getOutputPath(options, page, parse);

  return ( outputPath && path.join(options.outputDir, outputPath, "index.html") ) || false;
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
   * Add specific items to the defaults
   * Not required if the generator has no defaults itself
   */
  defaults: function(specific) {
    return _.extend(defaults, specific);
  },

  /**
   * Attach the listener to "input" events
   */
  listener: function(listener) {
    emitter.removeAllListeners("input");
    emitter.on("input", listener);
  },

  /**
   * Run the input generator
   * Supply the options and input generator function
   */
  run: function(options, generator) {
    options = options || {};

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

    // invoke the input generator
    return generator(options);
  },

  /**
   * Generate the input
   * Emit the event that contains the input hash
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
   */
  EOI: function(generator) {
    generator.EOI = function() { return true; };
  },

  /**
   * Expose the output file mapping utility function
   */
  outputFile: mapOutputFile

};