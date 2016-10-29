/**
 * index.js
 *
 * Async stuff for html-snapshots
 *   Notifier class
 *
 * Copyright (c) 2013 - 2016, Alex Grant, LocalNerve, contributors
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
  this.files = {};

  // Contains files successfully processed
  this.filesDone = [];

  // true if a timeout occurred, or set by abort
  // initial value undefined is important
  // this.error;

  // the starting failure timeout padding
  this.padTimeoutFloor = 800;

  // the holder of the current failure timeout padding
  this.padTimeout = this.padTimeoutFloor;

  // our reference to the listener
  this.callback = function(){};

  // our reference to the watcher (an interval id)
  // initial value undefined is important
  // this.watcher;

  // flag set by qEmpty callback
  // when the last item from the queue is given to a worker
  this.qempty = false;
}

Notifier.prototype = {
  /**
   * Set the qempty flag to true.
   */
  qEmpty: function qEmpty () {
    this.qempty = true;
  },

  /**
   * Start a watch interval, when a file exists, remove it from our files array.
   * If the files array is empty, call the listener and stop the watch interval.
   *
   * @param {Number} pollInterval - The millisecond poll interval to check for
   * file completion.
   * @param {Function} listener - The callback to notify when complete.
   * @param {Object} input - The inputGenerator.
   * @param {Function} input.EOI - The inputGenerator function that signals end
   * of input.
   * @returns {Boolean} true if started successfully, false otherwise.
   */
  start: function start (pollInterval, listener, input) {
    var result = (
      pollInterval > 0 &&
      typeof listener === "function" &&
      (!!input)
      );

    if (result) {
      this.callback = listener;

      // Poll the filesystem for the files to exist
      // Checks the child process expected output to determine success or failure
      // if the file exists, then it succeeded.
      this.watcher = setInterval(function () {
        var i, filesComplete = [];

        if (typeof input.EOI === "function" && input.EOI()) {
          Object.keys(this.files).forEach(function(file) {
            if (fs.existsSync(file)) {
              filesComplete.push(file);
            }
          });

          for (i = 0; i < filesComplete.length; i++) {
            this.remove(filesComplete[i], true);
          }

          // if done, exit
          if (this.isDone()) {
            this.closeWatcher();
            this.callback(this.getError(), this.filesDone);
          }
        }
      }.bind(this), parseInt(pollInterval, 10));

    } else {
      console.error("Bad poll interval, async listener, or input generator supplied");
    }

    return result;
  },

  /**
   * Indicates if start has been called.
   *
   * @returns {Boolean} true if start has been called, false otherwise.
   */
  isStarted: function isStarted () {
    return (typeof this.watcher !== "undefined");
  },

  /**
   * Add a file to the files array if it's not there.
   *
   * @param {String} outputFile - The full path to the output file to add.
   * @param {Number} timeout - timeout milliseconds to wait (max).
   */
  add: function add (outputFile, timeout) {
    if (!this.exists(outputFile)) {

      var failTimeout = timeout;
      if (this.isStarted()) {
        // make sure we evaluate after the child process
        failTimeout = parseInt(timeout, 10) + parseInt(this.padTimeout, 10);
        // Stagger and grow the failure timeout padding, add 1s every 10 processes
        this.padTimeout += 100;
      }

      // setup a timeout handler to detect failure
      var timer = setTimeout(function () {
        var fsMode = (fs.constants && fs.constants.F_OK) || fs.F_OK;

        // if the output file has not already been removed
        if (this.exists(outputFile)) {
          fs.access(outputFile, fsMode, function (err) {
            var fsExists = !err;
            this.setError(!fsExists);
            this.remove(outputFile, fsExists);

            // if we're done right now, finish
            if (this.isDone()) {
              this.closeWatcher();
              this.callback(this.getError(), this.filesDone);
            }
          }.bind(this));
        }
      }.bind(this), parseInt(failTimeout, 10));

      // add the file tracking object
      this.files[outputFile] = {
        timer: timer
      };
    }
  },

  /**
   * Check if a file exists in the internal files array.
   *
   * @param {String} outputFile - The outputFile to check.
   * @returns {Boolean} true if the file exists, false otherwise.
   */
  exists: function exists (outputFile) {
    return (!!this.files[outputFile]);
  },

  /**
   * Remove a file from the files array if it's there.
   *
   * @param {String} outputFile - The outputFile to remove.
   * @param {Boolean} done - If true, add to filesDone collection.
   */
  remove: function remove (outputFile, done) {
    if (this.exists(outputFile)) {
      if (done) {
        this.filesDone.push(outputFile);
      }
      clearTimeout(this.files[outputFile].timer);
      delete this.files[outputFile];
    }
  },

  /**
   * Audit the file count.
   *
   * @returns {Number} the number of files being watched at the moment.
   */
  fileCount: function fileCount () {
    return Object.keys(this.files).length;
  },

  /**
   * Check if there is anything left to watch.
   *
   * @returns {Boolean} true if processing is done, false otherwise.
   */
  isDone: function isDone () {
    return this.fileCount() === 0 && this.qempty;
  },

  /**
   * Set the error property, if not already set.
   *
   * @param {Object} value - The error to set.
   */
  setError: function setError (value) {
    if (!this.error) {
      this.error = value;
    }
  },

  /**
   * Get the error property.
   *
   * @returns {Object} The error property.
   */
  getError: function getError () {
    return this.error;
  },

  /**
   * End file watching.
   */
  closeWatcher: function closeWatcher () {
    if (this.watcher) {
      clearInterval(this.watcher);
    }
  },

  /**
   * Get the padTimeoutFloor property.
   *
   * @returns {Number} The padTimeoutFloor property.
   */
  getPadTimeoutFloor: function getPadTimeoutFloor () {
    return this.padTimeoutFloor;
  },

  /**
   * Provides a way to abort what this is doing.
   * Causes conditions so that, if isStarted, the poll interval will exit,
   *   cleanup, and call the listener back.
   * If not started, the listener does not get called. This relationship
   *   is set in html-snapshots.js: listener == notifier.start
   *
   * @param {Object} q - The worker queue, expected created by async.queue.
   * @param {Number} q.length - The worker queue length.
   * @param {Object} [err] - The error object to set.
   */
  abort: function abort (q, err) {
    // for each file, clearTimeout and delete the object
    Object.keys(this.files).forEach(function(file) {
      clearTimeout(this.files[file].timer);
      delete this.files[file];
    }, this);

    // if nothing is waiting, make sure empty is set
    this.qempty = !q.length();

    // set the error
    this.setError(err);
  }
};

module.exports = {
  Notifier: Notifier
};
