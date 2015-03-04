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
var _ = require("lodash");

var common = require("./common");
var inputFactory = require("./input-generators");
var async = require("./async");
var phantomDir = "./phantom";
var snapshotScript = path.join(phantomDir, "default.js");
var phantomJS = "../node_modules/.bin/phantomjs" +
    (process.platform === "win32" ? ".cmd" : "");

/**
 * This module's defaults
 */
var defaults = {
  input: "robots",
  phantomjs: path.join(__dirname, phantomJS),
  snapshotScript: path.join(__dirname, snapshotScript),
  outputDirClean: false,
  pollInterval: 500,
  processLimit: 4
};

/**
 * The worker task that launches phantomjs
 */
function worker(input, options, notifier, qcb) {
  var cp,
      customModule,
      snapshotScript = options.snapshotScript,
      phantomjsOptions = Array.isArray(input.phantomjsOptions) ? input.phantomjsOptions : [input.phantomjsOptions];
  
  // map snapshotScript object script to a real path
  if (_.isObject(options.snapshotScript)) {
    snapshotScript = path.join(__dirname, phantomDir, options.snapshotScript.script) + ".js";
    customModule = options.snapshotScript.module;
  }

  cp = spawn(
    options.phantomjs,
    phantomjsOptions.concat(
    [
      snapshotScript,
      input.outputFile,
      input.url,
      input.selector,
      input.timeout,
      input.checkInterval,
      input.useJQuery,
      customModule
    ]), { cwd: process.cwd(), stdio: "inherit", detached: true }
  );

  cp.on("error", function(e) {
    notifier.remove(input.outputFile);
    notifier.setError(e);
    console.error(e);
    qcb(e);
  });

  cp.on("exit", function(code) {
    qcb(code);
  });

  // start counting
  notifier.add(input.outputFile, input.timeout);  
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