/*
 * html-snapshots.js
 *
 * Produce html snapshots using for a website for SEO purposes.
 * This is required for javascript SPAs or ajax page output.
 * By default, uses a selector to search content to determine if 
 *   a page is "ready" for its html snapshot.
 *
 * Copyright (c) 2013, Alex Grant, LocalNerve, contributors
 * Licensed under the MIT license.
 */

/**
 * Dependencies
 */
var fs = require("fs");
var spawn = require("child_process").spawn;
var path = require("path");
var common = require("./common");
var inputFactory = require("./input-generators");
var snapshotScript = "./phantom/snapshotSingle.js";
var phantomJS = "phantomjs";

var defaults = {
  input: "robots",
  phantomjs: phantomJS,
  snapshotScript: path.join(__dirname, snapshotScript),
  outputDirClean: false
};

/**
 * Utility to recursively delete a folder
 */
function deleteFolderRecursive(p) {
  if(fs.existsSync(p)) {
    fs.readdirSync(p).forEach(function(file,index){
      var curPath = path.join(p,"/" + file);
      if(fs.statSync(curPath).isDirectory()) { // recurse
        deleteFolderRecursive(curPath);
      } else { // delete file
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(p);
  }
}

module.exports = {
  /**
   * Run all the snapshots using the requested inputGenerator
   */
  run: function(options) {
    options = options || {};

    // ensure our defaults are represented in the options
    common.ensure(options, defaults);

    // create the inputGenerator, default to robots
    var inputGenerator = inputFactory.create(options.input);

    // clean the snapshot output directory
    if (options.outputDirClean)
      deleteFolderRecursive(options.outputDir);

    // generate input for the snapshots
    var result = inputGenerator.run(options, (function(options){
      // called for each input item generated
      return function(input){
        cp = spawn(
            options.phantomjs,
            [
              options.snapshotScript,
              input.outputFile,
              input.url,
              input.selector,
              input.timeout,
              input.checkInterval
            ], { cwd: process.cwd(), stdio: "inherit", detached: true }
          );
        cp.on("error", function() { console.error(e); });
      };
    })(options));

    return result;
  }
};
