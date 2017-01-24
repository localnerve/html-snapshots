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

var crypto = require("crypto");
var AsyncLock = require("async-lock");
var combineErrors = require("combine-errors");
var pathExists = require("./exists");

var L_WAIT = 10000;
var TIMEOUT_PAD_FLOOR = 800;
function NOOP () {}

/**
 * Create the lock factory.
 */
function createLockFactory () {
  // Create the per instance async lock.
  var lock = new AsyncLock();

  // Make a random id
  var rid = crypto.randomBytes(16).toString("hex");

  /**
   * Force a serial execution context.
   *
   * @param {Function} fn - The function to guard.
   * @param {Number} timeout - The max time to wait for the lock.
   */
  return function lockFactory (fn, timeout) {
    return function protectedContext () {
      lock.acquire("cs-guard-" + rid, function (done) {
        fn(function () {
          done(null, 0);
        });
      }, NOOP, {
        timeout: timeout
      });
    };
  };
}

/**
 * Notifier Constructor
 * Polls the outputDir and when all the files exist,
 * calls the listener indicating the snapshots are done.
 */
function Notifier () {

  // Create the serial execution context mechanism.
  this.csFactory = createLockFactory();

  // The private files collection
  // Contains a file and timer: "filename": {timer: timerid}
  // Used for tracking work left to do. When empty, work is done.
  this.files = {};

  // Contains files successfully processed
  this.filesDone = [];

  // Contains files unsuccessfully processed
  this.filesNotDone = [];

  // true if a timeout occurred, or set by abort
  this.errors = [];

  // the holder of the current failure timeout padding
  this.padTimeout = TIMEOUT_PAD_FLOOR;

  // our reference to the listener
  this.callback = null;

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
   * @param {Object} input - The inputGenerator.
   * @param {Function} listener - The callback to notify when complete.
   * @param {Function} input.EOI - The inputGenerator function that signals end
   * of input.
   * @returns {Boolean} true if started successfully, false otherwise.
   */
  start: function start (pollInterval, input, listener) {
    var result = (
      pollInterval > 0 &&
      typeof listener === "function" &&
      (!!input)
      );

    if (result) {
      if (this.isStarted()) {
        throw new Error("Notifier already started");
      }

      this.callback = listener;
      this.interval = parseInt(pollInterval, 10);

      // Poll the filesystem for the files to exist
      // Checks the child process expected output to determine success or failure
      // if the file exists, then it succeeded.
      this.watcher = setInterval(this.csFactory(function (done) {
        var self = this;
        var eoi = typeof input.EOI === "function" && input.EOI();

        if (eoi) {
          Promise.all(Object.keys(self.files).map(function (file) {
            return pathExists(file, {
              returnFile: true
            });
          }))
            .then(function (files) {
              var callback = self.callback;

              try {
                files.forEach(function (file) {
                  file && self._remove(file, true);
                });

                if (self._isDone()) {
                  self._closeWatcher();
                  if (self.callback) {
                    self.callback = null;
                    setImmediate(function () {
                      callback(self.getError(), self.filesDone);
                    });
                  }
                }
              } catch (e) {
                console.error(e);
              }
              done();
            });
        } else {
          done();
        }
      }.bind(this), L_WAIT), this.interval);

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
      throw new Error("MUST call `start` before `add`");
    }

    if (!this._exists(outputFile)) {
      // make sure we evaluate after the child process
      failTimeout = parseInt(timeout, 10) + parseInt(this.padTimeout, 10);
      // Stagger and grow the failure timeout padding, add 1s every 10 processes
      this.padTimeout += 100;

      // setup a timeout handler to detect failure
      timer = setTimeout(this.csFactory(function (done) {
        var self = this;

        // if the output file has not already been removed
        if (self._exists(outputFile)) {
          pathExists(outputFile)
            .then(function (fsExists) {
              var callback = self.callback;

              try {
                if (!fsExists) {
                  self._setError(new Error(
                    "'" + outputFile + "' did not get a snapshot before timeout"
                  ));
                }
                self._remove(outputFile, fsExists);

                if (self._isDone()) {
                  self._closeWatcher();
                  if (self.callback) {
                    self.callback = null;
                    setImmediate(function () {
                      callback(self.getError(), self.filesDone);
                    });
                  }
                }
              } catch (e) {
                console.error(e);
              }
              done();
            });
        } else {
          done();
        }
      }.bind(this), L_WAIT), parseInt(failTimeout, 10));

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
  _exists: function _exists (outputFile) {
    return (!!this.files[outputFile]);
  },

  /**
   * Check if a file is being processed or has already been processed.
   *
   * @param {String} outputFile - The outputFile to check.
   * @returns {Boolean} true if the fi
   */
  known: function known (outputFile) {
    var result = false;
    this.csFactory(function (done) {
      result =
        this._exists(outputFile) || this.filesDone.indexOf(outputFile) > -1;
      done();
    }.bind(this), L_WAIT)();
    return result;
  },

  /**
   * Remove a file from the files array if it's there.
   * Unprotected version.
   *
   * @param {String} outputFile - The outputFile to remove.
   * @param {Boolean} done - If true, add to filesDone collection.
   */
  _remove: function _remove (outputFile, done) {
    if (this._exists(outputFile)) {
      if (done) {
        this.filesDone.push(outputFile);
      } else {
        this.filesNotDone.push(outputFile);
      }
      clearTimeout(this.files[outputFile].timer);
      delete this.files[outputFile];
    }
  },

  /**
   * Remove a file from the files array if it's there.
   * Protected version.
   *
   * @param {String} outputFile - The outputFile to remove.
   * @param {Boolean} done - If true, add to filesDone collection.
   */
  remove: function remove (outputFile, done) {
    this.csFactory(function (_done) {
      this._remove(outputFile, done);
      _done();
    }.bind(this), L_WAIT)();
  },

  /**
   * Audit the file count.
   *
   * @returns {Number} the number of files being watched at the moment.
   */
  _fileCount: function _fileCount () {
    return Object.keys(this.files).length;
  },

  /**
   * Check if there is anything left to watch.
   *
   * @returns {Boolean} true if processing is done, false otherwise.
   */
  _isDone: function _isDone () {
    return this._fileCount() === 0 && this.qempty;
  },

  /**
   * Set the error, saves to a collection of errors.
   * Unprotected version.
   *
   * @param {Object} value - The error to set.
   */
  _setError: function _setError (value) {
    this.errors.push(value);
  },

  /**
   * Set the error property, if not already set.
   * Protected version.
   *
   * @param {Object} value - The error to set.
   */
  setError: function setError (value) {
    this.csFactory(function (done) {
      this._setError(value);
      done();
    }.bind(this), L_WAIT)();
  },

  /**
   * Get the error property.
   *
   * @returns {Object} The error property.
   */
  getError: function getError () {
    return this.errors.length > 0 ? combineErrors(this.errors) : undefined;
  },

  /**
   * End file watching.
   */
  _closeWatcher: function _closeWatcher () {
    if (this.watcher) {
      clearInterval(this.watcher);
      this.watcher = null;
    }
  },

  /**
   * Provides a way to abort what this is doing.
   * Causes conditions so that, if isStarted, the poll interval will exit,
   *   cleanup, and call the listener back.
   * If not started, the listener does not get called. This relationship
   *   is set in html-snapshots.js: listener == notifier.start
   *
   * @param {Object} q - The worker queue, expected created by async.queue.
   * @param {Function} q.length - Gets the worker queue length.
   * @param {Object} [err] - The error object to set.
   */
  abort: function abort (q, err) {
    this.csFactory(function (done) {
      try {
        // for each file, clearTimeout and delete the object
        Object.keys(this.files).forEach(function(file) {
          clearTimeout(this.files[file].timer);
          delete this.files[file];
        }, this);

        // if nothing is waiting, make sure empty is set
        this.qempty = !q.length();

        // set the error
        this._setError(err);
      } catch (e) {
        console.error(e);
      }
      done();
    }.bind(this), L_WAIT)();
  }
};

module.exports = {
  Notifier: Notifier,
  TIMEOUT_PAD_FLOOR: TIMEOUT_PAD_FLOOR
};
