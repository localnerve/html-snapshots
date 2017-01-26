/*
 * html-snapshots.js
 *
 * Produce html snapshots using for a website for SEO purposes.
 * This is required for javascript SPAs or ajax page output.
 * By default, uses a selector to search content to determine if
 *   a page is "ready" for its html snapshot.
 *
 * Copyright (c) 2013 - 2017 Alex Grant, LocalNerve, contributors
 * Licensed under the MIT license.
 */
/* global Promise */
"use strict";

var spawn = require("child_process").spawn;
var path = require("path");
var EventEmitter = require("events").EventEmitter;
var rimraf = require("rimraf").sync;
var asyncLib = require("async");
var _ = require("lodash");

var common = require("./common");
var inputFactory = require("./input-generators");
var Notifier = require("./async").Notifier;
var phantomDir = "./phantom";
var snapshotScript = path.join(phantomDir, "default.js");

/**
 * Determine the default phantomJS module path. This is overridden by the
 * phatomjs option.
 *
 * This function, (technique and concerns) originated from karma-phantomjs-launcher:
 *
 * The MIT License
 * Copyright (C) 2011-2013 Google, Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies
 * of the Software, and to permit persons to whom the Software is furnished to do
 * so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 */
var defaultPhantomJSExePath = function () {
  // If the path we're given by phantomjs is to a .cmd, it is pointing to a global copy.
  // Using the cmd as the process to execute causes problems cleaning up the processes
  // so we walk from the cmd to the phantomjs.exe and use that instead.

  var phantomSource = require("phantomjs-prebuilt").path;

  if (path.extname(phantomSource).toLowerCase() === ".cmd") {
    return path.join(path.dirname( phantomSource ), "//node_modules//phantomjs-prebuilt//lib//phantom//bin//phantomjs.exe");
  }

  return phantomSource;
};

/**
 * This module's defaults
 */
var defaults = Object.freeze({
  input: "robots",
  phantomjs: defaultPhantomJSExePath(),
  snapshotScript: path.join(__dirname, snapshotScript),
  outputDirClean: false,
  pollInterval: 500,
  processLimit: 4
});

/**
 * The worker task that launches phantomjs.
 *
 * @param {Object} input - An input object from an input generator.
 * @param {Array} input.phantomjsOptions - Actual Phantomjs options.
 * @param {String} input.outputFile - The output file that the html is written to.
 * @param {String} input.url - The url to get the html from.
 * @param {String} input.selector - The selector to wait for.
 * @param {String} input.timeout - The phantomjs timeout.
 * @param {String} input.checkInterval - The interval to poll for results.
 * @param {Boolean} input.useJQuery - True if selector is jquery selector.
 * @param {Boolean} input.verbose - True if verbose output is desired.
 * @param {Object} options - Input options.
 * @param {Object} options.snapshotScript - Snapshot script options.
 * @param {String} options.snapshotScript.script - Snapshot script name.
 * @param {String} options.snapshotScript.module - Snapshot script module.
 * @param {String} options.phantomjs - Full path to the Phantomjs exe.
 * @param {Object} notifier - The async Notifier instance for this run.
 * @param {Function} notifier.remove - Remove an outputFile from notifier.
 * @param {Function} notifier.setError - Set an error on the notifier.
 * @param {Function} notifier.add - Add a file, timeout to the notifier.
 * @param {Function} notifier.known - Check if a file is or has been processed.
 * @param {Function} qcb - async.queue callback function.
 */
function worker (input, options, notifier, qcb) {
  var cp,
      customModule,
      snapshotScript = options.snapshotScript,
      phantomjsOptions = Array.isArray(input.phantomjsOptions) ? input.phantomjsOptions : [input.phantomjsOptions];

  // If the outputFile has NOT already been seen by the notifier, process.
  if (!notifier.known(input.outputFile)) {

    // map snapshotScript object script to a real path
    if (_.isObject(options.snapshotScript)) {
      snapshotScript = path.join(__dirname, phantomDir, options.snapshotScript.script) + ".js";
      customModule = options.snapshotScript.module;
    }

    cp = spawn(
      options.phantomjs,
      phantomjsOptions.concat([
        snapshotScript,
        input.outputFile,
        input.url,
        input.selector,
        input.timeout,
        input.checkInterval,
        input.useJQuery,
        input.verbose,
        customModule
      ]), { cwd: process.cwd(), stdio: "inherit", detached: true }
    );

    cp.on("error", function (e) {
      notifier.remove(input.outputFile);
      notifier.setError(e);
      console.error(e);
      qcb(e);
    });

    cp.on("exit", function (code) {
      qcb(code);
    });

    // start counting
    notifier.add(input.outputFile, input.timeout);
  }
  else {
    // The input.outputFile is being or has been processed this run.
    qcb(0);
  }
}

/**
 * Prepare html snapshots options.
 *
 * @param {Object} options - html snapshots options.
 * @param {Array|String} options.source - html snapshots data source.
 */
function prepOptions (options) {
  // ensure this module's defaults are represented in the options.
  common.ensure(options, defaults);

  // if array data source, ensure input type is "array".
  if (Array.isArray(options.source)) {
    options.input = "array";
  }
}

module.exports = {
  /**
   * Run all the snapshots using the requested inputGenerator
   *
   * @param {Object} options - ALL user supplied html snapshots options.
   * @param {String} options.outputDir - Directory to write the html files to.
   * @param {String} [options.input] - Input source type "robots", "sitemap", "array";
   * Defaults to "robots".
   * @param {Boolean} [options.outputDirClean] - True if output dir should be rm -rf;
   * Defaults to false.
   * @param {Number} [options.pollInterval] -
   * @param {Function} [listener] - User supplied optional callback.
   * @returns {Promise} Resolves on completion.
   */
  run: function (options, listener) {
    var inputGenerator, notifier, started, result, q, emitter, completion;

    options = options || {};
    prepOptions(options);

    // create the inputGenerator, default to robots
    inputGenerator = inputFactory.create(options.input);

    // clean the snapshot output directory
    if (options.outputDirClean) {
      rimraf(options.outputDir);
    }

    // start async completion notification.
    notifier = new Notifier();
    emitter = new EventEmitter();
    started = notifier.start(options.pollInterval, inputGenerator,
      function (err, completed) {
        emitter.emit("complete", err, completed);
      });

    if (started) {
      // create the completion Promise.
      completion = new Promise(function (resolve, reject) {
        function completionResolver (err, completed) {
          try {
            _.isFunction(listener) && listener(err, completed);
          } catch (e) {
            console.error("User supplied listener exception", e);
          }
          if (err) {
            err.notCompleted = notifier.filesNotDone;
            err.completed = completed;
            reject(err);
          } else {
            resolve(completed);
          }
        }
        emitter.addListener("complete", completionResolver);
      });

      // create a worker queue with a parallel process limit.
      q = asyncLib.queue(function (task, callback) {
        task(_.once(callback));
      }, options.processLimit);

      // have the queue call notifier.empty when last item
      //  from the queue is given to a worker.
      q.empty = notifier.qEmpty.bind(notifier);

      // expose abort callback to input generators via options.
      options._abort = function (err) {
        notifier.abort(q, err);
      };

      // generate input for the snapshots.
      result = inputGenerator.run(options, function (input) {
        // give the worker the input and place into the queue
        q.push(_.partial(worker, input, options, notifier));
      })
        // after input generation, resolve on browser completion.
        .then(function () {
          return completion;
        });
    } else {
      result = Promise.reject("failed to start async notifier");
    }

    return result;
  }
};
