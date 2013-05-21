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

  // our private files collection
  // contains a file and timer:
  //   "filename": {timer: timerid}
  var files = {};

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
        //console.log("event: "+event+", filename: "+filename);
        for (var file in files) {
          if (fs.existsSync(file)) {
            self.remove(file);
            break;
          }
        }
        // if all the files exist, we're done
        if (self.fileCount() === 0) {
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
    return (typeof watcher !== "undefined");
  };

  /**
   * add a file to the files array if it's not there
   */
  this.add = function(outputFile, timeout) {
    if (!this.exists(outputFile)) {

      // help make sure we evaluate after the child process
      var padTimeout = parseInt(timeout, 10) + parseInt(1000, 10);

      // setup a timeout handler to detect failure      
      var timer = setTimeout((function(self){
        return function(){

          // if the output file has not already been removed
          if (self.exists(outputFile)) {
            self.setError(!fs.existsSync(outputFile));
            self.remove(outputFile);

            // if we're done right now, finish
            if (self.fileCount() === 0) {
              callback(self.isError() ? false : undefined);
              if (self.isStarted()) {
                self.closeWatcher();
              }
            }
          }
        };
      })(this), parseInt(padTimeout, 10));

      // add the file tracking object
      files[outputFile] = { timer: timer };
    }
  };

  /**
   * remove a file from the files array if it's there
   */
  this.remove = function(outputFile) {
    if (this.exists(outputFile)) {
      clearTimeout(files[outputFile].timer);
      delete files[outputFile];
    }
  };

  /**
   * Provide a way to audit the file count
   */
  this.fileCount = function() {
    return Object.keys(files).length;
  };

  /**
   * Return true if a file exists in the internal files array
   */
  this.exists = function(outputFile) {
    return (!!files[outputFile]);
  };

  this.setError = function(value) {
    if (!error) {
      error = value;
    }
  };

  this.isError = function() {
    return error;
  };

  this.closeWatcher = function() {
    return watcher.close();
  };
}