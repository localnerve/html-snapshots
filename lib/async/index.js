/**
 * index.js
 *
 * Async stuff for html-snapshots
 *   Notifier class
 *
 * Copyright (c) 2013 - 2017, Alex Grant, LocalNerve, contributors
 * Licensed under the MIT license.
 */
/* global Promise */
"use strict";

var fs = require("fs");
var AsyncLock = require("async-lock");
var nodeCall = require("../common/node");

var F_OK = (fs.constants && fs.constants.F_OK) || fs.F_OK;
var lock = new AsyncLock();

/**
 * Force a serial execution context.
 *
 * @param {Function} fn - The function to guard.
 * @param {Number} timeout - The max time to wait for the lock.
 */
function criticalSection (fn, timeout) {
  return function protectedContext () {
    lock.acquire('cs-guard', function (done) {
      fn();
      done(null, 0);
    }, function () {
      /* do nothing */
    }, {
      timeout: timeout
    });
  };
}

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

  // the working pollInterval for this run
  // this.interval

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
      this.interval = parseInt(pollInterval, 10);

      // Poll the filesystem for the files to exist
      // Checks the child process expected output to determine success or failure
      // if the file exists, then it succeeded.
      this.watcher = setInterval(criticalSection(function () {
        var self = this;
        var eoi = typeof input.EOI === "function" && input.EOI();

        if (eoi) {
          Promise.all(Object.keys(self.files).map(function (file) {
            return nodeCall(fs.access, file, F_OK)
              .then(function () {
                return file;
              })
              .catch(function () {
                return null;
              });
          }))
            .then(function (files) {
              files.forEach(function (file) {
                file && self.remove(file, true);
              });

              // if done, exit
              if (self.isDone() && self.closeWatcher()) {
                self.callback(self.getError(), self.filesDone);
              }
            })
            .catch(function (e) {
              console.error(e);
            });
        }
      }.bind(this), this.interval), this.interval);

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
    var failTimeout = timeout;
    var timer;

    if (!this.isStarted()) {
      throw new Error('MUST call `start` before `add`');
    }

    if (!this.exists(outputFile)) {
      // make sure we evaluate after the child process
      failTimeout = parseInt(timeout, 10) + parseInt(this.padTimeout, 10);
      // Stagger and grow the failure timeout padding, add 1s every 10 processes
      this.padTimeout += 100;

      // setup a timeout handler to detect failure
      timer = setTimeout(criticalSection(function () {
        var self = this;

        // if the output file has not already been removed
        if (self.exists(outputFile)) {
          nodeCall(fs.access, outputFile, F_OK)
            .then(function () { return true; })
            .catch(function () { return false; })
            .then(function (fsExists) {
              if (!fsExists) {
                self.setError(new Error(
                  "'"+outputFile+"' did not get a snapshot before timeout"
                ));
              }
              self.remove(outputFile, fsExists);

              // if we're done right now, finish
              if (self.isDone() && self.closeWatcher()) {
                self.callback(self.getError(), self.filesDone);
              }
            });
        }
      }.bind(this), this.interval + 100), parseInt(failTimeout, 10));

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
      this.watcher = null;
      return true;
    }
    return false;
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
