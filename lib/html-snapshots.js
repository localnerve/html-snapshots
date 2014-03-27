/*
 * html-snapshots.js
 *
 * Produce html snapshots using for a website for SEO purposes.
 * This is required for javascript SPAs or ajax page output.
 * By default, uses a selector to search content to determine if 
 *   a page is "ready" for its html snapshot.
 *
 * Copyright (c) 2013, 2014, Alex Grant, LocalNerve, contributors
 * Licensed under the MIT license.
 */
var spawn = require("child_process").spawn;
var path = require("path");
var rimraf = require("rimraf").sync;
var asyncLib = require("async");
var _ = require("underscore");

var common = require("./common");
var inputFactory = require("./input-generators");
var async = require("./async");
var snapshotScript = "./phantom/snapshotSingle.js";
var phantomJS = "../node_modules/phantomjs/bin/phantomjs";

/**
 * This module's defaults
 */
var defaults = {
  input: "robots",
  phantomjs: path.join(__dirname, phantomJS),
  snapshotScript: path.join(__dirname, snapshotScript),
  outputDirClean: false,
  pollInterval: 500,
  processLimit: Number.MAX_VALUE
};

/**
 * The worker task that launches phantomjs
 */
function worker(input, options, notifier, qcb) {
  var cp = spawn(
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

  notifier.add(input.outputFile, input.timeout);

  cp.on("error", function(e) {
    notifier.remove(input.outputFile);
    console.error(e);
    qcb(e);
  });

  cp.on("exit", function(code) {
    qcb(code);
  });
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
    if (options.outputDirClean) {
      rimraf(options.outputDir);
    }

    // start async completion notification if a listener was supplied
    var result = true, notifier = new async.Notifier();
    if (listener) {
      result = notifier.start(options.pollInterval, listener, inputGenerator);
    }

    if (result) {
      // create a worker queue with a parallel process limit
      var q = asyncLib.queue(function(task, callback) {
        task(_.once(callback));
      }, options.processLimit);

      // have the queue call notifier.empty when last item 
      //  from the queue is given to a worker.
      q.empty = notifier.qEmpty;

      // expose abort callback to input generators via options
      options._abort = function(err) {
        notifier.abort(q, err);
      };
      
      // generate input for the snapshots
      result = inputGenerator.run(options, function(input) {
        // give the worker the input and place into the queue
        q.push(_.partial(worker, input, options, notifier));
      });
    }

    return result;
  }
};