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
var mkdirp = require("mkdirp");
var common = require("./common");
var inputFactory = require("./input-generators");
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

/**
 * Notifier
 * Watches the outputDir and when all the files exist,
 * calls the listener indicating the snapshots are done.
 */
function Notifier() {

  // our private files array
  var files = [];

  // true if a timeout occurred
  var error = false;

  // our reference to the listener
  var callback;

  // our reference to the watcher
  var watcher;

  /**
   * Watch the outputDir, when a file exists, remove it from our files array.
   * If the files array is empty, call the listener and stop watching.
   */
  this.start = function(outputDir, listener) {
    callback = listener;

    // make the directory if it doesn't exist
    if (!fs.existsSync(outputDir)) {
      mkdirp.sync(outputDir);
    }

    // watch for events
    // arguments can repeat and are unreliable, so manage ourselves
    // uses the child process expected output to determine success or failure
    // if the file exists, then it succeeded.
    watcher = fs.watch(outputDir, (function(self){
      return function(event, filename) {
        for (var i in files) {
          if (fs.existsSync(files[i])) {
            self.remove(files[i]);
            break;
          }
        }
        // if all the files exist, we're done
        if (files.length === 0) {
          callback(error ? false : undefined);
          watcher.close();
        }
      };
    })(this));
  };

  /**
   * add a file to the files array if it's not there
   * This *should* be atomic in node
   */
  this.add = function(outputFile, timeout) {
    var index = files.indexOf(outputFile);
    if (index < 0) {
      files.push(outputFile);

      // setup a timeout handler to detect failure
      setTimeout((function(self){
        return function(){
          // if the output file has not already been removed and it doesn't exist
          if (files.indexOf(outputFile) >= 0 && !fs.existsSync(outputFile)) {
            self.remove(outputFile);
            error = true;

            // if we're done right now, finish as error
            if (files.length === 0) {
              if (callback) callback(false);
              if (watcher) watcher.close();
            }
          }
        };
        // pad the timeout to give the other process a chance
      })(this), parseInt(timeout+500, 10));
    }
  };

  /**
   * remove a file from the files array if it's there
   * This *should* be atomic in node
   */
  this.remove = function(outputFile) {
    var index = files.indexOf(outputFile);
    if (index >= 0)
      files.splice(index, 1);
  };
}

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
      deleteFolderRecursive(options.outputDir);

    // start async completion notification if a listener was supplied
    var async = new Notifier();
    if (listener)
      async.start(options.outputDir, listener);

    // generate input for the snapshots
    var result = inputGenerator.run(options, (function(options, async){
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
        async.add(input.outputFile, input.timeout);
        cp.on("error", function() { async.remove(input.outputFile); console.error(e); });
      };
    })(options, async));

    return result;
  }
};
