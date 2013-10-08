/**
 * index.js
 *
 * Async stuff for html-snapshots
 *   Notifier class
 *
 * Copyright (c) 2013, Alex Grant, LocalNerve, contributors
 * Licensed under the MIT license.
 */
var fs = require("fs");

/**
 * Notifier
 * Polls the outputDir and when all the files exist,
 * calls the listener indicating the snapshots are done.
 */
function Notifier() {

  // our private files collection
  // contains a file and timer:
  //   "filename": {timer: timerid}
  var files = {};

  // true if a timeout occurred
  var error = false;

  // the starting failure timeout padding
  var padTimeoutFloor = 800;

  // the holder of the current failure timeout padding
  var padTimeout = padTimeoutFloor;

  // our reference to the listener
  var callback = function(){};

  // our reference to the watcher (an interval id)
  var watcher;

  /**
   * Start a watch interval, when a file exists, remove it from our files array.
   * If the files array is empty, call the listener and stop the watch interval.
   */
  this.start = function(pollInterval, listener, input) {
    var result = (
      pollInterval > 0 &&
      typeof listener === "function" &&
      (!!input)
      );

    if (result) {
      callback = listener;

      // Poll the filesystem for the files to exist
      // Checks the child process expected output to determine success or failure
      // if the file exists, then it succeeded.
      watcher = setInterval(function(self) {
        if (typeof input.EOI === "function" && input.EOI()) {
          for (var file in files) {
            if (fs.existsSync(file)) {
              self.remove(file);
            }
          }
          // if all the files exist, we're done        
          if (self.fileCount() === 0) {
            self.closeWatcher();
            callback(self.isError() ? false : undefined);
          }
        }
      }, parseInt(pollInterval, 10), this);

    } else {
      console.error("Bad poll interval, async listener, or input generator supplied");
    }

    return result;
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

      var failTimeout = timeout;
      if (this.isStarted()) {
        // make sure we evaluate after the child process
        failTimeout = parseInt(timeout, 10) + parseInt(padTimeout, 10);
        // Stagger and grow the failure timeout padding, add 1s every 10 processes
        padTimeout += 100;
      }

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
      }(this)), parseInt(failTimeout, 10));

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
    return clearInterval(watcher);
  };

  this.padTimeoutFloor = function() {
    return padTimeoutFloor;
  };
}

module.exports = {
  Notifier: Notifier
};