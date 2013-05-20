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
var spawn = require("child_process").spawn;
var path = require("path");
var common = require("./common");
var inputFactory = require("./input-generators");
var async = require("./async");
var snapshotScript = "./phantom/snapshotSingle.js";
var phantomJS = "../node_modules/phantomjs/lib/phantom/bin/phantomjs";

/**
 * This module's defaults
 */
var defaults = {
  input: "robots",
  phantomjs: path.join(__dirname, phantomJS),
  snapshotScript: path.join(__dirname, snapshotScript),
  outputDirClean: false
};

module.exports = {
  /**
   * Run all the snapshots using the requested inputGenerator
   */
  run: function(options, listener) {
    options = options || {};

    // ensure our defaults are represented in the options
    common.ensure(options, defaults);

    // create the inputGenerator, default to robots
    var inputGenerator = inputFactory.create(options.input);

    // clean the snapshot output directory
    if (options.outputDirClean)
      common.deleteFolderRecursive(options.outputDir);

    // start async completion notification if a listener was supplied
    var notifier = new async.Notifier();
    if (listener)
      notifier.start(options.outputDir, listener);

    // generate input for the snapshots
    var result = inputGenerator.run(options, (function(options, notifier){
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
            ], { cwd: process.cwd(), stdio: "inherit", detached: !notifier.isStarted() }
          );
        notifier.add(input.outputFile, input.timeout);
        cp.on("error", function() { notifier.remove(input.outputFile); console.error(e); });
      };
    })(options, notifier));

    return result;
  }
};
