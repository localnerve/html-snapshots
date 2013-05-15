/*
 * robots.js
 *
 * An input generator for html-snapshots that uses a simple robots.txt file.
 * Creates the snapshot arguments driven from robots.txt "Allow: ".
 * Does not support wildcards.
 * If you need wildcards, use the sitemap input generator.
 *
 * Copyright (c) 2013, Alex Grant, LocalNerve, contributors
 * Licensed under the MIT license.
 * 
 */
var fs = require("fs");
var path = require("path");
var http = require("http");
var common = require("../common");
var base = require("./_base");

// The default options
var defaults = {
  source: "./robots.txt"
};

/**
 * Process one line of a simple robots.txt file
 * Does not support wildcards.
 */
function oneline(line, options) {
  var key = "Allow: ";
  var index = line.indexOf(key);

  if (index !== -1) {
    var page = line.substr(index + key.length).replace(/^\s+|\s+$/g, "");

    base.input(options, page);
  }
}

/**
 * Generate the snapshot arguments from a robots.txt file.
 * Each line that has "Allow:" contains a url we need a snapshot for.
 */
function generateInput(options) {

  var result = true;

  if (common.isUrl(options.source)) {
    request = http.get(options.source, function(res) {
      var responseBody = "";
      console.log(options.source+" response: "+res.statusCode);
      res.setEncoding("utf8");
      res.on("data", function (chunk) {
        responseBody += chunk;
      });
      res.on("end", function(){
        //console.log("responseBody = "+responseBody);
        responseBody.toString().split('\n').forEach(function(line) {
          oneline(line, options);
        });
      });
    });
    request.on("error", function(e){
      result = false;
      console.error(options.source+" get failed: "+e.message);
    });
  } else {
    if (!fs.existsSync(options.source)) {
      result = false;
      console.error("Could not find input file: "+options.source);
    } else {
      fs.readFileSync(options.source).toString().split('\n').forEach(function (line) {
        oneline(line, options);
      });
    }
  }

  return result;
}

module.exports = {
  /**
   * run
   * Generate the input arguments for snapshots from a robots.txt file
   * Each input argument generated calls the listener passing the input object.
   */
  run: function(options, listener) {
    base.listener(listener);
    base.defaults(defaults);
    return base.run(options, generateInput);
  }
};