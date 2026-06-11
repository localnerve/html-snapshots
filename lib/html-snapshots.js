/*
 * html-snapshots.js
 *
 * Produce html snapshots using for a website for SEO purposes.
 * This is required for javascript SPAs or ajax page output.
 * By default, uses a selector to search content to determine if
 *   a page is "ready" for its html snapshot.
 *
 * Copyright (c) 2013 - 2025 Alex Grant, LocalNerve, contributors
 * Licensed under the MIT license.
 */

const { spawn } = require("node:child_process");
const path = require("node:path");
const { EventEmitter } = require("node:events");
const fs = require("node:fs");
const asyncLib = require("async");
const common = require("./common");
const inputFactory = require("./input-generators");
const { Notifier } = require("./async");

const puppeteerDir = "./puppeteer";
const puppeteerSnapshotScript = path.join(puppeteerDir, "index.js");
const playwrightDir = "./playwright";
const playwrightSnapshotScript = path.join(playwrightDir, "index.js");

/**
 * This module's defaults
 */
const defaults = Object.freeze({
  input: "robots",
  browser: "puppeteer",
  puppeteer: path.join(__dirname, puppeteerSnapshotScript),
  playwright: path.join(__dirname, playwrightSnapshotScript),
  snapshotScript: path.join(__dirname, puppeteerSnapshotScript),
  outputDirClean: false,
  pollInterval: 500,
  processLimit: 4
});

/**
 * @param {Object} input - An input object from an input generator.
 * @param {String} input.outputFile - The output file that the html is written to.
 * @param {String} input.url - The url to get the html from.
 * @param {String} input.selector - The selector to wait for.
 * @param {String} input.timeout - The entire process timeout.
 * @param {Object} input.debug - The debug object.
 * @param {Object} input.puppeteerLaunchOptions - overriding puppeteer launch options.
 * @param {Object} options - Input options.
 * @param {Object} options.snapshotScript - Snapshot script options.
 * @param {String} options.snapshotScript.script - Snapshot script name.
 * @param {String} options.snapshotScript.module - Snapshot script module.
 * @param {String} options.puppeteer - Full path to the puppeteer exec.
 * @param {Object} notifier - The async Notifier instance for this run.
 * @param {Function} notifier.remove - Remove an outputFile from notifier.
 * @param {Function} notifier.setError - Set an error on the notifier.
 * @param {Function} notifier.add - Add a file, timeout to the notifier.
 * @param {Function} notifier.known - Check if a file is or has been processed.
 * @param {Function} qcb - async.queue callback function.
 */
function puppeteerWorker (input, options, notifier, qcb) {
  let filter = "false";
  let snapshotScript = options.snapshotScript;

  // If the outputFile has NOT already been seen by the notifier, process.
  if (!notifier.known(input.outputFile)) {

    // map snapshotScript object script
    if (common.isObject(options.snapshotScript)) {
      snapshotScript = options.puppeteer;
      if (options.snapshotScript.script === "removeScripts") {
        filter = "./removeScripts";
      } else {
        filter = options.snapshotScript.module;
      }
    }

    const cp = spawn(
      snapshotScript,
      [ input.outputFile,
        input.url,
        input.selector,
        input.timeout,
        filter,
        input.debug.flag,
        input.debug.slowMo,
        JSON.stringify(input.puppeteerLaunchOptions)
      ], { cwd: process.cwd(), stdio: "inherit", detached: true }
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
  } else {
    // The input.outputFile is being or has been processed this run.
    qcb(0);
  }
}

/**
 * @param {Object} input - An input object from an input generator.
 * @param {String} input.outputFile - The output file that the html is written to.
 * @param {String} input.url - The url to get the html from.
 * @param {String} input.selector - The selector to wait for.
 * @param {String} input.timeout - The entire process timeout.
 * @param {Object} input.debug - The debug object.
 * @param {Object} input.playwrightLaunchOptions - overriding playwright launch options.
 *   May include a `browserType` key ("chromium" | "firefox" | "webkit") to select
 *   the browser engine. Defaults to "chromium".
 * @param {Object} options - Input options.
 * @param {Object} options.snapshotScript - Snapshot script options.
 * @param {String} options.snapshotScript.script - Snapshot script name.
 * @param {String} options.snapshotScript.module - Snapshot script module.
 * @param {String} options.playwright - Full path to the playwright exec.
 * @param {Object} notifier - The async Notifier instance for this run.
 * @param {Function} notifier.remove - Remove an outputFile from notifier.
 * @param {Function} notifier.setError - Set an error on the notifier.
 * @param {Function} notifier.add - Add a file, timeout to the notifier.
 * @param {Function} notifier.known - Check if a file is or has been processed.
 * @param {Function} qcb - async.queue callback function.
 */
function playwrightWorker (input, options, notifier, qcb) {
  let filter = "false";
  let snapshotScript = options.snapshotScript;
  
  // If the outputFile has NOT already been seen by the notifier, process.
  if (!notifier.known(input.outputFile)) {

    // map snapshotScript object script
    if (common.isObject(options.snapshotScript)) {
      snapshotScript = options.playwright;
      if (options.snapshotScript.script === "removeScripts") {
        filter = "./removeScripts";
      } else {
        filter = options.snapshotScript.module;
      }
    }

    const cp = spawn(
      snapshotScript,
      [ input.outputFile,
        input.url,
        input.selector,
        input.timeout,
        filter,
        input.debug.flag,
        input.debug.slowMo,
        JSON.stringify(input.playwrightLaunchOptions)
      ], { cwd: process.cwd(), stdio: "inherit", detached: true }
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
  } else {
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

  // If playwright browser, make sure the default snapshotScript is correctly set.
  if (options.browser === "playwright") {
    if (!options.snapshotScript || options.snapshotScript === options.puppeteer) {
      options.snapshotScript = options.playwright;
    }
  }
}

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
function run (options, listener) {
  options = options || {};
  prepOptions(options);

  // clean the snapshot output directory
  if (options.outputDirClean) {
    fs.rmSync(options.outputDir, { recursive: true, force: true });
  }

  // create the inputGenerator, default to robots
  const inputGenerator = inputFactory.create(options.input);

  // start async completion notification.
  const notifier = new Notifier();
  const emitter = new EventEmitter();
  const started = notifier.start(
    options.pollInterval,
    inputGenerator,
    (err, completed) => emitter.emit("complete", err, completed)
  );

  if (started) {
    // create the completion Promise.
    const completion = new Promise((resolve, reject) => {
      function completionResolver (err, completed) {
        try {
          common.isFunction(listener) && listener(err, completed);
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
    const q = asyncLib.queue(
      (task, callback) => { task(common.once(callback)); },
      options.processLimit
    );

    // have the queue call notifier.empty when last item
    //  from the queue is given to a worker.
    q.empty(notifier.qEmpty.bind(notifier));

    // expose abort callback to input generators via options.
    options._abort = notifier.abort.bind(notifier, q);

    const worker =
      options.browser === "playwright" ? playwrightWorker : puppeteerWorker;

    // generate input for the snapshots.
    return inputGenerator.run(options, input => {
      q.push(worker.bind(worker, input, options, notifier));
    }).then(() => completion)
  }
  
  return Promise.reject("failed to start async notifier");
}

module.exports = {
  run
};
