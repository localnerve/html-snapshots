/**
 * index.js
 *
 * Async stuff for html-snapshots
 *   Notifier class
 *
 * Copyright (c) 2013, Alex Grant, LocalNerve, contributors
 * Licensed under the MIT license.
 */
var mkdirp = require("mkdirp");
var fs = require("fs");

module.exports = {
  Notifier: Notifier
};

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
  var callback = function(){};

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
   * boolean indicating that start has been called
   */
  this.isStarted = function() {
    return (watcher !== void 0);
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

          // if the output file has not already been removed
          if (self.exists(outputFile)) {
            self.remove(outputFile);
            error = !fs.existsSync(outputFile);

            // if we're done right now, finish
            if (self.fileCount() === 0) {
              callback(error ? false : undefined);
              if (self.isStarted()) {
                watcher.close();
              }
            }
          }
        };
      })(this), parseInt(timeout, 10));
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

  /**
   * Provide a way to audit the file count
   */
  this.fileCount = function() {
    return files.length;
  };

  /**
   * Return true if a file exists in the internal files array
   */
  this.exists = function(outputFile) {
    return (files.indexOf(outputFile) >= 0);
  };
}