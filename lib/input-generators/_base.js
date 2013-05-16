/**
 * _base.js
 *
 * The common, base functionality of an input generator.
 *
 * Copyright (c) 2013, Alex Grant, LocalNerve, contributors
 * Licensed under the MIT license.
 * 
 */

var common = require("../common");
var events = require("events");
var path = require("path");
var urlm = require("url");

var emitter = new events.EventEmitter();

var defaults = {
  protocol: "http",
  hostname: "localhost",
  port: undefined,
  auth: undefined,
  outputPath: undefined,
  outputDir: "./snapshots",
  selector: "body", // definitely override this
  timeout: 5000,
  checkInterval: 250
};

// normalize the given object to a function
// if the input is undefined, then a passthru function is generated.
// if the input is a scalar, then a function returns that scalar.
// if the input is an object, then a function receives a key and returns the property value if it exists, otherwise return the key (passthru).
function normalize(obj) {
  var result = obj;
  if (typeof obj !== "function") {
    if (typeof obj !== "undefined") {
      if (typeof obj !== "object")
        result = (function(value) { return function() { return value; }; })(obj);
      else
        result = (function(o) { return function(key) {
          if (o[key] === void 0) {
            if (o.__default)
              return o.__default;
            return key;
          }
          else
            return o[key];
        }; })(obj);
    } else {
      result = function(passthru) { return passthru; };
    }
  }
  return result;
}

// consumed by input generators
module.exports = {

  /**
   * add specific items to the defaults
   * call first or second
   * not required if the generator has no defaults
   */
  defaults: function(specific) {
    return common.extend(defaults, specific);
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

    return generator(options);
  },

  /**
   * generate the input
   * emit the event that contains the input hash
   * call third
   */
  input: function(options, page) {
    var pagePart = urlm.parse(page),
        outputPath = options.outputPath(page);

    // check if there is any output path
    if (outputPath === void 0) {
      console.error("Skipping - No output path specified for '"+page+"'");
      return false;
    }

    // if the outputPath is really still a url, fix it to path+hash
    if (common.isUrl(outputPath)) {
      outputPath = pagePart.path + (pagePart.hash ? pagePart.hash : "");
    }

    emitter.emit("input", {
      // map the input page to an outputPath
      outputFile: path.join(options.outputDir, outputPath, "index.html"),
      // make the url
      url: urlm.format({
              protocol: options.protocol,
              auth: options.auth,
              hostname: options.hostname,
              port: options.port,
              pathname: pagePart.pathname,
              search: pagePart.search,
              hash: pagePart.hash
            }),
      // map the input page to a selector
      selector: options.selector(page),
      // map the input page to a timeout
      timeout: options.timeout(page),
      checkInterval: options.checkInterval,
      __page: page
    });

    return true;
  }
};