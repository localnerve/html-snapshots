/**
 * index.js
 *
 * Async stuff for html-snapshots
 *   Notifier class
 *
 * Copyright (c) 2013, 2014, Alex Grant, LocalNerve, contributors
 * Licensed under the MIT license.
 */
var fs = require("fs");

/**
 * Notifier
 * Polls the outputDir and when all the files exist,
 * calls the listener indicating the snapshots are done.
 */
function Notifier() {

  // The private files collection
  // Contains a file and timer: "filename": {timer: timerid}
  // Used for tracking work left to do. When empty, work is done.
  var files = {};

  // Contains files successfully processed
  var filesDone = [];

  // true if a timeout occurred, or set by abort
  var error; // initial value undefined is important

  // the starting failure timeout padding
  var padTimeoutFloor = 800;

  // the holder of the current failure timeout padding
  var padTimeout = padTimeoutFloor;

  // our reference to the listener
  var callback = function(){};

  // our reference to the watcher (an interval id)
  var watcher;

  // flag set by qEmpty callback
  //   when the last item from the queue is given to a worker
  var qempty = false;
  this.qEmpty = function () {
    qempty = true;
  };

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
              self.remove(file, true);
            }
          }
          // if done, exit
          if (self.isDone()) {
            self.closeWatcher();
            callback(self.getError(), filesDone);
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
          var fsExists;
          // if the output file has not already been removed
          if (self.exists(outputFile)) {
            fsExists = fs.existsSync(outputFile);
            self.setError(!fsExists);
            self.remove(outputFile, fsExists);

            // if we're done right now, finish
            if (self.isDone()) {
              callback(self.getError(), filesDone);
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
   * Return true if a file exists in the internal files array
   */
  this.exists = function(outputFile) {
    return (!!files[outputFile]);
  };

  /**
   * remove a file from the files array if it's there
   */
  this.remove = function(outputFile, done) {
    if (this.exists(outputFile)) {
      if (done) {
        filesDone.push(outputFile);
      }
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
   * If processing is done, return true
   */
   this.isDone = function() {
    return this.fileCount() === 0 && qempty;
   };

  this.setError = function(value) {
    if (!error) {
      error = value;
    }
  };

  this.getError = function() {
    return error;
  };

  this.closeWatcher = function() {
    return clearInterval(watcher);
  };

  this.padTimeoutFloor = function() {
    return padTimeoutFloor;
  };

  /**
   * Provide a way to abort what this is doing.
   * Receives an optional error, q is typically pre-bound.
   * Causes conditions so that, if isStarted, the poll interval will exit,
   *   cleanup, and call the listener back.
   * If not started, the listener does not get called. This relationship
   *   is set in html-snapshots.js: listener == notifier.start
   */
  this.abort = function(q, err) {
    // for each file, clearTimeout and delete the object
    Object.keys(files).forEach(function(file) {
      clearTimeout(files[file].timer);
      delete files[file];
    });

    // if nothing is waiting, make sure empty is set
    qempty = !q.length();

    // set the error
    this.setError(err);
  };
}

module.exports = {
  Notifier: Notifier
};